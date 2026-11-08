export type ZoneId = 'cabin' | 'grounds' | 'dock' | 'trail' | 'stage'

export type ItemId =
  | 'cabin'
  | 'bunk'
  | 'lantern'
  | 'campfire'
  | 'flag'
  | 'dock'
  | 'canoe'
  | 'trail'
  | 'bench'
  | 'craft-table'
  | 'flower-pot'
  | 'pine-banner'
  | 'shell-lamp'
  | 'leaf-garland'
  | 'stage-curtain'
  | 'spotlight'

export type BadgeId = 'leaf' | 'shell' | 'pinecone' | 'star'

export interface CatalogItem {
  id: ItemId
  name: string
  emoji: string
  zone: ZoneId
  cost?: Partial<Record<BadgeId, number>>
  starter?: boolean
  showProp?: boolean
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
}

export interface Camper {
  id: string
  name: string
  color: string
  isYou?: boolean
}

export interface CampState {
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
}

export type Screen = 'welcome' | 'camp' | 'show' | 'invite'
