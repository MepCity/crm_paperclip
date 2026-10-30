export interface TimedInterval {
  id?: string;
  start: number;
  end: number;
}

function assertValid(item: { start: number; end: number }): void {
  if (!Number.isFinite(item.start) || !Number.isFinite(item.end)) {
    throw new RangeError("Interval bounds must be finite numbers");
  }
  if (item.end <= item.start) {
    throw new RangeError("Interval end must be after start");
  }
}

export function mergeBusyIntervals(
  items: ReadonlyArray<TimedInterval>,
): Array<{ start: number; end: number }> {
  for (const item of items) assertValid(item);
  const sorted = items
    .map((i) => ({ start: i.start, end: i.end }))
    .sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number }> = [];
  for (const item of sorted) {
    const last = out[out.length - 1];
    if (last && item.start <= last.end) {
      if (item.end > last.end) last.end = item.end;
    } else {
      out.push(item);
    }
  }
  return out;
}

export function findConflicts(
  candidate: { start: number; end: number },
  items: ReadonlyArray<TimedInterval>,
  opts?: { ignoreId?: string },
): TimedInterval[] {
  assertValid(candidate);
  for (const item of items) assertValid(item);
  return items
    .filter((i) => !(opts?.ignoreId !== undefined && i.id === opts.ignoreId))
    .filter((i) => i.start < candidate.end && candidate.start < i.end)
    .sort((a, b) => a.start - b.start);
}
