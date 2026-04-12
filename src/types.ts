// Core type definitions for PromptForge application state and data structures

export interface ProviderConfig {
	baseURL: string;
	defaultModel?: string;
	models?: string[];
	apiKey: string;
}

export interface AppConfig {
	defaultProvider: string;
	defaultModel: string;
	defaultLevel: "light" | "standard" | "deep";
	theme: "dark" | "light";
	autoSave: boolean;
	maxHistoryDays: number;
	providers: Record<string, ProviderConfig>;
}

export interface EnhanceResult {
	enhanced: string;
	changes: string[];
	score: {
		overall: number;
		clarity: number;
		completeness: number;
		actionability: number;
		agentReadiness: number;
		tokenEfficiency: number;
	};
	metadata: {
		originalTokens: number;
		enhancedTokens: number;
		compressionNote: string;
		converged?: boolean;
	};
}

export interface HistoryEntry {
	id: string;
	timestamp: string;
	original: string;
	enhanced: string;
	result: EnhanceResult;
	provider: string;
	model: string;
	version: number;
	pinned: boolean;
	tags: string[];
}

export type AppView =
	| "main"
	| "diff"
	| "history"
	| "provider"
	| "feedback"
	| "help"
	| "onboarding"
	| "export";
export type AppStatus = "idle" | "thinking" | "streaming" | "done" | "error";

export interface StreamChunk {
	type: "content" | "done" | "error";
	content?: string;
	error?: string;
	result?: EnhanceResult;
}

export interface EnhanceOptions {
	level?: "light" | "standard" | "deep";
	provider?: string;
	baseURL?: string;
	model?: string;
	apiKey?: string;
}
