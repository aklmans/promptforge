// Core optimization hook managing enhancement state and streaming

import { useCallback, useState } from "react";
import { enhancePrompt } from "../services/llm";
import type { AppStatus, EnhanceOptions, EnhanceResult } from "../types";

export interface UseOptimizerReturn {
	status: AppStatus;
	result: EnhanceResult | null;
	streamingText: string;
	errorMessage: string | null;
	enhance: (prompt: string, options: EnhanceOptions) => Promise<EnhanceResult | null>;
	iterate: (
		feedback: string,
		options: EnhanceOptions,
		originalPrompt?: string,
	) => Promise<EnhanceResult | null>;
	reset: () => void;
}

export function useOptimizer(): UseOptimizerReturn {
	const [status, setStatus] = useState<AppStatus>("idle");
	const [result, setResult] = useState<EnhanceResult | null>(null);
	const [streamingText, setStreamingText] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const enhance = useCallback(async (prompt: string, options: EnhanceOptions) => {
		setStatus("thinking");
		setStreamingText("");
		setErrorMessage(null);
		setResult(null);

		try {
			let fullContent = "";
			let finalResult: EnhanceResult | null = null;

			// Consume the streaming generator
			for await (const chunk of enhancePrompt(prompt, options)) {
				if (chunk.type === "content") {
					setStatus("streaming");
					fullContent += chunk.content || "";
					setStreamingText(fullContent);
				} else if (chunk.type === "done" && chunk.result) {
					finalResult = chunk.result;
					setResult(chunk.result);
					setStatus("done");
				} else if (chunk.type === "error") {
					setErrorMessage(chunk.error || "Unknown error");
					setStatus("error");
					return null;
				}
			}

			return finalResult;
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Unknown error";
			setErrorMessage(msg);
			setStatus("error");
			return null;
		}
	}, []);

	const iterate = useCallback(
		async (feedback: string, options: EnhanceOptions, originalPrompt?: string) => {
			if (!result) return null;

			const { getIterativePrompt } = await import("../prompts/system");
			const iterPrompt = getIterativePrompt(
				originalPrompt || "original",
				result.enhanced,
				feedback,
				2,
			);

			return enhance(iterPrompt, options);
		},
		[result, enhance],
	);

	const reset = useCallback(() => {
		setStatus("idle");
		setResult(null);
		setStreamingText("");
		setErrorMessage(null);
	}, []);

	return {
		status,
		result,
		streamingText,
		errorMessage,
		enhance,
		iterate,
		reset,
	};
}
