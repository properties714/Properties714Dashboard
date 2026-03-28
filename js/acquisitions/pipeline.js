/**
 * Properties714 — Acquisitions Module
 * pipeline.js — Pipeline stage management
 */

'use strict';

const Pipeline = (() => {

  // ============================================================
  // STAGE DEFINITIONS
  // ============================================================

  const STAGES = [
    {
      id:       'all',
      label:    'All Leads',
      icon:     '▤',
      filter:   null,  // null = no filter
      color:    'var(--text-secondary)',
    },
    {
      id:       'New Lead',
      label:    'New Leads',
      icon:     '✦',
      color:    'var(--text-secondary)',
      next:     'Contacted',
    },
    {
      id:       'Contacted',
      label:    'Contacted',
      icon:     '◎',
      color:    'var(--info)',
      next:     'Follow-Up',
    },
    {
      id:       'Follow-Up',
      label:    'Follow-Up',
      icon:     '↺',
      color:    'var(--hot)',
      next:     'Negotiation',
    },
    {
      id:       'Negotiation',
      label:    'Negotiation',
      icon:     '◈',
      color:    'var(--purple)',
      next:     'Offer Sent',
    },
    {
      id:       'Offer Sent',
      label:    'Offer Sent',
      icon:     '◆',
      color:    'var(--teal)',
      next:     'Under Contract',
    },
    {
      id:       'Under Contract',
      label:    'Under Contract',
      icon:     '✔',
      color:    'var(--accent)',
      next:     null,
    },
    {
      id:       'Dead',
      label:    'Dead',
      icon:     '✕',
      color:    'var(--danger)',
      next:     null,
    },
  ];

  // ============================================================
  // STATE
  // ============================================================

  let _activeStage  = 'all';
  let _counts       = {};
  let _onChangeCb   = null;

  // ============================================================
  // RENDER PIPELINE TABS
  // ============================================================

  function render(container, leads) {
    if (!container) return;

    _updateCounts(leads);

    container.innerHTML = STAGES.map(stage => {
      const count   = stage.id === 'all'
                        ? leads.length
                        : (_counts[stage.id] || 0);
      const isActive = _activeStage === stage.id;
      const hotCount = stage.id !== 'all'
                        ? leads.filter(l => l.status === stage.id && l.hot_deal).length
                        : leads.filter(l => l.hot_deal).length;

      return `
        <button
          class="pipeline-tab ${isActive ? 'active' : ''}"
          data-stage="${stage.id}"
          style="--stage-color: ${stage.color}"
          title="${stage.label}"
        >
          <span class="tab-icon">${stage.icon}</span>
          <span class="tab-label">${stage.label}</span>
          <span class="tab-count ${count === 0 ? 'empty' : ''}">${count}</span>
          ${hotCount > 0 ? `<span class="tab-hot-dot" title="${hotCount} hot deal(s)"></span>` : ''}
        </button>
      `.trim();
    }).join('');

    // Bind click events
    container.querySelectorAll('.pipeline-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveStage(btn.dataset.stage);
      });
    });
  }

  // ============================================================
  // SET ACTIVE STAGE
  // ============================================================

  function setActiveStage(stageId) {
    _activeStage = stageId;

    // Update tab visual state
    document.querySelectorAll('.pipeline-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.stage === stageId);
    });

    if (_onChangeCb) _onChangeCb(stageId);
  }

  // ============================================================
  // GET ACTIVE FILTER FUNCTION
  // ============================================================

  function getFilter() {
    if (_activeStage === 'all') return null;
    return (lead) => lead.status === _activeStage;
  }

  // ============================================================
  // UPDATE COUNTS
  // ============================================================

  function _updateCounts(leads) {
    _counts = {};
    leads.forEach(lead => {
      _counts[lead.status] = (_counts[lead.status] || 0) + 1;
    });
  }

  function updateCounts(leads) {
    _updateCounts(leads);

    STAGES.forEach(stage => {
      const count   = stage.id === 'all' ? leads.length : (_counts[stage.id] || 0);
      const tabEl   = document.querySelector(`.pipeline-tab[data-stage="${stage.id}"] .tab-count`);
      if (tabEl) {
        tabEl.textContent = count;
        tabEl.classList.toggle('empty', count === 0);
      }

      // Update hot dot
      const hotCount = stage.id !== 'all'
                        ? leads.filter(l => l.status === stage.id && l.hot_deal).length
                        : leads.filter(l => l.hot_deal).length;
      const tabBtn = document.querySelector(`.pipeline-tab[data-stage="${stage.id}"]`);
      if (tabBtn) {
        let hotDot = tabBtn.querySelector('.tab-hot-dot');
        if (hotCount > 0 && !hotDot) {
          hotDot = document.createElement('span');
          hotDot.className = 'tab-hot-dot';
          tabBtn.appendChild(hotDot);
        } else if (hotCount === 0 && hotDot) {
          hotDot.remove();
        }
      }
    });
  }

  // ============================================================
  // ADVANCE LEAD TO NEXT STAGE
  // ============================================================

  function advanceToNextStage(lead) {
    const currentStage = STAGES.find(s => s.id === lead.status);
    if (!currentStage || !currentStage.next) return null;
    return currentStage.next;
  }

  // ============================================================
  // GET STAGE INFO
  // ============================================================

  function getStageInfo(stageId) {
    return STAGES.find(s => s.id === stageId) || null;
  }

  function getAllStages() { return STAGES; }
  function getActiveStage() { return _activeStage; }
  function getCounts() { return { ..._counts }; }

  // ============================================================
  // ON CHANGE CALLBACK
  // ============================================================

  function onChange(cb) { _onChangeCb = cb; }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    STAGES,
    render,
    setActiveStage,
    getFilter,
    updateCounts,
    advanceToNextStage,
    getStageInfo,
    getAllStages,
    getActiveStage,
    getCounts,
    onChange,
  };

})();

window.Pipeline = Pipeline;
