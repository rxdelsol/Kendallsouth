# Round 2 — English copy + renewal links

Two things on top of what you already uploaded:

1. **Everything in English.** The "Other credentials" block, the eleven presets and
   their renewal notes, plus the two Spanish labels that were already in the form
   before ("Vencimientos de credenciales" → *Credential expirations*, "Licencia FL
   vence" → *Florida license expires*).
2. **A renewal link next to each credential.** A small `Renew ↗` beside the name in
   the PROVIDER RECORD panel, and a URL field per row in the Edit form.

No database change this time. `extra_creds` already holds JSON, so the new `url`
key rides along in the column you created.

## Upload these 6 files

Same routine as last time — one upload per folder so the paths stay right.

| Folder to upload into | File |
|---|---|
| `.../upload/main/api` | `save-doctor.js` |
| `.../upload/main/src/components` | `DoctorsTable.jsx`, `ProviderRecord.jsx` |
| `.../upload/main/src/components/styles` | `record.css` |
| `.../upload/main/src/utils` | `credStatus.js` |
| `.../upload/main/src/styles` | `index.css` |

Base URL: `https://github.com/rxdelsol/Kendallsouth`

Don't upload this README.

## Links that ship filled in

Only URLs printed on an actual renewal notice, or already named by the app's own
copy, are prefilled. A wrong renewal link is worse than no link, so the rest are
left blank for you to paste.

| Credential | Link |
|---|---|
| Florida license | flhealthsource.gov — the one printed on the DOH licenses |
| DEA registration | deadiversion.usdoj.gov |
| CAQH re-attestation | proview.caqh.org |
| Medicare revalidation | pecos.cms.hhs.gov |
| Biomedical waste permit | myfloridaehpermit.com — printed on invoice 13-BID-8710514 |
| AHCA clinic license | ahca.myflorida.com/provider/licensure.html |
| Malpractice / COI | blank — it's your carrier's portal, paste it once |

## One security note

The record renders the URL as a real link, so both the API and the front end drop
anything that isn't plain `http:` or `https:`. A `javascript:` value pasted into
that field is discarded rather than stored — otherwise it would be a scripting
hole running under the clinic's own domain.

Tested with `vite build`: 55 modules, clean.
