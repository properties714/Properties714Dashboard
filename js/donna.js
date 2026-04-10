/* Donna v3 — AI Assistant Properties 714 */
(function(){
  if(window.__DONNA_LOADED__)return;
  window.__DONNA_LOADED__=true;

  var SYSTEM='Eres Donna, asistente inteligente de Properties 714 LLC, empresa de adquisiciones inmobiliarias en Atlanta, Georgia.\n\nAyuda al equipo con: dudas del sistema, cálculos de MAO, análisis de deals, estrategias de inversión, y cualquier pregunta del negocio.\n\nConocimiento clave:\n- MAO = ARV × 70% − Reparaciones\n- Estrategias: Fix & Flip, Rental/Buy & Hold, Wholesale\n- Score: 0-100 (≥70 = Alta Confianza → lista para oferta)\n- ARV = valor después de reparar\n- Mercado: Atlanta GA y alrededores\n- Sistema: Dashboard, Adquisiciones, Deals, Mensajes, Reports, Settings\n\nPersonalidad: profesional, cálida, directa. Siempre en español. Emojis con moderación.';

  var CSS=[
    '.d-fab{position:fixed;bottom:22px;right:22px;z-index:9000;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);box-shadow:0 4px 18px rgba(13,148,136,.55);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}',
    '.d-fab:hover{transform:scale(1.1);box-shadow:0 6px 26px rgba(13,148,136,.65);}',
    '.d-fab-lbl{font-family:Syne,sans-serif;font-weight:800;font-size:20px;color:#fff;line-height:1;pointer-events:none;}',
    '.d-badge{position:absolute;top:-1px;right:-1px;width:13px;height:13px;background:#2563EB;border-radius:50%;border:2px solid #fff;}',
    '.d-win{position:fixed;bottom:86px;right:22px;z-index:9001;width:355px;max-width:calc(100vw - 28px);background:#fff;border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);display:flex;flex-direction:column;overflow:hidden;max-height:510px;opacity:0;transform:scale(.88) translateY(10px);transform-origin:bottom right;pointer-events:none;transition:opacity .22s,transform .22s;}',
    '.d-win.show{opacity:1;transform:scale(1) translateY(0);pointer-events:all;}',
    '.d-hdr{background:linear-gradient(135deg,#0F172A,#1E293B);padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.d-hdr-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0D9488,#0F766E);display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-weight:800;font-size:14px;color:#fff;flex-shrink:0;box-shadow:0 0 10px rgba(13,148,136,.5);}',
    '.d-hdr-info{flex:1;}.d-hdr-name{font-family:Syne,sans-serif;font-weight:700;font-size:14px;color:#fff;}',
    '.d-hdr-st{font-size:10px;color:#0D9488;display:flex;align-items:center;gap:4px;margin-top:1px;}',
    '.d-hdr-dot{width:5px;height:5px;border-radius:50%;background:#0D9488;animation:d-p 2s infinite;}',
    '@keyframes d-p{0%,100%{opacity:1}50%{opacity:.3}}',
    '.d-x{width:26px;height:26px;background:rgba(255,255,255,.1);border:none;border-radius:8px;color:rgba(255,255,255,.7);cursor:pointer;font-size:17px;display:flex;align-items:center;justify-content:center;transition:background .15s;}',
    '.d-x:hover{background:rgba(255,255,255,.2);color:#fff;}',
    '.d-body{flex:1;overflow-y:auto;padding:13px;display:flex;flex-direction:column;gap:9px;background:#F8FAFC;}',
    '.d-row{display:flex;gap:7px;align-items:flex-end;}',
    '.d-row.me{flex-direction:row-reverse;}',
    '.d-av{width:25px;height:25px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}',
    '.d-av.ai{background:linear-gradient(135deg,#0D9488,#0F766E);color:#fff;font-family:Syne,sans-serif;}',
    '.d-av.me{background:#EFF6FF;color:#2563EB;}',
    '.d-bub{padding:9px 12px;border-radius:12px;font-size:12px;line-height:1.55;max-width:262px;word-break:break-word;}',
    '.d-bub.ai{background:#fff;border:1px solid #E2E8F0;color:#0F172A;border-bottom-left-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.06);}',
    '.d-bub.me{background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border-bottom-right-radius:3px;}',
    '.d-dots{display:flex;gap:4px;padding:4px 2px;align-items:center;}',
    '.d-dots span{width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:d-b 1.2s infinite;}',
    '.d-dots span:nth-child(2){animation-delay:.2s;}.d-dots span:nth-child(3){animation-delay:.4s;}',
    '@keyframes d-b{0%,100%{transform:translateY(0);background:#CBD5E1}50%{transform:translateY(-4px);background:#0D9488}}',
    '.d-qs{padding:0 13px 10px;display:flex;flex-wrap:wrap;gap:5px;background:#F8FAFC;}',
    '.d-q{padding:4px 10px;border-radius:99px;background:#fff;border:1px solid #E2E8F0;font-size:11px;color:#475569;cursor:pointer;font-family:Inter,sans-serif;transition:all .12s;white-space:nowrap;}',
    '.d-q:hover{border-color:#0D9488;color:#0D9488;background:#F0FDFA;}',
    '.d-foot{padding:11px 12px;border-top:1px solid #E2E8F0;background:#fff;display:flex;gap:8px;flex-shrink:0;}',
    '.d-inp{flex:1;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:10px;padding:9px 12px;font-size:12px;font-family:Inter,sans-serif;color:#0F172A;outline:none;resize:none;line-height:1.4;max-height:75px;transition:border-color .15s;}',
    '.d-inp:focus{border-color:#0D9488;box-shadow:0 0 0 3px rgba(13,148,136,.09);background:#fff;}',
    '.d-inp::placeholder{color:#CBD5E1;}',
    '.d-send{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#0D9488,#0F766E);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:transform .15s;flex-shrink:0;align-self:flex-end;}',
    '.d-send:hover{transform:scale(1.07);}.d-send:disabled{opacity:.5;cursor:not-allowed;transform:none;}',
    '@media(max-width:480px){.d-win{width:calc(100vw - 20px);right:10px;bottom:80px;}.d-fab{bottom:14px;right:14px;}}'
  ].join('');

  var msgs=[], busy=false, open=false;

  function boot(){
    // inject CSS
    var s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);

    // FAB
    var fab=document.createElement('button');
    fab.className='d-fab'; fab.title='Donna - Asistente IA';
    fab.innerHTML='<span class="d-fab-lbl">D</span><div class="d-badge"></div>';
    fab.onclick=toggle;
    document.body.appendChild(fab);

    // Window
    var win=document.createElement('div');
    win.className='d-win'; win.id='d-win';
    win.innerHTML=[
      '<div class="d-hdr">',
        '<div class="d-hdr-av">D</div>',
        '<div class="d-hdr-info">',
          '<div class="d-hdr-name">Donna</div>',
          '<div class="d-hdr-st"><div class="d-hdr-dot"></div>Asistente de Properties 714</div>',
        '</div>',
        '<button class="d-x" id="d-close">&#215;</button>',
      '</div>',
      '<div class="d-body" id="d-body">',
        '<div class="d-row">',
          '<div class="d-av ai">D</div>',
          '<div class="d-bub ai">\u00a1Hola! Soy <strong>Donna</strong> \ud83c\udfe0<br><br>Estoy aqu\u00ed para ayudarte con deals, MAO, estrategias, o cualquier duda del sistema.<br><br>\u00bfEn qu\u00e9 te puedo ayudar?</div>',
        '</div>',
      '</div>',
      '<div class="d-qs" id="d-qs">',
        '<button class="d-q" id="q1">\ud83d\udcd0 C\u00f3mo calcular MAO</button>',
        '<button class="d-q" id="q2">\ud83c\udfe1 Flip vs Rental</button>',
        '<button class="d-q" id="q3">\ud83d\udcca Qu\u00e9 es el score</button>',
        '<button class="d-q" id="q4">\ud83d\udccd Qu\u00e9 es ARV</button>',
      '</div>',
      '<div class="d-foot">',
        '<textarea class="d-inp" id="d-inp" rows="1" placeholder="Escribe tu pregunta..."></textarea>',
        '<button class="d-send" id="d-send">&#10148;</button>',
      '</div>'
    ].join('');
    document.body.appendChild(win);

    // events
    document.getElementById('d-close').onclick=toggle;
    document.getElementById('d-send').onclick=send;
    var inp=document.getElementById('d-inp');
    inp.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}};
    inp.oninput=function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,75)+'px';};
    document.getElementById('q1').onclick=function(){quick('\u00bfC\u00f3mo calculo el MAO de una propiedad?');};
    document.getElementById('q2').onclick=function(){quick('\u00bfQu\u00e9 conviene m\u00e1s, flip o rental?');};
    document.getElementById('q3').onclick=function(){quick('\u00bfQu\u00e9 significa el score del deal?');};
    document.getElementById('q4').onclick=function(){quick('\u00bfQu\u00e9 es el ARV?');};
  }

  function toggle(){
    open=!open;
    var w=document.getElementById('d-win');
    if(w){w.classList.toggle('show',open);}
    if(open)setTimeout(function(){var i=document.getElementById('d-inp');if(i)i.focus();},240);
  }

  function quick(txt){
    var i=document.getElementById('d-inp');
    if(i){i.value=txt;send();}
  }

  function send(){
    var inp=document.getElementById('d-inp');
    var txt=(inp?inp.value:'').trim();
    if(!txt||busy)return;
    inp.value=''; inp.style.height='auto';
    var qs=document.getElementById('d-qs');
    if(qs)qs.style.display='none';
    addBub('me',txt);
    msgs.push({role:'user',content:txt});
    setBusy(true);
    var key=(window.__P714_CONFIG__||{}).anthropicKey||'';
    if(!key){
      addBub('ai','\u26a0\ufe0f La API key de Anthropic no est\u00e1 configurada todav\u00eda. Eduardo debe agregarla en js/config.js para activarme.');
      setBusy(false); return;
    }
    fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:'claude-sonnet-4-6',
        max_tokens:500,
        system:SYSTEM,
        messages:msgs.slice(-10)
      })
    })
    .then(function(r){
      if(!r.ok)return r.json().then(function(e){throw new Error((e.error&&e.error.message)||'HTTP '+r.status);});
      return r.json();
    })
    .then(function(d){
      var reply=(d.content&&d.content[0]&&d.content[0].text)||'';
      if(!reply)throw new Error('Respuesta vac\u00eda');
      msgs.push({role:'assistant',content:reply});
      addBub('ai',reply);
    })
    .catch(function(e){
      msgs.pop();
      addBub('ai','\u274c Error: '+e.message+'. Verifica tu conexi\u00f3n.');
    })
    .finally(function(){setBusy(false);});
  }

  function addBub(role,txt){
    var body=document.getElementById('d-body');
    if(!body)return;
    var tw=body.querySelector('.d-typing-row');
    if(tw)tw.remove();
    var isAI=role==='ai';
    var row=document.createElement('div');
    row.className='d-row'+(isAI?'':' me');
    var fmt=txt
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
      .replace(/`([^`]+)`/g,'<code style="background:#F1F5F9;padding:1px 5px;border-radius:4px;font-size:11px;font-family:monospace">$1</code>')
      .replace(/\n/g,'<br>');
    row.innerHTML='<div class="d-av '+(isAI?'ai':'me')+'">'+(isAI?'D':'T\u00fa')+'</div><div class="d-bub '+(isAI?'ai':'me')+'">'+fmt+'</div>';
    body.appendChild(row);
    body.scrollTop=body.scrollHeight;
  }

  function setBusy(v){
    busy=v;
    var btn=document.getElementById('d-send');
    if(btn)btn.disabled=v;
    var body=document.getElementById('d-body');
    if(!body)return;
    if(v){
      var r=document.createElement('div');
      r.className='d-row d-typing-row';
      r.innerHTML='<div class="d-av ai">D</div><div class="d-bub ai" style="padding:10px 14px"><div class="d-dots"><span></span><span></span><span></span></div></div>';
      body.appendChild(r);
      body.scrollTop=body.scrollHeight;
    }
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();
