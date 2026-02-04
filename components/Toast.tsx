import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ToastMessage {
  id: number;
  message: string;
}

let toastId = 0;
let showToastFn: ((message: string) => void) | null = null;

export const showToast = (message: string) => {
  if (showToastFn) {
    showToastFn(message);
  } else {
    console.log('[Toast]', message);
  }
};

export default function Toast() {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const animValues = useRef<Map<number, Animated.Value>>(new Map());

  const addToast = useCallback((message: string) => {
    const id = ++toastId;
    const animValue = new Animated.Value(0);
    animValues.current.set(id, animValue);

    setToasts((prev) => [...prev, { id, message }]);

    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      animValues.current.delete(id);
    });
  }, []);

  useEffect(() => {
    showToastFn = addToast;
    return () => {
      showToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => {
        const animValue = animValues.current.get(toast.id);
        return (
          <Animated.View
            key={toast.id}
            style={[
              styles.toast,
              {
                backgroundColor: theme.toastBg,
                borderColor: theme.line,
                opacity: animValue,
                transform: [
                  {
                    translateY: animValue
                      ? animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      : 0,
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.text, { color: theme.text }]}>{toast.message}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
});
