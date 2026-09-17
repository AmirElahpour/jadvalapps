/**
 * Weekly timetable — RTL day tabs + sorted session list + course detail sheet.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './themeContext';
import { useStore } from './store';
import { ModalSheet, PrimaryButton, GhostButton } from './components';
import {
  Day,
  DAYS,
  sessionsOfDay,
  courseColor,
  toPersianDigits,
  timeToMinutes,
  formatJalali,
  COURSE_SWATCHES,
} from './logic';
import { IconClock, IconCalendar, IconBook, IconInfo } from './icons';

export function DayTabs({ selected, onSelect }: { selected: Day; onSelect: (d: Day) => void }) {
  const { p, font, radius } = useTheme();
  const { courses } = useStore();
  // Days that have at least one session get a dot; today gets a label.
  const counts = useMemo(() => {
    const m = new Map<Day, number>();
    for (const c of courses) for (const s of c.sessions) m.set(s.day, (m.get(s.day) ?? 0) + 1);
    return m;
  }, [courses]);
  const todayName = DAYS[todayTabIndex()] ?? null;
  return (
    <View style={styles.tabsRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {DAYS.map((d) => {
          const active = d === selected;
          const n = counts.get(d) ?? 0;
          const isToday = d === todayName;
          const label = (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontFamily: active ? font.bold : font.medium, fontSize: 13, color: active ? p.primaryText : p.textDim }}>{d}</Text>
              {isToday ? (
                <View style={[styles.todayPill, { backgroundColor: active ? 'rgba(255,255,255,0.28)' : p.primary + '22' }]}>
                  <Text style={{ fontFamily: font.bold, fontSize: 9, color: active ? p.primaryText : p.primary }}>امروز</Text>
                </View>
              ) : null}
              {n > 0 && !active ? <View style={[styles.tabDot, { backgroundColor: p.primary }]} /> : null}
            </View>
          );
          return (
            <Pressable key={d} onPress={() => onSelect(d)}>
              {active ? (
                <LinearGradient
                  colors={p.tabActiveGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tabActive, { borderRadius: radius.md }]}
                >
                  {label}
                </LinearGradient>
              ) : (
                <View style={[styles.tab, { borderColor: isToday ? p.primary + '88' : p.border, backgroundColor: p.surface, borderRadius: radius.md }]}>
                  {label}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function SessionList({ day, onOpenCourse }: { day: Day; onOpenCourse: (id: number) => void }) {
  const { courses, theme } = useStore();
  const { p, font, radius } = useTheme();
  const items = useMemo(() => sessionsOfDay(courses, day), [courses, day]);

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { borderColor: p.borderSoft, backgroundColor: p.surface }]}>
        <View style={[styles.emptyIcon, { backgroundColor: p.chipBg, borderRadius: radius.xxl }]}>
          <IconCalendar size={30} color={p.textFaint} />
        </View>
        <Text style={{ fontFamily: font.bold, fontSize: 15, color: p.textDim, marginTop: 14 }}>
          کلاسی در این روز ثبت نشده است
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textFaint, marginTop: 4 }}>
          با دکمه «درس جدید» شروع کنید
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listWrap} showsVerticalScrollIndicator={false}>
      {items.map(({ course, session }, i) => {
        const color = courseColor(course, theme);
        const dur = (timeToMinutes(session.end) ?? 0) - (timeToMinutes(session.start) ?? 0);
        return (
          <Pressable
            key={i}
            onPress={() => onOpenCourse(course.id)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: p.surface,
                borderColor: p.border,
                borderRadius: radius.lg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.colorBar, { backgroundColor: color }]} />
            <LinearGradient
              colors={[color + '14', color + '05']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardWash}
              pointerEvents="none"
            />
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={{ fontFamily: font.bold, fontSize: 15, color: p.text }} numberOfLines={1}>
                  {course.name}
                </Text>
                <View style={[styles.unitBadge, { backgroundColor: color + '22' }]}>
                  <Text style={{ fontFamily: font.bold, fontSize: 12, color }}>
                    {toPersianDigits(course.units)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardMeta}>
                <View style={styles.metaChip}>
                  <IconClock size={13} color={color} />
                  <Text style={{ fontFamily: font.medium, fontSize: 12, color: p.textDim }}>
                    {toPersianDigits(session.start)} تا {toPersianDigits(session.end)}
                  </Text>
                </View>
                <View style={[styles.metaChip, { backgroundColor: p.chipBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }]}>
                  <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textFaint }}>
                    {toPersianDigits(Math.round((dur / 60) * 10) / 10)} ساعت
                  </Text>
                </View>
                {course.professor ? (
                  <View style={styles.metaChip}>
                    <IconInfo size={12} color={p.textFaint} />
                    <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textDim }} numberOfLines={1}>
                      {course.professor}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

export function CourseDetailSheet({
  courseId,
  onClose,
  onEdit,
  onDelete,
}: {
  courseId: number | null;
  onClose: () => void;
  onEdit: (c: import('./logic').Course) => void;
  onDelete: (c: import('./logic').Course) => void;
}) {
  const { courses, theme, updateCourse } = useStore();
  const { p, font, radius } = useTheme();
  const course = courses.find((c) => c.id === courseId) ?? null;

  if (!course) return null;
  const color = courseColor(course, theme);
  const examStr = course.exam_date
    ? (() => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(course.exam_date!);
        if (!m) return toPersianDigits(course.exam_date!);
        return formatJalali(+m[1], +m[2], +m[3]);
      })()
    : null;

  return (
    <ModalSheet visible={!!courseId} onClose={onClose} title="جزئیات درس">
      <View style={styles.detailHead}>
        <View style={[styles.detailSwatch, { backgroundColor: color, borderRadius: radius.md }]} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 18, color: p.text }}>{course.name}</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.textDim }}>
            کد {toPersianDigits(course.code)}
          </Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: p.surfaceAlt, borderRadius: radius.lg }]}>
        <DetailRow icon={<IconInfo size={15} color={p.textDim} />} label="استاد" value={course.professor || '—'} />
        <DetailRow icon={<IconBook size={15} color={p.textDim} />} label="واحد" value={toPersianDigits(course.units)} />
        <DetailRow
          icon={<IconCalendar size={15} color={p.textDim} />}
          label="آزمون"
          value={
            examStr
              ? examStr + (course.exam_time ? ' - ' + toPersianDigits(course.exam_time) : '')
              : 'ندارد'
          }
        />
      </View>

      {/* Quick recolor without opening the full edit form */}
      <Text style={[styles.sessionsTitle, { fontFamily: font.bold, color: p.text }]}>رنگ درس</Text>
      <View style={styles.detailSwatches}>
        {COURSE_SWATCHES.map((c) => {
          const on = course.color === c;
          return (
            <Pressable
              key={c}
              onPress={() => updateCourse({ ...course, color: on ? undefined : c })}
              accessibilityLabel={'رنگ ' + c}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: c,
                borderColor: on ? p.text : 'transparent',
                borderWidth: on ? 2.5 : 0,
              }}
            />
          );
        })}
      </View>

      <Text style={[styles.sessionsTitle, { fontFamily: font.bold, color: p.text }]}>جلسات هفتگی</Text>
      {course.sessions.map((s, i) => (
        <View key={i} style={[styles.sessionRow, { backgroundColor: p.chipBg, borderRadius: radius.md }]}>
          <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.text }}>{s.day}</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.textDim }}>
            {toPersianDigits(s.start)} تا {toPersianDigits(s.end)}
          </Text>
        </View>
      ))}

      <View style={styles.detailActions}>
        <GhostButton label="حذف" danger onPress={() => onDelete(course)} />
        <PrimaryButton label="ویرایش" onPress={() => onEdit(course)} />
      </View>
    </ModalSheet>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { p, font } = useTheme();
  return (
    <View style={styles.detailRow}>
      {icon}
      <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.textDim, marginStart: 'auto' }}>{label}:</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.text, marginStart: 6 }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// Shared with App.tsx default-day logic: JS getDay -> index into DAYS (no Friday tab).
function todayTabIndex(): number {
  const d = new Date().getDay();
  if (d === 5) return 0;
  return (d + 1) % 7;
}

const styles = StyleSheet.create({
  tabsRow: { paddingHorizontal: 12, paddingTop: 4 },
  todayPill: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  tabsContent: { flexDirection: 'row', gap: 6, paddingVertical: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tabActive: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listWrap: { paddingHorizontal: 14, gap: 10, paddingBottom: 110 },
  empty: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardWash: { position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 },
  colorBar: { width: 6, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unitBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 10,
    marginEnd: 4,
  },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailSwatch: { width: 44, height: 44 },
  detailCard: { padding: 12, gap: 10, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sessionsTitle: { fontSize: 14, marginBottom: 8, marginTop: 4, textAlign: 'right' },
  detailSwatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
