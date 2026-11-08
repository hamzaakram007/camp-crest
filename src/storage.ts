import type { BadgeId, CampState, ItemId, PlacedItem } from './types'
import { STARTER_UNLOCKS } from './catalog'

const KEY = 'camp-crest-v2'
const LEGACY_KEY = 'camp-crest-mvp-v1'
const SHARE_REGISTRY = 'camp-crest-share-registry-v2'

export function emptyBadges(): CampState['badges'] {
  return {
    leaf: 0,
    shell: 0,
    pinecone: 0,
    berry: 0,
    feather: 0,
    star: 0,
    ribbon: 0,
  }
}

export function createFreshCamp(
  campName: string,
  friendCode: string,
  camperName: string,
  color: string,
  extras: PlacedItem[] = [],
): CampState {
  return {
    version: 2,
    campName,
    friendCode,
    camperName,
    campers: [{ id: 'you', name: camperName, color, isYou: true }],
    placed: [
      { uid: 'seed-cabin', itemId: 'cabin', x: 6, y: 1 },
      { uid: 'seed-fire', itemId: 'campfire', x: 3, y: 2 },
      { uid: 'seed-dock', itemId: 'dock', x: 1, y: 5 },
      { uid: 'seed-trail', itemId: 'trail', x: 0, y: 3 },
      ...extras,
    ],
    badges: emptyBadges(),
    unlocked: [...STARTER_UNLOCKS],
    gatheredTiles: [],
    showBeats: [],
    showsRun: 0,
    achievements: [],
    showTitle: 'Campfire Night',
  }
}

function migrate(raw: unknown): CampState | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<CampState> & { badges?: Record<string, number>; unlocked?: string[] }
  if (!data.campName || !data.friendCode) return null

  const badges = emptyBadges()
  for (const id of Object.keys(badges) as BadgeId[]) {
    badges[id] = Number(data.badges?.[id] ?? 0) || 0
  }

  const unlocked = Array.isArray(data.unlocked)
    ? (data.unlocked.filter(Boolean) as ItemId[])
    : [...STARTER_UNLOCKS]

  return {
    version: 2,
    campName: String(data.campName),
    friendCode: String(data.friendCode),
    camperName: String(data.camperName ?? 'Camper'),
    campers: Array.isArray(data.campers) && data.campers.length
      ? data.campers
      : [{ id: 'you', name: String(data.camperName ?? 'Camper'), color: '#E07A3D', isYou: true }],
    placed: Array.isArray(data.placed) ? data.placed : [],
    badges,
    unlocked,
    gatheredTiles: Array.isArray(data.gatheredTiles) ? data.gatheredTiles : [],
    showBeats: Array.isArray(data.showBeats)
      ? data.showBeats.map((b) => ({
          propUid: b.propUid,
          label: b.label,
          cue: b.cue,
          reaction: 'reaction' in b && typeof b.reaction === 'string' ? b.reaction : 'Soft applause!',
        }))
      : [],
    lastShowAt: data.lastShowAt,
    showsRun: Number(data.showsRun ?? (data.lastShowAt ? 1 : 0)) || 0,
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    showTitle: String(data.showTitle ?? 'Campfire Night'),
  }
}

export function loadCamp(): CampState | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const migrated = migrate(JSON.parse(raw))
    if (migrated) saveCamp(migrated)
    return migrated
  } catch {
    return null
  }
}

export function saveCamp(state: CampState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
  // Keep a same-browser registry so re-joining a code you created still works
  try {
    const registry = loadShareRegistry()
    registry[state.friendCode] = {
      name: state.campName,
      host: state.camperName,
      placed: state.placed.map((p) => [p.itemId, p.x, p.y] as [ItemId, number, number]),
      unlocked: state.unlocked,
      badges: {
        leaf: state.badges.leaf,
        shell: state.badges.shell,
        pinecone: state.badges.pinecone,
        berry: state.badges.berry,
        feather: state.badges.feather,
      },
    }
    localStorage.setItem(SHARE_REGISTRY, JSON.stringify(registry))
  } catch {
    /* ignore quota */
  }
}

export function clearCamp(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
}

type RegistryEntry = {
  name: string
  host: string
  placed: Array<[ItemId, number, number]>
  unlocked: ItemId[]
  badges?: Partial<CampState['badges']>
}

export function loadShareRegistry(): Record<string, RegistryEntry> {
  try {
    const raw = localStorage.getItem(SHARE_REGISTRY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, RegistryEntry>
  } catch {
    return {}
  }
}

export function lookupLocalSharedCamp(code: string): RegistryEntry | null {
  const registry = loadShareRegistry()
  return registry[code] ?? null
}
