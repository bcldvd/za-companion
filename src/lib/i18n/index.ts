import { register, init, getLocaleFromNavigator, locale as localeStore, waitLocale } from 'svelte-i18n';

const STORAGE_KEY = 'pokemon-legends-za-language';

// Register locales
register('en', () => import('./en.json'));
register('fr', () => import('./fr.json'));

// Get initial locale from localStorage or browser
function getInitialLocale(): string {
	if (typeof window === 'undefined') {
		return 'en'; // SSR fallback
	}

	// Check localStorage first
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'en' || stored === 'fr') {
		return stored;
	}

	// Fall back to browser language
	const browserLang = getLocaleFromNavigator();
	if (browserLang?.startsWith('fr')) {
		return 'fr';
	}

	return 'en'; // Default to English
}

// Initialize i18n
init({
	initialLocale: getInitialLocale(),
	fallbackLocale: 'en'
});

// Export function to wait for locale to be ready
export async function waitForLocale(): Promise<void> {
	if (typeof window === 'undefined') {
		return;
	}
	const initialLocale = getInitialLocale();
	try {
		await waitLocale(initialLocale);
	} catch {
		// If initial locale fails, wait for fallback
		await waitLocale('en');
	}
}

// Export function to change language
export function setLanguage(newLocale: 'en' | 'fr'): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, newLocale);
		localeStore.set(newLocale);
	}
}

// Export function to get current language
// Note: This reads from localStorage. For reactive access, use the locale store directly.
export function getCurrentLanguage(): 'en' | 'fr' {
	if (typeof window === 'undefined') {
		return 'en';
	}
	const stored = localStorage.getItem(STORAGE_KEY);
	return (stored === 'en' || stored === 'fr') ? stored : 'en';
}

// Export the locale store for reactive access
export { localeStore as locale };

