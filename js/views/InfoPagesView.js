/**
 * Info & Legal Pages View
 * Renders About, Privacy Policy, Terms of Service, Contact Us, and Copyright/Anti-Piracy pages.
 */

import { Toast } from '../components/Toast.js';

export const InfoPagesView = {
  async render(container, queryParams, type = 'about') {
    let content = '';

    switch (type) {
      case 'about':
        content = this.renderAbout();
        break;
      case 'privacy':
        content = this.renderPrivacy();
        break;
      case 'terms':
        content = this.renderTerms();
        break;
      case 'contact':
        content = this.renderContact();
        break;
      case 'copyright':
        content = this.renderCopyright();
        break;
      default:
        content = this.renderAbout();
    }

    container.innerHTML = `
      <div class="container" style="padding: 48px 20px; max-width: 900px; min-height: 70vh;">
        <!-- Breadcrumb Navigation -->
        <nav style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-dim); margin-bottom: 24px;">
          <a href="#/" style="color: var(--text-muted); text-decoration: none;">Home</a>
          <span>/</span>
          <span style="color: var(--accent-purple-light);">${this.getPageTitle(type)}</span>
        </nav>

        <div style="
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        ">
          ${content}
        </div>
      </div>
    `;

    if (type === 'contact') {
      this.attachContactHandlers();
    }
  },

  getPageTitle(type) {
    const titles = {
      about: 'About AnimeVerse',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Contact Us',
      copyright: 'Copyright & Anti-Piracy Policy'
    };
    return titles[type] || 'Information';
  },

  renderAbout() {
    return `
      <div style="margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 24px;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
          About <span style="background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AnimeVerse</span>
        </h1>
        <p style="font-size: 1.05rem; color: var(--text-muted); line-height: 1.6;">
          Your high-performance, dark-themed discovery engine, release calendar, and personal tracking library for anime enthusiasts worldwide.
        </p>
      </div>

      <div style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; display: flex; flex-direction: column; gap: 24px;">
        <section>
          <h2 style="color: #fff; font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">🌟 Our Mission</h2>
          <p>
            AnimeVerse was created with a clear vision: to provide a blazingly fast, modern, and privacy-respecting portal for finding new shows, tracking seasonal simulcasts, and managing your personal watchlist without clutter, popups, or piracy.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">⚡ Architecture & Technology</h2>
          <p>
            Built from the ground up as a responsive Single Page Application (SPA), AnimeVerse interfaces with the authoritative <strong>AniList GraphQL API</strong> for live anime metadata, scheduling, character dossiers, and studio histories. User profiles, watchlists, ratings, and reviews are orchestrated via <strong>Supabase</strong> with Row-Level Security (RLS) and encrypted session authentication.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.3rem; margin-bottom: 10px; font-weight: 700;">🛡️ 100% Legal & Legitimate Discovery</h2>
          <p>
            AnimeVerse is purely a discovery, calendar, and community tracking platform. We do not host, re-encode, or distribute any copyrighted video streams. Instead, we promote the anime industry by directing viewers to official and licensed platforms including Crunchyroll, Netflix, Hulu, HIDIVE, and Disney+.
          </p>
        </section>

        <div style="display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap;">
          <a href="#/browse" class="btn btn-primary">Explore Catalog</a>
          <a href="#/calendar" class="btn btn-secondary">Release Calendar</a>
        </div>
      </div>
    `;
  },

  renderPrivacy() {
    return `
      <div style="margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 24px;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px;">
          Privacy Policy
        </h1>
        <p style="font-size: 0.9rem; color: var(--text-dim);">
          Effective Date: January 1, 2026 &bull; Last Updated: September 2026
        </p>
      </div>

      <div style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; display: flex; flex-direction: column; gap: 24px;">
        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">1. Information We Collect</h2>
          <p>
            When you register an account, we collect your email address, chosen display name, and avatar image. We also store your watchlist preferences, episode watch progress, ratings, and public reviews that you choose to submit.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">2. How We Store & Protect Your Data</h2>
          <p>
            Authentication and user data are secured via Supabase using industry-standard JWT encryption and PostgreSQL Row-Level Security (RLS). You have full control over your stored credentials, and passwords are never visible in plaintext.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">3. Cookies and Local Storage</h2>
          <p>
            We use your browser's local and session storage solely to maintain your authentication session, preserve your filter preferences, and cache GraphQL API queries to minimize network requests. We do not sell or monetize personal browsing data.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">4. Your Rights & Data Deletion</h2>
          <p>
            You can delete or export your watchlist, comments, and profile information at any time from your Profile settings or by contacting our team.
          </p>
        </section>
      </div>
    `;
  },

  renderTerms() {
    return `
      <div style="margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 24px;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px;">
          Terms of Service
        </h1>
        <p style="font-size: 0.9rem; color: var(--text-dim);">
          Effective Date: January 1, 2026 &bull; Last Updated: September 2026
        </p>
      </div>

      <div style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; display: flex; flex-direction: column; gap: 24px;">
        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the AnimeVerse website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">2. Community Guidelines</h2>
          <p>
            AnimeVerse encourages vibrant, passionate discussions about anime and manga. However, user reviews, comments, and usernames must remain free of hate speech, harassment, spam, spoilers without spoiler warnings, and links to unauthorized or pirated materials.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">3. Intellectual Property Rights</h2>
          <p>
            All anime titles, artwork, character likenesses, and studio logos are copyright of their respective creators, publishers, and production committees. AnimeVerse does not claim ownership of any third-party metadata provided via public APIs.
          </p>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">4. Limitation of Liability</h2>
          <p>
            AnimeVerse is provided on an "as-is" and "as-available" basis. We are not liable for any discrepancies in broadcast air times, third-party streaming availability, or temporary service interruptions.
          </p>
        </section>
      </div>
    `;
  },

  renderCopyright() {
    return `
      <div style="margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 24px;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple-light)" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Copyright & Anti-Piracy Policy
        </h1>
        <p style="font-size: 1.05rem; color: var(--accent-purple-light); line-height: 1.6;">
          AnimeVerse operates with zero-tolerance for copyright infringement and media piracy.
        </p>
      </div>

      <div style="color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; display: flex; flex-direction: column; gap: 24px;">
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); padding: 20px;">
          <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 8px; font-weight: 700;">Key Legal Declarations</h3>
          <ul style="list-style: disc; margin-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>No Video Hosting:</strong> AnimeVerse does NOT store, encode, scrape, host, download, or re-transmit full episodes, clips, or copyrighted video streams of any kind on its servers.</li>
            <li><strong>Metadata Attribution:</strong> Synopsis, cover art thumbnails, release schedules, and character listings are pulled on-demand from the community-driven public AniList GraphQL API.</li>
            <li><strong>Official External Links:</strong> All "Watch Now" or "Official Streaming" buttons route exclusively to legitimate, authorized distribution partners such as Crunchyroll, Netflix, Hulu, Disney+, Amazon Prime Video, or official studio broadcast portals.</li>
          </ul>
        </div>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">Digital Millennium Copyright Act (DMCA) Notice</h2>
          <p>
            If you are a copyright owner or an agent thereof and believe that any content provided on this platform infringes upon your copyrights, you may submit a notification pursuant to the DMCA by providing our designated agent with the following information in writing:
          </p>
          <ol style="list-style: decimal; margin-left: 20px; margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to permit us to locate the material.</li>
            <li>Your contact information including address, telephone number, and email address.</li>
            <li>A statement that you have a good faith belief that use of the material is not authorized.</li>
            <li>A statement that the information in the notification is accurate and under penalty of perjury.</li>
          </ol>
        </section>

        <section>
          <h2 style="color: #fff; font-size: 1.25rem; margin-bottom: 10px; font-weight: 700;">DMCA Contact</h2>
          <p>
            Notices should be sent to: <code style="color: var(--accent-purple-light); background: rgba(255,255,255,0.06); padding: 4px 8px; border-radius: 4px;">copyright@animeverse.local</code> or submitted via our <a href="#/contact" style="color: var(--accent-purple-light); text-decoration: underline;">Contact Form</a>.
          </p>
        </section>
      </div>
    `;
  },

  renderContact() {
    return `
      <div style="margin-bottom: 32px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 24px;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 12px;">
          Contact AnimeVerse Support
        </h1>
        <p style="font-size: 1.05rem; color: var(--text-muted); line-height: 1.6;">
          Have feedback, found a bug, or want to suggest an improvement? We'd love to hear from you.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;" class="contact-grid">
        <form id="contact-form" style="display: flex; flex-direction: column; gap: 18px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Your Name</label>
            <input type="text" id="contact-name" required placeholder="e.g. Spike Spiegel" class="form-input" style="width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Email Address</label>
            <input type="email" id="contact-email" required placeholder="spike@bebop.org" class="form-input" style="width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Topic</label>
            <select id="contact-topic" class="form-input" style="width: 100%; padding: 12px 14px; background: #161327; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff;">
              <option value="feedback">Feature Feedback / Suggestion</option>
              <option value="bug">Bug Report / Technical Issue</option>
              <option value="partnership">Partnership & Advertising Inquiry</option>
              <option value="copyright">Copyright / DMCA Notice</option>
              <option value="other">Other Inquiry</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Message</label>
            <textarea id="contact-message" rows="5" required placeholder="Write your message here..." class="form-input" style="width: 100%; padding: 12px 14px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: #fff; resize: vertical;"></textarea>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Send Message
          </button>
        </form>

        <div style="display: flex; flex-direction: column; gap: 20px; color: var(--text-secondary);">
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px;">
            <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 12px; font-weight: 700;">Community & Social</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">
              Join our growing community on Discord and GitHub to discuss anime releases, request features, and participate in development.
            </p>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.85rem;">
                GitHub Repo
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.85rem;">
                Discord Community
              </a>
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px;">
            <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 12px; font-weight: 700;">Response Times</h3>
            <p style="font-size: 0.9rem; line-height: 1.6;">
              Inquiries are typically reviewed within 24 to 48 business hours. For urgent copyright or security concerns, please mark the topic accordingly.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  attachContactHandlers() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const topic = document.getElementById('contact-topic')?.value;

      Toast.show(`Thank you, ${name || 'friend'}! Your message regarding "${topic}" has been received.`, 'success');
      form.reset();
    });
  }
};
