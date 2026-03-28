/**
 * Properties714 — Acquisitions Module
 * sidebar.js — Lead detail panel
 *
 * Handles the sliding side panel: open/close, tab switching,
 * notes, activity timeline, tasks, documents, quick actions.
 * Reads from and writes to AcquisitionsApp.store via events.
 */

'use strict';

const Sidebar = (() => {

  // ============================================================
  // STATE
  // ============================================================

  let _currentLead  = null;
  let _activeTab    = 'overview';
  let _isOpen       = false;
  let _backdrop     = null;
  let _panel        = null;

  const TABS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'notes',     label: 'Notes'    },
    { id: 'activity',  label: 'Activity' },
    { id: 'tasks',     label: 'Tasks'    },
    { id: 'docs',      label: 'Docs'     },
  ];

  // Activity icon map
  const ACTIVITY_ICONS = {
    call:    '📞',
    sms:     '💬',
    email:   '✉️',
    visit:   '🏠',
    note:    '📝',
    task:    '✅',
    status:  '🔄',
    offer:   '💰',
    default: '⚡',
  };

  // ============================================================
  // PUBLIC: OPEN
  // ============================================================

  function open(lead, tab = 'overview') {
    if (!lead) return;
    _currentLead = lead;
    _activeTab   = tab;

    _ensureDOM();
    _render();

    // Trigger open animation
    requestAnimationFrame(() => {
      _backdrop.classList.add('open');
      _panel.classList.add('open');
    });

    _isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  // ============================================================
  // PUBLIC: CLOSE
  // ============================================================

  function close() {
    if (!_isOpen) return;

    _backdrop?.classList.remove('open');
    _panel?.classList.remove('open');
    _isOpen = false;

    setTimeout(() => {
      document.body.style.overflow = '';
    }, 300);
  }

  // ============================================================
  // PUBLIC: REFRESH (update with new lead data)
  // ============================================================

  function refresh(updatedLead) {
    if (!_isOpen || !_currentLead) return;
    if (updatedLead.id === _currentLead.id) {
      _currentLead = updatedLead;
      _render();
    }
  }

  // ============================================================
  // DOM BOOTSTRAP
  // ============================================================

  function _ensureDOM() {
    _backdrop = document.getElementById('sidebar-backdrop');
    _panel    = document.getElementById('lead-sidebar');

    if (!_backdrop || !_panel) {
      console.error('[Sidebar] Missing DOM elements: #sidebar-backdrop or #lead-sidebar');
      return;
    }

    // Backdrop click → close
    _backdrop.addEventListener('click', (e) => {
      if (e.target === _backdrop) close();
    }, { once: false });

    // Keyboard: Escape → close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _isOpen) close();
    });
  }

  // ============================================================
  // RENDER ENTIRE PANEL
  // ============================================================

  function _render() {
    if (!_panel || !_currentLead) return;

    const lead = _currentLead;
    const score = lead.deal_score ?? 0;
    const tier  = typeof Scoring !== 'undefined' ? Scoring.getTier(score) : _localTier(score);

    _panel.innerHTML = `
      ${_renderHeader(lead)}
      ${_renderScoreBanner(lead, score, tier)}
      ${_renderTabs()}
      <div class="sidebar-body">
        ${_renderOverviewPanel(lead)}
        ${_renderNotesPanel(lead)}
        ${_renderActivityPanel(lead)}
        ${_renderTasksPanel(lead)}
        ${_renderDocsPanel(lead)}
      </div>
      ${_renderQuickActions(lead)}
    `;

    _bindPanelEvents(lead);
  }

  // ============================================================
  // HEADER
  // ============================================================

  function _renderHeader(lead) {
    const initials = lead.name
      ? lead.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
      : '??';

    const source = lead.source || '—';

    return `
      <div class="sidebar-header">
        <div class="sidebar-lead-identity">
          <div class="sidebar-avatar">${initials}</div>
          <div>
            <div class="sidebar-lead-name">${_esc(lead.name)}</div>
            <div class="sidebar-lead-meta">
              ${source} · ${_esc(lead.city || '')}${lead.state ? ', ' + lead.state : ''}
            </div>
          </div>
        </div>
        <div class="sidebar-header-actions">
          <button class="icon-btn" id="sb-pin-btn" title="Pin lead" data-id="${lead.id}">📌</button>
          <button class="icon-btn" id="sb-close-btn" title="Close" aria-label="Close sidebar">✕</button>
        </div>
      </div>
    `;
  }

  // ============================================================
  // SCORE BANNER
  // ============================================================

  function _renderScoreBanner(lead, score, tier) {
    const scoreClass = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red';
    const roiStr     = lead.roi != null ? lead.roi.toFixed(1) + '%' : '—';
    const profitStr  = lead.estimated_profit != null
      ? '$' + Number(lead.estimated_profit).toLocaleString()
      : '—';

    return `
      <div class="sidebar-score-banner">
        <div class="sidebar-score-item">
          <span class="sidebar-score-label">DEAL SCORE</span>
          <span class="sidebar-score-val ${scoreClass}">${score}</span>
        </div>
        <div class="sidebar-score-divider"></div>
        <div class="sidebar-score-item">
          <span class="sidebar-score-label">MOTIVATION</span>
          <span class="sidebar-score-val ${lead.motivation_score >= 8 ? 'green' : lead.motivation_score >= 5 ? 'amber' : 'red'}">${lead.motivation_score ?? '—'}/10</span>
        </div>
        <div class="sidebar-score-divider"></div>
        <div class="sidebar-score-item">
          <span class="sidebar-score-label">EST. PROFIT</span>
          <span class="sidebar-score-val green">${profitStr}</span>
        </div>
        <div class="sidebar-score-divider"></div>
        <div class="sidebar-score-item">
          <span class="sidebar-score-label">ROI</span>
          <span class="sidebar-score-val ${_roiClass(lead.roi)}">${roiStr}</span>
        </div>
      </div>
    `;
  }

  // ============================================================
  // TABS BAR
  // ============================================================

  function _renderTabs() {
    return `
      <div class="sidebar-tabs" role="tablist">
        ${TABS.map(t => `
          <button
            class="sidebar-tab${t.id === _activeTab ? ' active' : ''}"
            data-tab="${t.id}"
            role="tab"
            aria-selected="${t.id === _activeTab}"
          >${t.label}</button>
        `).join('')}
      </div>
    `;
  }

  // ============================================================
  // PANEL: OVERVIEW
  // ============================================================

  function _renderOverviewPanel(lead) {
    const isActive = _activeTab === 'overview';
    return `
      <div class="sidebar-panel${isActive ? ' active' : ''}" data-panel="overview" role="tabpanel">

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Contact Info</span>
          </div>
          <div class="sidebar-data-grid">
            ${_dataItem('Phone',    `<a href="tel:${lead.phone}" class="link-mono">${_esc(lead.phone || '—')}</a>`)}
            ${_dataItem('Email',    `<a href="mailto:${lead.email}" class="link-mono">${_esc(lead.email || '—')}</a>`)}
            ${_dataItem('Source',   _esc(lead.source || '—'))}
            ${_dataItem('Assigned', _esc(lead.assigned_to || '—'))}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Property</span>
          </div>
          <div class="sidebar-data-grid">
            ${_dataItem('Address',   _esc(lead.property_address || '—'), '', 'full')}
            ${_dataItem('Type',      _esc(lead.property_type || '—'))}
            ${_dataItem('Condition', _esc(lead.condition || '—'))}
            ${_dataItem('Occupancy', _esc(lead.occupancy || '—'))}
            ${_dataItem('City',      _esc(lead.city || '—'))}
            ${_dataItem('ZIP',       _esc(lead.zip || '—'))}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Financials</span>
          </div>
          ${_renderFinancialBreakdown(lead)}
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Pipeline</span>
          </div>
          <div class="sidebar-data-grid">
            ${_dataItem('Status',         _renderStatusBadge(lead.status))}
            ${_dataItem('Substatus',      _esc(lead.substatus || '—'))}
            ${_dataItem('Last Contact',   _formatDate(lead.last_contact))}
            ${_dataItem('Next Follow-Up', _formatDate(lead.next_followup))}
            ${_dataItem('Attempts',       String(lead.attempts ?? '—'))}
            ${_dataItem('Days In Pipeline', `${lead.days_in_pipeline ?? '—'}d`)}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Intelligence</span>
          </div>
          <div class="sidebar-data-grid">
            ${_dataItem('Deal Score',   `<span class="mono ${_scoreClass(lead.deal_score)}">${lead.deal_score ?? '—'}/100</span>`)}
            ${_dataItem('Motivation',   `<span class="mono">${lead.motivation_score ?? '—'}/10</span>`)}
            ${_dataItem('Urgency',      _esc(lead.urgency_level || '—'))}
            ${_dataItem('Risk',         _esc(lead.risk_level || '—'))}
            ${_dataItem('Suggested',    _esc(lead.suggested_action || '—'))}
            ${_dataItem('Hot Deal',     lead.hot_deal ? '<span style="color:var(--hot)">🔥 Yes</span>' : 'No')}
          </div>
        </div>

      </div>
    `;
  }

  function _renderFinancialBreakdown(lead) {
    const fmt = (v) => v != null ? '$' + Number(v).toLocaleString() : '—';
    const mao = lead.mao != null ? lead.mao : (lead.arv && lead.repairs)
      ? Math.floor(lead.arv * 0.7) - lead.repairs : null;

    return `
      <div class="financial-breakdown">
        <div class="fin-row">
          <span class="fin-label">Asking Price</span>
          <span class="fin-value mono">${fmt(lead.asking_price)}</span>
        </div>
        <div class="fin-row">
          <span class="fin-label">ARV</span>
          <span class="fin-value mono blue">${fmt(lead.arv)}</span>
        </div>
        <div class="fin-row">
          <span class="fin-label">Repairs Est.</span>
          <span class="fin-value mono">${fmt(lead.repairs)}</span>
        </div>

        <div class="fin-divider"></div>

        <div class="fin-row mao">
          <span class="fin-label">MAO</span>
          <span class="fin-value mono">${fmt(mao)}</span>
        </div>

        <div class="mao-formula">
          <span class="formula-key">MAO</span> = (ARV × 0.70) − Repairs
        </div>

        <div class="fin-divider"></div>

        <div class="fin-row profit">
          <span class="fin-label">Est. Profit</span>
          <span class="fin-value mono">${fmt(lead.estimated_profit)}</span>
        </div>
        <div class="fin-row roi">
          <span class="fin-label">ROI</span>
          <span class="fin-value mono">${lead.roi != null ? lead.roi.toFixed(1) + '%' : '—'}</span>
        </div>
      </div>
    `;
  }

  // ============================================================
  // PANEL: NOTES
  // ============================================================

  function _renderNotesPanel(lead) {
    const isActive = _activeTab === 'notes';
    const notes = Array.isArray(lead.notes) ? lead.notes : [];

    const noteItems = notes.length
      ? notes.map(n => `
          <div class="note-item">
            <div class="note-meta">
              <span class="note-author">${_esc(n.author || 'Unknown')}</span>
              <span class="note-date">${_formatDate(n.date)}</span>
            </div>
            <div class="note-content">${_esc(n.content)}</div>
          </div>
        `).join('')
      : `<div class="empty-state">No notes yet.</div>`;

    return `
      <div class="sidebar-panel${isActive ? ' active' : ''}" data-panel="notes" role="tabpanel">

        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Notes (${notes.length})</span>
          </div>
          <div class="notes-list">${noteItems}</div>
        </div>

        <div class="add-note-form" id="add-note-form">
          <textarea
            class="add-note-input"
            id="note-input"
            placeholder="Add a note… (Ctrl+Enter to save)"
            rows="3"
          ></textarea>
          <button class="btn btn-primary btn-sm" id="save-note-btn" data-id="${lead.id}">
            Save Note
          </button>
        </div>

      </div>
    `;
  }

  // ============================================================
  // PANEL: ACTIVITY
  // ============================================================

  function _renderActivityPanel(lead) {
    const isActive = _activeTab === 'activity';
    const activity = Array.isArray(lead.activity) ? lead.activity : [];

    const items = activity.length
      ? activity.map(a => `
          <div class="timeline-item">
            <div class="timeline-icon-wrap">
              <span class="timeline-icon activity-icon-${a.type || 'default'}">
                ${ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.default}
              </span>
            </div>
            <div class="timeline-content">
              <div class="timeline-desc">${_esc(a.description || '')}</div>
              <div class="timeline-time">${_formatDate(a.date)} · ${a.type || 'event'}</div>
            </div>
          </div>
        `).join('')
      : `<div class="empty-state">No activity logged.</div>`;

    return `
      <div class="sidebar-panel${isActive ? ' active' : ''}" data-panel="activity" role="tabpanel">
        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Activity Timeline</span>
          </div>
          <div class="timeline">${items}</div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // PANEL: TASKS
  // ============================================================

  function _renderTasksPanel(lead) {
    const isActive  = _activeTab === 'tasks';
    const tasks = Array.isArray(lead.tasks) ? lead.tasks : [];

    const now = new Date();

    const items = tasks.length
      ? tasks.map((t, idx) => {
          const due      = t.due_date ? new Date(t.due_date) : null;
          const overdue  = due && due < now && !t.completed;
          const soon     = due && !overdue && (due - now) < 86400000 * 2; // < 2 days
          const dueClass = overdue ? 'overdue' : soon ? 'soon' : '';
          const pClass   = `priority-${(t.priority || 'normal').toLowerCase()}`;

          return `
            <div class="task-item${t.completed ? ' completed' : ''}" data-task-idx="${idx}" data-lead-id="${lead.id}">
              <div class="task-check${t.completed ? ' checked' : ''}" data-task-check="${idx}">
                ${t.completed ? '✓' : ''}
              </div>
              <div class="task-content">
                <div class="task-title">${_esc(t.title || 'Untitled task')}</div>
                ${due ? `<div class="task-due ${dueClass}">Due ${_formatDate(t.due_date)}</div>` : ''}
              </div>
              <span class="task-priority ${pClass}">${t.priority || 'Normal'}</span>
            </div>
          `;
        }).join('')
      : `<div class="empty-state">No tasks. Add one below.</div>`;

    return `
      <div class="sidebar-panel${isActive ? ' active' : ''}" data-panel="tasks" role="tabpanel">
        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Tasks (${tasks.length})</span>
            <button class="btn-link" id="add-task-btn" data-id="${lead.id}">+ Add Task</button>
          </div>
          <div class="tasks-list" id="tasks-list">${items}</div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // PANEL: DOCUMENTS
  // ============================================================

  function _renderDocsPanel(lead) {
    const isActive = _activeTab === 'docs';
    const docs = Array.isArray(lead.documents) ? lead.documents : [];

    const DOC_ICONS = {
      pdf:  '📄',
      img:  '🖼️',
      xlsx: '📊',
      docx: '📝',
      default: '📎',
    };

    const items = docs.length
      ? docs.map(d => {
          const ext  = (d.name || '').split('.').pop().toLowerCase();
          const icon = DOC_ICONS[ext] || DOC_ICONS.default;
          return `
            <div class="doc-item">
              <div class="doc-icon">${icon}<span class="doc-ext">${ext.toUpperCase()}</span></div>
              <div class="doc-info">
                <div class="doc-name">${_esc(d.name || 'Unnamed')}</div>
                <div class="doc-meta">${_formatDate(d.uploaded_at)} · ${d.size || ''}</div>
              </div>
            </div>
          `;
        }).join('')
      : '';

    return `
      <div class="sidebar-panel${isActive ? ' active' : ''}" data-panel="docs" role="tabpanel">
        <div class="sidebar-section">
          <div class="sidebar-section-header">
            <span class="sidebar-section-title">Documents (${docs.length})</span>
          </div>
          <div class="docs-list">${items}</div>
          <div class="docs-upload-zone" id="docs-upload-zone">
            <p>📁 Drop files here or <span class="link-inline">browse</span></p>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  // QUICK ACTIONS
  // ============================================================

  function _renderQuickActions(lead) {
    const nextStage = typeof Pipeline !== 'undefined'
      ? Pipeline.advanceToNextStage(lead)?.next?.label
      : null;

    return `
      <div class="sidebar-quick-actions">
        <button class="quick-action-btn call"  data-action="call"  data-id="${lead.id}">📞 Call</button>
        <button class="quick-action-btn sms"   data-action="sms"   data-id="${lead.id}">💬 SMS</button>
        <button class="quick-action-btn email" data-action="email" data-id="${lead.id}">✉️ Email</button>
        <button class="quick-action-btn task"  data-action="task"  data-id="${lead.id}">✅ Task</button>
        ${nextStage
          ? `<button class="quick-action-btn primary advance-btn" data-action="advance" data-id="${lead.id}">
               → Move to ${nextStage}
             </button>`
          : `<button class="quick-action-btn primary" data-action="analyzer" data-id="${lead.id}">
               ⚡ Run Analyzer
             </button>`
        }
      </div>
    `;
  }

  // ============================================================
  // EVENT BINDING
  // ============================================================

  function _bindPanelEvents(lead) {
    // Close button
    _panel.querySelector('#sb-close-btn')?.addEventListener('click', close);

    // Tab switching
    _panel.querySelectorAll('.sidebar-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.tab;
        _panel.querySelectorAll('.sidebar-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
        _panel.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('active', p.dataset.panel === _activeTab));
      });
    });

    // Save note
    const saveNoteBtn = _panel.querySelector('#save-note-btn');
    const noteInput   = _panel.querySelector('#note-input');

    if (saveNoteBtn && noteInput) {
      const _saveNote = () => {
        const content = noteInput.value.trim();
        if (!content) return;
        window.dispatchEvent(new CustomEvent('sidebar:add_note', {
          detail: { leadId: lead.id, content }
        }));
        noteInput.value = '';
      };

      saveNoteBtn.addEventListener('click', _saveNote);
      noteInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') _saveNote();
      });
    }

    // Task checkbox toggle
    _panel.querySelectorAll('[data-task-check]').forEach(check => {
      check.addEventListener('click', () => {
        const idx = parseInt(check.dataset.taskCheck, 10);
        window.dispatchEvent(new CustomEvent('sidebar:toggle_task', {
          detail: { leadId: lead.id, taskIndex: idx }
        }));
      });
    });

    // Add task button
    _panel.querySelector('#add-task-btn')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('sidebar:add_task', {
        detail: { leadId: lead.id }
      }));
    });

    // Quick action buttons
    _panel.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id     = btn.dataset.id;
        window.dispatchEvent(new CustomEvent('sidebar:action', {
          detail: { action, leadId: id, lead: _currentLead }
        }));
        // Close after call/sms/email (native handlers pick up)
        if (['call', 'sms', 'email'].includes(action)) {
          setTimeout(close, 200);
        }
      });
    });

    // Upload zone (stub)
    _panel.querySelector('#docs-upload-zone')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('sidebar:upload_doc', {
        detail: { leadId: lead.id }
      }));
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function _dataItem(label, value, extraClass = '', span = '') {
    const spanAttr = span === 'full' ? ' style="grid-column:1/-1"' : '';
    const valClass = extraClass ? ` ${extraClass}` : '';
    return `
      <div class="sidebar-data-item"${spanAttr}>
        <span class="sidebar-data-label">${label}</span>
        <span class="sidebar-data-value${valClass}">${value}</span>
      </div>
    `;
  }

  function _renderStatusBadge(status) {
    if (!status) return '—';
    const slug = status.toLowerCase().replace(/\s+/g, '-');
    return `<span class="badge status-${slug}">${status}</span>`;
  }

  function _scoreClass(score) {
    if (score == null) return '';
    return score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red';
  }

  function _roiClass(roi) {
    if (roi == null) return '';
    return roi >= 30 ? 'green' : roi >= 15 ? 'amber' : 'red';
  }

  function _localTier(score) {
    if (score >= 80) return { label: 'HOT', class: 'hot' };
    if (score >= 60) return { label: 'WARM', class: 'warm' };
    if (score >= 40) return { label: 'COOL', class: 'cool' };
    return { label: 'COLD', class: 'cold' };
  }

  function _formatDate(str) {
    if (!str) return '—';
    try {
      return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return str;
    }
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ============================================================
  // EXTERNAL EVENT LISTENERS
  // (AcquisitionsApp writes notes/tasks back, sidebar re-renders)
  // ============================================================

  function _bindExternalEvents() {
    // Note was saved by acquisitions.js
    window.addEventListener('acq:note_saved', (e) => {
      const { leadId, note } = e.detail;
      if (_isOpen && _currentLead?.id === leadId) {
        _currentLead.notes = _currentLead.notes || [];
        _currentLead.notes.unshift(note);
        _render();
        _setActiveTab('notes');
      }
    });

    // Lead updated externally (realtime / save)
    window.addEventListener('acq:lead_updated', (e) => {
      refresh(e.detail);
    });

    // Task toggled
    window.addEventListener('acq:task_toggled', (e) => {
      const { leadId, tasks } = e.detail;
      if (_isOpen && _currentLead?.id === leadId) {
        _currentLead.tasks = tasks;
        _render();
        _setActiveTab('tasks');
      }
    });
  }

  function _setActiveTab(tabId) {
    _activeTab = tabId;
    _panel?.querySelectorAll('.sidebar-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabId)
    );
    _panel?.querySelectorAll('[data-panel]').forEach(p =>
      p.classList.toggle('active', p.dataset.panel === tabId)
    );
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  // Auto-init external event listeners
  _bindExternalEvents();

  return {
    open,
    close,
    refresh,
    get isOpen()      { return _isOpen; },
    get currentLead() { return _currentLead; },
  };

})();

window.Sidebar = Sidebar;
