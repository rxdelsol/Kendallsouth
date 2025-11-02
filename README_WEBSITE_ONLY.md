# Provider Credential Tracker — Website Only (PWA)
Fully static site (no backend). Works offline with IndexedDB, notifications while open, NPI lookup via public API, and CSV export.

## Run locally
```bash
npm install
npm run dev
```
Open the URL (e.g. http://localhost:5173). Install as app (Edge/Chrome → ⋯ → Install).

## Deploy as website
- **Vercel / Netlify / GitHub Pages** (static hosting). Build: `npm run build`, serve `dist/`.
- No server required. Email sending is not available; use the **✉️ Email draft** button to compose a pre-filled message in your email client.

## Notes
- Browser notifications require permission and only fire while the app is open.
- NPI API (NPPES v2.1) calls from the browser; if CORS blocks in your environment, try again later or use manual entry.
