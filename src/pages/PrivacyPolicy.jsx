export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
              <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                Legal
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
                Privacy Policy
              </h1>
              <p className="text-sm text-slate-500">
                Last Updated: {new Date().toDateString()}
              </p>
            </div>

            <div className="prose prose-slate max-w-none pt-6">
              <h2>1. Introduction</h2>
              <p>
                This Privacy Policy explains how the Medical Exam Application collects,
                uses, and protects your personal information when you use our mobile
                application available on Android and iOS platforms.
              </p>

              <h2>2. Information We Collect</h2>
              <ul>
                <li>Name, email address, and mobile number</li>
                <li>Account login details (OTP / Google login)</li>
                <li>Course subscriptions and payment information</li>
                <li>Device information and usage analytics</li>
                <li>Support tickets and communication data</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <ul>
                <li>To provide access to courses and exam content</li>
                <li>To manage subscription plans</li>
                <li>To process payments and generate invoices</li>
                <li>To send important notifications</li>
                <li>To improve our services and user experience</li>
              </ul>

              <h2>4. Payments</h2>
              <p>
                Payments made through the application may use third-party payment
                gateways such as UPI, Cards, or Wallets. We do not store sensitive
                payment information on our servers.
              </p>

              <h2>5. Security</h2>
              <p>
                We implement security measures to protect user data including account
                protection against unauthorized access, screenshot prevention, download
                restrictions, and multiple login protections.
              </p>

              <h2>6. Notifications</h2>
              <p>
                The app may send push notifications, emails, and SMS for plan expiry,
                subscription updates, and important announcements.
              </p>

              <h2>7. Data Sharing</h2>
              <p>
                We do not sell or rent personal data. Data may be shared only with
                trusted service providers such as payment gateways or analytics services
                required for application functionality.
              </p>

              <h2>8. User Rights</h2>
              <p>
                Users can request modification or deletion of their account information
                by contacting support through the application or email.
              </p>

              <h2>9. Children's Privacy</h2>
              <p>Our services are not intended for children under 13 years of age.</p>

              <h2>10. Changes to Privacy Policy</h2>
              <p>
                We may update this policy from time to time. Users will be notified of
                major changes through app notifications.
              </p>

              <h2>11. Contact Us</h2>
              <p>If you have any questions regarding this Privacy Policy, please contact us.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
