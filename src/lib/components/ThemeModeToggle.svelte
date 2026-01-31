<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { themeMode, setThemeMode, type ThemeMode } from '$lib/settings/theme';

	const options = [
		{ value: 'system' as const, labelKey: 'settings.themeSystem' },
		{ value: 'light' as const, labelKey: 'settings.themeLight' },
		{ value: 'dark' as const, labelKey: 'settings.themeDark' }
	];

	let currentMode = $state<ThemeMode>('system');

	$effect(() => {
		const unsubscribe = themeMode.subscribe((value) => {
			currentMode = value;
		});
		return unsubscribe;
	});

	const handleModeChange = (mode: ThemeMode) => {
		if (mode !== currentMode) {
			setThemeMode(mode);
		}
	};
</script>

<div class="inline-flex rounded-lg border app-border app-surface-muted p-1">
	{#each options as option}
		<button
			type="button"
			class="min-h-[44px] touch-manipulation rounded-md border px-3 py-2 text-sm font-semibold transition-colors {currentMode ===
			option.value
				? 'app-button-primary'
				: 'app-button'}"
			aria-pressed={currentMode === option.value}
			onclick={() => handleModeChange(option.value)}
		>
			{$_(option.labelKey)}
		</button>
	{/each}
</div>
