const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "ielts-tracker-records-v1";
const listeningBands = [[39,40,9],[37,38,8.5],[35,36,8],[32,34,7.5],[30,31,7],[26,29,6.5],[23,25,6],[18,22,5.5],[16,17,5],[13,15,4.5],[10,12,4],[8,9,3.5],[6,7,3],[4,5,2.5],[0,3,2]];
const readingBands = [[39,40,9],[37,38,8.5],[35,36,8],[33,34,7.5],[30,32,7],[27,29,6.5],[23,26,6],[19,22,5.5],[15,18,5],[13,14,4.5],[10,12,4],[8,9,3.5],[6,7,3],[4,5,2.5],[0,3,2]];
let records = loadRecords();
let editingId = null;

function loadRecords(){ try { const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); return Array.isArray(x)?x:[]; } catch { return []; } }
function saveRecords(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(records)); }
function bandFromWrong(wrong,type){ if(wrong===null||wrong===undefined||wrong==="")return null; const correct=40-Number(wrong); const table=type==="L"?listeningBands:readingBands; const row=table.find(r=>correct>=r[0]&&correct<=r[1]); return row?row[2]:null; }
function validScore(value){return value==="" || (Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=40);}
function scoreText(wrong,type){if(wrong==="")return "Not entered";const b=bandFromWrong(wrong,type);return `${40-Number(wrong)}/40 · Band ${b.toFixed(1)}`;}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function formatDate(s){if(!s)return "—";return new Date(s+"T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function showLiveScores(){
  for(const [id,type,result] of [["listeningWrong","L","listeningResult"],["readingWrong","R","readingResult"]]){
    const v=$(id).value; const el=$(result);
    if(v===""){el.textContent="Enter a score to see your estimated band";continue;}
    if(!validScore(v)){el.textContent="Please enter a whole number from 0 to 40.";continue;}
    el.innerHTML=`<strong>${scoreText(v,type)}</strong> estimated`;
  }
}
function latestFor(key,type){const r=records.filter(x=>x[key]!==null&&x[key]!==undefined).sort((a,b)=>b.date.localeCompare(a.date))[0];return r?{band:bandFromWrong(r[key],type),wrong:r[key],date:r.date}:null;}
function renderStats(){
  const l=latestFor("listeningWrong","L"),r=latestFor("readingWrong","R");
  $("latestListening").textContent=l?l.band.toFixed(1):"—";$("latestListeningMeta").textContent=l?`${l.wrong} wrong · ${formatDate(l.date)}`:"No result yet";
  $("latestReading").textContent=r?r.band.toFixed(1):"—";$("latestReadingMeta").textContent=r?`${r.wrong} wrong · ${formatDate(r.date)}`:"No result yet";
  if(l&&r){$("averageScore").textContent=(Math.round((l.band+r.band)/2*2)/2).toFixed(1);$("averageMeta").textContent="Average of latest section scores";}
  else {$("averageScore").textContent=l?`L ${l.band.toFixed(1)}`:r?`R ${r.band.toFixed(1)}`:"—";$("averageMeta").textContent="Only one section available";}
  $("practiceDays").textContent=new Set(records.filter(x=>x.speaking||x.writing).map(x=>x.date)).size;
}
function renderHistory(){
  const sorted=[...records].sort((a,b)=>b.date.localeCompare(a.date));
  $("recordCount").textContent=`${records.length} record${records.length===1?"":"s"}`;
  if(!sorted.length){$("historyBody").innerHTML='<tr><td colspan="7" class="empty-row">No records yet. Add your first practice above.</td></tr>';return;}
  $("historyBody").innerHTML=sorted.map(x=>{
    const l=x.listeningWrong!==null?`<span class="band">${bandFromWrong(x.listeningWrong,"L").toFixed(1)}</span> <small>(${x.listeningWrong} wrong)</small>`:"—";
    const r=x.readingWrong!==null?`<span class="band">${bandFromWrong(x.readingWrong,"R").toFixed(1)}</span> <small>(${x.readingWrong} wrong)</small>`:"—";
    return `<tr><td>${formatDate(x.date)}</td><td>${escapeHTML(x.testName||"Practice")}</td><td>${l}</td><td>${r}</td><td>${x.speaking?'<span class="status">✓ Done</span>':"—"}</td><td>${x.writing?'<span class="status">✓ Done</span>':"—"}</td><td><button class="delete-btn" data-delete="${x.id}" aria-label="Delete record">×</button></td></tr>`;
  }).join("");
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteRecord(btn.dataset.delete)));
}
function renderChart(){
  const rows=[...records].filter(x=>x.listeningWrong!==null||x.readingWrong!==null).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
  const el=$("chart");
  if(!rows.length){el.className="chart-empty";el.textContent="Your score trend will appear here after you save results.";return;}
  el.className="";
  const W=900,H=190,L=35,R=15,T=12,B=35,innerW=W-L-R,innerH=H-T-B,min=2,max=9;
  const x=i=>L+(rows.length===1?innerW/2:i*innerW/(rows.length-1));
  const y=v=>T+(max-v)/(max-min)*innerH;
  let svg=`<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Listening and Reading score trend">`;
  [3,5,7,9].forEach(v=>{svg+=`<line x1="${L}" y1="${y(v)}" x2="${W-R}" y2="${y(v)}" stroke="#edf0f4" stroke-dasharray="3 4"/><text x="4" y="${y(v)+4}" fill="#9aa4b2" font-size="10">${v}</text>`;});
  for(const [key,type,color] of [["listeningWrong","L","#4776c5"],["readingWrong","R","#399b8d"]]){
    const pts=rows.map((row,i)=>row[key]===null?null:[x(i),y(bandFromWrong(row[key],type))]).filter(Boolean);
    if(pts.length>1)svg+=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach(p=>svg+=`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`);
  }
  rows.forEach((row,i)=>{if(i===0||i===rows.length-1||rows.length<=6)svg+=`<text x="${x(i)}" y="${H-9}" fill="#929dad" font-size="10" text-anchor="middle">${new Date(row.date+"T12:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"})}</text>`;});
  svg+="</svg>";el.innerHTML=svg;
}
function render(){renderStats();renderHistory();renderChart();}
function resetForm(){editingId=null;$("entryForm").reset();$("date").value=todayISO();$("saveButton").textContent="Save daily record";$("formMessage").textContent="";showLiveScores();}
function deleteRecord(id){if(!confirm("Delete this saved record?"))return;records=records.filter(x=>String(x.id)!==String(id));saveRecords();render();}
$("entryForm").addEventListener("submit",e=>{
  e.preventDefault();
  const l=$("listeningWrong").value,r=$("readingWrong").value;
  if(!validScore(l)||!validScore(r)){alert("Please enter whole numbers from 0 to 40.");return;}
  const record={id:editingId||`${Date.now()}-${Math.random().toString(16).slice(2)}`,date:$("date").value,testName:$("testName").value.trim(),listeningWrong:l===""?null:Number(l),readingWrong:r===""?null:Number(r),speaking:$("speaking").checked,writing:$("writing").checked,notes:$("notes").value.trim()};
  const index=records.findIndex(x=>String(x.id)===String(record.id));if(index>=0)records[index]=record;else records.push(record);
  saveRecords();render();$("formMessage").textContent="Record saved on this device.";resetForm();
});
$("entryForm").addEventListener("reset",()=>setTimeout(()=>{editingId=null;$("date").value=todayISO();showLiveScores();},0));
$("listeningWrong").addEventListener("input",showLiveScores);$("readingWrong").addEventListener("input",showLiveScores);
$("exportButton").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({app:"IELTS Tracker",version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`ielts-tracker-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);
});
$("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const data=JSON.parse(await file.text());const incoming=Array.isArray(data)?data:data.records;if(!Array.isArray(incoming))throw new Error("Invalid backup");
    if(!confirm(`Import ${incoming.length} records? Records with matching IDs will be replaced.`))return;
    const map=new Map(records.map(x=>[String(x.id),x]));incoming.forEach(x=>{if(x&&x.date&&x.id!==undefined)map.set(String(x.id),x);});records=[...map.values()];saveRecords();render();alert("Backup imported.");}
  catch(err){alert("Could not read this backup file.");}finally{e.target.value="";}
});
$("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
$("date").value=todayISO();render();showLiveScores();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
