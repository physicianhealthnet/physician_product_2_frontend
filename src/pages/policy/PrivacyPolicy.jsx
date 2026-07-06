import React from "react";

export default function PrivacyPolicyPhysicianHealthNet() {
  return (
    <div className="bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-2xl p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy – Physician Health Net
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Last updated: 19-02-2026
        </p>

        <p className="text-gray-700 mb-6">
          Physician Health Net (“we”, “our”, “us”) is committed to protecting your
          privacy and safeguarding your personal information. This Privacy
          Policy explains how we collect, use, store, and protect your
          information when you use our website, services, and communication
          platforms.
        </p>
        <p className="text-gray-700 mb-8">
          By accessing or using our services, you agree to the terms of this
          Privacy Policy.
        </p>

        {/* Section 1 */}
        <Section title="1. Information We Collect">
          <SubTitle>Personal Information</SubTitle>
          <ul className="list-disc ml-6 space-y-1">
            <li>Name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Appointment details</li>
            <li>Clinic or treatment preferences</li>
          </ul>

          <SubTitle>Technical Information</SubTitle>
          <ul className="list-disc ml-6 space-y-1">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Website usage data</li>
          </ul>

          <p className="mt-3">
            We only collect information necessary to provide physician appointment
            and communication services.
          </p>
        </Section>

        {/* Section 2 */}
        <Section title="2. How We Use Your Information">
          <ul className="list-disc ml-6 space-y-1">
            <li>Schedule and manage appointments</li>
            <li>Send appointment confirmations and reminders</li>
            <li>Communicate service updates</li>
            <li>Respond to inquiries and support requests</li>
            <li>Improve our services and website functionality</li>
            <li>Maintain records required by healthcare providers</li>
          </ul>
          <p className="mt-3">
            We do not use your personal data for unrelated marketing without
            your consent.
          </p>
        </Section>

        {/* Section 3 */}
        <Section title="3. Communication & Messaging (WhatsApp / SMS / Email)">
          <p>If you provide your contact details, you may receive:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Appointment confirmations</li>
            <li>Appointment reminders</li>
            <li>Rescheduling notifications</li>
            <li>Service-related messages</li>
          </ul>
          <p className="mt-3">
            These communications are service-related and not promotional unless
            you opt in.
          </p>
          <p className="mt-2">
            You may request to stop messages at any time by contacting us.
          </p>
        </Section>

        {/* Section 4 */}
        <Section title="4. Data Sharing">
          <p>We do not sell or rent personal information.</p>
          <p className="mt-2">We may share information only with:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>
              Authorized physician clinics or healthcare providers involved in your
              care
            </li>
            <li>Secure service providers (hosting, messaging, IT services)</li>
            <li>Legal or regulatory authorities when required by law</li>
          </ul>
          <p className="mt-3">
            All partners are expected to maintain confidentiality and data
            protection.
          </p>
        </Section>

        {/* Section 5 */}
        <Section title="5. Data Storage & Security">
          <ul className="list-disc ml-6 space-y-1">
            <li>Secure servers</li>
            <li>Access controls</li>
            <li>Encrypted communications where applicable</li>
          </ul>
          <p className="mt-3">
            However, no online system is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </Section>

        {/* Section 6 */}
        <Section title="6. Data Retention">
          <p>We retain personal information only as long as necessary for:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Appointment and service management</li>
            <li>Legal or medical record requirements</li>
            <li>Operational and support purposes</li>
          </ul>
          <p className="mt-3">
            After this period, data may be deleted or anonymized.
          </p>
        </Section>

        {/* Section 7 */}
        <Section title="7. Your Rights">
          <p>You may request to:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Update contact details</li>
            <li>Request deletion (subject to legal/medical requirements)</li>
            <li>Withdraw communication consent</li>
          </ul>
          <p className="mt-3">
            Requests can be made via our contact details below.
          </p>
        </Section>

        {/* Section 8 */}
        <Section title="8. Third-Party Services">
          <p>
            Our services may use third-party platforms (such as hosting,
            analytics, or messaging providers). These providers process data
            only to support our services and under applicable privacy
            obligations.
          </p>
          <p className="mt-2">
            We are not responsible for external websites linked from our site.
          </p>
        </Section>

        {/* Section 9 */}
        <Section title="9. Children’s Privacy">
          <p>
            Our services are not directed to children under 18 without parental
            or guardian involvement. If you believe a minor has provided
            personal data without authorization, please contact us.
          </p>
        </Section>

        {/* Section 10 */}
        <Section title="10. Policy Updates">
          <p>
            We may update this Privacy Policy periodically. Changes will be
            posted on this page with the updated date. Continued use of services
            indicates acceptance of the updated policy.
          </p>
        </Section>

        {/* Section 11 */}
        <Section title="11. Contact Us">
          <div className="mt-2 space-y-1">
            <p className="font-medium">Physician Health Net</p>
            <p>
              Website:{" "}
              <a
                href="https://physicianhealthnet.com"
                className="text-blue-600 hover:underline"
              >
                https://physicianhealthnet.com
              </a>
            </p>
            <p>Email: cloudoplus2023@gmail.com</p>
            <p>Phone: 9629157571</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="text-gray-700 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

function SubTitle({ children }) {
  return <h3 className="font-semibold text-gray-800 mt-3">{children}</h3>;
}
