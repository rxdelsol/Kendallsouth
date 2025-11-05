export async function exportDashboardPDF(rows){
  const { jsPDF } = window.jspdf || (await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')).jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  const lineHeight = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin*2;
  const logoUrl = 'https://kendallsouthcredentialing.vercel.app/Picture1.png';
  try{
    const imgData = await urlToDataUrl(logoUrl);
    doc.addImage(imgData, 'PNG', margin, 20, 60, 30);
  }catch(e){ }
  doc.setFontSize(14);
  doc.text('Kendall South Medical Center — Provider Credential Tracker', margin+70, 36);
  const dateStr = new Date().toLocaleString();
  doc.setFontSize(10);
  doc.text('Generated: ' + dateStr, pageWidth - margin - 150, 36);
  let y = 70;
  doc.setFontSize(11);
  const cols = ['Doctor Name','Insurance Name','Type','Expiration Date','Days Left','Notes'];
  const colWidths = [120,120,80,90,70,usableWidth-120-120-80-90-70];
  let x = margin;
  for(let i=0;i<cols.length;i++){ doc.setTextColor(255,255,255); doc.setFillColor(8,16,40); doc.rect(x, y-12, colWidths[i], 18, 'F'); doc.setTextColor(255,255,255); doc.text(cols[i], x+4, y); x += colWidths[i]; }
  y += 22;
  doc.setTextColor(0,0,0);
  const rowsPerPage = Math.floor((doc.internal.pageSize.getHeight() - y - 60) / lineHeight);
  let rowCount = 0;
  for(let r=0;r<rows.length;r++){
    if(rowCount >= rowsPerPage){ addFooter(doc); doc.addPage(); y = 40; x = margin; for(let i=0;i<cols.length;i++){ doc.setTextColor(255,255,255); doc.setFillColor(8,16,40); doc.rect(x, y-12, colWidths[i], 18, 'F'); doc.setTextColor(255,255,255); doc.text(cols[i], x+4, y); x += colWidths[i]; } y += 22; doc.setTextColor(0,0,0); rowCount = 0; }
    const item = rows[r];
    x = margin;
    if(item.days !== null){ if(item.days <= 30) doc.setFillColor(75,30,30); else if(item.days <= 90) doc.setFillColor(124,94,46); }
    // draw row background if colored
    if(item.days !== null && item.days <= 90){ doc.rect(margin, y-12, usableWidth, 16, 'F'); }
    doc.setFontSize(10);
    doc.text(item.doctor || 'Unassigned', x+4, y); x += colWidths[0];
    doc.text(item.insurance || '', x+4, y); x += colWidths[1];
    doc.text(item.type || '', x+4, y); x += colWidths[2];
    doc.text(item.expiration? new Date(item.expiration).toLocaleDateString() : 'No date', x+4, y); x += colWidths[3];
    doc.text(item.days===null? 'No date' : (item.days<0? 'Expired' : item.days + ' days'), x+4, y); x += colWidths[4];
    const notes = item.notes || '';
    const splitNotes = doc.splitTextToSize(notes, colWidths[5]-8);
    doc.text(splitNotes, x+4, y);
    y += lineHeight; rowCount++;
  }
  addFooter(doc);
  doc.save('KendallSouth_Dashboard_Report.pdf');
}
function addFooter(doc){ const page = doc.getNumberOfPages(); const w = doc.internal.pageSize.getWidth(); const h = doc.internal.pageSize.getHeight(); doc.setFontSize(9); doc.text(`Page ${page}`, w/2, h-20, { align: 'center' }); }
async function urlToDataUrl(url){ const res = await fetch(url); const blob = await res.blob(); return await new Promise((resolve)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.readAsDataURL(blob); }); }
