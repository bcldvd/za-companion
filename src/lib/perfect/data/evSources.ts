import type { Zone } from '../types';

export const EV_ZONES: Zone[] = [
	// Speed zones
	{
		id: 'zone-1',
		stat: 'spe',
		evSources: [
			{ nationalNumber: 13, evYield: 1, stat: 'spe' }, // Aspicot
			{ nationalNumber: 16, evYield: 1, stat: 'spe' }, // Roucool
			{ nationalNumber: 661, evYield: 1, stat: 'spe' }, // Fletchling
			{ nationalNumber: 659, evYield: 1, stat: 'spe' } // Bunnelby
		]
	},
	{
		id: 'zone-2',
		stat: 'spe',
		evSources: [
			{ nationalNumber: 129, evYield: 1, stat: 'spe' }, // Magikarp
			{ nationalNumber: 120, evYield: 1, stat: 'spe' } // Staryu
		]
	},
	{
		id: 'zone-3',
		stat: 'spe',
		evSources: [
			{ nationalNumber: 25, evYield: 2, stat: 'spe' }, // Pikachu
			{ nationalNumber: 677, evYield: 1, stat: 'spe' } // Psystigri
		], 
		hasNotes: true
	},
	// HP zones
	{
		id: 'zone-3',
		stat: 'hp',
		evSources: [
			{ nationalNumber: 672, evYield: 1, stat: 'hp' }, // Cabriolaine
		]
	},
	{
		id: 'zone-12',
		stat: 'hp',
		evSources: [
			{ nationalNumber: 361, evYield: 1, stat: 'hp' }, // Stalgamin
			{ nationalNumber: 673, evYield: 2, stat: 'hp' } // Gogoat
		]
	},
	{
		id: 'zone-19',
		stat: 'hp',
		evSources: [
			{ nationalNumber: 115, evYield: 2, stat: 'hp' }, // Kangaskhan
			{ nationalNumber: 531, evYield: 2, stat: 'hp' }, // Audino
			{ nationalNumber: 35, evYield: 2, stat: 'hp' } // Mélofée
		],
		hasNotes: true
	},
	// Attack zones
	{
		id: 'zone-8',
		stat: 'atk',
		evSources: [
			{ nationalNumber: 551, evYield: 1, stat: 'atk' }, // Mascaïman
			{ nationalNumber: 552, evYield: 2, stat: 'atk' }, // Escroco
			{ nationalNumber: 443, evYield: 1, stat: 'atk' }, // Griknot
			{ nationalNumber: 529, evYield: 1, stat: 'atk' }, // Rototaupe
			{ nationalNumber: 66, evYield: 1, stat: 'atk' }, // Machoc

		]
	},
	{
		id: 'zone-12',
		stat: 'atk',
		evSources: [
			{ nationalNumber: 66, evYield: 1, stat: 'atk' }, // Machoc
			{ nationalNumber: 67, evYield: 2, stat: 'atk' }, // Machopeur

		]
	},
	{
		id: 'zone-13',
		stat: 'atk',
		evSources: [
			{ nationalNumber: 127, evYield: 2, stat: 'atk' }, // Pinsir
			{ nationalNumber: 709, evYield: 2, stat: 'atk' }, // Trevenant
			{ nationalNumber: 214, evYield: 2, stat: 'atk' }, // Heracross
			{ nationalNumber: 70, evYield: 2, stat: 'atk' }, // Boustiflor
			{ nationalNumber: 123, evYield: 1, stat: 'atk' }, // Insécateur
			{ nationalNumber: 708, evYield: 1, stat: 'atk' }, // Brocélôme
		],
		hasNotes: true
	},
	{
		id: 'zone-18',
		stat: 'atk',
		evSources: [
			{ nationalNumber: 371, evYield: 1, stat: 'atk' }, // Draby
			{ nationalNumber: 373, evYield: 3, stat: 'atk' }, // Drattak
		],
		hasNotes: true
	},
	// Defense zones
	{
		id: 'zone-14',
		stat: 'def',
		evSources: [
			{ nationalNumber: 304, evYield: 1, stat: 'def' }, // Aron
			{ nationalNumber: 305, evYield: 2, stat: 'def' }, // Lairon
			{ nationalNumber: 95, evYield: 1, stat: 'def' } // Onix
		],
		hasNotes: true
	},
	// Sp. Atk zones
	{
		id: 'zone-4',
		stat: 'spa',
		evSources: [
			{ nationalNumber: 92, evYield: 1, stat: 'spa' }, // Fantominus
		]
	},
	{
		id: 'zone-7',
		stat: 'spa',
		evSources: [
			{ nationalNumber: 315, evYield: 2, stat: 'spa' }, // Roselia
			{ nationalNumber: 582, evYield: 1, stat: 'spa' } // Vanillite
		]
	},
	{
		id: 'zone-17',
		stat: 'spa',
		evSources: [{ nationalNumber: 668, evYield: 2, stat: 'spa' }], // Pyroar
		hasNotes: true
	},
	// Sp. Def zones
	{
		id: 'zone-18',
		stat: 'spd',
		evSources: [
			{ nationalNumber: 333, evYield: 1, stat: 'spd' }, // Swablu
			{ nationalNumber: 334, evYield: 2, stat: 'spd' } // Altaria
		],
		hasNotes: true
	},
	{
		id: 'zone-20',
		stat: 'spd',
		evSources: [
			{ nationalNumber: 691, evYield: 2, stat: 'spd' }, // Kravarech
		],
		hasNotes: true
	},
	{
		id: 'zone-sewers',
		stat: 'spd',
		evSources: [
			{ nationalNumber: 690, evYield: 1, stat: 'spd' }, // Venalgue
			{ nationalNumber: 691, evYield: 2, stat: 'spd' }, // Kravarech
			{ nationalNumber: 704, evYield: 1, stat: 'spd' }, // Mucuscule
		]
	}
];

export function getZonesForStat(stat: string): Zone[] {
	return EV_ZONES.filter((zone) => zone.stat === stat);
}

export function getBestZoneForStat(stat: string): Zone | undefined {
	const zones = getZonesForStat(stat);
	return zones.find((z) => z.hasNotes) ?? zones[0];
}
