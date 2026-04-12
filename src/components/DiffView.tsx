import { Box, Text } from "ink";
import type React from "react";
import {
	type DiffChangeBlock,
	type RenderableDiffLine,
	buildDiffModel,
	getActiveChangeBlockIndex,
	getDiffLayoutHeights,
	summarizeDiff,
} from "../services/differ";
import { fitTextBlock, getWindowRange, truncateText } from "../utils/text";
import Panel from "./Panel";

interface DiffViewProps {
	original: string;
	enhanced: string;
	height?: number;
	contentWidth?: number;
	scrollOffset?: number;
	diffLines?: RenderableDiffLine[];
	changeBlocks?: DiffChangeBlock[];
	activeChangeIndex?: number;
	focusArea?: "patch" | "overview";
	alignMode?: "center" | "top";
	jumpInput?: string;
}

const DiffView: React.FC<DiffViewProps> = ({
	original,
	enhanced,
	height = 20,
	contentWidth = 96,
	scrollOffset = 0,
	diffLines: providedDiffLines,
	changeBlocks: providedChangeBlocks,
	activeChangeIndex,
	focusArea = "patch",
	alignMode = "center",
	jumpInput = "",
}) => {
	const summary = summarizeDiff(original, enhanced);
	const { upperHeight, lowerHeight } = getDiffLayoutHeights(height);
	const compactComparePanels = contentWidth < 92;
	const compactBadgeLayout = contentWidth < 78;
	const showMinimap = contentWidth >= 72;
	const useMergedComparePanel = compactComparePanels && upperHeight < 8;
	const useCompactOverviewPanel = upperHeight < 8;
	const overviewWidth = compactComparePanels
		? Math.max(8, Math.min(24, Math.floor(contentWidth * 0.28)))
		: Math.max(12, Math.min(30, Math.floor(contentWidth * 0.26)));
	const compareWidth = Math.max(16, contentWidth - overviewWidth - 2);
	const columnWidth = compactComparePanels
		? Math.max(12, compareWidth - 4)
		: Math.max(12, Math.floor((compareWidth - 6) / 2));
	const primaryCompareHeight = compactComparePanels
		? Math.max(3, Math.ceil(upperHeight / 2))
		: upperHeight;
	const secondaryCompareHeight = compactComparePanels
		? Math.max(3, upperHeight - primaryCompareHeight)
		: upperHeight;
	const patchWidth = Math.max(18, contentWidth - (showMinimap ? 8 : 4));
	const diffModel =
		providedDiffLines && providedChangeBlocks
			? null
			: buildDiffModel(original, enhanced, patchWidth);
	const diffLines = providedDiffLines ?? diffModel?.lines ?? [];
	const changeBlocks = providedChangeBlocks ?? diffModel?.changeBlocks ?? [];
	const visiblePatchLines = Math.max(3, lowerHeight - 3);
	const maxScrollOffset = Math.max(0, diffLines.length - visiblePatchLines);
	const safeScrollOffset = Math.min(scrollOffset, maxScrollOffset);
	const safeActiveChangeIndex =
		activeChangeIndex ?? getActiveChangeBlockIndex(changeBlocks, safeScrollOffset);
	const activeChangeBlock = safeActiveChangeIndex >= 0 ? changeBlocks[safeActiveChangeIndex] : null;
	const visibleDiffLines = diffLines.slice(safeScrollOffset, safeScrollOffset + visiblePatchLines);
	const totalAddedLines = changeBlocks.reduce((sum, block) => sum + block.addedLines, 0);
	const totalRemovedLines = changeBlocks.reduce((sum, block) => sum + block.removedLines, 0);
	const overviewListCapacity = Math.max(1, upperHeight - 6);
	const overviewRange = getWindowRange(
		changeBlocks.length,
		Math.max(0, safeActiveChangeIndex),
		overviewListCapacity,
	);
	const visibleChangeBlocks = changeBlocks.slice(overviewRange.start, overviewRange.end);
	const originalBlock = fitTextBlock(original || "Original prompt is empty.", {
		maxWidth: columnWidth,
		maxLines: Math.max(1, primaryCompareHeight - 4),
	});
	const enhancedBlock = fitTextBlock(enhanced || "Enhanced prompt is empty.", {
		maxWidth: columnWidth,
		maxLines: Math.max(1, secondaryCompareHeight - 4),
	});
	const compactOriginalPreview = truncateText(
		original.replace(/\s+/g, " ") || "Original prompt is empty.",
		Math.max(10, compareWidth - 8),
	);
	const compactEnhancedPreview = truncateText(
		enhanced.replace(/\s+/g, " ") || "Enhanced prompt is empty.",
		Math.max(10, compareWidth - 8),
	);
	const patchFooter = truncateText(
		diffLines.length === 0
			? "No changes"
			: [
					activeChangeBlock
						? `Hunk ${safeActiveChangeIndex + 1}/${changeBlocks.length} · ${activeChangeBlock.start + 1}-${activeChangeBlock.end + 1}`
						: "No hunks",
					`Align ${alignMode}`,
					`↑↓ ${safeScrollOffset + 1}-${Math.min(
						diffLines.length,
						safeScrollOffset + visibleDiffLines.length,
					)} / ${diffLines.length}`,
				].join(" · "),
		Math.max(24, contentWidth - 6),
	);
	const activeProgressPercent =
		changeBlocks.length === 0 || safeActiveChangeIndex < 0
			? 0
			: Math.round(((safeActiveChangeIndex + 1) / changeBlocks.length) * 100);
	const progressLabel =
		changeBlocks.length === 0 || safeActiveChangeIndex < 0
			? "0/0 · 0%"
			: `${safeActiveChangeIndex + 1}/${changeBlocks.length} · ${activeProgressPercent}%`;
	const progressWidth = Math.max(4, overviewWidth - 6);
	const filledProgressWidth =
		changeBlocks.length === 0
			? 0
			: Math.max(
					1,
					Math.min(
						progressWidth,
						Math.round(((safeActiveChangeIndex + 1) / changeBlocks.length) * progressWidth),
					),
				);
	const progressBar = {
		filled: "█".repeat(filledProgressWidth),
		empty: "░".repeat(Math.max(0, progressWidth - filledProgressWidth)),
	};
	const minimapRows = Array.from({ length: visiblePatchLines }, (_, rowIndex) => {
		if (diffLines.length === 0) {
			return {
				key: `empty-${rowIndex}`,
				char: "·",
				color: undefined,
				dimColor: true,
				bold: false,
			};
		}

		const rangeStart = Math.floor((rowIndex / visiblePatchLines) * diffLines.length);
		const rangeEnd = Math.max(
			rangeStart,
			Math.floor(((rowIndex + 1) / visiblePatchLines) * diffLines.length) - 1,
		);
		const viewportStart = safeScrollOffset;
		const viewportEnd = safeScrollOffset + visiblePatchLines - 1;
		const isViewportRow = !(rangeEnd < viewportStart || rangeStart > viewportEnd);
		const intersectsActiveBlock =
			activeChangeBlock !== null &&
			!(rangeEnd < activeChangeBlock.start || rangeStart > activeChangeBlock.end);
		const intersectsChangeBlock = changeBlocks.some(
			(block) => !(rangeEnd < block.start || rangeStart > block.end),
		);

		if (intersectsActiveBlock && isViewportRow) {
			return {
				key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
				char: "█",
				color: "cyan",
				dimColor: false,
				bold: true,
			};
		}

		if (intersectsActiveBlock) {
			return {
				key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
				char: "█",
				color: "cyan",
				dimColor: false,
				bold: false,
			};
		}

		if (intersectsChangeBlock && isViewportRow) {
			return {
				key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
				char: "▓",
				color: "blue",
				dimColor: false,
				bold: false,
			};
		}

		if (intersectsChangeBlock) {
			return {
				key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
				char: "▌",
				color: "magenta",
				dimColor: false,
				bold: false,
			};
		}

		if (isViewportRow) {
			return {
				key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
				char: "│",
				color: "blue",
				dimColor: false,
				bold: false,
			};
		}

		return {
			key: `${rowIndex}-${rangeStart}-${rangeEnd}`,
			char: "·",
			color: undefined,
			dimColor: true,
			bold: false,
		};
	});
	const paddedVisibleDiffLines = Array.from({ length: visiblePatchLines }, (_, rowIndex) => ({
		key: `row-${safeScrollOffset + rowIndex}`,
		line: visibleDiffLines[rowIndex] ?? null,
	}));

	const renderDiffLine = (line: RenderableDiffLine, index: number) => {
		const absoluteIndex = safeScrollOffset + index;
		const isActiveChangeLine =
			activeChangeBlock !== null &&
			absoluteIndex >= activeChangeBlock.start &&
			absoluteIndex <= activeChangeBlock.end;

		return (
			<Text
				key={`${absoluteIndex}-${line.text.slice(0, 8)}`}
				bold={isActiveChangeLine}
				color={line.kind === "added" ? "green" : line.kind === "removed" ? "red" : undefined}
				dimColor={line.kind === "context"}
			>
				{line.text}
			</Text>
		);
	};

	const renderOverviewBlock = (block: DiffChangeBlock, index: number) => {
		const absoluteIndex = overviewRange.start + index;
		const isActive = absoluteIndex === safeActiveChangeIndex;
		const label = truncateText(
			`#${absoluteIndex + 1} +${block.addedLines} -${block.removedLines}`,
			Math.max(10, overviewWidth - 7),
		);

		return (
			<Box key={`${block.start}-${block.end}`}>
				<Text color={isActive ? "cyan" : "magenta"}>{isActive ? "█" : "▏"}</Text>
				<Text color={isActive ? "cyan" : undefined} dimColor={!isActive} bold={isActive}>
					{` ${label}`}
				</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" width="100%" height={height}>
			<Box marginBottom={1}>
				<Text bold>
					{truncateText(
						summary.length ? summary.join(" · ") : "No textual diff detected.",
						Math.max(24, contentWidth),
					)}
				</Text>
			</Box>
			<Box marginBottom={1}>
				<Box flexDirection={compactBadgeLayout ? "column" : "row"}>
					<Text color={focusArea === "patch" ? "cyan" : "magenta"} bold>
						{`[Focus ${focusArea === "patch" ? "PATCH" : "HUNKS"}]`}
					</Text>
					{compactBadgeLayout ? null : <Text> </Text>}
					<Text color={alignMode === "top" ? "yellow" : "green"} bold>
						{`[Align ${alignMode.toUpperCase()}]`}
					</Text>
					{compactBadgeLayout ? null : <Text> </Text>}
					<Text dimColor>{`[Progress ${progressLabel}]`}</Text>
					{jumpInput ? (
						<>
							{compactBadgeLayout ? null : <Text> </Text>}
							<Text color="yellow" bold>{`[Jump #${jumpInput}]`}</Text>
						</>
					) : null}
				</Box>
			</Box>
			<Box flexGrow={1} marginBottom={1}>
				<Box flexGrow={1} paddingRight={1} flexDirection={compactComparePanels ? "column" : "row"}>
					{useMergedComparePanel ? (
						<Panel title="Compare" height={upperHeight} borderColor="yellow">
							<Text>{`O: ${compactOriginalPreview}`}</Text>
							<Text color="green">{`E: ${compactEnhancedPreview}`}</Text>
						</Panel>
					) : compactComparePanels ? (
						<>
							<Panel title="Original" height={primaryCompareHeight} borderColor="yellow">
								<Text>{originalBlock.text}</Text>
								{originalBlock.hiddenLines > 0 ? (
									<Text dimColor>{`\n… (${originalBlock.hiddenLines} more lines)`}</Text>
								) : null}
							</Panel>
							<Panel title="Enhanced" height={secondaryCompareHeight} borderColor="green">
								<Text>{enhancedBlock.text}</Text>
								{enhancedBlock.hiddenLines > 0 ? (
									<Text dimColor>{`\n… (${enhancedBlock.hiddenLines} more lines)`}</Text>
								) : null}
							</Panel>
						</>
					) : (
						<>
							<Box width="50%" paddingRight={1}>
								<Panel title="Original" height={upperHeight} borderColor="yellow">
									<Text>{originalBlock.text}</Text>
									{originalBlock.hiddenLines > 0 ? (
										<Text dimColor>{`\n… (${originalBlock.hiddenLines} more lines)`}</Text>
									) : null}
								</Panel>
							</Box>
							<Box width="50%" paddingLeft={1}>
								<Panel title="Enhanced" height={upperHeight} borderColor="green">
									<Text>{enhancedBlock.text}</Text>
									{enhancedBlock.hiddenLines > 0 ? (
										<Text dimColor>{`\n… (${enhancedBlock.hiddenLines} more lines)`}</Text>
									) : null}
								</Panel>
							</Box>
						</>
					)}
				</Box>
				<Box width={overviewWidth}>
					<Panel
						title="Hunks"
						height={upperHeight}
						borderColor={focusArea === "overview" ? "cyan" : "magenta"}
					>
						{useCompactOverviewPanel ? (
							<>
								<Text dimColor>
									{truncateText(
										`${progressLabel} · +${totalAddedLines} -${totalRemovedLines}`,
										Math.max(10, overviewWidth - 4),
									)}
								</Text>
								<Text color={focusArea === "overview" ? "cyan" : undefined} bold>
									{truncateText(
										activeChangeBlock
											? `#${safeActiveChangeIndex + 1} ${activeChangeBlock.start + 1}-${activeChangeBlock.end + 1}`
											: "No hunks",
										Math.max(10, overviewWidth - 4),
									)}
								</Text>
							</>
						) : (
							<>
								<Text dimColor>
									{truncateText(
										`Hunks ${changeBlocks.length} · ${progressLabel} · +${totalAddedLines} -${totalRemovedLines}`,
										Math.max(12, overviewWidth - 4),
									)}
								</Text>
								<Box>
									<Text color={focusArea === "overview" ? "cyan" : "blue"} bold>
										{`[${focusArea === "overview" ? "HUNKS" : "PATCH"}]`}
									</Text>
									<Text> </Text>
									<Text color={alignMode === "top" ? "yellow" : "green"} bold>
										{`[${alignMode.toUpperCase()}]`}
									</Text>
								</Box>
								<Box>
									<Text color="cyan">{progressBar.filled}</Text>
									<Text dimColor>{progressBar.empty}</Text>
								</Box>
								{changeBlocks.length === 0 ? (
									<Text dimColor>No change blocks.</Text>
								) : (
									visibleChangeBlocks.map(renderOverviewBlock)
								)}
							</>
						)}
					</Panel>
				</Box>
			</Box>
			<Panel
				title="Patch View"
				footer={patchFooter}
				height={lowerHeight}
				borderColor={focusArea === "patch" ? "cyan" : "blue"}
			>
				{visibleDiffLines.length === 0 ? (
					<Text dimColor>No line-level changes to display.</Text>
				) : (
					<Box width="100%">
						<Box flexDirection="column" flexGrow={1} paddingRight={showMinimap ? 1 : 0}>
							{paddedVisibleDiffLines.map(({ key, line }, index) =>
								line ? (
									renderDiffLine(line, index)
								) : (
									<Text key={key} dimColor>
										{" "}
									</Text>
								),
							)}
						</Box>
						{showMinimap ? (
							<Box flexDirection="column" width={3}>
								{minimapRows.map((row) => (
									<Text key={row.key} color={row.color} dimColor={row.dimColor} bold={row.bold}>
										{`${row.char} `}
									</Text>
								))}
							</Box>
						) : null}
					</Box>
				)}
			</Panel>
		</Box>
	);
};

export default DiffView;
