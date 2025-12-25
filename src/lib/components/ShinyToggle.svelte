<script lang="ts">
	import { _ } from 'svelte-i18n';

	const STORAGE_KEY = 'pokemon-legends-za-shiny';

	// Expose isShiny to parent via prop binding
	let { isShiny = $bindable(false) } = $props();

	function toggleShiny() {
		isShiny = !isShiny;
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, String(isShiny));
		}
	}
</script>

<button
	onclick={toggleShiny}
	class="flex items-center justify-center w-11 h-11 bg-blue-800/50 hover:bg-blue-700 rounded-lg border border-blue-700 text-white transition-colors min-h-[44px] min-w-[44px] touch-manipulation {isShiny
		? 'bg-yellow-600/50 border-yellow-500 hover:bg-yellow-600'
		: ''}"
	aria-label={isShiny ? $_('shiny.enabled') : $_('shiny.disabled')}
	aria-pressed={isShiny}
	title={$_('shiny.toggle')}
>
	<svg
		class="w-9 h-9 {isShiny ? 'text-yellow-300' : 'text-blue-300'}"
		fill="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Legends ZA-style shiny icon: one large sparkle + a smaller sparkle offset top-right -->
		<!-- Scaled + re-centered to better fill the 44x44 button -->
		<g transform="translate(12 12) scale(1.25) translate(-11.8 -8.6)">
			<!-- Large sparkle (curvy 4-point star) -->
			<path
				d="M9.2 4
				   C9.9 7.3 11.2 8.6 14.5 9.3
				   C11.2 10.0 9.9 11.3 9.2 14.6
				   C8.5 11.3 7.2 10.0 3.9 9.3
				   C7.2 8.6 8.5 7.3 9.2 4
				   Z"
				fill="currentColor"
			/>
			<!-- Small sparkle (same shape, offset to top-right) -->
			<path
				d="M16.8 2.6
				   C17.2 4.4 17.9 5.1 19.7 5.5
				   C17.9 5.9 17.2 6.6 16.8 8.4
				   C16.4 6.6 15.7 5.9 13.9 5.5
				   C15.7 5.1 16.4 4.4 16.8 2.6
				   Z"
				fill="currentColor"
				opacity="0.95"
			/>
		</g>
	</svg>
</button>

