Kendall South Credentialing - Final package (navy theme, Tailwind)

What it includes:
- React + Vite + Tailwind project ready for Vercel
- LocalStorage persistence for doctors and insurance assignments
- Doctors table (inline editable) with fields: name, npi, license, caqh, medicaid, medicare, dob, taxonomy
- Insurances modal: assign existing doctor to insurance with expiration and notes
- Expiration dashboard with color alerts (<=90 days warning)
- Buttons: Apply, Clear, Reload, CSV, Backup, Restore

How to run locally:
1. unzip the package
2. npm install
3. npm run dev

Deploy to Vercel:
- Push to GitHub and connect project to Vercel (auto-detects Vite)
- Make sure Vercel installs devDependencies (it does by default).

LocalStorage keys:
- doctorsList
- doctorsByInsurance
- insuranceList

