import { Box, Text } from "ink";
import type React from "react";
import { fitTextBlock } from "../utils/text";
import Panel from "./Panel";

interface HelpViewProps {
	height?: number;
	contentWidth?: number;
}

const HelpView: React.FC<HelpViewProps> = ({ height = 20, contentWidth = 88 }) => {
	const content = [
		"Main",
		"Enter submit · ESC command mode · r new prompt",
		": / Ctrl+K open command palette · h history · d diff · f refine",
		"c copy · x export picker · ? help · q quit",
		"",
		"History",
		"/ search · Enter apply filter · ESC list mode",
		"↑↓ move · g/G jump first/last",
		"",
		"Providers",
		"/ search name/model/baseURL",
		"↑↓ move · PgUp/PgDn page · Enter select",
		"",
		"Export",
		"↑↓ move · Enter export · ESC back",
		"",
		"Diff & Lists",
		"Tab switch patch/overview focus · a toggle center/top align · : / Ctrl+K palette",
		"Patch: ↑↓/PgUp/PgDn scroll · Overview: ↑↓/PgUp/PgDn/g/G hunks",
		"n/] next hunk · N/[ previous hunk · digits + Enter jump to hunk",
		"Backspace clear jump digits · Enter top-align active hunk · ESC back",
		"",
		"Workflow",
		"1. 输入 prompt",
		"2. 回车增强",
		"3. 查看结果 / diff / history",
		"4. 用 feedback 继续迭代",
		"5. 复制或导出当前版本",
	].join("\n");
	const fitted = fitTextBlock(content, {
		maxWidth: Math.max(20, contentWidth),
		maxLines: Math.max(6, height - 4),
	});

	return (
		<Panel
			title="Shortcuts"
			footer="Press ESC to close"
			height={height}
			borderColor="yellow"
			contentWidth={contentWidth}
		>
			<Box flexDirection="column">
				<Text>{fitted.text}</Text>
				{fitted.hiddenLines > 0 ? (
					<Text dimColor>{`\n… (${fitted.hiddenLines} more lines)`}</Text>
				) : null}
			</Box>
		</Panel>
	);
};

export default HelpView;
