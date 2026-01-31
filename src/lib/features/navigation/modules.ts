export type NavModule = {
	id: 'home' | 'box' | 'map' | 'perfect' | 'hyperspace' | 'settings';
	href: string;
	labelKey: string;
	descriptionKey?: string;
	iconPath: string;
	showInSidebar: boolean;
	showInLaunchpad: boolean;
};

const iconViewBox = '0 0 24 24';

export const navModules: NavModule[] = [
	{
		id: 'home',
		href: '/',
		labelKey: 'nav.home',
		iconPath: 'M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1V9.75z',
		showInSidebar: true,
		showInLaunchpad: false
	},
	{
		id: 'box',
		href: '/box',
		labelKey: 'nav.box',
		descriptionKey: 'nav.boxDescription',
		iconPath:
			'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
		showInSidebar: true,
		showInLaunchpad: true
	},
	{
		id: 'map',
		href: '/map',
		labelKey: 'nav.map',
		descriptionKey: 'nav.mapDescription',
		iconPath:
			'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
		showInSidebar: true,
		showInLaunchpad: true
	},
	{
		id: 'perfect',
		href: '/perfect',
		labelKey: 'nav.perfect',
		descriptionKey: 'nav.perfectDescription',
		iconPath:
			'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
		showInSidebar: true,
		showInLaunchpad: true
	},
	{
		id: 'hyperspace',
		href: '/hyperspace',
		labelKey: 'nav.shiny',
		descriptionKey: 'nav.shinyDescription',
		iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
		showInSidebar: true,
		showInLaunchpad: true
	},
	{
		id: 'settings',
		href: '/settings',
		labelKey: 'nav.settings',
		iconPath:
			'M11.25 3a1 1 0 011 1v1.056a7.5 7.5 0 012.118.87l.747-.747a1 1 0 011.414 1.414l-.747.747a7.5 7.5 0 01.87 2.118H21a1 1 0 011 1v1.5a1 1 0 01-1 1h-1.056a7.5 7.5 0 01-.87 2.118l.747.747a1 1 0 01-1.414 1.414l-.747-.747a7.5 7.5 0 01-2.118.87V21a1 1 0 01-1 1h-1.5a1 1 0 01-1-1v-1.056a7.5 7.5 0 01-2.118-.87l-.747.747a1 1 0 01-1.414-1.414l.747-.747a7.5 7.5 0 01-.87-2.118H3a1 1 0 01-1-1v-1.5a1 1 0 011-1h1.056a7.5 7.5 0 01.87-2.118l-.747-.747a1 1 0 011.414-1.414l.747.747a7.5 7.5 0 012.118-.87V4a1 1 0 011-1h1.5zm.75 6.75a3 3 0 100 6 3 3 0 000-6z',
		showInSidebar: true,
		showInLaunchpad: false
	}
];

export const sidebarModules = navModules.filter((module) => module.showInSidebar);
export const launchpadModules = navModules.filter((module) => module.showInLaunchpad);
export { iconViewBox };
