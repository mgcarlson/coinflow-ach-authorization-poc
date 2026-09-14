import { MERCHANT_NAME, MERCHANT_SUPPORT } from "./catalog";

export function buildEsignConsentText(companyName = MERCHANT_NAME): string {
  const support = MERCHANT_SUPPORT;
  return `Electronic Record and Signature Disclosure (E-SIGN Consent)

Introduction and General Consent
This E-SIGN Disclosure and Consent Notice ("Notice") constitutes the full agreement by and between ${companyName} ("We" or "Our" or "Us"), and the person(s) giving his/her consent below on their behalf and on behalf of the business or entity ("you" and "your") with information relating to your electronic receipt of disclosures and notices (collectively, the "Communications"), or as applicable, electronic signature of documents in relation to your relationship with Us.
This Notice applies to all Communications, as defined below, for services provided by ${companyName}. Under this Notice, Communications you receive in electronic form will be considered "in writing".
By consenting to the terms of this Agreement, you acknowledge that your Account is entirely internet based and is not designed to include the option to request paper delivery of Communications, all of which will be delivered electronically. If you do not wish to receive electronic delivery of your documents or do not wish to electronically sign documents, ${companyName} will not establish a relationship with you.
By using ${companyName} electronic and online services ("Electronic Services") you hereby consent to this Notice and affirm that you have access to the hardware and software requirements identified below. In addition, you must review and accept the terms of these services. If you choose not to consent to this Notice or you withdraw your consent, you will be restricted from using Our Electronic Services.

Communications to Be Provided in Electronic Form
Documents We provide to you in electronic form ("Electronic Communications") may include, but are not limited to, disclosures and other notices regarding our products and services such as:
This E-Sign Consent and any amendments
Terms and conditions, and other notices, and any changes
Legal and regulatory disclosures and communications associated with related products and services
Privacy statement or notices and any changes
Any notice or disclosures regarding fees and changes
Notices of any amendments to any of your agreements with Us
Disclosures pertaining to your activity with Us, including, but not limited to, initial disclosures, transaction receipts, and/or periodic statements
Error resolution policies and notices

Method of Providing Communications to You in Electronic Form
All electronic Communications that We provide to you will be provided by any of the following means, as determined by ${companyName}:
(1) By posting such information to your mobile application portal and or/document storage
(2) By posting a message to your account home page
(3) By text message or SMS to the mobile phone number(s) associated with your Account (which may include a link to the information on ${companyName}'s website)
(4) By electronic or e-mail transmission to your designated e-mail address, or
(5) By electronic or e-mail transmission with a hyperlink to the ${companyName}'s website or other website where information is posted

Your Right to Withdraw Consent
If you determine, after you have established a relationship with Us, that you do not wish to receive electronic document delivery, please note that ${companyName} will terminate its relationship with you as applicable. Your consent to receive and sign electronic Documents will remain in effect until revoked.
You may withdraw your consent to receive Electronic Communications under this Notice by writing to Us via e-mail at ${support} and including (1) the subject line "Withdraw Electronic Consent," and (2) Your name and email address.
Your withdrawal of consent will cancel your agreement to receive Electronic Communications, and therefore, your ability to use our Electronic Services. In the event you provide Us with an invalid e-mail address, or a subsequent malfunction of a previously valid e-mail address occurs, at our option, We may treat this as a withdrawal of your consent to receive electronic Communications.
Any withdrawal of your consent to receive Electronic Communications will be effective only after We have a reasonable period of time to process your withdrawal. In the meantime, you will continue to receive Electronic Communications. If you withdraw your consent, the legal validity and enforceability of prior Electronic Communications delivered will not be affected. In addition, you may experience a delay in obtaining information regarding your transactions.

How to Update Your Records
It is your responsibility to keep your primary e-mail address true, accurate, and complete so that ${companyName} can communicate with you electronically. You understand and agree that if ${companyName} sends you an Electronic Communication, but you do not receive it because your primary e-mail address on file is incorrect, out of date, blocked by your service provider, or you are otherwise unable to receive Electronic Communications, ${companyName} will be deemed to have provided the Electronic Communication to you; however, We may deem your account inactive. You may not be able to transact using our services until We receive a valid, working primary e-mail address from you.
If you use a spam filter or similar software that blocks or re-routes e-mails from senders not listed in your e-mail address book, We recommend that you add ${companyName} to your e-mail address book so that you can receive Electronic Communications from Us.
You can update your address and contact information by signing into your account profile, reviewing, and updating the information stored on file. If you are experiencing issues, you can contact ${companyName} at ${support}.

Requesting Paper Copies
You may request from us a paper copy of any record provided or made available electronically to you by us by contacting Us at ${support}. You will have the opportunity to print out and retain a copy of all the Disclosures you review or sign at our request through the ${companyName} platform, you may access the documents for a period of time (usually 30 days) after such documents are first sent to you. After such time, if you wish for Us to send you paper copies of any such Disclosures, you will be charged a $1.00 per-page fee.
To request delivery from Us of paper copies of the Disclosures previously provided by Us to you electronically, you must send us an email specifying in detail the Disclosure you would like to receive and provide us with sufficient information to identify the Disclosure you are requesting in the body of such request and you must provide your full name, mailing address, email address, and telephone number.
For the avoidance of doubt, requesting a paper copy of any Disclosure, in and of itself, will not be treated as withdrawal of consent to receive Electronic Communications.

Hardware and Software Requirements
In order to access, view, and retain Electronic Communications that We make available to you, you must have:
A valid e-mail address or mobile phone number
A computer, mobile, tablet, or similar device with internet access and current browser software and computer software that is capable of receiving, accessing, displaying, and either printing or storing Electronic Communications received from Us
Supported desktop browsers: Chrome, Microsoft Edge, Mozilla Firefox, or Safari updated to the current version
Supported operating systems: current version of Windows or Mac
Supported mobile operating systems: current version of Android or iOS
Adobe Acrobat Reader ® updated to the current version, and
Sufficient storage space to save Electronic Communications (whether presented online, in e-mails, texts, or PDF) or the ability to print Electronic Communications
We define "current version" as a version of the software currently supported by its publisher. We reserve the right to discontinue support of a current version of software if, in our sole opinion, it suffers from a security flaw or other flaw that makes it unsuitable for our use of Electronic Communications.
If there is a substantial change in these requirements, you will be notified of the requirement changes accordingly.
We may request that you respond to an e-mail to demonstrate you are able to receive Electronic Communications.

Federal Law
You acknowledge and agree that your consent to Electronic Communications is being provided in connection with a transaction affecting interstate commerce that is subject to the E-SIGN Act, and that you and We both intend that the Act apply to the fullest extent possible to validate our ability to conduct business with you by electronic means.

Termination/Changes
We reserve the right, in our sole discretion, to discontinue the provision of your Electronic Communications, or to terminate or change the terms and conditions on which We provide Electronic Communications. We will provide you with notice of any such termination or change as required by law.

Enforceability
Whenever possible, each provision of this Consent will be interpreted in such a manner as to be effective and valid under applicable law. If any provision of this Consent will be prohibited by or invalid under applicable law, such provision will be ineffective only to the extent of such prohibition or invalidity, without invalidating the remainder of such provision or the remaining provisions of this Consent.`;
}

export function buildTermsAndConditions(): string {
  return `${MERCHANT_NAME} Terms & Conditions

Last updated: September 14, 2026

These Terms & Conditions govern your use of ${MERCHANT_NAME}'s website, products, and payment services. By creating an account or completing a purchase, you agree to these Terms.

1. Electronic Record and Signature Disclosure (E-SIGN Consent)
The Electronic Record and Signature Disclosure below is incorporated into these Terms & Conditions in full. Your agreement to these Terms includes your consent to that E-SIGN Disclosure. A checkbox click authorizing an ACH debit is legally equivalent to your signature only because this E-SIGN Consent is in effect.

${buildEsignConsentText()}

2. ACH debit authorizations
When you authorize an ACH debit, you will be shown separate authorization language for that payment. That authorization, together with these Terms (including the E-SIGN Consent above), forms your agreement to the debit.

3. Contact
Questions about these Terms or E-SIGN consent: ${MERCHANT_SUPPORT}.`;
}
