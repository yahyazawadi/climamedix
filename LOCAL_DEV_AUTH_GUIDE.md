# Local Dev & Supabase Session Transfer Guide

This quick guide explains how to run ClimaMedix PWA locally on port 9090 and bypass OAuth redirection by transferring your active Google/Supabase session from the production site.

---

## 1. Run ClimaMedix at localhost:9090

### On the Desktop (or via SSH terminal):
```cmd
cd /d C:\Users\CLICK\Desktop\climamedix-pwa && npx vite --host 0.0.0.0 --port 9090
```

### On the Laptop (SSH Port Forward):
To route `localhost:9090` on your laptop to the remote desktop:
```powershell
ssh -f -N -L 9090:127.0.0.1:9090 yahya@desktop
```

Access in your browser:
👉 **`http://localhost:9090`** (or directly via Tailscale: `http://100.113.121.107:9090`).

---

## 2. Transfer Supabase Session from Live Site to Localhost

Supabase auth sessions (including Google OAuth) are stored in browser **`localStorage`**, not HTTP cookies. Because Google OAuth redirects to the production domain, you can copy your authenticated session into `localhost` in seconds.

### Step A: Copy Session from Live Site
1. Open your live website (`https://climateaction.site`) where you are signed in with Google.
2. Press **F12** -> switch to the **Console** tab.
3. Paste and run:
   ```javascript
   const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
   copy(JSON.stringify({ key, data: localStorage.getItem(key) }));
   console.log("✅ Supabase auth session copied to clipboard!");
   ```

### Step B: Paste Session into Localhost (`http://localhost:9090`)
1. Open **`http://localhost:9090`** in your browser.
2. Press **F12** -> switch to the **Console** tab.
3. Paste and run:
   ```javascript
   const session = PASTE_HERE; // Replace PASTE_HERE with your clipboard content (Ctrl + V)
   localStorage.setItem(session.key, session.data);
   location.reload();
   ```

After reloading, you will be immediately authenticated as your Google user on `localhost:9090` without undergoing OAuth redirection.
