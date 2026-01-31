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
		flavorRequirements: {
			sweet: 310,
			spicy: 100,
			sour: 310,
			bitter: 40,
			fresh: 40
		},
		specialLegendaryPokemonId: '491',
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
		flavorRequirements: {
			sweet: 120,
			spicy: 40,
			sour: 340,
			bitter: 40,
			fresh: 390
		},
		specialLegendaryPokemonId: '384',
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
		flavorRequirements: {
			sweet: 260,
			spicy: 160,
			sour: 160,
			bitter: 20,
			fresh: 260
		},
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
		flavorRequirements: {
			sweet: 50,
			spicy: 50,
			sour: 210,
			bitter: 180,
			fresh: 370
		},
		specialLegendaryPokemonId: '382',
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
		flavorRequirements: {
			sweet: 40,
			spicy: 200,
			sour: 400,
			bitter: 280,
			fresh: 40
		},
		specialLegendaryPokemonId: '807',
		isSpecialLegendary: true
	}
];
