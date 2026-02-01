<script lang="ts">
	import { onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { buildInfo, updateStatus, checkForUpdates, applyUpdate } from '$lib/settings/pwa';
	import type { UpdateStatus } from '$lib/settings/pwa';

	let currentStatus = $state<UpdateStatus>('idle');
	let currentLocale = $state<string>('en');

	$effect(() => {
		const unsubscribe = updateStatus.subscribe((value) => {
			currentStatus = value;
		});
		return unsubscribe;
	});

	$effect(() => {
		const unsubscribe = locale.subscribe((value) => {
			currentLocale = value ?? 'en';
		});
		return unsubscribe;
	});

	onMount(() => {
		checkForUpdates();
	});

	const formatDate = (isoString: string, loc: string): string => {
		try {
			const date = new Date(isoString);
			return date.toLocaleDateString(loc, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return isoString;
		}
	};

	const getButtonText = (): string => {
		switch (currentStatus) {
			case 'checking':
				return $_('settings.checking');
			case 'up-to-date':
				return $_('settings.upToDate');
			case 'update-available':
				return $_('settings.updateAvailable');
			default:
				return $_('settings.checkForUpdates');
		}
	};

	const handleCheckClick = () => {
		if (currentStatus === 'idle' || currentStatus === 'up-to-date') {
			checkForUpdates();
		}
	};
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<span class="text-sm app-text-muted">{$_('settings.lastUpdated')}</span>
		<span class="text-sm">{formatDate(buildInfo.buildTime, currentLocale)}</span>
	</div>
	<div class="flex items-center justify-between">
		<span class="text-sm app-text-muted">{$_('settings.buildId')}</span>
		<code class="text-sm font-mono">{buildInfo.buildSha}</code>
	</div>
	<div class="flex items-center gap-2 pt-2">
		<button
			type="button"
			class="min-h-[44px] touch-manipulation rounded-md border px-3 py-2 text-sm font-semibold transition-colors app-button"
			disabled={currentStatus === 'checking'}
			onclick={handleCheckClick}
		>
			{getButtonText()}
		</button>
		{#if currentStatus === 'update-available'}
			<button
				type="button"
				class="min-h-[44px] touch-manipulation rounded-md border px-3 py-2 text-sm font-semibold transition-colors app-button-primary"
				onclick={applyUpdate}
			>
				{$_('settings.updateNow')}
			</button>
		{/if}
	</div>
</div>
