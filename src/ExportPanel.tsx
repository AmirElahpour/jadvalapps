/**
 * Export / Import / Share panel — share link, PDF, PNG, JSON backup + restore.
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
  exportPdf,
  captureViewToPng,
  buildShareLink,
  saveOrShareFile,
  saveTextFile,
  pickJsonFile,
} from './export';
import { WeekGrid } from './WeekGrid';
import {
  IconLink,
  IconPrinter,
  IconImage,
  IconFileJson,
  IconUpload,
  IconShare,
  IconAlert,
} from './icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  toast: (msg: string, kind?: 'success' | 'error' | 'info') => void;
  gridRef: React.RefObject<View | null>;
  documentPicker: () => Promise<{ uri: string } | null>;
}

export function ExportPanel({ visible, onClose, toast, gridRef, documentPicker }: Props) {
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

  const doPdf = async () => {
    if (courses.length === 0) {
      toast('ابتدا درسی اضافه کنید', 'error');
      return;
    }
    setBusy('pdf');
    try {
      const res = await exportPdf(courses);
      if (!res) throw new Error('pdf');
      if (res.uri === 'web-printed') {
        toast('کادر چاپ و ذخیره PDF باز شد', 'success');
      } else {
        const out = await saveOrShareFile(res.uri, backupFileName('pdf'));
        toast(out === 'cancelled' ? 'ارسال PDF لغو شد' : 'PDF آماده شد', out === 'cancelled' ? 'info' : 'success');
      }
    } catch {
      toast('ساخت PDF ناموفق بود', 'error');
    } finally {
      setBusy(null);
    }
  };

  const doPng = async () => {
    if (courses.length === 0) {
      toast('ابتدا درسی اضافه کنید', 'error');
      return;
    }
    setBusy('png');
    try {
      const uri = await captureViewToPng(gridRef);
      if (!uri) throw new Error('capture');
      const out = await saveOrShareFile(uri, backupFileName('png'));
      toast(out === 'cancelled' ? 'ارسال تصویر لغو شد' : 'تصویر جدول آماده شد', out === 'cancelled' ? 'info' : 'success');
    } catch {
      toast('ساخت تصویر ناموفق بود', 'error');
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
    <ModalSheet visible={visible} onClose={onClose} title="اشتراک‌گذاری و خروجی">
      <View style={styles.stats}>
        <StatChip label="درس" value={toPersianDigits(courses.length)} p={p} font={font} />
        <StatChip label="واحد" value={toPersianDigits(totalUnits(courses))} p={p} font={font} />
        <StatChip label="ساعت/هفته" value={toPersianDigits(weeklyHours(courses))} p={p} font={font} />
      </View>

      {/* Units cap — the StatsRow "over cap" warning reads this value */}
      <View style={[styles.restoreCard, { borderColor: p.border, backgroundColor: p.surfaceAlt }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.text, textAlign: 'right' }}>سقف واحد ترم</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textDim, marginTop: 2, textAlign: 'right' }}>
            {unitsCap > 0 ? `هشدار وقتی مجموع از ${toPersianDigits(unitsCap)} بگذرد` : 'بدون سقف — هر مقداری مجاز است'}
          </Text>
        </View>
        <View style={styles.capRow}>
          <Pressable
            onPress={() => {
              const v = parsePositiveInt(capText ?? '', 0);
              setUnitsCap(v);
              setCapText(null);
              toast(v > 0 ? `سقف واحد روی ${toPersianDigits(v)} واحد تنظیم شد` : 'سقف واحد برداشته شد', 'success');
            }}
            style={[styles.restoreBtn, { backgroundColor: p.primary }]}
          >
            <Text style={{ fontFamily: font.bold, fontSize: 13, color: p.primaryText }}>ثبت</Text>
          </Pressable>
          <TextInput
            value={capText ?? (unitsCap > 0 ? String(unitsCap) : '')}
            onChangeText={(t) => setCapText(toEnglishDigits(t).replace(/[^0-9]/g, ''))}
            placeholder="مثلاً ۲۰"
            placeholderTextColor={p.textFaint}
            keyboardType="number-pad"
            style={[styles.capInput, { fontFamily: font.bold, color: p.text, borderColor: p.border, backgroundColor: p.surface }]}
          />
        </View>
      </View>

      <View style={styles.grid2}>
        <PanelAction
          icon={<IconLink size={20} color={p.primary} />}
          title="لینک اشتراک"
          subtitle="ارسال با پیامک یا تلگرام"
          busy={busy === 'link'}
          onPress={doShareLink}
          tint={p.primary}
          p={p} font={font} radius={radius}
        />
        <PanelAction
          icon={<IconPrinter size={20} color={p.accent} />}
          title="خروجی PDF"
          subtitle="جدول دروس با جلسات"
          busy={busy === 'pdf'}
          onPress={doPdf}
          tint={p.accent}
          p={p} font={font} radius={radius}
        />
        <PanelAction
          icon={<IconImage size={20} color={p.accent2} />}
          title="تصویر جدول"
          subtitle="PNG از کل هفته"
          busy={busy === 'png'}
          onPress={doPng}
          tint={p.accent2}
          p={p} font={font} radius={radius}
        />
        <PanelAction
          icon={<IconFileJson size={20} color={p.success} />}
          title="پشتیبان JSON"
          subtitle="فایل با نام زمان‌دار"
          busy={busy === 'json'}
          onPress={doJsonBackup}
          tint={p.success}
          p={p} font={font} radius={radius}
        />
      </View>

      <View style={[styles.restoreCard, { borderColor: p.border, backgroundColor: p.surfaceAlt }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.text }}>بازیابی از فایل</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textDim, marginTop: 2 }}>
            لیست فعلی با فایل JSON جایگزین می‌شود
          </Text>
        </View>
        <Pressable
          onPress={doRestore}
          disabled={busy === 'restore'}
          style={[styles.restoreBtn, { backgroundColor: p.primary }]}
        >
          <IconUpload size={16} color={p.primaryText} />
          <Text style={{ fontFamily: font.bold, fontSize: 13, color: p.primaryText }}>انتخاب فایل</Text>
        </Pressable>
      </View>

      <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textFaint, textAlign: 'center', marginTop: 8 }}>
        روی اندروید اگر ذخیره مستقیم ممکن نباشد، دیالوگ اشتراک سیستم باز می‌شود
      </Text>
    </ModalSheet>
  );
}

function StatChip({ label, value, p, font }: { label: string; value: string; p: any; font: any }) {
  return (
    <View style={[styles.stat, { backgroundColor: p.chipBg }]}>
      <Text style={{ fontFamily: font.bold, fontSize: 16, color: p.primary }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textDim }}>{label}</Text>
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
      onPressIn={() => Animated.timing(scale, { toValue: 0.96, duration: 90, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 130, useNativeDriver: true }).start()}
      style={styles.actionOuter}
    >
      <Animated.View
        style={[
          styles.action,
          {
            backgroundColor: p.surfaceAlt,
            borderColor: p.border,
            borderRadius: radius.lg,
            opacity: busy ? 0.5 : 1,
            transform: [{ scale }],
          },
        ]}
      >
        <LinearGradient
          colors={[tintColor + '26', tintColor + '10']}
          style={[styles.actionIcon, { borderRadius: radius.xl }]}
        >
          {busy ? <ActivityIndicator size="small" color={tintColor} /> : icon}
        </LinearGradient>
        <Text style={{ fontFamily: font.bold, fontSize: 13, color: p.text }}>{title}</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textDim, textAlign: 'center' }}>
          {subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stat: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  // Two columns on all screens: each PanelAction root flexes to half the row.
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionOuter: { flexBasis: '48%', flexGrow: 1 },
  action: {
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  restoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    textAlign: 'right',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  capRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  capInput: {
    width: 76,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
  },
});
