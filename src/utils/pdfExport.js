export async function exportDashboardPDF(rows){
  const { jsPDF } = window.jspdf || (await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')).jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const margin = 40; const usableWidth = doc.internal.pageSize.getWidth() - margin*2; const now=new Date(); const nowStr=now.toLocaleString();
  try{ const img=await urlToDataUrl('https://kendallsouthcredentialing.vercel.app/Picture1.png'); doc.addImage(img,'PNG',margin,20,60,30);}catch(e){}
  doc.setFontSize(14); doc.text('Kendall South Medical Center — Provider Credential Tracker', margin+70,36); doc.setFontSize(10); doc.text('Generated: '+nowStr, doc.internal.pageSize.getWidth()-margin-200,36);
  let y=70; const cols=['Doctor','Insurance','Type','Expiration','Days','Notes']; const colW=[110,110,70,160,70, usableWidth-110-110-70-160-70]; let x=margin; for(let i=0;i<cols.length;i++){ doc.setFillColor(8,16,40); doc.setTextColor(255,255,255); doc.rect(x,y-12,colW[i],18,'F'); doc.text(cols[i],x+4,y); x+=colW[i]; } y+=22; doc.setTextColor(0,0,0);
  const lineH=18; const rowsPerPage=Math.floor((doc.internal.pageSize.getHeight()-y-80)/lineH); let count=0;
  for(let i=0;i<rows.length;i++){
    if(count>=rowsPerPage){ addFooter(doc,now); doc.addPage(); y=40; x=margin; for(let j=0;j<cols.length;j++){ doc.setFillColor(8,16,40); doc.setTextColor(255,255,255); doc.rect(x,y-12,colW[j],18,'F'); doc.text(cols[j],x+4,y); x+=colW[j]; } y+=22; doc.setTextColor(0,0,0); count=0; }
    const r=rows[i]; x=margin; doc.setFontSize(10);
    doc.text(r.doctor||'Unassigned', x+4, y); x+=colW[0]; doc.text(r.insurance||'', x+4, y); x+=colW[1]; doc.text(r.type||'', x+4, y); x+=colW[2];
    const exp = (r.expiration? new Date(r.expiration).toLocaleDateString() : 'No date') + (r.state? (' — '+r.state) : ''); doc.text(exp, x+4, y); x+=colW[3]; doc.text(r.days===null? 'No date': (r.days<0? 'Expired': r.days+' days'), x+4, y); x+=colW[4]; const notes=r.notes||''; const split=doc.splitTextToSize(notes, colW[5]-8); doc.text(split, x+4, y); y+=lineH; count++; }
  addFooter(doc,now); const pad=n=>String(n).padStart(2,'0'); const d=now; const filename=`KendallSouth_Report_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.pdf`; doc.save(filename);
}
function addFooter(doc,now){ const page=doc.getNumberOfPages(); const w=doc.internal.pageSize.getWidth(); const h=doc.internal.pageSize.getHeight(); const footer=`Kendall South Medical Center — Provider Credential Tracker | Generated on ${now.toLocaleString()}`; doc.setFontSize(9); doc.text(footer,40,h-30); doc.text(`Page ${page} of ${page}`, w-120, h-30); }
async function urlToDataUrl(url){ const res=await fetch(url); const blob=await res.blob(); return await new Promise(reso=>{ const r=new FileReader(); r.onload=()=>reso(r.result); r.readAsDataURL(blob); }); }
