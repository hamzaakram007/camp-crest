import type { CampState } from './types'
import { STARTER_UNLOCKS } from './catalog'

const KEY = 'camp-crest-mvp-v1'

export function emptyBadges(): CampState['badges'] {
  return { leaf: 0, shell: 0, pinecone: 0, star: 0 }
}

export function createFreshCamp(
  campName: string,
  friendCode: string,
  camperName: string,
  color: string,
): CampState {
  return {
    campName,
    friendCode,
    camperName,
    campers: [{ id: 'you', name: camperName, color, isYou: true }],
    placed: [
      { uid: 'seed-cabin', itemId: 'cabin', x: 6, y: 1 },
      { uid: 'seed-fire', itemId: 'campfire', x: 3, y: 2 },
      { uid: 'seed-dock', itemId: 'dock', x: 1, y: 4 },
    ],
    badges: emptyBadges(),
    unlocked: [...STARTER_UNLOCKS],
    gatheredTiles: [],
    showBeats: [],
  }
}

export function loadCamp(): CampState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as CampState
  } catch {
    return null
  }
}

export function saveCamp(state: CampState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearCamp(): void {
  localStorage.removeItem(KEY)
}
