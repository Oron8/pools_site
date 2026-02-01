async function createPoll() {
  const title = title.value;
  const opt1 = opt1.value;
  const opt2 = opt2.value;

  const { data: poll } = await supabase
    .from("polls")
    .insert({ title })
    .select()
    .single();

  await supabase.from("options").insert([
    { poll_id: poll.id, text: opt1 },
    { poll_id: poll.id, text: opt2 }
  ]);

  loadAdminPolls();
}

async function loadAdminPolls() {
  const { data } = await supabase
    .from("polls")
    .select("*, votes(count)")
    .order("created_at", { ascending: false });

  const div = document.getElementById("polls");
  div.innerHTML = "";

  data.forEach(p => {
    div.innerHTML += `
      <div class="card">
        <b>${p.title}</b><br>
        Activo: ${p.active}<br>
        <button onclick="toggle('${p.id}', ${p.active})">
          ${p.active ? "Desactivar" : "Activar"}
        </button>
      </div>
    `;
  });
}

async function toggle(id, active) {
  await supabase.from("polls")
    .update({ active: !active })
    .eq("id", id);
  loadAdminPolls();
}
