<script lang="ts">
	import { _ } from 'svelte-i18n';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import ThemeModeToggle from '$lib/components/ThemeModeToggle.svelte';
</script>

<div class="max-w-2xl mx-auto px-4 py-6">
	<h2 class="text-2xl font-bold">{$_('nav.settings')}</h2>
	<div class="mt-6 rounded-lg border app-card-muted p-4">
		<p class="text-sm font-semibold app-text-subtle">{$_('settings.language')}</p>
		<div class="mt-3">
			<LanguageToggle />
		</div>
	</div>
	<div class="mt-4 rounded-lg border app-card-muted p-4">
		<p class="text-sm font-semibold app-text-subtle">{$_('settings.theme')}</p>
		<div class="mt-3">
			<ThemeModeToggle />
		</div>
	</div>
</div>
