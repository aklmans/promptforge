// Keyboard input handling hook for different app views

import { useInput } from "ink";
import { useCallback } from "react";
import type { AppView } from "../types";

export interface KeymapHandlers {
	onExit?: () => void;
	onReset?: () => void;
	onFeedback?: () => void;
	onDiff?: () => void;
	onHistory?: () => void;
	onSearch?: () => void;
	onCopy?: () => void;
	onSave?: () => void;
	onExport?: () => void;
	onProvider?: () => void;
	onNavigateUp?: () => void;
	onNavigateDown?: () => void;
	onNavigatePrevChange?: () => void;
	onNavigateNextChange?: () => void;
	onToggleDiffFocus?: () => void;
	onToggleDiffAlign?: () => void;
	onAppendDiffJumpDigit?: (digit: string) => void;
	onDeleteDiffJumpDigit?: () => void;
	onPageUp?: () => void;
	onPageDown?: () => void;
	onFirst?: () => void;
	onLast?: () => void;
	onSelect?: () => void;
	onBack?: () => void;
	onEnterInputMode?: () => void;
	onExitInputMode?: () => void;
	onHelp?: () => void;
	onCommandPalette?: () => void;
	onPaletteClose?: () => void;
	onPaletteNavigateUp?: () => void;
	onPaletteNavigateDown?: () => void;
}

interface UseKeymapOptions {
	textInputFocused?: boolean;
	paletteOpen?: boolean;
}

export function useKeymap(
	view: AppView,
	handlers: KeymapHandlers,
	options: UseKeymapOptions = {},
): void {
	const { textInputFocused = false, paletteOpen = false } = options;
	const handleInput = useCallback(
		(
			input: string,
			key: {
				ctrl: boolean;
				escape: boolean;
				upArrow: boolean;
				downArrow: boolean;
				return: boolean;
				backspace?: boolean;
				delete?: boolean;
				pageUp?: boolean;
				pageDown?: boolean;
			},
		) => {
			if (key.ctrl && input === "c") {
				handlers.onExit?.();
				return;
			}

			if (key.ctrl && input === "k") {
				if (paletteOpen) {
					handlers.onPaletteClose?.();
				} else {
					handlers.onCommandPalette?.();
				}
				return;
			}

			if (paletteOpen) {
				if (key.escape) {
					handlers.onPaletteClose?.();
				} else if (key.upArrow) {
					handlers.onPaletteNavigateUp?.();
				} else if (key.downArrow) {
					handlers.onPaletteNavigateDown?.();
				}
				return;
			}

			if (textInputFocused) {
				if (view === "feedback" && key.escape) {
					handlers.onBack?.();
				} else if (key.escape) {
					handlers.onExitInputMode?.();
				}
				return;
			}

			if (input === "?") {
				handlers.onHelp?.();
				return;
			}

			if (input === ":") {
				handlers.onCommandPalette?.();
				return;
			}

			if (input === "q") {
				handlers.onExit?.();
				return;
			}

			if (view === "main" && input === "i") {
				handlers.onEnterInputMode?.();
				return;
			}

			if (input === "h") {
				handlers.onHistory?.();
				return;
			}

			if (input === "d") {
				handlers.onDiff?.();
				return;
			}

			if (input === "m") {
				handlers.onProvider?.();
				return;
			}

			if (view === "diff" && (input === "[" || input === "N")) {
				handlers.onNavigatePrevChange?.();
				return;
			}

			if (view === "diff" && (input === "]" || input === "n")) {
				handlers.onNavigateNextChange?.();
				return;
			}

			if (view === "diff" && input === "\t") {
				handlers.onToggleDiffFocus?.();
				return;
			}

			if (view === "diff" && input === "a") {
				handlers.onToggleDiffAlign?.();
				return;
			}

			if (view === "diff" && /^[0-9]$/.test(input)) {
				handlers.onAppendDiffJumpDigit?.(input);
				return;
			}

			if (view === "diff" && (key.backspace || key.delete)) {
				handlers.onDeleteDiffJumpDigit?.();
				return;
			}

			if ((view === "history" || view === "provider") && input === "/") {
				handlers.onSearch?.();
				return;
			}

			if (input === "c") {
				handlers.onCopy?.();
				return;
			}

			if (input === "x") {
				handlers.onExport?.();
				return;
			}

			if (input === "f") {
				handlers.onFeedback?.();
				return;
			}

			if (input === "r") {
				handlers.onReset?.();
				return;
			}

			switch (view) {
				case "main":
					if (input === "s") handlers.onSave?.();
					break;

				case "history":
				case "diff":
				case "provider":
				case "feedback":
				case "help":
					if (key.escape) handlers.onBack?.();
					else if (input === "g") handlers.onFirst?.();
					else if (input === "G") handlers.onLast?.();
					else if (key.pageUp) handlers.onPageUp?.();
					else if (key.pageDown) handlers.onPageDown?.();
					else if (key.upArrow || input === "k") handlers.onNavigateUp?.();
					else if (key.downArrow || input === "j") handlers.onNavigateDown?.();
					else if (key.return) handlers.onSelect?.();
					break;
			}
		},
		[view, handlers, paletteOpen, textInputFocused],
	);

	useInput(handleInput);
}
