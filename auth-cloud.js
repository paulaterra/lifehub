
(() => {
  let client = null;
  let currentUser = null;
  let saveTimer = null;
  let initialSyncDone = false;

  const cfg = window.LIFEHUB_SUPABASE || {};
  const configured =
    typeof cfg.url === "string" &&
    typeof cfg.key === "string" &&
    cfg.url.startsWith("https://") &&
    !cfg.url.includes("PASTE_") &&
    !cfg.key.includes("PASTE_");

  const $ = id => document.getElementById(id);

  function setAuthenticated(on){
    document.body.classList.toggle("authenticated",!!on);
    document.body.classList.toggle("auth-pending",!on);
  }

  function showSetup(){
    setAuthenticated(false);
    $("auth-setup")?.classList.add("visible");
    const form=$("auth-form");
    if(form) form.style.display="none";
  }

  async function upsertCloud(state,prefs){
    if(!client || !currentUser) return;
    const {error}=await client
      .from("lifehub_state")
      .upsert({
        user_id:currentUser.id,
        state,
        prefs,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
    if(error) console.error("Error desant LifeHub a Supabase",error);
  }

  async function initialSync(){
    if(!client || !currentUser || initialSyncDone) return;

    const {data:row,error}=await client
      .from("lifehub_state")
      .select("state,prefs,updated_at")
      .eq("user_id",currentUser.id)
      .maybeSingle();

    if(error){
      console.error("Error carregant LifeHub des de Supabase",error);
      return;
    }

    if(row?.state){
      if(typeof window.applyLifeHubCloudState==="function"){
        window.applyLifeHubCloudState(row);
      }
    }else{
      // El primer dispositiu que entra crea l'estat inicial del núvol
      // amb les dades locals que ja tenia LifeHub.
      const local=typeof window.getLifeHubLocalState==="function"
        ? window.getLifeHubLocalState()
        : {state:{},prefs:{}};
      await upsertCloud(local.state,local.prefs);
    }

    initialSyncDone=true;
  }

  window.lifeHubCloudSave=function(state,prefs){
    if(!currentUser || !initialSyncDone) return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>upsertCloud(state,prefs),350);
  };

  async function handleSession(session){
    currentUser=session?.user||null;
    initialSyncDone=false;
    if(currentUser){
      setAuthenticated(true);
      // app.js pot estar acabant de carregar; permetem que exposi el bridge.
      setTimeout(initialSync,0);
    }else{
      setAuthenticated(false);
    }
  }

  async function init(){
    if(!configured || !window.supabase){
      showSetup();
      return;
    }

    client=window.supabase.createClient(cfg.url,cfg.key,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    });

    const {data}=await client.auth.getSession();
    await handleSession(data.session);

    client.auth.onAuthStateChange((_event,session)=>{
      setTimeout(()=>handleSession(session),0);
    });

    $("auth-form")?.addEventListener("submit",async e=>{
      e.preventDefault();
      const email=$("auth-email")?.value.trim()||"";
      const password=$("auth-password")?.value||"";
      const button=$("auth-submit");
      const errorBox=$("auth-error");
      if(errorBox) errorBox.textContent="";
      if(button){button.disabled=true;button.textContent="Entrant…";}

      const {error}=await client.auth.signInWithPassword({email,password});

      if(error && errorBox) errorBox.textContent="Correu o contrasenya incorrectes.";
      if(button){button.disabled=false;button.textContent="Entrar";}
    });

    $("logout-button")?.addEventListener("click",async()=>{
      await client.auth.signOut();
    });
  }

  window.addEventListener("DOMContentLoaded",init);
})();
