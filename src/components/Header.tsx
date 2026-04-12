import { Box, Text } from "ink";
import type React from "react";
import type { AppStatus, AppView } from "../types";
import { truncateText } from "../utils/text";

interface HeaderProps {
	provider?: string;
	model?: string;
	view?: AppView;
	status?: AppStatus;
	inputFocused?: boolean;
	originalTokens?: number;
	enhancedTokens?: number;
	contentWidth?: number;
}

const Header: React.FC<HeaderProps> = ({
	provider = "openai",
	model = "gpt-4o",
	view = "main",
	status = "idle",
	inputFocused = false,
	originalTokens,
	enhancedTokens,
	contentWidth = 100,
}) => {
	const compact = contentWidth < 96;
	const providerText = truncateText(`${provider}/${model}`, Math.max(16, contentWidth - 12));
	const tokenText =
		typeof originalTokens === "number" && typeof enhancedTokens === "number"
			? `${originalTokens}→${enhancedTokens} tokens`
			: null;

	return (
		<Box width="100%" paddingX={2} borderStyle="round" borderColor="blue">
			{compact ? (
				<Box flexDirection="column">
					<Box>
						<Text bold color="cyan">
							🔨 PromptForge
						</Text>
						<Text
							dimColor
						>{`  ${view.toUpperCase()} · ${inputFocused ? "INSERT" : "COMMAND"} · ${status}`}</Text>
					</Box>
					<Box>
						<Text dimColor>{providerText}</Text>
						{tokenText ? <Text color="yellow">{`  ${tokenText}`}</Text> : null}
					</Box>
				</Box>
			) : (
				<Box width="100%" justifyContent="space-between">
					<Box>
						<Text bold color="cyan">
							🔨 PromptForge
						</Text>
						<Text
							dimColor
						>{`  ${view.toUpperCase()} · ${inputFocused ? "INSERT" : "COMMAND"} · ${status}`}</Text>
					</Box>
					<Box>
						<Text dimColor>{providerText}</Text>
						{tokenText ? <Text color="yellow">{`  ${tokenText}`}</Text> : null}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default Header;
