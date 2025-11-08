// === Setup ===
const rows = document.getElementById("rows");
const weekKeys = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return d.toISOString().slice(0, 10);
});
document.getElementById("week-range").textContent = `${weekKeys[0]} → ${weekKeys[6]}`;

let state = loadState();

// Load saved data or start fresh
function loadState() {
  try {
    return JSON.parse(localStorage.getItem("habitState")) || { habits: [] };
  } catch {
    return { habits: [] };
  }
}

// Save to browser storage
function saveState(data) {
  localStorage.setItem("habitState", JSON.stringify(data));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Create a new habit object
function newHabit(name) {
  return { id: Math.random().toString(36).slice(2, 9), name, log: {} };
}

// Count consecutive days done
function computeStreak(habit) {
  let streak = 0;
  const today = todayKey();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (habit.log[key]) streak++;
    else break;
  }
  return streak;
}

// === Render the Table ===
function render() {
  rows.innerHTML = "";

  if (state.habits.length === 0) {
    const empty = document.createElement("div");
    empty.setAttribute(
      "style",
      "padding:20px;text-align:center;color:#66788a;"
    );
    empty.textContent = "No habits yet — add one above to get started.";
    rows.appendChild(empty);
    return;
  }

  state.habits.forEach(h => {
    const row = document.createElement("div");
    row.setAttribute(
      "style",
      "display:grid;grid-template-columns:1.6fr repeat(7,.9fr) .8fr 1fr;align-items:center;border-bottom:1px solid #eef2f6;"
    );

    // Habit name
    const nameCol = document.createElement("div");
    nameCol.textContent = h.name;
    nameCol.style.padding = "10px";
    row.appendChild(nameCol);

    // Day buttons
    weekKeys.forEach(k => {
      const col = document.createElement("div");
      col.style.textAlign = "center";
      const btn = document.createElement("button");
      const checked = !!h.log[k];
      btn.type = "button";
      btn.textContent = checked ? "Yes" : "";
      btn.dataset.habitId = h.id;
      btn.dataset.dateKey = k;
      btn.setAttribute("aria-label", `${h.name} on ${k}`);
      btn.setAttribute("role", "checkbox");
      btn.setAttribute("aria-checked", String(checked));
      btn.setAttribute(
        "style",
        `display:flex;align-items:center;justify-content:center;width:36px;height:36px;margin:auto;border-radius:8px;border:1px solid #dbe7f0;cursor:pointer;background:${
          checked ? "#e9f8ef" : "#fff"
        };color:${checked ? "#1e9e4a" : "inherit"};font-weight:${
          checked ? "700" : "400"
        };`
      );
      btn.addEventListener("click", onToggleDay);
      btn.addEventListener("keydown", e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          btn.click();
        }
      });
      col.appendChild(btn);
      row.appendChild(col);
    });

    // Streak
    const streak = document.createElement("div");
    streak.textContent = computeStreak(h);
    streak.style.padding = "10px";
    row.appendChild(streak);

    // Actions
    const actions = document.createElement("div");
    actions.style.padding = "10px";
    actions.style.display = "flex";
    actions.style.gap = "8px";

    const tick = document.createElement("button");
    tick.textContent = "Tick today";
    tick.style =
      "background:#fff;border:1px solid #dbe7f0;color:#0b3b58;padding:6px 10px;border-radius:8px;cursor:pointer;";
    tick.addEventListener("click", () => toggleLog(h.id, todayKey()));

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.style =
      "background:#fff;border:1px solid #f2c9cd;color:#c71f23;padding:6px 10px;border-radius:8px;cursor:pointer;";
    del.addEventListener("click", () => {
      if (confirm(`Delete habit "${h.name}"?`)) {
        state.habits = state.habits.filter(x => x.id !== h.id);
        saveState(state);
        render();
      }
    });

    actions.appendChild(tick);
    actions.appendChild(del);
    row.appendChild(actions);
    rows.appendChild(row);
  });
}

// === Logic for toggling days ===
function onToggleDay(e) {
  const { habitId, dateKey } = e.currentTarget.dataset;
  toggleLog(habitId, dateKey);
}

function toggleLog(habitId, dateKey) {
  const h = state.habits.find(x => x.id === habitId);
  if (!h) return;
  if (h.log[dateKey]) delete h.log[dateKey];
  else h.log[dateKey] = true;
  saveState(state);
  render();
}

// === Add habit form ===
document.getElementById("habit-form").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("habit-name");
  const name = input.value.trim();
  if (!name) return;
  state.habits.push(newHabit(name));
  saveState(state);
  input.value = "";
  render();
});

// === Data Management ===
document.getElementById("export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "habits-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("import-json").addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.habits)) throw new Error("Invalid format");
    state = data;
    saveState(state);
    render();
    alert("Import complete. Data loaded.");
  } catch {
    alert("Import failed. Please check the JSON file format.");
  }
  e.target.value = "";
});

document.getElementById("reset-all").addEventListener("click", () => {
  if (!confirm("Are you sure? This will permanently remove all habits and logs.")) return;
  state = { habits: [] };
  saveState(state);
  render();
  alert("All data reset.");
});

// === Start app ===
render();
