const DATA_URL = new URL("../data/employees.json", import.meta.url);

const ICONS = {
  star: `<svg class="icon-star" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5l2.8 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 5.1 20.2l1.5-6.5L1.5 9.3l6.7-.6L12 2.5z" fill="currentColor" stroke="#0284c7" stroke-width="1" />
  </svg>`,
  /** Podium 1st place — matches gold pill text */
  starPodiumGold: `<svg class="podium__star" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5l2.8 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 5.1 20.2l1.5-6.5L1.5 9.3l6.7-.6L12 2.5z" fill="#d97706" stroke="#b45309" stroke-width="1" />
  </svg>`,
  /** Podium 2nd / 3rd */
  starPodiumSky: `<svg class="podium__star" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.5l2.8 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 5.1 20.2l1.5-6.5L1.5 9.3l6.7-.6L12 2.5z" fill="#0ea5e9" stroke="#0284c7" stroke-width="1" />
  </svg>`,
  education: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M4 8.5L12 5l8 3.5-8 3.5-8-3.5z" />
    <path d="M6 10.2V16.5c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-6.3" />
  </svg>`,
  speaking: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <rect x="9" y="3" width="4" height="8" rx="2" />
    <path d="M7 18v-2a5 5 0 0110 0v2" />
    <path d="M12 11v3" />
  </svg>`,
  university: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M3 10l9-4 9 4-9 4-9-4z" />
    <path d="M5 12.2V18a2 2 0 002 1.5h2" />
  </svg>`,
  chevron: `<svg class="expand-btn__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>`,
};

/** Total leaderboard points (mock data has no separate `score` field). */
function sumAllRecentActivityPoints(emp) {
  if (!emp.recentActivity || emp.recentActivity.length === 0) return 0;
  return emp.recentActivity.reduce((sum, r) => sum + r.points, 0);
}

function sumPointsForCategory(emp, category) {
  if (!emp.recentActivity || !category) return 0;
  return emp.recentActivity
    .filter((r) => r.category === category)
    .reduce((sum, r) => sum + r.points, 0);
}

/** Leaderboard score: total = sum of all recent-activity points; category = sum in that category */
function getDisplayScore(emp, state) {
  if (state.category === "all") return sumAllRecentActivityPoints(emp);
  return sumPointsForCategory(emp, state.category);
}

function formatActivityDate(iso) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/ /g, "-");
}

function matchesFilters(emp, state) {
  if (state.year !== "all" && !emp.years.includes(Number(state.year))) {
    return false;
  }
  if (state.quarter !== "all" && !emp.quarters.includes(state.quarter)) {
    return false;
  }
  if (state.category !== "all" && !emp.categoryTags.includes(state.category)) {
    return false;
  }
  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    if (!emp.name.toLowerCase().includes(q)) {
      return false;
    }
  }
  return true;
}

function getFilterState() {
  return {
    year: document.getElementById("filter-year").value,
    quarter: document.getElementById("filter-quarter").value,
    category: document.getElementById("filter-category").value,
    search: document.getElementById("filter-search").value,
  };
}

function podiumBlockClass(variant, rank) {
  if (variant === "first") return "podium__block podium__block--gold";
  return rank === 2 ? "podium__block podium__block--silver-tall" : "podium__block podium__block--silver-short";
}

function podiumBadgeClass(rank) {
  if (rank === 1) return "podium__badge podium__badge--gold";
  if (rank === 2) return "podium__badge podium__badge--silver";
  return "podium__badge podium__badge--bronze";
}

function podiumScorePillClass(rank) {
  return rank === 1 ? "podium__score-pill podium__score-pill--gold" : "podium__score-pill podium__score-pill--white";
}

function podiumScoreStar(rank) {
  return rank === 1 ? ICONS.starPodiumGold : ICONS.starPodiumSky;
}

function buildPodiumSlots(top) {
  if (top.length >= 3) {
    return [
      { rank: 2, emp: top[1], variant: "second" },
      { rank: 1, emp: top[0], variant: "first" },
      { rank: 3, emp: top[2], variant: "third" },
    ];
  }
  if (top.length === 2) {
    return [
      { rank: 2, emp: top[1], variant: "second" },
      { rank: 1, emp: top[0], variant: "first" },
    ];
  }
  if (top.length === 1) {
    return [{ rank: 1, emp: top[0], variant: "first" }];
  }
  return [];
}

function renderPodium(top, state) {
  const host = document.getElementById("podium");
  if (top.length === 0) {
    host.innerHTML = `<p class="podium__empty">No employees match the current filters.</p>`;
    return;
  }
  const slots = buildPodiumSlots(top);
  host.innerHTML = slots
    .map(
      (s) => {
        const pts = getDisplayScore(s.emp, state);
        return `
    <div class="podium__slot podium__slot--${s.variant}">
      <div class="podium__person">
        <div class="podium__photo-wrap">
          <img class="podium__photo" src="${escapeAttr(s.emp.photoUrl)}" alt="" width="112" height="112" loading="lazy" />
          <span class="${podiumBadgeClass(s.rank)}">${s.rank}</span>
        </div>
        <div class="podium__name">${escapeHtml(s.emp.name)}</div>
        <div class="podium__title">${escapeHtml(s.emp.title)}</div>
        <div class="podium__score">
          <span class="${podiumScorePillClass(s.rank)}">${podiumScoreStar(s.rank)}<span class="podium__score-num">${pts}</span></span>
        </div>
      </div>
      <div class="${podiumBlockClass(s.variant, s.rank)}">
        <span class="podium__block-num">${s.rank}</span>
      </div>
    </div>`;
      }
    )
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function activityCell(emp, state) {
  const a = emp.activities;
  const pairs = [
    { title: "Education", icon: ICONS.education, value: a.education, filterKey: "Education" },
    { title: "Public speaking", icon: ICONS.speaking, value: a.publicSpeaking, filterKey: "Public speaking" },
    { title: "University Partner", icon: ICONS.university, value: a.universityPartner, filterKey: "University Partner" },
  ];
  const visible =
    state.category === "all"
      ? pairs
      : pairs.filter((p) => p.filterKey === state.category);
  const inner = visible
    .map(
      (p) =>
        `<span class="activity-pair activity-pair--tooltip" data-tooltip="${escapeAttr(p.title)}" title="${escapeAttr(p.title)}">${p.icon}<span class="activity-pair__count">${p.value}</span></span>`
    )
    .join("");
  return `<div class="activity-icons">${inner}</div>`;
}

function recentActivityTable(emp, state) {
  let list = emp.recentActivity || [];
  if (state.category !== "all") {
    list = list.filter((r) => r.category === state.category);
  }
  const rows = list
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.activity)}</td>
      <td><span class="pill">${escapeHtml(r.category)}</span></td>
      <td>${escapeHtml(formatActivityDate(r.date))}</td>
      <td class="points-pos">+${r.points}</td>
    </tr>`
    )
    .join("");
  const emptyRow =
    list.length === 0
      ? `<tr><td colspan="4" class="activity-detail-empty">No activities in this view.</td></tr>`
      : "";
  return `
    <div class="expand-panel">
      <h4 class="expand-heading">RECENT ACTIVITY</h4>
      <table class="activity-detail-table">
        <thead>
          <tr>
            <th scope="col">Activity</th>
            <th scope="col">Category</th>
            <th scope="col">Date</th>
            <th scope="col">Points</th>
          </tr>
        </thead>
        <tbody>${rows}${emptyRow}</tbody>
      </table>
    </div>`;
}

function scoreColumnLabel(state) {
  return state.category === "all" ? "Total" : state.category;
}

function renderLeaderList(sorted, expandedId, state) {
  const list = document.getElementById("leader-list");
  list.innerHTML = sorted
    .map((emp, idx) => {
      const rank = idx + 1;
      const expanded = expandedId === emp.id;
      const hiddenAttr = expanded ? "" : " hidden";
      const pts = getDisplayScore(emp, state);
      const label = scoreColumnLabel(state);
      return `
    <div class="leader-card-block" role="listitem">
      <article class="leader-card" data-employee-id="${escapeAttr(emp.id)}">
        <div class="leader-card__row">
          <div class="leader-card__rank rank-cell">${rank}</div>
          <img class="avatar leader-card__avatar" src="${escapeAttr(emp.photoUrl)}" alt="" width="40" height="40" loading="lazy" />
          <div class="leader-card__identity">
            <div class="identity-name">${escapeHtml(emp.name)}</div>
            <div class="identity-title">${escapeHtml(emp.title)}</div>
          </div>
          <div class="leader-card__activities">${activityCell(emp, state)}</div>
          <div class="leader-card__score-col">
            <div class="score-cell-inner">
              <span class="score-label">${escapeHtml(label)}</span>
              <span class="score-value">${ICONS.star}<span>${pts}</span></span>
            </div>
          </div>
          <div class="leader-card__actions">
            <button type="button" class="expand-btn" aria-expanded="${expanded}" aria-controls="panel-${emp.id}" id="btn-${emp.id}">
              ${ICONS.chevron}
            </button>
          </div>
        </div>
        <div class="leader-card__expand-panel" id="panel-${emp.id}"${hiddenAttr}>
          ${recentActivityTable(emp, state)}
        </div>
      </article>
    </div>`;
    })
    .join("");
}

let cachedEmployees = [];
let currentExpanded = null;

function applyFiltersAndRender() {
  const state = getFilterState();
  const filtered = cachedEmployees.filter((e) => matchesFilters(e, state));
  filtered.sort((a, b) => getDisplayScore(b, state) - getDisplayScore(a, state));
  const top = filtered.slice(0, 3);
  renderPodium(top, state);
  if (currentExpanded && !filtered.some((e) => e.id === currentExpanded)) {
    currentExpanded = null;
  }
  renderLeaderList(filtered, currentExpanded, state);
}

function init() {
  const list = document.getElementById("leader-list");
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".expand-btn");
    if (!btn || !list.contains(btn)) return;
    const id = btn.id.replace("btn-", "");
    currentExpanded = currentExpanded === id ? null : id;
    applyFiltersAndRender();
  });

  ["filter-year", "filter-quarter", "filter-category"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      currentExpanded = null;
      applyFiltersAndRender();
    });
  });
  document.getElementById("filter-search").addEventListener("input", () => {
    currentExpanded = null;
    applyFiltersAndRender();
  });
}

fetch(DATA_URL.href)
  .then((res) => {
    if (!res.ok) throw new Error("Failed to load leaderboard data");
    return res.json();
  })
  .then((data) => {
    cachedEmployees = data.employees;
    init();
    applyFiltersAndRender();
  })
  .catch((err) => {
    document.getElementById("podium").innerHTML = `<p class="podium__empty">Could not load data. Open this site over HTTP(s), not as a local file.</p>`;
    console.error(err);
  });
