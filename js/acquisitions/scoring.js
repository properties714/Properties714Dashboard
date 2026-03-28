/**
 * Properties714 — Acquisitions Module
 * scoring.js — Deal scoring engine
 *
 * Returns a 0–100 deal score based on multiple weighted factors.
 * Designed to be extended with ML predictions later.
 */

'use strict';

const Scoring = (() => {

  // ============================================================
  // WEIGHTS (must sum to 1.0)
  // ============================================================

  const WEIGHTS = {
    equity:       0.30,   // Equity percentage (ARV vs asking)
    motivation:   0.25,   // Seller motivation score
    condition:    0.15,   // Property condition
    urgency:      0.15,   // Urgency level
    pipeline_age: 0.10,   // Freshness (penalizes stale leads)
    risk:         0.05,   // Risk level (inverse)
  };

  // ============================================================
  // CONDITION SCORES
  // ============================================================

  const CONDITION_SCORES = {
    'Excellent':  100,
    'Good':        80,
    'Fair':        55,
    'Distressed':  35,
    'Tear-Down':   15,
  };

  // ============================================================
  // URGENCY SCORES
  // ============================================================

  const URGENCY_SCORES = {
    'Critical': 100,
    'High':      80,
    'Medium':    50,
    'Low':       20,
  };

  // ============================================================
  // RISK SCORES (lower risk = higher score)
  // ============================================================

  const RISK_SCORES = {
    'Low':    100,
    'Medium':  55,
    'High':    10,
  };

  // ============================================================
  // CORE: Calculate equity score (0–100)
  // ============================================================

  function _equityScore(arv, asking_price) {
    if (!arv || !asking_price || arv === 0) return 0;

    const equity_pct = ((arv - asking_price) / arv) * 100;

    // Scoring curve:
    // > 40% equity = 100
    // 30-40%       = 80–100
    // 20-30%       = 55–80
    // 10-20%       = 25–55
    // < 10%        = 0–25

    if (equity_pct >= 40) return 100;
    if (equity_pct >= 30) return 80 + ((equity_pct - 30) / 10) * 20;
    if (equity_pct >= 20) return 55 + ((equity_pct - 20) / 10) * 25;
    if (equity_pct >= 10) return 25 + ((equity_pct - 10) / 10) * 30;
    if (equity_pct >= 0)  return (equity_pct / 10) * 25;
    return 0; // upside-down / overpriced
  }

  // ============================================================
  // CORE: Calculate motivation score (0–100)
  // ============================================================

  function _motivationScore(raw_score) {
    // raw_score is 0–10, scale to 0–100
    const s = Math.max(0, Math.min(10, raw_score || 0));
    return s * 10;
  }

  // ============================================================
  // CORE: Pipeline age penalty (0–100, decays over time)
  // ============================================================

  function _pipelineAgeScore(days_in_pipeline, status) {
    // Dead leads don't benefit from freshness
    if (status === 'Dead') return 0;

    // Under Contract = always fresh = 100
    if (status === 'Under Contract') return 100;

    // Lead is stale after 45 days (linear decay)
    const freshness = Math.max(0, 1 - (days_in_pipeline / 45));
    return freshness * 100;
  }

  // ============================================================
  // PUBLIC: Calculate full deal score
  // ============================================================

  function calculate(lead) {
    const scores = {
      equity:       _equityScore(lead.arv, lead.asking_price),
      motivation:   _motivationScore(lead.motivation_score),
      condition:    CONDITION_SCORES[lead.condition]    ?? 50,
      urgency:      URGENCY_SCORES[lead.urgency_level]  ?? 30,
      pipeline_age: _pipelineAgeScore(lead.days_in_pipeline, lead.status),
      risk:         RISK_SCORES[lead.risk_level]        ?? 55,
    };

    // Weighted sum
    let total = 0;
    for (const [factor, weight] of Object.entries(WEIGHTS)) {
      total += (scores[factor] || 0) * weight;
    }

    // Round to integer 0–100
    return Math.round(Math.max(0, Math.min(100, total)));
  }

  // ============================================================
  // PUBLIC: Get score tier info
  // ============================================================

  function getTier(score) {
    if (score >= 80) return { tier: 'HOT',    label: 'Hot Deal',    color: 'var(--accent)', cssClass: 'score-fill-hot',    barColor: 'var(--accent)' };
    if (score >= 60) return { tier: 'WARM',   label: 'Warm Lead',   color: 'var(--hot)',    cssClass: 'score-fill-warm',   barColor: 'var(--hot)' };
    if (score >= 40) return { tier: 'MEDIUM', label: 'Medium Lead', color: 'var(--info)',   cssClass: 'score-fill-medium', barColor: 'var(--info)' };
    return                  { tier: 'COLD',   label: 'Cold Lead',   color: 'var(--danger)', cssClass: 'score-fill-cold',   barColor: 'var(--danger)' };
  }

  // ============================================================
  // PUBLIC: Get suggested action based on score + status
  // ============================================================

  function getSuggestedAction(lead) {
    const score = lead.deal_score ?? calculate(lead);

    if (lead.status === 'Dead')              return 'Ignore';
    if (lead.status === 'Under Contract')    return 'Escalate';
    if (lead.status === 'Offer Sent')        return 'Follow-Up';
    if (lead.status === 'Negotiation')       return 'Negotiate';

    if (score >= 80) return 'Send Offer';
    if (score >= 60) return 'Call';
    if (score >= 40) return 'Follow-Up';
    return 'Call';
  }

  // ============================================================
  // PUBLIC: Batch-recalculate scores for an array of leads
  // ============================================================

  function recalculateAll(leads) {
    return leads.map(lead => ({
      ...lead,
      deal_score:       calculate(lead),
      suggested_action: getSuggestedAction(lead),
    }));
  }

  // ============================================================
  // PUBLIC: Score breakdown (for sidebar display)
  // ============================================================

  function getBreakdown(lead) {
    return {
      equity: {
        label: 'Equity',
        score: Math.round(_equityScore(lead.arv, lead.asking_price)),
        weight: WEIGHTS.equity,
        detail: lead.arv && lead.asking_price
          ? `${Math.round(((lead.arv - lead.asking_price) / lead.arv) * 100)}% equity`
          : 'N/A',
      },
      motivation: {
        label: 'Motivation',
        score: Math.round(_motivationScore(lead.motivation_score)),
        weight: WEIGHTS.motivation,
        detail: `${lead.motivation_score ?? 0}/10`,
      },
      condition: {
        label: 'Condition',
        score: CONDITION_SCORES[lead.condition] ?? 50,
        weight: WEIGHTS.condition,
        detail: lead.condition ?? 'Unknown',
      },
      urgency: {
        label: 'Urgency',
        score: URGENCY_SCORES[lead.urgency_level] ?? 30,
        weight: WEIGHTS.urgency,
        detail: lead.urgency_level ?? 'Low',
      },
      freshness: {
        label: 'Freshness',
        score: Math.round(_pipelineAgeScore(lead.days_in_pipeline, lead.status)),
        weight: WEIGHTS.pipeline_age,
        detail: `${lead.days_in_pipeline ?? 0} days`,
      },
      risk: {
        label: 'Risk (inv.)',
        score: RISK_SCORES[lead.risk_level] ?? 55,
        weight: WEIGHTS.risk,
        detail: lead.risk_level ?? 'Medium',
      },
    };
  }

  // ============================================================
  // PUBLIC: MAO + ROI calculations
  // ============================================================

  const Financial = {
    /**
     * Maximum Allowable Offer
     * MAO = (ARV * 0.70) - Repairs
     */
    calculateMAO(arv, repairs) {
      const a = Number(arv) || 0;
      const r = Number(repairs) || 0;
      return Math.max(0, Math.round((a * 0.70) - r));
    },

    /**
     * Estimated Profit
     * Profit = MAO - Actual Buying Price (asking as proxy) - Repairs
     */
    calculateProfit(arv, asking_price, repairs) {
      const a = Number(arv) || 0;
      const p = Number(asking_price) || 0;
      const r = Number(repairs) || 0;
      const mao = this.calculateMAO(a, r);
      return Math.max(0, mao - p);
    },

    /**
     * ROI %
     * ROI = (Profit / Total Investment) * 100
     * Total Investment = Purchase Price + Repairs
     */
    calculateROI(arv, asking_price, repairs) {
      const p = Number(asking_price) || 0;
      const r = Number(repairs) || 0;
      const profit = this.calculateProfit(arv, p, r);
      const totalInvestment = p + r;
      if (totalInvestment === 0) return 0;
      return Math.round((profit / totalInvestment) * 1000) / 10; // 1 decimal
    },

    /**
     * Equity %
     */
    calculateEquityPct(arv, asking_price) {
      const a = Number(arv) || 0;
      const p = Number(asking_price) || 0;
      if (a === 0) return 0;
      return Math.round(((a - p) / a) * 1000) / 10;
    },

    /**
     * Format currency (USD)
     */
    formatCurrency(value, compact = false) {
      const n = Number(value) || 0;
      if (compact) {
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);
    },

    /**
     * Format percentage
     */
    formatPct(value, decimals = 1) {
      return `${(Number(value) || 0).toFixed(decimals)}%`;
    },
  };

  // Public API
  return {
    calculate,
    getTier,
    getSuggestedAction,
    recalculateAll,
    getBreakdown,
    Financial,
    WEIGHTS,
  };

})();

// Make available globally
window.Scoring = Scoring;
