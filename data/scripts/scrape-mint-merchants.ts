import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');
const STATIC_DIR = join(ROOT_DIR, 'static');
const MERCHANTS_DIR = join(STATIC_DIR, 'merchants');
const DATA_DIR = join(ROOT_DIR, 'src', 'lib', 'perfect', 'data');
const OUTPUT_PATH = join(DATA_DIR, 'mint-merchants.json');

const SOURCE_URL =
	'https://www.margxt.fr/ou-acheter-les-aromates-pour-modifier-les-statistiques-des-pokemon-dans-legendes-pokemon-z-a/';

type MintMerchant = {
	id: string;
	district: string;
	gender: 'male' | 'female';
	mints: string[];
	mapImage: string;
};

const MINT_NAME_MAP: Record<string, string> = {
	solo: 'lonely',
	rigide: 'adamant',
	mauvais: 'naughty',
	brave: 'brave',
	serieux: 'serious',
	calme: 'calm',
	gentil: 'gentle',
	prudent: 'careful',
	malpoli: 'sassy',
	modeste: 'modest',
	doux: 'mild',
	foufou: 'rash',
	discret: 'quiet',
	assure: 'bold',
	malin: 'impish',
	lache: 'lax',
	relax: 'relaxed',
	timide: 'timid',
	presse: 'hasty',
	jovial: 'jolly',
	naif: 'naive'
};

function normalizeText(value: string): string {
	return value.replaceAll(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replaceAll(/[\u0300-\u036f]/g, '')
		.replaceAll(/[^a-z0-9]+/g, ' ')
		.replaceAll(/\s+/g, ' ')
		.trim();
}

function slugify(value: string): string {
	return normalizeKey(value).replaceAll(/\s+/g, '-');
}

function resolveUrl(src?: string): string | null {
	if (!src) return null;
	if (src.startsWith('http')) return src;
	return src.startsWith('/') ? `https://www.margxt.fr${src}` : `https://www.margxt.fr/${src}`;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
	if (existsSync(outputPath)) return;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	await writeFile(outputPath, Buffer.from(arrayBuffer));
}

function extractDistrict(title: string): string {
	const base = title.split('–')[0]?.trim() ?? title;
	const cleaned = base.replace(/^\d+e\s+arrondissement\s+de\s+/i, '');
	return slugify(cleaned);
}

function extractGender(title: string): 'male' | 'female' {
	return /marchande/i.test(title) ? 'female' : 'male';
}

function extractMintIds($table: cheerio.Cheerio<cheerio.Element>): string[] {
	const mints: string[] = [];
	const rows = $table.find('tr').toArray().slice(1);
	for (const row of rows) {
		const cells = $table.find(row).find('td,th');
		if (cells.length === 0) continue;
		const name = normalizeText(cells.eq(0).text());
		if (!name) continue;
		const normalized = normalizeKey(name).replace(/^aromate\s+/, '').trim();
		const id = MINT_NAME_MAP[normalized];
		if (!id) {
			console.warn(`⚠️  Unknown mint name: ${name}`);
			continue;
		}
		if (!mints.includes(id)) {
			mints.push(id);
		}
	}
	return mints;
}

async function scrapeMintMerchants(): Promise<void> {
	console.log('🌿 Scraping mint merchant locations...');
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

	await Promise.all([mkdir(MERCHANTS_DIR, { recursive: true }), mkdir(DATA_DIR, { recursive: true })]);

	const merchants: MintMerchant[] = [];
	const districtCounts = new Map<string, number>();
	const downloadQueue: Promise<void>[] = [];

	$('h2, h3').each((_, heading) => {
		const title = normalizeText($(heading).text());
		if (!/marchand/i.test(title)) return;

		const $content = $(heading).nextUntil('h2, h3');
		const $table = $content.find('table').first();
		if ($table.length === 0) return;

		const district = extractDistrict(title);
		const gender = extractGender(title);
		const nextCount = (districtCounts.get(district) ?? 0) + 1;
		districtCounts.set(district, nextCount);
		const id = `${district}-${nextCount}`;

		const mints = extractMintIds($table);
		if (mints.length === 0) return;

		const imageSrc = $content.find('img').first().attr('src');
		const imageUrl = resolveUrl(imageSrc || undefined);
		let mapImage = '';
		if (imageUrl) {
			const extension = extname(new URL(imageUrl).pathname) || '.png';
			const imageFile = join(MERCHANTS_DIR, `${id}${extension}`);
			mapImage = `/merchants/${id}${extension}`;
			downloadQueue.push(
				downloadImage(imageUrl, imageFile).catch((error) => {
					console.warn(`⚠️  Failed to download map for ${id}:`, error);
				})
			);
		}

		merchants.push({
			id,
			district,
			gender,
			mints,
			mapImage
		});
	});

	if (merchants.length === 0) {
		throw new Error('No mint merchants found in page content.');
	}

	await Promise.all(downloadQueue);

	await writeFile(OUTPUT_PATH, JSON.stringify(merchants, null, 2), 'utf-8');
	console.log(`✅ Wrote ${merchants.length} mint merchants to ${OUTPUT_PATH}`);
}

try {
	await scrapeMintMerchants();
} catch (error) {
	console.error('❌ Mint merchant scraping failed:', error);
	process.exit(1);
}
