// Version history management hook backed by persistent storage

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HistoryEntry } from "../types";

export interface UseHistoryReturn {
	entries: HistoryEntry[];
	currentIndex: number;
	current: HistoryEntry | null;
	loaded: boolean;
	push: (entry: HistoryEntry) => void;
	goTo: (index: number) => void;
}

export function useHistory(): UseHistoryReturn {
	const [entries, setEntries] = useState<HistoryEntry[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let mounted = true;

		void import("../services/storage")
			.then(({ list }) => list())
			.then((storedEntries) => {
				if (!mounted) return;
				setEntries(storedEntries);
				setCurrentIndex(0);
				setLoaded(true);
			})
			.catch(() => {
				if (!mounted) return;
				setEntries([]);
				setCurrentIndex(0);
				setLoaded(true);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const push = useCallback((entry: HistoryEntry) => {
		setEntries((prevEntries) => [entry, ...prevEntries]);
		setCurrentIndex(0);
		void import("../services/storage").then(({ save }) => save(entry)).catch(() => undefined);
	}, []);

	const goTo = useCallback(
		(index: number) => {
			setCurrentIndex((prevIndex) => {
				if (index < 0 || index >= entries.length) {
					return prevIndex;
				}
				return index;
			});
		},
		[entries.length],
	);

	const current = useMemo(() => {
		if (entries.length === 0) {
			return null;
		}

		return entries[currentIndex] ?? entries[0] ?? null;
	}, [entries, currentIndex]);

	return {
		entries,
		currentIndex,
		current,
		loaded,
		push,
		goTo,
	};
}
