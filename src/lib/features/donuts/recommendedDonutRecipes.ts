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
		explanationBullets: [
			'donuts.recipes.inventoryBooster.bullets.hyperspaceStretch'
		]
	},
	{
		id: 'main-farming-tool',
		name: 'The Main Farming Tool (Pure Sour)',
		nameKey: 'donuts.recipes.mainFarmingTool.name',
		category: 'recommended',
		tags: ['berries', 'efficient'],
		imagePath: '/donuts/donut_sour05_big.png',
		ingredients: [
			{ itemId: 'hyper-kasib', quantity: 5 },
			{ itemId: 'hyper-roseli', quantity: 3 }
		],
		explanationBullets: [
			'donuts.recipes.mainFarmingTool.bullets.itemPower',
			'donuts.recipes.mainFarmingTool.bullets.berryYield'
		]
	},
	{
		id: 'five-star-rainbow-farmer',
		name: 'The 5-Star Rainbow Farmer',
		nameKey: 'donuts.recipes.fiveStarRainbow.name',
		category: 'recommended',
		tags: ['rainbow', 'berries', 'efficient'],
		imagePath: '/donuts/donut_mix05_big.png',
		ingredients: [
			{ itemId: 'hyper-roseli', quantity: 2 },
			{ itemId: 'hyper-babiri', quantity: 4 },
			{ itemId: 'hyper-charti', quantity: 1 },
			{ itemId: 'hyper-payapa', quantity: 1 }
		],
		explanationBullets: [
			'donuts.recipes.fiveStarRainbow.bullets.longerDuration',
			'donuts.recipes.fiveStarRainbow.bullets.largeDistortions'
		]
	},
	{
		id: 'strongest-no-tanga-rainbow',
		name: 'The Strongest No-Tanga Rainbow',
		nameKey: 'donuts.recipes.strongestNoTanga.name',
		category: 'recommended',
		tags: ['rainbow', 'shiny', 'efficient'],
		imagePath: '/donuts/donut_mix05_big.png',
		ingredients: [
			{ itemId: 'hyper-roseli', quantity: 1 },
			{ itemId: 'hyper-haban', quantity: 5 },
			{ itemId: 'hyper-charti', quantity: 1 },
			{ itemId: 'hyper-payapa', quantity: 1 }
		],
		explanationBullets: [
			'donuts.recipes.strongestNoTanga.bullets.longerSparkling',
			'donuts.recipes.strongestNoTanga.bullets.zeroTanga'
		]
	},
	{
		id: 'reliable-mid-tier',
		name: 'The "Reliable" Mid-Tier',
		nameKey: 'donuts.recipes.reliableMidTier.name',
		category: 'recommended',
		tags: ['shiny', 'efficient'],
		imagePath: '/donuts/donut_sweet04_big.png',
		ingredients: [
			{ itemId: 'hyper-haban', quantity: 3 },
			{ itemId: 'hyper-kasib', quantity: 1 },
			{ itemId: 'hyper-payapa', quantity: 1 },
			{ itemId: 'hyper-chople', quantity: 3 }
		],
		explanationBullets: [
			'donuts.recipes.reliableMidTier.bullets.easyBerries',
			'donuts.recipes.reliableMidTier.bullets.sustainable'
		]
	}
];
