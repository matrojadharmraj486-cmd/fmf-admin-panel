export default function PrivacyPolicy() {
  const pageStyle = {
    fontFamily: "Arial, sans-serif",
    margin: "40px",
    lineHeight: 1.6,
    color: "#333",
  };
  const headingStyle = { color: "#2c3e50" };

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>Privacy Policy</h1>
      <p>Last Updated: {new Date().toDateString()}</p>

      <h2 style={headingStyle}>1. Introduction</h2>
      <p>
        This Privacy Policy explains how the Medical Exam Application collects,
        uses, and protects your personal information when you use our mobile
        application available on Android and iOS platforms.
      </p>

      <h2 style={headingStyle}>2. Information We Collect</h2>
      <ul>
        <li>Name, email address, and mobile number</li>
        <li>Account login details (OTP / Google login)</li>
        <li>Course subscriptions and payment information</li>
        <li>Device information and usage analytics</li>
        <li>Support tickets and communication data</li>
      </ul>

      <h2 style={headingStyle}>3. How We Use Your Information</h2>
      <ul>
        <li>To provide access to courses and exam content</li>
        <li>To manage subscription plans</li>
        <li>To process payments and generate invoices</li>
        <li>To send important notifications</li>
        <li>To improve our services and user experience</li>
      </ul>

      <h2 style={headingStyle}>4. Payments</h2>
      <p>
        Payments made through the application may use third-party payment
        gateways such as UPI, Cards, or Wallets. We do not store sensitive
        payment information on our servers.
      </p>

      <h2 style={headingStyle}>5. Security</h2>
      <p>
        We implement security measures to protect user data including account
        protection against unauthorized access, screenshot prevention, download
        restrictions, and multiple login protections.
      </p>

      <h2 style={headingStyle}>6. Notifications</h2>
      <p>
        The app may send push notifications, emails, and SMS for plan expiry,
        subscription updates, and important announcements.
      </p>

      <h2 style={headingStyle}>7. Data Sharing</h2>
      <p>
        We do not sell or rent personal data. Data may be shared only with
        trusted service providers such as payment gateways or analytics services
        required for application functionality.
      </p>

      <h2 style={headingStyle}>8. User Rights</h2>
      <p>
        Users can request modification or deletion of their account information
        by contacting support through the application or email.
      </p>

      <h2 style={headingStyle}>9. Children's Privacy</h2>
      <p>Our services are not intended for children under 13 years of age.</p>

      <h2 style={headingStyle}>10. Changes to Privacy Policy</h2>
      <p>
        We may update this policy from time to time. Users will be notified of
        major changes through app notifications.
      </p>

      <h2 style={headingStyle}>11. Contact Us</h2>
      <p>If you have any questions regarding this Privacy Policy, please contact us.</p>
    </div>
  );
}
