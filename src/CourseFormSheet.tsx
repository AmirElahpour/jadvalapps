/**
 * Add/Edit course bottom sheet — form, sessions editor, exam picker, validation.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from './themeContext';
import { ModalSheet, Field, PrimaryButton, GhostButton } from './components';
import { JalaliDatePicker2 as JalaliDatePicker, TimePicker2 as TimePicker } from './pickers';
import {
  Course,
  Day,
  DAYS,
  toPersianDigits,
  parsePositiveInt,
  validateCourse,
  FormErrors,
  todayJalali,
  hhmmToTuple,
  minutesToHHmm,
  COURSE_SWATCHES,
  colorFromString,
  isHexColor,
} from './logic';
import { IconPlus, IconTrash, IconAlert, IconCalendar, IconClock, IconLayers, IconChevronDown as IconChevronDownNative } from './icons';

export interface CourseFormResult {
  draft: Omit<Course, 'id'>;
}

interface Props {
  visible: boolean;
  editing: Course | null;
  courses: Course[];
  unitsCap: number;
  onClose: () => void;
  onSave: (draft: Omit<Course, 'id'>) => void;
  onCancelEdit: () => void;
  toast?: (message: string, kind?: 'success' | 'error' | 'info') => void;
}

interface DraftState {
  code: string;
  name: string;
  professor: string;
  units: string;
  color: string | null; // null = auto (hash from code|name)
  hasExam: boolean;
  exam: { jy: number; jm: number; jd: number };
  examTime: { h: number; m: number };
  sessions: { day: Day; h1: number; m1: number; h2: number; m2: number; touched?: boolean }[];
}

function freshDraft(): DraftState {
  const t = todayJalali();
  return {
    code: '',
    name: '',
    professor: '',
    units: '',
    color: null,
    hasExam: false,
    exam: { jy: t.jy, jm: t.jm, jd: t.jd },
    examTime: { h: 10, m: 0 },
    sessions: [{ day: 'شنبه', h1: 8, m1: 0, h2: 10, m2: 0 }],
  };
}

function draftFromCourse(c: Course): DraftState {
  const d = freshDraft();
  d.code = c.code;
  d.name = c.name;
  d.professor = c.professor;
  d.units = c.units ? String(c.units) : '';
  d.color = c.color && isHexColor(c.color) ? c.color : null;
  d.hasExam = !!c.exam_date;
  if (c.exam_date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.exam_date);
    if (m) d.exam = { jy: +m[1], jm: +m[2], jd: +m[3] };
  }
  if (c.exam_time) {
    const t = hhmmToTuple(c.exam_time);
    d.examTime = t;
  }
  d.sessions = (c.sessions.length ? c.sessions : [{ day: 'شنبه' as Day, start: '08:00', end: '10:00' }]).map(
    (s) => {
      const a = hhmmToTuple(s.start);
      const b = hhmmToTuple(s.end);
      return { day: s.day, h1: a.h, m1: a.m, h2: b.h, m2: b.m };
    }
  );
  return d;
}

const sessionStyles = StyleSheet.create({
  sessionCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10, gap: 10 },
  sessionHead: { flexDirection: 'row', alignItems: 'center' },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dayChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  removeBtn: { padding: 6 },
  rangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  timeIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickersWrap: { gap: 8 },
  pickerLabel: { fontSize: 12, textAlign: 'right' },
});

function SessionEditor({
  index,
  session,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  session: DraftState['sessions'][0];
  onChange: (s: DraftState['sessions'][0]) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { p, font, radius } = useTheme();
  const [open, setOpen] = useState(index === 0 && !session.touched);
  return (
    <View style={[sessionStyles.sessionCard, { backgroundColor: p.surfaceAlt, borderColor: p.border }]}>
      <View style={sessionStyles.sessionHead}>
        <Text style={{ fontFamily: font.bold, fontSize: 12, color: p.textFaint }}>
          جلسه {toPersianDigits(index + 1)}
        </Text>
        <View style={{ flex: 1 }} />
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            style={[sessionStyles.removeBtn, { backgroundColor: p.danger + '1A', borderRadius: 10 }]}
          >
            <IconTrash size={15} color={p.danger} />
          </Pressable>
        ) : null}
      </View>
      <View style={sessionStyles.dayChips}>
        {DAYS.map((d) => {
          const on = session.day === d;
          return (
            <Pressable
              key={d}
              onPress={() => onChange({ ...session, day: d, touched: true })}
              style={[
                sessionStyles.dayChip,
                {
                  backgroundColor: on ? p.primary : p.surface,
                  borderColor: on ? p.primary : p.border,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: on ? font.bold : font.regular,
                  fontSize: 11,
                  color: on ? p.primaryText : p.textDim,
                }}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => setOpen((v) => !v)} style={sessionStyles.rangeBtn}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[sessionStyles.timeIcon, { backgroundColor: p.chipBg }]}>
            <IconClock size={14} color={p.primary} />
          </View>
          <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.text }}>
            {toPersianDigits(pad2(session.h1) + ':' + pad2(session.m1))} تا{' '}
            {toPersianDigits(pad2(session.h2) + ':' + pad2(session.m2))}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <IconChevronDownNative size={16} color={p.textFaint} />
        </View>
      </Pressable>
      {open ? (
        <View style={sessionStyles.pickersWrap}>
          <Text style={[sessionStyles.pickerLabel, { color: p.textDim, fontFamily: font.medium }]}>از ساعت</Text>
          <TimePicker
            hour={session.h1}
            minute={session.m1}
            onChange={(h, m) => onChange({ ...session, h1: h, m1: m, touched: true })}
          />
          <Text style={[sessionStyles.pickerLabel, { color: p.textDim, fontFamily: font.medium }]}>تا ساعت</Text>
          <TimePicker
            hour={session.h2}
            minute={session.m2}
            onChange={(h, m) => onChange({ ...session, h2: h, m2: m, touched: true })}
          />
        </View>
      ) : null}
    </View>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ColorRow({ draft, setS }: { draft: DraftState; setS: (p: Partial<DraftState>) => void }) {
  const { p, font } = useTheme();
  // Live preview: manual pick wins, otherwise the auto hash of current code|name.
  const auto = colorFromString((draft.code.trim() || '?') + '|' + (draft.name.trim() || '?'));
  const active = draft.color ?? auto;
  return (
    <View style={[formStyles.examCard, { borderColor: p.borderSoft, backgroundColor: p.surfaceAlt }]}>
      <View style={formStyles.examRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[formStyles.sectionIcon, { backgroundColor: active + '26' }]}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: active }} />
          </View>
          <Text style={{ fontFamily: font.medium, color: p.text, fontSize: 14 }}>رنگ درس</Text>
        </View>
        <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textFaint }}>
          {draft.color ? 'انتخاب دستی' : 'خودکار'}
        </Text>
      </View>
      <View style={formStyles.swatchRow}>
        {/* Auto swatch first: shows the live hash color, ring when active */}
        <Pressable
          onPress={() => setS({ color: null })}
          accessibilityLabel="رنگ خودکار"
          style={[
            formStyles.swatch,
            {
              backgroundColor: auto,
              borderColor: draft.color == null ? p.text : 'transparent',
              borderWidth: draft.color == null ? 2.5 : 0,
            },
          ]}
        >
          {draft.color == null ? (
            <Text style={{ fontFamily: font.black, fontSize: 13, color: '#FFFFFF' }}>خ</Text>
          ) : null}
        </Pressable>
        {COURSE_SWATCHES.map((c) => {
          const on = draft.color === c;
          return (
            <Pressable
              key={c}
              onPress={() => setS({ color: on ? null : c })}
              accessibilityLabel={'رنگ ' + c}
              style={[
                formStyles.swatch,
                {
                  backgroundColor: c,
                  borderColor: on ? p.text : 'transparent',
                  borderWidth: on ? 2.5 : 0,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}


function CourseFormSheetInner({
  visible,
  editing,
  courses,
  unitsCap,
  onClose,
  onSave,
  onCancelEdit,
  toast,
}: Props) {
  const { p, font, radius } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState<DraftState>(freshDraft);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showExamDate, setShowExamDate] = useState(false);
  const [showExamTime, setShowExamTime] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-seed the draft when the sheet opens (fresh or from the course being edited)
  useEffect(() => {
    if (visible) {
      setDraft(editing ? draftFromCourse(editing) : freshDraft());
      setErrors({});
      setBusy(false);
    }
  }, [visible, editing]);

  const setS = (patch: Partial<DraftState>) => setDraft((d) => ({ ...d, ...patch }));

  const buildCourseDraft = (): Omit<Course, 'id'> => ({
    code: draft.code.trim(),
    name: draft.name.trim(),
    professor: draft.professor.trim(),
    units: parsePositiveInt(draft.units, 0),
    color: draft.color ?? undefined,
    exam_date: draft.hasExam
      ? `${draft.exam.jy}-${String(draft.exam.jm).padStart(2, '0')}-${String(draft.exam.jd).padStart(2, '0')}`
      : null,
    exam_time: draft.hasExam ? minutesToHHmm(draft.examTime.h * 60 + draft.examTime.m) : null,
    sessions: draft.sessions.map((s) => ({
      day: s.day,
      start: minutesToHHmm(s.h1 * 60 + s.m1),
      end: minutesToHHmm(s.h2 * 60 + s.m2),
    })),
  });

  const handleSave = () => {
    const courseDraft = buildCourseDraft();
    // Pass the editing id so conflict detection skips the course itself.
    const errs = validateCourse(editing ? { ...courseDraft, id: editing.id } : courseDraft, courses);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      const missing: string[] = [];
      if (errs.name) missing.push('نام درس');
      if (errs.code) missing.push('کد درس');
      if (errs.units) missing.push('تعداد واحد');
      if (missing.length > 0) {
        toast?.(
          missing.length === 1
            ? `لطفاً ${missing[0]} را وارد کنید`
            : `لطفاً فیلدهای الزامی (${missing.join('، ')}) را کامل کنید`,
          'error'
        );
      } else if (errs.sessions) {
        toast?.(errs.sessions, 'error');
      } else if (errs.conflict) {
        toast?.('تداخل زمانی با درس دیگری وجود دارد', 'error');
      }
      return;
    }
    setBusy(true);
    // Small delay so the button fill animation is visible
    setTimeout(() => {
      onSave(courseDraft);
      setBusy(false);
      onClose();
    }, 350);
  };

  const unitCount = parsePositiveInt(draft.units, 0);
  const editingOtherCourses = editing ? courses.filter((c) => c.id !== editing.id) : courses;
  const totalUnitsIfSaved =
    editingOtherCourses.reduce((a, c) => a + (Number(c.units) || 0), 0) + unitCount;

  const addSession = () =>
    setDraft((d) => ({
      ...d,
      sessions: [...d.sessions, { day: 'شنبه', h1: 10, m1: 0, h2: 12, m2: 0 }],
    }));

  const missingFields: string[] = [];
  if (errors.name) missingFields.push('نام درس');
  if (errors.code) missingFields.push('کد درس');
  if (errors.units) missingFields.push('تعداد واحد');
  const hasRequiredErrors = missingFields.length > 0;

  return (
    <ModalSheet visible={visible} onClose={onClose} title={editing ? 'ویرایش درس' : 'افزودن درس'} full>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <Field
          label="نام درس"
          value={draft.name}
          onChangeText={(t) => {
            setS({ name: t });
            if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
          }}
          placeholder="مثلاً ریاضی عمومی ۱"
          error={errors.name}
          required
          autoFocus={false}
        />
        <Field
          label="کد درس"
          value={draft.code}
          onChangeText={(t) => {
            setS({ code: t });
            if (errors.code) setErrors((e) => ({ ...e, code: undefined }));
          }}
          placeholder="مثلاً 60123452"
          error={errors.code}
          required
          numeric
        />
        <Field
          label="استاد"
          value={draft.professor}
          onChangeText={(t) => setS({ professor: t })}
          placeholder="مثلاً دکتر احمدی"
          optional
        />
        <Field
          label="تعداد واحد"
          value={draft.units}
          onChangeText={(t) => {
            setS({ units: t });
            if (errors.units) setErrors((e) => ({ ...e, units: undefined }));
          }}
          placeholder="مثلاً 3"
          error={errors.units}
          required
          numeric
        />

        {/* ---- Color ---- */}
        <ColorRow draft={draft} setS={setS} />

        {/* ---- Exam ---- */}
        <View style={[formStyles.examCard, { borderColor: p.borderSoft, backgroundColor: p.surfaceAlt }]}>
          <View style={formStyles.examRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[formStyles.sectionIcon, { backgroundColor: p.chipBg }]}>
                <IconCalendar size={15} color={p.primary} />
              </View>
              <Text style={{ fontFamily: font.medium, color: p.text, fontSize: 14 }}>
                این درس آزمون دارد
              </Text>
            </View>
            <Switch
              value={draft.hasExam}
              onValueChange={(v) => setS({ hasExam: v })}
              trackColor={{ false: p.border, true: p.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {draft.hasExam ? (
            <View style={formStyles.examPickers}>
              <Pressable
                onPress={() => { setShowExamDate((v) => !v); setShowExamTime(false); }}
                style={[formStyles.examBtn, { borderColor: showExamDate ? p.primary : p.border, backgroundColor: p.surface }]}
              >
                <IconCalendar size={15} color={p.primary} />
                <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.text, marginStart: 8 }}>
                  {toPersianDigits(draft.exam.jy + '/' + String(draft.exam.jm).padStart(2, '0') + '/' + String(draft.exam.jd).padStart(2, '0'))}
                </Text>
                <View style={{ flex: 1 }} />
                <IconChevronDownNative size={15} color={p.textFaint} />
              </Pressable>
              {showExamDate ? (
                <JalaliDatePicker value={draft.exam} onChange={(v) => setS({ exam: v })} />
              ) : null}
              <Pressable
                onPress={() => { setShowExamTime((v) => !v); setShowExamDate(false); }}
                style={[formStyles.examBtn, { borderColor: showExamTime ? p.primary : p.border, backgroundColor: p.surface }]}
              >
                <IconClock size={15} color={p.primary} />
                <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.text, marginStart: 8 }}>
                  {toPersianDigits(String(draft.examTime.h).padStart(2, '0') + ':' + String(draft.examTime.m).padStart(2, '0'))}
                </Text>
                <View style={{ flex: 1 }} />
                <IconChevronDownNative size={15} color={p.textFaint} />
              </Pressable>
              {showExamTime ? (
                <TimePicker
                  hour={draft.examTime.h}
                  minute={draft.examTime.m}
                  onChange={(h, m) => setS({ examTime: { h, m } })}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ---- Sessions ---- */}
        <View style={formStyles.sectionHead}>
          <View style={[formStyles.sectionIcon, { backgroundColor: p.chipBg }]}>
            <IconLayers size={15} color={p.primary} />
          </View>
          <Text style={[formStyles.sectionTitle, { fontFamily: font.bold, color: p.text }]}>
            جلسات کلاس
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textFaint }}>
            {toPersianDigits(draft.sessions.length)} جلسه
          </Text>
        </View>
        {draft.sessions.map((s, i) => (
          <SessionEditor
            key={i}
            index={i}
            session={s}
            canRemove={draft.sessions.length > 1}
            onChange={(ns) =>
              setDraft((d) => ({ ...d, sessions: d.sessions.map((x, j) => (j === i ? ns : x)) }))
            }
            onRemove={() =>
              setDraft((d) => ({ ...d, sessions: d.sessions.filter((_x, j) => j !== i) }))
            }
          />
        ))}
        {/* Dashed outline via border; solid fill behind it */}
        <Pressable
          onPress={addSession}
          style={({ pressed }) => [formStyles.addSessionBtn, { borderColor: p.primary + '66', backgroundColor: p.chipBg, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={[formStyles.sectionIcon, { backgroundColor: p.primary + '2E' }]}>
            <IconPlus size={15} color={p.primary} />
          </View>
          <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.primary, marginStart: 10 }}>
            افزودن جلسه
          </Text>
        </Pressable>

        {/* ---- Units cap hint ---- */}
        {unitsCap > 0 && totalUnitsIfSaved > unitsCap ? (
          <View style={[formStyles.capWarn, { backgroundColor: p.chipBg, borderColor: p.warning }]}>
            <IconAlert size={16} color={p.warning} />
            <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.warning, flex: 1 }}>
              مجموع واحدها پس از ذخیره: {toPersianDigits(totalUnitsIfSaved)} (سقف: {toPersianDigits(unitsCap)})
            </Text>
          </View>
        ) : null}

        {errors.conflict ? (
          <View style={[formStyles.capWarn, { backgroundColor: p.chipBg, borderColor: p.danger }]}>
            <IconAlert size={16} color={p.danger} />
            <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.danger, flex: 1 }}>
              {errors.conflict}
            </Text>
          </View>
        ) : null}
        {errors.sessions ? (
          <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.danger, textAlign: 'right', marginTop: 6 }}>
            {errors.sessions}
          </Text>
        ) : null}
      </ScrollView>

      {/* ---- Footer actions ---- */}
      <View style={formStyles.footer}>
        {hasRequiredErrors ? (
          <View
            style={[
              formStyles.validationAlert,
              { backgroundColor: p.danger + '18', borderColor: p.danger },
            ]}
          >
            <IconAlert size={16} color={p.danger} />
            <Text
              style={{
                fontFamily: font.bold,
                fontSize: 12.5,
                color: p.danger,
                flex: 1,
                textAlign: 'right',
              }}
            >
              {missingFields.length === 1
                ? `لطفاً ${missingFields[0]} را وارد کنید`
                : `لطفاً فیلدهای الزامی (${missingFields.join('، ')}) را کامل کنید`}
            </Text>
          </View>
        ) : null}
        {editing ? (
          <GhostButton label="انصراف از ویرایش" onPress={onCancelEdit} />
        ) : null}
        <PrimaryButton
          label={editing ? 'ذخیره تغییرات' : 'ذخیره درس'}
          onPress={handleSave}
          busy={busy}
        />
      </View>
    </ModalSheet>
  );
}

const formStyles = StyleSheet.create({
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  examCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
    gap: 10,
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examPickers: { gap: 8 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  examBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, textAlign: 'right' },
  capWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  footer: { gap: 8, paddingTop: 8 },
  validationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 4,
  },
  addSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 2,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});

function CourseFormSheet(props: Props) {
  return <CourseFormSheetInner {...props} />;
}

export { CourseFormSheet, SessionEditor };
