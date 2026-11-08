import type { BadgeDef, CatalogItem, ItemId } from './types'

export const COLS = 8
export const ROWS = 6

export const BADGES: BadgeDef[] = [
  { id: 'leaf', name: 'Leaf', emoji: '🍃', hint: 'Tap leafy patches on the grounds' },
  { id: 'shell', name: 'Shell', emoji: '🐚', hint: 'Tap the shore near the dock' },
  { id: 'pinecone', name: 'Pinecone', emoji: '🌰', hint: 'Tap the trail pines' },
  { id: 'star', name: 'Camp Star', emoji: '⭐', hint: 'Put on a camp show' },
]

export const ITEMS: CatalogItem[] = [
  { id: 'cabin', name: 'Cabin', emoji: '🏕️', zone: 'cabin', starter: true },
  { id: 'bunk', name: 'Bunk Beds', emoji: '🛏️', zone: 'cabin', starter: true },
  { id: 'lantern', name: 'Lantern', emoji: '🏮', zone: 'cabin', starter: true, showProp: true },
  { id: 'campfire', name: 'Campfire', emoji: '🔥', zone: 'grounds', starter: true, showProp: true },
  { id: 'flag', name: 'Camp Flag', emoji: '🚩', zone: 'grounds', starter: true, showProp: true },
  { id: 'dock', name: 'Dock', emoji: '🪵', zone: 'dock', starter: true },
  { id: 'canoe', name: 'Canoe', emoji: '🛶', zone: 'dock', cost: { shell: 2 }, showProp: true },
  { id: 'trail', name: 'Trail Path', emoji: '🥾', zone: 'trail', starter: true },
  { id: 'bench', name: 'Log Bench', emoji: '🪑', zone: 'trail', starter: true, showProp: true },
  { id: 'craft-table', name: 'Craft Table', emoji: '🧵', zone: 'grounds', starter: true },
  { id: 'flower-pot', name: 'Wildflowers', emoji: '🌼', zone: 'grounds', cost: { leaf: 3 }, showProp: true },
  { id: 'pine-banner', name: 'Pine Banner', emoji: '🌲', zone: 'cabin', cost: { pinecone: 2 }, showProp: true },
  { id: 'shell-lamp', name: 'Shell Lamp', emoji: '💡', zone: 'dock', cost: { shell: 3, leaf: 1 }, showProp: true },
  { id: 'leaf-garland', name: 'Leaf Garland', emoji: '🌿', zone: 'cabin', cost: { leaf: 4 }, showProp: true },
  { id: 'stage-curtain', name: 'Show Curtain', emoji: '🎭', zone: 'stage', cost: { star: 1, pinecone: 1 }, showProp: true },
  { id: 'spotlight', name: 'Spotlight', emoji: '🔦', zone: 'stage', cost: { star: 1 }, showProp: true },
]

export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<
  ItemId,
  CatalogItem
>

export const STARTER_UNLOCKS: ItemId[] = ITEMS.filter((i) => i.starter).map((i) => i.id)

/** Soft zone hints for placement — not hard locks, just suggestion labels */
export function zoneForCell(x: number, y: number): string {
  if (y >= 4 && x <= 2) return 'dock'
  if (x >= 5 && y <= 2) return 'cabin'
  if (y === 5 || (x <= 1 && y >= 2)) return 'trail'
  if (x >= 5 && y >= 3) return 'stage'
  return 'grounds'
}

export const GATHER_SPOTS: { key: string; x: number; y: number; badge: 'leaf' | 'shell' | 'pinecone' }[] =
  [
    { key: 'g-leaf-1', x: 2, y: 1, badge: 'leaf' },
    { key: 'g-leaf-2', x: 3, y: 3, badge: 'leaf' },
    { key: 'g-shell-1', x: 1, y: 5, badge: 'shell' },
    { key: 'g-shell-2', x: 0, y: 4, badge: 'shell' },
    { key: 'g-pine-1', x: 0, y: 2, badge: 'pinecone' },
    { key: 'g-pine-2', x: 4, y: 0, badge: 'pinecone' },
  ]

export const SHOW_CUES = [
  'steps into the firelight',
  'waves to the crowd',
  'strikes a silly pose',
  'spins with a sparkle',
  'takes a bow',
  'cheers for camp friends',
]

export const SAMPLE_JOIN_CODES = ['CREST-DEMO', 'PINE-4821', 'LAKE-7730']

export function generateFriendCode(): string {
  const words = ['PINE', 'LAKE', 'CREST', 'FERN', 'MOSS', 'DOCK', 'TRAIL', 'GLOW']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = String(Math.floor(1000 + Math.random() * 9000))
  return `${word}-${num}`
}

export const CAMPER_COLORS = ['#E07A3D', '#2A6F7A', '#C45C4A', '#5A8F6A', '#D4A017', '#6B4F3A']
