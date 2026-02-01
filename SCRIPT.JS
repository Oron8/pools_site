function getPolls() {
  return JSON.parse(localStorage.getItem("polls") || "[]");
}

function savePolls(polls) {
  localStorage.setItem("polls", JSON.stringify(polls));
}

/* =======================
   PÁGINA PÚBLICA
======================= */

function renderHome() {
  const polls = getPolls();
  const active = polls.find(p => p.active);
  const container = document.getElementById("pollContainer");

  if (!container) return;

  if (!active) {
    container.innerHTML = "<p>No hay encuesta activa.</p>";
    return;
  }

  container.innerHTML = `
    <h2>${active.title}</h2>
    <iframe src="${active.link}" allowfullscreen></iframe>
  `;
}

/* =======================
   ADMIN
======================= */

function renderAdmin() {
  const list = document.getElementById("pollList");
  if (!list) return;

  const polls = getPolls();
  list.innerHTML = "";

  polls.forEach((poll, index) => {
    const div = document.createElement("div");
    div.className = "pollItem";

    div.innerHTML = `
      <strong>${poll.title}</strong><br>
      <button onclick="setActive(${index})">
        ${poll.active ? "Activa ✅" : "Activar"}
      </button>
      <button onclick="removePoll(${index})">Eliminar</button>
    `;

    list.appendChild(div);
  });

  document.getElementById("addPoll").onclick = () => {
    const title = document.getElementById("pollTitle").value.trim();
    const link = document.getElementById("pollLink").value.trim();

    if (!title || !link.includes("strawpoll.com")) {
      alert("Datos inválidos");
      return;
    }

    const polls = getPolls();
    polls.push({
      title,
      link,
      active: polls.length === 0
    });

    savePolls(polls);

    document.getElementById("pollTitle").value = "";
    document.getElementById("pollLink").value = "";

    renderAdmin();
  };
}

window.setActive = (index) => {
  const polls = getPolls();
  polls.forEach(p => p.active = false);
  polls[index].active = true;
  savePolls(polls);
  renderAdmin();
};

window.removePoll = (index) => {
  const polls = getPolls();
  polls.splice(index, 1);
  savePolls(polls);
  renderAdmin();
};
