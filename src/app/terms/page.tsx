import { LegalLayout, Section, P, SubHeading, UL, Li, Note } from "@/components/shared/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="April 30, 2026">

      <Section title="1. Introduction and Acceptance">
        <P>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") and Open Computer ("Open Computer," "we," "us," or "our"), the operator of the OpenSlide platform available at tryopenslide.com (the "Site") and all related AI-powered services for generating presentations, documents, spreadsheets, websites, applications, and other work product (collectively, the "Services").
        </P>
        <P>
          By accessing or using the Services, creating an account, or clicking any button indicating acceptance, you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree, you must not access or use the Services.
        </P>
        <P>
          If you are accepting these Terms on behalf of a company or other legal entity, you represent and warrant that you have the authority to bind such entity, and references to "you" shall refer to that entity.
        </P>
        <P>
          We reserve the right to modify these Terms at any time. We will notify you of material changes by posting updated Terms on the Site or notifying you via the platform. Your continued use of the Services following any such changes constitutes your acceptance of the revised Terms.
        </P>
      </Section>

      <Section title="2. Eligibility">
        <P>
          You must be at least 13 years of age to use the Services. By using the Services, you represent and warrant that you meet this requirement. If you are between 13 and 18 years old, you represent that your parent or legal guardian has reviewed and agreed to these Terms.
        </P>
        <P>
          The Services are not available to any person previously suspended or removed from the Services by us.
        </P>
      </Section>

      <Section title="3. Account Registration and Security">
        <P>
          To access certain features, you must register for an account. You agree to:
        </P>
        <UL>
          <Li>Provide accurate, current, and complete information during registration</Li>
          <Li>Maintain and promptly update your account information</Li>
          <Li>Keep your login credentials secure and confidential</Li>
          <Li>Notify us immediately at tryopencomputer@gmail.com of any unauthorized access to your account</Li>
          <Li>Accept responsibility for all activity that occurs under your account</Li>
        </UL>
        <P>
          We reserve the right to suspend or terminate any account that we reasonably believe has been compromised or is being used in violation of these Terms.
        </P>
      </Section>

      <Section title="4. License to Use the Services">
        <P>
          Subject to your compliance with these Terms, we grant you a limited, personal, non-exclusive, non-transferable, revocable license to access and use the Services for creating, editing, and sharing presentations, documents, spreadsheets, websites, applications, and other AI-generated work product for personal or commercial purposes, consistent with your plan.
        </P>
        <P>
          This license does not include the right to: sublicense, sell, resell, or commercially exploit the Services beyond your own use; modify, copy, or create derivative works of the Services; reverse engineer or attempt to extract source code from the platform; use any automated means to access or scrape the Services beyond normal usage; or frame or mirror the Services on any other website.
        </P>
        <P>
          This license terminates immediately upon any violation of these Terms or termination of your account.
        </P>
      </Section>

      <Section title="5. Credits System">
        <SubHeading>Free Credits</SubHeading>
        <P>
          Upon account creation, users may receive free credits at our sole discretion. Currently, new users receive 150 free credits. Free credits are provided as a complimentary benefit and are subject to the following:
        </P>
        <UL>
          <Li>Free credits are non-refundable and have no monetary value</Li>
          <Li>The quantity, availability, and terms of free credits may be modified, reduced, or discontinued at any time without prior notice</Li>
          <Li>Free credits are non-transferable between accounts</Li>
        </UL>

        <SubHeading>Paid Credits</SubHeading>
        <P>
          Additional credits may be purchased as described on our pricing page. Paid credits are subject to the following terms:
        </P>
        <UL>
          <Li>Paid credits do not expire and remain valid until used or until account termination</Li>
          <Li>Credits are non-transferable between accounts</Li>
          <Li>Credit costs per generation may change; updated costs will be communicated through the platform</Li>
          <Li>All purchases are subject to our Refund Policy</Li>
        </UL>

        <SubHeading>Usage</SubHeading>
        <P>
          Each generation action on the platform consumes a specified number of credits. We reserve the right to adjust credit costs for any feature at any time. Such changes will be reflected on the platform before taking effect.
        </P>

        <Note>
          Credits have no cash value and cannot be exchanged for money under any circumstances, except as outlined in our Refund Policy in the case of qualifying technical failures.
        </Note>
      </Section>

      <Section title="6. Intellectual Property Rights">
        <SubHeading>Our Rights</SubHeading>
        <P>
          Open Computer retains all right, title, and interest in and to the Services, including but not limited to: the OpenSlide platform and underlying technology; all software, code, AI models, algorithms, and systems; user interfaces, design layouts, and visual elements; all content provided by us; and all improvements, modifications, and derivative works thereof (collectively, "OpenSlide Materials").
        </P>
        <P>
          OpenSlide Materials are protected by applicable intellectual property laws. No rights or licenses are granted to you in OpenSlide Materials except as expressly set forth in these Terms.
        </P>

        <SubHeading>Your Rights</SubHeading>
        <P>
          You retain all right, title, and interest in and to the content you create, upload, or generate through the Services, including presentations, documents, spreadsheets, websites, applications, project files, and prompts ("User Content"), subject to the license granted below and any applicable third-party rights.
        </P>
      </Section>

      <Section title="7. User Content and License">
        <P>
          By using the Services, you grant Open Computer a worldwide, non-exclusive, royalty-free license to access, process, store, and use your User Content solely to: provide and operate the Services; maintain and improve the platform; and as further described in our AI Training section below.
        </P>
        <P>
          You represent and warrant that:
        </P>
        <UL>
          <Li>You own or have the necessary rights to your User Content</Li>
          <Li>Your User Content does not infringe any third-party intellectual property, privacy, or other rights</Li>
          <Li>Your User Content complies with all applicable laws and regulations</Li>
          <Li>Your User Content does not contain malicious code or harmful content</Li>
        </UL>

        <SubHeading>AI Model Training</SubHeading>
        <P>
          For users on the free tier, anonymized User Content and prompts may be used to train and improve our AI models. This helps us deliver better results for all users. Paid users' content is never used for AI training purposes.
        </P>
        <P>
          Free tier users who wish to opt out of AI training use of their data may contact us at tryopencomputer@gmail.com.
        </P>
      </Section>

      <Section title="8. Third-Party Integrations">
        <P>
          The Services may offer integrations with third-party platforms such as Google Drive, GitHub, Vercel, and others made available through our platform. These integrations are subject to the following:
        </P>
        <UL>
          <Li>Third-party integrations are governed by the respective third-party's terms of service and privacy policies</Li>
          <Li>We are not responsible for the practices, availability, or content of third-party platforms</Li>
          <Li>You are responsible for ensuring you have the right to access and use content through third-party integrations</Li>
          <Li>We request only the permissions necessary to provide the requested functionality</Li>
          <Li>You may revoke third-party integration permissions at any time through your account settings</Li>
        </UL>
      </Section>

      <Section title="9. Prohibited Conduct">
        <P>You agree not to use the Services to:</P>
        <UL>
          <Li>Violate any applicable law, regulation, or third-party rights</Li>
          <Li>Infringe any intellectual property, privacy, or proprietary rights</Li>
          <Li>Upload or transmit malicious code, viruses, or harmful content</Li>
          <Li>Attempt to gain unauthorized access to the Services or other users' accounts</Li>
          <Li>Reverse engineer, decompile, or attempt to extract source code from the platform</Li>
          <Li>Use automated scripts, bots, or scraping tools beyond normal platform use</Li>
          <Li>Misrepresent your identity, affiliation, or the origin of any content</Li>
          <Li>Generate content that is defamatory, obscene, threatening, or otherwise harmful</Li>
          <Li>Interfere with or disrupt the integrity or performance of the Services</Li>
          <Li>Circumvent any security measures or usage limits</Li>
          <Li>Resell, sublicense, or commercially exploit the Services without our express written consent</Li>
        </UL>
        <P>
          We reserve the right to investigate and take appropriate legal action against anyone who violates these provisions, including suspending or terminating access to the Services.
        </P>
      </Section>

      <Section title="10. Disclaimer of Warranties">
        <P>
          THE SERVICES, PLATFORM, AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
        </P>
        <P>
          WE DO NOT WARRANT THAT: THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE; ANY DEFECTS WILL BE CORRECTED; THE SERVICES OR SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR HARMFUL COMPONENTS; OR THE RESULTS OBTAINED FROM USE OF THE SERVICES WILL BE ACCURATE OR RELIABLE.
        </P>
        <P>
          AI-GENERATED CONTENT MAY CONTAIN INACCURACIES OR ERRORS. YOU ARE SOLELY RESPONSIBLE FOR REVIEWING AND VERIFYING ANY AI-GENERATED OUTPUT BEFORE RELYING ON IT.
        </P>
      </Section>

      <Section title="11. Limitation of Liability">
        <P>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OPEN COMPUTER AND ITS FOUNDERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICES.
        </P>
        <P>
          IN NO EVENT SHALL OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE SERVICES EXCEED THE GREATER OF: (A) THE AMOUNT PAID BY YOU TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED INDIAN RUPEES (INR 100).
        </P>
        <P>
          SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </P>
      </Section>

      <Section title="12. Indemnification">
        <P>
          You agree to defend, indemnify, and hold harmless Open Computer and its founders, employees, agents, licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to: your use of the Services; your User Content; your violation of these Terms; your violation of any applicable law or regulation; or your violation of any third-party rights.
        </P>
      </Section>

      <Section title="13. Termination">
        <P>
          We may suspend or terminate your access to the Services at any time, with or without cause or notice, including for violation of these Terms, prolonged inactivity, or any other reason at our sole discretion.
        </P>
        <P>
          You may terminate your account at any time by contacting us at tryopencomputer@gmail.com. Upon termination, your license to use the Services ends immediately and any unused paid credits may be subject to our Refund Policy.
        </P>
        <P>
          The following sections survive termination: Intellectual Property Rights, Disclaimer of Warranties, Limitation of Liability, Indemnification, and Governing Law.
        </P>
      </Section>

      <Section title="14. Governing Law and Dispute Resolution">
        <P>
          These Terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
        </P>
        <P>
          Any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Services shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, such disputes shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
        </P>
        <P>
          Notwithstanding the foregoing, we may seek injunctive or other equitable relief in any court of competent jurisdiction to protect our intellectual property or confidential information.
        </P>
      </Section>

      <Section title="15. General Provisions">
        <SubHeading>Entire Agreement</SubHeading>
        <P>
          These Terms, together with our Privacy Policy, Refund Policy, and Cookie Policy, constitute the entire agreement between you and Open Computer with respect to the Services and supersede all prior agreements and understandings.
        </P>

        <SubHeading>Severability</SubHeading>
        <P>
          If any provision of these Terms is found to be unenforceable or invalid, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.
        </P>

        <SubHeading>No Waiver</SubHeading>
        <P>
          Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
        </P>

        <SubHeading>Assignment</SubHeading>
        <P>
          You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations without restriction.
        </P>
      </Section>

      <Section title="16. Contact">
        <P>
          For questions, concerns, or notices regarding these Terms, please contact us at:
        </P>
        <P>
          Open Computer<br />
          Bengaluru, Karnataka, India<br />
          Email: tryopencomputer@gmail.com<br />
          Response time: Within 5 business days
        </P>
      </Section>

    </LegalLayout>
  );
}
