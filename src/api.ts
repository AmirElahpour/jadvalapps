/**
 * Backup JSON build/parse for JadvalApps.
 */
import { Course, backupFileName, validateImported } from './logic';

export { backupFileName, validateImported };

export function buildBackupJSON(courses: Course[]): string {
  const payload = {
    app: 'jadvalapps',
    backup_version: 1,
    exported_at: new Date().toISOString(),
    courses,
  };
  return JSON.stringify(payload, null, 2);
}

/** Parse backup text: accepts {courses:[...]} or a bare array. Throws Persian error on bad shape. */
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
