// LLM service with streaming support, retry logic, and result parsing

import OpenAI from "openai";
import type { EnhanceOptions, EnhanceResult, StreamChunk } from "../types";

const DEFAULT_TIMEOUT = 30000; // 30s
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

export function estimateTokenCount(text: string): number {
	return Math.max(1, Math.ceil(text.trim().length / 4));
}

function toScore(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.min(100, value));
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function buildFallbackEnhanceResult(text: string, original: string): EnhanceResult {
	const enhanced = text.trim();

	return {
		enhanced,
		changes: ["Model returned plain text instead of structured json; used compatibility fallback."],
		score: {
			overall: 0,
			clarity: 0,
			completeness: 0,
			actionability: 0,
			agentReadiness: 0,
			tokenEfficiency: 0,
		},
		metadata: {
			originalTokens: estimateTokenCount(original),
			enhancedTokens: estimateTokenCount(enhanced),
			compressionNote: "Estimated from plain-text fallback output.",
		},
	};
}

function normalizeEnhanceResult(
	parsed: Record<string, unknown>,
	rawText: string,
	original: string,
): EnhanceResult {
	const enhanced =
		typeof parsed.enhanced === "string" && parsed.enhanced.trim()
			? parsed.enhanced.trim()
			: rawText.trim();
	const score = asRecord(parsed.score);
	const metadata = asRecord(parsed.metadata);

	return {
		enhanced,
		changes: Array.isArray(parsed.changes)
			? parsed.changes.filter((change): change is string => typeof change === "string")
			: [],
		score: {
			overall: toScore(score?.overall),
			clarity: toScore(score?.clarity),
			completeness: toScore(score?.completeness),
			actionability: toScore(score?.actionability),
			agentReadiness: toScore(score?.agentReadiness),
			tokenEfficiency: toScore(score?.tokenEfficiency),
		},
		metadata: {
			originalTokens:
				typeof metadata?.originalTokens === "number"
					? metadata.originalTokens
					: estimateTokenCount(original),
			enhancedTokens:
				typeof metadata?.enhancedTokens === "number"
					? metadata.enhancedTokens
					: estimateTokenCount(enhanced),
			compressionNote:
				typeof metadata?.compressionNote === "string"
					? metadata.compressionNote
					: "Completed with partial structured output.",
			converged: typeof metadata?.converged === "boolean" ? metadata.converged : undefined,
		},
	};
}

// Validate and parse LLM JSON response
export function parseEnhanceResult(text: string, original: string): EnhanceResult {
	try {
		// Try to extract JSON from response (handles markdown code blocks, etc)
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return buildFallbackEnhanceResult(text, original);
		}

		const parsed = JSON.parse(jsonMatch[0]);

		return normalizeEnhanceResult(parsed, text, original);
	} catch (error) {
		return buildFallbackEnhanceResult(text, original);
	}
}

export function shouldOmitTemperature(model: string): boolean {
	return model.toLowerCase().includes("gpt-5");
}

export function formatLlmError(error: unknown): string {
	if (error instanceof OpenAI.APIError) {
		const status = error.status ? `${error.status} ` : "";
		return `${status}${error.message}`.trim();
	}

	return error instanceof Error ? error.message : String(error);
}

export function shouldRetryRequest(error: unknown): boolean {
	if (error instanceof OpenAI.APIError) {
		const status = error.status;
		if (status && status >= 400 && status < 500 && ![408, 409, 429].includes(status)) {
			return false;
		}
	}

	return true;
}

// Core streaming enhancement function
export async function* enhancePrompt(
	original: string,
	options: EnhanceOptions,
): AsyncGenerator<StreamChunk> {
	const { baseURL = "https://api.openai.com/v1", model, apiKey = "", level = "standard" } = options;

	if (!model) {
		yield {
			type: "error",
			error: "Model not specified",
		};
		return;
	}

	if (!apiKey) {
		yield {
			type: "error",
			error: "API key not configured. Run promptforge -i to set up.",
		};
		return;
	}

	const client = new OpenAI({
		baseURL,
		apiKey,
	});

	// Import system prompt
	const { getEnhancementPrompt, buildMessages } = await import("../prompts/system");

	const systemPrompt = getEnhancementPrompt(level);
	const messages = buildMessages(original, systemPrompt);

	let retryCount = 0;
	let lastError: Error | null = null;

	while (retryCount <= MAX_RETRIES) {
		try {
			const request: {
				model: string;
				messages: typeof messages;
				stream: true;
				temperature?: number;
			} = {
				model,
				messages,
				stream: true,
			};

			if (!shouldOmitTemperature(model)) {
				request.temperature = 0.7;
			}

			const stream = await client.chat.completions.create(request, {
				timeout: DEFAULT_TIMEOUT,
			});

			let fullContent = "";

			for await (const event of stream) {
				const delta = event.choices?.[0]?.delta;
				if (delta?.content) {
					fullContent += delta.content;
					yield {
						type: "content",
						content: delta.content,
					};
				}
			}

			// Parse final result
			if (!fullContent.trim()) {
				throw new Error("Model returned an empty response");
			}

			const result = parseEnhanceResult(fullContent, original);
			yield {
				type: "done",
				result,
			};

			return; // Success, exit retry loop
		} catch (error) {
			lastError = new Error(formatLlmError(error));

			if (!shouldRetryRequest(error)) {
				yield {
					type: "error",
					error: lastError.message,
				};
				return;
			}

			retryCount++;

			if (retryCount <= MAX_RETRIES) {
				const delay = RETRY_DELAYS[retryCount - 1];
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	// All retries exhausted
	if (lastError) {
		yield {
			type: "error",
			error: `After ${MAX_RETRIES} retries: ${lastError.message}`,
		};
	}
}
