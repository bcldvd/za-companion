<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Info } from 'lucide-svelte';

	let showModal = $state(false);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			showModal = false;
		}
	}
</script>

<button
	type="button"
	class="flex h-8 w-8 items-center justify-center rounded-full border border-blue-700 bg-blue-800/50 text-blue-300 transition-colors hover:bg-blue-700/50 hover:text-white"
	onclick={() => (showModal = true)}
	aria-label="More information about attack styles"
>
	<Info class="h-4 w-4" />
</button>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') showModal = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="attack-style-modal-title"
	>
		<div class="w-full max-w-md space-y-4 rounded-lg border border-blue-700 bg-blue-900 p-6">
			<div class="flex items-center justify-between">
				<h2 id="attack-style-modal-title" class="text-xl font-bold">
					{$_('perfect.tooltip.attackStyleTitle')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none text-blue-300 hover:text-white"
					onclick={() => (showModal = false)}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="text-sm text-blue-200">
				<p>{$_('perfect.tooltip.attackStyleBody')}</p>
			</div>
		</div>
	</div>
{/if}
