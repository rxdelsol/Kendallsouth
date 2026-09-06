// src/data/payerApply.js
//
// Enlaces oficiales para SOLICITAR CONTRATO con cada aseguradora de Florida.
// Cada URL fue abierta y verificada: son páginas de alta de proveedores, no
// portadas genéricas ni páginas para afiliados. `via` dice cómo es el trámite,
// que cambia la planificación: no es lo mismo un formulario en línea que un fax.
export const PAYER_APPLY = [
  { match: ["florida blue", "bcbs", "blue cross"], label: "Florida Blue",
    url: "https://www.floridablue.com/providers", via: "Availity portal · account required first" },
  { match: ["aetna better health"], label: "Aetna Better Health FL",
    url: "https://www.aetnabetterhealth.com/florida/providers/join-network.html", via: "letter of intent by email" },
  { match: ["aetna"], label: "Aetna",
    url: "https://www.aetna.com/health-care-professionals/join-the-aetna-network.html", via: "online application" },
  { match: ["cigna"], label: "Cigna",
    url: "https://www.cigna.com/health-care-providers/credentialing", via: "credentialing request" },
  { match: ["humana"], label: "Humana",
    url: "https://provider.humana.com/join-humana-network", via: "online application" },
  { match: ["united", "uhc", "optum"], label: "UnitedHealthcare",
    url: "https://www.uhcprovider.com/en/resource-library/Join-Our-Network/Medical-Provider.html", via: "Onboard Pro" },
  { match: ["molina"], label: "Molina",
    url: "https://www.molinahealthcare.com/providers/fl/medicaid/comm/Join-Our-Network.aspx", via: "request in their portal" },
  { match: ["sunshine"], label: "Sunshine Health",
    url: "https://www.sunshinehealth.com/providers/become-a-provider/network-participation-request-form.html", via: "online form" },
  { match: ["ambetter"], label: "Ambetter",
    url: "https://www.ambetterhealth.com/en/fl/provider-resources/join-our-network/", via: "by phone · 877-687-1169" },
  { match: ["simply"], label: "Simply Healthcare",
    url: "https://provider.simplyhealthcareplans.com/florida-provider/join-our-network", via: "letter of interest" },
  { match: ["wellcare"], label: "WellCare",
    url: "https://www.wellcare.com/en/become-a-provider", via: "online form" },
  { match: ["oscar"], label: "Oscar",
    url: "https://www.hioscar.com/providers", via: "online form" },
  { match: ["avmed"], label: "AvMed",
    url: "https://www.avmed.org/en/provider", via: "provider interest form" },
  { match: ["devoted"], label: "Devoted Health",
    url: "https://www.devoted.com/providers/joinus/", via: "online form" },
  { match: ["careplus"], label: "CarePlus",
    url: "https://www.careplushealthplans.com/providers", via: "letter of intent by fax" },
  { match: ["curative"], label: "Curative",
    url: "https://curative.com/for-providers#prov-nom-form", via: "online form" },
  { match: ["community care"], label: "Community Care Plan",
    url: "https://ccpcares.org/for-providers/provider-tools/become-a-provider/", via: "letter of interest" },
  { match: ["medicaid"], label: "Florida Medicaid (AHCA)",
    url: "https://ahca.myflorida.com/provider/enroll.html", via: "Florida MMIS portal" },
  { match: ["medicare"], label: "Medicare (PECOS)",
    url: "https://pecos.cms.hhs.gov/pecos/login.do", via: "PECOS · form CMS-855" },
];

// Devuelve el enlace de alta que corresponde al nombre de una aseguradora.
// Las entradas más específicas van primero en la lista: "Aetna Better Health"
// tiene que ganarle a "Aetna", y "Florida Blue - Medicare" a "Medicare".
export function applyLinkFor(payerName){
  const n = String(payerName || "").toLowerCase().trim();
  if (!n) return null;
  return PAYER_APPLY.find((p) => p.match.some((m) => n.includes(m))) || null;
}
