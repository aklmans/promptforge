// Interactive prompt input component with Ink TextInput

import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";
import type React from "react";

interface PromptInputProps {
	onSubmit: (text: string) => void;
	isLoading?: boolean;
	focus?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading = false, focus = true }) => {
	const [value, setValue] = useState("");

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Enter your prompt:
				</Text>
			</Box>
			{!isLoading ? (
				<TextInput
					value={value}
					onChange={setValue}
					onSubmit={onSubmit}
					placeholder="e.g., 帮我写一个 REST API..."
					focus={focus}
				/>
			) : (
				<Text dimColor>(Processing...)</Text>
			)}
			<Box marginTop={1}>
				<Text dimColor>
					{focus
						? "(Press Enter to enhance, ESC for shortcuts, Ctrl+C to exit)"
						: "(Shortcut mode: press i to continue typing)"}
				</Text>
			</Box>
		</Box>
	);
};

export default PromptInput;
