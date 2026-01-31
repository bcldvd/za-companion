<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Aromate } from '$lib/perfect/types';
	import MintMerchantModal from './MintMerchantModal.svelte';
	import CompassIcon from '$lib/components/icons/CompassIcon.svelte';

	let { aromate }: { aromate: Aromate | null } = $props();
	let showMerchantModal = $state(false);
</script>

{#if aromate}
	<div class="rounded-lg border app-card-muted p-4">
		<div class="mb-2 text-xs app-text-subtle">{$_('perfect.plan.aromate')}</div>
		<div class="flex items-center gap-3">
			<img
				src="/mints/{aromate.id}-mint.png"
				alt=""
				class="h-12 w-12 object-contain"
			/>
			<div class="relative flex-1 pr-24">
				<div class="text-lg font-semibold">{$_(`mints.${aromate.id}-mint`)}</div>
				<button
					type="button"
					class="absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-1 rounded-md border app-button px-2 py-1 text-sm font-semibold transition-colors hover:text-[var(--app-text)]"
					onclick={() => (showMerchantModal = true)}
				>
					<span>{$_('perfect.plan.aromateTip')}</span>
					<CompassIcon className="h-6 w-6" />
				</button>
				<div class="flex items-center gap-2 text-sm app-text-subtle">
					<span class="flex items-center gap-1">
						<span class="text-[#f76280]" aria-hidden="true">▲</span>
						<span>{$_(`perfect.stats.${aromate.boostsStat}`)}</span>
					</span>
					<span class="flex items-center gap-1">
						<span class="text-[#3db9e4]" aria-hidden="true">▼</span>
						<span>{$_(`perfect.stats.${aromate.lowersStat}`)}</span>
					</span>
				</div>
			</div>
		</div>
	</div>

	<MintMerchantModal mintId={aromate.id} bind:show={showMerchantModal} />
{/if}
