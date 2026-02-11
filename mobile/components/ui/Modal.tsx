/**
 * Modal component - reusable modal wrapper
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal as RNModal,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadows } from '@/constants/Theme';
import { ThemeColors } from '@/constants/Colors';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
    style?: ViewStyle;
    colors?: ThemeColors;
}

export function Modal({
    visible,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    style,
    colors,
}: ModalProps) {
    const c = colors || { cardSolid: '#FFFFFF', text: '#111827', textSecondary: '#6B7280', modalBackground: 'rgba(0,0,0,0.5)' };

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <View />
                </TouchableOpacity>

                <View
                    style={[
                        styles.content,
                        SIZE_STYLES[size],
                        { backgroundColor: c.cardSolid },
                        style,
                    ]}
                >
                    {(title || showCloseButton) && (
                        <View style={styles.header}>
                            {title && <Text style={[styles.title, { color: c.text }]}>{title}</Text>}
                            {showCloseButton && (
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={c.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.body}>
                        {children}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <View />
                </TouchableOpacity>
            </View>
        </RNModal>
    );
}

interface SIZE_STYLES {
    width: number;
    maxHeight: number;
    borderRadius: number;
}

const SIZE_STYLES: Record<ModalSize, SIZE_STYLES> = {
    sm: {
        width: '85%',
        maxHeight: '60%',
        borderRadius: radius.lg,
    },
    md: {
        width: '90%',
        maxHeight: '70%',
        borderRadius: radius.xl,
    },
    lg: {
        width: '93%',
        maxHeight: '80%',
        borderRadius: radius.xl,
    },
    full: {
        width: '100%',
        maxHeight: '90%',
        borderRadius: 0,
    },
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouch: {
        flex: 1,
        width: '100%',
    },
    content: {
        ...shadows.lg,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        // Body content scrolls internally if needed
    },
});
