import { describe, expect, it } from "vitest";
import { parseConfigContent } from "../../src/config";
import {
	buildProviderOptionId,
	buildProviderOptions,
	filterProviderOptions,
} from "../../src/services/providers";

describe("provider option helpers", () => {
	it("builds provider options from declared models and preserves default state", () => {
		const config = parseConfigContent(
			JSON.stringify({
				defaultProvider: "codexzh",
				defaultModel: "gpt-5.4",
				providers: {
					codexzh: {
						baseURL: "https://api.codexzh.com/v1",
						defaultModel: "gpt-5.4",
						models: ["gpt-5.4", "gpt-5.3-codex"],
						apiKey: "test-key",
					},
					ollama: {
						baseURL: "http://localhost:11434/v1",
						defaultModel: "llama3",
						apiKey: "ollama",
					},
				},
			}),
		);

		expect(buildProviderOptions(config)).toEqual([
			{
				id: "codexzh:gpt-5.4",
				provider: "codexzh",
				model: "gpt-5.4",
				baseURL: "https://api.codexzh.com/v1",
				isDefaultModel: true,
			},
			{
				id: "codexzh:gpt-5.3-codex",
				provider: "codexzh",
				model: "gpt-5.3-codex",
				baseURL: "https://api.codexzh.com/v1",
				isDefaultModel: false,
			},
			{
				id: "ollama:llama3",
				provider: "ollama",
				model: "llama3",
				baseURL: "http://localhost:11434/v1",
				isDefaultModel: true,
			},
		]);
	});

	it("searches provider options by model and baseURL", () => {
		const options = [
			{
				id: "openai:gpt-4o",
				provider: "openai",
				model: "gpt-4o",
				baseURL: "https://api.openai.com/v1",
				isDefaultModel: true,
			},
			{
				id: "codexzh:gpt-5.3-codex",
				provider: "codexzh",
				model: "gpt-5.3-codex",
				baseURL: "https://api.codexzh.com/v1",
				isDefaultModel: false,
			},
		];

		expect(filterProviderOptions(options, "gpt-5.3")).toEqual([options[1]]);
		expect(filterProviderOptions(options, "codexzh.com")).toEqual([options[1]]);
		expect(filterProviderOptions(options, "")).toEqual(options);
	});

	it("builds stable provider option ids", () => {
		expect(buildProviderOptionId("openai", "gpt-4o")).toBe("openai:gpt-4o");
	});
});
