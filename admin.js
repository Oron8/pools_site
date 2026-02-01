const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

document.getElementById("loginBtn").onclick = async () => {
  const email = email.value;
  const password = password.value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login incorrecto");
  } else {
    login.hidden = true;
    panel.hidden = false;
    loadAdminPolls();
  }
};
