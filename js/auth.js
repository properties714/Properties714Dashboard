/**
 * Properties 714 — Auth Module v2
 * Multi-tenant + Super Admin support.
 * Backward compatible — existing pages work without changes.
 */
'use strict';

const P714Auth = (()=>{
  let _client=null, _session=null, _profile=null;

  function _getClient(){
    if(_client)return _client;
    const cfg=window.__P714_CONFIG__;
    if(!cfg?.supabaseUrl||cfg.supabaseUrl.includes('TU_'))throw new Error('Supabase no configurado.');
    _client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
    return _client;
  }

  async function _loadProfile(){
    if(!_session)return null;
    try{
      const{data}=await _getClient()
        .from('profiles')
        .select('*,organization:organizations(id,name,slug,subscription_status,plan:plans(name,display_name,max_agents,ai_enabled,messages_enabled,max_ai_requests))')
        .eq('id',_session.user.id)
        .single();
      _profile=data;
    }catch(_){
      _profile={id:_session.user.id,full_name:_session.user.email?.split('@')[0]||'User',email:_session.user.email,role:'agent',is_super_admin:false};
    }
    return _profile;
  }

  async function init(){
    try{
      const sb=_getClient();
      const{data:{session}}=await sb.auth.getSession();
      _session=session;
      if(_session)await _loadProfile();
      sb.auth.onAuthStateChange(async(event,session)=>{
        _session=session;
        if(session){await _loadProfile();}
        else{_profile=null;if(!window.location.pathname.startsWith('/login'))_redirectToLogin();}
      });
      return _session;
    }catch(err){console.warn('[P714Auth] Init failed:',err.message);return null;}
  }

  async function login(email,password){
    const{data,error}=await _getClient().auth.signInWithPassword({email,password});
    if(error)throw error;
    _session=data.session;
    await _loadProfile();
    return data;
  }

  async function logout(){
    await _getClient().auth.signOut();
    _session=null;_profile=null;
    window.location.href='/login/';
  }

  function requireAuth(){if(!_session){_redirectToLogin();return false;}return true;}
  function requireOwner(){if(!requireAuth())return false;if(_profile?.role!=='owner'&&!_profile?.is_super_admin){window.location.href='/';return false;}return true;}
  function requireSuperAdmin(){if(!requireAuth())return false;if(!_profile?.is_super_admin){window.location.href='/';return false;}return true;}
  function _redirectToLogin(){const next=encodeURIComponent(window.location.pathname+window.location.search);window.location.href='/login/?next='+next;}

  // ── Getters ──
  function getClient(){return _getClient();}
  function getSession(){return _session;}
  function getProfile(){return _profile;}
  function getUser(){return _session?.user||null;}
  function isOwner(){return _profile?.role==='owner'||_profile?.is_super_admin===true;}
  function isSuperAdmin(){return _profile?.is_super_admin===true;}
  function isLoggedIn(){return!!_session;}
  function getOrganization(){return _profile?.organization||null;}
  function getPlan(){return _profile?.organization?.plan||null;}

  // ── Feature gating ──
  function canUseAI(){const p=getPlan();if(!p)return true;return p.ai_enabled!==false;}
  function canUseMessages(){const p=getPlan();if(!p)return true;return p.messages_enabled!==false;}
  function getMaxAgents(){const p=getPlan();if(!p)return 999;return p.max_agents||3;}

  function injectUserNav(){
    if(!_session||!_profile)return;
    const avatarEl=document.querySelector('.nav-avatar');
    if(avatarEl){
      const initials=(_profile.full_name||'U').split(' ').map(w=>w[0]||'').join('').toUpperCase().slice(0,2);
      avatarEl.textContent=initials;avatarEl.title=_profile.full_name+' — Click to sign out';avatarEl.style.cursor='pointer';
      avatarEl.addEventListener('click',logout);
    }
    document.querySelectorAll('[data-owner-only]').forEach(el=>{el.style.display=isOwner()?'':'none';});
  }

  // ── Track event ──
  async function trackEvent(eventType,metadata={}){
    try{
      const orgId=_profile?.organization_id||_profile?.organization?.id;
      if(!orgId)return;
      await _getClient().from('events').insert({organization_id:orgId,user_id:_session?.user?.id,event_type:eventType,metadata});
    }catch(_){}
  }

  // ── Track AI usage ──
  async function trackAI(action,tokensEst=0){
    try{
      const orgId=_profile?.organization_id||_profile?.organization?.id;
      if(!orgId)return;
      const cost=tokensEst*0.000003;
      await _getClient().from('ai_usage').insert({organization_id:orgId,user_id:_session?.user?.id,action,tokens_estimated:tokensEst,cost_estimate:cost});
    }catch(_){}
  }

  return{
    init,login,logout,
    requireAuth,requireOwner,requireSuperAdmin,
    getClient,getSession,getProfile,getUser,getOrganization,getPlan,
    isOwner,isSuperAdmin,isLoggedIn,
    canUseAI,canUseMessages,getMaxAgents,
    injectUserNav,trackEvent,trackAI
  };
})();

window.P714Auth=P714Auth;
