const farmSeed = [
  { id: "F-01", name: "North Meadow", type: "Broiler", capacity: 12000, birds: 10842, feedKg: 2940, batch: "B-2608", health: "good", leader: "Ravi K." },
  { id: "F-02", name: "Riverbend", type: "Layer", capacity: 9000, birds: 8120, feedKg: 2180, batch: "B-2607", health: "watch", leader: "Sanjay P." },
  { id: "F-03", name: "Orchard House", type: "Broiler", capacity: 15000, birds: 14206, feedKg: 3820, batch: "B-2609", health: "good", leader: "Meena R." },
  { id: "F-04", name: "East Ridge", type: "Country chicken", capacity: 6000, birds: 5330, feedKg: 1470, batch: "B-2606", health: "good", leader: "Harish M." },
  { id: "F-05", name: "Mango Grove", type: "Broiler", capacity: 10000, birds: 8944, feedKg: 2410, batch: "B-2608", health: "alert", leader: "Asha N." },
  { id: "F-06", name: "South Field", type: "Layer", capacity: 11000, birds: 10120, feedKg: 2760, batch: "B-2605", health: "good", leader: "Kiran D." },
  { id: "F-07", name: "Lakeview", type: "Broiler", capacity: 8000, birds: 7310, feedKg: 1980, batch: "B-2609", health: "good", leader: "Vijay S." },
  { id: "F-08", name: "Cedar Lane", type: "Country chicken", capacity: 7000, birds: 6240, feedKg: 1730, batch: "B-2604", health: "watch", leader: "Lakshmi T." },
  { id: "F-09", name: "Hilltop", type: "Broiler", capacity: 13000, birds: 12180, feedKg: 3320, batch: "B-2608", health: "good", leader: "Arun V." },
  { id: "F-10", name: "West Orchard", type: "Layer", capacity: 9500, birds: 8470, feedKg: 2290, batch: "B-2607", health: "good", leader: "Divya J." },
];
let people = [
  { name: "Ravi Kumar", role: "Leader", farm: "North Meadow", attendance: "Present", pay: 900 },
  { name: "Sanjay Patel", role: "Leader", farm: "Riverbend", attendance: "Present", pay: 850 },
  { name: "Meena Rao", role: "Leader", farm: "Orchard House", attendance: "Present", pay: 850 },
  { name: "Harish Menon", role: "Leader", farm: "East Ridge", attendance: "Absent", pay: 800 },
  { name: "Asha Nair", role: "Leader", farm: "Mango Grove", attendance: "Present", pay: 850 },
  { name: "Kiran Das", role: "Leader", farm: "South Field", attendance: "Present", pay: 850 },
  { name: "Vijay Shah", role: "Leader", farm: "Lakeview", attendance: "Present", pay: 850 },
  { name: "Lakshmi Thomas", role: "Leader", farm: "Cedar Lane", attendance: "Present", pay: 850 },
  { name: "Arun Varma", role: "Leader", farm: "Hilltop", attendance: "Present", pay: 900 },
  { name: "Divya Joshi", role: "Leader", farm: "West Orchard", attendance: "Present", pay: 850 },
  { name: "Mohan Reddy", role: "Team", farm: "North Meadow", attendance: "Present", pay: 650 },
  { name: "Sita Devi", role: "Team", farm: "North Meadow", attendance: "Present", pay: 600 },
  { name: "Ramesh Babu", role: "Team", farm: "Mango Grove", attendance: "Absent", pay: 600 },
];
let batchSeed = [
  { id: "B-2609", farm: "Orchard House", type: "Broiler", placed: "12 Sep 2026", initial: 14500, current: 14206, age: "18 days", status: "Active", avgWeight: "0.86 kg" },
  { id: "B-2608", farm: "North Meadow", type: "Broiler", placed: "25 Aug 2026", initial: 11000, current: 10842, age: "36 days", status: "Active", avgWeight: "1.72 kg" },
  { id: "B-2607", farm: "Riverbend", type: "Layer", placed: "04 Aug 2026", initial: 8300, current: 8120, age: "57 days", status: "Active", avgWeight: "1.18 kg" },
  { id: "B-2605", farm: "South Field", type: "Layer", placed: "21 Jun 2026", initial: 10500, current: 10120, age: "Completed", status: "Complete", avgWeight: "1.61 kg" },
  { id: "B-2604", farm: "Cedar Lane", type: "Country chicken", placed: "06 Jun 2026", initial: 6500, current: 0, age: "Completed", status: "Complete", avgWeight: "1.34 kg" },
];
const activitySeed = [
  { icon: "package-check", title: "Feed delivered", detail: "2,000 kg · North Meadow", time: "08:42" },
  { icon: "clipboard-check", title: "Daily log submitted", detail: "Orchard House · Meena Rao", time: "08:16" },
  { icon: "badge-indian-rupee", title: "Electricity bill added", detail: "₹12,450 · Riverbend", time: "Yesterday" },
];
const today = new Date();
const dateISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const dateReadable = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(today);
let farms = [];
let logs = [];
let customFields = [];
let transactions = [];
let workerPayments = [];
let activities = [];
let editingDailyLogId = null;
let deleteConfirmationResolver = null;
let activePage = "overview";
const pageContent = document.querySelector("#page-content");
const pageTitles = { overview: "Overview", farms: "Farms", batches: "Batches", "daily-log": "Daily log", attendance: "Attendance", cashbook: "Cashbook", care: "Chicken care", "team-access": "Team access" };
const rupees = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const number = (value) => new Intl.NumberFormat("en-IN").format(value || 0);
const farmById = (id) => farms.find((farm) => farm.id === id);
let supabaseClient = null;
let currentProfile = null;
let farmMemberships = [];
let profiles = [];
let createdCredentials = null;
function persist() { return Promise.resolve(); }
function setIcons() { if (window.lucide) window.lucide.createIcons(); }
function pageHeading(eyebrow, title, subtitle, actions = "") { return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`; }
function metric(label, value, note, icon, color, trend = "") { return `<article class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${color}"><i data-lucide="${icon}"></i></span></div><div class="metric-value">${value}</div><div class="metric-foot">${trend ? `<span class="${trend}">${trend === "positive" ? "↘" : "↗"} ${note}</span>` : `<span>${note}</span>`}</div></article>`; }
function farmTable(rows = farms.slice(0, 5)) { return `<div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>FARM</th><th>LIVE BIRDS</th><th>CAPACITY</th><th>FEED LEFT</th><th>LEADER</th><th>STATUS</th></tr></thead><tbody>${rows.map((farm) => `<tr><td><div class="farm-name"><span class="farm-symbol"><i data-lucide="warehouse"></i></span><span>${escapeHtml(farm.name)}<small>${escapeHtml(farm.id)} · ${escapeHtml(farm.type)}</small></span></div></td><td>${number(farm.birds)}</td><td>${number(farm.capacity)}</td><td>${number(farm.feedKg)} kg</td><td>${escapeHtml(farm.leader)}</td><td><span class="health-pill ${farm.health}">${farm.health === "good" ? "On track" : farm.health === "watch" ? "Watch" : "Attention"}</span></td></tr>`).join("")}</tbody></table></div>`; }
function renderOverview() {
  const birdCount = farms.reduce((sum, farm) => sum + farm.birds, 0);
  const totalCapacity = farms.reduce((sum, farm) => sum + farm.capacity, 0);
  const feedLeft = farms.reduce((sum, farm) => sum + farm.feedKg, 0);
  const deaths = logs.filter((log) => log.date === dateISO).reduce((sum, log) => sum + log.deaths, 0);
  const alertCount = farms.filter((farm) => farm.health === "alert").length;
  return `${pageHeading("WEDNESDAY, FARM OPERATIONS", "Good morning, Admin", "Here’s what’s happening across your farms today.", `<button class="outline-button" data-action="report"><i data-lucide="download"></i>Export report</button>`)}<div class="metrics-grid">${metric("Live birds", number(birdCount), `${farms.length} farms · ${number(totalCapacity)} total capacity`, "bird", "green")}${metric("Feed in stock", `${(feedLeft / 1000).toFixed(1)} t`, "Across all active farms", "wheat", "amber")}${metric("Deaths today", number(deaths), alertCount ? `${alertCount} farm needs attention` : "Within expected range", "heart-pulse", "coral", alertCount ? "negative" : "positive")}${metric("People present", `${people.filter((person) => person.attendance === "Present").length}/${people.length}`, "Attendance updated by leaders", "users-round", "blue")}</div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Farm status</h2><p class="panel-caption">Current flock, feed and assigned leader</p></div><button class="text-button" data-page-link="farms">All farms <i data-lucide="arrow-up-right"></i></button></div>${farmTable()}<div class="panel-footer"><span>Showing 5 of ${farms.length} farms</span><span>Updated just now</span></div></section><div class="side-stack"><section class="panel mortality-panel"><div class="panel-header"><div><h2 class="panel-title">Bird deaths</h2><p class="panel-caption">Last 7 days · all farms</p></div><button class="icon-button" aria-label="More options"><i data-lucide="ellipsis"></i></button></div><div class="mortality-content"><div class="mortality-big"><strong>${number(deaths)}</strong><span>birds recorded</span></div><div class="mortality-chart">${[32, 50, 39, 66, 42, 77, 46].map((height, index) => `<div class="bar-col"><div class="bar ${index === 5 ? "warning" : ""}" style="height:${height}%"></div><small>${["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"][index]}</small></div>`).join("")}</div><div class="chart-note"><span>Daily average</span><strong>${Math.round(deaths / 7)} birds</strong></div></div></section><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Recent activity</h2><p class="panel-caption">Latest farm updates</p></div><button class="text-button" data-page-link="daily-log">View logs <i data-lucide="arrow-up-right"></i></button></div><div class="activity-list">${activities.slice(0, 4).map((item) => `<div class="activity-row"><span class="activity-icon"><i data-lucide="${item.icon || "clipboard-list"}"></i></span><div class="activity-copy"><strong>${item.title}</strong><p>${item.detail}</p></div><span class="activity-time">${item.time}</span></div>`).join("")}</div></section></div></div><section class="panel full-panel"><div class="panel-header"><div><h2 class="panel-title">Batch performance</h2><p class="panel-caption">Compare active flocks by age and average weight</p></div><button class="text-button" data-page-link="batches">All batches <i data-lucide="arrow-up-right"></i></button></div><div class="section-content batch-grid">${batchSeed.slice(0, 2).map(batchCard).join("")}</div></section>`;
}
function farmCard(farm) { const occupancy = Math.round((farm.birds / farm.capacity) * 100); return `<article class="farm-card"><div class="farm-card-top"><span class="farm-symbol"><i data-lucide="warehouse"></i></span><div class="farm-card-actions"><span class="health-pill ${farm.health}">${farm.health === "good" ? "On track" : farm.health === "watch" ? "Watch" : "Attention"}</span><button class="icon-button" type="button" title="Edit ${escapeHtml(farm.name)}" aria-label="Edit ${escapeHtml(farm.name)}" data-farm-edit="${escapeHtml(farm.id)}"><i data-lucide="pencil"></i></button><button class="icon-button" type="button" title="Delete ${escapeHtml(farm.name)}" aria-label="Delete ${escapeHtml(farm.name)}" data-farm-delete="${escapeHtml(farm.id)}"><i data-lucide="trash-2"></i></button></div></div><h3>${escapeHtml(farm.name)}</h3><p>${escapeHtml(farm.id)} · ${escapeHtml(farm.type)} · ${escapeHtml(farm.batch)}</p><div class="farm-card-stats"><div><span>Live birds</span><strong>${number(farm.birds)}</strong></div><div><span>Capacity</span><strong>${number(farm.capacity)} <small>(${occupancy}%)</small></strong></div><div><span>Feed remaining</span><strong>${number(farm.feedKg)} kg</strong></div><div><span>Farm leader</span><strong>${escapeHtml(farm.leader)}</strong></div></div></article>`; }
function batchCard(batch) { const loss = Math.max(batch.initial - batch.current, 0); const rate = batch.initial ? ((loss / batch.initial) * 100).toFixed(1) : "0.0"; return `<article class="batch-card"><div class="batch-card-head"><div><h3>${escapeHtml(batch.id)} · ${escapeHtml(batch.farm)}</h3><p>${escapeHtml(batch.type)} · placed ${escapeHtml(batch.placed)}</p></div><span class="status-pill ${batch.status === "Active" ? "active" : "complete"}">${escapeHtml(batch.status)}</span></div><div class="batch-metrics"><div><small>Placed</small><strong>${number(batch.initial)}</strong></div><div><small>Birds left</small><strong>${number(batch.current)}</strong></div><div><small>Mortality rate</small><strong>${rate}%</strong></div><div><small>Age / status</small><strong>${escapeHtml(batch.age)}</strong></div><div><small>Average weight</small><strong>${escapeHtml(batch.avgWeight)}</strong></div><div><small>Farm type</small><strong>${escapeHtml(batch.type)}</strong></div></div></article>`; }
function renderFarms() { return `${pageHeading("FARM DIRECTORY", "Your farms", "Farm setup is managed by the Admin.", `<button class="primary-button" data-action="add-farm"><i data-lucide="plus"></i>Add farm</button>`)}<div class="farm-grid">${farms.map(farmCard).join("")}</div>`; }
function renderBatches() {
  const completed = batchSeed.filter((batch) => batch.status === "Complete").length;
  const initialCount = batchSeed.reduce((sum, batch) => sum + batch.initial, 0);
  const birdsLost = batchSeed.reduce((sum, batch) => sum + Math.max(batch.initial - batch.current, 0), 0);
  const weights = logs.map((log) => Number(log.weight)).filter((weight) => weight > 0);
  const averageWeight = weights.length ? `${(weights.reduce((sum, weight) => sum + weight, 0) / weights.length).toFixed(2)} kg` : "Not recorded";
  const mortality = initialCount ? `${((birdsLost / initialCount) * 100).toFixed(1)}%` : "0.0%";
  return `${pageHeading("FLOCK CYCLES", "Batch records", "Active batches and completed flock history, saved for comparison.", `<button class="outline-button" data-action="batch-compare"><i data-lucide="chart-no-axes-combined"></i>Compare batches</button>`)}<div class="metrics-grid">${metric("Active batches", batchSeed.length - completed, "Across current farms", "layers-3", "green")}${metric("Completed batches", completed, "History retained for reports", "archive", "blue")}${metric("Average mortality", mortality, "Across loaded batches", "heart-pulse", "coral")}${metric("Average logged weight", averageWeight, "From daily farm records", "scale", "amber")}</div><div class="batch-grid">${batchSeed.map(batchCard).join("") || `<section class="panel section-content">No batch records yet.</section>`}</div>`;
}
function renderDailyLogs() {
  const logRows = [...logs].reverse().map((log) => `<tr><td>${new Date(`${log.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><div class="farm-name"><span>${escapeHtml(log.farmName)}<small>${escapeHtml(log.batch)}</small></span></div></td><td>${number(log.deaths)}</td><td>${number(log.birdsSold || 0)}</td><td>${number(log.feedReceived)} kg</td><td>${number(log.feedUsed)} kg</td><td>${log.weight ? `${log.weight} kg` : "—"}</td><td>${escapeHtml(log.disease || "None reported")}</td><td>${escapeHtml(log.medicine || "—")}</td><td><div class="account-actions"><button class="outline-button" data-log-edit="${escapeHtml(log.id)}">Edit</button><button class="outline-button" data-log-delete="${escapeHtml(log.id)}" aria-label="Delete daily log">Delete</button></div></td></tr>`).join("");
  return `${pageHeading("DAILY OPERATIONS", "Daily farm logs", "Record flock health, feed, weight and other daily updates.", `<button class="primary-button" data-action="new-log"><i data-lucide="plus"></i>New daily log</button>`)}<section class="panel"><div class="panel-header"><div><h2 class="panel-title">Recent records</h2><p class="panel-caption">Farm and batch-level entries</p></div><div class="table-tools"><label class="search-field"><i data-lucide="search"></i><input id="log-search" placeholder="Search farm" /></label></div></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>DATE</th><th>FARM / BATCH</th><th>DEATHS</th><th>BIRDS SENT / SOLD</th><th>FEED IN</th><th>FEED USED</th><th>AVG WEIGHT</th><th>DISEASE</th><th>MEDICINE</th><th>ACTIONS</th></tr></thead><tbody id="log-table-body">${logRows || `<tr><td class="empty-row" colspan="10">No records yet. Add the first daily record.</td></tr>`}</tbody></table></div><div class="panel-footer"><span>${logs.length} records</span><span>Shared with your approved farm team</span></div></section>`;
}
function renderAttendance() { const rows = people.map((person, index) => `<tr><td><div class="farm-name"><span class="user-avatar" style="width:27px;height:27px;background:${index % 2 ? "#dceee2" : "#f4e2d4"};color:#3a5446">${person.name.split(" ").map((part) => part[0]).join("")}</span><span>${person.name}<small>${person.role}</small></span></div></td><td>${person.farm}</td><td class="attendance-status ${person.attendance === "Absent" ? "absent" : ""}">${person.attendance}</td><td>${rupees(person.pay)}</td><td><button class="outline-button attendance-toggle" data-person="${index}">${person.attendance === "Present" ? "Mark absent" : "Mark present"}</button></td></tr>`).join(""); const present = people.filter((person) => person.attendance === "Present").length; return `${pageHeading("PEOPLE & SHIFTS", "Attendance", "Bosses and Leaders record attendance; workers see only their own record.", `<button class="outline-button" data-action="attendance-report"><i data-lucide="download"></i>Export attendance</button>`)}<div class="metrics-grid">${metric("Present today", `${present}/${people.length}`, "Across assigned farms", "user-check", "green")}${metric("Absent today", people.length - present, "Review farm coverage", "user-x", "coral")}${metric("Workers", people.filter((person) => person.role === "Team").length, "Assigned to farm teams", "users-round", "blue")}${metric("Pay setup", "Per worker", "Daily / monthly / custom", "badge-indian-rupee", "amber")}</div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Today’s attendance</h2><p class="panel-caption">${dateReadable}</p></div><select class="table-select" aria-label="Filter by farm"><option>All farms</option>${farms.map((farm) => `<option>${farm.name}</option>`).join("")}</select></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>PERSON</th><th>FARM</th><th>STATUS</th><th>DAILY RATE</th><th>ACTION</th></tr></thead><tbody>${rows}</tbody></table></div><div class="panel-footer"><span>Attendance is shown as preview data</span><span>Admin controls individual access</span></div></section>`; }
function renderCashbook() { const income = transactions.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0); const expense = transactions.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0); const rows = [...transactions].reverse().map((entry) => `<tr><td>${new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><strong>${entry.title}</strong><small style="display:block;margin-top:4px;color:#8a958e;font-size:8px">${entry.category}</small></td><td>${entry.location}</td><td><span class="money-tag ${entry.kind}">${entry.kind === "income" ? "Money in" : "Money out"}</span></td><td class="${entry.kind === "income" ? "money-in" : "money-out"}" style="font-weight:700">${entry.kind === "income" ? "+" : "−"}${rupees(entry.amount)}</td></tr>`).join(""); return `${pageHeading("CENTRAL LEDGER", "Cashbook", "One ledger for all farms and home expenses. Admin, Boss and Leader access only.", `<button class="primary-button" data-action="cash-add"><i data-lucide="plus"></i>Add transaction</button>`)}<div class="cashbook-summary"><article class="cash-summary-card"><span>Total money in</span><strong class="money-in">${rupees(income)}</strong></article><article class="cash-summary-card"><span>Total money out</span><strong class="money-out">${rupees(expense)}</strong></article><article class="cash-summary-card"><span>Net movement</span><strong class="cash-net">${rupees(income - expense)}</strong></article></div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">All transactions</h2><p class="panel-caption">Farm and household entries together</p></div><div class="table-tools"><select class="table-select" id="cash-filter"><option value="all">All entries</option><option value="income">Money in</option><option value="expense">Money out</option><option value="Home">Home</option></select><button class="outline-button" data-action="cashbook-report"><i data-lucide="download"></i>Export</button></div></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>LOCATION</th><th>TYPE</th><th>AMOUNT</th></tr></thead><tbody id="cash-table-body">${rows}</tbody></table></div><div class="panel-footer"><span>${transactions.length} entries</span><span>One cashbook · ₹ INR</span></div></section>`; }
function renderCare() { return `${pageHeading("FLOCK HEALTH", "Chicken care guide", "A reference space for farm health questions and approved care information.", `<button class="outline-button" data-action="care-sources"><i data-lucide="book-open-check"></i>Care sources</button>`)}<div class="care-grid"><section class="care-intro"><p class="eyebrow">FARM ASSISTANT · PREVIEW</p><h2>Good records make better care decisions.</h2><p>Ask about common poultry care topics, or use the quick prompts below. This preview gives general guidance only and is not a veterinary diagnosis or medicine prescription.</p><div class="care-chips"><button class="care-chip" data-question="What should I check if birds are eating less?">Reduced feed intake</button><button class="care-chip" data-question="What information should I record when birds are sick?">Disease record checklist</button><button class="care-chip" data-question="What should I do in a heat stress situation?">Heat stress</button></div></section><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Before contacting a vet</h2><p class="panel-caption">Useful details to record</p></div></div><div class="guide-list"><div class="guide-item"><i data-lucide="thermometer"></i><div><strong>Observe and record</strong><p>Farm, batch, time noticed, bird count affected, symptoms, feed and water intake.</p></div></div><div class="guide-item"><i data-lucide="notebook-pen"></i><div><strong>Record any action</strong><p>Write down medicine name, dose as directed, time given and who administered it.</p></div></div><div class="guide-item"><i data-lucide="phone-call"></i><div><strong>Escalate quickly</strong><p>For sudden deaths, severe symptoms or fast spread, contact your poultry veterinarian promptly.</p></div></div></div></section></div><section class="panel chat-panel"><div class="panel-header"><div><h2 class="panel-title">Ask the care guide</h2><p class="panel-caption">Preview answers are general and do not replace veterinary advice.</p></div><span class="status-pill active">Preview</span></div><div class="chat-messages" id="chat-messages"><div class="chat-message">Hello. I can help you organize observations and share general poultry-care checks. For disease diagnosis or medicine decisions, contact your veterinarian.</div></div><form class="chat-input-row" id="chat-form"><input id="chat-input" placeholder="Ask about symptoms, feed or a farm situation..." aria-label="Ask chicken care question" /><button class="primary-button" aria-label="Send question"><i data-lucide="send"></i></button></form></section>`; }
function render() { if (activePage === "team-access" && currentProfile?.role !== "admin") activePage = "overview"; const renderers = { overview: renderOverview, farms: renderFarms, batches: renderBatches, "daily-log": renderDailyLogs, attendance: renderAttendanceSafe, cashbook: renderCashbookSafe, care: renderCare, "team-access": renderTeamAccess }; pageContent.innerHTML = (renderers[activePage] || renderOverview)(); document.querySelector("#breadcrumb-page").textContent = pageTitles[activePage] || "Overview"; document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.page === activePage)); const farmCount = document.querySelector(".nav-count"); if (farmCount) farmCount.textContent = farms.length; document.querySelector(".workspace-copy small").textContent = `${farms.length} farms · India`; setIcons(); }
function renderAttendanceSafe() {
  const rows = people.map((person, index) => {
    const initials = person.name.split(" ").map((part) => part[0]).join("");
    const canRecord = ["admin", "boss", "leader"].includes(currentProfile?.role) && person.farmId;
    const action = canRecord ? `<button class="outline-button attendance-toggle" data-person="${index}">${person.attendance === "Present" ? "Mark absent" : "Mark present"}</button>` : "—";
    return `<tr><td><div class="farm-name"><span class="user-avatar" style="width:27px;height:27px;background:${index % 2 ? "#dceee2" : "#f4e2d4"};color:#3a5446">${escapeHtml(initials)}</span><span>${escapeHtml(person.name)}<small>${escapeHtml(person.role)}</small></span></div></td><td>${escapeHtml(person.farm)}</td><td class="attendance-status ${person.attendance === "Absent" ? "absent" : ""}">${escapeHtml(person.attendance)}</td><td>${rupees(person.pay)}</td><td>${action}</td></tr>`;
  }).join("");
  const present = people.filter((person) => person.attendance === "Present").length;
  return `${pageHeading("PEOPLE & SHIFTS", "Attendance", "Bosses and Leaders record attendance; workers see only their own record.", `<button class="outline-button" data-action="attendance-report"><i data-lucide="download"></i>Export attendance</button>`)}<div class="metrics-grid">${metric("Present today", `${present}/${people.length}`, "Across assigned farms", "user-check", "green")}${metric("Absent today", people.filter((person) => person.attendance === "Absent").length, "Review farm coverage", "user-x", "coral")}${metric("Workers", people.filter((person) => person.role === "Team").length, "Assigned to farm teams", "users-round", "blue")}${metric("Pay setup", "Per worker", "Daily / monthly / custom", "badge-indian-rupee", "amber")}</div><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Today’s attendance</h2><p class="panel-caption">${dateReadable}</p></div><select class="table-select" aria-label="Filter by farm"><option>All farms</option>${farms.map((farm) => `<option>${escapeHtml(farm.name)}</option>`).join("")}</select></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>PERSON</th><th>FARM</th><th>STATUS</th><th>DAILY RATE</th><th>ACTION</th></tr></thead><tbody>${rows || `<tr><td class="empty-row" colspan="5">No attendance records yet.</td></tr>`}</tbody></table></div><div class="panel-footer"><span>Attendance records shared with your approved farm team</span><span>Admin controls individual access</span></div></section>`;
}
function renderCashbookSafe() {
  const income = transactions.filter((entry) => entry.kind === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = transactions.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  const workerPaidById = new Map();
  workerPayments.forEach((entry) => {
    workerPaidById.set(entry.person_id, (workerPaidById.get(entry.person_id) || 0) + Number(entry.amount));
  });
  const workerRows = profiles.filter((profile) => ["leader", "team"].includes(profile.role) && profile.approval_status === "approved")
    .sort((first, second) => first.display_name.localeCompare(second.display_name))
    .map((profile) => `<tr><td><strong>${escapeHtml(profile.display_name)}</strong></td><td>${escapeHtml(profile.role === "team" ? "Team" : "Leader")}</td><td class="money-out" style="font-weight:700">${rupees(workerPaidById.get(profile.id) || 0)}</td></tr>`).join("");
  const rows = renderCashbookRows(transactions);
  return `${pageHeading("CENTRAL LEDGER", "Cashbook", "One ledger for all farms and home expenses. Admin, Boss and Leader access only.", `<button class="primary-button" data-action="cash-add"><i data-lucide="plus"></i>Add transaction</button>`)}<div class="cashbook-summary"><article class="cash-summary-card"><span>Total money in</span><strong class="money-in">${rupees(income)}</strong></article><article class="cash-summary-card"><span>Total money out</span><strong class="money-out">${rupees(expense)}</strong></article><article class="cash-summary-card"><span>Net movement</span><strong class="cash-net">${rupees(income - expense)}</strong></article></div><section class="panel full-panel"><div class="panel-header"><div><h2 class="panel-title">Worker payments</h2><p class="panel-caption">Total money given to each approved worker, based on linked cashbook expenses</p></div></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>WORKER</th><th>ROLE</th><th>PAID TO DATE</th></tr></thead><tbody>${workerRows || `<tr><td class="empty-row" colspan="3">No approved workers found.</td></tr>`}</tbody></table></div></section><section class="panel full-panel"><div class="panel-header"><div><h2 class="panel-title">All transactions</h2><p class="panel-caption">Farm and household entries together</p></div><div class="table-tools"><select class="table-select" id="cash-filter"><option value="all">All entries</option><option value="income">Money in</option><option value="expense">Money out</option><option value="Home">Home</option></select><button class="outline-button" data-action="cashbook-report"><i data-lucide="download"></i>Export</button></div></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>WORKER</th><th>LOCATION</th><th>TYPE</th><th>AMOUNT</th><th>ACTIONS</th></tr></thead><tbody id="cash-table-body">${rows || `<tr><td class="empty-row" colspan="7">No cashbook entries yet.</td></tr>`}</tbody></table></div><div class="panel-footer"><span>${transactions.length} entries</span><span>One shared cashbook</span></div></section>`;
}
function renderCashbookRows(entries) {
  return [...entries].reverse().map((entry) => `<tr><td>${new Date(`${entry.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td><td><strong>${escapeHtml(entry.title)}</strong><small style="display:block;margin-top:4px;color:#8a958e;font-size:8px">${escapeHtml(entry.category)}</small></td><td>${entry.workerName ? escapeHtml(entry.workerName) : "—"}</td><td>${escapeHtml(entry.location)}</td><td><span class="money-tag ${entry.kind}">${entry.kind === "income" ? "Money in" : "Money out"}</span></td><td class="${entry.kind === "income" ? "money-in" : "money-out"}" style="font-weight:700">${entry.kind === "income" ? "+" : "-"}${rupees(entry.amount)}</td><td>${entry.sourceDailyLogId ? `<button class="outline-button" data-page-link="daily-log" title="Edit this entry through its daily log">Daily log</button>` : `<div class="account-actions"><button class="outline-button" data-cash-edit="${escapeHtml(entry.id)}">Edit</button><button class="outline-button" data-cash-delete="${escapeHtml(entry.id)}">Delete</button></div>`}</td></tr>`).join("") || `<tr><td class="empty-row" colspan="7">No matching entries.</td></tr>`;
}
function toast(message, warning = false) { const element = document.querySelector("#toast"); element.textContent = message; element.classList.toggle("warning", warning); element.classList.add("show"); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => element.classList.remove("show"), 3300); }
function confirmPermanentDelete(title, message) {
  if (deleteConfirmationResolver) return Promise.resolve(false);
  document.querySelector("#delete-confirm-title").textContent = title;
  document.querySelector("#delete-confirm-message").textContent = message;
  const backdrop = document.querySelector("#delete-confirm-backdrop");
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  setIcons();
  document.querySelector("#cancel-permanent-delete").focus();
  return new Promise((resolve) => { deleteConfirmationResolver = resolve; });
}
function closePermanentDelete(confirmed) {
  if (!deleteConfirmationResolver) return;
  const resolve = deleteConfirmationResolver;
  deleteConfirmationResolver = null;
  document.querySelector("#delete-confirm-backdrop").hidden = true;
  document.body.style.overflow = "";
  resolve(confirmed);
}
function updateLogBatchOptions() {
  const farm = farmById(document.querySelector("#log-farm").value);
  const batches = batchSeed.filter((batch) => batch.farmId === farm?.dbId && batch.status === "Active");
  document.querySelector("#log-batch").innerHTML = `<option value="">Current batch</option>${batches.map((batch) => `<option value="${escapeHtml(batch.id)}">${escapeHtml(batch.id)}</option>`).join("")}`;
}
function openModal(logId = "") {
  const form = document.querySelector("#daily-log-form");
  form.reset();
  editingDailyLogId = logId;
  const log = logs.find((item) => item.id === logId);
  const farmSelect = document.querySelector("#log-farm");
  farmSelect.innerHTML = farms.map((farm) => `<option value="${farm.id}">${escapeHtml(farm.name)} · ${escapeHtml(farm.type)}</option>`).join("");
  farmSelect.value = log?.farmCode || farms[0]?.id || "";
  updateLogBatchOptions();
  renderCustomFields();
  if (log?.batchDbId && ![...document.querySelector("#log-batch").options].some((option) => option.value === log.batchDbId)) {
    document.querySelector("#log-batch").insertAdjacentHTML("beforeend", `<option value="${escapeHtml(log.batchDbId)}">${escapeHtml(log.batch)}</option>`);
  }
  if (log) {
    form.elements.logId.value = log.id;
    document.querySelector("#log-batch").value = log.batchDbId || "";
    document.querySelector("#log-date").value = log.date;
    form.elements.deaths.value = log.deaths;
    form.elements.weight.value = log.weight || "";
    form.elements.birdsSold.value = log.birdsSold || 0;
    form.elements.saleIncome.value = log.saleIncome;
    form.elements.feedReceived.value = log.feedReceivedKg;
    form.elements.feedBags.value = log.feedReceivedBags;
    form.elements.bagWeight.value = log.feedBagWeight;
    form.elements.feedUsed.value = log.feedUsed;
    form.elements.disease.value = log.disease;
    form.elements.medicine.value = log.medicine;
    form.elements.expense.value = log.expense;
    form.elements.expenseNote.value = log.expenseNote;
    form.elements.notes.value = log.notes;
    form.elements.emergency.checked = log.emergency;
    form.elements.emergencyReason.value = log.emergencyReason;
    document.querySelector("#emergency-reason-field").hidden = !log.emergency;
    document.querySelector("#emergency-reason-field input").required = log.emergency;
    customFields.forEach((field, index) => {
      const input = form.elements[`custom-${index}`];
      if (input) input.value = log.customData[field] || "";
    });
    farmSelect.disabled = true;
    document.querySelector("#log-batch").disabled = true;
  } else {
    form.elements.logId.value = "";
    document.querySelector("#log-date").value = dateISO;
    farmSelect.disabled = false;
    document.querySelector("#log-batch").disabled = false;
    document.querySelector("#emergency-reason-field").hidden = true;
    document.querySelector("#emergency-reason-field input").required = false;
  }
  document.querySelector("#modal-title").textContent = log ? "Edit daily log" : "New daily log";
  document.querySelector("#modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  setIcons();
}
function openFarmModal(farmId = "") {
  const farm = farmId ? farmById(farmId) : null;
  const form = document.querySelector("#farm-form");
  form.reset();
  form.elements.farmId.value = farm?.id || "";
  form.elements.name.value = farm?.name || "";
  form.elements.type.value = farm?.type || "";
  form.elements.batch.value = farm?.batch || "";
  form.elements.capacity.value = farm?.capacity || "";
  form.elements.birds.value = farm?.birds ?? "";
  form.elements.feedKg.value = farm?.feedKg ?? 0;
  form.elements.leader.value = farm?.leader || "Unassigned";
  document.querySelector("#farm-modal-title").textContent = farm ? `Edit ${farm.name}` : "Add farm";
  document.querySelector("#farm-modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeFarmModal() {
  document.querySelector("#farm-modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  document.querySelector("#farm-form").reset();
}
function closeModal() { document.querySelector("#modal-backdrop").hidden = true; document.body.style.overflow = ""; document.querySelector("#daily-log-form").reset(); document.querySelector("#log-farm").disabled = false; document.querySelector("#log-batch").disabled = false; document.querySelector("#emergency-reason-field").hidden = true; document.querySelector("#emergency-reason-field input").required = false; editingDailyLogId = null; }
function addExpenseTransaction(farm, amount, date, note) { if (!amount || amount <= 0) return; transactions.push({ id: `TX-${Date.now()}`, date, title: note || "Daily farm expense", location: farm.name, kind: "expense", amount, category: "Other farm expense" }); }
document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", (event) => { event.preventDefault(); activePage = item.dataset.page; render(); document.querySelector("#sidebar").classList.remove("open"); window.location.hash = activePage; }));
document.addEventListener("click", (event) => { const farmEdit = event.target.closest("[data-farm-edit]"); if (farmEdit) { openFarmModal(farmEdit.dataset.farmEdit); return; } const pageLink = event.target.closest("[data-page-link]"); if (pageLink) { activePage = pageLink.dataset.pageLink; render(); window.location.hash = activePage; return; } const action = event.target.closest("[data-action]")?.dataset.action; if (!action) return; if (action === "new-log") openModal(); if (action === "add-farm") openFarmModal(); if (action === "cash-add") openCashbookModal(); if (action === "batch-compare") toast("Batch comparisons will use saved flock, feed, mortality and weight records."); if (action === "report" || action === "attendance-report" || action === "cashbook-report") window.print(); if (action === "care-sources") toast("Care sources can be added by Admin when the approved vet guide is available."); });
document.querySelector("#new-log-button").addEventListener("click", openModal);
document.querySelector("#log-farm").addEventListener("change", updateLogBatchOptions);
document.querySelector("#custom-field-add").addEventListener("click", addCustomField);
document.querySelector('input[name="emergency"]').addEventListener("change", (event) => {
  const reasonField = document.querySelector("#emergency-reason-field");
  reasonField.hidden = !event.target.checked;
  reasonField.querySelector("input").required = event.target.checked;
});
document.querySelector("#close-farm-modal").addEventListener("click", closeFarmModal);
document.querySelector("#cancel-farm-modal").addEventListener("click", closeFarmModal);
document.querySelector("#farm-modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "farm-modal-backdrop") closeFarmModal(); });
document.querySelector("#close-cash-modal").addEventListener("click", closeCashbookModal);
document.querySelector("#cancel-cash-modal").addEventListener("click", closeCashbookModal);
document.querySelector("#cash-modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "cash-modal-backdrop") closeCashbookModal(); });
document.querySelector("#cancel-permanent-delete").addEventListener("click", () => closePermanentDelete(false));
document.querySelector("#confirm-permanent-delete").addEventListener("click", () => closePermanentDelete(true));
document.querySelector("#delete-confirm-backdrop").addEventListener("click", (event) => { if (event.target.id === "delete-confirm-backdrop") closePermanentDelete(false); });
document.querySelector("#cash-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const kind = String(data.get("kind"));
  const amount = Number(data.get("amount"));
  const location = String(data.get("location"));
  const title = String(data.get("title")).trim();
  const workerId = String(data.get("workerId") || "");
  const transactionId = String(data.get("transactionId") || "");
  const farm = location === "home" ? null : farms.find((item) => item.id === location);
  if (!["income", "expense"].includes(kind) || !Number.isFinite(amount) || amount <= 0 || !title || (location !== "home" && !farm)) {
    toast("Check the transaction type, amount, location, and description.", true);
    return;
  }
  if (transactionId && transactions.find((entry) => entry.id === transactionId)?.sourceDailyLogId) {
    toast("Edit this transaction through its linked daily log.", true);
    return;
  }
  if (workerId && (kind !== "expense" || !profiles.some((profile) => profile.id === workerId && ["leader", "team"].includes(profile.role) && profile.approval_status === "approved"))) {
    toast("Worker payments must be recorded as an expense for an approved worker.", true);
    return;
  }
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const payload = {
      scope: farm ? "farm" : "home",
      farm_id: farm?.dbId || null,
      person_id: workerId || null,
      entry_type: kind,
      category: workerId ? "Worker payment" : location === "home" ? "Home" : kind === "income" ? "Sales" : "Other farm expense",
      description: title,
      amount,
      entry_date: String(data.get("date")),
    };
    const result = transactionId
      ? await supabaseClient.from("cashbook_entries").update(payload).eq("id", transactionId)
      : await supabaseClient.from("cashbook_entries").insert({ ...payload, recorded_by: currentProfile.id });
    const { error } = result;
    if (error) throw error;
    await loadCloudData();
    closeCashbookModal();
    activePage = "cashbook";
    render();
    window.location.hash = activePage;
    toast(transactionId ? "Cashbook transaction updated." : workerId ? "Worker payment saved to the cashbook." : "Cashbook entry saved to the shared ledger.");
  } catch (error) {
    toast(`Could not save cashbook entry: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});
document.addEventListener("click", async (event) => {
  const cashEdit = event.target.closest("[data-cash-edit]");
  if (cashEdit) {
    editCashbookTransaction(cashEdit.dataset.cashEdit);
    return;
  }
  const cashDelete = event.target.closest("[data-cash-delete]");
  if (cashDelete) {
    const entry = transactions.find((item) => item.id === cashDelete.dataset.cashDelete);
    if (!entry || entry.sourceDailyLogId) return toast("Edit or delete this transaction through its linked daily log.", true);
    if (!await confirmPermanentDelete("Delete transaction permanently?", `Delete "${entry.title}" for ${rupees(entry.amount)}? This transaction will be permanently removed and cannot be recovered.`)) return;
    cashDelete.disabled = true;
    try {
      const { error } = await supabaseClient.from("cashbook_entries").delete().eq("id", entry.id);
      if (error) throw error;
      await loadCloudData();
      render();
      toast("Cashbook transaction deleted.");
    } catch (error) {
      toast(`Could not delete cashbook transaction: ${error.message}`, true);
    } finally {
      cashDelete.disabled = false;
    }
    return;
  }
  const logEdit = event.target.closest("[data-log-edit]");
  if (logEdit) {
    openModal(logEdit.dataset.logEdit);
    return;
  }
  const logDelete = event.target.closest("[data-log-delete]");
  if (logDelete) {
    const log = logs.find((item) => item.id === logDelete.dataset.logDelete);
    if (!log) return toast("Daily log not found. Refresh and try again.", true);
    if (!await confirmPermanentDelete("Delete daily log permanently?", `Delete the ${log.date} log for ${log.farmName}? Farm bird and feed totals will be restored, and its linked cashbook entries will also be deleted. This cannot be undone.`)) return;
    logDelete.disabled = true;
    try {
      const { error } = await supabaseClient.rpc("delete_daily_log", { p_log_id: log.id });
      if (error) throw error;
      await loadCloudData();
      render();
      toast("Daily log deleted and linked farm balances restored.");
    } catch (error) {
      toast(`Could not delete daily log: ${error.message}`, true);
    } finally {
      logDelete.disabled = false;
    }
    return;
  }
  const farmDelete = event.target.closest("[data-farm-delete]");
  if (farmDelete) {
    if (currentProfile?.role !== "admin") return toast("Only an Admin can delete a farm.", true);
    const farm = farmById(farmDelete.dataset.farmDelete);
    if (!farm) return toast("Farm not found. Refresh and try again.", true);
    if (farm.birds > 0 || farm.feedKg > 0 || farm.batch !== "No active batch") {
      return toast("Empty the farm and remove its active batch before deleting it.", true);
    }
    if (!await confirmPermanentDelete("Delete farm permanently?", `Delete "${farm.name}"? This is allowed only when no batches, daily logs, attendance, or cashbook entries are linked to the farm. This cannot be undone.`)) return;
    farmDelete.disabled = true;
    try {
      const { error } = await supabaseClient.from("farms").delete().eq("id", farm.dbId);
      if (error) throw error;
      await loadCloudData();
      activePage = "farms";
      render();
      toast("Farm deleted.");
    } catch (error) {
      toast(`Could not delete farm: ${error.message}`, true);
    } finally {
      farmDelete.disabled = false;
    }
  }
});
document.querySelector("#farm-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const farmId = String(data.get("farmId"));
  const capacity = Number(data.get("capacity"));
  const birds = Number(data.get("birds"));
  const feedKg = Number(data.get("feedKg"));
  if (capacity < 1 || birds < 0 || birds > capacity || feedKg < 0) {
    toast("Check the capacity, bird count, and feed amount.", true);
    return;
  }
  const details = {
    name: String(data.get("name")).trim(),
    type: String(data.get("type")).trim(),
    batch: String(data.get("batch")).trim() || "No active batch",
    capacity,
    birds,
    feedKg,
    leader: String(data.get("leader")).trim(),
  };
  if (currentProfile?.role !== "admin") return toast("Only an Admin can change farm setup.", true);
  const existingFarm = farmId ? farmById(farmId) : null;
  if (details.batch !== "No active batch" && birds < 1) return toast("An active batch needs at least one bird.", true);
  const nextNumber = farms.reduce((max, farm) => Math.max(max, Number(farm.id.replace("F-", "")) || 0), 0) + 1;
  const farmCode = existingFarm?.id || `F-${String(nextNumber).padStart(2, "0")}`;
  const selectedExistingBatch = existingFarm?.dbId ? batchSeed.find((batch) => batch.farmId === existingFarm.dbId && batch.id === details.batch) : null;
  if (selectedExistingBatch && birds > selectedExistingBatch.initial) return toast("Bird count cannot exceed this batch's initial population. Create a new batch instead.", true);
  const leaderName = details.leader || "Unassigned";
  const selectedLeader = people.find((person) => person.role === "Leader" && person.approvalStatus === "approved" && person.name.toLowerCase() === leaderName.toLowerCase());
  if (leaderName !== "Unassigned" && !selectedLeader) return toast("Assigned Leader must match an approved Leader account.", true);
  const payload = {
    farm_code: farmCode,
    name: details.name,
    chicken_type: details.type,
    capacity,
    current_birds: birds,
    feed_stock_kg: feedKg,
    active_batch_code: details.batch === "No active batch" ? null : details.batch,
    health_status: existingFarm?.health || "good",
    created_by: currentProfile.id,
    updated_at: new Date().toISOString(),
  };
  if (existingFarm?.dbId) payload.id = existingFarm.dbId;
  (async () => {
    const { data: savedFarm, error } = await supabaseClient.from("farms").upsert(payload, { onConflict: "farm_code" }).select("id").single();
    if (error) throw error;
    const previousBatch = existingFarm?.dbId ? batchSeed.find((batch) => batch.farmId === existingFarm.dbId && batch.status === "Active") : null;
    if (previousBatch && previousBatch.id !== details.batch) {
      const { error: completeError } = await supabaseClient.from("batches").update({ status: "completed", completed_on: dateISO }).eq("id", previousBatch.dbId);
      if (completeError) throw completeError;
    }
    if (details.batch !== "No active batch") {
      const matchingBatch = batchSeed.find((batch) => batch.farmId === savedFarm.id && batch.id === details.batch);
      if (matchingBatch?.status === "Complete") throw new Error("Batch codes cannot be reused after completion.");
      if (matchingBatch) {
        const { error: batchUpdateError } = await supabaseClient.from("batches").update({ current_birds: birds, chicken_type: details.type }).eq("id", matchingBatch.dbId);
        if (batchUpdateError) throw batchUpdateError;
      } else {
        const { error: batchError } = await supabaseClient.from("batches").insert({
          farm_id: savedFarm.id,
          batch_code: details.batch,
          chicken_type: details.type,
          status: "active",
          placed_on: dateISO,
          initial_birds: birds,
          current_birds: birds,
          created_by: currentProfile.id,
        });
        if (batchError) throw batchError;
      }
    }
    const oldLeaderIds = farmMemberships.filter((membership) => membership.farm_id === savedFarm.id && people.some((person) => person.id === membership.user_id && person.role === "Leader")).map((membership) => membership.user_id);
    if (oldLeaderIds.length) {
      const { error: removeError } = await supabaseClient.from("farm_memberships").delete().eq("farm_id", savedFarm.id).in("user_id", oldLeaderIds);
      if (removeError) throw removeError;
    }
    if (selectedLeader) {
      const { error: assignError } = await supabaseClient.from("farm_memberships").upsert({ farm_id: savedFarm.id, user_id: selectedLeader.id, assigned_by: currentProfile.id }, { onConflict: "farm_id,user_id" });
      if (assignError) throw assignError;
    }
    await loadCloudData();
    closeFarmModal();
    activePage = "farms";
    render();
    window.location.hash = activePage;
    toast(existingFarm ? "Farm setup updated." : "Farm added.");
  })().catch((error) => toast(`Could not save farm: ${error.message}`, true));
});
document.querySelector("#close-modal").addEventListener("click", closeModal);
document.querySelector("#cancel-modal").addEventListener("click", closeModal);
document.querySelector("#modal-backdrop").addEventListener("click", (event) => { if (event.target.id === "modal-backdrop") closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key !== "Escape") return; if (!document.querySelector("#delete-confirm-backdrop").hidden) closePermanentDelete(false); else if (!document.querySelector("#cash-modal-backdrop").hidden) closeCashbookModal(); else if (!document.querySelector("#farm-modal-backdrop").hidden) closeFarmModal(); else if (!document.querySelector("#modal-backdrop").hidden) closeModal(); });
document.querySelector("#daily-log-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const existingLog = logs.find((log) => log.id === String(data.get("logId")));
  const farm = farmById(data.get("farmId") || existingLog?.farmCode);
  const deaths = Math.max(0, Number(data.get("deaths")) || 0);
  const birdsSold = Math.max(0, Number(data.get("birdsSold")) || 0);
  const saleIncome = Math.max(0, Number(data.get("saleIncome")) || 0);
  const receivedKg = Math.max(0, Number(data.get("feedReceived")) || 0);
  const receivedBags = Math.max(0, Number(data.get("feedBags")) || 0);
  const bagWeight = Math.max(0.1, Number(data.get("bagWeight")) || 50);
  const feedReceived = receivedKg + receivedBags * bagWeight;
  const feedUsed = Math.max(0, Number(data.get("feedUsed")) || 0);
  const restoredBirds = existingLog ? existingLog.deaths + existingLog.birdsSold : 0;
  const restoredFeed = existingLog ? existingLog.feedReceivedKg + existingLog.feedReceivedBags * existingLog.feedBagWeight - existingLog.feedUsed : 0;
  if (deaths + birdsSold > farm.birds + restoredBirds) { toast("Deaths and birds sent/sold cannot exceed the current flock count.", true); return; }
  if (feedUsed > farm.feedKg - restoredFeed + feedReceived) { toast("Feed used cannot exceed the available feed after this delivery.", true); return; }
  const customData = Object.fromEntries(customFields.map((field, index) => [field, String(data.get(`custom-${index}`) || "").trim()]));
  const emergency = data.get("emergency") === "on";
  const emergencyReason = String(data.get("emergencyReason") || "").trim();
  if (emergency && !emergencyReason) return toast("Add a reason for the emergency exception.", true);
  const selectedBatch = existingLog
    ? batchSeed.find((batch) => batch.dbId === existingLog.batchDbId)
    : batchSeed.find((batch) => batch.farmId === farm.dbId && batch.status === "Active" && (batch.id === String(data.get("batch")) || batch.id === farm.batch));
  try {
    const logValues = {
      p_recorded_on: String(data.get("date")),
      p_deaths: deaths,
      p_birds_sent: birdsSold,
      p_sale_income: saleIncome,
      p_feed_received_kg: receivedKg,
      p_feed_received_bags: receivedBags,
      p_feed_bag_weight_kg: bagWeight,
      p_feed_used_kg: feedUsed,
      p_average_weight_kg: Number(data.get("weight")) || null,
      p_disease_or_symptoms: String(data.get("disease")).trim(),
      p_medicine_given: String(data.get("medicine")).trim(),
      p_other_expense: Number(data.get("expense")) || 0,
      p_expense_note: String(data.get("expenseNote")).trim(),
      p_notes: String(data.get("notes")).trim(),
      p_custom_values: customData,
      p_emergency_type_override: emergency,
      p_emergency_reason: emergencyReason,
    };
    const { error } = existingLog
      ? await supabaseClient.rpc("update_daily_log", { p_log_id: existingLog.id, ...logValues })
      : await supabaseClient.rpc("record_daily_log", {
        p_farm_id: farm.dbId,
        p_batch_id: selectedBatch?.dbId || null,
        ...logValues,
      });
    if (error) throw error;
    await loadCloudData();
    closeModal();
    activePage = "daily-log";
    render();
    window.location.hash = activePage;
    toast(existingLog ? "Daily log updated and farm balances recalculated." : "Daily log saved to the shared farm records.");
  } catch (error) {
    toast(`Could not save daily log: ${error.message}`, true);
  }
});
function openCashbookModal() {
  const form = document.querySelector("#cash-form");
  form.reset();
  form.elements.location.innerHTML = `<option value="home">Home</option>${farms.map((farm) => `<option value="${farm.id}">${escapeHtml(farm.name)}</option>`).join("")}`;
  const workers = profiles.filter((profile) => ["leader", "team"].includes(profile.role) && profile.approval_status === "approved");
  form.elements.workerId.innerHTML = `<option value="">No worker linked</option>${workers.map((worker) => `<option value="${worker.id}">${escapeHtml(worker.display_name)} · ${worker.role === "team" ? "Team" : "Leader"}</option>`).join("")}`;
  form.elements.transactionId.value = "";
  form.elements.date.value = dateISO;
  document.querySelector("#cash-modal-title").textContent = "Add transaction";
  document.querySelector("#cash-modal-backdrop").hidden = false;
  document.body.style.overflow = "hidden";
  setIcons();
}
function editCashbookTransaction(transactionId) {
  const entry = transactions.find((item) => item.id === transactionId);
  if (!entry) return toast("Cashbook transaction not found. Refresh and try again.", true);
  if (entry.sourceDailyLogId) return toast("Edit this transaction through its linked daily log.", true);
  openCashbookModal();
  const form = document.querySelector("#cash-form");
  form.elements.transactionId.value = entry.id;
  form.elements.kind.value = entry.kind;
  form.elements.amount.value = entry.amount;
  form.elements.date.value = entry.date;
  form.elements.location.value = entry.farmId ? farms.find((farm) => farm.dbId === entry.farmId)?.id || "home" : "home";
  form.elements.workerId.value = entry.personId || "";
  form.elements.title.value = entry.title;
  document.querySelector("#cash-modal-title").textContent = "Edit transaction";
}
function closeCashbookModal() {
  document.querySelector("#cash-modal-backdrop").hidden = true;
  document.body.style.overflow = "";
  document.querySelector("#cash-form").reset();
}
function renderCustomFields() {
  document.querySelector("#custom-fields").innerHTML = customFields.map((field, index) => `<label class="field">${escapeHtml(field)}<input name="custom-${index}" type="text" /></label>`).join("");
}
function addCustomField() {
  if (document.querySelector("#custom-field-name")) return;
  document.querySelector("#custom-fields").insertAdjacentHTML("beforeend", `<label class="field field-wide" id="custom-field-editor">New field name<input id="custom-field-name" type="text" placeholder="For example, water intake" /></label><button class="outline-button field-wide" id="custom-field-save" type="button">Save field</button>`);
}
function saveCustomField() {
  const name = document.querySelector("#custom-field-name")?.value.trim();
  if (!name) return toast("Enter a name for the new field.", true);
  if (customFields.some((field) => field.toLowerCase() === name.toLowerCase())) return toast("That field already exists.", true);
  customFields.push(name);
  persist();
  renderCustomFields();
  toast(`Added “${name}” to future daily logs.`);
}
document.addEventListener("click", (event) => {
  if (event.target.closest("#custom-field-save")) saveCustomField();
});
document.addEventListener("submit", async (event) => {
  if (event.target.id !== "account-form") return;
  event.preventDefault();
  const values = new FormData(event.target);
  const submit = event.target.querySelector("button[type=submit]");
  submit.disabled = true;
  try {
    const { data, error } = await supabaseClient.functions.invoke("create-user", {
      body: {
        loginId: String(values.get("loginId")),
        displayName: String(values.get("displayName")),
        role: String(values.get("role")),
        farmIds: values.getAll("farmIds"),
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    createdCredentials = data;
    await loadCloudData();
    render();
    toast("Account created. Give the temporary password to the account holder securely.");
  } catch (error) {
    toast(`Could not create account: ${error.message}`, true);
  } finally {
    submit.disabled = false;
  }
});
document.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-profile-action]");
  if (actionButton) {
    const profileId = actionButton.dataset.profileId;
    const status = actionButton.dataset.profileAction;
    const { error } = await supabaseClient.from("profiles").update({ approval_status: status }).eq("id", profileId);
    if (error) return toast(`Could not update account: ${error.message}`, true);
    await loadCloudData();
    render();
    toast(`Account ${status}.`);
    return;
  }
  if (event.target.closest("#copy-temp-password")) {
    try {
      await navigator.clipboard.writeText(createdCredentials?.temporaryPassword || "");
      toast("Temporary password copied.");
    } catch {
      toast("Clipboard access is unavailable in this browser.", true);
    }
  }
});
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".attendance-toggle");
  if (!button) return;
  const person = people[Number(button.dataset.person)];
  if (!person?.farmId) return toast("This worker needs a farm assignment before attendance can be recorded.", true);
  const status = person.attendance === "Present" ? "absent" : "present";
  const { error } = await supabaseClient.from("attendance").upsert({
    farm_id: person.farmId,
    worker_id: person.id,
    work_date: dateISO,
    status,
    wage_rate: person.pay,
    amount_paid: 0,
    recorded_by: currentProfile.id,
  }, { onConflict: "farm_id,worker_id,work_date" });
  if (error) return toast(`Could not save attendance: ${error.message}`, true);
  await loadCloudData();
  activePage = "attendance";
  render();
  window.location.hash = activePage;
  toast(`${person.name}: marked ${status}.`);
});
document.addEventListener("change", (event) => {
  if (event.target.id !== "cash-filter") return;
  const filter = event.target.value;
  const filtered = transactions.filter((entry) => filter === "all" || entry.kind === filter || entry.location === filter);
  const body = document.querySelector("#cash-table-body");
  if (body) body.innerHTML = renderCashbookRows(filtered);
});
document.addEventListener("click", (event) => { const chip = event.target.closest(".care-chip"); if (chip) sendCareQuestion(chip.dataset.question); });
document.addEventListener("submit", (event) => { if (event.target.id !== "chat-form") return; event.preventDefault(); const input = document.querySelector("#chat-input"); const question = input.value.trim(); if (question) sendCareQuestion(question); });
function sendCareQuestion(question) { const messages = document.querySelector("#chat-messages"); if (!messages) return; messages.insertAdjacentHTML("beforeend", `<div class="chat-message user">${escapeHtml(question)}</div><div class="chat-message">For this concern, record the farm and batch, time noticed, number of birds affected, visible signs, feed and water intake, recent deaths, and any medicines given. For sudden deaths, severe symptoms or fast spread, contact your poultry veterinarian promptly. This preview cannot diagnose disease or recommend a medicine.</div>`); document.querySelector("#chat-input").value = ""; messages.scrollTop = messages.scrollHeight; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
document.querySelector("#menu-toggle").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.querySelector("#today-label").textContent = dateReadable;
window.addEventListener("hashchange", () => {
  const requestedPage = window.location.hash.slice(1);
  if (!pageTitles[requestedPage]) return;
  activePage = requestedPage;
  render();
});
if (window.location.hash) { const requestedPage = window.location.hash.slice(1); if (pageTitles[requestedPage]) activePage = requestedPage; }
function showAuthMessage(message, isError = true) {
  const output = document.querySelector("#auth-message");
  if (output) {
    output.textContent = message;
    output.classList.toggle("success", !isError);
  }
}
function showPendingState(message) {
  const screen = document.querySelector("#auth-screen");
  screen.innerHTML = `<div class="auth-panel"><span class="brand-mark"><i data-lucide="hourglass"></i></span><p class="eyebrow">ACCOUNT REVIEW</p><h1>Waiting for Admin</h1><p class="auth-copy">${escapeHtml(message)}</p><button class="secondary-button" id="pending-signout" type="button">Sign out</button></div>`;
  screen.hidden = false;
  document.querySelector(".app-shell").hidden = true;
  setIcons();
  document.querySelector("#pending-signout").addEventListener("click", async () => { await supabaseClient.auth.signOut(); window.location.reload(); });
}
async function loadCloudData() {
  const [queries, allWorkerPayments] = await Promise.all([Promise.all([
    supabaseClient.from("farms").select("*"),
    supabaseClient.from("profiles").select("id, display_name, login_id, role, approval_status, must_change_password"),
    supabaseClient.from("farm_memberships").select("farm_id, user_id"),
    supabaseClient.from("batches").select("*"),
    supabaseClient.from("daily_logs").select("*").order("recorded_on", { ascending: false }).limit(300),
    supabaseClient.from("attendance").select("*").eq("work_date", dateISO),
    supabaseClient.from("cashbook_entries").select("*").order("entry_date", { ascending: false }).limit(500),
  ]), loadAllWorkerPayments()]);
  const error = queries.find((result) => result.error)?.error;
  if (error) throw error;
  workerPayments = allWorkerPayments;
  const [farmResult, profileResult, membershipResult, batchResult, logResult, attendanceResult, cashbookResult] = queries;
  profiles = profileResult.data;
  farmMemberships = membershipResult.data;
  const profileById = new Map(profileResult.data.map((profile) => [profile.id, profile]));
  const membershipByFarm = new Map();
  membershipResult.data.forEach((membership) => {
    const members = membershipByFarm.get(membership.farm_id) || [];
    members.push(membership.user_id);
    membershipByFarm.set(membership.farm_id, members);
  });
  const farmByDbId = new Map(farmResult.data.map((farm) => [farm.id, farm]));
  farms = farmResult.data.map((farm) => {
    const leaderId = (membershipByFarm.get(farm.id) || []).find((id) => profileById.get(id)?.role === "leader");
    return { id: farm.farm_code, dbId: farm.id, name: farm.name, type: farm.chicken_type, capacity: farm.capacity, birds: farm.current_birds, feedKg: Number(farm.feed_stock_kg), batch: farm.active_batch_code || "No active batch", health: farm.health_status, leader: profileById.get(leaderId)?.display_name || "Unassigned" };
  });
  const farmNameById = new Map(farmResult.data.map((farm) => [farm.id, farm.name]));
  batchSeed = batchResult.data.map((batch) => ({ id: batch.batch_code, dbId: batch.id, farmId: batch.farm_id, farm: farmNameById.get(batch.farm_id) || "Farm", type: batch.chicken_type, placed: batch.placed_on, initial: batch.initial_birds, current: batch.current_birds, age: batch.completed_on || batch.placed_on, status: batch.status === "active" ? "Active" : "Complete", avgWeight: "Not recorded" }));
  logs = logResult.data.map((log) => ({ id: log.id, farmId: farmResult.data.find((farm) => farm.id === log.farm_id)?.farm_code, farmCode: farmResult.data.find((farm) => farm.id === log.farm_id)?.farm_code, farmName: farmNameById.get(log.farm_id) || "Farm", batchDbId: log.batch_id, batch: batchResult.data.find((batch) => batch.id === log.batch_id)?.batch_code || "Current batch", date: log.recorded_on, deaths: log.deaths, birdsSold: log.birds_sent, saleIncome: Number(log.sale_income), feedReceivedKg: Number(log.feed_received_kg), feedReceivedBags: Number(log.feed_received_bags), feedBagWeight: Number(log.feed_bag_weight_kg), feedReceived: Number(log.feed_received_kg) + Number(log.feed_received_bags) * Number(log.feed_bag_weight_kg), feedUsed: Number(log.feed_used_kg), weight: Number(log.average_weight_kg) || 0, disease: log.disease_or_symptoms || "", medicine: log.medicine_given || "", expense: Number(log.other_expense), expenseNote: log.expense_note || "", notes: log.notes || "", customData: log.custom_values || {}, emergency: log.emergency_type_override, emergencyReason: log.emergency_reason || "" }));
  const attendanceByPerson = new Map(attendanceResult.data.map((record) => [`${record.worker_id}:${record.farm_id}`, record]));
  people = profileResult.data.filter((profile) => profile.role === "leader" || profile.role === "team").flatMap((profile) => {
    const assignments = membershipResult.data.filter((membership) => membership.user_id === profile.id);
    const visibleAssignments = assignments.length ? assignments : [{ farm_id: null }];
    return visibleAssignments.map((membership) => {
      const record = membership.farm_id ? attendanceByPerson.get(`${profile.id}:${membership.farm_id}`) : null;
      return { id: profile.id, name: profile.display_name, role: profile.role === "team" ? "Team" : "Leader", approvalStatus: profile.approval_status, farmId: membership.farm_id, farm: farmNameById.get(membership.farm_id) || "Unassigned", attendance: record ? record.status[0].toUpperCase() + record.status.slice(1) : "Not recorded", pay: Number(record?.wage_rate || 0), attendanceId: record?.id };
    });
  });
  transactions = cashbookResult.data.map((entry) => ({ id: entry.id, date: entry.entry_date, title: entry.description, location: entry.scope === "home" ? "Home" : farmNameById.get(entry.farm_id) || "Farm", farmId: entry.farm_id, kind: entry.entry_type, amount: Number(entry.amount), category: entry.category, note: entry.note || "", personId: entry.person_id, workerName: profileById.get(entry.person_id)?.display_name || "", sourceDailyLogId: entry.source_daily_log_id }));
  customFields = [...new Set(logs.flatMap((log) => Object.keys(log.customData)))];
  activities = logs.slice(0, 3).map((log) => ({ icon: "clipboard-check", title: escapeHtml("Daily log submitted"), detail: escapeHtml(`${log.farmName} · ${log.deaths} deaths`), time: escapeHtml(log.date) }));
}
async function loadAllWorkerPayments() {
  const pageSize = 1000;
  const entries = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabaseClient.from("cashbook_entries")
      .select("person_id, amount")
      .eq("entry_type", "expense")
      .not("person_id", "is", null)
      .order("entry_date", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    entries.push(...data);
    if (data.length < pageSize) return entries;
  }
}
async function activateSession(session) {
  if (!session) return;
  const result = await supabaseClient.from("profiles").select("id, display_name, login_id, role, approval_status, must_change_password").eq("id", session.user.id).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) {
    await supabaseClient.auth.signOut();
    showAuthMessage("This login has no Fieldnote profile. Ask your Admin to set up your account.");
    return;
  }
  if (result.data.approval_status !== "approved") {
    showPendingState(result.data.approval_status === "pending" ? "Your account is awaiting approval. Please contact your Admin." : "This account is not active. Please contact your Admin.");
    return;
  }
  if (result.data.must_change_password) {
    showPasswordChangeState();
    return;
  }
  currentProfile = result.data;
  await loadCloudData();
  document.querySelector("#signed-in-name").textContent = currentProfile.display_name;
  document.querySelector("#signed-in-role").textContent = currentProfile.role[0].toUpperCase() + currentProfile.role.slice(1);
  document.querySelector(".app-shell").hidden = false;
  document.querySelector(".app-shell").classList.add(`role-${currentProfile.role}`);
  document.querySelector("#auth-screen").hidden = true;
  document.querySelector("#accounts-nav").hidden = currentProfile.role !== "admin";
  document.querySelectorAll('.nav-item[data-page="cashbook"]').forEach((item) => { item.hidden = currentProfile.role === "team"; });
  if (currentProfile.role === "team" && activePage === "cashbook") activePage = "overview";
  render();
}
function loginEmail(loginId) {
  const normalized = loginId.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalized)) throw new Error("Login ID must use 3-64 letters, numbers, dots, underscores, or hyphens.");
  return `${normalized}@${window.FIELDNOTE_CONFIG.loginEmailDomain}`;
}
async function initializeSupabaseAuth() {
  const config = window.FIELDNOTE_CONFIG;
  if (!window.supabase?.createClient) return showAuthMessage("Could not load the Supabase client. Check your internet connection and reload.");
  if (!config?.supabaseUrl || !config.supabaseAnonKey || config.supabaseAnonKey.startsWith("REPLACE_")) {
    showAuthMessage("Setup required: add this project's public publishable key to supabase-config.js.");
    return;
  }
  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  document.querySelector("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    showAuthMessage("Signing in...", false);
    try {
      const email = loginEmail(String(new FormData(form).get("loginId")));
      const password = String(new FormData(form).get("password"));
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await activateSession(data.session);
    } catch (error) {
      showAuthMessage(error.message || "Sign-in failed.");
    } finally {
      submit.disabled = false;
    }
  });
  document.querySelector("#signout-button").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
  });
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) return showAuthMessage(error.message);
  if (data.session) {
    try { await activateSession(data.session); }
    catch (loadError) { showAuthMessage(`Could not load your farm data: ${loadError.message}`); }
  }
}
initializeSupabaseAuth().catch((error) => showAuthMessage(error.message || "Could not connect to Supabase."));
render();
function renderTeamAccess() {
  const rows = profiles.map((profile) => {
    let action = "";
    if (profile.id !== currentProfile?.id) {
      const nextStatus = profile.approval_status === "approved" ? "disabled" : "approved";
      const label = profile.approval_status === "approved" ? "Disable" : "Approve";
      action = `<button class="outline-button" data-profile-action="${nextStatus}" data-profile-id="${profile.id}">${label}</button>`;
      if (profile.approval_status === "pending") action += `<button class="outline-button" data-profile-action="rejected" data-profile-id="${profile.id}">Reject</button>`;
    }
    return `<tr><td><strong>${escapeHtml(profile.display_name)}</strong><small style="display:block;margin-top:4px;color:#89948e">${escapeHtml(profile.login_id)}</small></td><td>${escapeHtml(profile.role)}</td><td><span class="account-status">${escapeHtml(profile.approval_status)}</span>${profile.must_change_password ? " · Temp password" : ""}</td><td><div class="account-actions">${action}</div></td></tr>`;
  }).join("");
  const farmOptions = farms.map((farm) => `<option value="${farm.dbId}">${escapeHtml(farm.name)}</option>`).join("");
  const credentialBlock = createdCredentials ? `<div class="account-secret" role="status"><strong>Temporary password for ${escapeHtml(createdCredentials.loginId)}</strong><p>Share this directly with the account holder. It is shown only in this session.</p><code id="created-password">${escapeHtml(createdCredentials.temporaryPassword)}</code><button class="outline-button" id="copy-temp-password" type="button"><i data-lucide="copy"></i>Copy password</button></div>` : "";
  return `${pageHeading("PEOPLE & PERMISSIONS", "Team access", "Create login IDs, assign farm access, and approve new accounts.")}<div class="account-layout"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Create an account</h2><p class="panel-caption">New accounts wait for Admin approval</p></div></div><form class="account-form" id="account-form"><label class="field">Login ID<input name="loginId" required minlength="3" maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}" autocomplete="off" /></label><label class="field">Display name<input name="displayName" required minlength="2" maxlength="100" /></label><label class="field">Role<select name="role" required><option value="team">Team</option><option value="leader">Leader</option><option value="boss">Boss</option><option value="admin">Admin</option></select></label><label class="field">Farm access<select name="farmIds" multiple>${farmOptions}</select></label><button class="primary-button" type="submit"><i data-lucide="user-plus"></i>Create account</button></form>${credentialBlock}</section><section class="panel"><div class="panel-header"><div><h2 class="panel-title">Accounts</h2><p class="panel-caption">Approval and password status</p></div></div><div class="farm-table-wrap"><table class="farm-table"><thead><tr><th>PERSON</th><th>ROLE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${rows || `<tr><td class="empty-row" colspan="4">No accounts found.</td></tr>`}</tbody></table></div></section></div>`;
}
function showPasswordChangeState() {
  const screen = document.querySelector("#auth-screen");
  screen.innerHTML = `<form class="auth-panel" id="password-change-form"><p class="eyebrow">FIRST SIGN-IN</p><h1>Choose a new password</h1><p class="auth-copy">Set a private password before opening farm records. Use at least 12 characters.</p><label class="field">New password<input name="password" type="password" autocomplete="new-password" minlength="12" required /></label><label class="field">Confirm new password<input name="confirmPassword" type="password" autocomplete="new-password" minlength="12" required /></label><button class="primary-button auth-submit" type="submit">Update password</button><p class="auth-message" id="auth-message" role="status" aria-live="polite"></p></form>`;
  screen.hidden = false;
  document.querySelector(".app-shell").hidden = true;
  document.querySelector("#password-change-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password"));
    if (password.length < 12) return showAuthMessage("Use a password with at least 12 characters.");
    if (password !== String(values.get("confirmPassword"))) return showAuthMessage("The passwords do not match.");
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) return showAuthMessage(error.message);
    const { error: profileError } = await supabaseClient.rpc("complete_password_change");
    if (profileError) return showAuthMessage(`Password changed, but account setup could not finish: ${profileError.message}`);
    const { data } = await supabaseClient.auth.getSession();
    await activateSession(data.session);
  });
}