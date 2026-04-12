import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import type { HistoryEntry } from "../types";
import { getWindowRange, truncateText } from "../utils/text";
import Panel from "./Panel";

interface HistoryListProps {
	entries: HistoryEntry[];
	selectedIndex: number;
	height?: number;
	contentWidth?: number;
	searchQuery?: string;
	searchFocused?: boolean;
	onSearchChange?: (value: string) => void;
	onSearchSubmit?: (value: string) => void;
}

function formatCompactTimestamp(timestamp: string): string {
	return new Intl.DateTimeFormat(undefined, {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(timestamp));
}

const HistoryList: React.FC<HistoryListProps> = ({
	entries,
	selectedIndex,
	height = 18,
	contentWidth = 28,
	searchQuery = "",
	searchFocused = false,
	onSearchChange,
	onSearchSubmit,
}) => {
	const visibleCount = Math.max(1, Math.floor((height - 7) / 3));
	const { start, end } = getWindowRange(entries.length, selectedIndex, visibleCount);
	const visibleEntries = entries.slice(start, end);
	const footer =
		entries.length === 0
			? searchQuery
				? "0 match"
				: "0 items"
			: searchQuery
				? `${end}/${entries.length} match`
				: `${end}/${entries.length}`;

	return (
		<Panel
			title="History"
			footer={footer}
			height={height}
			borderColor="cyan"
			contentWidth={contentWidth}
		>
			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>{searchFocused ? "Search history" : "Press / to search"}</Text>
				<TextInput
					value={searchQuery}
					onChange={(value) => onSearchChange?.(value)}
					onSubmit={(value) => onSearchSubmit?.(value)}
					placeholder="Search original/result/provider..."
					focus={searchFocused}
				/>
			</Box>
			{entries.length === 0 ? (
				<Text dimColor>
					{searchQuery ? "No matching revisions." : "No history yet. Run an enhancement first."}
				</Text>
			) : (
				visibleEntries.map((entry, offset) => {
					const index = start + offset;
					return (
						<Box key={entry.id} flexDirection="column">
							<Text
								color={index === selectedIndex ? "green" : undefined}
								inverse={index === selectedIndex}
							>
								{`${index === selectedIndex ? "›" : " "} v${entry.version} · ${truncateText(
									`${entry.provider}/${entry.model}`,
									Math.max(12, contentWidth - 7),
								)}`}
							</Text>
							<Text dimColor>
								{truncateText(
									`${formatCompactTimestamp(entry.timestamp)} · ${entry.result.score.overall}`,
									contentWidth,
								)}
							</Text>
							<Text dimColor>
								{truncateText(entry.original.replace(/\s+/g, " "), contentWidth)}
							</Text>
						</Box>
					);
				})
			)}
		</Panel>
	);
};

export default HistoryList;
