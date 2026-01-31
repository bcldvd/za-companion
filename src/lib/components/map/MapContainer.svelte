<script lang="ts">
	import { browser } from '$app/environment';
	import { _ } from 'svelte-i18n';
	import type { Map, LayerGroup, Circle, Polyline, Marker } from 'leaflet';
	import type { MapSpawnLocation, MapPOI, MapFilterState } from '$lib/map/types';
	import { mapConfig, gameToLeaflet } from '$lib/map/mapConfig';
	import { getSpriteUrl, normalizePokemonNumber } from '$lib/map/mapData';
	import { filterSpawnsByPokemon } from '$lib/map/pokemonFilters';
	import { loadPokedex, getLocalizedPokemonName } from '$lib/utils/pokedex';
	import type { Pokemon } from '$lib/types/pokemon';

	let {
		spawns,
		pois,
		filterState,
		isShiny
	}: {
		spawns: MapSpawnLocation[];
		pois: MapPOI[];
		filterState: MapFilterState;
		isShiny: boolean;
	} = $props();

	type RenderParams = {
		spawns: MapSpawnLocation[];
		pois: MapPOI[];
		filterState: MapFilterState;
		isShiny: boolean;
	};

	let mapContainer: HTMLDivElement | null = null;
	let attachmentActive = false;
	let pendingRender: RenderParams | null = null;
	let leafletMap: Map | null = null;
	let layerGroups: {
		spawns: LayerGroup | null;
		benches: LayerGroup | null;
		alphas: LayerGroup | null;
		ladders: LayerGroup | null;
	} = {
		spawns: null,
		benches: null,
		alphas: null,
		ladders: null
	};
	let radiusCircle: Circle | null = null;
	let radiusLine: Polyline | null = null;
	let radiusLabel: Marker | null = null;
	let pokedex: Pokemon[] = [];
	let L: any = null; // Leaflet will be dynamically imported

	// Track if map is dragging the circle
	let isDraggingCircle = false;

	// Store event handlers for cleanup
	let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
	let mouseUpHandler: (() => void) | null = null;

	function mapAttachment(params: RenderParams) {
		return (node: HTMLDivElement) => {
			attachmentActive = true;
			mapContainer = node;
			if (!leafletMap) {
				setupMap(node);
			}
			renderMarkers(params);

			return () => {
				attachmentActive = false;
				queueMicrotask(() => {
					if (attachmentActive) return;

					if (mouseMoveHandler) {
						document.removeEventListener('mousemove', mouseMoveHandler);
					}
					if (mouseUpHandler) {
						document.removeEventListener('mouseup', mouseUpHandler);
					}

					if (leafletMap) {
						leafletMap.remove();
						leafletMap = null;
					}

					if (mapContainer === node) {
						mapContainer = null;
					}
				});
			};
		};
	}

	async function setupMap(node: HTMLDivElement) {
		// Only run on client side
		if (!browser) return;

		try {
			// Dynamically import Leaflet only on client side
			const leafletModule = await import('leaflet');
			L = leafletModule.default;

			// Import Leaflet CSS
			await import('leaflet/dist/leaflet.css');
		} catch (error) {
			console.error('Failed to load Leaflet:', error);
			return;
		}

		// Load pokedex for Pokemon names
		try {
			pokedex = await loadPokedex();
		} catch (error) {
			console.error('Failed to load pokedex:', error);
		}

		// Calculate map bounds based on actual tile structure
		// We have 16x16 tiles at zoom 3 (0-0 to 15-15)
		// Each tile is 256px
		// At zoom 3, scale factor is 2^3 = 8
		// So each tile covers 256/8 = 32 coordinate units
		// Total map size: 16 tiles * 32 units = 512 units in each direction
		const tileSize = 256;
		const maxTileCoord = 16; // 0-15 = 16 tiles
		const maxZoomLevel = 3;
		const scaleFactor = Math.pow(2, maxZoomLevel);
		const mapSize = (maxTileCoord * tileSize) / scaleFactor; // 512

		// In Leaflet CRS.Simple, Y axis is inverted (negative goes up)
		const maxBounds = L.latLngBounds(
			[-mapSize, 0],      // Southwest corner (bottom-left)
			[0, mapSize]        // Northeast corner (top-right)
		);

		// Initialize Leaflet map with CRS.Simple
		const map = L.map(node, {
			crs: L.CRS.Simple,
			minZoom: mapConfig.minZoom,
			maxZoom: mapConfig.maxZoom,
			zoomControl: true,
			attributionControl: false,
			maxBounds: maxBounds,
			maxBoundsViscosity: 1.0 // Make bounds fully solid
		});

		if (!map) return;

		// Center the view on the middle of the map
		const initialCenter = L.latLng(-mapSize / 2, mapSize / 2);
		map.setView(initialCenter, mapConfig.initialZoom);

		// Add tile layer with coordinate validation
		const tileLayer = L.tileLayer(mapConfig.tileUrlTemplate, {
			minZoom: mapConfig.minZoom,
			maxZoom: mapConfig.maxZoom,
			tileSize: 256,
			noWrap: true,
			bounds: maxBounds,
			minNativeZoom: 0,
			maxNativeZoom: 3
		});

		// Override getTileUrl to validate coordinates before loading
		const originalGetTileUrl = tileLayer.getTileUrl.bind(tileLayer);
		tileLayer.getTileUrl = function(coords: any) {
			const tilesPerSide = Math.pow(2, coords.z + 1);
			const maxCoord = tilesPerSide - 1;

			// Block invalid coordinates (negative or beyond tile grid)
			if (coords.x < 0 || coords.x > maxCoord || coords.y < 0 || coords.y > maxCoord) {
				// Return transparent 1x1 PNG data URL instead of making a request
				return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
			}

			// Valid tile - use original URL template
			return originalGetTileUrl(coords);
		};

		tileLayer.addTo(map);

		// Create layer groups
		layerGroups.spawns = L.layerGroup().addTo(map);
		layerGroups.benches = L.layerGroup().addTo(map);
		layerGroups.alphas = L.layerGroup().addTo(map);
		layerGroups.ladders = L.layerGroup().addTo(map);

		// Store reference for later use
		leafletMap = map;

		// Create draggable radius circle
		const circleCenter = map.getCenter();
		radiusCircle = L.circle(circleCenter, {
			radius: mapConfig.radiusInGameUnits,
			color: '#ef4444',
			fillColor: '#ef4444',
			fillOpacity: 0.2,
			weight: 2,
			interactive: true // Make it interactive for dragging
		}).addTo(map);


		// Create radius indicator line
		updateRadiusIndicator(circleCenter);

		// Make circle draggable
		setupCircleDragging();

		if (pendingRender) {
			renderMarkers(pendingRender);
		}
	}

	function updateRadiusIndicator(center: any) {
		if (!leafletMap || !L) return;

		// Remove existing indicators
		if (radiusLine) {
			leafletMap.removeLayer(radiusLine);
		}
		if (radiusLabel) {
			leafletMap.removeLayer(radiusLabel);
		}

		// Calculate right edge point (center + radius in X direction)
		// gameToLeaflet(x, y) returns [-y, x] as [lat, lng]
		// So to convert back: game x = latlng.lng, game y = -latlng.lat
		const centerGameX = center.lng;
		const centerGameY = -center.lat;

		const rightEdgeGameX = centerGameX + mapConfig.radiusInGameUnits;
		const rightEdgeGameY = centerGameY;

		const rightEdge = L.latLng(gameToLeaflet(rightEdgeGameX, rightEdgeGameY));

		// Create line from center to right edge
		radiusLine = L.polyline([center, rightEdge], {
			color: '#ef4444',
			weight: 3,
			dashArray: '5, 5',
			interactive: false,
			pane: 'overlayPane'
		}).addTo(leafletMap);

		// Bring line to front
		if (radiusLine) {
			radiusLine.bringToFront();
		}

		// Calculate midpoint of the line
		const midpoint = L.latLng(
			(center.lat + rightEdge.lat) / 2,
			(center.lng + rightEdge.lng) / 2
		);

		// Create label at the midpoint
		const labelIcon = L.divIcon({
			className: 'radius-label',
			html: `<div style="
				background: #ef4444;
				color: white;
				padding: 2px 8px;
				border-radius: 4px;
				font-size: 12px;
				font-weight: bold;
				white-space: nowrap;
				box-shadow: 0 2px 4px rgba(0,0,0,0.3);
				pointer-events: none;
			">${$_('map.radius')}</div>`,
			iconSize: [40, 20],
			iconAnchor: [20, -5]
		});

		radiusLabel = L.marker(midpoint, {
			icon: labelIcon,
			interactive: false,
			pane: 'markerPane'
		}).addTo(leafletMap);
	}

	function setupCircleDragging() {
		if (!radiusCircle || !leafletMap) return;

		const mapContainerEl = leafletMap.getContainer();

		// Use Leaflet's map mousedown event instead of DOM event
		leafletMap!.on('mousedown', (e: any) => {
			const mouseLatLng = e.latlng;
			const distance = leafletMap!.distance(mouseLatLng, radiusCircle!.getLatLng());

			if (distance <= mapConfig.radiusInGameUnits) {
				isDraggingCircle = true;
				leafletMap!.dragging.disable();
				mapContainerEl.style.cursor = 'grabbing';
			}
		});

		// Document-level mousemove - fires even when mouse leaves element
		mouseMoveHandler = (e: MouseEvent) => {
			if (!isDraggingCircle) return;

			// Get mouse position in map coordinates
			const containerRect = mapContainerEl.getBoundingClientRect();
			const containerPoint = L.point(
				e.clientX - containerRect.left,
				e.clientY - containerRect.top
			);
			const mouseLatLng = leafletMap!.containerPointToLatLng(containerPoint);

			// Move circle to mouse position
			radiusCircle!.setLatLng(mouseLatLng);
			updateRadiusIndicator(mouseLatLng);

			e.preventDefault();
		};

		// Document-level mouseup - catches release even outside map
		mouseUpHandler = () => {
			if (isDraggingCircle) {
				isDraggingCircle = false;
				leafletMap!.dragging.enable();
				mapContainerEl.style.cursor = '';
			}
		};

		// Attach move/up to document for drag tracking
		document.addEventListener('mousemove', mouseMoveHandler);
		document.addEventListener('mouseup', mouseUpHandler);

		// Make circle cursor a pointer when hovering
		radiusCircle.on('mouseover', () => {
			if (!isDraggingCircle) {
				mapContainerEl.style.cursor = 'move';
			}
		});

		radiusCircle.on('mouseout', () => {
			if (!isDraggingCircle) {
				mapContainerEl.style.cursor = '';
			}
		});
	}

	function renderMarkers(params: RenderParams) {
		if (!leafletMap || !L) {
			pendingRender = params;
			return;
		}

		const { spawns, pois, filterState, isShiny } = params;
		const filteredSpawns = filterSpawnsByPokemon(spawns, filterState.selectedPokemon);
		const COORD_DECIMALS = 4;
		const DUPLICATE_OFFSET = 0.6;

		// #region agent log
		fetch('http://127.0.0.1:7249/ingest/6db62e92-df2d-4211-b8d7-02d65778a5ab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/components/map/MapContainer.svelte:renderMarkers',message:'renderMarkers',data:{spawnsCount:spawns.length,showSpawns:filterState.pokemonSpawns,benches:filterState.benches,alphas:filterState.alphas,ladders:filterState.ladders},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
		// #endregion agent log

		// Clear all layers
		layerGroups.spawns?.clearLayers();
		layerGroups.benches?.clearLayers();
		layerGroups.alphas?.clearLayers();
		layerGroups.ladders?.clearLayers();

		// Render Pokemon spawn markers
		if (filterState.pokemonSpawns) {
			const spawnBuckets = new Map<
				string,
				{ spawn: MapSpawnLocation; index: number; total: number }
			>();
			const spawnGroups = new Map<string, MapSpawnLocation[]>();

			for (const spawn of filteredSpawns) {
				const key = `${spawn.x.toFixed(COORD_DECIMALS)},${spawn.y.toFixed(COORD_DECIMALS)}`;
				const group = spawnGroups.get(key) ?? [];
				group.push(spawn);
				spawnGroups.set(key, group);
			}

			for (const [key, group] of spawnGroups.entries()) {
				group.forEach((spawn, index) => {
					spawnBuckets.set(`${key}:${spawn.id}`, {
						spawn,
						index,
						total: group.length
					});
				});
			}

			spawnBuckets.forEach(({ spawn, index, total }) => {
				const angle = total > 1 ? (index / total) * Math.PI * 2 : 0;
				const offsetX = total > 1 ? Math.cos(angle) * DUPLICATE_OFFSET : 0;
				const offsetY = total > 1 ? Math.sin(angle) * DUPLICATE_OFFSET : 0;
				const adjustedX = spawn.x + offsetX;
				const adjustedY = spawn.y + offsetY;
				const icon = L.icon({
					iconUrl: getSpriteUrl(spawn.pokemonNationalNumber, isShiny),
					iconSize: [40, 40],
					iconAnchor: [20, 20],
					popupAnchor: [0, -20]
				});

				const marker = L.marker(gameToLeaflet(adjustedX, adjustedY), { icon });

				// Get Pokemon name for popup
				const normalizedNumber = normalizePokemonNumber(spawn.pokemonNationalNumber);
				const pokemon = pokedex.find((p) => p.nationalNumber === normalizedNumber);
				const pokemonName = pokemon ? getLocalizedPokemonName(pokemon) : `#${normalizedNumber}`;
				const spawnTypeLabel = spawn.spawnType === 'alpha' ? ' (Alpha)' : '';

				marker.bindPopup(`<strong>${pokemonName}${spawnTypeLabel}</strong>`);
				marker.addTo(layerGroups.spawns!);
			});
		}

		// Render POI markers
		const benchIcon = L.icon({
			iconUrl: '/icons/bench.png',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16]
		});
		const alphaIcon = L.icon({
			iconUrl: '/icons/alpha.png',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16]
		});
		const ladderIcon = L.icon({
			iconUrl: '/icons/ladder.png',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
			popupAnchor: [0, -16]
		});

		pois.forEach((poi) => {
			let layer: LayerGroup | null = null;
			let color = '';
			let show = false;
			let useIcon = false;
			let icon: any = null;

			switch (poi.type) {
				case 'bench':
					layer = layerGroups.benches;
					color = '#22c55e';
					show = filterState.benches;
					useIcon = true;
					icon = benchIcon;
					break;
				case 'alpha':
					layer = layerGroups.alphas;
					color = '#a855f7';
					show = filterState.alphas;
					useIcon = true;
					icon = alphaIcon;
					break;
				case 'ladder':
					layer = layerGroups.ladders;
					color = '#f59e0b';
					show = filterState.ladders;
					useIcon = true;
					icon = ladderIcon;
					break;
			}

			if (show && layer) {
				const marker = useIcon
					? L.marker(gameToLeaflet(poi.x, poi.y), { icon })
					: L.circleMarker(gameToLeaflet(poi.x, poi.y), {
							radius: 8,
							fillColor: color,
							color: color,
							weight: 2,
							opacity: 1,
							fillOpacity: 0.6
						});

				marker.addTo(layer);
			}
		});
	}

</script>

<div
	{@attach mapAttachment({ spawns, pois, filterState, isShiny })}
	class="w-full h-full"
	style="background: #1e3a8a;"
></div>

<style>
	:global(.leaflet-container) {
		background: #1e3a8a;
		font-family: inherit;
	}

	:global(.leaflet-popup-content-wrapper) {
		background: linear-gradient(135deg, rgb(30, 58, 138) 0%, rgb(29, 78, 216) 100%);
		color: white;
		border: 2px solid rgb(59, 130, 246);
		border-radius: 0.5rem;
	}

	:global(.leaflet-popup-content) {
		margin: 0.75rem;
		font-size: 0.875rem;
	}

	:global(.leaflet-popup-tip) {
		background: rgb(29, 78, 216);
		border: 2px solid rgb(59, 130, 246);
	}

	:global(.radius-label) {
		pointer-events: none !important;
	}
</style>
