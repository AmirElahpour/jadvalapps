/**
 * Full weekly grid — all days as columns, times as rows.
 * Used for PNG/PDF export snapshot (rendered off-screen for capture).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from './store';
import { useTheme } from './themeContext';
import { DAYS, Day, courseColor, toPersianDigits, timeToMinutes, totalUnits, Course } from './logic';

const START_H = 7;
const END_H = 20;
const ROW_H = 28;
const COL_W = 62;

export function layoutBlocks(courses: Course[]) {
  const out: { course: Course; day: Day; top: number; height: number; color: string; label: string }[] = [];
  for (const c of courses) {
    const color = courseColor(c, 'dark');
    for (const s of c.sessions) {
      const a = timeToMinutes(s.start);
      const b = timeToMinutes(s.end);
      if (a == null || b == null || b <= a) continue;
      const gridStart = Math.max(a, START_H * 60);
      const gridEnd = Math.min(b, END_H * 60);
      if (gridEnd <= gridStart) continue;
      out.push({
        course: c,
        day: s.day,
        top: ((gridStart - START_H * 60) / 30) * ROW_H,
        height: ((gridEnd - gridStart) / 30) * ROW_H,
        color,
        label: toPersianDigits(s.start + '-' + s.end),
      });
    }
  }
  return out;
}

export function WeekGrid({ gridRef }: { gridRef?: React.RefObject<View | null> }) {
  const { courses } = useStore();
  const { p, font, radius } = useTheme();
  const blocks = layoutBlocks(courses);

  const hours: number[] = [];
  for (let h = START_H; h <= END_H; h++) hours.push(h);

  return (
    <View
      ref={gridRef}
      style={[
        styles.grid,
        {
          backgroundColor: p.bg2,
          width: COL_W * (DAYS.length + 1) + 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: p.borderSoft,
        },
      ]}
    >
      {/* Title banner */}
      <LinearGradient
        colors={[p.primary, p.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.titleBanner}
      >
        <Text style={[styles.title, { fontFamily: font.black, color: '#FFFFFF' }]}>
          برنامه هفتگی
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>
          JadvalApps · {toPersianDigits(courses.length)} درس ·{' '}
          {toPersianDigits(totalUnits(courses))} واحد
        </Text>
      </LinearGradient>

      {/* RTL: first GridColumn (right) is the hour gutter, then شنبه..پنجشنبه right-to-left */}
      <View style={styles.bodyRow}>
        <GridColumn>
          <View style={[styles.corner, { height: 30 }]} />
          {hours.slice(0, -1).map((h) => (
            <View key={String(h)}>
              <View style={[styles.hourCell, { borderTopColor: p.border }]}>
                <Text style={{ fontFamily: font.regular, fontSize: 9, color: p.textFaint }}>
                  {toPersianDigits(String(h).padStart(2, '0'))}:۰۰
                </Text>
              </View>
              <View style={[styles.hourCell, { borderTopColor: p.borderSoft }]}>
                <Text style={{ fontFamily: font.regular, fontSize: 9, color: p.textFaint }}>
                  {toPersianDigits(String(h).padStart(2, '0'))}:۳۰
                </Text>
              </View>
            </View>
          ))}
        </GridColumn>
        {DAYS.map((d) => (
          <GridColumn key={d}>
            <View style={[styles.headCell, { height: 30, backgroundColor: p.surfaceAlt, borderColor: p.border }]}>
              <Text style={{ fontFamily: font.bold, fontSize: 11, color: p.text }}>{d}</Text>
            </View>
            {hours.slice(0, -1).map((h) => (
              <View key={String(h)}>
                <View style={[styles.gridCell, { borderTopColor: p.border }]} />
                <View style={[styles.gridCellHalf, { borderTopColor: p.borderSoft }]} />
              </View>
            ))}
            {blocks
              .filter((b) => b.day === d)
              .map((b, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    top: 30 + b.top,
                    right: 2,
                    left: 2,
                    height: b.height - 2,
                    backgroundColor: b.color,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.35)',
                    paddingVertical: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Text numberOfLines={2} style={{ fontFamily: font.bold, fontSize: 8, color: '#FFFFFF', textAlign: 'center' }}>
                    {b.course.name}
                  </Text>
                  <Text style={{ fontFamily: font.regular, fontSize: 7, color: 'rgba(255,255,255,0.85)' }}>
                    {b.label}
                  </Text>
                </View>
              ))}
          </GridColumn>
        ))}
      </View>
    </View>
  );
}

function GridColumn({ children }: { children: React.ReactNode }) {
  return <View style={{ width: COL_W }}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { padding: 8 },
  titleBanner: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
    gap: 2,
  },
  title: { fontSize: 15, textAlign: 'center' },
  corner: { alignItems: 'center', justifyContent: 'center' },
  headCell: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  bodyRow: { flexDirection: 'row' },
  hourCell: { height: ROW_H / 2, alignItems: 'flex-end', justifyContent: 'center', paddingStart: 6 },
  gridCell: { height: ROW_H / 2, borderTopWidth: 1 },
  gridCellHalf: { height: ROW_H / 2 },
});
