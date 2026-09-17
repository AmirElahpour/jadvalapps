/**
 * JadvalApps — Persian weekly course scheduler (RTL).
 * Main app shell: providers, top bar, day view, modals, toasts.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationBar } from 'expo-navigation-bar';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/themeContext';
import {
  Welcome,
  About,
  ToastStack,
  AppHeader,
  AppFooter,
  Fab,
  DeleteConfirm,
} from './src/shell';
import { DayTabs, SessionList, CourseDetailSheet } from './src/TimetableScreen';
import { CourseFormSheet } from './src/CourseFormSheet';
import { ExportPanel } from './src/ExportPanel';
import { Course, Day, nextId, toPersianDigits, totalUnits, timeToMinutes, DAYS } from './src/logic';
import { parseShareLinkHash } from './src/export';
import { useFonts } from 'expo-font';
import { I18nManager } from 'react-native';
import VazirmatnRegular from './assets/fonts/VazirmatnRegular.ttf';
import VazirmatnMedium from './assets/fonts/VazirmatnMedium.ttf';
import VazirmatnBold from './assets/fonts/VazirmatnBold.ttf';
import VazirmatnBlack from './assets/fonts/VazirmatnBlack.ttf';

// Ensure RTL is on (safe to set when already applied; requires restart if changed)
if (!I18nManager.isRTL && !__DEV__) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} else {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

function Shell() {
  const store = useStore();
  const { p, mode, font, radius, toggle } = useTheme();
  const { courses, selectedCourseId, hydrated, unitsCap } = store;

  const [showWelcome, setShowWelcome] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: 'success' | 'error' | 'info' }[]>([]);
  const toastId = useRef(1);
  // Default to today's weekday (Jalali) so the list shows relevant sessions on open.
  const [selectedDay, setSelectedDay] = useState<Day>(() => DAYS[todayJalaliIndex()] ?? DAYS[0]);

  const toast = useCallback((message: string, kind: 'success' | 'error' | 'info' = 'info') => {
    const id = toastId.current++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (!store.welcomeSeen) setShowWelcome(true);

      // On web, detect if the page was opened with a shared schedule link hash (#...)
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash && hash.length > 2) {
            const imported = parseShareLinkHash(hash);
            if (imported && imported.length > 0) {
              store.replaceCourses(imported);
              toast(`${toPersianDigits(imported.length)} درس از لینک اشتراک بارگذاری شد`, 'success');
              if (window.history?.replaceState) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            }
          }
        }
      } catch {}
    }
  }, [hydrated]);

  // Sync Android navigation bar button style with theme (declarative component in SDK 57).
  // NOTE: expo-navigation-bar sets button style only — the bar *background*
  // follows the window background via the expo-navigation-bar config plugin
  // (backgroundColor in app.json). Edge-to-edge is not overridden in JS.
  const navBarStyle = mode === 'dark' ? 'light' : 'dark';

  const editing = useMemo(() => courses.find((c) => c.id === selectedCourseId) ?? null, [courses, selectedCourseId]);

  const openAdd = () => {
    store.setSelectedCourseId(null);
    setShowForm(true);
  };

  const handleSave = (draft: Omit<Course, 'id'>) => {
    if (editing) {
      store.updateCourse({ ...draft, id: editing.id });
      toast('تغییرات ذخیره شد', 'success');
      store.setSelectedCourseId(null);
    } else {
      store.addCourse({ ...draft, id: nextId(courses) });
      toast('درس اضافه شد', 'success');
    }
  };

  const handleCancelEdit = () => {
    store.setSelectedCourseId(null);
    setShowForm(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      store.deleteCourse(deleteTarget.id);
      toast('درس حذف شد', 'success');
      setDeleteTarget(null);
      store.setSelectedCourseId(null);
    }
  };

  const outerBg = mode === 'dark' ? '#070A13' : '#F0F4F8';

  return (
    <View style={[styles.viewport, { backgroundColor: outerBg }]}>
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: p.bg,
            borderColor: p.borderSoft,
            ...(Platform.OS === 'web'
              ? ({
                  boxShadow:
                    mode === 'dark'
                      ? '0 0 35px rgba(0, 0, 0, 0.45)'
                      : '0 0 25px rgba(0, 0, 0, 0.08)',
                } as any)
              : {}),
          },
        ]}
      >
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={p.bg} />
        <NavigationBar style={navBarStyle} />
        <AppHeader
          onToggleTheme={toggle}
          onOpenExport={() => setShowExport(true)}
          onOpenAbout={() => setShowAbout(true)}
        />
        <StatsRow />
        <DayTabs selected={selectedDay} onSelect={setSelectedDay} />
        <View style={{ flex: 1, position: 'relative' }}>
          <SessionList day={selectedDay} onOpenCourse={(id) => store.setSelectedCourseId(id)} />
          <Fab onPress={openAdd} />
        </View>

        <AppFooter />

        <CourseDetailSheet
          courseId={selectedCourseId}
          onClose={() => store.setSelectedCourseId(null)}
          onEdit={(c) => {
            store.setSelectedCourseId(c.id);
            setShowForm(true);
          }}
          onDelete={(c) => setDeleteTarget(c)}
        />

        <CourseFormSheet
          visible={showForm}
          editing={editing}
          courses={courses}
          unitsCap={unitsCap}
          onClose={() => {
            setShowForm(false);
            if (store.selectedCourseId != null) store.setSelectedCourseId(null);
          }}
          onSave={handleSave}
          onCancelEdit={handleCancelEdit}
          toast={toast}
        />

        <ExportPanel
          visible={showExport}
          onClose={() => setShowExport(false)}
          toast={toast}
        />

        <DeleteConfirm
          visible={!!deleteTarget}
          courseName={deleteTarget?.name ?? ''}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        <Welcome visible={showWelcome} onDone={() => { setShowWelcome(false); store.setWelcomeSeen(true); }} />
        <About visible={showAbout} onClose={() => setShowAbout(false)} />
        <ToastStack toasts={toasts} />
      </SafeAreaView>
    </View>
  );
}

function todayJalaliIndex(): number {
  const d = new Date().getDay(); // 0=Sun..6=Sat
  // Persian week starts Saturday. DAYS = [شنبه..پنجشنبه], no Friday tab —
  // Friday has no classes, so fall back to Saturday (index 0).
  if (d === 5) return 0; // Friday -> Saturday
  return (d + 1) % 7; // Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5
}

function StatsRow() {
  const { courses, unitsCap } = useStore();
  const { p, font, radius } = useTheme();
  const units = totalUnits(courses);
  const over = unitsCap > 0 && units > unitsCap;

  // Weekly minutes per day -> mini bar chart
  const dayMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of courses) {
      for (const s of c.sessions) {
        const start = timeToMinutes(s.start);
        const end = timeToMinutes(s.end);
        if (start != null && end != null) map[s.day] = (map[s.day] ?? 0) + (end - start);
      }
    }
    return DAYS.map((d) => Math.round((map[d] ?? 0) / 60));
  }, [courses]);
  const maxHours = Math.max(1, ...dayMinutes);

  return (
    <LinearGradient
      colors={[p.primary + '26', p.accent + '1A', p.bg2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statsCard}
    >
      <View style={styles.statsTop}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontFamily: font.black, color: p.text }]}>
            {toPersianDigits(courses.length)}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: font.regular, color: p.textDim }]}>درس</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: p.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontFamily: font.black, color: over ? p.danger : p.primary }]}>
            {toPersianDigits(units)}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: font.regular, color: p.textDim }]}>
            واحد{over ? ' • بیش از سقف' : ''}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: p.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { fontFamily: font.black, color: p.text }]}>
            {toPersianDigits(dayMinutes.reduce((a, b) => a + b, 0))}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: font.regular, color: p.textDim }]}>ساعت در هفته</Text>
        </View>
      </View>

      {courses.length > 0 ? (
        <View style={[styles.barsRow, { borderTopColor: p.borderSoft, borderTopWidth: 1 }]}>
          {dayMinutes.map((h, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={{
                    width: '100%',
                    height: `${Math.max(6, (h / maxHours) * 100)}%`,
                    backgroundColor: h > 0 ? p.primary : p.border,
                    borderRadius: 4,
                    minHeight: 3,
                  }}
                />
              </View>
              <Text style={[styles.barDay, { fontFamily: font.regular, color: h > 0 ? p.textDim : p.textFaint }]}>
                {DAYS[i]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </LinearGradient>
  );
}

function AppRoot() {
  const [fontsLoaded] = useFonts({
    Vazirmatn: VazirmatnRegular,
    VazirmatnMedium: VazirmatnMedium,
    VazirmatnBold: VazirmatnBold,
    VazirmatnBlack: VazirmatnBlack,
  });

  // Web: RN-web ignores I18nManager, so set document direction/lang explicitly.
  // Native: I18nManager.forceRTL(true) above already handles it.
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const doc = (globalThis as any).document;
        if (doc?.documentElement) {
          doc.documentElement.dir = 'rtl';
          doc.documentElement.lang = 'fa';
        }
      } catch {}
    }
  }, []);

  // Boot gate lives outside the font hook so the gradient splash brands
  // the screen immediately — no white flash while fonts download.
  // useTheme needs ThemeProvider, so Shell mounts only when fonts are ready;
  // BootSplash reads the persisted/OS theme straight from the store instead.
  return (
    <StoreProvider>
      <ThemeProvider>
        <BootGate fontsLoaded={fontsLoaded} />
      </ThemeProvider>
    </StoreProvider>
  );
}

// Shows the branded splash until fonts AND persisted state are ready,
// then swaps in the real Shell exactly once.
function BootGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { hydrated } = useStore();
  const ready = fontsLoaded && hydrated;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setShown(true), 350);
      return () => clearTimeout(t);
    }
  }, [ready]);
  if (!shown) return <BootSplash />;
  return <Shell />;
}

// Standalone boot splash: no useTheme (fonts may be missing), so it uses
// a fixed deep-navy brand look with a system font.
function BootSplash() {
  return (
    <View style={[styles.viewport, { backgroundColor: '#070A13' }]}>
      <View
        style={[
          styles.root,
          {
            backgroundColor: '#0B1224',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: 'rgba(255,255,255,0.06)',
          },
        ]}
      >
        <Text style={{ fontSize: 34, fontWeight: '800', color: '#EDF2FB' }}>جداول</Text>
        <Text style={{ fontSize: 14, color: '#93A4C6', marginTop: 8 }}>برنامه‌ساز هفتگی دانشجو</Text>
      </View>
    </View>
  );
}

export default function App() {
  return <AppRoot />;
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    height: '100%',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    position: 'relative',
    overflow: 'hidden',
  },
  statsCard: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statsTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, alignSelf: 'stretch', marginVertical: 4 },
  barsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barCol: { flex: 1, alignItems: 'center', gap: 5 },
  barTrack: { width: '70%', height: 44, justifyContent: 'flex-end', alignItems: 'center' },
  barDay: { fontSize: 9 },
});
