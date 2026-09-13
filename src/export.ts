/**
 * Export helpers: PNG capture, PDF generation, JSON backup, share links.
 * Handles Android file-save permission fallbacks via the share sheet.
 */
import { View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';
import {
  deflateSync,
  inflateSync,
  strToU8,
  strFromU8,
} from 'fflate';
import { Course, backupFileName, validateImported } from './logic';

// ---------- JSON backup ----------

export function buildBackupJSON(courses: Course[]): string {
  const payload = {
    app: 'jadvalapps',
    backup_version: 1,
    exported_at: new Date().toISOString(),
    courses,
  };
  return JSON.stringify(payload, null, 2);
}

/** Parse backup text: accepts {courses:[...]} or a bare array. Throws Persian error. */
export function parseBackup(text: string): Course[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('فایل JSON معتبر نیست');
  }
  const arr = Array.isArray(parsed) ? parsed : (parsed as { courses?: unknown })?.courses;
  if (!Array.isArray(arr)) throw new Error('ساختار فایل پشتیبان معتبر نیست');
  return validateImported(arr);
}

// ---------- PNG capture ----------

export async function captureViewToPng(viewRef: React.RefObject<View | null>): Promise<string | null> {
  try {
    const uri = await captureRef(viewRef.current, {
      format: 'png',
      quality: 1,
      width: 1080,
      result: 'tmpfile',
    });
    return uri ?? null;
  } catch (e) {
    console.warn('capture failed', e);
    return null;
  }
}

// ---------- File save with share-sheet fallback ----------

export function guessMime(fileName: string): string {
  if (fileName.endsWith('.json')) return 'application/json';
  if (fileName.endsWith('.pdf')) return 'application/pdf';
  if (fileName.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

export async function saveOrShareFile(
  uri: string,
  fileName: string
): Promise<'shared' | 'cancelled'> {
  try {
    await Sharing.shareAsync(uri, { mimeType: guessMime(fileName), dialogTitle: fileName });
    return 'shared';
  } catch {
    return 'cancelled';
  }
}

// ---------- PDF ----------

export interface PdfInput {
  courses: Course[];
  title: string;
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildCourseTableHtml(courses: Course[]): string {
  const rows = courses
    .map((c) => {
      const badges = c.sessions
        .map(
          (s) =>
            `<span class="badge">${s.day} ${toFa(s.start)}–${toFa(s.end)}</span>`
        )
        .join(' ');
      const exam = c.exam_date
        ? `${toFa(c.exam_date)}${c.exam_time ? ' - ' + toFa(c.exam_time) : ''}`
        : 'ندارد';
      return `<tr>
        <td>${esc(c.name)}</td>
        <td>${esc(toFa(c.code))}</td>
        <td>${esc(c.professor || '-')}</td>
        <td>${toFa(String(c.units))}</td>
        <td class="badges">${badges}</td>
        <td>${exam}</td>
      </tr>`;
    })
    .join('');
  return rows;
}

function toFa(s: string): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return String(s).replace(/[0-9]/g, (d) => fa[Number(d)]);
}

export async function exportPdf(courses: Course[]): Promise<{ uri: string } | null> {
  const rows = buildCourseTableHtml(courses);
  const totalUnits = courses.reduce((a, c) => a + (Number(c.units) || 0), 0);
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Vazirmatn', sans-serif; padding: 24px; color: #111C33; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .sub { color: #5A6B8F; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #DCE4F5; padding: 7px 8px; text-align: right; vertical-align: top; }
  th { background: #EDF1FA; font-weight: 700; font-size: 11px; }
  .badges { max-width: 220px; }
  .badge { display: inline-block; background: #E6EDF9; border-radius: 999px; padding: 2px 8px; margin: 1px; font-size: 10px; white-space: nowrap; }
  tfoot td { background: #F5F7FC; font-weight: 700; }
</style>
</head>
<body>
  <h1>برنامه هفتگی کلاس‌ها</h1>
  <div class="sub">خروجی PDF - JadvalApps - ${toFa(new Date().toLocaleDateString('fa-IR'))}</div>
  <table>
    <thead>
      <tr><th>درس</th><th>کد</th><th>استاد</th><th>واحد</th><th>جلسات</th><th>آزمون</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">مجموع دروس: ${toFa(String(courses.length))}</td><td colspan="3">مجموع واحدها: ${toFa(String(totalUnits))}</td></tr></tfoot>
  </table>
</body>
</html>`;
  try {
    const { uri } = await Print.printToFileAsync({ html });
    return { uri };
  } catch (e) {
    console.warn('pdf failed', e);
    return null;
  }
}

// ---------- Share link ----------

export interface ShareLinkResult {
  url: string;
  short: boolean;
}

/**
 * Build a share link carrying compressed course data.
 * Tries a short-link service; falls back to the direct compressed-data URL.
 */
export async function buildShareLink(courses: Course[]): Promise<ShareLinkResult> {
  const json = JSON.stringify(courses);
  const packed = packData(json);
  const direct = `https://jadvalapps.app/s#${packed}`;
  try {
    const res = await fetch('https://spoo.me/shortener', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'url=' + encodeURIComponent(direct),
    });
    if (!res.ok) throw new Error('shortener ' + res.status);
    const data = (await res.json()) as { short_url?: string };
    if (data?.short_url) return { url: data.short_url, short: true };
    throw new Error('no short_url');
  } catch {
    return { url: direct, short: false };
  }
}

export function parseShareLinkHash(hash: string): Course[] | null {
  try {
    const packed = hash.replace(/^#/, '');
    if (!packed) return null;
    const json = unpackData(packed);
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return null;
    return validateImported(arr);
  } catch {
    return null;
  }
}

// ---------- Compression (fflate) + base64url for share links ----------

export function packData(json: string): string {
  const compressed = deflateSync(strToU8(json), { level: 6 });
  return base64UrlEncode(compressed);
}

export function unpackData(packed: string): string {
  const bytes = base64UrlDecode(packed);
  return strFromU8(inflateSync(bytes));
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)) as number[]);
  }
  const b64 = btoaPolyfill(s);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atobPolyfill(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- btoa/atob polyfills (pure JS, work in RN/Hermes) ----------

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function btoaPolyfill(bin: string): string {
  let out = '';
  for (let i = 0; i < bin.length; i += 3) {
    const b0 = bin.charCodeAt(i);
    const b1 = i + 1 < bin.length ? bin.charCodeAt(i + 1) : 0;
    const b2 = i + 2 < bin.length ? bin.charCodeAt(i + 2) : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bin.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bin.length ? B64_CHARS[b2 & 63] : '=';
  }
  return out;
}

function atobPolyfill(b64: string): string {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  let out = '';
  let bits = 0;
  let acc = 0;
  for (let i = 0; i < clean.length; i++) {
    acc = (acc << 6) | B64_CHARS.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((acc >> bits) & 0xff);
    }
  }
  return out;
}
