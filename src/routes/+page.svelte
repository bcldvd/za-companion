<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { iconViewBox, launchpadModules } from '$lib/features/navigation/modules';
</script>

<div class="max-w-5xl mx-auto px-4 py-6">
	<h2 class="text-2xl font-bold">{$_('nav.home')}</h2>

	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each launchpadModules as module}
			<a
				href={module.href}
				class="group rounded-xl border app-card-muted p-4 transition-colors hover:bg-[var(--app-surface-strong)]"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg app-surface-strong app-text-muted transition-colors group-hover:text-[var(--app-text)]"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox={iconViewBox}>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d={module.iconPath}
							/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold">{$_(module.labelKey)}</h3>
				</div>
				{#if module.descriptionKey}
					<p class="mt-2 text-sm app-text-muted">{$_(module.descriptionKey)}</p>
				{/if}
			</a>
		{/each}
	</div>
</div>
