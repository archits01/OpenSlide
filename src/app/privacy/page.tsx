import { LegalLayout, Section, P, SubHeading, UL, Li, Note } from "@/components/shared/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="April 15, 2026">

      <Section title="1. Introduction">
        <P>
          This Privacy Policy describes how Open Computer ("Open Computer," "we," "us," or "our") collects, uses, stores, shares, and protects your personal information when you access or use the OpenSlide platform at tryopenslide.com and all related services (collectively, the "Services").
        </P>
        <P>
          This policy applies to all users of the Services and should be read alongside our Terms of Service, which provide additional context on how data is handled. By using the Services, you consent to the practices described in this policy.
        </P>
      </Section>

      <Section title="2. Data Controller">
        <P>
          Open Computer is the data controller responsible for your personal data collected through the Services.
        </P>
        <P>
          Open Computer<br />
          Bengaluru, Karnataka, India<br />
          Contact: tryopencomputer@gmail.com
        </P>
      </Section>

      <Section title="3. Information We Collect">
        <SubHeading>Account Information</SubHeading>
        <P>When you register for an account, we collect:</P>
        <UL>
          <Li>Full name and email address</Li>
          <Li>Authentication credentials (hashed passwords or OAuth tokens)</Li>
          <Li>Profile information you choose to provide</Li>
          <Li>Account preferences and settings</Li>
        </UL>

        <SubHeading>Payment Information</SubHeading>
        <P>
          When you purchase credits, payment details are processed by our payment service providers. We do not store full payment card numbers or sensitive payment credentials. We retain only what is necessary for billing records and transaction history.
        </P>

        <SubHeading>User Content</SubHeading>
        <P>
          We collect and store the presentations, documents, prompts, and files you create or upload through the Services. See Section 6 for details on how this content may be used.
        </P>

        <SubHeading>Third-Party Integration Data</SubHeading>
        <P>
          When you connect third-party services such as Google Drive, we access only the data explicitly authorized by you and necessary to provide the requested functionality. We do not access or store data from your connected accounts beyond what is needed for the specific task you initiate.
        </P>

        <SubHeading>Usage and Technical Data</SubHeading>
        <P>We automatically collect certain technical information when you use the Services, including:</P>
        <UL>
          <Li>IP address and approximate location</Li>
          <Li>Browser type and version</Li>
          <Li>Device type and operating system</Li>
          <Li>Pages visited, features used, and session activity</Li>
          <Li>Error logs and performance metrics</Li>
          <Li>Timestamps of access and actions</Li>
        </UL>
        <P>
          This data is used to operate, maintain, and improve the Services and does not include the content of your presentations or documents.
        </P>
      </Section>

      <Section title="4. How We Use Your Information">
        <P>We use the information we collect for the following purposes:</P>

        <SubHeading>To Provide the Services</SubHeading>
        <UL>
          <Li>Create and manage your account</Li>
          <Li>Process credit purchases and maintain your credit balance</Li>
          <Li>Generate AI-powered presentations and documents based on your prompts</Li>
          <Li>Enable third-party integrations you authorize</Li>
          <Li>Deliver and maintain platform functionality</Li>
        </UL>

        <SubHeading>To Improve the Services</SubHeading>
        <UL>
          <Li>Analyze platform usage patterns to enhance features</Li>
          <Li>Debug technical issues and improve system performance</Li>
          <Li>Develop new features and improve existing ones</Li>
        </UL>

        <SubHeading>For Communications</SubHeading>
        <UL>
          <Li>Respond to your support requests and inquiries</Li>
          <Li>Send important service updates and notices</Li>
          <Li>Notify you of changes to our policies or the Services</Li>
        </UL>

        <SubHeading>For Security and Compliance</SubHeading>
        <UL>
          <Li>Detect, prevent, and investigate fraud or abuse</Li>
          <Li>Enforce our Terms of Service</Li>
          <Li>Comply with applicable legal obligations</Li>
        </UL>
      </Section>

      <Section title="5. Legal Basis for Processing">
        <P>We process your personal data on the following legal bases:</P>
        <UL>
          <Li><strong>Contract:</strong> Processing necessary to provide the Services you have requested and agreed to under our Terms of Service</Li>
          <Li><strong>Legitimate Interests:</strong> Platform security, fraud prevention, and service improvement, where these do not override your rights</Li>
          <Li><strong>Consent:</strong> AI model training using free tier data — you may withdraw this consent at any time</Li>
          <Li><strong>Legal Obligation:</strong> Processing required to comply with applicable laws</Li>
        </UL>
      </Section>

      <Section title="6. AI Model Training">
        <Note>
          We believe in being transparent about how your data is used to improve our AI.
        </Note>
        <P>
          User Content and prompts from free tier accounts may be used in anonymized form to train and improve our AI models. This helps us generate better, more accurate presentations and documents for all users over time.
        </P>
        <P>
          Paid users' content is never used for AI training purposes under any circumstances.
        </P>
        <P>
          If you are on the free tier and wish to opt out of your data being used for AI training, you may contact us at tryopencomputer@gmail.com with the subject line "AI Training Opt-Out." We will process your request within 7 business days.
        </P>
      </Section>

      <Section title="7. Data Sharing and Disclosure">
        <P>
          We do not sell, rent, or trade your personal data to third parties. We may share your information in the following limited circumstances:
        </P>

        <SubHeading>Service Providers</SubHeading>
        <P>
          We share data with trusted service providers who assist in operating our platform, including authentication (Supabase), database and infrastructure hosting, and payment processing. All service providers are bound by data processing agreements and are prohibited from using your data for their own purposes.
        </P>

        <SubHeading>Legal Requirements</SubHeading>
        <P>
          We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, or investigate fraud.
        </P>

        <SubHeading>Business Transfers</SubHeading>
        <P>
          In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity. We will notify you before your data is transferred and becomes subject to a different privacy policy.
        </P>
      </Section>

      <Section title="8. Data Retention">
        <P>
          We retain your personal data for as long as your account is active or as needed to provide the Services. Specifically:
        </P>
        <UL>
          <Li>Account and profile data is retained for the duration of your account</Li>
          <Li>User Content (presentations, documents) is retained until you delete it or close your account</Li>
          <Li>Usage and technical data is retained for up to 12 months for operational purposes</Li>
          <Li>Payment records are retained as required by applicable law (typically 7 years)</Li>
        </UL>
        <P>
          Upon account deletion, we will delete or anonymize your personal data within 30 days, except where retention is required by law.
        </P>
      </Section>

      <Section title="9. Data Security">
        <P>
          We implement industry-standard technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction, including:
        </P>
        <UL>
          <Li>Encrypted data transmission using TLS/HTTPS</Li>
          <Li>Secure data storage with access controls</Li>
          <Li>Authentication via Supabase with hashed credentials</Li>
          <Li>Regular security reviews and updates</Li>
          <Li>Restricted internal access on a need-to-know basis</Li>
        </UL>
        <P>
          Despite these measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security and are not liable for unauthorized access resulting from circumstances beyond our reasonable control.
        </P>
      </Section>

      <Section title="10. Your Rights">
        <P>
          Depending on your location, you have the following rights regarding your personal data:
        </P>
        <UL>
          <Li><strong>Access:</strong> Request a copy of the personal data we hold about you</Li>
          <Li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</Li>
          <Li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal retention requirements</Li>
          <Li><strong>Restriction:</strong> Request that we limit processing of your data in certain circumstances</Li>
          <Li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</Li>
          <Li><strong>Objection:</strong> Object to processing based on our legitimate interests</Li>
          <Li><strong>Withdraw Consent:</strong> Withdraw consent at any time for consent-based processing (including AI training)</Li>
        </UL>
        <P>
          To exercise any of these rights, contact us at tryopencomputer@gmail.com with the subject line "Data Rights Request." We will acknowledge your request within 3 business days and respond within 30 days.
        </P>
      </Section>

      <Section title="11. Cookies">
        <P>
          We use only essential cookies necessary for the Services to function, specifically session and authentication cookies provided by Supabase. We do not use tracking, analytics, or advertising cookies.
        </P>
        <P>
          Please see our Cookie Policy for full details.
        </P>
      </Section>

      <Section title="12. Children's Privacy">
        <P>
          The Services are not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected personal data from a child under 13, we will take steps to delete that information as soon as possible.
        </P>
        <P>
          If you believe we have collected data from a child under 13, please contact us immediately at tryopencomputer@gmail.com.
        </P>
      </Section>

      <Section title="13. International Data Transfers">
        <P>
          Open Computer is based in India. Your data may be processed outside India through our service providers, including in countries that may have different data protection standards. Where such transfers occur, we ensure appropriate safeguards are in place, including contractual protections with our service providers.
        </P>
      </Section>

      <Section title="14. Changes to This Policy">
        <P>
          We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. We will notify you of material changes by posting the updated policy on the Site and, where appropriate, notifying you via email or in-platform notification.
        </P>
        <P>
          Your continued use of the Services after the effective date of the revised policy constitutes your acceptance of the changes.
        </P>
      </Section>

      <Section title="15. Contact">
        <P>
          For privacy-related questions, requests, or concerns, please contact us at:
        </P>
        <P>
          Open Computer<br />
          Bengaluru, Karnataka, India<br />
          Email: tryopencomputer@gmail.com<br />
          Response time: Within 7 business days
        </P>
        <P>
          For urgent privacy or security concerns, please mark your email subject as "URGENT — Privacy Concern."
        </P>
      </Section>

    </LegalLayout>
  );
}
