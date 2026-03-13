
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy & Notice of Privacy Practices</CardTitle>
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
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">2. HIPAA Notice of Privacy Practices</h2>
            <p>
              This notice describes how health information about your child may be used and disclosed, and how you can access this information. Please review it carefully.
            </p>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mt-4">Protected Health Information (PHI)</h3>
            <p>
              The health data you enter into PANDAS Tracker — including symptom ratings, treatment records, vital signs, lab results, diagnoses, medical documents, and provider notes — is considered Protected Health Information (PHI) under the Health Insurance Portability and Accountability Act (HIPAA). We are committed to safeguarding this information in accordance with HIPAA's Privacy Rule, Security Rule, and Breach Notification Rule.
            </p>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mt-4">How We Use and Disclose PHI</h3>
            <p>We may use or disclose your child's PHI in the following ways:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>For treatment coordination:</strong> To display health records, trends, and history that you choose to share with healthcare providers through the app's sharing features.</li>
              <li><strong>At your request:</strong> When you explicitly export, email, or share records with a provider or family member using the app's built-in features.</li>
              <li><strong>As required by law:</strong> If we are required to disclose information by a court order, subpoena, or applicable law.</li>
            </ul>
            <p className="mt-2">We will <strong>never</strong> use or disclose PHI for marketing, advertising, or sale to third parties.</p>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-100 mt-4">Business Associate Agreements</h3>
            <p>
              We have entered into a Business Associate Agreement (BAA) with Google Cloud / Firebase, our infrastructure provider. This agreement ensures that Google Cloud meets HIPAA requirements for the protection of PHI that is stored, processed, and transmitted through their services. All PHI is stored in Google Cloud's US-based data centers with encryption at rest and in transit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">3. Your Rights Under HIPAA</h2>
            <p>As a parent or guardian managing your child's health information, you have the following rights under HIPAA:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Right to Access:</strong> You may view all PHI stored in the app at any time. All health data is accessible through the app's tracking screens, history views, and export features.</li>
              <li><strong>Right to Amendment:</strong> You may request corrections to any health record. You can edit symptom entries, treatment records, notes, and other data directly within the app.</li>
              <li><strong>Right to an Accounting of Disclosures:</strong> You may request a record of when and to whom your child's PHI has been disclosed. The app maintains audit logs of data sharing, exports, and provider access events. Contact us to request a full accounting.</li>
              <li><strong>Right to Request Restrictions:</strong> You may request restrictions on how your child's PHI is used or disclosed. Contact us at the email below to submit a restriction request.</li>
              <li><strong>Right to Confidential Communications:</strong> You may request that we communicate with you about PHI through a specific method or at a specific address.</li>
              <li><strong>Right to a Copy:</strong> You may obtain a copy of your child's PHI in electronic format using the Export Data feature in Account & Privacy settings.</li>
              <li><strong>Right to Data Deletion:</strong> You may request permanent deletion of all PHI through the Data Deletion option in Account & Privacy settings. Upon deletion, all associated data is permanently removed from our systems.</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact our Privacy Officer at <a href="mailto:info@tegratec.com" className="text-primary-600 underline">info@tegratec.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">4. HIPAA Security Safeguards</h2>
            <p>We implement administrative, physical, and technical safeguards to protect PHI:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.2+) and at rest (AES-256 via Google Cloud).</li>
              <li><strong>Access Controls:</strong> Firestore security rules enforce that users can only access their own data. Role-based access is enforced for family sharing and provider access features.</li>
              <li><strong>Audit Logging:</strong> All access to PHI is logged, including reads, writes, exports, and sharing events.</li>
              <li><strong>Session Management:</strong> Configurable session timeouts automatically sign users out after inactivity.</li>
              <li><strong>Authentication:</strong> Multi-factor authentication support via Firebase Auth. Passwords are never stored by the app.</li>
              <li><strong>Minimum Necessary Standard:</strong> Shared access (family members, providers) is limited to the minimum data necessary for the intended purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">5. Breach Notification</h2>
            <p>
              In the unlikely event of a breach of unsecured PHI, we will notify affected users without unreasonable delay and no later than 60 calendar days after discovery of the breach. Notification will be sent via the email address associated with your account and will include:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>A description of the breach, including the date(s) of the breach and date of discovery.</li>
              <li>The types of PHI involved (e.g., symptom data, treatment records, medical documents).</li>
              <li>Steps you should take to protect yourself and your child.</li>
              <li>What we are doing to investigate, mitigate harm, and prevent future breaches.</li>
              <li>Contact information for our Privacy Officer.</li>
            </ul>
            <p className="mt-2">
              If a breach affects 500 or more individuals, we will also notify the U.S. Department of Health and Human Services as required by HIPAA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">6. Children's Privacy (COPPA Compliance)</h2>
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
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">7. Data We Collect</h2>
            <p>We collect only data that you explicitly provide:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Email address and authentication credentials (password is handled by Firebase Authentication and never stored by us in plaintext).</li>
              <li><strong>Child profiles:</strong> Name, date of birth, gender, and diagnosis-related information you enter.</li>
              <li><strong>Health tracking data (PHI):</strong> Symptom ratings, vital signs, food diary entries, treatment records, medication information, side effects, allergy records, and daily notes.</li>
              <li><strong>Medical documents (PHI):</strong> Files, lab results, and images you choose to upload.</li>
              <li><strong>Provider information:</strong> Healthcare provider names and contact information you enter.</li>
              <li><strong>Insurance information (PHI):</strong> Insurance details you choose to store.</li>
              <li><strong>App usage data:</strong> Basic analytics to help us improve the app (can be disabled in settings). No PHI is included in analytics data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">8. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the symptom tracking, treatment logging, and health monitoring features of the app.</li>
              <li>To sync your data across your devices via your authenticated account.</li>
              <li>To generate charts, trends, and reports that you request.</li>
              <li>To send medication reminders that you configure.</li>
              <li>To improve app functionality and fix bugs (using anonymized, aggregated usage data only — never PHI).</li>
            </ul>
            <p>We do <strong>not</strong> sell your personal or health data. We do <strong>not</strong> use your health data for advertising. We do <strong>not</strong> share your data with third parties except as described in this policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">9. Third-Party Services & Business Associates</h2>
            <p>We use the following third-party services to operate the app. Where these services handle PHI, we have executed Business Associate Agreements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Cloud / Firebase (Business Associate):</strong> Authentication, database (Firestore), file storage, and hosting. Data is stored in Google Cloud's US data centers with BAA coverage. See <a href="https://firebase.google.com/support/privacy" className="text-primary-600 underline" target="_blank" rel="noopener noreferrer">Firebase Privacy Policy</a> and <a href="https://cloud.google.com/security/compliance/hipaa" className="text-primary-600 underline" target="_blank" rel="noopener noreferrer">Google Cloud HIPAA Compliance</a>.</li>
              <li><strong>Google Analytics (Firebase Analytics):</strong> Anonymized usage analytics to understand how the app is used. No PHI is sent to analytics. You may opt out in your device settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">10. Data Retention & Deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your data is retained for as long as your account is active.</li>
              <li>You may delete individual records (symptoms, treatments, notes, etc.) at any time from within the app.</li>
              <li>You may request full account and data deletion by contacting us or using the deletion option in Account & Privacy settings.</li>
              <li>Upon account deletion, all associated PHI is permanently removed from our systems.</li>
              <li>Audit logs related to PHI access may be retained for up to 6 years as required by HIPAA.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy and notice of privacy practices from time to time. We will notify you of material changes through the app or via email. The revised notice will be available within the app. Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">12. Complaints</h2>
            <p>
              If you believe your privacy rights have been violated, you may file a complaint with our Privacy Officer at <a href="mailto:info@tegratec.com" className="text-primary-600 underline">info@tegratec.com</a>. You also have the right to file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights. We will not retaliate against you for filing a complaint.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">13. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, HIPAA compliance, your data, or wish to exercise any of your rights, please contact our Privacy Officer:
            </p>
            <p className="font-medium">
              Email: <a href="mailto:info@tegratec.com" className="text-primary-600 underline">info@tegratec.com</a>
            </p>
            <p className="font-medium">
              SPM HealthTech — Privacy Officer
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
