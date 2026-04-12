// CLI entry point with argument parsing and mode routing

import { readFile } from "node:fs/promises";
import { stderr, stdin, stdout } from "node:process";
import { render } from "ink";
import React from "react";
import App from "./app";
import {
	type CliArgs,
	CliUsageError,
	createCliHistoryEntry,
	formatCliOutput,
	parseArgs,
} from "./cli-support";
import { loadConfig, resolveProviderModel } from "./config";
import { enhancePrompt } from "./services/llm";
import type { EnhanceResult } from "./types";

const VERSION = "0.1.0";

function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function printHelp(): void {
	const help = `promptforge v${VERSION}
AI-powered prompt enhancement CLI tool

Usage:
  promptforge [options] [prompt]

Options:
  -i, --interactive       Enter interactive TUI mode
  --file PATH            Read prompt from file
  --provider NAME        Use specified provider (default: openai)
  --level LEVEL          Enhancement level: light, standard, deep (default: standard)
  --format FORMAT        Output format: md, txt, json, yaml
  --output PATH          Write result to file
  --quiet                Suppress progress and success messages
  --copy                 Copy result to clipboard
  --help                 Show this help message
  --version              Show version

Examples:
  promptforge "帮我写一个 REST API"
  promptforge "帮我写一个 REST API" --format json
  promptforge -i
  cat prompt.txt | promptforge --level deep --output result.txt
`;
	console.log(help);
}

async function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = "";
		stdin.setEncoding("utf-8");
		stdin.on("data", (chunk) => {
			data += chunk;
		});
		stdin.on("end", () => {
			resolve(data.trim());
		});
		stdin.on("error", reject);
	});
}

function exitWithError(message: string): never {
	stderr.write(`❌ ${message}\n`);
	process.exit(1);
}

async function runCliMode(args: CliArgs): Promise<void> {
	// Load config
	const config = await loadConfig();

	if (!config) {
		exitWithError("No configuration found. Run 'promptforge -i' to set up.");
	}

	// Get the prompt text
	let promptText = args.prompt || "";

	if (args.file) {
		try {
			promptText = await readFile(args.file, "utf-8");
		} catch (error) {
			exitWithError(`Failed to read file "${args.file}": ${formatError(error)}`);
		}
	} else if (!promptText && process.stdin.isTTY === false) {
		// Read from stdin if piped
		promptText = await readStdin();
	}

	if (!promptText) {
		exitWithError("No prompt provided. Use --file, pipe input, or pass prompt as argument.");
	}

	// Determine provider
	const providerName = args.provider || config.defaultProvider;
	const provider = config.providers[providerName];

	if (!provider) {
		exitWithError(`Provider "${providerName}" not configured.`);
	}

	const modelId = resolveProviderModel(config, provider);

	if (!args.quiet) {
		stderr.write(`🔨 Enhancing prompt (${providerName}/${modelId})...\n`);
	}

	let finalResult: EnhanceResult | null = null;

	try {
		for await (const chunk of enhancePrompt(promptText, {
			level: args.level,
			baseURL: provider.baseURL,
			model: modelId,
			apiKey: provider.apiKey,
		})) {
			if (chunk.type === "done" && chunk.result) {
				finalResult = chunk.result;
			} else if (chunk.type === "error") {
				exitWithError(chunk.error || "Unknown LLM error");
			}
		}
	} catch (error) {
		exitWithError(formatError(error));
	}

	if (!finalResult) {
		exitWithError("Model returned no result.");
	}

	const entry = createCliHistoryEntry({
		original: promptText,
		result: finalResult,
		provider: providerName,
		model: modelId,
	});
	const outputContent = formatCliOutput(entry, args.format);
	const shouldWriteStdout = !args.output;

	if (shouldWriteStdout) {
		stdout.write(outputContent);
		if (!outputContent.endsWith("\n")) {
			stdout.write("\n");
		}
	}

	// Handle copy and output
	if (args.copy) {
		try {
			const { default: clipboard } = await import("clipboardy");
			await clipboard.write(outputContent);
			if (!args.quiet) {
				stderr.write("✅ Copied to clipboard\n");
			}
		} catch (error) {
			stderr.write(`⚠️  Failed to copy: ${formatError(error)}\n`);
		}
	}

	if (args.output) {
		try {
			const { writeFile } = await import("node:fs/promises");
			await writeFile(args.output, outputContent, "utf-8");
			if (!args.quiet) {
				stderr.write(`✅ Saved to ${args.output}\n`);
			}
		} catch (error) {
			exitWithError(`Failed to write file "${args.output}": ${formatError(error)}`);
		}
	}
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));

	if (args.help) {
		printHelp();
		process.exit(0);
	}

	if (args.version) {
		console.log(`promptforge v${VERSION}`);
		process.exit(0);
	}

	// Determine mode
	const isInteractive =
		args.interactive || (!args.prompt && !args.file && process.stdin.isTTY !== false);

	if (isInteractive) {
		// TUI mode
		render(<App />);
	} else {
		// CLI mode
		await runCliMode(args);
	}
}

main().catch((error) => {
	if (error instanceof CliUsageError) {
		stderr.write(`❌ ${error.message}\n\n`);
		printHelp();
		process.exit(1);
	}

	console.error("Fatal error:", error);
	process.exit(1);
});
