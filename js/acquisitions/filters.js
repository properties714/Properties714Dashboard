/**
 * Properties714 — Acquisitions Module
 * filters.js — Advanced filter engine + UI
 */

'use strict';

const Filters = (() => {

  // ============================================================
  // FILTER DEFINITIONS
  // ============================================================

  const FILTER_DEFS = [
    {
      id:       'search',
      type:     'search',
      label:    'Search',
      fields:   ['name', 'phone', 'email', 'property_address', 'city'],
      placeholder: 'Search leads, address, phone...',
    },
    {
      id:       'source',
      type:     'multi-select',
      label:    'Source',
      options:  [
        'Driving for Dollars', 'Direct Mail', 'Cold Call',
        'PPC / Google', 'Facebook Ads', 'Referral',
        'Wholesaler', 'MLS', 'Probate',
        'Pre-Foreclosure', 'Tax Default', 'Other',
      ],
    },
    {
      id:       'property_type',
      type:     'multi-select',
      label:    'Property Type',
      options:  ['SFR', 'Multi-Family', 'Condo', 'Commercial', 'Land', 'Other'],
    },
    {
      id:       'condition',
      type:     'multi-select',
      label:    'Condition',
      options:  ['Excellent', 'Good', 'Fair', 'Distressed', 'Tear-Down'],
    },
    {
      id:       'urgency_level',
      type:     'multi-select',
      label:    'Urgency',
      options:  ['Critical', 'High', 'Medium', 'Low'],
    },
    {
      id:       'risk_level',
      type:     'multi-select',
      label:    'Risk',
      options:  ['Low', 'Medium', 'High'],
    },
    {
      id:       'deal_score',
      type:     'range',
      label:    'Deal Score',
      min:      0,
      max:      100,
      step:     5,
      unit:     '',
    },
    {
      id:       'roi',
      type:     'range',
      label:    'ROI %',
      min:      0,
      max:      150,
      step:     5,
      unit:     '%',
    },
    {
      id:       'asking_price',
      type:     'range',
      label:    'Asking Price',
      min:      0,
      max:      2000000,
      step:     10000,
      unit:     '$',
      format:   'currency',
    },
    {
      id:       'hot_deal',
      type:     'toggle',
      label:    '🔥 Hot Deals Only',
    },
    {
      id:       'overdue',
      type:     'toggle',
      label:    '⏰ Overdue Only',
    },
    {
      id:       'assigned_to',
      type:     'select',
      label:    'Assigned To',
      options:  [], // populated dynamically from team_members
    },
  ];

  // ============================================================
  // STATE
  // ============================================================

  let _activeFilters = {};
  let _onChangeCb    = null;
  let _debounceTimer = null;

  // ============================================================
  // RENDER FILTER BAR
  // ============================================================

  function renderBar(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="filters-bar">
        <div class="filter-search-wrap">
          <svg class="filter-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            class="filter-search-input"
            id="filter-search"
            placeholder="Search leads, address, phone..."
            autocomplete="off"
          />
          <kbd class="search-kbd">⌘K</kbd>
        </div>

        <div class="filter-chips" id="filter-chips">
          ${_renderFilterChips()}
        </div>

        <div class="filter-quick-toggles">
          <button class="quick-toggle-btn ${_activeFilters.hot_deal ? 'active' : ''}" data-filter="hot_deal" data-value="true">
            🔥 Hot
          </button>
          <button class="quick-toggle-btn ${_activeFilters.overdue ? 'active' : ''}" data-filter="overdue" data-value="true">
            ⏰ Overdue
          </button>
          <button class="quick-toggle-btn ${_activeFilters.no_contact ? 'active' : ''}" data-filter="no_contact" data-value="true">
            📵 No Contact
          </button>
        </div>

        <button class="btn btn-ghost btn-sm filter-advanced-btn" id="filter-advanced-toggle">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Filters
          ${_getActiveCount() > 0 ? `<span class="filter-active-count">${_getActiveCount()}</span>` : ''}
        </button>

        ${_getActiveCount() > 0 ? `
          <button class="btn btn-ghost btn-sm text-danger" id="filter-clear-all">
            Clear all
          </button>
        ` : ''}
      </div>

      <div class="filter-panel-advanced" id="filter-panel-advanced">
        ${_renderAdvancedPanel()}
      </div>
    `;

    _bindEvents(container);
  }

  // ============================================================
  // RENDER FILTER CHIPS (active filters)
  // ============================================================

  function _renderFilterChips() {
    const chips = [];

    Object.entries(_activeFilters).forEach(([key, val]) => {
      if (key === 'search' || !val) return;

      let label = '';
      const def = FILTER_DEFS.find(f => f.id === key);

      if (Array.isArray(val) && val.length > 0) {
        label = val.length === 1 ? val[0] : `${def?.label}: ${val.length}`;
      } else if (typeof val === 'object' && val !== null) {
        label = `${def?.label}: ${val.min ?? ''}–${val.max ?? ''}`;
      } else {
        label = def?.label || key;
      }

      chips.push(`
        <span class="filter-chip" data-key="${key}">
          ${label}
          <button class="chip-remove" data-remove="${key}" title="Remove filter">✕</button>
        </span>
      `);
    });

    return chips.join('');
  }

  // ============================================================
  // RENDER ADVANCED PANEL
  // ============================================================

  function _renderAdvancedPanel() {
    return `
      <div class="advanced-panel-grid">
        ${FILTER_DEFS.filter(f => f.type !== 'search' && f.type !== 'toggle').map(def => `
          <div class="filter-field-group">
            <label class="filter-field-label">${def.label}</label>
            ${_renderFilterField(def)}
          </div>
        `).join('')}
      </div>
    `;
  }

  function _renderFilterField(def) {
    const current = _activeFilters[def.id];

    if (def.type === 'multi-select') {
      return `
        <div class="filter-multiselect" data-filter="${def.id}">
          ${def.options.map(opt => `
            <label class="filter-ms-option ${Array.isArray(current) && current.includes(opt) ? 'selected' : ''}">
              <input type="checkbox" value="${opt}"
                ${Array.isArray(current) && current.includes(opt) ? 'checked' : ''}
                data-filter="${def.id}"
              /> ${opt}
            </label>
          `).join('')}
        </div>
      `;
    }

    if (def.type === 'range') {
      const min = current?.min ?? def.min;
      const max = current?.max ?? def.max;
      return `
        <div class="filter-range-wrap">
          <div class="range-inputs">
            <input type="number" class="filter-range-input" placeholder="${def.min}"
              data-filter="${def.id}" data-bound="min"
              value="${current?.min ?? ''}" min="${def.min}" max="${def.max}" step="${def.step}" />
            <span class="range-sep">–</span>
            <input type="number" class="filter-range-input" placeholder="${def.max}"
              data-filter="${def.id}" data-bound="max"
              value="${current?.max ?? ''}" min="${def.min}" max="${def.max}" step="${def.step}" />
          </div>
        </div>
      `;
    }

    if (def.type === 'select') {
      return `
        <select class="form-select" data-filter="${def.id}">
          <option value="">All</option>
          ${def.options.map(opt => `
            <option value="${opt}" ${current === opt ? 'selected' : ''}>${opt}</option>
          `).join('')}
        </select>
      `;
    }

    return '';
  }

  // ============================================================
  // BIND EVENTS
  // ============================================================

  function _bindEvents(container) {
    // Search input
    const searchInput = container.querySelector('#filter-search');
    if (searchInput) {
      searchInput.value = _activeFilters.search || '';
      searchInput.addEventListener('input', (e) => {
        _setFilter('search', e.target.value.trim() || null);
      });
    }

    // Quick toggles
    container.querySelectorAll('.quick-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.filter;
        const current = _activeFilters[key];
        _setFilter(key, current ? null : true);
        btn.classList.toggle('active', !current);
      });
    });

    // Advanced panel toggle
    const advToggle = container.querySelector('#filter-advanced-toggle');
    const advPanel  = container.querySelector('#filter-panel-advanced');
    if (advToggle && advPanel) {
      advToggle.addEventListener('click', () => {
        advPanel.classList.toggle('open');
        advToggle.classList.toggle('active');
      });
    }

    // Clear all
    const clearAll = container.querySelector('#filter-clear-all');
    if (clearAll) {
      clearAll.addEventListener('click', () => clearAllFilters());
    }

    // Chip removes
    container.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        _setFilter(btn.dataset.remove, null);
      });
    });

    // Multi-select checkboxes
    container.querySelectorAll('.filter-ms-option input').forEach(cb => {
      cb.addEventListener('change', () => {
        const filterId = cb.dataset.filter;
        const allChecked = Array.from(
          container.querySelectorAll(`input[data-filter="${filterId}"]:checked`)
        ).map(el => el.value);
        _setFilter(filterId, allChecked.length > 0 ? allChecked : null);
        cb.closest('.filter-ms-option').classList.toggle('selected', cb.checked);
      });
    });

    // Range inputs
    container.querySelectorAll('.filter-range-input').forEach(input => {
      input.addEventListener('input', () => {
        const filterId = input.dataset.filter;
        const bound    = input.dataset.bound;
        const current  = { ...(_activeFilters[filterId] || {}) };
        const val      = input.value !== '' ? Number(input.value) : null;

        if (val !== null) {
          current[bound] = val;
        } else {
          delete current[bound];
        }

        _setFilter(filterId, Object.keys(current).length > 0 ? current : null);
      });
    });

    // Select dropdowns
    container.querySelectorAll('select[data-filter]').forEach(sel => {
      sel.addEventListener('change', () => {
        _setFilter(sel.dataset.filter, sel.value || null);
      });
    });

    // Global ⌘K shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
      }
    });
  }

  // ============================================================
  // SET FILTER
  // ============================================================

  function _setFilter(key, value) {
    if (value === null || value === undefined ||
        (Array.isArray(value) && value.length === 0)) {
      delete _activeFilters[key];
    } else {
      _activeFilters[key] = value;
    }

    _triggerChange();
  }

  function _triggerChange() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      if (_onChangeCb) _onChangeCb({ ..._activeFilters });
    }, 80);
  }

  // ============================================================
  // APPLY FILTERS TO LEADS ARRAY
  // ============================================================

  function apply(leads, pipelineFilter = null) {
    let result = [...leads];

    // Apply pipeline filter first
    if (pipelineFilter) {
      result = result.filter(pipelineFilter);
    }

    // Apply each active filter
    Object.entries(_activeFilters).forEach(([key, value]) => {
      if (!value) return;

      if (key === 'search') {
        const q = value.toLowerCase();
        const searchFields = FILTER_DEFS.find(f => f.id === 'search')?.fields || [];
        result = result.filter(lead =>
          searchFields.some(field =>
            String(lead[field] || '').toLowerCase().includes(q)
          )
        );
        return;
      }

      if (key === 'hot_deal' || key === 'overdue' || key === 'no_contact') {
        result = result.filter(lead => lead[key] === true);
        return;
      }

      if (Array.isArray(value)) {
        result = result.filter(lead => value.includes(lead[key]));
        return;
      }

      if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
        result = result.filter(lead => {
          const v = Number(lead[key]) || 0;
          if (value.min !== undefined && v < value.min) return false;
          if (value.max !== undefined && v > value.max) return false;
          return true;
        });
        return;
      }

      // Single value
      result = result.filter(lead => String(lead[key]) === String(value));
    });

    return result;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function _getActiveCount() {
    return Object.keys(_activeFilters).filter(k =>
      _activeFilters[k] !== null && _activeFilters[k] !== undefined
    ).length;
  }

  function clearAllFilters() {
    _activeFilters = {};
    _triggerChange();
    // Re-render filter bar
    const container = document.getElementById('filters-container');
    if (container) renderBar(container);
  }

  function setSearch(query) {
    _setFilter('search', query || null);
    const input = document.getElementById('filter-search');
    if (input) input.value = query || '';
  }

  function getActive()      { return { ..._activeFilters }; }
  function getActiveCount() { return _getActiveCount(); }
  function onChange(cb)     { _onChangeCb = cb; }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    FILTER_DEFS,
    renderBar,
    apply,
    setSearch,
    clearAllFilters,
    getActive,
    getActiveCount,
    onChange,
  };

})();

window.Filters = Filters;
