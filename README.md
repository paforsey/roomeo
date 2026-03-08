# Roomeo — Find Your Perfect Roommate

A React + Vite single-page application with a personality-based roommate matching flow.

---

## Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| UI        | React 18                    |
| Bundler   | Vite 5                      |
| Auth      | Google Identity Services + Apple Sign In JS SDK |
| Fonts     | Poppins via Google Fonts    |
| Hosting   | Any static host (Netlify / Vercel / Nginx) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# → Edit .env and add your Google and Apple OAuth credentials

# 3. Start local dev server
npm run dev
# → Opens at http://localhost:5173
```

---

## Build for Production

```bash
npm run build
# Output goes to /dist — upload this folder to your server
```

To preview the production build locally:
```bash
npm run preview
```

---

## Environment Variables

Copy `.env.example` → `.env` and fill in your credentials.

| Variable                | Description                              |
|-------------------------|------------------------------------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID           |
| `VITE_APPLE_CLIENT_ID`  | Apple Sign In Services ID                |

> ⚠️ Never commit `.env` to git. It's already in `.gitignore`.

### Getting Google Client ID
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → **Create OAuth 2.0 Client ID**
3. Application type: **Web Application**
4. Add your domain to **Authorized JavaScript Origins**
5. Copy the Client ID into `VITE_GOOGLE_CLIENT_ID`

### Getting Apple Service ID
1. Go to [developer.apple.com](https://developer.apple.com)
2. Certificates, Identifiers & Profiles → **Identifiers** → Services IDs
3. Create a new Service ID and enable **Sign In with Apple**
4. Add your domain and redirect URI (`https://yourdomain.com`)
5. Copy the Service ID into `VITE_APPLE_CLIENT_ID`

---

## Deployment

### Netlify
Drag and drop the `/dist` folder to [app.netlify.com](https://app.netlify.com), or connect your repo. `netlify.toml` is already configured.

Set environment variables in Netlify:
**Site Settings → Environment Variables** → add `VITE_GOOGLE_CLIENT_ID` and `VITE_APPLE_CLIENT_ID`.

### Vercel
```bash
npm i -g vercel
vercel
```
`vercel.json` is already configured. Set env vars in the Vercel dashboard.

### Nginx / VPS
```bash
# Build
npm run build

# Upload dist/ to your server
scp -r dist/ user@yourserver:/var/www/roomeo/

# Use the included nginx.conf
# Edit it to replace yourdomain.com, then:
sudo cp nginx.conf /etc/nginx/sites-available/roomeo
sudo ln -s /etc/nginx/sites-available/roomeo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add HTTPS with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## App Screens

| Screen               | Route trigger     | Description                              |
|----------------------|-------------------|------------------------------------------|
| Login                | Initial load      | Email + Google + Apple sign in           |
| Sign Up              | "Sign up" link    | Registration with email verification     |
| Forgot Password      | "Forgot Password" | Send reset link                          |
| Check Email          | After forgot pw   | Confirm reset email sent                 |
| Reset Password       | From email link   | Set new password with strength checker   |
| Welcome              | After auth        | Survey intro with stats                  |
| Survey (12 Qs)       | "Start Survey"    | Personality assessment                   |
| Loading              | After Q12         | Animated analysis screen                 |
| Result               | After loading     | Type reveal + radar chart + match cards  |

---

## Personality Types

| Type      | Structure | Directness | Description                          |
|-----------|-----------|------------|--------------------------------------|
| Beaver 🦫 | High      | High       | Organized, direct, keeps house running |
| Bunny 🐰  | High      | Low        | Tidy, considerate, avoids conflict   |
| Retriever 🐕 | Low    | High       | Flexible on chores, open communicator |
| Turtle 🐢 | Low       | Low        | Independent, low-pressure, easygoing |

---

## Replacing the Mock Auth

The app ships with an in-memory mock auth store for demo purposes. To connect a real backend:

1. Replace `mockRegister()` and `mockLogin()` in `src/App.jsx` with real API calls
2. Store the returned JWT/session token (localStorage or httpOnly cookie)
3. Add a route guard to check auth state on app load

---

## License
MIT — free to use and modify.
