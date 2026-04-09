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
- Para agregar una propiedad: ir a Adquisiciones → + Nueva Propiedad
- El MAO se calcula automáticamente al ingresar ARV y costo de reparaciones

Personalidad: Profesional pero cálida, directa y práctica. Siempre en español. Usa emojis con moderación. Respuestas concisas pero completas.

Preséntate solo en el PRIMER mensaje de cada conversación.`;

  const KEY=()=>window.__P714_CONFIG__?.anthropicKey||'';

  const CSS=`
  .donna-fab{position:fixed;bottom:24px;right:24px;z-index:8000;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);box-shadow:0 4px 20px rgba(13,148,136,0.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:'Syne',sans-serif;}
  .donna-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(13,148,136,0.6);}
  .donna-fab-inner{font-weight:800;font-size:19px;color:#fff;line-height:1;}
  .donna-fab-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;background:#2563EB;border-radius:50%;border:2px solid #fff;animation:d-pulse 2s infinite;}
  @keyframes d-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
  .donna-drawer{position:fixed;bottom:90px;right:24px;z-index:8001;width:360px;max-width:calc(100vw - 32px);background:#fff;border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,0.16),0 0 0 1px rgba(0,0,0,0.06);display:flex;flex-direction:column;overflow:hidden;transition:transform .25s ease,opacity .25s ease;transform-origin:bottom right;transform:scale(0.85);opacity:0;pointer-events:none;max-height:520px;}
  .donna-drawer.open{transform:scale(1);opacity:1;pointer-events:all;}
  .donna-hdr{background:linear-gradient(135deg,#0F172A,#1E293B);padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
  .donna-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:#fff;flex-shrink:0;box-shadow:0 0 10px rgba(13,148,136,0.5);}
  .donna-hdr-info{flex:1;}
  .donna-name{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#fff;}
  .donna-status{font-size:10px;color:#0D9488;display:flex;align-items:center;gap:4px;margin-top:1px;}
  .donna-status-dot{width:5px;height:5px;border-radius:50%;background:#0D9488;animation:d-pulse 2s infinite;}
  .donna-close-btn{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background .15s;}
  .donna-close-btn:hover{background:rgba(255,255,255,0.15);color:#fff;}
  .donna-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#F8FAFC;}
  .d-msg{display:flex;gap:8px;align-items:flex-start;}
  .d-msg.d-user{flex-direction:row-reverse;}
  .d-av{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
  .d-av.ai{background:linear-gradient(135deg,#0D9488,#0F766E);color:#fff;font-family:'Syne',sans-serif;}
  .d-av.user{background:#EFF6FF;color:#2563EB;}
  .d-bubble{padding:10px 13px;border-radius:12px;font-size:12px;line-height:1.55;max-width:265px;}
  .d-bubble.ai{background:#fff;border:1px solid #E2E8F0;color:#0F172A;border-radius:12px 12px 12px 3px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}
  .d-bubble.user{background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border-radius:12px 12px 3px 12px;}
  .d-typing{display:flex;gap:4px;align-items:center;}
  .d-typing span{width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:d-bounce 1.2s infinite;}
  .d-typing span:nth-child(2){animation-delay:.2s;}
  .d-typing span:nth-child(3){animation-delay:.4s;}
  @keyframes d-bounce{0%,100%{transform:translateY(0);background:#CBD5E1}50%{transform:translateY(-4px);background:#0D9488}}
  .donna-quick-wrap{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:6px;background:#F8FAFC;}
  .d-qbtn{padding:5px 10px;border-radius:99px;background:#fff;border:1px solid #E2E8F0;font-size:11px;color:#475569;cursor:pointer;transition:all .12s;white-space:nowrap;font-family:'Inter',sans-serif;}
  .d-qbtn:hover{border-color:#0D9488;color:#0D9488;background:#F0FDFA;}
  .donna-input-wrap{padding:12px;border-top:1px solid #E2E8F0;background:#fff;display:flex;gap:8px;flex-shrink:0;}
  .donna-inp{flex:1;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:9px 12px;font-size:12px;font-family:'Inter',sans-serif;color:#0F172A;outline:none;resize:none;line-height:1.4;max-height:80px;transition:border-color .15s,box-shadow .15s;}
  .donna-inp:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,0.08);background:#fff;}
  .donna-inp::placeholder{color:#CBD5E1;}
  .donna-send-btn{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0D9488,#0F766E);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s;flex-shrink:0;align-self:flex-end;}
  .donna-send-btn:hover{transform:scale(1.06);}
  .donna-send-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
  @media(max-width:480px){.donna-drawer{width:calc(100vw - 20px);right:10px;bottom:80px;}.donna-fab{bottom:16px;right:16px;}}
  `;

  let _msgs=[],_loading=false,_open=false;

  /* ─── INJECT MESSAGES LINK INTO SIDEBAR ─── */
  function injectMessagesNav(){
    // Find settings link in sidebar
    const allAnchors=[...document.querySelectorAll('a')];
    const settingsLink=allAnchors.find(a=>a.getAttribute('href')==='/settings/');
    if(!settingsLink)return;
    // Don't add if already exists
    if(document.querySelector('a[href="/messages/"]'))return;
    const isActive=location.pathname.startsWith('/messages/');
    const link=document.createElement('a');
    link.href='/messages/';
    link.className=settingsLink.className.replace(' on','')+(isActive?' on':'');
    link.style.cssText=settingsLink.style.cssText||'';
    // Match sidebar link style
    link.innerHTML='<span style="width:16px;text-align:center;flex-shrink:0">📨</span>Mensajes';
    if(isActive){
      link.style.background='rgba(37,99,235,0.22)';
      link.style.color='#93C5FD';
      link.style.fontWeight='600';
    }
    settingsLink.parentNode.insertBefore(link,settingsLink);
  }

  /* ─── UI ─── */
  function initUI(){
    const sty=document.createElement('style');sty.textContent=CSS;document.head.appendChild(sty);
    injectMessagesNav();

    // FAB
    const fab=document.createElement('button');
    fab.className='donna-fab';
    fab.setAttribute('aria-label','Donna - Asistente IA');
    fab.innerHTML='<span class="donna-fab-inner">D</span><div class="donna-fab-badge"></div>';
    fab.onclick=toggleDrawer;
    document.body.appendChild(fab);

    // Drawer
    const drawer=document.createElement('div');
    drawer.className='donna-drawer';
    drawer.id='donna-drawer';
    drawer.innerHTML=`
      <div class="donna-hdr">
        <div class="donna-av">D</div>
        <div class="donna-hdr-info">
          <div class="donna-name">Donna</div>
          <div class="donna-status"><div class="donna-status-dot"></div>Asistente de Properties 714</div>
        </div>
        <button class="donna-close-btn" onclick="window.__DONNA_CLOSE__()">×</button>
      </div>
      <div class="donna-msgs" id="d-msgs">
        <div class="d-msg">
          <div class="d-av ai">D</div>
          <div class="d-bubble ai">¡Hola! Soy <strong>Donna</strong> 🏠<br><br>Estoy aquí para ayudarte con cualquier duda sobre deals, MAO, estrategias, o el sistema.<br><br>¿En qué te puedo ayudar?</div>
        </div>
      </div>
      <div class="donna-quick-wrap" id="d-quick">
        <button class="d-qbtn" onclick="donna_quick('¿Cómo calculo el MAO?')">📐 MAO</button>
        <button class="d-qbtn" onclick="donna_quick('¿Qué es el ARV?')">🏡 ARV</button>
        <button class="d-qbtn" onclick="donna_quick('¿Qué significa el score del deal?')">📊 Score</button>
        <button class="d-qbtn" onclick="donna_quick('¿Cuál es la diferencia entre flip, rental y wholesale?')">💡 Estrategias</button>
      </div>
      <div class="donna-input-wrap">
        <textarea class="donna-inp" id="d-inp" placeholder="Escribe tu pregunta..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window.__DONNA_SEND__();}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,80)+'px'"></textarea>
        <button class="donna-send-btn" id="d-send" onclick="window.__DONNA_SEND__()">➤</button>
      </div>
    `;
    document.body.appendChild(drawer);

    window.__DONNA_TOGGLE__=toggleDrawer;
    window.__DONNA_CLOSE__=()=>{_open=false;drawer.classList.remove('open');};
    window.__DONNA_SEND__=sendMsg;
    window.donna_quick=function(txt){
      const inp=document.getElementById('d-inp');
      if(inp){inp.value=txt;sendMsg();}
    };
  }

  function toggleDrawer(){
    _open=!_open;
    const d=document.getElementById('donna-drawer');
    if(d)d.classList.toggle('open',_open);
    if(_open)setTimeout(()=>document.getElementById('d-inp')?.focus(),260);
  }

  async function sendMsg(){
    const inp=document.getElementById('d-inp');
    const txt=(inp?.value||'').trim();
    if(!txt||_loading)return;
    inp.value='';inp.style.height='auto';
    // Hide quick buttons
    const qw=document.getElementById('d-quick');
    if(qw)qw.style.display='none';

    addMsg('user',txt);
    _msgs.push({role:'user',content:txt});
    setLoading(true);

    const key=KEY();
    if(!key){
      addMsg('ai','⚠️ La API key de Anthropic no está configurada. Pídele a Eduardo que la agregue en <code>js/config.js</code> para activarme completamente.');
      setLoading(false);
      return;
    }

    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':key,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({
          model:'claude-sonnet-4-6',
          max_tokens:600,
          system:DONNA_SYSTEM,
          messages:_msgs.slice(-12)
        })
      });
      if(!res.ok){
        const err=await res.json().catch(()=>({error:{message:'Error '+res.status}}));
        const msg=err?.error?.message||`Error HTTP ${res.status}`;
        addMsg('ai','❌ '+msg);
        _msgs.pop();
        setLoading(false);
        return;
      }
      const data=await res.json();
      const reply=data?.content?.[0]?.text;
      if(reply){
        _msgs.push({role:'assistant',content:reply});
        addMsg('ai',reply);
      }else{
        addMsg('ai','No recibí una respuesta válida. Por favor intenta de nuevo.');
        _msgs.pop();
      }
    }catch(e){
      addMsg('ai','❌ Error de red: '+e.message+'. Verifica tu conexión a internet.');
      _msgs.pop();
    }
    setLoading(false);
  }

  function addMsg(role,txt){
    const cont=document.getElementById('d-msgs');
    if(!cont)return;
    cont.querySelector('.d-typing-wrap')?.remove();
    const isAI=role==='ai';
    const wrap=document.createElement('div');
    wrap.className='d-msg'+(isAI?'':' d-user');
    const formatted=txt
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/`([^`]+)`/g,'<code style="background:#F1F5F9;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>')
      .replace(/\n/g,'<br>');
    wrap.innerHTML=`<div class="d-av ${isAI?'ai':'user'}">${isAI?'D':'Tú'}</div><div class="d-bubble ${isAI?'ai':'user'}">${formatted}</div>`;
    cont.appendChild(wrap);
    cont.scrollTop=cont.scrollHeight;
  }

  function setLoading(v){
    _loading=v;
    const btn=document.getElementById('d-send');
    if(btn)btn.disabled=v;
    const cont=document.getElementById('d-msgs');
    if(!cont)return;
    if(v){
      const w=document.createElement('div');
      w.className='d-msg d-typing-wrap';
      w.innerHTML='<div class="d-av ai">D</div><div class="d-bubble ai" style="padding:10px 14px"><div class="d-typing"><span></span><span></span><span></span></div></div>';
      cont.appendChild(w);
      cont.scrollTop=cont.scrollHeight;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initUI);
  else initUI();
})();
