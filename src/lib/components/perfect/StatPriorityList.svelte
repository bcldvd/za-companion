<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { GripVertical } from 'lucide-svelte';
	import type { StatKey } from '$lib/perfect/types';

	let {
		priorities = $bindable<StatKey[]>([]),
		stats
	}: {
		priorities?: StatKey[];
		stats?: Record<StatKey, number> | null;
	} = $props();

	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		if (draggedIndex === null) return;

		const newPriorities = [...priorities];
		const [removed] = newPriorities.splice(draggedIndex, 1);
		newPriorities.splice(toIndex, 0, removed);
		priorities = newPriorities;

		draggedIndex = null;
		dragOverIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	function handleTouchStart(index: number) {
		draggedIndex = index;
	}

	function moveUp(index: number) {
		if (index === 0) return;
		const newPriorities = [...priorities];
		[newPriorities[index - 1], newPriorities[index]] = [
			newPriorities[index],
			newPriorities[index - 1]
		];
		priorities = newPriorities;
	}

	function moveDown(index: number) {
		if (index === priorities.length - 1) return;
		const newPriorities = [...priorities];
		[newPriorities[index], newPriorities[index + 1]] = [
			newPriorities[index + 1],
			newPriorities[index]
		];
		priorities = newPriorities;
	}
</script>

<div class="space-y-1">
	{#each priorities as stat, index (stat)}
		{@const isDragging = draggedIndex === index}
		{@const isDragOver = dragOverIndex === index && draggedIndex !== index}
		<div
			class="flex items-center gap-2 rounded-lg border border-blue-700 bg-blue-800/50 px-3 py-2 transition-all
				{isDragging ? 'opacity-50' : ''}
				{isDragOver ? 'border-blue-400 bg-blue-700/50' : ''}"
			draggable="true"
			ondragstart={(e) => handleDragStart(e, index)}
			ondragover={(e) => handleDragOver(e, index)}
			ondrop={(e) => handleDrop(e, index)}
			ondragend={handleDragEnd}
			ontouchstart={() => handleTouchStart(index)}
			role="listitem"
		>
			<span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 text-xs text-blue-300">
				{index + 1}
			</span>
			<GripVertical class="h-4 w-4 cursor-grab text-blue-500" />
			<div class="flex flex-1 items-center gap-2">
				<span class="text-sm font-medium">{$_(`perfect.stats.${stat}`)}</span>
				{#if stats?.[stat] !== undefined}
					<span class="rounded bg-blue-900 px-2 py-0.5 text-xs text-blue-300">
						{stats[stat]}
					</span>
				{/if}
			</div>
			<!-- Mobile-friendly up/down buttons -->
			<div class="flex gap-1 sm:hidden">
				<button
					type="button"
					class="rounded p-1 text-blue-400 hover:bg-blue-700 hover:text-white disabled:opacity-30"
					onclick={() => moveUp(index)}
					disabled={index === 0}
					aria-label="Move up"
				>
					↑
				</button>
				<button
					type="button"
					class="rounded p-1 text-blue-400 hover:bg-blue-700 hover:text-white disabled:opacity-30"
					onclick={() => moveDown(index)}
					disabled={index === priorities.length - 1}
					aria-label="Move down"
				>
					↓
				</button>
			</div>
		</div>
	{/each}
</div>
