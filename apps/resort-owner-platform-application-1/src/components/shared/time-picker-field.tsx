"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Clock, Plus } from "lucide-react"
import { Button, cn } from "@resort/shadcn-ui"

// Dial order, not numeric order — index 0 renders at the top of the ring (see polar()'s angle
// math), so 12 leads the array to land at 12 o'clock like a real clock face, then 1–11 follow clockwise.
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

// Real clocks only mark every 5 minutes (00, 05, 10, ... 55) — the minute hand rests on the same
// 12 rim positions as the hour numbers (e.g. the "2" position is hour=2 or minute=10 depending on
// which hand is pointing there), so this shares the exact same ring as HOURS, just relabeled.
const MINUTE_MARKS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

type Hand = "hour" | "minute"
type Period = "AM" | "PM"

interface Draft {
  hour12?: number
  minute?: string
  period?: Period
}

// "HH:mm" (24-hour, no seconds) <-> { hour12, minute, period }
function parseValue(v: string): Required<Draft> | null {
  if (!v) return null
  const [hStr, mStr] = v.split(":")
  const h = Number(hStr)
  const period: Period = h < 12 ? "AM" : "PM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour12, minute: mStr, period }
}

function buildValue(d: Required<Draft>): string {
  const h24 = d.period === "AM" ? (d.hour12 % 12) : (d.hour12 % 12) + 12
  return `${String(h24).padStart(2, "0")}:${d.minute}`
}

function formatLabel(v: string): string {
  const parsed = parseValue(v)
  if (!parsed) return ""
  return `${parsed.hour12}:${parsed.minute} ${parsed.period}`
}

export interface TimePickerFieldProps {
  /** "" (unset) or "HH:mm" — 24-hour, no seconds. Callers append/strip ":ss" for the API. */
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const DIAL_SIZE = 320
const DIAL_CENTER = DIAL_SIZE / 2
const RING_RADIUS = DIAL_CENTER - 32

// index/total (0 = top, clockwise) -> both the polar x/y used to place a mark, and the plain
// degrees used to swing a hand toward it (CSS rotate() is already clockwise-from-top, so the two
// stay in sync for free).
function polar(fraction: number, radius: number) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return { x: DIAL_CENTER + radius * Math.cos(angle), y: DIAL_CENTER + radius * Math.sin(angle) }
}

// A real analog clock face: ONE ring of 12 positions (relabeled 1–12 or 00/05/.../55 depending on
// which hand is active), with both the hour and minute hands always drawn and kept in sync with
// whatever's been picked so far. Exactly like a real clock, where "2" on the rim means hour=2 to
// the short hand and minute=10 to the long hand — never two separate rings.
function ClockFace({ hour12, minute, activeHand, onPickHour, onPickMinute, onActivateHand, center }: {
  hour12?: number
  minute?: string
  activeHand: Hand
  onPickHour: (h: number) => void
  onPickMinute: (m: string) => void
  onActivateHand: (h: Hand) => void
  center: React.ReactNode
}) {
  const hourIndex = hour12 != null ? HOURS.indexOf(hour12) : -1
  // A raw 0-59 value, not the 12-mark ring index — the +1-minute dial can land the hand between
  // marks, so the hand's angle can't depend on being exactly on one of the 12 ring positions.
  const minuteValue = minute != null ? Number(minute) : -1
  const hourHandLength = RING_RADIUS * 0.6
  const minuteHandLength = RING_RADIUS * 0.8
  const ringItems = activeHand === "hour" ? HOURS : MINUTE_MARKS.map(Number)

  // Real clock hands only ever sweep forward. CSS's rotate() transition takes the numerically
  // shortest path between two angles, which can walk the hand backward (e.g. 10 -> 7 the "short"
  // way is -90deg). Tracking an ever-growing absolute angle and always advancing by the forward
  // (0-360) delta keeps every move clockwise, even when that means spinning almost a full turn.
  const [hourAngle, setHourAngle] = useState(() => (hourIndex >= 0 ? (hourIndex / 12) * 360 : 0))
  const [minuteAngle, setMinuteAngle] = useState(() => (minuteValue >= 0 ? (minuteValue / 60) * 360 : 0))
  // A fixed transition duration makes a 1-hour hop and an 11-hour hop take equally long, so the
  // 11-hour one visibly races around the face. Deriving duration from the sweep distance instead
  // (a constant deg/ms rate) keeps the hand's actual speed the same no matter how far it travels.
  const [hourDuration, setHourDuration] = useState(300)
  const [minuteDuration, setMinuteDuration] = useState(300)
  const MS_PER_DEG = 2.5
  const MIN_DURATION_MS = 150

  useEffect(() => {
    if (hourIndex < 0) return
    // A real hour hand creeps forward with the minutes instead of snapping between hour marks —
    // at 4:30 it sits halfway between 4 and 5, not stuck on 4 — so the target angle folds in how
    // far through the hour the picked minute is, not just which hour is picked.
    const minuteFraction = minuteValue >= 0 ? minuteValue / 60 : 0
    const target = ((hourIndex + minuteFraction) / 12) * 360
    const prevMod = ((hourAngle % 360) + 360) % 360
    const delta = ((target - prevMod) % 360 + 360) % 360
    if (delta === 0) return
    setHourDuration(Math.max(MIN_DURATION_MS, delta * MS_PER_DEG))
    setHourAngle(hourAngle + delta)
    // Only react to the picked hour/minute changing — hourAngle is read for its current value,
    // not watched, otherwise this would re-fire on the very update it just made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourIndex, minuteValue])

  useEffect(() => {
    if (minuteValue < 0) return
    const target = (minuteValue / 60) * 360
    const prevMod = ((minuteAngle % 360) + 360) % 360
    const delta = ((target - prevMod) % 360 + 360) % 360
    if (delta === 0) return
    setMinuteDuration(Math.max(MIN_DURATION_MS, delta * MS_PER_DEG))
    setMinuteAngle(minuteAngle + delta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minuteValue])

  return (
    <div
      className="mx-auto rounded-full p-0.75 bg-linear-to-br from-primary via-primary/90 to-primary shadow-lg shadow-primary/20"
      style={{ width: DIAL_SIZE + 6, height: DIAL_SIZE + 6 }}
    >
      <div
        className="relative rounded-full bg-linear-to-br from-card to-muted shadow-inner ring-2 ring-background"
        style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
      >
        <div className="absolute inset-8 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Decorative minute ticks around the rim, purely cosmetic (like the fine ticks on a real
            clock face) — the 12 major ones sit right behind the ring's number buttons. */}
        {Array.from({ length: 60 }).map((_, i) => {
          const isMajor = i % 5 === 0
          const { x, y } = polar(i / 60, DIAL_SIZE / 2 - 5)
          return (
            <div
              key={i}
              className={cn("absolute rounded-full pointer-events-none", isMajor ? "bg-primary/30" : "bg-muted-foreground/25")}
              style={{ left: x, top: y, width: isMajor ? 3 : 2, height: isMajor ? 9 : 5, transform: `translate(-50%, -50%) rotate(${(i / 60) * 360}deg)` }}
            />
          )
        })}

        {/* Minute hand — same dauphine taper as the hour hand (just longer and a touch slimmer,
            no inset jewel so it doesn't read as a solid blade), so both hands match as one set.
            Always on, independent of which hand is "active". */}
        {minuteValue >= 0 && (
          <button
            type="button"
            aria-label="Set minute"
            onClick={() => onActivateHand("minute")}
            className={cn(
              "absolute left-1/2 top-1/2 bg-linear-to-t cursor-pointer transition-transform ease-out",
              activeHand === "minute" ? "from-primary/70 to-primary" : "from-primary/40 to-primary/70",
            )}
            style={{
              width: 12,
              height: minuteHandLength,
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
              transformOrigin: "50% 100%",
              transitionDuration: `${minuteDuration}ms`,
              clipPath: "polygon(50% 0%, 100% 38%, 68% 100%, 32% 100%, 0% 38%)",
              filter: "drop-shadow(0 0 5px var(--color-primary))",
            }}
          />
        )}

        {/* Hour hand — short, tapered, glowing tip. Rendered on top of (and shorter than) the
            minute hand, same as a real clock. */}
        {hourIndex >= 0 && (
          <button
            type="button"
            aria-label="Set hour"
            onClick={() => onActivateHand("hour")}
            className={cn(
              "absolute left-1/2 top-1/2 bg-linear-to-t cursor-pointer transition-transform ease-out",
              activeHand === "hour" ? "from-primary/70 to-primary" : "from-primary/40 to-primary/70",
            )}
            style={{
              width: 16,
              height: hourHandLength,
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
              transformOrigin: "50% 100%",
              transitionDuration: `${hourDuration}ms`,
              clipPath: "polygon(50% 0%, 100% 38%, 68% 100%, 32% 100%, 0% 38%)",
              filter: "drop-shadow(0 0 5px var(--color-primary))",
            }}
          />
        )}

        <span className="absolute rounded-full bg-primary/30 animate-ping h-2.5 w-2.5 z-10" style={{ left: DIAL_CENTER - 5, top: DIAL_CENTER - 5 }} />
        <div className="absolute rounded-full bg-primary shadow-sm ring-2 ring-background h-2.5 w-2.5 z-10" style={{ left: DIAL_CENTER - 5, top: DIAL_CENTER - 5 }} />

        {/* Digital readout, like a watch's date window — the hands still swing underneath it. */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-6 z-20 bg-transparent px-1 py-1 text-3xl font-bold tracking-tight tabular-nums whitespace-nowrap">
          {center}
        </div>

        {/* The single ring — relabeled per activeHand, clicks feed whichever hand is active. */}
        {ringItems.map((item, i) => {
          const { x, y } = polar(i / 12, RING_RADIUS)
          const label = activeHand === "hour" ? String(item) : String(item).padStart(2, "0")
          const isSelected = activeHand === "hour" ? item === hour12 : label === minute
          return (
            <button
              key={item}
              type="button"
              onClick={() => (activeHand === "hour" ? onPickHour(item) : onPickMinute(label))}
              style={{ left: x, top: y }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full text-lg font-bold cursor-pointer transition-all flex items-center justify-center hover:scale-110 z-10",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110"
                  : "bg-linear-to-br from-card to-muted border border-border/60 shadow-sm hover:border-primary/50 hover:shadow-md hover:from-primary/10",
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// A single field showing the picked time ("9:30 AM"), like a native time input — but clicking it
// opens one analog face with a single ring (just like a real clock) and both hands live at once.
// Tap the hour or minute digit in the readout to choose which hand the ring currently controls —
// the other hand stays exactly where it was, still visible.
export function TimePickerField({ value, onChange, disabled, placeholder, className }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>({})
  const [activeHand, setActiveHand] = useState<Hand>("hour")
  // Where the clock portals to. This field only ever opens from inside a Sheet/Dialog panel
  // (never bare on a page), so we target that panel's own content box — found via the
  // `data-slot` shadcn already stamps on it — rather than document.body. Portaling as a plain
  // child of the panel (itself always `position: fixed`) makes `absolute inset-0` on the
  // overlay size to exactly that panel's visible bounds, so `items-center justify-center`
  // centers the clock within the panel, not the full browser viewport.
  const [panel, setPanel] = useState<Element | null>(null)

  function handleOpenChange(v: boolean) {
    if (disabled) return
    // No separate Done button — the readout (hh:mm AM/PM) is the whole interface, so closing the
    // popover (outside click, Escape, re-toggling the trigger) is the confirmation. Commit
    // whatever's been picked so far, same as a real clock just always showing its current time.
    if (!v && draft.hour12 != null && draft.minute != null && draft.period != null) {
      onChange(buildValue({ hour12: draft.hour12, minute: draft.minute, period: draft.period }))
    }
    setOpen(v)
    if (v) {
      // No existing value yet — default to 11:00 AM rather than hidden.
      setDraft(parseValue(value) ?? { hour12: 11, minute: "00", period: "AM" })
      setActiveHand("hour")
    }
  }

  useEffect(() => {
    if (!open) return
    setPanel(document.querySelector('[data-slot="sheet-content"], [data-slot="dialog-content"]'))
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleOpenChange(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function pickHour(hour12: number) {
    setDraft((d) => ({ ...d, hour12 }))
    // No auto-advance — the ring stays on whichever hand is active until the user explicitly
    // taps the hh or mm digit in the readout to switch.
  }
  function pickMinute(minute: string) {
    setDraft((d) => ({ ...d, minute }))
  }
  function pickPeriod(period: Period) {
    setDraft((d) => ({ ...d, period }))
  }
  function incrementMinute() {
    setDraft((d) => {
      const current = d.minute != null ? Number(d.minute) : 0
      const next = (current + 1) % 60
      const nextDraft: Draft = { ...d, minute: String(next).padStart(2, "0") }
      // Minute wrapping past 59 carries into the hour — 11:59 -> 12:00, not 11:00 — and 11 -> 12
      // also flips AM/PM, the one point in the 12-hour cycle where the period changes.
      if (next === 0 && current === 59 && d.hour12 != null) {
        if (d.hour12 === 11) {
          nextDraft.hour12 = 12
          nextDraft.period = d.period === "AM" ? "PM" : "AM"
        } else if (d.hour12 === 12) {
          nextDraft.hour12 = 1
        } else {
          nextDraft.hour12 = d.hour12 + 1
        }
      }
      return nextDraft
    })
    setActiveHand("minute")
  }

  const centerReadout = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setActiveHand("hour")}
        className={cn(
          "leading-none rounded-md px-1.5 py-0.5 cursor-pointer border transition-colors",
          activeHand === "hour"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/60 text-foreground border-border/60 hover:border-primary/50 hover:bg-primary/10",
        )}
      >
        {draft.hour12 ?? "--"}
      </button>
      <span className="leading-none">:</span>
      <button
        type="button"
        onClick={() => setActiveHand("minute")}
        className={cn(
          "leading-none rounded-md px-1.5 py-0.5 cursor-pointer border transition-colors",
          activeHand === "minute"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/60 text-foreground border-border/60 hover:border-primary/50 hover:bg-primary/10",
        )}
      >
        {draft.minute ?? "--"}
      </button>
      {/* AM/PM as an always-visible two-way toggle (not a hidden dropdown) — both options are on
          screen at once with the active one highlighted, so it's obvious at a glance both what
          it's set to and that tapping the other one changes it. */}
      <div className="flex flex-col gap-0.5 ml-1">
        <button
          type="button"
          onClick={() => pickPeriod("AM")}
          className={cn(
            "text-base font-bold leading-none rounded px-1.5 py-0.5 cursor-pointer border transition-colors",
            draft.period === "AM"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/60 text-muted-foreground border-border/60 hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
          )}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => pickPeriod("PM")}
          className={cn(
            "text-base font-bold leading-none rounded px-1.5 py-0.5 cursor-pointer border transition-colors",
            draft.period === "PM"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/60 text-muted-foreground border-border/60 hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
          )}
        >
          PM
        </button>
      </div>
    </div>
  )

  const overlay = (
    // A hand-rolled overlay, portaled as a plain child of the enclosing Sheet/Dialog panel
    // rather than to document.body — `absolute inset-0` on a direct child of that panel (always
    // `position: fixed`) sizes to exactly the panel's own visible box, so `items-center
    // justify-center` centers the clock within the panel itself, not the full browser viewport.
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in-0"
      onClick={() => handleOpenChange(false)}
    >
      <div
        className="flex flex-col items-center animate-in zoom-in-95 fade-in-0"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={placeholder ?? "Select time"}
      >
          {/* Fine minute adjuster, sitting on top of the case — a crown wouldn't make sense here
              (it belongs on the side, where you'd actually turn it), so on top this reads as a
              hand-bell instead: hanging loop, tapering dome body, flared rim, fused to the case
              by a stem bridging down into the bezel. The ring only offers 5-minute marks; this
              bumps the minute hand one minute at a time for exact values like :07 or :42. */}
          <div className="relative -mb-3 flex flex-col items-center">
            <button
              type="button"
              onClick={incrementMinute}
              aria-label="Increase minute by 1"
              title="+1 minute"
              className="relative z-10 flex shrink-0 flex-col items-center cursor-pointer transition-transform duration-150 hover:scale-110 active:scale-90"
            >
              {/* Hanging loop atop the bell. */}
              <span className="-mb-1 h-3 w-3 rounded-full bg-linear-to-br from-primary/80 to-primary shadow-sm" />
              {/* Domed, tapering bell body — narrow shoulders widening smoothly down to the mouth,
                  the classic hand-bell silhouette, clipped from a single path (not a flat circle).
                  Built entirely from the app's own grayscale --primary token (via color-mix, not
                  literal hex) so it stays correct in both themes. */}
              <span
                className="relative flex h-10.5 w-13 items-end justify-center overflow-hidden pb-1 shadow-lg shadow-primary/40"
                style={{
                  clipPath:
                    "path('M26 1.3 C14.3 1.3 7.8 11.7 6.5 23.4 C5.6 29.9 3.9 33.8 2.6 41.6 L49.4 41.6 C48.1 33.8 46.4 29.9 45.5 23.4 C44.2 11.7 37.7 1.3 26 1.3 Z')",
                  backgroundImage:
                    "linear-gradient(90deg, var(--color-primary) 0%, color-mix(in oklab, var(--color-primary) 55%, transparent) 15%, color-mix(in oklab, var(--color-primary) 35%, transparent) 32%, color-mix(in oklab, var(--color-primary) 70%, transparent) 50%, var(--color-primary) 68%, color-mix(in oklab, var(--color-primary) 45%, transparent) 85%, var(--color-primary) 100%)",
                }}
              >
                {/* Glossy top sheen fading to a shaded underside, for a rounded 3D feel. */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-primary-foreground/30 to-transparent" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/30 to-transparent" />
                <Plus className="relative z-10 h-4 w-4 text-primary-foreground drop-shadow" />
              </span>
              {/* Flared rim at the bell's mouth. */}
              <span className="-mt-0.75 h-2.25 w-15 rounded-full bg-linear-to-b from-primary/90 to-primary/60 shadow-sm" />
            </button>
            {/* Tapered metallic stem, inset-shaded for depth so it reads as a solid bridge into
                the case rather than a flat rectangle. */}
            <div className="h-3.5 w-4 bg-linear-to-b from-primary/90 via-primary to-primary/70 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.35)]" />
          </div>
          <ClockFace
            hour12={draft.hour12}
            minute={draft.minute}
            activeHand={activeHand}
            onPickHour={pickHour}
            onPickMinute={pickMinute}
            onActivateHand={setActiveHand}
            center={centerReadout}
          />
        </div>
      </div>
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => handleOpenChange(!open)}
        className={cn(
          "w-full justify-start text-left font-normal h-10 text-base gap-0",
          value ? "border-primary/30" : "text-muted-foreground",
          className,
        )}
      >
        <span className={cn(
          "h-6 w-6 mr-2 shrink-0 rounded-md flex items-center justify-center",
          value ? "bg-linear-to-br from-primary to-primary/60 text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground",
        )}>
          <Clock className="h-3.5 w-3.5" />
        </span>
        {value ? formatLabel(value) : (placeholder ?? "Select time")}
      </Button>
      {open && panel && createPortal(overlay, panel)}
    </>
  )
}
