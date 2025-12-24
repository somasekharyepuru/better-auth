"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/config/app.constants";
import { Logo } from "@/components/ui/logo";

export default function PrivacyPolicyPage() {
    const effectiveDate = "December 24, 2024";
    const supportEmail = "somasekharyepuru@gmail.com";

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/">
                            <Logo size="sm" />
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                            >
                                {APP_CONFIG.navigation.login}
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                {APP_CONFIG.navigation.signup}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-500 mb-12">
                        Effective Date: {effectiveDate}
                    </p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        {/* Introduction */}
                        <section>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                At {APP_CONFIG.name}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our productivity application and related services. Please read this policy carefully to understand our practices regarding your personal data.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Personal Information</h3>
                            <p className="text-gray-600 mb-4">
                                When you create an account or use our services, we may collect the following information:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                <li>Name and email address</li>
                                <li>Account credentials (encrypted)</li>
                                <li>Profile information you choose to provide</li>
                                <li>Payment information (processed securely through third-party providers)</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Usage Data</h3>
                            <p className="text-gray-600 mb-4">
                                We automatically collect certain information about how you interact with our services:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                <li>Device information (type, operating system, browser type)</li>
                                <li>Log data (IP address, access times, pages viewed)</li>
                                <li>Usage patterns and preferences within the application</li>
                                <li>Performance and error data to improve our services</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">User Content</h3>
                            <p className="text-gray-600">
                                Any tasks, notes, habits, and other content you create within {APP_CONFIG.name} is stored to provide you with our services. This data belongs to you and is protected according to this policy.
                            </p>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                            <p className="text-gray-600 mb-4">
                                We use the information we collect for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>To provide, maintain, and improve our services</li>
                                <li>To personalize your experience and deliver relevant content</li>
                                <li>To process transactions and send related information</li>
                                <li>To send administrative information, updates, and security alerts</li>
                                <li>To respond to your comments, questions, and support requests</li>
                                <li>To analyze usage patterns and improve our product</li>
                                <li>To detect, prevent, and address technical issues and security threats</li>
                                <li>To comply with legal obligations</li>
                            </ul>
                        </section>

                        {/* Data Sharing and Disclosure */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
                            <p className="text-gray-600 mb-4">
                                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Service Providers:</strong> We work with trusted third-party companies that help us operate our services (e.g., hosting providers, payment processors, analytics services). These providers are bound by contractual obligations to keep your information confidential.</li>
                                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, subpoena, or other legal process, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
                                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                                <li><strong>With Your Consent:</strong> We may share information with third parties when you give us explicit permission to do so.</li>
                            </ul>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                            <p className="text-gray-600 mb-4">
                                We implement appropriate technical and organizational security measures to protect your personal information, including:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Regular security assessments and audits</li>
                                <li>Access controls and authentication measures</li>
                                <li>Secure data storage infrastructure</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
                            <p className="text-gray-600">
                                We retain your personal information for as long as your account is active or as needed to provide you with our services. If you wish to delete your account, we will delete or anonymize your personal information within a reasonable timeframe, unless we are required to retain it for legal or legitimate business purposes.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
                            <p className="text-gray-600 mb-4">
                                Depending on your location, you may have certain rights regarding your personal information:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                                <li><strong>Objection:</strong> Object to certain processing of your personal information</li>
                                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where consent was the basis</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                To exercise any of these rights, please contact us at{" "}
                                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                                    {supportEmail}
                                </a>.
                            </p>
                        </section>

                        {/* Cookies and Tracking */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
                            <p className="text-gray-600 mb-4">
                                We use cookies and similar tracking technologies to enhance your experience:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Essential Cookies:</strong> Required for the application to function properly</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how you use our services</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                You can manage cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our services.
                            </p>
                        </section>

                        {/* Third-Party Links */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Links</h2>
                            <p className="text-gray-600">
                                Our services may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
                            <p className="text-gray-600">
                                Our services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at{" "}
                                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                                    {supportEmail}
                                </a>, and we will take steps to delete such information.
                            </p>
                        </section>

                        {/* International Data Transfers */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
                            <p className="text-gray-600">
                                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to such transfers. We take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
                            </p>
                        </section>

                        {/* Changes to This Policy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
                            <p className="text-gray-600">
                                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. We encourage you to review this Privacy Policy periodically for any changes.
                            </p>
                        </section>

                        {/* Contact Us */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
                            <p className="text-gray-600 mb-4">
                                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                            </p>
                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="text-gray-900 font-medium mb-2">{APP_CONFIG.name} Support</p>
                                <p className="text-gray-600">
                                    Email:{" "}
                                    <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                                        {supportEmail}
                                    </a>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-100">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <Logo size="sm" />
                            <span className="text-gray-400 text-sm">
                                {APP_CONFIG.footer.tagline}
                            </span>
                        </div>

                        <div className="flex items-center gap-8">
                            {APP_CONFIG.footer.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <span className="text-gray-400 text-sm">
                                {APP_CONFIG.footer.copyright} {APP_CONFIG.name}
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
