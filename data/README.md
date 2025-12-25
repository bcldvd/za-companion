# Legends Z-A Data Workspace

This workspace contains tools for scraping and normalizing Pokemon data from Serebii.net for Pokemon Legends Z-A, including both the Lumiose City Pokédex and the Hyperspace Pokédex (DLC).

## Setup

Install dependencies:

```bash
npm install
```

## Usage

Scrape Pokemon data from Serebii:

```bash
npm run scrape
```

This will:
1. Fetch both Pokédex pages from Serebii:
   - Lumiose City Pokédex
   - Hyperspace Pokédex (DLC)
2. Parse and extract Pokemon data (regional number, national number, name, types, image)
3. Normalize the data into a consistent JSON format
4. Write the output to two separate files:
   - `data/pokedex.json` (Lumiose City Pokédex)
   - `data/hyperspace-pokedex.json` (Hyperspace Pokédex)

## Output Format

Each generated JSON file contains an array of Pokemon objects with regional order preserved:

```json
[
  {
    "regionalNumber": 1,
    "nationalNumber": 56,
    "name": "Mankey",
    "types": ["Fighting"],
    "imageUrl": "https://www.serebii.net/legendsz-a/pokemon/small/056.png"
  },
  ...
]
```

### Fields

- `regionalNumber`: The Pokemon's position in the regional Pokédex (e.g., #001 → 1)
- `nationalNumber`: The Pokemon's National Pokédex number (extracted from image URL)
- `name`: The Pokemon's name
- `types`: Array of type names (e.g., ["Grass", "Poison"])
- `imageUrl`: URL to the Pokemon's sprite image

## Integration

The generated JSON files can be imported in the main SvelteKit app for use in API routes and components. Each file represents a separate regional Pokédex, making it easy to create distinct API endpoints like `/api/pokemon/lumiose` and `/api/pokemon/hyperspace`.

