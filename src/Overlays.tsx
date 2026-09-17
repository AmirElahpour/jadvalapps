/**
 * Splash screen (animated, shown while fonts load) + Welcome walkthrough + About.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './themeContext';
import { ModalSheet } from './components';
import { toPersianDigits, todayJalali, formatJalali } from './logic';
import { IconCalendar, IconLayers, IconShare, IconClock, IconAlert, IconGrid } from './icons';

// ---------- Splash (legacy overlay — kept for the shell API; boot branding
// now happens in App.tsx BootSplash before Shell mounts) ----------

export function SplashScreen({ done }: { done: boolean }) {
  const [hide, setHide] = useState(done);
  const fade = useRef(new Animated.Value(done ? 0 : 1)).current;

  useEffect(() => {
    if (done) {
      Animated.timing(fade, { toValue: 0, duration: 380, useNativeDriver: true }).start(() =>
        setHide(true)
      );
    }
  }, [done]);

  if (hide) return null;

  return (
    <Animated.View style={[styles.splash, { opacity: fade }]} pointerEvents={done ? 'none' : 'auto'}>
      <IconCalendar size={72} color="#38BDF8" strokeWidth={1.6} />
      <Text style={styles.splashTitle}>جداول</Text>
      <Text style={styles.splashSub}>برنامه‌ساز هفتگی دانشجو</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B1224',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  splashTitle: { fontSize: 30, marginTop: 18, color: '#EDF2FB', fontWeight: '800' },
  splashSub: { fontSize: 14, marginTop: 6, color: '#93A4C6' },

  welcomeBody: { alignItems: 'center', paddingVertical: 10 },
  welcomeIcon: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  stepDots: { flexDirection: 'row', gap: 6, marginTop: 18 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  welcomeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 18,
    paddingHorizontal: 8,
  },
  welcomeNext: { paddingHorizontal: 22, paddingVertical: 11 },
  aboutBody: { alignItems: 'center', paddingVertical: 8 },
  aboutLinks: { alignSelf: 'stretch', marginTop: 16, padding: 12, gap: 10 },
  aboutLink: { flexDirection: 'row', alignItems: 'center' },
});

// ---------- Welcome walkthrough ----------

const WELCOME_STEPS = [
  {
    icon: <IconLayers size={34} color="#38BDF8" />,
    tint: '#38BDF8',
    title: 'درس اضافه کنید',
    body: 'با دکمه + درس‌های ترم خود را با کد، استاد، واحد و جلسات کلاس ثبت کنید. ساعت‌ها با چرخ‌گردان تنظیم می‌شوند.',
  },
  {
    icon: <IconAlert size={34} color="#F472B6" />,
    tint: '#F472B6',
    title: 'تداخل خودکار',
    body: 'اگر ساعت دو درس روی هم بیفتد، هنگام ذخیره با نام درسِ تداخلی مطلع می‌شوید.',
  },
  {
    icon: <IconGrid size={34} color="#34D399" />,
    tint: '#34D399',
    title: 'جدول هفتگی',
    body: 'هر روز را از تب‌های بالا ببینید؛ هر درس رنگ ثابت خودش را دارد.',
  },
  {
    icon: <IconShare size={34} color="#818CF8" />,
    tint: '#818CF8',
    title: 'پشتیبان و اشتراک',
    body: 'از دکمه اشتراک در نوار بالا: لینک اشتراک مستقیم و فایل پشتیبان JSON.',
  },
];

export function WelcomeModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { font, p, radius } = useTheme();
  const [step, setStep] = useState(0);
  const s = WELCOME_STEPS[step];
  const last = step === WELCOME_STEPS.length - 1;

  const next = () => {
    if (last) {
      setStep(0);
      onDone();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onDone} title="خوش آمدید">
      <View style={styles.welcomeBody}>
        <LinearGradient
          colors={[s.tint + '2E', s.tint + '0D']}
          style={[styles.welcomeIcon, { borderRadius: radius.xxl }]}
        >
          {s.icon}
        </LinearGradient>
        <Text style={{ fontFamily: font.bold, fontSize: 19, color: p.text, marginTop: 14 }}>{s.title}</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 14, color: p.textDim, textAlign: 'center', lineHeight: 24, marginTop: 8 }}>
          {s.body}
        </Text>
        <View style={styles.stepDots}>
          {WELCOME_STEPS.map((st, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor: i === step ? st.tint : p.border,
                  width: i === step ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.welcomeActions}>
          <Pressable onPress={onDone} style={{ padding: 10 }}>
            <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.textFaint }}>رد کردن</Text>
          </Pressable>
          <Pressable
            onPress={next}
            style={[styles.welcomeNext, { backgroundColor: p.primary, borderRadius: radius.md }]}
          >
            <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.primaryText }}>
              {last ? 'شروع کنیم' : 'بعدی'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}

// ---------- About ----------

export function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { p, font, radius } = useTheme();
  const t = todayJalali();
  return (
    <ModalSheet visible={visible} onClose={onClose} title="درباره برنامه">
      <View style={styles.aboutBody}>
        <IconCalendar size={44} color={p.primary} />
        <Text style={{ fontFamily: font.black, fontSize: 22, color: p.text, marginTop: 10 }}>جداول</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.textDim, marginTop: 4 }}>
          نسخه {toPersianDigits('1.0.0')} - برنامه‌ساز هفتگی دانشجو
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 12, color: p.textFaint, marginTop: 2 }}>
          امروز: {formatJalali(t.jy, t.jm, t.jd)}
        </Text>

        <View style={[styles.aboutLinks, { borderRadius: radius.lg, backgroundColor: p.surfaceAlt }]}>
          <AboutLink icon={<IconGrid size={16} color={p.primary} />} label="جدول هفتگی با رنگ ثابت برای هر درس" />
          <AboutLink icon={<IconClock size={16} color={p.primary} />} label="تشخیص خودکار تداخل زمانی هنگام ذخیره" />
          <AboutLink icon={<IconShare size={16} color={p.primary} />} label="لینک اشتراک و فایل پشتیبان JSON" />
        </View>

        <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textFaint, textAlign: 'center', marginTop: 12 }}>
          همه داده‌ها فقط روی دستگاه شما ذخیره می‌شوند
        </Text>
      </View>
    </ModalSheet>
  );
}

function AboutLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { p, font } = useTheme();
  return (
    <View style={styles.aboutLink}>
      {icon}
      <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.text, marginStart: 8 }}>{label}</Text>
    </View>
  );
}
