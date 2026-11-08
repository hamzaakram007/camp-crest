import { useEffect, useMemo, useState } from 'react'
import {
  BADGES,
  CAMPER_COLORS,
  COLS,
  GATHER_SPOTS,
  ITEMS,
  ITEM_MAP,
  ROWS,
  SAMPLE_JOIN_CODES,
  SHOW_CUES,
  generateFriendCode,
  zoneForCell,
} from './catalog'
import { clearCamp, createFreshCamp, loadCamp, saveCamp } from './storage'
import type { BadgeId, CampState, ItemId, PlacedItem, Screen, ShowBeat } from './types'
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [camp, setCamp] = useState<CampState | null>(null)
  const [selected, setSelected] = useState<ItemId | null>('lantern')
  const [mode, setMode] = useState<'build' | 'gather' | 'show-pick'>('build')
  const [toast, setToast] = useState<string | null>(null)
  const [playingShow, setPlayingShow] = useState(false)
  const [showBeatIndex, setShowBeatIndex] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [campNameInput, setCampNameInput] = useState('Pine Hollow')
  const [codeInput, setCodeInput] = useState('')
  const [welcomeTab, setWelcomeTab] = useState<'create' | 'join'>('create')

  useEffect(() => {
    const existing = loadCamp()
    if (existing) {
      setCamp(existing)
      setScreen('camp')
      setNameInput(existing.camperName)
    }
  }, [])

  useEffect(() => {
    if (camp) saveCamp(camp)
  }, [camp])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!playingShow || !camp) return
    if (showBeatIndex >= camp.showBeats.length) {
      const done = window.setTimeout(() => {
        setPlayingShow(false)
        setShowBeatIndex(0)
        setToast('Show complete! You earned a Camp Star ⭐')
        setCamp((c) =>
          c
            ? {
                ...c,
                badges: { ...c.badges, star: c.badges.star + 1 },
                lastShowAt: Date.now(),
              }
            : c,
        )
        setScreen('camp')
        setMode('build')
      }, 900)
      return () => window.clearTimeout(done)
    }
    const t = window.setTimeout(() => setShowBeatIndex((i) => i + 1), 1400)
    return () => window.clearTimeout(t)
  }, [playingShow, showBeatIndex, camp])

  const unlockedItems = useMemo(() => {
    if (!camp) return []
    return ITEMS.filter((i) => camp.unlocked.includes(i.id) || canAfford(camp, i.id) || i.starter)
  }, [camp])

  function flash(msg: string) {
    setToast(msg)
  }

  function startCreate() {
    const camper = nameInput.trim() || 'Camper'
    const campName = campNameInput.trim() || 'Pine Hollow'
    const code = generateFriendCode()
    const color = CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)]
    const next = createFreshCamp(campName, code, camper, color)
    setCamp(next)
    setScreen('camp')
    setMode('build')
    setSelected('lantern')
    flash(`Welcome to ${campName}! Place a lantern to start.`)
  }

  function startJoin() {
    const raw = codeInput.trim().toUpperCase()
    if (!raw) {
      flash('Enter a friend code to join.')
      return
    }
    const camper = nameInput.trim() || 'Friend'
    const known = SAMPLE_JOIN_CODES.includes(raw) || /^[A-Z]+-\d{4}$/.test(raw)
    if (!known) {
      flash('Try CREST-DEMO or a code like PINE-4821')
      return
    }
    const hostName =
      raw === 'CREST-DEMO' ? 'Crest Demo Camp' : raw === 'LAKE-7730' ? 'Lake Glow Camp' : 'Pine Pal Camp'
    const color = CAMPER_COLORS[Math.floor(Math.random() * CAMPER_COLORS.length)]
    const next = createFreshCamp(hostName, raw, camper, color)
    next.campers = [
      { id: 'host', name: 'Scout Sam', color: '#2A6F7A' },
      { id: 'you', name: camper, color, isYou: true },
    ]
    next.placed = [
      ...next.placed,
      { uid: 'friend-flag', itemId: 'flag', x: 4, y: 2 },
      { uid: 'friend-bench', itemId: 'bench', x: 2, y: 3 },
    ]
    setCamp(next)
    setScreen('camp')
    setMode('build')
    flash(`Joined ${hostName} with code ${raw}. No stranger lobby — friends only!`)
  }

  function resetAll() {
    clearCamp()
    setCamp(null)
    setScreen('welcome')
    setNameInput('')
    setCodeInput('')
    setMode('build')
  }

  function placeAt(x: number, y: number) {
    if (!camp || !selected || mode !== 'build') return
    const occupied = camp.placed.some((p) => p.x === x && p.y === y)
    if (occupied) {
      flash('That spot is taken — tap another tile.')
      return
    }
    const item = ITEM_MAP[selected]
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
    setCamp({
      ...camp,
      placed: [...camp.placed, placed],
      badges,
      unlocked,
    })
    flash(
      unlocking
        ? `Unlocked & placed ${item.name}!`
        : `Placed ${item.name} on the ${zoneForCell(x, y)}.`,
    )
  }

  function gatherAt(key: string, badge: BadgeId) {
    if (!camp || mode !== 'gather') return
    if (camp.gatheredTiles.includes(key)) {
      flash('Already gathered here — try another spot.')
      return
    }
    setCamp({
      ...camp,
      gatheredTiles: [...camp.gatheredTiles, key],
      badges: { ...camp.badges, [badge]: camp.badges[badge] + 1 },
    })
    const def = BADGES.find((b) => b.id === badge)
    flash(`Found a ${def?.name ?? badge}!`)
  }

  function removeAt(uidToRemove: string) {
    if (!camp || mode !== 'build') return
    const target = camp.placed.find((p) => p.uid === uidToRemove)
    if (!target || target.uid.startsWith('seed-') || target.uid.startsWith('friend-')) {
      // allow removing seeds too for flexibility, but keep cabin seed if last cabin
    }
    setCamp({ ...camp, placed: camp.placed.filter((p) => p.uid !== uidToRemove) })
    flash('Cleared that spot.')
  }

  function toggleShowProp(p: PlacedItem) {
    if (!camp || mode !== 'show-pick') return
    const item = ITEM_MAP[p.itemId]
    if (!item.showProp) {
      flash('Pick a showy prop — lanterns, flags, canoes…')
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
    const cue = SHOW_CUES[camp.showBeats.length % SHOW_CUES.length]
    const beat: ShowBeat = { propUid: p.uid, label: item.name, cue }
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
    if (camp.campers.length >= 4) {
      flash('Camp is full for this MVP (4 friends).')
      return
    }
    const names = ['Riley', 'Jordan', 'Casey', 'Alex', 'Morgan', 'Quinn']
    const used = new Set(camp.campers.map((c) => c.name))
    const name = names.find((n) => !used.has(n)) ?? `Pal ${camp.campers.length}`
    const color = CAMPER_COLORS[camp.campers.length % CAMPER_COLORS.length]
    setCamp({
      ...camp,
      campers: [...camp.campers, { id: uid(), name, color }],
    })
    flash(`${name} joined with your friend code!`)
  }

  if (screen === 'welcome' || !camp) {
    return (
      <div className="shell welcome-shell">
        <div className="sky-band" aria-hidden />
        <header className="hero">
          <p className="brand">Camp Crest</p>
          <h1>Your private summer camp</h1>
          <p className="lede">
            Build cabins and trails with friends — invite by code, never an open stranger lobby.
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
                  maxLength={12}
                  autoCapitalize="characters"
                />
              </label>
              <p className="hint">
                Try sample codes: {SAMPLE_JOIN_CODES.join(' · ')}
              </p>
              <button type="button" className="btn primary" onClick={startJoin}>
                Join friends’ camp
              </button>
            </>
          )}
        </section>

        <ul className="perk-list">
          <li>Decorate cabin, dock, trails &amp; stage</li>
          <li>Gather leaves &amp; shells for soft unlocks</li>
          <li>Put on a 30-second camp show</li>
        </ul>

        {toast && <div className="toast">{toast}</div>}
      </div>
    )
  }

  if (screen === 'show') {
    const beat = camp.showBeats[showBeatIndex]
    const prop = beat ? camp.placed.find((p) => p.uid === beat.propUid) : null
    const item = prop ? ITEM_MAP[prop.itemId] : null
    return (
      <div className="shell show-shell">
        <div className="stage-lights" aria-hidden />
        <header className="show-header">
          <p className="brand tiny">Camp Crest Show</p>
          <h1>{camp.campName} Night</h1>
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
              </div>
            )}
            {!playingShow && <p className="show-line">Curtain call…</p>}
          </div>
          <div className="show-progress">
            {camp.showBeats.map((b, i) => (
              <span key={b.propUid} className={i <= showBeatIndex ? 'lit' : ''} />
            ))}
          </div>
        </div>
        <button type="button" className="btn ghost" onClick={() => { setPlayingShow(false); setScreen('camp') }}>
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
          <h1>Share your friend code</h1>
        </header>
        <div className="code-plaque">
          <span>Camp code</span>
          <strong>{camp.friendCode}</strong>
        </div>
        <p className="lede compact">
          Friends enter this code to co-build. No public lobby, no stranger chat — family &amp; pals
          only.
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
          <button type="button" className="btn primary" onClick={inviteFriend}>
            Simulate friend join
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void navigator.clipboard?.writeText(camp.friendCode)
              flash('Code copied!')
            }}
          >
            Copy code
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

  return (
    <div className="shell camp-shell">
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
        {mode === 'build' && 'Tap a tile to place your selected décor. Long-press / double-tap a piece to clear it.'}
        {mode === 'gather' && 'Tap glowing nature spots for leaves, shells, and pinecones.'}
        {mode === 'show-pick' &&
          `Pick 2–5 showy props (${camp.showBeats.length}/5), then run the evening show.`}
      </p>

      <div className="map-wrap">
        <div className="lake-edge" aria-hidden />
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
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={
                  placed
                    ? `${ITEM_MAP[placed.itemId].name} at ${zone}`
                    : `Empty ${zone} tile`
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
                  <span className="gather-spark">{BADGES.find((b) => b.id === gather.badge)?.emoji}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'build' && (
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
                      .map(
                        ([b, n]) =>
                          `${BADGES.find((x) => x.id === b)?.emoji ?? b}${n}`,
                      )
                      .join(' ')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
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
