import { Box, Text } from "ink";
import type React from "react";
import { truncateText } from "../utils/text";
import Panel from "./Panel";

export interface ExportFormat {
	id: "md" | "txt" | "json" | "yaml";
	label: string;
	description: string;
}

const DEFAULT_FORMATS: ExportFormat[] = [
	{
		id: "md",
		label: "Markdown (.md)",
		description: "Rich text with headings, code fences, and tables.",
	},
	{
		id: "txt",
		label: "Plain text (.txt)",
		description: "Minimal text for shell scripts or notes.",
	},
	{
		id: "json",
		label: "JSON (.json)",
		description: "Structured payload with metadata for automation.",
	},
	{
		id: "yaml",
		label: "YAML (.yaml)",
		description: "Human-friendly config style for LangChain / CrewAI.",
	},
];

export interface ExportPickerProps {
	formats?: ExportFormat[];
	selectedFormat?: ExportFormat["id"];
	height?: number;
	contentWidth?: number;
	/**
	 * Called when the user confirms the current selection (Enter).
	 */
	onSelect?: (formatId: ExportFormat["id"]) => void;
	/**
	 * Called when navigation changes the highlighted format (↑/↓).
	 */
	onChange?: (formatId: ExportFormat["id"]) => void;
}

const ExportPicker: React.FC<ExportPickerProps> = ({
	formats = DEFAULT_FORMATS,
	selectedFormat = DEFAULT_FORMATS[0].id,
	height = 12,
	contentWidth = 32,
}) => {
	const footer = "Enter=Export  ESC=Close  ↑↓=Navigate";

	return (
		<Panel
			title="Export"
			footer={footer}
			borderColor="cyan"
			height={height}
			contentWidth={contentWidth}
		>
			<Box flexDirection="column" flexGrow={1} justifyContent="space-between">
				{formats.map((format) => {
					const isSelected = format.id === selectedFormat;
					return (
						<Box key={format.id} flexDirection="column" marginBottom={1}>
							<Text color={isSelected ? "green" : undefined} inverse={isSelected}>
								{`${isSelected ? "›" : "  "} ${format.label}`}
							</Text>
							<Text dimColor>{truncateText(format.description, contentWidth)}</Text>
						</Box>
					);
				})}
			</Box>
			<Box>
				<Text dimColor>Enter confirms, ESC cancels, ↑/↓ change highlight.</Text>
			</Box>
		</Panel>
	);
};

export default ExportPicker;
