# Round 3 — hide the DEA line when there is no DEA

One file: `src/utils/credStatus.js` → upload into `.../upload/main/src/utils`

## What changes

A record with **no DEA number on file** no longer shows the "DEA registration"
line at all. Kendall South Medical Center Inc. is an organization and has no DEA,
so that row disappears from its record — which is what you asked for.

The same applies to everyone else who doesn't prescribe: Sara Zayas (PT),
Natasha Fernandez-Guzman (LMHC), Hailin Wu (AP), Yalit Raymond Kassab,
ADA and ISABEL Fernandez, Karla Santos. None of them will ever have a DEA date,
so the line was noise.

Anyone **with** a DEA number keeps the line, even if the expiry is blank —
Jimenez, Pedro Fernandez and Gadea have a number but no certificate in the
folder, and that gap should stay visible.

## Side effect worth knowing

The "Missing dates" filter and the counter behind it will drop. They were
counting the empty DEA line as a gap for people who don't need one. Fewer
providers will now show as missing data — that's the count getting more honest,
not data disappearing.

## If you'd rather have it the other way

Say so and I'll swap it for an explicit "not applicable" checkbox per credential
instead of inferring it from the DEA number. It's more UI but it's explicit.

Tested with `vite build`: clean.
