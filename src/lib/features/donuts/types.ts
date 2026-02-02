export type DonutCategory = 'recommended' | 'specialLegendary';

export type DonutIngredient = {
	itemId: string;
	quantity: number;
};

export type FlavorRequirements = {
	sweet: number;
	spicy: number;
	sour: number;
	bitter: number;
	fresh: number;
};

export type DonutRecipe = {
	id: string;
	name: string;
	nameKey?: string;
	category: DonutCategory;
	tags: string[];
	ingredients: DonutIngredient[];
	explanationBullets?: string[];
	imagePath: string;
	flavorRequirements?: FlavorRequirements;
	specialLegendaryPokemonId?: string;
	isSpecialLegendary?: boolean;
};

export type SecondaryAuraType = 'alpha' | 'humungo' | 'teensy';

export type OwnedDonut = {
	id: string;
	label: string;
	labelKey?: string;
	imagePath: string;
	sparklingLevel: 0 | 1 | 2 | 3;
	typeId?: string;
	secondaryAuraType?: SecondaryAuraType;
	secondaryAuraLevel?: 1 | 2 | 3;
	quantity: number;
	reservedForPokemonId?: string;
	isSpecialLegendary?: boolean;
	specialLegendaryPokemonId?: string;
	createdAt: string;
};
