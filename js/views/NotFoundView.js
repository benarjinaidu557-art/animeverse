/**
 * 404 Not Found View
 * Displays a sleek dark cyberpunk styled 404 page when a route is not recognized.
 */

export const NotFoundView = {
  async render(container, path = '') {
    container.innerHTML = `
      <div class="container" style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 60px 20px;">
        <div style="
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 48px 32px;
          max-width: 540px;
          width: 100%;
          text-align: center;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        ">
          <div style="
            font-size: 5rem;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 12px;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          ">
            404
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 12px;">
            Lost in the Multiverse
          </h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 28px;">
            The page <code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: var(--accent-purple-light);">${path || 'requested'}</code> could not be found or has shifted dimensions.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="window.router.navigate('/')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Return Home
            </button>
            <button class="btn btn-secondary" onclick="window.router.navigate('/browse')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Browse Catalog
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
