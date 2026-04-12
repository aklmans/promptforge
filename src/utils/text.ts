const WIDE_CODEPOINT_RANGES: Array<[number, number]> = [
	[0x1100, 0x115f],
	[0x2329, 0x232a],
	[0x2e80, 0xa4cf],
	[0xac00, 0xd7a3],
	[0xf900, 0xfaff],
	[0xfe10, 0xfe19],
	[0xfe30, 0xfe6f],
	[0xff00, 0xff60],
	[0xffe0, 0xffe6],
	[0x1f300, 0x1f64f],
	[0x1f900, 0x1f9ff],
	[0x20000, 0x3fffd],
];

function isWideCodePoint(codePoint: number): boolean {
	return WIDE_CODEPOINT_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

export function charDisplayWidth(character: string): number {
	const codePoint = character.codePointAt(0);
	if (!codePoint) {
		return 0;
	}

	if (character === "\t") {
		return 2;
	}

	if (codePoint < 32 || (codePoint >= 0x7f && codePoint < 0xa0)) {
		return 0;
	}

	return isWideCodePoint(codePoint) ? 2 : 1;
}

export function stringDisplayWidth(text: string): number {
	let width = 0;

	for (const character of Array.from(text)) {
		width += charDisplayWidth(character);
	}

	return width;
}

export function truncateText(text: string, maxWidth: number, suffix = "…"): string {
	if (maxWidth <= 0) {
		return "";
	}

	if (stringDisplayWidth(text) <= maxWidth) {
		return text;
	}

	const suffixWidth = Math.min(stringDisplayWidth(suffix), maxWidth);
	let width = 0;
	let output = "";

	for (const character of Array.from(text)) {
		const characterWidth = Math.max(1, charDisplayWidth(character));
		if (width + characterWidth + suffixWidth > maxWidth) {
			break;
		}

		output += character;
		width += characterWidth;
	}

	return `${output}${suffix.slice(0, suffixWidth)}`;
}

export function wrapText(text: string, maxWidth: number): string[] {
	const width = Math.max(1, maxWidth);
	const normalized = text.replace(/\r\n/g, "\n");
	const lines: string[] = [];

	for (const sourceLine of normalized.split("\n")) {
		if (sourceLine.length === 0) {
			lines.push("");
			continue;
		}

		let currentLine = "";
		let currentWidth = 0;

		for (const character of Array.from(sourceLine)) {
			const characterWidth = Math.max(1, charDisplayWidth(character));

			if (currentLine && currentWidth + characterWidth > width) {
				lines.push(currentLine);
				currentLine = character;
				currentWidth = characterWidth;
				continue;
			}

			currentLine += character;
			currentWidth += characterWidth;
		}

		lines.push(currentLine);
	}

	return lines;
}

export function fitTextBlock(
	text: string,
	options: { maxWidth: number; maxLines: number },
): { text: string; hiddenLines: number; totalLines: number } {
	const wrappedLines = wrapText(text, options.maxWidth);
	const maxLines = Math.max(1, options.maxLines);

	if (wrappedLines.length <= maxLines) {
		return {
			text: wrappedLines.join("\n"),
			hiddenLines: 0,
			totalLines: wrappedLines.length,
		};
	}

	return {
		text: wrappedLines.slice(0, maxLines).join("\n"),
		hiddenLines: wrappedLines.length - maxLines,
		totalLines: wrappedLines.length,
	};
}

export function getWindowRange(
	total: number,
	selectedIndex: number,
	visibleCount: number,
): { start: number; end: number } {
	if (total <= 0) {
		return { start: 0, end: 0 };
	}

	if (total <= visibleCount) {
		return { start: 0, end: total };
	}

	const clampedSelectedIndex = Math.max(0, Math.min(selectedIndex, total - 1));
	const halfWindow = Math.floor(visibleCount / 2);
	const start = Math.max(0, Math.min(clampedSelectedIndex - halfWindow, total - visibleCount));

	return {
		start,
		end: Math.min(total, start + visibleCount),
	};
}
