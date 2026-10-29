import type { Metadata } from "next";
import LegalPageShell from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions | SHOWSET",
  description: "Terms governing access to and use of the SHOWSET website, its content, enquiries and external links.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell
      firstLine="Terms &"
      accentLine="Conditions"
      currentPage="terms"
      summary="The practical details about using our website, accessing our content and getting in touch with SHOWSET."
    >
      <section className="legal-section" id="acceptance">
        <h2>Using our website</h2>
        <p>These Terms &amp; Conditions govern your use of the SHOWSET website at <a href="https://showset.co.za">showset.co.za</a> (the &ldquo;website&rdquo;). By accessing or using the website, you agree to these terms to the extent permitted by applicable law. If you do not agree, please discontinue use of the website.</p>
        <p>SHOWSET is an events and creative agency based in South Africa. These are website terms only. They do not replace a signed proposal, statement of work, event agreement or other client contract. If a separate agreement applies to services we supply, that agreement governs those services.</p>
      </section>

      <section className="legal-section" id="website-use">
        <h2>Acceptable use</h2>
        <p>You may browse and share links to our publicly available website for lawful, personal or legitimate business purposes. You agree not to:</p>
        <ul>
          <li>Use the website in breach of applicable law or another person&rsquo;s rights.</li>
          <li>Attempt to gain unauthorised access to systems, accounts or data.</li>
          <li>Introduce malicious code or interfere with website performance or security.</li>
          <li>Scrape, reproduce or commercially exploit substantial website content without permission, except where permitted by law.</li>
          <li>Misrepresent your identity or submit fraudulent or misleading enquiries.</li>
        </ul>
        <p>We may restrict access or take appropriate action in response to misuse.</p>
      </section>

      <section className="legal-section" id="intellectual-property">
        <h2>Our creative work</h2>
        <p>Unless otherwise indicated, the website design, brand elements, text, graphics, photography, videos, animations and other original material are owned by SHOWSET or used with permission from the relevant rights holders. Applicable intellectual property laws protect this material.</p>
        <p>You may not copy, modify, redistribute, publish or commercially use our material without prior written permission, unless permitted by law. Client brands, marks and featured work remain subject to their respective owners&rsquo; rights.</p>
      </section>

      <section className="legal-section" id="enquiries">
        <h2>Enquiries and proposals</h2>
        <p>Submitting an enquiry or requesting a quote does not create a binding service agreement or guarantee availability, pricing or a response within a particular period. Project scope, deliverables, fees, timelines, usage rights, cancellations and payment terms will be agreed separately in writing where applicable.</p>
        <p>Only share project material that you have the right to provide. We will handle personal information in accordance with our <a href="/privacy-policy/">Privacy Policy</a>.</p>
      </section>

      <section className="legal-section" id="third-party">
        <h2>Third-party websites</h2>
        <p>Our website may link to external websites or services, including social media platforms. We do not control their content, security or privacy practices and are not responsible for them. Visiting an external site is at your discretion and subject to that provider&rsquo;s terms.</p>
      </section>

      <section className="legal-section" id="accuracy">
        <h2>Website information</h2>
        <p>We aim to present accurate, relevant and up-to-date information. However, website content, portfolio examples, descriptions of services and other general information may change and may contain errors or omissions. Nothing on the website is a binding offer unless expressly stated otherwise in a separate written agreement.</p>
        <p>Where project examples or third-party brands appear, their inclusion does not necessarily imply a current commercial relationship or endorsement.</p>
      </section>

      <section className="legal-section" id="liability">
        <h2>Liability</h2>
        <p>We take reasonable care in operating our website, but cannot guarantee that it will always be uninterrupted, error-free or free from security risks. To the extent permitted by applicable law, SHOWSET is not liable for indirect or consequential loss arising solely from use of or inability to access the website.</p>
        <p>Nothing in these terms excludes or limits any liability or consumer right that cannot lawfully be excluded or limited under South African or other applicable law.</p>
      </section>

      <section className="legal-section" id="changes">
        <h2>Updates and availability</h2>
        <p>We may change website features, content and these terms from time to time. The revised version will appear on this page with an updated date. Your continued use after changes are published is subject to the revised terms to the extent permitted by law.</p>
      </section>

      <section className="legal-section" id="law">
        <h2>Applicable law</h2>
        <p>These website terms are governed by the laws of the Republic of South Africa, subject to any mandatory rights or protections that apply in your jurisdiction. Disputes are subject to the jurisdiction of the competent South African courts, unless applicable law provides otherwise.</p>
      </section>

      <section className="legal-section" id="contact">
        <h2>Get in touch</h2>
        <p>For questions about these website terms, please contact SHOWSET, Cape Town, South Africa, at <a href="mailto:hello@showset.co.za">hello@showset.co.za</a> or <a href="tel:+27682805777">+27 68 280 5777</a>.</p>
        <p>To understand how we handle your personal information, read our <a href="/privacy-policy/">Privacy Policy</a>.</p>
      </section>
    </LegalPageShell>
  );
}
