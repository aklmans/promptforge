// Feedback input form component using Ink TextInput

import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";
import type React from "react";

interface FeedbackFormProps {
	onSubmit: (feedback: string) => void;
	onCancel: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, onCancel }) => {
	const [value, setValue] = useState("");

	return (
		<Box flexDirection="column" marginBottom={1}>
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Provide feedback to refine the prompt:
				</Text>
			</Box>
			<Box marginBottom={1}>
				<Text dimColor>
					Examples: "Make it more concise", "Add error handling", "More examples"
				</Text>
			</Box>
			<TextInput
				value={value}
				onChange={setValue}
				onSubmit={onSubmit}
				placeholder="Your feedback..."
			/>
			<Box marginTop={1}>
				<Text dimColor>(Press Enter to refine, Ctrl+C to cancel)</Text>
			</Box>
		</Box>
	);
};

export default FeedbackForm;
