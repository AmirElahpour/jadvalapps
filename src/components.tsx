/**
 * UI primitives: ModalSheet (swipe-to-dismiss), buttons, fields, chips.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  Text,
  View,
  StyleSheet,
  TextInput,
  TextInputProps,
  ActivityIndicator,
  PanResponder,
  Platform,
} from 'react-native';
import { useTheme } from './themeContext';
import { toEnglishDigits } from './logic';
import { LinearGradient } from 'expo-linear-gradient';

const { height: H } = Dimensions.get('window');

// ---------- Modal / bottom sheet ----------

export function ModalSheet({
  visible,
  onClose,
  children,
  title,
  full,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  full?: boolean;
}) {
  const { p, font, radius, shadow } = useTheme();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dx) < g.dy,
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) drag.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 80) onClose();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;

  if (!mounted) return null;
  const startOffset = full ? H : H * 0.3;
  const translateY = Animated.add(
    anim.interpolate({ inputRange: [0, 1], outputRange: [startOffset, 0] }),
    drag
  );

  return (
    <Modal transparent visible pointerEvents="auto" animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: anim, backgroundColor: p.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            full && styles.sheetFull,
            {
              backgroundColor: p.bg2,
              borderColor: p.border,
              borderTopColor: p.border,
              borderRadius: radius.xl,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Draggable slider handle at the top */}
          <View style={styles.handleContainer} {...pan.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: p.border }]} />
          </View>
          {title ? (
            <Text style={[styles.sheetTitle, { fontFamily: font.bold, color: p.text }]}>{title}</Text>
          ) : null}
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ---------- Buttons ----------

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
  icon,
  progress,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  progress?: Animated.Value;
}) {
  const { p, font, radius } = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const start = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
    if (progress) {
      fill.setValue(0);
      Animated.timing(fill, { toValue: 1, duration: 420, useNativeDriver: false }).start();
    }
    onPress();
  };

  const fillW = progress
    ? fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
    : '100%';

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        borderRadius: radius.lg,
        shadowColor: p.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      <Pressable onPress={start} disabled={disabled || busy}>
        <LinearGradient
          colors={disabled ? [p.border, p.border] : [p.primary, p.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, { opacity: busy ? 0.85 : 1, borderRadius: radius.lg, overflow: 'hidden' }]}
        >
          {progress ? (
            <Animated.View
              style={[styles.fillLayer, { width: fillW, backgroundColor: 'rgba(255,255,255,0.28)' }]}
            />
          ) : null}
          {busy ? <ActivityIndicator color={p.primaryText} /> : icon}
          <Text style={[styles.btnLabel, { fontFamily: font.bold, color: p.primaryText }]}>
            {label}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function GhostButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const { p, font } = useTheme();
  const tint = danger ? p.danger : p.textDim;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        {
          borderColor: danger ? p.danger + '88' : p.border,
          backgroundColor: danger ? p.danger + '0D' : p.surfaceAlt,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[styles.ghostLabel, { fontFamily: font.medium, color: tint }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- Text inputs ----------

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  numeric,
  autoFocus,
  required,
  optional,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  numeric?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  optional?: boolean;
}) {
  const { p, font, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = error
    ? p.danger
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [p.border, p.primary],
      });

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [p.surfaceAlt, p.surface],
  });

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <Text
          style={[
            styles.fieldLabel,
            {
              marginBottom: 0,
              fontFamily: font.medium,
              color: error ? p.danger : focused ? p.primary : p.textDim,
            },
          ]}
        >
          {label}
        </Text>
        {required ? (
          <Text style={{ color: p.danger, fontFamily: font.black, fontSize: 16, marginStart: 4, lineHeight: 18 }}>
            *
          </Text>
        ) : null}
      </View>
      <Animated.View
        style={[
          styles.inputWrap,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderRadius: radius.md,
          },
          Platform.OS === 'web'
            ? ({
                boxShadow: error
                  ? `0 0 0 3px ${p.danger}26`
                  : focused
                  ? `0 0 0 3.5px ${p.primary}2E`
                  : 'none',
                transition: 'box-shadow 0.18s ease',
              } as any)
            : {
                shadowColor: error ? p.danger : p.primary,
                shadowOpacity: focused ? 0.18 : 0,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 1 },
                elevation: focused ? 2 : 0,
              },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(numeric ? toEnglishDigits(t) : t)}
          placeholder={placeholder}
          placeholderTextColor={p.textFaint}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={numeric ? 'number-pad' : 'default'}
          style={[
            styles.input,
            {
              fontFamily: font.regular,
              color: p.text,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {},
          ]}
        />
      </Animated.View>
      {error ? (
        <Text style={[styles.errText, { fontFamily: font.medium, color: p.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center', // Centers sheet on wide screens
  },
  sheet: {
    width: '100%',
    maxWidth: 500, // Compact mobile layout on desktop
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: H * 0.88,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  sheetFull: { height: H * 0.94 },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  grabber: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3 },
  sheetTitle: { fontSize: 17, marginBottom: 10, textAlign: 'right' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  fillLayer: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  btnLabel: { fontSize: 15, textAlign: 'center' },
  ghost: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ghostLabel: { fontSize: 14 },
  fieldLabel: { fontSize: 13, marginBottom: 6, textAlign: 'right' },
  inputWrap: {
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    textAlign: 'right',
  },
  errText: { fontSize: 12, marginTop: 5, textAlign: 'right' },
});
