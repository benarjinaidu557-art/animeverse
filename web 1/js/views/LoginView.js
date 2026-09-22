/**
 * Login View - Email/Password & Google OAuth Authentication
 */

import { AuthService } from '../services/authService.js';
import { Toast } from '../components/Toast.js';
import { escapeHtml } from '../utils/stringUtils.js';

export const LoginView = {
  render(container, queryParams = {}) {
    if (AuthService.isAuthenticated()) {
      window.router.navigate('/profile');
      return;
    }

    const initialError = queryParams.error || '';

    container.innerHTML = `
      <div class="container" style="padding: 48px 16px; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 200px);">
        <div style="
          max-width: 440px; 
          width: 100%; 
          background: var(--bg-card); 
          border: 1px solid var(--border-light); 
          border-radius: var(--radius-xl); 
          padding: 36px 32px; 
          box-shadow: var(--shadow-lg);
          position: relative;
        ">
          <!-- Logo & Header -->
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: var(--gradient-primary); border-radius: 14px; margin-bottom: 12px; box-shadow: var(--shadow-glow);">
              <span style="color: #fff; font-size: 1.5rem; font-weight: 900;">A</span>
            </div>
            <h1 style="font-size: 1.65rem; font-weight: 800; color: #fff; margin-bottom: 6px;">Welcome Back</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Sign in to sync your personal watchlist and episode progress</p>
          </div>

          <!-- Error Alert Banner -->
          <div id="login-error-alert" style="
            display: ${initialError ? 'block' : 'none'}; 
            background: rgba(239, 68, 68, 0.12); 
            border: 1px solid var(--accent-red); 
            color: #fca5a5; 
            padding: 12px; 
            border-radius: var(--radius-sm); 
            font-size: 0.85rem; 
            margin-bottom: 20px;
          ">${escapeHtml(initialError)}</div>

          <!-- Form -->
          <form id="login-form">
            <div style="margin-bottom: 18px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;" for="login-email">
                Email Address
              </label>
              <input 
                type="email" 
                id="login-email" 
                required 
                placeholder="name@example.com" 
                style="
                  width: 100%; 
                  background: var(--bg-secondary); 
                  border: 1px solid var(--border-subtle); 
                  border-radius: var(--radius-sm); 
                  padding: 12px 14px; 
                  color: #fff; 
                  font-size: 0.95rem; 
                  outline: none;
                "
              />
            </div>

            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 6px;" for="login-password">
                Password
              </label>
              <input 
                type="password" 
                id="login-password" 
                required 
                placeholder="••••••••" 
                style="
                  width: 100%; 
                  background: var(--bg-secondary); 
                  border: 1px solid var(--border-subtle); 
                  border-radius: var(--radius-sm); 
                  padding: 12px 14px; 
                  color: #fff; 
                  font-size: 0.95rem; 
                  outline: none;
                "
              />
            </div>

            <button type="submit" id="login-submit-btn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 1rem;">
              Sign In
            </button>
          </form>

          <!-- Divider -->
          <div style="display: flex; align-items: center; gap: 12px; margin: 24px 0;">
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
            <span style="font-size: 0.78rem; color: var(--text-dim); text-transform: uppercase;">Or continue with</span>
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          </div>

          <!-- Google OAuth Button -->
          <button type="button" id="login-google-btn" class="btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px;">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </button>

          <!-- Footer Link -->
          <div style="text-align: center; margin-top: 24px; font-size: 0.88rem; color: var(--text-muted);">
            Don't have an account? <a href="#/signup" style="color: var(--accent-purple-light); font-weight: 600;">Create one free</a>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('login-submit-btn');
    const googleBtn = document.getElementById('login-google-btn');
    const errorAlert = document.getElementById('login-error-alert');

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        errorAlert.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
          await AuthService.signIn(email, password);
          Toast.show('Successfully signed in!', 'success');
          window.router.navigate('/profile');
        } catch (err) {
          errorAlert.textContent = err.message || 'Login failed. Please check your credentials.';
          errorAlert.style.display = 'block';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      };
    }

    if (googleBtn) {
      googleBtn.onclick = async () => {
        googleBtn.disabled = true;
        try {
          await AuthService.signInWithGoogle();
          Toast.show('Signed in with Google!', 'success');
          window.router.navigate('/profile');
        } catch (err) {
          errorAlert.textContent = err.message || 'Google login failed.';
          errorAlert.style.display = 'block';
        } finally {
          googleBtn.disabled = false;
        }
      };
    }
  }
};
