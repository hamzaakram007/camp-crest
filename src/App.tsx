import { useEffect, useMemo, useState } from 'react'
import {
  ACHIEVEMENT_DEFS,
  BADGES,
  CAMPER_COLORS,
  COLS,
  GATHER_SPOTS,
  ITEMS,
  ITEM_MAP,
  ROWS,
  SAMPLE_CAMPS,
  SAMPLE_JOIN_CODES,
  SHOW_CUES,
  SHOW_REACTIONS,
  ZONE_FILTERS,
  generateFriendCode,
  zoneForCell,
} from './catalog'
import {
  buildShareUrl,
  clearJoinParamsFromUrl,
  isValidFriendCode,
  readJoinFromLocation,
} from './share'
import {
  clearCamp,
  createFreshCamp,
  loadCamp,
  lookupLocalSharedCamp,
  saveCamp,
} from './storage'
import type {
  BadgeId,
  BuildFilter,
  CampState,
  ItemId,
  PlacedItem,
  Screen,
  SharePack,
  ShowBeat,
  SoftAchievement,
} from './types'
import './App.css'

function uid() {
  return `p-${Math.random().toString(36).slice(2, 9)}`
}

function canAfford(state: CampState, itemId: ItemId): boolean {
  const item = ITEM_MAP[itemId]
  if (!item.cost) return true
  return Object.entries(item.cost).every(
    ([badge, need]) => state.badges[badge as BadgeId] >= (need ?? 0),
  )
}

function spendBadges(state: CampState, itemId: ItemId): CampState['badges'] {
  const item = ITEM_MAP[itemId]
  if (!item.cost) return state.badges
  const next = { ...state.badges }
  for (const [badge, need] of Object.entries(item.cost)) {
    next[badge as BadgeId] -= need ?? 0
  }
  return next
}

function applyAchievements(state: CampState): { state: CampState; earned: SoftAchievement[] } {
  const ctx = {
    placedCount: state.placed.length,
    gathered: state.gatheredTiles.length,
    showsRun: state.showsRun,
    unlockedCount: state.unlocked.length,
  }
  const have = new Set(state.achievements.map((a) => a.id))
  const earned: SoftAchievement[] = []
  for (const def of ACHIEVEMENT_DEFS) {
    if (have.has(def.id)) continue
    if (def.test(ctx)) {
      earned.push({ id: def.id, title: def.title, earnedAt: Date.now() })
    }
  }
  if (!earned.length) return { state, earned }
  return {
    state: { ...state, achievements: [...state.achievements, ...earned] },
    earned,
  }
}

function campFromSharePack(
  pack: SharePack,
  camperName: string,
  color: string,
): CampState {
  const extras: PlacedItem[] = pack.placed.map(([itemId, x, y], i) => ({
    uid: `share-${i}-${itemId}`,
    itemId,
    x,
    y,
  }))
  // Avoid duplicating seed positions already in pack
  const next = createFreshCamp(pack.name, pack.code, camperName, color, [])
  next.placed = extras.length
    ? extras
    : next.placed
  next.unlocked = Array.from(new Set([...next.unlocked, ...pack.unlocked]))
  next.campers = [
    { id: 'host', name: pack.host || 'Host', color: '#2A6F7A' },
    { id: 'you', name: camperName, color, isYou: true },
  ]
  if (pack.badges) {
    for (const [k, v] of Object.entries(pack.badges)) {
      if (k in next.badges) next.badges[k as BadgeId] = Number(v) || 0
    }
  }
  return next
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [camp, setCamp] = useState<CampState | null>(null)
  const [selected, setSelected] = useState<ItemId | null>('lantern')
  const [mode, setMode] = useState<'build' | 'gather' | 'show-pick'>('build')
  const [filter, setFilter] = useState<BuildFilter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [playingShow, setPlayingShow] = useState(false)
  const [showBeatIndex, setShowBeatIndex] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [campNameInput, setCampNameInput] = useState('Pine Hollow')
  const [codeInput, setCodeInput] = useState('')
  const [welcomeTab, setWelcomeTab] = useState<'create' | 'join'>('create')
  const [pendingPack, setPendingPack] = useState<SharePack | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [copiedKind, setCopiedKind] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    const join = readJoinFromLocation()
    if (join) {
      setWelcomeTab('join')
      setCodeInput(join.code)
      setPendingPack(join.pack)
      clearJoinParamsFromUrl()
      setToast(
        join.pack
          ? `Friend invite loaded for ${join.pack.name}. Enter your name to join!`
          : `Ready to join ${join.code}. Enter your camper name.`,
      )
      return
    }
    const existing = loadCamp()
    if (existing) {
      setCamp(existing)
      setScreen('camp')
      setNameInput(existing.camperName)
    }
  }, [])

  useEffect(() => {
    if (camp) {
      saveCamp(camp)
      setShareLink(buildShareUrl(camp))
    }
  }, [camp])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!copiedKind) return
    const t = window.setTimeout(() => setCopiedKind(null), 1800)
    return () => window.clearTimeout(t)
  }, [copiedKind])

  useEffect(() => {
    if (!playingShow || !camp) return
    const beatCount = camp.showBeats.length
    if (beatCount === 0) return
    if (showBeatIndex >= beatCount) {
      const done = window.setTimeout(() => {
        setPlayingShow(false)
        setShowBeatIndex(0)
        setCamp((c) => {
          if (!c) return c
          const showsRun = c.showsRun + 1
          let badges = { ...c.badges, star: c.badges.star + 1 }
          let toastMsg = 'Show complete! You earned a Camp Star ⭐'
          if (showsRun === 3 && badges.ribbon === 0) {
            badges = { ...badges, ribbon: 1 }
            toastMsg = 'Third show! Soft Show Ribbon unlocked 🎀'
          } else if (showsRun > 3 && showsRun % 2 === 0) {
            badges = { ...badges, star: badges.star + 1 }
            toastMsg = 'Encore bonus! Extra Camp Star ⭐'
          }
          const refreshed = {
            ...c,
            badges,
            showsRun,
            lastShowAt: Date.now(),
            gatheredTiles: showsRun % 2 === 0 ? [] : c.gatheredTiles,
            showBeats: [],
          }
          const { state, earned } = applyAchievements(refreshed)
          if (earned.length) {
            toastMsg = `${toastMsg} · Badge: ${earned[0]!.title}`
          }
          queueMicrotask(() => setToast(toastMsg))
          return state
        })
        setScreen('camp')
        setMode('build')
      }, 1100)
      return () => window.clearTimeout(done)
    }
    const t = window.setTimeout(() => setShowBeatIndex((i) => i + 1), 1600)
    return () => window.clearTimeout(t)
  }, [playingShow, showBeatIndex, camp])

  const unlockedItems = useMemo(() => {
    if (!camp) return []
    return ITEMS.filter((i) => {
      if (filter !== 'all' && i.zone !== filter) return false
      return camp.unlocked.includes(i.id) || canAfford(camp, i.id) || i.starter
    })
  }, [camp, filter])

  const lockedPreview = useMemo(() => {
    if (!camp) return []
    return ITEMS.filter(
      (i) =>
        (filter === 'all' || i.zone === filter) &&
        !camp.unlocked.includes(i.id) &&
        !canAfford(camp, i.id) &&
        !i.starter,
    ).slice(0, 6)
  }, [camp, filter])

  function flash(msg: string) {
    setToast(msg)
  }

  function startCreate() {
    const camper = nameInput.trim() || 'Camper'
    const campName = campNameInput.trim() || 'Pine Hollow'
    const code = generateFriendCode()
    const color = CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)]!
    const next = createFreshCamp(campName, code, camper, color)
    setCamp(next)
    setShareLink(buildShareUrl(next))
    setScreen('created')
    setMode('build')
    setSelected('lantern')
  }

  function enterCampFromCreated() {
    flash(`Welcome! Decorate the cabin, grounds, dock & trails.`)
    setScreen('camp')
  }

  function startJoin() {
    const raw = codeInput.trim().toUpperCase()
    if (!raw) {
      flash('Enter a friend code to join.')
      return
    }
    const camper = nameInput.trim() || 'Friend'
    const color = CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)]!

    if (pendingPack && pendingPack.code === raw) {
      const next = campFromSharePack(pendingPack, camper, color)
      setCamp(next)
      setPendingPack(null)
      setScreen('camp')
      setMode('build')
      flash(`Joined ${next.campName} — shared across browsers via your invite link!`)
      return
    }

    const local = lookupLocalSharedCamp(raw)
    if (local) {
      const pack: SharePack = {
        v: 2,
        code: raw,
        name: local.name,
        host: local.host,
        placed: local.placed,
        unlocked: local.unlocked,
        badges: local.badges,
      }
      const next = campFromSharePack(pack, camper, color)
      setCamp(next)
      setScreen('camp')
      setMode('build')
      flash(`Rejoined ${local.name} from a camp shared on this device.`)
      return
    }

    const sample = SAMPLE_CAMPS[raw]
    const known = Boolean(sample) || isValidFriendCode(raw)
    if (!known) {
      flash('Try CREST-DEMO, a WORD-#### code, or a full invite link.')
      return
    }

    const hostName = sample?.name ?? `${raw.split('-')[0]} Camp`
    const host = sample?.host ?? 'Scout Sam'
    const extras = (sample?.extras ?? [
      { itemId: 'flag' as ItemId, x: 4, y: 2 },
      { itemId: 'bench' as ItemId, x: 2, y: 3 },
    ]).map((e, i) => ({
      uid: `friend-${i}`,
      itemId: e.itemId,
      x: e.x,
      y: e.y,
    }))
    const next = createFreshCamp(hostName, raw, camper, color, extras)
    next.campers = [
      { id: 'host', name: host, color: '#2A6F7A' },
      { id: 'you', name: camper, color, isYou: true },
    ]
    // Sample camps unlock a few décor pieces so joiners see richer grounds
    if (sample) {
      next.unlocked = Array.from(
        new Set([...next.unlocked, ...extras.map((e) => e.itemId), 'flower-pot' as ItemId, 'canoe' as ItemId]),
      )
      next.badges.leaf = 2
      next.badges.shell = 1
    }
    setCamp(next)
    setScreen('camp')
    setMode('build')
    flash(
      sample
        ? `Joined ${hostName}. For live cross-browser camps, ask a friend for their Share link.`
        : `Joined ${hostName}. Tip: Share links carry the full cabin layout across browsers.`,
    )
  }

  function resetAll() {
    clearCamp()
    setCamp(null)
    setScreen('welcome')
    setNameInput('')
    setCodeInput('')
    setPendingPack(null)
    setMode('build')
    setFilter('all')
  }

  function placeAt(x: number, y: number) {
    if (!camp || !selected || mode !== 'build') return
    const occupied = camp.placed.some((p) => p.x === x && p.y === y)
    if (occupied) {
      flash('That spot is taken — tap another tile.')
      return
    }
    const item = ITEM_MAP[selected]
    const zone = zoneForCell(x, y)
    if (!camp.unlocked.includes(selected)) {
      if (!canAfford(camp, selected)) {
        flash(`Need more badges for ${item.name}.`)
        return
      }
    }
    const unlocking = !camp.unlocked.includes(selected)
    const badges = unlocking ? spendBadges(camp, selected) : camp.badges
    const unlocked = unlocking ? [...camp.unlocked, selected] : camp.unlocked
    const placed: PlacedItem = { uid: uid(), itemId: selected, x, y }
    let next: CampState = {
      ...camp,
      placed: [...camp.placed, placed],
      badges,
      unlocked,
    }
    const { state, earned } = applyAchievements(next)
    next = state
    setCamp(next)
    const zoneHint =
      item.zone !== zone ? ` (nice on ${item.zone}, fine on ${zone})` : ` on the ${zone}`
    flash(
      unlocking
        ? `Unlocked & placed ${item.name}!${earned[0] ? ` · ${earned[0].title}` : ''}`
        : `Placed ${item.name}${zoneHint}.`,
    )
  }

  function gatherAt(key: string, badge: BadgeId) {
    if (!camp || mode !== 'gather') return
    if (camp.gatheredTiles.includes(key)) {
      flash('Already gathered here — try another spot.')
      return
    }
    let next: CampState = {
      ...camp,
      gatheredTiles: [...camp.gatheredTiles, key],
      badges: { ...camp.badges, [badge]: camp.badges[badge] + 1 },
    }
    const { state, earned } = applyAchievements(next)
    next = state
    setCamp(next)
    const def = BADGES.find((b) => b.id === badge)
    flash(
      earned[0]
        ? `Found a ${def?.name ?? badge}! · ${earned[0].title}`
        : `Found a ${def?.name ?? badge}!`,
    )
  }

  function removeAt(uidToRemove: string) {
    if (!camp || mode !== 'build') return
    setCamp({ ...camp, placed: camp.placed.filter((p) => p.uid !== uidToRemove) })
    flash('Cleared that spot.')
  }

  function toggleShowProp(p: PlacedItem) {
    if (!camp || mode !== 'show-pick') return
    const item = ITEM_MAP[p.itemId]
    if (!item.showProp) {
      flash('Pick a showy prop — lanterns, drums, canoes…')
      return
    }
    const exists = camp.showBeats.find((b) => b.propUid === p.uid)
    if (exists) {
      setCamp({ ...camp, showBeats: camp.showBeats.filter((b) => b.propUid !== p.uid) })
      return
    }
    if (camp.showBeats.length >= 5) {
      flash('Shows are short — max 5 moments.')
      return
    }
    const cue = SHOW_CUES[camp.showBeats.length % SHOW_CUES.length]!
    const reaction = SHOW_REACTIONS[camp.showBeats.length % SHOW_REACTIONS.length]!
    const beat: ShowBeat = { propUid: p.uid, label: item.name, cue, reaction }
    setCamp({ ...camp, showBeats: [...camp.showBeats, beat] })
  }

  function startShow() {
    if (!camp) return
    if (camp.showBeats.length < 2) {
      flash('Pick at least 2 props for your show.')
      return
    }
    setScreen('show')
    setPlayingShow(true)
    setShowBeatIndex(0)
  }

  function inviteFriend() {
    if (!camp) return
    if (camp.campers.length >= 6) {
      flash('Camp is full for now (6 friends).')
      return
    }
    const names = ['Riley', 'Jordan', 'Casey', 'Alex', 'Morgan', 'Quinn', 'Sky', 'Robin']
    const used = new Set(camp.campers.map((c) => c.name))
    const name = names.find((n) => !used.has(n)) ?? `Pal ${camp.campers.length}`
    const color = CAMPER_COLORS[camp.campers.length % CAMPER_COLORS.length]!
    setCamp({
      ...camp,
      campers: [...camp.campers, { id: uid(), name, color }],
    })
    flash(`${name} joined with your friend code!`)
  }

  async function copyText(text: string, kind: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKind(kind)
      flash(kind === 'code' ? 'Friend code copied!' : 'Share link copied — works in other browsers!')
    } catch {
      flash('Copy failed — long-press the code instead.')
    }
  }

  async function nativeShare() {
    if (!camp) return
    const url = shareLink || buildShareUrl(camp)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${camp.campName} on Camp Crest`,
          text: `Join my private camp with code ${camp.friendCode}!`,
          url,
        })
        return
      } catch {
        /* fall through to copy */
      }
    }
    await copyText(url, 'link')
  }

  if (screen === 'welcome' || (!camp && screen !== 'created')) {
    return (
      <div className="shell welcome-shell">
        <div className="sky-band" aria-hidden />
        <div className="pine-silhouettes" aria-hidden />
        <div className="firefly f1" aria-hidden />
        <div className="firefly f2" aria-hidden />
        <div className="firefly f3" aria-hidden />
        <header className="hero">
          <p className="brand">Camp Crest</p>
          <h1>Your private summer camp</h1>
          <p className="lede">
            Build cabins, trails &amp; docks with friends — invite by code, never an open stranger
            lobby.
          </p>
        </header>

        <section className="welcome-card">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={welcomeTab === 'create'}
              className={welcomeTab === 'create' ? 'active' : ''}
              onClick={() => setWelcomeTab('create')}
            >
              Create camp
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={welcomeTab === 'join'}
              className={welcomeTab === 'join' ? 'active' : ''}
              onClick={() => setWelcomeTab('join')}
            >
              Join with code
            </button>
          </div>

          <label className="field">
            <span>Your camper name</span>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Scout Sam"
              maxLength={16}
              autoComplete="nickname"
            />
          </label>

          {welcomeTab === 'create' ? (
            <>
              <label className="field">
                <span>Camp name</span>
                <input
                  value={campNameInput}
                  onChange={(e) => setCampNameInput(e.target.value)}
                  placeholder="Pine Hollow"
                  maxLength={24}
                />
              </label>
              <button type="button" className="btn primary" onClick={startCreate}>
                Open my camp
              </button>
            </>
          ) : (
            <>
              <label className="field">
                <span>Friend code</span>
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="CREST-DEMO"
                  maxLength={14}
                  autoCapitalize="characters"
                />
              </label>
              {pendingPack ? (
                <p className="hint invite-ready">
                  Invite pack ready for <strong>{pendingPack.name}</strong> — cabin layout will load
                  when you join.
                </p>
              ) : (
                <p className="hint">
                  Sample camps: {SAMPLE_JOIN_CODES.join(' · ')}. Paste a full share link&apos;s code
                  for cross-browser co-build.
                </p>
              )}
              <button type="button" className="btn primary" onClick={startJoin}>
                Join friends’ camp
              </button>
            </>
          )}
        </section>

        <ul className="perk-list">
          <li>Cabin, porch, grounds, dock &amp; trail décor unlocks</li>
          <li>Soft badges — leaves, shells, berries &amp; feathers</li>
          <li>Evening shows with applause &amp; Camp Stars</li>
        </ul>

        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  if (screen === 'created' && camp) {
    return (
      <div className="shell invite-shell created-shell">
        <div className="sky-band soft" aria-hidden />
        <header>
          <p className="brand tiny">Camp is open</p>
          <h1>{camp.campName}</h1>
        </header>
        <div className="code-plaque big">
          <span>Your friend code</span>
          <strong>{camp.friendCode}</strong>
          <p className="plaque-note">Friends type this code — or open your share link on any browser.</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => void copyText(camp.friendCode, 'code')}>
            {copiedKind === 'code' ? 'Code copied!' : 'Copy friend code'}
          </button>
          <button type="button" className="btn" onClick={() => void nativeShare()}>
            {copiedKind === 'link' ? 'Link copied!' : 'Share invite link'}
          </button>
          <button type="button" className="btn ghost" onClick={enterCampFromCreated}>
            Enter campgrounds
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  if (!camp) return null

  if (screen === 'show') {
    const beat = camp.showBeats[showBeatIndex]
    const prop = beat ? camp.placed.find((p) => p.uid === beat.propUid) : null
    const item = prop ? ITEM_MAP[prop.itemId] : null
    const applause = Math.min(100, 35 + showBeatIndex * 18 + camp.showBeats.length * 6)
    return (
      <div className="shell show-shell">
        <div className="stage-lights" aria-hidden />
        <header className="show-header">
          <p className="brand tiny">Camp Crest Show</p>
          <h1>{camp.showTitle || `${camp.campName} Night`}</h1>
          <p className="show-sub">Show #{camp.showsRun + 1}</p>
        </header>
        <div className="stage">
          <div className={`spotlight-beam ${playingShow ? 'on' : ''}`} />
          <div className="stage-floor">
            {item && (
              <div key={beat?.propUid + String(showBeatIndex)} className="show-prop pop-in">
                <span className="show-emoji">{item.emoji}</span>
                <p className="show-line">
                  <strong>{beat?.label}</strong> {beat?.cue}
                </p>
                <p className="show-reaction">{beat?.reaction}</p>
              </div>
            )}
            {!playingShow && <p className="show-line">Curtain call…</p>}
          </div>
          <div className="applause-meter" aria-label="Applause">
            <span>Applause</span>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${applause}%` }} />
            </div>
          </div>
          <div className="show-progress">
            {camp.showBeats.map((b, i) => (
              <span key={b.propUid} className={i <= showBeatIndex ? 'lit' : ''} />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setPlayingShow(false)
            setScreen('camp')
          }}
        >
          Skip to camp
        </button>
      </div>
    )
  }

  if (screen === 'invite') {
    return (
      <div className="shell invite-shell">
        <header>
          <p className="brand tiny">Invite only</p>
          <h1>Share your camp</h1>
        </header>
        <div className="code-plaque">
          <span>Camp code</span>
          <strong>{camp.friendCode}</strong>
        </div>
        <p className="lede compact">
          Copy the <em>share link</em> so friends on other phones/browsers load your cabin layout.
          Codes alone work for sample camps and same-device rejoins.
        </p>
        <div className="camper-row">
          {camp.campers.map((c) => (
            <div key={c.id} className="camper-chip" style={{ borderColor: c.color }}>
              <span className="dot" style={{ background: c.color }} />
              {c.name}
              {c.isYou ? ' (you)' : ''}
            </div>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => void nativeShare()}>
            {copiedKind === 'link' ? 'Link copied!' : 'Share invite link'}
          </button>
          <button type="button" className="btn" onClick={() => void copyText(camp.friendCode, 'code')}>
            {copiedKind === 'code' ? 'Code copied!' : 'Copy code only'}
          </button>
          <button type="button" className="btn" onClick={inviteFriend}>
            Simulate friend join
          </button>
          <button type="button" className="btn ghost" onClick={() => setScreen('camp')}>
            Back to camp
          </button>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  // Camp screen
  const cells = Array.from({ length: ROWS * COLS }, (_, i) => {
    const x = i % COLS
    const y = Math.floor(i / COLS)
    return { x, y, key: `${x}-${y}` }
  })

  const gatherLeft = GATHER_SPOTS.filter((g) => !camp.gatheredTiles.includes(g.key)).length

  return (
    <div className="shell camp-shell">
      <div className="camp-glow" aria-hidden />
      <header className="camp-top">
        <div>
          <p className="brand tiny">Camp Crest</p>
          <h1>{camp.campName}</h1>
        </div>
        <button type="button" className="code-pill" onClick={() => setScreen('invite')}>
          Code <strong>{camp.friendCode}</strong>
        </button>
      </header>

      <div className="badge-bar" aria-label="Camp badges">
        {BADGES.map((b) => (
          <div key={b.id} className="badge-pill" title={b.hint}>
            <span>{b.emoji}</span>
            <strong>{camp.badges[b.id]}</strong>
            <em>{b.name}</em>
          </div>
        ))}
      </div>

      {camp.achievements.length > 0 && (
        <div className="achieve-strip" aria-label="Soft badges earned">
          {camp.achievements.slice(-3).map((a) => (
            <span key={a.id} className="achieve-chip">
              {a.title}
            </span>
          ))}
        </div>
      )}

      <div className="mode-bar" role="toolbar" aria-label="Camp tools">
        <button
          type="button"
          className={mode === 'build' ? 'active' : ''}
          onClick={() => setMode('build')}
        >
          Build
        </button>
        <button
          type="button"
          className={mode === 'gather' ? 'active' : ''}
          onClick={() => setMode('gather')}
        >
          Gather
        </button>
        <button
          type="button"
          className={mode === 'show-pick' ? 'active' : ''}
          onClick={() => setMode('show-pick')}
        >
          Show
        </button>
      </div>

      <p className="mode-hint">
        {mode === 'build' &&
          'Pick a zone filter, then tap a tile to place. Tap a placed piece to clear it.'}
        {mode === 'gather' &&
          `${gatherLeft} nature spots left — leaves, shells, pinecones, berries & feathers.`}
        {mode === 'show-pick' &&
          `Pick 2–5 showy props (${camp.showBeats.length}/5), name your night, then run the show.`}
      </p>

      {mode === 'show-pick' && (
        <label className="field show-title-field">
          <span>Show title</span>
          <input
            value={camp.showTitle}
            maxLength={28}
            onChange={(e) => setCamp({ ...camp, showTitle: e.target.value })}
            placeholder="Campfire Night"
          />
        </label>
      )}

      <div className="map-wrap">
        <div className="lake-edge" aria-hidden />
        <div className="map-mist" aria-hidden />
        <div
          className="camp-grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          role="grid"
          aria-label="Camp grounds"
        >
          {cells.map(({ x, y, key }) => {
            const placed = camp.placed.find((p) => p.x === x && p.y === y)
            const gather = GATHER_SPOTS.find((g) => g.x === x && g.y === y)
            const gathered = gather ? camp.gatheredTiles.includes(gather.key) : false
            const inShow = placed ? camp.showBeats.some((b) => b.propUid === placed.uid) : false
            const zone = zoneForCell(x, y)
            return (
              <button
                key={key}
                type="button"
                className={[
                  'tile',
                  `zone-${zone}`,
                  placed ? 'has-item' : '',
                  gather && mode === 'gather' && !gathered ? 'gatherable' : '',
                  inShow ? 'in-show' : '',
                  selected && mode === 'build' && !placed && ITEM_MAP[selected].zone === zone
                    ? 'zone-match'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={
                  placed ? `${ITEM_MAP[placed.itemId].name} at ${zone}` : `Empty ${zone} tile`
                }
                onClick={() => {
                  if (mode === 'gather' && gather && !gathered) {
                    gatherAt(gather.key, gather.badge)
                    return
                  }
                  if (mode === 'show-pick' && placed) {
                    toggleShowProp(placed)
                    return
                  }
                  if (mode === 'build') {
                    if (placed) {
                      removeAt(placed.uid)
                    } else {
                      placeAt(x, y)
                    }
                  }
                }}
              >
                {placed ? (
                  <span className="tile-emoji" title={ITEM_MAP[placed.itemId].name}>
                    {ITEM_MAP[placed.itemId].emoji}
                  </span>
                ) : gather && !gathered ? (
                  <span className="gather-spark">
                    {BADGES.find((b) => b.id === gather.badge)?.emoji}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'build' && (
        <>
          <div className="zone-filters" role="toolbar" aria-label="Décor zones">
            {ZONE_FILTERS.map((z) => (
              <button
                key={z.id}
                type="button"
                className={filter === z.id ? 'active' : ''}
                onClick={() => setFilter(z.id)}
              >
                <span aria-hidden>{z.emoji}</span> {z.label}
              </button>
            ))}
          </div>
          <div className="palette" role="listbox" aria-label="Build palette">
            {unlockedItems.map((item) => {
              const locked = !camp.unlocked.includes(item.id)
              const affordable = canAfford(camp, item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={selected === item.id}
                  className={[
                    'palette-item',
                    selected === item.id ? 'selected' : '',
                    locked ? 'locked' : '',
                    locked && !affordable ? 'cant' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelected(item.id)}
                  disabled={locked && !affordable}
                >
                  <span className="pe">{item.emoji}</span>
                  <span className="pn">{item.name}</span>
                  {locked && item.cost && (
                    <span className="pcost">
                      {Object.entries(item.cost)
                        .map(([b, n]) => `${BADGES.find((x) => x.id === b)?.emoji ?? b}${n}`)
                        .join(' ')}
                    </span>
                  )}
                </button>
              )
            })}
            {lockedPreview.map((item) => (
              <button
                key={`preview-${item.id}`}
                type="button"
                className="palette-item preview"
                disabled
                title="Gather more badges to unlock"
              >
                <span className="pe dim">{item.emoji}</span>
                <span className="pn">{item.name}</span>
                {item.cost && (
                  <span className="pcost">
                    {Object.entries(item.cost)
                      .map(([b, n]) => `${BADGES.find((x) => x.id === b)?.emoji ?? b}${n}`)
                      .join(' ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {mode === 'show-pick' && (
        <div className="show-actions">
          <button
            type="button"
            className="btn primary"
            onClick={startShow}
            disabled={camp.showBeats.length < 2}
          >
            Run evening show ({camp.showBeats.length})
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setCamp({ ...camp, showBeats: [] })}
          >
            Clear picks
          </button>
        </div>
      )}

      <footer className="camp-foot">
        <div className="camper-row compact">
          {camp.campers.map((c) => (
            <div key={c.id} className="camper-chip small" style={{ borderColor: c.color }}>
              <span className="dot" style={{ background: c.color }} />
              {c.name}
            </div>
          ))}
        </div>
        <button type="button" className="btn ghost tiny-btn" onClick={resetAll}>
          New camp
        </button>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
