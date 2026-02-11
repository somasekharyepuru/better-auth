/**
 * Context Menu component for Daymark mobile app
 * Long-press menu for organizing tasks into life areas
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';

export interface LifeArea {
    id: string;
    name: string;
    color: string;
}

interface ContextMenuProps {
    children: React.ReactNode;
    lifeAreas: LifeArea[];
    currentLifeAreaId: string | null;
    onMove: (targetLifeAreaId: string | null) => void;
    disabled?: boolean;
}

export default function ContextMenu({
    children,
    lifeAreas,
    currentLifeAreaId,
    onMove,
    disabled = false,
}: ContextMenuProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Filter out current life area from options
    const availableLifeAreas = lifeAreas.filter(
        (area) => area.id !== currentLifeAreaId
    );

    // If disabled or no targets, just render children
    if (disabled || availableLifeAreas.length === 0) {
        return <>{children}</>;
    }

    const handleMove = (targetLifeAreaId: string) => {
        setIsVisible(false);
        onMove(targetLifeAreaId);
    };

    return (
        <>
            <View onLongPress={() => setIsVisible(true)}>{children}</View>

            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, shadows.lg]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: Colors.light.text }]}>
                                Move to Life Area
                            </Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Life Area Options */}
                        <ScrollView style={styles.lifeAreaList}>
                            {availableLifeAreas.map((area) => (
                                <TouchableOpacity
                                    key={area.id}
                                    style={[styles.lifeAreaItem, { borderBottomColor: `${area.color}40` }]}
                                    onPress={() => handleMove(area.id)}
                                >
                                    {/* Color Indicator */}
                                    <View
                                        style={[
                                            styles.lifeAreaDot,
                                            { backgroundColor: area.color },
                                        ]}
                                    />
                                    <View style={styles.lifeAreaContent}>
                                        <View style={styles.lifeAreaInfo}>
                                            <Text style={[styles.lifeAreaName, { color: Colors.light.text }]}>
                                                {area.name}
                                            </Text>
                                            <Text style={[styles.lifeAreaHint, { color: Colors.light.textTertiary }]}>
                                                Move all tasks here
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name="chevron-forward"
                                            size={18}
                                            color={Colors.light.textSecondary}
                                        />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: Colors.light.backgroundSecondary }]}
                            onPress={() => setIsVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: Colors.light.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 360,
        borderRadius: radius.lg,
        backgroundColor: Colors.light.cardSolid,
        padding: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalTitle: {
        ...typography.title3,
        fontWeight: '600',
    },
    lifeAreaList: {
        maxHeight: 400,
    },
    lifeAreaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    lifeAreaDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.md,
    },
    lifeAreaContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lifeAreaInfo: {
        flex: 1,
    },
    lifeAreaName: {
        ...typography.body,
        fontWeight: '500',
    },
    lifeAreaHint: {
        ...typography.caption2,
        marginTop: spacing.xs,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    cancelButtonText: {
        ...typography.headline,
        fontWeight: '600',
    },
});
