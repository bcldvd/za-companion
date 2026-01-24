/**
 * Hyperspace Shiny Timer Calculator
 * Pure TypeScript module for calculating shiny encounter probabilities and times
 */

export type Method = 'auto' | 'manual';

export type DonutLevel = 0 | 1 | 2 | 3;

export interface CalculatorInput {
	method: Method;
	shinyDonutLevel: DonutLevel;
	alphaDonutLevel: DonutLevel;
	shinyCharm: boolean;
	pokemonPerReset: number;
}

export interface ComputedTimes {
	t50: number; // minutes
	t90: number;
	t95: number;
	t99: number;
	tAvg: number;
	t50Formatted: string;
	t90Formatted: string;
	t95Formatted: string;
	t99Formatted: string;
	tAvgFormatted: string;
	encounters50: number;
	encounters90: number;
	encounters95: number;
	encounters99: number;
	encountersAvg: number;
	encounters50Formatted: string;
	encounters90Formatted: string;
	encounters95Formatted: string;
	encounters99Formatted: string;
	encountersAvgFormatted: string;
	encountersPerMinute: number;
	shinyProbability: number;
	shalphaProbability: number;
	// Shalpha times (Infinity if alpha donut is off)
	t50Shalpha: number;
	t90Shalpha: number;
	t95Shalpha: number;
	t99Shalpha: number;
	tAvgShalpha: number;
	t50ShalphaFormatted: string;
	t90ShalphaFormatted: string;
	t95ShalphaFormatted: string;
	t99ShalphaFormatted: string;
	tAvgShalphaFormatted: string;
	encounters50Shalpha: number;
	encounters90Shalpha: number;
	encounters95Shalpha: number;
	encounters99Shalpha: number;
	encountersAvgShalpha: number;
	encounters50ShalphaFormatted: string;
	encounters90ShalphaFormatted: string;
	encounters95ShalphaFormatted: string;
	encounters99ShalphaFormatted: string;
	encountersAvgShalphaFormatted: string;
}

// Resets per minute constants
const RESETS_PER_MINUTE: Record<Method, number> = {
	auto: 25,
	manual: 10
};

// Shiny odds with Shiny Charm ON (equivalent odds)
const SHINY_ODDS_CHARM_ON: Record<DonutLevel, number> = {
	0: 1 / 1024.38,
	1: 1 / 819.60,
	2: 1 / 683.08,
	3: 1 / 585.57
};

// Shiny odds with Shiny Charm OFF (equivalent odds from provided table)
const SHINY_ODDS_CHARM_OFF: Record<DonutLevel, number> = {
	0: 1 / 4096.0,
	1: 1 / 2048.25,
	2: 1 / 1365.67,
	3: 1 / 1024.38
};

// Alpha donut rates
const ALPHA_RATES: Record<DonutLevel, number> = {
	0: 0,
	1: 0.11,
	2: 0.21,
	3: 0.51
};

/**
 * Get the shiny probability for a single encounter
 */
export function getShinyProbability(charmOn: boolean, sparklingLevel: DonutLevel): number {
	const odds = charmOn ? SHINY_ODDS_CHARM_ON : SHINY_ODDS_CHARM_OFF;
	return odds[sparklingLevel];
}

/**
 * Get the alpha probability for a single encounter
 */
export function getAlphaProbability(level: DonutLevel): number {
	return ALPHA_RATES[level];
}

/**
 * Format duration in minutes as "Xm Ys" or "mm:ss"
 */
export function formatDuration(minutes: number): string {
	if (!isFinite(minutes) || minutes < 0) {
		return '—';
	}

	const totalSeconds = Math.round(minutes * 60);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;

	if (m === 0) {
		return `${s}s`;
	}
	if (s === 0) {
		return `${m}m`;
	}
	return `${m}m ${s}s`;
}

/**
 * Format encounter counts as a compact string
 */
export function formatEncounters(count: number): string {
	if (!isFinite(count) || count <= 0) {
		return '—';
	}

	const rounded = Math.round(count);

	if (rounded < 10000) {
		return String(rounded);
	}

	if (rounded < 1_000_000) {
		const compact = (rounded / 1000).toFixed(1);
		return `${compact.endsWith('.0') ? compact.slice(0, -2) : compact}k`;
	}

	const compact = (rounded / 1_000_000).toFixed(1);
	return `${compact.endsWith('.0') ? compact.slice(0, -2) : compact}M`;
}

/**
 * Compute time required to reach a given confidence level
 * Formula: t = ln(1 - C) / (r * k * ln(1 - p))
 * where C = confidence, r = resets/min, k = pokemon/reset, p = shiny probability
 */
function computeTimeForConfidence(
	confidence: number,
	resetsPerMinute: number,
	pokemonPerReset: number,
	shinyProbability: number
): number {
	if (shinyProbability <= 0 || shinyProbability >= 1) {
		return Infinity;
	}
	if (confidence <= 0 || confidence >= 1) {
		return Infinity;
	}
	if (resetsPerMinute <= 0 || pokemonPerReset <= 0) {
		return Infinity;
	}

	const numerator = Math.log(1 - confidence);
	const denominator = resetsPerMinute * pokemonPerReset * Math.log(1 - shinyProbability);

	if (denominator === 0 || !isFinite(denominator)) {
		return Infinity;
	}

	return numerator / denominator;
}

/**
 * Compute average time (approximation: 1 / (r * k * p))
 */
function computeAverageTime(
	resetsPerMinute: number,
	pokemonPerReset: number,
	shinyProbability: number
): number {
	if (shinyProbability <= 0 || shinyProbability >= 1) {
		return Infinity;
	}
	if (resetsPerMinute <= 0 || pokemonPerReset <= 0) {
		return Infinity;
	}

	const denominator = resetsPerMinute * pokemonPerReset * shinyProbability;
	if (denominator === 0 || !isFinite(denominator)) {
		return Infinity;
	}

	return 1 / denominator;
}

/**
 * Compute number of encounters required to reach a confidence level
 * Formula: N = ln(1 - C) / ln(1 - p)
 */
function computeEncountersForConfidence(confidence: number, shinyProbability: number): number {
	if (shinyProbability <= 0 || shinyProbability >= 1) {
		return Infinity;
	}
	if (confidence <= 0 || confidence >= 1) {
		return Infinity;
	}

	const numerator = Math.log(1 - confidence);
	const denominator = Math.log(1 - shinyProbability);

	if (denominator === 0 || !isFinite(denominator)) {
		return Infinity;
	}

	return numerator / denominator;
}

/**
 * Compute average encounters (approximation: 1 / p)
 */
function computeAverageEncounters(shinyProbability: number): number {
	if (shinyProbability <= 0 || shinyProbability >= 1) {
		return Infinity;
	}

	return 1 / shinyProbability;
}

/**
 * Main calculation function: computes all times for given inputs
 */
export function computeHyperspaceTimes(input: CalculatorInput): ComputedTimes {
	const { method, shinyDonutLevel, alphaDonutLevel, shinyCharm, pokemonPerReset } = input;

	// Validate pokemonPerReset
	if (!isFinite(pokemonPerReset) || pokemonPerReset <= 0) {
		throw new Error('pokemonPerReset must be a positive number');
	}

	const resetsPerMinute = RESETS_PER_MINUTE[method];
	const shinyProbability = getShinyProbability(shinyCharm, shinyDonutLevel);
	const alphaProbability = getAlphaProbability(alphaDonutLevel);
	const shalphaProbability = shinyProbability * alphaProbability;

	const encountersPerMinute = resetsPerMinute * pokemonPerReset;

	// Compute times for different confidence levels
	const t50 = computeTimeForConfidence(0.5, resetsPerMinute, pokemonPerReset, shinyProbability);
	const t90 = computeTimeForConfidence(0.9, resetsPerMinute, pokemonPerReset, shinyProbability);
	const t95 = computeTimeForConfidence(0.95, resetsPerMinute, pokemonPerReset, shinyProbability);
	const t99 = computeTimeForConfidence(0.99, resetsPerMinute, pokemonPerReset, shinyProbability);
	const tAvg = computeAverageTime(resetsPerMinute, pokemonPerReset, shinyProbability);
	const encounters50 = computeEncountersForConfidence(0.5, shinyProbability);
	const encounters90 = computeEncountersForConfidence(0.9, shinyProbability);
	const encounters95 = computeEncountersForConfidence(0.95, shinyProbability);
	const encounters99 = computeEncountersForConfidence(0.99, shinyProbability);
	const encountersAvg = computeAverageEncounters(shinyProbability);

	// Compute shalpha times if alpha donut is enabled
	const t50Shalpha = alphaDonutLevel > 0
		? computeTimeForConfidence(0.5, resetsPerMinute, pokemonPerReset, shalphaProbability)
		: Infinity;
	const t90Shalpha = alphaDonutLevel > 0
		? computeTimeForConfidence(0.9, resetsPerMinute, pokemonPerReset, shalphaProbability)
		: Infinity;
	const t95Shalpha = alphaDonutLevel > 0
		? computeTimeForConfidence(0.95, resetsPerMinute, pokemonPerReset, shalphaProbability)
		: Infinity;
	const t99Shalpha = alphaDonutLevel > 0
		? computeTimeForConfidence(0.99, resetsPerMinute, pokemonPerReset, shalphaProbability)
		: Infinity;
	const tAvgShalpha = alphaDonutLevel > 0
		? computeAverageTime(resetsPerMinute, pokemonPerReset, shalphaProbability)
		: Infinity;
	const encounters50Shalpha = alphaDonutLevel > 0
		? computeEncountersForConfidence(0.5, shalphaProbability)
		: Infinity;
	const encounters90Shalpha = alphaDonutLevel > 0
		? computeEncountersForConfidence(0.9, shalphaProbability)
		: Infinity;
	const encounters95Shalpha = alphaDonutLevel > 0
		? computeEncountersForConfidence(0.95, shalphaProbability)
		: Infinity;
	const encounters99Shalpha = alphaDonutLevel > 0
		? computeEncountersForConfidence(0.99, shalphaProbability)
		: Infinity;
	const encountersAvgShalpha = alphaDonutLevel > 0
		? computeAverageEncounters(shalphaProbability)
		: Infinity;

	return {
		t50,
		t90,
		t95,
		t99,
		tAvg,
		t50Formatted: formatDuration(t50),
		t90Formatted: formatDuration(t90),
		t95Formatted: formatDuration(t95),
		t99Formatted: formatDuration(t99),
		tAvgFormatted: formatDuration(tAvg),
		encounters50,
		encounters90,
		encounters95,
		encounters99,
		encountersAvg,
		encounters50Formatted: formatEncounters(encounters50),
		encounters90Formatted: formatEncounters(encounters90),
		encounters95Formatted: formatEncounters(encounters95),
		encounters99Formatted: formatEncounters(encounters99),
		encountersAvgFormatted: formatEncounters(encountersAvg),
		encountersPerMinute,
		shinyProbability,
		shalphaProbability: alphaDonutLevel > 0 ? shalphaProbability : 0,
		t50Shalpha,
		t90Shalpha,
		t95Shalpha,
		t99Shalpha,
		tAvgShalpha,
		t50ShalphaFormatted: formatDuration(t50Shalpha),
		t90ShalphaFormatted: formatDuration(t90Shalpha),
		t95ShalphaFormatted: formatDuration(t95Shalpha),
		t99ShalphaFormatted: formatDuration(t99Shalpha),
		tAvgShalphaFormatted: formatDuration(tAvgShalpha),
		encounters50Shalpha,
		encounters90Shalpha,
		encounters95Shalpha,
		encounters99Shalpha,
		encountersAvgShalpha,
		encounters50ShalphaFormatted: formatEncounters(encounters50Shalpha),
		encounters90ShalphaFormatted: formatEncounters(encounters90Shalpha),
		encounters95ShalphaFormatted: formatEncounters(encounters95Shalpha),
		encounters99ShalphaFormatted: formatEncounters(encounters99Shalpha),
		encountersAvgShalphaFormatted: formatEncounters(encountersAvgShalpha)
	};
}
