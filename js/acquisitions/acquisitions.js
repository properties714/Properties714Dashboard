/**
 * Properties714 — Acquisitions Module
 * acquisitions.js — Main system controller
 *
 * Bootstraps all modules, manages state, coordinates data flow.
 * This is the single source of truth for the module.
 */

'use strict';

const AcquisitionsApp = (() => {

  // ============================================================
  // SUPABASE CONFIG (replace with your actual keys)
  // ============================================================

  const SUPABASE_URL = window.__P714_CONFIG__?.supabaseUrl || 'https://YOUR_PROJECT.supabase.co';
  const SUPABASE_KEY = window.__P714_CONFIG__?.supabaseKey || 'YOUR_ANON_KEY';

  // ============================================================
  // MOCK DATA — used when Supabase not connected
  // ============================================================

  const MOCK_LEADS = [
    {
      id: 'lead_001',
      name: 'Marcus Johnson',
      phone: '+1 (404) 555-0142',
      email: 'marcus.j@email.com',
      source: 'Driving for Dollars',
      assigned_to: 'Eduardo',
      property_address: '1247 Peachtree Blvd NE',
      city: 'Atlanta', state: 'GA', zip: '30309',
      property_type: 'SFR',
      condition: 'Distressed',
      occupancy: 'Vacant',
      asking_price: 180000, arv: 320000, repairs: 45000,
      mao: 179000, estimated_profit: 52000, roi: 38.5,
      deal_score: 87, motivation_score: 9,
      urgency_level: 'High', risk_level: 'Low',
      status: 'Negotiation', substatus: 'Counter Offer Pending',
      last_contact: '2025-01-15', next_followup: '2025-01-18',
      attempts: 7, days_in_pipeline: 12,
      hot_deal: true, overdue: false, no_contact: false,
      suggested_action: 'Send Offer',
      notes: [
        { date: '2025-01-15', author: 'Eduardo', content: 'Seller motivated — divorce situation. Wants quick close.' },
        { date: '2025-01-12', author: 'Eduardo', content: 'Property has foundation cracks. Seller aware, priced in.' },
      ],
      activity: [
        { date: '2025-01-15', type: 'call', description: 'Spoke 22 min. Highly motivated. Will counter.' },
        { date: '2025-01-12', type: 'visit', description: 'Drive-by confirmed vacant. Heavy deferred maintenance.' },
        { date: '2025-01-09', type: 'call', description: 'No answer. Left voicemail.' },
      ],
      created_at: '2025-01-03', updated_at: '2025-01-15',
    },
    {
      id: 'lead_002',
      name: 'Diane Torres',
      phone: '+1 (770) 555-0289',
      email: 'dtorres@gmail.com',
      source: 'Direct Mail',
      assigned_to: 'Junior',
      property_address: '456 Magnolia Drive',
      city: 'Marietta', state: 'GA', zip: '30060',
      property_type: 'SFR',
      condition: 'Fair',
      occupancy: 'Owner-Occupied',
      asking_price: 210000, arv: 295000, repairs: 28000,
      mao: 178500, estimated_profit: 36500, roi: 25.2,
      deal_score: 71, motivation_score: 7,
      urgency_level: 'Medium', risk_level: 'Medium',
      status: 'Follow-Up', substatus: null,
      last_contact: '2025-01-10', next_followup: '2025-01-17',
      attempts: 4, days_in_pipeline: 18,
      hot_deal: false, overdue: true, no_contact: false,
      suggested_action: 'Call',
      notes: [],
      activity: [
        { date: '2025-01-10', type: 'call', description: 'Spoke 8 min. Interested but hesitant.' },
      ],
      created_at: '2024-12-29', updated_at: '2025-01-10',
    },
    {
      id: 'lead_003',
      name: 'Robert Kimani',
      phone: '+1 (678) 555-0371',
      email: 'rkimani@hotmail.com',
      source: 'Pre-Foreclosure',
      assigned_to: 'Eduardo',
      property_address: '892 Elm Street',
      city: 'Decatur', state: 'GA', zip: '30030',
      property_type: 'SFR',
      condition: 'Good',
      occupancy: 'Owner-Occupied',
      asking_price: 255000, arv: 340000, repairs: 18000,
      mao: 220000, estimated_profit: 47000, roi: 29.6,
      deal_score: 76, motivation_score: 8,
      urgency_level: 'High', risk_level: 'Low',
      status: 'Offer Sent', substatus: 'Awaiting Seller Response',
      last_contact: '2025-01-14', next_followup: '2025-01-16',
      attempts: 9, days_in_pipeline: 22,
      hot_deal: false, overdue: false, no_contact: false,
      suggested_action: 'Follow-Up',
      notes: [],
      activity: [],
      created_at: '2024-12-24', updated_at: '2025-01-14',
    },
    {
      id: 'lead_004',
      name: 'Angela Westbrook',
      phone: '+1 (404) 555-0418',
      email: 'awestbrook@email.com',
      source: 'Probate',
      assigned_to: 'Yeimy',
      property_address: '3301 Cascade Rd SW',
      city: 'Atlanta', state: 'GA', zip: '30311',
      property_type: 'SFR',
      condition: 'Distressed',
      occupancy: 'Vacant',
      asking_price: 95000, arv: 230000, repairs: 62000,
      mao: 99000, estimated_profit: 73000, roi: 55.4,
      deal_score: 91, motivation_score: 10,
      urgency_level: 'Critical', risk_level: 'Medium',
      status: 'Negotiation', substatus: 'Under Review',
      last_contact: '2025-01-16', next_followup: '2025-01-17',
      attempts: 5, days_in_pipeline: 6,
      hot_deal: true, overdue: false, no_contact: false,
      suggested_action: 'Send Offer',
      notes: [
        { date: '2025-01-16', author: 'Yeimy', content: 'Estate sale. Multiple heirs agreeable. Need to move fast.' },
      ],
      activity: [
        { date: '2025-01-16', type: 'call', description: 'Spoke with estate attorney. All parties motivated.' },
      ],
      created_at: '2025-01-10', updated_at: '2025-01-16',
    },
    {
      id: 'lead_005',
      name: 'Thomas Okafor',
      phone: '+1 (770) 555-0562',
      email: 'tokafor@email.com',
      source: 'Cold Call',
      assigned_to: 'Junior',
      property_address: '714 Roswell Ave',
      city: 'Roswell', state: 'GA', zip: '30075',
      property_type: 'Multi-Family',
      condition: 'Fair',
      occupancy: 'Tenant-Occupied',
      asking_price: 480000, arv: 620000, repairs: 55000,
      mao: 379000, estimated_profit: 86000, roi: 19.8,
      deal_score: 63, motivation_score: 5,
      urgency_level: 'Low', risk_level: 'High',
      status: 'Contacted', substatus: null,
      last_contact: '2025-01-08', next_followup: '2025-01-22',
      attempts: 2, days_in_pipeline: 9,
      hot_deal: false, overdue: false, no_contact: false,
      suggested_action: 'Follow-Up',
      notes: [],
      activity: [],
      created_at: '2025-01-07', updated_at: '2025-01-08',
    },
    {
      id: 'lead_006',
      name: 'Sandra Nkemelu',
      phone: '+1 (404) 555-0633',
      email: 'snkemelu@yahoo.com',
      source: 'Facebook Ads',
      assigned_to: 'Eduardo',
      property_address: '2201 Campbellton Rd SW',
      city: 'Atlanta', state: 'GA', zip: '30311',
      property_type: 'SFR',
      condition: 'Tear-Down',
      occupancy: 'Vacant',
      asking_price: 48000, arv: 190000, repairs: 95000,
      mao: 38000, estimated_profit: 47000, roi: 44.4,
      deal_score: 79, motivation_score: 8,
      urgency_level: 'High', risk_level: 'High',
      status: 'New Lead', substatus: null,
      last_contact: null, next_followup: '2025-01-17',
      attempts: 0, days_in_pipeline: 1,
      hot_deal: false, overdue: false, no_contact: false,
      suggested_action: 'Call',
      notes: [],
      activity: [],
      created_at: '2025-01-16', updated_at: '2025-01-16',
    },
    {
      id: 'lead_007',
      name: 'Clifton Heard',
      phone: '+1 (678) 555-0741',
      email: null,
      source: 'Tax Default',
      assigned_to: 'Yeimy',
      property_address: '58 Glenwood Ave SE',
      city: 'Atlanta', state: 'GA', zip: '30316',
      property_type: 'SFR',
      condition: 'Fair',
      occupancy: 'Unknown',
      asking_price: 160000, arv: 218000, repairs: 22000,
      mao: 130600, estimated_profit: 36600, roi: 25.5,
      deal_score: 44, motivation_score: 3,
      urgency_level: 'Low', risk_level: 'Medium',
      status: 'Dead', substatus: 'Not Motivated',
      last_contact: '2024-12-20', next_followup: null,
      attempts: 11, days_in_pipeline: 28,
      hot_deal: false, overdue: false, no_contact: true,
      suggested_action: 'Ignore',
      notes: [],
      activity: [],
      created_at: '2024-12-19', updated_at: '2024-12-20',
    },
    {
      id: 'lead_008',
      name: 'Patricia Dumont',
      phone: '+1 (770) 555-0824',
      email: 'pat.dumont@gmail.com',
      source: 'Referral',
      assigned_to: 'Eduardo',
      property_address: '1100 Virginia Ave NE',
      city: 'Atlanta', state: 'GA', zip: '30306',
      property_type: 'SFR',
      condition: 'Good',
      occupancy: 'Owner-Occupied',
      asking_price: 380000, arv: 510000, repairs: 30000,
      mao: 327000, estimated_profit: 100000, roi: 29.1,
      deal_score: 68, motivation_score: 6,
      urgency_level: 'Medium', risk_level: 'Low',
      status: 'Under Contract', substatus: 'Inspection Period',
      last_contact: '2025-01-15', next_followup: '2025-01-20',
      attempts: 14, days_in_pipeline: 35,
      hot_deal: true, overdue: false, no_contact: false,
      suggested_action: 'Escalate',
      notes: [],
      activity: [],
      created_at: '2024-12-12', updated_at: '2025-01-15',
    },
  ];

  // ============================================================
  // APP STATE
  // ============================================================

  let _leads       = [];
  let _supabase    = null;
  let _isConnected = false;
  let _initialized = false;

  // ============================================================
  // LEAD STORE (interface for automation engine)
  // ============================================================

  const LeadStore = {
    getAll:   ()       => [..._leads],
    getById:  (id)     => _leads.find(l => l.id === id) || null,
    update:   (lead)   => _updateLead(lead),
    add:      (lead)   => _addLead(lead),
    remove:   (id)     => _removeLead(id),
  };

  // ============================================================
  // INIT
  // ============================================================

  async function init() {
    if (_initialized) return;
    _initialized = true;

    console.info('[Properties714] Acquisitions Module initializing...');

    // Init sub-modules
    Automation.init({
      leadStore: LeadStore,
      toastFn:   _showToast,
    });

    Table.init({
      onRowClick: _handleRowClick,
      onAction:   _handleAction,
    });

    Pipeline.onChange(_onPipelineChange);
    Filters.onChange(_onFiltersChange);

    // Render static UI structures
    _renderStaticUI();

    // Attempt Supabase connection
    try {
      await _connectSupabase();
    } catch (err) {
      console.warn('[Properties714] Supabase not connected, using mock data.', err.message);
      _isConnected = false;
    }

    // Load leads
    await _loadLeads();

    // Start automation checks (every 2 min)
    setInterval(() => {
      Automation.runChecks(_leads);
    }, 120_000);

    // Update KPIs
    _updateKPIs();

    console.info('[Properties714] Acquisitions Module ready.', {
      leads: _leads.length,
      connected: _isConnected,
    });
  }

  // ============================================================
  // RENDER STATIC UI STRUCTURES
  // ============================================================

  function _renderStaticUI() {
    // Pipeline tabs
    const pipelineEl = document.getElementById('pipeline-container');
    if (pipelineEl) Pipeline.render(pipelineEl, []);

    // Filter bar
    const filtersEl = document.getElementById('filters-container');
    if (filtersEl) Filters.renderBar(filtersEl);
  }

  // ============================================================
  // SUPABASE CONNECTION
  // ============================================================

  async function _connectSupabase() {
    if (!window.supabase) throw new Error('Supabase client not loaded');
    if (SUPABASE_URL.includes('YOUR_PROJECT')) throw new Error('Supabase not configured');

    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Verify connection
    const { error } = await _supabase.from('acquisitions_leads').select('count').limit(1);
    if (error) throw error;

    _isConnected = true;
    console.info('[Properties714] Supabase connected.');

    // Set up real-time subscription
    _supabase
      .channel('acquisitions_leads_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'acquisitions_leads',
      }, _handleRealtimeUpdate)
      .subscribe();
  }

  // ============================================================
  // LOAD LEADS
  // ============================================================

  async function _loadLeads() {
    if (_isConnected) {
      try {
        const { data, error } = await _supabase
          .from('acquisitions_leads')
          .select(`
            *,
            assigned_to:team_members(id, full_name),
            lead_notes(*),
            lead_activity(*)
          `)
          .order('deal_score', { ascending: false });

        if (error) throw error;

        _leads = Scoring.recalculateAll(data || []);
      } catch (err) {
        console.error('[Properties714] Failed to load leads:', err);
        _leads = MOCK_LEADS;
      }
    } else {
      _leads = Scoring.recalculateAll([...MOCK_LEADS]);
    }

    _renderAll();
    _updateKPIs();
  }

  // ============================================================
  // RENDER ALL (coordinate pipeline + filters + table)
  // ============================================================

  function _renderAll() {
    const pipelineEl = document.getElementById('pipeline-container');
    const filtersEl  = document.getElementById('filters-container');
    const tableEl    = document.getElementById('table-container');

    // Re-render pipeline with updated counts
    if (pipelineEl) Pipeline.render(pipelineEl, _leads);

    // Re-render filter bar (preserves active filters)
    if (filtersEl) Filters.renderBar(filtersEl);

    // Apply pipeline + filter, then render table
    const pipelineFilter = Pipeline.getFilter();
    const filtered = Filters.apply(_leads, pipelineFilter);

    Table.setData(_leads);
    if (tableEl) Table.render(tableEl, filtered);
  }

  // ============================================================
  // KPI CALCULATIONS
  // ============================================================

  function _updateKPIs() {
    const total       = _leads.filter(l => l.status !== 'Dead').length;
    const hot         = _leads.filter(l => l.hot_deal).length;
    const contract    = _leads.filter(l => l.status === 'Under Contract').length;
    const totalROI    = _leads.reduce((sum, l) => sum + (Number(l.estimated_profit) || 0), 0);

    _setKPI('kpi-total-leads', total);
    _setKPI('kpi-hot-deals',   hot);
    _setKPI('kpi-under-contract', contract);
    _setKPI('kpi-potential-roi', Scoring.Financial.formatCurrency(totalROI, true));
  }

  function _setKPI(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      el.classList.add('kpi-animate');
      setTimeout(() => el.classList.remove('kpi-animate'), 600);
    }
  }

  // ============================================================
  // PIPELINE CHANGE HANDLER
  // ============================================================

  function _onPipelineChange(stageId) {
    const tableEl = document.getElementById('table-container');
    if (!tableEl) return;

    const pipelineFilter = Pipeline.getFilter();
    const filtered = Filters.apply(_leads, pipelineFilter);

    Table.setData(_leads);
    Table.refresh(tableEl, filtered);
  }

  // ============================================================
  // FILTER CHANGE HANDLER
  // ============================================================

  function _onFiltersChange(activeFilters) {
    const tableEl = document.getElementById('table-container');
    if (!tableEl) return;

    const pipelineFilter = Pipeline.getFilter();
    const filtered = Filters.apply(_leads, pipelineFilter);

    Table.setData(_leads);
    Table.refresh(tableEl, filtered);
  }

  // ============================================================
  // ROW CLICK — Open Sidebar
  // ============================================================

  function _handleRowClick(lead) {
    Sidebar.open(lead);
  }

  // ============================================================
  // ACTION HANDLER
  // ============================================================

  function _handleAction(action, payload) {
    const lead = payload.id ? _leads.find(l => l.id === payload.id) : null;

    switch (action) {
      case 'call':
        if (lead?.phone) {
          window.location.href = `tel:${lead.phone}`;
          _logActivity(lead, 'call', 'Initiated call from acquisitions table');
        }
        break;

      case 'sms':
        if (lead?.phone) {
          window.open(`sms:${lead.phone}`, '_blank');
        }
        break;

      case 'email':
        if (lead?.email) {
          window.open(`mailto:${lead.email}`, '_blank');
        }
        break;

      case 'note':
        Sidebar.open(lead, 'notes');
        break;

      case 'task':
        _showAddTaskModal(lead);
        break;

      case 'analyzer':
        _runAnalyzer(lead);
        break;

      case 'offer':
        _showSendOfferModal(lead);
        break;

      case 'bulk:status':
        _showBulkStatusModal(payload.ids);
        break;

      case 'bulk:assign':
        _showBulkAssignModal(payload.ids);
        break;

      case 'bulk:export':
        _exportLeads(payload.ids);
        break;

      default:
        console.info('[Properties714] Unhandled action:', action, payload);
    }
  }

  // ============================================================
  // REAL-TIME UPDATE HANDLER
  // ============================================================

  function _handleRealtimeUpdate(payload) {
    console.debug('[Properties714] Realtime update:', payload.eventType, payload.new?.id);

    if (payload.eventType === 'INSERT') {
      const newLead = Scoring.recalculateAll([payload.new])[0];
      _leads.unshift(newLead);
      Automation.onLeadCreated(newLead);
    } else if (payload.eventType === 'UPDATE') {
      const idx = _leads.findIndex(l => l.id === payload.new.id);
      if (idx >= 0) {
        const updated = Scoring.recalculateAll([payload.new])[0];
        _leads[idx] = updated;
      }
    } else if (payload.eventType === 'DELETE') {
      _leads = _leads.filter(l => l.id !== payload.old.id);
    }

    _renderAll();
    _updateKPIs();
  }

  // ============================================================
  // LEAD CRUD
  // ============================================================

  async function _addLead(leadData) {
    // Calculate derived values
    const mao   = Scoring.Financial.calculateMAO(leadData.arv, leadData.repairs);
    const profit = Scoring.Financial.calculateProfit(leadData.arv, leadData.asking_price, leadData.repairs);
    const roi   = Scoring.Financial.calculateROI(leadData.arv, leadData.asking_price, leadData.repairs);

    const newLead = {
      ...leadData,
      mao,
      estimated_profit: profit,
      roi,
      status: leadData.status || 'New Lead',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    newLead.deal_score = Scoring.calculate(newLead);
    newLead.suggested_action = Scoring.getSuggestedAction(newLead);

    if (_isConnected) {
      const { data, error } = await _supabase
        .from('acquisitions_leads')
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;
      _leads.unshift(data);
      Automation.onLeadCreated(data);
    } else {
      newLead.id = `lead_${Date.now()}`;
      _leads.unshift(newLead);
      Automation.onLeadCreated(newLead);
    }

    _renderAll();
    _updateKPIs();
    _showToast({ level: 'success', title: 'Lead Added', message: `${newLead.name} added to pipeline` });
    return newLead;
  }

  async function _updateLead(leadData) {
    const idx = _leads.findIndex(l => l.id === leadData.id);
    if (idx < 0) return;

    const oldLead = _leads[idx];
    const mao     = Scoring.Financial.calculateMAO(leadData.arv, leadData.repairs);
    const profit  = Scoring.Financial.calculateProfit(leadData.arv, leadData.asking_price, leadData.repairs);
    const roi     = Scoring.Financial.calculateROI(leadData.arv, leadData.asking_price, leadData.repairs);

    const updated = {
      ...leadData,
      mao,
      estimated_profit: profit,
      roi,
      updated_at: new Date().toISOString(),
    };

    const oldScore       = oldLead.deal_score;
    updated.deal_score   = Scoring.calculate(updated);
    updated.suggested_action = Scoring.getSuggestedAction(updated);

    _leads[idx] = updated;

    // Fire automation events
    if (updated.status !== oldLead.status) {
      Automation.onStatusChanged(updated);
    }

    if (updated.deal_score !== oldScore) {
      Automation.onScoreUpdated(updated);
      Assistant.onScoreChanged(updated, oldScore, updated.deal_score);
    }

    if (_isConnected) {
      const { error } = await _supabase
        .from('acquisitions_leads')
        .update(updated)
        .eq('id', updated.id);

      if (error) console.error('[Properties714] Update failed:', error);
    }

    _renderAll();
    _updateKPIs();

    return updated;
  }

  async function _removeLead(id) {
    _leads = _leads.filter(l => l.id !== id);

    if (_isConnected) {
      const { error } = await _supabase
        .from('acquisitions_leads')
        .delete()
        .eq('id', id);

      if (error) console.error('[Properties714] Delete failed:', error);
    }

    _renderAll();
    _updateKPIs();
  }

  // ============================================================
  // LOG ACTIVITY
  // ============================================================

  async function _logActivity(lead, type, description) {
    const entry = {
      lead_id:     lead.id,
      type,
      description,
      created_at: new Date().toISOString(),
    };

    if (_isConnected) {
      await _supabase.from('lead_activity').insert(entry);
    }

    // Update lead's last_contact
    if (['call', 'sms', 'email'].includes(type)) {
      await _updateLead({ ...lead, last_contact: new Date().toISOString(), attempts: (lead.attempts || 0) + 1 });
    }

    window.dispatchEvent(new CustomEvent('acq:activity_logged', { detail: { lead, entry } }));
  }

  // ============================================================
  // ANALYZER
  // ============================================================

  async function _runAnalyzer(lead) {
    if (!lead) return;

    _showToast({ level: 'info', title: '⚡ Running Analyzer', message: `Analyzing ${lead.name}...` });

    const breakdown = Scoring.getBreakdown(lead);
    const mao       = Scoring.Financial.calculateMAO(lead.arv, lead.repairs);
    const roi       = Scoring.Financial.calculateROI(lead.arv, lead.asking_price, lead.repairs);
    const equity    = Scoring.Financial.calculateEquityPct(lead.arv, lead.asking_price);

    const modal = document.getElementById('analyzer-modal');
    if (modal) {
      document.getElementById('analyzer-lead-name').textContent = lead.name;
      document.getElementById('analyzer-address').textContent = lead.property_address;
      document.getElementById('analyzer-score').textContent = lead.deal_score;
      document.getElementById('analyzer-mao').textContent = Scoring.Financial.formatCurrency(mao);
      document.getElementById('analyzer-roi').textContent = Scoring.Financial.formatPct(roi);
      document.getElementById('analyzer-equity').textContent = Scoring.Financial.formatPct(equity);
      document.getElementById('analyzer-action').textContent = lead.suggested_action;
      modal.classList.add('open');
    }
  }

  // ============================================================
  // MODALS
  // ============================================================

  function _showAddLeadModal() {
    const modal = document.getElementById('add-lead-modal');
    if (modal) modal.classList.add('open');
  }

  function _showAddTaskModal(lead) {
    Sidebar.open(lead, 'tasks');
  }

  function _showSendOfferModal(lead) {
    _showToast({ level: 'info', title: '📄 Preparing Offer', message: `Generating offer for ${lead?.name}...` });
    // Future: integrate with offer generator
  }

  function _showBulkStatusModal(ids) {
    _showToast({ level: 'info', title: 'Bulk Status Change', message: `${ids.length} leads selected` });
  }

  function _showBulkAssignModal(ids) {
    _showToast({ level: 'info', title: 'Bulk Assign', message: `Assigning ${ids.length} leads...` });
  }

  function _exportLeads(ids) {
    const toExport = ids
      ? _leads.filter(l => ids.includes(l.id))
      : _leads;

    const csv = _leadsToCSV(toExport);
    _downloadCSV(csv, `p714_leads_${Date.now()}.csv`);
    _showToast({ level: 'success', title: 'Exported', message: `${toExport.length} leads exported` });
  }

  function _leadsToCSV(leads) {
    const cols = ['name','phone','email','source','property_address','city','state','zip',
                  'property_type','condition','asking_price','arv','repairs','mao','roi',
                  'estimated_profit','deal_score','urgency_level','risk_level','status',
                  'last_contact','next_followup','attempts','days_in_pipeline'];
    const header = cols.join(',');
    const rows   = leads.map(l =>
      cols.map(c => `"${String(l[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    return [header, ...rows].join('\n');
  }

  function _downloadCSV(content, filename) {
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
    a.download = filename;
    a.click();
  }

  // ============================================================
  // TOAST SYSTEM
  // ============================================================

  function _showToast({ level = 'info', title = '', message = '' }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${level}`;
    toast.innerHTML = `
      <span class="toast-icon" style="color: var(--${level === 'success' ? 'accent' : level === 'error' ? 'danger' : level === 'warning' ? 'hot' : 'info'})">${icons[level] || 'ℹ'}</span>
      <div>
        <div class="toast-title">${_escHTML(title)}</div>
        ${message ? `<div class="toast-msg">${_escHTML(message)}</div>` : ''}
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function _escHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ============================================================
  // LISTEN FOR AUTOMATION EVENTS FROM DOM
  // ============================================================

  window.addEventListener('automation:create_task', (e) => {
    console.debug('[Properties714] Auto-task:', e.detail);
  });

  window.addEventListener('automation:log_activity', (e) => {
    const lead = LeadStore.getById(e.detail.lead_id);
    if (lead) _logActivity(lead, e.detail.type, e.detail.description);
  });

  window.addEventListener('automation:ai_analyze', (e) => {
    const lead = LeadStore.getById(e.detail.lead_id);
    if (lead) _runAnalyzer(lead);
  });

  // ============================================================
  // GLOBAL ACTION BUTTONS (header)
  // ============================================================

  function _bindGlobalActions() {
    document.getElementById('btn-add-lead')?.addEventListener('click', _showAddLeadModal);
    document.getElementById('btn-run-analyzer')?.addEventListener('click', () => _showToast({
      level: 'info', title: '⚡ Batch Analyzer', message: 'Analyzing all leads...'
    }));
    document.getElementById('btn-automate')?.addEventListener('click', () => _showToast({
      level: 'info', title: '🤖 Automation', message: `${Automation.getRules().filter(r=>r.active).length} rules active`
    }));
    document.getElementById('btn-export')?.addEventListener('click', () => _exportLeads());
    document.getElementById('add-lead-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      await _addLead(data);
      document.getElementById('add-lead-modal')?.classList.remove('open');
      e.target.reset();
    });

    // Modal backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.modal-backdrop')?.classList.remove('open'));
    });
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    init,
    get leads()  { return [..._leads]; },
    get store()  { return LeadStore; },
    addLead:     _addLead,
    updateLead:  _updateLead,
    removeLead:  _removeLead,
    showToast:   _showToast,
    runAnalyzer: _runAnalyzer,
    bindGlobalActions: _bindGlobalActions,
    exportLeads: _exportLeads,
  };

})();

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AcquisitionsApp.init();
  AcquisitionsApp.bindGlobalActions();
});

window.AcquisitionsApp = AcquisitionsApp;
