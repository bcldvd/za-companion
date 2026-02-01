import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { execSync } from 'child_process';

function getBuildSha(): string {
	// Check CI environment variables first
	const ciSha =
		process.env.GITHUB_SHA ||
		process.env.VERCEL_GIT_COMMIT_SHA ||
		process.env.COMMIT_REF;
	if (ciSha) {
		return ciSha.slice(0, 7);
	}
	// Fallback to git command
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__BUILD_SHA__: JSON.stringify(getBuildSha())
	},
	server: {
		port: 5180
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'node'
	}
});
