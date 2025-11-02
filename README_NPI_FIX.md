# NPI Lookup Fix (Static PWA)

This patch improves the NPI search by:
- Trying the official NPPES endpoint first
- If blocked by CORS/network, automatically falling back to a public read-only CORS proxy (AllOrigins)

## How to apply
1. Replace `src/utils/npi.js` in your PWA with the file from this patch.
2. Rebuild:
   ```bash
   npm run build
   ```
3. Serve `dist/` (Vercel/Netlify/GitHub Pages).

## Tips
- Always run via `npm run dev` or from HTTPS hosting. Opening `index.html` directly from the file system may block fetch/Service Worker.
- Ensure NPI has exactly **10 digits**.
- If the public proxy is rate-limited, retry in a few minutes or deploy your own lightweight proxy later.
