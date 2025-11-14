export async function ensurePersistentStorage() {
  if (!('storage' in navigator) || !navigator.storage.persist) {
    return { supported: false, persisted: false }
  }
  const already = await navigator.storage.persisted()
  if (already) return { supported: true, persisted: true }
  try {
    const granted = await navigator.storage.persist()
    return { supported: true, persisted: !!granted }
  } catch {
    return { supported: true, persisted: false }
  }
}
