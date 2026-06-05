/**
 * crown-auth-bridge.js
 *
 * Drop-in script for any non-crown page (root /, /about/, etc.) that needs
 * the global "Sign In" / avatar button in the top-right without rebuilding
 * the page in Next.js.
 *
 * How it works:
 *   1. Loads @supabase/supabase-js from the crown app's static export so we
 *      share the SAME localStorage key ('crown-auth') and session.
 *   2. Renders a small React-free widget in the top-right corner.
 *   3. The widget reads the same localStorage key — no URL params.
 *
 * Inclusion: <script src="/crown-auth-bridge.js" defer></script> at the end
 * of <body>.
 */
(function () {
  if (window.__CROWN_AUTH_BRIDGE_LOADED__) return;
  window.__CROWN_AUTH_BRIDGE_LOADED__ = true;

  // Inject a tiny stylesheet once.
  const style = document.createElement('style');
  style.id = 'crown-auth-bridge-styles';
  style.textContent = `
    .cab-host {
      position: fixed; top: 12px; right: 16px; z-index: 2147483000;
      display: flex; align-items: center; gap: 8px;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    .cab-skeleton {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(145deg, #1e2030, #14161e);
      border: 1px solid rgba(160,175,200,0.12);
    }
    .cab-signin {
      font-size: 11px; font-weight: 800; letter-spacing: 0.18em;
      padding: 8px 14px; border-radius: 999px; text-decoration: none;
      background: linear-gradient(135deg, #475569, #64748B, #94A3B8);
      color: #08080c !important; box-shadow: 0 2px 8px rgba(0,0,0,.4);
      transition: transform .15s ease;
    }
    .cab-signin:hover { transform: translateY(-1px); }
    .cab-avatar-btn {
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      border: 1px solid rgba(180,195,215,0.4);
      background: linear-gradient(135deg, #475569, #64748B, #94A3B8);
      color: #08080c; font-weight: 800; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 10px rgba(148,163,184,0.25);
      transition: transform .15s ease;
      background-size: cover; background-position: center;
    }
    .cab-avatar-btn:hover { transform: scale(1.05); }
    .cab-menu {
      position: absolute; right: 0; top: calc(100% + 8px);
      width: 224px; border-radius: 16px; overflow: hidden;
      background: linear-gradient(160deg, #13151e 0%, #0d0f17 100%);
      border: 1px solid rgba(160,175,200,0.18);
      box-shadow: 0 12px 32px rgba(0,0,0,0.6);
      color: #e0e0ec;
    }
    .cab-menu-head { padding: 12px 16px; border-bottom: 1px solid rgba(160,175,200,0.10); }
    .cab-menu-head small { display: block; font-size: 9px; letter-spacing: .2em; color: #686880; }
    .cab-menu-head b { display: block; font-size: 12px; margin-top: 2px; word-break: break-all; }
    .cab-menu a, .cab-menu button {
      display: block; width: 100%; text-align: left;
      padding: 12px 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
      color: #CBD5E1; background: transparent; border: 0; cursor: pointer;
      text-decoration: none; font-family: inherit;
    }
    .cab-menu a:hover, .cab-menu button:hover { background: rgba(148,163,184,0.10); }
    .cab-menu .danger { color: #f87171; border-top: 1px solid rgba(160,175,200,0.08); }
    .cab-menu .danger:hover { background: rgba(248,113,113,0.10); }
  `;
  document.head.appendChild(style);

  // Supabase env values are public (anon key) — we read them from a meta tag
  // injected by the page so the same values used by the crown build are used
  // here. If absent, we silently render the button as "Sign In" pointing to
  // /crown/login/ — which is still useful even without an active session.
  function readEnv() {
    const urlMeta = document.querySelector('meta[name="crown-supabase-url"]');
    const keyMeta = document.querySelector('meta[name="crown-supabase-anon-key"]');
    return {
      url: urlMeta ? urlMeta.getAttribute('content') : '',
      key: keyMeta ? keyMeta.getAttribute('content') : '',
    };
  }

  // The supabase-js UMD bundle ships with the crown app's static export.
  // We load it lazily only when needed.
  const SUPABASE_LIB_PATH = '/crown/_next/static/chunks/supabase-lite-stub.js';

  function loadSupabase() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) {
        return resolve(window.supabase);
      }
      // Attempt 1: from a CDN we know works at edge time.
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = function () { resolve(window.supabase); };
      s.onerror = function () {
        // Fallback: minimal session reader (no live auth changes; just reads localStorage)
        resolve(null);
      };
      document.head.appendChild(s);
      // safety timeout
      setTimeout(function () { if (!window.supabase) resolve(null); }, 4000);
    });
  }

  function getSession() {
    return new Promise(function (resolve) {
      try {
        const raw = window.localStorage.getItem('crown-auth');
        if (!raw) return resolve(null);
        const parsed = JSON.parse(raw);
        resolve(parsed && parsed.currentSession ? parsed.currentSession : null);
      } catch (e) { resolve(null); }
    });
  }

  function getUser() {
    return getSession().then(function (s) { return s && s.user ? s.user : null; });
  }

  function signOut() {
    return getSession().then(function (s) {
      if (s && s.refresh_token && window.supabase && window.supabase.createClient) {
        const env = readEnv();
        if (env.url && env.key) {
          const c = window.supabase.createClient(env.url, env.key, {
            auth: { persistSession: false, autoRefreshToken: false, storageKey: 'crown-auth' },
          });
          return c.auth.signOut().catch(function () {});
        }
      }
      // Fallback: just clear localStorage
      try { window.localStorage.removeItem('crown-auth'); } catch (e) {}
    });
  }

  function render() {
    let host = document.getElementById('crown-auth-bridge');
    if (!host) {
      host = document.createElement('div');
      host.id = 'crown-auth-bridge';
      host.className = 'cab-host';
      document.body.appendChild(host);
    }
    host.innerHTML = '<div class="cab-skeleton" aria-hidden="true"></div>';

    getUser().then(function (user) {
      if (!user) {
        host.innerHTML = '';
        const a = document.createElement('a');
        a.className = 'cab-signin';
        a.href = '/crown/login/';
        a.textContent = 'SIGN IN';
        host.appendChild(a);
        return;
      }
      const email = user.email || 'Signed in';
      const initial = (email[0] || '?').toUpperCase();
      const avatar =
        (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || '';
      host.innerHTML = '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cab-avatar-btn';
      btn.setAttribute('aria-label', 'Account menu');
      btn.setAttribute('aria-haspopup', 'menu');
      if (avatar) {
        btn.style.backgroundImage = 'url(' + avatar + ')';
        btn.textContent = '';
      } else {
        btn.textContent = initial;
      }

      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.appendChild(btn);
      host.appendChild(wrap);

      let menuOpen = false;
      function close() {
        menuOpen = false;
        const m = wrap.querySelector('.cab-menu');
        if (m) m.remove();
        document.removeEventListener('mousedown', onDoc);
      }
      function open() {
        menuOpen = true;
        const menu = document.createElement('div');
        menu.className = 'cab-menu';
        menu.innerHTML =
          '<div class="cab-menu-head"><small>SIGNED IN AS</small><b></b></div>' +
          '<a href="/crown/me/">👑 MY COLLECTION</a>' +
          '<button type="button" class="danger">↩ SIGN OUT</button>';
        menu.querySelector('b').textContent = email;
        wrap.appendChild(menu);
        menu.querySelector('.danger').addEventListener('click', function () {
          signOut().then(function () {
            close();
            render();
          });
        });
        setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
      }
      function onDoc(e) {
        if (!wrap.contains(e.target)) close();
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menuOpen) close(); else open();
      });
    });
  }

  // Re-render when storage changes (login on another tab)
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key === 'crown-auth') render();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
