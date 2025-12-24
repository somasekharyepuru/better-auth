"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/config/app.constants";
import { Logo } from "@/components/ui/logo";

export default function TermsOfServicePage() {
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
                        Terms of Service
                    </h1>
                    <p className="text-gray-500 mb-12">
                        Effective Date: {effectiveDate}
                    </p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        {/* Introduction */}
                        <section>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Welcome to {APP_CONFIG.name}. These Terms of Service ("Terms") govern your access to and use of our productivity application, website, and related services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
                            </p>
                        </section>

                        {/* Acceptance of Terms */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                            <p className="text-gray-600 mb-4">
                                By creating an account or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. You must be at least 13 years old to use our Services. If you are under 18, you represent that you have your parent's or legal guardian's permission to use the Services.
                            </p>
                        </section>

                        {/* Description of Services */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Services</h2>
                            <p className="text-gray-600 mb-4">
                                {APP_CONFIG.name} is a productivity application designed to help you:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Plan and manage your daily tasks</li>
                                <li>Capture and organize notes</li>
                                <li>Track habits and build positive routines</li>
                                <li>Maintain focus and improve productivity</li>
                                <li>Reflect on your progress and achievements</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice.
                            </p>
                        </section>

                        {/* User Accounts */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Account Registration</h3>
                            <p className="text-gray-600 mb-4">
                                To access certain features, you must create an account. You agree to:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                <li>Provide accurate, current, and complete information during registration</li>
                                <li>Maintain and promptly update your account information</li>
                                <li>Keep your password secure and confidential</li>
                                <li>Notify us immediately of any unauthorized access to your account</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Account Responsibility</h3>
                            <p className="text-gray-600">
                                You are responsible for all activities that occur under your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
                            </p>
                        </section>

                        {/* Acceptable Use */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                            <p className="text-gray-600 mb-4">
                                You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Violate any applicable laws, regulations, or third-party rights</li>
                                <li>Use the Services to transmit harmful, offensive, or illegal content</li>
                                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                                <li>Interfere with or disrupt the integrity or performance of the Services</li>
                                <li>Use automated systems (bots, scrapers) to access the Services without permission</li>
                                <li>Reverse engineer, decompile, or attempt to extract the source code of our software</li>
                                <li>Use the Services to send spam, chain letters, or unsolicited communications</li>
                                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                            </ul>
                        </section>

                        {/* User Content */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Content</h2>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Ownership</h3>
                            <p className="text-gray-600 mb-4">
                                You retain ownership of all content you create, upload, or store through our Services ("User Content"). By using the Services, you grant us a limited license to host, store, and display your User Content solely for the purpose of providing the Services to you.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Your Responsibilities</h3>
                            <p className="text-gray-600">
                                You are solely responsible for your User Content. You represent and warrant that you have all necessary rights to your User Content and that it does not violate any laws or infringe upon the rights of any third party.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
                            <p className="text-gray-600 mb-4">
                                The Services, including all content, features, and functionality (excluding User Content), are owned by {APP_CONFIG.name} and are protected by copyright, trademark, and other intellectual property laws.
                            </p>
                            <p className="text-gray-600">
                                You may not copy, modify, distribute, sell, or lease any part of our Services or software without our prior written consent. The {APP_CONFIG.name} name, logo, and all related marks are trademarks of {APP_CONFIG.name}.
                            </p>
                        </section>

                        {/* Payment Terms */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Payment Terms</h2>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Subscription Services</h3>
                            <p className="text-gray-600 mb-4">
                                Some features of {APP_CONFIG.name} may require a paid subscription. By subscribing:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                                <li>You authorize us to charge your payment method on a recurring basis</li>
                                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                                <li>You are responsible for all charges incurred under your account</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-800 mb-3">Refunds</h3>
                            <p className="text-gray-600">
                                Payments are generally non-refundable. However, we may provide refunds at our sole discretion. If you have questions about refunds, please contact us at{" "}
                                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                                    {supportEmail}
                                </a>.
                            </p>
                        </section>

                        {/* Termination */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
                            <p className="text-gray-600 mb-4">
                                We may suspend or terminate your access to the Services at any time, with or without cause or notice, including if we reasonably believe:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                                <li>You have violated these Terms</li>
                                <li>Your use poses a security risk to the Services or other users</li>
                                <li>Your use may subject us to legal liability</li>
                            </ul>
                            <p className="text-gray-600">
                                You may terminate your account at any time by contacting us at{" "}
                                <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:underline">
                                    {supportEmail}
                                </a>. Upon termination, your right to use the Services will immediately cease.
                            </p>
                        </section>

                        {/* Disclaimers */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
                            <p className="text-gray-600 mb-4 uppercase text-sm font-medium">
                                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                                <li>WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
                                <li>WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY INFORMATION OBTAINED THROUGH THE SERVICES</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                We do not warrant that the Services will meet your specific requirements or expectations.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                            <p className="text-gray-600 mb-4 uppercase text-sm font-medium">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, {APP_CONFIG.name.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                                <li>LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
                                <li>DAMAGES RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE SERVICES</li>
                                <li>DAMAGES RESULTING FROM ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS OR YOUR PERSONAL INFORMATION</li>
                            </ul>
                            <p className="text-gray-600 mt-4">
                                Our total liability for any claims arising from or related to the Services shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
                            </p>
                        </section>

                        {/* Indemnification */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
                            <p className="text-gray-600">
                                You agree to indemnify, defend, and hold harmless {APP_CONFIG.name}, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Services, your User Content, or your violation of these Terms.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
                            <p className="text-gray-600 mb-4">
                                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                            </p>
                            <p className="text-gray-600">
                                Any disputes arising from these Terms or your use of the Services shall first be attempted to be resolved through good-faith negotiations. If the dispute cannot be resolved amicably, it shall be submitted to binding arbitration in accordance with applicable arbitration rules.
                            </p>
                        </section>

                        {/* Modifications */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Modifications to Terms</h2>
                            <p className="text-gray-600">
                                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website and updating the "Effective Date." Your continued use of the Services after such changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.
                            </p>
                        </section>

                        {/* Severability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Severability</h2>
                            <p className="text-gray-600">
                                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.
                            </p>
                        </section>

                        {/* Entire Agreement */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Entire Agreement</h2>
                            <p className="text-gray-600">
                                These Terms, together with our Privacy Policy, constitute the entire agreement between you and {APP_CONFIG.name} regarding your use of the Services and supersede all prior agreements, understandings, and communications.
                            </p>
                        </section>

                        {/* Contact Us */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Us</h2>
                            <p className="text-gray-600 mb-4">
                                If you have any questions, concerns, or feedback about these Terms of Service, please contact us at:
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
