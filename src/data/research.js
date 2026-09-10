// src/data/research.js
// El expediente de sitio de investigación clínica de Kendall South.
//
// Todo lo que hay acá salió de un documento de la carpeta RESEARCH o del perfil
// de sitio que la práctica mantiene con los sponsors. Cada fila del equipo lleva
// de dónde viene su fecha, porque no es lo mismo una fecha firmada en un
// certificado que un año pegado al nombre de un archivo: el nombre del archivo
// no es evidencia, y el que arma el paquete regulatorio necesita saber cuál es
// cuál antes de mandarlo.
//
// Las fechas van en YYYY-MM-DD para que statusOf() las pinte con el mismo
// semáforo que las credenciales del resto de la app.

export const SITE = {
  name: "Kendall South Medical Center, Inc.",
  address: "14740 Southwest 26th Street, Suite 107, Miami, FL 33185, United States",
  type: "Medical Practice",
  sitePin: "KEN147",
  npi: "1043242456",
  taxId: "65-1067532",
  phone: "305.388.1118",
  fax: "305.223.3242",
};

// Fases en las que el sitio quiere que lo avisen.
export const PHASES = ["Phase I", "Phase II", "Phase III", "Phase IV"];

// Tiempos de arranque que el sitio declara a los sponsors.
export const STARTUP = [
  { n: "6 weeks", u: "on average to activate", d: "from the time of receiving key documents" },
  { n: "1 week", u: "on average for Central IRB", d: "approval" },
  { n: "Parallel", u: "regulatory submission", d: "documents go to the IRB / ethics committee while contract and budget are still being negotiated" },
];

// Áreas de interés declaradas, por área terapéutica.
export const AREAS = [
  { area: "Infectious Diseases / Vaccinology", terms: ["Papillomavirus Infections","Poxviridae Infections","Pneumonia","Hepatitis","DNA Virus Infections","RNA Virus Infections","Virus Diseases","Rheumatic Fever","Herpesviridae Infections","Herpes Zoster Oticus","Respiratory Tract Infections","Zika Virus Infection","Urinary Tract Infections","Herpes Labialis","Norovirus","Epstein-Barr Virus","Sepsis","Yellow Fever","Acute Rhinitis","Tuberculosis","Central Nervous System","Herpes Simplex","Severe Acute Respiratory Syndrome (SARS)","HIV Infections","COVID-19","Arbovirus Infections","Bacterial Infections","Bone Diseases, Infectious"] },
  { area: "Allergy / Immunology", terms: ["Urticaria","Hepatitis","Herpes Zoster Infections","Lyme Disease","HIV Infections","Psoriatic Arthritis","Herpes Simplex Infections","Rhinitis, Allergic","Lupus Erythematosus, Systemic","Arthritis, Rheumatoid","Amyloidosis","Angioedema"] },
  { area: "Dermatology / Connective Tissue Diseases", terms: ["Psoriasis","Rosacea","Herpes Simplex","Fungal Infections","Urticaria","Acneiform Eruptions","Epidermolysis Bullosa","Pruritus","Wounds","Skin Abnormalities","Hidradenitis Suppurativa","Prurigo Nodularis","Hypopigmentation","Eczema","Dermatitis, Allergic Contact","Warts","Lupus Erythematosus, Systemic","Skin Diseases, Infectious","Hypotrichosis","Sarcoidosis","Diabetic Foot","Plaque Psoriasis"] },
  { area: "Pulmonology / Respiratory Medicine", terms: ["Asthma","Pulmonary Disease, Chronic Obstructive","Pulmonary Arterial Hypertension"] },
  { area: "Psychiatry / Psychology", terms: ["Depression","Panic Disorders","Post Traumatic Stress Disorder","Binge Eating Disorder","Manic Disorders","Anxiety Disorders","Anorexia","Psychosis","Anger","Suicide","Dementia","Schizophrenia and Schizoaffective Disorders","Bipolar Disorder","Stress","Bulimia","Addiction","Weight Loss","Substance Abuse","Obsessive Compulsive Disorder"] },
  { area: "Metabolism and Endocrinology", terms: ["Diabetic Ketoacidosis","Lipid Metabolism Disorders","Diabetes Mellitus","Bone Diseases, Metabolic","Obesity","Hypoglycemia"] },
  { area: "Neurology", terms: ["Epilepsy","Alzheimer Disease"] },
  { area: "Rheumatology / Musculoskeletal Diseases", terms: ["Arthritis, Rheumatoid","Arthritis, Psoriatic","Osteoarthritis","Fibromyalgia","Carpal Tunnel Syndrome","Polymyalgia Rheumatica","Osteoporosis"] },
  { area: "Cardiology", terms: ["Hypertension"] },
];

// Capacidades del sitio, tal como aparecen en el perfil que ven los sponsors.
export const CAPABILITIES = [
  { group: "Equipment", items: ["12-Lead ECG","-20 °C freezer","2 °C to 8 °C refrigerator","6-minute walk test space","-70 °C freezer","-70 °C freezer for biospecimens","-70 °C to -80 °C freezer","Ambient centrifuge","Backup IP storage","Blood pressure cuff and calibration","Blood pressure measuring device","Centrifuge","Centrifuge with spinning force control","Computer and Wi-Fi connection","Continuous temperature monitoring","Continuous temp monitoring system","Corridor for six-minute walk test","Dedicated monitoring space","DILI testing","Dry ice","DXA scan facility","Height / weight scale","High-resolution CT scan","IMP storage (2–25 °C)","Incubator","Infusion supplies","Intensive care unit","Locked cabinet","IP storage with continuous temperature control","Local laboratory","Pharmacy","Medications for anaphylaxis","Oral or tympanic thermometer","Pulse measurement device","Quantiferon TB test","Printer","Refrigerator","Refrigerator for IP","Refrigerated centrifuge","Sinus CT scan (EFC17354 only)","Spirometry","Secure access temperature-controlled storage","Syringes for subcutaneous injection","Vortex mixer","Storage for study-related supplies","X-Ray","Willing to partner with hospital"] },
  { group: "Assessments and procedures", items: ["Ability to collect, prepare and ship samples","Ability to collect, prepare, store samples","Angioedema Activity Score (AAS)","Assessing scalp hair","Biologics","Blinded management of laboratory results","BODE score, including 6-minute walk","CGI-S","Chronic Airways Assessment","Collect nasal lining fluid and nasal samples","COPD Assessment Test (CAT)","C-SSRS","CT scan interpretation","Dermatology Life Quality Index","eCOA","eDiaries","ePRO","EQ-5D-5L","Experience running short-duration studies","FeNO","Forced oscillatory technique","GOLD strategy","HAM-A","Handling patients with moderate disease","Managing biologics in a clinical setting","Measuring eyebrow hair loss","Measuring eyelash hair loss","Measuring nail appearance","Monoclonal antibody","Nasal brushing for transcriptomics","Panic Disorder Severity Scale (PDSS)","Patient-Reported Outcome Assessments","Physician's Withdrawal Checklist (PWC)","PK samples","Pulmonary function tests","Quantiferon TB test","SALT score","Skin biopsy","Skin photography","Spirometry","Subcutaneous drug administration","Training participants on device use","Treating COPD","Tuberculosis (TB) testing","Urticaria Control Test (UCT)","Urticaria patient assessment","Weekly Urticaria Activity Score","X-ray"] },
  { group: "Other", items: ["Ability to enroll Black / African American participants","Administer IV infusions","Experience treating patients with the condition under study","Experience with T1D management","Considered for screening partnerships","No other competing ongoing T1D studies","Participating in T1D screening programs","Previous experience conducting clinical trials","Screen first patient within 4 weeks"] },
];

// Composición de la población del sitio, en porcentaje.
export const DIVERSITY = {
  ethnicity: [
    { label: "Hispanic or Latino", pct: 92 },
    { label: "Not Hispanic or Latino", pct: 8 },
  ],
  race: [
    { label: "White", pct: 78 },
    { label: "Asian", pct: 10 },
    { label: "Two or more races", pct: 6 },
    { label: "Black or African American", pct: 4 },
    { label: "Some other race", pct: 2 },
    { label: "American Indian or Alaska Native", pct: 0 },
    { label: "Native Hawaiian or Other Pacific Islander", pct: 0 },
  ],
};

// Equipo del sitio.
//   active  = está hoy en el delegation log del sitio (dicho por la manager,
//             10-sep-2026). Los inactivos NO se borran: sus documentos siguen en
//             la carpeta y un monitor puede pedirlos por un estudio ya cerrado.
//             Lo que cambia es que dejan de contar en el semáforo — perseguir el
//             GCP de alguien que ya no trabaja acá es ruido, y el ruido es lo que
//             hace que se ignore el aviso que sí importa.
//   cv      = fecha que la CV lleva firmada; cvSrc dice de dónde salió
//   gcp     = vencimiento del certificado de GCP (NIDA CTN y TransCelerate duran 3 años)
//   gcpSrc  = el certificado concreto, para poder volver a él
// Una fila sin fecha no es una fila en orden: es una fila cuyo documento todavía
// no está en la carpeta, y el semáforo la marca "No date" en vez de callarla.
export const TEAM = [
  { active: true, name: "Mario A. Jimenez, MD", role: "Medical Director · Principal Investigator", license: "ME 114414",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Dr Mario JImenez.pdf",
    gcp: "2027-10-02", gcpSrc: "NIDA CTN, course 02 Oct 2024 — GCP/GCP Jimenez.pdf",
    extra: "GCP for Investigational Site Staff 4.0 — 23 Oct 2024" },
  { active: true, name: "Enrique Vazquez Escarpanter, MD", role: "Principal Investigator", license: "ME 136196",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/DR Enrique Vazquez.pdf",
    gcp: "2028-07-01", gcpSrc: "NIDA CTN, course 01 Jul 2025 — GCP/GPC 2025-2028 Evazquez.pdf" },
  { active: true, name: "Rafael Chiong, MD", role: "Principal Investigator", license: "",
    cv: null, cvSrc: "CVs Sign/Chiong 2025.pdf — year taken from the file name; no signature date read",
    gcp: "2027-10-02", gcpSrc: "NIDA CTN, course 02 Oct 2024 — GCP/Chiong GCP.pdf" },
  { active: true, name: "Armand J. Bermudez, MD", role: "Investigator", license: "",
    cv: null, cvSrc: "CVs Sign/CV Bermudez 2026.pdf — year taken from the file name",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
  { active: true, name: "Maria D. Galindo Covas, APRN", role: "Sub-Investigator", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Mario Galindo.pdf",
    gcp: "2027-04-25", gcpSrc: "NIDA CTN, course 25 Apr 2024 — GCP/Galindo GCP.pdf" },
  { active: true, name: "Jose L. Lopez Gutierrez, MD", role: "Investigator", license: "",
    cv: null, cvSrc: "Updated CVs 2025/Jose Luis Lopez Gutierrez CV 2025.docx — no signature read",
    gcp: "2027-08-29", gcpSrc: "NIDA CTN, course 29 Aug 2024 — GCP/Jose Luis Lopez GCP.pdf" },
  { active: true, name: "Maria E. Gadea, ARNP", role: "Sub-Investigator", license: "APRN 9253683",
    cv: null, cvSrc: "Updated CVs 2025/Maria E Gadea ARNP CV 2025.docx — no signature read",
    gcp: "2024-02-18", gcpSrc: "NIDA CTN, course 18 Feb 2021 — GCP/MGadea GCP 2024.pdf" },
  { active: false, name: "Giraldo Olivera, ARNP", role: "Sub-Investigator", license: "",
    cv: null, cvSrc: "no CV in the folder",
    gcp: "2023-10-22", gcpSrc: "NIDA CTN, course 22 Oct 2020 — GCP/Olivera GCP 2023.pdf" },
  { active: true, name: "Gabriela", role: "Clinical Research Coordinator", license: "",
    cv: null, cvSrc: "no CV in the folder — full name still needed to file it",
    gcp: null, gcpSrc: "no GCP certificate in the folder",
    warn: "Active coordinator with nothing on file. A coordinator on the delegation log without a signed CV and a GCP certificate is the first finding of any monitoring visit." },
  { active: true, name: "Roxana Pena, FMD, CRC", role: "Assistant Manager · Clinical Research Coordinator", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Roxana Pena.pdf",
    gcp: "2027-11-25", gcpSrc: "GCP for Investigational Site Staff 4.0, 25 Nov 2024 — GCP/PENA_ROXANA_...pdf" },
  { active: true, name: "Jesenia Portieles, CCRP", role: "Study Coordinator", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Jesenia Portieles.pdf",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
  { active: true, name: "Mayelin Guerra Miranda, RN, MLA, PHT", role: "Laboratory Tech · Clinical Research Coordinator", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Mayelin Guerra.pdf",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
  { active: false, name: "Chavely Betancourt-De Leon", role: "Backup Coordinator", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/2025 — Certificates/Chavely Betancourt.pdf",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
  { active: false, name: "Denise Moreno", role: "Site staff", license: "",
    cv: "2025-01-22", cvSrc: "Signed CV dated 22/JAN/25 — Certificates/Denise Moreno.pdf",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
  { active: false, name: "Yanisel Barrios", role: "Site staff", license: "",
    cv: null, cvSrc: "no signed CV in the folder",
    gcp: "2028-06-26", gcpSrc: "NIDA CTN, course 26 Jun 2025 — Certificates/Yanisel Barrios.pdf" },
  { active: false, name: "Jose Hernandez Guevara", role: "Site staff", license: "",
    cv: null, cvSrc: "no CV in the folder",
    gcp: "2029-01-08", gcpSrc: "NIDA CTN, course 08 Jan 2026 — GCP/Jose luis 2029.pdf",
    warn: "The file is named \u0022Jose luis 2029\u0022 but the certificate reads Jose Hernandez Guevara, who is not Jose L. Lopez Gutierrez. Rename it before someone sends the wrong certificate in a regulatory packet." },
  { active: false, name: "Suchil Jimenez, CCRC", role: "Lead Coordinator", license: "",
    cv: null, cvSrc: "listed in the QV experience table; no CV in the folder",
    gcp: null, gcpSrc: "no GCP certificate in the folder" },
];

// Documentos a nivel de sitio.
export const SITE_DOCS = [
  { label: "CLIA certificate of waiver", id: "10D2005373", date: "2028-03-25",
    note: "Effective 03/26/2026. Laboratory director: Mario A. Jimenez, MD. The previous cycle (03/26/2024 – 03/25/2026) is filed as CLIA 2024-2026.pdf.",
    url: "https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments" },
  { label: "FDA inspection report", id: "2018", date: null,
    note: "FDA AUDIT 2018 Report.pdf is in the folder. Inspection history — it does not expire.", url: "" },
  { label: "CDA — Peachtree BioResearch", id: "Jimenez", date: null,
    note: "Signed, with a signature certificate. CDA_Jimenez_Peachtree Bioresearch.pdf.", url: "" },
  { label: "CDA — ICON", id: "Jimenez", date: null, note: "CDA-ICON JIMENEZ.pdf.", url: "" },
  { label: "CDA — Sponsor, primary hypothyroidism study", id: "", date: null,
    note: "Sponsor CDA (PRIMARY HYPOTYROIDISM STUDY).docx.", url: "" },
  { label: "eClinPro — recurring charges authorization", id: "02JUL2024", date: null,
    note: "Recurring-charges authorization on file.", url: "" },
  { label: "Site Study Tracker", id: "KEN147", date: null,
    note: "Snapshot dated 2023-10-05. It is what the sponsor left behind, not a live status.", url: "" },
];

// Estudios abiertos hoy en el sitio (dicho por la manager, 10-sep-2026).
// Studies.docx llega hasta 2023 y no trae ninguno de estos, así que van aparte.
//
// Sponsor, fase y NCT salieron del portal del sponsor o de ClinicalTrials.gov,
// que es fuente de nivel 2: sirve para saber de qué estudio estamos hablando,
// no para el binder. Dos protocolos no aparecen en ningún registro público con
// ese número — quedan con el campo vacío y dicen por qué, en vez de rellenarse
// con algo parecido. Un número de protocolo inventado en un tracker se copia
// después a un formulario de sponsor.
//
// pi / subs / version / versionDate salen del binder regulatorio del sitio, que
// no está en la carpeta RESEARCH. Van vacíos y la pantalla lo dice en voz alta:
// el investigador delegado y la versión de protocolo vigente son lo primero que
// coteja un monitor, así que un dato de relleno acá es peor que un hueco.
export const ACTIVE_STUDIES = [
  {
    protocol: "C5091017", nct: "NCT06679140", sponsor: "Pfizer", phase: "Phase 3",
    title: "Ibuzatrelvir in non-hospitalised adults and adolescents with COVID-19 at risk of severe disease",
    note: "EU CT 2024-517727-39-00. The site has PPD training on file for Enrique Vazquez dated 12-Dec-2024 against this protocol.",
    pi: "", subs: [], version: "", versionDate: null,
    src: "ClinicalTrials.gov NCT06679140",
  },
  {
    protocol: "C5091018", nct: "NCT07013474", sponsor: "Pfizer", phase: "Phase 3",
    title: "ASPIRE-IC — ibuzatrelvir, alone and with remdesivir, in severely immunocompromised adults with COVID-19",
    note: "",
    pi: "", subs: [], version: "", versionDate: null,
    src: "pfizerclinicaltrials.com — ASPIRE-IC",
  },
  {
    protocol: "D6934C00001", nct: "NCT06307665", sponsor: "AstraZeneca", phase: "Phase 3b",
    title: "PT027 (budesonide/albuterol MDI) vs PT007 as needed, in participants 12 to <18 years with asthma",
    note: "",
    pi: "", subs: [], version: "", versionDate: null,
    src: "astrazenecaclinicaltrials.com — D6934C00001",
  },
  {
    protocol: "PRECIDENTD", nct: "NCT05390892", sponsor: "PCORI-funded pragmatic trial", phase: "Phase 4",
    title: "Prevention of Cardiovascular and Diabetic Kidney Disease in Type 2 Diabetes — SGLT2 inhibitor and GLP-1 receptor agonist, dual vs monotherapy",
    note: "",
    pi: "", subs: [], version: "", versionDate: null,
    src: "Froedtert / MCW trial listing — NCT05390892",
  },
  {
    protocol: "CV44536", nct: "NCT06094010", sponsor: "F. Hoffmann-La Roche", phase: "Phase 3",
    title: "Surveillance of susceptibility to baloxavir marboxil in paediatric participants with influenza, and transmission of influenza to household contacts",
    note: "EU CT 2023-504672-22-00. Enrolling children plus their household contacts, so the visit window is the household's, not just the patient's.",
    pi: "", subs: [], version: "", versionDate: null,
    src: "ClinicalTrials.gov NCT06094010",
  },
  {
    protocol: "ERA 3167", nct: "", sponsor: "", phase: "",
    title: "",
    note: "No public registry entry under this number. Sponsor, phase and NCT still to be filled in from the site file.",
    pi: "", subs: [], version: "", versionDate: null,
    src: "",
  },
  {
    protocol: "20230222", nct: "", sponsor: "", phase: "",
    title: "",
    note: "No public registry entry under this number. Sponsor, phase and NCT still to be filled in from the site file.",
    pi: "", subs: [], version: "", versionDate: null,
    src: "",
  },
];

// Historial de estudios del sitio, tal como está en Studies.docx.
export const STUDIES = [
  {
    "protocol": "M102-21123",
    "nct": "NCT01399008",
    "start": "06/2011",
    "end": "02/2012",
    "sponsor": "Gilead Sciences",
    "phase": "Phase 2",
    "title": "Safety/Efficacy Study to Evaluate MBX-102 in Combination with Allopurinol in Gout Patients"
  },
  {
    "protocol": "D6000C00002",
    "nct": "NCT02603952",
    "start": "12/07/2015",
    "end": "12/09/2016",
    "sponsor": "MedImmune LLC",
    "phase": "Phase 2a",
    "title": "A Phase 2a to Evaluate the Safety of MEDI8852 in Adults with Uncomplicated Influenza"
  },
  {
    "protocol": "MK0653C-162",
    "nct": "NCT01154036",
    "start": "07/2010",
    "end": "10/2012",
    "sponsor": "Organon and Co.",
    "phase": "Phase 3",
    "title": "MK0653C in High Cardiovascular Risk Patients with High Cholesterol (Switch Study)"
  },
  {
    "protocol": "MK-3415A-001",
    "nct": "NCT01241552",
    "start": "10/10/2011",
    "end": "12/09/2014",
    "sponsor": "Merck Sharp & Dohme LLC",
    "phase": "Phase 3",
    "title": "A Study of MK-3415, MK-6072, and MK-3415A in Participants Receiving Antibiotic Therapy for Clostridium Difficile Infection"
  },
  {
    "protocol": "MK-8835-005",
    "nct": "NCT02099110",
    "start": "04/22/2014",
    "end": "05/26/2016",
    "sponsor": "Merck Sharp & Dohme LLC",
    "phase": "Phase 3",
    "title": "Ertugliflozin and Sitagliptin Co-Administration Factorial Study"
  },
  {
    "protocol": "MK-8835-017",
    "nct": "NCT02226003",
    "start": "09/23/2014",
    "end": "02/23/2016",
    "sponsor": "Merck Sharp & Dohme LLC",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Ertugliflozin (MK-8835/PF-04971729) With Sitagliptin in the Treatment of Participants with Type 2 Diabetes Mellitus (T2DM) With Inadequate Glycemic Control on Diet and Exercise"
  },
  {
    "protocol": "MT-2990-A01",
    "nct": "NCT03840993",
    "start": "01/15/2019",
    "end": "10/05/2021",
    "sponsor": "Mitsubishi Tanabe Pharma America Inc.",
    "phase": "Phase 2",
    "title": "Safety and Efficacy Study of MT-2990 in Women with Endometriosis"
  },
  {
    "protocol": "MT-8554-A01",
    "nct": "NCT03291067",
    "start": "10/09/2017",
    "end": "11/09/2018",
    "sponsor": "Mitsubishi Tanabe Pharma America Inc.",
    "phase": "Phase 2",
    "title": "MT-8554 For Reduction of Vasomotor Symptoms in Postmenopausal Women"
  },
  {
    "protocol": "MT-8554-A02",
    "nct": "NCT03541200",
    "start": "04/18/2018",
    "end": "11/15/2019",
    "sponsor": "Mitsubishi Tanabe Pharma America Inc.",
    "phase": "Phase 2",
    "title": "Long-term Safety and Efficacy Study of MT-8554 in Postmenopausal Women with Vasomotor Symptoms"
  },
  {
    "protocol": "MV40618",
    "nct": "NCT03969212",
    "start": "10/10/2019",
    "end": "05/10/2024",
    "sponsor": "Hoffman-La Roche",
    "phase": "Phase 3",
    "title": "Study to Assess the Efficacy of Baloxavir Marboxil Versus Placebo to Reduce Onward Transmission of Influenza A or B in Households"
  },
  {
    "protocol": "NAC-MD-01",
    "nct": "NCT01508026",
    "start": "01/2012",
    "end": "05/2013",
    "sponsor": "Forest Laboratories",
    "phase": "Phase 3",
    "title": "Study of the Efficacy and Safety of the Combination of Two FDA Approved Oral Medications, Nebivolol and Valsartan for Treatment of Stage 1 or 2 Hypertension"
  },
  {
    "protocol": "NV20234",
    "nct": "NCT00545532",
    "start": "01/2010",
    "end": "05/02/2017",
    "sponsor": "Hoffman-La Roche",
    "phase": "Phase 3",
    "title": "A Study of Oseltamivir (Tamiflu) for Treatment of Influenza in Immunocompromised Participants"
  },
  {
    "protocol": "OBD1033",
    "nct": "NCT01298219",
    "start": "12/2010",
    "end": "11/2011",
    "sponsor": "Sucampo Pharma Americas, LLC.",
    "phase": "Phase 3",
    "title": "Opioid-Induced Bowel Dysfunction (OBD) Pivotal Assessment of Lubiprostone"
  },
  {
    "protocol": "ONU3704",
    "nct": "NCT01427270",
    "start": "08/2011",
    "end": "10/2014",
    "sponsor": "Purdue Pharma LP",
    "phase": "Phase 3",
    "title": "Analgesic Efficacy and Management of Opioid-Induced Constipation (OIC) For Uncontrolled Moderate – Severe Low Back Pain"
  },
  {
    "protocol": "ONU3705",
    "nct": "NCT01427283",
    "start": "08/2011",
    "end": "10/2014",
    "sponsor": "Purdue Pharma LP",
    "phase": "Phase 3",
    "title": "A Study of Oxycodone/Naloxone Controlled-Release Tablets (OXN) to Assess Analgesic Efficacy and Management of Opioid-Induced Constipation (OIC) in Opioid-Experienced Subjects with Moderate to Severe Chronic Low Back Pain"
  },
  {
    "protocol": "P261-401",
    "nct": "NCT01390220",
    "start": "06/2011",
    "end": "03/2017",
    "sponsor": "UCB Biopharma S.P.R.L.",
    "phase": "Phase 3",
    "title": "Study to Evaluate the Efficacy of USL261 (Intranasal Midazolam) in Patients with Seizure Clusters"
  },
  {
    "protocol": "P06241",
    "nct": "NCT01471340",
    "start": "01/09/2012",
    "end": "11/30/2016",
    "sponsor": "Organon and Co",
    "phase": "Phase 4",
    "title": "A Serious Asthma Outcome Study with Mometasone Furoate/Formoterol Versus Mometasone Furoate in Asthmatics 12 Years and Over"
  },
  {
    "protocol": "PRG-NY-13-002",
    "nct": "NCT01913158",
    "start": "10/2013",
    "end": "03/2014",
    "sponsor": "G & W Laboratories Inc.",
    "phase": "Phase 2",
    "title": "Safety and Efficacy Study of Anucort HC TM 25mg Rectal Suppositories to Treat Symptomatic Internal Hemorrhoids"
  },
  {
    "protocol": "QGC001-3QG2",
    "nct": "NCT04857840",
    "start": "08/05/2021",
    "end": "01/09/2023",
    "sponsor": "Quantum Genomics SA",
    "phase": "Phase 3",
    "title": "Randomized Study of Extended Treatment with Firibastat in Treatment-Resistant Hypertension"
  },
  {
    "protocol": "RH02448",
    "nct": "NCT02311881",
    "start": "01/2015",
    "end": "02/2016",
    "sponsor": "GlaxoSmithKline",
    "phase": "Phase 3",
    "title": "A 12-Week Efficacy Study of Paracetamol 1000mg Sustained-release Tablets in Patients with Osteoarthritis"
  },
  {
    "protocol": "ROF-MD-07",
    "nct": "NCT01443845",
    "start": "09/30/2011",
    "end": "01/31/2016",
    "sponsor": "AstraZeneca",
    "phase": "Phase 4",
    "title": "Roflumilast in Chronic Obstructive Pulmonary Disease (COPD) Patients Treated with Fixed Dose Combinations of Long-acting β2-agonist (LABA) and Inhaled Corticosteroid (ICS)"
  },
  {
    "protocol": "SP0902",
    "nct": "NCT00520741",
    "start": "08/2007",
    "end": "12/2012",
    "sponsor": "UCB Biosciences, Inc.",
    "phase": "Phase 3",
    "title": "Trial to Demonstrate the Efficacy and Safety of Conversion to Lacosamide Monotherapy for Partial-Onset Seizures"
  },
  {
    "protocol": "SP0904",
    "nct": "NCT00530855",
    "start": "02/2008",
    "end": "12/2014",
    "sponsor": "UCB Pharma",
    "phase": "Phase 3",
    "title": "Trial to Assess Long-term Lacosamide (LCM) Monotherapy Use and Safety of LCM Monotherapy and Adjunctive Therapy for Partial-onset Seizures"
  },
  {
    "protocol": "SP304203-00",
    "nct": "NCT01982240",
    "start": "11/2013",
    "end": "06/2015",
    "sponsor": "Bausch Health Americas, Inc.",
    "phase": "Phase 3",
    "title": "12-Week Study of Plecanatide for CIC"
  },
  {
    "protocol": "CSPP100E2337",
    "nct": "NCT00549757",
    "start": "10/2007",
    "end": "02/2013",
    "sponsor": "Novartis Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Aliskiren Trial in Type 2 Diabetes Using Cardiovascular and Renal Disease Endpoints"
  },
  {
    "protocol": "CSPV100AUS02",
    "nct": "NCT00927394",
    "start": "05/2009",
    "end": "10/2011",
    "sponsor": "Novartis",
    "phase": "Phase 4",
    "title": "Aliskiren and Valsartan vs Valsartan Alone in Patients with Stage II Systolic Hypertension and Type II Diabetes Mellitus"
  },
  {
    "protocol": "CQAB149B2223",
    "nct": "NCT01156844",
    "start": "03/2010",
    "end": "07/2010",
    "sponsor": "Novartis Pharmaceuticals",
    "phase": "Phase 2",
    "title": "Efficacy, Safety and Pharmacokinetics of Different Regimens of Indacaterol"
  },
  {
    "protocol": "TA-8995-302",
    "nct": "NCT05142722",
    "start": "12/15/2021",
    "end": "09/26/2024",
    "sponsor": "NewAmsterdam Pharma",
    "phase": "Phase 3",
    "title": "Randomized Study to Evaluate the Effects of Obicetrapib on Top of Maximum Tolerated Lipid-Modifying Therapies"
  },
  {
    "protocol": "TAK-875_202",
    "nct": "NCT01414920",
    "start": "08/2011",
    "end": "08/2012",
    "sponsor": "Takeda",
    "phase": "Phase 2",
    "title": "Efficacy and Safety of TAK-875 in Combination with Sitagliptin in Participants with Type 2 Diabetes Mellitus"
  },
  {
    "protocol": "TAK-491_304",
    "nct": "NCT01496430",
    "start": "01/2012",
    "end": "05/2013",
    "sponsor": "Takeda",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Azilsartan Medoxomil Used in Combination with Metformin in Participants with Hypertension and Diabetes"
  },
  {
    "protocol": "TMX-67_201",
    "nct": "NCT01077284",
    "start": "02/2010",
    "end": "11/2011",
    "sponsor": "Takeda",
    "phase": "Phase 2",
    "title": "Febuxostat Versus Allopurinol or Placebo in Patients with Hyperuricosuria and Calcium Oxalate Stones"
  },
  {
    "protocol": "TMX-67_301",
    "nct": "NCT01101035",
    "start": "04/23/2010",
    "end": "07/18/2017",
    "sponsor": "Takeda",
    "phase": "Phase 3",
    "title": "Cardiovascular Safety of Febuxostat and Allopurinol in Participants with Gout and Cardiovascular Comorbidities"
  },
  {
    "protocol": "U-FS-MU-AS3120",
    "nct": "NCT03394989",
    "start": "10/17/2018",
    "end": "03/31/2020",
    "sponsor": "Cipla Ltd.",
    "phase": "Phase 3",
    "title": "BE Study of Fluticasone Propionate/Salmeterol Inhalation Powder in Asthma Patients"
  },
  {
    "protocol": "V160-002",
    "nct": "NCT03486834",
    "start": "04/30/2018",
    "end": "06/30/2021",
    "sponsor": "Merck Sharp & Dohme LLC",
    "phase": "Phase 2",
    "title": "V160 2-Dose and 3-Dose Regimens in Healthy Cytomegalovirus (CMV) Seronegative Females"
  },
  {
    "protocol": "V212-001",
    "nct": "NCT01229267",
    "start": "11/30/2010",
    "end": "12/23/2015",
    "sponsor": "Merck Sharp & Dohme LLC",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Safety and Efficacy of Inactivated Varicella-Zoster Vaccine (VZV) as a Preventative Treatment for Herpes Zoster (HZ) and HZ-related Complications in Participants Undergoing Hematopoietic Cell Transplants (HCTs)"
  },
  {
    "protocol": "VEN 309-Hem-SE3-001",
    "nct": "NCT01355874",
    "start": "07/2011",
    "end": "06/2012",
    "sponsor": "Ventrus Biosciences, Inc.",
    "phase": "Phase 3",
    "title": "Efficacy and Safety Study to Treat Subjects with Symptomatic Internal Hemorrhoids"
  },
  {
    "protocol": "VIS410-202",
    "nct": "NCT02989194",
    "start": "01/06/2017",
    "end": "10/27/2017",
    "sponsor": "Visterra, Inc.",
    "phase": "Phase 2",
    "title": "Study of an Investigational Monoclonal Antibody, VIS410, in Subjects with Uncomplicated Influenza A"
  },
  {
    "protocol": "VP-VEC-162-3201",
    "nct": "NCT01163032",
    "start": "08/2010",
    "end": "11/2012",
    "sponsor": "Vanda Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Tasimelteon Compared with Placebo in Totally Blind Subjects with Non-24-Hour Sleep-Wake Disorder"
  },
  {
    "protocol": "VP-VEC-162-3204",
    "nct": "NCT01429116",
    "start": "10/2011",
    "end": "01/2015",
    "sponsor": "Vanda Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Tasimelteon for the Treatment of Non-24-Hour Sleep-Wake Disorder (N24HSWD) in Blind Individuals with No Light Perception"
  },
  {
    "protocol": "VR506/2/002",
    "nct": "NCT01472757",
    "start": "10/2011",
    "end": "05/2013",
    "sponsor": "Vectura Limited",
    "phase": "Phase 3",
    "title": "Clinical Study to Evaluate the Efficacy of VR506 Using a New Inhaler for the Treatment of Asthma"
  },
  {
    "protocol": "VR506/2/004",
    "nct": "NCT01720069",
    "start": "10/2012",
    "end": "10/2013",
    "sponsor": "Vectura Limited",
    "phase": "Phase 3",
    "title": "Clinical Study to Evaluate the Efficacy and Safety of VR506 Using a New Inhaler for the Treatment of Asthma"
  },
  {
    "protocol": "WEL-305",
    "nct": "NCT00789737",
    "start": "01/2009",
    "end": "12/2011",
    "sponsor": "Daiichi Sankyo",
    "phase": "Phase 3",
    "title": "Welchol as Monotherapy for Type 2 Diabetes Mellitus"
  },
  {
    "protocol": "BCX1812-301",
    "nct": "NCT00958776",
    "start": "11/2009",
    "end": "10/2013",
    "sponsor": "BioCryst Pharmaceuticals",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Efficacy and Safety of IV Peramivir in Addition to Standard of Care Compared to Standard of Care Alone in Adults and Adolescents Who Are Hospitalized Due to Influenza"
  },
  {
    "protocol": "BCX1812-306",
    "nct": "NCT02635724",
    "start": "12/2015",
    "end": "09/2018",
    "sponsor": "BioCryst Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Safety, PK and Effectiveness of IV Peramivir in Elderly and Higher Risk Subjects with Uncomplicated Influenza"
  },
  {
    "protocol": "1218.22",
    "nct": "NCT01897532",
    "start": "07/10/2013",
    "end": "01/18/2018",
    "sponsor": "Boehringer Ingelheim",
    "phase": "Phase 4",
    "title": "Cardiovascular and Renal Microvascular Outcome Study with Linagliptin in Patients with Type 2 Diabetes Mellitus"
  },
  {
    "protocol": "1218.74",
    "nct": "NCT01243424",
    "start": "11/11/2010",
    "end": "08/21/2018",
    "sponsor": "Boehringer Ingelheim",
    "phase": "Phase 3",
    "title": "Cardiovascular Outcome Study of Linagliptin Versus Glimepiride in Patients with Type 2 Diabetes"
  },
  {
    "protocol": "1218.75",
    "nct": "NCT01194830",
    "start": "09/2010",
    "end": "10/2011",
    "sponsor": "Boehringer Ingelheim",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Linagliptin (BI 1356) in Black/African Americans with Type 2 Diabetes with a MTT Sub-study"
  },
  {
    "protocol": "28431754DIA3010",
    "nct": "NCT01106651",
    "start": "06/2010",
    "end": "05/2013",
    "sponsor": "Janssen Research & Development, LLC",
    "phase": "Phase 3",
    "title": "A Safety and Efficacy Study of Canagliflozin in Older Patients (55 to 80 Years of Age with Type 2 Diabetes Mellitus"
  },
  {
    "protocol": "1517I0231",
    "nct": "NCT02638337",
    "start": "01/26/2016",
    "end": "07/05/2017",
    "sponsor": "Shionogi",
    "phase": "Phase 3",
    "title": "Study to Evaluate Ospemifene in Patients with Moderate to Severe Vaginal Dryness Due to Menopause"
  },
  {
    "protocol": "1602T0832",
    "nct": "NCT02949011",
    "start": "01/11/2017",
    "end": "04/20/2018",
    "sponsor": "Shionogi",
    "phase": "Phase 3",
    "title": "Study of S-033188 (Baloxavir Marboxil) Compared with Placebo or Oseltamivir in Patients with Influenza at High Risk of Influenza Complications"
  },
  {
    "protocol": "2206T1331",
    "nct": "NCT05897541",
    "start": "06/09/2023",
    "end": "09/18/2024",
    "sponsor": "Shionogi",
    "phase": "Phase 3",
    "title": ""
  },
  {
    "protocol": "C38072/3081",
    "nct": "NCT01270464",
    "start": "02/2011",
    "end": "09/2013",
    "sponsor": "Teva Branded Pharmaceutical Products R&D, Inc.",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Efficacy and Safety of Reslizumab (0.3 or 3.0 mg/kg) as Treatment for Patients (12-75 Years of Age) with Eosinophilic Asthma"
  },
  {
    "protocol": "C38072/3083",
    "nct": "NCT01285323",
    "start": "03/2011",
    "end": "04/2014",
    "sponsor": "Teva Branded Pharmaceutical Products R&D, Inc.",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Efficacy and Safety of Reslizumab in Patients with Eosinophilic Asthma"
  },
  {
    "protocol": "C38072/3085",
    "nct": "NCT01290887",
    "start": "06/2011",
    "end": "01/2015",
    "sponsor": "Teva Branded Pharmaceutical Products R&D, Inc.",
    "phase": "Phase 3",
    "title": "Open-Label Extension Study to Evaluate the Long-Term Safety and Efficacy of Reslizumab (3.0 mg/kg) as Treatment for Patients (12 Through 75 Years of Age) with Eosinophilic Asthma"
  },
  {
    "protocol": "A0081279",
    "nct": "NCT01701362",
    "start": "10/2012",
    "end": "08/2015",
    "sponsor": "Pfizer (Pfizer’s Upjohn has merged with Mylan to form Viatris Inc.)",
    "phase": "Phase 3",
    "title": "Placebo-Controlled Safety and Efficacy Study of Pregabalin in Subjects with Post-Traumatic Peripheral Neuropathic Pain"
  },
  {
    "protocol": "A4091015",
    "nct": "NCT00830063",
    "start": "05/05/2009",
    "end": "08/31/2010",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Tanezumab in Osteoarthritis of the Knee"
  },
  {
    "protocol": "A409016",
    "nct": "NCT00809783",
    "start": "02/06/2009",
    "end": "06/23/2011",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Extension Study of Tanezumab in Osteoarthritis"
  },
  {
    "protocol": "A409018",
    "nct": "NCT00863304",
    "start": "06/09/2009",
    "end": "08/16/2010",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Tanezumab in Osteoarthritis of the Hip or Knee"
  },
  {
    "protocol": "ACT-2015-075-0AA",
    "nct": "NCT02495168",
    "start": "01/13/2017",
    "end": "05/31/2018",
    "sponsor": "Actavis Inc.",
    "phase": "Phase 3",
    "title": "Randomized, Placebo-Controlled, Multidose Study Comparing Generic Budesonide/Formoterol Fumarate Dihydrate to Symbicort in Asthmatic Participants"
  },
  {
    "protocol": "ALLN-346-202",
    "nct": "NCT04987294",
    "start": "09/02/2022",
    "end": "09/02/2022",
    "sponsor": "Allena Pharmaceuticals",
    "phase": "Phase 2a",
    "title": ""
  },
  {
    "protocol": "AT851-U-12-002",
    "nct": "NCT01699737",
    "start": "09/2012",
    "end": "07/2013",
    "sponsor": "Akros Pharma Inc.",
    "phase": "Phase 2",
    "title": "Safety and Efficacy of JTT-851 in Patients with Type 2 Diabetes Mellitus"
  },
  {
    "protocol": "B1481005",
    "nct": "NCT01342211",
    "start": "07/2011",
    "end": "06/2012",
    "sponsor": "Pfizer",
    "phase": "Phase 2",
    "title": "A Multiple Dose Study of PF-04950615 (RN316) in Subjects on High Doses of Statins"
  },
  {
    "protocol": "B1481012",
    "nct": "NCT01350141",
    "start": "06/2011",
    "end": "06/2012",
    "sponsor": "Pfizer",
    "phase": "Phase 2",
    "title": "A Multiple Dose Study of PF-04950615 (RN316) in Subjects on Maximum Doses of Statins"
  },
  {
    "protocol": "B1481015",
    "nct": "NCT01592240",
    "start": "07/2012",
    "end": "05/2013",
    "sponsor": "Pfizer",
    "phase": "Phase 2",
    "title": "Monthly and Twice Monthly Subcutaneous Dosing of PF-04950615 (RN316) in Hypercholesterolemic Subjects on a Statin"
  },
  {
    "protocol": "B1481020",
    "nct": "NCT01968967",
    "start": "10/29/2013",
    "end": "07/10/2017",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Randomized Clinical Trial of Bococizumab (PF-04950615; RN316) in Subjects with Hyperlipidemia or Mixed Dyslipidemia at Risk of Cardiovascular Events"
  },
  {
    "protocol": "B1481022",
    "nct": "NCT01975376",
    "start": "10/29/2013",
    "end": "03/22/2017",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "The Evaluation of Bococizumab (PF-04950615; RN316) in Reducing the Occurrence of Major Cardiovascular Events in High Risk Subjects (SPIRE-1)"
  },
  {
    "protocol": "B1481038",
    "nct": "NCT01975389",
    "start": "10/29/2013",
    "end": "04/03/2017",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "The Evaluation of Bococizumab (PF-04950615; RN316) in Reducing the Occurrence of Major Cardiovascular Events in High Risk Subjects (SPIRE-2)"
  },
  {
    "protocol": "BDB-AS-301",
    "nct": "NCT02031640",
    "start": "12/2013",
    "end": "12/2014",
    "sponsor": "Teva Branded Pharmaceutical Products R&D, Inc.",
    "phase": "Phase 3",
    "title": "A Safety and Efficacy Study of Beclomethasone Dipropionate Delivered Via Breath-Actuated Inhaler (BAI) or Metered-Dose Inhaler (MDI) in Participants &gt;=12 Years Old with Persistent Asthma"
  },
  {
    "protocol": "BLI5100-301",
    "nct": "NCT05587309",
    "start": "10/30/2022",
    "end": "09/01/2025",
    "sponsor": "Braintree Laboratories",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Efficacy and Safety of BLI5100 in Patients with Erosive Esophagitis"
  },
  {
    "protocol": "BLI5100-302",
    "nct": "NCT05587322",
    "start": "09/06/2022",
    "end": "04/23/2024",
    "sponsor": "Braintree Laboratories",
    "phase": "Phase 3",
    "title": "A Study to Evaluate the Efficacy and Safety of BLI5100 in Patients with Non-Erosive Reflux Disease"
  },
  {
    "protocol": "CBPS804A2203",
    "nct": "NCT01406548",
    "start": "07/2011",
    "end": "10/2013",
    "sponsor": "Ultragenyx Pharmaceutical Inc.",
    "phase": "Phase 2",
    "title": "Safety and Efficacy of Multiple Dosing Regimens of BPS804 in Post Menopausal Women with Low Bone Mineral Density"
  },
  {
    "protocol": "C4671002",
    "nct": "NCT05011513",
    "start": "08/25/2021",
    "end": "07/25/2022",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Evaluation of Protease Inhibition for COVID-19 in Standard-Risk Patients"
  },
  {
    "protocol": "C4671005",
    "nct": "NCT04960202",
    "start": "07/16/2021",
    "end": "04/25/2022",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "Study of Oral PF-07321332/Ritonavir Compared with Placebo in Nonhospitalized High Risk Adults with COVID-19"
  },
  {
    "protocol": "C4671006",
    "nct": "NCT05047601",
    "start": "09/09/2021",
    "end": "04/12/2022",
    "sponsor": "Pfizer",
    "phase": "Phase 3",
    "title": "A Study of a Potential Oral Treatment to Prevent COVID-19 in Adults Who Are Exposed to Household Member(s) With a Confirmed Symptomatic COVID-19 Infection"
  },
  {
    "protocol": "CCJM112X2101",
    "nct": "NCT01828086",
    "start": "06/2013",
    "end": "10/2015",
    "sponsor": "Novartis Pharmaceuticals",
    "phase": "Phase 1",
    "title": "Single and Multiple Dose Escalation Study to Assess the Safety and Tolerability of CJM112 in Psoriasis"
  },
  {
    "protocol": "CLI-05993AB8-02",
    "nct": "NCT05292586",
    "start": "10/05/2022",
    "end": "06/25/2024",
    "sponsor": "Chiesi Farmaceutici S.p.A.",
    "phase": "Phase 3",
    "title": "A Study Testing the Superiority of CHF 1535 pMDI 800/24 µg Total Daily Dose Compared to CHF 718 pMDI 800 µg Total Daily Dose in Adults with Asthma on Medium or High-Dose Inhaled Corticosteroid"
  },
  {
    "protocol": "CLR_11_03",
    "nct": "NCT02027025",
    "start": "04/21/2014",
    "end": "04/28/2017",
    "sponsor": "Sun Pharma Advanced Research Company Limited",
    "phase": "Phase 2",
    "title": "Study of SPARC1103 in Subjects with Spasticity"
  },
  {
    "protocol": "CTAP101-CL-2014",
    "nct": "NCT04551911",
    "start": "11/02/2020",
    "end": "10/08/2021",
    "sponsor": "OPKO Health, Inc.",
    "phase": "Phase 2",
    "title": "Safety and Efficacy of Rayaldee for Treating Mild to Moderate COVID-19"
  },
  {
    "protocol": "D1690C00010",
    "nct": "NCT00984867",
    "start": "10/2009",
    "end": "09/2011",
    "sponsor": "AstraZeneca",
    "phase": "Phase 3",
    "title": "Dapagliflozin DPPIV Inhibitor Add-on Study"
  },
  {
    "protocol": "D1690C00018",
    "nct": "NCT01031680",
    "start": "02/2010",
    "end": "12/2012",
    "sponsor": "AstraZeneca",
    "phase": "Phase 3",
    "title": "Efficacy and Safety in Patients with Type 2 Diabetes Mellitus, Cardiovascular Disease, and Hypertension"
  },
  {
    "protocol": "D1690C00019",
    "nct": "NCT01042977",
    "start": "03/2010",
    "end": "12/2012",
    "sponsor": "AstraZeneca",
    "phase": "Phase 3",
    "title": "Efficacy and Safety in Patients with Type 2 Diabetes Mellitus and Cardiovascular Disease"
  },
  {
    "protocol": "DS5565-A-E311",
    "nct": "NCT02187159",
    "start": "11/2014",
    "end": "07/07/2016",
    "sponsor": "Daiichi Sankyo",
    "phase": "Phase 3",
    "title": "Treatment of Pain Associated with Fibromyalgia"
  },
  {
    "protocol": "DS5565-A-E312",
    "nct": "NCT02234583",
    "start": "02/04/2015",
    "end": "04/19/2017",
    "sponsor": "Daiichi Sankyo",
    "phase": "Phase 3",
    "title": "An Open-Label Extension Study of DS-5565 for 52 Weeks in Pain Associated with Fibromyalgia"
  },
  {
    "protocol": "DST-0509-201",
    "nct": "NCT03637556",
    "start": "08/20/2019",
    "end": "08/16/2021",
    "sponsor": "DisperSol Technologies, LLC",
    "phase": "Phase 2",
    "title": "Pilot Study to Assess the Safety, PK and Iron Chelating Activity of DST-0509 (Deferasirox) in Thalassemia Patients Refractory to Chelation"
  },
  {
    "protocol": "EFC14833",
    "nct": "NCT02926937",
    "start": "11/11/2016",
    "end": "05/17/2019",
    "sponsor": "Lexicon Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Sotagliflozin Versus Placebo in Patients with Type 2 Diabetes Mellitus Not Currently Treated with Antidiabetic Therapy"
  },
  {
    "protocol": "EFC14834",
    "nct": "NCT02926950",
    "start": "11/2016",
    "end": "03/22/2019",
    "sponsor": "Lexicon Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Efficacy and Safety of Sotagliflozin Versus Placebo in Patients with Type 2 Diabetes Mellitus on Background of Metformin"
  },
  {
    "protocol": "EN3835-302",
    "nct": "NCT03428750",
    "start": "02/05/2018",
    "end": "09/26/2018",
    "sponsor": "Endo Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Effectiveness and Safety of EN3835 in the Treatment of EFP (Cellulite) in Women"
  },
  {
    "protocol": "EN3835-304",
    "nct": "NCT03526549",
    "start": "04/26/2018",
    "end": "10/08/2021",
    "sponsor": "Endo Pharmaceuticals",
    "phase": "Phase 3",
    "title": "Long-Term Study of EN3835 (CCH-aaes) in Edematous Fibrosclerotic Panniculopathy (Cellulite)"
  },
  {
    "protocol": "112059",
    "nct": "NCT01159912",
    "start": "06/30/2010",
    "end": "01/16/2012",
    "sponsor": "GlaxoSmithKline",
    "phase": "Phase 3",
    "title": "Evaluating the Efficacy and Safety of Fluticasone Furoate Inhalation Powder in the Treatment of Asthma in Adults and Adolescents"
  },
  {
    "protocol": "FLSA-P100/50-PVCL-1",
    "nct": "NCT02649478",
    "start": "08/2014",
    "end": "11/2015",
    "sponsor": "Roxane Laboratories",
    "phase": "—",
    "title": "N/A"
  },
  {
    "protocol": "207597",
    "nct": "NCT03207243",
    "start": "09/14/2017",
    "end": "05/15/2019",
    "sponsor": "GlaxoSmithKline",
    "phase": "Phase 2",
    "title": "Efficacy and Safety Study of GSK3772847 In Subjects with Moderately Severe Asthma"
  },
  {
    "protocol": "113782",
    "nct": "NCT01313676",
    "start": "01/25/2011",
    "end": "07/15/2015",
    "sponsor": "GlaxoSmithKline",
    "phase": "Phase 3",
    "title": "Study to Evaluate the Effect of Fluticasone Furoate/Vilanterol on Survival in Subjects with Chronic Obstructive Pulmonary Disease"
  },
  {
    "protocol": "P-Monofer-IDA-03",
    "nct": "NCT02940886",
    "start": "11/08/2016",
    "end": "03/28/2018",
    "sponsor": "Pharmacosmos A/S",
    "phase": "Phase 3",
    "title": "Iron Isomaltoside/Ferric Derisomaltose vs Iron Sucrose for the Treatment of Iron Deficiency Anemia (IDA)"
  },
  {
    "protocol": "K031-120",
    "nct": "NCT04414124",
    "start": "08/02/2020",
    "end": "02/02/2021",
    "sponsor": "Kaleido Biosciences",
    "phase": "—",
    "title": "N/A"
  },
  {
    "protocol": "K032-120",
    "nct": "NCT04486482",
    "start": "01/12/2021",
    "end": "03/30/2021",
    "sponsor": "Kaleido Biosciences",
    "phase": "—",
    "title": "N/A"
  },
  {
    "protocol": "K034-120",
    "nct": "NCT04814914",
    "start": "03/25/2021",
    "end": "05/28/2021",
    "sponsor": "Kaleido Biosciences",
    "phase": "—",
    "title": "N/A"
  },
  {
    "protocol": "LAM-002A-CVD-CLN01",
    "nct": "NCT04446377",
    "start": "07/15/2020",
    "end": "04/19/2021",
    "sponsor": "OrphAI Therapeutics",
    "phase": "Phase 2",
    "title": "A Study of LAM-002A for the Prevention of Progression of COVID-19"
  },
  {
    "protocol": "M16-063",
    "nct": "NCT03682705",
    "start": "10/08/2018",
    "end": "03/26/2020",
    "sponsor": "AbbVie",
    "phase": "Phase 2",
    "title": "A Study to Investigate the Safety and Efficacy of ABBV-105 Alone or in Combination with Upadacitinib (ABBV-599 Combination) in Participants with Active Rheumatoid Arthritis"
  }
];
