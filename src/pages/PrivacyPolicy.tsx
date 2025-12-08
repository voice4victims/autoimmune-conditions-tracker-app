
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to our application. We are committed to protecting your privacy and handling your data in an open and transparent manner. This privacy policy sets out how we will treat your personal information.
          </p>

          <h2>2. Data We Collect</h2>
          <p>
            We may collect, store, and use the following kinds of personal information:
            <ul>
              <li>Information about your computer and about your visits to and use of this application (including your IP address, geographical location, browser type and version, and operating system).</li>
              <li>Information that you provide to us when registering with our application.</li>
              <li>Information that you provide to us for the purpose of subscribing to our email notifications and/or newsletters.</li>
              <li>Information relating to any purchases you make of our goods or services.</li>
              <li>Health-related data that you explicitly provide, such as symptoms, medications, and treatments.</li>
            </ul>
          </p>

          <h2>3. How We Use Your Data</h2>
          <p>
            Personal information submitted to us through our application will be used for the purposes specified in this policy or on the relevant pages of the application. We may use your personal information to:
            <ul>
              <li>Administer our application and business.</li>
              <li>Personalize our application for you.</li>
              <li>Enable your use of the services available on our application.</li>
              <li>Send you email notifications that you have specifically requested.</li>
            </ul>
          </p>

          <h2>4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. All data is encrypted at rest and in transit. Access to your personal data is limited to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>

          <h2>5. Your Rights</h2>
          <p>
            You have rights under data protection laws in relation to your personal data, including the right to access, correct, and request the deletion of your personal data.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our treatment of your personal information, please write to us by email at privacy@example.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
