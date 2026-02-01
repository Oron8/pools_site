const SUPABASE_URL = "https://dogabczdodpdcettplnu.supabase.co";
const SUPABASE_KEY = "sb_publishable_jjxzLmPr92QYQff7s9qz6Q_zb0YAne3";

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

document.getElementById("createPollBtn")
  .addEventListener("click", createPoll);

async function createPoll() {
  const title = document.getElementById("pollTitle").value.trim();
  if (!title) {
    alert("Poné un título");
    return;
  }

  const { error } = await supabase
    .from("polls")
    .insert({ title });

  if (error) {
    console.error(error);
    alert("Error creando encuesta");
  } else {
    document.getElementById("pollTitle").value = "";
    loadPolls();
  }
}

async function loadPolls() {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("polls");
  container.innerHTML = "";

  data.forEach(poll => {
    const div = document.createElement("div");
    div.className = "box";

    const title = document.createElement("h3");
    title.textContent = poll.title;

    const btn = document.createElement("button");
    btn.textContent = poll.active ? "Desactivar" : "Activar";
    btn.addEventListener("click", () => togglePoll(poll.id, poll.active));

    div.appendChild(title);
    div.appendChild(btn);
    container.appendChild(div);
  });
}

async function togglePoll(id, active) {
  const { error } = await supabase
    .from("polls")
    .update({ active: !active })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error al cambiar estado");
  } else {
    loadPolls();
  }
}

loadPolls();
