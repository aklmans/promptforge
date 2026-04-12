// Persistent storage for enhancement history using fs-extra

import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";
import fsExtra from "fs-extra";
import Fuse from "fuse.js";
import type { HistoryEntry } from "../types";

const { ensureDir, readJson, readdir, remove: removeFile, writeJson } = fsExtra;

const HISTORY_DIR = resolve(homedir(), ".promptforge/history");

// Initialize storage directory
await ensureDir(HISTORY_DIR);

// Generate filename from timestamp and excerpt
function generateFilename(entry: HistoryEntry): string {
	const timestamp = new Date(entry.timestamp).getTime().toString(36);
	const excerpt = entry.original
		.slice(0, 10)
		.replace(/[^a-z0-9]/gi, "")
		.toLowerCase();
	return `${timestamp}-${excerpt}-${randomUUID().slice(0, 8)}.json`;
}

// Save a history entry
export async function save(entry: HistoryEntry): Promise<string> {
	await ensureDir(HISTORY_DIR);
	const filename = generateFilename(entry);
	const path = resolve(HISTORY_DIR, filename);
	await writeJson(path, entry, { spaces: 2 });
	return path;
}

// Load a history entry by ID
export async function load(id: string): Promise<HistoryEntry | null> {
	try {
		const path = resolve(HISTORY_DIR, id);
		const entry = await readJson(path);
		return entry as HistoryEntry;
	} catch {
		return null;
	}
}

// List all history entries
export async function list(): Promise<HistoryEntry[]> {
	try {
		await ensureDir(HISTORY_DIR);
		const files = await readdir(HISTORY_DIR);
		const entries: HistoryEntry[] = [];

		for (const file of files) {
			if (!file.endsWith(".json")) continue;
			try {
				const entry = await load(file);
				if (entry) entries.push(entry);
			} catch {}
		}

		return entries.sort(
			(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);
	} catch {
		return [];
	}
}

// Remove a history entry
export async function remove(id: string): Promise<void> {
	try {
		const path = resolve(HISTORY_DIR, id);
		await removeFile(path);
	} catch {}
}

// Mark entry as pinned (create a .pinned file)
export async function pin(id: string): Promise<void> {
	try {
		const path = resolve(HISTORY_DIR, `${id}.pinned`);
		await writeJson(path, { pinned: true });
	} catch {}
}

// Search history entries
export async function search(query: string): Promise<HistoryEntry[]> {
	const entries = await list();

	const fuse = new Fuse(entries, {
		keys: ["original", "enhanced", "tags"],
		threshold: 0.3,
	});

	return fuse.search(query).map((result) => result.item);
}
