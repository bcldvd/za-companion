import type { DonutRecipe } from './types';

export const recommendedDonutRecipes: DonutRecipe[] = [
	{
		id: 'eight-tanga-max-roll',
		name: 'Eight Tanga Berry Donut (Max Shiny/Alpha)',
		nameKey: 'donuts.recipes.eightTanga.name',
		category: 'recommended',
		tags: ['shiny', 'alpha', 'highCost', 'maxRoll'],
		imagePath: '/donuts/donut_sweet05_big.png',
		ingredients: [{ itemId: 'hyper-tanga', quantity: 8 }],
		flavorRequirements: {
			sweet: 760,
			spicy: 80,
			sour: 80,
			bitter: 40
		},
		explanationBullets: [
			'donuts.recipes.eightTanga.bullets.breakpoint',
			'donuts.recipes.eightTanga.bullets.strongestOdds'
		]
	},
	{
		id: 'six-haban-two-tanga',
		name: 'Six Habanero / Two Tanga (High power, better efficiency)',
		nameKey: 'donuts.recipes.sixHaban.name',
		category: 'recommended',
		tags: ['shiny', 'alpha', 'efficient'],
		imagePath: '/donuts/donut_sweet04_big.png',
		ingredients: [
			{ itemId: 'hyper-haban', quantity: 6 },
			{ itemId: 'hyper-tanga', quantity: 2 }
		],
		flavorRequirements: {
			sweet: 700,
			spicy: 20,
			sour: 20,
			bitter: 10,
			fresh: 390
		},
		explanationBullets: [
			'donuts.recipes.sixHaban.bullets.highTier',
			'donuts.recipes.sixHaban.bullets.lessExpensive'
		]
	},
	{
		id: 'best-tanga-less-rainbow',
		name: 'Best Tanga-less Rainbow (Shiny + farming utility)',
		nameKey: 'donuts.recipes.tangaLessRainbow.name',
		category: 'recommended',
		tags: ['rainbow', 'efficient', 'shiny', 'utility'],
		imagePath: '/donuts/donut_mix05_big.png',
		ingredients: [
			{ itemId: 'hyper-haban', quantity: 3 },
			{ itemId: 'hyper-roseli', quantity: 2 },
			{ itemId: 'hyper-babiri', quantity: 1 },
			{ itemId: 'hyper-chople', quantity: 1 },
			{ itemId: 'hyper-wacan', quantity: 1 }
		],
		flavorRequirements: {
			sweet: 310,
			spicy: 140,
			sour: 310,
			bitter: 135,
			fresh: 195
		},
		explanationBullets: [
			'donuts.recipes.tangaLessRainbow.bullets.rainbowBudget',
			'donuts.recipes.tangaLessRainbow.bullets.zeroTanga'
		]
	},
	{
		id: 'inventory-booster-rainbow',
		name: 'Regular Berry "Inventory Booster" Rainbow',
		nameKey: 'donuts.recipes.inventoryBooster.name',
		category: 'recommended',
		tags: ['rainbow', 'efficient', 'berries'],
		imagePath: '/donuts/donut_mix04_big.png',
		ingredients: [
			{ itemId: 'hyper-haban', quantity: 3 },
			{ itemId: 'hyper-roseli', quantity: 2 },
			{ itemId: 'hyper-kasib', quantity: 1 },
			{ itemId: 'hyper-qualot', quantity: 1 },
			{ itemId: 'payapa', quantity: 1 }
		],
		flavorRequirements: {
			sweet: 310,
			spicy: 135,
			sour: 310,
			bitter: 5,
			fresh: 205
		},
		explanationBullets: [
			'donuts.recipes.inventoryBooster.bullets.hyperspaceStretch'
		]
	}
];
