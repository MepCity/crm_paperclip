/**
 * Pure calculator for bookable time slots inside business hours.
 * Business hours are wall-clock times in an IANA time zone; no persistence, no network.
 */

export interface BusinessHours {
  /** IANA time zone, e.g. "Europe/Istanbul". */
  timeZone: string;
  /** Intervals per weekday (0 = Sunday), "HH:MM" wall-clock strings. */
  days: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, Array<{ start: string; end: string }>>>;
}

export interface BookingSlotInput {
  hours: BusinessHours;
  /** Busy ranges, epoch ms. */
  busy: ReadonlyArray<{ start: number; end: number }>;
  from: number;
  to: number;
  durationMinutes: number;
  bufferMinutes?: number;
  /** Defaults to durationMinutes. */
  stepMinutes?: number;
  minNoticeMinutes?: number;
  now: number;
}

const MIN = 60_000;
const DAY = 86_400_000;

function makeFormatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  } catch {
    throw new RangeError(`Unknown time zone: ${timeZone}`);
  }
}

/** Wall-clock fields of an instant, expressed as a UTC-based epoch ms. */
function wallOf(fmt: Intl.DateTimeFormat, epoch: number): number {
  const p: Record<string, number> = {};
  for (const part of fmt.formatToParts(new Date(epoch))) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/**
 * Instant for a wall-clock time. Ambiguous times resolve to the first occurrence;
 * non-existent times (spring-forward gap) shift forward by the gap length.
 */
function wallToEpoch(fmt: Intl.DateTimeFormat, wall: number): number {
  const before = wallOf(fmt, wall - DAY) - (wall - DAY);
  const after = wallOf(fmt, wall + DAY) - (wall + DAY);
  const candidates = [wall - before, wall - after].filter((c) => wallOf(fmt, c) === wall);
  if (candidates.length > 0) return Math.min(...candidates);
  return wall - before;
}

function parseClock(value: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) throw new RangeError(`Invalid time: ${value}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new RangeError(`Invalid time: ${value}`);
  return (h * 60 + min) * MIN;
}

export function availableBookingSlots(
  input: BookingSlotInput,
): Array<{ start: number; end: number }> {
  const { hours, busy, from, to, durationMinutes, now } = input;
  const bufferMs = (input.bufferMinutes ?? 0) * MIN;
  const durationMs = durationMinutes * MIN;
  const stepMs = (input.stepMinutes ?? durationMinutes) * MIN;
  const earliest = now + (input.minNoticeMinutes ?? 0) * MIN;

  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from)
    throw new RangeError("to must be after from");
  if (!(durationMinutes > 0)) throw new RangeError("durationMinutes must be positive");
  if (!(stepMs > 0)) throw new RangeError("stepMinutes must be positive");
  if (bufferMs < 0) throw new RangeError("bufferMinutes must not be negative");

  const fmt = makeFormatter(hours.timeZone);
  const parsed = new Map<number, Array<{ start: number; end: number }>>();
  for (let d = 0; d < 7; d++) {
    const list = hours.days[d as 0 | 1 | 2 | 3 | 4 | 5 | 6];
    if (!list) continue;
    parsed.set(
      d,
      list.map((r) => {
        const start = parseClock(r.start);
        const end = parseClock(r.end);
        if (end <= start)
          throw new RangeError(`Interval end must be after start: ${r.start}-${r.end}`);
        return { start, end };
      }),
    );
  }

  const slots = new Set<number>();
  const firstWall = wallOf(fmt, from);
  const lastWall = wallOf(fmt, to);
  const startDay = firstWall - (((firstWall % DAY) + DAY) % DAY) - DAY;
  for (let day = startDay; day <= lastWall + DAY; day += DAY) {
    const intervals = parsed.get(new Date(day).getUTCDay());
    if (!intervals) continue;
    for (const iv of intervals) {
      const ivStart = wallToEpoch(fmt, day + iv.start);
      const ivEnd = wallToEpoch(fmt, day + iv.end);
      for (let s = ivStart; s + durationMs <= ivEnd; s += stepMs) {
        const e = s + durationMs;
        if (s < from || e > to || s < earliest) continue;
        if (busy.some((b) => s < b.end + bufferMs && e > b.start - bufferMs)) continue;
        slots.add(s);
      }
    }
  }
  return [...slots].sort((a, b) => a - b).map((start) => ({ start, end: start + durationMs }));
}
