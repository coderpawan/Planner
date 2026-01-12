export interface ServiceCategory {
	slug: string
	name: string
	description: string
}

const SERVICE_CATEGORIES: Record<string, ServiceCategory> = {
	venue: {
		slug: 'venue',
		name: 'Venues & Wedding Spaces',
		description: 'Find the perfect venue for your special day',
	},
	wedding_planner: {
		slug: 'wedding_planner',
		name: 'Wedding Planning & Coordination',
		description: 'Expert planners to organize your dream wedding',
	},
	catering: {
		slug: 'catering',
		name: 'Catering & Food Services',
		description: 'Delicious cuisine for every palate and budget',
	},
	decor: {
		slug: 'decor',
		name: 'Wedding Decor & Styling',
		description: 'Transform your venue with stunning decorations',
	},
	photography: {
		slug: 'photography',
		name: 'Photography & Videography',
		description: 'Capture every moment beautifully',
	},
	makeup_styling: {
		slug: 'makeup_styling',
		name: 'Makeup, Mehendi & Styling',
		description: 'Look your absolute best on your big day',
	},
	music_entertainment: {
		slug: 'music_entertainment',
		name: 'Music, DJ & Entertainment',
		description: 'Keep your guests dancing all night long',
	},
	choreography: {
		slug: 'choreography',
		name: 'Choreography & Performances',
		description: 'Professional dance routines and performances',
	},
	ritual_services: {
		slug: 'ritual_services',
		name: 'Pandit, Priest & Ritual Services',
		description: 'Traditional ceremonies conducted with care',
	},
	wedding_transport: {
		slug: 'wedding_transport',
		name: 'Wedding Transport & Baraat Services',
		description: 'Arrive in style with luxury transport options',
	},
	invitations_gifting: {
		slug: 'invitations_gifting',
		name: 'Invitations, Gifts & Packaging',
		description: 'Beautiful invites and thoughtful gifts',
	},
}

export function mapServiceSlugToCategory(slug: string): ServiceCategory | null {
	return SERVICE_CATEGORIES[slug] || null
}

export function getAllServiceCategories(): ServiceCategory[] {
	return Object.values(SERVICE_CATEGORIES)
}
