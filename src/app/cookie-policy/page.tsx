import { LegalLayout, Section, P, SubHeading, UL, Li, Note } from "@/components/shared/LegalLayout";

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="April 15, 2026">

      <Section title="1. What Are Cookies">
        <P>
          Cookies are small text files placed on your device when you visit a website. They allow the website to recognize your device, remember your preferences, and enable certain features to function correctly.
        </P>
        <P>
          Cookies may be "session cookies," which are deleted when you close your browser, or "persistent cookies," which remain on your device for a set period or until manually deleted.
        </P>
      </Section>

      <Section title="2. Cookies We Use">
        <Note>
          We keep our cookie usage minimal and intentional. We only use cookies that are strictly necessary for the Services to function.
        </Note>

        <SubHeading>Essential Authentication Cookies (Supabase)</SubHeading>
        <P>
          We use session and authentication cookies provided by Supabase, our authentication and database infrastructure provider. These cookies are strictly necessary to:
        </P>
        <UL>
          <Li>Maintain your login state across pages and browser sessions</Li>
          <Li>Securely authenticate your identity when accessing the platform</Li>
          <Li>Protect your account from unauthorized access</Li>
          <Li>Enable secure API communication between your browser and our servers</Li>
        </UL>
        <P>
          These cookies contain session tokens and are essential to the operation of the Services. Without them, you will not be able to log in or use the platform.
        </P>

        <SubHeading>What We Do Not Use</SubHeading>
        <P>We do not use any of the following types of cookies:</P>
        <UL>
          <Li>Analytics or tracking cookies</Li>
          <Li>Advertising or retargeting cookies</Li>
          <Li>Third-party profiling cookies</Li>
          <Li>Marketing or behavioral tracking cookies</Li>
          <Li>Social media tracking pixels</Li>
        </UL>
      </Section>

      <Section title="3. Third-Party Cookies">
        <P>
          Our platform currently does not load third-party scripts or services that set their own cookies, beyond those described in Section 2 (Supabase). If this changes in the future, we will update this policy accordingly.
        </P>
        <P>
          When you connect third-party integrations such as Google Drive, those platforms may set their own cookies governed by their respective cookie and privacy policies. We encourage you to review those policies directly.
        </P>
      </Section>

      <Section title="4. Managing and Disabling Cookies">
        <P>
          You can control and manage cookies through your browser settings. Most modern browsers allow you to:
        </P>
        <UL>
          <Li>View cookies currently stored on your device</Li>
          <Li>Delete individual cookies or all cookies</Li>
          <Li>Block cookies from specific sites</Li>
          <Li>Block all third-party cookies</Li>
          <Li>Set preferences for cookie notifications</Li>
        </UL>
        <P>
          Please note that disabling essential authentication cookies will prevent you from logging in and using the Services. We are unable to provide the platform in a fully functional state without these cookies.
        </P>
        <P>
          For guidance on managing cookies in your specific browser, please refer to your browser's help documentation:
        </P>
        <UL>
          <Li>Google Chrome: Settings → Privacy and Security → Cookies and other site data</Li>
          <Li>Mozilla Firefox: Settings → Privacy and Security → Cookies and Site Data</Li>
          <Li>Safari: Preferences → Privacy → Manage Website Data</Li>
          <Li>Microsoft Edge: Settings → Cookies and site permissions</Li>
        </UL>
      </Section>

      <Section title="5. Changes to This Policy">
        <P>
          We may update this Cookie Policy as our platform evolves or as applicable laws change. Any changes will be reflected on this page with an updated effective date. We encourage you to review this policy periodically.
        </P>
      </Section>

      <Section title="6. Contact">
        <P>
          If you have questions about our use of cookies or this policy, please contact us at:
        </P>
        <P>
          Email: tryopencomputer@gmail.com<br />
          Response time: Within 7 business days
        </P>
      </Section>

    </LegalLayout>
  );
}
