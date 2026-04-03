// ===== REDDIT JSON HELPER =====
async function fetchRedditJSON(url){
  try{
    const res=await fetch(url,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(10000)});
    if(!res.ok) return null;
    return await res.json();
  }catch(e){return null;}
}

// ===== DAY COUNTER =====
function updateDayCount(){
  const start=new Date('2026-02-28T00:00:00Z');
  const now=new Date();
  const days=Math.floor((now-start)/(1000*60*60*24))+1;
  document.getElementById('dayCount').textContent=days;
}

// ===== CLOCK =====
function updateClock(){
  const now=new Date();
  document.getElementById('clock').textContent=
    now.toUTCString().split(' ')[4]+' UTC';
  // Tehran (IRST = UTC+3:30)
  const tehran=document.getElementById('tehranTime');
  if(tehran) tehran.textContent=now.toLocaleTimeString('en-US',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hour12:false});
  // Tel Aviv (IST = UTC+2 / IDT = UTC+3)
  const tlv=document.getElementById('tlvTime');
  if(tlv) tlv.textContent=now.toLocaleTimeString('en-US',{timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit',hour12:false});
  // Washington DC (EST = UTC-5 / EDT = UTC-4)
  const dc=document.getElementById('dcTime');
  if(dc) dc.textContent=now.toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false});
}

// ===== UTILITIES =====
function timeAgo(date){
  const s=Math.floor((new Date()-date)/1000);
  if(s<60)return 'just now';
  if(s<3600)return Math.floor(s/60)+'m ago';
  if(s<86400)return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function formatDuration(sec){
  if(!sec)return '';
  const m=Math.floor(sec/60),s=sec%60;
  return m+':'+String(s).padStart(2,'0');
}
function escHtml(str){
  const d=document.createElement('div');d.textContent=str||'';return d.innerHTML;
}
function escAttr(str){
  return (str||'').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function safeUrl(url){
  try{const u=new URL(url);return['http:','https:'].includes(u.protocol)?u.href:'';}catch(e){return '';}
}
function openLink(url){window.open(url,'_blank','noopener,noreferrer')}
function stripHtml(html){
  const d=document.createElement('div');d.innerHTML=html;return d.textContent||'';
}

// ===== BREAKING NEWS SOUND ALERT =====
let alertSoundEnabled=false;
let previousBreakingTitles=new Set();

// Generate alert tone using Web Audio API
function playAlertTone(){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    // Three-tone alert
    [880,1100,880].forEach((freq,i)=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type='square';osc.frequency.value=freq;
      gain.gain.value=0.08;
      osc.start(ctx.currentTime+i*0.15);
      osc.stop(ctx.currentTime+i*0.15+0.12);
    });
  }catch(e){}
}

function toggleAlertSound(){
  alertSoundEnabled=!alertSoundEnabled;
  const btn=document.getElementById('toggleSound');
  btn.classList.toggle('active',alertSoundEnabled);
  btn.innerHTML=alertSoundEnabled?'&#128264; ALERTS ON':'&#128264; ALERTS';
  if(alertSoundEnabled) playAlertTone(); // test tone on enable
}

function checkForNewBreaking(items){
  if(!alertSoundEnabled) return;
  const breaking=items.filter(i=>i.title.toLowerCase().includes('breaking'));
  let hasNew=false;
  breaking.forEach(b=>{
    const key=b.title.toLowerCase().trim();
    if(!previousBreakingTitles.has(key)){
      previousBreakingTitles.add(key);
      hasNew=true;
    }
  });
  if(hasNew&&previousBreakingTitles.size>breaking.length) playAlertTone();
}

// ===== NOTIFICATION BADGES =====
let lastSeenCounts={news:0,videos:0};
let currentPanel='overview';

function updateBadge(panel,count){
  const tab=document.querySelector(`[data-panel="${panel}"]`);
  if(!tab) return;
  // Remove existing badge
  const old=tab.querySelector('.tab-badge');
  if(old) old.remove();
  // Add new badge if count > 0 and not currently viewing that panel
  if(count>0&&currentPanel!==panel){
    const badge=document.createElement('span');
    badge.className='tab-badge';
    badge.textContent=count>99?'99+':count;
    tab.appendChild(badge);
  }
}

// ===== NIGHT OPS THEME =====
function toggleNightOps(){
  document.documentElement.classList.toggle('night-ops');
  const btn=document.getElementById('toggleNightOps');
  const isOn=document.documentElement.classList.contains('night-ops');
  btn.classList.toggle('active',isOn);
  btn.innerHTML=isOn?'&#127761; NV ON':'&#127761; NV';
  localStorage.setItem('nightOps',isOn?'1':'0');
}

// ===== VIDEO MODAL =====
function playModal(videoId){
  document.getElementById('modalFrame').src=`https://www.youtube.com/embed/${videoId}?autoplay=1`;
  document.getElementById('videoModal').classList.add('show');
}
function closeModal(){
  document.getElementById('modalFrame').src='';
  document.getElementById('videoModal').classList.remove('show');
}

// ===== KEYBOARD SHORTCUT HINT =====
// The `?` key toggles the kbd-hint element visibility.
// Handled in the keydown listener below in the INIT section.

// ===== TICKER DETAIL PANEL HELPERS =====

// ===== CARRIER GROUP DETAIL PANEL =====
const CARRIER_GROUPS=[
  {
    name:'USS Gerald R. Ford (CVN-78)',hull:'CVN-78 · Gerald R. Ford-class',
    status:'DEPLOYED — Persian Gulf',statusColor:'var(--blue)',
    img:'https://upload.wikimedia.org/wikipedia/commons/b/b2/USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG',
    link:'https://www.airlant.usff.navy.mil/cvn78/',
    items:[
      {label:'Air Wing',val:'CVW-8 (~75 aircraft)'},
      {label:'F/A-18E/F Super Hornets',val:'44 aircraft'},
      {label:'F-35C Lightning II',val:'10 aircraft'},
      {label:'EA-18G Growler (EW)',val:'5 aircraft'},
      {label:'E-2D Hawkeye (AEW)',val:'4 aircraft'},
      {label:'Escorts',val:'CG-56, DDG-105, DDG-110, DDG-61'},
      {label:'Location',val:'Central Persian Gulf'},
      {label:'Mission',val:'Strike ops / Air superiority'},
    ]
  },
  {
    name:'USS Abraham Lincoln (CVN-72)',hull:'CVN-72 · Nimitz-class',
    status:'DEPLOYED — Gulf of Oman',statusColor:'var(--blue)',
    img:'https://upload.wikimedia.org/wikipedia/commons/d/db/USS_Abraham_Lincoln_%28CVN-72%29_underway_in_the_Atlantic_Ocean_on_30_January_2019_%28190130-N-PW716-1312%29.JPG',
    link:'https://www.airlant.usff.navy.mil/cvn72/',
    items:[
      {label:'Air Wing',val:'CVW-9 (~70 aircraft)'},
      {label:'F/A-18E/F Super Hornets',val:'44 aircraft'},
      {label:'EA-18G Growler (EW)',val:'5 aircraft'},
      {label:'E-2D Hawkeye (AEW)',val:'4 aircraft'},
      {label:'Escorts',val:'CG-57, DDG-89, DDG-100, DDG-114'},
      {label:'Location',val:'Gulf of Oman / Arabian Sea'},
      {label:'Mission',val:'Hormuz security / ISR'},
    ]
  },
  {
    name:'USS Theodore Roosevelt (CVN-71)',hull:'CVN-71 · Nimitz-class',
    status:'DEPLOYED — Eastern Mediterranean',statusColor:'var(--blue)',
    img:'https://upload.wikimedia.org/wikipedia/commons/0/04/USS_Theodore_Roosevelt_%28CVN-71%29_underway_the_Pacific_Ocean_on_30_April_2017.JPG',
    link:'https://www.surfor.usff.navy.mil/cvn71/',
    items:[
      {label:'Air Wing',val:'CVW-11 (~70 aircraft)'},
      {label:'F/A-18E/F Super Hornets',val:'44 aircraft'},
      {label:'EA-18G Growler (EW)',val:'5 aircraft'},
      {label:'E-2D Hawkeye (AEW)',val:'4 aircraft'},
      {label:'Escorts',val:'CG-52, DDG-75, DDG-91, DDG-112'},
      {label:'Location',val:'Eastern Mediterranean'},
      {label:'Mission',val:'Hezbollah deterrence / Lebanon'},
    ]
  },
];

let carrierPanelOpen=false;
function toggleCarrierPanel(){
  const panel=document.getElementById('carrierPanel');
  // Close ticker detail if open
  if(activeTickerDetail){document.getElementById('tickerDetailPanel').classList.remove('show');activeTickerDetail=null;}
  carrierPanelOpen=!carrierPanelOpen;
  if(carrierPanelOpen){
    renderCarrierPanel();
    panel.classList.add('show');
  }else{
    panel.classList.remove('show');
  }
}

function renderCarrierPanel(){
  const inner=document.getElementById('carrierPanelInner');
  inner.innerHTML=CARRIER_GROUPS.map(csg=>`
    <div class="carrier-card">
      <img src="${csg.img}" alt="${csg.name}" class="carrier-card-img" loading="lazy" onerror="this.style.display='none'">
      <div class="carrier-card-name">${csg.name}</div>
      <div class="carrier-card-hull">${csg.hull}${csg.link?` · <a href="${csg.link}" target="_blank" style="color:var(--blue);font-size:.55rem">Navy.mil ↗</a>`:''}</div>
      ${csg.items.map(i=>`
        <div class="carrier-card-item">
          <span class="carrier-card-label">${i.label}</span>
          <span class="carrier-card-val">${i.val}</span>
        </div>
      `).join('')}
      <div class="carrier-card-status"><span class="force-status active"></span>${csg.status}</div>
    </div>
  `).join('');
}

// ===== CLICKABLE TICKER DETAIL PANELS =====
// lastScoringResult may be defined by news.js; provide fallback if news.js not loaded
if(typeof lastScoringResult==='undefined') var lastScoringResult={threat:'CRITICAL',defcon:2,hormuz:'CLOSED',hormuzDesc:'',scores:{}};
let activeTickerDetail=null;
function toggleTickerDetail(type){
  const panel=document.getElementById('tickerDetailPanel');
  const inner=document.getElementById('tickerDetailInner');
  // Close carrier panel if open
  if(carrierPanelOpen){toggleCarrierPanel();}
  if(activeTickerDetail===type){
    panel.classList.remove('show');activeTickerDetail=null;return;
  }
  activeTickerDetail=type;
  const s=lastScoringResult.scores||{};
  const details={
    hormuz:{
      title:'⚓ STRAIT OF HORMUZ — STATUS DETAIL',
      html:`
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📊 SCORING DATA</div>
            <div class="carrier-card-item"><span class="carrier-card-label">Traffic Open Signals</span><span class="carrier-card-val">${s.hormuzOpen||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Closure Signals</span><span class="carrier-card-val">${s.hormuzClosed||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Net Score</span><span class="carrier-card-val">${(s.hormuzOpen||0)-(s.hormuzClosed||0)} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Current Status</span><span class="carrier-card-val" style="color:var(--orange)">${lastScoringResult.hormuz||'CLOSED'}</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📐 STATUS LEVELS</div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--text2);line-height:1.8">
              <span style="color:var(--green)">■</span> OPEN — Normal traffic flow<br>
              <span style="color:var(--blue)">■</span> RESTRICTED — Limited convoy transit<br>
              <span style="color:var(--orange)">■</span> MINIMAL TRAFFIC — Sporadic w/ escort<br>
              <span style="color:var(--orange)">■</span> NEAR CLOSED — Rare transits, high risk<br>
              <span style="color:var(--red)">■</span> CLOSED — No commercial traffic
            </div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">ℹ️ CONTEXT</div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--text2);line-height:1.6">
              The Strait of Hormuz handles ~21% of global oil transit (~17M bbl/day). Iran closed the strait on Feb 28. Status is auto-calculated from news mentions of shipping activity, naval escorts, blockade reports, and transit signals.
            </div>
          </div>
        </div>
      `
    },
    oil:{
      title:'🛢️ BRENT CRUDE — MARKET IMPACT',
      html:`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📊 OIL PRICE TIMELINE</div>
            <div class="carrier-card-item"><span class="carrier-card-label">Pre-Conflict (Feb 27)</span><span class="carrier-card-val">~$75/bbl</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Day 1 Spike (Feb 28)</span><span class="carrier-card-val" style="color:var(--red)">$92/bbl (+22%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Hormuz Closure (Mar 1)</span><span class="carrier-card-val" style="color:var(--red)">$105/bbl (+40%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Peak (Mar 7)</span><span class="carrier-card-val" style="color:var(--red)">$115/bbl (+53%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Current Range</span><span class="carrier-card-val" style="color:var(--orange)">$105-115/bbl</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">⚠️ KEY FACTORS</div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--text2);line-height:1.6">
              • Strait of Hormuz closure blocks ~17M bbl/day<br>
              • OPEC emergency meetings ongoing<br>
              • US Strategic Petroleum Reserve releases<br>
              • Global shipping rerouted via Cape of Good Hope<br>
              • Insurance premiums for Gulf tankers 10x normal
            </div>
          </div>
        </div>
      `
    },
    threat:{
      title:'⚠️ THREAT LEVEL — SCORING BREAKDOWN',
      html:`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📊 NEWS ANALYSIS SCORES</div>
            <div class="carrier-card-item"><span class="carrier-card-label">🔴 Escalation Score</span><span class="carrier-card-val" style="color:var(--red)">${s.escalation||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">🟢 De-escalation Score</span><span class="carrier-card-val" style="color:var(--green)">${s.deescalation||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">🟠 Military Activity</span><span class="carrier-card-val" style="color:var(--orange)">${s.military||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Net Escalation</span><span class="carrier-card-val">${(s.escalation||0)-(s.deescalation||0)+(s.military||0)*0.5} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Current Level</span><span class="carrier-card-val" style="color:var(--red)">${lastScoringResult.threat||'CRITICAL'}</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📐 SCALE</div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--text2);line-height:1.8">
              <span style="color:var(--red)">■</span> MAXIMUM — Active nuclear/WMD escalation<br>
              <span style="color:var(--red)">■</span> CRITICAL — High escalation signals<br>
              <span style="color:var(--red)">■</span> SEVERE — Elevated conflict activity<br>
              <span style="color:var(--orange)">■</span> HIGH — Significant military ops<br>
              <span style="color:var(--orange)">■</span> ELEVATED — Ongoing tensions<br>
              <span style="color:var(--green)">■</span> GUARDED — De-escalation signals
            </div>
          </div>
        </div>
      `
    },
    defcon:{
      title:'🎖️ DEFCON — DEFENSE READINESS',
      html:`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📊 SCORING DATA</div>
            <div class="carrier-card-item"><span class="carrier-card-label">Escalation Input</span><span class="carrier-card-val">${s.escalation||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Military Activity</span><span class="carrier-card-val">${s.military||0} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">De-escalation Factor</span><span class="carrier-card-val">-${Math.round((s.deescalation||0)*0.8)} pts</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Current Level</span><span class="carrier-card-val" style="color:var(--red)">DEFCON ${lastScoringResult.defcon||2}</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📐 DEFCON SCALE</div>
            <div style="font-family:var(--mono);font-size:.6rem;color:var(--text2);line-height:1.8">
              <span style="color:var(--red)">■</span> DEFCON 1 — Nuclear war imminent<br>
              <span style="color:var(--red)">■</span> DEFCON 2 — Armed forces ready to deploy in 6hrs<br>
              <span style="color:var(--orange)">■</span> DEFCON 3 — Air Force ready in 15 min<br>
              <span style="color:var(--orange)">■</span> DEFCON 4 — Above normal readiness<br>
              <span style="color:var(--green)">■</span> DEFCON 5 — Normal peacetime readiness
            </div>
          </div>
        </div>
      `
    },
    markets:{
      title:'📈 GLOBAL MARKETS — CONFLICT IMPACT',
      html:`
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:12px">
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">📉 EQUITIES</div>
            <div class="carrier-card-item"><span class="carrier-card-label">S&P 500</span><span class="carrier-card-val" style="color:var(--red)">-12% since Feb 28</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">NASDAQ</span><span class="carrier-card-val" style="color:var(--red)">-15% since Feb 28</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Dow Jones</span><span class="carrier-card-val" style="color:var(--red)">-10% since Feb 28</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">FTSE 100</span><span class="carrier-card-val" style="color:var(--red)">-8%</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Tehran SE (TEDPIX)</span><span class="carrier-card-val" style="color:var(--red)">-45% (halted)</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">🛢️ COMMODITIES</div>
            <div class="carrier-card-item"><span class="carrier-card-label">Brent Crude</span><span class="carrier-card-val" style="color:var(--red)">$105-115 (+40%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">WTI Crude</span><span class="carrier-card-val" style="color:var(--red)">$100-110 (+38%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Natural Gas</span><span class="carrier-card-val" style="color:var(--red)">+25%</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Gold</span><span class="carrier-card-val" style="color:var(--green)">$3,200+ (+8%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Shipping Rates</span><span class="carrier-card-val" style="color:var(--red)">+300%</span></div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--text2);margin-bottom:8px">💱 CURRENCIES</div>
            <div class="carrier-card-item"><span class="carrier-card-label">Iranian Rial</span><span class="carrier-card-val" style="color:var(--red)">Collapsed (-60%)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">USD Index</span><span class="carrier-card-val" style="color:var(--green)">+3% (safe haven)</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Israeli Shekel</span><span class="carrier-card-val" style="color:var(--red)">-8%</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Defense Stocks</span><span class="carrier-card-val" style="color:var(--green)">+20-35%</span></div>
            <div class="carrier-card-item"><span class="carrier-card-label">Oil Majors</span><span class="carrier-card-val" style="color:var(--green)">+15-25%</span></div>
          </div>
        </div>
      `
    },
  };

  const d=details[type];
  if(!d){panel.classList.remove('show');activeTickerDetail=null;return;}
  inner.innerHTML=`<div style="font-family:var(--mono);font-size:.75rem;font-weight:700;color:var(--text);letter-spacing:1px">${d.title}</div>${d.html}`;
  panel.classList.add('show');
}

// ===== NAV HIGHLIGHT (multi-page) =====
function initNavHighlight(currentPage) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if(tab.dataset.panel === currentPage) {
      tab.classList.add('active');
    }
  });
}

// ===== MAP SOURCE SWITCHERS =====
function setMapSrc(url){const f=document.getElementById('warmapFrame');if(f)f.src=url}
function setMaritimeSrc(lat,lon,zoom){
  const f=document.getElementById('maritimeFrame');
  if(f)f.src=`https://www.vesselfinder.com/aismap?lat=${lat}&lon=${lon}&zoom=${zoom}&width=1600&height=900&names=true`;
}
function setAirSrc(url){const f=document.getElementById('airFrame');if(f)f.src=url}

// ===== SUB-PAGE NAVIGATION =====
function showForceSubpage(id){
  document.querySelectorAll('#panel-forces .subpage, main .subpage').forEach(p=>{
    if(p.closest('#panel-forces')||p.closest('[data-page="forces"]')||p.id.startsWith('forces-page-'))p.classList.remove('active');
  });
  document.querySelectorAll('#forcesSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('forces-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#forcesSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
}

function showAssetSubpage(id){
  document.querySelectorAll('#panel-assets .subpage, main .subpage').forEach(p=>{
    if(p.closest('#panel-assets')||p.closest('[data-page="assets"]')||p.id.startsWith('assets-page-'))p.classList.remove('active');
  });
  document.querySelectorAll('#assetsSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('assets-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#assetsSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
}

function showImpactSubpage(id){
  document.querySelectorAll('#panel-impact .subpage, main .subpage').forEach(p=>{
    if(p.closest('#panel-impact')||p.closest('[data-page="impact"]')||p.id.startsWith('impact-page-'))p.classList.remove('active');
  });
  document.querySelectorAll('#impactSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('impact-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#impactSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  // R = refresh current feed
  if(e.key==='r'||e.key==='R'){
    e.preventDefault();
    if(typeof fetchVideos==='function') fetchVideos();
    else if(typeof fetchOsint==='function') fetchOsint();
    else if(typeof fetchNews==='function') fetchNews(true);
  }
  // N = night ops toggle
  if(e.key==='n'||e.key==='N'){e.preventDefault();toggleNightOps()}
  // ? = toggle keyboard shortcut hint
  if(e.key==='?'){
    e.preventDefault();
    const hint=document.getElementById('kbdHint');
    if(hint) hint.classList.toggle('show');
  }
});

// ===== INIT (shared) =====
updateDayCount();
updateClock();
setInterval(updateClock, 1000);
setInterval(updateDayCount, 60000);

// Restore night ops from localStorage
if(localStorage.getItem('nightOps')==='1'){
  document.documentElement.classList.add('night-ops');
  const btn = document.getElementById('toggleNightOps');
  if(btn) { btn.classList.add('active'); btn.innerHTML='&#127761; NV ON'; }
}

// Modal close on overlay click & Escape
const videoModal = document.getElementById('videoModal');
if(videoModal) {
  videoModal.addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
}
document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });
