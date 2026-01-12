import { MdOutlineHome, MdOutlineCheckCircle, MdOutlineAttachMoney, MdOutlineAutoAwesome, MdStorefront, MdCardGiftcard, MdGroups, MdPhoto, MdRestaurant, MdMusicNote, MdWhatsapp, MdPrint, MdDesignServices } from 'react-icons/md'
import type { ComponentType } from 'react'

export interface SubLink {
	label: string
	icon: ComponentType<{ className?: string }>
	href: string
}

export interface Card {
	title: string
	description: string
	bgColor: string
	href: string
}

export interface MegaMenuSection {
	id: string
	label: string
	subLinks: SubLink[]
	cards: Card[]
}

export const MEGA_MENU_CONFIG: Record<string, MegaMenuSection> = {
	planningTools: {
		id: 'planningTools',
		label: 'Planning Tools',
		subLinks: [
			{ label: 'Home', icon: MdOutlineHome, href: '/' },
			{ label: 'Checklist', icon: MdOutlineCheckCircle, href: '/checklist' },
			{ label: 'Budget Advisor', icon: MdOutlineAttachMoney, href: '/budget' },
			{ label: 'Style Quiz', icon: MdOutlineAutoAwesome, href: '/style-quiz' },
		],
		cards: [
			{
				title: 'Take the style quiz',
				description: 'Discover your perfect wedding theme',
				bgColor: 'bg-yellow-400',
				href: '/style-quiz',
			},
			{
				title: 'Get The Knot app',
				description: 'Plan on the go',
				bgColor: 'bg-orange-400',
				href: '/app',
			},
			{
				title: 'Explore Budget Advisor',
				description: 'Stay within your budget',
				bgColor: 'bg-pink-300',
				href: '/budget-advisor',
			},
			{
				title: 'The Engagement Era Collection',
				description: 'Celebrate your engagement',
				bgColor: 'bg-blue-300',
				href: '/engagement-era',
			},
		],
	},
	vendors: {
		id: 'vendors',
		label: 'Vendors',
		subLinks: [
			{ label: 'All Vendors', icon: MdStorefront, href: '/vendors' },
			{ label: 'Photographers', icon: MdPhoto, href: '/vendors/photographers' },
			{ label: 'Caterers', icon: MdRestaurant, href: '/vendors/caterers' },
			{ label: 'Entertainment', icon: MdMusicNote, href: '/vendors/entertainment' },
		],
		cards: [
			{
				title: 'Find Photographers',
				description: 'Capture your special moments',
				bgColor: 'bg-purple-300',
				href: '/vendors/photographers',
			},
			{
				title: 'Book Caterers',
				description: 'Delicious food for your guests',
				bgColor: 'bg-green-300',
				href: '/vendors/caterers',
			},
			{
				title: 'Entertainment Services',
				description: 'DJs, bands & more',
				bgColor: 'bg-red-300',
				href: '/vendors/entertainment',
			},
			{
				title: 'Venue Decoration',
				description: 'Transform your venue',
				bgColor: 'bg-indigo-300',
				href: '/vendors/decoration',
			},
		],
	},
	invitationCards: {
		id: 'invitationCards',
		label: 'Invitation Cards',
		subLinks: [
			{ label: 'Digital Invitations', icon: MdDesignServices, href: '/invitations/digital' },
			{ label: 'Printed Cards', icon: MdPrint, href: '/invitations/print' },
			{ label: 'WhatsApp Invites', icon: MdWhatsapp, href: '/invitations/whatsapp' },
			{ label: 'RSVP Tracking', icon: MdOutlineCheckCircle, href: '/invitations/rsvp' },
		],
		cards: [
			{
				title: 'Design Online',
				description: 'Create beautiful digital invitations in minutes',
				bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
				href: '/invitations/design',
			},
			{
				title: 'Print & Deliver',
				description: 'Luxury card stock with doorstep delivery',
				bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
				href: '/invitations/print',
			},
			{
				title: 'WhatsApp Invites',
				description: 'Instant sharing with RSVP tracking',
				bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
				href: '/invitations/whatsapp',
			},
			{
				title: 'Indian Card Themes',
				description: 'Traditional, royal, modern & premium designs',
				bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
				href: '/invitations/themes',
			},
		],
	},
	guestsRsvps: {
		id: 'guestsRsvps',
		label: 'Guests & RSVPs',
		subLinks: [
			{ label: 'Guest List', icon: MdGroups, href: '/guest-list' },
			{ label: 'RSVP Tracking', icon: MdOutlineCheckCircle, href: '/guest-list/rsvp' },
			{ label: 'Seating Chart', icon: MdOutlineHome, href: '/guest-list/seating' },
			{ label: 'Send Updates', icon: MdCardGiftcard, href: '/guest-list/updates' },
		],
		cards: [
			{
				title: 'Manage Guest List',
				description: 'Track 100-800 guests',
				bgColor: 'bg-rose-300',
				href: '/guest-list',
			},
			{
				title: 'RSVP Responses',
				description: 'Real-time updates',
				bgColor: 'bg-fuchsia-300',
				href: '/guest-list/rsvp',
			},
			{
				title: 'Seating Planner',
				description: 'Arrange tables easily',
				bgColor: 'bg-violet-300',
				href: '/guest-list/seating',
			},
			{
				title: 'Guest Communication',
				description: 'Send bulk updates',
				bgColor: 'bg-sky-300',
				href: '/guest-list/updates',
			},
		],
	},
}

export const MEGA_MENU_ORDER = ['planningTools', 'vendors', 'invitationCards', 'guestsRsvps'] as const
