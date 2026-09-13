/**
 * Types + business logic + pure helpers for JadvalApps (Persian course scheduler).
 * No React here — all pure functions, fully testable.
 */

// ---------- Types ----------

export type Day =
  | 'شنبه'
  | 'یکشنبه'
  | 'دوشنبه'
  | 'سه‌شنبه'
  | 'چهارشنبه'
  | 'پنجشنبه';

export const DAYS: Day[] = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];

export interface Session {
  day: Day;
  start: string; // 'HH:mm' 24h
  end: string;   // 'HH:mm' 24h
}

export interface Course {
  id: number;
  code: string;
  name: string;
  professor: string;
  units: number;
  exam_date: string | null; // Jalali 'YYYY-MM-DD' (e.g. '1404-09-20') or null
  exam_time: string | null; // 'HH:mm' or null
  sessions: Session[];
  color?: string; // optional manual override; empty = auto
}

export interface AppState {
  courses: Course[];
  selectedCourseId: number | null;
  theme: 'dark' | 'light';
  welcomeSeen: boolean;
  unitsCap: number; // 0 = no cap
}

export const INITIAL_STATE: AppState = {
  courses: [],
  selectedCourseId: null,
  theme: 'dark',
  welcomeSeen: false,
  unitsCap: 20,
};

// ---------- Digit / number helpers ----------

/** Convert Persian (۰-۹ U+06F0..U+06F9) and Arabic-Indic (٠-٩ U+0660..U+0669) to ASCII. */
export function toEnglishDigits(s: string): string {
  if (!s) return s;
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x06f0 && c <= 0x06f9) out += String.fromCharCode(c - 0x06f0 + 0x30);
    else if (c >= 0x0660 && c <= 0x0669) out += String.fromCharCode(c - 0x0660 + 0x30);
    else out += ch;
  }
  return out;
}

/** Localized digits for display: '12:30' -> '۱۲:۳۰' */
export function toPersianDigits(s: string | number): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return String(s).replace(/[0-9]/g, (d) => fa[Number(d)]);
}

export function parsePositiveInt(s: string, fallback = 0): number {
  const cleaned = toEnglishDigits(String(s)).replace(/[^0-9]/g, '');
  if (!cleaned) return fallback;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ---------- Time helpers ----------

/** Convert a time string to minutes since midnight. Returns null if invalid. */
export function timeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(toEnglishDigits(t.trim()));
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Minutes since midnight -> 'HH:mm' (English digits). */
export function minutesToHHmm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/**
 * Normalize loosely-formatted time input.
 *  '8' -> '08:00', '8.5'/'8,5' -> '08:30' (decimal half), '8:5' -> '08:50',
 *  '0800' -> '08:00', '14:30' -> '14:30', '۸:۰۵' -> '08:05'. Returns null if hopeless.
 */
export function normalizeTimeLoose(raw: string): string | null {
  if (!raw) return null;
  const s0 = toEnglishDigits(String(raw).trim());
  if (!s0) return null;
  let m: RegExpExecArray | null;
  // Decimal half-hour: '8.5', '8,5', '8٫5'
  m = /^(\d{1,2})\s*[.,٫]\s*5$/.exec(s0);
  if (m) {
    const h = parseInt(m[1], 10);
    return h <= 23 ? pad(h) + ':30' : null;
  }
  // 'H.30' / 'H,30'
  m = /^(\d{1,2})\s*[.,٫]\s*30$/.exec(s0);
  if (m) {
    const h = parseInt(m[1], 10);
    return h <= 23 ? pad(h) + ':30' : null;
  }
  // 'H:M' or 'H M'
  m = /^(\d{1,2})\s*[:\s]\s*(\d{1,2})$/.exec(s0);
  if (m) {
    const h = parseInt(m[1], 10);
    if (h > 23) return null;
    if (m[2].length === 1) {
      const min = parseInt(m[2], 10) * 10; // '8:5' -> 08:50
      return min <= 59 ? pad(h) + ':' + pad(min) : null;
    }
    const min = parseInt(m[2], 10);
    return min <= 59 ? pad(h) + ':' + pad(min) : null;
  }
  // 'HHMM' / 'HMM'
  m = /^(\d{3,4})$/.exec(s0);
  if (m) {
    const v = m[1];
    const h = parseInt(v.slice(0, v.length - 2), 10);
    const min = parseInt(v.slice(-2), 10);
    if (h <= 23 && min <= 59) return pad(h) + ':' + pad(min);
    return null;
  }
  // Bare hour: '8', '14'
  m = /^(\d{1,2})$/.exec(s0);
  if (m) {
    const h = parseInt(m[1], 10);
    return h <= 23 ? pad(h) + ':00' : null;
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** '0800' -> { h: 8, m: 0 } */
export function hhmmToTuple(v: string): { h: number; m: number } {
  const norm = normalizeTimeLoose(v) ?? '08:00';
  const [h, m] = norm.split(':');
  return { h: parseInt(h, 10), m: parseInt(m, 10) };
}

/** Round minutes to nearest step (default 5). */
export function snapStep(mins: number, step = 5): number {
  return Math.round(mins / step) * step;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Clamp tuple into 0..23 h / 0..55 m (5-min grid for wheel). */
export function clampTuple(t: { h: number; m: number }): { h: number; m: number } {
  const h = clamp(t.h, 0, 23);
  const m = clamp(Math.round(t.m / 5) * 5, 0, 55);
  return { h, m };
}

// ---------- Overlap / conflicts ----------

/**
 * Overlap check between two [start, end] minute ranges:
 * max(startA, startB) < min(endA, endB)
 */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

export interface Conflict {
  day: Day;
  sessionA: Session;
  sessionB: Session;
}

/** All session conflicts between two courses (same day + overlapping time). */
export function courseConflicts(a: Course, b: Course): Conflict[] {
  const out: Conflict[] = [];
  for (const sa of a.sessions) {
    for (const sb of b.sessions) {
      if (sa.day !== sb.day) continue;
      const as = timeToMinutes(sa.start);
      const ae = timeToMinutes(sa.end);
      const bs = timeToMinutes(sb.start);
      const be = timeToMinutes(sb.end);
      if (as == null || ae == null || bs == null || be == null) continue;
      if (overlaps(as, ae, bs, be)) out.push({ day: sa.day, sessionA: sa, sessionB: sb });
    }
  }
  return out;
}

export interface ConflictError {
  day: Day;
  timeRange: string; // localized range
  otherCourse: Course;
}

/**
 * Find the first conflict between candidate sessions and all other courses.
 * `excludeId` is the course being edited (skip itself).
 */
export function findConflicts(
  candidateSessions: Session[],
  courses: Course[],
  excludeId: number | null
): ConflictError | null {
  for (const cs of candidateSessions) {
    const csStart = timeToMinutes(cs.start);
    const csEnd = timeToMinutes(cs.end);
    if (csStart == null || csEnd == null) continue;
    for (const other of courses) {
      if (excludeId != null && other.id === excludeId) continue;
      for (const os of other.sessions) {
        if (os.day !== cs.day) continue;
        const osStart = timeToMinutes(os.start);
        const osEnd = timeToMinutes(os.end);
        if (osStart == null || osEnd == null) continue;
        if (overlaps(csStart, csEnd, osStart, osEnd)) {
          return {
            day: cs.day,
            timeRange: os.start + '–' + os.end,
            otherCourse: other,
          };
        }
      }
    }
  }
  return null;
}

// ---------- Colors ----------

function hashString(s: string): number {
  let h = 2166136261; // FNV-1a 32-bit
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic unique color from a string (same input -> same color).
 * Hue from hash, fixed saturation/lightness tuned for both themes.
 */
export function colorFromString(s: string, lTheme: 'dark' | 'light' = 'dark'): string {
  const hue = hashString(s || 'course') % 360;
  const sat = 62;
  const lig = lTheme === 'dark' ? 62 : 38;
  return hslToHex(hue, sat, lig);
}

/** Curated swatch set for manual course colors (readable on both themes). */
export const COURSE_SWATCHES = [
  '#22D3EE', // cyan
  '#818CF8', // indigo
  '#F472B6', // pink
  '#34D399', // emerald
  '#FBBF24', // amber
  '#FB7185', // rose
  '#A78BFA', // violet
  '#4ADE80', // green
  '#F97316', // orange
  '#38BDF8', // sky
  '#E879F9', // fuchsia
  '#2DD4BF', // teal
];

export function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
  const to255 = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0');
  return '#' + to255(f(0)) + to255(f(8)) + to255(f(4));
}

export function courseColor(c: Course, theme: 'dark' | 'light' = 'dark'): string {
  if (c.color && isHexColor(c.color)) return c.color;
  return colorFromString(c.code + '|' + c.name, theme);
}

// ---------- Jalali calendar (jalaali-js package — verified correct) ----------
import * as jalaali from 'jalaali-js';

/** Gregorian -> Jalali. */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  return [jy, jm, jd];
}

/** Jalali -> Gregorian. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return [gy, gm, gd];
}

export function isJalaliLeap(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

export const WEEKDAY_NAMES_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/** Gregorian Date -> Persian weekday name. */
export function gregorianToJalaliWeekday(d: Date): string {
  return WEEKDAY_NAMES_FA[(d.getDay() + 1) % 7];
}

export function jalaliIsValid(jy: number, jm: number, jd: number): boolean {
  if (jy < 1300 || jy > 1500) return false;
  if (jm < 1 || jm > 12) return false;
  if (jd < 1) return false;
  return jd <= jalaliMonthLength(jy, jm);
}

/** Today in Jalali as {jy, jm, jd} (device local time). */
export function todayJalali(): { jy: number; jm: number; jd: number } {
  const n = new Date();
  const [jy, jm, jd] = gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  return { jy, jm, jd };
}

/** 'YYYY/MM/DD' (Jalali, Persian digits) from parts. */
export function formatJalali(jy: number, jm: number, jd: number): string {
  return toPersianDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

// ---------- Sessions / schedule helpers ----------

export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => {
    if (a.day !== b.day) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    const as = timeToMinutes(a.start) ?? 0;
    const bs = timeToMinutes(b.start) ?? 0;
    return as - bs;
  });
}

export function sessionsOfDay(courses: Course[], day: Day): { course: Course; session: Session }[] {
  const out: { course: Course; session: Session }[] = [];
  for (const c of courses) {
    for (const s of c.sessions) {
      if (s.day === day) out.push({ course: c, session: s });
    }
  }
  out.sort((a, b) => (timeToMinutes(a.session.start) ?? 0) - (timeToMinutes(b.session.start) ?? 0));
  return out;
}

export function totalUnits(courses: Course[]): number {
  return courses.reduce((acc, c) => acc + (Number(c.units) || 0), 0);
}

/** Weekly class hours (sum of session durations). */
export function weeklyHours(courses: Course[]): number {
  let mins = 0;
  for (const c of courses) {
    for (const s of c.sessions) {
      const a = timeToMinutes(s.start);
      const b = timeToMinutes(s.end);
      if (a != null && b != null && b > a) mins += b - a;
    }
  }
  return Math.round((mins / 60) * 10) / 10;
}

// ---------- IDs / validation / misc ----------

export function nextId(courses: Course[]): number {
  let max = 0;
  for (const c of courses) if (c.id > max) max = c.id;
  return max + 1;
}

export interface FormErrors {
  name?: string;
  code?: string;
  units?: string;
  sessions?: string;
  conflict?: string;
}

/** Pure validation of the course form before save. */
export function validateCourse(
  draft: Omit<Course, 'id'> & { id?: number },
  courses: Course[]
): FormErrors {
  const errors: FormErrors = {};
  if (!draft.name || !draft.name.trim()) errors.name = 'نام درس را وارد کنید';
  if (!draft.code || !draft.code.trim()) errors.code = 'کد درس را وارد کنید';
  if (!draft.units || draft.units <= 0) errors.units = 'تعداد واحد را وارد کنید';
  const sessions = draft.sessions.filter((s) => s.day && s.start && s.end);
  if (sessions.length === 0) errors.sessions = 'حداقل یک جلسه کلاس اضافه کنید';
  // Per-session checks
  for (const s of draft.sessions) {
    if (!s.start || !s.end) {
      errors.sessions = 'زمان شروع و پایان همه جلسات را مشخص کنید';
      break;
    }
    const ss = timeToMinutes(s.start);
    const se = timeToMinutes(s.end);
    if (ss == null || se == null) {
      errors.sessions = 'قالب زمان معتبر نیست';
      break;
    }
    if (se <= ss) {
      errors.sessions = 'زمان پایان باید بعد از زمان شروع باشد';
      break;
    }
  }
  if (!errors.sessions) {
    const conflict = findConflicts(draft.sessions, courses, draft.id ?? null);
    if (conflict) {
      errors.conflict = `تداخل زمانی با درس «${conflict.otherCourse.name}» در ${conflict.day} (ساعت ${toPersianDigits(
        conflict.timeRange
      )})`;
    }
  }
  return errors;
}

/** Timestamped export filenames: backup_1404-06-21_18-45.json */
export function backupFileName(ext: string): string {
  const t = todayJalali();
  const n = new Date();
  const hh = pad(n.getHours());
  const mm = pad(n.getMinutes());
  return `backup_${t.jy}-${pad(t.jm)}-${pad(t.jd)}_${hh}-${mm}.${ext}`;
}

// ---------- Import validation ----------

/** Minimal structural validation for restore-from-JSON. */
export function validateImported(data: unknown): Course[] {
  if (!Array.isArray(data)) throw new Error('ساختار فایل معتبر نیست (باید آرایه باشد)');
  const out: Course[] = [];
  data.forEach((item, i) => {
    if (item == null || typeof item !== 'object') {
      throw new Error(`آیتم ${i + 1} نامعتبر است`);
    }
    const c = item as Record<string, unknown>;
    if (c.id == null || typeof c.name !== 'string' || !Array.isArray(c.sessions)) {
      throw new Error(`آیتم ${i + 1} فیلدهای الزامی (id، name، sessions) را ندارد`);
    }
    const sessions: Session[] = (c.sessions as unknown[]).map((s) => {
      const so = (s ?? {}) as Record<string, unknown>;
      return {
        day: (DAYS as string[]).includes(String(so.day)) ? (so.day as Day) : DAYS[0],
        start: String(so.start ?? '08:00'),
        end: String(so.end ?? '10:00'),
      };
    });
    out.push({
      id: Number(c.id) || i + 1,
      code: String(c.code ?? ''),
      name: String(c.name ?? ''),
      professor: String(c.professor ?? ''),
      units: Number(c.units) || 0,
      exam_date: typeof c.exam_date === 'string' ? c.exam_date : null,
      exam_time: typeof c.exam_time === 'string' ? c.exam_time : null,
      sessions,
      color: typeof c.color === 'string' && isHexColor(c.color) ? c.color : undefined,
    });
  });
  return out;
}
