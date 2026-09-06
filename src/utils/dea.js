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
  A: "Hospital/Clínica (histórico)",
  B: "Hospital/Clínica",
  F: "Distribuidor",
  G: "Programa del gobierno",
  M: "Profesional de nivel medio (ARNP, PA)",
  P: "Distribuidor de precursores",
  R: "Distribuidor de precursores",
  X: "Programa de tratamiento (Suboxone)",
};

export function deaCheck(dea, doctorName = "") {
  const raw = String(dea || "").trim().toUpperCase().replace(/[\s-]/g, "");
  if (!raw) return { state: "empty", label: "Sin DEA cargado" };

  if (!/^[A-Z]{2}\d{7}$/.test(raw)) {
    return { state: "bad", label: "Formato inválido: deben ser 2 letras y 7 dígitos" };
  }

  const letras = raw.slice(0, 2);
  const d = raw.slice(2).split("").map(Number);
  const suma1 = d[0] + d[2] + d[4];
  const suma2 = d[1] + d[3] + d[5];
  const esperado = (suma1 + 2 * suma2) % 10;

  if (esperado !== d[6]) {
    return {
      state: "bad",
      label: `Dígito verificador no coincide (debería terminar en ${esperado})`,
      hint: "Suele ser un dígito mal copiado del certificado.",
    };
  }

  const tipo = TIPOS[letras[0]] || (/[A-Z]/.test(letras[0]) ? "Profesional (médico, dentista, veterinario)" : null);

  // La 2ª letra es la inicial del apellido. Solo lo marcamos como aviso:
  // hay casos legítimos (cambio de apellido tras casarse, registros de
  // empresa) en los que no coincide y el número es válido igual.
  const apellido = String(doctorName || "").trim().split(/\s+/).pop() || "";
  const inicial = apellido ? apellido[0].toUpperCase() : "";
  if (inicial && letras[1] !== inicial) {
    return {
      state: "warn",
      label: `Verificador correcto, pero la 2ª letra (${letras[1]}) no es la inicial de "${apellido}"`,
      hint: "Puede ser legítimo si hubo cambio de apellido; si no, revisá el número.",
      tipo,
    };
  }

  return { state: "ok", label: "Número válido", tipo };
}

export const DEA_STATE_META = {
  ok: { cls: "v-ok", icon: "✓" },
  warn: { cls: "sem-60", icon: "⚠" },
  bad: { cls: "v-bad", icon: "✗" },
  empty: { cls: "v-muted", icon: "—" },
};
