// ===== OSINT / SOCIAL FEED =====
const OSINT_ACCOUNTS=[
  {sub:'OSINT',queries:['iran OSINT','iran satellite imagery','iran military movement']},
  {sub:'geopolitics',queries:['iran conflict analysis','iran war strategy']},
  {sub:'worldnews',queries:['iran breaking','iran strike','iran military']},
  {sub:'CredibleDefense',queries:['iran','persian gulf','strait of hormuz']},
  {sub:'MiddleEastNews',queries:['iran war','iran conflict']},
];

let allOsintPosts=[];
let currentOsintFilter='all';

function filterOsint(filter){
  currentOsintFilter=filter;
  document.querySelectorAll('[data-osint]').forEach(t=>{
    t.classList.toggle('active',t.dataset.osint===filter);
  });
  renderOsint();
}

async function fetchOsint(){
  const grid=document.getElementById('osintGrid');
  const status=document.getElementById('osintStatus');
  grid.innerHTML='<div class="loading" style="grid-column:1/-1"><div class="spinner"></div>Fetching OSINT sources...</div>';
  status.textContent='Fetching...';

  allOsintPosts=[];

  // Fetch from Reddit via CORS proxy (same helper used by video clips)
  const fetches=OSINT_ACCOUNTS.map(async acc=>{
    for(const q of acc.queries){
      try{
        const url=`https://www.reddit.com/r/${acc.sub}/search.json?q=${encodeURIComponent(q)}&sort=new&t=week&limit=15&restrict_sr=1`;
        const data=await fetchRedditJSON(url);
        if(!data) continue;
        const items=(data?.data?.children||[]).map(c=>c.data);
        items.forEach(p=>{
          const isOsint=acc.sub==='OSINT'||acc.sub==='CredibleDefense'||p.title.toLowerCase().includes('osint')||p.title.toLowerCase().includes('satellite')||p.title.toLowerCase().includes('analysis');
          const isGeopolitics=acc.sub==='geopolitics'||acc.sub==='CredibleDefense';
          allOsintPosts.push({
            id:p.id,
            platform:isOsint?'osint':isGeopolitics?'analysis':'social',
            platformCls:isOsint?'plat-osint':isGeopolitics?'plat-telegram':'plat-twitter',
            platformLabel:isOsint?'OSINT':isGeopolitics?'ANALYSIS':'SOCIAL',
            author:p.author||'unknown',
            handle:'r/'+p.subreddit,
            text:p.title+(p.selftext?' — '+p.selftext.slice(0,200):''),
            url:`https://www.reddit.com${p.permalink}`,
            time:new Date(p.created_utc*1000).toISOString(),
            score:p.score||0,
            comments:p.num_comments||0,
          });
        });
      }catch(e){continue}
    }
  });
  await Promise.allSettled(fetches);

  // Also try fetching OSINT-related RSS feeds as additional sources
  const osintRSSFeeds=[
    {name:'ISW',url:'https://www.understandingwar.org/rss.xml'},
    {name:'CSIS',url:'https://www.csis.org/analysis/feed'},
  ];
  const rssFetches=osintRSSFeeds.map(async feed=>{
    try{
      const proxyUrl=`https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`;
      const res=await fetch(proxyUrl);
      if(!res.ok) return;
      const xml=await res.text();
      const parser=new DOMParser();
      const doc=parser.parseFromString(xml,'text/xml');
      const items=Array.from(doc.querySelectorAll('item')).map(el=>({
        title:el.querySelector('title')?.textContent||'',
        link:el.querySelector('link')?.textContent||'',
        description:el.querySelector('description')?.textContent||'',
        pubDate:el.querySelector('pubDate')?.textContent||'',
      }));
      const iranKw=['iran','tehran','hormuz','persian','irgc','hezbollah','middle east','nuclear','conflict'];
      items.filter(i=>iranKw.some(k=>(i.title||'').toLowerCase().includes(k))).forEach(i=>{
        allOsintPosts.push({
          id:feed.name+'-'+i.title,
          platform:'osint',
          platformCls:'plat-osint',
          platformLabel:'ANALYSIS',
          author:feed.name,
          handle:feed.name,
          text:i.title+(i.description?' — '+stripHtml(i.description).slice(0,200):''),
          url:i.link||'',
          time:i.pubDate?new Date(i.pubDate).toISOString():new Date().toISOString(),
          score:0,
          comments:0,
        });
      });
    }catch(e){}
  });
  await Promise.allSettled(rssFetches);

  // Deduplicate
  const seen=new Set();
  allOsintPosts=allOsintPosts.filter(p=>{
    if(seen.has(p.id)) return false;
    seen.add(p.id);return true;
  });
  allOsintPosts.sort((a,b)=>new Date(b.time)-new Date(a.time));

  status.textContent=`${allOsintPosts.length} posts loaded from ${OSINT_ACCOUNTS.length+osintRSSFeeds.length} sources`;
  renderOsint();
}

function renderOsint(){
  const grid=document.getElementById('osintGrid');
  let posts=allOsintPosts;
  if(currentOsintFilter!=='all') posts=posts.filter(p=>p.platform===currentOsintFilter);

  if(!posts.length){
    grid.innerHTML='<div class="loading" style="grid-column:1/-1">No OSINT posts found. Try refreshing.</div>';
    return;
  }

  grid.innerHTML=posts.slice(0,60).map(p=>`
    <div class="osint-card" onclick="openLink('${escAttr(safeUrl(p.url))}')">
      <div class="osint-header">
        <span class="osint-platform ${p.platformCls}">${p.platformLabel}</span>
        <span class="osint-author">${escHtml(p.author)}</span>
        <span class="osint-handle">${escHtml(p.handle)}</span>
        <span class="news-time" style="margin-left:auto">${timeAgo(new Date(p.time))}</span>
      </div>
      <div class="osint-text">${escHtml(p.text.slice(0,300))}</div>
      <div class="osint-footer">
        <div class="osint-engagement">
          <span>▲ ${p.score}</span>
          <span>💬 ${p.comments}</span>
        </div>
      </div>
    </div>
  `).join('');
}
