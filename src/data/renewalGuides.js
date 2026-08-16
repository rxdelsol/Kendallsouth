// src/data/renewalGuides.js
// Guías de credentialing / re-credentialing por aseguradora (Miami, FL).
// NOTA: portales y plazos pueden cambiar. Verifica siempre la fecha efectiva
// y los deadlines en el portal del pagador antes de actuar.

// Guía genérica (fallback) para pagadores no listados explícitamente.
const GENERIC = {
  portal: "Portal del pagador + CAQH ProView (proview.caqh.org)",
  apply: [
    "Completa y ATESTA tu perfil CAQH ProView (<120 días) y autoriza acceso a este pagador.",
    "Entra al portal del pagador y envía la solicitud de participación (Request for Participation).",
    "Adjunta: NPI (Tipo 1 y Tipo 2), licencia FL activa, DEA, malpractice (COI), W-9 del grupo, CV sin gaps.",
    "Guarda el número de referencia y haz seguimiento por escrito cada 2 semanas.",
    "Al recibir el contrato: REVÍSALO (fee schedule, terminación, fecha efectiva) antes de firmar.",
  ],
  renew: [
    "Mantén CAQH atestado cada 120 días — un CAQH vencido detiene el re-credentialing en silencio.",
    "Confirma que licencia, DEA y malpractice estén vigentes y cargados en CAQH.",
    "Verifica en el portal del pagador la fecha de re-credentialing (normalmente cada 2-3 años).",
    "Actualiza cualquier cambio de dirección / TIN / banking por escrito.",
  ],
  docs: ["CAQH atestado", "Licencia FL", "DEA", "Malpractice/COI", "W-9 del grupo", "NPI 1 y 2"],
  deadline: "Re-credentialing comercial: cada 2-3 años. CAQH: re-atestar cada 120 días.",
};

// Guías específicas. La clave es un patrón que se busca dentro del nombre (lowercase).
const GUIDES = [
  {
    match: ["medicare"],
    exclude: ["florida blue", "aetna medicare", "simply", "united", "advantage65"],
    name: "Medicare (Tradicional / Parte B)",
    portal: "PECOS — pecos.cms.hhs.gov (CMS)",
    apply: [
      "Crea/verifica identidad en I&A (nppes/pecos) y confirma NPI Tipo 1 en NPPES.",
      "En PECOS envía el 855I (individual) o 855B (grupo) + 855R (reasignación de beneficios al grupo).",
      "Completa el CMS-588 (EFT) con voided check / carta bancaria.",
      "La fecha efectiva es la posterior entre la fecha de solicitud y el inicio de servicios (retro hasta 30 días).",
    ],
    renew: [
      "REVALIDACIÓN cada 5 años — revisa tu fecha asignada en la lista de revalidación de CMS.",
      "Revalida en PECOS ANTES del deadline; no hacerlo = desactivación y hueco de facturación (CO-B7).",
      "Reporta cambios de dirección/banking/adverse actions en 30-90 días según el tipo.",
    ],
    docs: ["NPI 1 (y 2 si grupo)", "Licencia FL", "Malpractice", "CMS-588 / EFT", "IRS letter (CP-575/147C)"],
    deadline: "Revalidación obligatoria cada 5 años. Retroactividad de facturación: hasta 30 días.",
  },
  {
    match: ["medicaid"],
    exclude: ["aetna", "molina", "simply", "united", "sunshine"],
    name: "Florida Medicaid (AHCA)",
    portal: "Florida Medicaid Web Portal — flmmis.com (AHCA)",
    apply: [
      "Inscríbete en el Florida Medicaid Web Portal (flmmis.com). Ciertos tipos requieren fingerprinting/background.",
      "Vincula NPI, taxonomía y dirección de servicio correctamente (errores → rejections de matching).",
      "Tras el enrollment estatal, CONTRATA por separado con cada MCO (Sunshine, Simply, Molina, Humana, etc.).",
    ],
    renew: [
      "Florida Medicaid exige re-enrollment/revalidación periódica — revisa tu fecha en el portal.",
      "Mantén cada contrato de MCO activo por separado; cada MCO re-credencia por su cuenta.",
      "Actualiza licencia y datos antes de vencer para evitar desactivación.",
    ],
    docs: ["NPI 1 y 2", "Licencia FL", "Background/fingerprint (si aplica)", "W-9", "Taxonomía correcta"],
    deadline: "Revalidación estatal periódica + re-credentialing de cada MCO (60-120 días cada uno).",
  },
  {
    match: ["aetna"],
    name: "Aetna (Comercial / Medicare / Medicaid)",
    portal: "Availity (availity.com) + CAQH ProView",
    apply: [
      "Atesta CAQH y autoriza acceso a Aetna.",
      "En Availity envía la solicitud de participación con Aetna para la línea correcta (Comercial/Medicare/Medicaid).",
      "Para Medicaid de Aetna en FL, confirma primero el enrollment estatal de Medicaid.",
      "Guarda el case number (ej. 267104xxx) y haz seguimiento quincenal.",
    ],
    renew: [
      "Re-credentialing cada ~3 años — automático si CAQH está atestado y al día.",
      "Confirma en Availity que el status siga 'Par/In-Network' por línea de producto.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "DEA", "Malpractice", "W-9 del grupo"],
    deadline: "Re-credentialing cada ~3 años vía CAQH. CAQH cada 120 días.",
  },
  {
    match: ["florida blue", "florida blue - medicare", "florida blue - my blue", "advantage65"],
    name: "Florida Blue (BCBS FL)",
    portal: "Availity (availity.com) + CAQH ProView",
    apply: [
      "Atesta CAQH y autoriza acceso a Florida Blue / GuideWell.",
      "Solicita participación vía Availity para la línea correcta (Comercial, My Blue, Medicare Advantage65).",
      "Si la red está cerrada, pide excepción con carta de necesidad de red (idioma español es argumento válido en Miami).",
    ],
    renew: [
      "Re-credentialing cada 2-3 años vía CAQH.",
      "Para Medicare (Advantage65) confirma el status del producto por separado del comercial.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "DEA", "Malpractice", "W-9"],
    deadline: "Re-credentialing cada 2-3 años. CAQH cada 120 días.",
  },
  {
    match: ["molina"],
    name: "Molina Healthcare (Marketplace / Medicaid)",
    portal: "Availity / Portal de Molina + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Molina.",
      "Envía solicitud de participación (Marketplace y/o Medicaid) por el portal de Molina / Availity.",
      "Para Medicaid, confirma primero el enrollment estatal FL.",
      "Si cambiaste Tax ID, notifícalo explícitamente (aparece como pendiente hasta actualizarlo).",
    ],
    renew: [
      "Re-credentialing cada ~3 años vía CAQH.",
      "Mantén el Tax ID y la dirección sincronizados con el enrollment.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "Malpractice", "W-9", "Tax ID correcto"],
    deadline: "Re-credentialing cada ~3 años. CAQH cada 120 días.",
  },
  {
    match: ["united", "unitedhealthcare", "united healthcare", "optum"],
    name: "UnitedHealthcare / Optum",
    portal: "UHC Provider (uhcprovider.com) + Optum + CAQH (One Healthcare ID)",
    apply: [
      "Atesta CAQH y crea/verifica tu One Healthcare ID.",
      "Solicita participación en uhcprovider.com para la línea correcta (Comercial/Medicare/Medicaid).",
      "Para salud del comportamiento usa Optum / Provider Express.",
      "Si cambiaste Tax ID, actualízalo — es causa común de status pendiente.",
    ],
    renew: [
      "Re-credentialing cada ~3 años vía CAQH.",
      "Verifica el status por línea: HMO, Medicare y Medicaid se aprueban por separado.",
    ],
    docs: ["CAQH atestado", "One Healthcare ID", "Licencia FL", "DEA", "Malpractice", "W-9"],
    deadline: "Re-credentialing cada ~3 años. CAQH cada 120 días.",
  },
  {
    match: ["oscar"],
    name: "Oscar Health",
    portal: "Portal de proveedores de Oscar + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Oscar.",
      "Envía la solicitud de participación por el portal de Oscar.",
      "Confirma la fecha efectiva antes de agendar pacientes de Oscar.",
    ],
    renew: [
      "Muchos planes Oscar son auto-renovables — confirma la fecha de expiración del contrato.",
      "Re-credentialing vía CAQH; mantén el perfil atestado.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "DEA", "Malpractice", "W-9"],
    deadline: "Verifica expiración del contrato (algunos auto-renewal). CAQH cada 120 días.",
  },
  {
    match: ["ambetter", "sunshine"],
    name: "Ambetter / Sunshine Health (Centene)",
    portal: "Portal de Sunshine Health / Availity + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Centene/Sunshine.",
      "Solicita participación por el portal de Sunshine Health (Ambetter = Marketplace de Centene).",
      "Para Sunshine Medicaid, confirma el enrollment estatal FL primero.",
    ],
    renew: [
      "Re-credentialing cada ~3 años vía CAQH.",
      "Confirma el status del producto (Ambetter Marketplace vs Sunshine Medicaid) por separado.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "Malpractice", "W-9"],
    deadline: "Re-credentialing cada ~3 años. CAQH cada 120 días.",
  },
  {
    match: ["simply"],
    name: "Simply Healthcare (Medicare / Medicaid — Elevance)",
    portal: "Availity + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Simply/Elevance.",
      "Solicita participación por Availity (Medicare y/o Medicaid).",
      "Para Medicaid, confirma el enrollment estatal FL.",
    ],
    renew: [
      "Re-credentialing cada ~3 años vía CAQH.",
      "Revisa la expiración del contrato (algunos con fecha fija, ej. 12/31).",
    ],
    docs: ["CAQH atestado", "Licencia FL", "Malpractice", "W-9"],
    deadline: "Re-credentialing cada ~3 años. CAQH cada 120 días.",
  },
  {
    match: ["humana"],
    name: "Humana",
    portal: "Availity + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Humana.",
      "Solicita participación por Availity para la línea correcta.",
      "Guarda el número de referencia y da seguimiento quincenal.",
    ],
    renew: [
      "Re-credentialing cada ~3 años vía CAQH.",
      "Confirma el status por producto (comercial vs Medicare Advantage).",
    ],
    docs: ["CAQH atestado", "Licencia FL", "DEA", "Malpractice", "W-9"],
    deadline: "Re-credentialing cada ~3 años. CAQH cada 120 días.",
  },
  {
    match: ["multiplan", "phcs"],
    name: "Multiplan / PHCS",
    portal: "Portal de proveedores de Multiplan (multiplan.com)",
    apply: [
      "Solicita participación en el portal de Multiplan/PHCS.",
      "Multiplan es una red de acceso — revisa qué pagadores terceros la usan.",
      "Adjunta CAQH, licencia, malpractice y W-9.",
    ],
    renew: [
      "Re-credentialing vía CAQH.",
      "Revisa cláusulas de 'silent PPO' / rental network en el contrato.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "Malpractice", "W-9"],
    deadline: "Re-credentialing periódico. CAQH cada 120 días.",
  },
  {
    match: ["curative"],
    name: "Curative",
    portal: "Portal de proveedores de Curative + CAQH",
    apply: [
      "Atesta CAQH y autoriza a Curative.",
      "Contacta a Curative por su portal/soporte de proveedores para iniciar participación.",
      "Confirma la fecha efectiva antes de ver pacientes.",
    ],
    renew: [
      "Re-credentialing vía CAQH.",
      "Confirma expiración del contrato.",
    ],
    docs: ["CAQH atestado", "Licencia FL", "Malpractice", "W-9"],
    deadline: "Re-credentialing periódico. CAQH cada 120 días.",
  },
];

export function getRenewalGuide(insuranceName = "") {
  const n = (insuranceName || "").toLowerCase().trim();
  if (!n) return { name: "General", ...GENERIC };
  for (const g of GUIDES) {
    const excluded = (g.exclude || []).some((x) => n.includes(x));
    if (excluded) continue;
    if (g.match.some((m) => n.includes(m))) {
      return g;
    }
  }
  // segundo intento sin exclude por si un excluyente lo dejó fuera
  for (const g of GUIDES) {
    if (g.match.some((m) => n.includes(m))) return g;
  }
  return { name: insuranceName || "General", ...GENERIC };
}

export default GUIDES;
