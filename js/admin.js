'use strict';
const P714Admin = (() => {
  const N8N_BASE = 'https://n8n.properties714.com/webhook';

  function _cfg() {
    const url = window.__P714_CONFIG__?.supabaseUrl;
    const key = window.__P714_ADMIN_CONFIG__?.serviceRoleKey;
    if (!url || !key) throw new Error('service_role key not configured. Create js/admin-config.js');
    return { url, key };
  }

  async function _req(path, method = 'GET', body = null) {
    const { url, key } = _cfg();
    const r = await fetch(url + path, {
      method,
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || d.error_description || JSON.stringify(d));
    return d;
  }

  async function _notify(endpoint, payload) {
    try {
      await fetch(`${N8N_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('[P714Admin] Notification failed:', e.message);
    }
  }

  async function listTeam() {
    const sb = window.P714Auth?.getClient();
    if (!sb) throw new Error('Not authenticated');
    const { data, error } = await sb.from('profiles').select('id,full_name,email,role,created_at').order('created_at');
    if (error) throw error;
    return data || [];
  }

  async function createUser({ email, password, fullName, role = 'acquisitionist' }) {
    const user = await _req('/auth/v1/admin/users', 'POST', {
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    });
    const sb = window.P714Auth?.getClient();
    if (sb && user.id) {
      await sb.from('profiles').upsert({ id: user.id, email, full_name: fullName, role });
    }
    // Send welcome email via n8n
    await _notify('welcome-member', { email, fullName, role });
    return user;
  }

  async function setPassword(userId, pw) {
    return await _req(`/auth/v1/admin/users/${userId}`, 'PUT', { password: pw });
  }

  async function deleteUser(userId) {
    return await _req(`/auth/v1/admin/users/${userId}`, 'DELETE');
  }

  async function updateProfile(userId, updates) {
    const sb = window.P714Auth?.getClient();
    if (!sb) throw new Error('Not authenticated');
    // Get current profile to detect role change
    const { data: current } = await sb.from('profiles').select('full_name,email,role').eq('id', userId).single();
    const { data, error } = await sb.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    // Notify if role changed
    if (current && updates.role && current.role !== updates.role) {
      await _notify('role-changed', {
        email: current.email,
        fullName: current.full_name,
        oldRole: current.role,
        newRole: updates.role,
      });
    }
    return data;
  }

  async function requestPasswordReset(email) {
    const sb = window.P714Auth?.getClient();
    if (!sb) throw new Error('Not authenticated');
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/?reset=true`,
    });
    if (error) throw error;
    // Also notify via n8n with custom email
    await _notify('password-reset', {
      email,
      resetUrl: `${window.location.origin}/login/?reset=true`,
    });
  }

  return { listTeam, createUser, setPassword, deleteUser, updateProfile, requestPasswordReset };
})();
window.P714Admin = P714Admin;
