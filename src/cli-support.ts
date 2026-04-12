import { randomUUID } from "node:crypto";
import { type ExportFormat, isExportFormat, renderEntry } from "./services/exporter";
import type { EnhanceResult, HistoryEntry } from "./types";

export interface CliArgs {
	interactive: boolean;
	prompt?: string;
	file?: string;
	provider?: string;
	level: "light" | "standard" | "deep";
	format?: ExportFormat;
	output?: string;
	quiet: boolean;
	copy: boolean;
	help: boolean;
	version: boolean;
}

export class CliUsageError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CliUsageError";
	}
}

function requireOptionValue(args: string[], index: number, flag: string): string {
	const value = args[index + 1];
	if (!value || value.startsWith("-")) {
		throw new CliUsageError(`Missing value for ${flag}`);
	}

	return value;
}

export function parseArgs(argv: string[]): CliArgs {
	const result: CliArgs = {
		interactive: false,
		level: "standard",
		quiet: false,
		copy: false,
		help: false,
		version: false,
	};

	let index = 0;
	while (index < argv.length) {
		const arg = argv[index];

		if (arg === "-i" || arg === "--interactive") {
			result.interactive = true;
		} else if (arg === "--file") {
			result.file = requireOptionValue(argv, index, arg);
			index++;
		} else if (arg === "--provider") {
			result.provider = requireOptionValue(argv, index, arg);
			index++;
		} else if (arg === "--level") {
			const level = requireOptionValue(argv, index, arg);
			if (level === "light" || level === "standard" || level === "deep") {
				result.level = level;
			} else {
				throw new CliUsageError(`Invalid --level "${level}". Expected light, standard, or deep.`);
			}
			index++;
		} else if (arg === "--format") {
			const format = requireOptionValue(argv, index, arg);
			if (!isExportFormat(format)) {
				throw new CliUsageError(`Invalid --format "${format}". Expected md, txt, json, or yaml.`);
			}
			result.format = format;
			index++;
		} else if (arg === "--output") {
			result.output = requireOptionValue(argv, index, arg);
			index++;
		} else if (arg === "--quiet") {
			result.quiet = true;
		} else if (arg === "--copy") {
			result.copy = true;
		} else if (arg === "--help") {
			result.help = true;
		} else if (arg === "--version") {
			result.version = true;
		} else if (!arg.startsWith("-")) {
			result.prompt = result.prompt ? `${result.prompt} ${arg}` : arg;
		} else {
			throw new CliUsageError(`Unknown option "${arg}"`);
		}

		index++;
	}

	return result;
}

export function createCliHistoryEntry(params: {
	original: string;
	result: EnhanceResult;
	provider: string;
	model: string;
}): HistoryEntry {
	return {
		id: randomUUID(),
		timestamp: new Date().toISOString(),
		original: params.original,
		enhanced: params.result.enhanced,
		result: params.result,
		provider: params.provider,
		model: params.model,
		version: 1,
		pinned: false,
		tags: [],
	};
}

export function formatCliOutput(entry: HistoryEntry, format?: ExportFormat): string {
	return format ? renderEntry(entry, format) : entry.enhanced;
}
