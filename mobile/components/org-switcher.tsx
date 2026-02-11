/**
 * Organization Switcher component for Daymark mobile app
 * Dropdown to switch between organizations
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { authClient, Organization } from '@/lib/auth-client';

interface OrgSwitcherProps {
    currentOrg?: Organization | null;
    onOrgChange?: (org: Organization) => void;
    showCreateNew?: () => void;
}

export default function OrgSwitcher({ currentOrg, onOrgChange, showCreateNew }: OrgSwitcherProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [isVisible, setIsVisible] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const data = await authClient.organization.list();
            setOrganizations(data || []);
        } catch (error) {
            console.error('Failed to load organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrg = (org: Organization) => {
        setIsVisible(false);
        onOrgChange?.(org);
    };

    return (
        <View>
            {/* Trigger Button */}
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: colors.cardSolid }]}
                onPress={() => setIsVisible(true)}
                activeOpacity={0.7}
            >
                <View style={styles.triggerContent}>
                    <View style={[styles.orgIcon, { backgroundColor: colors.accent }]}>
                        <Text style={styles.orgIconText}>
                            {(currentOrg?.name || 'D').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.triggerInfo}>
                        <Text style={[styles.currentOrg, { color: colors.text }]} numberOfLines={1}>
                            {currentOrg?.name || 'Personal'}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modal, { backgroundColor: colors.cardSolid }, shadows.lg]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Switch Organization</Text>
                            <TouchableOpacity onPress={() => setIsVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Loading State */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Loading organizations...
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.orgList}>
                                {/* Personal Option */}
                                <TouchableOpacity
                                    style={[styles.orgItem, !currentOrg && styles.orgItemActive]}
                                    onPress={() => handleSelectOrg({ id: 'personal', name: 'Personal', slug: 'personal' } as Organization)}
                                >
                                    <View style={[styles.itemOrgIcon, { backgroundColor: !currentOrg ? colors.accent : colors.border }]}>
                                        <Text style={[styles.itemIconText, { color: !currentOrg ? '#fff' : colors.textSecondary }]}>
                                            P
                                        </Text>
                                    </View>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, { color: colors.text }]}>Personal Workspace</Text>
                                        <Text style={[styles.itemSlug, { color: colors.textTertiary }]}>
                                            Your personal tasks and settings
                                        </Text>
                                    </View>
                                    {!currentOrg && (
                                        <Ionicons name="checkmark" size={18} color={colors.accent} />
                                    )}
                                </TouchableOpacity>

                                {/* Organization List */}
                                {organizations.map((org) => (
                                    <TouchableOpacity
                                        key={org.id}
                                        style={[styles.orgItem, currentOrg?.id === org.id && styles.orgItemActive]}
                                        onPress={() => handleSelectOrg(org)}
                                    >
                                        <View style={[styles.itemOrgIcon, { backgroundColor: currentOrg?.id === org.id ? colors.accent : colors.border }]}>
                                            <Text style={[styles.itemIconText, { color: currentOrg?.id === org.id ? '#fff' : colors.textSecondary }]}>
                                                {org.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                                                {org.name}
                                            </Text>
                                            <Text style={[styles.itemSlug, { color: colors.textTertiary }]} numberOfLines={1}>
                                                @{org.slug}
                                            </Text>
                                        </View>
                                        {currentOrg?.id === org.id && (
                                            <Ionicons name="checkmark" size={18} color={colors.accent} />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                {/* Create New Option */}
                                {showCreateNew && (
                                    <TouchableOpacity
                                        style={[styles.orgItem, styles.createItem]}
                                        onPress={() => {
                                            setIsVisible(false);
                                            showCreateNew();
                                        }}
                                    >
                                        <View style={[styles.itemOrgIcon, { backgroundColor: colors.accent }]}>
                                            <Ionicons name="add" size={18} color="#fff" />
                                        </View>
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, { color: colors.accent }]}>Create New Organization</Text>
                                            <Text style={[styles.itemSlug, { color: colors.textTertiary }]}>
                                                Set up a new workspace
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orgIcon: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    orgIconText: {
        ...typography.caption2,
        color: '#fff',
        fontWeight: '700',
    },
    triggerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    currentOrg: {
        ...typography.body,
        fontWeight: '500',
        flex: 1,
        marginRight: spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: radius.lg,
        padding: 0,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderColor: Colors.light.border,
    },
    modalTitle: {
        ...typography.title3,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
    },
    orgList: {
        maxHeight: 400,
    },
    orgItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderColor: Colors.light.border,
    },
    orgItemActive: {
        backgroundColor: Colors.light.accent + '08',
    },
    createItem: {
        backgroundColor: Colors.light.accentLight,
    },
    itemOrgIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    itemIconText: {
        ...typography.title3,
        fontWeight: '600',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        ...typography.body,
        fontWeight: '500',
    },
    itemSlug: {
        ...typography.caption1,
    },
});
