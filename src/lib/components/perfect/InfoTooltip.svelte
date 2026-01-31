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
	class="flex h-8 w-8 items-center justify-center rounded-full border app-button app-text-subtle transition-colors hover:text-[var(--app-text)]"
	onclick={() => (showModal = true)}
	aria-label="More information about EVs and IVs"
>
	<Info class="h-4 w-4" />
</button>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center app-overlay p-4"
		onclick={handleBackdropClick}
		onkeydown={(e) => {
			if (e.key === 'Escape') showModal = false;
		}}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="info-modal-title"
	>
		<div class="max-h-[80vh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border app-card p-6">
			<div class="flex items-center justify-between">
				<h2 id="info-modal-title" class="text-xl font-bold">
					{$_('perfect.tooltip.evTitle')}
				</h2>
				<button
					type="button"
					class="text-2xl leading-none app-text-subtle hover:text-[var(--app-text)]"
					onclick={() => (showModal = false)}
					aria-label="Close"
				>
					×
				</button>
			</div>

			<div class="space-y-4 text-sm app-text-muted">
				<p>{$_('perfect.tooltip.evBody')}</p>

				<div>
					<h2 class="mb-1 text-xl font-bold">{$_('perfect.tooltip.evMethodTitle')}</h2>
					<p class="text-sm app-text-muted">{$_('perfect.tooltip.evMethodBody')}</p>
				</div>

				<div>
					<h2 class="mb-1 text-xl font-bold">{$_('perfect.tooltip.evResetTitle')}</h2>
					<p class="text-sm app-text-muted">{$_('perfect.tooltip.evResetBody')}</p>
					<img
						src="/merchants/reset-ev.png"
						alt=""
						class="mt-3 w-full rounded-md object-cover"
					/>
				</div>

				<div>
					<h2 class="mb-1 text-xl font-bold">{$_('perfect.tooltip.ivTitle')}</h2>
					<div class="flex items-stretch gap-3">
						<div class="relative flex items-stretch">
							<img
								src="/icons/silver-capsule.png"
								alt=""
								class="absolute bottom-[5px] left-0 z-10 h-1/2 w-auto -translate-x-[10px] -scale-x-100 object-contain opacity-80"
							/>
							<img
								src="/icons/gold-capsule.png"
								alt=""
								class="relative z-0 h-full w-auto object-contain"
							/>
						</div>
						<p class="text-sm app-text-muted">{$_('perfect.tooltip.ivBody')}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
