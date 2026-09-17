/**
 * Export / Import / Share panel — share link, JSON backup & restore, units cap.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Share, Platform, Animated, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './themeContext';
import { useStore } from './store';
import { ModalSheet } from './components';
import {
  backupFileName,
  parsePositiveInt,
  toEnglishDigits,
  toPersianDigits,
  totalUnits,
  weeklyHours,
} from './logic';
import {
  buildBackupJSON,
  parseBackup,
  buildShareLink,
  saveTextFile,
  pickJsonFile,
} from './export';
import {
  IconLink,
  IconFileJson,
  IconUpload,
  IconCheck,
} from './icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  toast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
  gridRef?: React.RefObject<View | null>;
  documentPicker?: () => Promise<{ uri: string } | null>;
}

export function ExportPanel({ visible, onClose, toast }: Props) {
  const { courses, replaceCourses } = useStore();
  const { p, font, radius } = useTheme();
  const [busy, setBusy] = useState<string | null>(null);

  const doShareLink = async () => {
    if (courses.length === 0) {
      toast('ابتدا درسی اضافه کنید', 'error');
      return;
    }
    setBusy('link');
    try {
      const { url } = await buildShareLink(courses);
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
          try {
            await (navigator as any).share({
              title: 'برنامه هفتگی کلاس‌ها',
              text: 'برنامه هفتگی کلاس‌های من در جداول:\n' + url,
            });
            toast('لینک اشتراک ارسال شد', 'success');
            return;
          } catch (e: any) {
            if (e?.name === 'AbortError') return;
          }
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          toast('لینک اشتراک در کلیپ‌بورد کپی شد', 'success');
          return;
        }
      }
      await Share.share({ message: 'برنامه هفتگی من در JadvalApps:\n' + url });
      toast('لینک اشتراک ساخته شد', 'success');
    } catch {
      toast('ساخت لینک ناموفق بود', 'error');
    } finally {
      setBusy(null);
    }
  };

  const doJsonBackup = async () => {
    if (courses.length === 0) {
      toast('درسی برای پشتیبان‌گیری وجود ندارد', 'error');
      return;
    }
    setBusy('json');
    try {
      const fileName = backupFileName('json');
      const jsonContent = buildBackupJSON(courses);
      const out = await saveTextFile(jsonContent, fileName);
      toast(out === 'cancelled' ? 'پشتیبان‌گیری لغو شد' : 'فایل پشتیبان JSON آماده شد', out === 'cancelled' ? 'info' : 'success');
    } catch {
      toast('خروجی JSON ناموفق بود', 'error');
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    setBusy('restore');
    try {
      const text = await pickJsonFile();
      if (!text) {
        setBusy(null);
        return;
      }
      const restored = parseBackup(text);
      if (restored.length === 0) {
        toast('فایل هیچ درسی ندارد', 'error');
        setBusy(null);
        return;
      }
      replaceCourses(restored);
      toast(`${toPersianDigits(restored.length)} درس با موفقیت بازیابی شد`, 'success');
      onClose();
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : 'بازیابی ناموفق بود', 'error');
    } finally {
      setBusy(null);
    }
  };

  const { unitsCap, setUnitsCap } = useStore();
  const [capText, setCapText] = useState<string | null>(null);

  return (
    <ModalSheet visible={visible} onClose={onClose} title="پشتیبان‌گیری و اشتراک">
      <View style={styles.container}>
        {/* ۱. کارت‌های آمار مختصر */}
        <View style={styles.statsRow}>
          <StatChip label="درس" value={toPersianDigits(courses.length)} p={p} font={font} radius={radius} />
          <StatChip label="واحد" value={toPersianDigits(totalUnits(courses))} p={p} font={font} radius={radius} />
          <StatChip label="ساعت / هفته" value={toPersianDigits(weeklyHours(courses))} p={p} font={font} radius={radius} />
        </View>

        {/* ۲. عملیات اصلی: پشتیبان JSON و لینک اشتراک */}
        <View style={styles.actionsRow}>
          <PanelAction
            icon={<IconFileJson size={22} color={p.success} />}
            title="پشتیبان JSON"
            subtitle="دریافت فایل ذخیره"
            busy={busy === 'json'}
            onPress={doJsonBackup}
            tint={p.success}
            p={p} font={font} radius={radius}
          />
          <PanelAction
            icon={<IconLink size={22} color={p.primary} />}
            title="لینک اشتراک"
            subtitle="کپی یا ارسال لینک"
            busy={busy === 'link'}
            onPress={doShareLink}
            tint={p.primary}
            p={p} font={font} radius={radius}
          />
        </View>

        {/* ۳. بخش بازیابی از فایل */}
        <View style={[styles.card, { borderColor: p.border, backgroundColor: p.surfaceAlt, borderRadius: radius.lg }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: p.primary + '1C', borderRadius: radius.md }]}>
              <IconUpload size={18} color={p.primary} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={[styles.cardTitle, { fontFamily: font.bold, color: p.text }]}>
                بازیابی از فایل پشتیبان
              </Text>
              <Text style={[styles.cardSubtitle, { fontFamily: font.regular, color: p.textDim }]}>
                جایگزینی دروس فعلی با بارگذاری فایل JSON
              </Text>
            </View>
          </View>
          <Pressable
            onPress={doRestore}
            disabled={busy === 'restore'}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: p.primary, opacity: pressed || busy === 'restore' ? 0.8 : 1, borderRadius: radius.md },
            ]}
          >
            {busy === 'restore' ? (
              <ActivityIndicator size="small" color={p.primaryText} />
            ) : (
              <Text style={[styles.actionBtnText, { fontFamily: font.bold, color: p.primaryText }]}>
                انتخاب فایل
              </Text>
            )}
          </Pressable>
        </View>

        {/* ۴. بخش سقف واحد ترم */}
        <View style={[styles.card, { borderColor: p.border, backgroundColor: p.surfaceAlt, borderRadius: radius.lg }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: p.accent + '1C', borderRadius: radius.md }]}>
              <IconCheck size={18} color={p.accent} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={[styles.cardTitle, { fontFamily: font.bold, color: p.text }]}>
                سقف مجاز واحد ترم
              </Text>
              <Text style={[styles.cardSubtitle, { fontFamily: font.regular, color: p.textDim }]}>
                {unitsCap > 0 ? `هشدار رنگی با عبور از ${toPersianDigits(unitsCap)} واحد` : 'بدون سقف — هر مقداری مجاز است'}
              </Text>
            </View>
          </View>
          <View style={styles.capControl}>
            <TextInput
              value={capText ?? (unitsCap > 0 ? String(unitsCap) : '')}
              onChangeText={(t) => setCapText(toEnglishDigits(t).replace(/[^0-9]/g, ''))}
              placeholder="مثلاً ۲۰"
              placeholderTextColor={p.textFaint}
              keyboardType="number-pad"
              style={[
                styles.capInput,
                { fontFamily: font.bold, color: p.text, borderColor: p.border, backgroundColor: p.surface, borderRadius: radius.md },
                Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {},
              ]}
            />
            <Pressable
              onPress={() => {
                const v = parsePositiveInt(capText ?? '', 0);
                setUnitsCap(v);
                setCapText(null);
                toast(v > 0 ? `سقف واحد روی ${toPersianDigits(v)} واحد تنظیم شد` : 'سقف واحد برداشته شد', 'success');
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: p.primary, opacity: pressed ? 0.85 : 1, borderRadius: radius.md },
              ]}
            >
              <Text style={[styles.actionBtnText, { fontFamily: font.bold, color: p.primaryText }]}>ثبت</Text>
            </Pressable>
          </View>
        </View>

        {/* یادداشت فوتر مدال */}
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textFaint, textAlign: 'center', marginTop: 2 }}>
          همه داده‌ها روی حافظه محلی دستگاه شما نگهداری می‌شوند
        </Text>
      </View>
    </ModalSheet>
  );
}

function StatChip({ label, value, p, font, radius }: { label: string; value: string; p: any; font: any; radius: any }) {
  return (
    <View style={[styles.stat, { backgroundColor: p.chipBg, borderRadius: radius.md }]}>
      <Text style={{ fontFamily: font.black, fontSize: 17, color: p.primary }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textDim, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function PanelAction({
  icon,
  title,
  subtitle,
  busy,
  onPress,
  tint,
  p,
  font,
  radius,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  busy: boolean;
  onPress: () => void;
  tint?: string;
  p: any;
  font: any;
  radius: any;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const tintColor = tint || p.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      onPressIn={() => Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
      style={styles.actionOuter}
    >
      <Animated.View
        style={[
          styles.actionCard,
          {
            backgroundColor: p.surfaceAlt,
            borderColor: p.border,
            borderRadius: radius.lg,
            opacity: busy ? 0.6 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={[tintColor + '24', tintColor + '0A']}
          style={[styles.actionIconBox, { borderRadius: radius.md }]}
        >
          {busy ? <ActivityIndicator size="small" color={tintColor} /> : icon}
        </LinearGradient>
        <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.text, marginTop: 4 }}>{title}</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textDim, textAlign: 'center', marginTop: 2 }}>
          {subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionOuter: {
    flex: 1,
  },
  actionCard: {
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    textAlign: 'right',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  actionBtnText: {
    fontSize: 13,
  },
  capControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capInput: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
  },
});
