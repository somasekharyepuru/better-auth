/**
 * Terms of Service page for Daymark mobile app
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { typography, spacing, radius } from '@/constants/Theme';

const APP_NAME = 'Daymark';
const EFFECTIVE_DATE = 'December 24, 2024';
const SUPPORT_EMAIL = 'somasekharyepuru@gmail.com';

export default function TermsOfServiceScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const handleEmailPress = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {children}
        </View>
    );

    const Paragraph = ({ children }: { children: React.ReactNode }) => (
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{children}</Text>
    );

    const BulletList = ({ items }: { items: string[] }) => (
        <View style={styles.bulletList}>
            {items.map((item, index) => (
                <View key={index} style={styles.bulletItem}>
                    <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Terms of Service',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <Ionicons name="chevron-back" size={24} color={colors.accent} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.date, { color: colors.textTertiary }]}>
                    Effective Date: {EFFECTIVE_DATE}
                </Text>

                <Paragraph>
                    Welcome to {APP_NAME}. These Terms of Service ("Terms") govern your access to and use of our productivity application, website, and related services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
                </Paragraph>

                <Section title="1. Acceptance of Terms">
                    <Paragraph>
                        By creating an account or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 13 years old to use our Services. If you are under 18, you represent that you have your parent's or legal guardian's permission to use the Services.
                    </Paragraph>
                </Section>

                <Section title="2. Description of Services">
                    <Paragraph>
                        {APP_NAME} is a productivity application designed to help you:
                    </Paragraph>
                    <BulletList items={[
                        'Plan and manage your daily tasks',
                        'Capture and organize notes',
                        'Track habits and build positive routines',
                        'Maintain focus and improve productivity',
                        'Reflect on your progress and achievements',
                    ]} />
                    <Paragraph>
                        We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice.
                    </Paragraph>
                </Section>

                <Section title="3. User Accounts">
                    <Text style={[styles.subTitle, { color: colors.text }]}>Account Registration</Text>
                    <Paragraph>
                        To access certain features, you must create an account. You agree to:
                    </Paragraph>
                    <BulletList items={[
                        'Provide accurate, current, and complete information during registration',
                        'Maintain and promptly update your account information',
                        'Keep your password secure and confidential',
                        'Notify us immediately of any unauthorized access to your account',
                    ]} />

                    <Text style={[styles.subTitle, { color: colors.text }]}>Account Responsibility</Text>
                    <Paragraph>
                        You are responsible for all activities that occur under your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
                    </Paragraph>
                </Section>

                <Section title="4. Acceptable Use">
                    <Paragraph>
                        You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:
                    </Paragraph>
                    <BulletList items={[
                        'Violate any applicable laws, regulations, or third-party rights',
                        'Use the Services to transmit harmful, offensive, or illegal content',
                        'Attempt to gain unauthorized access to our systems or other users\' accounts',
                        'Interfere with or disrupt the integrity or performance of the Services',
                        'Use automated systems (bots, scrapers) to access the Services without permission',
                        'Reverse engineer, decompile, or attempt to extract the source code of our software',
                        'Use the Services to send spam, chain letters, or unsolicited communications',
                        'Impersonate any person or entity or misrepresent your affiliation',
                    ]} />
                </Section>

                <Section title="5. User Content">
                    <Text style={[styles.subTitle, { color: colors.text }]}>Ownership</Text>
                    <Paragraph>
                        You retain ownership of all content you create, upload, or store through our Services ("User Content"). By using the Services, you grant us a limited license to host, store, and display your User Content solely for the purpose of providing the Services to you.
                    </Paragraph>

                    <Text style={[styles.subTitle, { color: colors.text }]}>Your Responsibilities</Text>
                    <Paragraph>
                        You are solely responsible for your User Content. You represent and warrant that you have all necessary rights to your User Content and that it does not violate any laws or infringe upon the rights of any third party.
                    </Paragraph>
                </Section>

                <Section title="6. Intellectual Property">
                    <Paragraph>
                        The Services, including all content, features, and functionality (excluding User Content), are owned by {APP_NAME} and are protected by copyright, trademark, and other intellectual property laws.
                    </Paragraph>
                    <Paragraph>
                        You may not copy, modify, distribute, sell, or lease any part of our Services or software without our prior written consent. The {APP_NAME} name, logo, and all related marks are trademarks of {APP_NAME}.
                    </Paragraph>
                </Section>

                <Section title="7. Payment Terms">
                    <Text style={[styles.subTitle, { color: colors.text }]}>Subscription Services</Text>
                    <Paragraph>
                        Some features of {APP_NAME} may require a paid subscription. By subscribing:
                    </Paragraph>
                    <BulletList items={[
                        'You authorize us to charge your payment method on a recurring basis',
                        'Subscriptions automatically renew unless cancelled before the renewal date',
                        'You are responsible for all charges incurred under your account',
                    ]} />

                    <Text style={[styles.subTitle, { color: colors.text }]}>Refunds</Text>
                    <Paragraph>
                        Payments are generally non-refundable. However, we may provide refunds at our sole discretion. If you have questions about refunds, please contact us at{' '}
                        <Text style={[styles.link, { color: colors.accent }]} onPress={handleEmailPress}>
                            {SUPPORT_EMAIL}
                        </Text>.
                    </Paragraph>
                </Section>

                <Section title="8. Termination">
                    <Paragraph>
                        We may suspend or terminate your access to the Services at any time, with or without cause or notice, including if we reasonably believe:
                    </Paragraph>
                    <BulletList items={[
                        'You have violated these Terms',
                        'Your use poses a security risk to the Services or other users',
                        'Your use may subject us to legal liability',
                    ]} />
                    <Paragraph>
                        You may terminate your account at any time by contacting us at{' '}
                        <Text style={[styles.link, { color: colors.accent }]} onPress={handleEmailPress}>
                            {SUPPORT_EMAIL}
                        </Text>. Upon termination, your right to use the Services will immediately cease.
                    </Paragraph>
                </Section>

                <Section title="9. Disclaimers">
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                    </Text>
                    <BulletList items={[
                        'IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT',
                        'WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE',
                        'WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY INFORMATION OBTAINED THROUGH THE SERVICES',
                    ]} />
                    <Paragraph>
                        We do not warrant that the Services will meet your specific requirements or expectations.
                    </Paragraph>
                </Section>

                <Section title="10. Limitation of Liability">
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                    </Text>
                    <BulletList items={[
                        'ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES',
                        'LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES',
                        'DAMAGES RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICES',
                        'DAMAGES RESULTING FROM ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS OR YOUR PERSONAL INFORMATION',
                    ]} />
                    <Paragraph>
                        Our total liability for any claims arising from or related to the Services shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
                    </Paragraph>
                </Section>

                <Section title="11. Indemnification">
                    <Paragraph>
                        You agree to indemnify, defend, and hold harmless {APP_NAME}, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Services, your User Content, or your violation of these Terms.
                    </Paragraph>
                </Section>

                <Section title="12. Governing Law and Dispute Resolution">
                    <Paragraph>
                        These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                    </Paragraph>
                    <Paragraph>
                        Any disputes arising from these Terms or your use of the Services shall first be attempted to be resolved through good-faith negotiations. If the dispute cannot be resolved amicably, it shall be submitted to binding arbitration in accordance with applicable arbitration rules.
                    </Paragraph>
                </Section>

                <Section title="13. Modifications to Terms">
                    <Paragraph>
                        We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website and updating the "Effective Date." Your continued use of the Services after such changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.
                    </Paragraph>
                </Section>

                <Section title="14. Severability">
                    <Paragraph>
                        If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.
                    </Paragraph>
                </Section>

                <Section title="15. Entire Agreement">
                    <Paragraph>
                        These Terms, together with our Privacy Policy, constitute the entire agreement between you and {APP_NAME} regarding your use of the Services and supersede all prior agreements, understandings, and communications.
                    </Paragraph>
                </Section>

                <Section title="16. Contact Us">
                    <Paragraph>
                        If you have any questions, concerns, or feedback about these Terms of Service, please contact us at:
                    </Paragraph>
                    <View style={[styles.contactCard, { backgroundColor: colors.cardSolid }]}>
                        <Text style={[styles.contactTitle, { color: colors.text }]}>{APP_NAME} Support</Text>
                        <TouchableOpacity onPress={handleEmailPress}>
                            <Text style={[styles.contactEmail, { color: colors.accent }]}>
                                {SUPPORT_EMAIL}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    date: {
        ...typography.caption1,
        marginBottom: spacing.lg,
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        ...typography.title3,
        marginBottom: spacing.md,
    },
    subTitle: {
        ...typography.headline,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    paragraph: {
        ...typography.body,
        lineHeight: 24,
        marginBottom: spacing.sm,
    },
    disclaimer: {
        ...typography.caption1,
        fontWeight: '500',
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    bulletList: {
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    bullet: {
        ...typography.body,
        width: 20,
    },
    bulletText: {
        ...typography.body,
        flex: 1,
        lineHeight: 22,
    },
    link: {
        textDecorationLine: 'underline',
    },
    contactCard: {
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    contactTitle: {
        ...typography.headline,
        marginBottom: spacing.xs,
    },
    contactEmail: {
        ...typography.body,
    },
});
