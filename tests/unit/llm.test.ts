import { describe, expect, it } from "vitest";
import {
	estimateTokenCount,
	formatLlmError,
	parseEnhanceResult,
	shouldOmitTemperature,
	shouldRetryRequest,
} from "../../src/services/llm";

describe("parseEnhanceResult", () => {
	it("parses fenced JSON and normalizes scores", () => {
		const result = parseEnhanceResult(
			[
				"```json",
				JSON.stringify({
					enhanced: "Use a clear TypeScript decorator pattern prompt.",
					changes: ["clarified language", 42, "added output format"],
					score: {
						overall: 120,
						clarity: 88,
						completeness: Number.NaN,
						actionability: 91,
						agentReadiness: 77,
						tokenEfficiency: -10,
					},
					metadata: {
						originalTokens: 3,
						enhancedTokens: 11,
						compressionNote: "Expanded for clarity.",
						converged: true,
					},
				}),
				"```",
			].join("\n"),
			"decorator example",
		);

		expect(result.enhanced).toBe("Use a clear TypeScript decorator pattern prompt.");
		expect(result.changes).toEqual(["clarified language", "added output format"]);
		expect(result.score.overall).toBe(100);
		expect(result.score.completeness).toBe(0);
		expect(result.score.tokenEfficiency).toBe(0);
		expect(result.metadata.converged).toBe(true);
	});

	it("falls back when the model returns plain text", () => {
		const result = parseEnhanceResult("Plain enhanced prompt", "raw prompt");

		expect(result.enhanced).toBe("Plain enhanced prompt");
		expect(result.changes[0]).toContain("plain text");
		expect(result.metadata.originalTokens).toBeGreaterThan(0);
	});
});

describe("LLM helpers", () => {
	it("estimates at least one token", () => {
		expect(estimateTokenCount("")).toBe(1);
		expect(estimateTokenCount("12345")).toBe(2);
	});

	it("omits temperature for GPT-5 model families", () => {
		expect(shouldOmitTemperature("gpt-5.4")).toBe(true);
		expect(shouldOmitTemperature("GPT-5.3-CODEX")).toBe(true);
		expect(shouldOmitTemperature("gpt-4o")).toBe(false);
	});

	it("formats and retries generic errors safely", () => {
		expect(formatLlmError(new Error("network down"))).toBe("network down");
		expect(shouldRetryRequest(new Error("network down"))).toBe(true);
	});
});
