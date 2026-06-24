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
              <p className="text-sm text-slate-500">Last Updated: 01-June-2026</p>
            </div>

            <div className="prose prose-slate max-w-none pt-6">
              <p>
                Family Medicine Flashback ("we", "our", or "us") respects your privacy
                and is committed to protecting your personal information.
              </p>

              <h2>Information We Collect</h2>
              <p>When you register for an account, we may collect:</p>
              <ul>
                <li>Full Name</li>
                <li>Email Address</li>
                <li>Mobile Number</li>
                <li>Address</li>
                <li>Date of Birth</li>
                <li>Profile Photograph</li>
                <li>Billing Information required for purchases</li>
              </ul>

              <h2>How We Use Information</h2>
              <p>We use the information to:</p>
              <ul>
                <li>Create and manage user accounts</li>
                <li>Provide access to educational content</li>
                <li>Process payments and purchases</li>
                <li>Communicate important account information</li>
                <li>Provide customer support</li>
                <li>Improve application functionality</li>
              </ul>

              <h2>Educational Purpose</h2>
              <p>
                Family Medicine Flashback is an educational platform designed for exam
                preparation through question-and-answer based learning content. The
                application does not provide medical diagnosis, treatment recommendations,
                or healthcare services.
              </p>

              <h2>Data Sharing</h2>
              <p>
                We do not sell, rent, or share user personal information with advertisers
                or data brokers.
              </p>
              <p>
                We may share limited information with service providers only when necessary
                to provide app functionality and payment processing.
              </p>

              <h2>Tracking</h2>
              <p>
                Family Medicine Flashback does not track users across third-party
                applications, websites, or services for advertising purposes.
              </p>

              <h2>Data Security</h2>
              <p>
                We implement reasonable administrative and technical measures to protect
                user information against unauthorized access, disclosure, or misuse.
              </p>

              <h2>User Rights</h2>
              <p>
                Users may request account updates or deletion by contacting us at:
              </p>
              <p>
                Email:{" "}
                <a href="mailto:help@familymedicineflashback.com">
                  help@familymedicineflashback.com
                </a>
              </p>

              <h2>Children's Privacy</h2>
              <p>
                Our services are not intended for children under the age required by
                applicable laws.
              </p>

              <h2>Contact Us</h2>
              <p>
                If you have any questions regarding this Privacy Policy, please contact:
              </p>
              <p>
                Email:{" "}
                <a href="mailto:help@familymedicineflashback.com">
                  help@familymedicineflashback.com
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://familymedicineflashback.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  familymedicineflashback.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
