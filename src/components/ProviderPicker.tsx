import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { getWindowRange, truncateText } from "../utils/text";
import Panel from "./Panel";

interface ProviderPickerProps {
	providers: string[];
	selectedProvider: string;
	activeProvider: string;
	height?: number;
	contentWidth?: number;
	searchQuery?: string;
	searchFocused?: boolean;
	onSearchChange?: (value: string) => void;
	onSearchSubmit?: (value: string) => void;
}

const ProviderPicker: React.FC<ProviderPickerProps> = ({
	providers,
	selectedProvider,
	activeProvider,
	height = 18,
	contentWidth = 26,
	searchQuery = "",
	searchFocused = false,
	onSearchChange,
	onSearchSubmit,
}) => {
	const selectedIndex = Math.max(0, providers.indexOf(selectedProvider));
	const visibleCount = Math.max(1, Math.floor((height - 7) / 2));
	const { start, end } = getWindowRange(providers.length, selectedIndex, visibleCount);
	const visibleProviders = providers.slice(start, end);
	const footer =
		providers.length === 0
			? searchQuery
				? "0 match"
				: "no providers"
			: searchQuery
				? `${end}/${providers.length} match`
				: `${end}/${providers.length}`;

	return (
		<Panel
			title="Providers"
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
			{providers.length === 0 ? (
				<Text dimColor>{searchQuery ? "No matching providers." : "No providers configured."}</Text>
			) : (
				visibleProviders.map((provider) => (
					<Box key={provider} flexDirection="column">
						<Text
							color={provider === selectedProvider ? "green" : undefined}
							inverse={provider === selectedProvider}
						>
							{`${provider === selectedProvider ? "›" : " "} ${truncateText(provider, contentWidth)}`}
						</Text>
						<Text dimColor>
							{truncateText(
								provider === activeProvider ? "current default" : "available",
								contentWidth,
							)}
						</Text>
					</Box>
				))
			)}
			<Text
				dimColor
			>{`active: ${truncateText(activeProvider, Math.max(10, contentWidth - 8))}`}</Text>
		</Panel>
	);
};

export default ProviderPicker;
