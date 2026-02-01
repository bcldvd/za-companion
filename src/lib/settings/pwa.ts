import { writable } from 'svelte/store';

export type UpdateStatus = 'idle' | 'checking' | 'up-to-date' | 'update-available';

export const buildInfo = {
	buildTime: __BUILD_TIME__,
	buildSha: __BUILD_SHA__
};

export const updateStatus = writable<UpdateStatus>('idle');

let registration: ServiceWorkerRegistration | null = null;
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
let waitingWorker: ServiceWorker | null = null;

export const initPWA = () => {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		return () => {};
	}

	const handleControllerChange = () => {
		window.location.reload();
	};

	registrationPromise = navigator.serviceWorker.ready;
	registrationPromise.then((reg) => {
		registration = reg;

		// Check if there's already a waiting worker
		if (reg.waiting) {
			waitingWorker = reg.waiting;
			updateStatus.set('update-available');
		}

		// Listen for new updates
		reg.addEventListener('updatefound', () => {
			const newWorker = reg.installing;
			if (!newWorker) return;

			newWorker.addEventListener('statechange', () => {
				if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
					waitingWorker = newWorker;
					updateStatus.set('update-available');
				}
			});
		});
	});

	navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

	return () => {
		navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
	};
};

export const checkForUpdates = async () => {
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		return;
	}

	updateStatus.set('checking');

	try {
		// Wait for registration with timeout
		if (!registration && registrationPromise) {
			const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
			const result = await Promise.race([registrationPromise, timeout]);
			if (result) {
				registration = result;
			}
		}

		if (!registration) {
			updateStatus.set('idle');
			return;
		}

		await registration.update();

		// Check for waiting worker after update
		if (registration.waiting) {
			waitingWorker = registration.waiting;
			updateStatus.set('update-available');
		} else {
			updateStatus.set('up-to-date');
			setTimeout(() => {
				updateStatus.set('idle');
			}, 2000);
		}
	} catch {
		updateStatus.set('idle');
	}
};

export const applyUpdate = () => {
	if (!waitingWorker) {
		return;
	}

	waitingWorker.postMessage({ type: 'SKIP_WAITING' });
};
