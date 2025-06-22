import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';

const TermsOfServicePage: React.FC = () => {
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
              Privacy Policy & User Terms for Spector
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Explicitly Agree Upon Account Creation
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the Spector app, you agree to the following terms and conditions. 
                  If you do not agree, please do not use the application.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Purpose of the App</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Spector is a data collection and storage tool designed for professionals to capture, 
                    organize, and access property inspection data.
                  </li>
                  <li>
                    The app does not interpret, process, validate, or verify the accuracy or completeness 
                    of any data entered by users. It serves purely as a recording and organizational platform.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information We Collect</h2>
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
                <h2 className="text-xl font-semibold mb-3">4. How Your Data Is Used</h2>
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
                <h2 className="text-xl font-semibold mb-3">5. User Consent (needs prompts to allow access when using the app)</h2>
                <p className="mb-2">Spector requests access only when necessary for feature functionality:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Location Access:</strong> Used to tag entries with GPS.</li>
                  <li><strong>Camera Access:</strong> Used to take photos for inspections.</li>
                  <li><strong>Storage Access:</strong> Used for uploading attachments or exporting reports.</li>
                </ul>
                <p className="mt-3">These permissions are used strictly during active data collection.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data Storage and Security</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All inspection data is stored securely in encrypted cloud storage.</li>
                  <li>Data entered while offline is stored locally on the device and uploaded automatically when connectivity is restored.</li>
                  <li>Access to cloud data is restricted based on user role and authentication.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Data Access and Control</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Survey Creators:</strong> Can access and export all data in their surveys.</li>
                  <li><strong>Data Collectors:</strong> Can only view or export data they have personally submitted.</li>
                </ul>
                <p className="mt-3">Users may initiate account deletion or data deletion at any time.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Audit Metadata</h2>
                <p className="mb-2">To ensure traceability and accountability, each inspection record may include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Created By (user ID)</li>
                  <li>Created At (timestamp)</li>
                  <li>Last Modified (timestamp)</li>
                  <li>Location (if enabled)</li>
                </ul>
                <p className="mt-3">This information may appear in dashboards, logs, or exported reports.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Data Responsibility Disclaimer</h2>
                <p>
                  Spector does not review, assess, or verify any data submitted through the platform.
                  All data is user-entered and user-controlled. Any conclusions, interpretations, or decisions 
                  made using that data are the sole responsibility of the user.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
                <p className="mb-3">
                  While we implement appropriate security safeguards, Spector is provided "as is" and "as available." 
                  We do not guarantee uninterrupted service or absolute protection against unauthorized access.
                </p>
                <p className="mb-2">Spector and its developers are not liable for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Data breaches</li>
                  <li>Loss of data</li>
                  <li>Errors in exported reports or entered information</li>
                </ul>
                <p className="mt-3">
                  Users are responsible for verifying data accuracy and maintaining their own backups where necessary.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Jurisdiction & Compliance</h2>
                <p>
                  This policy is governed by the laws of Sri Lanka. Users are responsible for ensuring their own 
                  compliance with any legal or regulatory obligations applicable to their region or profession.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Updates to This Policy</h2>
                <p>
                  We may periodically update this document. Continued use of Spector implies acceptance of the 
                  latest terms and policies. Users will be notified of significant changes via the app or 
                  associated communication channels.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 