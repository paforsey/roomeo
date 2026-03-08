// ─── Roomeo App — src/App.jsx ────────────────────────────────────────────────
// Replace VITE_GOOGLE_CLIENT_ID and VITE_APPLE_CLIENT_ID in your .env file

import { useState, useEffect, useRef } from "react";


// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  white: "#FFFFFF", black: "#1A1C1E", neutral700: "#1F1F1F",
  grey: "#6C7278", placeholder: "#86909C", blue500: "#0462D2",
  infoBlue: "#4D81E7", stroke: "#EDF1F3", strokeSecondary: "#EFF0F6",
  surface: "#F6F7F9", pinkAccent: "#FFB4EC", matchGreen: "#006659",
  error: "#E53E3E",
};

// ─── OAuth Config ─────────────────────────────────────────────────────────────
// Set these in your .env file (see .env.example)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const APPLE_CLIENT_ID  = import.meta.env.VITE_APPLE_CLIENT_ID  ?? "";
const APPLE_REDIRECT   = typeof window !== "undefined" ? window.location.origin : "";

// ─── Auth utilities ───────────────────────────────────────────────────────────
// Decode Google credential JWT (no library needed — payload is base64url)
function decodeGoogleJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch { return {}; }
}

// Mock credential store (in-memory — replace with real backend in production)
const MOCK_DB = {};

function mockRegister(email, password, name) {
  if (MOCK_DB[email]) return { ok: false, error: "An account with this email already exists." };
  MOCK_DB[email] = { password, name };
  return { ok: true };
}

function mockLogin(email, password) {
  const user = MOCK_DB[email];
  if (!user) return { ok: false, error: "No account found with this email." };
  if (user.password !== password) return { ok: false, error: "Incorrect password." };
  return { ok: true, name: user.name };
}

// Password strength: returns 0–4
function calcStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#E53E3E", "#FCAE18", "#0462D2", "#006659"];

// Password requirement checks
function pwReqs(pw) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function isDevMode() {
  return !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith("YOUR_") ||
         !APPLE_CLIENT_ID  || APPLE_CLIENT_ID.startsWith("com.yourapp");
}

// ─── Shared SVGs ──────────────────────────────────────────────────────────────
function RoomeoLogo({ width = 152 }) {
  const h = (width / 245) * 40;
  return (
    <svg width={width} height={h} viewBox="0 0 245 40" fill="none">
      <path d="M212 6.97034C212 4.20891 214.239 1.97034 217 1.97034H240C242.761 1.97034 245 4.20891 245 6.97034V39.9703H212V6.97034Z" fill="#A9D239"/>
      <path d="M39 15H70V38C70 38.5523 69.5523 39 69 39H40C39.4477 39 39 38.5523 39 38V15Z" fill="#FCAE18"/>
      <path d="M75 17L54.5001 0L35 17H75Z" fill="#FCAE18"/>
      <path d="M205.437 2.08913H205.359V1.95544L168.11 2.05225H168V11.5396L178.219 20.4921L168.052 29.7766L168.058 39.3929H169.01H205.437V32.5979V32.5564L198.438 32.5979H175.418L189.114 20.5244L189.151 20.4921L175.911 8.88883H205.437V2.08913Z" fill="#FFB4EC"/>
      <path d="M57.438 18.2194C57.438 16.4414 55.9968 15 54.219 15C52.4412 15 51 16.4414 51 18.2194V24.6129C51 26.3909 52.4412 27.8323 54.219 27.8323C55.9968 27.8323 57.438 26.3909 57.438 24.6129V18.2194Z" fill="white"/>
      <path d="M56.5653 17.5888C56.5653 16.736 55.8752 16.0447 55.0239 16.0447C54.1726 16.0447 53.4825 16.736 53.4825 17.5888V19.8747C53.4825 20.7275 54.1726 21.4188 55.0239 21.4188C55.8752 21.4188 56.5653 20.7275 56.5653 19.8747V17.5888Z" fill="#231F20"/>
      <path d="M64.517 18.2194C64.517 16.4414 63.0758 15 61.298 15C59.5202 15 58.079 16.4414 58.079 18.2194V24.6129C58.079 26.3909 59.5202 27.8323 61.298 27.8323C63.0758 27.8323 64.517 26.3909 64.517 24.6129V18.2194Z" fill="white"/>
      <path d="M63.6441 17.5888C63.6441 16.736 62.954 16.0447 62.1027 16.0447C61.2514 16.0447 60.5613 16.736 60.5613 17.5888V19.8747C60.5613 20.7275 61.2514 21.4188 62.1027 21.4188C62.954 21.4188 63.6441 20.7275 63.6441 19.8747V17.5888Z" fill="#231F20"/>
      <path d="M96.5 39.9703C106.717 39.9703 115 31.6876 115 21.4703C115 11.2531 106.717 2.97034 96.5 2.97034C86.2827 2.97034 78 11.2531 78 21.4703C78 31.6876 86.2827 39.9703 96.5 39.9703Z" fill="#56D0FF"/>
      <path d="M20.5122 38.91C19.7941 38.91 19.1329 38.5194 18.7864 37.8904L11.4576 24.588H9.24171V36.9396C9.24171 38.0278 8.35954 38.91 7.27132 38.91H1.9704C0.882178 38.91 0 38.0278 0 36.9396V2.94073C0 1.85251 0.882176 0.970337 1.97039 0.970337H15.5109C18.5014 0.970337 21.0416 1.49277 23.1313 2.53764C25.2571 3.58252 26.8424 5.02372 27.8873 6.86125C28.9321 8.66276 29.4546 10.6804 29.4546 12.9143C29.4546 15.4364 28.734 17.6883 27.2928 19.6699C25.8876 21.6516 23.7979 23.0568 21.0235 23.8855L29.7975 35.7693C30.7578 37.07 29.8292 38.91 28.2123 38.91H20.5122ZM9.24171 18.0486H14.9705C16.6639 18.0486 17.925 17.6342 18.7537 16.8056C19.6184 15.9769 20.0507 14.8059 20.0507 13.2926C20.0507 11.8514 19.6184 10.7165 18.7537 9.88778C17.925 9.05909 16.6639 8.64474 14.9705 8.64474H9.24171V18.0486Z" fill="#0462D2"/>
      <path d="M152.33 2.97034C155.284 2.97034 157.627 4.31076 159.359 6.99161C161.12 9.67246 162 13.3959 162 18.1618V38.9703H154.758V19.6299C154.758 17.332 154.346 15.5661 153.523 14.332C152.728 13.0554 151.62 12.4171 150.2 12.4171C148.78 12.4171 147.658 13.0554 146.835 14.332C146.04 15.5661 145.642 17.332 145.642 19.6299V38.9703H138.4V19.6299C138.4 17.332 137.989 15.5661 137.165 14.332C136.37 13.0554 135.262 12.4171 133.842 12.4171C132.422 12.4171 131.301 13.0554 130.477 14.332C129.682 15.5661 129.284 17.332 129.284 19.6299V38.9703H122V3.35331H129.284V7.8214C130.023 6.33204 130.988 5.16183 132.181 4.31076C133.374 3.41714 134.723 2.97034 136.228 2.97034C138.017 2.97034 139.607 3.5448 140.999 4.69374C142.419 5.84268 143.526 7.48098 144.322 9.60864C145.145 7.65119 146.267 6.05544 147.687 4.8214C149.107 3.58736 150.655 2.97034 152.33 2.97034Z" fill="#0462D2"/>
      <circle cx="240.375" cy="27.078" r="2.375" fill="#006659"/>
      <circle cx="68.5" cy="29.4678" r="2.5" fill="#FFB4EC"/>
      <circle cx="105.5" cy="20.4678" r="2.5" fill="#FFB4EC"/>
      <circle cx="46.5" cy="29.4678" r="2.5" fill="#FFB4EC"/>
      <circle cx="83.5" cy="20.4678" r="2.5" fill="#FFB4EC"/>
      <path d="M94.0789 9.1872C94.0789 7.40916 95.5201 5.96777 97.298 5.96777C99.0758 5.96777 100.517 7.40916 100.517 9.1872V15.5806C100.517 17.3587 99.0758 18.8001 97.298 18.8001C95.5201 18.8001 94.0789 17.3587 94.0789 15.5806V9.1872Z" fill="white"/>
      <path d="M94.9517 12.5119C94.9517 11.6591 95.6418 10.9678 96.493 10.9678C97.3443 10.9678 98.0344 11.6591 98.0344 12.5119V14.7978C98.0344 15.6506 97.3443 16.3419 96.493 16.3419C95.6418 16.3419 94.9517 15.6506 94.9517 14.7978V12.5119Z" fill="#231F20"/>
      <path d="M87 9.1872C87 7.40916 88.4412 5.96777 90.219 5.96777C91.9968 5.96777 93.438 7.40916 93.438 9.1872V15.5806C93.438 17.3587 91.9968 18.8001 90.219 18.8001C88.4412 18.8001 87 17.3587 87 15.5806V9.1872Z" fill="white"/>
      <path d="M87.8729 12.5119C87.8729 11.6591 88.563 10.9678 89.4143 10.9678C90.2656 10.9678 90.9557 11.6591 90.9557 12.5119V14.7978C90.9557 15.6506 90.2656 16.3419 89.4143 16.3419C88.563 16.3419 87.8729 15.6506 87.8729 14.7978V12.5119Z" fill="#231F20"/>
    </svg>
  );
}

function HeroIllustration() {
  return (
    <svg width="100%" viewBox="0 0 320 175" fill="none">
      <ellipse cx="160" cy="154" rx="130" ry="18" fill={C.surface}/>
      <rect x="70" y="82" width="180" height="82" rx="8" fill="#E8EDFF"/>
      <polygon points="62,82 160,26 258,82" fill={C.neutral700}/>
      <rect x="118" y="109" width="36" height="36" rx="5" fill={C.white} stroke={C.stroke} strokeWidth="1.5"/>
      <rect x="166" y="109" width="36" height="26" rx="5" fill={C.blue500} opacity="0.22"/>
      <rect x="154" y="138" width="12" height="26" rx="4" fill="#C0CBE8"/>
      <ellipse cx="96" cy="88" rx="6" ry="10" fill="#FFD6A5"/>
      <ellipse cx="116" cy="88" rx="6" ry="10" fill="#FFD6A5"/>
      <ellipse cx="96" cy="88" rx="3.5" ry="6.5" fill={C.pinkAccent} opacity="0.55"/>
      <ellipse cx="116" cy="88" rx="3.5" ry="6.5" fill={C.pinkAccent} opacity="0.55"/>
      <circle cx="106" cy="100" r="20" fill="#FFD6A5"/>
      <circle cx="99" cy="97" r="3" fill={C.neutral700}/><circle cx="113" cy="97" r="3" fill={C.neutral700}/>
      <circle cx="100" cy="96" r="1.2" fill="white"/><circle cx="114" cy="96" r="1.2" fill="white"/>
      <ellipse cx="106" cy="103" rx="3" ry="1.5" fill={C.pinkAccent}/>
      <path d="M101 106 Q106 111 111 106" stroke={C.neutral700} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <rect x="88" y="117" width="36" height="25" rx="13" fill="#A8C5FF"/>
      <ellipse cx="204" cy="77" rx="5" ry="14" fill="#FFE0F7"/>
      <ellipse cx="220" cy="77" rx="5" ry="14" fill="#FFE0F7"/>
      <ellipse cx="204" cy="77" rx="2.8" ry="9" fill={C.pinkAccent} opacity="0.5"/>
      <ellipse cx="220" cy="77" rx="2.8" ry="9" fill={C.pinkAccent} opacity="0.5"/>
      <circle cx="212" cy="100" r="20" fill="#FFE0F7"/>
      <circle cx="205" cy="97" r="3" fill={C.neutral700}/><circle cx="219" cy="97" r="3" fill={C.neutral700}/>
      <circle cx="206" cy="96" r="1.2" fill="white"/><circle cx="220" cy="96" r="1.2" fill="white"/>
      <ellipse cx="212" cy="103" rx="2.5" ry="1.5" fill={C.pinkAccent}/>
      <path d="M207 106 Q212 111 217 106" stroke={C.neutral700} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <rect x="194" y="117" width="36" height="25" rx="13" fill={C.pinkAccent} opacity="0.6"/>
      <rect x="120" y="42" width="80" height="24" rx="12" fill={C.blue500}/>
      <text x="160" y="58" textAnchor="middle" fill="white" fontSize="10" fontFamily="Poppins,sans-serif" fontWeight="600">Find Match ✨</text>
      <text x="62" y="68" fontSize="13" fill="#FCAE18">✦</text>
      <text x="248" y="62" fontSize="9" fill={C.pinkAccent}>✦</text>
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.grey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="15" height="18" viewBox="0 0 814 1000" fill={C.neutral700}>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-161-39.5c-73.5 0-98.9 40.5-165.7 40.5s-105.8-57.5-155.5-127.2C27.6 766.7 0 691.3 0 618c0-209.1 133.3-319.3 264.1-319.3 69.4 0 127.2 45.8 170.8 45.8 41.8 0 108.2-48.9 188.4-48.9 30.6 0 111.3 2.6 171.7 75.6zm-174.3-71.6c7.7-35.9 27.9-67.7 51.8-90.7 31.9-30.1 70.5-48.8 109.8-50.6 1.9 39.6-10.5 77.9-34.5 109.1-21.3 27.7-59.7 51.6-107.1 31.7z"/>
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="32" fill="#E6F4F2"/>
      <circle cx="32" cy="32" r="24" fill={C.matchGreen}/>
      <path d="M20 32 L28 40 L44 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, type = "text", placeholder, value, onChange, error, showToggle, showVal, onToggle }) {
  return (
    <div className="roo-field">
      <label className="roo-label">{label}</label>
      <div className={`roo-input ${error ? "roo-input--error" : ""}`}>
        <input
          type={showToggle ? (showVal ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={type === "password" ? "current-password" : type === "email" ? "email" : "off"}
        />
        {showToggle && (
          <button className="roo-eye" onClick={onToggle} type="button">
            <EyeIcon open={showVal} />
          </button>
        )}
      </div>
      {error && <span className="roo-field-error">{error}</span>}
    </div>
  );
}

// ─── Social buttons (shared) ──────────────────────────────────────────────────
function SocialButtons({ onGoogle, onApple, loading }) {
  return (
    <div className="roo-socials">
      <button className="roo-social" onClick={onGoogle} disabled={loading}>
        {loading === "google" ? <Spinner /> : <><GoogleLogo /> Google</>}
      </button>
      <button className="roo-social" onClick={onApple} disabled={loading}>
        {loading === "apple" ? <Spinner /> : <><AppleLogo /> Apple</>}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="9" cy="9" r="7" stroke={C.strokeSecondary} strokeWidth="2"/>
      <path d="M9 2a7 7 0 0 1 7 7" stroke={C.neutral700} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Dev mode banner ──────────────────────────────────────────────────────────
function DevBanner({ provider, onDismiss, onDemoLogin }) {
  return (
    <div className="dev-banner">
      <div className="dev-banner-icon">🔧</div>
      <div className="dev-banner-body">
        <strong>Dev mode</strong>
        <p>{provider === "google" ? "Add a real GOOGLE_CLIENT_ID" : "Add a real APPLE_CLIENT_ID"} to enable OAuth. For now, continue with a demo account.</p>
      </div>
      <div className="dev-banner-actions">
        <button className="dev-banner-demo" onClick={onDemoLogin}>Use Demo</button>
        <button className="dev-banner-close" onClick={onDismiss}>✕</button>
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ onSignUp, onSuccess, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [devBanner, setDevBanner] = useState(null); // "google" | "apple" | null
  const [serverError, setServerError] = useState("");

  // Load Google Identity Services once
  useEffect(() => {
    if (document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = () => {
      if (window.google && !isDevMode()) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            const profile = decodeGoogleJwt(resp.credential);
            setSocialLoading(null);
            onSuccess("google", { name: profile.name, email: profile.email, avatar: profile.picture });
          },
          error_callback: () => setSocialLoading(null),
        });
      }
    };
    document.head.appendChild(s);
  }, []);

  // Load Apple SDK once
  useEffect(() => {
    if (document.getElementById("apple-script")) return;
    const s = document.createElement("script");
    s.id = "apple-script";
    s.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  function validate() {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    return e;
  }

  function handleLogin() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setServerError("");
    setLoading(true);
    setTimeout(() => {
      const result = mockLogin(email, password);
      setLoading(false);
      if (!result.ok) { setServerError(result.error); return; }
      onSuccess("email", { name: result.name, email });
    }, 900);
  }

  function handleGoogle() {
    if (isDevMode()) { setDevBanner("google"); return; }
    setSocialLoading("google");
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((n) => {
        if (n.isNotDisplayed() || n.isSkippedMoment()) setSocialLoading(null);
      });
    } else { setSocialLoading(null); }
  }

  function handleApple() {
    if (isDevMode()) { setDevBanner("apple"); return; }
    setSocialLoading("apple");
    if (window.AppleID?.auth) {
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID, scope: "name email",
        redirectURI: APPLE_REDIRECT, usePopup: true,
      });
      window.AppleID.auth.signIn()
        .then(r => {
          setSocialLoading(null);
          const name = r.user ? `${r.user.name?.firstName || ""} ${r.user.name?.lastName || ""}`.trim() : "";
          onSuccess("apple", { name, email: r.user?.email || "" });
        })
        .catch(() => setSocialLoading(null));
    } else { setSocialLoading(null); }
  }

  return (
    <div className="roo-card">
      {devBanner && (
        <DevBanner
          provider={devBanner}
          onDismiss={() => setDevBanner(null)}
          onDemoLogin={() => { setDevBanner(null); onSuccess(devBanner, { name: "Demo User", email: "demo@roomeo.app" }); }}
        />
      )}
      <div className="roo-logo"><RoomeoLogo /></div>
      <div className="roo-hero"><HeroIllustration /></div>
      <div className="roo-heading">
        <h1>Find your perfect<br /><span>roommate</span> today 🏠</h1>
        <p>Sign in to continue your matching journey</p>
      </div>

      <div className="roo-form">
        <button className="roo-btn-secondary" onClick={() => onSuccess("skip", {})}>Skip for now</button>

        {serverError && <div className="roo-server-error">{serverError}</div>}

        <Field label="Email" type="email" placeholder="your@email.com"
          value={email} onChange={v => { setEmail(v); setErrors(p => ({...p, email: ""})); setServerError(""); }}
          error={errors.email} />

        <Field label="Password" type="password" placeholder="Enter your password"
          value={password} onChange={v => { setPassword(v); setErrors(p => ({...p, password: ""})); setServerError(""); }}
          error={errors.password} showToggle showVal={showPw} onToggle={() => setShowPw(v => !v)} />

        <div className="roo-forgot-row">
          <button className="roo-forgot" onClick={onForgotPassword}>Forgot Password?</button>
        </div>

        <button className="roo-btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? <Spinner /> : "Log in"}
        </button>

        <div className="roo-divider">
          <div className="roo-divider-line"/><span>Or login with</span><div className="roo-divider-line"/>
        </div>

        <SocialButtons onGoogle={handleGoogle} onApple={handleApple} loading={socialLoading} />

        <div className="roo-signup-row">
          <span>Don't have an account?</span>
          <button onClick={onSignUp}>Sign up</button>
        </div>
      </div>
    </div>
  );
}

// ─── SIGN UP SCREEN ───────────────────────────────────────────────────────────
function SignUpScreen({ onLogin, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = verify email
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [serverError, setServerError] = useState("");
  const [devBanner, setDevBanner] = useState(null);

  const strength = calcStrength(password);
  const reqs = pwReqs(password);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (strength < 2) e.password = "Password is too weak";
    if (!confirm) e.confirm = "Please confirm your password";
    else if (confirm !== password) e.confirm = "Passwords don't match";
    if (!agreed) e.agreed = "You must accept the Terms to continue";
    return e;
  }

  function handleSignUp() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setServerError("");
    setLoading(true);
    setTimeout(() => {
      const result = mockRegister(email, password, name);
      setLoading(false);
      if (!result.ok) { setServerError(result.error); return; }
      setStep(2); // go to verify email
    }, 1000);
  }

  function handleGoogle() {
    if (isDevMode()) { setDevBanner("google"); return; }
    setSocialLoading("google");
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt(n => {
        if (n.isNotDisplayed() || n.isSkippedMoment()) setSocialLoading(null);
      });
    } else { setSocialLoading(null); }
  }

  function handleApple() {
    if (isDevMode()) { setDevBanner("apple"); return; }
    setSocialLoading("apple");
    if (window.AppleID?.auth) {
      window.AppleID.auth.init({ clientId: APPLE_CLIENT_ID, scope: "name email", redirectURI: APPLE_REDIRECT, usePopup: true });
      window.AppleID.auth.signIn()
        .then(r => { setSocialLoading(null); onSuccess("apple", { name: "", email: r.user?.email || "" }); })
        .catch(() => setSocialLoading(null));
    } else { setSocialLoading(null); }
  }

  // Step 2: Email verification screen
  if (step === 2) {
    return (
      <div className="roo-card">
        <div className="roo-logo"><RoomeoLogo /></div>
        <div className="roo-verify-body">
          <div className="roo-verify-icon">✉️</div>
          <h2 className="roo-verify-title">Check your inbox</h2>
          <p className="roo-verify-sub">
            We sent a verification link to<br/>
            <strong>{email}</strong>
          </p>
          <p className="roo-verify-hint">Click the link in the email to activate your account. It may take a moment to arrive.</p>

          <button className="roo-btn-primary" style={{ marginTop: 8 }}
            onClick={() => onSuccess("email", { name, email })}>
            I've verified — Continue →
          </button>

          <div className="roo-verify-resend">
            <span>Didn't get it?</span>
            <button onClick={() => setServerError("")} className="roo-forgot">Resend email</button>
          </div>
          <button className="roo-forgot" style={{ textAlign: "center", marginTop: 4 }} onClick={() => setStep(1)}>
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Registration form
  return (
    <div className="roo-card">
      {devBanner && (
        <DevBanner provider={devBanner} onDismiss={() => setDevBanner(null)}
          onDemoLogin={() => { setDevBanner(null); onSuccess(devBanner, { name: "Demo User", email: "demo@roomeo.app" }); }}
        />
      )}

      {/* Back arrow */}
      <button className="sv-back" style={{ alignSelf: "flex-start", marginBottom: 8 }} onClick={onLogin}>
        <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
          <path d="M8 1.5L2 7.5L8 13.5" stroke="#1A1C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="roo-logo"><RoomeoLogo /></div>
      <div className="roo-heading" style={{ marginTop: 8 }}>
        <h1>Create your<br /><span>account</span> ✨</h1>
        <p>Join thousands finding their perfect roommate</p>
      </div>

      <div className="roo-form">
        <SocialButtons onGoogle={handleGoogle} onApple={handleApple} loading={socialLoading} />
        <div className="roo-divider">
          <div className="roo-divider-line"/><span>Or sign up with email</span><div className="roo-divider-line"/>
        </div>

        {serverError && <div className="roo-server-error">{serverError}</div>}

        <Field label="Full Name" placeholder="Jane Smith"
          value={name} onChange={v => { setName(v); setErrors(p => ({...p, name: ""})); }}
          error={errors.name} />

        <Field label="Email" type="email" placeholder="your@email.com"
          value={email} onChange={v => { setEmail(v); setErrors(p => ({...p, email: ""})); setServerError(""); }}
          error={errors.email} />

        {/* Password with strength meter + requirements */}
        <div>
          <Field label="Password" type="password" placeholder="Minimum 8 characters"
            value={password} onChange={v => { setPassword(v); setErrors(p => ({...p, password: ""})); }}
            error={errors.password} showToggle showVal={showPw} onToggle={() => setShowPw(v => !v)} />
          {password.length > 0 && (
            <>
              <div className="roo-pw-strength">
                <div className="roo-pw-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="roo-pw-bar"
                      style={{ background: i <= strength ? STRENGTH_COLOR[strength] : C.stroke }}/>
                  ))}
                </div>
                <span style={{ color: STRENGTH_COLOR[strength], fontSize: 12, fontWeight: 600 }}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
              <div className="roo-pw-reqs">
                {[
                  [reqs.length,  "8+ characters"],
                  [reqs.upper,   "Uppercase letter"],
                  [reqs.number,  "Number"],
                  [reqs.special, "Special character"],
                ].map(([met, label]) => (
                  <span key={label} className={`roo-pw-req ${met ? "met" : ""}`}>
                    <span>{met ? "✓" : "○"}</span> {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <Field label="Confirm Password" type="password" placeholder="Re-enter your password"
          value={confirm} onChange={v => { setConfirm(v); setErrors(p => ({...p, confirm: ""})); }}
          error={errors.confirm} showToggle showVal={showCf} onToggle={() => setShowCf(v => !v)} />

        <label className="roo-terms">
          <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setErrors(p => ({...p, agreed: ""})); }} />
          <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
        </label>
        {errors.agreed && <span className="roo-field-error" style={{ marginTop: -8 }}>{errors.agreed}</span>}

        <button className="roo-btn-primary" onClick={handleSignUp} disabled={loading}>
          {loading ? <Spinner /> : "Create Account"}
        </button>

        <div className="roo-signup-row">
          <span>Already have an account?</span>
          <button onClick={onLogin}>Log in</button>
        </div>
      </div>
    </div>
  );
}

// ─── FORGOT PASSWORD SCREEN ───────────────────────────────────────────────────
function ForgotPasswordScreen({ onBack, onSent }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSend() {
    if (!email) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return; }
    setError(""); setLoading(true);
    // In production: call your password reset API here
    setTimeout(() => { setLoading(false); onSent(email); }, 1000);
  }

  return (
    <div className="roo-card">
      <div className="roo-logo"><RoomeoLogo /></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
        <div className="roo-flow-icon" style={{ background: "#EEF4FF" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>

      <div className="roo-heading" style={{ marginBottom: 0 }}>
        <h1>Forgot your<br /><span>password?</span> 🔐</h1>
        <p>No worries! Enter your email and we'll send you a reset link.</p>
      </div>

      <div className="roo-form">
        <Field label="Email address" type="email" placeholder="your@email.com"
          value={email} onChange={v => { setEmail(v); setError(""); }} error={error} />

        <button className="roo-btn-primary" onClick={handleSend} disabled={loading}>
          {loading ? <Spinner /> : "Send Reset Link"}
        </button>

        <div className="roo-signup-row" style={{ justifyContent: "center" }}>
          <button className="roo-forgot" onClick={onBack}>← Back to Log in</button>
        </div>
      </div>
    </div>
  );
}

// ─── CHECK RESET EMAIL SCREEN ─────────────────────────────────────────────────
function CheckResetEmailScreen({ email, onBack, onResetPassword }) {
  const [resent, setResent] = useState(false);

  function handleResend() {
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  return (
    <div className="roo-card">
      <div className="roo-logo"><RoomeoLogo /></div>
      <div className="roo-verify-body">
        <div className="roo-verify-icon">📬</div>
        <h2 className="roo-verify-title">Check your email</h2>
        <p className="roo-verify-sub">
          We've sent a password reset link to<br/>
          <strong>{email}</strong>
        </p>
        <p className="roo-verify-hint">
          Click the link in the email to set a new password. The link expires in 15 minutes.
        </p>

        {/* In a real app this button would not exist — the link in email takes them to ResetPassword */}
        <button className="roo-btn-primary" style={{ marginTop: 8 }} onClick={onResetPassword}>
          Set New Password →
        </button>

        <div className="roo-verify-resend">
          <span>Didn't receive it?</span>
          <button className="roo-forgot" onClick={handleResend}>
            {resent ? "✓ Sent!" : "Resend email"}
          </button>
        </div>
        <button className="roo-forgot" style={{ textAlign: "center", marginTop: 4 }} onClick={onBack}>
          ← Try a different email
        </button>
      </div>
    </div>
  );
}

// ─── RESET PASSWORD SCREEN ────────────────────────────────────────────────────
function ResetPasswordScreen({ email, onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = calcStrength(password);
  const reqs = pwReqs(password);

  function handleReset() {
    const e = {};
    if (!password) e.password = "Password is required";
    else if (strength < 2) e.password = "Password is too weak";
    if (!confirm) e.confirm = "Please confirm your password";
    else if (confirm !== password) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    setTimeout(() => {
      // Update mock DB
      if (MOCK_DB[email]) MOCK_DB[email].password = password;
      setLoading(false); setDone(true);
      setTimeout(() => onSuccess(), 1600);
    }, 1000);
  }

  if (done) {
    return (
      <div className="roo-card">
        <div className="roo-logo"><RoomeoLogo /></div>
        <div className="roo-verify-body">
          <CheckCircle />
          <h2 className="roo-verify-title">Password updated!</h2>
          <p className="roo-verify-sub">Your password has been changed successfully.<br/>Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roo-card">
      <div className="roo-logo"><RoomeoLogo /></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
        <div className="roo-flow-icon" style={{ background: "#E6F4F2" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.matchGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
      </div>
      <div className="roo-heading" style={{ marginBottom: 0 }}>
        <h1>Set a new<br /><span>password</span> 🔑</h1>
        <p>Choose a strong password for your account.</p>
      </div>

      <div className="roo-form">
        <div>
          <Field label="New Password" type="password" placeholder="Minimum 8 characters"
            value={password} onChange={v => { setPassword(v); setErrors(p => ({...p, password: ""})); }}
            error={errors.password} showToggle showVal={showPw} onToggle={() => setShowPw(v => !v)} />
          {password.length > 0 && (
            <>
              <div className="roo-pw-strength">
                <div className="roo-pw-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="roo-pw-bar"
                      style={{ background: i <= strength ? STRENGTH_COLOR[strength] : C.stroke }}/>
                  ))}
                </div>
                <span style={{ color: STRENGTH_COLOR[strength], fontSize: 12, fontWeight: 600 }}>
                  {STRENGTH_LABEL[strength]}
                </span>
              </div>
              <div className="roo-pw-reqs">
                {[
                  [reqs.length,  "8+ characters"],
                  [reqs.upper,   "Uppercase letter"],
                  [reqs.number,  "Number"],
                  [reqs.special, "Special character"],
                ].map(([met, label]) => (
                  <span key={label} className={`roo-pw-req ${met ? "met" : ""}`}>
                    <span>{met ? "✓" : "○"}</span> {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <Field label="Confirm New Password" type="password" placeholder="Re-enter your password"
          value={confirm} onChange={v => { setConfirm(v); setErrors(p => ({...p, confirm: ""})); }}
          error={errors.confirm} showToggle showVal={showCf} onToggle={() => setShowCf(v => !v)} />

        <button className="roo-btn-primary" onClick={handleReset} disabled={loading}>
          {loading ? <Spinner /> : "Update Password"}
        </button>

        <div className="roo-signup-row" style={{ justifyContent: "center" }}>
          <button className="roo-forgot" onClick={onBack}>← Back to Log in</button>
        </div>
      </div>
    </div>
  );
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────
function scoreAnswers(answers) {
  let axis1 = 0, axis2 = 0;
  for (let i = 0; i < 12; i++) {
    const score = answers[i] !== undefined ? 3 - answers[i] : 0;
    if (i < 6) axis1 += score;
    else axis2 += score;
  }
  return { axis1, axis2 };
}

function getType(axis1, axis2) {
  const highStructure  = axis1 >= 9;
  const highDirectness = axis2 >= 9;
  if (highStructure  && highDirectness)  return "Beaver";
  if (highStructure  && !highDirectness) return "Bunny";
  if (!highStructure && highDirectness)  return "Retriever";
  return "Turtle";
}

const TYPE_DATA = {
  Beaver: {
    heroTitle: "The Beaver",
    heroDesc: "You're the one who keeps the house functioning.\nYou prefer clarity, consistency, and taking care of shared spaces early — before issues build up.",
    // 5-axis: Mustard Yellow, Sage Green, Terracotta, Soft Lilac, Loove Traits
    radar: [88, 82, 90, 55, 70],
    whyTitle: "Why you got this type",
    whyIntro: "Your answers suggest that you:",
    why: [
      "tend to reset shared spaces quickly after use",
      "notice when things are out of place and act on it",
      "prefer clear expectations in shared living",
      "speak up when something feels unfair or chaotic",
    ],
    conflictTitle: "Example of conflict",
    conflict: "You may feel frustrated when a roommate leaves things unfinished or avoids addressing issues. You value directness, and silence or passivity can feel like a lack of respect for shared space.",
    matchTitle: "Ideal roommate for this type",
    matchIntro: "You often do well with someone who:",
    matchQualities: [
      "respects shared spaces and resets them after use",
      "responds well to clear and direct communication",
      "is comfortable with structure and house agreements",
    ],
    bestFit: "a Bunny or another Beaver",
    challenge: "a Turtle who avoids both cleaning and conflict",
    matches: [
      { name: "Alex", pct: 92, type: "Beaver", char: "pink" },
      { name: "Sarah", pct: 88, type: "Bunny", char: "orange" },
    ],
  },
  Bunny: {
    heroTitle: "The Bunny",
    heroDesc: "You care a lot about order, cleanliness, and shared-space responsibility, but you prefer to keep the peace when problems come up.\nYou often notice issues quickly, even if you don't always address them right away.",
    radar: [80, 78, 85, 42, 65],
    whyTitle: "Why you got this type",
    whyIntro: "Your answers suggest that you:",
    why: [
      "value tidy shared spaces",
      "are sensitive to habits that affect daily living",
      "prefer softer or delayed communication",
      "may hold discomfort in before bringing it up",
    ],
    conflictTitle: "Example of conflict",
    conflict: "You may quietly become stressed when shared rules are not followed, but wait too long to raise the issue. This can lead to frustration building up internally over time.",
    matchTitle: "Ideal roommate for this type",
    matchIntro: "You often do well with someone who:",
    matchQualities: [
      "is naturally considerate in shared spaces",
      "does not require repeated reminders",
      "can notice tension and respond gently",
    ],
    bestFit: "a Beaver or another Bunny",
    challenge: "a Retriever who is relaxed about space but more outspoken only when needed",
    matches: [
      { name: "Jordan", pct: 90, type: "Bunny", char: "pink" },
      { name: "Sam", pct: 85, type: "Beaver", char: "house" },
    ],
  },
  Retriever: {
    heroTitle: "The Retriever",
    heroDesc: "You're generally flexible about shared-space routines, but you're willing to talk openly when something actually becomes a problem.\nYou may not need a lot of rules, but you value being able to solve issues directly.",
    radar: [42, 85, 44, 80, 60],
    whyTitle: "Why you got this type",
    whyIntro: "Your answers suggest that you:",
    why: [
      "are less rigid about daily reset habits",
      "can tolerate a bit more looseness in shared spaces",
      "are relatively comfortable bringing things up",
      "focus more on solving problems than maintaining strict routines",
    ],
    conflictTitle: "Example of conflict",
    conflict: "You may clash with a roommate who wants constant structure or immediate reset after every use. You might feel they are too controlling, while they may see you as too relaxed.",
    matchTitle: "Ideal roommate for this type",
    matchIntro: "You often do well with someone who:",
    matchQualities: [
      "is flexible and not easily stressed by minor mess",
      "is honest and open when something matters",
      "does not expect perfect routines all the time",
    ],
    bestFit: "another Retriever or sometimes a Beaver",
    challenge: "a Bunny who becomes quietly stressed but does not clearly communicate it",
    matches: [
      { name: "Riley", pct: 91, type: "Retriever", char: "monster" },
      { name: "Morgan", pct: 84, type: "Beaver", char: "house" },
    ],
  },
  Turtle: {
    heroTitle: "The Turtle",
    heroDesc: "You tend to be flexible, low-pressure, and not overly attached to strict routines.\nYou also prefer to avoid tension, which can make shared living feel calm at first but sometimes unclear over time.",
    radar: [36, 38, 36, 40, 72],
    whyTitle: "Why you got this type",
    whyIntro: "Your answers suggest that you:",
    why: [
      "are not highly bothered by disorder or shifting routines",
      "prefer adapting rather than setting strict rules",
      "are less likely to bring up issues directly",
      "may avoid uncomfortable conversations unless necessary",
    ],
    conflictTitle: "Example of conflict",
    conflict: "You may unintentionally frustrate roommates who expect clearer standards or more active communication. At the same time, you may feel overwhelmed by roommates who seem too strict or too intense.",
    matchTitle: "Ideal roommate for this type",
    matchIntro: "You often do well with someone who:",
    matchQualities: [
      "is easygoing and not highly controlling",
      "communicates kindly and without pressure",
      "does not expect constant structure",
    ],
    bestFit: "another Turtle or a patient Retriever",
    challenge: "a Beaver who wants immediate reset and direct resolution",
    matches: [
      { name: "Casey", pct: 89, type: "Turtle", char: "orange" },
      { name: "Drew", pct: 82, type: "Retriever", char: "monster" },
    ],
  },
};

// ─── 5-Axis Radar (Figma spec) ────────────────────────────────────────────────
function RadarChart({ vals }) {
  const cx = 130, cy = 125, r = 80;
  // Figma labels, clockwise from top
  const labels = ["Mustard Yellow", "Sage Green", "Terracotta", "Soft Lilac", "Loove Traits"];
  const n = labels.length;
  const angles = labels.map((_, i) => (i * Math.PI * 2) / n - Math.PI / 2);
  const gridLevels = [25, 50, 75, 100];

  function pt(pct, ang) {
    return [cx + r * (pct / 100) * Math.cos(ang), cy + r * (pct / 100) * Math.sin(ang)];
  }

  const dataPath = vals.map((v, i) => pt(v, angles[i]))
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z";

  // Label anchor offsets
  function labelPos(ang, idx) {
    const dist = r + 28;
    const lx = cx + dist * Math.cos(ang);
    const ly = cy + dist * Math.sin(ang);
    // horizontal anchor
    const anchor = Math.abs(Math.cos(ang)) < 0.1 ? "middle" : Math.cos(ang) > 0 ? "start" : "end";
    return { x: lx, y: ly, anchor };
  }

  // Render label with line breaks for 2-word labels
  function renderLabel(lbl, x, y, anchor) {
    const words = lbl.split(" ");
    if (words.length === 1) {
      return <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fontFamily="Poppins,sans-serif" fill="#6C7278">{lbl}</text>;
    }
    return (
      <text x={x} y={y} textAnchor={anchor} fontSize="11" fontFamily="Poppins,sans-serif" fill="#6C7278">
        <tspan x={x} dy="-7" textAnchor={anchor}>{words[0]}</tspan>
        <tspan x={x} dy="14" textAnchor={anchor}>{words[1]}</tspan>
      </text>
    );
  }

  return (
    <svg width="260" height="250" viewBox="0 0 260 250">
      {/* Grid polygons */}
      {gridLevels.map(lvl => (
        <polygon key={lvl}
          points={angles.map(a => pt(lvl, a).join(",")).join(" ")}
          fill="none" stroke="#E2E5E8" strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(100, a)[0]} y2={pt(100, a)[1]} stroke="#E2E5E8" strokeWidth="1"/>
      ))}
      {/* Data — warm earth fill matching Figma */}
      <path d={dataPath} fill="#D4A96A" fillOpacity="0.35" stroke="#C4904A" strokeWidth="1.8" strokeLinejoin="round"/>
      {/* Secondary subtle fill layer */}
      <path d={dataPath} fill="#F5E6D0" fillOpacity="0.25"/>
      {/* Dots */}
      {vals.map((v, i) => {
        const [px, py] = pt(v, angles[i]);
        return <circle key={i} cx={px} cy={py} r="3.5" fill="#C4904A"/>;
      })}
      {/* Labels */}
      {labels.map((lbl, i) => {
        const { x, y, anchor } = labelPos(angles[i], i);
        return <g key={i}>{renderLabel(lbl, x, y, anchor)}</g>;
      })}
    </svg>
  );
}

// ─── Mini character for match cards ──────────────────────────────────────────
function MiniChar({ variant, size = 48 }) {
  if (variant === "pink") return (
    <svg width={size} height={size} viewBox="0 0 58 58">
      <rect x="0" y="0" width="58" height="58" rx="14" fill="#FFB4EC"/>
      <circle cx="20" cy="24" r="6" fill="#1A1C1E"/><circle cx="38" cy="24" r="6" fill="#1A1C1E"/>
      <circle cx="22" cy="22" r="2" fill="white"/><circle cx="40" cy="22" r="2" fill="white"/>
      <ellipse cx="29" cy="34" rx="4" ry="2.5" fill="#E87ACC"/>
      <path d="M18 40 Q29 48 40 40" stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (variant === "orange") return (
    <svg width={size} height={size} viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="36" fill="#FCAE18"/>
      <circle cx="26" cy="32" r="6" fill="#1A1C1E"/><circle cx="46" cy="32" r="6" fill="#1A1C1E"/>
      <circle cx="28" cy="30" r="2" fill="white"/><circle cx="48" cy="30" r="2" fill="white"/>
      <ellipse cx="36" cy="42" rx="4" ry="3" fill="#E8860A"/>
      <path d="M26 48 Q36 56 46 48" stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (variant === "house") return (
    <svg width={size} height={size} viewBox="0 0 64 70">
      <rect x="4" y="24" width="56" height="46" rx="10" fill="#56D0FF"/>
      <polygon points="32,0 64,24 0,24" fill="#3ABDE8"/>
      <circle cx="22" cy="44" r="7" fill="#1A1C1E"/><circle cx="42" cy="44" r="7" fill="#1A1C1E"/>
      <circle cx="24" cy="42" r="2.5" fill="white"/><circle cx="44" cy="42" r="2.5" fill="white"/>
      <rect x="16" y="55" width="32" height="13" rx="5" fill="#2AA8CC"/>
    </svg>
  );
  // monster
  return (
    <svg width={size} height={size} viewBox="0 0 60 70">
      <rect x="0" y="0" width="60" height="70" rx="14" fill="#A9D239"/>
      <circle cx="30" cy="28" r="14" fill="white"/>
      <circle cx="30" cy="28" r="9" fill="#1A1C1E"/>
      <circle cx="33" cy="25" r="3" fill="white"/>
      <rect x="14" y="48" width="32" height="8" rx="4" fill="#8BB82E"/>
    </svg>
  );
}

// Hero character (larger)
function HeroCharacter({ variant }) {
  if (variant === "house") return (
    <svg width="72" height="82" viewBox="0 0 64 70">
      <rect x="4" y="24" width="56" height="46" rx="10" fill="#56D0FF"/>
      <polygon points="32,0 64,24 0,24" fill="#3ABDE8"/>
      <circle cx="22" cy="44" r="7" fill="#1A1C1E"/><circle cx="42" cy="44" r="7" fill="#1A1C1E"/>
      <circle cx="24" cy="42" r="2.5" fill="white"/><circle cx="44" cy="42" r="2.5" fill="white"/>
      <rect x="16" y="55" width="32" height="13" rx="5" fill="#2AA8CC"/>
    </svg>
  );
  if (variant === "pink") return (
    <svg width="72" height="72" viewBox="0 0 58 58">
      <rect x="0" y="0" width="58" height="58" rx="14" fill="#FFB4EC"/>
      <circle cx="20" cy="24" r="6" fill="#1A1C1E"/><circle cx="38" cy="24" r="6" fill="#1A1C1E"/>
      <circle cx="22" cy="22" r="2" fill="white"/><circle cx="40" cy="22" r="2" fill="white"/>
      <ellipse cx="29" cy="34" rx="4" ry="2.5" fill="#E87ACC"/>
      <path d="M18 40 Q29 48 40 40" stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (variant === "monster") return (
    <svg width="68" height="80" viewBox="0 0 60 70">
      <rect x="0" y="0" width="60" height="70" rx="14" fill="#A9D239"/>
      <circle cx="30" cy="28" r="14" fill="white"/>
      <circle cx="30" cy="28" r="9" fill="#1A1C1E"/>
      <circle cx="33" cy="25" r="3" fill="white"/>
      <rect x="14" y="48" width="32" height="8" rx="4" fill="#8BB82E"/>
      <rect x="10" y="-8" width="10" height="16" rx="5" fill="#A9D239"/>
      <rect x="40" y="-8" width="10" height="16" rx="5" fill="#A9D239"/>
    </svg>
  );
  // orange beaver
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="36" fill="#FCAE18"/>
      <circle cx="26" cy="32" r="6" fill="#1A1C1E"/><circle cx="46" cy="32" r="6" fill="#1A1C1E"/>
      <circle cx="28" cy="30" r="2" fill="white"/><circle cx="48" cy="30" r="2" fill="white"/>
      <ellipse cx="36" cy="42" rx="4" ry="3" fill="#E8860A"/>
      <path d="M26 48 Q36 56 46 48" stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ provider, userData, onContinue }) {
  const hasResults = userData?.answers && Object.keys(userData.answers).length > 0;

  if (!hasResults) {
    const name = userData?.name || userData?.email?.split("@")[0] || "there";
    return (
      <div className="roo-card roo-success-card">
        <div className="roo-logo"><RoomeoLogo /></div>
        <div className="roo-success-body">
          <CheckCircle />
          <h2 className="roo-success-title">Welcome{name !== "there" ? `, ${name}` : ""}! 🎉</h2>
          <p className="roo-success-sub">Take the 12-question survey to discover your roommate personality type and get matched.</p>
          <div className="roo-success-stats">
            <div className="roo-stat"><span style={{ color: C.blue500 }}>20+</span><small>Matches Waiting</small></div>
            <div className="roo-stat-divider"/>
            <div className="roo-stat"><span style={{ color: C.matchGreen }}>95%</span><small>Match Quality</small></div>
          </div>
          <button className="roo-btn-primary" style={{ marginTop: 8 }} onClick={onContinue}>Start My Survey →</button>
          <button className="roo-forgot" style={{ textAlign: "center" }} onClick={onContinue}>Maybe later</button>
        </div>
      </div>
    );
  }

  const { axis1, axis2 } = scoreAnswers(userData.answers);
  const typeName = getType(axis1, axis2);
  const t = TYPE_DATA[typeName];

  return (
    <div className="res-wrap">
      {/* Sticky top bar */}
      <div className="res-topbar">
        <button className="res-topbar-btn" onClick={onContinue}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1.5L2 8.5L9 15.5" stroke="#1A1C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="res-topbar-title">Your Result</span>
        <button className="res-topbar-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </button>
      </div>

      <div className="res-scroll">
        {/* ── Hero ── */}
        <div className="res-hero">
          <p className="res-hero-label">Your type is..</p>
          <h1 className="res-hero-title">{t.heroTitle}</h1>
          <p className="res-hero-desc">
            {t.heroDesc.split("\n").map((line, i) => <span key={i}>{line}{i < t.heroDesc.split("\n").length - 1 && <br/>}</span>)}
          </p>
        </div>

        {/* ── Radar card ── */}
        <div className="res-radar-card">
          <RadarChart vals={t.radar} />
        </div>

        {/* ── See who matches CTA (above fold, gray pill) ── */}
        <div className="res-cta-row">
          <button className="res-cta-pill" onClick={onContinue}>See who matches you</button>
        </div>

        {/* ── Divider gap ── */}
        <div style={{ height: 32 }}/>

        {/* ── Why you got this type ── */}
        <div className="res-section">
          <h2 className="res-sec-h">{t.whyTitle}</h2>
          <p className="res-sec-intro">{t.whyIntro}</p>
          <ul className="res-bullets">
            {t.why.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>

        {/* ── Example of conflict ── */}
        <div className="res-section">
          <h2 className="res-sec-h">{t.conflictTitle}</h2>
          <p className="res-sec-body">{t.conflict}</p>
        </div>

        {/* ── Ideal roommate ── */}
        <div className="res-section">
          <h2 className="res-sec-h">{t.matchTitle}</h2>
          <p className="res-sec-intro">{t.matchIntro}</p>
          <ul className="res-bullets">
            {t.matchQualities.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
          <p className="res-sec-body" style={{ marginTop: 10 }}>
            <strong>Best fit:</strong> {t.bestFit}
          </p>
          <p className="res-sec-body">
            <strong>Possible challenge:</strong> {t.challenge}
          </p>
        </div>

        {/* ── Match cards (placeholder) ── */}
        <div className="res-match-row">
          {t.matches.map(m => (
            <div key={m.name} className="res-match-card">
              <MiniChar variant={m.char} size={56} />
              <span className="res-match-name">{m.name}</span>
              <span className="res-match-pct">{m.pct}% match</span>
              <span className="res-match-type">{m.type}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 32 }}/>
      </div>

      {/* ── Sticky bottom CTA ── */}
      <div className="res-footer">
        <button className="sv-continue" onClick={onContinue}>See who matches you</button>
      </div>
    </div>
  );
}

// ─── Survey Data — exact content from Figma screens ──────────────────────────
const QUESTIONS = [
  {
    q: "After cooking or eating, what do you usually do with your dishes?",
    options: ["Clean them immediately", "Rinse and load them soon", "Leave them for later but handle them the same day", "Leave them in the sink for a long time"],
  },
  {
    q: "When the dishwasher finishes, what do you usually do?",
    options: ["Unload it right away", "Unload it later that day", "Leave it until I need something", "Wait for someone else to unload it"],
  },
  {
    q: "After using a shared bathroom, I usually:",
    options: ["Clean everything immediately", "Clean visible mess first", "Clean it later when I have time", "Don't pay much attention"],
  },
  {
    q: "After using a shared pan or pot, I usually:",
    options: ["Wash and return it immediately", "Wash it but put it back later", "Let it soak and deal with it later", "Leave it for someone else sometimes"],
  },
  {
    q: "If a shared item is not where it should be, I usually:",
    options: ["Put it back immediately", "Put it back when I notice it", "Only look for it when I need it", "Don't worry about it"],
  },
  {
    q: "If the trash is full or smells, I usually:",
    options: ["Take it out immediately", "Handle it if it's my turn", "Let it soak and deal with it later", "Leave it for someone else sometimes"],
  },
  {
    q: "If a roommate habit bothers me, I usually:",
    options: ["Bring it up quickly", "Mention it politely (often by message)", "Wait until it builds up", "Avoid bringing it up"],
  },
  {
    q: "For sensitive house rules (guests, quiet hours), I prefer to:",
    options: ["Agree on them clearly beforehand", "Set broad expectations first", "Discuss only if problems appear", "Avoid bringing it up"],
  },
  {
    q: "If my roommate reacts defensively, I usually:",
    options: ["Explain again and find a compromise", "Rephrase it more gently", "Bring it up later", "Stop mentioning it"],
  },
  {
    q: "When conflict happens at home, I usually:",
    options: ["Discuss it immediately and solve it", "Talk about it casually", "Wait until it becomes bigger", "Avoid the conversation"],
  },
  {
    q: "My preferred way to raise an issue is:",
    options: ["Face-to-face conversation", "Text or message", "Delay the conversation", "Not say anything"],
  },
  {
    q: "When house rules feel unclear, I usually:",
    options: ["Suggest writing clear rules", "Agree on the basics", "Adjust as we go", "Avoid formal rules"],
  },
];

// ─── Character atoms ──────────────────────────────────────────────────────────
// Orange Beaver
function Beaver({ x = 0, y = 0, r = 36 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={r} cy={r} r={r} fill="#FCAE18"/>
      <circle cx={r - 10} cy={r - 4} r={6} fill="#1A1C1E"/>
      <circle cx={r + 10} cy={r - 4} r={6} fill="#1A1C1E"/>
      <circle cx={r - 8} cy={r - 6} r={2} fill="white"/>
      <circle cx={r + 12} cy={r - 6} r={2} fill="white"/>
      <ellipse cx={r} cy={r + 7} rx={4} ry={3} fill="#E8860A"/>
      <path d={`M${r-10} ${r+13} Q${r} ${r+20} ${r+10} ${r+13}`} stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx={r - 18} cy={r + 9} rx={6} ry={4} fill="#F4A020" opacity="0.4"/>
      <ellipse cx={r + 18} cy={r + 9} rx={6} ry={4} fill="#F4A020" opacity="0.4"/>
    </g>
  );
}

// Blue House character
function HouseChar({ x = 0, y = 0 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="4" y="24" width="56" height="46" rx="10" fill="#56D0FF"/>
      <polygon points="32,0 64,24 0,24" fill="#3ABDE8"/>
      <circle cx="22" cy="44" r="7" fill="#1A1C1E"/>
      <circle cx="42" cy="44" r="7" fill="#1A1C1E"/>
      <circle cx="24" cy="42" r="2.5" fill="white"/>
      <circle cx="44" cy="42" r="2.5" fill="white"/>
      <rect x="16" y="55" width="32" height="15" rx="5" fill="#2AA8CC"/>
    </g>
  );
}

// Green Monster
function Monster({ x = 0, y = 0 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="0" width="60" height="70" rx="14" fill="#A9D239"/>
      <circle cx="30" cy="28" r="14" fill="white"/>
      <circle cx="30" cy="28" r="9" fill="#1A1C1E"/>
      <circle cx="33" cy="25" r="3" fill="white"/>
      <rect x="14" y="48" width="32" height="8" rx="4" fill="#8BB82E"/>
      <rect x="10" y="-8" width="10" height="16" rx="5" fill="#A9D239"/>
      <rect x="40" y="-8" width="10" height="16" rx="5" fill="#A9D239"/>
    </g>
  );
}

// Pink Square character
function PinkSquare({ x = 0, y = 0 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x="0" y="0" width="58" height="58" rx="14" fill="#FFB4EC"/>
      <circle cx="20" cy="24" r="6" fill="#1A1C1E"/>
      <circle cx="38" cy="24" r="6" fill="#1A1C1E"/>
      <circle cx="22" cy="22" r="2" fill="white"/>
      <circle cx="40" cy="22" r="2" fill="white"/>
      <ellipse cx="29" cy="34" rx="4" ry="2.5" fill="#E87ACC"/>
      <path d="M18 40 Q29 48 40 40" stroke="#1A1C1E" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  );
}

// Per-question illustrations matching the Figma screens
function Q1Char()  { return <svg width="170" height="90" viewBox="0 0 170 90" fill="none"><Beaver x={0} y={6} r={36}/><g transform="translate(94,18)"><ellipse cx="34" cy="34" rx="32" ry="32" fill="#D0D0D0" stroke="#2A2A2A" strokeWidth="3"/><ellipse cx="34" cy="34" rx="24" ry="24" fill="#FFB4EC" opacity="0.9"/><rect x="58" y="16" width="16" height="7" rx="3.5" fill="#2A2A2A" transform="rotate(25 58 16)"/><line x1="34" y1="18" x2="34" y2="28" stroke="#1A1C1E" strokeWidth="2.5" strokeLinecap="round"/><line x1="34" y1="34" x2="44" y2="34" stroke="#1A1C1E" strokeWidth="2.5" strokeLinecap="round"/></g></svg>; }
function Q2Char()  { return <svg width="160" height="90" viewBox="0 0 160 90" fill="none"><HouseChar x={0} y={18}/><g transform="translate(76,12)"><rect x="0" y="0" width="52" height="68" rx="8" fill="#D0D0D0"/><rect x="4" y="4" width="44" height="48" rx="5" fill="#1A1C1E"/><rect x="18" y="58" width="16" height="6" rx="3" fill="#FCAE18"/></g></svg>; }
function Q3Char()  { return <svg width="160" height="90" viewBox="0 0 160 90" fill="none"><Monster x={0} y={10}/><g transform="translate(76,22)"><ellipse cx="30" cy="18" rx="30" ry="18" fill="#E0E0E0"/><rect x="22" y="18" width="16" height="44" rx="4" fill="#E0E0E0"/><ellipse cx="30" cy="62" rx="20" ry="10" fill="#D0D0D0"/></g></svg>; }
function Q4Char()  { return <svg width="170" height="90" viewBox="0 0 170 90" fill="none"><Beaver x={0} y={6} r={36}/><g transform="translate(90,28)"><ellipse cx="36" cy="28" rx="34" ry="22" fill="#1A1C1E"/><ellipse cx="36" cy="24" rx="28" ry="18" fill="#2A2A2A"/><circle cx="58" cy="28" r="5" fill="#555"/><circle cx="14" cy="28" r="5" fill="#555"/></g></svg>; }
function Q5Char()  { return <svg width="160" height="90" viewBox="0 0 160 90" fill="none"><PinkSquare x={0} y={14}/><g transform="translate(74,20)"><rect x="0" y="0" width="60" height="52" rx="8" fill="#FCAE18"/><rect x="10" y="12" width="40" height="5" rx="2.5" fill="white" opacity="0.6"/><rect x="10" y="22" width="30" height="5" rx="2.5" fill="white" opacity="0.6"/><rect x="10" y="32" width="36" height="5" rx="2.5" fill="white" opacity="0.6"/></g></svg>; }
function Q6Char()  { return <svg width="150" height="90" viewBox="0 0 150 90" fill="none"><Monster x={0} y={10}/><g transform="translate(68,14)"><rect x="10" y="30" width="52" height="46" rx="6" fill="#C8C8C8"/><path d="M10 30 Q36 8 62 30" fill="#B0B0B0"/><rect x="30" y="4" width="12" height="28" rx="6" fill="#A0A0A0"/></g></svg>; }
function Q7Char()  { return <svg width="180" height="90" viewBox="0 0 180 90" fill="none"><Beaver x={0} y={6} r={36}/><g transform="translate(78,26)"><line x1="12" y1="0" x2="12" y2="44" stroke="#1A1C1E" strokeWidth="3"/></g><PinkSquare x={100} y={14}/></svg>; }
function Q8Char()  { return <svg width="160" height="90" viewBox="0 0 160 90" fill="none"><Beaver x={0} y={6} r={36}/><g transform="translate(88,22)"><path d="M12 36 L28 52 L62 18" stroke="#A9D239" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g></svg>; }
function Q9Char()  { return <svg width="200" height="90" viewBox="0 0 200 90" fill="none"><Beaver x={0} y={6} r={36}/><g transform="translate(82,22)"><line x1="12" y1="0" x2="12" y2="44" stroke="#1A1C1E" strokeWidth="3"/></g><PinkSquare x={102} y={14}/><g transform="translate(168,40)"><line x1="0" y1="0" x2="18" y2="0" stroke="#FCAE18" strokeWidth="3" strokeLinecap="round"/></g></svg>; }
function Q10Char() { return <svg width="190" height="90" viewBox="0 0 190 90" fill="none"><HouseChar x={0} y={18}/><Monster x={72} y={10}/><g transform="translate(140,12)"><rect x="4" y="24" width="46" height="38" rx="8" fill="#1A1C1E"/><polygon points="27,0 54,24 0,24" fill="#555"/><path d="M14 40 L14 62" stroke="#FCAE18" strokeWidth="3"/></g></svg>; }
function Q11Char() { return <svg width="180" height="90" viewBox="0 0 180 90" fill="none"><PinkSquare x={0} y={14}/><g transform="translate(68,22)"><line x1="12" y1="0" x2="12" y2="44" stroke="#1A1C1E" strokeWidth="3"/></g><Beaver x={88} y={6} r={36}/></svg>; }
function Q12Char() { return <svg width="170" height="90" viewBox="0 0 170 90" fill="none"><HouseChar x={0} y={18}/><g transform="translate(76,20)"><rect x="0" y="0" width="72" height="52" rx="8" fill="#D8D8D8"/><path d="M0 0 L36 30 L72 0" stroke="#B0B0B0" strokeWidth="3" fill="none"/><rect x="16" y="34" width="40" height="5" rx="2.5" fill="#B8B8B8"/><rect x="22" y="44" width="28" height="5" rx="2.5" fill="#B8B8B8"/></g></svg>; }

const CHARS = [Q1Char, Q2Char, Q3Char, Q4Char, Q5Char, Q6Char, Q7Char, Q8Char, Q9Char, Q10Char, Q11Char, Q12Char];

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 3), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="sv-screen sv-loading">
      <div className="sv-loading-inner">
        <div className="sv-loading-chars">
          <svg width="240" height="80" viewBox="0 0 240 80" fill="none">
            <Monster x={0} y={4}/>
            <Beaver x={68} y={4} r={30}/>
            <PinkSquare x={138} y={10}/>
            <HouseChar x={204} y={10}/>
          </svg>
        </div>
        <div className="sv-loading-dots">
          {[0,1,2].map(i => (
            <div key={i} className="sv-dot" style={{ background: dot === i ? C.neutral700 : "#D0D0D0" }} />
          ))}
        </div>
        <p className="sv-loading-title">Analyzing your roommate pattern…</p>
        <p className="sv-loading-sub">This will only take a moment</p>
      </div>
    </div>
  );
}

// ─── SURVEY SCREEN ────────────────────────────────────────────────────────────
function SurveyScreen({ onBack, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const total = QUESTIONS.length;
  const progress = (step + 1) / total;
  const q = QUESTIONS[step];
  const CharComponent = CHARS[step];

  function goNext() {
    const newAnswers = { ...answers, [step]: selected };
    setAnswers(newAnswers);
    if (step === total - 1) {
      setLoading(true);
      setTimeout(() => { setLoading(false); onComplete(newAnswers); }, 2800);
      return;
    }
    setAnimKey(k => k + 1);
    setTimeout(() => {
      setStep(s => s + 1);
      setSelected(null);
    }, 10);
  }

  function goBack() {
    if (step === 0) { onBack(); return; }
    setAnimKey(k => k + 1);
    setTimeout(() => {
      setStep(s => s - 1);
      setSelected(answers[step - 1] ?? null);
    }, 10);
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="sv-screen">
      <div className="sv-header">
        <button className="sv-back" onClick={goBack}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1.5L2 8.5L9 15.5" stroke="#1A1C1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="sv-title">survey {String(step + 1).padStart(2, "0")}/{total}</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="sv-progress-track">
        <div className="sv-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="sv-body" key={animKey}>
        <div className="sv-character"><CharComponent /></div>
        <h2 className="sv-question">{q.q}</h2>
        <div className="sv-options">
          {q.options.map((opt, i) => {
            const label = String.fromCharCode(65 + i);
            const isSelected = selected === i;
            return (
              <button key={i} className={`sv-option ${isSelected ? "sv-option--selected" : ""}`} onClick={() => setSelected(i)}>
                <span className="sv-option-label">{label}. {opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sv-footer">
        <button className="sv-continue" onClick={goNext}>
          {step === total - 1 ? "Submit" : "continue"}
        </button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login"); // login | signup | success | survey
  const [authData, setAuthData] = useState({});

  function handleSuccess(provider, data) {
    if (provider === "skip") { setScreen("survey"); return; }
    setAuthData({ provider, ...data });
    setScreen("success");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .roo-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(150deg, #e8ecf4 0%, #dce6f5 60%, #e4e8f2 100%);
        }

        .roo-card {
          background: #fff;
          width: 100%; max-width: 440px;
          border-radius: 28px;
          padding: 36px 32px 40px;
          box-shadow: 0 24px 64px rgba(4,98,210,0.09), 0 4px 16px rgba(0,0,0,0.06);
          animation: fadeUp 0.3s ease;
        }

        .roo-logo { display: flex; justify-content: center; margin-bottom: 20px; }
        .roo-hero { display: flex; justify-content: center; margin-bottom: 12px; }

        .roo-heading { margin-bottom: 22px; }
        .roo-heading h1 {
          font-size: clamp(20px, 5vw, 26px); font-weight: 700;
          color: #1A1C1E; line-height: 1.28; letter-spacing: -0.4px;
        }
        .roo-heading h1 span { color: #0462D2; }
        .roo-heading p { font-size: 14px; color: #6C7278; margin-top: 6px; line-height: 1.5; }

        .roo-form { display: flex; flex-direction: column; gap: 14px; }

        .roo-field { display: flex; flex-direction: column; gap: 5px; }
        .roo-label { font-size: 14px; font-weight: 400; color: #1A1C1E; }
        .roo-field-error { font-size: 12px; color: #E53E3E; margin-top: 2px; }

        .roo-input {
          display: flex; align-items: center;
          height: 46px; border: 1px solid #EDF1F3; border-radius: 10px;
          padding: 0 14px; gap: 8px; background: #fff;
          box-shadow: 0 1px 2px rgba(228,229,231,0.3);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .roo-input:focus-within { border-color: #0462D2; box-shadow: 0 0 0 3px rgba(4,98,210,0.1); }
        .roo-input--error { border-color: #E53E3E; }
        .roo-input--error:focus-within { box-shadow: 0 0 0 3px rgba(229,62,62,0.12); }
        .roo-input input {
          flex: 1; min-width: 0; border: none; outline: none; background: transparent;
          font-family: 'Poppins', sans-serif; font-size: 14px; color: #1A1C1E;
        }
        .roo-input input::placeholder { color: #86909C; }
        .roo-eye { background: none; border: none; cursor: pointer; display: flex; align-items: center; flex-shrink: 0; padding: 0; }

        .roo-forgot-row { display: flex; justify-content: flex-end; margin-top: -4px; }
        .roo-forgot {
          background: none; border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-size: 13px; color: #4D81E7;
        }
        .roo-forgot:hover { text-decoration: underline; }

        .roo-btn-primary {
          width: 100%; height: 64px;
          background: #1F1F1F; border: none; border-radius: 16px;
          font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 500; color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.15s, transform 0.12s;
        }
        .roo-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .roo-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .roo-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .roo-btn-secondary {
          width: 100%; height: 46px;
          background: #1F1F1F; border: none; border-radius: 16px;
          font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 500; color: #fff;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.12s;
        }
        .roo-btn-secondary:hover { opacity: 0.9; transform: translateY(-1px); }
        .roo-btn-secondary:active { transform: translateY(0); }

        .roo-divider { display: flex; align-items: center; gap: 12px; }
        .roo-divider-line { flex: 1; height: 1px; background: #EDF1F3; }
        .roo-divider span { font-size: 13px; color: #6C7278; white-space: nowrap; }

        .roo-socials { display: flex; gap: 12px; }
        .roo-social {
          flex: 1; height: 48px;
          background: #fff; border: 1px solid #EFF0F6; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 500; color: #1F1F1F;
          cursor: pointer; min-width: 0;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .roo-social:hover:not(:disabled) { background: #F6F7F9; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .roo-social:disabled { opacity: 0.6; cursor: not-allowed; }

        .roo-signup-row {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; flex-wrap: wrap;
        }
        .roo-signup-row span { font-size: 14px; color: #6C7278; }
        .roo-signup-row button {
          background: none; border: none; cursor: pointer;
          font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; color: #0462D2;
        }
        .roo-signup-row button:hover { text-decoration: underline; }

        .roo-terms {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13px; color: #6C7278; cursor: pointer; line-height: 1.5;
        }
        .roo-terms input { margin-top: 2px; accent-color: #0462D2; flex-shrink: 0; }
        .roo-terms a { color: #0462D2; text-decoration: none; }
        .roo-terms a:hover { text-decoration: underline; }

        /* Success */
        .roo-success-card { display: flex; flex-direction: column; }
        .roo-success-body {
          display: flex; flex-direction: column;
          align-items: center; gap: 16px; text-align: center; padding-top: 8px;
        }
        .roo-success-title { font-size: 22px; font-weight: 700; color: #1A1C1E; }
        .roo-success-sub { font-size: 14px; color: #6C7278; line-height: 1.6; max-width: 300px; }
        .roo-success-stats {
          display: flex; align-items: center; gap: 0;
          background: #F6F7F9; border-radius: 16px; padding: 16px 32px; width: 100%; justify-content: center;
        }
        .roo-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; flex: 1; }
        .roo-stat span { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .roo-stat small { font-size: 12px; color: #6C7278; }
        .roo-stat-divider { width: 1px; height: 40px; background: #EDF1F3; margin: 0 16px; }

        /* Survey screen */
        @keyframes svFadeIn  { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes svFadeOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-18px); } }

        .sv-screen {
          width: 100%; max-width: 440px;
          min-height: 100dvh;
          background: #fff;
          display: flex; flex-direction: column;
          border-radius: 28px;
          box-shadow: 0 24px 64px rgba(4,98,210,0.09), 0 4px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .sv-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 20px 0;
          flex-shrink: 0;
        }
        .sv-back {
          width: 36px; height: 36px;
          background: #F6F7F9; border: none; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s;
        }
        .sv-back:hover { background: #EDF1F3; }
        .sv-title {
          font-family: 'Poppins', sans-serif;
          font-size: 18px; font-weight: 600; color: #1A1C1E;
          letter-spacing: -0.2px;
        }
        .sv-progress-track {
          height: 8px; background: #F6F7F9;
          margin: 16px 20px 0; border-radius: 28px; overflow: hidden;
          flex-shrink: 0;
        }
        .sv-progress-fill {
          height: 100%; background: #0462D2;
          border-radius: 28px;
          transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .sv-body {
          flex: 1; overflow-y: auto;
          padding: 24px 20px 16px;
          scrollbar-width: none;
        }
        .sv-body::-webkit-scrollbar { display: none; }
        .sv-character {
          display: flex; align-items: flex-end;
          margin-bottom: 24px;
        }
        .sv-question {
          font-family: 'Poppins', sans-serif;
          font-size: 20px; font-weight: 700; color: #1A1C1E;
          line-height: 1.4; margin-bottom: 24px;
        }
        .sv-options { display: flex; flex-direction: column; }
        .sv-option {
          width: 100%;
          border: none; border-bottom: 1px solid #EFF0F6;
          background: transparent;
          padding: 18px 0; text-align: left; cursor: pointer;
          transition: background 0.12s;
        }
        .sv-option:first-child { border-top: 1px solid #EFF0F6; }
        .sv-option:hover:not(.sv-option--selected) { background: #FAFBFC; }
        .sv-option--selected { background: transparent; }
        .sv-option-label {
          font-family: 'Poppins', sans-serif;
          font-size: 16px; font-weight: 300; color: #4B4B4B;
          line-height: 1.45;
        }
        .sv-option--selected .sv-option-label { color: #0462D2; font-weight: 500; }

        /* Loading screen */
        .sv-loading {
          display: flex; align-items: center; justify-content: center;
        }
        .sv-loading-inner {
          display: flex; flex-direction: column; align-items: center;
          gap: 20px; padding: 48px 32px; text-align: center;
        }
        .sv-loading-chars { display: flex; justify-content: center; }
        .sv-loading-dots { display: flex; gap: 8px; }
        .sv-dot { width: 10px; height: 10px; border-radius: 50%; transition: background 0.3s; }
        .sv-loading-title {
          font-family: 'Poppins', sans-serif;
          font-size: 18px; font-weight: 700; color: #1A1C1E;
        }
        .sv-loading-sub {
          font-family: 'Poppins', sans-serif;
          font-size: 14px; color: #6C7278; margin-top: -12px;
        }
        .sv-footer {
          padding: 12px 20px 24px; flex-shrink: 0;
          background: #fff;
          box-shadow: 0 -8px 24px rgba(0,0,0,0.04);
        }
        .sv-continue {
          width: 100%; height: 64px;
          background: #1F1F1F; border: none; border-radius: 20px;
          font-family: 'Poppins', sans-serif;
          font-size: 20px; font-weight: 500; color: #fff; letter-spacing: 0.2px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.12s;
        }
        .sv-continue:hover { opacity: 0.9; transform: translateY(-1px); }

        @media (min-width: 480px) {
          .sv-screen { min-height: unset; border-radius: 28px; }
        }
        @media (max-width: 480px) {
          .sv-screen { border-radius: 0; box-shadow: none; max-width: 100%; }
        }

        /* ── Result screen ── */
        .res-wrap {
          width: 100%; max-width: 440px;
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 24px 64px rgba(4,98,210,0.09), 0 4px 16px rgba(0,0,0,0.06);
          display: flex; flex-direction: column;
          max-height: 92vh; overflow: hidden;
          animation: fadeUp 0.3s ease;
        }
        .res-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 20px 16px; flex-shrink: 0;
          border-bottom: 1px solid #F6F7F9;
        }
        .res-topbar-title { font-family:'Poppins',sans-serif; font-size:18px; font-weight:700; color:#1A1C1E; }
        .res-topbar-btn { width:36px; height:36px; background:none; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }

        .res-scroll { flex:1; overflow-y:auto; scrollbar-width:none; }
        .res-scroll::-webkit-scrollbar { display:none; }

        .res-hero { padding: 28px 24px 0; text-align: center; }
        .res-hero-label { font-size:13px; color:#86909C; font-family:'Poppins',sans-serif; margin-bottom:6px; }
        .res-hero-title { font-size:30px; font-weight:800; color:#1A1C1E; font-family:'Poppins',sans-serif; margin-bottom:12px; line-height:1.15; }
        .res-hero-desc { font-size:14px; color:#4B4B4B; font-family:'Poppins',sans-serif; line-height:1.7; }

        .res-radar-card {
          margin:18px 16px 0; background:#F8F6F2; border-radius:14px;
          display:flex; justify-content:center; padding:12px 4px 8px;
        }
        .res-cta-row { display:flex; justify-content:center; padding:20px 24px 0; }
        .res-cta-pill {
          background:#EBEBEB; border:none; border-radius:50px;
          padding:14px 32px; font-size:16px; font-family:'Poppins',sans-serif;
          font-weight:500; color:#3A3A3A; cursor:pointer; transition:background .15s;
        }
        .res-cta-pill:hover { background:#E0E0E0; }

        .res-section { padding: 4px 24px 0; }
        .res-sec-h { font-size:16px; font-weight:700; color:#1A1C1E; font-family:'Poppins',sans-serif; text-align:center; margin-bottom:10px; margin-top: 28px; }
        .res-sec-intro { font-size:14px; color:#4B4B4B; font-family:'Poppins',sans-serif; margin-bottom:6px; }
        .res-sec-body { font-size:14px; color:#4B4B4B; font-family:'Poppins',sans-serif; line-height:1.65; margin:0; }
        .res-bullets { list-style:disc; padding-left:20px; margin:0 0 8px 0; display:flex; flex-direction:column; gap:3px; }
        .res-bullets li { font-size:14px; color:#4B4B4B; font-family:'Poppins',sans-serif; line-height:1.6; }

        .res-match-row { display:flex; gap:12px; padding:16px 24px 0; }
        .res-match-card { flex:1; background:#F6F7F9; border-radius:14px; padding:16px 12px; display:flex; flex-direction:column; align-items:center; gap:5px; }
        .res-match-name { font-size:15px; font-weight:600; color:#1A1C1E; font-family:'Poppins',sans-serif; }
        .res-match-pct { font-size:13px; font-weight:500; color:#007A6A; font-family:'Poppins',sans-serif; }
        .res-match-type { font-size:12px; color:#6C7278; font-family:'Poppins',sans-serif; }

        .res-footer { padding:12px 20px 20px; flex-shrink:0; box-shadow:0 -8px 24px rgba(0,0,0,0.04); }

        @media (max-width:480px) { .res-wrap { border-radius:0; box-shadow:none; max-width:100%; max-height:100dvh; } }
        @media (min-width:480px) { .res-wrap { max-height:90vh; } }

        /* Mobile */
        @media (max-width: 480px) {
          .roo-page { padding: 0; align-items: flex-start; background: #fff; }
          .roo-card { min-height: 100dvh; border-radius: 0; box-shadow: none; max-width: 100%; padding: 48px 24px 40px; }
          .roo-btn-primary { font-size: 18px; height: 58px; }
        }
        @media (min-width: 640px) {
          .roo-card { padding: 44px 44px 48px; }
        }

        /* ── Dev banner ── */
        .dev-banner {
          position: absolute; top: 0; left: 0; right: 0;
          background: #1A1C1E; color: white; border-radius: 28px 28px 0 0;
          padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px;
          z-index: 10; animation: fadeUp 0.2s ease;
        }
        .dev-banner-icon { font-size: 20px; flex-shrink: 0; }
        .dev-banner-body { flex: 1; }
        .dev-banner-body strong { font-size: 13px; font-weight: 700; display: block; }
        .dev-banner-body p { font-size: 12px; color: #aaa; line-height: 1.4; margin: 3px 0 0; }
        .dev-banner-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .dev-banner-demo {
          background: #0462D2; border: none; border-radius: 8px;
          color: white; font-size: 12px; font-weight: 600; padding: 6px 12px; cursor: pointer;
          font-family: 'Poppins', sans-serif;
        }
        .dev-banner-close { background: none; border: none; color: #666; font-size: 14px; cursor: pointer; padding: 4px; }

        /* ── Server error ── */
        .roo-server-error {
          background: #FFF0F0; border: 1px solid #FFCDD2; border-radius: 10px;
          padding: 10px 14px; font-size: 13px; color: #C62828;
          font-family: 'Poppins', sans-serif; line-height: 1.5;
        }

        /* ── Password strength ── */
        .roo-pw-strength { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .roo-pw-bars { display: flex; gap: 4px; flex: 1; }
        .roo-pw-bar { flex: 1; height: 4px; border-radius: 4px; transition: background 0.25s; }
        .roo-pw-reqs { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 8px; }
        .roo-pw-req {
          font-size: 12px; color: #86909C; font-family: 'Poppins', sans-serif;
          display: flex; align-items: center; gap: 4px; transition: color 0.2s;
        }
        .roo-pw-req.met { color: #006659; }

        /* ── Flow icon (lock/shield) ── */
        .roo-flow-icon {
          width: 64px; height: 64px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
        }

        /* ── Verify / recovery screens ── */
        .roo-verify-body {
          display: flex; flex-direction: column;
          align-items: center; gap: 14px; text-align: center; padding-top: 8px;
        }
        .roo-verify-icon { font-size: 52px; line-height: 1; }
        .roo-verify-title { font-size: 22px; font-weight: 700; color: #1A1C1E; font-family: 'Poppins', sans-serif; }
        .roo-verify-sub { font-size: 14px; color: #6C7278; line-height: 1.6; }
        .roo-verify-sub strong { color: #1A1C1E; }
        .roo-verify-hint { font-size: 13px; color: #86909C; line-height: 1.6; max-width: 290px; }
        .roo-verify-resend { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6C7278; }
      `}</style>

      <div className="roo-page">
        {screen === "login" && (
          <LoginScreen
            onSignUp={() => setScreen("signup")}
            onSuccess={handleSuccess}
            onForgotPassword={() => setScreen("forgot")}
          />
        )}
        {screen === "signup" && (
          <SignUpScreen
            onLogin={() => setScreen("login")}
            onSuccess={handleSuccess}
          />
        )}
        {screen === "forgot" && (
          <ForgotPasswordScreen
            onBack={() => setScreen("login")}
            onSent={(email) => { setAuthData(p => ({...p, resetEmail: email})); setScreen("check-reset"); }}
          />
        )}
        {screen === "check-reset" && (
          <CheckResetEmailScreen
            email={authData.resetEmail}
            onBack={() => setScreen("forgot")}
            onResetPassword={() => setScreen("reset-password")}
          />
        )}
        {screen === "reset-password" && (
          <ResetPasswordScreen
            email={authData.resetEmail}
            onSuccess={() => setScreen("login")}
            onBack={() => setScreen("login")}
          />
        )}
        {screen === "success" && (
          <SuccessScreen
            provider={authData.provider}
            userData={authData}
            onContinue={() => setScreen("survey")}
          />
        )}
        {screen === "survey" && (
          <SurveyScreen
            onBack={() => setScreen("login")}
            onComplete={(answers) => { setAuthData(p => ({...p, answers})); setScreen("result"); }}
          />
        )}
        {screen === "result" && (
          <SuccessScreen
            provider={authData.provider}
            userData={authData}
            onContinue={() => setScreen("login")}
          />
        )}
      </div>
    </>
  );
}

export default App;
