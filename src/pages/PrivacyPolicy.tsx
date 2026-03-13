
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <p className="text-sm text-neutral-500 mt-1">Last updated: March 13, 2026</p>
        </CardHeader>
        <CardContent className="prose max-w-none space-y-6 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">1. Introduction</h2>
            <p>
              PANDAS Tracker ("we," "our," or "the app") is published by SPM HealthTech. This app is designed to help families track symptoms, treatments, and health information related to PANS/PANDAS and related autoimmune conditions.
            </p>
            <p>
              <strong>This app is not a medical device.</strong> It does not provide medical advice, diagnosis, or treatment recommendations. It is for personal tracking and informational purposes only. Always consult a qualified healthcare professional before making medical decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">2. Children's Privacy (COPPA Compliance)</h2>
            <p>
              This app is intended for use by parents and guardians to track health information about their children. We do not knowingly collect personal information directly from children under 13.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All accounts must be created by a parent or legal guardian who is at least 18 years old.</li>
              <li>Health data entered about a child is provided by, and controlled by, the parent/guardian account holder.</li>
              <li>Parents/guardians may review, modify, or delete their child's data at any time through the app's settings.</li>
              <li>We do not share children's health data with third parties for advertising or marketing purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">3. Data We Collect</h2>
            <p>We collect only data that you explicitly provide:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Email address and authentication credentials (password is handled by Firebase Authentication and never stored by us in plaintext).</li>
              <li><strong>Child profiles:</strong> Name, date of birth, gender, and diagnosis-related information you enter.</li>
              <li><strong>Health tracking data:</strong> Symptom ratings, vital signs, food diary entries, treatment records, medication information, side effects, allergy records, and daily notes.</li>
              <li><strong>Medical documents:</strong> Files, lab results, and images you choose to upload.</li>
              <li><strong>Provider information:</strong> Healthcare provider names and contact information you enter.</li>
              <li><strong>Insurance information:</strong> Insurance details you choose to store.</li>
              <li><strong>App usage data:</strong> Basic analytics to help us improve the app (can be disabled in settings).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">4. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the symptom tracking, treatment logging, and health monitoring features of the app.</li>
              <li>To sync your data across your devices via your authenticated account.</li>
              <li>To generate charts, trends, and reports that you request.</li>
              <li>To send medication reminders that you configure.</li>
              <li>To improve app functionality and fix bugs (using anonymized, aggregated usage data only).</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal or health data. We do <strong>not</strong> use your health data for advertising. We do <strong>not</strong> share your data with third parties except as described below.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">5. Third-Party Services</h2>
            <p>We use the following third-party services to operate the app:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Firebase:</strong> Authentication, database (Firestore), file storage, and hosting. Data is stored in Google Cloud's US data centers. See <a href="https://firebase.google.com/support/privacy" className="text-primary-600 underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a>.</li>
              <li><strong>Google Analytics (Firebase Analytics):</strong> Anonymized usage analytics to understand how the app is used. No health data is sent to analytics. You may opt out in your device settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">6. Data Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All data is encrypted in transit (TLS/SSL) and at rest (Google Cloud encryption).</li>
              <li>Access to your data requires authentication through your account.</li>
              <li>Firestore security rules ensure users can only access their own data.</li>
              <li>We do not store passwords — authentication is handled by Firebase Auth.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">7. Data Retention & Deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is retained for as long as your account is active.</li>
              <li>You may delete individual records (symptoms, treatments, notes, etc.) at any time from within the app.</li>
              <li>You may request full account and data deletion by contacting us or using the deletion option in Account & Privacy settings.</li>
              <li>Upon account deletion, all associated data is permanently removed from our systems within 30 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Access</strong> your data — all your data is visible within the app.</li>
              <li><strong>Correct</strong> your data — you can edit any record at any time.</li>
              <li><strong>Export</strong> your data — use the export feature in Account & Privacy settings.</li>
              <li><strong>Delete</strong> your data — delete individual records or your entire account.</li>
              <li><strong>Withdraw consent</strong> — you may stop using the app and request deletion at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">10. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, your data, or wish to exercise any of your rights, please contact us:
            </p>
            <p className="font-medium">
              Email: <a href="mailto:info@tegratec.com" className="text-primary-600 underline">info@tegratec.com</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
