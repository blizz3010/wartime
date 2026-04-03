// ===== NEWS FEED (Redesigned) =====
const TOTAL_FEEDS=10; // Number of RSS feeds aggregated server-side

// Category classification for news items
const NEWS_CATEGORIES={
  strikes:{label:'STRIKES',cls:'cat-strikes',keywords:['strike','bomb','attack','airstrike','missile','intercept','shot down','explosion','blast','shelling','raid']},
  military:{label:'MILITARY',cls:'cat-military',keywords:['military','troops','deploy','army','navy','irgc','pentagon','aircraft carrier','fighter jet','drone','forces','battalion','regiment','base']},
  diplomacy:{label:'DIPLOMACY',cls:'cat-diplomacy',keywords:['diplomacy','negotiate','ceasefire','summit','UN','united nations','sanction','treaty','talks','resolution','ambassador','envoy']},
  maritime:{label:'MARITIME',cls:'cat-maritime',keywords:['hormuz','strait','vessel','ship','tanker','blockade','naval','maritime','port','gulf','carrier']},
  nuclear:{label:'NUCLEAR',cls:'cat-nuclear',keywords:['nuclear','uranium','enrichment','centrifuge','IAEA','atomic','natanz','fordow']},
  humanitarian:{label:'HUMANITARIAN',cls:'cat-humanitarian',keywords:['civilian','refugee','humanitarian','aid','casualt','dead','killed','wounded','hospital','evacuate','displaced']},
  oil:{label:'OIL/ENERGY',cls:'cat-oil',keywords:['oil','crude','brent','opec','pipeline','refinery','energy','barrel','petroleum']},
};

function categorizeArticle(title,desc){
  const text=(title+' '+(desc||'')).toLowerCase();
  for(const[key,cat] of Object.entries(NEWS_CATEGORIES)){
    if(cat.keywords.some(k=>text.includes(k))) return {key,label:cat.label,cls:cat.cls};
  }
  return null;
}

let allFilteredNews=[];
let currentNewsFilter='all';
let compactNewsView=false;

// Fetch all news from server-side aggregator (single request, CDN-cached 5 min)
async function fetchAllNews(){
  const res=await fetch('/api/news');
  if(!res.ok) throw new Error('API returned '+res.status);
  return await res.json();
}

const MAJOR_KEYWORDS=['strike','attack','bomb','missile','killed','dead','explosion','retaliation','nuclear','invasion','ceasefire','surrender','shot down','intercept','sanctions','blockade','evacuate','casualt'];

async function fetchNews(forceRefresh=false){
  const refreshBtns=document.querySelectorAll('.refresh-btn');
  refreshBtns.forEach(b=>b.classList.add('spinning'));

  const containers=['newsFeed','newsFeedFull'];
  containers.forEach(id=>{
    const el=document.getElementById(id);
    if(el&&(!allFilteredNews.length||forceRefresh)) el.innerHTML='<div class="loading"><div class="spinner"></div>Fetching latest news...</div>';
  });

  try{
    // Single API call — server fetches all 10 feeds, deduplicates, caches on CDN for 5 min
    const data=await fetchAllNews();
    // Map source names to CSS classes
    const clsMap={'Al Jazeera':'src-aljazeera','BBC':'src-bbc','Reuters':'src-reuters','NPR':'src-npr','CNN':'src-cnn','Guardian':'src-guardian','JPost':'src-jpost','Times of Israel':'src-toi','FOX':'src-fox','NBC':'src-nbc'};
    const items=(data.items||[]).map(i=>({...i,sourceCls:clsMap[i.sourceName]||''}));
    processNewsItems(items,data.feedCount||0);
  }catch(e){
    console.error('News fetch failed:',e);
    // Show error state if no cached data
    if(!allFilteredNews.length){
      containers.forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.innerHTML='<div style="padding:20px;font-family:var(--mono);font-size:.7rem;color:var(--text3)">Failed to load news. Click REFRESH to retry.</div>';
      });
    }
  }
  refreshBtns.forEach(b=>b.classList.remove('spinning'));
}

function processNewsItems(allItems,feedCount=0){
  // Deduplicate by normalized title
  const seen=new Set();
  allItems=allItems.filter(item=>{
    const key=item.title.toLowerCase().replace(/\s+/g,' ').trim();
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Server already filters for relevance — just sort by date
  let filtered=[...allItems];
  filtered.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));

  // Categorize each article
  filtered=filtered.slice(0,80).map(item=>({
    ...item,
    category:categorizeArticle(item.title,item.description),
  }));

  allFilteredNews=filtered;

  // Render both feeds (overview sidebar + full news panel)
  renderNewsFeed('newsFeed',filtered.slice(0,40));
  renderNewsFeed('newsFeedFull',filtered);

  // Update stats bar
  const breakingCount=filtered.filter(i=>i.title.toLowerCase().includes('breaking')).length;
  const majorCount=filtered.filter(i=>MAJOR_KEYWORDS.some(k=>i.title.toLowerCase().includes(k))).length;
  if(!feedCount) feedCount=TOTAL_FEEDS; // default for cached items
  const statTotal=document.getElementById('newsStatTotal');
  const statBreaking=document.getElementById('newsStatBreaking');
  const statMajor=document.getElementById('newsStatMajor');
  const statSources=document.getElementById('newsStatSources');
  if(statTotal) statTotal.textContent=filtered.length;
  if(statBreaking) statBreaking.textContent=breakingCount;
  if(statMajor) statMajor.textContent=majorCount;
  if(statSources) statSources.textContent=`${feedCount}/${TOTAL_FEEDS}`;

  const updatedTime=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
  const updatedText=`Updated ${updatedTime} · ${filtered.length} items · ${feedCount}/${TOTAL_FEEDS} feeds`;
  document.querySelectorAll('.news-updated').forEach(el=>el.textContent=updatedText);

  // Update breaking news marquee
  const breaking=filtered.filter(i=>i.title.toLowerCase().includes('breaking')).slice(0,8);
  const marqueeBar=document.getElementById('marqueeBar');
  const marqueeText=document.getElementById('marqueeText');
  if(breaking.length>0){
    marqueeText.textContent=breaking.map(i=>'>>> '+i.title).join('     ');
    marqueeBar.style.display='flex';
  }else{
    const urgent=filtered.filter(i=>MAJOR_KEYWORDS.some(k=>i.title.toLowerCase().includes(k))).slice(0,5);
    if(urgent.length>0){
      marqueeText.textContent=urgent.map(i=>'>>> '+i.title).join('     ');
      marqueeBar.style.display='flex';
    }else{
      marqueeBar.style.display='none';
    }
  }

  checkForNewBreaking(filtered);

  // Auto-update dashboard indicators based on news scoring
  const scores=computeDashboardScores(filtered);
  updateDashboardIndicators(scores);

  lastSeenCounts.news=filtered.length;
}

function renderNewsFeed(containerId,items){
  const el=document.getElementById(containerId);
  if(!el) return;

  // Apply current filter
  let display=items;
  if(currentNewsFilter==='breaking'){
    display=items.filter(i=>i.title.toLowerCase().includes('breaking'));
  }else if(currentNewsFilter!=='all'){
    display=items.filter(i=>i.category&&i.category.key===currentNewsFilter);
  }
  // Apply search query
  if(newsSearchQuery){
    display=display.filter(i=>{
      const text=(i.title+' '+(i.description||'')+' '+(i.sourceName||'')).toLowerCase();
      return text.includes(newsSearchQuery);
    });
  }

  // For the full news feed panel, clicking loads in article reader; for overview sidebar, opens in new tab
  const useReader=containerId==='newsFeedFull';

  const html=display.map(item=>{
    const time=timeAgo(new Date(item.pubDate));
    const isBreaking=item.title.toLowerCase().includes('breaking');
    const catHtml=item.category?`<span class="news-category ${item.category.cls}">${item.category.label}</span>`:'';
    const snippet=item.description?stripHtml(item.description).slice(0,160):'';
    const safeLink=escAttr(safeUrl(item.link));
    const clickAction=useReader
      ?`loadArticle('${safeLink}')`
      :`openLink('${safeLink}')`;
    return `
      <div class="news-item${compactNewsView?' compact':''}" tabindex="0" onclick="${clickAction}" onkeydown="if(event.key==='Enter')${clickAction}">
        <div class="news-meta">
          <span class="news-source ${item.sourceCls||'src-default'}">${item.sourceName||'NEWS'}</span>
          ${catHtml}
          <span class="news-time">${time}</span>
        </div>
        <div class="news-title">${isBreaking?'<span class="breaking-tag">BREAKING</span>':''}${escHtml(item.title)}</div>
        ${snippet?`<div class="news-snippet">${escHtml(snippet)}</div>`:''}
      </div>
    `;
  }).join('');

  el.innerHTML=html||'<div class="loading">No items match this filter. Try another category.</div>';
}

function loadArticle(url){
  if(!url) return;
  const reader=document.getElementById('articleReader');
  const extBtn=document.getElementById('articleExternalBtn');
  if(reader){
    reader.innerHTML=`<iframe src="${escAttr(url)}" style="width:100%;height:100%;border:0" sandbox="allow-scripts allow-same-origin allow-popups" loading="lazy"></iframe>`;
  }
  if(extBtn){
    extBtn.style.display='inline-block';
    extBtn.setAttribute('onclick',`openLink('${escAttr(url)}')`);
  }
}

function filterNews(filter){
  currentNewsFilter=filter;
  document.querySelectorAll('#newsSourceTabs .news-filter-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.src===filter);
  });
  renderNewsFeed('newsFeedFull',allFilteredNews);
}

function toggleNewsView(){
  compactNewsView=!compactNewsView;
  const btn=document.getElementById('newsViewToggle');
  btn.textContent=compactNewsView?'EXPANDED':'COMPACT';
  renderNewsFeed('newsFeedFull',allFilteredNews);
  renderNewsFeed('newsFeed',allFilteredNews.slice(0,40));
}

// ===== SCORING WEIGHTS & DASHBOARD =====
const SCORING_WEIGHTS={
  // Threat Level keywords (higher = more escalatory)
  escalation:{
    'nuclear strike':50,'nuclear weapon':45,'nuclear attack':45,'tactical nuke':50,
    'world war':40,'wmd':40,'chemical weapon':35,'biological weapon':35,
    'full-scale invasion':35,'total war':35,'declaration of war':30,
    'martial law':25,'mass mobilization':25,'general mobilization':25,
    'retaliation':20,'retaliatory':20,'escalat':18,'intensif':15,
    'major offensive':20,'ground invasion':25,'amphibious':20,
    'massive strike':20,'carpet bomb':25,'indiscriminate':20,
  },
  deescalation:{
    'ceasefire':30,'peace talk':25,'negotiate':20,'de-escalat':25,
    'diplomatic':15,'humanitarian corridor':20,'stand down':25,
    'withdrawal':20,'retreat':15,'surrender':30,'armistice':30,
    'truce':25,'peace deal':30,'accord':20,'resolution passed':20,
  },
  hormuzTraffic:{
    'hormuz open':40,'strait reopen':40,'shipping resumes':35,'transit resumes':35,
    'vessels transit':25,'ships passing':25,'tanker through':20,'convoy escort':20,
    'limited transit':15,'naval escort':15,'merchant vessel':10,'commercial shipping':10,
  },
  hormuzClosed:{
    // Direct closure signals
    'hormuz closed':25,'blockade hormuz':20,'strait blocked':20,'mines hormuz':18,
    'shipping halt':15,'no transit':12,'strait shut':18,'naval mine':12,
    'hormuz block':20,'tanker seized':12,'vessel seized':12,'embargo':8,
    // Contextual — only small weight since they appear in many articles
    'blockade':5,'strait of hormuz':4,'shipping disruption':10,'maritime threat':8,
    'oil transit':3,
  },
  military:{
    // Specific high-value signals
    'carrier deploy':8,'strike group':8,'b-2':6,'stealth bomber':6,
    'tomahawk':6,'cruise missile':8,'ballistic missile':10,'icbm':15,
    'aircraft carrier':6,'submarine':6,'special forces':6,
    'airstrike':6,'bombing':6,'sortie':4,'interception':6,
    'shot down':8,'drone strike':6,'missile launch':8,'air defense':4,
    // Common terms — low weight (appear in most articles during conflict)
    'military':1,'strike':2,'attack':2,'conflict':1,
    'irgc':3,'pentagon':2,'centcom':3,'navy':2,'troops':2,
    'missile':3,'drone':2,'fighter jet':4,'airspace':2,
    'carrier':2,'deploy':2,'combat':2,'operation':1,
  },
};

let lastScoringResult={threat:'CRITICAL',defcon:2,hormuz:'CLOSED',hormuzDesc:'',scores:{}};

function computeDashboardScores(newsItems){
  if(!newsItems||newsItems.length===0) return lastScoringResult;

  let escalationScore=0,deescalationScore=0,hormuzOpenScore=0,hormuzClosedScore=0,militaryScore=0;
  let hormuzMentions=0,hormuzTrafficMentions=0;

  const now=Date.now();

  // Time decay — recent articles carry more weight
  function timeDecay(pubDate){
    const age=now-new Date(pubDate).getTime();
    const hours=age/(1000*60*60);
    if(hours<=6) return 1.0;     // Last 6 hours: full weight
    if(hours<=24) return 0.8;    // Same day: 80%
    if(hours<=48) return 0.5;    // Yesterday: 50%
    if(hours<=72) return 0.3;    // 2-3 days: 30%
    return 0.15;                  // 3+ days: 15%
  }

  // Score all items (use top 50 if no dates available)
  const items=newsItems.slice(0,80);

  items.forEach(item=>{
    const text=((item.title||'')+' '+(item.description||'')).toLowerCase();
    const decay=item.pubDate?timeDecay(item.pubDate):0.5;

    for(const[kw,score] of Object.entries(SCORING_WEIGHTS.escalation)){
      if(text.includes(kw)) escalationScore+=score*decay;
    }
    for(const[kw,score] of Object.entries(SCORING_WEIGHTS.deescalation)){
      if(text.includes(kw)) deescalationScore+=score*decay;
    }
    for(const[kw,score] of Object.entries(SCORING_WEIGHTS.hormuzTraffic)){
      if(text.includes(kw)){hormuzOpenScore+=score*decay;if(score>0)hormuzTrafficMentions++;}
    }
    for(const[kw,score] of Object.entries(SCORING_WEIGHTS.hormuzClosed)){
      if(text.includes(kw)) hormuzClosedScore+=score*decay;
    }
    for(const[kw,score] of Object.entries(SCORING_WEIGHTS.military)){
      if(text.includes(kw)) militaryScore+=score*decay;
    }
    if(text.includes('hormuz')||text.includes('strait')) hormuzMentions++;
  });

  // Round scores for cleaner display
  escalationScore=Math.round(escalationScore);
  deescalationScore=Math.round(deescalationScore);
  hormuzOpenScore=Math.round(hormuzOpenScore);
  hormuzClosedScore=Math.round(hormuzClosedScore);
  militaryScore=Math.round(militaryScore);

  // --- THREAT LEVEL ---
  // Military contributes less (it's always high during a war); escalation keywords are the real signal
  const netEscalation=escalationScore-deescalationScore+militaryScore*0.15;
  let threat,threatClass,threatSub;
  if(netEscalation>=200){threat='MAXIMUM';threatClass='red tick-critical';threatSub='ACTIVE NUCLEAR/WMD ESCALATION';}
  else if(netEscalation>=60){threat='CRITICAL';threatClass='red tick-critical';threatSub='HIGH ESCALATION SIGNALS';}
  else if(netEscalation>=30){threat='SEVERE';threatClass='red';threatSub='ELEVATED CONFLICT ACTIVITY';}
  else if(netEscalation>=10){threat='HIGH';threatClass='orange';threatSub='SIGNIFICANT MILITARY OPS';}
  else if(netEscalation>=0){threat='ELEVATED';threatClass='orange';threatSub='ONGOING TENSIONS';}
  else{threat='GUARDED';threatClass='green';threatSub='DE-ESCALATION SIGNALS';}

  // --- DEFCON ---
  // Separate calculation — only jumps to 1 on nuclear/WMD signals, not routine military activity
  const defconScore=escalationScore-deescalationScore*0.5+militaryScore*0.1;
  let defcon,defconSub;
  if(defconScore>=180){defcon=1;defconSub='MAXIMUM READINESS';}
  else if(defconScore>=40){defcon=2;defconSub='ARMED FORCES READY';}
  else if(defconScore>=20){defcon=3;defconSub='INCREASE READINESS';}
  else if(defconScore>=8){defcon=4;defconSub='ABOVE NORMAL READINESS';}
  else{defcon=5;defconSub='NORMAL READINESS';}

  // --- STRAIT OF HORMUZ ---
  // Separate from military scoring — only cares about shipping/transit keywords
  // During an active conflict, default assumption is near-closed unless open signals appear
  const hormuzNet=hormuzOpenScore-hormuzClosedScore;
  let hormuzStatus,hormuzStatusClass,hormuzSub;
  if(hormuzNet>=60){
    hormuzStatus='OPEN';hormuzStatusClass='green';hormuzSub='NORMAL TRAFFIC FLOW';
  }else if(hormuzNet>=30){
    hormuzStatus='RESTRICTED';hormuzStatusClass='blue';hormuzSub='LIMITED CONVOY TRANSIT';
  }else if(hormuzNet>=0&&hormuzTrafficMentions>=3){
    hormuzStatus='MINIMAL TRAFFIC';hormuzStatusClass='orange tick-pulse';hormuzSub='SPORADIC TRANSITS W/ ESCORT';
  }else if(hormuzNet>=-30||(hormuzMentions>0&&hormuzClosedScore<60)){
    hormuzStatus='NEAR CLOSED';hormuzStatusClass='orange tick-pulse';hormuzSub='RARE TRANSITS · HIGH RISK';
  }else{
    hormuzStatus='CLOSED';hormuzStatusClass='red tick-pulse';hormuzSub='NO COMMERCIAL TRAFFIC';
  }

  const result={
    threat,threatClass,threatSub,
    defcon,defconSub,
    hormuz:hormuzStatus,hormuzClass:hormuzStatusClass,hormuzSub,
    scores:{escalation:escalationScore,deescalation:deescalationScore,military:militaryScore,hormuzOpen:hormuzOpenScore,hormuzClosed:hormuzClosedScore}
  };
  lastScoringResult=result;
  return result;
}

function updateDashboardIndicators(scores){
  // Threat Level
  const threatEl=document.getElementById('tickThreat');
  const threatSub=document.getElementById('tickThreatSub');
  if(threatEl){
    threatEl.textContent=scores.threat;
    threatEl.className='tick-value '+scores.threatClass;
  }
  if(threatSub) threatSub.textContent=scores.threatSub||'';

  // DEFCON
  const defconEl=document.getElementById('tickDefcon');
  const defconSub=document.getElementById('tickDefconSub');
  if(defconEl){
    defconEl.textContent='LEVEL '+scores.defcon;
    defconEl.className='tick-value '+(scores.defcon<=2?'red tick-critical':scores.defcon<=3?'orange':'green');
  }
  if(defconSub) defconSub.textContent=scores.defconSub||'';

  // Strait of Hormuz
  const hormuzEl=document.getElementById('tickHormuzVal');
  const hormuzSub=document.getElementById('tickHormuzSub');
  if(hormuzEl){
    hormuzEl.textContent=scores.hormuz;
    hormuzEl.className='tick-value '+scores.hormuzClass;
  }
  if(hormuzSub) hormuzSub.textContent=scores.hormuzSub||'';
}

// ===== NEWS SEARCH =====
let newsSearchQuery='';
function searchNews(query){
  newsSearchQuery=query.toLowerCase().trim();
  renderNewsFeed('newsFeedFull',allFilteredNews);
}
