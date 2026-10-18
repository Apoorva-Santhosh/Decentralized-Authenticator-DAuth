import React from 'react';
import './FAQs.css';

export default function FAQs() {
  const faqs = [
    { question: 'What is the purpose of this application?', answer: 'Analyze passwords, suggest stronger alternatives, and log in with a password plus proof of wallet ownership. The public blockchain records wallet registrations without credentials.' },
    { question: 'Where are passwords stored?', answer: 'The server stores a uniquely salted Argon2id verifier in a private credential store. Passwords and their verifiers are never stored on the blockchain.' },
    { question: 'Does the server receive my password?', answer: 'Analysis and suggestions run in your browser. Registering or logging in sends the selected password to the authentication server for hashing or verification. A public installation must use HTTPS. Plaintext passwords are not saved or logged.' },
    { question: 'What does the blockchain protect?', answer: 'It provides a public record of wallet registrations. Password verification, sessions, and private login history are managed by the server. Blockchain storage does not make passwords secret.' },
    { question: 'How do I choose a password?', answer: 'Use a unique password or passphrase with 15 to 128 characters. Spaces and Unicode are accepted. Common passwords are blocked. There is no mandatory mix of uppercase letters, numbers, or symbols.' },
    { question: 'What does the strength score mean?', answer: 'Scores run from 0 (Very Weak) to 4 (Very Strong). These and the cracking-time estimates are estimates, not guarantees. The analyzer looks for patterns as well as length.' },
    { question: 'How do suggestions work?', answer: 'Suggestions transform your input and add a cryptographically random suffix. A suggestion is shown only if it fits the length limits and has a higher estimated strength score. Only the password you actually enter is registered.' },
    { question: 'Why does MetaMask ask for a signature?', answer: 'The server requests a short-lived, one-time signature to verify that you control the wallet. You must also supply the correct password. Signing in does not send a blockchain transaction or require gas.' },
    { question: 'Who can see my login history?', answer: 'The server checks your authenticated session before returning your own recent login history. Public wallet registration events are shown separately.' },
    { question: 'Can I reuse my password?', answer: 'Use a different password for every service. Strength analysis cannot protect a password that is leaked or reused elsewhere.' },
  ];
  return <div className="faq-container"><h2>Frequently Asked Questions</h2>{faqs.map((faq) => (
    <div key={faq.question} className="faq-item"><h3>{faq.question}</h3><p>{faq.answer}</p></div>
  ))}</div>;
}
