// Feedback input component for iterative refinement

import { Box, Text } from "ink";
import type React from "react";

interface FeedbackInputProps {
	onSubmit: (feedback: string) => void;
}

const FeedbackInput: React.FC<FeedbackInputProps> = ({ onSubmit }) => {
	return (
		<Box flexDirection="column" width="100%" paddingY={1}>
			<Box marginBottom={1}>
				<Text bold>Enter feedback to refine (or ESC to cancel):</Text>
			</Box>
			<Box>
				<Text color="cyan">e.g. "Make it more concise" or "Add error handling"</Text>
			</Box>
			<Box>
				<Text color="yellow">{"> "}</Text>
			</Box>
		</Box>
	);
};

export default FeedbackInput;
