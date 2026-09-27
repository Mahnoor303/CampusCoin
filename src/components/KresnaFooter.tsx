import React, { useEffect, useState } from 'react';

export default function KresnaFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    function fitWatermark() {
      const svg = document.getElementById('watermarkSvg');
      const text = document.getElementById('watermarkText') as SVGGraphicsElement | null;
      if (!svg || !text) return;
      try {
        const bbox = text.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          svg.setAttribute(
            'viewBox',
            `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
          );
        }
      } catch (e) {
        // Fallback to initial viewBox if getBBox is unavailable
      }
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitWatermark);
    } else {
      window.addEventListener('load', fitWatermark);
    }

    window.addEventListener('resize', fitWatermark);
    // Initial attempt
    fitWatermark();

    return () => {
      window.removeEventListener('resize', fitWatermark);
      window.removeEventListener('load', fitWatermark);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 4000);
  };

  return (
    <section className="footer-section">
      <div className="footer-wrapper">
        {/* Left card — .footer-left (video background) */}
        <div className="footer-left">
          <video
            className="footer-left-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4"
              type="video/mp4"
            />
          </video>

          {/* .footer-logo */}
          <div className="footer-logo">
            <div className="footer-logo-mark">
              K
            </div>
            <span className="footer-logo-name">Kresna</span>
          </div>

          {/* .footer-tagline-container */}
          <div className="footer-tagline-container">
            <p className="footer-tagline">
              Smarter sales automation,
              <br />
              <span>powered by AI.</span>
            </p>
          </div>

          {/* .footer-social-row */}
          <div className="footer-social-row">
            <span className="footer-social-label">Stay in touch!</span>
            <div className="footer-social-icons">
              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Discord"
                title="Discord"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="X (Twitter)"
                title="X"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="GitHub"
                title="GitHub"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Right card — .footer-right (light gray) */}
        <div className="footer-right">
          {/* Floating "Feeling lucky?" badge — .footer-lucky-graphic */}
          <div className="footer-lucky-graphic">
            <div className="lucky-cube" title="Kresna">
              <span className="lucky-cube-mark">K</span>
            </div>
            <div className="lucky-text-row">
              <svg
                className="lucky-arrow"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 20 C 6 14, 10 9, 18 5" />
                <path d="M18 5 L 12 5" />
                <path d="M18 5 L 18 11" />
              </svg>
              <span className="lucky-text">Feeling lucky?</span>
            </div>
          </div>

          {/* Top — .footer-right-top with .footer-nav-cols */}
          <div className="footer-right-top">
            <div className="footer-nav-cols">
              {/* Column 1 — title "Navigation" */}
              <div className="footer-col">
                <div className="footer-col-title">Navigation</div>
                <a href="#how-it-works">How it works</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#testimonials">Testimonials</a>
                <a href="#faq">FAQ</a>
              </div>

              {/* Column 2 — title "Company" */}
              <div className="footer-col">
                <div className="footer-col-title">Company</div>
                <a href="#blog">Blog</a>
                <a href="#about">About</a>
                <a href="#terms">Terms and Condition</a>
                <a href="#privacy">Privacy Policy</a>
              </div>
            </div>
          </div>

          {/* Bottom — .footer-bottom */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2025 Kresna. All rights reserved.
            </div>

            <div className="footer-cta-mini">
              <h4>
                AI moves fast.
                <br />
                <strong>Stay ahead with Kresna.</strong>
              </h4>

              <form onSubmit={handleSubscribe} className="footer-subscribe-row">
                <input
                  type="email"
                  required
                  placeholder={subscribed ? 'Subscribed!' : 'Enter email address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subscribed}
                />
                <button type="submit">
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark — .footer-watermark (sits outside .footer-wrapper but inside the section) */}
      <div className="footer-watermark" aria-hidden="true">
        <svg
          id="watermarkSvg"
          viewBox="62 95 876 175"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            id="watermarkText"
            x="500"
            y="240"
            textAnchor="middle"
            fontSize="320"
          >
            Kresna
          </text>
        </svg>
      </div>
    </section>
  );
}
