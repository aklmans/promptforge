import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { truncateText } from "../utils/text";
import Panel from "./Panel";

export interface CommandPaletteItem {
	id: string;
	title: string;
	description: string;
	shortcut?: string;
	group?: string;
}

interface CommandPaletteProps {
	query: string;
	commands: CommandPaletteItem[];
	selectedIndex: number;
	height?: number;
	width?: number | string;
	onQueryChange: (value: string) => void;
	onSubmit: () => void;
}

function getHighlightRanges(text: string, query: string): Array<[number, number]> {
	const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

	if (tokens.length === 0) {
		return [];
	}

	const ranges: Array<[number, number]> = [];
	const lowerText = text.toLowerCase();

	for (const token of tokens) {
		let searchIndex = 0;

		while (searchIndex < lowerText.length) {
			const foundIndex = lowerText.indexOf(token, searchIndex);
			if (foundIndex === -1) {
				break;
			}

			ranges.push([foundIndex, foundIndex + token.length]);
			searchIndex = foundIndex + token.length;
		}
	}

	ranges.sort((left, right) => left[0] - right[0]);

	return ranges.reduce<Array<[number, number]>>((merged, currentRange) => {
		const previousRange = merged.at(-1);
		if (!previousRange || currentRange[0] > previousRange[1]) {
			merged.push([...currentRange] as [number, number]);
			return merged;
		}

		previousRange[1] = Math.max(previousRange[1], currentRange[1]);
		return merged;
	}, []);
}

function renderHighlightedText(
	text: string,
	query: string,
	options: { maxWidth: number; baseColor?: string; dimColor?: boolean; bold?: boolean },
): React.ReactNode {
	const safeText = truncateText(text, options.maxWidth);
	const ranges = getHighlightRanges(safeText, query);

	if (ranges.length === 0) {
		return (
			<Text color={options.baseColor} dimColor={options.dimColor} bold={options.bold}>
				{safeText}
			</Text>
		);
	}

	const segments: Array<{ key: string; text: string; highlight: boolean }> = [];
	let cursor = 0;

	for (const [start, end] of ranges) {
		if (start > cursor) {
			segments.push({
				key: `plain-${cursor}-${start}`,
				text: safeText.slice(cursor, start),
				highlight: false,
			});
		}
		segments.push({
			key: `hit-${start}-${end}`,
			text: safeText.slice(start, end),
			highlight: true,
		});
		cursor = end;
	}

	if (cursor < safeText.length) {
		segments.push({
			key: `plain-${cursor}-${safeText.length}`,
			text: safeText.slice(cursor),
			highlight: false,
		});
	}

	return (
		<Text color={options.baseColor} dimColor={options.dimColor} bold={options.bold}>
			{segments.map((segment) => (
				<Text
					key={segment.key}
					color={segment.highlight ? "yellow" : undefined}
					bold={segment.highlight || options.bold}
				>
					{segment.text}
				</Text>
			))}
		</Text>
	);
}

function getCommandWindow(
	commands: CommandPaletteItem[],
	selectedIndex: number,
	rowBudget: number,
): { start: number; end: number } {
	if (commands.length === 0) {
		return { start: 0, end: 0 };
	}

	const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, commands.length - 1));
	let bestWindow = { start: safeSelectedIndex, end: safeSelectedIndex + 1 };
	let bestCommandCount = 1;
	let bestDistance = 0;

	const getRowUsage = (start: number, end: number): number => {
		let rows = 0;

		for (let index = start; index < end; index += 1) {
			rows += 1;
			if (index === start || commands[index]?.group !== commands[index - 1]?.group) {
				rows += 1;
			}
		}

		return rows;
	};

	for (let start = 0; start <= safeSelectedIndex; start += 1) {
		for (let end = safeSelectedIndex + 1; end <= commands.length; end += 1) {
			if (safeSelectedIndex < start || safeSelectedIndex >= end) {
				continue;
			}

			const rows = getRowUsage(start, end);
			if (rows > rowBudget) {
				break;
			}

			const commandCount = end - start;
			const center = start + (commandCount - 1) / 2;
			const distance = Math.abs(center - safeSelectedIndex);

			if (
				commandCount > bestCommandCount ||
				(commandCount === bestCommandCount && distance < bestDistance)
			) {
				bestWindow = { start, end };
				bestCommandCount = commandCount;
				bestDistance = distance;
			}
		}
	}

	return bestWindow;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
	query,
	commands,
	selectedIndex,
	height = 12,
	width = "100%",
	onQueryChange,
	onSubmit,
}) => {
	const rowBudget = Math.max(4, height - 5);
	const range = getCommandWindow(commands, selectedIndex, rowBudget);
	const visibleCommands = commands.slice(range.start, range.end);
	const activeCommand = commands[selectedIndex] ?? null;

	return (
		<Panel
			title="Command Palette"
			footer={`${commands.length} commands · ↑↓ select · Enter run · ESC/Ctrl+K close`}
			height={height}
			width={width}
			borderColor="yellow"
			contentWidth={typeof width === "number" ? Math.max(12, width - 4) : 80}
		>
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					›
				</Text>
				<Text> </Text>
				<TextInput
					value={query}
					onChange={onQueryChange}
					onSubmit={onSubmit}
					placeholder="输入命令、动作或快捷键…"
					focus
				/>
			</Box>
			{visibleCommands.length === 0 ? (
				<Text dimColor>No matching commands.</Text>
			) : (
				<Box flexDirection="column" flexGrow={1}>
					{visibleCommands.map((command, index) => {
						const absoluteIndex = range.start + index;
						const isSelected = absoluteIndex === selectedIndex;
						const showGroupHeading =
							absoluteIndex === range.start || commands[absoluteIndex - 1]?.group !== command.group;

						return (
							<Box key={command.id} flexDirection="column">
								{showGroupHeading ? (
									<Text color="magenta" bold>
										{truncateText(command.group || "Commands", 20)}
									</Text>
								) : null}
								<Box>
									<Text color={isSelected ? "cyan" : "magenta"}>{isSelected ? "›" : " "}</Text>
									<Text> </Text>
									{renderHighlightedText(command.title, query, {
										maxWidth: 34,
										baseColor: isSelected ? "cyan" : undefined,
										dimColor: !isSelected,
										bold: isSelected,
									})}
									<Text dimColor>
										{` · ${truncateText(command.shortcut || command.group || "command", 18)}`}
									</Text>
								</Box>
							</Box>
						);
					})}
					{activeCommand ? (
						<Box marginTop={1}>
							{renderHighlightedText(activeCommand.description, query, {
								maxWidth: 72,
								dimColor: true,
							})}
						</Box>
					) : null}
				</Box>
			)}
		</Panel>
	);
};

export default CommandPalette;
