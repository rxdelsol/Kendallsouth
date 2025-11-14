import React, { useRef } from 'react'
export default function FileManager(){
  const fileRef = useRef()
  const download = ()=>{
    const data = { doctorsList: JSON.parse(localStorage.getItem('doctorsList')||'[]'), doctorsByInsurance: JSON.parse(localStorage.getItem('doctorsByInsurance')||'{}'), insuranceList: JSON.parse(localStorage.getItem('insuranceList')||'[]') }
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='base.json'; a.click(); URL.revokeObjectURL(url)
  }
  const uploadClick = ()=> fileRef.current && fileRef.current.click()
  const upload = (e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const reader=new FileReader(); reader.onload=()=>{ try{ const obj=JSON.parse(reader.result); if(obj.doctorsList) localStorage.setItem('doctorsList', JSON.stringify(obj.doctorsList)); if(obj.doctorsByInsurance) localStorage.setItem('doctorsByInsurance', JSON.stringify(obj.doctorsByInsurance)); if(obj.insuranceList) localStorage.setItem('insuranceList', JSON.stringify(obj.insuranceList)); alert('Database uploaded and applied.'); window.location.reload(); }catch(err){ alert('Invalid JSON') } }; reader.readAsText(f) }
  return (<div className="flex items-center gap-2"><button className="px-3 py-2 rounded bg-sky-500 text-white" onClick={download}>Download Database</button><button className="px-3 py-2 rounded bg-emerald-500 text-white" onClick={uploadClick}>Upload Database</button><input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={upload} /></div>)
}
