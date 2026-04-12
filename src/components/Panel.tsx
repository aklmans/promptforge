import { Box, Text } from "ink";
import type React from "react";
import { truncateText } from "../utils/text";

interface PanelProps {
	title: string;
	children: React.ReactNode;
	footer?: string;
	borderColor?: string;
	height?: number;
	width?: number | string;
	contentWidth?: number;
}

const Panel: React.FC<PanelProps> = ({
	title,
	children,
	footer,
	borderColor = "blue",
	height,
	width = "100%",
	contentWidth,
}) => {
	const headerWidth = Math.max(
		12,
		contentWidth ?? (typeof width === "number" ? Math.max(12, width - 4) : 40),
	);
	const footerWidth = footer
		? Math.max(4, Math.min(Math.floor(headerWidth * 0.55), headerWidth - 8))
		: 0;
	const titleWidth = footer ? Math.max(6, headerWidth - footerWidth - 1) : headerWidth;
	const compactChrome = typeof height === "number" && height <= 4;

	return (
		<Box
			flexDirection="column"
			width={width}
			height={height}
			borderStyle="round"
			borderColor={borderColor}
			paddingX={1}
		>
			<Box width="100%" justifyContent="space-between" marginBottom={compactChrome ? 0 : 1}>
				<Box flexGrow={1} paddingRight={footer ? 1 : 0}>
					<Text bold>{truncateText(title, titleWidth)}</Text>
				</Box>
				{footer ? (
					<Box width={footerWidth} justifyContent="flex-end">
						<Text dimColor>{truncateText(footer, footerWidth)}</Text>
					</Box>
				) : (
					<Text dimColor> </Text>
				)}
			</Box>
			<Box flexDirection="column" flexGrow={1}>
				{children}
			</Box>
		</Box>
	);
};

export default Panel;
