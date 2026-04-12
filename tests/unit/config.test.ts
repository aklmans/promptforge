import { afterEach, describe, expect, it } from "vitest";
import { ConfigError, parseConfigContent } from "../../src/config";

const envKey = "PROMPTFORGE_TEST_API_KEY";
const previousEnvValue = process.env[envKey];

afterEach(() => {
	if (previousEnvValue === undefined) {
		delete process.env[envKey];
		return;
	}

	process.env[envKey] = previousEnvValue;
});

describe("parseConfigContent", () => {
	it("resolves env: values and legacy model fields", () => {
		process.env[envKey] = "test-key";

		const config = parseConfigContent(
			JSON.stringify({
				defaultProvider: "codexzh",
				defaultLevel: "deep",
				providers: {
					codexzh: {
						baseURL: "https://api.example.com/v1",
						model: "gpt-5.4",
						apiKey: `env:${envKey}`,
					},
				},
			}),
			"test-config.json",
		);

		expect(config.defaultProvider).toBe("codexzh");
		expect(config.defaultLevel).toBe("deep");
		expect(config.defaultModel).toBe("gpt-5.4");
		expect(config.providers.codexzh?.apiKey).toBe("test-key");
		expect(config.providers.codexzh?.defaultModel).toBe("gpt-5.4");
	});

	it("rejects invalid JSON with a config error", () => {
		expect(() => parseConfigContent("{", "broken.json")).toThrow(ConfigError);
	});

	it("rejects a missing default provider", () => {
		expect(() =>
			parseConfigContent(
				JSON.stringify({
					defaultProvider: "missing",
					providers: {
						openai: {
							baseURL: "https://api.openai.com/v1",
							apiKey: "test-key",
							defaultModel: "gpt-4o",
						},
					},
				}),
				"missing-provider.json",
			),
		).toThrow(/Default provider/);
	});
});
