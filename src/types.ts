export type ZoneId = 'cabin' | 'grounds' | 'dock' | 'trail' | 'stage'

export type ItemId =
  | 'cabin'
  | 'cabin-porch'
  | 'bunk'
  | 'rug'
  | 'lantern'
  | 'window-box'
  | 'campfire'
  | 'flag'
  | 'hammock'
  | 'birdhouse'
  | 'mushroom-ring'
  | 'totem'
  | 'dock'
  | 'canoe'
  | 'kayak'
  | 'life-ring'
  | 'fishing-rod'
  | 'trail'
  | 'bridge'
  | 'bench'
  | 'signpost'
  | 'tent'
  | 'craft-table'
  | 'flower-pot'
  | 'pine-banner'
  | 'shell-lamp'
  | 'leaf-garland'
  | 'berry-basket'
  | 'feather-mobile'
  | 'stage-curtain'
  | 'spotlight'
  | 'mic'
  | 'drums'
  | 'confetti-cannon'

export type BadgeId = 'leaf' | 'shell' | 'pinecone' | 'berry' | 'feather' | 'star' | 'ribbon'

export interface CatalogItem {
  id: ItemId
  name: string
  emoji: string
  zone: ZoneId
  cost?: Partial<Record<BadgeId, number>>
  starter?: boolean
  showProp?: boolean
  /** Soft progression tier — higher needs more gathering */
  tier?: 1 | 2 | 3
}

export interface BadgeDef {
  id: BadgeId
  name: string
  emoji: string
  hint: string
}

export interface PlacedItem {
  uid: string
  itemId: ItemId
  x: number
  y: number
}

export interface ShowBeat {
  propUid: string
  label: string
  cue: string
  reaction: string
}

export interface Camper {
  id: string
  name: string
  color: string
  isYou?: boolean
}

export interface SoftAchievement {
  id: string
  title: string
  earnedAt: number
}

export interface CampState {
  version: 2
  campName: string
  friendCode: string
  camperName: string
  campers: Camper[]
  placed: PlacedItem[]
  badges: Record<BadgeId, number>
  unlocked: ItemId[]
  gatheredTiles: string[]
  showBeats: ShowBeat[]
  lastShowAt?: number
  showsRun: number
  achievements: SoftAchievement[]
  /** Optional evening show title kids can set */
  showTitle: string
}

/** Compact payload embedded in share URLs for cross-browser join */
export interface SharePack {
  v: 2
  code: string
  name: string
  host: string
  placed: Array<[ItemId, number, number]>
  unlocked: ItemId[]
  badges?: Partial<Record<BadgeId, number>>
}

export type Screen = 'welcome' | 'camp' | 'show' | 'invite' | 'created'

export type BuildFilter = 'all' | ZoneId
