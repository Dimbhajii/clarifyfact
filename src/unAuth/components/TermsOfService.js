import React from 'react';
import NavBar from './NavBar';
import Footer from '../../Footer';
import './TermsOfService.css';

function TermsOfService() {
  return (
    <div className="terms-page">
      <NavBar />
      
      <div className="terms-container">
        <h1 className="terms-title">Terms of Service</h1>
        <p className="terms-updated">Last updated 01/29/2025</p>
        
        <div className="terms-content">
          <div className="terms-intro">
            <p>
              This Terms of Service agreement is entered into by you ("you" or "your") and 
              ClarifyFact ("Company," "we," "us," or "our"). These Legal Terms govern your 
              access to and use of our website and any related products or services provided 
              by ClarifyFact (collectively, the "Services"). By accessing or using our Services, 
              you agree that you have read, understood, and accepted these Legal Terms.
            </p>
            <p>
              If you do not agree with all of these Legal Terms, you are expressly prohibited 
              from using our Services and must discontinue use immediately.
            </p>
            <p>
              Supplemental terms and conditions or additional documents that we may post from 
              time to time are hereby incorporated by reference into these Legal Terms. We reserve 
              the right, at our sole discretion, to make changes or modifications to these Legal 
              Terms at any time without prior notice. The "Last Updated" date above will reflect 
              such changes.
            </p>
            <p>
              It is your responsibility to periodically review these Legal Terms, and your 
              continued use of our Services after any changes have been made constitutes your 
              acceptance of the revised terms.
            </p>
            <p>
              The Services are intended for users who are at least 18 years old. Persons under 
              18 are not permitted to use or register for our Services.
            </p>
            <p>
              It is recommended that you print a copy of these Legal Terms for your records.
            </p>
          </div>

          <div className="terms-toc">
            <h2>Table of Contents</h2>
            <ul>
              <li><a href="#services">OUR SERVICES</a></li>
              <li><a href="#intellectual">INTELLECTUAL PROPERTY RIGHTS</a></li>
              <li><a href="#user-rep">USER REPRESENTATIONS</a></li>
              <li><a href="#registration">USER REGISTRATION</a></li>
              <li><a href="#purchases">PURCHASES AND PAYMENT</a></li>
              <li><a href="#cancellation">CANCELLATION</a></li>
              <li><a href="#subscription">SUBSCRIPTION TERM AND TERMINATION</a></li>
              <li><a href="#prohibited">PROHIBITED ACTIVITIES</a></li>
              <li><a href="#user-content">USER GENERATED CONTRIBUTIONS</a></li>
              <li><a href="#license">CONTRIBUTION LICENSE</a></li>
              <li><a href="#third-party">THIRD-PARTY WEBSITES AND CONTENT</a></li>
              <li><a href="#management">SERVICES MANAGEMENT</a></li>
              <li><a href="#privacy">PRIVACY POLICY</a></li>
              <li><a href="#copyright">COPYRIGHT INFRINGEMENTS</a></li>
              <li><a href="#term">TERM AND TERMINATION</a></li>
              <li><a href="#modifications">MODIFICATIONS AND INTERRUPTIONS</a></li>
              <li><a href="#governing">GOVERNING LAW</a></li>
              <li><a href="#disputes">DISPUTE RESOLUTION</a></li>
              <li><a href="#corrections">CORRECTIONS</a></li>
              <li><a href="#disclaimer">DISCLAIMER</a></li>
              <li><a href="#liability">LIMITATIONS OF LIABILITY</a></li>
              <li><a href="#indemnification">INDEMNIFICATION</a></li>
              <li><a href="#user-data">USER DATA</a></li>
              <li><a href="#electronic">ELECTRONIC COMMUNICATIONS</a></li>
              <li><a href="#miscellaneous">MISCELLANEOUS</a></li>
              <li><a href="#refunds">REFUNDS</a></li>
              <li><a href="#marketing">MARKETING COMMUNICATIONS</a></li>
              <li><a href="#contact">CONTACT US</a></li>
            </ul>
          </div>

          <section id="services" className="terms-section">
            <h2>1. OUR SERVICES</h2>
            <p>
              The information provided when using our Services is not intended for distribution 
              or use by any person or entity in any jurisdiction where such distribution or use 
              is contrary to applicable law or regulation. Those who access our Services from 
              locations where local laws differ do so on their own initiative and are solely 
              responsible for compliance with local laws.
            </p>
            <p>
              The Services are not specifically tailored to comply with any industry-specific 
              regulations (for example, those applicable to healthcare or financial services); 
              if your interactions would be subject to such laws, you may not use the Services.
            </p>
          </section>

          <section id="intellectual" className="terms-section">
            <h2>2. INTELLECTUAL PROPERTY RIGHTS</h2>
            <p>
              We are the owner or licensee of all intellectual property rights in our Services, 
              including all source code, databases, software, website designs, audio, video, text, 
              photographs, and graphics (collectively, the "Content"), as well as the trademarks, 
              service marks, and logos (the "Marks"). Our Content and Marks are protected by 
              copyright, trademark, and other applicable intellectual property laws worldwide.
            </p>
            <p>
              Subject to your compliance with these Legal Terms, we grant you a limited, 
              non-exclusive, non-transferable, revocable license to access our Services and 
              download or print a copy of any portion of the Content to which you have gained 
              lawful access, solely for your personal, non-commercial use or internal business 
              purposes. No part of the Services, the Content, or the Marks may be copied, 
              reproduced, transmitted, or otherwise exploited for commercial purposes without 
              our express prior written consent.
            </p>
            <p>
              Unauthorized use of any Content or Marks will constitute a material breach of 
              these Legal Terms and may result in immediate termination of your right to use 
              our Services.
            </p>
          </section>

          <section id="user-rep" className="terms-section">
            <h2>3. USER REPRESENTATIONS</h2>
            <p>By using our Services, you represent and warrant that:</p>
            <ul>
              <li>All information provided during registration or through use of the Services is true, accurate, current, and complete.</li>
              <li>You will maintain and promptly update such information as necessary.</li>
              <li>You have the legal capacity and agree to comply with these Legal Terms.</li>
              <li>You are not a minor in your jurisdiction of residence.</li>
              <li>You will not use any automated or non-human methods to access the Services.</li>
              <li>Your use of the Services is for lawful purposes only and will not breach any applicable law or regulation.</li>
            </ul>
            <p>
              If any information you provide is untrue, inaccurate, or incomplete, we reserve 
              the right to suspend or terminate your account and refuse any current or future 
              use of our Services.
            </p>
          </section>

          <section id="registration" className="terms-section">
            <h2>4. USER REGISTRATION</h2>
            <p>
              Registration may be required to access certain Services. You are responsible for 
              safeguarding your password and for all activities that occur under your account. 
              We reserve the right to remove, reclaim, or change any username you choose if, 
              in our sole discretion, the username is deemed inappropriate, obscene, or objectionable.
            </p>
          </section>

          <section id="purchases" className="terms-section">
            <h2>5. PURCHASES AND PAYMENT</h2>
            <p>
              For any transactions made via the Services, you agree to provide current, complete, 
              and accurate purchase and account information. You further agree to update your 
              account and payment information, such as email address and card details, to ensure 
              that transactions can be processed and to enable us to contact you if necessary. 
              All payments shall be made in the currency specified at the time of purchase. Sales 
              tax may be added as required by us. Prices are subject to change at any time.
            </p>
            <p>
              You authorize us to charge your payment provider for any charges incurred at the 
              prices then in effect. For subscriptions with recurring charges, you consent to 
              such charges until you cancel the subscription in accordance with these terms. We 
              reserve the right to correct any pricing errors even after payment has been processed.
            </p>
          </section>

          <section id="cancellation" className="terms-section">
            <h2>6. CANCELLATION</h2>
            <p>
              All purchases made through our Services are non-refundable. You can cancel your 
              subscription at any time by logging into your account. Upon cancellation, you will 
              lose any remaining usage credits or allotted usage immediately. Refund of credits 
              or payments will not be provided under any circumstances.
            </p>
          </section>

          <section id="subscription" className="terms-section">
            <h2>7. SUBSCRIPTION TERM AND TERMINATION</h2>
            <p>
              Your subscription to our Services is valid only for the period during which our 
              operations remain active. We do not guarantee that your subscription will last for 
              a full year or for any specified period. If ClarifyFact discontinues operations or 
              is otherwise unable to provide the Services during your subscription term, your 
              subscription will terminate immediately without any refund.
            </p>
            <p>
              By using our Services, you acknowledge and accept the risk that your subscription 
              may end before the period initially paid for.
            </p>
            <p>
              If you are unsatisfied with our Services at any time, please email us at 
              hello.clarifyfact@gmail.com.
            </p>
          </section>

          <section id="prohibited" className="terms-section">
            <h2>8. PROHIBITED ACTIVITIES</h2>
            <p>
              You may not use the Services for any purpose other than as provided by ClarifyFact. 
              Prohibited conduct includes, but is not limited to:
            </p>
            <ul>
              <li>Systematically retrieving data or content from our Services to compile, aggregate, or create databases or directories without our written consent.</li>
              <li>Defrauding, deceiving, or misleading ClarifyFact or other users, including attempts to access sensitive account information such as passwords.</li>
              <li>Circumventing or disabling security features of our Services.</li>
              <li>Disparaging or causing harm to ClarifyFact or the Services.</li>
              <li>Using information obtained via our Services to harass, abuse, or harm another person.</li>
              <li>Improperly using support services or submitting false reports of abuse or misconduct.</li>
              <li>Violating applicable laws or regulations through your use of the Services.</li>
              <li>Framing, linking to, or otherwise using our Services in unauthorized ways.</li>
              <li>Uploading or transmitting viruses, malware, or other harmful materials that interfere with the functionality of the Services.</li>
              <li>Engaging in automated use of the system, such as using bots, scripts, or data mining tools to interact with the Services without permission.</li>
              <li>Attempting to bypass any measures designed to prevent or restrict access to the Services or to copy protected content.</li>
              <li>Any other activity that ClarifyFact, in its sole discretion, deems to be harmful, illegal, or inappropriate.</li>
            </ul>
          </section>

          <section id="user-content" className="terms-section">
            <h2>9. USER GENERATED CONTRIBUTIONS</h2>
            <p>
              Our Services may allow you to post or submit content, comments, reviews, or other 
              materials ("Contributions"). By submitting Contributions, you agree to the following:
            </p>
            <ul>
              <li>Your Contributions are non-confidential and may be used by ClarifyFact.</li>
              <li>You are solely responsible for your Contributions and the consequences of posting them.</li>
              <li>Contributions must not infringe upon any third party's intellectual property or other rights.</li>
              <li>Your Contributions must not contain material that is unlawful, harmful, defamatory, obscene, or otherwise objectionable.</li>
              <li>ClarifyFact reserves the right to remove, edit, or relocate any Contribution that it, in its sole discretion, deems harmful or in breach of these Legal Terms.</li>
              <li>You agree to indemnify ClarifyFact for any harm or losses resulting from your Contributions.</li>
            </ul>
          </section>

          <section id="license" className="terms-section">
            <h2>10. CONTRIBUTION LICENSE</h2>
            <p>
              By posting any Contributions to our Services, you grant ClarifyFact an unrestricted, 
              perpetual, irrevocable, worldwide, non-exclusive, royalty-free, transferable license 
              to use, reproduce, modify, publish, distribute, translate, display, and perform your 
              Contributions in any media and for any purpose, including commercial purposes. You 
              waive all moral rights with respect to your Contributions.
            </p>
            <p>
              ClarifyFact does not claim ownership of your Contributions, but you grant us the 
              right to use them as needed to operate and improve the Services.
            </p>
          </section>

          <section id="third-party" className="terms-section">
            <h2>11. THIRD-PARTY WEBSITES AND CONTENT</h2>
            <p>
              The Services may contain links to third-party websites or services that are not 
              owned or controlled by ClarifyFact. We have no control over, and assume no 
              responsibility for, the content, privacy policies, or practices of any third-party 
              websites or services. You acknowledge and agree that ClarifyFact shall not be 
              responsible or liable for any damage or loss caused by your use of any third-party 
              content, goods, or services.
            </p>
          </section>

          <section id="management" className="terms-section">
            <h2>12. SERVICES MANAGEMENT</h2>
            <p>
              We reserve the right, but not the obligation, to: (1) monitor the Services for 
              violations of these Legal Terms; (2) take appropriate legal action against anyone 
              who violates these Legal Terms; (3) refuse, restrict access to, limit availability 
              of, or disable any Contribution or any portion thereof; (4) remove from the Services 
              or otherwise disable all files and content that are excessive in size or burdensome 
              to our systems; and (5) manage the Services in a manner designed to protect our 
              rights and property and to facilitate the proper functioning of the Services.
            </p>
          </section>

          <section id="privacy" className="terms-section">
            <h2>13. PRIVACY POLICY</h2>
            <p>
              We care about data privacy and security. Please review our Privacy Policy. By using 
              our Services, you agree to be bound by our Privacy Policy, which is incorporated 
              into these Legal Terms. Our Services are hosted in the United States. If you access 
              the Services from any other region with laws governing data collection and use that 
              may differ from U.S. law, please be aware that you are transferring information to 
              the United States, and we will process your data in accordance with our Privacy Policy.
            </p>
          </section>

          <section id="copyright" className="terms-section">
            <h2>14. COPYRIGHT INFRINGEMENTS</h2>
            <p>
              We respect the intellectual property rights of others. If you believe that any 
              material available through our Services infringes your copyright, please notify 
              us by providing the following information in writing:
            </p>
            <ul>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing.</li>
              <li>Your contact information, including address, telephone number, and email.</li>
              <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner.</li>
              <li>A statement that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner.</li>
            </ul>
            <p>
              Please note that, under applicable law, you may be held liable for damages if you 
              make misrepresentations regarding an infringement claim.
            </p>
          </section>

          <section id="term" className="terms-section">
            <h2>15. TERM AND TERMINATION</h2>
            <p>
              These Legal Terms will remain in full force and effect while you use our Services. 
              ClarifyFact reserves the right, at its sole discretion and without notice or liability, 
              to deny access or terminate your account if you breach any provision of these Legal 
              Terms or any applicable law or regulation. If your account is terminated, you are not 
              permitted to create a new account under any name or on behalf of any other person or entity.
            </p>
            <p>
              ClarifyFact may also pursue appropriate legal action against you as necessary.
            </p>
          </section>

          <section id="modifications" className="terms-section">
            <h2>16. MODIFICATIONS AND INTERRUPTIONS</h2>
            <p>
              ClarifyFact may change, modify, or remove the contents of the Services at any time 
              without notice. We are under no obligation to update the information provided on our 
              Services. We do not guarantee that our Services will be available at all times, and 
              we may experience interruptions, delays, or errors from time to time. Under no 
              circumstances will ClarifyFact be liable for any loss, damage, or inconvenience caused 
              by any unavailability or interruption of the Services.
            </p>
          </section>

          <section id="governing" className="terms-section">
            <h2>17. GOVERNING LAW</h2>
            <p>
              These Legal Terms and your use of the Services are governed by and construed in 
              accordance with the laws of the jurisdiction in which ClarifyFact operates, without 
              regard to any conflicts of law principles.
            </p>
          </section>

          <section id="disputes" className="terms-section">
            <h2>18. DISPUTE RESOLUTION</h2>
            <p><strong>Informal Negotiations</strong></p>
            <p>
              Before initiating any formal dispute resolution process, you and ClarifyFact agree 
              to attempt to resolve any disputes informally for a period of at least thirty (30) 
              days following written notice from one party to the other.
            </p>
            <p><strong>Binding Arbitration</strong></p>
            <p>
              If a dispute cannot be resolved informally, any unresolved dispute shall be resolved 
              through binding arbitration conducted under generally applicable rules. The arbitration 
              will be conducted on an individual basis, and neither party may participate in any 
              class, consolidated, or representative action. Should you initiate or join a class or 
              representative proceeding, ClarifyFact may terminate your access to our Services 
              immediately. Additionally, any claim must be brought within two (2) years of the date 
              the cause of action arose.
            </p>
          </section>

          <section id="corrections" className="terms-section">
            <h2>19. CORRECTIONS</h2>
            <p>
              There may be errors, inaccuracies, or omissions in the information provided through 
              our Services. ClarifyFact reserves the right to correct any errors or update any 
              information at its sole discretion without prior notice.
            </p>
          </section>

          <section id="disclaimer" className="terms-section">
            <h2>20. DISCLAIMER</h2>
            <p className="terms-caps">
              THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. YOU AGREE THAT YOUR 
              USE OF THE SERVICES IS AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, 
              CLARIFYFACT DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING THE IMPLIED 
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="terms-caps">
              CLARIFYFACT DOES NOT WARRANT THAT THE SERVICES OR ANY CONTENT WILL BE ACCURATE, 
              COMPLETE, OR UNINTERRUPTED, AND WE SHALL NOT BE RESPONSIBLE FOR ANY ERRORS, MISTAKES, 
              OR INACCURACIES IN THE CONTENT. ANY RELIANCE ON THE SERVICES IS AT YOUR OWN RISK.
            </p>
          </section>

          <section id="liability" className="terms-section">
            <h2>21. LIMITATIONS OF LIABILITY</h2>
            <p className="terms-caps">
              IN NO EVENT SHALL CLARIFYFACT, ITS OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR 
              ANY THIRD PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
              DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES, WHETHER SUCH 
              LIABILITY IS BASED ON CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE, EVEN IF 
              CLARIFYFACT HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="terms-caps">
              YOUR TOTAL LIABILITY, WHETHER IN CONTRACT, WARRANTY, TORT, OR OTHERWISE, SHALL NOT 
              EXCEED THE AMOUNT PAID BY YOU, IF ANY, FOR ACCESSING THE SERVICES. SOME LAWS DO NOT 
              ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO THE ABOVE LIMITATIONS MAY 
              NOT APPLY TO YOU.
            </p>
          </section>

          <section id="indemnification" className="terms-section">
            <h2>22. INDEMNIFICATION</h2>
            <p>
              You agree to defend, indemnify, and hold harmless ClarifyFact, its subsidiaries, 
              affiliates, officers, agents, and employees from and against any claims, liabilities, 
              damages, losses, and expenses (including reasonable attorneys' fees and costs) arising 
              out of or in any way connected with your access to or use of the Services, your 
              Contributions, your violation of these Legal Terms, or your infringement of any rights 
              of a third party.
            </p>
          </section>

          <section id="user-data" className="terms-section">
            <h2>23. USER DATA</h2>
            <p>
              ClarifyFact will maintain data that you transmit through our Services solely for 
              managing and operating the Services and for analytics purposes. While we regularly 
              perform routine data backups, you are responsible for any data you provide. ClarifyFact 
              shall not be liable for any loss or corruption of your data.
            </p>
          </section>

          <section id="electronic" className="terms-section">
            <h2>24. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2>
            <p>
              All communications, transactions, and signatures exchanged between you and ClarifyFact 
              electronically shall be treated as if they were in writing. By using our Services, you 
              consent to receive electronic communications, and you agree that all such communications 
              satisfy any legal requirement that such communications be in writing.
            </p>
          </section>

          <section id="miscellaneous" className="terms-section">
            <h2>25. MISCELLANEOUS</h2>
            <p>
              These Legal Terms, along with any additional policies we post on the Services, 
              constitute the entire agreement between you and ClarifyFact. Our failure to enforce 
              any provision of these Legal Terms does not constitute a waiver of such provision. We 
              may assign or transfer our rights and obligations hereunder without notice to you.
            </p>
            <p>
              If any provision of these Legal Terms is held to be invalid or unenforceable, such 
              provision shall be severed from these Legal Terms, and the remaining provisions shall 
              remain in full force and effect. No joint venture, partnership, employment, or agency 
              relationship is created by these Legal Terms.
            </p>
          </section>

          <section id="refunds" className="terms-section">
            <h2>26. REFUNDS</h2>
            <p>
              By subscribing to our services, you acknowledge that ClarifyFact gives you instant 
              access to digital features and that usage begins immediately after purchase. This means 
              you waive your right to the standard 14-day withdrawal period. Due to the high costs of 
              running AI models and server resources, all payments are non-refundable, as resources 
              are allocated and costs are incurred the moment you begin using the service.
            </p>
            <p>
              ClarifyFact operates on a subscription model, available on a monthly or yearly basis. 
              Subscriptions renew automatically for the same period unless you cancel before the 
              renewal date. You can manage or cancel your subscription at any time via the billing 
              section of our website. Please note that canceling does not entitle you to a refund or 
              credit for any payments already made.
            </p>
            <p>
              We reserve the right to adjust pricing, features (such as available credits or models), 
              or service offerings at any time. Price changes for subscription plans will only take 
              effect at your next renewal.
            </p>
            <p>
              Unless specified otherwise, subscription fees do not include taxes or duties. You are 
              responsible for paying any applicable taxes related to your purchase. We may require 
              proof of payment or other documentation for tax compliance. In cases of overdue payments, 
              your access to the service may be paused after written notice.
            </p>
            <p>
              You are not allowed to create multiple accounts to take advantage of free-tier usage. 
              If we determine misuse or bad faith behavior, we may suspend your account or charge 
              standard fees accordingly.
            </p>
          </section>

          <section id="marketing" className="terms-section">
            <h2>27. MARKETING COMMUNICATIONS</h2>
            <p>
              By creating an account or providing your email, you consent to receive marketing 
              communications from ClarifyFact, including newsletters, promotions, and product updates.
            </p>
            <p>
              You may opt out of these communications at any time by clicking the "unsubscribe" link 
              in any marketing email or contacting us at hello.clarifyfact@gmail.com. Please note that 
              you will still receive essential service-related communications that are necessary for 
              the operation of your account.
            </p>
          </section>

          <section id="contact" className="terms-section">
            <h2>28. CONTACT US</h2>
            <p>
              For any questions, concerns, or further information regarding these Legal Terms or the 
              Services, please contact us by email at <a href="mailto:hello.clarifyfact@gmail.com">hello.clarifyfact@gmail.com</a>.
            </p>
          </section>

          <div className="terms-footer-note">
            <p>
              This document is intended to serve as a legally binding agreement between you and 
              ClarifyFact regarding the use of our Services.
            </p>
            <p className="terms-ethical-note">
              ClarifyFact is not a tool for academic dishonesty or cheating. 
              <a href="/ethical-usage"> Read more</a>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default TermsOfService;

