import { listCreds } from '../store/db'

function notify(title, body){
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try{ new Notification(title, { body }) }catch(e){ console.warn('Notification failed', e) }
}

export function requestPermission(){
  if (!('Notification' in window)) return
  if (Notification.permission === 'default'){ Notification.requestPermission() }
}

export function startScheduler(){
  const CHECK_MS = 30 * 60 * 1000
  async function tick(){
    try{
      const rows = await listCreds('')
      const today = new Date().toISOString().slice(0,10)
      rows.forEach(r => {
        if(!r.expiry_date) return
        const remaining = daysUntil(r.expiry_date)
        const threshold = (r.alert_days ?? 30)
        if(remaining <= threshold){
          const toastKey = `notified:${today}:${r.id}`
          if(localStorage.getItem(toastKey) !== '1'){
            notify('Credential expiring soon', `${r.provider} · ${r.credential_type} in ${remaining} day(s) (${r.expiry_date})`)
            localStorage.setItem(toastKey, '1')
          }
        }
      })
    }catch(e){ console.warn('Scheduler error', e) }
  }
  function daysUntil(dateStr){
    try{
      const target = new Date(dateStr+'T00:00:00')
      const now = new Date()
      return Math.ceil((target - now) / (1000*60*60*24))
    }catch{return null}
  }
  setTimeout(tick, 4000)
  setInterval(tick, CHECK_MS)
}

export function openMailtoDraft({to, provider, credential_type, expiry_date, days_left}){
  const subject = encodeURIComponent(`[Alert] ${provider} · ${credential_type} expires in ${days_left} day(s)`)
  const body = encodeURIComponent(`Reminder: ${provider} — ${credential_type} will expire on ${expiry_date} (in ${days_left} day/s).`)
  const mailto = `mailto:${encodeURIComponent(to||'')}?subject=${subject}&body=${body}`
  window.location.href = mailto
}
