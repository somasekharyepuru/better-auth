/**
 * Tooltip component for Daymark mobile app
 * Simple tooltip using Modal for mobile
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

interface TooltipProps {
    content: string;
    children: React.ReactElement;
    position?: 'top' | 'bottom';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const childRef = useRef<View>(null);

    const handleShow = () => {
        setIsVisible(true);
    };

    const handleHide = () => {
        setIsVisible(false);
    };

    // Clone child and add touch handlers
    const enhancedChild = React.cloneElement(
        children as React.ReactElement<any>,
        {
            onLongPress: handleShow,
        onPress: handleHide,
        ref: childRef as any,
        delayLongPress: 500,
        suppressHighlighting: true,
        activeOpacity: 1,
    }
    );

    return (
        <>
            {enhancedChild}
            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={handleHide}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.tooltip,
                            position === 'top' ? styles.tooltipTop : styles.tooltipBottom,
                        ]}
                    >
                        <Text style={[styles.tooltipText, { color: Colors.light.text }]}>
                            {content}
                        </Text>
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
        paddingHorizontal: spacing.lg,
    },
    tooltip: {
        backgroundColor: Colors.light.cardSolid,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        maxWidth: 200,
    },
    tooltipTop: {
        marginBottom: 40,
    },
    tooltipBottom: {
        marginTop: 40,
    },
    tooltipText: {
        ...typography.caption1,
    },
});
