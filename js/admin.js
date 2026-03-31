'use strict';
const P714Admin = (() => {
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
    const { data, error } = await sb.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  }

  return { listTeam, createUser, setPassword, deleteUser, updateProfile };
})();
window.P714Admin = P714Admin;
