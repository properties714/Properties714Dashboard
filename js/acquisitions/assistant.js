/**
 * Properties714 — Acquisitions Module
 * assistant.js — AI integration hooks
 *
 * This module is the bridge layer for future AI integration.
 * All hooks are defined and stubbed now; implementations are
 * plugged in when the AI service is connected.
 *
 * Designed for:
 *   - OpenAI / Anthropic Claude API
 *   - Supabase Edge Functions (serverless AI calls)
 *   - n8n webhook-triggered AI workflows
 */

'use strict';

const Assistant = (() => {

  // ============================================================
  // CONFIGURATION
  // ============================================================

  let _config = {
    enabled:        false,    // Toggle AI features on/off
    provider:       null,     // 'openai' | 'anthropic' | 'custom'
    endpoint:       null,     // API endpoint or Supabase Edge Function URL
    model:          null,     // e.g., 'gpt-4o', 'claude-opus-4-5'
    apiKey:         null,     // Loaded securely at runtime (never hardcoded)
    contextWindow:  4000,     // Max tokens for context
    stream:         false,    // Streaming responses
  };

  // ============================================================
  // SYSTEM PROMPT TEMPLATES
  // ============================================================

  const PROMPTS = {

    DEAL_ANALYZER: (lead) => `
You are MAX, a senior real estate acquisition analyst for Properties714.
Your job: analyze this lead and give a concise, actionable assessment.

LEAD DATA:
${JSON.stringify({
  name:             lead.name,
  property_address: lead.property_address,
  property_type:    lead.property_type,
  condition:        lead.condition,
  occupancy:        lead.occupancy,
  asking_price:     lead.asking_price,
  arv:              lead.arv,
  repairs:          lead.repairs,
  mao:              lead.mao,
  roi:              lead.roi,
  estimated_profit: lead.estimated_profit,
  deal_score:       lead.deal_score,
  motivation_score: lead.motivation_score,
  urgency_level:    lead.urgency_level,
  risk_level:       lead.risk_level,
  status:           lead.status,
  days_in_pipeline: lead.days_in_pipeline,
  source:           lead.source,
}, null, 2)}

Provide:
1. VERDICT: Buy / Pass / Negotiate (one word)
2. REASONING: 2-3 sentences on why
3. KEY RISK: Single biggest risk factor
4. NEXT ACTION: Exact next step to take
5. OFFER RECOMMENDATION: If worth pursuing, suggest offer price

Be direct. No fluff. Think like an experienced investor.
    `.trim(),

    OFFER_GENERATOR: (lead, context = {}) => `
You are a real estate negotiation expert for Properties714.
Generate a professional verbal offer script for this property.

PROPERTY: ${lead.property_address}, ${lead.city}, ${lead.state}
ASKING PRICE: $${(lead.asking_price || 0).toLocaleString()}
OUR MAO: $${(lead.mao || 0).toLocaleString()}
SELLER MOTIVATION: ${lead.motivation_score}/10 (${lead.urgency_level} urgency)
CONDITION: ${lead.condition}
ADDITIONAL CONTEXT: ${context.notes || 'None provided'}

Generate:
1. Opening line to re-establish rapport
2. Transition to offer
3. The offer itself with brief justification
4. Handle likely objection: "That's too low"
5. Closing / next steps

Keep it conversational. Properties714 is a cash buyer that closes fast.
    `.trim(),

    COMPS_ANALYZER: (lead) => `
Analyze ARV for: ${lead.property_address}, ${lead.city} ${lead.state} ${lead.zip}
Property type: ${lead.property_type}
Condition: ${lead.condition}
Seller's stated ARV: $${(lead.arv || 0).toLocaleString()}

Questions to answer:
1. Is the provided ARV reasonable?
2. What ARV range would you expect for this area/type?
3. What repair assumptions should we validate?
4. Any red flags in the numbers?
    `.trim(),

    NEGOTIATION_COACH: (lead, context = {}) => `
You are a real estate negotiation coach.
The seller is ${lead.motivation_score >= 7 ? 'highly motivated' : 'somewhat motivated'} (${lead.motivation_score}/10).
Urgency: ${lead.urgency_level}.

Situation: ${context.situation || 'Standard negotiation'}
Last interaction: ${context.lastNote || 'None provided'}

Give:
1. Negotiation strategy (2-3 sentences)
2. Key leverage points to use
3. Concession script if needed
4. Red lines (what NOT to do)
    `.trim(),

  };

  // ============================================================
  // INTERNAL: Call AI API
  // ============================================================

  async function _callAI(prompt, { systemPrompt = '', stream = false } = {}) {
    if (!_config.enabled) {
      console.warn('[Assistant] AI is not enabled. Call Assistant.configure() first.');
      return { error: 'AI not configured', mock: true };
    }

    if (!_config.endpoint) {
      throw new Error('[Assistant] No endpoint configured.');
    }

    const payload = {
      model:      _config.model,
      max_tokens: 1000,
      messages:   [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
    };

    const response = await fetch(_config.endpoint, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${_config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[Assistant] API error ${response.status}: ${err}`);
    }

    return response.json();
  }

  // ============================================================
  // INTERNAL: Extract text from response
  // ============================================================

  function _extractText(response) {
    // Anthropic format
    if (response.content && Array.isArray(response.content)) {
      return response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n');
    }
    // OpenAI format
    if (response.choices && response.choices[0]) {
      return response.choices[0].message?.content || '';
    }
    return String(response);
  }

  // ============================================================
  // PUBLIC HOOKS
  // ============================================================

  /**
   * Configure the assistant
   */
  function configure(config = {}) {
    _config = { ..._config, ...config };
    console.info('[Assistant] Configured:', {
      provider: _config.provider,
      model:    _config.model,
      enabled:  _config.enabled,
    });
  }

  /**
   * Analyze a deal and return structured insight
   */
  async function analyzeDeal(lead) {
    const prompt = PROMPTS.DEAL_ANALYZER(lead);

    try {
      const raw = await _callAI(prompt);
      const text = _extractText(raw);

      window.dispatchEvent(new CustomEvent('assistant:deal_analyzed', {
        detail: { lead_id: lead.id, result: text },
      }));

      return { success: true, text };
    } catch (err) {
      console.error('[Assistant] analyzeDeal failed:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate offer script
   */
  async function generateOffer(lead, context = {}) {
    const prompt = PROMPTS.OFFER_GENERATOR(lead, context);
    try {
      const raw = await _callAI(prompt);
      return { success: true, text: _extractText(raw) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Analyze comps / ARV
   */
  async function analyzeComps(lead) {
    const prompt = PROMPTS.COMPS_ANALYZER(lead);
    try {
      const raw = await _callAI(prompt);
      return { success: true, text: _extractText(raw) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get negotiation coaching
   */
  async function coachNegotiation(lead, context = {}) {
    const prompt = PROMPTS.NEGOTIATION_COACH(lead, context);
    try {
      const raw = await _callAI(prompt);
      return { success: true, text: _extractText(raw) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Hook: Called when a lead score changes
   * Future: Trigger predictive models
   */
  function onScoreChanged(lead, oldScore, newScore) {
    console.debug(`[Assistant] Score changed: ${oldScore} → ${newScore} for lead ${lead.id}`);
    // Future: trigger ML model re-evaluation
  }

  /**
   * Hook: Called when a lead enters negotiation stage
   * Future: Auto-generate negotiation brief
   */
  function onNegotiationStarted(lead) {
    console.debug(`[Assistant] Negotiation started for lead ${lead.id}`);
    // Future: auto-brief generation
  }

  /**
   * Hook: Called when a new lead is created
   * Future: Auto-pull comps, pre-score, enrich data
   */
  async function onLeadCreated(lead) {
    console.debug(`[Assistant] New lead created: ${lead.id}`);
    // Future: Enrich with PropStream / Attom Data / Zillow APIs
  }

  /**
   * Batch scoring re-evaluation
   * Future: Run all leads through predictive model
   */
  async function batchReevaluate(leads) {
    console.info(`[Assistant] Batch re-evaluate: ${leads.length} leads (not yet implemented)`);
    return leads.map(l => ({ ...l, ai_notes: 'AI analysis pending' }));
  }

  /**
   * Get AI status
   */
  function getStatus() {
    return {
      enabled:   _config.enabled,
      provider:  _config.provider,
      model:     _config.model,
      connected: _config.enabled && !!_config.endpoint,
    };
  }

  /**
   * Get available prompts (for UI display)
   */
  function getPromptTemplates() {
    return Object.keys(PROMPTS);
  }

  // ============================================================
  // PUBLIC API
  // ============================================================

  return {
    configure,
    analyzeDeal,
    generateOffer,
    analyzeComps,
    coachNegotiation,
    onScoreChanged,
    onNegotiationStarted,
    onLeadCreated,
    batchReevaluate,
    getStatus,
    getPromptTemplates,
    PROMPTS, // expose for testing
  };

})();

window.Assistant = Assistant;
