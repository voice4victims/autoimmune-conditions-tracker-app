import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DeleteAccount: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Delete Your Account</CardTitle>
          <p className="text-sm text-neutral-500 mt-1">PANDAS Tracker — Account & Data Deletion</p>
        </CardHeader>
        <CardContent className="prose max-w-none space-y-6 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">How to Delete Your Account</h2>
            <p>You can delete your account and all associated data directly from within the PANDAS Tracker app:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Open the PANDAS Tracker app</li>
              <li>Tap the <strong>More</strong> tab in the bottom navigation bar</li>
              <li>Tap <strong>Profile & Security</strong></li>
              <li>Scroll to the bottom and tap <strong>Delete Account</strong></li>
              <li>Re-authenticate with your password, Google, or Apple sign-in</li>
              <li>Confirm deletion in the confirmation dialog</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">What Data Is Deleted</h2>
            <p>When you delete your account, all of the following data is permanently removed:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your user profile and authentication credentials</li>
              <li>All child profiles and associated health records</li>
              <li>Symptom ratings, vital signs, and food diary entries</li>
              <li>Treatment records and medication reminders</li>
              <li>Activity logs and trigger events</li>
              <li>Uploaded files and medical documents</li>
              <li>Healthcare provider records and medical visit history</li>
              <li>Family access permissions and caregiver invitations</li>
              <li>Push notification tokens and session data</li>
              <li>Privacy settings and consent records</li>
              <li>Subscription information (your subscription will also be cancelled)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Data Retention</h2>
            <p>Account deletion is <strong>immediate and permanent</strong>. Once confirmed, your data cannot be recovered.</p>
            <p>Before deleting your account, we recommend using the <strong>Export Data</strong> feature in the app to download a copy of your health records.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Need Help?</h2>
            <p>If you are unable to access the app or need assistance with account deletion, contact our Privacy Officer:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:privacy@signaturepeaceofmind.com" className="text-primary-600 underline">privacy@signaturepeaceofmind.com</a></li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeleteAccount;
