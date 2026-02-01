async function createPoll() {
  const title = document.getElementById("pollTitle").value;
  const o1 = document.getElementById("opt1").value;
  const o2 = document.getElementById("opt2").value;

  if (!title || !o1 || !o2) {
    alert("Completa todo");
    return;
  }

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({ title })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("options").insert([
    { poll_id: poll.id, text: o1 },
    { poll_id: poll.id, text: o2 }
  ]);

  loadAdminPolls();
}

async function loadAdminPolls() {
  const { data } = await supabase
    .from("polls")
    .select("id,title,active")
    .order("created_at", { ascending: false });

  const div = document.getElementById("polls");
  div.innerHTML = "";

  data.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <b>${p.title}</b><br>
      Estado: ${p.active ? "Activo" : "Inactivo"}
      <button onclick="togglePoll('${p.id}', ${p.active})">
        ${p.active ? "Desactivar" : "Activar"}
      </button>
    `;
    div.appendChild(card);
  });
}

async function togglePoll(id, active) {
  await supabase.from("polls")
    .update({ active: !active })
    .eq("id", id);

  loadAdminPolls();
}

document.getElementById("createBtn").onclick = createPoll;
