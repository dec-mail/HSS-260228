import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaticPages.css';

const FAQPage = () => {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "Who is eligible to join House Sharing Seniors?",
          a: "House Sharing Seniors is designed for Australian Age Pensioners who are looking for shared housing arrangements. You must be an Australian resident receiving the Age Pension and be committed to respectful co-living."
        },
        {
          q: "How do I apply to become a member?",
          a: "Click 'Start Your Application' on our homepage and complete the 8-step application form. You can save your progress and return later. Once submitted, our team will review your application and conduct necessary safety checks."
        },
        {
          q: "How long does the application process take?",
          a: "Most applications are reviewed within 5-7 business days. The process includes identity verification, police check verification, and reference checks. We'll keep you updated on your application status via email."
        },
        {
          q: "Is there a fee to join?",
          a: "Our basic membership is currently free. We may introduce optional premium features in the future, but you'll always be notified before any charges apply."
        }
      ]
    },
    {
      category: "Safety & Security",
      questions: [
        {
          q: "How do you verify members?",
          a: "All members undergo a comprehensive vetting process including identity verification, police check verification, and reference checks. We also verify that applicants are genuine Age Pensioners."
        },
        {
          q: "Is my personal information safe?",
          a: "Yes, we take data security seriously. Your information is encrypted and stored securely. We never share your financial details or sensitive information with other members. See our Privacy Policy for details."
        },
        {
          q: "What should I do if I feel unsafe?",
          a: "If you feel unsafe at any time, please contact us immediately at 1800 HSS AUS (1800 477 287). We take all safety concerns seriously and will investigate promptly."
        }
      ]
    },
    {
      category: "Finding Housemates",
      questions: [
        {
          q: "How does the matching process work?",
          a: "Once approved, you can browse anonymized profiles of other members. You can filter by preferences like location, lifestyle, and housing type. When you find potential matches, you can shortlist them and we'll facilitate introductions."
        },
        {
          q: "Can I choose who I share with?",
          a: "Absolutely! You have full control over who you connect with. We provide tools to help you find compatible housemates, but the final decision is always yours."
        },
        {
          q: "What information can other members see about me?",
          a: "Other members can see your first name, general location (suburb/region), lifestyle preferences, and shared housing preferences. They cannot see your full address, financial details, or contact information until you both agree to connect."
        }
      ]
    },
    {
      category: "Properties & Living Arrangements",
      questions: [
        {
          q: "Does House Sharing Seniors provide properties?",
          a: "We maintain a database of available properties suitable for shared living. Both our members and external property owners can list properties. We verify all listings before they go live."
        },
        {
          q: "How are rent and expenses divided?",
          a: "This is determined between housemates. Typically, costs are divided equally, but arrangements can vary. We recommend discussing and documenting all financial arrangements before moving in together."
        },
        {
          q: "What if the living arrangement doesn't work out?",
          a: "We recommend having a trial period before committing long-term. If issues arise, contact our support team for mediation. We can also help you find alternative arrangements."
        }
      ]
    },
    {
      category: "Account & Support",
      questions: [
        {
          q: "How do I update my profile?",
          a: "Log in to your account and go to the Member Dashboard. You can update your preferences, lifestyle information, and contact details at any time."
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can request account deletion at any time by contacting our support team. We'll process your request within 30 days and delete your personal information as per our Privacy Policy."
        },
        {
          q: "How do I contact support?",
          a: "You can reach us by phone at 1800 HSS AUS (1800 477 287), email at info@housesharingseniors.com.au, or through the Contact Us page on our website."
        }
      ]
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  let globalIndex = 0;

  return (
    <div className="static-page" data-testid="faq-page">
      {/* Header */}
      <header className="static-header">
        <div className="container">
          <div className="header-content">
            <img 
              src="/logo.png" 
              alt="House Sharing Seniors" 
              className="logo-image" 
              onClick={() => navigate('/')}
            />
            <nav>
              <button className="btn btn-secondary" onClick={() => navigate('/properties')}>
                Browse Properties
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/apply')}>
                Apply Now
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about House Sharing Seniors.</p>
        </div>
      </section>

      {/* Content */}
      <section className="page-content">
        <div className="container">
          {faqs.map((category, catIndex) => (
            <div className="content-section" key={catIndex}>
              <h2>{category.category}</h2>
              <div className="faq-list">
                {category.questions.map((faq, qIndex) => {
                  const currentIndex = globalIndex++;
                  return (
                    <div 
                      className={`faq-item ${openFAQ === currentIndex ? 'open' : ''}`} 
                      key={qIndex}
                    >
                      <button 
                        className="faq-question"
                        onClick={() => toggleFAQ(currentIndex)}
                        data-testid={`faq-${currentIndex}`}
                      >
                        {faq.q}
                        <span className="faq-icon">▼</span>
                      </button>
                      <div className="faq-answer">
                        {faq.a}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="content-section" style={{ textAlign: 'center' }}>
            <h2>Still Have Questions?</h2>
            <p>Can't find what you're looking for? Our friendly team is here to help.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/contact')}
              style={{ marginTop: '16px' }}
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="static-footer">
        <div className="container">
          <p>&copy; 2026 House Sharing Seniors. All rights reserved.</p>
          <p className="footer-links">
            <a href="/privacy">Privacy Policy</a> |
            <a href="/terms">Terms of Service</a> |
            <a href="/contact">Contact Us</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FAQPage;
