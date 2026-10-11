import { render } from 'preact'
import './index.css'
import { App } from './app.jsx'

// Auto-redirect back to local dev server if user came back from Supabase OAuth to production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  try {
    let devOrigin = localStorage.getItem('cm_dev_origin');
    if (!devOrigin) {
      const match = document.cookie.match(/(^|;)\s*cm_dev_origin=([^;]+)/);
      if (match) devOrigin = decodeURIComponent(match[2]);
    }
    // Also check query param or hash for auth tokens (e.g. #access_token=... or ?code=...)
    if (devOrigin && (devOrigin.includes('localhost') || devOrigin.includes('127.0.0.1'))) {
      localStorage.removeItem('cm_dev_origin');
      document.cookie = 'cm_dev_origin=; path=/; max-age=0; SameSite=Lax';
      const target = new URL(window.location.href);
      const devUrl = new URL(devOrigin);
      target.protocol = devUrl.protocol;
      target.hostname = devUrl.hostname;
      target.port = devUrl.port;
      window.location.replace(target.toString());
    }
  } catch (e) {
    console.warn('Localhost redirect check error:', e);
  }
}

render(<App />, document.getElementById('app'))
