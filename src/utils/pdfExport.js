export async function exportDashboardPDF(rows){
  const { jsPDF } = window.jspdf || (await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')).jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const margin = 40;
  const usableWidth = doc.internal.pageSize.getWidth() - margin*2;
  const now = new Date(); const nowStr = now.toLocaleString();
  try{ const img = await urlToDataUrl('https://kendallsouthcredentialing.vercel.app/Picture1.png'); doc.addImage(img,'PNG',margin,20,60,30); }catch(e){}
  doc.setFontSize(14); doc.text('Kendall South Medical Center — Provider Credential Tracker', margin+70, 36);
  doc.setFontSize(10); doc.text('Generated: '+nowStr, doc.internal.pageSize.getWidth()-margin-200,36);
  let y = 70;
  const cols = ['Doctor Name','Insurance Name','Type','Expiration Date','Days Left','Notes'];
  const colWidths = [110,110,70,90,70, usableWidth-110-110-70-90-70];
  let x = margin;
  doc.setFontSize(11);
  for(let i=0;i<cols.length;i++){ doc.setFillColor(8,16,40); doc.setTextColor(255,255,255); doc.rect(x,y-12,colWidths[i],18,'F'); doc.text(cols[i], x+4, y); x+=colWidths[i]; }
  y += 22; doc.setTextColor(0,0,0);
  const lineH = 18; const rowsPerPage = Math.floor((doc.internal.pageSize.getHeight()-y-80)/lineH);
  let rowCount = 0;
  for(let i=0;i<rows.length;i++){
    if(rowCount>=rowsPerPage){ addFooter(doc, now); doc.addPage(); y=40; x=margin; for(let j=0;j<cols.length;j++){ doc.setFillColor(8,16,40); doc.setTextColor(255,255,255); doc.rect(x,y-12,colWidths[j],18,'F'); doc.text(cols[j], x+4, y); x+=colWidths[j]; } y+=22; doc.setTextColor(0,0,0); rowCount=0; }
    const r = rows[i]; x = margin;
    if(r.days !== null){ if(r.days <= 30) doc.setFillColor(75,30,30); else if(r.days <= 90) doc.setFillColor(124,94,46); }
    if(r.days !== null && r.days <= 90){ doc.rect(margin, y-12, usableWidth, 16, 'F'); }
    doc.setFontSize(10);
    doc.text(r.doctor||'Unassigned', x+4, y); x+=colWidths[0];
    doc.text(r.insurance||'', x+4, y); x+=colWidths[1];
    doc.text(r.type||'', x+4, y); x+=colWidths[2];
    doc.text(r.expiration? new Date(r.expiration).toLocaleDateString(): 'No date', x+4, y); x+=colWidths[3];
    doc.text(r.days===null? 'No date' : (r.days<0? 'Expired' : r.days + ' days'), x+4, y); x+=colWidths[4];
    const notes = r.notes || '';
    const splitNotes = doc.splitTextToSize(notes, colWidths[5]-8);
    doc.text(splitNotes, x+4, y);
    y += lineH; rowCount++;
  }
  addFooter(doc, now);
  const pad = n => String(n).padStart(2,'0'); const d = now; const filename = `KendallSouth_Report_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.pdf`;
  doc.save(filename);
}
function addFooter(doc, now){ const page = doc.getNumberOfPages(); const w = doc.internal.pageSize.getWidth(); const h = doc.internal.pageSize.getHeight(); const footerText = `Kendall South Medical Center — Provider Credential Tracker | Generated on ${now.toLocaleString()}`; doc.setFontSize(9); doc.text(footerText, 40, h-30); doc.text(`Page ${page} of ${page}`, w-120, h-30); }
async function urlToDataUrl(url){ const res = await fetch(url); const blob = await res.blob(); return await new Promise((resolve)=>{ const reader = new FileReader(); reader.onload = ()=>resolve(reader.result); reader.readAsDataURL(blob); }); }
