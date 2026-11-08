import type { CampState, SharePack } from './types'

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** Compact camp snapshot for share links (works across browsers via URL). */
export function packCamp(state: CampState): SharePack {
  return {
    v: 2,
    code: state.friendCode,
    name: state.campName,
    host: state.camperName,
    placed: state.placed.map((p) => [p.itemId, p.x, p.y]),
    unlocked: state.unlocked,
    badges: {
      leaf: state.badges.leaf,
      shell: state.badges.shell,
      pinecone: state.badges.pinecone,
      berry: state.badges.berry,
      feather: state.badges.feather,
    },
  }
}

export function encodeSharePack(pack: SharePack): string {
  const json = JSON.stringify(pack)
  const bytes = new TextEncoder().encode(json)
  return toBase64Url(bytes)
}

export function decodeSharePack(encoded: string): SharePack | null {
  try {
    const bytes = fromBase64Url(encoded)
    const json = new TextDecoder().decode(bytes)
    const pack = JSON.parse(json) as SharePack
    if (pack?.v !== 2 || !pack.code || !pack.name || !Array.isArray(pack.placed)) return null
    return pack
  } catch {
    return null
  }
}

export function buildShareUrl(state: CampState, origin = window.location.origin): string {
  const pack = encodeSharePack(packCamp(state))
  const url = new URL(origin + window.location.pathname)
  url.searchParams.set('join', state.friendCode)
  url.searchParams.set('pack', pack)
  return url.toString()
}

export function readJoinFromLocation(): { code: string; pack: SharePack | null } | null {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = (params.get('join') || params.get('code') || '').trim().toUpperCase()
    const packRaw = params.get('pack')
    if (!code && !packRaw) return null
    const pack = packRaw ? decodeSharePack(packRaw) : null
    const resolved = (pack?.code || code).toUpperCase()
    if (!resolved) return null
    return { code: resolved, pack }
  } catch {
    return null
  }
}

export function clearJoinParamsFromUrl() {
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('join') && !url.searchParams.has('pack') && !url.searchParams.has('code')) {
      return
    }
    url.searchParams.delete('join')
    url.searchParams.delete('pack')
    url.searchParams.delete('code')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  } catch {
    /* ignore */
  }
}

export function isValidFriendCode(raw: string): boolean {
  const code = raw.trim().toUpperCase()
  return /^[A-Z]{3,8}-\d{4}$/.test(code)
}
