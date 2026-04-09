/* Donna — AI Assistant for Properties 714 */
(function(){
  if(window.__DONNA__)return;
  window.__DONNA__=true;

  const DONNA_SYSTEM=`Eres Donna, la asistente inteligente de Properties 714 LLC, empresa de adquisiciones inmobiliarias en Atlanta, Georgia.

Tu rol: Ayudar a las adquisicionistas y al equipo con dudas sobre el sistema, análisis de deals, cálculos de MAO, estrategias de inversión, y cualquier pregunta general del negocio.

Conocimiento clave:
- Fórmula MAO: ARV × 70% − Reparaciones = Oferta Máxima
- Estrategias: Fix & Flip (voltear), Rental/Buy & Hold (renta), Wholesale (mayoreo)
- Score de deals: 0-100 (≥70 = Alta Confianza, lista para oferta)
- ARV = After Repair Value (valor de la propiedad después de reparar)
- Mercado objetivo: Atlanta, GA y áreas metropolitanas
- El sistema tiene: Adquisiciones, Deals, Reports, Mensajes, Dashboard con IA

Personalidad: Profesional pero cálida, directa y práctica. Siempre en español. Usa emojis con moderación. Respuestas concisas pero completas.

Preséntate solo en el PRIMER mensaje de cada conversación.`;

  const KEY=()=>window.__P714_CONFIG__?.anthropicKey||'';

  const CSS=`
  .donna-fab{position:fixed;bottom:24px;right:24px;z-index:8000;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);box-shadow:0 4px 20px rgba(13,148,136,0.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
  .donna-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(13,148,136,0.6);}
  .donna-fab-inner{font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff;}
  .donna-fab-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#2563EB;border-radius:50%;border:2px solid #fff;animation:donna-pulse 2s infinite;}
  @keyframes donna-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
  .donna-drawer{position:fixed;bottom:90px;right:24px;z-index:8001;width:360px;max-width:calc(100vw - 32px);background:#fff;border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.06);display:flex;flex-direction:column;overflow:hidden;transition:all .25s ease;transform-origin:bottom right;transform:scale(0.85);opacity:0;pointer-events:none;max-height:520px;}
  .donna-drawer.open{transform:scale(1);opacity:1;pointer-events:all;}
  .donna-hdr{background:linear-gradient(135deg,#0F172A,#1E293B);padding:16px 18px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .donna-av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:14px;color:#fff;flex-shrink:0;box-shadow:0 0 10px rgba(13,148,136,0.5);}
  .donna-hdr-info{flex:1;}
  .donna-name{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#fff;}
  .donna-status{font-size:10px;color:#0D9488;display:flex;align-items:center;gap:4px;margin-top:1px;}
  .donna-status-dot{width:5px;height:5px;border-radius:50%;background:#0D9488;animation:donna-pulse 2s infinite;}
  .donna-close{width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background .15s;}
  .donna-close:hover{background:rgba(255,255,255,0.15);color:#fff;}
  .donna-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#F8FAFC;}
  .donna-msg{display:flex;gap:8px;align-items:flex-start;}
  .donna-msg.user{flex-direction:row-reverse;}
  .donna-msg-av{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}
  .donna-msg-av.ai{background:linear-gradient(135deg,#0D9488,#0F766E);color:#fff;font-family:'Syne',sans-serif;}
  .donna-msg-av.user{background:#EFF6FF;color:#2563EB;}
  .donna-bubble{padding:10px 13px;border-radius:12px;font-size:12px;line-height:1.55;max-width:260px;}
  .donna-bubble.ai{background:#fff;border:1px solid #E2E8F0;color:#0F172A;border-radius:12px 12px 12px 3px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}
  .donna-bubble.user{background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border-radius:12px 12px 3px 12px;}
  .donna-typing{display:flex;gap:4px;align-items:center;padding:10px 13px;}
  .donna-typing span{width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:donna-typing 1.2s infinite;}
  .donna-typing span:nth-child(2){animation-delay:.2s;}
  .donna-typing span:nth-child(3){animation-delay:.4s;}
  @keyframes donna-typing{0%,100%{transform:translateY(0);background:#CBD5E1}50%{transform:translateY(-4px);background:#0D9488}}
  .donna-input-area{padding:12px;border-top:1px solid #E2E8F0;background:#fff;display:flex;gap:8px;flex-shrink:0;}
  .donna-input{flex:1;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:9px 12px;font-size:12px;font-family:'Inter',sans-serif;color:#0F172A;outline:none;resize:none;line-height:1.4;max-height:80px;transition:border-color .15s;}
  .donna-input:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,0.08);}
  .donna-input::placeholder{color:#CBD5E1;}
  .donna-send{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0D9488,#0F766E);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s;flex-shrink:0;align-self:flex-end;}
  .donna-send:hover{transform:scale(1.05);}
  .donna-send:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
  .donna-no-key{padding:14px;background:#FFFBEB;border-radius:8px;font-size:11px;color:#92400E;text-align:center;line-height:1.5;}
  .donna-quick-btns{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px;background:#F8FAFC;}
  .donna-quick-btn{padding:5px 10px;border-radius:99px;background:#fff;border:1px solid #E2E8F0;font-size:11px;color:#475569;cursor:pointer;transition:all .12s;white-space:nowrap;}
  .donna-quick-btn:hover{border-color:#0D9488;color:#0D9488;background:#F0FDFA;}
  @media(max-width:480px){.donna-drawer{width:calc(100vw - 20px);right:10px;bottom:80px;}.donna-fab{bottom:16px;right:16px;}}
  `;

  let _msgs=[],_loading=false,_open=false;

  function initUI(){
    const sty=document.createElement('style');sty.textContent=CSS;document.head.appendChild(sty);

    // FAB button
    const fab=document.createElement('button');fab.className='donna-fab';fab.setAttribute('aria-label','Donna - Asistente IA');
    fab.innerHTML='<div class="donna-fab-inner">D</div><div class="donna-fab-badge"></div>';
    fab.onclick=toggleDrawer;
    document.body.appendChild(fab);

    // Drawer
    const drawer=document.createElement('div');drawer.className='donna-drawer';drawer.id='donna-drawer';
    drawer.innerHTML=`
      <div class="donna-hdr">
        <div class="donna-av">D</div>
        <div class="donna-hdr-info">
          <div class="donna-name">Donna</div>
          <div class="donna-status"><div class="donna-status-dot"></div>Asistente de Properties 714</div>
        </div>
        <button class="donna-close" onclick="window.__DONNA_TOGGLE__()">×</button>
      </div>
      <div class="donna-msgs" id="donna-msgs">
        <div class="donna-msg">
          <div class="donna-msg-av ai">D</div>
          <div class="donna-bubble ai">¡Hola! Soy <strong>Donna</strong>, tu asistente de Properties 714 🏠<br><br>Puedo ayudarte con cálculos de MAO, análisis de deals, dudas sobre el sistema, estrategias de inversión, o cualquier pregunta que tengas.<br><br>¿En qué te ayudo hoy?</div>
        </div>
      </div>
      <div class="donna-quick-btns" id="donna-quick">
        <button class="donna-quick-btn" onclick="donna_send_quick('¿Cómo calculo el MAO?')">📐 Calcular MAO</button>
        <button class="donna-quick-btn" onclick="donna_send_quick('¿Qué estrategia es mejor, flip o rental?')">🏡 Flip vs Rental</button>
        <button class="donna-quick-btn" onclick="donna_send_quick('¿Qué significa el score del deal?')">📊 Score del deal</button>
        <button class="donna-quick-btn" onclick="donna_send_quick('¿Cómo agrego una propiedad?')">➕ Agregar propiedad</button>
      </div>
      <div class="donna-input-area">
        <textarea class="donna-input" id="donna-input" placeholder="Escribe tu pregunta..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();donna_send();}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'"></textarea>
        <button class="donna-send" id="donna-send" onclick="donna_send()">➤</button>
      </div>
    `;
    document.body.appendChild(drawer);

    // Global functions
    window.__DONNA_TOGGLE__=toggleDrawer;
    window.donna_send=sendMsg;
    window.donna_send_quick=function(txt){document.getElementById('donna-input').value=txt;sendMsg();};
  }

  function toggleDrawer(){
    _open=!_open;
    const d=document.getElementById('donna-drawer');
    if(d)d.classList.toggle('open',_open);
    if(_open)setTimeout(()=>{
      const inp=document.getElementById('donna-input');
      if(inp)inp.focus();
    },250);
  }

  async function sendMsg(){
    const inp=document.getElementById('donna-input');
    const txt=(inp?.value||'').trim();
    if(!txt||_loading)return;
    inp.value='';inp.style.height='auto';

    // Hide quick btns after first interaction
    const qb=document.getElementById('donna-quick');
    if(qb)qb.style.display='none';

    appendMsg('user',txt);
    _msgs.push({role:'user',content:txt});
    setLoading(true);

    const key=KEY();
    if(!key){
      appendMsg('ai','⚠️ No hay API key configurada. Pide a Eduardo que agregue la Anthropic API key en <code>js/config.js</code> para activarme.');
      setLoading(false);return;
    }

    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:600,
          system:DONNA_SYSTEM,
          messages:_msgs.slice(-10)
        })
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
      _msgs.push({role:'assistant',content:reply});
      appendMsg('ai',reply);
    }catch(e){
      appendMsg('ai','❌ Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
    setLoading(false);
  }

  function appendMsg(role,txt){
    const cont=document.getElementById('donna-msgs');
    if(!cont)return;
    // Remove typing if exists
    const typ=cont.querySelector('.donna-typing-wrap');
    if(typ)typ.remove();

    const isAI=role==='ai';
    const div=document.createElement('div');
    div.className='donna-msg'+(isAI?'':' user');

    // Simple markdown-ish: bold, line breaks
    const formatted=txt
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\n/g,'<br>')
      .replace(/`([^`]+)`/g,'<code style="background:#F1F5F9;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>');

    div.innerHTML=`<div class="donna-msg-av ${isAI?'ai':'user'}">${isAI?'D':'Tú'}</div><div class="donna-bubble ${isAI?'ai':'user'}">${formatted}</div>`;
    cont.appendChild(div);
    cont.scrollTop=cont.scrollHeight;
  }

  function setLoading(v){
    _loading=v;
    const cont=document.getElementById('donna-msgs');
    const btn=document.getElementById('donna-send');
    if(btn)btn.disabled=v;
    if(!cont)return;
    const existing=cont.querySelector('.donna-typing-wrap');
    if(v&&!existing){
      const d=document.createElement('div');
      d.className='donna-msg donna-typing-wrap';
      d.innerHTML='<div class="donna-msg-av ai">D</div><div class="donna-bubble ai" style="padding:10px 16px"><div class="donna-typing"><span></span><span></span><span></span></div></div>';
      cont.appendChild(d);
      cont.scrollTop=cont.scrollHeight;
    }else if(!v&&existing){existing.remove();}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initUI);
  else initUI();
})();
