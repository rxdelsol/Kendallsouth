import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import { initDB } from './store/db'
import { ensurePersistentStorage } from './utils/persist'

async function boot(){
  try{
    await initDB()
  }catch(e){
    console.error('DB init failed:', e)
    alert('Database initialization failed. Please reload the page.')
  }

  const res = await ensurePersistentStorage()
  if (!res.supported) {
    console.warn('Persistent storage not supported in this browser')
  } else if (!res.persisted) {
    console.warn('Persistent storage not granted')
    // Soft notice for the user:
    setTimeout(()=>{
      alert('Heads-up: Your browser did not grant persistent storage. If data disappears after closing, enable site data persistence (disable "Clear cookies and site data on close") or use a non-incognito window.')
    }, 100)
  }

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js') } catch(e){ console.warn('SW failed', e) }
  }
  const root = createRoot(document.getElementById('root'))
  root.render(<App />)
}
boot()
