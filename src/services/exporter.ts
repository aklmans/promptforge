// Multi-format export for enhancement results

import { writeFile } from "node:fs/promises";
import type { HistoryEntry } from "../types";

export type ExportFormat = "md" | "txt" | "json" | "yaml";
export const EXPORT_FORMATS: ExportFormat[] = ["md", "txt", "json", "yaml"];

export function isExportFormat(value: string): value is ExportFormat {
	return EXPORT_FORMATS.includes(value as ExportFormat);
}

// Export a history entry in the specified format
export async function exportEntry(
	entry: HistoryEntry,
	format: ExportFormat,
	outputPath: string,
): Promise<void> {
	await writeFile(outputPath, renderEntry(entry, format), "utf-8");
}

export function renderEntry(entry: HistoryEntry, format: ExportFormat): string {
	switch (format) {
		case "md":
			return exportAsMarkdown(entry);
		case "txt":
			return exportAsText(entry);
		case "json":
			return exportAsJSON(entry);
		case "yaml":
			return exportAsYAML(entry);
	}
}

// Export as Markdown
function exportAsMarkdown(entry: HistoryEntry): string {
	const { original, enhanced, result, timestamp, version, provider, model } = entry;

	let md = `# PromptForge Enhancement (v${version})\n\n`;
	md += `**Generated**: ${new Date(timestamp).toLocaleString()}  \n`;
	md += `**Provider**: ${provider} (${model})  \n\n`;

	md += `## Original Prompt\n\n${original}\n\n`;
	md += `## Enhanced Prompt\n\n${enhanced}\n\n`;

	md += "## Changes\n\n";
	for (const change of result.changes) {
		md += `- ${change}\n`;
	}

	md += "\n## Quality Scores\n\n";
	md += "| Metric | Score |\n";
	md += "|--------|-------|\n";
	md += `| Overall | ${result.score.overall}/100 |\n`;
	md += `| Clarity | ${result.score.clarity}/100 |\n`;
	md += `| Completeness | ${result.score.completeness}/100 |\n`;
	md += `| Actionability | ${result.score.actionability}/100 |\n`;
	md += `| Agent Readiness | ${result.score.agentReadiness}/100 |\n`;
	md += `| Token Efficiency | ${result.score.tokenEfficiency}/100 |\n`;

	md += "\n## Metadata\n\n";
	md += `- Original tokens: ${result.metadata.originalTokens}\n`;
	md += `- Enhanced tokens: ${result.metadata.enhancedTokens}\n`;
	md += `- Compression note: ${result.metadata.compressionNote}\n`;

	return md;
}

// Export as plain text
function exportAsText(entry: HistoryEntry): string {
	const { original, enhanced, timestamp, version, provider, model } = entry;

	let txt = `PromptForge Enhancement (v${version})\n`;
	txt += `Generated: ${new Date(timestamp).toLocaleString()}\n`;
	txt += `Provider: ${provider} (${model})\n\n`;

	txt += `ORIGINAL PROMPT\n${"=".repeat(50)}\n${original}\n\n`;
	txt += `ENHANCED PROMPT\n${"=".repeat(50)}\n${enhanced}\n`;

	return txt;
}

// Export as JSON
function exportAsJSON(entry: HistoryEntry): string {
	return JSON.stringify(entry, null, 2);
}

// Export as YAML (manual serialization)
function exportAsYAML(entry: HistoryEntry): string {
	const { original, enhanced, result, timestamp, version, provider, model } = entry;

	let yaml = `version: ${version}\n`;
	yaml += `timestamp: '${timestamp}'\n`;
	yaml += `provider: ${provider}\n`;
	yaml += `model: ${model}\n`;
	yaml += `original: |\n${indent(original)}\n`;
	yaml += `enhanced: |\n${indent(enhanced)}\n`;
	yaml += "changes:\n";
	for (const change of result.changes) {
		yaml += `  - ${change}\n`;
	}
	yaml += "score:\n";
	yaml += `  overall: ${result.score.overall}\n`;
	yaml += `  clarity: ${result.score.clarity}\n`;
	yaml += `  completeness: ${result.score.completeness}\n`;
	yaml += `  actionability: ${result.score.actionability}\n`;
	yaml += `  agentReadiness: ${result.score.agentReadiness}\n`;
	yaml += `  tokenEfficiency: ${result.score.tokenEfficiency}\n`;
	yaml += "metadata:\n";
	yaml += `  originalTokens: ${result.metadata.originalTokens}\n`;
	yaml += `  enhancedTokens: ${result.metadata.enhancedTokens}\n`;
	yaml += `  compressionNote: ${result.metadata.compressionNote}\n`;

	return yaml;
}

// Helper to indent text for YAML
function indent(text: string, spaces = 2): string {
	return text
		.split("\n")
		.map((line) => " ".repeat(spaces) + line)
		.join("\n");
}
