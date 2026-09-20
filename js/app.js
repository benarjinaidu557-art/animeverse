/**
 * AnimeVerse - Main Application Orchestrator
 * Routing, Supabase Auth Integration, Global Search Modal (Ctrl+K),
 * Event Delegation, and Dynamic Header Navigation.
 */

import { StorageService } from './services/storageService.js';
import { AnimeService } from './services/animeService.js';
import { AuthService } from './services/authService.js';
import { HomeView } from './views/HomeView.js';
import { BrowseView } from './views/BrowseView.js';
import { DetailsView } from './views/DetailsView.js';
import { GenresView } from './views/GenresView.js';
import { CalendarView } from './views/CalendarView.js';
import { WatchlistView } from './views/WatchlistView.js';
import { LoginView } from './views/LoginView.js';
import { SignupView } from './views/SignupView.js';
import { ProfileView } from './views/ProfileView.js';
import { DiscoverView } from './views/DiscoverView.js';
import { DashboardView } from './views/DashboardView.js';
import { CompareView } from './views/CompareView.js';
import { CharacterView } from './views/CharacterView.js';
import { CharactersSearchView } from './views/CharactersSearchView.js';
import { InfoPagesView } from './views/InfoPagesView.js';
import { NotFoundView } from './views/NotFoundView.js';
import { SeoService } from './services/seoService.js';
import { CommunityService } from './services/communityService.js';
import { Toast } from './components/Toast.js';

const ROUTE_SEO = {
  '/': { title: 'Home - Discover & Track Anime', description: 'Explore trending, popular, and seasonal anime simulcasts with AnimeVerse.' },
  '/browse': { title: 'Browse Anime Catalog', description: 'Filter and search through thousands of anime series, movies, and OVAs.' },
  '/characters': { title: 'Anime Characters & Voice Actors', description: 'Discover anime character bios, voice actors (Seiyuu), and media appearances.' },
  '/genres': { title: 'Anime Genres & Themes', description: 'Explore anime by genres including Action, Romance, Sci-Fi, Fantasy, and more.' },
  '/calendar': { title: 'Anime Release Calendar', description: 'Track weekly simulcast airing times and episode release schedules.' },
  '/watchlist': { title: 'My Anime Watchlist & Library', description: 'Organize your personal anime library, favorites, and watch progress.' },
  '/login': { title: 'Sign In', description: 'Log in to your AnimeVerse account to sync watchlists across devices.' },
  '/signup': { title: 'Create Account', description: 'Sign up for AnimeVerse to track episodes, write reviews, and follow shows.' },
  '/profile': { title: 'User Profile & Settings', description: 'Manage your profile settings, avatar, and credentials.' },
  '/discover': { title: 'AI Anime Finder', description: 'Interactive AI-powered recommendation engine to find your next favorite anime.' },
  '/dashboard': { title: 'Personal Dashboard', description: 'Your upcoming episode releases, followed anime, and viewing statistics.' },
  '/compare': { title: 'Side-by-Side Anime Comparison', description: 'Compare ratings, popularity, studios, and genres between anime.' },
  '/about': { title: 'About AnimeVerse', description: 'Learn about AnimeVerse mission, architecture, and legal discovery features.' },
  '/privacy': { title: 'Privacy Policy', description: 'Our commitment to protecting your privacy, data security, and authentication.' },
  '/terms': { title: 'Terms of Service', description: 'Terms and community guidelines for using the AnimeVerse platform.' },
  '/copyright': { title: 'Copyright & Anti-Piracy Policy', description: 'Strict zero-tolerance anti-piracy compliance and copyright policy.' },
  '/contact': { title: 'Contact Us', description: 'Get in touch with the AnimeVerse support team for help or inquiries.' }
};

class AppRouter {
  constructor() {
    this.routes = {};
    this.currentPath = '';
    this.appRoot = document.getElementById('app-root');

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('scroll', () => this.handleScroll());
  }

  get root() {
    return this.appRoot || document.getElementById('app-root');
  }

  register(path, viewHandler) {
    this.routes[path] = viewHandler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  refresh() {
    this.handleRoute();
  }

  handleScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  async handleRoute() {
    let hash = window.location.hash.slice(1) || '/';
    if (!hash.startsWith('/')) hash = '/' + hash;

    // Parse path and query parameters
    const [pathPart, queryPart] = hash.split('?');
    const queryParams = Object.fromEntries(new URLSearchParams(queryPart || ''));

    this.currentPath = pathPart;
    this.updateActiveNavLinks(pathPart);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle parameterized routes: e.g. /anime/:id, /anime/:id/:slug, /anime/:slug, /character/:id
    const animeMatch = pathPart.match(/^\/anime\/(.+)$/);
    if (animeMatch) {
      const rawParam = decodeURIComponent(animeMatch[1]).replace(/\/+$/, '').trim();
      if (rawParam) {
        await DetailsView.render(this.root, { id: rawParam });
        return;
      }
    }

    const charMatch = pathPart.match(/^\/character\/(\d+)/);
    if (charMatch) {
      const charId = charMatch[1];
      await CharacterView.render(this.root, charId);
      return;
    }

    // Update SEO title and description for static routes
    if (ROUTE_SEO[pathPart]) {
      SeoService.update(ROUTE_SEO[pathPart]);
    }

    // Standard static routes
    const handler = this.routes[pathPart];
    if (handler) {
      await handler.render(this.root, queryParams);
    } else {
      // Unknown route -> render 404 view
      SeoService.update({ title: '404 - Page Not Found' });
      await NotFoundView.render(this.root, pathPart);
    }
  }

  updateActiveNavLinks(path) {
    // Desktop navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      if (href === path || (href === '/' && path === '')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile bottom navigation items
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const href = item.getAttribute('href')?.replace('#', '');
      if (href === path || (href === '/' && path === '')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

// Instantiate Global Router
window.router = new AppRouter();

// Register App Routes
window.router.register('/', HomeView);
window.router.register('/browse', BrowseView);
window.router.register('/characters', CharactersSearchView);
window.router.register('/genres', GenresView);
window.router.register('/calendar', CalendarView);
window.router.register('/watchlist', WatchlistView);
window.router.register('/login', LoginView);
window.router.register('/signup', SignupView);
window.router.register('/profile', ProfileView);
window.router.register('/discover', DiscoverView);
window.router.register('/dashboard', DashboardView);
window.router.register('/compare', CompareView);

// Register Legal & Info Routes
window.router.register('/about', { render: (c, q) => InfoPagesView.render(c, q, 'about') });
window.router.register('/privacy', { render: (c, q) => InfoPagesView.render(c, q, 'privacy') });
window.router.register('/terms', { render: (c, q) => InfoPagesView.render(c, q, 'terms') });
window.router.register('/copyright', { render: (c, q) => InfoPagesView.render(c, q, 'copyright') });
window.router.register('/contact', { render: (c, q) => InfoPagesView.render(c, q, 'contact') });

// ============================================================================
// Quick Search Modal & Keyboard Shortcuts (Ctrl+K / Cmd+K / '/')
// ============================================================================

const SearchModal = {
  backdrop: null,
  input: null,
  resultsList: null,
  timer: null,

  init() {
    this.backdrop = document.getElementById('search-modal-backdrop');
    this.input = document.getElementById('search-modal-input');
    this.resultsList = document.getElementById('search-modal-results');

    // Trigger buttons
    document.querySelectorAll('[data-action="open-search"]').forEach(btn => {
      btn.onclick = () => this.open();
    });

    // Close button & backdrop click
    document.getElementById('search-modal-close')?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    // Keydown listeners for shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.open();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });

    // Input typing with debounce
    this.input?.addEventListener('input', (e) => {
      clearTimeout(this.timer);
      const query = e.target.value.trim();
      if (!query) {
        this.resultsList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-dim);">Type to search anime across thousands of titles...</div>';
        return;
      }

      this.resultsList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">Searching AniList...</div>';
      this.timer = setTimeout(() => this.search(query), 300);
    });
  },

  open() {
    if (!this.backdrop) return;
    this.backdrop.classList.add('open');
    setTimeout(() => this.input?.focus(), 100);
  },

  close() {
    if (!this.backdrop) return;
    this.backdrop.classList.remove('open');
    if (this.input) this.input.value = '';
    if (this.resultsList) {
      this.resultsList.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-dim);">Type to search anime across thousands of titles...</div>';
    }
  },

  async search(query) {
    try {
      const { media } = await AnimeService.searchAndFilter({ search: query, perPage: 8 });
      if (!media || media.length === 0) {
        this.resultsList.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-muted);">
            No anime found matching "<strong>${escapeHtml(query)}</strong>"
          </div>
        `;
        return;
      }

      this.resultsList.innerHTML = media.map(anime => {
        const title = AnimeService.formatTitle(anime.title);
        const score = AnimeService.formatScore(anime.averageScore);
        const year = anime.seasonYear || '';
        const thumb = anime.coverImage?.medium || anime.coverImage?.large;
        const genres = (anime.genres || []).slice(0, 2).join(', ');

        return `
          <div class="search-result-item" onclick="SearchModal.selectAnime(${anime.id})">
            <img class="search-result-thumb" src="${thumb}" alt="${escapeHtml(title)}" />
            <div class="search-result-info">
              <div class="search-result-title">${escapeHtml(title)}</div>
              <div class="search-result-meta">
                ${anime.averageScore ? `<span style="color: var(--accent-amber);">★ ${score}</span><span>•</span>` : ''}
                ${year ? `<span>${year}</span><span>•</span>` : ''}
                <span>${escapeHtml(genres)}</span>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        `;
      }).join('');
    } catch {
      this.resultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--accent-red);">Search failed. Please try again.</div>`;
    }
  },

  selectAnime(id) {
    this.close();
    window.router.navigate(`/anime/${id}`);
  }
};
window.SearchModal = SearchModal;

// ============================================================================
// Auth State Management & Navbar UI
// ============================================================================

async function updateNavbarAuthState() {
  const loginBtn = document.getElementById('nav-login-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userAvatar = document.getElementById('nav-user-avatar');
  const usernameSpan = document.getElementById('nav-username');
  const mobileProfileItem = document.getElementById('mobile-nav-profile-item');
  const mobileProfileLabel = document.getElementById('mobile-nav-profile-label');

  const isAuthenticated = AuthService.isAuthenticated();

  if (isAuthenticated) {
    const profile = await AuthService.getProfile();
    const user = AuthService.getUser();
    const displayName = profile?.username || user?.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user?.id}`;

    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (userAvatar) userAvatar.src = avatarUrl;
    if (usernameSpan) usernameSpan.textContent = displayName;

    if (mobileProfileItem) {
      mobileProfileItem.setAttribute('href', '#/profile');
    }
    if (mobileProfileLabel) {
      mobileProfileLabel.textContent = 'Profile';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';

    if (mobileProfileItem) {
      mobileProfileItem.setAttribute('href', '#/login');
    }
    if (mobileProfileLabel) {
      mobileProfileLabel.textContent = 'Sign In';
    }
  }
}

function setupDropdownAndAuth() {
  const dropdownToggle = document.getElementById('btn-toggle-user-dropdown');
  const dropdownMenu = document.getElementById('user-dropdown-menu');
  const logoutBtn = document.getElementById('nav-logout-btn');

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.onclick = (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('open');
    };

    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !dropdownToggle.contains(e.target)) {
        dropdownMenu.classList.remove('open');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      dropdownMenu?.classList.remove('open');
      await AuthService.signOut();
      Toast.show('You have been logged out.', 'info');
      window.router.navigate('/login');
    };
  }

  // Subscribe to auth state updates
  AuthService.subscribe((event) => {
    updateNavbarAuthState();
    updateNotificationsUI();
    if (event === 'SIGNED_IN') {
      StorageService.syncWithCloud();
    }
  });
}

// ============================================================================
// Notifications Management & Dropdown UI
// ============================================================================

async function updateNotificationsUI() {
  const badge = document.getElementById('notifications-badge');
  const listEl = document.getElementById('notifications-list');
  if (!badge || !listEl) return;

  if (!AuthService.isAuthenticated()) {
    badge.style.display = 'none';
    listEl.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        Sign in to view your notifications.
      </div>
    `;
    return;
  }

  try {
    const notifications = await CommunityService.getNotifications();
    const unread = notifications.filter(n => !n.isRead).length;

    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';

    if (notifications.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 28px 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">🔔</div>
          You have no notifications right now.
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifications.map(item => {
      const isUnread = !item.isRead;
      let icon = '🔔';
      if (item.type === 'episode_release') icon = '🎬';
      else if (item.type === 'review_like') icon = '❤️';
      else if (item.type === 'comment_like') icon = '💬';

      return `
        <div 
          class="notification-item" 
          data-id="${item.id}" 
          data-link="${item.link}"
          style="
            padding: 10px 14px; 
            border-bottom: 1px solid rgba(255,255,255,0.04); 
            display: flex; 
            gap: 10px; 
            align-items: flex-start; 
            cursor: pointer; 
            background: ${isUnread ? 'rgba(139, 92, 246, 0.08)' : 'transparent'};
            transition: background 0.15s;
          "
        >
          <span style="font-size: 1.1rem; line-height: 1;">${icon}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 0.86rem; font-weight: ${isUnread ? '700' : '600'}; color: #fff; margin-bottom: 2px;">
              ${escapeHtml(item.title)}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3; margin-bottom: 4px;">
              ${escapeHtml(item.message)}
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">
              ${new Date(item.createdAt).toLocaleDateString()} &bull; ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          ${isUnread ? `
            <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-purple-light); margin-top: 4px; flex-shrink: 0;"></span>
          ` : ''}
        </div>
      `;
    }).join('');

    // Bind notification item clicks
    listEl.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        const link = item.dataset.link;
        await CommunityService.markAsRead(id);
        const dropdown = document.getElementById('notifications-dropdown');
        if (dropdown) dropdown.style.display = 'none';
        updateNotificationsUI();
        if (link && link !== '#' && link !== '') {
          window.location.hash = link.replace('#', '');
        }
      });
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.05)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = item.dataset.unread === 'true' ? 'rgba(139, 92, 246, 0.08)' : 'transparent';
      });
    });

  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
  }
}

function setupNotificationsDropdown() {
  const toggleBtn = document.getElementById('btn-toggle-notifications');
  const dropdown = document.getElementById('notifications-dropdown');
  const markAllBtn = document.getElementById('btn-mark-all-notifications');

  if (toggleBtn && dropdown) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        updateNotificationsUI();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await CommunityService.markAllAsRead();
      Toast.show('All notifications marked as read', 'info');
      updateNotificationsUI();
    });
  }
}

// ============================================================================
// Global Event Delegation & Watchlist/Favorites Sync
// ============================================================================

function setupGlobalInteractions() {
  // Update Watchlist badge count in navbar
  const updateWatchlistCounters = () => {
    const list = StorageService.getWatchlist();
    const count = list.length;
    document.querySelectorAll('.watchlist-count-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  };

  // Subscribe to reactive storage changes
  StorageService.subscribe((event, payload) => {
    if (event === 'watchlist_updated' || event === 'cloud_synced') {
      updateWatchlistCounters();

      if (payload?.item) {
        document.querySelectorAll(`[data-action="toggle-watchlist"][data-anime-id="${payload.item.id}"]`).forEach(btn => {
          btn.classList.add('active');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'currentColor');
        });
      } else if (payload?.removedId) {
        document.querySelectorAll(`[data-action="toggle-watchlist"][data-anime-id="${payload.removedId}"]`).forEach(btn => {
          btn.classList.remove('active');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
        });
      }
    }

    if (event === 'favorites_updated') {
      const { id, isFav } = payload;
      document.querySelectorAll(`[data-action="toggle-favorite"][data-anime-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('active', isFav);
        if (isFav) {
          btn.style.background = '#ec4899';
          btn.style.color = '#fff';
          btn.style.borderColor = '#f472b6';
          btn.querySelector('svg')?.setAttribute('fill', 'currentColor');
        } else {
          btn.style.background = '';
          btn.style.color = '';
          btn.style.borderColor = '';
          btn.querySelector('svg')?.setAttribute('fill', 'none');
        }
      });
    }
  });

  // Global click delegator for Watchlist buttons on cards
  document.addEventListener('click', async (e) => {
    const watchlistBtn = e.target.closest('[data-action="toggle-watchlist"]');
    if (watchlistBtn) {
      e.stopPropagation();
      e.preventDefault();
      const animeId = watchlistBtn.getAttribute('data-anime-id');
      if (!animeId) return;

      const isNowInWatchlist = StorageService.isInWatchlist(animeId);
      if (isNowInWatchlist) {
        await StorageService.removeFromWatchlist(animeId);
        Toast.show('Removed from Watchlist', 'info');
      } else {
        try {
          const animeData = await AnimeService.getAnimeDetails(animeId);
          if (animeData) {
            await StorageService.addToWatchlist(animeData);
            Toast.show(`Added to your Watchlist!`, 'success');
          }
        } catch {
          await StorageService.addToWatchlist({ id: animeId, title: { romaji: 'Anime #' + animeId } });
          Toast.show(`Added to your Watchlist!`, 'success');
        }
      }
    }

    // Global click delegator for Favorite buttons on cards
    const favoriteBtn = e.target.closest('[data-action="toggle-favorite"]');
    if (favoriteBtn) {
      e.stopPropagation();
      e.preventDefault();
      const animeId = favoriteBtn.getAttribute('data-anime-id');
      if (!animeId) return;

      const isFav = await StorageService.toggleFavorite(animeId);
      if (isFav) {
        Toast.show('Added to Favorites ❤️', 'success');
      } else {
        Toast.show('Removed from Favorites', 'info');
      }
    }
  });

  // Initial counter set
  updateWatchlistCounters();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Application Boot
document.addEventListener('DOMContentLoaded', async () => {
  SearchModal.init();
  setupDropdownAndAuth();
  setupNotificationsDropdown();
  setupGlobalInteractions();

  // Initialize Auth Service & update Navbar
  await AuthService.init();
  await updateNavbarAuthState();
  await updateNotificationsUI();

  // Handle current route
  window.router.handleRoute();
});
