const logic = await import('./src/logic.ts');
let fails = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log('FAIL', name, '| got:', JSON.stringify(got), '| want:', JSON.stringify(want)); }
  else console.log('ok  ', name);
}
// digits
eq('toEnglishDigits fa', logic.toEnglishDigits('۱۲۳'), '123');
eq('toEnglishDigits ar', logic.toEnglishDigits('٤٥'), '45');
eq('toPersianDigits', logic.toPersianDigits('12:30'), '۱۲:۳۰');
// time
eq('timeToMinutes', logic.timeToMinutes('08:30'), 510);
eq('timeToMinutes fa', logic.timeToMinutes('۰۸:۳۰'), 510);
eq('timeToMinutes invalid', logic.timeToMinutes('25:00'), null);
eq('normalize 8', logic.normalizeTimeLoose('8'), '08:00');
eq('normalize 8.5', logic.normalizeTimeLoose('8.5'), '08:30');
eq('normalize 0800', logic.normalizeTimeLoose('0800'), '08:00');
eq('normalize 14:30', logic.normalizeTimeLoose('14:30'), '14:30');
eq('normalize ۸:۵', logic.normalizeTimeLoose('۸:۵'), '08:50');
// overlap
eq('overlap yes', logic.overlaps(480, 600, 540, 660), true);
eq('overlap no', logic.overlaps(480, 600, 600, 660), false);
eq('overlap edge', logic.overlaps(480, 600, 600, 700), false);
// jalali
eq('g2j 2026-03-21', logic.gregorianToJalali(2026, 3, 21), [1405, 1, 1]);
eq('j2g 1405-01-01', logic.jalaliToGregorian(1405, 1, 1), [2026, 3, 21]);
eq('g2j 2026-09-12', logic.gregorianToJalali(2026, 9, 12), [1405, 6, 21]);
eq('esfand length leap 1403', logic.jalaliMonthLength(1403, 12), 30);
eq('esfand length 1404 normal', logic.jalaliMonthLength(1404, 12), 29);
eq('esfand length normal', logic.jalaliMonthLength(1405, 12), 29);
// colors
eq('color deterministic', logic.colorFromString('ریاضی|MA101'), logic.colorFromString('ریاضی|MA101'));
console.log('color sample:', logic.colorFromString('فیزیک|PH201'), logic.colorFromString('ادبیات|FA101'));
const c1 = logic.colorFromString('a|a'); const c2 = logic.colorFromString('b|b');
console.log('two colors differ:', c1 !== c2);
// conflicts
const courses = [
  { id: 1, code: 'A1', name: 'ریاضی', professor: 'x', units: 3, exam_date: null, exam_time: null,
    sessions: [{ day: 'شنبه', start: '08:00', end: '10:00' }] },
  { id: 2, code: 'B2', name: 'فیزیک', professor: 'y', units: 3, exam_date: null, exam_time: null,
    sessions: [{ day: 'شنبه', start: '09:30', end: '11:00' }] },
];
const conf = logic.findConflicts([{ day: 'شنبه', start: '09:00', end: '11:00' }], courses, null);
eq('conflict found', conf?.otherCourse.name, 'ریاضی');
eq('conflict excludes self only', logic.findConflicts([{ day: 'شنبه', start: '09:00', end: '11:00' }], courses, 1)?.otherCourse.name, 'فیزیک');
eq('no self-conflict when editing same course', logic.findConflicts([{ day: 'شنبه', start: '11:00', end: '13:00' }], courses, 1), null);
eq('no conflict other day', logic.findConflicts([{ day: 'یکشنبه', start: '09:00', end: '11:00' }], courses, null), null);
// backup filename
console.log('backup name:', logic.backupFileName('json'));
// validateImported
try {
  logic.validateImported([{ id: 1, name: 'x', sessions: [] }, { nope: true }]);
  fails++; console.log('FAIL import should throw');
} catch (e) { console.log('ok   import throws on bad item'); }
const okImport = logic.validateImported([{ id: 1, name: 'x', sessions: [{ day: 'شنبه', start: '8', end: '9' }] }]);
eq('import lenient', okImport.length, 1);
console.log(fails === 0 ? 'ALL_LOGIC_PASS' : 'FAILURES=' + fails);
