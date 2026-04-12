// Diff computation and colored segment generation

import { diffChars, diffLines } from "diff";
import { wrapText } from "../utils/text";

export interface ColoredSegment {
	text: string;
	added?: boolean;
	removed?: boolean;
}

export interface RenderableDiffLine {
	text: string;
	kind: "added" | "removed" | "context";
}

export interface DiffChangeBlock {
	start: number;
	end: number;
	addedLines: number;
	removedLines: number;
}

export interface DiffModel {
	lines: RenderableDiffLine[];
	changeBlocks: DiffChangeBlock[];
}

export function getDiffLayoutHeights(height: number): {
	upperHeight: number;
	lowerHeight: number;
} {
	const availableHeight = Math.max(12, height - 3);
	const minUpperHeight = 6;
	const minLowerHeight = 6;
	const upperHeight = Math.max(
		minUpperHeight,
		Math.min(
			Math.max(minUpperHeight, availableHeight - minLowerHeight),
			Math.floor(availableHeight * 0.42),
		),
	);
	const lowerHeight = Math.max(minLowerHeight, availableHeight - upperHeight);

	return { upperHeight, lowerHeight };
}

// Compute diff and return colored segments for character-level comparison
export function diffText(oldText: string, newText: string): ColoredSegment[] {
	const changes = diffChars(oldText, newText);

	return changes.map((change) => ({
		text: change.value,
		added: change.added,
		removed: change.removed,
	}));
}

// Compute diff for line-level comparison
export function diffLinesSegments(oldText: string, newText: string): ColoredSegment[] {
	const changes = diffLines(oldText, newText);

	return changes.map((change) => ({
		text: change.value,
		added: change.added,
		removed: change.removed,
	}));
}

export function buildDiffModel(oldText: string, newText: string, maxWidth = 80): DiffModel {
	const changes = diffLines(oldText, newText);
	const lines: RenderableDiffLine[] = [];

	for (const change of changes) {
		const kind = change.added ? "added" : change.removed ? "removed" : "context";
		const prefix = kind === "added" ? "+" : kind === "removed" ? "-" : " ";
		const wrappedLines = wrapText(change.value, Math.max(2, maxWidth - 2));

		for (const line of wrappedLines) {
			lines.push({
				text: `${prefix} ${line}`,
				kind,
			});
		}
	}

	const changeBlocks: DiffChangeBlock[] = [];
	let currentBlock: DiffChangeBlock | null = null;

	for (const [index, line] of lines.entries()) {
		if (line.kind === "context") {
			if (currentBlock) {
				changeBlocks.push(currentBlock);
				currentBlock = null;
			}
			continue;
		}

		if (!currentBlock) {
			currentBlock = {
				start: index,
				end: index,
				addedLines: 0,
				removedLines: 0,
			};
		}

		currentBlock.end = index;

		if (line.kind === "added") {
			currentBlock.addedLines += 1;
		} else if (line.kind === "removed") {
			currentBlock.removedLines += 1;
		}
	}

	if (currentBlock) {
		changeBlocks.push(currentBlock);
	}

	return { lines, changeBlocks };
}

export function buildDiffLines(
	oldText: string,
	newText: string,
	maxWidth = 80,
): RenderableDiffLine[] {
	return buildDiffModel(oldText, newText, maxWidth).lines;
}

export function getActiveChangeBlockIndex(
	changeBlocks: DiffChangeBlock[],
	scrollOffset: number,
): number {
	if (changeBlocks.length === 0) {
		return -1;
	}

	let activeIndex = 0;

	for (const [index, block] of changeBlocks.entries()) {
		if (scrollOffset >= block.start && scrollOffset <= block.end) {
			return index;
		}

		if (scrollOffset >= block.start) {
			activeIndex = index;
		}
	}

	return activeIndex;
}

export function getCenteredChangeBlockOffset(
	changeBlocks: DiffChangeBlock[],
	changeIndex: number,
	visibleLines: number,
	maxScrollOffset: number,
): number | null {
	const block = changeBlocks[changeIndex];
	if (!block) {
		return null;
	}

	const viewportCenter = Math.max(0, Math.floor((Math.max(1, visibleLines) - 1) / 2));
	const blockCenter = Math.floor((block.start + block.end) / 2);

	return Math.max(0, Math.min(maxScrollOffset, blockCenter - viewportCenter));
}

export function getTopAlignedChangeBlockOffset(
	changeBlocks: DiffChangeBlock[],
	changeIndex: number,
	maxScrollOffset: number,
): number | null {
	const block = changeBlocks[changeIndex];
	if (!block) {
		return null;
	}

	return Math.max(0, Math.min(maxScrollOffset, block.start));
}

// Summarize diff changes
export function summarizeDiff(oldText: string, newText: string): string[] {
	const changes = diffChars(oldText, newText);
	const summary: string[] = [];

	let addedCount = 0;
	let removedCount = 0;

	for (const change of changes) {
		if (change.added) addedCount += change.value.length;
		if (change.removed) removedCount += change.value.length;
	}

	if (addedCount > 0) summary.push(`Added ${addedCount} characters`);
	if (removedCount > 0) summary.push(`Removed ${removedCount} characters`);

	return summary;
}
