/**
 * Privacy Policy page for Daymark mobile app
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

export default function PrivacyPolicyScreen() {
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
                    title: 'Privacy Policy',
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
                    At {APP_NAME}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application and related services. Please read this policy carefully to understand our practices regarding your personal data.
                </Paragraph>

                <Section title="1. Information We Collect">
                    <Text style={[styles.subTitle, { color: colors.text }]}>Personal Information</Text>
                    <Paragraph>
                        When you create an account or use our services, we may collect the following information:
                    </Paragraph>
                    <BulletList items={[
                        'Name and email address',
                        'Account credentials (encrypted)',
                        'Profile information you choose to provide',
                        'Payment information (processed securely through third-party providers)',
                    ]} />

                    <Text style={[styles.subTitle, { color: colors.text }]}>Usage Data</Text>
                    <Paragraph>
                        We automatically collect certain information about how you interact with our services:
                    </Paragraph>
                    <BulletList items={[
                        'Device information (type, operating system, browser type)',
                        'Log data (IP address, access times, pages viewed)',
                        'Usage patterns and preferences within the application',
                        'Performance and error data to improve our services',
                    ]} />

                    <Text style={[styles.subTitle, { color: colors.text }]}>User Content</Text>
                    <Paragraph>
                        Any tasks, notes, habits, and other content you create within {APP_NAME} is stored to provide you with our services. This data belongs to you and is protected according to this policy.
                    </Paragraph>
                </Section>

                <Section title="2. How We Use Your Information">
                    <Paragraph>
                        We use the information we collect for the following purposes:
                    </Paragraph>
                    <BulletList items={[
                        'To provide, maintain, and improve our services',
                        'To personalize your experience and deliver relevant content',
                        'To process transactions and send related information',
                        'To send administrative information, updates, and security alerts',
                        'To respond to your comments, questions, and support requests',
                        'To analyze usage patterns and improve our product',
                        'To detect, prevent, and address technical issues and security threats',
                        'To comply with legal obligations',
                    ]} />
                </Section>

                <Section title="3. Data Sharing and Disclosure">
                    <Paragraph>
                        We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                    </Paragraph>
                    <BulletList items={[
                        'Service Providers: We work with trusted third-party companies that help us operate our services (e.g., hosting providers, payment processors, analytics services). These providers are bound by contractual obligations to keep your information confidential.',
                        'Legal Requirements: We may disclose your information if required by law, subpoena, or other legal process, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.',
                        'Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.',
                        'With Your Consent: We may share information with third parties when you give us explicit permission to do so.',
                    ]} />
                </Section>

                <Section title="4. Data Security">
                    <Paragraph>
                        We implement appropriate technical and organizational security measures to protect your personal information, including:
                    </Paragraph>
                    <BulletList items={[
                        'Encryption of data in transit and at rest',
                        'Regular security assessments and audits',
                        'Access controls and authentication measures',
                        'Secure data storage infrastructure',
                    ]} />
                    <Paragraph>
                        However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
                    </Paragraph>
                </Section>

                <Section title="5. Data Retention">
                    <Paragraph>
                        We retain your personal information for as long as your account is active or as needed to provide you with our services. If you wish to delete your account, we will delete or anonymize your personal information within a reasonable timeframe, unless we are required to retain it for legal or legitimate business purposes.
                    </Paragraph>
                </Section>

                <Section title="6. Your Rights">
                    <Paragraph>
                        Depending on your location, you may have certain rights regarding your personal information:
                    </Paragraph>
                    <BulletList items={[
                        'Access: Request access to the personal information we hold about you',
                        'Correction: Request correction of inaccurate or incomplete information',
                        'Deletion: Request deletion of your personal information',
                        'Portability: Request a copy of your data in a portable format',
                        'Objection: Object to certain processing of your personal information',
                        'Withdrawal of Consent: Withdraw consent for data processing where consent was the basis',
                    ]} />
                    <Paragraph>
                        To exercise any of these rights, please contact us at{' '}
                        <Text style={[styles.link, { color: colors.accent }]} onPress={handleEmailPress}>
                            {SUPPORT_EMAIL}
                        </Text>.
                    </Paragraph>
                </Section>

                <Section title="7. Cookies and Tracking Technologies">
                    <Paragraph>
                        We use cookies and similar tracking technologies to enhance your experience:
                    </Paragraph>
                    <BulletList items={[
                        'Essential Cookies: Required for the application to function properly',
                        'Analytics Cookies: Help us understand how you use our services',
                        'Preference Cookies: Remember your settings and preferences',
                    ]} />
                    <Paragraph>
                        You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our services.
                    </Paragraph>
                </Section>

                <Section title="8. Third-Party Links">
                    <Paragraph>
                        Our services may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
                    </Paragraph>
                </Section>

                <Section title="9. Children's Privacy">
                    <Paragraph>
                        Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at{' '}
                        <Text style={[styles.link, { color: colors.accent }]} onPress={handleEmailPress}>
                            {SUPPORT_EMAIL}
                        </Text>, and we will take steps to delete such information.
                    </Paragraph>
                </Section>

                <Section title="10. International Data Transfers">
                    <Paragraph>
                        Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to such transfers. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
                    </Paragraph>
                </Section>

                <Section title="11. Changes to This Privacy Policy">
                    <Paragraph>
                        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. We encourage you to review this Privacy Policy periodically for any changes.
                    </Paragraph>
                </Section>

                <Section title="12. Contact Us">
                    <Paragraph>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
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
