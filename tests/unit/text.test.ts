import { describe, expect, it } from "vitest";
import {
	fitTextBlock,
	getWindowRange,
	stringDisplayWidth,
	truncateText,
} from "../../src/utils/text";

describe("text utilities", () => {
	it("accounts for wide CJK characters", () => {
		expect(stringDisplayWidth("你好")).toBe(4);
		expect(stringDisplayWidth("hello")).toBe(5);
	});

	it("truncates by display width", () => {
		expect(truncateText("你好世界", 5)).toBe("你好…");
		expect(truncateText("short", 10)).toBe("short");
	});

	it("fits wrapped text blocks and reports hidden lines", () => {
		const fitted = fitTextBlock("one two three four", {
			maxWidth: 7,
			maxLines: 2,
		});

		expect(fitted.text.split("\n")).toHaveLength(2);
		expect(fitted.hiddenLines).toBeGreaterThan(0);
	});

	it("centers selected indexes in a bounded window", () => {
		expect(getWindowRange(10, 5, 3)).toEqual({ start: 4, end: 7 });
		expect(getWindowRange(2, 1, 5)).toEqual({ start: 0, end: 2 });
		expect(getWindowRange(0, 0, 5)).toEqual({ start: 0, end: 0 });
	});
});
