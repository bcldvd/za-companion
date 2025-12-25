import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pokedex, searchPokemonByName, filterPokemonByType } from '$lib/utils/pokedex.js';
import type { Pokemon } from '$lib/types/pokemon.js';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search');
	const regionalNumber = url.searchParams.get('regionalNumber');
	const nationalNumber = url.searchParams.get('nationalNumber');
	const type = url.searchParams.get('type');
	
	let results: Pokemon[] = pokedex;
	
	// Filter by search query (name)
	if (search) {
		results = searchPokemonByName(search);
	}
	
	// Filter by regional number
	if (regionalNumber) {
		const num = parseInt(regionalNumber, 10);
		if (!isNaN(num)) {
			results = results.filter(p => p.regionalNumber === num);
		}
	}
	
	// Filter by national number
	if (nationalNumber) {
		const num = parseInt(nationalNumber, 10);
		if (!isNaN(num)) {
			results = results.filter(p => p.nationalNumber === num);
		}
	}
	
	// Filter by type
	if (type) {
		const types = type.split(',').map(t => t.trim());
		results = filterPokemonByType(types);
		// If we also had a search filter, intersect the results
		if (search) {
			results = results.filter(p => 
				searchPokemonByName(search).some(sp => sp.regionalNumber === p.regionalNumber)
			);
		}
	}
	
	return json(results, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

