<script lang="ts">
	import { locale } from 'svelte-i18n';
	import { setLanguage } from '../i18n/index.js';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement | null = null;

	// Initialize from localStorage first (most reliable), then sync with store
	const initialLang = () => {
		if (typeof window === 'undefined') return 'en';
		const storeValue = get(locale);
		// Prefer store value, but fallback to localStorage if store not ready
		if (storeValue === 'en' || storeValue === 'fr') {
			return storeValue;
		}
		// Fallback to localStorage
		const localStorageValue = localStorage.getItem('pokemon-legends-za-language');
		if (localStorageValue === 'en' || localStorageValue === 'fr') {
			return localStorageValue;
		}
		return 'en';
	};
	let currentLang = $state<'en' | 'fr'>(initialLang);

	// Subscribe to locale store and update currentLang reactively
	$effect(() => {
		const unsubscribe = locale.subscribe((value) => {
			if (value === 'en' || value === 'fr') {
				currentLang = value;
			}
		});
		return unsubscribe;
	});

	function handleLanguageChange(newLang: 'en' | 'fr') {
		if (newLang !== currentLang) {
			setLanguage(newLang);
			isOpen = false;
		}
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		// Initialize from locale store immediately as a safety check
		const storeValue = get(locale);
		if (storeValue === 'en' || storeValue === 'fr') {
			currentLang = storeValue;
		} else if (typeof window !== 'undefined') {
			// Fallback to localStorage
			const stored = localStorage.getItem('pokemon-legends-za-language');
			currentLang = stored === 'en' || stored === 'fr' ? stored : 'en';
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	const languages = [
		{ code: 'en' as const, name: 'English', flag: '🇬🇧' },
		{ code: 'fr' as const, name: 'Français', flag: '🇫🇷' }
	];

	// Use derived to ensure reactivity
	let currentLanguage = $derived(
		languages.find((lang) => lang.code === currentLang) || languages[0]
	);
</script>

<div class="relative" bind:this={dropdownRef}>
	<button
		onclick={toggleDropdown}
		class="flex min-h-[44px] touch-manipulation items-center gap-2 rounded-lg border border-blue-700 bg-blue-800/50 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		aria-label="Change language"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<span class="text-lg">{currentLanguage.flag}</span>
		<span class="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
		<svg
			class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-blue-700 bg-blue-800 shadow-xl"
		>
			{#each languages as language}
				<button
					onclick={() => handleLanguageChange(language.code)}
					class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-700 active:bg-blue-600 {currentLang ===
					language.code
						? 'bg-blue-700/50'
						: ''}"
				>
					<span class="text-xl">{language.flag}</span>
					<span class="flex-1 font-medium text-white">{language.name}</span>
					{#if currentLang === language.code}
						<svg class="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
