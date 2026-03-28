/**
 * Properties714 — Acquisitions Module
 * automation.js — Internal event-driven automation engine
 *
 * Architecture:
 *   Event Emitter → Rule Evaluator → Action Executor → Logger
 *
 * Future extension points:
 *   - Webhook dispatch (n8n, Zapier, etc.)
 *   - External notification services
 *   - Multi-user routing
 */

'use strict';

const Automation = (() => {

  // ============================================================
  // EVENT REGISTRY
  // ============================================================

  const EVENTS = {
    LEAD_CREATED:         'lead_created',
    LEAD_UPDATED:         'lead_updated',
    STATUS_CHANGED:       'status_changed',
    SCORE_UPDATED:        'score_updated',
    FOLLOWUP_OVERDUE:     'followup_overdue',
    NO_CONTACT_DETECTED:  'no_contact_detected',
    HIGH_SCORE_DETECTED:  'high_score_detected',
    OFFER_SENT:           'offer_sent',
    CONTRACT_SIGNED:      'contract_signed',
    BULK_ACTION:          'bulk_action',
    NOTE_ADDED:           'note_added',
    TASK_COMPLETED:       'task_completed',
  };

  // ============================================================
  // ACTION TYPES
  // ============================================================

  const ACTIONS = {
    FLAG_HOT_DEAL:       'flag_hot_deal',
    UNFLAG_HOT_DEAL:     'unflag_hot_deal',
    ASSIGN_USER:         'assign_user',
    CREATE_TASK:         'create_task',
    SEND_NOTIFICATION:   'send_notification',
    UPDATE_STATUS:       'update_status',
    UPDATE_FIELD:        'update_field',
    LOG_ACTIVITY:        'log_activity',
    WEBHOOK:             'webhook',           // Future: external webhook
    AI_ANALYZE:          'ai_analyze',        // Future: trigger AI analysis
  };

  // ============================================================
  // BUILT-IN RULES
  // ============================================================

  const DEFAULT_RULES = [
    {
      id:      'rule_hot_deal',
      name:    'Auto-Flag Hot Deal',
      active:  true,
      trigger: EVENTS.SCORE_UPDATED,
      conditions: [
        { field: 'deal_score', op: 'gte', value: 80 },
      ],
      actions: [
        { type: ACTIONS.FLAG_HOT_DEAL },
        { type: ACTIONS.SEND_NOTIFICATION, params: {
            title:   '🔥 Hot Deal Detected',
            message: 'Deal score ≥ 80 — {lead_name} at {property_address}',
            level:   'warning',
        }},
        { type: ACTIONS.LOG_ACTIVITY, params: {
            type: 'automation',
            description: 'Auto-flagged as hot deal (score: {deal_score})',
        }},
      ],
    },

    {
      id:      'rule_unset_hot',
      name:    'Remove Hot Flag When Score Drops',
      active:  true,
      trigger: EVENTS.SCORE_UPDATED,
      conditions: [
        { field: 'deal_score', op: 'lt', value: 80 },
        { field: 'hot_deal',   op: 'eq', value: true },
      ],
      actions: [
        { type: ACTIONS.UNFLAG_HOT_DEAL },
      ],
    },

    {
      id:      'rule_overdue_task',
      name:    'Create Task for Overdue Follow-Up',
      active:  true,
      trigger: EVENTS.FOLLOWUP_OVERDUE,
      conditions: [],
      actions: [
        { type: ACTIONS.UPDATE_FIELD, params: { field: 'overdue', value: true }},
        { type: ACTIONS.CREATE_TASK, params: {
            title:    'URGENT: Overdue follow-up — {lead_name}',
            priority: 'High',
        }},
        { type: ACTIONS.SEND_NOTIFICATION, params: {
            title:   '⏰ Overdue Follow-Up',
            message: '{lead_name} — scheduled for {next_followup}',
            level:   'error',
        }},
      ],
    },

    {
      id:      'rule_no_contact',
      name:    'Flag No Contact (7 Days)',
      active:  true,
      trigger: EVENTS.NO_CONTACT_DETECTED,
      conditions: [],
      actions: [
        { type: ACTIONS.UPDATE_FIELD, params: { field: 'no_contact', value: true }},
        { type: ACTIONS.SEND_NOTIFICATION, params: {
            title:   '📵 No Contact Warning',
            message: 'No contact with {lead_name} for 7+ days',
            level:   'warning',
        }},
      ],
    },

    {
      id:      'rule_welcome_new_lead',
      name:    'New Lead — Create Welcome Task',
      active:  true,
      trigger: EVENTS.LEAD_CREATED,
      conditions: [],
      actions: [
        { type: ACTIONS.CREATE_TASK, params: {
            title:    'Initial contact — {lead_name}',
            priority: 'High',
        }},
        { type: ACTIONS.LOG_ACTIVITY, params: {
            type:        'automation',
            description: 'Lead created and initial contact task assigned',
        }},
        { type: ACTIONS.SEND_NOTIFICATION, params: {
            title:   '➕ New Lead Added',
            message: '{lead_name} — {source}',
            level:   'success',
        }},
      ],
    },

    {
      id:      'rule_contract_alert',
      name:    'Under Contract — Alert Team',
      active:  true,
      trigger: EVENTS.STATUS_CHANGED,
      conditions: [
        { field: 'status', op: 'eq', value: 'Under Contract' },
      ],
      actions: [
        { type: ACTIONS.SEND_NOTIFICATION, params: {
            title:   '🎉 Under Contract!',
            message: '{lead_name} — {property_address} is under contract',
            level:   'success',
        }},
        { type: ACTIONS.LOG_ACTIVITY, params: {
            type:        'status_change',
            description: 'Status changed to Under Contract',
        }},
      ],
    },
  ];

  // ============================================================
  // INTERNAL STATE
  // ============================================================

  let _rules = [...DEFAULT_RULES];
  let _listeners = {};   // event → [callbacks]
  let _actionLog = [];   // execution log
  let _leadStore = null; // reference to the live lead store
  let _toastFn  = null;  // pluggable notification function

  // ============================================================
  // CONDITION EVALUATOR
  // ============================================================

  function _evalCondition(condition, lead) {
    const val = lead[condition.field];
    const target = condition.value;

    switch (condition.op) {
      case 'eq':      return val == target;
      case 'neq':     return val != target;
      case 'gt':      return Number(val) >  Number(target);
      case 'gte':     return Number(val) >= Number(target);
      case 'lt':      return Number(val) <  Number(target);
      case 'lte':     return Number(val) <= Number(target);
      case 'contains':return String(val).toLowerCase().includes(String(target).toLowerCase());
      case 'in':      return Array.isArray(target) && target.includes(val);
      case 'past_due': {
        if (!val) return false;
        return new Date(val) < new Date();
      }
      case 'days_ago_gte': {
        if (!val) return false;
        const diffDays = (Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= Number(target);
      }
      default:
        console.warn(`[Automation] Unknown operator: ${condition.op}`);
        return false;
    }
  }

  function _allConditionsMet(conditions, lead) {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => _evalCondition(c, lead));
  }

  // ============================================================
  // TEMPLATE INTERPOLATION
  // ============================================================

  function _interpolate(template, lead) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const val = lead[key];
      if (val === undefined || val === null) return `[${key}]`;
      // Format currency fields
      if (['asking_price','arv','repairs','mao','estimated_profit'].includes(key)) {
        return Scoring.Financial.formatCurrency(val);
      }
      // Format dates
      if (['next_followup','last_contact'].includes(key) && val) {
        return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return val;
    });
  }

  // ============================================================
  // ACTION EXECUTOR
  // ============================================================

  async function _executeAction(action, lead, rule) {
    const p = action.params || {};

    switch (action.type) {

      case ACTIONS.FLAG_HOT_DEAL:
        lead.hot_deal = true;
        _updateLeadInStore(lead);
        break;

      case ACTIONS.UNFLAG_HOT_DEAL:
        lead.hot_deal = false;
        _updateLeadInStore(lead);
        break;

      case ACTIONS.UPDATE_FIELD:
        if (p.field) {
          lead[p.field] = p.value;
          _updateLeadInStore(lead);
        }
        break;

      case ACTIONS.UPDATE_STATUS:
        if (p.status) {
          lead.status = p.status;
          _updateLeadInStore(lead);
          emit(EVENTS.STATUS_CHANGED, lead);
        }
        break;

      case ACTIONS.SEND_NOTIFICATION:
        if (_toastFn) {
          _toastFn({
            level:   p.level || 'info',
            title:   _interpolate(p.title, lead),
            message: _interpolate(p.message, lead),
          });
        }
        break;

      case ACTIONS.CREATE_TASK:
        // Dispatch to UI layer to create task
        _dispatchUIEvent('automation:create_task', {
          lead_id:  lead.id,
          title:    _interpolate(p.title, lead),
          priority: p.priority || 'Normal',
          due_date: p.due_date || null,
        });
        break;

      case ACTIONS.LOG_ACTIVITY:
        _dispatchUIEvent('automation:log_activity', {
          lead_id:     lead.id,
          type:        p.type || 'automation',
          description: _interpolate(p.description, lead),
        });
        break;

      case ACTIONS.ASSIGN_USER:
        if (p.user_id) {
          lead.assigned_to = p.user_id;
          _updateLeadInStore(lead);
        }
        break;

      case ACTIONS.WEBHOOK:
        // Future: POST to external endpoint (n8n, Zapier, etc.)
        console.info(`[Automation] Webhook: ${p.url}`, { lead_id: lead.id });
        break;

      case ACTIONS.AI_ANALYZE:
        // Future: Trigger AI analysis via assistant.js
        _dispatchUIEvent('automation:ai_analyze', { lead_id: lead.id });
        break;

      default:
        console.warn(`[Automation] Unknown action: ${action.type}`);
    }
  }

  // ============================================================
  // RULE EVALUATOR
  // ============================================================

  async function _evaluateRules(eventName, lead) {
    const matchingRules = _rules.filter(rule =>
      rule.active &&
      rule.trigger === eventName &&
      _allConditionsMet(rule.conditions, lead)
    );

    for (const rule of matchingRules) {
      const actionsTaken = [];

      for (const action of rule.actions) {
        try {
          await _executeAction(action, lead, rule);
          actionsTaken.push({ type: action.type, status: 'success' });
        } catch (err) {
          console.error(`[Automation] Action failed: ${action.type}`, err);
          actionsTaken.push({ type: action.type, status: 'error', error: err.message });
        }
      }

      // Log execution
      _actionLog.push({
        rule_id:      rule.id,
        rule_name:    rule.name,
        lead_id:      lead.id,
        trigger:      eventName,
        actions_taken: actionsTaken,
        timestamp:    new Date().toISOString(),
        status:       actionsTaken.every(a => a.status === 'success') ? 'success' : 'partial',
      });
    }

    return matchingRules.length;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function _updateLeadInStore(lead) {
    if (_leadStore) {
      _leadStore.update(lead);
    }
  }

  function _dispatchUIEvent(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  // ============================================================
  // SCHEDULED CHECKS (runs on interval)
  // ============================================================

  function _runScheduledChecks(leads) {
    const now = new Date();

    leads.forEach(lead => {
      if (lead.status === 'Dead') return;

      // Check overdue follow-ups
      if (lead.next_followup && !lead.overdue) {
        const followupDate = new Date(lead.next_followup);
        if (followupDate < now) {
          emit(EVENTS.FOLLOWUP_OVERDUE, lead);
        }
      }

      // Check no-contact (7 days)
      if (!lead.no_contact) {
        const lastContact = lead.last_contact ? new Date(lead.last_contact) : new Date(lead.created_at);
        const daysSince = (now - lastContact) / (1000 * 60 * 60 * 24);
        if (daysSince >= 7) {
          emit(EVENTS.NO_CONTACT_DETECTED, lead);
        }
      }
    });
  }

  // ============================================================
  // PUBLIC: Event Emitter
  // ============================================================

  function on(eventName, callback) {
    if (!_listeners[eventName]) _listeners[eventName] = [];
    _listeners[eventName].push(callback);
    return () => off(eventName, callback); // returns unsubscribe
  }

  function off(eventName, callback) {
    if (!_listeners[eventName]) return;
    _listeners[eventName] = _listeners[eventName].filter(cb => cb !== callback);
  }

  async function emit(eventName, lead, context = {}) {
    // Run automation rules
    await _evaluateRules(eventName, lead);

    // Notify manual listeners
    if (_listeners[eventName]) {
      _listeners[eventName].forEach(cb => {
        try { cb(lead, context); }
        catch (e) { console.error(`[Automation] Listener error:`, e); }
      });
    }
  }

  // ============================================================
  // PUBLIC: Initialize
  // ============================================================

  function init({ leadStore, toastFn, customRules = [] } = {}) {
    _leadStore = leadStore || null;
    _toastFn   = toastFn  || null;

    // Merge custom rules
    if (customRules.length > 0) {
      _rules = [...DEFAULT_RULES, ...customRules];
    }

    console.info('[Automation] Engine initialized.', {
      rules: _rules.filter(r => r.active).length,
    });
  }

  // ============================================================
  // PUBLIC: Rule management
  // ============================================================

  function addRule(rule) {
    if (!rule.id) rule.id = `rule_${Date.now()}`;
    _rules.push(rule);
    return rule.id;
  }

  function removeRule(ruleId) {
    _rules = _rules.filter(r => r.id !== ruleId);
  }

  function toggleRule(ruleId, active) {
    const rule = _rules.find(r => r.id === ruleId);
    if (rule) rule.active = active;
  }

  function getRules()   { return [..._rules]; }
  function getLog()     { return [..._actionLog]; }
  function clearLog()   { _actionLog = []; }

  // ============================================================
  // PUBLIC: Run scheduled checks against live lead array
  // ============================================================

  function runChecks(leads) {
    _runScheduledChecks(leads);
  }

  // ============================================================
  // PUBLIC: Convenience emitters
  // ============================================================

  function onLeadCreated(lead)        { return emit(EVENTS.LEAD_CREATED, lead); }
  function onLeadUpdated(lead)        { return emit(EVENTS.LEAD_UPDATED, lead); }
  function onStatusChanged(lead)      { return emit(EVENTS.STATUS_CHANGED, lead); }
  function onScoreUpdated(lead)       { return emit(EVENTS.SCORE_UPDATED, lead); }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    EVENTS,
    ACTIONS,
    init,
    on,
    off,
    emit,
    addRule,
    removeRule,
    toggleRule,
    getRules,
    getLog,
    clearLog,
    runChecks,
    onLeadCreated,
    onLeadUpdated,
    onStatusChanged,
    onScoreUpdated,
  };

})();

window.Automation = Automation;
