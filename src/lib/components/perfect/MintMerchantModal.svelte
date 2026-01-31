<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { MapPin } from 'lucide-svelte';
	import mintMerchantsData from '$lib/perfect/data/mint-merchants.json';

	type MintMerchant = {
		id: string;
		district: string;
		gender: 'male' | 'female';
		mints: string[];
		mapImage: string;
	};

	const mintMerchants = mintMerchantsData as MintMerchant[];

	let { mintId, show = $bindable(false) }: { mintId: string; show: boolean } = $props();

	const merchants = $derived(
		mintMerchants.filter((merchant) => merchant.mints.includes(mintId))
	);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			show = false;
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') show = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="merchant-modal-title"
	>
		<div class="max-h-[80vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-lg border app-card p-6">
			<div class="flex items-center justify-between">
				<h2 id="merchant-modal-title" class="text-xl font-bold">
					{$_('perfect.merchants.title')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none app-text-subtle hover:text-[var(--app-text)]"
					onclick={() => (show = false)}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="space-y-4">
				{#each merchants as merchant (merchant.id)}
					<div class="rounded border app-card-muted p-3">
						<div class="mb-2 flex items-center gap-2 text-sm app-text-muted">
							<MapPin class="h-4 w-4 app-text-subtle" />
							<span class="font-medium">{$_(`perfect.merchants.${merchant.district}`)}</span>
							<span class="text-xs app-text-subtle">
								({$_(merchant.gender === 'female' ? 'perfect.merchants.vendorF' : 'perfect.merchants.vendorM')})
							</span>
						</div>
						{#if merchant.mapImage}
							<img src={merchant.mapImage} alt="" class="w-full rounded" loading="lazy" />
						{/if}
					</div>
				{/each}
			</div>

		</div>
	</div>
{/if}
