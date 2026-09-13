/**
 * Premium pickers v3:
 * - TimePicker2: true wheel-style hour/minute columns (snap + haptics + tap-to-select)
 *   with big feedback display, quick presets, RTL-correct column order (hour on the right).
 * - JalaliDatePicker2: calendar grid with RTL-correct arrows, year jumps, today shortcut.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './themeContext';
import {
  JALALI_MONTHS,
  jalaliMonthLength,
  todayJalali,
  toPersianDigits,
  jalaliToGregorian,
  clamp,
} from './logic';

const tap = (heavy = false) => {
  try {
    heavy
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

function p2(n: number) {
  return String(n).padStart(2, '0');
}

// ============ Wheel (scroll-snap column) ============

const ITEM_H = 42;
const VISIBLE = 3;
const WHEEL_H = ITEM_H * VISIBLE;

function Wheel({
  items,
  selected,
  onSelect,
  width,
}: {
  items: string[];
  selected: number;
  onSelect: (i: number) => void;
  width: number;
}) {
  const { p, font } = useTheme();
  const listRef = useRef<FlatList<string>>(null);
  const dragging = useRef(false);
  const settled = useRef(selected);

  // Sync external value changes (preset taps, tap-to-select) into scroll position
  useEffect(() => {
    settled.current = selected;
    if (!dragging.current) {
      listRef.current?.scrollToOffset({ offset: selected * ITEM_H, animated: true });
    }
  }, [selected, items.length]);

  // Drag-end and momentum-end both fire for one gesture; the second is a no-op.
  const settle = (offset: number) => {
    dragging.current = false;
    const i = clamp(Math.round(offset / ITEM_H), 0, items.length - 1);
    if (i !== settled.current) {
      settled.current = i;
      tap();
      onSelect(i);
    }
  };

  return (
    <View style={{ width, alignItems: 'center' }}>
      <View
        style={{
          height: WHEEL_H,
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: p.surface,
        }}
      >
        {/* Highlight band behind the center row */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: ITEM_H,
            left: 5,
            right: 5,
            height: ITEM_H,
            borderRadius: 13,
            backgroundColor: p.primary + '1A',
            borderWidth: 1,
            borderColor: p.primary + '45',
          }}
        />
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => {
            const on = index === selected;
            return (
              <Pressable
                onPress={() => {
                  settled.current = index;
                  tap();
                  onSelect(index);
                  listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: true });
                }}
                style={{
                  height: ITEM_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: on ? font.black : font.medium,
                    fontSize: on ? 21 : 16,
                    color: on ? p.text : p.textFaint,
                  }}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          snapToAlignment="center"
          decelerationRate="fast"
          nestedScrollEnabled
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          // One spacer row top/bottom lets the first/last item settle centered.
          // Spacer included in layout math so scrollToItem lands centered too.
          ListHeaderComponent={<View style={{ height: ITEM_H }} />}
          ListFooterComponent={<View style={{ height: ITEM_H }} />}
          getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * (i + 1), index: i })}
          initialScrollIndex={clamp(selected, 0, items.length - 1)}
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
            settle(e.nativeEvent.contentOffset.y)
          }
          onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
            settle(e.nativeEvent.contentOffset.y)
          }
        />
        {/* Edge fade masks */}
        <LinearGradient
          pointerEvents="none"
          colors={[p.surface, p.surface + '00']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 0.9 }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[p.surface + '00', p.surface]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 0.9 }}
        />
      </View>
    </View>
  );
}

// ============ TimePicker2 ============

const HOURS = Array.from({ length: 24 }, (_, i) => toPersianDigits(p2(i)));
const MINUTES = Array.from({ length: 60 }, (_, i) => toPersianDigits(p2(i)));

const PRESETS = [
  { label: '۷:۳۰', h: 7, m: 30 },
  { label: '۸:۰۰', h: 8, m: 0 },
  { label: '۱۰:۰۰', h: 10, m: 0 },
  { label: '۱۲:۰۰', h: 12, m: 0 },
  { label: '۱۴:۰۰', h: 14, m: 0 },
  { label: '۱۶:۰۰', h: 16, m: 0 },
  { label: '۱۸:۰۰', h: 18, m: 0 },
];

function dayPartLabel(h: number): string {
  if (h < 5) return 'بامداد';
  if (h < 12) return 'صبح';
  if (h < 15) return 'ظهر';
  if (h < 19) return 'بعدازظهر';
  return 'شب';
}

export function TimePicker2({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const { p, font } = useTheme();

  return (
    <View style={[tp.wrap, { backgroundColor: p.surfaceAlt, borderColor: p.border }]}>
      {/* Big feedback display */}
      <View style={tp.displayRow}>
        <View style={[tp.dayPartChip, { backgroundColor: p.primary + '14' }]}>
          <Text style={{ fontFamily: font.medium, fontSize: 11, color: p.primary }}>
            {dayPartLabel(hour)}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: font.black, fontSize: 30, color: p.text }}>
            {toPersianDigits(p2(hour))}
            <Text style={{ color: p.primary }}>:</Text>
            {toPersianDigits(p2(minute))}
          </Text>
        </View>
        <View style={{ width: 56 }} />
      </View>

      {/* Wheels — RTL: hour column on the RIGHT, minutes on the LEFT */}
      <View style={[tp.wheelsRow, { borderTopColor: p.borderSoft, borderTopWidth: 1 }]}>
        <View style={tp.wheelCol}>
          <Wheel items={HOURS} selected={hour} onSelect={(i) => onChange(i, minute)} width={86} />
          <Text style={[tp.wheelLabel, { fontFamily: font.medium, color: p.textFaint }]}>ساعت</Text>
        </View>
        <Text style={{ fontFamily: font.black, fontSize: 26, color: p.textFaint, marginTop: 6 }}>
          :
        </Text>
        <View style={tp.wheelCol}>
          <Wheel
            items={MINUTES}
            selected={minute}
            onSelect={(i) => onChange(hour, i)}
            width={86}
          />
          <Text style={[tp.wheelLabel, { fontFamily: font.medium, color: p.textFaint }]}>دقیقه</Text>
        </View>
      </View>

      {/* Quick presets */}
      <View style={tp.presetsRow}>
        {PRESETS.map((x) => {
          const on = x.h === hour && x.m === minute;
          return (
            <Pressable
              key={x.label}
              onPress={() => {
                tap();
                onChange(x.h, x.m);
              }}
              style={[
                tp.preset,
                {
                  backgroundColor: on ? p.primary : p.surface,
                  borderColor: on ? p.primary : p.border,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: on ? font.bold : font.medium,
                  fontSize: 12.5,
                  color: on ? p.primaryText : p.textDim,
                }}
              >
                {x.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 6 },
  displayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  dayPartChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
  },
  wheelCol: { alignItems: 'center', gap: 5 },
  wheelLabel: { fontSize: 11 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 10, paddingHorizontal: 2 },
  preset: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});

// ============ JalaliDatePicker2 ============

export function JalaliDatePicker2({
  value,
  onChange,
}: {
  value: { jy: number; jm: number; jd: number };
  onChange: (v: { jy: number; jm: number; jd: number }) => void;
}) {
  const { p, font } = useTheme();
  const today = todayJalali();
  // Weekday of day 1 (Gregorian date of jy/jm/1)
  const [gy1, gm1, gd1] = jalaliToGregorian(value.jy, value.jm, 1);
  const firstWeekday = new Date(gy1, gm1 - 1, gd1).getDay(); // 0=Sun
  // Persian week: شنبه first. JS getDay: Sat=6 -> idx0, Sun=0 -> 1, Mon=1 -> 2 ...
  const lead = (firstWeekday + 1) % 7;
  const dim = jalaliMonthLength(value.jy, value.jm);

  const moveMonth = (dir: 1 | -1) => {
    tap(true);
    let jm = value.jm + dir;
    let jy = value.jy;
    if (jm < 1) {
      jm = 12;
      jy -= 1;
    }
    if (jm > 12) {
      jm = 1;
      jy += 1;
    }
    onChange({ jy, jm, jd: Math.min(value.jd, jalaliMonthLength(jy, jm)) });
  };

  const moveYear = (dir: 1 | -1) => {
    tap(true);
    const jy = value.jy + dir;
    onChange({ jy, jm: value.jm, jd: Math.min(value.jd, jalaliMonthLength(jy, value.jm)) });
  };

  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={[dp.wrap, { backgroundColor: p.surfaceAlt, borderColor: p.border }]}>
      {/* Nav — RTL: past on the right (»  year, › month), future on the left */}
      <View style={dp.navRow}>
        <Pressable
          onPress={() => moveYear(-1)}
          style={({ pressed }) => [dp.navBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="سال قبل"
        >
          <Text style={{ fontFamily: font.black, fontSize: 13, color: p.textFaint }}>{'»'}</Text>
        </Pressable>
        <Pressable
          onPress={() => moveMonth(-1)}
          style={({ pressed }) => [dp.navBtnBig, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="ماه قبل"
        >
          <Text style={{ fontFamily: font.black, fontSize: 17, color: p.text }}>{'›'}</Text>
        </Pressable>
        <View style={dp.monthWrap}>
          <Text style={{ fontFamily: font.black, fontSize: 16, color: p.text }}>
            {JALALI_MONTHS[value.jm - 1]}
          </Text>
          <Text style={{ fontFamily: font.bold, fontSize: 12, color: p.primary }}>
            {toPersianDigits(value.jy)}
          </Text>
        </View>
        <Pressable
          onPress={() => moveMonth(1)}
          style={({ pressed }) => [dp.navBtnBig, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="ماه بعد"
        >
          <Text style={{ fontFamily: font.black, fontSize: 17, color: p.text }}>{'‹'}</Text>
        </Pressable>
        <Pressable
          onPress={() => moveYear(1)}
          style={({ pressed }) => [dp.navBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="سال بعد"
        >
          <Text style={{ fontFamily: font.black, fontSize: 13, color: p.textFaint }}>{'«'}</Text>
        </Pressable>
      </View>

      {/* Weekday header */}
      <View style={dp.weekRow}>
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d, i) => (
          <Text
            key={i}
            style={{
              fontFamily: font.medium,
              fontSize: 11,
              color: p.textFaint,
              width: '14.28%',
              textAlign: 'center',
            }}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ gap: 4 }}>
        {weeks.map((w, wi) => (
          <View key={wi} style={dp.weekDays}>
            {w.map((d, di) => {
              const isToday = d === today.jd && value.jm === today.jm && value.jy === today.jy;
              const sel = d === value.jd;
              return (
                <Pressable
                  key={di}
                  disabled={d == null}
                  onPress={() => {
                    tap();
                    onChange({ ...value, jd: d! });
                  }}
                  style={[
                    dp.day,
                    {
                      backgroundColor: sel
                        ? p.primary
                        : isToday
                        ? p.primary + '14'
                        : 'transparent',
                      borderColor: isToday && !sel ? p.primary : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                >
                  {d != null && (
                    <Text
                      style={{
                        fontFamily: sel ? font.black : font.regular,
                        fontSize: 13,
                        color: sel ? p.primaryText : isToday ? p.primary : p.text,
                      }}
                    >
                      {toPersianDigits(d)}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Today shortcut */}
      <Pressable
        onPress={() => {
          tap();
          onChange({ jy: today.jy, jm: today.jm, jd: today.jd });
        }}
        style={({ pressed }) => [
          dp.todayBtn,
          {
            backgroundColor: pressed ? p.primary + '26' : p.surface,
            borderColor: p.primary + '55',
          },
        ]}
      >
        <Text style={{ fontFamily: font.bold, fontSize: 12.5, color: p.primary }}>
          بردن به امروز
        </Text>
      </Pressable>
    </View>
  );
}

const dp = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 20, padding: 12, gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthWrap: { alignItems: 'center', gap: 1 },
  navBtn: { padding: 6, borderRadius: 10, width: 34, alignItems: 'center' },
  navBtnBig: { padding: 6, borderRadius: 10, width: 34, alignItems: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDays: { flexDirection: 'row' },
  day: {
    width: '14.28%',
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
});
