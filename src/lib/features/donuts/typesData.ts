import { getCurrentLanguage } from '$lib/i18n/index.js';

export type TypeOption = {
	id: string;
	label: string;
};

type TypeTranslations = Record<string, string>;

let cachedTranslations: { en: TypeTranslations; fr: TypeTranslations } | null = null;
let translationsPromise: Promise<void> | null = null;

async function loadTranslations(): Promise<void> {
	if (cachedTranslations) return;
	if (translationsPromise) return translationsPromise;

	translationsPromise = (async () => {
		try {
			const [enResponse, frResponse] = await Promise.all([
				fetch('/pokemon-types-en.json'),
				fetch('/pokemon-types-fr.json')
			]);

			if (!enResponse.ok || !frResponse.ok) {
				throw new Error('Failed to load type translations');
			}

			cachedTranslations = {
				en: (await enResponse.json()) as TypeTranslations,
				fr: (await frResponse.json()) as TypeTranslations
			};
		} catch (error) {
			console.error('Failed to load type translations:', error);
			cachedTranslations = { en: {}, fr: {} };
		}
	})();

	return translationsPromise;
}

export async function loadTypeOptions(locale?: 'en' | 'fr'): Promise<TypeOption[]> {
	await loadTranslations();
	const lang = locale ?? getCurrentLanguage();
	const translations = cachedTranslations?.[lang] ?? {};
	return Object.entries(translations).map(([id, label]) => ({ id, label }));
}

export function getTypeLabel(typeId: string, locale?: 'en' | 'fr'): string {
	if (!cachedTranslations) {
		return typeId;
	}
	const lang = locale ?? getCurrentLanguage();
	return cachedTranslations[lang]?.[typeId] ?? typeId;
}
