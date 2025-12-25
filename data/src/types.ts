export interface Pokemon {
	regionalNumber: number; // Regional dex position (#001 in table → 1)
	nationalNumber: number; // National dex number (from image URL like 056.png → 56)
	name: string; // Pokemon name
	types: string[]; // Array of type names (e.g., ["Grass", "Poison"])
	imageUrl: string; // URL to Pokemon image
}

export interface ScrapedPokemon {
	regionalNumber: number; // Regional dex position (from #001, #002, etc.)
	nationalNumber: number; // National dex number (from image URL)
	number: string; // String from table (e.g., "#001") - kept for compatibility
	name: string;
	imageUrl: string;
	typeUrls: string[]; // URLs to type pages (e.g., ["/pokedex-sv/grass.shtml"])
}

