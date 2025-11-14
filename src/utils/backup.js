import { openDB } from 'idb'

const DB_NAME = 'pct-db-static'
const STORE = 'credentials'

export async function exportJSON() {
  const db = await openDB(DB_NAME, 1)
  const all = await db.getAll(STORE)
  const payload = { version: 1, exportedAt: new Date().toISOString(), items: all }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'credentials-backup.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function importJSON(file) {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.items)) throw new Error('Invalid backup file.')
  const db = await openDB(DB_NAME, 1)
  const tx = db.transaction(STORE, 'readwrite')
  for (const item of data.items) {
    // Upsert by id if present, else add
    try {
      if (item && typeof item === 'object') {
        await tx.store.put(item)
      }
    } catch (e) {
      console.warn('Import item failed', e)
    }
  }
  await tx.done
  return data.items.length
}
