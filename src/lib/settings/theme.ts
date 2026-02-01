import { writable } from 'svelte/store';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'pokemon-legends-za-theme-mode';
const DEFAULT_MODE: ThemeMode = 'system';

export const themeMode = writable<ThemeMode>(DEFAULT_MODE);

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null;

const readStoredMode = (): ThemeMode => {
	if (typeof window === 'undefined') return DEFAULT_MODE;
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored;
	}
	return DEFAULT_MODE;
};

const writeStoredMode = (mode: ThemeMode) => {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_KEY, mode);
};

const resolveMode = (mode: ThemeMode): 'light' | 'dark' => {
	if (mode === 'light' || mode === 'dark') return mode;
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const updateThemeColor = (resolved: 'light' | 'dark') => {
	if (typeof document === 'undefined') return;
	const metaTag = document.querySelector('meta[name="theme-color"]');
	if (!metaTag) return;
	metaTag.setAttribute('content', resolved === 'dark' ? '#0f1110' : '#f6f6f4');
};

const applyResolvedTheme = (resolved: 'light' | 'dark') => {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	root.classList.remove('theme-light', 'theme-dark');
	root.classList.add(`theme-${resolved}`);
	root.dataset.theme = resolved;
	root.style.colorScheme = resolved;
};

const applyThemeMode = (mode: ThemeMode) => {
	const resolved = resolveMode(mode);
	applyResolvedTheme(resolved);
	updateThemeColor(resolved);
};

const teardownSystemListener = () => {
	if (mediaQuery && mediaListener) {
		mediaQuery.removeEventListener('change', mediaListener);
	}
	mediaQuery = null;
	mediaListener = null;
};

const setupSystemListener = () => {
	if (typeof window === 'undefined') return;
	teardownSystemListener();
	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaListener = () => {
		applyThemeMode('system');
	};
	mediaQuery.addEventListener('change', mediaListener);
};

export const initThemeMode = () => {
	const stored = readStoredMode();
	themeMode.set(stored);
	applyThemeMode(stored);
	if (stored === 'system') {
		setupSystemListener();
	}
	return () => {
		teardownSystemListener();
	};
};

export const setThemeMode = (mode: ThemeMode) => {
	themeMode.set(mode);
	writeStoredMode(mode);
	applyThemeMode(mode);
	if (mode === 'system') {
		setupSystemListener();
	} else {
		teardownSystemListener();
	}
};
