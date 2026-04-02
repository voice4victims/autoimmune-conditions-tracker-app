
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <p className="text-sm text-neutral-500 mt-1">Effective date: April 2, 2026</p>
        </CardHeader>
        <CardContent className="prose max-w-none space-y-6 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">1. Acceptance of Terms</h2>
            <p>
              By creating an account, accessing, or using PANDAS Tracker ("the app"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the app. PANDAS Tracker is published by SPM HealthTech, which is operated by SPM Advisors ("we," "us," or "our").
            </p>
            <p>
              You must be at least 18 years of age and a parent or legal guardian to create an account and use this app. By using the app, you represent and warrant that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">2. Description of Service</h2>
            <p>
              PANDAS Tracker is a health data tracking application designed to help parents and caregivers monitor symptoms, treatments, vital signs, medications, and other health-related information for children diagnosed with or suspected of having PANDAS (Pediatric Autoimmune Neuropsychiatric Disorders Associated with Streptococcal Infections), PANS (Pediatric Acute-onset Neuropsychiatric Syndrome), and related autoimmune conditions.
            </p>
            <p>
              The app provides tools for symptom logging, treatment tracking, medication reminders, data visualization, record storage, and provider communication features. The app may also provide educational content about PANS/PANDAS conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">3. Health Information Disclaimer</h2>
            <p>
              <strong>PANDAS Tracker is not a medical device and does not provide medical advice, diagnosis, or treatment recommendations.</strong> The app is intended solely for personal health tracking and informational purposes.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The information provided by the app, including educational content, symptom tracking data, and trend analyses, is <strong>not a substitute for professional medical advice, diagnosis, or treatment</strong>.</li>
              <li>Always seek the advice of a qualified healthcare provider with any questions you may have regarding your child's medical condition.</li>
              <li>Never disregard professional medical advice or delay seeking it because of information you have read or tracked in this app.</li>
              <li>If your child is experiencing a medical emergency, call your local emergency number immediately.</li>
              <li>Treatment information, supplement recipes, and drug interaction data provided in the app are for informational reference only and should be verified with your child's healthcare provider before acting on them.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">4. User Accounts and Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate and complete information when creating your account.</li>
              <li>Keep your login credentials secure and not share them with unauthorized individuals.</li>
              <li>Notify us immediately at <a href="mailto:security@spmadvisors.net" className="text-primary-600 underline">security@spmadvisors.net</a> if you suspect unauthorized access to your account.</li>
              <li>Ensure that all health data you enter pertains to a child for whom you are the parent or legal guardian.</li>
              <li>Use the Family sharing and Provider access features responsibly, granting access only to trusted individuals.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">5. Acceptable Use Policy</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the app for any unlawful purpose or in violation of any applicable laws or regulations.</li>
              <li>Enter health data for individuals for whom you do not have legal authority or parental/guardian rights.</li>
              <li>Attempt to gain unauthorized access to any part of the app, other user accounts, or our systems.</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the app.</li>
              <li>Upload malicious files, viruses, or harmful content through the file upload or document features.</li>
              <li>Use the app to transmit spam, unsolicited messages, or misleading content.</li>
              <li>Interfere with or disrupt the integrity or performance of the app or its infrastructure.</li>
              <li>Use automated scripts, bots, or scrapers to access or interact with the app.</li>
              <li>Misrepresent your identity or your relationship to a child whose data you are entering.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">6. HIPAA Disclaimer</h2>
            <p>
              PANDAS Tracker implements technical, administrative, and physical safeguards to protect the health information you enter, including encryption at rest and in transit, access controls, audit logging, and session management. We maintain a Business Associate Agreement with our cloud infrastructure provider (Google Cloud / Firebase).
            </p>
            <p>
              However, <strong>SPM HealthTech is not a HIPAA Covered Entity</strong> (such as a healthcare provider, health plan, or healthcare clearinghouse). While we voluntarily follow HIPAA-aligned best practices to protect your data, the full scope of HIPAA regulatory obligations that apply to Covered Entities does not apply to this app.
            </p>
            <p>
              You should exercise caution when entering sensitive health information. Do not enter data into the app that you would not want stored digitally. You are responsible for evaluating whether the security measures we provide are sufficient for your needs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">7. Privacy</h2>
            <p>
              Your use of the app is also governed by our <strong>Privacy Policy & Notice of Privacy Practices</strong>, which describes how we collect, use, store, and protect your personal and health information. The Privacy Policy is incorporated into these Terms by reference.
            </p>
            <p>
              You can review the Privacy Policy at any time from the app's More menu under "Privacy Policy & HIPAA."
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">8. Intellectual Property</h2>
            <p>
              All content, features, and functionality of PANDAS Tracker — including but not limited to the software, design, text, graphics, logos, icons, and educational materials — are owned by SPM HealthTech / SPM Advisors and are protected by United States and international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable, revocable license to use the app for personal, non-commercial purposes in accordance with these Terms. You may not copy, modify, distribute, sell, or lease any part of the app without our prior written consent.
            </p>
            <p>
              Health data you enter into the app remains your property. You retain all rights to your data and may export or delete it at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">9. Subscription and Payments</h2>
            <p>
              Certain features of the app may require a paid subscription. If you purchase a subscription:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Subscription fees are billed in advance on a recurring basis (monthly or annually, depending on the plan you select).</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
              <li>Refunds are handled in accordance with the policies of the platform through which you purchased the subscription (e.g., Apple App Store, Google Play Store).</li>
              <li>We reserve the right to change subscription pricing with reasonable advance notice. Price changes will not apply to the current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The app is provided on an <strong>"as is" and "as available"</strong> basis without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</li>
              <li>We do not warrant that the app will be uninterrupted, error-free, or free of harmful components.</li>
              <li>We do not warrant the accuracy, completeness, or usefulness of any health-related information or educational content provided through the app.</li>
              <li>In no event shall SPM HealthTech, SPM Advisors, or their officers, directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the app.</li>
              <li>Our total liability to you for any claims arising under these Terms shall not exceed the amount you paid to us in subscription fees during the twelve (12) months preceding the claim.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless SPM HealthTech, SPM Advisors, and their officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the app, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the app at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
            <p>
              You may terminate your account at any time by using the account deletion feature in the app's Account & Privacy settings or by contacting us at <a href="mailto:security@spmadvisors.net" className="text-primary-600 underline">security@spmadvisors.net</a>.
            </p>
            <p>
              Upon termination, your right to use the app ceases immediately. You may export your data before termination using the Export Data feature. After account deletion, your data will be permanently removed in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">13. Modifications to Terms</h2>
            <p>
              We may revise these Terms from time to time. When we make material changes, we will notify you through the app or via the email address associated with your account. The updated Terms will indicate the new effective date.
            </p>
            <p>
              Your continued use of the app after the effective date of revised Terms constitutes your acceptance of the changes. If you do not agree to the revised Terms, you must stop using the app and may delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">14. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States and the State of Delaware, without regard to its conflict of law provisions.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or your use of the app shall first be attempted to be resolved through good-faith negotiation. If the dispute cannot be resolved informally, it shall be submitted to binding arbitration in accordance with the rules of the American Arbitration Association. You agree that any proceedings will be conducted on an individual basis and not as a class action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions of these Terms remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">16. Entire Agreement</h2>
            <p>
              These Terms, together with the Privacy Policy & Notice of Privacy Practices, constitute the entire agreement between you and SPM HealthTech regarding your use of the app and supersede all prior agreements and understandings, whether written or oral.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">17. Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us:
            </p>
            <p className="font-medium">
              Email: <a href="mailto:security@spmadvisors.net" className="text-primary-600 underline">security@spmadvisors.net</a>
            </p>
            <p className="font-medium">
              SPM HealthTech (operated by SPM Advisors)
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
