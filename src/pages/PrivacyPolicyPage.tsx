import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <BackButton
            variant="ghost"
            className="mb-4"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Privacy Policy for Spector
            </CardTitle>
            <p className="text-center text-muted-foreground">
              How we collect, use, and protect your data
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="mb-2">Spector may collect and store the following data types:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Personal Information:</strong> Name, email address, phone number, and Google account identifiers
                  </li>
                  <li>
                    <strong>Survey and Field Data:</strong> Photos, GPS location, notes, timestamps, and inspection-related inputs.
                  </li>
                  <li>
                    <strong>Device Data:</strong> Non-identifying information such as device type, app version, and device ID for diagnostics and security.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How Your Data Is Used</h2>
                <p className="mb-2">Data collected through Spector is used for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Supporting core app functionality (data capture, syncing, export)</li>
                  <li>Managing accounts and survey permissions</li>
                  <li>Securing system integrity and fixing bugs</li>
                  <li>Providing user support</li>
                </ul>
                <p className="mt-3">
                  <strong>We do not sell, share, or monetize personal or survey data.</strong>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Consent and Permissions</h2>
                <p className="mb-2">Spector requests access only when necessary for feature functionality:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Location Access:</strong> Used to tag entries with GPS coordinates for accurate asset location tracking.</li>
                  <li><strong>Camera Access:</strong> Used to take photos for inspections and asset documentation.</li>
                  <li><strong>Storage Access:</strong> Used for uploading attachments or exporting reports.</li>
                </ul>
                <p className="mt-3">These permissions are used strictly during active data collection and can be revoked at any time through your device settings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All inspection data is stored securely in encrypted cloud storage using Firebase services.</li>
                  <li>Data entered while offline is stored locally on the device and uploaded automatically when connectivity is restored.</li>
                  <li>Access to cloud data is restricted based on user role and authentication.</li>
                  <li>We implement industry-standard security measures to protect your data.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Access and Control</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Survey Creators:</strong> Can access and export all data in their surveys.</li>
                  <li><strong>Data Collectors:</strong> Can only view or export data they have personally submitted.</li>
                  <li>Users may initiate account deletion or data deletion at any time.</li>
                  <li>You have the right to request a copy of all data we have about you.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Audit Metadata</h2>
                <p className="mb-2">To ensure traceability and accountability, each inspection record may include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Created By (user ID)</li>
                  <li>Created At (timestamp)</li>
                  <li>Last Modified (timestamp)</li>
                  <li>Location (if enabled)</li>
                </ul>
                <p className="mt-3">This information may appear in dashboards, logs, or exported reports for audit purposes.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your data is retained as long as your account is active.</li>
                  <li>Upon account deletion, all associated data is permanently removed from our systems.</li>
                  <li>Backup data may be retained for a limited period for disaster recovery purposes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
                <p className="mb-2">We use the following third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Firebase (Google):</strong> For authentication, database, and storage services</li>
                  <li><strong>Google Analytics:</strong> For app usage analytics (anonymized data only)</li>
                </ul>
                <p className="mt-3">These services have their own privacy policies, and we recommend reviewing them.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
                <p>
                  Spector is not intended for use by children under the age of 13. We do not knowingly collect 
                  personal information from children under 13. If you believe we have collected such information, 
                  please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
                <p>
                  Your data may be processed and stored in countries other than your own. We ensure that 
                  appropriate safeguards are in place to protect your data in accordance with this privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
                <p>
                  If you have any questions about this privacy policy or our data practices, please contact us at:
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <p><strong>Email:</strong> privacy@spector-app.com</p>
                  <p><strong>Address:</strong> [Your Company Address]</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Updates to This Policy</h2>
                <p>
                  We may periodically update this privacy policy. Continued use of Spector implies acceptance 
                  of the latest privacy policy. Users will be notified of significant changes via the app or 
                  associated communication channels.
                </p>
                <p className="mt-3">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 