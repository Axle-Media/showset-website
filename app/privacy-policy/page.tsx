import type { Metadata } from "next";
import LegalPageShell, { type LegalSectionLink } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy | SHOWSET",
  description: "How SHOWSET collects, uses, protects and manages personal information, including your rights under South Africa's POPIA.",
};

const sections: LegalSectionLink[] = [
  { id: "who-we-are", title: "Who we are" },
  { id: "information-we-collect", title: "Information we collect" },
  { id: "how-we-collect-it", title: "How we collect it" },
  { id: "how-we-use-it", title: "How we use it" },
  { id: "sharing", title: "Sharing information" },
  { id: "cookies", title: "Cookies and analytics" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "Keeping information secure" },
  { id: "rights", title: "Your privacy rights" },
  { id: "international", title: "International transfers" },
  { id: "children", title: "Children's privacy" },
  { id: "changes", title: "Policy updates" },
  { id: "contact", title: "Contact and complaints" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      firstLine="Privacy"
      accentLine="Policy"
      summary="Your information matters. This policy explains what we collect, why we use it and how you can exercise your rights."
      sections={sections}
    >
      <section className="legal-section" id="who-we-are">
        <h2>Who we are</h2>
        <p>SHOWSET (&ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;) is an events and creative agency operating in South Africa. This Privacy Policy applies when you visit our website, <a href="https://showset.co.za">showset.co.za</a>, contact us, or enquire about our events, creative, digital, marketing or production services.</p>
        <p>For the purposes of South Africa&rsquo;s Protection of Personal Information Act, 2013 (&ldquo;POPIA&rdquo;), SHOWSET is the responsible party for the personal information we process for our own business purposes. Where we process information on behalf of a client, that client may be the responsible party.</p>
      </section>

      <section className="legal-section" id="information-we-collect">
        <h2>Information we collect</h2>
        <p>Depending on how you interact with us, we may collect:</p>
        <ul>
          <li><strong>Contact and business details:</strong> your name, email address, telephone number, company, job title and project requirements.</li>
          <li><strong>Communications:</strong> the enquiries, messages, feedback, files and other information you choose to send us.</li>
          <li><strong>Commercial records:</strong> quotations, contracts, billing details and payment or transaction records where necessary for an engagement.</li>
          <li><strong>Technical information:</strong> IP address, browser, device and operating-system details, referring pages, and information needed for website security and operation.</li>
          <li><strong>Website usage information:</strong> pages viewed and interaction or campaign data, where relevant analytics technologies are enabled.</li>
        </ul>
        <p>Please avoid sending sensitive personal information unless it is necessary for a specific project and we have agreed an appropriate way to receive it.</p>
      </section>

      <section className="legal-section" id="how-we-collect-it">
        <h2>How we collect it</h2>
        <p>We receive information directly from you when you email, phone, message us, request a proposal or work with us. The website contact experience may prepare an email for you to review and send using your own email application. Preparing that email alone does not send your enquiry to us.</p>
        <p>We may also obtain limited technical data automatically through our hosting and security services, or information from platforms you use to communicate with us, such as social networks and business partners, where permitted by law.</p>
      </section>

      <section className="legal-section" id="how-we-use-it">
        <h2>How we use it</h2>
        <p>We process personal information only where we have an appropriate legal basis, including taking steps at your request, fulfilling a contract, meeting legal obligations, pursuing legitimate business interests where lawful, or obtaining your consent where required.</p>
        <ul>
          <li>To respond to enquiries, prepare proposals and deliver agreed services.</li>
          <li>To manage projects, relationships, invoices and business records.</li>
          <li>To operate, secure, maintain and improve our website and services.</li>
          <li>To understand website performance and the effectiveness of our communications where measurement tools are in use.</li>
          <li>To send marketing updates where permitted, with an option to unsubscribe.</li>
          <li>To comply with legal duties, investigate misuse and protect our rights.</li>
        </ul>
        <p>We do not use personal information for purposes incompatible with those for which it was collected unless authorised or permitted by law.</p>
      </section>

      <section className="legal-section" id="sharing">
        <h2>Sharing information</h2>
        <p>We do not sell or rent your personal information. We may disclose information when reasonably necessary to trusted service providers supporting hosting, email, collaboration, analytics, accounting, payment processing or project delivery. We expect providers to handle personal information securely and only for authorised purposes.</p>
        <p>We may also disclose information where required by law, to establish or defend legal rights, with your permission, or in connection with a legitimate business restructure or transfer subject to applicable safeguards.</p>
      </section>

      <section className="legal-section" id="cookies">
        <h2>Cookies and analytics</h2>
        <p>Our website or its service providers may use cookies and similar technologies to support essential functionality, security, preferences and, where enabled, website analytics or marketing measurement. Not all categories necessarily operate on every visit.</p>
        <p>You can use your browser settings to block or delete cookies. If we introduce optional tracking that requires consent, we will provide the relevant choices. Blocking essential cookies may affect site functionality.</p>
      </section>

      <section className="legal-section" id="retention">
        <h2>How long we keep information</h2>
        <p>We retain personal information only for as long as needed for the purposes explained in this policy, including ongoing client relationships, legal or financial record-keeping and the resolution of disputes. Retention periods vary by record type and applicable law.</p>
        <p>When information is no longer required, we take reasonable steps to delete, destroy or de-identify it, unless continued retention is permitted or required by law.</p>
      </section>

      <section className="legal-section" id="security">
        <h2>Keeping information secure</h2>
        <p>We use reasonable technical and organisational safeguards appropriate to the information and risks involved. These may include access controls, reputable hosting and service providers, secure communication channels and the review of security practices. No internet transmission or storage system is completely risk-free.</p>
        <p>If we become aware of a security compromise affecting personal information, we will take appropriate action and provide notifications where the law requires them.</p>
      </section>

      <section className="legal-section" id="rights">
        <h2>Your privacy rights</h2>
        <p>Under POPIA and other laws that may apply to you, you may have the right to:</p>
        <ul>
          <li>Ask whether we hold personal information about you and request access to it.</li>
          <li>Request correction, deletion or destruction of inaccurate, unnecessary or unlawfully held information.</li>
          <li>Object to certain processing or withdraw consent where consent is the legal basis.</li>
          <li>Opt out of direct marketing communications.</li>
          <li>Lodge a complaint with the appropriate data protection authority.</li>
        </ul>
        <p>Additional rights, such as portability or other access and opt-out choices, may apply under laws including the GDPR or relevant US state privacy laws where those laws govern the particular processing. We may need to verify your identity and may be required or permitted to retain some records.</p>
        <p>To exercise your rights, email <a href="mailto:hello@showset.co.za">hello@showset.co.za</a>.</p>
      </section>

      <section className="legal-section" id="international">
        <h2>International transfers</h2>
        <p>SHOWSET operates in South Africa, while certain technology and service providers may process or store information elsewhere. Where personal information is transferred across borders, we assess and apply protections required under POPIA and any other applicable data protection law.</p>
      </section>

      <section className="legal-section" id="children">
        <h2>Children&rsquo;s privacy</h2>
        <p>Our website and services are directed at businesses and adult decision-makers, not children. We do not knowingly solicit personal information from children without appropriate authorisation. If you believe a child has provided us with personal information, contact us so we can review and take appropriate action.</p>
      </section>

      <section className="legal-section" id="changes">
        <h2>Policy updates</h2>
        <p>We may revise this policy as our website, services or legal obligations change. We will publish the updated version on this page and revise the &ldquo;Last updated&rdquo; date. Material changes may be communicated through other appropriate channels.</p>
      </section>

      <section className="legal-section" id="contact">
        <h2>Contact and complaints</h2>
        <p>For privacy questions, requests or complaints, contact SHOWSET in Cape Town, South Africa, at <a href="mailto:hello@showset.co.za">hello@showset.co.za</a> or <a href="tel:+27682805777">+27 68 280 5777</a>.</p>
        <p>If you believe your personal information has been processed unlawfully, you may also contact the <a href="https://inforegulator.org.za/complaints/" target="_blank" rel="noopener noreferrer">Information Regulator of South Africa</a>. Its POPIA complaints email is <a href="mailto:POPIAComplaints@inforegulator.org.za">POPIAComplaints@inforegulator.org.za</a>.</p>
        <p>For terms governing use of this website, see our <a href="/terms-and-conditions/">Terms &amp; Conditions</a>.</p>
      </section>
    </LegalPageShell>
  );
}
