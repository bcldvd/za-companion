import type { DonutRecipe } from './types';

export const specialLegendaryDonutRecipes: DonutRecipe[] = [
	{
		id: 'bad-dreams-cruller',
		name: 'Bad Dreams Cruller',
		nameKey: 'donuts.recipes.badDreams.name',
		category: 'specialLegendary',
		tags: ['specialLegendary'],
		imagePath: '/donuts/donut-darkrai.png',
		ingredients: [
			{ itemId: 'hyper-tanga', quantity: 3 },
			{ itemId: 'hyper-kasib', quantity: 3 },
			{ itemId: 'hyper-coba', quantity: 1 },
			{ itemId: 'hyper-yache', quantity: 1 }
		],
		specialLegendaryPokemonId: '491',
		isSpecialLegendary: true
	},
	{
		id: 'omega-old-fashioned',
		name: 'Omega Old Fashioned Donut',
		nameKey: 'donuts.recipes.omegaOldFashioned.name',
		category: 'specialLegendary',
		tags: ['specialLegendary'],
		imagePath: '/donuts/donut-groudon.png',
		ingredients: [
			{ itemId: 'hyper-haban', quantity: 2 },
			{ itemId: 'hyper-tamato', quantity: 1 },
			{ itemId: 'hyper-tanga', quantity: 1 },
			{ itemId: 'hyper-colbur', quantity: 1 },
			{ itemId: 'hyper-chilan', quantity: 1 },
			{ itemId: 'hyper-roseli', quantity: 1 }
		],
		specialLegendaryPokemonId: '383',
		isSpecialLegendary: true
	},
	{
		id: 'alpha-old-fashioned',
		name: 'Alpha Old Fashioned Donut',
		nameKey: 'donuts.recipes.alphaOldFashioned.name',
		category: 'specialLegendary',
		tags: ['specialLegendary'],
		imagePath: '/donuts/donut-kyogre.png',
		ingredients: [
			{ itemId: 'hyper-payapa', quantity: 2 },
			{ itemId: 'hyper-kelpsy', quantity: 1 },
			{ itemId: 'hyper-yache', quantity: 1 },
			{ itemId: 'hyper-kebia', quantity: 1 },
			{ itemId: 'hyper-kasib', quantity: 1 },
			{ itemId: 'hyper-colbur', quantity: 1 },
			{ itemId: 'hyper-chilan', quantity: 1 }
		],
		specialLegendaryPokemonId: '382',
		isSpecialLegendary: true
	},
	{
		id: 'delta-old-fashioned',
		name: 'Delta Old Fashioned Donut',
		nameKey: 'donuts.recipes.deltaOldFashioned.name',
		category: 'specialLegendary',
		tags: ['specialLegendary'],
		imagePath: '/donuts/donut-rayquaza.png',
		ingredients: [
			{ itemId: 'hyper-oran', quantity: 1 },
			{ itemId: 'hyper-yache', quantity: 1 },
			{ itemId: 'hyper-payapa', quantity: 1 },
			{ itemId: 'hyper-kasib', quantity: 1 },
			{ itemId: 'hyper-haban', quantity: 1 },
			{ itemId: 'hyper-colbur', quantity: 2 },
			{ itemId: 'hyper-roseli', quantity: 1 }
		],
		specialLegendaryPokemonId: '384',
		isSpecialLegendary: true
	},
	{
		id: 'plasma-glazed',
		name: 'Plasma-Glazed Donut',
		nameKey: 'donuts.recipes.plasmaGlazed.name',
		category: 'specialLegendary',
		tags: ['specialLegendary'],
		imagePath: '/donuts/donut-zeraora.png',
		ingredients: [
			{ itemId: 'hyper-kebia', quantity: 1 },
			{ itemId: 'hyper-charti', quantity: 1 },
			{ itemId: 'hyper-kasib', quantity: 4 },
			{ itemId: 'hyper-chilan', quantity: 2 }
		],
		specialLegendaryPokemonId: '807',
		isSpecialLegendary: true
	}
];
