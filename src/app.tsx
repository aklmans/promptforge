// Root Ink application component managing app state and routing

import { randomUUID } from "node:crypto";
import Fuse from "fuse.js";
import { Box, Text, useStdout } from "ink";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import CommandPalette, { type CommandPaletteItem } from "./components/CommandPalette";
import DiffView from "./components/DiffView";
import ExportPicker from "./components/ExportPicker";
import FeedbackForm from "./components/FeedbackForm";
import Header from "./components/Header";
import HelpView from "./components/HelpView";
import HistoryList from "./components/HistoryList";
import OnboardingWizard from "./components/OnboardingWizard";
import Panel from "./components/Panel";
import PromptInput from "./components/PromptInput";
import PromptPanel from "./components/PromptPanel";
import ProviderPicker from "./components/ProviderPicker";
import StatusBar from "./components/StatusBar";
import { getConfigPath, loadConfigWithPath, resolveProviderModel, saveConfig } from "./config";
import { useHistory } from "./hooks/useHistory";
import { useKeymap } from "./hooks/useKeymap";
import { useOptimizer } from "./hooks/useOptimizer";
import {
	buildDiffModel,
	getActiveChangeBlockIndex,
	getCenteredChangeBlockOffset,
	getDiffLayoutHeights,
	getTopAlignedChangeBlockOffset,
} from "./services/differ";
import {
	EXPORT_FORMATS,
	EXPORT_FORMAT_DESCRIPTIONS,
	EXPORT_FORMAT_LABELS,
	type ExportFormat,
	buildExportOutputPath,
	exportEntry,
	renderEntry,
} from "./services/exporter";
import type { AppConfig, AppView, EnhanceResult, HistoryEntry } from "./types";
import { truncateText } from "./utils/text";

function splitHeights(
	totalHeight: number,
	preferredFirstHeight: number,
	minFirstHeight = 1,
	minSecondHeight = 1,
	gap = 1,
): { first: number; second: number } {
	const availableHeight = Math.max(2, totalHeight - gap);
	const safeMinFirstHeight =
		minFirstHeight + minSecondHeight <= availableHeight ? minFirstHeight : 1;
	const safeMinSecondHeight =
		minFirstHeight + minSecondHeight <= availableHeight ? minSecondHeight : 1;

	let first = Math.max(1, Math.min(preferredFirstHeight, availableHeight - 1));
	let second = availableHeight - first;

	if (first < safeMinFirstHeight) {
		first = safeMinFirstHeight;
		second = availableHeight - first;
	}

	if (second < safeMinSecondHeight) {
		second = safeMinSecondHeight;
		first = availableHeight - second;
	}

	return { first, second };
}

const App: React.FC = () => {
	const { stdout } = useStdout();
	const columns = stdout.columns ?? 100;
	const rows = stdout.rows ?? 30;
	const useCompactChrome = columns < 96;
	const headerHeight = useCompactChrome ? 4 : 3;
	const statusBarHeight = useCompactChrome ? 4 : 3;
	const contentFrameHeight = 2;
	const contentHeight = Math.max(1, rows - headerHeight - statusBarHeight - contentFrameHeight);
	const isWideLayout = columns >= 112;
	const isStackedLayout = columns >= 84 && columns < 112;
	const isNarrowLayout = columns < 84;
	const useWideSidePanels = isWideLayout;
	const useDualBottomPanels = !isNarrowLayout;
	const sideWidth = columns >= 120 ? 40 : columns >= 100 ? 36 : columns >= 84 ? 30 : 26;
	const mainPanelWidth = Math.max(32, columns - sideWidth - 6);
	const sidePanelWidth = Math.max(18, sideWidth - 4);
	const fullPanelWidth = Math.max(30, columns - 8);
	const fullContentWidth = Math.max(22, fullPanelWidth - 4);
	const splitPanelWidth = Math.max(18, Math.floor((fullPanelWidth - 6) / 2));

	const [view, setView] = useState<AppView>("main");
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [configPath, setConfigPath] = useState<string>(getConfigPath());
	const [loading, setLoading] = useState(true);
	const [inputActive, setInputActive] = useState(true);
	const [mainInputFocused, setMainInputFocused] = useState(true);
	const [historySelectionIndex, setHistorySelectionIndex] = useState(0);
	const [providerSelectionIndex, setProviderSelectionIndex] = useState(0);
	const [originalPrompt, setOriginalPrompt] = useState("");
	const [notice, setNotice] = useState<string | null>(null);
	const [diffScrollOffset, setDiffScrollOffset] = useState(0);
	const [diffFocusArea, setDiffFocusArea] = useState<"patch" | "overview">("patch");
	const [diffAlignMode, setDiffAlignMode] = useState<"center" | "top">("center");
	const [diffJumpInput, setDiffJumpInput] = useState("");
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
	const [commandPaletteQuery, setCommandPaletteQuery] = useState("");
	const [commandPaletteIndex, setCommandPaletteIndex] = useState(0);
	const [historySearchQuery, setHistorySearchQuery] = useState("");
	const [historySearchFocused, setHistorySearchFocused] = useState(false);
	const [providerSearchQuery, setProviderSearchQuery] = useState("");
	const [providerSearchFocused, setProviderSearchFocused] = useState(false);
	const [exportSelectionIndex, setExportSelectionIndex] = useState(0);
	const [exportReturnView, setExportReturnView] = useState<AppView>("main");
	const [exportTimestamp, setExportTimestamp] = useState(() => Date.now());

	const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const optimizer = useOptimizer();
	const history = useHistory();
	const commandPaletteHeight = Math.max(9, Math.min(14, Math.floor(contentHeight * 0.42)));
	const viewportHeight = contentHeight;
	const stackedHeight = Math.max(7, Math.floor((viewportHeight - 1) / 2));

	const providerNames = config ? Object.keys(config.providers) : [];
	const filteredProviderNames = useMemo(() => {
		const query = providerSearchQuery.trim();
		if (!config || !query) {
			return providerNames;
		}

		const providerEntries = providerNames.map((name) => ({
			name,
			baseURL: config.providers[name]?.baseURL ?? "",
			defaultModel: config.providers[name]?.defaultModel ?? "",
			models: config.providers[name]?.models ?? [],
		}));

		const fuse = new Fuse(providerEntries, {
			includeScore: true,
			threshold: 0.35,
			keys: ["name", "baseURL", "defaultModel", "models"],
		});

		return fuse.search(query).map((result) => result.item.name);
	}, [config, providerNames, providerSearchQuery]);
	const selectedProviderName =
		filteredProviderNames[providerSelectionIndex] ||
		(view === "provider" ? "" : config?.defaultProvider || "");
	const selectedProviderConfig = selectedProviderName
		? config?.providers[selectedProviderName]
		: undefined;
	const filteredHistoryEntries = useMemo(() => {
		const query = historySearchQuery.trim();
		if (!query) {
			return history.entries;
		}

		const fuse = new Fuse(history.entries, {
			includeScore: true,
			threshold: 0.35,
			keys: [
				"original",
				"enhanced",
				"provider",
				"model",
				"tags",
				"result.changes",
				"result.metadata.compressionNote",
			],
		});

		return fuse.search(query).map((result) => result.item);
	}, [history.entries, historySearchQuery]);
	const selectedHistoryEntry = filteredHistoryEntries[historySelectionIndex] ?? null;
	const activeEntry =
		view === "history" || (view === "export" && exportReturnView === "history")
			? selectedHistoryEntry
			: history.current;
	const currentResult = activeEntry?.result || optimizer.result;
	const currentProviderName = config?.defaultProvider || "openai";
	const currentProviderConfig = config?.providers[currentProviderName];
	const currentModel = resolveProviderModel(
		{ defaultModel: config?.defaultModel },
		currentProviderConfig,
	);
	const isTextInputFocused =
		(view === "main" && inputActive && mainInputFocused) ||
		view === "feedback" ||
		(view === "history" && historySearchFocused) ||
		(view === "provider" && providerSearchFocused);
	const diffSourceOriginal = activeEntry?.original || originalPrompt || "";
	const diffSourceEnhanced = activeEntry?.enhanced || currentResult?.enhanced || "";
	const diffShowMinimap = fullPanelWidth >= 72;
	const diffWrapWidth = Math.max(18, fullPanelWidth - (diffShowMinimap ? 8 : 4));
	const diffModel = useMemo(
		() => buildDiffModel(diffSourceOriginal, diffSourceEnhanced, diffWrapWidth),
		[diffSourceEnhanced, diffSourceOriginal, diffWrapWidth],
	);
	const diffLines = diffModel.lines;
	const diffChangeBlocks = diffModel.changeBlocks;
	const { upperHeight: diffUpperHeight, lowerHeight: diffLowerHeight } =
		getDiffLayoutHeights(viewportHeight);
	const visibleDiffLines = Math.max(3, diffLowerHeight - 3);
	const diffOverviewPageSize = Math.max(1, diffUpperHeight - 6);
	const maxDiffScrollOffset = Math.max(0, diffLines.length - visibleDiffLines);
	const safeDiffScrollOffset = Math.min(diffScrollOffset, maxDiffScrollOffset);
	const activeDiffChangeIndex = useMemo(
		() => getActiveChangeBlockIndex(diffChangeBlocks, safeDiffScrollOffset),
		[diffChangeBlocks, safeDiffScrollOffset],
	);
	const historyPageSize = Math.max(1, Math.floor((viewportHeight - 7) / 3));
	const providerPageSize = Math.max(1, Math.floor((viewportHeight - 4) / 2));
	const currentExportFormat = EXPORT_FORMATS[exportSelectionIndex] ?? EXPORT_FORMATS[0];
	const currentExportPath = activeEntry
		? buildExportOutputPath(activeEntry, currentExportFormat, process.cwd(), exportTimestamp)
		: "";
	const exportPreview = activeEntry ? renderEntry(activeEntry, currentExportFormat) : "";

	const focusDiffChangeBlock = (
		changeIndex: number,
		alignMode: "center" | "top" = diffAlignMode,
	) => {
		const nextOffset =
			alignMode === "top"
				? getTopAlignedChangeBlockOffset(diffChangeBlocks, changeIndex, maxDiffScrollOffset)
				: getCenteredChangeBlockOffset(
						diffChangeBlocks,
						changeIndex,
						visibleDiffLines,
						maxDiffScrollOffset,
					);
		if (nextOffset !== null) {
			setDiffScrollOffset(nextOffset);
		}
	};

	useEffect(() => {
		loadConfigWithPath().then((loaded) => {
			setConfig(loaded?.config ?? null);
			if (loaded?.path) {
				setConfigPath(loaded.path);
			}
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (history.currentIndex !== historySelectionIndex && view !== "history") {
			setHistorySelectionIndex(history.currentIndex);
		}
	}, [history.currentIndex, historySelectionIndex, view]);

	useEffect(() => {
		setHistorySelectionIndex((previousIndex) =>
			Math.min(previousIndex, Math.max(filteredHistoryEntries.length - 1, 0)),
		);
	}, [filteredHistoryEntries.length]);

	useEffect(() => {
		setProviderSelectionIndex((previousIndex) =>
			Math.min(previousIndex, Math.max(filteredProviderNames.length - 1, 0)),
		);
	}, [filteredProviderNames.length]);

	useEffect(() => {
		setDiffScrollOffset((previousOffset) => Math.min(previousOffset, maxDiffScrollOffset));
	}, [maxDiffScrollOffset]);

	useEffect(() => {
		if (view !== "diff" && diffJumpInput) {
			setDiffJumpInput("");
		}
	}, [diffJumpInput, view]);

	useEffect(() => {
		return () => {
			if (noticeTimer.current) {
				clearTimeout(noticeTimer.current);
			}
		};
	}, []);

	const flashNotice = (message: string) => {
		setNotice(message);
		if (noticeTimer.current) {
			clearTimeout(noticeTimer.current);
		}
		noticeTimer.current = setTimeout(() => {
			setNotice(null);
			noticeTimer.current = null;
		}, 2600);
	};

	const openCommandPalette = () => {
		setCommandPaletteQuery("");
		setCommandPaletteIndex(0);
		setCommandPaletteOpen(true);
	};

	const closeCommandPalette = () => {
		setCommandPaletteOpen(false);
		setCommandPaletteQuery("");
		setCommandPaletteIndex(0);
	};

	const handleConfigChange = async (nextConfig: AppConfig) => {
		const previousConfig = config;
		setConfig(nextConfig);
		try {
			await saveConfig(nextConfig, configPath);
		} catch (error) {
			setConfig(previousConfig);
			const message = error instanceof Error ? error.message : String(error);
			flashNotice(`Config save failed: ${message}`);
			return;
		}
		flashNotice(`Switched to ${nextConfig.defaultProvider}/${nextConfig.defaultModel}`);
	};

	const applyDiffJump = () => {
		if (!diffJumpInput) {
			return false;
		}

		if (diffChangeBlocks.length === 0) {
			setDiffJumpInput("");
			flashNotice("No hunks to jump to");
			return true;
		}

		const target = Number.parseInt(diffJumpInput, 10);
		setDiffJumpInput("");

		if (!Number.isFinite(target) || target < 1 || target > diffChangeBlocks.length) {
			flashNotice(`Hunk ${diffJumpInput}/${diffChangeBlocks.length} not found`);
			return true;
		}

		focusDiffChangeBlock(target - 1);
		flashNotice(`Jumped to hunk ${target}/${diffChangeBlocks.length}`);
		return true;
	};

	const commandPaletteCommands = useMemo(() => {
		const commands: Array<CommandPaletteItem & { action: string; keywords: string[] }> = [
			{
				id: "open-history",
				title: view === "history" ? "Close History" : "Open History",
				description:
					view === "history"
						? "Leave history view and return to the main workspace."
						: "Browse saved prompt revisions and inspect details.",
				shortcut: "h",
				group: "Navigation",
				action: "open-history",
				keywords: ["history", "revisions", "records"],
			},
			{
				id: "open-provider",
				title: view === "provider" ? "Close Providers" : "Open Providers",
				description:
					view === "provider"
						? "Leave provider view and return to the main workspace."
						: "Search providers and switch the active provider/model.",
				shortcut: "m",
				group: "Navigation",
				action: "open-provider",
				keywords: ["provider", "model", "config"],
			},
			{
				id: "open-help",
				title: view === "help" ? "Close Help" : "Open Help",
				description:
					view === "help"
						? "Hide the shortcut reference panel."
						: "Show the shortcut reference panel.",
				shortcut: "?",
				group: "Navigation",
				action: "open-help",
				keywords: ["help", "shortcuts", "docs"],
			},
			{
				id: "new-prompt",
				title: "New Prompt",
				description: "Reset the current session and start a fresh prompt.",
				shortcut: "r",
				group: "Actions",
				action: "reset",
				keywords: ["reset", "new", "clear"],
			},
		];

		if (view !== "main") {
			commands.unshift({
				id: "go-main",
				title: "Go to Main",
				description: "Return to the main workspace.",
				shortcut: "ESC",
				group: "Navigation",
				action: "go-main",
				keywords: ["main", "home", "back"],
			});
		}

		if (view === "main" && inputActive && !mainInputFocused) {
			commands.unshift({
				id: "focus-input",
				title: "Focus Prompt Input",
				description: "Switch from command mode back to the main prompt editor.",
				shortcut: "i",
				group: "Navigation",
				action: "focus-input",
				keywords: ["input", "editor", "insert"],
			});
		}

		if (activeEntry && view !== "diff") {
			commands.push(
				{
					id: "open-diff",
					title: "Open Diff",
					description: "Compare the original prompt with the enhanced result.",
					shortcut: "d",
					group: "Actions",
					action: "open-diff",
					keywords: ["diff", "compare", "changes"],
				},
				{
					id: "refine-current",
					title: "Refine Current Result",
					description: "Open feedback mode and continue iterating on the current revision.",
					shortcut: "f",
					group: "Actions",
					action: "refine-current",
					keywords: ["refine", "feedback", "iterate"],
				},
				{
					id: "copy-current",
					title: "Copy Current Result",
					description: "Copy the current enhanced prompt to the clipboard.",
					shortcut: "c",
					group: "Actions",
					action: "copy-current",
					keywords: ["copy", "clipboard", "export"],
				},
				{
					id: "export-current",
					title: "Open Export Picker",
					description: "Open the export picker and save the active revision in the chosen format.",
					shortcut: "x",
					group: "Actions",
					action: "export-current",
					keywords: ["export", "markdown", "text", "json", "yaml", "file"],
				},
				{
					id: "export-md",
					title: "Export as Markdown",
					description: "Export the active revision as a Markdown report.",
					shortcut: "x then Enter",
					group: "Export",
					action: "export-md",
					keywords: ["export", "markdown", "md"],
				},
				{
					id: "export-txt",
					title: "Export as Plain Text",
					description: "Export the active revision as plain text.",
					shortcut: "x then ↓",
					group: "Export",
					action: "export-txt",
					keywords: ["export", "text", "txt"],
				},
				{
					id: "export-json",
					title: "Export as JSON",
					description: "Export the active revision with full metadata as JSON.",
					shortcut: "x then ↓↓",
					group: "Export",
					action: "export-json",
					keywords: ["export", "json", "metadata"],
				},
				{
					id: "export-yaml",
					title: "Export as YAML",
					description: "Export the active revision as a YAML workflow template.",
					shortcut: "x then ↓↓↓",
					group: "Export",
					action: "export-yaml",
					keywords: ["export", "yaml", "template"],
				},
			);
		}

		if (view === "diff") {
			commands.push(
				{
					id: "toggle-diff-focus",
					title: diffFocusArea === "patch" ? "Focus Hunks Overview" : "Focus Patch View",
					description: "Switch the active Diff pane between patch content and hunk overview.",
					shortcut: "Tab",
					group: "Diff",
					action: "toggle-diff-focus",
					keywords: ["diff", "focus", "overview", "patch"],
				},
				{
					id: "toggle-diff-align",
					title: diffAlignMode === "center" ? "Use Top Align" : "Use Center Align",
					description: "Change how hunk navigation positions the selected change block.",
					shortcut: "a",
					group: "Diff",
					action: "toggle-diff-align",
					keywords: ["diff", "align", "center", "top"],
				},
			);

			if (diffChangeBlocks.length > 0) {
				commands.push(
					{
						id: "diff-prev-hunk",
						title: "Previous Hunk",
						description: "Jump to the previous change block in the diff.",
						shortcut: "N / [",
						group: "Diff",
						action: "diff-prev-hunk",
						keywords: ["diff", "prev", "previous", "hunk"],
					},
					{
						id: "diff-next-hunk",
						title: "Next Hunk",
						description: "Jump to the next change block in the diff.",
						shortcut: "n / ]",
						group: "Diff",
						action: "diff-next-hunk",
						keywords: ["diff", "next", "hunk"],
					},
					{
						id: "diff-first-hunk",
						title: "First Hunk",
						description: "Jump to the first change block in the diff.",
						shortcut: "g",
						group: "Diff",
						action: "diff-first-hunk",
						keywords: ["diff", "first", "start", "hunk"],
					},
					{
						id: "diff-last-hunk",
						title: "Last Hunk",
						description: "Jump to the last change block in the diff.",
						shortcut: "G",
						group: "Diff",
						action: "diff-last-hunk",
						keywords: ["diff", "last", "end", "hunk"],
					},
				);
			}
		}

		return commands;
	}, [
		activeEntry,
		diffAlignMode,
		diffChangeBlocks.length,
		diffFocusArea,
		inputActive,
		mainInputFocused,
		view,
	]);

	const filteredCommandPaletteCommands = useMemo(() => {
		const query = commandPaletteQuery.trim();
		if (!query) {
			return commandPaletteCommands;
		}

		const fuse = new Fuse(commandPaletteCommands, {
			includeScore: true,
			threshold: 0.35,
			keys: ["title", "description", "shortcut", "group", "keywords"],
		});

		return fuse.search(query).map((result) => result.item);
	}, [commandPaletteCommands, commandPaletteQuery]);

	const selectedCommandPaletteCommand = filteredCommandPaletteCommands[commandPaletteIndex] ?? null;

	useEffect(() => {
		setCommandPaletteIndex((previousIndex) =>
			Math.min(previousIndex, Math.max(filteredCommandPaletteCommands.length - 1, 0)),
		);
	}, [filteredCommandPaletteCommands.length]);

	const createHistoryEntry = (
		original: string,
		result: EnhanceResult,
		provider: string,
		model: string,
		version?: number,
	): HistoryEntry => ({
		id: randomUUID(),
		timestamp: new Date().toISOString(),
		original,
		enhanced: result.enhanced,
		result,
		provider,
		model,
		version: version ?? (history.entries[0]?.version ?? 0) + 1,
		pinned: false,
		tags: [],
	});

	const handleCopyCurrent = async () => {
		const textToCopy =
			optimizer.streamingText || activeEntry?.enhanced || currentResult?.enhanced || "";

		if (!textToCopy.trim()) {
			flashNotice("Nothing to copy yet");
			return;
		}

		try {
			const { default: clipboard } = await import("clipboardy");
			await clipboard.write(textToCopy);
			flashNotice("Copied current result");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			flashNotice(`Copy failed: ${message}`);
		}
	};

	const handleExportCurrent = async () => {
		openExportView();
	};

	const openExportView = () => {
		if (!activeEntry) {
			flashNotice("Run an enhancement before exporting");
			return;
		}

		setExportSelectionIndex(0);
		setExportTimestamp(Date.now());
		setExportReturnView(view === "export" ? "main" : view);
		setView("export");
	};

	const handleExportCurrentAs = async (format: ExportFormat) => {
		if (!activeEntry) {
			flashNotice("Run an enhancement before exporting");
			return;
		}

		try {
			const outputPath = buildExportOutputPath(activeEntry, format, process.cwd(), exportTimestamp);
			await exportEntry(activeEntry, format, outputPath);
			setView(exportReturnView === "export" ? "main" : exportReturnView);
			flashNotice(`Exported ${outputPath}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			flashNotice(`Export failed: ${message}`);
		}
	};

	const handleSubmitPrompt = async (text: string) => {
		const normalizedText = text.replace(/\r/g, "").trim();
		if (!config || !normalizedText) return;

		const provider = config.providers[config.defaultProvider];
		if (!provider) {
			optimizer.reset();
			return;
		}

		setInputActive(false);
		setMainInputFocused(false);
		setOriginalPrompt(normalizedText);
		setNotice(null);
		setDiffScrollOffset(0);

		const modelId = resolveProviderModel(config, provider);
		const result = await optimizer.enhance(normalizedText, {
			level: config.defaultLevel,
			baseURL: provider.baseURL,
			model: modelId,
			apiKey: provider.apiKey,
		});

		if (result) {
			history.push(createHistoryEntry(normalizedText, result, config.defaultProvider, modelId));
			setHistorySelectionIndex(0);
			flashNotice("Saved revision to history");
		}
	};

	const handleSubmitFeedback = async (feedback: string) => {
		const normalizedFeedback = feedback.replace(/\r/g, "").trim();
		if (!config || !normalizedFeedback || !activeEntry) return;

		const provider = config.providers[config.defaultProvider];
		if (!provider) return;

		setView("main");
		setNotice(null);
		setDiffScrollOffset(0);

		const modelId = resolveProviderModel(config, provider);
		const { getIterativePrompt } = await import("./prompts/system");
		const iterativePrompt = getIterativePrompt(
			activeEntry.original,
			activeEntry.enhanced,
			normalizedFeedback,
			activeEntry.version + 1,
		);
		const result = await optimizer.enhance(iterativePrompt, {
			level: config.defaultLevel,
			baseURL: provider.baseURL,
			model: modelId,
			apiKey: provider.apiKey,
		});

		if (result) {
			history.push(
				createHistoryEntry(
					activeEntry.original,
					result,
					config.defaultProvider,
					modelId,
					activeEntry.version + 1,
				),
			);
			setHistorySelectionIndex(0);
			flashNotice("Created refined revision");
		}
	};

	const mainInspectorText = useMemo(() => {
		const lines = [
			`provider: ${truncateText(currentProviderName, sidePanelWidth - 10)}`,
			`model: ${truncateText(currentModel, sidePanelWidth - 7)}`,
			`level: ${config?.defaultLevel || "standard"}`,
			`history: ${history.entries.length}`,
			"",
		];

		if (activeEntry) {
			lines.push(
				`latest: v${activeEntry.version}`,
				`score: ${activeEntry.result.score.overall}/100`,
				`changes: ${activeEntry.result.changes.length}`,
				`tokens: ${activeEntry.result.metadata.originalTokens} → ${activeEntry.result.metadata.enhancedTokens}`,
				"",
				"Top changes:",
				...(activeEntry.result.changes
					.slice(0, 4)
					.map((change) => `- ${truncateText(change, sidePanelWidth - 2)}`) || []),
			);
		} else {
			lines.push(
				"Type a prompt on the left.",
				"Use ESC to enter command mode.",
				"Open history, diff, help, or",
				"switch provider without leaving the app.",
			);
		}

		return lines.join("\n");
	}, [
		activeEntry,
		config?.defaultLevel,
		currentModel,
		currentProviderName,
		history.entries.length,
		sidePanelWidth,
	]);

	const shortcutText = useMemo(() => {
		if (view === "main" && inputActive && mainInputFocused) {
			return [
				"Enter submit",
				"Ctrl+K palette",
				"ESC commands",
				"Ctrl+C quit",
				"",
				"Command mode:",
				": palette · h history",
				"d diff · f refine",
				"? help · q quit",
			].join("\n");
		}

		if (view === "main" && inputActive && !mainInputFocused) {
			return [
				"i return to input",
				": / Ctrl+K palette",
				"d diff · m provider",
				"? help · q quit",
			].join("\n");
		}

		return [
			"r new prompt",
			": / Ctrl+K palette",
			"d diff · m provider",
			"f refine · c copy",
			"c copy · x export",
			"j/k or ↑↓ navigate",
			"? help · q quit",
		].join("\n");
	}, [inputActive, mainInputFocused, view]);

	const historyDetailsText = useMemo(() => {
		if (!selectedHistoryEntry) {
			return history.loaded
				? "Select a revision to inspect details."
				: "Loading history from disk...";
		}

		return [
			`version: v${selectedHistoryEntry.version}`,
			`provider: ${selectedHistoryEntry.provider}/${selectedHistoryEntry.model}`,
			`time: ${new Date(selectedHistoryEntry.timestamp).toLocaleString()}`,
			`score: ${selectedHistoryEntry.result.score.overall}/100`,
			"",
			"Original:",
			selectedHistoryEntry.original,
		].join("\n");
	}, [history.loaded, selectedHistoryEntry]);

	const providerDetailsText = useMemo(() => {
		if (!selectedProviderConfig) {
			return "No provider selected.";
		}

		return [
			`name: ${selectedProviderName}`,
			`baseURL: ${selectedProviderConfig.baseURL}`,
			`default model: ${selectedProviderConfig.defaultModel || "gpt-4o"}`,
			`api key: ${selectedProviderConfig.apiKey ? "configured" : "missing"}`,
			"",
			selectedProviderConfig.models?.length
				? `available models:\n- ${selectedProviderConfig.models.join("\n- ")}`
				: "available models:\n- not declared",
		].join("\n");
	}, [selectedProviderConfig, selectedProviderName]);
	const exportDetailsText = useMemo(() => {
		if (!activeEntry) {
			return "No active revision selected.";
		}

		return [
			`format: ${currentExportFormat}`,
			`label: ${EXPORT_FORMAT_LABELS[currentExportFormat]}`,
			`path: ${currentExportPath}`,
			"",
			EXPORT_FORMAT_DESCRIPTIONS[currentExportFormat],
		].join("\n");
	}, [activeEntry, currentExportFormat, currentExportPath]);

	const keymapHandlers = {
		onExit: () => process.exit(0),
		onReset: () => {
			optimizer.reset();
			setView("main");
			setInputActive(true);
			setMainInputFocused(true);
			setOriginalPrompt("");
			setDiffScrollOffset(0);
			setDiffFocusArea("patch");
			setDiffAlignMode("center");
			setDiffJumpInput("");
			setHistorySearchFocused(false);
			setProviderSearchFocused(false);
			flashNotice("Ready for a new prompt");
		},
		onFeedback: () => {
			if (!activeEntry) {
				flashNotice("Generate a prompt before refining");
				return;
			}
			setView("feedback");
		},
		onDiff: () => {
			if (!activeEntry) {
				flashNotice("Generate a prompt before opening diff");
				return;
			}
			setDiffScrollOffset(0);
			setDiffFocusArea("patch");
			setDiffJumpInput("");
			setView(view === "diff" ? "main" : "diff");
		},
		onHistory: () => {
			const currentEntryId = history.current?.id;
			const matchedIndex = currentEntryId
				? filteredHistoryEntries.findIndex((entry) => entry.id === currentEntryId)
				: -1;
			setHistorySelectionIndex(matchedIndex >= 0 ? matchedIndex : 0);
			setHistorySearchFocused(false);
			setView(view === "history" ? "main" : "history");
		},
		onSearch: () => {
			if (view === "history") {
				setHistorySearchFocused(true);
			} else if (view === "provider") {
				setProviderSearchFocused(true);
			}
		},
		onCopy: () => {
			void handleCopyCurrent();
		},
		onExport: () => {
			if (view === "export") {
				void handleExportCurrentAs(currentExportFormat);
				return;
			}

			handleExportCurrent();
		},
		onProvider: () => {
			if (!config) return;
			const matchedIndex = filteredProviderNames.indexOf(config.defaultProvider);
			setProviderSelectionIndex(Math.max(0, matchedIndex));
			setProviderSearchFocused(false);
			setView(view === "provider" ? "main" : "provider");
		},
		onNavigateUp: () => {
			if (view === "history") {
				setHistorySelectionIndex((prev) => Math.max(0, prev - 1));
			} else if (view === "provider") {
				setProviderSelectionIndex((prev) => Math.max(0, prev - 1));
			} else if (view === "export") {
				setExportSelectionIndex((prev) => Math.max(0, prev - 1));
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(Math.max(0, activeDiffChangeIndex - 1));
				} else {
					setDiffScrollOffset((prev) => Math.max(0, prev - 1));
				}
			}
		},
		onNavigateDown: () => {
			if (view === "history") {
				setHistorySelectionIndex((prev) =>
					Math.min(Math.max(filteredHistoryEntries.length - 1, 0), prev + 1),
				);
			} else if (view === "provider") {
				setProviderSelectionIndex((prev) =>
					Math.min(Math.max(filteredProviderNames.length - 1, 0), prev + 1),
				);
			} else if (view === "export") {
				setExportSelectionIndex((prev) =>
					Math.min(Math.max(EXPORT_FORMATS.length - 1, 0), prev + 1),
				);
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(Math.min(diffChangeBlocks.length - 1, activeDiffChangeIndex + 1));
				} else {
					setDiffScrollOffset((prev) => Math.min(maxDiffScrollOffset, prev + 1));
				}
			}
		},
		onNavigatePrevChange: () => {
			if (view !== "diff" || diffChangeBlocks.length === 0) {
				return;
			}

			focusDiffChangeBlock(Math.max(0, activeDiffChangeIndex - 1));
		},
		onNavigateNextChange: () => {
			if (view !== "diff" || diffChangeBlocks.length === 0) {
				return;
			}

			focusDiffChangeBlock(Math.min(diffChangeBlocks.length - 1, activeDiffChangeIndex + 1));
		},
		onPageUp: () => {
			if (view === "history") {
				setHistorySelectionIndex((prev) => Math.max(0, prev - historyPageSize));
			} else if (view === "provider") {
				setProviderSelectionIndex((prev) => Math.max(0, prev - providerPageSize));
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(Math.max(0, activeDiffChangeIndex - diffOverviewPageSize));
				} else {
					setDiffScrollOffset((prev) => Math.max(0, prev - visibleDiffLines));
				}
			}
		},
		onPageDown: () => {
			if (view === "history") {
				setHistorySelectionIndex((prev) =>
					Math.min(Math.max(filteredHistoryEntries.length - 1, 0), prev + historyPageSize),
				);
			} else if (view === "provider") {
				setProviderSelectionIndex((prev) =>
					Math.min(Math.max(filteredProviderNames.length - 1, 0), prev + providerPageSize),
				);
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(
						Math.min(diffChangeBlocks.length - 1, activeDiffChangeIndex + diffOverviewPageSize),
					);
				} else {
					setDiffScrollOffset((prev) => Math.min(maxDiffScrollOffset, prev + visibleDiffLines));
				}
			}
		},
		onFirst: () => {
			if (view === "history") {
				setHistorySelectionIndex(0);
			} else if (view === "provider") {
				setProviderSelectionIndex(0);
			} else if (view === "export") {
				setExportSelectionIndex(0);
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(0);
				} else {
					setDiffScrollOffset(0);
				}
			}
		},
		onLast: () => {
			if (view === "history") {
				setHistorySelectionIndex(Math.max(filteredHistoryEntries.length - 1, 0));
			} else if (view === "provider") {
				setProviderSelectionIndex(Math.max(filteredProviderNames.length - 1, 0));
			} else if (view === "export") {
				setExportSelectionIndex(Math.max(EXPORT_FORMATS.length - 1, 0));
			} else if (view === "diff") {
				if (diffFocusArea === "overview" && diffChangeBlocks.length > 0) {
					focusDiffChangeBlock(diffChangeBlocks.length - 1);
				} else {
					setDiffScrollOffset(maxDiffScrollOffset);
				}
			}
		},
		onSelect: () => {
			if (view === "diff" && diffJumpInput) {
				applyDiffJump();
				return;
			}

			if (view === "history" && selectedHistoryEntry) {
				const selectedIndex = history.entries.findIndex(
					(entry) => entry.id === selectedHistoryEntry.id,
				);
				if (selectedIndex >= 0) {
					history.goTo(selectedIndex);
				}
				setOriginalPrompt(selectedHistoryEntry.original);
				setInputActive(false);
				setMainInputFocused(false);
				setHistorySearchFocused(false);
				setView("main");
				flashNotice(`Loaded revision v${selectedHistoryEntry.version}`);
			} else if (view === "provider" && config && selectedProviderName) {
				void handleConfigChange({
					...config,
					defaultProvider: selectedProviderName,
					defaultModel: resolveProviderModel(config, config.providers[selectedProviderName]),
				});
				setProviderSearchFocused(false);
				setView("main");
			} else if (view === "export") {
				void handleExportCurrentAs(currentExportFormat);
			} else if (view === "diff" && diffFocusArea === "overview") {
				focusDiffChangeBlock(activeDiffChangeIndex, "top");
				setDiffFocusArea("patch");
			}
		},
		onToggleDiffFocus: () => {
			if (view === "diff") {
				setDiffFocusArea((previousArea) => (previousArea === "patch" ? "overview" : "patch"));
			}
		},
		onToggleDiffAlign: () => {
			if (view !== "diff") {
				return;
			}

			setDiffAlignMode((previousMode) => {
				const nextMode = previousMode === "center" ? "top" : "center";

				if (diffChangeBlocks.length > 0 && activeDiffChangeIndex >= 0) {
					focusDiffChangeBlock(activeDiffChangeIndex, nextMode);
				}

				return nextMode;
			});
		},
		onAppendDiffJumpDigit: (digit: string) => {
			if (view !== "diff") {
				return;
			}

			setDiffJumpInput((previousInput) => {
				if (previousInput.length >= 3) {
					return previousInput;
				}

				if (!previousInput && digit === "0") {
					return previousInput;
				}

				return `${previousInput}${digit}`;
			});
		},
		onDeleteDiffJumpDigit: () => {
			if (view !== "diff") {
				return;
			}

			setDiffJumpInput((previousInput) => previousInput.slice(0, -1));
		},
		onBack: () => {
			if (view === "history") {
				setHistorySearchFocused(false);
			} else if (view === "provider") {
				setProviderSearchFocused(false);
			} else if (view === "diff") {
				setDiffFocusArea("patch");
				setDiffJumpInput("");
			} else if (view === "export") {
				setView(exportReturnView === "export" ? "main" : exportReturnView);
				return;
			}
			setView("main");
		},
		onEnterInputMode: () => {
			if (view === "main" && inputActive) {
				setMainInputFocused(true);
			}
		},
		onExitInputMode: () => {
			if (view === "main" && inputActive) {
				setMainInputFocused(false);
			} else if (view === "history") {
				setHistorySearchFocused(false);
			} else if (view === "provider") {
				setProviderSearchFocused(false);
			}
		},
		onHelp: () => {
			setView((previousView) => (previousView === "help" ? "main" : "help"));
		},
		onCommandPalette: () => {
			openCommandPalette();
		},
		onPaletteClose: () => {
			closeCommandPalette();
		},
		onPaletteNavigateUp: () => {
			setCommandPaletteIndex((previousIndex) => Math.max(0, previousIndex - 1));
		},
		onPaletteNavigateDown: () => {
			setCommandPaletteIndex((previousIndex) =>
				Math.min(Math.max(filteredCommandPaletteCommands.length - 1, 0), previousIndex + 1),
			);
		},
	};

	const executeCommandPaletteSelection = () => {
		const selectedCommand = selectedCommandPaletteCommand;
		if (!selectedCommand) {
			flashNotice("No matching command");
			return;
		}

		closeCommandPalette();

		switch (selectedCommand.action) {
			case "go-main":
				if (view !== "main") {
					keymapHandlers.onBack?.();
				}
				break;
			case "focus-input":
				keymapHandlers.onEnterInputMode?.();
				break;
			case "open-history":
				keymapHandlers.onHistory?.();
				break;
			case "open-provider":
				keymapHandlers.onProvider?.();
				break;
			case "open-help":
				keymapHandlers.onHelp?.();
				break;
			case "reset":
				keymapHandlers.onReset?.();
				break;
			case "open-diff":
				keymapHandlers.onDiff?.();
				break;
			case "refine-current":
				keymapHandlers.onFeedback?.();
				break;
			case "copy-current":
				keymapHandlers.onCopy?.();
				break;
			case "export-current":
				keymapHandlers.onExport?.();
				break;
			case "export-md":
				void handleExportCurrentAs("md");
				break;
			case "export-txt":
				void handleExportCurrentAs("txt");
				break;
			case "export-json":
				void handleExportCurrentAs("json");
				break;
			case "export-yaml":
				void handleExportCurrentAs("yaml");
				break;
			case "toggle-diff-focus":
				keymapHandlers.onToggleDiffFocus?.();
				break;
			case "toggle-diff-align":
				keymapHandlers.onToggleDiffAlign?.();
				break;
			case "diff-prev-hunk":
				keymapHandlers.onNavigatePrevChange?.();
				break;
			case "diff-next-hunk":
				keymapHandlers.onNavigateNextChange?.();
				break;
			case "diff-first-hunk":
				keymapHandlers.onFirst?.();
				break;
			case "diff-last-hunk":
				keymapHandlers.onLast?.();
				break;
			default:
				flashNotice(`Command ${selectedCommand.title} is not wired`);
		}
	};

	useKeymap(view, keymapHandlers, {
		textInputFocused: isTextInputFocused || commandPaletteOpen,
		paletteOpen: commandPaletteOpen,
	});

	if (loading) {
		return (
			<Box>
				<Text>Loading…</Text>
			</Box>
		);
	}

	if (!config) {
		return (
			<Box flexDirection="column" width={columns} height={rows}>
				<OnboardingWizard
					onComplete={(nextConfig) => {
						setConfigPath(getConfigPath());
						setConfig(nextConfig);
					}}
				/>
			</Box>
		);
	}

	const renderMainView = () => {
		if (useWideSidePanels) {
			const primaryHeight = viewportHeight;

			return (
				<Box width="100%" height={viewportHeight}>
					<Box flexGrow={1} paddingRight={1}>
						{inputActive && optimizer.status === "idle" ? (
							<Panel
								title={mainInputFocused ? "Compose Prompt" : "Compose Prompt · Command Mode"}
								footer={`${config.defaultLevel} enhancement`}
								height={primaryHeight}
								contentWidth={mainPanelWidth}
							>
								<PromptInput
									onSubmit={handleSubmitPrompt}
									isLoading={false}
									focus={mainInputFocused}
								/>
							</Panel>
						) : (
							<PromptPanel
								title={
									optimizer.status === "error"
										? "Last Error"
										: optimizer.status === "streaming"
											? "Streaming Result"
											: activeEntry
												? `Revision v${activeEntry.version}`
												: "Result"
								}
								content={
									optimizer.errorMessage ||
									optimizer.streamingText ||
									activeEntry?.enhanced ||
									currentResult?.enhanced ||
									""
								}
								height={primaryHeight}
								isStreaming={optimizer.status === "streaming"}
								footer={activeEntry ? `${activeEntry.provider}/${activeEntry.model}` : undefined}
								contentWidth={mainPanelWidth}
							/>
						)}
					</Box>
					<Box width={sideWidth} flexDirection="column">
						<PromptPanel
							title="Inspector"
							content={mainInspectorText}
							height={stackedHeight}
							borderColor="cyan"
							contentWidth={sidePanelWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Shortcuts"
								content={shortcutText}
								height={viewportHeight - stackedHeight - 1}
								borderColor="yellow"
								contentWidth={sidePanelWidth}
							/>
						</Box>
					</Box>
				</Box>
			);
		}

		const { first: primaryHeight, second: bottomHeight } = splitHeights(
			viewportHeight,
			Math.floor(viewportHeight * (isStackedLayout ? 0.64 : 0.56)),
			5,
			4,
		);
		const compactPanelWidth = useDualBottomPanels ? splitPanelWidth : fullContentWidth;
		const { first: inspectorHeight, second: shortcutsHeight } = useDualBottomPanels
			? { first: bottomHeight, second: bottomHeight }
			: splitHeights(bottomHeight, Math.floor(bottomHeight * 0.45), 2, 2);
		const useSingleAuxPanel =
			!useDualBottomPanels && Math.min(inspectorHeight, shortcutsHeight) < 4;
		const combinedAuxText = `${mainInspectorText}\n\n${shortcutText}`;

		return (
			<Box width="100%" height={viewportHeight} flexDirection="column">
				<Box marginBottom={1}>
					{inputActive && optimizer.status === "idle" ? (
						<Panel
							title={mainInputFocused ? "Compose Prompt" : "Compose Prompt · Command Mode"}
							footer={`${config.defaultLevel} enhancement`}
							height={primaryHeight}
							contentWidth={fullContentWidth}
						>
							<PromptInput
								onSubmit={handleSubmitPrompt}
								isLoading={false}
								focus={mainInputFocused}
							/>
						</Panel>
					) : (
						<PromptPanel
							title={
								optimizer.status === "error"
									? "Last Error"
									: optimizer.status === "streaming"
										? "Streaming Result"
										: activeEntry
											? `Revision v${activeEntry.version}`
											: "Result"
							}
							content={
								optimizer.errorMessage ||
								optimizer.streamingText ||
								activeEntry?.enhanced ||
								currentResult?.enhanced ||
								""
							}
							height={primaryHeight}
							isStreaming={optimizer.status === "streaming"}
							footer={activeEntry ? `${activeEntry.provider}/${activeEntry.model}` : undefined}
							contentWidth={fullContentWidth}
						/>
					)}
				</Box>
				{useDualBottomPanels ? (
					<Box width="100%" height={bottomHeight}>
						<Box width="50%" paddingRight={1}>
							<PromptPanel
								title="Inspector"
								content={mainInspectorText}
								height={bottomHeight}
								borderColor="cyan"
								contentWidth={compactPanelWidth}
							/>
						</Box>
						<Box width="50%" paddingLeft={1}>
							<PromptPanel
								title="Shortcuts"
								content={shortcutText}
								height={bottomHeight}
								borderColor="yellow"
								contentWidth={compactPanelWidth}
							/>
						</Box>
					</Box>
				) : useSingleAuxPanel ? (
					<Box width="100%" height={bottomHeight}>
						<PromptPanel
							title="Inspector & Shortcuts"
							content={combinedAuxText}
							height={bottomHeight}
							borderColor="cyan"
							contentWidth={compactPanelWidth}
						/>
					</Box>
				) : (
					<Box width="100%" height={bottomHeight} flexDirection="column">
						<PromptPanel
							title="Inspector"
							content={mainInspectorText}
							height={inspectorHeight}
							borderColor="cyan"
							contentWidth={compactPanelWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Shortcuts"
								content={shortcutText}
								height={shortcutsHeight}
								borderColor="yellow"
								contentWidth={compactPanelWidth}
							/>
						</Box>
					</Box>
				)}
			</Box>
		);
	};

	const renderHistoryView = () => {
		if (useWideSidePanels) {
			return (
				<Box width="100%" height={viewportHeight}>
					<Box width={sideWidth} paddingRight={1}>
						<HistoryList
							entries={filteredHistoryEntries}
							selectedIndex={historySelectionIndex}
							height={viewportHeight}
							contentWidth={sidePanelWidth}
							searchQuery={historySearchQuery}
							searchFocused={historySearchFocused}
							onSearchChange={(value) => {
								setHistorySearchQuery(value);
								setHistorySelectionIndex(0);
							}}
							onSearchSubmit={() => {
								setHistorySearchFocused(false);
							}}
						/>
					</Box>
					<Box flexGrow={1} flexDirection="column">
						<PromptPanel
							title={
								selectedHistoryEntry ? `Revision v${selectedHistoryEntry.version}` : "Revision"
							}
							content={selectedHistoryEntry?.enhanced || ""}
							height={stackedHeight}
							footer={selectedHistoryEntry ? selectedHistoryEntry.provider : "No selection"}
							contentWidth={mainPanelWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Details"
								content={historyDetailsText}
								height={viewportHeight - stackedHeight - 1}
								borderColor="cyan"
								contentWidth={mainPanelWidth}
							/>
						</Box>
					</Box>
				</Box>
			);
		}

		const { first: listHeight, second: bottomHeight } = splitHeights(
			viewportHeight,
			Math.floor(viewportHeight * 0.38),
			4,
			5,
		);
		const { first: previewHeight, second: detailsHeight } = useDualBottomPanels
			? { first: bottomHeight, second: bottomHeight }
			: splitHeights(bottomHeight, Math.floor(bottomHeight * 0.38), 3, 3);
		const useSingleHistoryDetailPanel =
			!useDualBottomPanels && Math.min(previewHeight, detailsHeight) < 4;
		const combinedHistoryText = selectedHistoryEntry
			? `${selectedHistoryEntry.enhanced}\n\n${historyDetailsText}`
			: historyDetailsText;

		return (
			<Box width="100%" height={viewportHeight} flexDirection="column">
				<Box marginBottom={1}>
					<HistoryList
						entries={filteredHistoryEntries}
						selectedIndex={historySelectionIndex}
						height={listHeight}
						contentWidth={fullContentWidth}
						searchQuery={historySearchQuery}
						searchFocused={historySearchFocused}
						onSearchChange={(value) => {
							setHistorySearchQuery(value);
							setHistorySelectionIndex(0);
						}}
						onSearchSubmit={() => {
							setHistorySearchFocused(false);
						}}
					/>
				</Box>
				{useDualBottomPanels ? (
					<Box width="100%" height={bottomHeight}>
						<Box width="50%" paddingRight={1}>
							<PromptPanel
								title={
									selectedHistoryEntry ? `Revision v${selectedHistoryEntry.version}` : "Revision"
								}
								content={selectedHistoryEntry?.enhanced || ""}
								height={bottomHeight}
								footer={selectedHistoryEntry ? selectedHistoryEntry.provider : "No selection"}
								contentWidth={splitPanelWidth}
							/>
						</Box>
						<Box width="50%" paddingLeft={1}>
							<PromptPanel
								title="Details"
								content={historyDetailsText}
								height={bottomHeight}
								borderColor="cyan"
								contentWidth={splitPanelWidth}
							/>
						</Box>
					</Box>
				) : useSingleHistoryDetailPanel ? (
					<Box width="100%" height={bottomHeight}>
						<PromptPanel
							title={selectedHistoryEntry ? `Revision v${selectedHistoryEntry.version}` : "Details"}
							content={combinedHistoryText}
							height={bottomHeight}
							borderColor="cyan"
							footer={selectedHistoryEntry ? selectedHistoryEntry.provider : "No selection"}
							contentWidth={fullContentWidth}
						/>
					</Box>
				) : (
					<Box width="100%" height={bottomHeight} flexDirection="column">
						<PromptPanel
							title={
								selectedHistoryEntry ? `Revision v${selectedHistoryEntry.version}` : "Revision"
							}
							content={selectedHistoryEntry?.enhanced || ""}
							height={previewHeight}
							footer={selectedHistoryEntry ? selectedHistoryEntry.provider : "No selection"}
							contentWidth={fullContentWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Details"
								content={historyDetailsText}
								height={detailsHeight}
								borderColor="cyan"
								contentWidth={fullContentWidth}
							/>
						</Box>
					</Box>
				)}
			</Box>
		);
	};

	const renderProviderView = () => {
		if (useWideSidePanels) {
			return (
				<Box width="100%" height={viewportHeight}>
					<Box width={sideWidth} paddingRight={1}>
						<ProviderPicker
							providers={filteredProviderNames}
							selectedProvider={selectedProviderName}
							activeProvider={config.defaultProvider}
							height={viewportHeight}
							contentWidth={sidePanelWidth}
							searchQuery={providerSearchQuery}
							searchFocused={providerSearchFocused}
							onSearchChange={(value) => {
								setProviderSearchQuery(value);
								setProviderSelectionIndex(0);
							}}
							onSearchSubmit={() => {
								setProviderSearchFocused(false);
							}}
						/>
					</Box>
					<Box flexGrow={1}>
						<PromptPanel
							title="Provider Details"
							content={providerDetailsText}
							height={viewportHeight}
							borderColor="magenta"
							contentWidth={mainPanelWidth}
						/>
					</Box>
				</Box>
			);
		}

		const { first: pickerHeight, second: detailsHeight } = splitHeights(
			viewportHeight,
			Math.floor(viewportHeight * 0.4),
			4,
			5,
		);

		return (
			<Box width="100%" height={viewportHeight} flexDirection="column">
				<Box marginBottom={1}>
					<ProviderPicker
						providers={filteredProviderNames}
						selectedProvider={selectedProviderName}
						activeProvider={config.defaultProvider}
						height={pickerHeight}
						contentWidth={fullContentWidth}
						searchQuery={providerSearchQuery}
						searchFocused={providerSearchFocused}
						onSearchChange={(value) => {
							setProviderSearchQuery(value);
							setProviderSelectionIndex(0);
						}}
						onSearchSubmit={() => {
							setProviderSearchFocused(false);
						}}
					/>
				</Box>
				<PromptPanel
					title="Provider Details"
					content={providerDetailsText}
					height={detailsHeight}
					borderColor="magenta"
					contentWidth={fullContentWidth}
				/>
			</Box>
		);
	};

	const renderFeedbackView = () => {
		if (useWideSidePanels) {
			return (
				<Box width="100%" height={viewportHeight}>
					<Box flexGrow={1} paddingRight={1}>
						<Panel
							title="Refine Prompt"
							footer="Enter submit · ESC back"
							height={viewportHeight}
							contentWidth={mainPanelWidth}
						>
							<FeedbackForm onSubmit={handleSubmitFeedback} onCancel={() => setView("main")} />
						</Panel>
					</Box>
					<Box width={sideWidth} flexDirection="column">
						<PromptPanel
							title="Current Revision"
							content={activeEntry?.enhanced || ""}
							height={stackedHeight}
							contentWidth={sidePanelWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Original Prompt"
								content={activeEntry?.original || originalPrompt || ""}
								height={viewportHeight - stackedHeight - 1}
								borderColor="yellow"
								contentWidth={sidePanelWidth}
							/>
						</Box>
					</Box>
				</Box>
			);
		}

		const { first: formHeight, second: bottomHeight } = splitHeights(
			viewportHeight,
			Math.floor(viewportHeight * 0.52),
			5,
			4,
		);
		const { first: currentHeight, second: originalHeight } = useDualBottomPanels
			? { first: bottomHeight, second: bottomHeight }
			: splitHeights(bottomHeight, Math.floor(bottomHeight / 2), 2, 2);
		const useSingleFeedbackContextPanel =
			!useDualBottomPanels && Math.min(currentHeight, originalHeight) < 4;
		const combinedFeedbackContext = [
			activeEntry?.enhanced || "",
			activeEntry?.original || originalPrompt || "",
		]
			.filter(Boolean)
			.join("\n\n");

		return (
			<Box width="100%" height={viewportHeight} flexDirection="column">
				<Box marginBottom={1}>
					<Panel
						title="Refine Prompt"
						footer="Enter submit · ESC back"
						height={formHeight}
						contentWidth={fullContentWidth}
					>
						<FeedbackForm onSubmit={handleSubmitFeedback} onCancel={() => setView("main")} />
					</Panel>
				</Box>
				{useDualBottomPanels ? (
					<Box width="100%" height={bottomHeight}>
						<Box width="50%" paddingRight={1}>
							<PromptPanel
								title="Current Revision"
								content={activeEntry?.enhanced || ""}
								height={bottomHeight}
								contentWidth={splitPanelWidth}
							/>
						</Box>
						<Box width="50%" paddingLeft={1}>
							<PromptPanel
								title="Original Prompt"
								content={activeEntry?.original || originalPrompt || ""}
								height={bottomHeight}
								borderColor="yellow"
								contentWidth={splitPanelWidth}
							/>
						</Box>
					</Box>
				) : useSingleFeedbackContextPanel ? (
					<Box width="100%" height={bottomHeight}>
						<PromptPanel
							title="Current & Original"
							content={combinedFeedbackContext}
							height={bottomHeight}
							borderColor="cyan"
							contentWidth={fullContentWidth}
						/>
					</Box>
				) : (
					<Box width="100%" height={bottomHeight} flexDirection="column">
						<PromptPanel
							title="Current Revision"
							content={activeEntry?.enhanced || ""}
							height={currentHeight}
							contentWidth={fullContentWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title="Original Prompt"
								content={activeEntry?.original || originalPrompt || ""}
								height={originalHeight}
								borderColor="yellow"
								contentWidth={fullContentWidth}
							/>
						</Box>
					</Box>
				)}
			</Box>
		);
	};

	const renderExportView = () => {
		if (!activeEntry) {
			return (
				<PromptPanel
					title="Export"
					content="Run an enhancement before exporting."
					height={viewportHeight}
					borderColor="yellow"
					contentWidth={fullContentWidth}
				/>
			);
		}

		const exportFormats = EXPORT_FORMATS.map((format) => ({
			id: format,
			label: `${EXPORT_FORMAT_LABELS[format]} (.${format})`,
			description: EXPORT_FORMAT_DESCRIPTIONS[format],
		}));

		if (useWideSidePanels) {
			return (
				<Box width="100%" height={viewportHeight}>
					<Box width={sideWidth} paddingRight={1}>
						<ExportPicker
							formats={exportFormats}
							selectedFormat={currentExportFormat}
							height={viewportHeight}
							contentWidth={sidePanelWidth}
						/>
					</Box>
					<Box flexGrow={1} flexDirection="column">
						<PromptPanel
							title="Export Details"
							content={exportDetailsText}
							height={stackedHeight}
							borderColor="cyan"
							contentWidth={mainPanelWidth}
						/>
						<Box marginTop={1}>
							<PromptPanel
								title={`Preview · ${EXPORT_FORMAT_LABELS[currentExportFormat]}`}
								content={exportPreview}
								height={viewportHeight - stackedHeight - 1}
								contentWidth={mainPanelWidth}
							/>
						</Box>
					</Box>
				</Box>
			);
		}

		const { first: pickerHeight, second: previewHeight } = splitHeights(
			viewportHeight,
			Math.floor(viewportHeight * 0.36),
			5,
			5,
		);

		return (
			<Box width="100%" height={viewportHeight} flexDirection="column">
				<Box marginBottom={1}>
					<ExportPicker
						formats={exportFormats}
						selectedFormat={currentExportFormat}
						height={pickerHeight}
						contentWidth={fullContentWidth}
					/>
				</Box>
				<PromptPanel
					title={`Preview · ${EXPORT_FORMAT_LABELS[currentExportFormat]}`}
					content={`${exportDetailsText}\n\n${exportPreview}`}
					height={previewHeight}
					borderColor="cyan"
					contentWidth={fullContentWidth}
				/>
			</Box>
		);
	};

	const renderContent = () => {
		switch (view) {
			case "history":
				return renderHistoryView();
			case "provider":
				return renderProviderView();
			case "feedback":
				return renderFeedbackView();
			case "export":
				return renderExportView();
			case "diff":
				return (
					<DiffView
						original={diffSourceOriginal}
						enhanced={diffSourceEnhanced}
						height={viewportHeight}
						contentWidth={fullPanelWidth}
						scrollOffset={safeDiffScrollOffset}
						diffLines={diffLines}
						changeBlocks={diffChangeBlocks}
						activeChangeIndex={activeDiffChangeIndex}
						focusArea={diffFocusArea}
						alignMode={diffAlignMode}
						jumpInput={diffJumpInput}
					/>
				);
			case "help":
				return <HelpView height={viewportHeight} contentWidth={fullPanelWidth} />;
			default:
				return renderMainView();
		}
	};

	return (
		<Box flexDirection="column" width={columns} height={rows}>
			<Header
				provider={config.defaultProvider}
				model={currentModel}
				view={view}
				status={optimizer.status}
				inputFocused={isTextInputFocused}
				contentWidth={columns}
				originalTokens={
					view === "main" && inputActive ? undefined : currentResult?.metadata.originalTokens
				}
				enhancedTokens={
					view === "main" && inputActive ? undefined : currentResult?.metadata.enhancedTokens
				}
			/>

			<Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
				{commandPaletteOpen ? (
					<Box
						flexDirection="column"
						width="100%"
						height={contentHeight}
						alignItems="center"
						justifyContent="center"
					>
						<Box marginBottom={1}>
							<CommandPalette
								query={commandPaletteQuery}
								commands={filteredCommandPaletteCommands}
								selectedIndex={commandPaletteIndex}
								height={commandPaletteHeight}
								width={Math.min(fullPanelWidth, 96)}
								onQueryChange={setCommandPaletteQuery}
								onSubmit={executeCommandPaletteSelection}
							/>
						</Box>
					</Box>
				) : (
					renderContent()
				)}
			</Box>

			<StatusBar
				status={optimizer.status}
				view={view}
				inputFocused={isTextInputFocused}
				canEnterInput={view === "main" && inputActive && !mainInputFocused}
				notice={notice}
				diffFocusArea={diffFocusArea}
				diffAlignMode={diffAlignMode}
				diffJumpInput={diffJumpInput}
				commandPaletteOpen={commandPaletteOpen}
				contentWidth={columns}
			/>
		</Box>
	);
};

export default App;
