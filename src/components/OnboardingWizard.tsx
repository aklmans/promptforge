// First-run onboarding for provider selection and API key setup

import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import type React from "react";
import { useState } from "react";
import { saveConfig } from "../config";
import type { AppConfig } from "../types";

interface OnboardingWizardProps {
	onComplete: (config: AppConfig) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
	const [step, setStep] = useState<"provider" | "apikey" | "saving" | "done">("provider");
	const [selectedProvider, setSelectedProvider] = useState("openai");
	const [apiKey, setApiKey] = useState("");

	const providers = [
		{ label: "OpenAI (gpt-4o)", value: "openai" },
		{ label: "OpenAI (gpt-4-turbo)", value: "openai-turbo" },
	];

	const handleProviderSelect = (item: (typeof providers)[0]) => {
		setSelectedProvider(item.value);
		setStep("apikey");
	};

	const handleApiKeySave = async () => {
		if (!apiKey.trim()) {
			return;
		}

		setStep("saving");
		const defaultModel = selectedProvider === "openai-turbo" ? "gpt-4-turbo" : "gpt-4o";

		const config: AppConfig = {
			defaultProvider: "openai",
			defaultModel,
			defaultLevel: "standard",
			theme: "dark",
			autoSave: true,
			maxHistoryDays: 30,
			providers: {
				openai: {
					baseURL: "https://api.openai.com/v1",
					defaultModel,
					apiKey,
				},
			},
		};

		try {
			await saveConfig(config);
			setStep("done");
			setTimeout(() => onComplete(config), 500);
		} catch (error) {
			console.error("Failed to save config:", error);
			setStep("apikey");
		}
	};

	if (step === "done") {
		return (
			<Box flexDirection="column" padding={2}>
				<Text color="green">✅ Configuration saved!</Text>
			</Box>
		);
	}

	if (step === "saving") {
		return (
			<Box flexDirection="column" padding={2}>
				<Text color="yellow">⏳ Saving configuration...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={2} borderStyle="round">
			<Box marginBottom={1}>
				<Text bold color="cyan">
					🔨 Welcome to PromptForge
				</Text>
			</Box>

			{step === "provider" && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text>Select a provider (↑↓ navigate, ⏎ select):</Text>
					</Box>
					<SelectInput items={providers} onSelect={handleProviderSelect} />
				</Box>
			)}

			{step === "apikey" && (
				<Box flexDirection="column">
					<Box marginBottom={1}>
						<Text>Enter your OpenAI API key (https://platform.openai.com/api-keys):</Text>
					</Box>
					<TextInput
						value={apiKey}
						onChange={setApiKey}
						onSubmit={handleApiKeySave}
						placeholder="sk-..."
						mask="•"
					/>
					<Box marginTop={1}>
						<Text dimColor>(Press Enter to save, Ctrl+C to cancel)</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default OnboardingWizard;
