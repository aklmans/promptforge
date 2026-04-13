import Fuse from "fuse.js";
import type { ProviderOption } from "../components/ProviderPicker";
import { getProviderModelChoices, resolveProviderModel } from "../config";
import type { AppConfig } from "../types";

export function buildProviderOptionId(provider: string, model: string): string {
	return `${provider}:${model}`;
}

export function buildProviderOptions(config: AppConfig): ProviderOption[] {
	return Object.entries(config.providers).flatMap(([providerName, providerConfig]) => {
		const providerDefaultModel = resolveProviderModel(config, providerConfig);

		return getProviderModelChoices(config, providerConfig).map((model) => ({
			id: buildProviderOptionId(providerName, model),
			provider: providerName,
			model,
			baseURL: providerConfig.baseURL,
			isDefaultModel: model === providerDefaultModel,
		}));
	});
}

export function filterProviderOptions(options: ProviderOption[], query: string): ProviderOption[] {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) {
		return options;
	}

	const fuse = new Fuse(options, {
		includeScore: true,
		threshold: 0.35,
		keys: ["provider", "model", "baseURL", "id"],
	});

	return fuse.search(normalizedQuery).map((result) => result.item);
}
