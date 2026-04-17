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
  // SUPABASE CONFIG (fallback — prefers P714Auth client)
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
    const pipelineEl = document.getElementById('pipeline-container');
    if (pipelineEl) Pipeline.render(pipelineEl, []);

    const filtersEl = document.getElementById('filters-container');
    if (filtersEl) Filters.renderBar(filtersEl);
  }

  // ============================================================
  // SUPABASE CONNECTION
  // ============================================================

  async function _connectSupabase() {
    // Prefer the shared P714Auth client (already authenticated)
    if (window.P714Auth?.isLoggedIn()) {
      _supabase    = window.P714Auth.getClient();
      _isConnected = true;
      console.info('[Properties714] Using P714Auth Supabase client.');

      // Real-time subscription
      _supabase
        .channel('acquisitions_leads_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'acquisitions_leads',
        }, _handleRealtimeUpdate)
        .subscribe();
      return;
    }

    // Fallback: own client (dev / not-auth mode)
    if (!window.supabase) throw new Error('Supabase client not loaded');
    if (SUPABASE_URL.includes('YOUR_PROJECT')) throw new Error('Supabase not configured');

    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error } = await _supabase.from('acquisitions_leads').select('count').limit(1);
    if (error) throw error;

    _isConnected = true;
    console.info('[Properties714] Supabase connected (own client).');

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
          .select('*, lead_notes(*), lead_activity(*)')
          .order('deal_score', { ascending: false });

        if (error) throw error;

        // Map lead_notes → notes and lead_activity → activity for sidebar compatibility
        _leads = Scoring.recalculateAll((data || []).map(l => ({
          ...l,
          notes:    l.lead_notes    || [],
          activity: l.lead_activity || [],
        })));
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

    if (pipelineEl) Pipeline.render(pipelineEl, _leads);
    if (filtersEl)  Filters.renderBar(filtersEl);

    const pipelineFilter = Pipeline.getFilter();
    const filtered = Filters.apply(_leads, pipelineFilter);

    Table.setData(_leads);
    if (tableEl) Table.render(tableEl, filtered);
  }

  // ============================================================
  // KPI CALCULATIONS
  // ============================================================

  function _updateKPIs() {
    const total    = _leads.filter(l => l.status !== 'Dead').length;
    const hot      = _leads.filter(l => l.hot_deal).length;
    const contract = _leads.filter(l => l.status === 'Under Contract').length;
    const totalROI = _leads.reduce((sum, l) => sum + (Number(l.estimated_profit) || 0), 0);

    _setKPI('kpi-total-leads',    total);
    _setKPI('kpi-hot-deals',      hot);
    _setKPI('kpi-under-contract', contract);
    _setKPI('kpi-potential-roi',  Scoring.Financial.formatCurrency(totalROI, true));
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
  // PIPELINE / FILTER CHANGE HANDLERS
  // ============================================================

  function _onPipelineChange() {
    const tableEl = document.getElementById('table-container');
    if (!tableEl) return;
    const filtered = Filters.apply(_leads, Pipeline.getFilter());
    Table.setData(_leads);
    Table.refresh(tableEl, filtered);
  }

  function _onFiltersChange() {
    const tableEl = document.getElementById('table-container');
    if (!tableEl) return;
    const filtered = Filters.apply(_leads, Pipeline.getFilter());
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
        if (lead?.phone) window.open(`sms:${lead.phone}`, '_blank');
        break;
      case 'email':
        if (lead?.email) window.open(`mailto:${lead.email}`, '_blank');
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

  // Client-only fields that have NO column in acquisitions_leads (arrays, related tables)
  const _CLIENT_ONLY_FIELDS = ['tasks', 'activity', 'documents', 'lead_notes', 'lead_activity'];

  // Numeric columns — FormData returns strings; empty → omit so DB default applies
  const _NUMERIC_FIELDS = [
    'asking_price','arv','repairs','mao','estimated_profit','roi',
    'motivation_score','deal_score','assignment_fee','holding_costs','purchase_price',
    'monthly_rent','noi','cap_rate','cash_on_cash','attempts','days_in_pipeline',
    'beds','baths','comp1_distance','comp2_distance','comp3_distance','initial_offer',
  ];

  // ENUM columns — PostgreSQL rejects empty string ""; must send null
  const _ENUM_FIELDS = ['condition','occupancy','source','property_type','urgency_level','risk_level','suggested_action'];

  // property_type values the form may send that aren't in the DB ENUM
  const _PROPERTY_TYPE_MAP = { 'Duplex': 'Multi-Family', 'Mobile': 'Other' };

  function _toDbRow(data) {
    const row = { ...data };

    // Strip client-only array fields (not DB columns)
    _CLIENT_ONLY_FIELDS.forEach(f => delete row[f]);

    // 'notes' IS a valid text column in acquisitions_leads, but if it came from
    // a Supabase load it will be an array (mapped from lead_notes) — strip arrays
    if (Array.isArray(row.notes)) delete row.notes;

    // ENUM fields: empty string → null (Postgres rejects "" for enum types)
    _ENUM_FIELDS.forEach(f => {
      if (f in row && row[f] === '') row[f] = null;
    });

    // Remap property_type values not present in the DB enum
    if (row.property_type && _PROPERTY_TYPE_MAP[row.property_type]) {
      row.property_type = _PROPERTY_TYPE_MAP[row.property_type];
    }

    // Numeric fields: empty string → delete so DB default applies
    _NUMERIC_FIELDS.forEach(f => {
      if (f in row) {
        const v = row[f];
        if (v === '' || v === null || v === undefined) {
          delete row[f];
        } else {
          const n = Number(v);
          row[f] = isNaN(n) ? null : n;
        }
      }
    });

    return row;
  }

  async function _addLead(leadData) {
    const coreData = _toDbRow(leadData);

    // Apply defaults for NOT NULL columns
    if (!coreData.name?.trim())             coreData.name             = 'Vendedor sin nombre';
    if (!coreData.property_address?.trim()) coreData.property_address = 'Dirección pendiente';
    coreData.city  = coreData.city  || 'Atlanta';
    coreData.state = coreData.state || 'GA';

    const mao    = Scoring.Financial.calculateMAO(coreData.arv, coreData.repairs);
    const profit = Scoring.Financial.calculateProfit(coreData.arv, coreData.asking_price, coreData.repairs);
    const roi    = Scoring.Financial.calculateROI(coreData.arv, coreData.asking_price, coreData.repairs);

    const newLead = {
      ...coreData,
      // Attach the current user's id (required by RLS)
      user_id:          window.P714Auth?.getUser()?.id || coreData.user_id,
      assigned_to:      coreData.assigned_to || window.P714Auth?.getProfile()?.full_name || 'Unknown',
      mao,
      estimated_profit: profit,
      roi,
      status:           coreData.status || 'New Lead',
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
    };

    newLead.deal_score       = Scoring.calculate(newLead);
    newLead.suggested_action = Scoring.getSuggestedAction(newLead);

    if (_isConnected) {
      const { data, error } = await _supabase
        .from('acquisitions_leads')
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;

      // Set client-side arrays for sidebar display
      data.notes    = [];
      data.activity = [];
      _leads.unshift(data);
      Automation.onLeadCreated(data);
    } else {
      newLead.id       = `lead_${Date.now()}`;
      newLead.notes    = [];
      newLead.activity = [];
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

    const oldLead   = _leads[idx];
    // Preserve client-only fields from current in-memory lead, strip from DB payload
    const clientData = {
      notes:    oldLead.notes    || [],
      activity: oldLead.activity || [],
      tasks:    oldLead.tasks    || [],
    };
    const coreData = _toDbRow(leadData);

    const mao     = Scoring.Financial.calculateMAO(coreData.arv, coreData.repairs);
    const profit  = Scoring.Financial.calculateProfit(coreData.arv, coreData.asking_price, coreData.repairs);
    const roi     = Scoring.Financial.calculateROI(coreData.arv, coreData.asking_price, coreData.repairs);

    const updated = {
      ...coreData,
      ...clientData,
      mao,
      estimated_profit: profit,
      roi,
      updated_at: new Date().toISOString(),
    };

    const oldScore           = oldLead.deal_score;
    updated.deal_score       = Scoring.calculate(updated);
    updated.suggested_action = Scoring.getSuggestedAction(updated);

    _leads[idx] = updated;

    if (updated.status !== oldLead.status) Automation.onStatusChanged(updated);
    if (updated.deal_score !== oldScore) {
      Automation.onScoreUpdated(updated);
      Assistant.onScoreChanged(updated, oldScore, updated.deal_score);
    }

    if (_isConnected) {
      const { error } = await _supabase
        .from('acquisitions_leads')
        .update(_toDbRow(updated))
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
      lead_id:    lead.id,
      user_id:    window.P714Auth?.getUser()?.id || lead.user_id,
      type,
      description,
      created_at: new Date().toISOString(),
    };

    if (_isConnected) {
      await _supabase.from('lead_activity').insert(entry);
    }

    if (['call', 'sms', 'email'].includes(type)) {
      await _updateLead({ ...lead, last_contact: new Date().toISOString(), attempts: (lead.attempts || 0) + 1 });
    }

    window.dispatchEvent(new CustomEvent('acq:activity_logged', { detail: { lead, entry } }));
  }

  // ============================================================
  // ANALYZER
  // ============================================================

  let _analyzerCurrentLead = null;

  async function _runAnalyzer(lead) {
    if (!lead) return;
    _analyzerCurrentLead = lead;

    const modal    = document.getElementById('analyzer-modal');
    const outputEl = document.getElementById('analyzer-output');
    const nameEl   = document.getElementById('analyzer-lead-name');
    const runBtn   = document.getElementById('analyzer-run-btn');

    if (!modal) return;

    if (nameEl) nameEl.textContent = lead.name + ' — ' + (lead.property_address || '');
    if (outputEl) {
      outputEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:20px;color:#0D9488">
          <div class="d-dots"><span></span><span></span><span></span></div>
          <span style="font-size:13px;color:#475569">Analizando deal con IA...</span>
        </div>`;
    }
    if (runBtn) runBtn.disabled = true;
    modal.classList.add('open');

    const result = await Assistant.analyzeDeal(lead);

    if (runBtn) runBtn.disabled = false;
    if (outputEl) {
      if (result.success && result.text) {
        const html = result.text
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
          .replace(/\n/g,'<br>');
        outputEl.innerHTML = `<div style="font-size:13px;line-height:1.75;color:#0F172A;padding:4px 0">${html}</div>`;
      } else {
        outputEl.innerHTML = `<div style="padding:16px;color:#DC2626;font-size:13px">
          ⚠ Error de análisis: ${_escHTML(result.error || 'Error desconocido')}
        </div>`;
      }
    }
  }

  // ============================================================
  // MODALS
  // ============================================================

  function _showAddLeadModal() {
    const modal = document.getElementById('add-lead-modal');
    if (modal) modal.classList.add('open');
  }

  function _showAddTaskModal(lead)   { Sidebar.open(lead, 'tasks'); }
  function _showSendOfferModal(lead) {
    _showToast({ level: 'info', title: '📄 Preparing Offer', message: `Generating offer for ${lead?.name}...` });
  }
  function _showBulkStatusModal(ids) {
    _showToast({ level: 'info', title: 'Bulk Status Change', message: `${ids.length} leads selected` });
  }
  function _showBulkAssignModal(ids) {
    _showToast({ level: 'info', title: 'Bulk Assign', message: `Assigning ${ids.length} leads...` });
  }

  // ============================================================
  // EXPORT
  // ============================================================

  function _exportLeads(ids) {
    const toExport = ids ? _leads.filter(l => ids.includes(l.id)) : _leads;
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

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

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
  // AUTOMATION EVENT LISTENERS
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
    document.getElementById('btn-run-analyzer')?.addEventListener('click', () => {
      const hot = _leads.filter(l => l.hot_deal || (l.deal_score || 0) >= 75);
      if (hot.length > 0) _runAnalyzer(hot[0]);
      else if (_leads.length > 0) _runAnalyzer(_leads[0]);
      else _showToast({ level: 'info', title: '⚡ Analyzer', message: 'No hay leads para analizar' });
    });
    document.getElementById('analyzer-run-btn')?.addEventListener('click', () => {
      if (_analyzerCurrentLead) _runAnalyzer(_analyzerCurrentLead);
    });
    document.getElementById('btn-automate')?.addEventListener('click', () => _showToast({
      level: 'info', title: '🤖 Automation', message: `${Automation.getRules().filter(r=>r.active).length} rules active`
    }));
    document.getElementById('btn-export')?.addEventListener('click', () => _exportLeads());
    document.getElementById('add-lead-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      // Apply defaults so partial saves always work
      if (!data.name || !data.name.trim())
        data.name = 'Vendedor sin nombre';
      if (!data.property_address || !data.property_address.trim())
        data.property_address = 'Dirección pendiente';
      data.city  = data.city  || 'Atlanta';
      data.state = data.state || 'GA';

      const btn = document.getElementById('modal-submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

      try {
        await _addLead(data);
        document.getElementById('add-lead-modal')?.classList.remove('open');
        e.target.reset();
      } catch (err) {
        console.error('[Properties714] Save failed:', err);
        _showToast({ level: 'error', title: 'Error al guardar', message: err.message || 'No se pudo guardar el lead' });
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✓ Guardar Lead'; }
      }
    });

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

// ============================================================
// BOOT — Auth guard + init
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // If P714Auth is available, enforce authentication
  if (window.P714Auth) {
    try {
      const session = await P714Auth.init();
      if (!session) return; // auth.js will redirect to /login/
      P714Auth.injectUserNav();
    } catch (err) {
      console.warn('[Properties714] Auth init error:', err.message);
      // Continue anyway (dev mode without config)
    }
  }

  AcquisitionsApp.init();
  AcquisitionsApp.bindGlobalActions();
});

window.AcquisitionsApp = AcquisitionsApp;
