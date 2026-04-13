import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { getWindowRange, truncateText } from "../utils/text";
import Panel from "./Panel";

export interface ProviderOption {
	id: string;
	provider: string;
	model: string;
	baseURL: string;
	isDefaultModel: boolean;
}

interface ProviderPickerProps {
	options: ProviderOption[];
	selectedOptionId: string;
	activeOptionId: string;
	height?: number;
	contentWidth?: number;
	searchQuery?: string;
	searchFocused?: boolean;
	onSearchChange?: (value: string) => void;
	onSearchSubmit?: (value: string) => void;
}

const ProviderPicker: React.FC<ProviderPickerProps> = ({
	options,
	selectedOptionId,
	activeOptionId,
	height = 18,
	contentWidth = 26,
	searchQuery = "",
	searchFocused = false,
	onSearchChange,
	onSearchSubmit,
}) => {
	const selectedIndex = Math.max(
		0,
		options.findIndex((option) => option.id === selectedOptionId),
	);
	const visibleCount = Math.max(1, Math.floor((height - 7) / 2));
	const { start, end } = getWindowRange(options.length, selectedIndex, visibleCount);
	const visibleOptions = options.slice(start, end);
	const footer =
		options.length === 0
			? searchQuery
				? "0 match"
				: "no options"
			: searchQuery
				? `${end}/${options.length} match`
				: `${end}/${options.length}`;

	return (
		<Panel
			title="Providers & Models"
			footer={footer}
			height={height}
			borderColor="magenta"
			contentWidth={contentWidth}
		>
			<Box flexDirection="column" marginBottom={1}>
				<Text dimColor>{searchFocused ? "Search providers" : "Press / to search"}</Text>
				<TextInput
					value={searchQuery}
					onChange={(value) => onSearchChange?.(value)}
					onSubmit={(value) => onSearchSubmit?.(value)}
					placeholder="Search name / model / baseURL..."
					focus={searchFocused}
				/>
			</Box>
			{options.length === 0 ? (
				<Text dimColor>{searchQuery ? "No matching providers." : "No providers configured."}</Text>
			) : (
				visibleOptions.map((option) => (
					<Box key={option.id} flexDirection="column">
						<Text
							color={option.id === selectedOptionId ? "green" : undefined}
							inverse={option.id === selectedOptionId}
						>
							{`${option.id === selectedOptionId ? "›" : " "} ${truncateText(
								`${option.provider} · ${option.model}`,
								contentWidth,
							)}`}
						</Text>
						<Text dimColor>
							{truncateText(
								option.id === activeOptionId
									? option.isDefaultModel
										? "current default"
										: "current active"
									: option.isDefaultModel
										? "provider default"
										: option.baseURL,
								contentWidth,
							)}
						</Text>
					</Box>
				))
			)}
			<Text
				dimColor
			>{`active: ${truncateText(activeOptionId, Math.max(10, contentWidth - 8))}`}</Text>
		</Panel>
	);
};

export default ProviderPicker;
