// auth.js
const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";
const supabaseAuth = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginMessage = document.getElementById("loginMessage");
    loginMessage.textContent = "";

    if (!email || !password) {
      loginMessage.textContent = "Completá email y password.";
      return;
    }

    try {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
      if (error) throw error;
      logAuth("login success", data);

      // show panel
      document.getElementById("loginSection").hidden = true;
      document.getElementById("panelSection").hidden = false;

      // load admin polls
      if (window.loadAdminPolls) window.loadAdminPolls();
    } catch (e) {
      console.error("login error:", e);
      loginMessage.textContent = "Login falló. Revisa credenciales.";
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      await supabaseAuth.auth.signOut();
      document.getElementById("loginSection").hidden = false;
      document.getElementById("panelSection").hidden = true;
      document.getElementById("loginMessage").textContent = "Sesión cerrada.";
    } catch (e) {
      console.error("logout error:", e);
    }
  });

  function logAuth(...args){ console.log("[AUTH]", ...args); }
});
