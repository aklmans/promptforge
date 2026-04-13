// Configuration loading and validation using zod

import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import type { AppConfig, ProviderConfig } from "./types";

// Zod schema for validation
const ProviderConfigSchema = z
	.object({
		baseURL: z.string().url(),
		apiKey: z.string(),
		defaultModel: z.string().optional(),
		model: z.string().optional(),
		models: z.array(z.string()).optional(),
	})
	.transform(({ model, defaultModel, ...provider }) => ({
		...provider,
		defaultModel: defaultModel ?? model,
	}));

const AppConfigSchema = z.object({
	defaultProvider: z.string().default("openai"),
	defaultModel: z.string().optional(),
	defaultLevel: z.enum(["light", "standard", "deep"]).default("standard"),
	theme: z.enum(["dark", "light"]).default("dark"),
	autoSave: z.boolean().default(true),
	maxHistoryDays: z.number().default(30),
	providers: z.record(ProviderConfigSchema).default({
		openai: {
			baseURL: "https://api.openai.com/v1",
			apiKey: "",
			defaultModel: "gpt-4o",
		},
	}),
});

export interface LoadedConfig {
	config: AppConfig;
	path: string;
}

export class ConfigError extends Error {
	constructor(
		message: string,
		readonly path?: string,
	) {
		super(message);
		this.name = "ConfigError";
	}
}

// Helper to resolve env:VAR_NAME syntax
function resolveEnvSyntax(value: unknown): unknown {
	if (typeof value === "string" && value.startsWith("env:")) {
		const varName = value.slice(4);
		return process.env[varName] || "";
	}
	if (typeof value === "object" && value !== null) {
		if (Array.isArray(value)) {
			return value.map(resolveEnvSyntax);
		}
		const resolved: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			resolved[key] = resolveEnvSyntax(val);
		}
		return resolved;
	}
	return value;
}

function isFileNotFoundError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "ENOENT"
	);
}

function finalizeConfig(validated: z.infer<typeof AppConfigSchema>, path?: string): AppConfig {
	const selectedProvider = validated.providers[validated.defaultProvider];
	if (!selectedProvider) {
		throw new ConfigError(
			`Default provider "${validated.defaultProvider}" is not configured in providers.`,
			path,
		);
	}

	return {
		...validated,
		defaultModel: resolveProviderModel(validated, selectedProvider),
	};
}

export function parseConfigContent(content: string, path?: string): AppConfig {
	let parsed: unknown;

	try {
		parsed = JSON.parse(content);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new ConfigError(`Invalid JSON: ${message}`, path);
	}

	try {
		const resolved = resolveEnvSyntax(parsed);
		const validated = AppConfigSchema.parse(resolved);
		return finalizeConfig(validated, path);
	} catch (error) {
		if (error instanceof ConfigError) {
			throw error;
		}

		if (error instanceof z.ZodError) {
			throw new ConfigError(
				error.errors.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
				path,
			);
		}

		const message = error instanceof Error ? error.message : String(error);
		throw new ConfigError(message, path);
	}
}

export function formatConfigError(error: unknown): string {
	if (error instanceof ConfigError) {
		return error.path ? `${error.path}: ${error.message}` : error.message;
	}

	return error instanceof Error ? error.message : String(error);
}

// Load and validate configuration
export async function loadConfigWithPath(): Promise<LoadedConfig | null> {
	const { readFile } = await import("node:fs/promises");

	// Multiple search paths in priority order
	const searchPaths = [
		// 1. Project root
		resolve(process.cwd(), "promptforge.config.json"),
		resolve(process.cwd(), ".promptforgerc"),
		resolve(process.cwd(), ".promptforgerc.json"),
		// 2. Home directory
		resolve(homedir(), ".promptforge", "config.json"),
		resolve(homedir(), ".promptforgerc"),
		resolve(homedir(), ".promptforgerc.json"),
	];

	// Try each path
	for (const path of searchPaths) {
		let content: string;

		try {
			content = await readFile(path, "utf-8");
		} catch (error) {
			if (isFileNotFoundError(error)) {
				continue;
			}

			console.error(
				`Config read error: ${formatConfigError(new ConfigError(String(error), path))}`,
			);
			return null;
		}

		try {
			return {
				config: parseConfigContent(content, path),
				path,
			};
		} catch (error) {
			console.error(`Config validation error: ${formatConfigError(error)}`);
			return null;
		}
	}

	// No config found in any location
	return null;
}

export async function loadConfig(): Promise<AppConfig | null> {
	const loaded = await loadConfigWithPath();
	return loaded?.config ?? null;
}

// Get config file path
export function getConfigPath(): string {
	return resolve(homedir(), ".promptforge/config.json");
}

export async function saveConfig(config: AppConfig, path = getConfigPath()): Promise<void> {
	const { mkdir, writeFile } = await import("node:fs/promises");
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, JSON.stringify(config, null, 2), "utf-8");
}

export function resolveProviderModel(
	config: { defaultModel?: string },
	provider?: Pick<ProviderConfig, "defaultModel">,
): string {
	return provider?.defaultModel || config.defaultModel || "gpt-4o";
}

export function getProviderModelChoices(
	config: { defaultModel?: string },
	provider?: Pick<ProviderConfig, "defaultModel" | "models">,
): string[] {
	const primaryModel = resolveProviderModel(config, provider);
	const declaredModels = provider?.models ?? [];
	const deduped = new Set<string>();

	deduped.add(primaryModel);
	for (const model of declaredModels) {
		if (model.trim()) {
			deduped.add(model);
		}
	}

	return [...deduped];
}
