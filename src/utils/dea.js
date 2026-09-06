// src/utils/dea.js
//
// Verificación del número DEA sin consultar a nadie.
//
// El registro DEA en sí (y su fecha de vencimiento) NO es un dato público
// gratuito: la DEA vende el archivo de registrantes a través de NTIS, y los
// servicios de verificación de terceros cobran por consulta. Así que el
// vencimiento hay que cargarlo a mano desde el certificado.
//
// Lo que SÍ se puede comprobar solo es que el número esté bien escrito. Un
// DEA es 2 letras + 7 dígitos, y el último dígito es un verificador:
//   suma1 = 1º + 3º + 5º dígito
//   suma2 = 2º + 4º + 6º dígito
//   verificador = último dígito de (suma1 + 2 × suma2)
// Además, la segunda letra es la inicial del apellido del registrante.
// Un número mal transcrito casi siempre rompe una de las dos reglas, y ese
// error termina en rechazo de la receta o del claim.

// Primera letra: tipo de registrante.
const TIPOS = {
  A: "Hospital/Clinic (legacy)",
  B: "Hospital/Clinic",
  F: "Distributor",
  G: "Government program",
  M: "Mid-level practitioner (ARNP, PA)",
  P: "Chemical distributor",
  R: "Chemical distributor",
  X: "Treatment program (Suboxone)",
};

export function deaCheck(dea, doctorName = "") {
  const raw = String(dea || "").trim().toUpperCase().replace(/[\s-]/g, "");
  if (!raw) return { state: "empty", label: "No DEA on file" };

  if (!/^[A-Z]{2}\d{7}$/.test(raw)) {
    return { state: "bad", label: "Invalid format: must be 2 letters and 7 digits" };
  }

  const letras = raw.slice(0, 2);
  const d = raw.slice(2).split("").map(Number);
  const suma1 = d[0] + d[2] + d[4];
  const suma2 = d[1] + d[3] + d[5];
  const esperado = (suma1 + 2 * suma2) % 10;

  if (esperado !== d[6]) {
    return {
      state: "bad",
      label: `Check digit does not match (it should end in ${esperado})`,
      hint: "Usually a digit mistyped from the certificate.",
    };
  }

  const tipo = TIPOS[letras[0]] || (/[A-Z]/.test(letras[0]) ? "Practitioner (physician, dentist, veterinarian)" : null);

  // La 2ª letra es la inicial del apellido. Solo lo marcamos como aviso:
  // hay casos legítimos (cambio de apellido tras casarse, registros de
  // empresa) en los que no coincide y el número es válido igual.
  const apellido = String(doctorName || "").trim().split(/\s+/).pop() || "";
  const inicial = apellido ? apellido[0].toUpperCase() : "";
  if (inicial && letras[1] !== inicial) {
    return {
      state: "warn",
      label: `Check digit is correct, but the 2nd letter (${letras[1]}) is not the initial of "${apellido}"`,
      hint: "This can be legitimate after a name change; otherwise verify the number.",
      tipo,
    };
  }

  return { state: "ok", label: "Valid number", tipo };
}

export const DEA_STATE_META = {
  ok: { cls: "v-ok", icon: "✓" },
  warn: { cls: "sem-60", icon: "⚠" },
  bad: { cls: "v-bad", icon: "✗" },
  empty: { cls: "v-muted", icon: "—" },
};
