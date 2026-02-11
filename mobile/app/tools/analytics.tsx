/**
 * Focus Suite Analytics screen
 * Shows time by quadrant, life area, focus session stats, and weekly decisions
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius, shadows } from '@/constants/Theme';
import { focusSuiteApi } from '@/lib/api';
import { formatDate } from '@/lib/api';

const screenWidth = Dimensions.get('window').width;

type DateRange = 'week' | 'month' | 'quarter';

export default function AnalyticsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [dateRange, setDateRange] = useState<DateRange>('week');
    const [analytics, setAnalytics] = useState<any>(null);
    const [quadrantData, setQuadrantData] = useState<any>(null);
    const [lifeAreaData, setLifeAreaData] = useState<any>(null);
    const [weeklyDecisions, setWeeklyDecisions] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [dateRange]);

    const loadAnalytics = async () => {
        try {
            setIsLoading(true);
            const today = formatDate(new Date());

            // Load analytics based on date range
            const [analyticsData, quadrantDist, lifeAreaDist, decisions] = await Promise.all([
                focusSuiteApi.getAnalytics(today),
                focusSuiteApi.getTimeByQuadrant(today),
                focusSuiteApi.getTimeByLifeArea(today),
                focusSuiteApi.getWeeklyDecisions(today),
            ]);

            setAnalytics(analyticsData);
            setQuadrantData(quadrantDist);
            setLifeAreaData(lifeAreaDist);
            setWeeklyDecisions(decisions);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const quadrantColors = ['#EF4444', '#3B82F6', '#F59E0B', '#6B7280'];
    const quadrantLabels = ['Do First', 'Schedule', 'Delegate', 'Eliminate'];

    const pieData = quadrantData?.distribution
        ? Object.values(quadrantData.distribution).map((value: any, index) => ({
            population: value.minutes || 0,
            color: quadrantColors[index],
            legendFontColor: colors.text,
            name: quadrantLabels[index],
        }))
        : [];

    const barData = lifeAreaData?.distribution
        ? Object.entries(lifeAreaData.distribution).map(([name, value]: [string, any]) => ({
            name: name.length > 8 ? name.substring(0, 8) + '...' : name,
            minutes: value.minutes || 0,
        }))
        : [];

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen
                    options={{
                        title: 'Focus Analytics',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="chevron-back" size={24} color={colors.accent} />
                            </TouchableOpacity>
                        ),
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Focus Analytics',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Date Range Selector */}
                <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Time Range</Text>
                    <View style={styles.rangeSelector}>
                        {(['week', 'month', 'quarter'] as DateRange[]).map((range) => (
                            <TouchableOpacity
                                key={range}
                                style={[
                                    styles.rangeButton,
                                    dateRange === range
                                        ? { backgroundColor: colors.accent }
                                        : { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
                                ]}
                                onPress={() => setDateRange(range)}
                            >
                                <Text
                                    style={[
                                        styles.rangeButtonText,
                                        { color: dateRange === range ? '#fff' : colors.textSecondary },
                                    ]}
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Session Statistics */}
                <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Focus Sessions</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
                                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {analytics?.completedSessions || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
                                <Ionicons name="pause-circle" size={24} color={colors.warning} />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {analytics?.interruptedSessions || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interrupted</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.statIcon, { backgroundColor: colors.accent + '15' }]}>
                                <Ionicons name="time" size={24} color={colors.accent} />
                            </View>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {formatMinutes(analytics?.totalMinutes || 0)}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Focus</Text>
                        </View>
                    </View>
                </View>

                {/* Time by Eisenhower Quadrant */}
                {pieData.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Time by Quadrant</Text>
                        <View style={styles.chartContainer}>
                            <PieChart
                                data={pieData}
                                width={screenWidth - spacing.lg * 3}
                                height={200}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                            />
                        </View>
                        <View style={styles.legendContainer}>
                            {pieData.map((item, index) => (
                                <View key={index} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.legendText, { color: colors.text }]}>
                                        {item.name}: {formatMinutes(item.population)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Time by Life Area */}
                {barData.length > 0 && (
                    <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Time by Life Area</Text>
                        <View style={styles.chartContainer}>
                            <BarChart
                                data={{
                                    labels: barData.map((d) => d.name),
                                    datasets: [{ data: barData.map((d) => Math.round(d.minutes / 60) * 10) / 10 }],
                                }}
                                width={screenWidth - spacing.lg * 3}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => colors.accent,
                                    labelColor: (opacity = 1) => colors.textSecondary,
                                    style: { borderRadius: 16 },
                                }}
                                backgroundColor="transparent"
                                fromZero
                                showValuesOnTopOfBars
                            />
                        </View>
                        <Text style={[styles.chartHint, { color: colors.textTertiary }]}>
                            Hours spent in each life area
                        </Text>
                    </View>
                )}

                {/* Weekly Decisions Summary */}
                {weeklyDecisions && (
                    <View style={[styles.card, { backgroundColor: colors.cardSolid }, shadows.sm]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Decisions</Text>
                        <View style={styles.decisionsSummary}>
                            <View style={styles.decisionStat}>
                                <Ionicons name="book" size={20} color={colors.accent} />
                                <Text style={[styles.decisionValue, { color: colors.text }]}>
                                    {weeklyDecisions.totalDecisions || 0}
                                </Text>
                                <Text style={[styles.decisionLabel, { color: colors.textSecondary }]}>
                                    Total Decisions
                                </Text>
                            </View>
                            <View style={styles.decisionStat}>
                                <Ionicons name="link" size={20} color={colors.success} />
                                <Text style={[styles.decisionValue, { color: colors.text }]}>
                                    {weeklyDecisions.linkedToMatrix || 0}
                                </Text>
                                <Text style={[styles.decisionLabel, { color: colors.textSecondary }]}>
                                    Linked to Matrix
                                </Text>
                            </View>
                            <View style={styles.decisionStat}>
                                <Ionicons name="calendar" size={20} color={colors.warning} />
                                <Text style={[styles.decisionValue, { color: colors.text }]}>
                                    {weeklyDecisions.linkedToBlocks || 0}
                                </Text>
                                <Text style={[styles.decisionLabel, { color: colors.textSecondary }]}>
                                    From Time Blocks
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    card: {
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    cardTitle: {
        ...typography.title3,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    rangeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rangeButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        alignItems: 'center',
        borderWidth: 1,
    },
    rangeButtonText: {
        ...typography.body,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: 'rgba(139, 92, 246, 0.05)',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    statValue: {
        ...typography.title2,
        fontWeight: '700',
    },
    statLabel: {
        ...typography.caption2,
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        width: '45%',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        ...typography.caption1,
    },
    chartHint: {
        ...typography.caption2,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    decisionsSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    decisionStat: {
        alignItems: 'center',
    },
    decisionValue: {
        ...typography.title2,
        fontWeight: '600',
        marginTop: spacing.sm,
    },
    decisionLabel: {
        ...typography.caption1,
        marginTop: 2,
    },
});
