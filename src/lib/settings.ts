import { useSyncExternalStore } from "react";

// ============================================================================
// Types
// ============================================================================

export type AudioBackend = "html5" | "mpv";

export interface Settings {
	audioBackend: AudioBackend;
	mpvPath?: string; // Custom path to mpv binary (optional)
}

// ============================================================================
// Storage
// ============================================================================

const SETTINGS_STORAGE_KEY = "subsonic-settings";

const defaultSettings: Settings = {
	audioBackend: "html5",
};

function loadSettings(): Settings {
	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaultSettings, ...parsed };
		}
	} catch {
		// Invalid stored data, return defaults
	}
	return { ...defaultSettings };
}

function saveSettings(settings: Settings): void {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn("Failed to save settings to localStorage:", err);
	}
}

// ============================================================================
// State Management
// ============================================================================

let currentSettings: Settings = loadSettings();
const listeners = new Set<() => void>();

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}

function subscribe(callback: () => void) {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

function getSnapshot(): Settings {
	return currentSettings;
}

// ============================================================================
// Environment Detection
// ============================================================================

declare global {
	interface Window {
		electronAPI?: {
			platform: string;
			isElectron: boolean;
			mpv?: {
				// Availability and configuration
				isAvailable: (customPath?: string) => Promise<boolean>;
				setPath: (path: string) => Promise<boolean>;
				getPath: () => Promise<string>;
				selectPath: () => Promise<string | null>;

				// Lifecycle
				initialize: (data?: {
					binaryPath?: string;
					extraParameters?: string[];
					properties?: Record<string, unknown>;
				}) => Promise<boolean>;
				restart: (data?: {
					binaryPath?: string;
					extraParameters?: string[];
					properties?: Record<string, unknown>;
				}) => Promise<boolean>;
				isRunning: () => Promise<boolean>;
				cleanup: () => Promise<void>;
				quit: () => void;

				// Playback controls
				play: (url: string) => Promise<boolean>;
				setQueue: (
					current?: string,
					next?: string,
					pause?: boolean,
				) => Promise<void>;
				setQueueNext: (url?: string) => Promise<void>;
				autoNext: (url?: string) => void;
				pause: () => Promise<void>;
				resume: () => Promise<void>;
				stop: () => Promise<void>;
				seek: (time: number) => Promise<void>;
				setVolume: (volume: number) => Promise<void>;
				mute: (mute: boolean) => Promise<void>;

				// State queries
				getPosition: () => Promise<number>;
				getDuration: () => Promise<number>;

				// Event listeners - return cleanup functions
				onTimeUpdate: (
					callback: (data: { position: number; duration: number }) => void,
				) => () => void;
				onEnded: (callback: () => void) => () => void;
				onAutoNext: (callback: () => void) => () => void;
				onError: (callback: (error: string) => void) => () => void;
				onStateChange: (
					callback: (state: { playing: boolean; loading: boolean }) => void,
				) => () => void;
				onFallback: (callback: (isError: boolean) => void) => () => void;
			};
		};
	}
}

export function isElectron(): boolean {
	return (
		typeof window !== "undefined" && window.electronAPI?.isElectron === true
	);
}

export function isMpvAvailable(): boolean {
	return isElectron() && typeof window.electronAPI?.mpv !== "undefined";
}

export async function checkMpvInstalled(): Promise<boolean> {
	if (!isMpvAvailable()) return false;
	try {
		const mpv = window.electronAPI?.mpv;
		if (!mpv) return false;
		return await mpv.isAvailable();
	} catch {
		return false;
	}
}

// ============================================================================
// Public API
// ============================================================================

export function getSettings(): Settings {
	return currentSettings;
}

export function updateSettings(updates: Partial<Settings>): void {
	currentSettings = { ...currentSettings, ...updates };
	saveSettings(currentSettings);
	emitChange();
}

export function setAudioBackend(backend: AudioBackend): void {
	updateSettings({ audioBackend: backend });
}

export function setMpvPath(path: string | undefined): void {
	updateSettings({ mpvPath: path });
}

// ============================================================================
// React Hook
// ============================================================================

export function useSettings() {
	const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return {
		settings,
		updateSettings,
		setAudioBackend,
		setMpvPath,
		isElectron: isElectron(),
		isMpvAvailable: isMpvAvailable(),
	};
}
