import { describe, expect, it } from "vitest";
import {
	CliUsageError,
	createCliHistoryEntry,
	formatCliOutput,
	parseArgs,
} from "../../src/cli-support";

const sampleResult = {
	enhanced: "Enhanced prompt body",
	changes: ["clarified task", "added output format"],
	score: {
		overall: 88,
		clarity: 90,
		completeness: 84,
		actionability: 89,
		agentReadiness: 87,
		tokenEfficiency: 80,
	},
	metadata: {
		originalTokens: 6,
		enhancedTokens: 24,
		compressionNote: "Expanded for structure.",
	},
} as const;

describe("parseArgs", () => {
	it("parses --format and core CLI flags", () => {
		const args = parseArgs([
			"--provider",
			"openai",
			"--level",
			"deep",
			"--format",
			"json",
			"--quiet",
			"write tests",
		]);

		expect(args.provider).toBe("openai");
		expect(args.level).toBe("deep");
		expect(args.format).toBe("json");
		expect(args.quiet).toBe(true);
		expect(args.prompt).toBe("write tests");
	});

	it("rejects invalid formats", () => {
		expect(() => parseArgs(["--format", "xml"])).toThrow(CliUsageError);
	});
});

describe("formatCliOutput", () => {
	it("returns enhanced text by default", () => {
		const entry = createCliHistoryEntry({
			original: "raw prompt",
			result: sampleResult,
			provider: "openai",
			model: "gpt-4o",
		});

		expect(formatCliOutput(entry)).toBe("Enhanced prompt body");
	});

	it("renders structured json output when requested", () => {
		const entry = createCliHistoryEntry({
			original: "raw prompt",
			result: sampleResult,
			provider: "openai",
			model: "gpt-4o",
		});
		const output = formatCliOutput(entry, "json");
		const parsed = JSON.parse(output);

		expect(parsed.original).toBe("raw prompt");
		expect(parsed.enhanced).toBe("Enhanced prompt body");
		expect(parsed.result.score.overall).toBe(88);
		expect(parsed.provider).toBe("openai");
	});

	it("renders markdown reports when requested", () => {
		const entry = createCliHistoryEntry({
			original: "raw prompt",
			result: sampleResult,
			provider: "openai",
			model: "gpt-4o",
		});
		const output = formatCliOutput(entry, "md");

		expect(output).toContain("# PromptForge Enhancement");
		expect(output).toContain("## Original Prompt");
		expect(output).toContain("Enhanced prompt body");
	});
});
