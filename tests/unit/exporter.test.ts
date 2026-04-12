import { describe, expect, it } from "vitest";
import {
	EXPORT_FORMAT_DESCRIPTIONS,
	EXPORT_FORMAT_LABELS,
	buildExportOutputPath,
	getExportFileExtension,
	renderEntry,
} from "../../src/services/exporter";
import type { HistoryEntry } from "../../src/types";

const sampleEntry: HistoryEntry = {
	id: "entry-1",
	timestamp: "2026-04-12T10:00:00.000Z",
	original: "raw prompt",
	enhanced: "enhanced prompt",
	provider: "openai",
	model: "gpt-4o",
	version: 2,
	pinned: false,
	tags: [],
	result: {
		enhanced: "enhanced prompt",
		changes: ["clarified task"],
		score: {
			overall: 90,
			clarity: 92,
			completeness: 88,
			actionability: 91,
			agentReadiness: 89,
			tokenEfficiency: 84,
		},
		metadata: {
			originalTokens: 3,
			enhancedTokens: 12,
			compressionNote: "Expanded for clarity.",
		},
	},
};

describe("export helpers", () => {
	it("exposes labels and descriptions for all formats", () => {
		expect(EXPORT_FORMAT_LABELS.md).toBe("Markdown");
		expect(EXPORT_FORMAT_DESCRIPTIONS.json).toContain("structured");
	});

	it("builds output paths with matching extensions", () => {
		const outputPath = buildExportOutputPath(sampleEntry, "yaml", "/tmp", 12345);

		expect(getExportFileExtension("yaml")).toBe("yaml");
		expect(outputPath).toBe("/tmp/promptforge-openai-12345.yaml");
	});

	it("renders plain text and json exports", () => {
		expect(renderEntry(sampleEntry, "txt")).toContain("PromptForge Enhancement");
		expect(JSON.parse(renderEntry(sampleEntry, "json")).provider).toBe("openai");
	});
});
