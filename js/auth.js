/**
 * Properties 714 — Auth Module
 * Handles login, session, roles, and page guards.
 *
 * Usage:
 *   const session = await P714Auth.init();   // call on every page
 *   P714Auth.requireAuth();                   // redirect to /login/ if not logged in
 *   P714Auth.isOwner();                       // true if role === 'owner'
 */

'use strict';

const P714Auth = (() => {
  let _client  = null;
  let _session = null;
  let _profile = null;

  // ── Build Supabase client ──────────────────────────────────
  function _getClient() {
    if (_client) return _client;
    const cfg = window.__P714_CONFIG__;
    if (!cfg?.supabaseUrl || cfg.supabaseUrl.includes('TU_PROYECTO')) {
      throw new Error('Supabase no configurado. Edita js/config.js con tus credenciales.');
    }
    _client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
    return _client;
  }

  // ── Load profile (role + name) ─────────────────────────────
  async function _loadProfile() {
    if (!_session) return null;
    try {
      const { data } = await _getClient()
        .from('profiles')
        .select('*')
        .eq('id', _session.user.id)
        .single();
      _profile = data;
    } catch (_) {
      _profile = {
        id:        _session.user.id,
        full_name: _session.user.email?.split('@')[0] || 'User',
        email:     _session.user.email,
        role:      'acquisitionist',
      };
    }
    return _profile;
  }

  // ── Init (call on every page) ──────────────────────────────
  async function init() {
    try {
      const sb = _getClient();
      const { data: { session } } = await sb.auth.getSession();
      _session = session;

      if (_session) {
        await _loadProfile();
      }

      // Listen for auth state changes (token refresh, sign-out)
      sb.auth.onAuthStateChange(async (event, session) => {
        _session = session;
        if (session) {
          await _loadProfile();
        } else {
          _profile = null;
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.startsWith('/login')) {
            _redirectToLogin();
          }
        }
      });

      return _session;
    } catch (err) {
      console.warn('[P714Auth] Init failed:', err.message);
      return null;
    }
  }

  // ── Login ─────────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await _getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    _session = data.session;
    await _loadProfile();
    return data;
  }

  // ── Logout ────────────────────────────────────────────────
  async function logout() {
    await _getClient().auth.signOut();
    _session = null;
    _profile = null;
    window.location.href = '/login/';
  }

  // ── Guards ────────────────────────────────────────────────
  function requireAuth() {
    if (!_session) {
      _redirectToLogin();
      return false;
    }
    return true;
  }

  function requireOwner() {
    if (!requireAuth()) return false;
    if (_profile?.role !== 'owner') {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  function _redirectToLogin() {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = '/login/?next=' + next;
  }

  // ── Inject user info into the nav ─────────────────────────
  function injectUserNav() {
    if (!_session || !_profile) return;

    // Avatar initials
    const avatarEl = document.querySelector('.nav-avatar');
    if (avatarEl) {
      const initials = (_profile.full_name || 'U')
        .split(' ')
        .map(w => w[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);
      avatarEl.textContent = initials;
      avatarEl.title       = _profile.full_name + ' — Click to sign out';
      avatarEl.style.cursor = 'pointer';
      avatarEl.addEventListener('click', logout);
    }

    // Nav brand / status name
    const statusEl = document.querySelector('.nav-status span');
    if (statusEl) statusEl.textContent = _profile.full_name || 'Properties714';

    // Show/hide owner-only elements
    document.querySelectorAll('[data-owner-only]').forEach(el => {
      el.style.display = _profile.role === 'owner' ? '' : 'none';
    });
  }

  // ── Getters ───────────────────────────────────────────────
  function getClient()  { return _getClient(); }
  function getSession() { return _session; }
  function getProfile() { return _profile; }
  function getUser()    { return _session?.user || null; }
  function isOwner()    { return _profile?.role === 'owner'; }
  function isLoggedIn() { return !!_session; }

  return {
    init, login, logout,
    requireAuth, requireOwner,
    getClient, getSession, getProfile, getUser,
    isOwner, isLoggedIn,
    injectUserNav,
  };
})();

window.P714Auth = P714Auth;
