import { LegalLayout, Section, P, SubHeading, UL, Li, Note } from "@/components/shared/LegalLayout";

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="April 15, 2026">

      <Note>
        Quick summary: Free credits are non-refundable. Paid credits are non-refundable once used for generation. We issue full refunds only in the case of verified technical failures on our end, within 7 days of purchase.
      </Note>

      <Section title="1. Overview">
        <P>
          OpenSlide operates on a credits-based model. Credits are consumed when you initiate AI-powered generation of presentations, documents, or other content through the platform. This policy governs all refund requests related to credit purchases and usage.
        </P>
        <P>
          Please read this policy carefully before making any purchase. By purchasing credits, you acknowledge and agree to the terms set out below.
        </P>
      </Section>

      <Section title="2. Free Credits">
        <P>
          Upon account creation, users may receive free credits at Open Computer's sole discretion. Currently, new users receive 150 free credits as a complimentary benefit.
        </P>
        <P>
          Free credits are subject to the following conditions:
        </P>
        <UL>
          <Li>Free credits are provided at no charge and are entirely non-refundable</Li>
          <Li>Free credits have no monetary value and cannot be exchanged for cash under any circumstances</Li>
          <Li>The quantity, availability, and terms of free credits may be modified, reduced, or discontinued at any time at our discretion and without prior notice</Li>
          <Li>Free credits are non-transferable between accounts</Li>
        </UL>
        <P>
          If a free credit generation fails due to a technical error on our end, we will replace it with a credit of the same type. No cash refund will be issued since no payment was made.
        </P>
      </Section>

      <Section title="3. Paid Credits">
        <P>
          Additional credits may be purchased through the platform as described on our pricing page. Paid credits are subject to the following terms:
        </P>
        <UL>
          <Li>Paid credits do not expire and remain valid until used or until your account is terminated</Li>
          <Li>Paid credits are non-transferable between accounts</Li>
          <Li>All purchases are final subject to the refund eligibility conditions set out in Section 4</Li>
        </UL>
      </Section>

      <Section title="4. When You Are Eligible for a Refund">
        <P>
          We will issue a full refund in the following verified circumstances, with no questions asked:
        </P>
        <UL>
          <Li>A generation failed entirely due to a verified technical error on our end, and no output was delivered to your account</Li>
          <Li>You were charged but credits were never added to your account following a successful payment</Li>
          <Li>A duplicate payment was processed due to a payment gateway error</Li>
          <Li>You were charged an incorrect amount due to a pricing or system error on our platform</Li>
        </UL>
        <P>
          All eligible refund requests must be submitted within 7 days of the original payment date. Requests submitted after this window will not be considered regardless of the circumstances.
        </P>
      </Section>

      <Section title="5. When You Are Not Eligible for a Refund">
        <P>
          Refunds will not be issued in the following circumstances:
        </P>
        <UL>
          <Li>Credits have been used to initiate a generation, regardless of your satisfaction with the output quality, tone, design, or structure</Li>
          <Li>You are dissatisfied with AI-generated content after it has been delivered to your account</Li>
          <Li>Free credits of any kind, including the initial 150 credits on signup</Li>
          <Li>Refund requests submitted more than 7 days after the original payment date</Li>
          <Li>Change of mind after purchase where credits remain unused in your account</Li>
          <Li>Account termination due to violation of our Terms of Service</Li>
          <Li>Inability to use credits due to failure to understand how the platform works</Li>
        </UL>
        <Note>
          AI-generated content will not always be perfect. Dissatisfaction with output quality is not a basis for a refund. We encourage you to use the conversational editing features of the platform to refine your results.
        </Note>
      </Section>

      <Section title="6. Accidental Purchases">
        <P>
          If you believe you made an accidental purchase and the credits have not been used, contact us within 1 hour of the transaction at tryopencomputer@gmail.com with the subject line "Accidental Purchase — [your registered email]."
        </P>
        <P>
          We will review your account activity and, if the credits are confirmed unused, process a full refund. We cannot guarantee cancellation after 1 hour as generation processes may have already been initiated.
        </P>
      </Section>

      <Section title="7. How to Request a Refund">
        <P>
          All refund requests must be submitted by email. We do not accept refund requests through social media, in-platform chat, or any other channel.
        </P>
        <SubHeading>Email</SubHeading>
        <P>tryopencomputer@gmail.com</P>

        <SubHeading>Subject Line</SubHeading>
        <P>Refund Request — [your registered email address]</P>

        <SubHeading>Required Information</SubHeading>
        <UL>
          <Li>Your registered account email address</Li>
          <Li>Date and amount of the payment</Li>
          <Li>Transaction or order ID (if available)</Li>
          <Li>Description of the issue</Li>
          <Li>Supporting evidence such as screenshots or screen recordings of the technical error</Li>
        </UL>
        <P>
          Incomplete refund requests may result in delays or rejection. We reserve the right to request additional information to verify your claim.
        </P>
      </Section>

      <Section title="8. Refund Timeline">
        <SubHeading>Review Process</SubHeading>
        <UL>
          <Li>Acknowledgement of request: Within 1 business day</Li>
          <Li>Review and decision: Within 3 business days</Li>
          <Li>If approved, refund initiation: Within 2 business days</Li>
        </UL>

        <SubHeading>Processing Time</SubHeading>
        <UL>
          <Li>Credit or debit cards: 5 to 10 business days</Li>
          <Li>UPI, net banking, and domestic Indian payment methods: Subject to your bank or issuer's processing timeline</Li>
        </UL>

        <P>
          Refunds are processed to the original payment method only. We do not issue refunds in the form of cash, cheque, or alternative payment instruments.
        </P>
      </Section>

      <Section title="9. Changes to This Policy">
        <P>
          Open Computer reserves the right to update this Refund Policy at any time. Changes will be reflected on this page with an updated effective date. For material changes, we will notify registered users by email. Continued use of the Services after a policy update constitutes acceptance of the revised terms.
        </P>
      </Section>

      <Section title="10. Contact">
        <P>
          For refund queries, contact us at:
        </P>
        <P>
          Email: tryopencomputer@gmail.com<br />
          Subject: Refund Request — [your registered email]<br />
          Response time: Within 2 business days
        </P>
      </Section>

    </LegalLayout>
  );
}
