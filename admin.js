// admin.js
const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";
const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function createPollAndOptions(title, optA, optB) {
  if (!title || !optA || !optB) return { error: "Completar datos" };
  // Crear poll
  const { data: poll, error: pErr } = await supabaseAdmin
    .from("polls")
    .insert({ title, active: true })
    .select()
    .single();
  if (pErr) return { error: pErr };

  // Crear opciones
  const { error: oErr } = await supabaseAdmin.from("options").insert([
    { poll_id: poll.id, text: optA },
    { poll_id: poll.id, text: optB }
  ]);
  return { poll, error: oErr };
}

async function loadAdminPolls() {
  try {
    const el = document.getElementById("adminPolls");
    el.innerHTML = "Cargando...";
    const { data, error } = await supabaseAdmin
      .from("polls")
      .select("id,title,active, created_at, options(id,text)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      el.innerHTML = "<p>No hay encuestas aún</p>";
      return;
    }

    el.innerHTML = "";
    for (const p of data) {
      const node = document.createElement("div");
      node.className = "card";
      node.innerHTML = `
        <b>${p.title}</b>
        <div>Estado: ${p.active ? "Activo" : "Inactivo"}</div>
        <div class="admin-options"></div>
        <div class="admin-results" id="res-${p.id}">Cargando votos...</div>
      `;
      // toggle button
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = p.active ? "Desactivar" : "Activar";
      toggleBtn.addEventListener("click", async () => {
        await supabaseAdmin.from("polls").update({ active: !p.active }).eq("id", p.id);
        await loadAdminPolls();
      });
      node.querySelector(".admin-options").appendChild(toggleBtn);

      // boton ver votos
      const showVotesBtn = document.createElement("button");
      showVotesBtn.textContent = "Actualizar votos";
      showVotesBtn.addEventListener("click", () => renderAdminResults(p.id));
      node.querySelector(".admin-options").appendChild(showVotesBtn);

      el.appendChild(node);
      // render initial results
      renderAdminResults(p.id);
    }
  } catch (e) {
    console.error("loadAdminPolls:", e);
    document.getElementById("adminPolls").textContent = "Error al cargar encuestas.";
  }
}

// Muestra conteo por opción para admin
async function renderAdminResults(pollId) {
  try {
    const resEl = document.getElementById(`res-${pollId}`);
    if (!resEl) return;
    resEl.textContent = "Cargando...";

    const { data, error } = await supabaseAdmin
      .from("votes")
      .select("option_id")
      .eq("poll_id", pollId);

    if (error) throw error;
    const counts = {};
    (data || []).forEach(r => counts[r.option_id] = (counts[r.option_id] || 0) + 1);
    // mostrar
    let html = "<b>Votos:</b><br>";
    for (const [optId, cnt] of Object.entries(counts)) {
      html += `<div>${optId}: ${cnt}</div>`;
    }
    resEl.innerHTML = html || "<div>No hay votos</div>";
  } catch (e) {
    console.error("renderAdminResults:", e);
  }
}

// Exponer loadAdminPolls global para auth.js
window.loadAdminPolls = loadAdminPolls;

// wire create button after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createBtn");
  createBtn?.addEventListener("click", async () => {
    const title = document.getElementById("pollTitle").value.trim();
    const opt1 = document.getElementById("opt1").value.trim();
    const opt2 = document.getElementById("opt2").value.trim();
    if (!title || !opt1 || !opt2) { alert("Completa todos los campos"); return; }

    const { error } = await createPollAndOptions(title, opt1, opt2);
    if (error) {
      alert("Error: " + (error.message || error));
      console.error("createPoll error:", error);
    } else {
      alert("Encuesta creada ✅");
      // limpiar campos y recargar
      document.getElementById("pollTitle").value = "";
      document.getElementById("opt1").value = "";
      document.getElementById("opt2").value = "";
      loadAdminPolls();
    }
  });
});
