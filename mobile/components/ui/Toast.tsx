/**
 * Toast notification component for Daymark mobile app
 * Context-based toast notifications with auto-dismiss
 */

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000; // 5 seconds

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id, duration: toast.duration ?? DEFAULT_DURATION };
        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, newToast.duration);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastContainer() {
    const { toasts } = useToast();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (toasts.length === 0) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </View>
    );
}

function ToastItem({ toast }: { toast: Toast }) {
    const { removeToast } = useToast();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const animatedValue = useState(new Animated.Value(0));

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => {
            setIsVisible(true);
            Animated.timing(animatedValue.current, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const handleRemove = () => {
        setIsLeaving(true);
        Animated.timing(animatedValue.current, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            removeToast(toast.id);
        }, 200);
    };

    const icons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
        success: 'checkmark-circle',
        error: 'alert-circle',
        info: 'information-circle',
        warning: 'warning',
    };

    const typeColors: Record<ToastType, string> = {
        success: colors.success,
        error: colors.error,
        info: colors.accent,
        warning: colors.warning,
    };

    const Icon = icons[toast.type];
    const iconColor = typeColors[toast.type];

    return (
        <Animated.View
            style={[
                styles.toastItem,
                {
                    opacity: animatedValue.current,
                    transform: [{
                        translateY: animatedValue.current.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        }),
                    }],
                },
                isVisible && !isLeaving && styles.toastVisible,
                (isLeaving || !isVisible) && styles.toastHidden,
            ]}
        >
            {/* Icon */}
            <View style={[styles.toastIcon, { backgroundColor: `${iconColor}15` }]}>
                <Ionicons name={Icon} size={24} color={iconColor} />
            </View>

            {/* Content */}
            <View style={styles.toastContent}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {toast.title}
                </Text>
                {toast.description && (
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        {toast.description}
                    </Text>
                )}
            </View>

            {/* Close button */}
            <TouchableOpacity
                onPress={handleRemove}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    toastItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.lg,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    toastVisible: {
        opacity: 1,
        transform: [{ translateY: 0 }],
    },
    toastHidden: {
        opacity: 0,
        transform: [{ translateY: 20 }],
    },
    toastIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    toastContent: {
        flex: 1,
    },
    title: {
        ...typography.body,
        fontWeight: '600',
    },
    description: {
        ...typography.caption1,
        marginTop: spacing.xs,
    },
    closeButton: {
        padding: spacing.xs,
    },
});
