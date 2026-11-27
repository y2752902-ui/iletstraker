const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "ielts-tracker-records-v1";

// ====== 你的云端配置 ======
const SUPABASE_URL = "https://jslkvrjsoaexocwvcuvm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pl3xc71zvKX_Gs1JOqsVZQ_4E-tIRPt";
// ===========================

let sb = null;
if (window.supabase && SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
let currentUser = null;

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
function partsText(parts){ return Array.isArray(parts) && parts.length ? ` <small class="parts-note">(${parts.join("/")})</small>` : ""; }

function readParts(prefix, count) {
  return Array.from({ length: count }, (_, i) => {
    const el = $(`${prefix}${i + 1}`);
    if (!el) return null;
    return el.value === "" ? null : Number(el.value);
  });
}
function allEmpty(parts){ return parts.every(v => v === null); }
function allFilled(parts){ return parts.every(v => v !== null); }
function sumParts(parts){ return parts.reduce((a, b) => a + b, 0); }

function syncPartTotals() {
  const lp = readParts("listeningPart", 4);
  const rp = readParts("readingPart", 3);
  if (allFilled(lp)) $("listeningWrong").value = sumParts(lp);
  if (allFilled(rp)) $("readingWrong").value = sumParts(rp);
  showLiveScores();
}

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
  $("practiceDays").textContent=new Set(records.filter(x=>x.speaking||x.task1Done||x.task2Done||x.writing).map(x=>x.date)).size;
}

function renderHistory(){
  const sorted=[...records].sort((a,b)=>b.date.localeCompare(a.date));
  $("recordCount").textContent=`${records.length} record${records.length===1?"":"s"}`;
  if(!sorted.length){$("historyBody").innerHTML='<tr><td colspan="8" class="empty-row">No records yet. Add your first practice above.</td></tr>';return;}
  $("historyBody").innerHTML=sorted.map(x=>{
    const l=x.listeningWrong!==null?`<span class="band">${bandFromWrong(x.listeningWrong,"L").toFixed(1)}</span> <small>(${x.listeningWrong} wrong${partsText(x.listeningParts)})</small>`:"—";
    const r=x.readingWrong!==null?`<span class="band">${bandFromWrong(x.readingWrong,"R").toFixed(1)}</span> <small>(${x.readingWrong} wrong${partsText(x.readingParts)})</small>`:"—";
    
    // === 修复大小作文联动的 BUG ===
    // 完全依赖自己的字段，不再依赖旧的 writing 字段
    const t1Done = !!x.task1Done;
    const t2Done = !!x.task2Done;
    
    const t1=t1Done?`<span class="status">✓ ${escapeHTML(x.task1Type||"Done")}</span>${x.task1Note?`<small class="topic-note">${escapeHTML(x.task1Note)}</small>`:""}`:"—";
    const t2=t2Done?`<span class="status">✓ ${escapeHTML(x.task2Type||"Done")}</span>${x.task2Note?`<small class="topic-note">${escapeHTML(x.task2Note)}</small>`:""}`:"—";
    return `<tr><td>${formatDate(x.date)}</td><td>${escapeHTML(x.testName||"Practice")}</td><td>${l}</td><td>${r}</td><td>${x.speaking?'<span class="status">✓ Done</span>':"—"}</td><td>${t1}</td><td>${t2}</td><td><button class="delete-btn" data-delete="${x.id}" aria-label="Delete record">×</button></td></tr>`;
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

async function uploadRecord(record){
  if(!currentUser || !sb) return;
  const { error } = await sb.from("records").upsert({
    user_id: currentUser.id,
    id: String(record.id),
    data: record,
    updated_at: record.updatedAt || Date.now(),
    deleted: false
  }, { onConflict: "user_id,id" });
  if (error) $("syncStatus").textContent = "同步失败：" + error.message;
  else $("syncStatus").textContent = "已同步";
}

async function deleteRecord(id){
  if(!confirm("Delete this saved record?"))return;
  records=records.filter(x=>String(x.id)!==String(id));
  saveRecords(); render();
  if(currentUser && sb){
    await sb.from("records").upsert({
      user_id: currentUser.id,
      id: String(id),
      data: {},
      updated_at: Date.now(),
      deleted: true
    }, { onConflict: "user_id,id" });
  }
}

$("entryForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const lp = readParts("listeningPart", 4);
  const rp = readParts("readingPart", 3);
  if(!allEmpty(lp) && !allFilled(lp)){alert("Listening 分项要么全部填写，要么全部留空。");return;}
  if(!allEmpty(rp) && !allFilled(rp)){alert("Reading 分项要么全部填写，要么全部留空。");return;}

  const l = allFilled(lp) ? String(sumParts(lp)) : $("listeningWrong").value;
  const r = allFilled(rp) ? String(sumParts(rp)) : $("readingWrong").value;
  if(!validScore(l)||!validScore(r)){alert("Please enter whole numbers from 0 to 40.");return;}

  const task1Done=$("task1Done").checked, task2Done=$("task2Done").checked;
  if(task1Done && !$("task1Type").value){alert("Please select the Task 1 question type.");$("task1Type").focus();return;}
  if(task2Done && !$("task2Type").value){alert("Please select the Task 2 essay type.");$("task2Type").focus();return;}

  const record={
    id: editingId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: $("date").value,
    testName: $("testName").value.trim(),
    listeningWrong: l===""?null:Number(l),
    readingWrong: r===""?null:Number(r),
    listeningParts: allFilled(lp) ? lp : null,
    readingParts: allFilled(rp) ? rp : null,
    speaking: $("speaking").checked,
    task1Done,
    task1Type: task1Done ? $("task1Type").value : "",
    task1Note: task1Done ? $("task1Note").value.trim() : "",
    task2Done,
    task2Type: task2Done ? $("task2Type").value : "",
    task2Note: task2Done ? $("task2Note").value.trim() : "",
    notes: $("notes").value.trim(),
    writing: task1Done || task2Done, // 保留这个用于统计 Practice Days
    updatedAt: Date.now()
  };

  const index=records.findIndex(x=>String(x.id)===String(record.id));
  if(index>=0) records[index]=record; else records.push(record);
  saveRecords();
  render();
  await uploadRecord(record);
  $("formMessage").textContent="Record saved on this device.";
  resetForm();
});

$("entryForm").addEventListener("reset",()=>setTimeout(()=>{editingId=null;$("date").value=todayISO();showLiveScores();},0));
$("listeningWrong").addEventListener("input",showLiveScores);
$("readingWrong").addEventListener("input",showLiveScores);

for(let i=1;i<=4;i++){ const el=$(`listeningPart${i}`); if(el) el.addEventListener("input", syncPartTotals); }
for(let i=1;i<=3;i++){ const el=$(`readingPart${i}`); if(el) el.addEventListener("input", syncPartTotals); }

$("exportButton").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({app:"IELTS Tracker",version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`ielts-tracker-backup-${todayISO()}.json`;a.click();URL.revokeObjectURL(url);
});

$("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    const incoming=Array.isArray(data)?data:data.records;
    if(!Array.isArray(incoming))throw new Error("Invalid backup");
    if(!confirm(`Import ${incoming.length} records? Records with matching IDs will be replaced.`))return;
    const map=new Map(records.map(x=>[String(x.id),x]));
    incoming.forEach(x=>{ if(x&&x.date&&x.id!==undefined){ x.updatedAt=Date.now(); map.set(String(x.id),x); } });
    records=[...map.values()];
    saveRecords(); render();
    if(currentUser) await syncAll();
    alert("Backup imported.");
  }
  catch(err){alert("Could not read this backup file.");}
  finally{e.target.value="";}
});

// ====== 登录与同步 ======
function updateAuthUI(){
  if(!$("loginBtn")) return;
  const loggedIn = !!currentUser;
  $("loginBtn").hidden = loggedIn;
  $("logoutBtn").hidden = !loggedIn;
  $("emailInput").hidden = loggedIn;
  
  if(loggedIn) {
    $("syncStatus").textContent = `已登录：${currentUser.email}`;
    $("emailOtp").hidden = true;
    $("verifyBtn").hidden = true;
  } else {
    $("syncStatus").textContent = sb ? "未登录：只保存在本机" : "未配置云端同步";
  }
}

async function syncAll(){
  if(!currentUser || !sb) return;
  const { data: cloud, error } = await sb.from("records").select("*");
  if(error){ $("syncStatus").textContent = "同步失败：" + error.message; return; }

  const cloudMap = new Map(cloud.map(r => [String(r.id), r]));
  const localMap = new Map(records.map(r => [String(r.id), { ...r, updatedAt: r.updatedAt || 0 }]));

  for(const [id, cr] of cloudMap){
    const lr = localMap.get(id);
    if(cr.deleted){
      if(!lr || (cr.updated_at || 0) >= (lr.updatedAt || 0)) localMap.delete(id);
      continue;
    }
    if(!lr || (cr.updated_at || 0) > (lr.updatedAt || 0)){
      localMap.set(id, { ...(cr.data || {}), id, updatedAt: cr.updated_at || 0 });
    }
  }

  const upserts = [];
  for(const [id, r] of localMap){
    const cr = cloudMap.get(id);
    if(!cr || (r.updatedAt || 0) > (cr.updated_at || 0)){
      const rec = { ...r, updatedAt: r.updatedAt || Date.now() };
      localMap.set(id, rec);
      upserts.push({
        user_id: currentUser.id,
        id,
        data: rec,
        updated_at: rec.updatedAt,
        deleted: false
      });
    }
  }

  if(upserts.length){
    const { error: upErr } = await sb.from("records").upsert(upserts, { onConflict: "user_id,id" });
    if(upErr){ $("syncStatus").textContent = "同步失败：" + upErr.message; return; }
  }

  records = [...localMap.values()];
  saveRecords();
  render();
  $("syncStatus").textContent = "已同步";
}

async function initAuth(){
  if(!sb){ updateAuthUI(); return; }
  const { data } = await sb.auth.getSession();
  currentUser = data.session?.user || null;
  updateAuthUI();
  if(currentUser) await syncAll();

  sb.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
    if(currentUser) await syncAll();
  });
}

// 发送验证码
$("loginBtn")?.addEventListener("click", async () => {
  if(!sb){ alert("还没有配置云端同步，请先填写 app.js 顶部的两个 Supabase 值。"); return; }
  const email = $("emailInput").value.trim();
  if(!email){ alert("请输入邮箱"); return; }
  
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  
  if(error) {
    alert(error.message);
  } else {
    alert("验证码已发送到你的邮箱，请查收（如果没看到，请检查垃圾邮件）。");
    $("emailInput").hidden = true;
    $("loginBtn").hidden = true;
    $("emailOtp").hidden = false;
    $("verifyBtn").hidden = false;
    $("syncStatus").textContent = "等待输入验证码...";
  }
});

// 验证 6 位验证码
$("verifyBtn")?.addEventListener("click", async () => {
  const email = $("emailInput").value.trim();
  const token = $("emailOtp").value.trim();
  if(!token || token.length !== 6){ alert("请输入完整的 6 位数字验证码"); return; }
  
  $("verifyBtn").textContent = "验证中...";
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: 'email' });
  
  if(error) {
    alert("验证失败：" + error.message);
    $("verifyBtn").textContent = "验证并登录";
  } else {
    $("verifyBtn").textContent = "验证并登录";
  }
});

// 退出登录
$("logoutBtn")?.addEventListener("click", async () => {
  if(sb) await sb.auth.signOut();
  currentUser = null;
  $("emailInput").hidden = false;
  $("loginBtn").hidden = false;
  $("emailOtp").hidden = true;
  $("verifyBtn").hidden = true;
  $("emailOtp").value = "";
  updateAuthUI();
});

$("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
$("date").value=todayISO();
render();
showLiveScores();
initAuth();

if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
