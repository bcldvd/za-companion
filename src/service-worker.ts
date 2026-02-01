/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const CACHE_NAME = `legends-za-${version}`;
const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

self.addEventListener('install', (event: ExtendableEvent) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE_NAME) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event: FetchEvent) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	async function respond() {
		const url = new URL(event.request.url);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return fetch(event.request);
		}
		if (url.hostname === 'localhost' && (url.pathname.startsWith('/@fs/') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/@vite/') || url.pathname.startsWith('/.svelte-kit/') || url.pathname.endsWith('.json'))) {
			return fetch(event.request);
		}
		const cache = await caches.open(CACHE_NAME);

		// For API requests, try network first, then cache
		if (url.pathname.startsWith('/api/')) {
			try {
				const response = await fetch(event.request);
				if (response.ok) {
					cache.put(event.request, response.clone());
				}
				return response;
			} catch {
				const cached = await cache.match(event.request);
				if (cached) {
					return cached;
				}
			}
		}

		// For other requests, try cache first, then network
		const cached = await cache.match(event.request);
		if (cached) {
			return cached;
		}

		try {
			const response = await fetch(event.request);
			if (response.ok) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch {
			// Return offline page or error response
			return new Response('Offline', { status: 503 });
		}
	}

	event.respondWith(respond());
});

self.addEventListener('message', (event: MessageEvent) => {
	if (event.data?.type === 'SKIP_WAITING') {
		(self as unknown as ServiceWorkerGlobalScope).skipWaiting();
	}
});

