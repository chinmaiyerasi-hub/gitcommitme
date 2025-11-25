const STORAGE_KEYS = {
  profile: "gcm:profile",
  preferences: "gcm:preferences"
};
const TOKEN_KEY = "gcm:token";

const DEFAULT_PREFERENCES = {
  skills: ["React", "TypeScript"],
  collaborationModes: ["Pairing"]
};

const DEFAULT_CANDIDATES = [
  {
    id: "c1",
    name: "Jordan Sparks",
    age: 30,
    title: "Frontend Developer",
    location: "New York, NY",
    bio: "Accessibility-focused frontend dev shipping pixel-perfect React apps.",
    skills: ["React", "TypeScript", "CSS", "Figma"],
    collaborationModes: ["Pairing", "Async updates"],
    languages: ["TypeScript", "JavaScript", "CSS"],
    githubMetrics: {
      streak: 32,
      topRepo: "design-systems-lab"
    },
    avatar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "c2",
    name: "Priya Raman",
    age: 28,
    title: "Full-stack Engineer",
    location: "Austin, TX",
    bio: "Shipping platform APIs by day, building indie SaaS experiments by night.",
    skills: ["Node.js", "GraphQL", "Postgres", "React"],
    collaborationModes: ["Async updates", "Open source sprints"],
    languages: ["TypeScript", "Go", "SQL"],
    githubMetrics: {
      streak: 14,
      topRepo: "sprintboard"
    },
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "c3",
    name: "Diego Rivera",
    age: 33,
    title: "Systems Engineer",
    location: "Remote · GMT-5",
    bio: "Optimizing infra pipelines and writing docs nobody hates.",
    skills: ["Rust", "Terraform", "Kubernetes"],
    collaborationModes: ["Deep work blocks", "Open source sprints"],
    languages: ["Rust", "Python", "Go"],
    githubMetrics: {
      streak: 48,
      topRepo: "kube-scout"
    },
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "c4",
    name: "Mei Lin",
    age: 26,
    title: "Product Engineer",
    location: "Seattle, WA",
    bio: "Crafting delightful onboarding journeys and scalable design systems.",
    skills: ["Vue", "Tailwind", "UX Writing", "Product strategy"],
    collaborationModes: ["Pairing", "Hackathons"],
    languages: ["JavaScript", "Python", "Ruby"],
    githubMetrics: {
      streak: 21,
      topRepo: "flowkit"
    },
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80"
  }
];

const DEMO_PROFILE = {
  user: {
    login: "gitcommitme-demo",
    name: "Jordan Devlin",
    avatar_url: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
    bio: "Design systems tinkerer, OSS romantic, latte art champion.",
    company: "Freelance",
    location: "Remote · Everywhere",
    followers: 128,
    following: 87,
    public_repos: 42,
    html_url: "https://github.com/gitcommitme-demo"
  },
  languages: [
    { name: "TypeScript", share: 45.5 },
    { name: "React", share: 27.3 },
    { name: "Go", share: 18.2 },
    { name: "CSS", share: 9 }
  ],
  topRepos: [
    { name: "matchmaker-ui", url: "#", language: "TypeScript", stars: 420 },
    { name: "design-systems-lab", url: "#", language: "React", stars: 310 },
    { name: "async-loveletters", url: "#", language: "Go", stars: 180 }
  ],
  username: "gitcommitme-demo"
};

const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));

const state = {
  connected: false,
  profile: null,
  preferences: cloneDefaults(),
  candidates: [],
  currentIndex: 0,
  lastSynced: null,
  authToken: sessionStorage.getItem(TOKEN_KEY) || ""
};

const elements = {
  signIn: document.getElementById("sign-in"),
  startMatching: document.getElementById("start-matching"),
  learnMore: document.getElementById("learn-more"),
  toast: document.getElementById("connection-toast"),
  profileCard: document.getElementById("profile-card"),
  skillInput: document.getElementById("skill-input"),
  addSkill: document.getElementById("add-skill"),
  skillList: document.getElementById("skill-list"),
  modeSelect: document.getElementById("mode-select"),
  addMode: document.getElementById("add-mode"),
  modeList: document.getElementById("mode-list"),
  preferenceForm: document.getElementById("preference-form"),
  syncBtn: document.getElementById("sync-github"),
  lastSynced: document.getElementById("last-synced"),
  candidateCard: document.getElementById("candidate-card"),
  passBtn: document.getElementById("pass-btn"),
  likeBtn: document.getElementById("like-btn"),
  openPreferences: document.getElementById("open-preferences"),
  openProfile: document.getElementById("open-profile"),
  preferencesModal: document.getElementById("preferences-modal"),
  profileModal: document.getElementById("profile-modal"),
  connectModal: document.getElementById("connect-modal"),
  connectForm: document.getElementById("connect-form"),
  githubUsername: document.getElementById("github-username"),
  githubToken: document.getElementById("github-token"),
  connectError: document.getElementById("connect-error"),
  demoConnect: document.getElementById("demo-connect")
};

const MAX_SKILLS = 5;
const MAX_MODES = 2;

const hydrateFromStorage = () => {
  const storedProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile);
      state.profile = {
        user: parsed.user,
        languages: parsed.languages || [],
        topRepos: parsed.topRepos || [],
        username: parsed.username
      };
      state.lastSynced = parsed.lastSynced || null;
      state.connected = true;
    } catch (err) {
      console.warn("Failed to parse stored profile", err);
      localStorage.removeItem(STORAGE_KEYS.profile);
    }
  }

  const storedPrefs = localStorage.getItem(STORAGE_KEYS.preferences);
  if (storedPrefs) {
    try {
      state.preferences = JSON.parse(storedPrefs);
    } catch (err) {
      console.warn("Failed to parse stored preferences", err);
      state.preferences = cloneDefaults();
    }
  }

  updateLastSyncedLabel();
  updateConnectionUI();
};

const persistProfile = () => {
  if (!state.profile) {
    localStorage.removeItem(STORAGE_KEYS.profile);
    return;
  }
  const payload = {
    user: state.profile.user,
    languages: state.profile.languages,
    topRepos: state.profile.topRepos,
    username: state.profile.username,
    lastSynced: state.lastSynced
  };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(payload));
};

const persistPreferences = () => {
  localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(state.preferences));
};

const showToast = (message, type = "success") => {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  elements.toast.style.background = type === "success" ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.2)";
  elements.toast.style.color = type === "success" ? "#047857" : "#b42318";
  setTimeout(() => {
    elements.toast.hidden = true;
  }, 4000);
};

const updateConnectionUI = () => {
  document.body.dataset.connected = String(state.connected);
  if (elements.signIn) {
    elements.signIn.textContent = state.connected ? "Disconnect" : "Connect";
  }
};

const updateLastSyncedLabel = () => {
  if (!elements.lastSynced) return;
  elements.lastSynced.textContent = state.lastSynced
    ? `Last synced ${new Date(state.lastSynced).toLocaleString()}`
    : "";
};

const getHeaders = (token) => {
  const headers = {
    Accept: "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const buildProfilePayload = (user, repos) => {
  const languageCounts = {};
  const curatedRepos = [];

  repos.slice(0, 50).forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
    curatedRepos.push({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      description: repo.description
    });
  });

  const total = Object.values(languageCounts).reduce((sum, count) => sum + count, 0) || 1;
  const languages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({
      name,
      share: Number(((count / total) * 100).toFixed(1))
    }));

  const topRepos = curatedRepos.sort((a, b) => b.stars - a.stars).slice(0, 3);

  return {
    user: {
      login: user.login,
      name: user.name || user.login,
      avatar_url: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      followers: user.followers,
      following: user.following,
      public_repos: user.public_repos,
      html_url: user.html_url
    },
    languages,
    topRepos,
    username: user.login
  };
};

const fetchGithubData = async (username, token) => {
  const headers = getHeaders(token);
  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!userRes.ok) {
    throw new Error(userRes.status === 404 ? "We couldn't find that GitHub user." : "GitHub request failed.");
  }
  const reposRes = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
    { headers }
  );
  if (!reposRes.ok) {
    throw new Error("Unable to fetch repositories.");
  }
  const [user, repos] = await Promise.all([userRes.json(), reposRes.json()]);
  return buildProfilePayload(user, repos);
};

const renderPills = () => {
  elements.skillList.innerHTML = "";
  state.preferences.skills.forEach((skill, index) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.innerHTML = `${skill}<button aria-label="Remove skill" data-type="skill" data-index="${index}">×</button>`;
    elements.skillList.appendChild(pill);
  });

  elements.modeList.innerHTML = "";
  state.preferences.collaborationModes.forEach((mode, index) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.style.background = "#e0f2fe";
    pill.style.color = "#0369a1";
    pill.innerHTML = `${mode}<button aria-label="Remove mode" data-type="mode" data-index="${index}">×</button>`;
    elements.modeList.appendChild(pill);
  });
};

const renderProfileCard = () => {
  if (!elements.profileCard) return;
  if (!state.profile) {
    elements.profileCard.classList.add("empty");
    elements.profileCard.innerHTML = `
      <p>Connect GitHub to preview your stats.</p>
      <button class="primary-btn connect-btn">Connect GitHub</button>`;
    updateConnectionUI();
    return;
  }

  elements.profileCard.classList.remove("empty");
  const { user, languages, topRepos } = state.profile;
  elements.profileCard.innerHTML = `
    <img src="${user.avatar_url}" alt="${user.name} avatar" />
    <h4>${user.name}</h4>
    <p class="muted">${user.company || user.login || ""}</p>
    <p>${user.bio || "Shipping code & connections."}</p>
    <div class="pill-group">
      ${languages.map((lang) => `<span class="pill">${lang.name} · ${lang.share}%</span>`).join("")}
    </div>
    <div class="stat-grid">
      <div><strong>${user.public_repos}</strong><span>Repos</span></div>
      <div><strong>${user.followers}</strong><span>Followers</span></div>
      <div><strong>${user.following}</strong><span>Following</span></div>
    </div>
    <div class="top-repos">
      <p class="eyebrow" style="margin-top:1rem;">Top repos</p>
      <ul>
        ${topRepos
          .map(
            (repo) =>
              `<li><a href="${repo.url}" target="_blank" rel="noopener">${repo.name}</a> · ${repo.language || "Multi"}</li>`
          )
          .join("")}
      </ul>
    </div>
  `;
  updateConnectionUI();
};

const loadCandidates = async () => {
  try {
    const response = await fetch("./data/candidates.json");
    if (!response.ok) {
      throw new Error("HTTP error");
    }
    state.candidates = await response.json();
    renderCandidate();
  } catch (err) {
    console.warn("Unable to load candidate data, falling back to defaults.", err);
    state.candidates = DEFAULT_CANDIDATES;
    renderCandidate();
    showToast("Using demo matches (serve files to enable JSON fetch).", "error");
  }
};

const computeAffinity = (candidate) => {
  if (!state.profile) return { score: 0, reasons: [] };

  const userLangs = state.profile.languages?.map((l) => l.name) || [];
  const sharedLangs = candidate.languages.filter((lang) => userLangs.includes(lang));
  const sharedSkills = candidate.skills.filter((skill) => state.preferences.skills.includes(skill));
  const sharedModes = candidate.collaborationModes.filter((mode) =>
    state.preferences.collaborationModes.includes(mode)
  );

  let score = 0;
  const reasons = [];
  if (sharedLangs.length) {
    score += sharedLangs.length * 15;
    reasons.push(`Shared languages: ${sharedLangs.join(", ")}`);
  }
  if (sharedSkills.length) {
    score += sharedSkills.length * 10;
    reasons.push(`Skill overlap: ${sharedSkills.join(", ")}`);
  }
  if (sharedModes.length) {
    score += sharedModes.length * 20;
    reasons.push(`Matching collab styles: ${sharedModes.join(", ")}`);
  }

  score = Math.min(score + 30, 100);
  if (score >= 85) reasons.unshift("Perfect match ⚡");
  return { score, reasons: reasons.slice(0, 3) };
};

const renderCandidate = () => {
  if (!state.candidates.length || !elements.candidateCard) return;
  const candidate = state.candidates[state.currentIndex % state.candidates.length];
  const affinity = computeAffinity(candidate);

  elements.candidateCard.classList.remove("empty");
  elements.candidateCard.innerHTML = `
    <div class="card-photo" style="background-image:url('${candidate.avatar}')"></div>
    <div class="card-body">
      <header>
        <div>
          <h3>${candidate.name}, ${candidate.age}</h3>
          <p class="muted">${candidate.title}</p>
        </div>
        <div class="score-chip">${affinity.score}</div>
      </header>
      <div class="card-meta">
        <span>📍 ${candidate.location}</span>
        <span>🔥 ${candidate.githubMetrics.streak} day streak</span>
        <span>⭐ ${candidate.githubMetrics.topRepo}</span>
      </div>
      <p>${candidate.bio}</p>
      <div class="badge-row">
        ${affinity.reasons.map((reason) => `<span class="badge">${reason}</span>`).join("")}
      </div>
      <div class="pill-group">
        ${candidate.skills.map((skill) => `<span class="pill">${skill}</span>`).join("")}
      </div>
      <p class="muted">Languages: ${candidate.languages.join(" · ")}</p>
    </div>
  `;
};

const addSkill = () => {
  const value = elements.skillInput.value.trim();
  if (!value || state.preferences.skills.includes(value) || state.preferences.skills.length >= MAX_SKILLS) return;
  state.preferences.skills.push(value);
  elements.skillInput.value = "";
  renderPills();
};

const addMode = () => {
  const value = elements.modeSelect.value;
  if (state.preferences.collaborationModes.includes(value) || state.preferences.collaborationModes.length >= MAX_MODES)
    return;
  state.preferences.collaborationModes.push(value);
  renderPills();
};

const removePill = (event) => {
  if (event.target.tagName !== "BUTTON") return;
  const type = event.target.dataset.type;
  const index = Number(event.target.dataset.index);
  if (type === "skill") state.preferences.skills.splice(index, 1);
  if (type === "mode") state.preferences.collaborationModes.splice(index, 1);
  renderPills();
  renderCandidate();
};

const savePreferences = async (event) => {
  event.preventDefault();
  persistPreferences();
  showToast("Preferences saved");
  toggleModal("preferences-modal", false);
  renderCandidate();
};

const syncGithub = async () => {
  if (!state.profile) {
    toggleModal("connect-modal", true);
    return;
  }

  elements.connectError.textContent = "";
  elements.syncBtn.disabled = true;
  try {
    const payload = await fetchGithubData(state.profile.username, state.authToken);
    state.profile = payload;
    state.connected = true;
    state.lastSynced = new Date().toISOString();
    persistProfile();
    updateLastSyncedLabel();
    renderProfileCard();
    renderCandidate();
    showToast("GitHub data refreshed");
  } catch (error) {
    showToast(error.message, "error");
    elements.connectError.textContent = error.message;
  } finally {
    elements.syncBtn.disabled = false;
  }
};

const swipe = (liked) => {
  if (!state.candidates.length) return;
  const candidate = state.candidates[state.currentIndex % state.candidates.length];
  showToast(
    liked ? `You liked ${candidate.name}!` : `You passed on ${candidate.name}.`,
    liked ? "success" : "error"
  );
  state.currentIndex = (state.currentIndex + 1) % state.candidates.length;
  renderCandidate();
};

const toggleModal = (id, show) => {
  const modal = document.getElementById(id);
  if (!modal) return;
  if (show) {
    modal.removeAttribute("hidden");
  } else {
    modal.setAttribute("hidden", "true");
  }
};

const handleConnectSubmit = async (event) => {
  event.preventDefault();
  const username = elements.githubUsername.value.trim();
  const token = elements.githubToken.value.trim();
  if (!username) {
    elements.connectError.textContent = "Please enter a GitHub username.";
    return;
  }

  elements.connectError.textContent = "";
  const submitBtn = elements.connectForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Connecting…";

  try {
    const payload = await fetchGithubData(username, token);
    state.profile = payload;
    state.connected = true;
    state.authToken = token;
    sessionStorage.setItem(TOKEN_KEY, token || "");
    state.lastSynced = new Date().toISOString();
    persistProfile();
    updateLastSyncedLabel();
    renderProfileCard();
    renderCandidate();
    toggleModal("connect-modal", false);
    showToast("GitHub connected!");
    elements.githubUsername.value = "";
    elements.githubToken.value = "";
  } catch (error) {
    elements.connectError.textContent = error.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Connect & Sync";
  }
};

const bindEvents = () => {
  document.body.addEventListener("click", (event) => {
    const trigger = event.target.closest(".connect-btn");
    if (trigger) {
      toggleModal("connect-modal", true);
    }
  });

  if (elements.signIn) {
    elements.signIn.addEventListener("click", () => {
      if (!state.connected) {
        toggleModal("connect-modal", true);
        return;
      }
      state.connected = false;
      state.profile = null;
      state.authToken = "";
      state.lastSynced = null;
      sessionStorage.removeItem(TOKEN_KEY);
      persistProfile();
      updateLastSyncedLabel();
      renderProfileCard();
      renderCandidate();
      showToast("Disconnected from GitHub", "error");
    });
  }

  elements.addSkill.addEventListener("click", addSkill);
  elements.addMode.addEventListener("click", addMode);
  elements.skillList.addEventListener("click", removePill);
  elements.modeList.addEventListener("click", removePill);
  elements.preferenceForm.addEventListener("submit", savePreferences);
  elements.syncBtn.addEventListener("click", syncGithub);
  elements.passBtn.addEventListener("click", () => swipe(false));
  elements.likeBtn.addEventListener("click", () => swipe(true));
  if (elements.startMatching) {
    elements.startMatching.addEventListener("click", () => {
      const target = document.getElementById("swipe");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
  if (elements.learnMore) {
    elements.learnMore.addEventListener("click", () => {
      const section = document.querySelector(".features");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
  if (elements.openPreferences) {
    elements.openPreferences.addEventListener("click", () => {
      renderPills();
      toggleModal("preferences-modal", true);
    });
  }
  if (elements.openProfile) {
    elements.openProfile.addEventListener("click", () => {
      renderProfileCard();
      toggleModal("profile-modal", true);
    });
  }
  if (elements.connectForm) {
    elements.connectForm.addEventListener("submit", handleConnectSubmit);
  }
  if (elements.demoConnect) {
    elements.demoConnect.addEventListener("click", () => {
      state.profile = JSON.parse(JSON.stringify(DEMO_PROFILE));
      state.connected = true;
      state.lastSynced = new Date().toISOString();
      persistProfile();
      updateLastSyncedLabel();
      renderProfileCard();
      renderCandidate();
      toggleModal("connect-modal", false);
      showToast("Demo profile loaded");
    });
  }

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", () => toggleModal(btn.dataset.close, false));
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        toggleModal(modal.id, false);
      }
    });
  });
};

hydrateFromStorage();
renderPills();
renderProfileCard();
bindEvents();
loadCandidates();

