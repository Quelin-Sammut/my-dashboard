import React, { useState, useEffect, useCallback, useContext } from "react";

// ── Auth Configuration ────────────────────────────────────────────────────────
const AUTH_KEY = "dashboard_auth_user";
const USERS_KEY = "dashboard_users";
const ADMIN_USER = "quelin"; // Only this user can access the admin panel

// Default users — only used on first load if no users exist in storage
const DEFAULT_USERS = [
  { username: "quelin", password: "dashboard2026", isAdmin: true, createdAt: "2026-05-30" },
];

function getUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function validateLogin(username, password) {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
}

// ── Admin Panel Component ─────────────────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [users, setUsers] = useState(getUsers());
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPass, setEditPass] = useState("");
  const [showPassFor, setShowPassFor] = useState({});

  const refresh = () => setUsers(getUsers());

  const addUser = () => {
    setError(""); setSuccess("");
    if (!newUser.username.trim()) { setError("Username is required."); return; }
    if (!newUser.password.trim()) { setError("Password is required."); return; }
    if (newUser.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    const existing = getUsers();
    if (existing.find(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      setError("Username already exists."); return;
    }
    const updated = [...existing, {
      username: newUser.username.trim(),
      password: newUser.password,
      isAdmin: false,
      createdAt: new Date().toISOString().split("T")[0],
    }];
    saveUsers(updated);
    setUsers(updated);
    setNewUser({ username: "", password: "" });
    setSuccess("User added successfully.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const removeUser = (username) => {
    if (username === ADMIN_USER) { setError("Cannot remove the admin user."); return; }
    if (!window.confirm(`Remove user "${username}"?`)) return;
    const updated = getUsers().filter(u => u.username !== username);
    saveUsers(updated);
    setUsers(updated);
    setSuccess("User removed.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const savePassword = (username) => {
    if (editPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    const updated = getUsers().map(u => u.username === username ? { ...u, password: editPass } : u);
    saveUsers(updated);
    setUsers(updated);
    setEditingId(null);
    setEditPass("");
    setSuccess("Password updated.");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20, fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        .adm { background: #111820; border: 1px solid #1e2d3d; border-radius: 16px; padding: 28px; width: 100%; max-width: 440px; max-height: 85vh; overflow-y: auto; }
        .adm-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .adm-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #e2e8f0; }
        .adm-title span { color: #f59e0b; }
        .adm-close { background: none; border: none; color: #475569; font-size: 20px; cursor: pointer; padding: 4px; transition: color 0.15s; }
        .adm-close:hover { color: #e2e8f0; }
        .adm-sec { margin-bottom: 24px; }
        .adm-sec-title { font-size: 10px; color: #475569; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 12px; }
        .adm-user-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #172130; border: 1px solid #1e2d3d; border-radius: 8px; margin-bottom: 6px; }
        .adm-user-info { flex: 1; min-width: 0; }
        .adm-user-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
        .adm-user-meta { font-size: 10px; color: #475569; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .adm-badge { font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; }
        .adm-badge-admin { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .adm-badge-user  { background: rgba(103,232,249,0.1); color: #67e8f9; }
        .adm-action-btn { padding: 5px 10px; border-radius: 6px; border: 1px solid #1e2d3d; background: transparent; font-size: 10px; font-family: 'Inter', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .adm-edit-btn { color: #94a3b8; } .adm-edit-btn:hover { border-color: #f59e0b; color: #f59e0b; }
        .adm-del-btn  { color: #94a3b8; } .adm-del-btn:hover  { border-color: #fb7185; color: #fb7185; }
        .adm-edit-row { display: flex; gap: 6px; margin-top: 8px; align-items: center; }
        .adm-input { background: #0d1117; border: 1px solid #1e2d3d; border-radius: 7px; padding: 9px 11px; color: #e2e8f0; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; width: 100%; box-sizing: border-box; }
        .adm-input:focus { border-color: #92400e; }
        .adm-input::placeholder { color: #475569; }
        .adm-add-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
        .adm-save-btn { padding: 9px 16px; background: #f59e0b; border: none; border-radius: 7px; color: #000; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; }
        .adm-cancel-btn { padding: 9px 14px; background: transparent; border: 1px solid #1e2d3d; border-radius: 7px; color: #94a3b8; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; }
        .adm-error { font-size: 11px; color: #fb7185; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .adm-success { font-size: 11px; color: #4ade80; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .adm-divider { height: 1px; background: #1e2d3d; margin: 20px 0; }
      `}</style>

      <div className="adm">
        <div className="adm-hdr">
          <div className="adm-title">User <span>Management</span></div>
          <button className="adm-close" onClick={onClose}>✕</button>
        </div>

        {error   && <div className="adm-error">⚠ {error}</div>}
        {success && <div className="adm-success">✓ {success}</div>}

        {/* Current users */}
        <div className="adm-sec">
          <div className="adm-sec-title">Current Users ({users.length})</div>
          {users.map(u => (
            <div key={u.username}>
              <div className="adm-user-row">
                <div className="adm-user-info">
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div className="adm-user-name">{u.username}</div>
                    <span className={`adm-badge ${u.isAdmin ? "adm-badge-admin" : "adm-badge-user"}`}>
                      {u.isAdmin ? "Admin" : "User"}
                    </span>
                  </div>
                  <div className="adm-user-meta">Added {u.createdAt}</div>
                </div>
                <button className="adm-action-btn adm-edit-btn" onClick={() => { setEditingId(u.username); setEditPass(""); setError(""); }}>
                  Change password
                </button>
                {!u.isAdmin && (
                  <button className="adm-action-btn adm-del-btn" onClick={() => removeUser(u.username)}>
                    Remove
                  </button>
                )}
              </div>
              {editingId === u.username && (
                <div className="adm-edit-row" style={{marginBottom:8}}>
                  <input className="adm-input" type="password" placeholder="New password (min 6 chars)"
                    value={editPass} onChange={e => setEditPass(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && savePassword(u.username)} />
                  <button className="adm-save-btn" onClick={() => savePassword(u.username)}>Save</button>
                  <button className="adm-cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="adm-divider" />

        {/* Add new user */}
        <div className="adm-sec">
          <div className="adm-sec-title">Add New User</div>
          <div className="adm-add-row">
            <input className="adm-input" placeholder="Username" value={newUser.username}
              onChange={e => setNewUser(p => ({...p, username: e.target.value}))} />
            <input className="adm-input" type="password" placeholder="Password (min 6 chars)"
              value={newUser.password}
              onChange={e => setNewUser(p => ({...p, password: e.target.value}))}
              onKeyDown={e => e.key === "Enter" && addUser()} />
          </div>
          <button className="adm-save-btn" style={{width:"100%"}} onClick={addUser}>
            + Add User
          </button>
        </div>

        <div className="adm-divider" />
        <div style={{fontSize:10,color:"#1e2d3d",fontFamily:"JetBrains Mono,monospace",textAlign:"center"}}>
          Admin access — quelin only
        </div>
      </div>
    </div>
  );
}


// ── Current user context ──────────────────────────────────────────────────────
const CurrentUserContext = React.createContext("");

// ── Auth Gate Component ───────────────────────────────────────────────────────

function AuthGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem(AUTH_KEY) !== null;
  });
  const [currentUser, setCurrentUser] = useState(() => sessionStorage.getItem(AUTH_KEY) || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const login = () => {
    const user = validateLogin(username, password);
    if (user) {
      sessionStorage.setItem(AUTH_KEY, user.username.toLowerCase());
      setCurrentUser(user.username.toLowerCase());
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect username or password.");
      setPassword("");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") login();
  };

  if (authed) return <CurrentUserContext.Provider value={currentUser}>{children}</CurrentUserContext.Provider>;

  return (
    <div style={{
      minHeight: "100vh", background: "#080b0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .auth-card {
          background: #111820; border: 1px solid #1e2d3d; border-radius: 16px;
          padding: 40px 36px; width: 100%; max-width: 380px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }
        .auth-logo { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #e2e8f0; margin-bottom: 4px; }
        .auth-logo span { color: #f59e0b; }
        .auth-sub { font-size: 11px; color: #475569; font-family: 'JetBrains Mono', monospace; margin-bottom: 32px; letter-spacing: 1px; text-transform: uppercase; }
        .auth-label { font-size: 10px; color: #475569; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; font-weight: 600; }
        .auth-input {
          width: 100%; background: #0d1117; border: 1px solid #1e2d3d; border-radius: 8px;
          padding: 11px 14px; color: #e2e8f0; font-family: 'Inter', sans-serif;
          font-size: 14px; outline: none; margin-bottom: 16px; transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .auth-input:focus { border-color: #92400e; }
        .auth-input::placeholder { color: #475569; }
        .auth-pass-wrap { position: relative; margin-bottom: 24px; }
        .auth-pass-wrap .auth-input { margin-bottom: 0; padding-right: 44px; }
        .auth-show { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #475569; cursor: pointer; font-size: 14px; padding: 4px; }
        .auth-show:hover { color: #94a3b8; }
        .auth-btn {
          width: 100%; padding: 13px; background: #f59e0b; border: none; border-radius: 8px;
          color: #000; font-weight: 700; font-size: 14px; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.15s; letter-spacing: 0.3px;
        }
        .auth-btn:hover { background: #fbbf24; }
        .auth-error { font-size: 12px; color: #fb7185; font-family: 'JetBrains Mono', monospace; margin-bottom: 16px; text-align: center; }
        .auth-footer { font-size: 10px; color: #1e2d3d; text-align: center; margin-top: 24px; font-family: 'JetBrains Mono', monospace; }
      `}</style>
      <div className="auth-card">
        <div className="auth-logo">Good morning, <span>Quelin</span></div>
        <div className="auth-sub">Personal Dashboard · Sign in to continue</div>

        <div className="auth-label">Username</div>
        <input
          className="auth-input"
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="username"
        />

        <div className="auth-label">Password</div>
        <div className="auth-pass-wrap">
          <input
            className="auth-input"
            type={showPass ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete="current-password"
          />
          <button className="auth-show" onClick={() => setShowPass(p => !p)}>
            {showPass ? "🙈" : "👁"}
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-btn" onClick={login}>Sign In</button>

        <div className="auth-footer">© {now.getFullYear()} · Personal use only</div>
      </div>
    </div>
  );
}



// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#080b0f", bg2:"#0d1117", surface:"#111820", surface2:"#172130",
  border:"#1e2d3d", border2:"#243444",
  amber:"#f59e0b", amberDim:"#92400e", amberGlow:"rgba(245,158,11,0.1)", amberText:"#fcd34d",
  ice:"#67e8f9", iceDim:"rgba(103,232,249,0.1)",
  sage:"#86efac", sageDim:"rgba(134,239,172,0.08)",
  rose:"#fb7185", roseDim:"rgba(251,113,133,0.1)",
  violet:"#c084fc", violetDim:"rgba(192,132,252,0.1)",
  text:"#e2e8f0", text2:"#94a3b8", text3:"#475569",
  red:"#f87171", green:"#4ade80",
};

// ── Quotes ────────────────────────────────────────────────────────────────────
const QUOTES = [
  {q:"Either you run the day or the day runs you.",a:"Jim Rohn"},
  {q:"Discipline is choosing between what you want now and what you want most.",a:"Abraham Lincoln"},
  {q:"Do something today that your future self will thank you for.",a:"Sean Patrick Flanery"},
  {q:"Focus on being productive instead of busy.",a:"Tim Ferriss"},
  {q:"The secret of getting ahead is getting started.",a:"Mark Twain"},
  {q:"Small daily improvements over time lead to stunning results.",a:"Robin Sharma"},
  {q:"Work hard in silence. Let success make the noise.",a:"Frank Ocean"},
  {q:"Don't watch the clock; do what it does. Keep going.",a:"Sam Levenson"},
  {q:"The key is not to prioritize what's on your schedule, but to schedule your priorities.",a:"Stephen Covey"},
  {q:"Don't count the days, make the days count.",a:"Muhammad Ali"},
  {q:"Opportunities don't happen. You create them.",a:"Chris Grosser"},
  {q:"Hard work beats talent when talent doesn't work hard.",a:"Tim Notke"},
  {q:"You are one decision away from a completely different life.",a:"Mel Robbins"},
  {q:"Wake up with determination. Go to bed with satisfaction.",a:"Unknown"},
  {q:"It always seems impossible until it's done.",a:"Nelson Mandela"},
  {q:"Dream big. Start small. Act now.",a:"Robin Sharma"},
  {q:"Success doesn't come from what you do occasionally, but from what you do consistently.",a:"Marie Forleo"},
  {q:"Believe you can and you're halfway there.",a:"Theodore Roosevelt"},
  {q:"The best time to plant a tree was 20 years ago. The second best time is now.",a:"Chinese Proverb"},
  {q:"Success is not final, failure is not fatal: it is the courage to continue that counts.",a:"Winston Churchill"},
  {q:"Don't stop when you're tired. Stop when you're done.",a:"Unknown"},
  {q:"Great things never come from comfort zones.",a:"Unknown"},
  {q:"Energy and persistence conquer all things.",a:"Benjamin Franklin"},
  {q:"You don't have to be great to start, but you have to start to be great.",a:"Zig Ziglar"},
  {q:"The only way to do great work is to love what you do.",a:"Steve Jobs"},
  {q:"Push yourself, because no one else is going to do it for you.",a:"Unknown"},
  {q:"Stop doubting yourself. Work hard and make it happen.",a:"Unknown"},
  {q:"Your only limit is your mind.",a:"Unknown"},
  {q:"Believe in yourself and all that you are.",a:"Christian D. Larson"},
  {q:"Every champion was once a contender who refused to give up.",a:"Rocky Balboa"},
  {q:"Run when you can, walk if you have to, crawl if you must; just never give up.",a:"Dean Karnazes"},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = new Date();
const DAY_NAMES  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MON_NAMES  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEK_DAYS  = ["M","T","W","T","F","S","S"];
const RACE_DATE  = new Date("2026-07-09");
const daysToRace = Math.ceil((RACE_DATE - now) / 86400000);
const dayOfYear  = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
const todayQuote = QUOTES[dayOfYear % QUOTES.length];

function toISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function fmtDate(d){ return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`; }
function getSecsLeft(){ const e=new Date(); e.setHours(23,0,0,0); return Math.max(0,Math.floor((e-new Date())/1000)); }

const todayISO  = toISO(now);
const todayStr  = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MON_NAMES[now.getMonth()]} ${now.getFullYear()}`;
function daysAgo(n){  return toISO(addDays(now,-n)); }
function daysAhead(n){ return toISO(addDays(now,n)); }

function getMonthKey(){ return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`; }
function getMonthLabel(key){ const [y,m]=key.split("-"); return `${MON_NAMES[parseInt(m)-1]} ${y}`; }

// ── Static data ───────────────────────────────────────────────────────────────
const FOLLOW_UPS_INIT = [
  {id:1,client:"Leanne",     phone:"79848564",       note:"Urgent buyer — call immediately",  priority:"urgent",due:daysAgo(3), done:false},
  {id:2,client:"Follow-up",  phone:"7970 8000",      note:"Check interest in new listing",    priority:"normal",due:daysAgo(2), done:false},
  {id:3,client:"Follow-up",  phone:"9947 5708",      note:"Awaiting callback",                priority:"normal",due:daysAgo(2), done:false},
  {id:4,client:"Follow-up",  phone:"+356 9994 3621", note:"Buyer viewing request",            priority:"normal",due:daysAgo(1), done:false},
  {id:5,client:"Follow-up",  phone:"7925 7879",      note:"Re-check interest",                priority:"normal",due:daysAgo(1), done:false},
  {id:6,client:"Setup viewing",phone:"7993 0436",    note:"Arrange property viewing",         priority:"normal",due:daysAgo(1), done:false},
  {id:7,client:"Callback",   phone:"9928 4886",      note:"Callback requested",               priority:"normal",due:daysAhead(1),done:false},
  {id:8,client:"Follow-up",  phone:"9988 7806",      note:"No reply — try again",             priority:"normal",due:daysAhead(1),done:false},
  {id:9,client:"Check Notes",phone:"9944 6001",      note:"Review notes before calling",      priority:"normal",due:todayISO,   done:false},
];

const TASKS_INIT = [
  {id:101,name:"Input KPIs",                         priority:"normal",due:daysAgo(2), done:false,list:"To Do List"},
  {id:102,name:"Move Developers List to Agent Leaders",priority:"low",  due:daysAgo(4), done:false,list:"To Do List"},
  {id:103,name:"Property viewing — Friday 3pm",      priority:"high",  due:daysAhead(2),done:false,list:"Properties To Be Seen"},
  {id:104,name:"Team meeting prep",                  priority:"normal",due:daysAhead(4),done:false,list:"To Do List"},
  {id:105,name:"Create buyer list",                  priority:"high",  due:daysAhead(5),done:false,list:"To Do List"},
  {id:106,name:"Send leaflets",                      priority:"normal",due:daysAhead(5),done:false,list:"To Do List"},
];

const SLACK_INIT = [
  {id:201,channel:"#ai-bot-workflows",from:"Deep",   date:"May 17",msg:"Screenshot sent — needs review",done:false},
  {id:202,channel:"#ai-bot-workflows",from:"Sophie", date:"May 10",msg:"Bot incorrectly states Islamic accounts are offered",done:false},
  {id:203,channel:"#ai-bot-workflows",from:"Ivor",   date:"May 9", msg:"Bot says partials help consistency — incorrect",done:false},
  {id:204,channel:"#ai-bot-workflows",from:"Martina",date:"May 8", msg:"Bot giving outdated RC info",done:false},
  {id:205,channel:"#goatfundedtrader",from:"Eghosa", date:"May 18",msg:"Resolution rate dipped to 73% — was 80% on May 17",done:false},
  {id:206,channel:"#goatfundedtrader",from:"Mike",   date:"May 17",msg:"4,684 conversations yesterday — good volume",done:false},
];

const CAL_COLORS = {
  "Right Homess":{bg:"rgba(245,158,11,0.1)", border:"#f59e0b",text:"#fcd34d"},
  "Goat Funded": {bg:"rgba(192,132,252,0.1)",border:"#c084fc",text:"#c084fc"},
  "Training":    {bg:"rgba(134,239,172,0.08)",border:"#86efac",text:"#86efac"},
  "Personal":    {bg:"rgba(103,232,249,0.08)",border:"#67e8f9",text:"#67e8f9"},
  "Errands":     {bg:"rgba(251,191,36,0.08)", border:"#fbbf24",text:"#fbbf24"},
};

const CAL_EVENTS = [
  {date:"2026-05-25",start:"09:00",end:"09:15",title:"📱 Reply to Client Messages",cal:"Right Homess"},
  {date:"2026-05-25",start:"09:15",end:"09:30",title:"KPIs — Previous Day",cal:"Right Homess"},
  {date:"2026-05-25",start:"09:30",end:"10:30",title:"Team Meeting",cal:"Right Homess"},
  {date:"2026-05-25",start:"10:30",end:"11:00",title:"Property Updates",cal:"Right Homess"},
  {date:"2026-05-25",start:"11:00",end:"12:00",title:"Morning Callers",cal:"Right Homess"},
  {date:"2026-05-25",start:"12:00",end:"12:30",title:"Lunch Break",cal:"Personal"},
  {date:"2026-05-25",start:"12:30",end:"13:00",title:"📱 Reply to Client Messages",cal:"Right Homess"},
  {date:"2026-05-25",start:"13:00",end:"14:00",title:"Week Planning",cal:"Right Homess"},
  {date:"2026-05-25",start:"14:00",end:"15:30",title:"Area Prospecting",cal:"Right Homess"},
  {date:"2026-05-25",start:"15:30",end:"17:00",title:"Buyer Follow-Ups",cal:"Right Homess"},
  {date:"2026-05-25",start:"17:00",end:"17:30",title:"Dinner Break",cal:"Personal"},
  {date:"2026-05-25",start:"17:30",end:"18:00",title:"📱 Reply to Client Messages",cal:"Right Homess"},
  {date:"2026-05-25",start:"18:00",end:"19:30",title:"🥊 Boxing",cal:"Training"},
  {date:"2026-05-25",start:"20:00",end:"23:00",title:"💼 Part Time — Goat Funded",cal:"Goat Funded"},
  {date:"2026-05-26",start:"09:00",end:"09:15",title:"📱 Reply to Client Messages",cal:"Right Homess"},
  {date:"2026-05-26",start:"09:30",end:"11:00",title:"Morning Callers",cal:"Right Homess"},
  {date:"2026-05-26",start:"14:00",end:"16:00",title:"💼 Part Time — Goat Funded",cal:"Goat Funded"},
  {date:"2026-05-26",start:"18:00",end:"20:00",title:"Evening Callers",cal:"Right Homess"},
  {date:"2026-05-26",start:"22:00",end:"22:45",title:"🏃 Running — MUST",cal:"Training"},
  {date:"2026-05-27",start:"09:30",end:"12:30",title:"🏠 Property Tour",cal:"Right Homess"},
  {date:"2026-05-27",start:"13:30",end:"15:00",title:"Video Shoot Prep",cal:"Right Homess"},
  {date:"2026-05-27",start:"22:00",end:"22:45",title:"🏃 Running — MUST",cal:"Training"},
  {date:"2026-05-28",start:"09:30",end:"12:00",title:"🎥 Video Shoot",cal:"Right Homess"},
  {date:"2026-05-28",start:"14:00",end:"16:00",title:"📚 Learning Session — LOCKED",cal:"Personal"},
  {date:"2026-05-28",start:"21:00",end:"23:00",title:"💼 Part Time — Goat Funded",cal:"Goat Funded"},
  {date:"2026-05-29",start:"09:30",end:"11:00",title:"Area Prospecting",cal:"Right Homess"},
  {date:"2026-05-29",start:"13:00",end:"14:30",title:"Video Editing",cal:"Right Homess"},
  {date:"2026-05-29",start:"14:30",end:"16:00",title:"Publish Ads & Posts",cal:"Right Homess"},
  {date:"2026-05-29",start:"22:00",end:"22:45",title:"🏃 Running — MUST",cal:"Training"},
  {date:"2026-05-30",start:"09:30",end:"16:00",title:"🏠 Property Viewings",cal:"Right Homess"},
  {date:"2026-05-30",start:"17:00",end:"18:30",title:"📚 Learning (if free)",cal:"Personal"},
  {date:"2026-05-31",start:"09:15",end:"12:00",title:"🏃 Long Run — MUST",cal:"Training"},
];

const TYPE_COLORS = {
  work:    {bg:T.amberGlow,  accent:T.amber,  label:"Right Homess"},
  calls:   {bg:T.roseDim,    accent:T.rose,   label:"Calls"},
  goat:    {bg:T.violetDim,  accent:T.violet, label:"Goat Funded"},
  personal:{bg:T.iceDim,     accent:T.ice,    label:"Personal Dev"},
  training:{bg:T.sageDim,    accent:T.sage,   label:"Training"},
  break:   {bg:"rgba(71,85,105,0.1)",accent:T.text3,label:"Break"},
};

const WEEK_PLAN = [
  {theme:"Office & Prospecting",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1 — morning triage."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:"Fill in yesterday's KPIs first thing."},
    {time:"09:30",title:"Team Meeting",dur:"1 hr",type:"work",desc:"Fixed — mandatory weekly sync."},
    {time:"10:30",title:"Property Updates",dur:"30 min",type:"work",desc:"Check what sold over weekend."},
    {time:"11:00",title:"Morning Callers",dur:"1 hr",type:"calls",desc:"Buyer follow-ups — best answer rates."},
    {time:"12:00",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2 — midday sweep."},
    {time:"13:00",title:"Week Planning",dur:"1 hr",type:"work",desc:"Review prev week. Plan this week."},
    {time:"14:00",title:"Area Prospecting",dur:"1.5 hrs",type:"work",desc:"Spot new projects & listings."},
    {time:"15:30",title:"Buyer Follow-Ups",dur:"1.5 hrs",type:"calls",desc:"Afternoon calling block."},
    {time:"17:00",title:"Dinner Break",dur:"30 min",type:"break",desc:""},
    {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3 — end of day sweep."},
    {time:"18:00",title:"🥊 Boxing",dur:"1.5 hrs",type:"training",desc:"Evening session."},
    {time:"20:00",title:"💼 Part Time — Goat Funded",dur:"3 hrs",type:"goat",desc:"~3 hrs toward 15hr weekly target."},
  ]},
  {theme:"Preparation & Calls",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:""},
    {time:"09:30",title:"Morning Callers",dur:"1.5 hrs",type:"calls",desc:"Book new viewings."},
    {time:"11:00",title:"Property Updates",dur:"1 hr",type:"work",desc:"Build min 5 properties to view Wed."},
    {time:"12:00",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2."},
    {time:"13:00",title:"Viewing List Prep",dur:"1 hr",type:"work",desc:"Finalise Wed tour list."},
    {time:"14:00",title:"💼 Part Time — Goat Funded",dur:"2 hrs",type:"goat",desc:"Mid-week safety net."},
    {time:"17:00",title:"Dinner Break",dur:"30 min",type:"break",desc:""},
    {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3."},
    {time:"18:00",title:"Evening Callers",dur:"2 hrs",type:"calls",desc:"6–8pm — book new viewings."},
    {time:"22:00",title:"🏃 Running — MUST",dur:"45 min",type:"training",desc:"Runna session."},
  ]},
  {theme:"Property Tour & Media Prep",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:""},
    {time:"09:30",title:"Leaflet Posting / Prospecting",dur:"—",type:"work",desc:"Morning — cooler in summer."},
    {time:"09:30",title:"🏠 Property Tour",dur:"3 hrs max",type:"work",desc:"View all properties. Min 5."},
    {time:"12:30",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"13:00",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2."},
    {time:"13:30",title:"Video Shoot Prep",dur:"1.5 hrs",type:"work",desc:"Select properties, theme, scripts for Thu."},
    {time:"15:00",title:"💼 Part Time — Goat Funded",dur:"1.5 hrs",type:"goat",desc:"Optional."},
    {time:"17:00",title:"Dinner Break",dur:"30 min",type:"break",desc:""},
    {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3."},
    {time:"18:00",title:"🥊 Boxing (optional)",dur:"1.5 hrs",type:"training",desc:"No evening calls Wed."},
    {time:"22:00",title:"🏃 Running — MUST",dur:"45 min",type:"training",desc:"Runna session."},
  ]},
  {theme:"Media Shoot & Deep Work",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:""},
    {time:"09:30",title:"🎥 Video Shoot",dur:"2.5 hrs",type:"work",desc:"Shoot all planned content."},
    {time:"12:00",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2."},
    {time:"14:00",title:"📚 Learning Session — LOCKED",dur:"2 hrs",type:"personal",desc:"Non-negotiable. Sales or AI videos."},
    {time:"16:00",title:"Productivity Deep Work",dur:"1 hr",type:"work",desc:"Quiet office time."},
    {time:"17:00",title:"Dinner Break",dur:"30 min",type:"break",desc:""},
    {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3."},
    {time:"19:00",title:"🥊 Boxing (optional)",dur:"1.5 hrs",type:"training",desc:"No running Thu."},
    {time:"21:00",title:"💼 Part Time — Goat Funded",dur:"2 hrs",type:"goat",desc:"Evening shift."},
  ]},
  {theme:"Prospecting & Ads Day",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:""},
    {time:"09:30",title:"Area Prospecting",dur:"1.5 hrs",type:"work",desc:"Spot new listings."},
    {time:"11:00",title:"Morning Callers",dur:"1 hr",type:"calls",desc:"Follow-up calls."},
    {time:"12:00",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2."},
    {time:"13:00",title:"Video Editing",dur:"1.5 hrs",type:"work",desc:"Edit Thursday's shoot."},
    {time:"14:30",title:"Publish Ads & Posts",dur:"1.5 hrs",type:"work",desc:"Meta ads, property posts."},
    {time:"16:00",title:"Weekly Review — 15 min",dur:"15 min",type:"personal",desc:"Top 3 priorities for Monday."},
    {time:"17:00",title:"Dinner Break",dur:"30 min",type:"break",desc:""},
    {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3."},
    {time:"18:00",title:"Evening Calls OR Learning",dur:"1.5 hrs",type:"calls",desc:"Flexible."},
    {time:"22:00",title:"🏃 Running — MUST",dur:"45 min",type:"training",desc:"Runna session."},
  ]},
  {theme:"Viewings Day",themeType:"work",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1."},
    {time:"09:15",title:"KPIs — previous day",dur:"15 min",type:"work",desc:""},
    {time:"09:30",title:"🏠 Property Viewings",dur:"till 4pm",type:"work",desc:"As many as possible."},
    {time:"12:00",title:"Lunch Break",dur:"30 min",type:"break",desc:""},
    {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2."},
    {time:"16:00",title:"Hard Stop — End of Viewings",dur:"—",type:"break",desc:""},
    {time:"16:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3."},
    {time:"17:00",title:"📚 Learning (if free)",dur:"1.5 hrs",type:"personal",desc:"Make up Thu if missed."},
    {time:"18:30",title:"💼 Part Time (if needed)",dur:"2 hrs",type:"goat",desc:"Make up weekly target."},
  ]},
  {theme:"Rest & Long Run",themeType:"personal",blocks:[
    {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Quick triage only."},
    {time:"09:15",title:"🏃 Long Run — MUST",dur:"2–3 hrs",type:"training",desc:"Ultramarathon training. Easy pace."},
    {time:"12:00",title:"Lunch & Recovery",dur:"2 hrs",type:"break",desc:"Rest, eat, hydrate."},
    {time:"14:00",title:"Free Day",dur:"—",type:"break",desc:"Rest, family, social."},
    {time:"17:00",title:"Self-Improvement (optional)",dur:"1 hr",type:"personal",desc:"Reading, journaling."},
    {time:"19:00",title:"💼 Part Time (if behind)",dur:"2 hrs",type:"goat",desc:"Only if below 15hr target."},
  ]},
];

function getNextWeekDates(){
  const d=new Date(now); const day=d.getDay();
  d.setDate(d.getDate()+(day===0?1:8-day)); d.setHours(0,0,0,0);
  return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x;});
}
const NEXT_WEEK=getNextWeekDates();
const NEXT_WEEK_LABELS=NEXT_WEEK.map(d=>({
  day:DAY_NAMES[d.getDay()].slice(0,3),date:`${d.getDate()} ${MON_NAMES[d.getMonth()]}`,
  iso:toISO(d),full:DAY_NAMES[d.getDay()],
}));


const READING_LIST_INIT = [
  { id:1, title:"Never Split the Difference", author:"Chris Voss", done:false },
  { id:2, title:"The Go-Giver", author:"Bob Burg", done:false },
  { id:3, title:"Atomic Habits", author:"James Clear", done:false },
  { id:4, title:"$100M Offers", author:"Alex Hormozi", done:true },
];

const META_ADS_DEMO = [
  { name:"Right Homess — Luxury Villas", spend:48.50, leads:3, cpl:16.17, reach:4200 },
  { name:"Right Homess — Sea View Apts",  spend:32.80, leads:2, cpl:16.40, reach:2900 },
  { name:"Right Homess — Brand Awareness",spend:21.00, leads:0, cpl:null,  reach:8100 },
];

// Simple weather demo (will be live on Vercel via weather API)
const WEATHER_DEMO = {
  location: "Malta",
  today:    { icon:"☀️", temp:28, feels:30, desc:"Sunny",        wind:15, humidity:55 },
  tomorrow: { icon:"⛅", temp:26, feels:27, desc:"Partly cloudy", wind:18, humidity:62 },
};


// ── ClickUp API ───────────────────────────────────────────────────────────────
const CU_KEY = (() => { try { return import.meta.env.VITE_CLICKUP_API_KEY || null; } catch(e) { return null; } })();
const CU_WORK_WS = "90151934478"; // Work workspace
const CU_PERS_WS = "90121729716"; // Personal workspace

// List IDs
const CU_LISTS = {
  followUps:    "901523185465",
  rhTodo:       "901523318470",
  properties:   "901523191474",
  goatTodo:     "901523318510",
  goatImprove:  "901523209908",
};

async function cuFetch(endpoint, method="GET", body=null) {
  try {
    // Use Vercel proxy to avoid CORS issues
    const proxyUrl = `/api/clickup?endpoint=${encodeURIComponent(endpoint)}`;
    const options = { method, headers: { "Content-Type": "application/json" } };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(proxyUrl, options);
    if (!res.ok) return null;
    return await res.json();
  } catch(e) {
    console.error("ClickUp fetch error:", e);
    return null;
  }
}

async function fetchListTasks(listId, completed=false) {
  const statusFilter = completed
    ? "statuses[]=complete&include_closed=true"
    : "statuses[]=to+do&statuses[]=in+progress&statuses[]=open";
  const data = await cuFetch(`/list/${listId}/task?${statusFilter}&order_by=due_date&reverse=false`);
  if (!data || !data.tasks) return [];
  return data.tasks.map(t => {
    // ClickUp priority object: { priority: "urgent"|"high"|"normal"|"low" }
    const priority = t.priority ? t.priority.priority : null;

    // Parse due date + time (ClickUp returns milliseconds timestamp)
    let dueISO = daysAhead(7);
    let dueTime = null;
    if (t.due_date) {
      const d = new Date(parseInt(t.due_date));
      dueISO = toISO(d);
      // Only show time if it's not midnight (00:00)
      const hours = d.getHours();
      const mins = d.getMinutes();
      if (hours !== 0 || mins !== 0) {
        dueTime = `${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}`;
      }
    }

    return {
      id: t.id,
      name: t.name,
      priority,
      due: dueISO,
      dueTime,
      done: t.status?.status === "complete" || t.status?.status === "closed" || t.status?.type === "closed",
      list: t.list?.name || "",
      phone: extractPhone(t.description || t.name),
      note: t.description || "",
    };
  });
}

async function updateTaskStatus(taskId, status) {
  try {
    console.log(`Updating task ${taskId} to status: ${status}`);
    const data = await cuFetch(`/task/${taskId}`, "PUT", { status });
    console.log(`ClickUp update response:`, data);
    return data !== null;
  } catch(e) {
    console.error("updateTaskStatus error:", e);
    return false;
  }
}

function extractPhone(text) {
  if (!text) return "";
  // Match +356 followed by digits/spaces, or local numbers like 7942 9239 or 99409756
  const match = text.match(/([+]356[ ]?[0-9 ]{7,12}|[789][0-9]{3}[ ][0-9]{4}|[789][0-9]{7}|[0-9]{8})/u);
  if (!match) return "";
  return match[0].trim();
}

function formatPhoneLink(phone) {
  if (!phone) return "";
  // Remove all spaces and non-digit chars except leading +
  let clean = phone.split("").filter(c => c >= "0" && c <= "9" || c === "+").join("");
  // Add +356 if local Maltese number (starts with 7/8/9 and is 8 digits)
  if (/^[789][0-9]{7}$/.test(clean)) {
    clean = "+356" + clean;
  }
  return clean;
}

function mapCUTasksToFollowUps(tasks) {
  return tasks.map(t => {
    console.log("FU task:", t.name, "| phone extracted:", t.phone);
    return {
    id: t.id,
    client: t.name,
    phone: t.phone,
    note: t.note,
    priority: t.priority,
    due: t.due,
    done: t.done,
    list: "Follow-ups",
    };
  });
}

function mapCUTasksToTasks(tasks, space) {
  return tasks.map(t => ({
    id: t.id,
    name: t.name,
    priority: t.priority,
    due: t.due,
    done: t.done,
    list: t.list,
    space,
  }));
}

const TRAINING_LOG_INIT=[
  {id:1,date:daysAgo(6),type:"Easy Run",distance:"6.5km",duration:"38 min",feel:4,notes:"Felt good, consistent pace throughout."},
  {id:2,date:daysAgo(5),type:"Hill Repeats",distance:"8km",duration:"52 min",feel:3,notes:"Hills were tough but pushed through."},
  {id:3,date:daysAgo(3),type:"Tempo Run",distance:"7km",duration:"44 min",feel:4,notes:"Strong tempo, hit target pace."},
  {id:4,date:daysAgo(2),type:"800m Repeats",distance:"5km",duration:"40 min",feel:3,notes:"Legs heavy from hills, still completed."},
  {id:5,date:daysAgo(1),type:"Easy Run",distance:"5km",duration:"30 min",feel:5,notes:"Best run of the week. Felt effortless."},
];

const HABITS_INIT=[
  {id:1,name:"📖 Reading",days:Array(7).fill(false)},
  {id:2,name:"📝 Journaling",days:Array(7).fill(false)},
];

// ── CSS ───────────────────────────────────────────────────────────────────────
const css=`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${T.bg};
    color: ${T.text};
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: ${T.amberDim}; border-radius: 2px; }

  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; padding: 0 0 88px; }

  /* ── Weather ── */
  .weather-bar {
    padding: 14px 20px;
    background: ${T.bg2};
    border-bottom: 1px solid ${T.border};
    display: flex; align-items: center; justify-content: space-between;
  }
  .wx-today { display: flex; align-items: center; gap: 12px; }
  .wx-icon { font-size: 32px; line-height: 1; }
  .wx-temp { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: ${T.text}; line-height: 1; }
  .wx-desc { font-size: 11px; color: ${T.text2}; margin-top: 2px; }
  .wx-details { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
  .wx-loc { font-size: 9px; color: ${T.ice}; font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 6px; text-align: right; }
  .wx-tomorrow { text-align: right; }
  .wx-tom-label { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .wx-tom-row { display: flex; align-items: center; gap: 5px; justify-content: flex-end; }
  .wx-tom-icon { font-size: 18px; }
  .wx-tom-temp { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: ${T.text2}; }
  .wx-tom-desc { font-size: 10px; color: ${T.text3}; margin-top: 2px; }

  /* ── Quote ── */
  .qbanner {
    padding: 14px 20px;
    background: linear-gradient(90deg, rgba(245,158,11,0.04) 0%, transparent 100%);
    border-bottom: 1px solid ${T.border};
    display: flex; gap: 10px; align-items: flex-start;
  }
  .qmark { font-family: 'Syne', sans-serif; font-size: 34px; color: ${T.amberDim}; line-height: 1; flex-shrink: 0; margin-top: -4px; }
  .qtext { font-size: 13px; font-style: italic; color: ${T.text2}; line-height: 1.7; }
  .qauthor { font-size: 10px; color: ${T.amberDim}; font-family: 'JetBrains Mono', monospace; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }

  /* ── Countdown ── */
  .cbar {
    padding: 10px 20px;
    background: ${T.bg2};
    border-bottom: 1px solid ${T.border};
    display: flex; align-items: center; justify-content: space-between;
  }
  .clabel { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; text-transform: uppercase; }
  .cprog { width: 140px; height: 2px; background: ${T.border2}; border-radius: 1px; overflow: hidden; margin-top: 5px; }
  .cfill { height: 100%; background: linear-gradient(90deg, ${T.amberDim}, ${T.amber}); border-radius: 1px; transition: width 1s linear; }
  .ctime { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: ${T.amber}; letter-spacing: 3px; font-weight: 500; }
  .ctime.urgent { color: ${T.rose}; }

  /* ── Header ── */
  .hdr {
    padding: 14px 20px 12px;
    border-bottom: 1px solid ${T.border};
    position: sticky; top: 0;
    background: rgba(8,11,15,0.97);
    backdrop-filter: blur(16px);
    z-index: 100;
  }
  .hdr-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .hdr-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
  .hdr-name span { color: ${T.amber}; }
  .hdr-sub { font-size: 10px; color: ${T.text3}; margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
  .hdr-right { text-align: right; }
  .hdr-race { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .hdr-alert { font-size: 11px; color: ${T.amber}; margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .hdr-alert.ok { color: ${T.green}; }

  /* ── Sub-nav ── */
  .snav { display: flex; gap: 4px; padding: 12px 20px 0; overflow-x: auto; scrollbar-width: none; }
  .snav::-webkit-scrollbar { display: none; }
  .stab {
    padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 500;
    cursor: pointer; border: 1px solid transparent; white-space: nowrap;
    transition: all 0.15s; background: transparent; color: ${T.text3};
    font-family: 'Inter', sans-serif; letter-spacing: 0.2px;
  }
  .stab.active { background: ${T.amberGlow}; border-color: ${T.amberDim}; color: ${T.amberText}; font-weight: 600; }
  .stab:not(.active):hover { border-color: ${T.border2}; color: ${T.text2}; }

  /* ── Section ── */
  .sec { padding: 18px 20px 0; }
  .sec-t {
    font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase; color: ${T.text3};
    margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
  }
  .sec-t::after { content: ''; flex: 1; height: 1px; background: ${T.border}; }

  /* ── Cards ── */
  .card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
  .card-warn { border-color: ${T.amberDim}; background: linear-gradient(135deg, ${T.surface}, rgba(146,64,14,0.05)); }
  .card-danger { border-color: rgba(251,113,133,0.2); background: rgba(251,113,133,0.02); }

  /* ── Stats ── */
  .sgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
  .scard { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 12px 14px; text-align: center; }
  .sval { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: ${T.amber}; line-height: 1; }
  .sval.bad { color: ${T.rose}; } .sval.good { color: ${T.green}; }
  .slabel { font-size: 9px; color: ${T.text3}; margin-top: 4px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; }

  /* ── Badges ── */
  .bdg { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 700; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; text-transform: uppercase; }
  .bdg-urgent { background: rgba(251,113,133,0.12); color: ${T.rose}; }
  .bdg-high   { background: rgba(245,158,11,0.12);  color: ${T.amber}; }
  .bdg-normal { background: rgba(103,232,249,0.08); color: ${T.ice}; }
  .bdg-low    { background: rgba(71,85,105,0.15);   color: ${T.text3}; }
  .bdg-slack  { background: rgba(192,132,252,0.12); color: ${T.violet}; }

  /* ── Follow-up cards ── */
  .fu {
    background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px;
    padding: 13px 15px; margin-bottom: 8px; display: flex; gap: 12px;
    align-items: flex-start; transition: border-color 0.15s;
  }
  .fu:hover { border-color: ${T.border2}; }
  .fu.done { opacity: 0.35; }
  .fuchk {
    width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid ${T.border2};
    flex-shrink: 0; margin-top: 1px; display: flex; align-items: center;
    justify-content: center; transition: all 0.2s; cursor: pointer;
  }
  .fuchk.done { background: ${T.amber}; border-color: ${T.amber}; }
  .fuchk.done::after { content: '✓'; color: #000; font-size: 11px; font-weight: 800; }
  .fu-body { flex: 1; min-width: 0; }
  .fu-top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 3px; }
  .fu-name { font-size: 13px; font-weight: 600; color: ${T.text}; }
  .fu-phone {
    font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${T.amber};
    text-decoration: none; transition: opacity 0.15s; font-weight: 500;
  }
  .fu-phone:hover { opacity: 0.7; }
  .fu-note { font-size: 12px; color: ${T.text2}; line-height: 1.5; }
  .fu-foot { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
  .fu-due { font-size: 9px; font-family: 'JetBrains Mono', monospace; padding: 2px 7px; border-radius: 4px; font-weight: 600; letter-spacing: 0.3px; }
  .fu-due.overdue { background: rgba(251,113,133,0.1); color: ${T.rose}; }
  .fu-due.today   { background: rgba(245,158,11,0.1);  color: ${T.amber}; }
  .fu-due.future  { background: rgba(103,232,249,0.07);color: ${T.ice}; }

  /* ── Task row ── */
  .trow { display: flex; align-items: flex-start; gap: 11px; padding: 11px 0; border-bottom: 1px solid ${T.border}; cursor: pointer; }
  .trow:last-child { border-bottom: none; }
  .tchk { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid ${T.border2}; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .tchk.done { background: ${T.amber}; border-color: ${T.amber}; }
  .tchk.done::after { content: '✓'; color: #000; font-size: 10px; font-weight: 800; }
  .tname { font-size: 13px; font-weight: 500; line-height: 1.4; }
  .tname.done { text-decoration: line-through; opacity: 0.35; }
  .tmeta { font-size: 10px; color: ${T.text3}; margin-top: 3px; font-family: 'JetBrains Mono', monospace; }

  /* ── Date group header ── */
  .dgrp-label { font-size: 9px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 0 5px; border-bottom: 1px solid ${T.border}; margin-bottom: 2px; font-weight: 600; }

  /* ── Calendar ── */
  .cal-tog { display: flex; gap: 4px; padding: 12px 20px 0; }
  .ctbtn { padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 500; cursor: pointer; border: 1px solid ${T.border}; background: transparent; color: ${T.text3}; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .ctbtn.active { background: ${T.amberGlow}; border-color: ${T.amberDim}; color: ${T.amberText}; font-weight: 600; }
  .cal-leg { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px 20px 0; }
  .cl-item { display: flex; align-items: center; gap: 4px; }
  .cl-dot { width: 7px; height: 7px; border-radius: 2px; }
  .cl-lbl { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .cal-dnav { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px 0; }
  .cal-dtitle { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; }
  .cnbtn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${T.border}; background: transparent; color: ${T.text3}; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .cnbtn:hover { border-color: ${T.amberDim}; color: ${T.amber}; }
  .ctdybtn { padding: 5px 10px; border-radius: 6px; border: 1px solid ${T.border}; background: transparent; color: ${T.text3}; font-size: 10px; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.15s; }
  .ctdybtn:hover { border-color: ${T.amberDim}; color: ${T.amber}; }
  .cev { border-radius: 8px; padding: 8px 12px; margin: 3px 20px; border-left: 3px solid transparent; }
  .cev-time { font-size: 10px; font-family: 'JetBrains Mono', monospace; opacity: 0.55; }
  .cev-title { font-size: 13px; font-weight: 600; margin-top: 2px; color: ${T.text}; }
  .cev-tag { font-size: 10px; opacity: 0.5; margin-top: 2px; }
  .cal-wk { padding: 12px 20px 20px; }
  .wkcols { display: flex; gap: 4px; }
  .wkcol { flex: 1; min-width: 0; }
  .wkhdr { text-align: center; padding: 7px 3px; border-radius: 8px; margin-bottom: 4px; }
  .wkhdr.today { background: ${T.amberGlow}; border: 1px solid ${T.amberDim}; }
  .wkdn { font-size: 8px; font-family: 'JetBrains Mono', monospace; color: ${T.text3}; font-weight: 600; letter-spacing: 0.5px; }
  .wkhdr.today .wkdn { color: ${T.amberText}; }
  .wknum { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: ${T.text2}; line-height: 1; }
  .wkhdr.today .wknum { color: ${T.amber}; }
  .wkev { border-radius: 5px; padding: 3px 5px; margin-bottom: 3px; cursor: pointer; border-left: 2px solid transparent; }
  .wkev-time { font-size: 8px; font-family: 'JetBrains Mono', monospace; opacity: 0.6; }
  .wkev-title { font-size: 9px; font-weight: 600; color: ${T.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }

  /* ── Week Plan blocks ── */
  .wp-hdr { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px 0; }
  .wp-wlbl { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .wp-days { display: flex; gap: 5px; padding: 10px 20px 0; overflow-x: auto; scrollbar-width: none; }
  .wp-days::-webkit-scrollbar { display: none; }
  .wpdchip { display: flex; flex-direction: column; align-items: center; padding: 8px 10px; border-radius: 10px; border: 1px solid ${T.border}; cursor: pointer; transition: all 0.15s; min-width: 44px; flex-shrink: 0; }
  .wpdchip.active { background: ${T.amberGlow}; border-color: ${T.amberDim}; }
  .wpdn { font-size: 9px; font-weight: 600; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; }
  .wpdchip.active .wpdn { color: ${T.amberText}; }
  .wpdd { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: ${T.text2}; line-height: 1; margin-top: 2px; }
  .wpdchip.active .wpdd { color: ${T.amber}; }
  .wp-theme-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px 0; }
  .wp-tbadge { font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px; }
  .wp-hint { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .blk { display: flex; gap: 10px; }
  .blk-tc { display: flex; flex-direction: column; align-items: center; width: 44px; flex-shrink: 0; }
  .blk-time { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.amber}; line-height: 1; padding-top: 2px; font-weight: 500; }
  .blk-line { width: 1px; flex: 1; min-height: 16px; margin-top: 5px; }
  .blk-card { flex: 1; border-radius: 10px; padding: 11px 13px; margin-bottom: 8px; border: 1px solid ${T.border}; transition: all 0.15s; cursor: pointer; }
  .blk-card:hover { border-color: ${T.border2}; }
  .blk-card.sel { border-color: ${T.amber}; }
  .blk-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .blk-tagrow { display: flex; align-items: center; gap: 6px; }
  .blk-tag { font-size: 9px; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .blk-dur { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .blk-chk { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid ${T.border2}; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; transition: all 0.15s; }
  .blk-title { font-size: 13px; font-weight: 600; color: ${T.text}; line-height: 1.3; margin-bottom: 3px; }
  .blk-desc { font-size: 11px; color: ${T.text2}; line-height: 1.6; }
  .copybtn { padding: 6px 13px; background: ${T.amber}; border: none; border-radius: 20px; color: #000; font-weight: 700; font-size: 10px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; white-space: nowrap; letter-spacing: 0.3px; }
  .copybtn.copied { background: ${T.green}; }
  .sghint { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; padding: 0 0 10px; }

  /* ── Goat Funded ── */
  .ptbar { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 15px 16px; margin-bottom: 8px; }
  .ptrow { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .pttitle { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .ptct { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: ${T.violet}; font-weight: 500; }
  .ptprog { height: 6px; background: ${T.border2}; border-radius: 3px; overflow: hidden; }
  .ptfill { height: 100%; background: linear-gradient(90deg, ${T.violet}, #e879f9); border-radius: 3px; transition: width 0.5s ease; }
  .ptadj { display: flex; gap: 8px; margin-top: 12px; align-items: center; }
  .ptinput { width: 60px; background: ${T.surface2}; border: 1px solid ${T.border2}; border-radius: 8px; padding: 7px 9px; color: ${T.text}; font-family: 'JetBrains Mono', monospace; font-size: 12px; outline: none; text-align: center; }
  .ptinput:focus { border-color: ${T.violet}; }
  .ptbtn { padding: 7px 14px; border-radius: 8px; border: 1px solid ${T.border2}; background: transparent; color: ${T.text2}; font-size: 12px; font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.15s; font-weight: 500; }
  .ptbtn:hover { border-color: ${T.violet}; color: ${T.violet}; }
  .pt-history { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
  .pt-hist-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${T.border}; }
  .pt-hist-row:last-child { border-bottom: none; }
  .pt-hist-month { font-size: 12px; font-weight: 500; }
  .pt-hist-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.violet}; font-weight: 500; }
  .pt-hist-bar { height: 3px; background: ${T.border2}; border-radius: 2px; margin-top: 4px; overflow: hidden; width: 100px; }
  .pt-hist-fill { height: 100%; background: ${T.violet}; border-radius: 2px; }
  .slk-item { display: flex; gap: 10px; padding: 11px 0; border-bottom: 1px solid ${T.border}; align-items: flex-start; }
  .slk-item:last-child { border-bottom: none; }
  .slk-dot { width: 8px; height: 8px; border-radius: 50%; background: ${T.violet}; flex-shrink: 0; margin-top: 4px; }
  .slk-dot.done { background: ${T.border2}; }
  .slk-body { flex: 1; min-width: 0; }
  .slk-from { font-size: 12px; font-weight: 600; color: ${T.text}; }
  .slk-ch { font-size: 10px; color: ${T.violet}; font-family: 'JetBrains Mono', monospace; margin-left: 6px; opacity: 0.8; }
  .slk-msg { font-size: 12px; color: ${T.text2}; line-height: 1.5; margin-top: 3px; }
  .slk-date { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
  .seenbtn { padding: 4px 9px; border-radius: 5px; border: 1px solid ${T.border2}; background: transparent; color: ${T.text3}; font-size: 10px; font-family: 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; margin-top: 1px; }
  .seenbtn:hover { border-color: ${T.violet}; color: ${T.violet}; }
  .seenbtn.done { opacity: 0.3; cursor: default; }

  /* ── Training ── */
  .racecard { background: linear-gradient(135deg, ${T.surface}, rgba(134,239,172,0.04)); border: 1px solid rgba(134,239,172,0.15); border-radius: 12px; padding: 16px 18px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .race-l { font-size: 10px; color: ${T.text2}; margin-bottom: 3px; font-weight: 500; letter-spacing: 0.5px; }
  .race-n { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
  .race-d { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
  .race-num { font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; color: ${T.sage}; line-height: 1; }
  .race-numl { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; text-align: right; margin-top: 2px; }
  .logentry { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 13px 15px; margin-bottom: 7px; }
  .log-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 7px; }
  .log-type { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; }
  .log-date { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .log-stats { display: flex; gap: 12px; margin-bottom: 7px; }
  .log-stat { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: ${T.sage}; font-weight: 500; }
  .log-feel { display: flex; gap: 4px; margin-bottom: 6px; }
  .log-notes { font-size: 12px; color: ${T.text2}; line-height: 1.6; }
  .addlogbtn { width: 100%; padding: 11px; background: transparent; border: 1px dashed ${T.border2}; border-radius: 10px; color: ${T.text3}; font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; margin-top: 4px; font-weight: 500; }
  .addlogbtn:hover { border-color: ${T.sage}; color: ${T.sage}; }
  .logform { background: ${T.surface}; border: 1px solid ${T.border2}; border-radius: 12px; padding: 16px 18px; margin-bottom: 8px; }
  .lft { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 14px; color: ${T.sage}; }
  .flbl { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; font-weight: 600; }
  .finput { width: 100%; background: ${T.bg2}; border: 1px solid ${T.border2}; border-radius: 8px; padding: 9px 11px; color: ${T.text}; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; margin-bottom: 12px; }
  .finput:focus { border-color: ${T.sage}; }
  .finput::placeholder { color: ${T.text3}; }
  .frow2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .feelpicker { display: flex; gap: 6px; margin-bottom: 12px; }
  .feelbtn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${T.border2}; background: transparent; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .feelbtn.sel { border-color: ${T.sage}; background: rgba(134,239,172,0.08); }
  .savebtn { width: 100%; padding: 10px; background: ${T.sage}; border: none; border-radius: 8px; color: #000; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .cancelbtn { width: 100%; padding: 10px; background: ${T.surface2}; border: none; border-radius: 8px; color: ${T.text2}; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; margin-top: 6px; }

  /* ── Me / Habits ── */
  .hcard { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
  .hhdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .hname { font-size: 13px; font-weight: 500; }
  .hct { font-size: 12px; color: ${T.amber}; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
  .hprog { height: 3px; background: ${T.border2}; border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
  .hfill { height: 100%; background: ${T.amber}; border-radius: 2px; transition: width 0.4s ease; }
  .hdays { display: flex; gap: 4px; }
  .hday { flex: 1; height: 28px; border-radius: 6px; border: 1px solid ${T.border}; font-size: 9px; display: flex; align-items: center; justify-content: center; color: ${T.text3}; cursor: pointer; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .hday.done { background: ${T.amber}; border-color: ${T.amber}; color: #000; font-weight: 700; }
  .hday:not(.done):hover { border-color: ${T.amberDim}; color: ${T.amber}; }
  .addrow { display: flex; gap: 8px; margin-top: 12px; }
  .addinput { flex: 1; background: ${T.surface2}; border: 1px solid ${T.border2}; border-radius: 8px; padding: 9px 12px; color: ${T.text}; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; }
  .addinput:focus { border-color: ${T.amberDim}; }
  .addinput::placeholder { color: ${T.text3}; }
  .addbtn { padding: 9px 16px; background: ${T.amber}; border: none; border-radius: 8px; color: #000; font-weight: 700; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }

  /* ── Weekly Score ── */
  .sco-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
  .sco-item { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 13px 14px; }
  .sco-val { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: ${T.amber}; line-height: 1; }
  .sco-lbl { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; letter-spacing: 0.5px; }
  .sco-prog { height: 3px; background: ${T.border2}; border-radius: 2px; margin-top: 8px; overflow: hidden; }
  .sco-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

  /* ── Weekly Intentions ── */
  .intent-card { background: ${T.surface}; border: 1px solid ${T.amberDim}; border-radius: 12px; padding: 15px 16px; margin-bottom: 8px; }
  .intent-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .intent-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: ${T.amberText}; }
  .intent-week { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .intent-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid ${T.border}; }
  .intent-item:last-child { border-bottom: none; }
  .intent-num { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: ${T.amberDim}; width: 18px; flex-shrink: 0; }
  .intent-input { flex: 1; background: transparent; border: none; outline: none; color: ${T.text}; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; }
  .intent-input::placeholder { color: ${T.text3}; }
  .intent-set-btn { padding: 6px 14px; background: ${T.amber}; border: none; border-radius: 20px; color: #000; font-weight: 700; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; letter-spacing: 0.3px; }

  /* ── Meta Ads ── */
  .ads-filter { display: flex; gap: 4px; padding: 10px 0 0; overflow-x: auto; scrollbar-width: none; }
  .ads-filter::-webkit-scrollbar { display: none; }
  .ads-sum { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
  .ads-sum-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 12px 14px; }
  .ads-sum-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: ${T.amber}; line-height: 1; }
  .ads-sum-lbl { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; letter-spacing: 0.3px; }
  .ad-row { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; padding: 13px 15px; margin-bottom: 7px; }
  .ad-name { font-size: 12px; font-weight: 600; margin-bottom: 10px; color: ${T.text}; line-height: 1.4; }
  .ad-stats { display: flex; gap: 8px; flex-wrap: wrap; }
  .ad-stat { background: ${T.surface2}; border-radius: 8px; padding: 7px 10px; text-align: center; min-width: 56px; }
  .ad-stat-val { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: ${T.amber}; line-height: 1; }
  .ad-stat-lbl { font-size: 9px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }

  /* ── Reading list ── */
  .read-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${T.border}; cursor: pointer; transition: opacity 0.15s; }
  .read-item:last-child { border-bottom: none; }
  .read-chk { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid ${T.border2}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .read-chk.done { background: ${T.amber}; border-color: ${T.amber}; }
  .read-chk.done::after { content: '✓'; color: #000; font-size: 11px; font-weight: 800; }
  .read-body { flex: 1; }
  .read-title { font-size: 13px; font-weight: 500; line-height: 1.3; }
  .read-title.done { text-decoration: line-through; opacity: 0.4; }
  .read-author { font-size: 11px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }

  /* ── Pomodoro ── */
  .pomo-fab { position: fixed; bottom: 104px; right: calc(50% - 228px); width: 46px; height: 46px; background: ${T.surface}; border: 1px solid ${T.border2}; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 150; font-size: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); transition: all 0.2s; }
  .pomo-fab:hover { border-color: ${T.amberDim}; transform: scale(1.06); }
  .pomo-fab.running { border-color: ${T.amber}; background: ${T.amberGlow}; box-shadow: 0 4px 20px rgba(245,158,11,0.2); }
  .pomo-panel { position: fixed; bottom: 104px; right: calc(50% - 236px); width: 226px; background: ${T.surface}; border: 1px solid ${T.border2}; border-radius: 16px; padding: 18px; z-index: 151; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
  .pomo-title { font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${T.amber}; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
  .pomo-close { font-size: 16px; cursor: pointer; color: ${T.text3}; line-height: 1; }
  .pomo-time { font-family: 'JetBrains Mono', monospace; font-size: 42px; font-weight: 400; color: ${T.text}; text-align: center; letter-spacing: 3px; margin-bottom: 6px; }
  .pomo-phase { font-size: 10px; color: ${T.text3}; text-align: center; font-family: 'JetBrains Mono', monospace; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 2px; }
  .pomo-phase.work { color: ${T.amber}; } .pomo-phase.brk { color: ${T.sage}; }
  .pomo-prog { height: 3px; background: ${T.border2}; border-radius: 2px; margin-bottom: 16px; overflow: hidden; }
  .pomo-fill { height: 100%; border-radius: 2px; transition: width 0.5s linear; }
  .pomo-btns { display: flex; gap: 7px; }
  .pomo-btn { flex: 1; padding: 9px; border: 1px solid ${T.border2}; background: transparent; border-radius: 8px; color: ${T.text2}; font-size: 12px; font-family: 'Inter', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .pomo-btn.primary { background: ${T.amber}; border-color: ${T.amber}; color: #000; }
  .pomo-btn:hover:not(.primary) { border-color: ${T.amberDim}; color: ${T.amber}; }
  .pomo-count { font-size: 10px; color: ${T.text3}; text-align: center; margin-top: 10px; font-family: 'JetBrains Mono', monospace; }

  /* ── Bottom nav ── */
  .bnav {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 480px;
    background: rgba(8,11,15,0.98); backdrop-filter: blur(20px);
    border-top: 1px solid ${T.border};
    display: flex; padding: 8px 0 14px; z-index: 200;
  }
  .bni { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: 3px 0; }
  .bni-icon { font-size: 18px; opacity: 0.25; transition: all 0.15s; }
  .bni-lbl { font-size: 9px; color: ${T.text3}; font-weight: 600; font-family: 'Inter', sans-serif; transition: all 0.15s; letter-spacing: 0.3px; text-transform: uppercase; }
  .bni.active .bni-icon { opacity: 1; }
  .bni.active .bni-lbl { color: ${T.amber}; }

  /* ── Voice Briefing ── */
  .vb-bar {
    padding: 12px 20px;
    background: linear-gradient(90deg, rgba(245,158,11,0.06), transparent);
    border-bottom: 1px solid ${T.border};
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .vb-left { flex: 1; min-width: 0; }
  .vb-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: ${T.amberText}; margin-bottom: 2px; }
  .vb-subtitle { font-size: 10px; color: ${T.text3}; font-family: 'JetBrains Mono', monospace; }
  .vb-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 20px;
    border: 1px solid ${T.amberDim}; background: ${T.amberGlow};
    color: ${T.amberText}; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  }
  .vb-btn:hover { background: rgba(245,158,11,0.18); }
  .vb-btn.playing { background: ${T.amber}; color: #000; border-color: ${T.amber}; }
  .vb-btn.loading { opacity: 0.7; cursor: not-allowed; }
  .vb-wave { display: flex; align-items: center; gap: 2px; height: 14px; }
  .vb-wave span {
    display: block; width: 3px; border-radius: 2px; background: currentColor;
    animation: wave 0.8s ease-in-out infinite;
  }
  .vb-wave span:nth-child(1) { height: 4px; animation-delay: 0s; }
  .vb-wave span:nth-child(2) { height: 10px; animation-delay: 0.15s; }
  .vb-wave span:nth-child(3) { height: 14px; animation-delay: 0.3s; }
  .vb-wave span:nth-child(4) { height: 8px; animation-delay: 0.45s; }
  .vb-wave span:nth-child(5) { height: 4px; animation-delay: 0.6s; }
  @keyframes wave {
    0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
    50% { transform: scaleY(1); opacity: 1; }
  }

  .empty { text-align: center; padding: 32px 20px; color: ${T.text3}; font-size: 13px; }
  .date-inp { flex: 1; background: ${T.surface2}; border: 1px solid ${T.border2}; border-radius: 8px; padding: 8px 10px; color: ${T.text}; font-family: 'JetBrains Mono', monospace; font-size: 11px; outline: none; }
  .date-inp:focus { border-color: ${T.amberDim}; }

  @keyframes fi { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .fi { animation: fi 0.22s ease forwards; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;;

// ── Shared helpers ────────────────────────────────────────────────────────────
function Bdg({type}){ if(!type)return null; return <span className={`bdg bdg-${type}`}>{type}</span>; }
function getDueCls(iso){ if(iso<todayISO)return"overdue"; if(iso===todayISO)return"today"; return"future"; }
function getDueLbl(iso, time=null){
  const datePart = iso<todayISO ? `Overdue ${fmtDate(new Date(iso+"T00:00:00"))}` :
                   iso===todayISO ? "Due today" :
                   fmtDate(new Date(iso+"T00:00:00"));
  return time ? `${datePart} · ${time}` : datePart;
}
function fmtLogDate(iso){
  if(iso===todayISO)return"Today";
  if(iso===daysAgo(1))return"Yesterday";
  const d=new Date(iso+"T00:00:00");
  return`${DAY_NAMES[d.getDay()].slice(0,3)}, ${fmtDate(d)}`;
}
const FEEL_EMOJIS=["😴","😓","😐","💪","🔥"];

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
const SUGGESTED_ACTIVITIES=[
  {time:"09:00",title:"📱 Reply to Client Messages",dur:"15 min",type:"calls",desc:"Slot 1 — morning triage."},
  {time:"09:15",title:"KPIs — Previous Day",dur:"15 min",type:"work",desc:"Fill in yesterday's KPIs before anything else."},
  {time:"12:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 2 — midday sweep after lunch."},
  {time:"14:00",title:"Follow-Up Calls",dur:"1.5 hrs",type:"calls",desc:"Afternoon calling block — best answer rates late afternoon."},
  {time:"15:30",title:"Goat Funded — Slack Review",dur:"1 hr",type:"goat",desc:"Review #ai-bot-workflows-improvements. 4 open issues."},
  {time:"17:30",title:"📱 Reply to Client Messages",dur:"30 min",type:"calls",desc:"Slot 3 — end of day sweep."},
  {time:"20:00",title:"💼 Part Time — Goat Funded",dur:"2 hrs",type:"goat",desc:"Evening shift. You're at 6.5/15 hrs this week."},
  {time:"22:00",title:"🏃 Running — MUST",dur:"45 min",type:"training",desc:"Runna session. Late night easy run."},
];

function TodayTab({followUps,tasks,onFUToggle,onTaskToggle,setTab}){
  const [intentions, setIntentions] = useState(["","",""]);
  const [intentionsSaved, setIntentionsSaved] = useState(false);
  const [adsFilter, setAdsFilter] = useState("yesterday");
  const isMonday = now.getDay() === 1;
  const weekStr = `Week of ${fmtDate(NEXT_WEEK_LABELS[0] ? addDays(now, -(now.getDay()===0?6:now.getDay()-1)) : now)}`;

  const saveIntentions = () => { if(intentions.some(i=>i.trim())) setIntentionsSaved(true); };
  const totalSpend = META_ADS_DEMO.reduce((s,a)=>s+a.spend,0);
  const totalLeads = META_ADS_DEMO.reduce((s,a)=>s+a.leads,0);
  const avgCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : "—";

  const [selActs,setSelActs]=useState({});
  const [copied,setCopied]=useState(false);

  const overdueFU=followUps.filter(f=>f.due<todayISO&&!f.done);
  const overdueTasks=tasks.filter(t=>t.due<todayISO&&!t.done);
  const todayEvts=CAL_EVENTS.filter(e=>e.date===todayISO);

  // Combined priority list: overdue FUs + overdue tasks, sorted by due then priority
  const priOrder={urgent:0,high:1,normal:2,low:3};
  const combined=[
    ...overdueFU.map(f=>({...f,kind:"fu"})),
    ...overdueTasks.map(t=>({...t,kind:"task",client:t.name,note:t.list})),
  ].sort((a,b)=>{
    if(a.due!==b.due)return a.due.localeCompare(b.due);
    return (priOrder[a.priority]||2)-(priOrder[b.priority]||2);
  });

  const top3=combined.slice(0,3);
  const toggleAct=(i)=>setSelActs(p=>({...p,[i]:!p[i]}));
  const selItems=SUGGESTED_ACTIVITIES.filter((_,i)=>selActs[i]);
  const anySel=selItems.length>0;

  const copyForClaude=()=>{
    const lines=selItems.map(a=>`- ${a.time} | "${a.title}" | ${a.dur}`).join("\n");
    navigator.clipboard.writeText(`Please add these to my Google Calendar for today (${todayStr}):\n${lines}`)
      .then(()=>{setCopied(true);setTimeout(()=>setCopied(false),3000);});
  };

  return(
    <div className="fi">
      <div className="sec">
        <div className="sgrid">
          <div className="scard">
            <div className={`sval ${overdueFU.length>0?"bad":"good"}`}>{overdueFU.length}</div>
            <div className="slabel">FU Overdue</div>
          </div>
          <div className="scard">
            <div className="sval">{todayEvts.length}</div>
            <div className="slabel">Events today</div>
          </div>
          <div className="scard">
            <div className="sval" style={{color:T.sage}}>{daysToRace}</div>
            <div className="slabel">Days to race</div>
          </div>
        </div>
      </div>

      {/* Weekly Intentions */}
      <div className="sec">
        <div className="intent-card">
          <div className="intent-top">
            <div className="intent-title">🎯 This Week's Intentions</div>
            <div className="intent-week">{weekStr}</div>
          </div>
          {[0,1,2].map(i=>(
            <div key={i} className="intent-item">
              <div className="intent-num">{i+1}</div>
              <input className="intent-input"
                placeholder={intentionsSaved ? "—" : `Goal ${i+1}...`}
                value={intentions[i]}
                onChange={e=>setIntentions(p=>{const x=[...p];x[i]=e.target.value;return x;})}
                readOnly={intentionsSaved}
              />
            </div>
          ))}
          {!intentionsSaved && intentions.some(i=>i.trim()) && (
            <button className="intent-set-btn" style={{marginTop:10,width:"100%"}} onClick={saveIntentions}>
              Set intentions for the week
            </button>
          )}
          {intentionsSaved && (
            <div style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",marginTop:8,textAlign:"right",cursor:"pointer"}} onClick={()=>setIntentionsSaved(false)}>
              Edit ✎
            </div>
          )}
        </div>
      </div>

      {/* Top 3 priorities */}
      {combined.length>0&&(
        <div className="sec">
          <div className="sec-t">🎯 Top Priorities</div>
          {top3.map((item,i)=>(
            <div key={item.id} className={`fu ${item.done?"done":""}`} onClick={()=>item.kind==="fu"?onFUToggle(item.id):onTaskToggle(item.id)}>
              <div className={`fuchk ${item.done?"done":""}`}/>
              <div className="fu-body">
                <div className="fu-top">
                  <span className="fu-name">{item.client||item.name}</span>
                  {item.phone&&(
                    <a
                      className="fu-phone"
                      href={`tel:${formatPhoneLink(item.phone)}`}
                      onClick={e=>e.stopPropagation()}
                      style={{
                        display:"inline-flex",alignItems:"center",gap:4,
                        padding:"3px 8px",borderRadius:6,
                        background:"rgba(245,158,11,0.1)",
                        border:`1px solid ${T.amberDim}`,
                        color:T.amber,fontFamily:"JetBrains Mono,monospace",
                        fontSize:11,textDecoration:"none",fontWeight:600,
                      }}
                    >
                      📞 {item.phone}
                    </a>
                  )}
                  {item.priority&&<Bdg type={item.priority}/>}
                  <span className="bdg bdg-slack" style={{fontSize:8}}>{item.kind==="fu"?"Follow-up":"Task"}</span>
                </div>
                <div className="fu-note">{item.note}</div>
                <div className="fu-foot">
                  <span className={`fu-due ${getDueCls(item.due)}`}>{getDueLbl(item.due)}</span>
                </div>
              </div>
            </div>
          ))}
          {combined.length>3&&(
            <div style={{fontSize:10,color:T.text3,textAlign:"center",padding:"5px 0",cursor:"pointer",fontFamily:"JetBrains Mono,monospace"}}
              onClick={()=>setTab("rh")}>+{combined.length-3} more →</div>
          )}
        </div>
      )}

      {/* Schedule */}
      <div className="sec">
        <div className="sec-t">📅 Today's Schedule</div>
        <div className="card">
          {todayEvts.length===0
            ?<div className="empty">No events scheduled</div>
            :todayEvts.map((e,i)=>{
              const col=CAL_COLORS[e.cal]||{bg:"rgba(71,85,105,0.1)",border:T.text3,text:T.text3};
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:i<todayEvts.length-1?`1px solid ${T.border}`:"none"}}>
                  <span style={{fontSize:9,fontFamily:"JetBrains Mono,monospace",color:T.text3,width:40,flexShrink:0}}>{e.start}</span>
                  <div style={{width:5,height:5,borderRadius:2,background:col.border,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:600}}>{e.title}</div>
                    <div style={{fontSize:9,color:col.text,fontFamily:"JetBrains Mono,monospace"}}>{e.cal}</div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Meta Ads */}
      <div className="sec">
        <div className="sec-t">📊 Meta Ads — Right Homess</div>
        <div className="ads-filter">
          {["yesterday","week","month"].map(f=>(
            <button key={f} className={`stab ${adsFilter===f?"active":""}`} style={{fontSize:10}} onClick={()=>setAdsFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{padding:"8px 0"}}>
          <div className="ads-sum">
            <div className="ads-sum-card">
              <div className="ads-sum-val">€{totalSpend.toFixed(2)}</div>
              <div className="ads-sum-lbl">Total Spend</div>
            </div>
            <div className="ads-sum-card">
              <div className="ads-sum-val">{totalLeads}</div>
              <div className="ads-sum-lbl">New Leads</div>
            </div>
            <div className="ads-sum-card">
              <div className="ads-sum-val">€{avgCPL}</div>
              <div className="ads-sum-lbl">Avg Cost / Lead</div>
            </div>
            <div className="ads-sum-card">
              <div className="ads-sum-val">{META_ADS_DEMO.reduce((s,a)=>s+a.reach,0).toLocaleString()}</div>
              <div className="ads-sum-lbl">Total Reach</div>
            </div>
          </div>
          {META_ADS_DEMO.map((ad,i)=>(
            <div key={i} className="ad-row">
              <div className="ad-name">{ad.name}</div>
              <div className="ad-stats">
                <div className="ad-stat"><div className="ad-stat-val">€{ad.spend.toFixed(2)}</div><div className="ad-stat-lbl">Spend</div></div>
                <div className="ad-stat"><div className="ad-stat-val">{ad.leads}</div><div className="ad-stat-lbl">Leads</div></div>
                <div className="ad-stat"><div className="ad-stat-val">{ad.cpl?`€${ad.cpl.toFixed(2)}`:"—"}</div><div className="ad-stat-lbl">CPL</div></div>
                <div className="ad-stat"><div className="ad-stat-val">{ad.reach.toLocaleString()}</div><div className="ad-stat-lbl">Reach</div></div>
              </div>
            </div>
          ))}
          <div style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",textAlign:"right",marginTop:4}}>Showing: {adsFilter.charAt(0).toUpperCase()+adsFilter.slice(1)} · Demo data · Live after Vercel</div>
        </div>
      </div>

      {/* Suggested */}
      <div className="sec" style={{paddingBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div className="sec-t" style={{marginBottom:0}}>💡 Suggested Activities</div>
          {anySel&&<button className={`copybtn ${copied?"copied":""}`} onClick={copyForClaude}>{copied?"✓ Copied!":`Add ${selItems.length} to Cal`}</button>}
        </div>
        {!anySel&&<div className="sghint">Tap to select → paste to Claude → added to calendar</div>}
        {SUGGESTED_ACTIVITIES.map((b,i)=>{
          const sel=!!selActs[i];
          const tc=TYPE_COLORS[b.type]||TYPE_COLORS.work;
          return(
            <div key={i} className="blk" onClick={()=>toggleAct(i)}>
              <div className="blk-tc">
                <div className="blk-time" style={{color:sel?"#fff":tc.accent}}>{b.time}</div>
                {i<SUGGESTED_ACTIVITIES.length-1&&<div className="blk-line" style={{background:`linear-gradient(to bottom,${tc.accent}44,transparent)`}}/>}
              </div>
              <div className={`blk-card ${sel?"sel":""}`} style={{background:tc.bg,borderColor:sel?tc.accent:T.border}}>
                <div className="blk-top">
                  <div className="blk-tagrow">
                    <span className="blk-tag" style={{background:`${tc.accent}22`,color:tc.accent}}>{tc.label}</span>
                    {b.dur&&<span className="blk-dur">{b.dur}</span>}
                  </div>
                  <div className="blk-chk" style={sel?{background:tc.accent,borderColor:tc.accent,color:"#000"}:{}}>{sel&&"✓"}</div>
                </div>
                <div className="blk-title">{b.title}</div>
                <div className="blk-desc">{b.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RIGHT HOMESS TAB ─────────────────────────────────────────────────────────
function RHTab({followUps,tasks,onFUToggle,onTaskToggle,onRefresh,refreshing}){
  const [sub,setSub]=useState("followups");
  const [fuFilter,setFuFilter]=useState("all");
  const [taskFilter,setTaskFilter]=useState("all");
  const [customFrom,setCustomFrom]=useState(todayISO);
  const [customTo,setCustomTo]=useState(toISO(addDays(now,7)));
  const [appliedFrom,setAppliedFrom]=useState(null);
  const [appliedTo,setAppliedTo]=useState(null);

  const priOrder={urgent:0,high:1,normal:2,low:3,null:3};
  const sortedFU=[...followUps].sort((a,b)=>{
    // Sort by date first
    if(a.due!==b.due) return a.due.localeCompare(b.due);
    // Then by time (tasks with time come before those without)
    if(a.dueTime&&!b.dueTime) return -1;
    if(!a.dueTime&&b.dueTime) return 1;
    if(a.dueTime&&b.dueTime&&a.dueTime!==b.dueTime) return a.dueTime.localeCompare(b.dueTime);
    // Then by priority
    return(priOrder[a.priority]??2)-(priOrder[b.priority]??2);
  });
  const filteredFU=sortedFU.filter(f=>{
    if(fuFilter==="all")return !f.done;
    if(fuFilter==="overdue")return f.due<todayISO&&!f.done;
    if(fuFilter==="today")return f.due===todayISO&&!f.done;
    if(fuFilter==="upcoming")return f.due>todayISO&&!f.done;
    if(fuFilter==="completed")return f.done;
    return true;
  });

  const filteredTasks=tasks.filter(t=>{
    if(taskFilter==="all")return !t.done;
    if(taskFilter==="today")return t.due===todayISO&&!t.done;
    if(taskFilter==="tomorrow")return t.due===toISO(addDays(now,1))&&!t.done;
    if(taskFilter==="week")return t.due>=todayISO&&t.due<=toISO(addDays(now,7))&&!t.done;
    if(taskFilter==="custom"&&appliedFrom&&appliedTo)return t.due>=appliedFrom&&t.due<=appliedTo&&!t.done;
    if(taskFilter==="completed")return t.done;
    return true;
  }).sort((a,b)=>{
    if(a.due!==b.due) return a.due.localeCompare(b.due);
    if(a.dueTime&&!b.dueTime) return -1;
    if(!a.dueTime&&b.dueTime) return 1;
    if(a.dueTime&&b.dueTime&&a.dueTime!==b.dueTime) return a.dueTime.localeCompare(b.dueTime);
    const p={urgent:0,high:1,normal:2,low:3};
    return(p[a.priority]??2)-(p[b.priority]??2);
  });

  const grouped=filteredTasks.reduce((acc,t)=>{(acc[t.due]=acc[t.due]||[]).push(t);return acc;},{});
  const overdueCount=followUps.filter(f=>f.due<todayISO&&!f.done).length;

  return(
    <div className="fi">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 0"}}>
        <div style={{display:"flex",gap:4}}>
          <button className={`stab ${sub==="followups"?"active":""}`} onClick={()=>setSub("followups")}>
            Follow-Ups {overdueCount>0&&<span style={{marginLeft:3,background:T.rose,color:"#fff",borderRadius:4,padding:"0 4px",fontSize:8}}>{overdueCount}</span>}
          </button>
          <button className={`stab ${sub==="tasks"?"active":""}`} onClick={()=>setSub("tasks")}>Tasks</button>
        </div>
        <button onClick={onRefresh} disabled={refreshing} style={{
          padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border2}`,
          background:"transparent",color:refreshing?T.amber:T.text3,
          fontSize:11,fontFamily:"Inter,sans-serif",cursor:"pointer",
          transition:"all 0.15s",display:"flex",alignItems:"center",gap:4,
        }}>
          <span style={{display:"inline-block",animation:refreshing?"spin 1s linear infinite":"none"}}>⟳</span>
          {refreshing?"Syncing...":"Refresh"}
        </button>
      </div>

      {sub==="followups"&&(
        <>
          <div className="snav" style={{paddingTop:8}}>
            {["all","overdue","today","upcoming","completed"].map(f=>(
              <button key={f} className={`stab ${fuFilter===f?"active":""}`} onClick={()=>setFuFilter(f)} style={{fontSize:10}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div className="sec">
            {filteredFU.length===0
              ?<div className="empty">All clear ✓</div>
              :filteredFU.length===0
              ?<div className="empty" style={{padding:"30px 0"}}>
                {fuFilter==="all"?"🎉 All follow-ups cleared! Great work.":
                 fuFilter==="overdue"?"✓ No overdue follow-ups":
                 fuFilter==="today"?"✓ No follow-ups due today":
                 fuFilter==="upcoming"?"No upcoming follow-ups":
                 fuFilter==="completed"?"No completed follow-ups yet":"All clear"}
               </div>
              :filteredFU.map(f=>(
                <div key={f.id} className={`fu ${f.done?"done":""}`}>
                  <div className={`fuchk ${f.done?"done":""}`} onClick={()=>onFUToggle(f.id)}/>
                  <div className="fu-body">
                    <div className="fu-top">
                      <span className="fu-name" style={{textDecoration:f.done?"line-through":"none",opacity:f.done?0.5:1}}>{f.client}</span>
                      {f.phone&&!f.done&&(
                        <a
                          className="fu-phone"
                          href={`tel:${formatPhoneLink(f.phone)}`}
                          onClick={e=>e.stopPropagation()}
                          style={{
                            display:"inline-flex",alignItems:"center",gap:4,
                            padding:"3px 8px",borderRadius:6,
                            background:"rgba(245,158,11,0.1)",
                            border:`1px solid ${T.amberDim}`,
                            color:T.amber,fontFamily:"JetBrains Mono,monospace",
                            fontSize:11,textDecoration:"none",fontWeight:600,
                            transition:"all 0.15s",
                          }}
                        >
                          📞 {f.phone}
                        </a>
                      )}
                      {f.priority&&!f.done&&<Bdg type={f.priority}/>}
                      {f.done&&<span className="bdg" style={{background:"rgba(74,222,128,0.1)",color:T.green}}>DONE</span>}
                    </div>
                    {!f.done&&<div className="fu-note">{f.note}</div>}
                    <div className="fu-foot">
                      {!f.done&&<span className={`fu-due ${getDueCls(f.due)}`}>{getDueLbl(f.due,f.dueTime)}</span>}
                      <span style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace"}}>{f.list}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}

      {sub==="tasks"&&(
        <>
          <div className="snav" style={{paddingTop:8}}>
            {["all","today","tomorrow","week","custom","completed"].map(f=>(
              <button key={f} className={`stab ${taskFilter===f?"active":""}`} onClick={()=>setTaskFilter(f)} style={{fontSize:10}}>
                {f==="custom"?"Range":f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          {taskFilter==="custom"&&(
            <div style={{display:"flex",gap:6,padding:"8px 18px 0",alignItems:"center"}}>
              <input type="date" className="date-inp" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}/>
              <span style={{fontSize:11,color:T.text3}}>→</span>
              <input type="date" className="date-inp" value={customTo} onChange={e=>setCustomTo(e.target.value)}/>
              <button className="addbtn" style={{fontSize:10,padding:"5px 9px"}} onClick={()=>setAppliedFrom(customFrom)||setAppliedTo(customTo)}>Go</button>
            </div>
          )}
          <div style={{padding:"5px 18px 0",fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace"}}>{filteredTasks.length} tasks</div>
          <div className="sec">
            {Object.keys(grouped).length===0
              ?<div className="empty" style={{padding:"30px 0"}}>
                {taskFilter==="completed"?"No completed tasks yet":"🎉 All tasks cleared! Great work."}
               </div>
              :Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([date,grp])=>(
                <div key={date}>
                  <div className="dgrp-label" style={{color:date<todayISO?T.rose:T.text3}}>
                    {date<todayISO?"⚠ Overdue — ":date===todayISO?"Today — ":""}{fmtDate(new Date(date+"T00:00:00"))} · {DAY_NAMES[new Date(date+"T00:00:00").getDay()]}
                  </div>
                  <div className={`card ${date<todayISO?"card-danger":""}`} style={{marginBottom:10}}>
                    {grp.map(t=>(
                      <div key={t.id} className="trow" onClick={()=>onTaskToggle(t.id)}>
                        <div className={`tchk ${t.done?"done":""}`}/>
                        <div style={{flex:1}}>
                          <div className={`tname ${t.done?"done":""}`}>{t.name}</div>
                          <div className="tmeta"><Bdg type={t.priority}/><span style={{marginLeft:t.priority?4:0}}>{t.list}</span>{t.dueTime&&<span style={{marginLeft:6,color:T.amber,fontFamily:"JetBrains Mono,monospace"}}>⏰ {t.dueTime}</span>}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── CALENDAR TAB ─────────────────────────────────────────────────────────────
function CalendarTab(){
  const [view,setView]=useState("day");
  const [dayOff,setDayOff]=useState(0);
  const [weekOff,setWeekOff]=useState(0);
  const [wpDay,setWpDay]=useState(0);
  const [wpSel,setWpSel]=useState({});
  const [wpCopied,setWpCopied]=useState(false);

  const baseDate=addDays(now,dayOff);
  const baseDateISO=toISO(baseDate);
  const isToday=baseDateISO===todayISO;

  const getWeekDates=(off)=>{
    const d=new Date(now); const dow=d.getDay()===0?6:d.getDay()-1;
    d.setDate(d.getDate()-dow+off*7);
    return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x;});
  };
  const weekDates=getWeekDates(weekOff);
  const getEvts=(iso)=>CAL_EVENTS.filter(e=>e.date===iso).sort((a,b)=>a.start.localeCompare(b.start));
  const dayEvts=getEvts(baseDateISO);

  const wpPlan=WEEK_PLAN[wpDay];
  const wpToggle=(i)=>setWpSel(p=>({...p,[`${wpDay}-${i}`]:!p[`${wpDay}-${i}`]}));
  const wpIsSel=(i)=>!!wpSel[`${wpDay}-${i}`];
  const wpTotal=Object.values(wpSel).filter(Boolean).length;

  const wpCopy=()=>{
    const items=Object.entries(wpSel).filter(([,v])=>v).map(([k])=>{
      const[d,i]=k.split("-").map(Number);
      const b=WEEK_PLAN[d].blocks[i];
      return`- ${NEXT_WEEK_LABELS[d].full} ${NEXT_WEEK_LABELS[d].date} at ${b.time} | "${b.title}" | ${b.dur}`;
    });
    navigator.clipboard.writeText(`Add to my Google Calendar for week of ${NEXT_WEEK_LABELS[0].date}–${NEXT_WEEK_LABELS[6].date}:\n${items.join("\n")}`)
      .then(()=>{setWpCopied(true);setTimeout(()=>setWpCopied(false),3000);});
  };

  return(
    <div className="fi">
      <div className="cal-tog">
        {["day","week","plan"].map(v=>(
          <button key={v} className={`ctbtn ${view===v?"active":""}`} onClick={()=>setView(v)}>
            {v==="day"?"Day":v==="week"?"Week":"Week Plan"}
          </button>
        ))}
      </div>

      {/* Legend */}
      {view!=="plan"&&(
        <div className="cal-leg">
          {Object.entries(CAL_COLORS).map(([k,v])=>(
            <div key={k} className="cl-item"><div className="cl-dot" style={{background:v.border}}/><span className="cl-lbl">{k}</span></div>
          ))}
        </div>
      )}

      {/* Day view */}
      {view==="day"&&(
        <>
          <div className="cal-dnav">
            <button className="cnbtn" onClick={()=>setDayOff(p=>p-1)}>‹</button>
            <div style={{textAlign:"center"}}>
              <div className="cal-dtitle">{DAY_NAMES[baseDate.getDay()]}, {fmtDate(baseDate)}</div>
              {isToday&&<div style={{fontSize:9,color:T.amber,fontFamily:"JetBrains Mono,monospace",marginTop:2}}>TODAY</div>}
            </div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              {!isToday&&<button className="ctdybtn" onClick={()=>setDayOff(0)}>Today</button>}
              <button className="cnbtn" onClick={()=>setDayOff(p=>p+1)}>›</button>
            </div>
          </div>
          <div style={{paddingTop:10,paddingBottom:16}}>
            {dayEvts.length===0
              ?<div className="empty">No events scheduled</div>
              :dayEvts.map((e,i)=>{
                const col=CAL_COLORS[e.cal]||{bg:"rgba(71,85,105,0.1)",border:T.text3,text:T.text3};
                return(
                  <div key={i} className="cev" style={{background:col.bg,borderLeftColor:col.border}}>
                    <div className="cev-time">{e.start} — {e.end}</div>
                    <div className="cev-title">{e.title}</div>
                    <div className="cev-tag" style={{color:col.text}}>{e.cal}</div>
                  </div>
                );
              })
            }
          </div>
        </>
      )}

      {/* Week view */}
      {view==="week"&&(
        <>
          <div className="cal-dnav">
            <button className="cnbtn" onClick={()=>setWeekOff(p=>p-1)}>‹</button>
            <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:11,color:T.text2}}>
              {fmtDate(weekDates[0])} — {fmtDate(weekDates[6])}
            </div>
            <div style={{display:"flex",gap:5}}>
              {weekOff!==0&&<button className="ctdybtn" onClick={()=>setWeekOff(0)}>Now</button>}
              <button className="cnbtn" onClick={()=>setWeekOff(p=>p+1)}>›</button>
            </div>
          </div>
          <div className="cal-wk">
            <div className="wkcols">
              {weekDates.map((d,i)=>{
                const iso=toISO(d); const isT=iso===todayISO;
                const evts=getEvts(iso);
                return(
                  <div key={i} className="wkcol">
                    <div className={`wkhdr ${isT?"today":""}`}>
                      <div className="wkdn">{DAY_NAMES[d.getDay()].slice(0,3).toUpperCase()}</div>
                      <div className="wknum">{d.getDate()}</div>
                    </div>
                    {evts.length===0
                      ?<div style={{fontSize:8,color:T.text3,textAlign:"center",padding:"3px 0"}}>—</div>
                      :evts.map((e,j)=>{
                        const col=CAL_COLORS[e.cal]||{bg:"rgba(71,85,105,0.1)",border:T.text3};
                        return(
                          <div key={j} className="wkev" style={{background:col.bg,borderLeftColor:col.border}}
                            onClick={()=>{setView("day");setDayOff(Math.round((d-now)/86400000));}}>
                            <div className="wkev-time" style={{color:col.border}}>{e.start}</div>
                            <div className="wkev-title">{e.title}</div>
                          </div>
                        );
                      })
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Week Plan view */}
      {view==="plan"&&(
        <div style={{paddingBottom:20}}>
          <div className="wp-hdr">
            <div className="wp-wlbl">Week of {NEXT_WEEK_LABELS[0].date} — {NEXT_WEEK_LABELS[6].date}</div>
            {wpTotal>0&&<button className={`copybtn ${wpCopied?"copied":""}`} onClick={wpCopy}>{wpCopied?"✓ Copied!":`Add ${wpTotal} to Cal`}</button>}
          </div>
          <div className="wp-days">
            {NEXT_WEEK_LABELS.map((d,i)=>(
              <div key={i} className={`wpdchip ${wpDay===i?"active":""}`} onClick={()=>setWpDay(i)}>
                <div className="wpdn">{d.day}</div>
                <div className="wpdd">{d.date.split(" ")[0]}</div>
              </div>
            ))}
          </div>
          <div className="wp-theme-row">
            <div className="wp-tbadge" style={{
              background:TYPE_COLORS[wpPlan.themeType==="work"?"work":"personal"].bg,
              color:TYPE_COLORS[wpPlan.themeType==="work"?"work":"personal"].accent
            }}>{wpPlan.theme}</div>
            <div className="wp-hint">Tap to select</div>
          </div>
          <div className="sec" style={{paddingTop:12}}>
            {wpPlan.blocks.map((b,i)=>{
              const sel=wpIsSel(i);
              const tc=TYPE_COLORS[b.type]||TYPE_COLORS.work;
              if(b.type==="break"&&!b.desc)return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0",marginBottom:2}}>
                  <span style={{width:40,fontSize:10,fontFamily:"JetBrains Mono,monospace",color:T.text3}}>{b.time}</span>
                  <span style={{fontSize:10,color:T.text3,fontStyle:"italic"}}>— {b.title}{b.dur&&b.dur!=="—"?` (${b.dur})`:""}</span>
                </div>
              );
              return(
                <div key={i} className="blk" onClick={()=>wpToggle(i)}>
                  <div className="blk-tc">
                    <div className="blk-time" style={{color:sel?"#fff":tc.accent}}>{b.time}</div>
                    {i<wpPlan.blocks.length-1&&<div className="blk-line" style={{background:`linear-gradient(to bottom,${tc.accent}44,transparent)`}}/>}
                  </div>
                  <div className={`blk-card ${sel?"sel":""}`} style={{background:tc.bg,borderColor:sel?tc.accent:T.border}}>
                    <div className="blk-top">
                      <div className="blk-tagrow">
                        <span className="blk-tag" style={{background:`${tc.accent}22`,color:tc.accent}}>{tc.label}</span>
                        {b.dur&&b.dur!=="—"&&<span className="blk-dur">{b.dur}</span>}
                      </div>
                      <div className="blk-chk" style={sel?{background:tc.accent,borderColor:tc.accent,color:"#000"}:{}}>{sel&&"✓"}</div>
                    </div>
                    <div className="blk-title">{b.title}</div>
                    {b.desc&&<div className="blk-desc">{b.desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── GOAT FUNDED TAB ───────────────────────────────────────────────────────────
function GoatTab(){
  const TARGET=15;
  const monthKey=getMonthKey();

  // PT hours state: current month + history log
  const [hours,setHours]=useState(6.5);
  const [addHrs,setAddHrs]=useState("");
  const [monthHistory]=useState([
    {key:"2026-04",label:"Apr 2026",hours:14.5},
    {key:"2026-03",label:"Mar 2026",hours:15.0},
    {key:"2026-02",label:"Feb 2026",hours:12.0},
  ]);
  const [showHistory,setShowHistory]=useState(false);
  const [slack,setSlack]=useState(SLACK_INIT);
  const [sub,setSub]=useState("hours");

  const pct=Math.min(100,(hours/TARGET)*100);
  const markSeen=(id)=>setSlack(p=>p.map(s=>s.id===id?{...s,done:true}:s));
  const logHours=()=>{
    const h=parseFloat(addHrs);
    if(!isNaN(h)&&h>0){setHours(p=>Math.min(TARGET,+(p+h).toFixed(1)));setAddHrs("");}
  };
  const unseen=slack.filter(s=>!s.done).length;

  return(
    <div className="fi">
      <div className="snav">
        <button className={`stab ${sub==="hours"?"active":""}`} onClick={()=>setSub("hours")}>Hours Tracker</button>
        <button className={`stab ${sub==="slack"?"active":""}`} onClick={()=>setSub("slack")}>
          Slack Digest {unseen>0&&<span style={{marginLeft:3,background:T.violet,color:"#fff",borderRadius:4,padding:"0 4px",fontSize:8}}>{unseen}</span>}
        </button>
      </div>

      {sub==="hours"&&(
        <div className="sec">
          {/* Current month */}
          <div className="sec-t">This Month — {getMonthLabel(monthKey)}</div>
          <div className="ptbar">
            <div className="ptrow">
              <div className="pttitle">💼 Goat Funded</div>
              <div className="ptct">{hours.toFixed(1)} / {TARGET} hrs</div>
            </div>
            <div className="ptprog"><div className="ptfill" style={{width:`${pct}%`}}/></div>
            <div className="ptadj">
              <input className="ptinput" placeholder="hrs" value={addHrs}
                onChange={e=>setAddHrs(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logHours()}/>
              <button className="ptbtn" onClick={logHours}>+ Log</button>
              <span style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",marginLeft:"auto"}}>
                {(TARGET-hours).toFixed(1)} hrs remaining
              </span>
            </div>
          </div>

          {/* History toggle */}
          <button className="addlogbtn" style={{marginTop:4}} onClick={()=>setShowHistory(p=>!p)}>
            {showHistory?"▲ Hide":"▼ View"} previous months
          </button>

          {showHistory&&(
            <div className="pt-history" style={{marginTop:7}}>
              <div className="sec-t" style={{marginBottom:8}}>Monthly History</div>
              {monthHistory.map(m=>(
                <div key={m.key} className="pt-hist-row">
                  <div>
                    <div className="pt-hist-month">{m.label}</div>
                    <div className="pt-hist-bar" style={{width:120}}>
                      <div className="pt-hist-fill" style={{width:`${Math.min(100,(m.hours/TARGET)*100)}%`}}/>
                    </div>
                  </div>
                  <div className="pt-hist-val">{m.hours.toFixed(1)} / {TARGET} hrs</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {sub==="slack"&&(
        <div className="sec">
          <div className="sec-t">Slack Digest</div>
          <div className="card">
            {slack.map(s=>(
              <div key={s.id} className="slk-item">
                <div className={`slk-dot ${s.done?"done":""}`}/>
                <div className="slk-body">
                  <div><span className="slk-from">{s.from}</span><span className="slk-ch">{s.channel}</span></div>
                  <div className="slk-msg">{s.msg}</div>
                  <div className="slk-date">{s.date}</div>
                </div>
                <button className={`seenbtn ${s.done?"done":""}`} onClick={()=>!s.done&&markSeen(s.id)}>
                  {s.done?"✓":"Seen"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ME TAB ────────────────────────────────────────────────────────────────────
function MeTab(){
  const [sub,setSub]=useState("score");
  const [readingList,setReadingList]=useState(READING_LIST_INIT);
  const [newBook,setNewBook]=useState({title:"",author:""});
  const [habits,setHabits]=useState(HABITS_INIT);
  const [newHabit,setNewHabit]=useState("");
  const [log,setLog]=useState(TRAINING_LOG_INIT);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({type:"",distance:"",duration:"",feel:4,notes:""});

  const toggleH=(hId,dIdx)=>setHabits(p=>p.map(h=>h.id===hId?{...h,days:h.days.map((d,i)=>i===dIdx?!d:d)}:h));
  const addHabit=()=>{if(!newHabit.trim())return;setHabits(p=>[...p,{id:Date.now(),name:newHabit.trim(),days:Array(7).fill(false)}]);setNewHabit("");};
  const saveEntry=()=>{
    if(!form.type)return;
    setLog(p=>[{id:Date.now(),date:todayISO,...form},...p]);
    setForm({type:"",distance:"",duration:"",feel:4,notes:""});
    setShowForm(false);
  };

  const todayIdx=now.getDay()===0?6:now.getDay()-1;
  const habitsToday=habits.filter(h=>h.days[todayIdx]).length;

  const scoreItems=[
    {label:"Tasks Cleared",val:12,total:20,color:T.amber},
    {label:"Viewings Done", val:4, total:8, color:T.ice},
    {label:"Runs Completed",val:4, total:5, color:T.sage},
    {label:"PT Hours",      val:6.5,total:15,color:T.violet},
    {label:"Habits Today",  val:habitsToday,total:habits.length,color:T.amber},
    {label:"Follows Done",  val:6, total:9, color:T.rose},
  ];

  return(
    <div className="fi">
      <div className="snav">
        <button className={`stab ${sub==="score"?"active":""}`} onClick={()=>setSub("score")}>Weekly Score</button>
        <button className={`stab ${sub==="habits"?"active":""}`} onClick={()=>setSub("habits")}>Habits</button>
        <button className={`stab ${sub==="training"?"active":""}`} onClick={()=>setSub("training")}>Training</button>
        <button className={`stab ${sub==="reading"?"active":""}`} onClick={()=>setSub("reading")}>Reading</button>
      </div>

      {sub==="score"&&(
        <div className="sec">
          <div className="sec-t">This Week</div>
          <div className="sco-grid">
            {scoreItems.map((s,i)=>(
              <div key={i} className="sco-item">
                <div className="sco-val">{typeof s.val==="number"&&s.val%1!==0?s.val.toFixed(1):s.val}<span style={{fontSize:11,color:T.text3,fontWeight:400}}>/{s.total}</span></div>
                <div className="sco-lbl">{s.label}</div>
                <div className="sco-prog"><div className="sco-fill" style={{width:`${Math.min(100,(s.val/s.total)*100)}%`,background:s.color}}/></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sub==="habits"&&(
        <div className="sec" style={{paddingBottom:20}}>
          {habits.map(h=>{
            const count=h.days.filter(Boolean).length;
            return(
              <div key={h.id} className="hcard">
                <div className="hhdr"><div className="hname">{h.name}</div><div className="hct">{count}/7</div></div>
                <div className="hprog"><div className="hfill" style={{width:`${(count/7)*100}%`}}/></div>
                <div className="hdays">{WEEK_DAYS.map((d,i)=>(
                  <div key={i} className={`hday ${h.days[i]?"done":""}`} onClick={()=>toggleH(h.id,i)}>{d}</div>
                ))}</div>
              </div>
            );
          })}
          <div className="addrow">
            <input className="addinput" placeholder="Add new habit..." value={newHabit}
              onChange={e=>setNewHabit(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHabit()}/>
            <button className="addbtn" onClick={addHabit}>+</button>
          </div>
        </div>
      )}

      {sub==="reading"&&(
        <div className="sec" style={{paddingBottom:20}}>
          <div className="card">
            {readingList.map(b=>(
              <div key={b.id} className="read-item" onClick={()=>setReadingList(p=>p.map(x=>x.id===b.id?{...x,done:!x.done}:x))}>
                <div className={`read-chk ${b.done?"done":""}`}/>
                <div className="read-body">
                  <div className={`read-title ${b.done?"done":""}`}>{b.title}</div>
                  <div className="read-author">{b.author}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="addrow" style={{flexDirection:"column",gap:5}}>
            <input className="addinput" placeholder="Book title..." value={newBook.title}
              onChange={e=>setNewBook(p=>({...p,title:e.target.value}))}/>
            <div style={{display:"flex",gap:6}}>
              <input className="addinput" placeholder="Author..." value={newBook.author}
                onChange={e=>setNewBook(p=>({...p,author:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"&&newBook.title.trim()){setReadingList(p=>[...p,{id:Date.now(),...newBook,done:false}]);setNewBook({title:"",author:""});}}}/>
              <button className="addbtn" onClick={()=>{if(newBook.title.trim()){setReadingList(p=>[...p,{id:Date.now(),...newBook,done:false}]);setNewBook({title:"",author:""});}}}>+</button>
            </div>
          </div>
        </div>
      )}

      {sub==="training"&&(
        <div className="sec" style={{paddingBottom:20}}>
          {/* Race countdown */}
          <div className="racecard">
            <div>
              <div className="race-l">Training for</div>
              <div className="race-n">🏔 Ultramarathon</div>
              <div className="race-d">July 9, 2026</div>
            </div>
            <div>
              <div className="race-num">{daysToRace}</div>
              <div className="race-numl">days to go</div>
            </div>
          </div>

          {showForm?(
            <div className="logform">
              <div className="lft">Log Today's Session</div>
              <div className="flbl">Session type</div>
              <input className="finput" placeholder="e.g. Easy Run, Tempo, Long Run..." value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}/>
              <div className="frow2">
                <div><div className="flbl">Distance</div><input className="finput" placeholder="e.g. 7km" value={form.distance} onChange={e=>setForm(p=>({...p,distance:e.target.value}))}/></div>
                <div><div className="flbl">Duration</div><input className="finput" placeholder="e.g. 45 min" value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))}/></div>
              </div>
              <div className="flbl">How did you feel?</div>
              <div className="feelpicker">
                {FEEL_EMOJIS.map((e,i)=>(
                  <button key={i} className={`feelbtn ${form.feel===i+1?"sel":""}`} onClick={()=>setForm(p=>({...p,feel:i+1}))}>{e}</button>
                ))}
              </div>
              <div className="flbl">Notes</div>
              <input className="finput" placeholder="How did it go?" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
              <button className="savebtn" onClick={saveEntry}>Save Entry</button>
              <button className="cancelbtn" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          ):(
            <button className="addlogbtn" onClick={()=>setShowForm(true)}>+ Log today's training</button>
          )}

          {log.map(entry=>(
            <div key={entry.id} className="logentry">
              <div className="log-top">
                <div className="log-type">{entry.type}</div>
                <div className="log-date">{fmtLogDate(entry.date)}</div>
              </div>
              <div className="log-stats">
                {entry.distance&&<span className="log-stat">📍 {entry.distance}</span>}
                {entry.duration&&<span className="log-stat">⏱ {entry.duration}</span>}
              </div>
              <div className="log-feel">{FEEL_EMOJIS.map((e,i)=><span key={i} style={{fontSize:13,opacity:i+1===entry.feel?1:0.18}}>{e}</span>)}</div>
              {entry.notes&&<div className="log-notes">{entry.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── POMODORO ──────────────────────────────────────────────────────────────────
function Pomodoro(){
  const WORK_SECS = 25 * 60;
  const BREAK_SECS = 5 * 60;
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("work"); // work | break
  const [secsLeft, setSecsLeft] = useState(WORK_SECS);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSecsLeft(p => {
        if (p <= 1) {
          if (phase === "work") {
            setCycles(c => c + 1);
            setPhase("break");
            return BREAK_SECS;
          } else {
            setPhase("work");
            return WORK_SECS;
          }
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase]);

  const total = phase === "work" ? WORK_SECS : BREAK_SECS;
  const pct = ((total - secsLeft) / total) * 100;
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  const reset = () => { setRunning(false); setPhase("work"); setSecsLeft(WORK_SECS); };

  return (
    <>
      <div className={`pomo-fab ${running ? "running" : ""}`} onClick={() => setOpen(p => !p)}>
        {running ? "⏱" : "🍅"}
      </div>
      {open && (
        <div className="pomo-panel">
          <div className="pomo-title">
            Focus Timer
            <span className="pomo-close" onClick={() => setOpen(false)}>✕</span>
          </div>
          <div className="pomo-time">{mm}:{ss}</div>
          <div className={`pomo-phase ${phase === "work" ? "work" : "brk"}`}>
            {phase === "work" ? "Focus Session" : "Break Time"}
          </div>
          <div className="pomo-prog">
            <div className="pomo-fill" style={{
              width: `${pct}%`,
              background: phase === "work" ? T.amber : T.sage
            }} />
          </div>
          <div className="pomo-btns">
            <button className={`pomo-btn primary`} onClick={() => setRunning(p => !p)}>
              {running ? "Pause" : "Start"}
            </button>
            <button className="pomo-btn" onClick={reset}>Reset</button>
          </div>
          <div className="pomo-count">Cycles completed: {cycles}</div>
        </div>
      )}
    </>
   );
}


// ── VOICE BRIEFING ────────────────────────────────────────────────────────────
function VoiceBriefing({ followUps, tasks, slackUnread, hoursLogged }) {
  const [status, setStatus] = useState("idle"); // idle | loading | playing | done
  const synthRef = typeof window !== "undefined" ? window.speechSynthesis : null;

  const stop = () => {
    if (synthRef) synthRef.cancel();
    setStatus("idle");
  };

  const generateScript = () => {
    const dayName = DAY_NAMES[now.getDay()];
    const overdueFU = followUps.filter(f => f.due < todayISO && !f.done);
    const todayFU = followUps.filter(f => f.due === todayISO && !f.done);
    const overdueTasks = tasks.filter(t => t.due < todayISO && !t.done);
    const urgentFU = overdueFU.find(f => f.priority === "urgent");
    const hoursLeft = Math.max(0, 15 - hoursLogged).toFixed(1);
    const todayEvts = CAL_EVENTS.filter(e => e.date === todayISO);
    const firstEvent = todayEvts[0];

    let script = `Good morning, Quelin. Today is ${dayName}, ${fmtDate(now)}.`;

    // Race countdown
    script += ` ${daysToRace} days until your ultramarathon. Keep training hard.`;

    // Overdue follow-ups
    if (overdueFU.length > 0) {
      script += ` You have ${overdueFU.length} overdue follow-up${overdueFU.length > 1 ? "s" : ""}.`;
      if (urgentFU) {
        script += ` Your most urgent is ${urgentFU.client} at ${urgentFU.phone}. Call them first.`;
      } else {
        script += ` Start with ${overdueFU[0].client} at ${overdueFU[0].phone}.`;
      }
    } else if (todayFU.length > 0) {
      script += ` You have ${todayFU.length} follow-up${todayFU.length > 1 ? "s" : ""} due today.`;
    } else {
      script += ` No overdue follow-ups. Great work.`;
    }

    // Tasks
    if (overdueTasks.length > 0) {
      script += ` You also have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""} to clear.`;
    }

    // Calendar
    if (firstEvent) {
      script += ` Your first event today is ${firstEvent.title.replace(/[^a-zA-Z0-9 ]/g, "")} at ${firstEvent.start}.`;
    } else {
      script += ` No calendar events scheduled for today.`;
    }

    // Goat Funded
    script += ` For Goat Funded, you have ${hoursLeft} hours remaining this week to hit your 15 hour target.`;
    if (slackUnread > 0) {
      script += ` There ${slackUnread === 1 ? "is" : "are"} ${slackUnread} unread Slack item${slackUnread > 1 ? "s" : ""} waiting for your review.`;
    }

    // Close
    script += ` Have a productive day. Let's get to work.`;
    return script;
  };

  const play = () => {
    if (!synthRef) return;
    if (status === "playing") { stop(); return; }

    setStatus("loading");
    synthRef.cancel();

    const script = generateScript();
    const utterance = new SpeechSynthesisUtterance(script);

    // Try to find a good English voice
    const voices = synthRef.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Daniel") || v.name.includes("Google UK") ||
      v.name.includes("Alex") || v.name.includes("Samantha") ||
      (v.lang.startsWith("en") && !v.name.includes("Google US"))
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];

    if (preferred) utterance.voice = preferred;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart  = () => setStatus("playing");
    utterance.onend    = () => setStatus("done");
    utterance.onerror  = () => setStatus("idle");

    // iOS Safari quirk — needs a tiny delay
    setTimeout(() => {
      synthRef.speak(utterance);
      setStatus("playing");
    }, 100);
  };

  const btnLabel = status === "loading" ? "Preparing..." : status === "playing" ? "Stop" : status === "done" ? "Play again" : "▶ Play Briefing";

  return (
    <div className="vb-bar">
      <div className="vb-left">
        <div className="vb-title">☀️ Morning Briefing</div>
        <div className="vb-subtitle">
          {status === "idle" || status === "done" ? "Tap to hear your daily summary" :
           status === "loading" ? "Generating briefing..." :
           "Playing your briefing..."}
        </div>
      </div>
      <button
        className={`vb-btn ${status === "playing" ? "playing" : ""} ${status === "loading" ? "loading" : ""}`}
        onClick={play}
        disabled={status === "loading"}
      >
        {status === "playing" ? (
          <>
            <div className="vb-wave">
              <span/><span/><span/><span/><span/>
            </div>
            Stop
          </>
        ) : btnLabel}
      </button>
    </div>
  );
}


// ── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState(getUsers());
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPass, setEditPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const refresh = () => setUsers(getUsers());

  const addUser = () => {
    setError(""); setSuccess("");
    if (!newUser.username.trim()) { setError("Username is required."); return; }
    if (!newUser.password.trim()) { setError("Password is required."); return; }
    if (newUser.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    const existing = getUsers();
    if (existing.find(u => u.username.toLowerCase() === newUser.username.toLowerCase().trim())) {
      setError("Username already exists."); return;
    }
    const updated = [...existing, {
      username: newUser.username.trim(),
      password: newUser.password,
      isAdmin: false,
      createdAt: new Date().toISOString().split("T")[0],
    }];
    saveUsers(updated);
    setUsers(updated);
    setNewUser({ username: "", password: "" });
    setSuccess("User added successfully.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const removeUser = (username) => {
    if (username === ADMIN_USER) { setError("Cannot remove the admin user."); return; }
    if (!window.confirm(`Remove user "${username}"?`)) return;
    const updated = getUsers().filter(u => u.username !== username);
    saveUsers(updated);
    setUsers(updated);
    setSuccess("User removed.");
    setTimeout(() => setSuccess(""), 3000);
  };

  const savePassword = (username) => {
    if (editPass.length < 6) { setError("Password must be at least 6 characters."); return; }
    const updated = getUsers().map(u => u.username === username ? { ...u, password: editPass } : u);
    saveUsers(updated);
    setUsers(updated);
    setEditingId(null);
    setEditPass("");
    setSuccess("Password updated.");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="fi" style={{paddingBottom: 24}}>
      <div className="sec">
        {error   && <div style={{fontSize:11,color:T.rose,fontFamily:"JetBrains Mono,monospace",marginBottom:10,padding:"8px 12px",background:"rgba(251,113,133,0.08)",borderRadius:7}}>⚠ {error}</div>}
        {success && <div style={{fontSize:11,color:T.green,fontFamily:"JetBrains Mono,monospace",marginBottom:10,padding:"8px 12px",background:"rgba(74,222,128,0.08)",borderRadius:7}}>✓ {success}</div>}

        {/* Current users */}
        <div className="sec-t">Current Users</div>
        {users.map(u => (
          <div key={u.username}>
            <div className="card" style={{marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{
                  width:38,height:38,borderRadius:"50%",
                  background:u.isAdmin ? T.amberGlow : T.iceDim,
                  border:`1px solid ${u.isAdmin ? T.amberDim : T.border2}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,flexShrink:0,
                }}>
                  {u.isAdmin ? "👑" : "👤"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{fontSize:14,fontWeight:600,color:T.text}}>{u.username}</div>
                    <span className={`bdg ${u.isAdmin ? "bdg-high" : "bdg-normal"}`}>
                      {u.isAdmin ? "Admin" : "User"}
                    </span>
                  </div>
                  <div style={{fontSize:10,color:T.text3,fontFamily:"JetBrains Mono,monospace",marginTop:2}}>
                    Added {u.createdAt}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button
                    onClick={() => { setEditingId(editingId === u.username ? null : u.username); setEditPass(""); setError(""); }}
                    style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border2}`,background:"transparent",color:T.text3,fontSize:10,fontFamily:"Inter,sans-serif",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                    onMouseOver={e=>e.target.style.color=T.amber}
                    onMouseOut={e=>e.target.style.color=T.text3}
                  >
                    {editingId === u.username ? "Cancel" : "Edit"}
                  </button>
                  {!u.isAdmin && (
                    <button
                      onClick={() => removeUser(u.username)}
                      style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${T.border2}`,background:"transparent",color:T.text3,fontSize:10,fontFamily:"Inter,sans-serif",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                      onMouseOver={e=>e.target.style.color=T.rose}
                      onMouseOut={e=>e.target.style.color=T.text3}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Edit password inline */}
              {editingId === u.username && (
                <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6,fontWeight:600}}>New Password</div>
                  <div style={{display:"flex",gap:8}}>
                    <input
                      type={showNewPass ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={editPass}
                      onChange={e => setEditPass(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && savePassword(u.username)}
                      style={{flex:1,background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,padding:"8px 10px",color:T.text,fontFamily:"Inter,sans-serif",fontSize:12,outline:"none"}}
                    />
                    <button onClick={() => setShowNewPass(p=>!p)}
                      style={{padding:"8px 10px",borderRadius:7,border:`1px solid ${T.border2}`,background:"transparent",color:T.text3,fontSize:13,cursor:"pointer"}}>
                      {showNewPass ? "🙈" : "👁"}
                    </button>
                    <button onClick={() => savePassword(u.username)}
                      style={{padding:"8px 14px",background:T.amber,border:"none",borderRadius:7,color:"#000",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add new user */}
        <div className="sec-t" style={{marginTop:20}}>Add New User</div>
        <div className="card">
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:5,fontWeight:600}}>Username</div>
            <input
              className="addinput"
              placeholder="Enter username"
              value={newUser.username}
              onChange={e => setNewUser(p => ({...p, username: e.target.value}))}
            />
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:T.text3,fontFamily:"JetBrains Mono,monospace",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:5,fontWeight:600}}>Password</div>
            <input
              className="addinput"
              type="password"
              placeholder="Min 6 characters"
              value={newUser.password}
              onChange={e => setNewUser(p => ({...p, password: e.target.value}))}
              onKeyDown={e => e.key === "Enter" && addUser()}
            />
          </div>
          <button className="addbtn" style={{width:"100%",padding:11,fontSize:13,borderRadius:8}} onClick={addUser}>
            + Add User
          </button>
        </div>

        <div style={{fontSize:10,color:T.border2,fontFamily:"JetBrains Mono,monospace",textAlign:"center",marginTop:12}}>
          Admin access only · Users stored locally
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const currentUser = useContext(CurrentUserContext) || sessionStorage.getItem(AUTH_KEY) || "";
  const isAdmin = currentUser.toLowerCase() === ADMIN_USER.toLowerCase();
  const [tab,setTab]=useState("today");
  const [followUps,setFollowUps]=useState(FOLLOW_UPS_INIT);
  const [tasks,setTasks]=useState(TASKS_INIT);
  const [secs,setSecs]=useState(getSecsLeft());
  const [cuLoading,setCuLoading]=useState(false);
  const [cuError,setCuError]=useState(null);
  const [cuLastSync,setCuLastSync]=useState(null);

  // Fetch live ClickUp data
  const syncClickUp = useCallback(async () => {
    setCuLoading(true); setCuError(null);
    try {
      const [fuTasks, fuDone, rhTasks, propTasks] = await Promise.all([
        fetchListTasks(CU_LISTS.followUps, false),
        fetchListTasks(CU_LISTS.followUps, true),
        fetchListTasks(CU_LISTS.rhTodo, false),
        fetchListTasks(CU_LISTS.properties, false),
      ]);
      const allFU = [...fuTasks, ...fuDone];
      if (allFU.length > 0) setFollowUps(mapCUTasksToFollowUps(allFU));
      const allTasks = [
        ...mapCUTasksToTasks(rhTasks, "Right Homess"),
        ...mapCUTasksToTasks(propTasks, "Right Homess"),
      ];
      if (allTasks.length > 0) setTasks(allTasks);
      setCuLastSync(new Date());
    } catch(e) {
      setCuError("Sync failed");
    } finally {
      setCuLoading(false);
    }
  }, []);

  // Sync on mount and every 5 minutes
  useEffect(() => {
    syncClickUp();
    const interval = setInterval(syncClickUp, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncClickUp]);

  // Live toggle — updates ClickUp when task marked done
  const toggleFULive = useCallback(async (id) => {
    const fu = followUps.find(f => f.id === id);
    if (!fu) return;
    const newDone = !fu.done;
    setFollowUps(p => p.map(f => f.id === id ? {...f, done: newDone} : f));
    // newDone=true means mark complete, newDone=false means undo back to "to do"
    if (typeof id === "string") {
      await updateTaskStatus(id, newDone ? "complete" : "to do");
    }
  }, [followUps]);

  const toggleTaskLive = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(p => p.map(t => t.id === id ? {...t, done: newDone} : t));
    if (typeof id === "string") {
      await updateTaskStatus(id, newDone ? "complete" : "to do");
    }
  }, [tasks]);

  useEffect(()=>{const t=setInterval(()=>setSecs(getSecsLeft()),1000);return()=>clearInterval(t);},[]);

  const totalSecs=15*3600;
  const pct=Math.min(100,Math.max(0,(1-secs/totalSecs)*100));
  const hh=String(Math.floor(secs/3600)).padStart(2,"0");
  const mm=String(Math.floor((secs%3600)/60)).padStart(2,"0");
  const ss=String(secs%60).padStart(2,"0");
  const urgent=secs<3600;

  const overdueFU=followUps.filter(f=>f.due<todayISO&&!f.done).length;
  const overdueTasks=tasks.filter(t=>t.due<todayISO&&!t.done).length;
  const totalOverdue=overdueFU+overdueTasks;



  const NAV=[
    {id:"today",icon:"☀️",l:"Today"},
    {id:"rh",   icon:"🏠",l:"Right Homess"},
    {id:"cal",  icon:"📆",l:"Calendar"},
    {id:"goat", icon:"💼",l:"Goat Funded"},
    {id:"me",   icon:"⚡",l:"Me"},
    ...(isAdmin ? [{id:"users",icon:"👑",l:"Users"}] : []),
  ];

  return(
    <AuthGate>
    <>
      <style>{css}</style>
      <div className="app">
        {/* Voice Briefing */}
        {tab === "today" && (
          <VoiceBriefing
            followUps={followUps}
            tasks={tasks}
            slackUnread={4}
            hoursLogged={6.5}
          />
        )}

        {/* Weather */}
        <div className="weather-bar">
          <div className="wx-today">
            <div className="wx-icon">{WEATHER_DEMO.today.icon}</div>
            <div className="wx-info">
              <div className="wx-temp">{WEATHER_DEMO.today.temp}°C</div>
              <div className="wx-desc">{WEATHER_DEMO.today.desc}</div>
              <div className="wx-details">💨 {WEATHER_DEMO.today.wind}km/h · 💧 {WEATHER_DEMO.today.humidity}%</div>
            </div>
          </div>
          <div className="wx-tomorrow">
            <div className="wx-loc">🇲🇹 {WEATHER_DEMO.location}</div>
            <div className="wx-tom-label">Tomorrow</div>
            <div className="wx-tom-row">
              <div className="wx-tom-icon">{WEATHER_DEMO.tomorrow.icon}</div>
              <div className="wx-tom-temp">{WEATHER_DEMO.tomorrow.temp}°C</div>
            </div>
            <div className="wx-tom-desc">{WEATHER_DEMO.tomorrow.desc}</div>
          </div>
        </div>

        {/* Quote */}
        <div className="qbanner">
          <div className="qmark">"</div>
          <div><div className="qtext">{todayQuote.q}</div><div className="qauthor">— {todayQuote.a}</div></div>
        </div>

        {/* Countdown */}
        <div className="cbar">
          <div><div className="clabel">Time remaining today</div><div className="cprog"><div className="cfill" style={{width:`${pct}%`}}/></div></div>
          <div className={`ctime ${urgent?"urgent":""}`}>{hh}:{mm}:{ss}</div>
        </div>

        {/* Header */}
        <div className="hdr">
          <div className="hdr-row">
            <div>
              <div className="hdr-name">Good morning, <span>Quelin</span></div>
              <div className="hdr-sub">🇲🇹 Malta · {todayStr}</div>
            </div>
            <div className="hdr-right">
              <div className="hdr-race">{daysToRace}d to race 🏔</div>
              <div className={`hdr-alert ${totalOverdue===0?"ok":""}`}>
                {totalOverdue>0?`⚠ ${totalOverdue} overdue`:"✓ All clear"}
              </div>
              <div style={{fontSize:9,color:cuLoading?T.amber:cuError?T.rose:T.green,fontFamily:"JetBrains Mono,monospace",marginTop:2,cursor:cuError?"pointer":"default"}}
                onClick={cuError?syncClickUp:undefined}>
                {cuLoading?"⟳ Syncing...":cuError?"⚠ Tap to retry":cuLastSync?`↑ ${cuLastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:"○ Demo data"}
              </div>
            </div>
          </div>
        </div>

        {/* Tab content */}
        {tab==="today"&&<TodayTab followUps={followUps} tasks={tasks} onFUToggle={toggleFULive} onTaskToggle={toggleTaskLive} setTab={setTab}/>}
        {tab==="rh"   &&<RHTab followUps={followUps} tasks={tasks} onFUToggle={toggleFULive} onTaskToggle={toggleTaskLive} onRefresh={syncClickUp} refreshing={cuLoading}/>}
        {tab==="cal"  &&<CalendarTab/>}
        {tab==="goat" &&<GoatTab/>}
        {tab==="me"   &&<MeTab/>}
        {tab==="users" && isAdmin && <UsersTab/>}
      </div>

      {/* Pomodoro floating button */}
      <Pomodoro />

      {/* Bottom nav */}
      <div className="bnav">
        {NAV.map(n=>(
          <div key={n.id} className={`bni ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}>
            <div className="bni-icon">{n.icon}</div>
            <div className="bni-lbl">{n.l}</div>
          </div>
        ))}
      </div>
    </>
     </AuthGate>
  );
}
