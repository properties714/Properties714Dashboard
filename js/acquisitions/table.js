/**
 * Properties714 — Acquisitions Module
 * table.js — Advanced data table renderer + interaction layer
 */

'use strict';

const Table = (() => {

  // ============================================================
  // COLUMN DEFINITIONS
  // ============================================================

  const COLUMNS = [
    // ── Checkbox ──────────────────────────────────────────────
    { id: 'check',    label: '',         group: '',            width: 40,   sortable: false, visible: true,  type: 'check' },

    // ── Lead Info ─────────────────────────────────────────────
    { id: 'name',          label: 'Lead',          group: 'LEAD',       width: 180, sortable: true,  visible: true,  type: 'lead-name' },
    { id: 'phone',         label: 'Phone',         group: 'LEAD',       width: 140, sortable: false, visible: true,  type: 'phone' },
    { id: 'source',        label: 'Source',        group: 'LEAD',       width: 130, sortable: true,  visible: true,  type: 'source-badge' },
    { id: 'assigned_to',   label: 'Assigned',      group: 'LEAD',       width: 110, sortable: true,  visible: true,  type: 'assigned' },

    // ── Property ──────────────────────────────────────────────
    { id: 'property_address', label: 'Address',    group: 'PROPERTY',   width: 200, sortable: true,  visible: true,  type: 'address' },
    { id: 'property_type',    label: 'Type',       group: 'PROPERTY',   width: 90,  sortable: true,  visible: true,  type: 'prop-type' },
    { id: 'condition',        label: 'Condition',  group: 'PROPERTY',   width: 100, sortable: true,  visible: true,  type: 'condition' },
    { id: 'occupancy',        label: 'Occupancy',  group: 'PROPERTY',   width: 120, sortable: true,  visible: false, type: 'occupancy' },

    // ── Financials ────────────────────────────────────────────
    { id: 'asking_price',    label: 'Asking',      group: 'FINANCIALS', width: 105, sortable: true,  visible: true,  type: 'currency' },
    { id: 'arv',             label: 'ARV',         group: 'FINANCIALS', width: 105, sortable: true,  visible: true,  type: 'currency' },
    { id: 'repairs',         label: 'Repairs',     group: 'FINANCIALS', width: 90,  sortable: true,  visible: true,  type: 'currency-muted' },
    { id: 'mao',             label: 'MAO',         group: 'FINANCIALS', width: 105, sortable: true,  visible: true,  type: 'mao' },
    { id: 'roi',             label: 'ROI%',        group: 'FINANCIALS', width: 80,  sortable: true,  visible: true,  type: 'roi' },
    { id: 'estimated_profit',label: 'Profit',      group: 'FINANCIALS', width: 105, sortable: true,  visible: true,  type: 'profit' },

    // ── Intelligence ──────────────────────────────────────────
    { id: 'deal_score',      label: 'Score',       group: 'INTELLIGENCE', width: 110, sortable: true, visible: true,  type: 'deal-score' },
    { id: 'motivation_score',label: 'Motivation',  group: 'INTELLIGENCE', width: 120, sortable: true, visible: true,  type: 'motivation' },
    { id: 'urgency_level',   label: 'Urgency',     group: 'INTELLIGENCE', width: 90,  sortable: true, visible: true,  type: 'urgency' },
    { id: 'risk_level',      label: 'Risk',        group: 'INTELLIGENCE', width: 80,  sortable: true, visible: true,  type: 'risk' },

    // ── Pipeline ──────────────────────────────────────────────
    { id: 'status',          label: 'Status',      group: 'PIPELINE',   width: 150, sortable: true,  visible: true,  type: 'status' },
    { id: 'substatus',       label: 'Sub-Status',  group: 'PIPELINE',   width: 150, sortable: false, visible: false, type: 'text-dim' },

    // ── Activity ──────────────────────────────────────────────
    { id: 'last_contact',    label: 'Last Contact',group: 'ACTIVITY',   width: 105, sortable: true,  visible: true,  type: 'date' },
    { id: 'next_followup',   label: 'Follow-Up',   group: 'ACTIVITY',   width: 100, sortable: true,  visible: true,  type: 'date-future' },
    { id: 'attempts',        label: 'Attempts',    group: 'ACTIVITY',   width: 80,  sortable: true,  visible: true,  type: 'number' },
    { id: 'days_in_pipeline',label: 'Days',        group: 'ACTIVITY',   width: 70,  sortable: true,  visible: true,  type: 'days' },

    // ── Alerts ────────────────────────────────────────────────
    { id: 'alerts',          label: 'Alerts',      group: 'ALERTS',     width: 90,  sortable: false, visible: true,  type: 'alerts' },

    // ── AI ────────────────────────────────────────────────────
    { id: 'suggested_action',label: 'AI Action',   group: 'AI',         width: 120, sortable: false, visible: true,  type: 'ai-action' },

    // ── Actions ───────────────────────────────────────────────
    { id: 'actions',         label: 'Actions',     group: '',           width: 200, sortable: false, visible: true,  type: 'actions' },
  ];

  // ============================================================
  // STATE
  // ============================================================

  let _data         = [];          // full dataset
  let _filtered     = [];          // post-filter data
  let _sorted       = [];          // post-sort data
  let _page         = 1;
  let _perPage      = 25;
  let _sortCol      = 'deal_score';
  let _sortDir      = 'desc';
  let _selectedIds  = new Set();
  let _onRowClick   = null;
  let _onAction     = null;

  // ============================================================
  // INIT
  // ============================================================

  function init({ onRowClick, onAction } = {}) {
    _onRowClick = onRowClick || null;
    _onAction   = onAction   || null;
  }

  // ============================================================
  // RENDER FULL TABLE
  // ============================================================

  function render(container, filteredLeads) {
    if (!container) return;

    _filtered = filteredLeads;
    _applySort();
    const pageData = _getPageData();

    const visibleCols = COLUMNS.filter(c => c.visible);

    container.innerHTML = `
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <span class="table-count">
            Showing <span>${pageData.length}</span> of <span>${_filtered.length}</span> leads
          </span>
          ${_selectedIds.size > 0 ? `<span class="table-count">${_selectedIds.size} selected</span>` : ''}
        </div>
        <div class="table-toolbar-right">
          <button class="btn btn-ghost btn-sm" id="sort-toggle" title="Current sort: ${_sortCol} ${_sortDir}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M7 12h10M11 18h2"/>
            </svg>
            Sort: ${COLUMNS.find(c => c.id === _sortCol)?.label || _sortCol}
          </button>
          <div class="col-toggle-btn">
            <button class="btn btn-ghost btn-sm" id="col-toggle-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Columns
            </button>
            <div class="col-toggle-dropdown" id="col-dropdown">
              ${COLUMNS.filter(c => c.id !== 'check' && c.id !== 'actions').map(c => `
                <label class="col-toggle-item">
                  <input type="checkbox" data-col="${c.id}" ${c.visible ? 'checked' : ''} />
                  ${c.label || c.id}
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      ${_selectedIds.size > 0 ? _renderBulkBar() : ''}

      <div class="acq-table-wrap">
        <table class="acq-table" id="acq-table">
          <thead>
            <tr>${_renderColGroups(visibleCols)}</tr>
            <tr>${visibleCols.map(c => _renderTH(c)).join('')}</tr>
          </thead>
          <tbody id="table-body">
            ${pageData.length > 0
              ? pageData.map(lead => _renderRow(lead, visibleCols)).join('')
              : `<tr><td colspan="${visibleCols.length}" style="padding: 0; border: none;">
                  <div class="empty-state">
                    <div class="empty-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div class="empty-title">No leads found</div>
                    <div class="empty-desc">Try adjusting your filters or add a new lead to the pipeline.</div>
                  </div>
                 </td></tr>`
            }
          </tbody>
        </table>
      </div>

      ${_renderPagination()}
    `;

    _bindTableEvents(container);
  }

  // ============================================================
  // RENDER COLUMN GROUP HEADERS
  // ============================================================

  function _renderColGroups(visibleCols) {
    const groups = [];
    let currentGroup = null;
    let span = 0;

    visibleCols.forEach((col, i) => {
      const group = col.group;
      if (group === currentGroup) {
        span++;
      } else {
        if (currentGroup !== null) groups.push({ label: currentGroup, span });
        currentGroup = group;
        span = 1;
      }
      if (i === visibleCols.length - 1) {
        groups.push({ label: currentGroup, span });
      }
    });

    return groups.map(g => `
      <th class="th-group" colspan="${g.span}">${g.label}</th>
    `).join('');
  }

  // ============================================================
  // RENDER TABLE HEADER CELL
  // ============================================================

  function _renderTH(col) {
    const isSorted = _sortCol === col.id;
    const dirIcon  = _sortDir === 'asc' ? '↑' : '↓';

    return `
      <th
        class="${isSorted ? `sorted-${_sortDir}` : ''}"
        data-col="${col.id}"
        data-sortable="${col.sortable}"
        style="min-width: ${col.width}px; width: ${col.width}px;"
      >
        <div class="th-inner">
          ${col.label}
          ${col.sortable ? `<span class="sort-icon">${isSorted ? dirIcon : '↕'}</span>` : ''}
        </div>
      </th>
    `;
  }

  // ============================================================
  // RENDER TABLE ROW
  // ============================================================

  function _renderRow(lead, visibleCols) {
    const isSelected = _selectedIds.has(lead.id);
    const isHot      = lead.hot_deal;

    return `
      <tr
        data-id="${lead.id}"
        class="${isSelected ? 'selected' : ''} ${isHot ? 'hot-row' : ''}"
      >
        ${visibleCols.map(col => `<td class="${col.type === 'mao' ? 'cell-mao' : ''}">${_renderCell(lead, col)}</td>`).join('')}
      </tr>
    `;
  }

  // ============================================================
  // RENDER CELL BY TYPE
  // ============================================================

  function _renderCell(lead, col) {
    const { id, type } = col;
    const val = lead[id];
    const F = Scoring.Financial;

    switch (type) {

      case 'check':
        return `<div class="col-check">
          <input type="checkbox" data-id="${lead.id}" ${_selectedIds.has(lead.id) ? 'checked' : ''}/>
        </div>`;

      case 'lead-name': {
        const initials = (lead.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        return `
          <div class="cell-lead">
            <div class="lead-avatar">${initials}</div>
            <div>
              <div class="lead-name">${_esc(lead.name || '—')}</div>
              <div class="lead-source text-xs text-muted">${_esc(lead.email || '')}</div>
            </div>
          </div>`;
      }

      case 'phone':
        return lead.phone
          ? `<a class="cell-phone" href="tel:${lead.phone}" onclick="event.stopPropagation()">${_esc(lead.phone)}</a>`
          : `<span class="text-muted text-sm">—</span>`;

      case 'source-badge':
        return `<span class="source-badge">${_esc(val || '—')}</span>`;

      case 'assigned':
        return `<div class="cell-assigned">
          <div class="assigned-dot"></div>
          <span>${_esc(val || 'Unassigned')}</span>
        </div>`;

      case 'address':
        return `<div class="cell-address">
          <div class="addr-main">${_esc(lead.property_address || '—')}</div>
          <div class="addr-sub">${_esc([lead.city, lead.state, lead.zip].filter(Boolean).join(', '))}</div>
        </div>`;

      case 'prop-type':
        return `<span class="prop-type-badge prop-type-${(val||'').toLowerCase().replace(/[^a-z]/g,'')}">${_esc(val || '—')}</span>`;

      case 'condition':
        return `<span class="condition-badge condition-${(val||'').toLowerCase().replace(/[^a-z]/g,'')}">${_esc(val || '—')}</span>`;

      case 'occupancy':
        return `<span class="occupancy-badge occupancy-${(val||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z-]/g,'')}">${_esc(val || '—')}</span>`;

      case 'currency':
        return `<div class="cell-financial">${val ? F.formatCurrency(val) : '—'}</div>`;

      case 'currency-muted':
        return `<div class="cell-financial muted">${val ? F.formatCurrency(val) : '—'}</div>`;

      case 'mao':
        return `<div class="cell-financial positive">${val ? F.formatCurrency(val) : '—'}</div>`;

      case 'roi': {
        const r = Number(val) || 0;
        return `<div class="cell-roi ${r >= 30 ? 'text-accent' : r >= 15 ? 'text-hot' : 'text-muted'} font-mono">
          ${r > 0 ? F.formatPct(r) : '—'}
        </div>`;
      }

      case 'profit':
        return `<div class="cell-financial positive">${val ? F.formatCurrency(val) : '—'}</div>`;

      case 'deal-score': {
        const score = Number(lead.deal_score) || 0;
        const tier  = Scoring.getTier(score);
        return `
          <div class="cell-score">
            <div class="score-bar-track">
              <div class="score-bar-fill ${tier.cssClass}" style="width: ${score}%"></div>
            </div>
            <span class="score-num" style="color: ${tier.barColor}">${score}</span>
          </div>`;
      }

      case 'motivation': {
        const m = Math.max(0, Math.min(10, Number(lead.motivation_score) || 0));
        const dots = Array.from({length: 10}, (_, i) =>
          `<div class="motivation-dot ${i < m ? `filled-${i+1}` : ''}"></div>`
        ).join('');
        return `<div class="motivation-meter">
          <div class="motivation-dots">${dots}</div>
          <span class="motivation-num">${m}</span>
        </div>`;
      }

      case 'urgency':
        return `<span class="urgency-badge urgency-${(val||'low').toLowerCase()}">${val || '—'}</span>`;

      case 'risk':
        return `<span class="risk-badge risk-${(val||'medium').toLowerCase()}">${val || '—'}</span>`;

      case 'status': {
        const slug = (val || '').toLowerCase().replace(/\s+/g, '-');
        return `<span class="status-badge status-${slug}">
          <span class="dot"></span>${_esc(val || '—')}
        </span>`;
      }

      case 'text-dim':
        return `<span class="text-muted text-sm">${_esc(val || '—')}</span>`;

      case 'date':
        return `<div class="cell-date">${val ? _formatDate(val) : '—'}</div>`;

      case 'date-future': {
        if (!val) return `<div class="cell-date text-muted">—</div>`;
        const d = new Date(val);
        const now = new Date();
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        const cls = diff < 0 ? 'overdue' : diff < 2 ? 'soon' : '';
        return `<div class="cell-date ${cls}">${_formatDate(val)}</div>`;
      }

      case 'number':
        return `<span class="font-mono text-sm">${val ?? '—'}</span>`;

      case 'days': {
        const d = Number(lead.days_in_pipeline) || 0;
        const cls = d > 30 ? 'days-danger' : d > 14 ? 'days-warning' : 'days-normal';
        return `<span class="days-badge ${cls}">${d}d</span>`;
      }

      case 'alerts':
        return `<div class="cell-alerts">
          ${lead.hot_deal   ? `<div class="alert-flag hot-flag"   title="Hot Deal">🔥</div>` : ''}
          ${lead.no_contact ? `<div class="alert-flag no-contact" title="No Contact">📵</div>` : ''}
          ${lead.overdue    ? `<div class="alert-flag overdue"    title="Overdue">⏰</div>` : ''}
        </div>`;

      case 'ai-action': {
        const action = (lead.suggested_action || 'Call').toLowerCase().replace(/\s+/g, '');
        return `<div class="cell-ai-suggest">
          <span class="ai-badge ${action}">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            ${_esc(lead.suggested_action || 'Call')}
          </span>
        </div>`;
      }

      case 'actions':
        return `<div class="cell-actions" onclick="event.stopPropagation()">
          <button class="action-btn call"     data-action="call"     data-id="${lead.id}" data-tip="Call">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81A2 2 0 017.28 6L7 6.28a16 16 0 006.72 6.72l.28-.28a2 2 0 012.44-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </button>
          <button class="action-btn sms"      data-action="sms"      data-id="${lead.id}" data-tip="SMS">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </button>
          <button class="action-btn email"    data-action="email"    data-id="${lead.id}" data-tip="Email">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </button>
          <button class="action-btn"          data-action="note"     data-id="${lead.id}" data-tip="Add Note">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </button>
          <button class="action-btn"          data-action="task"     data-id="${lead.id}" data-tip="Task">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </button>
          <button class="action-btn analyzer" data-action="analyzer" data-id="${lead.id}" data-tip="Analyze">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <button class="action-btn offer"    data-action="offer"    data-id="${lead.id}" data-tip="Send Offer">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>`;

      default:
        return `<span class="text-sm text-muted">${_esc(String(val ?? '—'))}</span>`;
    }
  }

  // ============================================================
  // RENDER BULK ACTIONS BAR
  // ============================================================

  function _renderBulkBar() {
    return `
      <div class="bulk-actions-bar visible">
        <span class="bulk-count">${_selectedIds.size} selected</span>
        <div class="bulk-sep"></div>
        <button class="bulk-btn" data-bulk="status">Change Status</button>
        <button class="bulk-btn" data-bulk="assign">Assign To</button>
        <button class="bulk-btn" data-bulk="task">Create Task</button>
        <button class="bulk-btn" data-bulk="export">Export</button>
        <button class="bulk-btn" data-bulk="delete" style="color: var(--danger)">Delete</button>
        <div style="flex:1"></div>
        <button class="bulk-btn" id="bulk-clear">Clear</button>
      </div>
    `;
  }

  // ============================================================
  // RENDER PAGINATION
  // ============================================================

  function _renderPagination() {
    const total  = _filtered.length;
    const pages  = Math.ceil(total / _perPage);
    const start  = (_page - 1) * _perPage + 1;
    const end    = Math.min(_page * _perPage, total);

    if (total === 0) return '';

    const pageNums = _getPageNumbers(pages);

    return `
      <div class="table-pagination">
        <span class="pagination-info">
          ${start}–${end} of ${total} leads
        </span>
        <div class="pagination-controls">
          <select class="page-per-select" id="per-page-select">
            ${[10, 25, 50, 100].map(n => `<option value="${n}" ${_perPage === n ? 'selected' : ''}>${n} / page</option>`).join('')}
          </select>
          <button class="page-btn" id="pg-prev" ${_page === 1 ? 'disabled' : ''}>‹</button>
          ${pageNums.map(n => n === '...'
            ? `<span style="color: var(--text-dim); padding: 0 4px;">…</span>`
            : `<button class="page-btn ${n === _page ? 'active' : ''}" data-page="${n}">${n}</button>`
          ).join('')}
          <button class="page-btn" id="pg-next" ${_page === pages ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;
  }

  function _getPageNumbers(total) {
    if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
    if (_page <= 4) return [1,2,3,4,5,'...',total];
    if (_page >= total - 3) return [1,'...',total-4,total-3,total-2,total-1,total];
    return [1,'...',_page-1,_page,_page+1,'...',total];
  }

  // ============================================================
  // BIND TABLE EVENTS
  // ============================================================

  function _bindTableEvents(container) {
    // Sort
    container.querySelectorAll('th[data-sortable="true"]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (_sortCol === col) {
          _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          _sortCol = col;
          _sortDir = 'desc';
        }
        _rerender(container);
      });
    });

    // Row click
    container.querySelectorAll('.acq-table tbody tr[data-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.cell-actions') ||
            e.target.closest('.col-check') ||
            e.target.tagName === 'INPUT') return;

        const lead = _data.find(l => l.id === row.dataset.id);
        if (lead && _onRowClick) _onRowClick(lead);

        // Select row visually
        container.querySelectorAll('.acq-table tbody tr').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      });
    });

    // Checkboxes
    container.querySelectorAll('input[type="checkbox"][data-id]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        if (cb.checked) { _selectedIds.add(cb.dataset.id); }
        else { _selectedIds.delete(cb.dataset.id); }
        _rerender(container);
      });
    });

    // Select all checkbox (if present)
    const selectAll = container.querySelector('#select-all-cb');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        if (selectAll.checked) {
          _getPageData().forEach(l => _selectedIds.add(l.id));
        } else {
          _getPageData().forEach(l => _selectedIds.delete(l.id));
        }
        _rerender(container);
      });
    }

    // Action buttons
    container.querySelectorAll('.action-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lead = _data.find(l => l.id === btn.dataset.id);
        if (lead && _onAction) _onAction(btn.dataset.action, lead);
      });
    });

    // Pagination
    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        _page = Number(btn.dataset.page);
        _rerender(container);
      });
    });

    const prevBtn = container.querySelector('#pg-prev');
    const nextBtn = container.querySelector('#pg-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (_page > 1) { _page--; _rerender(container); } });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const pages = Math.ceil(_filtered.length / _perPage);
      if (_page < pages) { _page++; _rerender(container); }
    });

    const perPage = container.querySelector('#per-page-select');
    if (perPage) {
      perPage.addEventListener('change', () => {
        _perPage = Number(perPage.value);
        _page = 1;
        _rerender(container);
      });
    }

    // Bulk clear
    const bulkClear = container.querySelector('#bulk-clear');
    if (bulkClear) {
      bulkClear.addEventListener('click', () => {
        _selectedIds.clear();
        _rerender(container);
      });
    }

    // Bulk actions
    container.querySelectorAll('[data-bulk]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (_onAction) _onAction('bulk:' + btn.dataset.bulk, { ids: [..._selectedIds] });
      });
    });

    // Column toggle
    const colBtn = container.querySelector('#col-toggle-btn');
    const colDropdown = container.querySelector('#col-dropdown');
    if (colBtn && colDropdown) {
      colBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colDropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => colDropdown.classList.remove('open'));
      colDropdown.querySelectorAll('input[data-col]').forEach(cb => {
        cb.addEventListener('change', () => {
          const col = COLUMNS.find(c => c.id === cb.dataset.col);
          if (col) col.visible = cb.checked;
          _rerender(container);
        });
      });
    }
  }

  // ============================================================
  // INTERNAL: Sort + Paginate
  // ============================================================

  function _applySort() {
    if (!_sortCol) { _sorted = [..._filtered]; return; }

    _sorted = [..._filtered].sort((a, b) => {
      let aVal = a[_sortCol];
      let bVal = b[_sortCol];

      // Numeric sort for financial / score columns
      const numericCols = ['asking_price','arv','repairs','mao','roi','estimated_profit',
                           'deal_score','motivation_score','attempts','days_in_pipeline'];
      if (numericCols.includes(_sortCol)) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return _sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return _sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function _getPageData() {
    const start = (_page - 1) * _perPage;
    return _sorted.slice(start, start + _perPage);
  }

  function _rerender(container) {
    _applySort();
    render(container, _filtered);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return String(str);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  // ============================================================
  // PUBLIC: Update data and re-render
  // ============================================================

  function setData(leads) {
    _data = leads;
  }

  function refresh(container, filteredLeads) {
    _page = 1;
    render(container, filteredLeads);
  }

  function updateRow(container, updatedLead) {
    const idx = _data.findIndex(l => l.id === updatedLead.id);
    if (idx >= 0) _data[idx] = updatedLead;
    const fIdx = _filtered.findIndex(l => l.id === updatedLead.id);
    if (fIdx >= 0) {
      _filtered[fIdx] = updatedLead;
      _rerender(container);
    }
  }

  function getSelected() { return [..._selectedIds]; }
  function clearSelected() { _selectedIds.clear(); }
  function getColumns()    { return COLUMNS; }
  function getSortState()  { return { col: _sortCol, dir: _sortDir }; }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    init,
    render,
    refresh,
    setData,
    updateRow,
    getSelected,
    clearSelected,
    getColumns,
    getSortState,
    COLUMNS,
  };

})();

window.Table = Table;
