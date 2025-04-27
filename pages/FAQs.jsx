import React from "react";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function FAQs() {
  const faqs = [
    {
      question: "What is the purpose of this application?",
      answer: "This app helps users analyze and improve their passwords using advanced techniques like entropy analysis, dictionary attack detection, and smart password modifications. It then stores only hashed passwords securely on a blockchain."
    },
    {
      question: "How is this different from a regular password manager?",
      answer: "Unlike traditional managers that rely on centralized servers, this app uses blockchain to store password hashes in a decentralized, tamper-proof way, reducing the risk of mass data breaches."
    },
    {
      question: "How does blockchain increase security?",
      answer: "Blockchain is decentralized and immutable, meaning once data is written, it cannot be altered. This ensures that password data (stored as hashes) is safe from tampering or unauthorized access—even by insiders."
    },
    {
      question: "Can the website admin see my password?",
      answer: "No. Your password is hashed using secure algorithms before being stored. Only the hash is saved, and it cannot be reversed to reveal your original password—even by the admin."
    },
    {
      question: "Are the chances of my account getting compromised reduced now?",
      answer: "Yes. With password strength checks, modification tools, and bockchain-based storage, your account is significantly better protected against brute-force attacks, data leaks, and weak password reuse."
    },
    {
      question: "What does the strength score mean?",
      answer: "Passwords are scored from 0 to 4 and labeled as: Very Weak, Weak, Fair, Strong, or Very Strong. This score is based on factors like length, unpredictability, and pattern detection."
    },
    {
      question: "What happens when I use the 'Modify Password' feature?",
      answer: "Your password is enhanced using randomized transformations such as leetspeak substitutions, capitalization, and the insertion of special characters—improving both complexity and unpredictability."
    },
    {
      question: "Are my passwords stored anywhere?",
      answer: "Only the hashed (encrypted) version of your password is stored on the blockchain. The original password is never saved, transmitted, or accessible, ensuring maximum privacy."
    },
    {
      question: "Can I see how long it would take to crack my password?",
      answer: "Yes! The password analyzer provides an estimated cracking time using real-world attack models (e.g., offline brute-force attempts), helping you understand your password's resilience."
    },
    {
      question: "What if I use the same password on multiple websites?",
      answer: "That's risky. Even if your password is strong, using it across services can expose you in case of data breaches elsewhere. This app encourages creating unique, strong passwords for each site to improve security."
    }
  ];

    return (
    <Layout>
      <div className="faq-container">
        <h2>Frequently Asked Questions</h2>
        {faqs.map((faqs, idx) => (
          <div key={idx} className="faq-item">
            <h3>{faqs.question}</h3>
            <p>{faqs.answer}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
};
