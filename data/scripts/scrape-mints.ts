import * as cheerio from 'cheerio';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');
const STATIC_DIR = join(ROOT_DIR, 'static');
const MINTS_DIR = join(STATIC_DIR, 'mints');
const I18N_EN_PATH = join(ROOT_DIR, 'src', 'lib', 'i18n', 'en.json');
const I18N_FR_PATH = join(ROOT_DIR, 'src', 'lib', 'i18n', 'fr.json');

const SOURCE_URL = 'https://www.serebii.net/swordshield/naturechanging.shtml';
const POKEAPI_ITEM_BASE = 'https://pokeapi.co/api/v2/item';

type MintEntry = {
	id: string;
	nameKey: string;
	effect: string;
	spritePath: string;
	sourceUrl: string;
	itemUrl?: string;
};

function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function normalizeHeader(value: string): string {
	return normalizeText(value).toLowerCase();
}

function toMintId(name: string): string {
	const trimmed = normalizeText(name);
	return trimmed
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function resolveUrl(src?: string): string | null {
	if (!src) return null;
	if (src.startsWith('http')) return src;
	return src.startsWith('/') ? `https://www.serebii.net${src}` : `https://www.serebii.net/${src}`;
}

async function fetchFrenchName(englishName: string): Promise<string | null> {
	const slug = toMintId(englishName);
	try {
		const response = await fetch(`${POKEAPI_ITEM_BASE}/${slug}`);
		if (!response.ok) return null;
		const data = await response.json();
		const french = data.names?.find((entry: { language: { name: string } }) => entry.language?.name === 'fr');
		return french?.name ?? null;
	} catch {
		return null;
	}
}

async function downloadSprite(url: string, outputPath: string): Promise<void> {
	if (existsSync(outputPath)) return;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download sprite: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	await writeFile(outputPath, Buffer.from(arrayBuffer));
}

async function loadI18n(path: string): Promise<Record<string, unknown>> {
	const content = await readFile(path, 'utf-8');
	return JSON.parse(content) as Record<string, unknown>;
}

async function writeI18n(path: string, data: Record<string, unknown>): Promise<void> {
	await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

function findMintsTable($: cheerio.CheerioAPI): cheerio.Element | null {
	let bestMatch: cheerio.Element | null = null;
	$('table').each((_, table) => {
		const $table = $(table);
		const headerCells = $table.find('tr').first().find('th,td');
		const headers = headerCells
			.map((_, cell) => normalizeHeader($(cell).text()))
			.get();

		const hasName = headers.includes('name');
		const hasEffect = headers.includes('effect');
		if (hasName && hasEffect) {
			bestMatch = table;
			return false;
		}
		return true;
	});
	return bestMatch;
}

function mapHeaderIndexes($table: cheerio.Cheerio<cheerio.Element>): Record<string, number> {
	const headerCells = $table.find('tr').first().find('th,td');
	const indexes: Record<string, number> = {};

	headerCells.each((index, cell) => {
		const header = normalizeHeader($table.find(cell).text());
		if (!header) return;
		indexes[header] = index;
	});

	return indexes;
}

async function scrapeMints(): Promise<void> {
	console.log('🌿 Scraping mint data...');
	const response = await fetch(SOURCE_URL, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
		}
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.statusText}`);
	}
	const html = await response.text();
	const $ = cheerio.load(html);

	const tableElement = findMintsTable($);
	if (!tableElement) {
		throw new Error('Could not locate mint table.');
	}

	const $table = $(tableElement);
	const headerIndexes = mapHeaderIndexes($table);

	await mkdir(MINTS_DIR, { recursive: true });

	const entries: MintEntry[] = [];
	const nameTranslations: Record<string, { en: string; fr: string }> = {};
	const frenchCache = new Map<string, string | null>();

	const rows = $table.find('tr').toArray().slice(1);
	for (const row of rows) {
		const $row = $(row);
		const cells = $row.find('td,th');
		if (cells.length === 0) continue;

		const nameIndex = headerIndexes['name'];
		const effectIndex = headerIndexes['effect'];
		if (nameIndex === undefined || effectIndex === undefined) continue;

		const nameCell = cells.eq(nameIndex);
		const nameText = normalizeText(nameCell.text());
		if (!nameText) continue;

		const id = toMintId(nameText);
		const nameKey = `mints.${id}`;
		const effect = normalizeText(cells.eq(effectIndex).text());

		const imageCell = headerIndexes['picture'] !== undefined ? cells.eq(headerIndexes['picture']) : $row;
		const imageSrc = imageCell.find('img').first().attr('src');
		const imageUrl = resolveUrl(imageSrc);

		const itemHref = nameCell.find('a').attr('href');
		const itemUrl = resolveUrl(itemHref || undefined) ?? undefined;

		let spritePath = '';
		if (imageUrl) {
			const spriteFile = join(MINTS_DIR, `${id}.png`);
			try {
				await downloadSprite(imageUrl, spriteFile);
				spritePath = `/mints/${id}.png`;
			} catch (error) {
				console.warn(`⚠️  Failed to download sprite for ${nameText}:`, error);
			}
		}

		let frName = frenchCache.get(nameText) ?? null;
		if (frName === null) {
			frName = await fetchFrenchName(nameText);
			frenchCache.set(nameText, frName);
		}

		nameTranslations[id] = {
			en: nameText,
			fr: frName ?? nameText
		};

		entries.push({
			id,
			nameKey,
			effect,
			spritePath,
			sourceUrl: SOURCE_URL,
			itemUrl
		});
	}

	if (entries.length === 0) {
		throw new Error('No mints found in table.');
	}

	const outputPath = join(STATIC_DIR, 'mints.json');
	await writeFile(outputPath, JSON.stringify(entries, null, 2), 'utf-8');
	console.log(`✅ Wrote ${entries.length} mints to ${outputPath}`);

	const [enData, frData] = await Promise.all([loadI18n(I18N_EN_PATH), loadI18n(I18N_FR_PATH)]);
	enData.mints = enData.mints && typeof enData.mints === 'object' ? enData.mints : {};
	frData.mints = frData.mints && typeof frData.mints === 'object' ? frData.mints : {};

	for (const [id, names] of Object.entries(nameTranslations)) {
		(enData.mints as Record<string, string>)[id] = names.en;
		(frData.mints as Record<string, string>)[id] = names.fr;
	}

	await Promise.all([writeI18n(I18N_EN_PATH, enData), writeI18n(I18N_FR_PATH, frData)]);
	console.log('✅ Updated i18n mint names in en.json and fr.json');
}

scrapeMints().catch((error) => {
	console.error('❌ Mint scraping failed:', error);
	process.exit(1);
});
