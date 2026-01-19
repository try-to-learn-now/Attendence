// FILE: src/lib/date.ts
export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function weekdayMon1ToSun7(iso: string): number {
  const d = parseISO(iso);
  const js = d.getDay(); // 0 Sun..6 Sat
  return js === 0 ? 7 : js; // 1..7
}

export function clampISO(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}
