// app.js
const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Utilities
function log(...args) { console.log("[POLL]", ...args); }
function showToast(msg) { alert(msg); } // reemplazá por UI si querés

function getFingerprint() {
  let fp = localStorage.getItem("fp");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("fp", fp);
    document.cookie = `fp=${fp}; max-age=31536000; path=/`;
    log("Generated fingerprint:", fp);
  }
  return fp;
}

async function getIpHash() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) throw new Error("ip fetch failed");
    const { ip } = await res.json();
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    return hex;
  } catch (e) {
    console.warn("No IP available:", e);
    return null; // fallback: no ip hash
  }
}

// Cargar polls activos y sus opciones
async function loadPolls() {
  try {
    const container = document.getElementById("polls");
    container.innerHTML = "Cargando...";

    const { data: polls, error } = await supabase
      .from("polls")
      .select("id,title,active, options(id,text)")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!polls || polls.length === 0) {
      container.innerHTML = "<p>No hay encuestas activas</p>";
      return;
    }

    container.innerHTML = "";
    for (const poll of polls) {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.pollId = poll.id;

      const title = document.createElement("h2");
      title.textContent = poll.title;
      card.appendChild(title);

      // Resultado placeholder
      const resultsDiv = document.createElement("div");
      resultsDiv.className = "results";
      resultsDiv.textContent = "Cargando resultados...";
      card.appendChild(resultsDiv);

      // Opciones / botones
      const btnWrap = document.createElement("div");
      btnWrap.className = "options";
      for (const opt of (poll.options || [])) {
        const btn = document.createElement("button");
        btn.className = "vote-btn";
        btn.type = "button";
        btn.textContent = opt.text;
        btn.dataset.optionId = opt.id;
        btn.addEventListener("click", () => handleVote(poll.id, opt.id, btn));
        btnWrap.appendChild(btn);
      }
      card.appendChild(btnWrap);

      container.appendChild(card);

      // Cargar los resultados para esa encuesta
      await renderResultsForPoll(poll.id);
      // Verificar si ya votó y deshabilitar botones si corresponde
      await applyVotedState(poll.id, card);
    }
  } catch (err) {
    console.error("loadPolls error:", err);
    document.getElementById("polls").innerHTML = "<p>Error cargando encuestas.</p>";
  }
}

async function renderResultsForPoll(pollId) {
  try {
    const { data, error } = await supabase
      .from("votes")
      .select("option_id, count:count(*)")
      .eq("poll_id", pollId)
      .group("option_id");

    // If the above group API not supported, fallback to simple select and count:
    if (error) {
      // fallback
      const { data: rows, error: e2 } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", pollId);

      if (e2) throw e2;
      const tallies = {};
      rows.forEach(r => tallies[r.option_id] = (tallies[r.option_id] || 0) + 1);
      displayTalliesInCard(pollId, tallies);
      return;
    }
    // transform group result to tallies
    const tallies = {};
    (data || []).forEach(r => { tallies[r.option_id] = Number(r.count) || 0; });
    displayTalliesInCard(pollId, tallies);
  } catch (e) {
    console.error("renderResultsForPoll:", e);
  }
}

function displayTalliesInCard(pollId, tallies) {
  const card = document.querySelector(`.card[data-poll-id="${pollId}"]`);
  if (!card) return;
  const resultsDiv = card.querySelector(".results");
  if (!resultsDiv) return;

  // Build a friendly display (option text + count)
  const optionButtons = card.querySelectorAll(".options .vote-btn");
  let html = "";
  optionButtons.forEach(btn => {
    const optId = btn.dataset.optionId;
    const count = tallies[optId] || 0;
    html += `<div class="result-row">${btn.textContent}: <strong>${count}</strong></div>`;
  });
  resultsDiv.innerHTML = html || "<div>No hay votos aún</div>";
}

// Check if current visitor has already voted for a poll (fingerprint or ip)
async function applyVotedState(pollId, cardElement) {
  try {
    const fingerprint = getFingerprint();
    let ipHash = await getIpHash();
    // build filter
    const { data, error } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .or(`fingerprint.eq.${fingerprint}${ipHash ? `,ip_hash.eq.${ipHash}` : ""}`)
      .limit(1);

    if (error) {
      console.warn("applyVotedState query warning:", error);
      return;
    }

    const didVote = data && data.length > 0;
    if (didVote) {
      const buttons = cardElement.querySelectorAll(".vote-btn");
      buttons.forEach(b => b.disabled = true);
      cardElement.classList.add("voted");
    }
  } catch (e) {
    console.error("applyVotedState:", e);
  }
}

async function handleVote(pollId, optionId, btnElement) {
  try {
    btnElement.disabled = true;
    btnElement.textContent = "Enviando...";

    const fingerprint = getFingerprint();
    const ipHash = await getIpHash();

    const { error } = await supabase.from("votes").insert({
      poll_id: pollId,
      option_id: optionId,
      fingerprint,
      ip_hash: ipHash
    });

    if (error) {
      console.warn("vote insert error:", error);
      showToast("No se pudo registrar el voto o ya votaste.");
      // re-enable if it wasn't a duplicate
      btnElement.disabled = false;
      btnElement.textContent = btnElement.dataset.origText || btnElement.textContent;
      return;
    }

    showToast("Voto registrado ✅");
    // actualizar resultados y bloquear botones en esta card
    await renderResultsForPoll(pollId);
    const card = btnElement.closest(".card");
    if (card) {
      const buttons = card.querySelectorAll(".vote-btn");
      buttons.forEach(b => { b.disabled = true; });
      card.classList.add("voted");
    }
  } catch (e) {
    console.error("handleVote error:", e);
    showToast("Error al votar. Revisa la consola.");
    btnElement.disabled = false;
    btnElement.textContent = btnElement.dataset.origText || btnElement.textContent;
  } finally {
    try { btnElement.textContent = btnElement.dataset.origText || btnElement.textContent; } catch {}
  }
}

// Start
document.addEventListener("DOMContentLoaded", loadPolls);
