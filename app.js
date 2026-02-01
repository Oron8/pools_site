const SUPABASE_URL = "TU_PROJECT_URL";
const SUPABASE_KEY = "TU_ANON_KEY";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

const pollId = "poll-1";

async function vote(option) {
  await supabase.from("votes").insert({
    poll_id: pollId,
    option: option
  });

  loadResults();
}

async function loadResults() {
  const { data } = await supabase
    .from("votes")
    .select("option")
    .eq("poll_id", pollId);

  const counts = {};
  data.forEach(v => {
    counts[v.option] = (counts[v.option] || 0) + 1;
  });

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  for (const opt in counts) {
    resultsDiv.innerHTML += `<div class="result">${opt}: ${counts[opt]}</div>`;
  }
}

loadResults();
