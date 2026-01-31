<script lang="ts">
	import { _ } from 'svelte-i18n';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
</script>

<div class="max-w-2xl mx-auto px-4 py-6">
	<h2 class="text-2xl font-bold">{$_('nav.settings')}</h2>
	<div class="mt-6 rounded-lg border border-blue-700 bg-blue-900/60 p-4">
		<p class="text-sm font-semibold text-blue-100">{$_('settings.language')}</p>
		<div class="mt-3">
			<LanguageToggle />
		</div>
	</div>
</div>
