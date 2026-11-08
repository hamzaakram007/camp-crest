import type { BadgeDef, CatalogItem, ItemId, ZoneId } from './types'

export const COLS = 8
export const ROWS = 7

export const BADGES: BadgeDef[] = [
  { id: 'leaf', name: 'Leaf', emoji: '🍃', hint: 'Tap leafy patches on the grounds' },
  { id: 'shell', name: 'Shell', emoji: '🐚', hint: 'Tap the shore near the dock' },
  { id: 'pinecone', name: 'Pinecone', emoji: '🌰', hint: 'Tap the trail pines' },
  { id: 'berry', name: 'Berry', emoji: '🫐', hint: 'Tap berry bushes along the path' },
  { id: 'feather', name: 'Feather', emoji: '🪶', hint: 'Tap soft nests near the cabin' },
  { id: 'star', name: 'Camp Star', emoji: '⭐', hint: 'Put on an evening camp show' },
  { id: 'ribbon', name: 'Show Ribbon', emoji: '🎀', hint: 'Run three shows for a soft ribbon' },
]

export const ITEMS: CatalogItem[] = [
  // Cabin
  { id: 'cabin', name: 'Cabin', emoji: '🏕️', zone: 'cabin', starter: true },
  { id: 'cabin-porch', name: 'Porch', emoji: '🚪', zone: 'cabin', cost: { leaf: 2, pinecone: 1 }, tier: 1 },
  { id: 'bunk', name: 'Bunk Beds', emoji: '🛏️', zone: 'cabin', starter: true },
  { id: 'rug', name: 'Braided Rug', emoji: '🧶', zone: 'cabin', cost: { leaf: 2 }, tier: 1, showProp: true },
  { id: 'lantern', name: 'Lantern', emoji: '🏮', zone: 'cabin', starter: true, showProp: true },
  { id: 'window-box', name: 'Window Box', emoji: '🪴', zone: 'cabin', cost: { leaf: 3, berry: 1 }, tier: 2, showProp: true },
  { id: 'pine-banner', name: 'Pine Banner', emoji: '🌲', zone: 'cabin', cost: { pinecone: 2 }, tier: 1, showProp: true },
  { id: 'leaf-garland', name: 'Leaf Garland', emoji: '🌿', zone: 'cabin', cost: { leaf: 4 }, tier: 2, showProp: true },
  { id: 'feather-mobile', name: 'Feather Mobile', emoji: '🎐', zone: 'cabin', cost: { feather: 2, leaf: 1 }, tier: 2, showProp: true },

  // Grounds
  { id: 'campfire', name: 'Campfire', emoji: '🔥', zone: 'grounds', starter: true, showProp: true },
  { id: 'flag', name: 'Camp Flag', emoji: '🚩', zone: 'grounds', starter: true, showProp: true },
  { id: 'craft-table', name: 'Craft Table', emoji: '🧵', zone: 'grounds', starter: true },
  { id: 'flower-pot', name: 'Wildflowers', emoji: '🌼', zone: 'grounds', cost: { leaf: 3 }, tier: 1, showProp: true },
  { id: 'hammock', name: 'Hammock', emoji: '🏝️', zone: 'grounds', cost: { pinecone: 2, leaf: 2 }, tier: 2, showProp: true },
  { id: 'birdhouse', name: 'Birdhouse', emoji: '🏠', zone: 'grounds', cost: { feather: 1, pinecone: 2 }, tier: 2, showProp: true },
  { id: 'mushroom-ring', name: 'Mushroom Ring', emoji: '🍄', zone: 'grounds', cost: { berry: 2, leaf: 2 }, tier: 2, showProp: true },
  { id: 'totem', name: 'Camp Totem', emoji: '🗿', zone: 'grounds', cost: { pinecone: 3, star: 1 }, tier: 3, showProp: true },
  { id: 'berry-basket', name: 'Berry Basket', emoji: '🧺', zone: 'grounds', cost: { berry: 3 }, tier: 1, showProp: true },

  // Dock
  { id: 'dock', name: 'Dock', emoji: '🪵', zone: 'dock', starter: true },
  { id: 'canoe', name: 'Canoe', emoji: '🛶', zone: 'dock', cost: { shell: 2 }, tier: 1, showProp: true },
  { id: 'kayak', name: 'Kayak', emoji: '🚤', zone: 'dock', cost: { shell: 3, feather: 1 }, tier: 2, showProp: true },
  { id: 'life-ring', name: 'Life Ring', emoji: '🛟', zone: 'dock', cost: { shell: 2, leaf: 1 }, tier: 1, showProp: true },
  { id: 'fishing-rod', name: 'Fishing Rod', emoji: '🎣', zone: 'dock', cost: { shell: 2, pinecone: 1 }, tier: 2, showProp: true },
  { id: 'shell-lamp', name: 'Shell Lamp', emoji: '💡', zone: 'dock', cost: { shell: 3, leaf: 1 }, tier: 2, showProp: true },

  // Trail
  { id: 'trail', name: 'Trail Path', emoji: '🥾', zone: 'trail', starter: true },
  { id: 'bench', name: 'Log Bench', emoji: '🪑', zone: 'trail', starter: true, showProp: true },
  { id: 'signpost', name: 'Trail Sign', emoji: '🪧', zone: 'trail', cost: { pinecone: 2 }, tier: 1, showProp: true },
  { id: 'bridge', name: 'Creek Bridge', emoji: '🧱', zone: 'trail', cost: { pinecone: 3, leaf: 2 }, tier: 2 },
  { id: 'tent', name: 'Trail Tent', emoji: '⛺', zone: 'trail', cost: { pinecone: 2, berry: 1, feather: 1 }, tier: 2, showProp: true },

  // Stage
  { id: 'stage-curtain', name: 'Show Curtain', emoji: '🎭', zone: 'stage', cost: { star: 1, pinecone: 1 }, tier: 2, showProp: true },
  { id: 'spotlight', name: 'Spotlight', emoji: '🔦', zone: 'stage', cost: { star: 1 }, tier: 1, showProp: true },
  { id: 'mic', name: 'Camp Mic', emoji: '🎤', zone: 'stage', cost: { star: 1, feather: 1 }, tier: 2, showProp: true },
  { id: 'drums', name: 'Log Drums', emoji: '🥁', zone: 'stage', cost: { star: 1, pinecone: 2 }, tier: 2, showProp: true },
  { id: 'confetti-cannon', name: 'Confetti Pop', emoji: '🎉', zone: 'stage', cost: { ribbon: 1, star: 1 }, tier: 3, showProp: true },
]

export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<
  ItemId,
  CatalogItem
>

export const STARTER_UNLOCKS: ItemId[] = ITEMS.filter((i) => i.starter).map((i) => i.id)

export const ZONE_FILTERS: { id: ZoneId | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'cabin', label: 'Cabin', emoji: '🏕️' },
  { id: 'grounds', label: 'Grounds', emoji: '🔥' },
  { id: 'dock', label: 'Dock', emoji: '🛶' },
  { id: 'trail', label: 'Trail', emoji: '🥾' },
  { id: 'stage', label: 'Stage', emoji: '🎭' },
]

/** Soft zone hints for placement — not hard locks */
export function zoneForCell(x: number, y: number): ZoneId {
  if (y >= 5 && x <= 2) return 'dock'
  if (x >= 5 && y <= 2) return 'cabin'
  if (y === 6 || (x <= 1 && y >= 3)) return 'trail'
  if (x >= 5 && y >= 4) return 'stage'
  return 'grounds'
}

export const GATHER_SPOTS: {
  key: string
  x: number
  y: number
  badge: 'leaf' | 'shell' | 'pinecone' | 'berry' | 'feather'
}[] = [
  { key: 'g-leaf-1', x: 2, y: 1, badge: 'leaf' },
  { key: 'g-leaf-2', x: 3, y: 3, badge: 'leaf' },
  { key: 'g-leaf-3', x: 4, y: 2, badge: 'leaf' },
  { key: 'g-shell-1', x: 1, y: 6, badge: 'shell' },
  { key: 'g-shell-2', x: 0, y: 5, badge: 'shell' },
  { key: 'g-shell-3', x: 2, y: 5, badge: 'shell' },
  { key: 'g-pine-1', x: 0, y: 2, badge: 'pinecone' },
  { key: 'g-pine-2', x: 4, y: 0, badge: 'pinecone' },
  { key: 'g-pine-3', x: 1, y: 0, badge: 'pinecone' },
  { key: 'g-berry-1', x: 3, y: 6, badge: 'berry' },
  { key: 'g-berry-2', x: 5, y: 3, badge: 'berry' },
  { key: 'g-feather-1', x: 7, y: 0, badge: 'feather' },
  { key: 'g-feather-2', x: 6, y: 3, badge: 'feather' },
]

export const SHOW_CUES = [
  'steps into the firelight',
  'waves to the crowd',
  'strikes a silly pose',
  'spins with a sparkle',
  'takes a bow',
  'cheers for camp friends',
  'drums a camp rhythm',
  'whispers a secret joke',
]

export const SHOW_REACTIONS = [
  'The campers giggle!',
  'Soft applause by the lake…',
  'Someone waves a pine banner!',
  'Fireflies flicker in time.',
  'A canoe horn toots far away.',
  'The whole cabin whoops!',
  'Marshmallows toast in applause.',
  'Night birds chirp along.',
]

export const SAMPLE_JOIN_CODES = ['CREST-DEMO', 'PINE-4821', 'LAKE-7730']

export const SAMPLE_CAMPS: Record<
  string,
  { name: string; host: string; extras: Array<{ itemId: ItemId; x: number; y: number }> }
> = {
  'CREST-DEMO': {
    name: 'Crest Demo Camp',
    host: 'Scout Sam',
    extras: [
      { itemId: 'flag', x: 4, y: 2 },
      { itemId: 'bench', x: 2, y: 3 },
      { itemId: 'lantern', x: 6, y: 2 },
      { itemId: 'flower-pot', x: 3, y: 1 },
    ],
  },
  'PINE-4821': {
    name: 'Pine Pal Camp',
    host: 'Fern',
    extras: [
      { itemId: 'pine-banner', x: 7, y: 1 },
      { itemId: 'signpost', x: 0, y: 3 },
      { itemId: 'campfire', x: 3, y: 2 },
    ],
  },
  'LAKE-7730': {
    name: 'Lake Glow Camp',
    host: 'River',
    extras: [
      { itemId: 'canoe', x: 0, y: 6 },
      { itemId: 'shell-lamp', x: 1, y: 5 },
      { itemId: 'life-ring', x: 2, y: 6 },
    ],
  },
}

export function generateFriendCode(): string {
  const words = ['PINE', 'LAKE', 'CREST', 'FERN', 'MOSS', 'DOCK', 'TRAIL', 'GLOW', 'BERRY', 'OWL']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = String(Math.floor(1000 + Math.random() * 9000))
  return `${word}-${num}`
}

export const CAMPER_COLORS = ['#E07A3D', '#2A6F7A', '#C45C4A', '#5A8F6A', '#D4A017', '#6B4F3A', '#3D7A5C']

export const ACHIEVEMENT_DEFS = [
  { id: 'first-place', title: 'First Décor', test: (ctx: { placedCount: number }) => ctx.placedCount >= 4 },
  { id: 'gatherer', title: 'Nature Scout', test: (ctx: { gathered: number }) => ctx.gathered >= 5 },
  { id: 'builder', title: 'Camp Builder', test: (ctx: { placedCount: number }) => ctx.placedCount >= 10 },
  { id: 'showtime', title: 'Showtime!', test: (ctx: { showsRun: number }) => ctx.showsRun >= 1 },
  { id: 'encore', title: 'Encore Kid', test: (ctx: { showsRun: number }) => ctx.showsRun >= 3 },
  {
    id: 'decorator',
    title: 'Cabin Stylist',
    test: (ctx: { unlockedCount: number }) => ctx.unlockedCount >= 14,
  },
] as const
