// Main content panel displaying enhancement results with streaming support

import { Text } from "ink";
import type React from "react";
import { fitTextBlock } from "../utils/text";
import Panel from "./Panel";

interface PromptPanelProps {
	title?: string;
	content: string;
	height?: number;
	isStreaming?: boolean;
	emptyText?: string;
	footer?: string;
	borderColor?: string;
	contentWidth?: number;
}

const PromptPanel: React.FC<PromptPanelProps> = ({
	title = "Preview",
	content,
	height = 16,
	isStreaming = false,
	emptyText = "Nothing to show yet.",
	footer,
	borderColor = "blue",
	contentWidth = 80,
}) => {
	const effectiveContent = content.trim() ? content : emptyText;
	const maxLines = Math.max(1, height - 4);
	const { text, hiddenLines } = fitTextBlock(effectiveContent, {
		maxWidth: Math.max(12, contentWidth),
		maxLines,
	});

	return (
		<Panel
			title={title}
			footer={footer}
			borderColor={borderColor}
			height={height}
			contentWidth={contentWidth}
		>
			<Text>{text}</Text>
			{isStreaming ? <Text color="green">▊</Text> : null}
			{hiddenLines > 0 ? <Text dimColor>{`\n… (${hiddenLines} more lines)`}</Text> : null}
		</Panel>
	);
};

export default PromptPanel;
