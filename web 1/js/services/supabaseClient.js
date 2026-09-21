/**
 * Supabase Client Initializer
 * Uses official @supabase/supabase-js with fallback simulator for seamless out-of-the-box testing.
 */

import { SUPABASE_CONFIG } from '../config/supabaseConfig.js';

let supabaseInstance = null;
let clientInitialized = false;

export async function getSupabaseClient() {
  if (clientInitialized && supabaseInstance) {
    return supabaseInstance;
  }

  if (SUPABASE_CONFIG.isConfigured()) {
    try {
      // Load Supabase JS ESM client
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabaseInstance = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      clientInitialized = true;
      console.log('[Supabase] Connected to live Supabase project:', SUPABASE_CONFIG.URL);
      return supabaseInstance;
    } catch (err) {
      console.warn('[Supabase] Failed to load remote SDK, using local fallback:', err);
    }
  }

  // Local fallback client simulator ensuring full functionality even without API keys
  supabaseInstance = createLocalSupabaseSimulator();
  clientInitialized = true;
  return supabaseInstance;
}

/**
 * Local Supabase Client Simulator
 * Faithfully mirrors Supabase Auth & PostgREST query builders (select, insert, update, delete, eq, single)
 * with Row Level Security enforcement so all features can be tested offline or before cloud keys are entered.
 */
function createLocalSupabaseSimulator() {
  const STORAGE_USERS = 'animeverse_sim_users';
  const STORAGE_SESSION = 'animeverse_sim_session';
  const STORAGE_WATCHLISTS = 'animeverse_sim_watchlists';
  const STORAGE_FAVORITES = 'animeverse_sim_favorites';
  const STORAGE_EPISODES = 'animeverse_sim_episodes';
  const STORAGE_PROFILES = 'animeverse_sim_profiles';
  const STORAGE_FOLLOWED = 'animeverse_sim_followed';

  const authListeners = new Set();

  function getStored(key, def = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : def;
    } catch {
      return def;
    }
  }

  function setStored(key, data) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {}
  }

  function getActiveUser() {
    const session = getStored(STORAGE_SESSION, null);
    return session ? session.user : null;
  }

  return {
    isSimulator: true,

    auth: {
      onAuthStateChange(callback) {
        authListeners.add(callback);
        // Fire initial event
        const session = getStored(STORAGE_SESSION, null);
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback),
            },
          },
        };
      },

      async getSession() {
        return { data: { session: getStored(STORAGE_SESSION, null) }, error: null };
      },

      async setSession({ access_token, refresh_token }) {
        let session = getStored(STORAGE_SESSION, null);
        if (!session) {
          const user = getActiveUser() || {
            id: 'usr_oauth_sim',
            email: 'google.user@example.com',
            user_metadata: { username: 'Google User', avatar_url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=usr_oauth_sim' },
            created_at: new Date().toISOString()
          };
          session = { user, access_token: access_token || 'sim_oauth_token' };
        } else if (access_token) {
          session.access_token = access_token;
        }
        setStored(STORAGE_SESSION, session);
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { session, user: session.user }, error: null };
      },

      async getUser() {
        return { data: { user: getActiveUser() }, error: null };
      },

      async signUp({ email, password, options = {} }) {
        const users = getStored(STORAGE_USERS, []);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return { data: null, error: { message: 'A user with this email already exists.' } };
        }

        const userId = 'usr_' + Math.random().toString(36).substring(2, 12);
        const username = options.data?.username || email.split('@')[0];
        const avatarUrl = options.data?.avatar_url || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${userId}`;

        const newUser = {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          user_metadata: {
            username,
            avatar_url: avatarUrl,
          },
        };

        users.push({ ...newUser, password });
        setStored(STORAGE_USERS, users);

        // Create profile
        const profiles = getStored(STORAGE_PROFILES, []);
        profiles.push({
          id: userId,
          username,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setStored(STORAGE_PROFILES, profiles);

        const session = { user: newUser, access_token: 'sim_token_' + userId };
        setStored(STORAGE_SESSION, session);

        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user: newUser, session }, error: null };
      },

      async signInWithPassword({ email, password }) {
        const users = getStored(STORAGE_USERS, []);
        const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (!matched) {
          return { data: null, error: { message: 'Invalid login credentials. Please check your email and password.' } };
        }

        const { password: _, ...userWithoutPass } = matched;
        const session = { user: userWithoutPass, access_token: 'sim_token_' + matched.id };
        setStored(STORAGE_SESSION, session);

        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { user: userWithoutPass, session }, error: null };
      },

      async signInWithOAuth({ provider }) {
        // Simulates OAuth flow
        const googleEmail = 'otaku.hero@gmail.com';
        const userId = 'usr_google_42';
        const user = {
          id: userId,
          email: googleEmail,
          created_at: new Date().toISOString(),
          user_metadata: {
            username: 'Google Otaku',
            avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${userId}`,
          },
        };

        const session = { user, access_token: 'sim_oauth_token' };
        setStored(STORAGE_SESSION, session);

        // Ensure profile exists
        const profiles = getStored(STORAGE_PROFILES, []);
        if (!profiles.some(p => p.id === userId)) {
          profiles.push({
            id: userId,
            username: 'Google Otaku',
            avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${userId}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setStored(STORAGE_PROFILES, profiles);
        }

        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { provider, url: null }, error: null };
      },

      async signOut() {
        setStored(STORAGE_SESSION, null);
        authListeners.forEach(cb => cb('SIGNED_OUT', null));
        return { error: null };
      },

      async updateUser(attributes) {
        const currentUser = getActiveUser();
        if (!currentUser) return { data: null, error: { message: 'Not authenticated' } };

        if (attributes.data) {
          currentUser.user_metadata = { ...currentUser.user_metadata, ...attributes.data };
          setStored(STORAGE_SESSION, { user: currentUser, access_token: 'sim_token' });
        }
        return { data: { user: currentUser }, error: null };
      }
    },

    from(tableName) {
      const activeUser = getActiveUser();
      const PUBLIC_READ_TABLES = new Set([
        'profiles',
        'anime_ratings',
        'anime_reviews',
        'review_likes',
        'anime_comments',
        'comment_likes',
        'watch_sources',
        'approved_youtube_channels',
      ]);

      const key = 'animeverse_sim_' + tableName;

      return {
        _filters: [],
        _selectCols: '*',
        _orderBy: null,
        _limitCount: null,

        select(cols = '*') {
          this._selectCols = cols;
          return this;
        },

        eq(column, value) {
          this._filters.push({ column, value });
          return this;
        },

        order(column, { ascending = true } = {}) {
          this._orderBy = { column, ascending };
          return this;
        },

        limit(count) {
          this._limitCount = count;
          return this;
        },

        async single() {
          const res = await this._executeRead();
          if (res.error) return res;
          return { data: res.data?.[0] || null, error: null };
        },

        async insert(records) {
          if (!activeUser) return { data: null, error: { message: 'Row Level Security: authenticated user required.' } };
          const items = Array.isArray(records) ? records : [records];
          const stored = getStored(key, []);

          items.forEach(item => {
            const idKey = tableName === 'profiles' ? 'id' : 'user_id';
            if (tableName !== 'notifications' || !item.user_id) {
              item[idKey] = activeUser.id;
            }
            if (!item.id && tableName !== 'profiles') {
              item.id = 'sim_' + tableName.substring(0, 4) + '_' + Math.random().toString(36).substring(2, 10);
            }
            item.created_at = item.created_at || new Date().toISOString();
            item.updated_at = new Date().toISOString();

            if (tableName === 'watchlists') {
              const existingIdx = stored.findIndex(s => s.user_id === activeUser.id && String(s.anime_id) === String(item.anime_id));
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item };
              else stored.push(item);
            } else if (tableName === 'favorites') {
              if (!stored.some(s => s.user_id === activeUser.id && String(s.anime_id) === String(item.anime_id))) {
                stored.push(item);
              }
            } else if (tableName === 'followed_anime') {
              if (!stored.some(s => s.user_id === activeUser.id && String(s.anime_id) === String(item.anime_id))) {
                stored.push(item);
              }
            } else if (tableName === 'anime_ratings') {
              const existingIdx = stored.findIndex(s => s.user_id === activeUser.id && String(s.anime_id) === String(item.anime_id));
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item };
              else stored.push(item);
            } else if (tableName === 'review_likes') {
              if (!stored.some(s => s.user_id === activeUser.id && String(s.review_id) === String(item.review_id))) {
                stored.push(item);
              }
            } else if (tableName === 'comment_likes') {
              if (!stored.some(s => s.user_id === activeUser.id && String(s.comment_id) === String(item.comment_id))) {
                stored.push(item);
              }
            } else if (tableName === 'episode_progress') {
              const existingIdx = stored.findIndex(s => s.user_id === activeUser.id && String(s.anime_id) === String(item.anime_id) && s.episode_number === item.episode_number);
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item };
              else stored.push(item);
            } else {
              stored.push(item);
            }
          });

          setStored(key, stored);
          return { data: items, error: null };
        },

        async upsert(records, options = {}) {
          const items = Array.isArray(records) ? records : [records];
          const stored = getStored(key, []);

          items.forEach(item => {
            if (tableName === 'watch_sources') {
              const existingIdx = stored.findIndex(s => 
                String(s.anime_id) === String(item.anime_id) && 
                s.provider === item.provider && 
                s.season_number === item.season_number && 
                s.episode_number === item.episode_number
              );
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item, updated_at: new Date().toISOString() };
              else stored.push({ ...item, created_at: item.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
            } else if (tableName === 'approved_youtube_channels') {
              const existingIdx = stored.findIndex(s => s.channel_id === item.channel_id);
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item };
              else stored.push(item);
            } else if (tableName === 'anime_ratings') {
              const uId = item.user_id || activeUser?.id;
              const existingIdx = stored.findIndex(s => s.user_id === uId && String(s.anime_id) === String(item.anime_id));
              if (existingIdx >= 0) stored[existingIdx] = { ...stored[existingIdx], ...item, updated_at: new Date().toISOString() };
              else stored.push({ ...item, user_id: uId, created_at: new Date().toISOString() });
            } else {
              stored.push(item);
            }
          });

          setStored(key, stored);
          return { data: items, error: null };
        },

        _pendingUpdate: null,
        _pendingDelete: false,

        update(updates) {
          this._pendingUpdate = updates;
          return this;
        },

        delete() {
          this._pendingDelete = true;
          return this;
        },

        async then(resolve, reject) {
          try {
            if (this._pendingUpdate) {
              const res = await this._executeUpdate();
              resolve(res);
            } else if (this._pendingDelete) {
              const res = await this._executeDelete();
              resolve(res);
            } else {
              const res = await this._executeRead();
              resolve(res);
            }
          } catch (e) {
            reject(e);
          }
        },

        async _executeUpdate() {
          if (!activeUser) return { data: null, error: { message: 'Row Level Security: authenticated user required.' } };

          const stored = getStored(key, []);
          let updatedCount = 0;

          const updated = stored.map(item => {
            const idKey = tableName === 'profiles' ? 'id' : 'user_id';
            // User can only update their own records
            if (item[idKey] !== activeUser.id) return item;

            const matches = this._filters.every(f => String(item[f.column]) === String(f.value));
            if (matches) {
              updatedCount++;
              return { ...item, ...this._pendingUpdate, updated_at: new Date().toISOString() };
            }
            return item;
          });

          setStored(key, updated);
          return { data: updated, error: null };
        },

        async _executeDelete() {
          if (!activeUser && tableName !== 'watch_sources') return { data: null, error: { message: 'Row Level Security: authenticated user required.' } };

          const stored = getStored(key, []);
          const remaining = stored.filter(item => {
            if (tableName === 'watch_sources') {
              const matches = this._filters.every(f => String(item[f.column]) === String(f.value));
              return !matches;
            }
            const idKey = tableName === 'profiles' ? 'id' : 'user_id';
            if (item[idKey] !== activeUser.id) return true;
            const matches = this._filters.every(f => String(item[f.column]) === String(f.value));
            return !matches;
          });

          setStored(key, remaining);
          return { data: null, error: null };
        },

        async _executeRead() {
          let data = getStored(key, []);

          // Enforce Row Level Security
          if (PUBLIC_READ_TABLES.has(tableName)) {
            // Public readable, e.g. community reviews, ratings, comments, profiles
          } else if (tableName === 'moderation_reports') {
            // Only admin can read reports; normal users cannot read
            data = [];
          } else if (activeUser) {
            // Private table: user only sees their own rows
            const idKey = tableName === 'profiles' ? 'id' : 'user_id';
            data = data.filter(d => d[idKey] === activeUser.id);
          } else {
            // Guest has no access to private user tables
            data = [];
          }

          // Apply filters
          this._filters.forEach(f => {
            data = data.filter(d => String(d[f.column]) === String(f.value));
          });

          // Apply ordering
          if (this._orderBy) {
            const { column, ascending } = this._orderBy;
            data.sort((a, b) => {
              const valA = a[column];
              const valB = b[column];
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
          }

          // Apply limit
          if (this._limitCount && this._limitCount > 0) {
            data = data.slice(0, this._limitCount);
          }

          return { data, error: null };
        }
      };
    }
  };
}
