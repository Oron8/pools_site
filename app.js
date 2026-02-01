const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

function getFingerprint() {
  let fp = localStorage.getItem("fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("fp", fp);
    document.cookie = "fp=" + fp + ";max-age=31536000";
  }
  return fp;
}

async function getIpHash() {
  const res = await fetch("https://api.ipify.org?format=json");
  const ip = (await res.json()).ip;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function loadPolls() {
  const { data: polls } = await supabase
    .from("polls")
    .select("id,title,options(id,text)")
    .eq("active", true);

  const container = document.getElementById("polls");
  container.innerHTML = "";

  polls.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<h2>${p.title}</h2>`;

    p.options.forEach(o => {
      const btn = document.createElement("button");
      btn.textContent = o.text;
      btn.onclick = () => vote(p.id, o.id);
      div.appendChild(btn);
    });

    container.appendChild(div);
  });
}

async function vote(pollId, optionId) {
  const fingerprint = getFingerprint();
  const ipHash = await getIpHash();

  const { error } = await supabase.from("votes").insert({
    poll_id: pollId,
    option_id: optionId,
    fingerprint,
    ip_hash: ipHash
  });

  if (error) {
    alert("Ya votaste en esta encuesta");
  } else {
    alert("Voto registrado");
  }
}

loadPolls();
