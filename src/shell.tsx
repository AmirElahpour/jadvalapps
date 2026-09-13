/**
 * Shell v2 — gradient RTL header, glowing FAB, glass toasts, footer.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './themeContext';
import { ModalSheet, GhostButton } from './components';
import {
  IconSun,
  IconMoon,
  IconShare,
  IconInfo,
  IconPlus,
  IconTrash,
  IconAlert,
  IconCalendar,
} from './icons';

// ---------- Top bar (RTL: brand right, controls left) ----------

export function AppHeader({
  onToggleTheme,
  onOpenExport,
  onOpenAbout,
}: {
  onToggleTheme: () => void;
  onOpenExport: () => void;
  onOpenAbout: () => void;
}) {
  const { p, mode, font, radius } = useTheme();
  return (
    <LinearGradient
      colors={p.headerGrad}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.header, { borderBottomColor: p.borderSoft }]}
    >
      {/* Brand — sits at the RIGHT edge in RTL */}
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: p.primary + '22', borderColor: p.primary + '55' }]}>
          <IconCalendar size={19} color={p.primary} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={{ fontFamily: font.black, fontSize: 19, color: p.text }}>جداول</Text>
          <Text style={{ fontFamily: font.regular, fontSize: 10, color: p.textFaint, marginTop: 0 }}>
            برنامه هفتگی کلاس‌ها
          </Text>
        </View>
      </View>

      {/* Controls — sit at the LEFT edge in RTL */}
      <View style={styles.btns}>
        <HeaderBtn onPress={onOpenAbout} a11y="درباره">
          <IconInfo size={19} color={p.textDim} />
        </HeaderBtn>
        <HeaderBtn onPress={onToggleTheme} a11y="تغییر تم">
          {mode === 'dark' ? <IconSun size={19} color={p.textDim} /> : <IconMoon size={19} color={p.textDim} />}
        </HeaderBtn>
        <HeaderBtn onPress={onOpenExport} a11y="خروجی و اشتراک" primary>
          <IconShare size={18} color={p.primaryText} />
        </HeaderBtn>
      </View>
    </LinearGradient>
  );
}

function HeaderBtn({
  children,
  onPress,
  a11y,
  primary,
}: {
  children: React.ReactNode;
  onPress: () => void;
  a11y: string;
  primary?: boolean;
}) {
  const { p, radius, mode } = useTheme();
  if (primary) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={a11y}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <LinearGradient
          colors={mode === 'dark' ? [...p.fabGrad] : ['#0891B2', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hbtnPrimary, { borderRadius: radius.md }]}
        >
          {children}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.hbtn,
        { borderRadius: radius.md, borderColor: pressed ? p.border : p.borderSoft, backgroundColor: pressed ? p.surface : 'transparent' },
      ]}
    >
      {children}
    </Pressable>
  );
}

// ---------- FAB with gradient + glow ----------

export function Fab({ onPress }: { onPress: () => void }) {
  const { p, font, radius } = useTheme();
  return (
    <View style={styles.fabGlow}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <LinearGradient
          colors={p.fabGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fab, { borderRadius: radius.xxl }]}
        >
          <IconPlus size={20} color={p.primaryText} strokeWidth={2.4} />
          <Text style={{ fontFamily: font.bold, fontSize: 14, color: p.primaryText, marginStart: 7 }}>
            درس جدید
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ---------- Glass toasts ----------

export function ToastStack({
  toasts,
}: {
  toasts: { id: number; message: string; kind: 'success' | 'error' | 'info' }[];
}) {
  const { p, font, radius } = useTheme();
  return (
    <View style={styles.toastWrap} pointerEvents="none">
      {toasts.map((t) => {
        const c = t.kind === 'success' ? p.success : t.kind === 'error' ? p.danger : p.primary;
        return (
          <View key={t.id} style={[styles.toast, { borderStartColor: c, backgroundColor: p.surfaceGlass, borderRadius: radius.md }]}>
            <View style={[styles.toastDot, { backgroundColor: c }]} />
            <Text style={{ fontFamily: font.medium, fontSize: 13, color: p.text, textAlign: 'right', flex: 1 }}>
              {t.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------- Delete confirmation ----------

export function DeleteConfirm({
  visible,
  courseName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  courseName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { p, font, radius } = useTheme();
  return (
    <ModalSheet visible={visible} onClose={onCancel} title="حذف درس">
      <View style={styles.delBody}>
        <LinearGradient colors={[p.danger + '22', 'transparent']} style={[styles.delIconGlow, { borderRadius: radius.xxl }]}>
          <View style={[styles.delIcon, { backgroundColor: p.danger + '1E', borderRadius: radius.xl }]}>
            <IconAlert size={28} color={p.danger} strokeWidth={2.2} />
          </View>
        </LinearGradient>
        <Text style={{ fontFamily: font.bold, fontSize: 16, color: p.text, marginTop: 14, textAlign: 'center' }}>
          «{courseName}» حذف شود؟
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 13, color: p.textDim, marginTop: 6, textAlign: 'center' }}>
          این عمل قابل بازگشت نیست
        </Text>
        <View style={styles.delActions}>
          <GhostButton label="انصراف" onPress={onCancel} />
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.delBtn,
              { backgroundColor: p.danger, borderRadius: radius.md, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <IconTrash size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={{ fontFamily: font.bold, fontSize: 14, color: '#FFFFFF', marginStart: 6 }}>حذف</Text>
          </Pressable>
        </View>
      </View>
    </ModalSheet>
  );
}

// ---------- Footer ----------

export function AppFooter() {
  const { p, font } = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: p.borderSoft }]}>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: p.textFaint }}>
        جداول · همه داده‌ها روی دستگاه شما می‌ماند
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', // RTL: first child = right
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btns: { flexDirection: 'row', gap: 6 },
  hbtn: { padding: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hbtnPrimary: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891B2',
  },
  fabGlow: {
    position: 'absolute',
    bottom: 26,
    start: 20,
    shadowColor: '#22D3EE',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
    borderRadius: 28,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toastWrap: { position: 'absolute', top: 96, start: 14, end: 14, gap: 8, zIndex: 60 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderStartWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastDot: { width: 8, height: 8, borderRadius: 4 },
  delBody: { alignItems: 'center', paddingVertical: 8 },
  delIconGlow: { padding: 8 },
  delIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  delActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  delBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12 },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    borderTopWidth: 1,
  },
});

// Re-exports from Overlays for the shell API
export { SplashScreen as Splash, WelcomeModal as Welcome, AboutModal as About } from './Overlays';
