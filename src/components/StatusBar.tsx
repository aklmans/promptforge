import { Box, Text } from "ink";
import type React from "react";
import type { AppStatus, AppView } from "../types";
import { truncateText } from "../utils/text";

interface StatusBarProps {
	status: AppStatus;
	view: AppView;
	inputFocused?: boolean;
	canEnterInput?: boolean;
	notice?: string | null;
	diffFocusArea?: "patch" | "overview";
	diffAlignMode?: "center" | "top";
	diffJumpInput?: string;
	commandPaletteOpen?: boolean;
	contentWidth?: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
	status,
	view,
	inputFocused = false,
	canEnterInput = false,
	notice,
	diffFocusArea = "patch",
	diffAlignMode = "center",
	diffJumpInput = "",
	commandPaletteOpen = false,
	contentWidth = 100,
}) => {
	const compact = contentWidth < 96;
	const getStatusIcon = (): string => {
		switch (status) {
			case "thinking":
				return "⏳";
			case "streaming":
				return "📡";
			case "done":
				return "✅";
			case "error":
				return "❌";
			default:
				return "⚪";
		}
	};

	const getHints = (): string => {
		if (commandPaletteOpen) {
			return "Type search · ↑↓ select · Enter run · ESC/Ctrl+K close";
		}

		switch (view) {
			case "main":
				return inputFocused
					? "Enter submit · Ctrl+K palette · ESC commands"
					: canEnterInput
						? "i input · : / Ctrl+K palette · h history · d diff"
						: "r new · : / Ctrl+K palette · h history · d diff";
			case "history":
				return inputFocused
					? "Enter apply filter · ESC list mode"
					: ": / Ctrl+K palette · / search · ↑↓ move · Enter select";
			case "provider":
				return inputFocused
					? "Enter apply filter · ESC list mode"
					: ": / Ctrl+K palette · / search · ↑↓ move · PgUp/PgDn";
			case "diff":
				return diffFocusArea === "overview"
					? `: / Ctrl+K palette · Enter top · a ${diffAlignMode} · digits↵ jump`
					: `: / Ctrl+K palette · a ${diffAlignMode} · digits↵ jump · [ ] / n/N`;
			case "feedback":
				return "Enter refine · ESC back";
			case "export":
				return "↑↓ choose format · Enter export · ESC back";
			case "help":
				return "ESC back";
			default:
				return "q quit";
		}
	};

	return (
		<Box width="100%" paddingX={2} borderStyle="round" borderColor="dim">
			{compact ? (
				<Box flexDirection="column">
					<Text>{`${getStatusIcon()} ${status}`}</Text>
					<Text dimColor>
						{truncateText(
							notice ||
								(commandPaletteOpen
									? getHints()
									: diffJumpInput
										? `${getHints()} · jump #${diffJumpInput}`
										: getHints()),
							Math.max(24, contentWidth - 8),
						)}
					</Text>
				</Box>
			) : (
				<Box width="100%" justifyContent="space-between">
					<Text>{`${getStatusIcon()} ${status}`}</Text>
					<Text dimColor>
						{truncateText(
							notice ||
								(commandPaletteOpen
									? getHints()
									: diffJumpInput
										? `${getHints()} · jump #${diffJumpInput}`
										: getHints()),
							Math.max(24, contentWidth - 18),
						)}
					</Text>
				</Box>
			)}
		</Box>
	);
};

export default StatusBar;
