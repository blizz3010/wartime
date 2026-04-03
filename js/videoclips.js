let allVideoClips=[];
let currentVideoSource='all';

// Content filter: block memes, parodies, reaction videos, gaming, and off-topic content
const BLOCKED_TITLE_PATTERNS=[
  /parody/i, /meme/i, /downfall/i, /hitler\s*reacts/i, /trump\s*reacts/i,
  /reacts?\s*to/i, /reaction\s*video/i, /funny/i, /comedy/i, /satire/i,
  /gameplay/i, /gaming/i, /lets?\s*play/i, /minecraft/i, /fortnite/i, /gta/i,
  /edit|edits/i, /compilation\s*of\s*memes/i, /shitpost/i, /clickbait/i,
  /prank/i, /challenge/i, /unboxing/i, /asmr/i, /mukbang/i,
];
function isBlockedContent(title){
  if(!title) return false;
  return BLOCKED_TITLE_PATTERNS.some(rx=>rx.test(title));
}

function switchVideoSource(src){
  currentVideoSource=src;
  document.querySelectorAll('.vid-src-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.source===src);
  });
  renderVideoClips();
}

function getTimeRange(){
  const range=document.getElementById('videoTimeRange')?.value||'week';
  if(range==='day') return 'day';
  if(range==='week') return 'week';
  return 'month';
}

// Single API call — server fetches Reddit (CombatFootage + others) + YouTube RSS, dedupes, caches on CDN
async function fetchVideos(){
  const grid=document.getElementById('clipsGrid');
  const status=document.getElementById('vidStatus');
  grid.innerHTML='<div class="loading" style="grid-column:1/-1"><div class="spinner"></div>Loading clips from YouTube & Reddit...</div>';
  status.textContent='Fetching...';

  try{
    const timeRange=getTimeRange();
    const res=await fetch(`/api/clips?t=${timeRange}`,{signal:AbortSignal.timeout(15000)});
    if(!res.ok) throw new Error('API returned '+res.status);
    const data=await res.json();

    allVideoClips=(data.clips||[]).filter(v=>!isBlockedContent(v.title));
    const meta=data.meta||{};
    status.textContent=`${meta.youtube||0} YouTube + ${meta.reddit||0} Reddit clips loaded`;
    renderVideoClips();

    const totalClips=allVideoClips.length;
    const newVids=totalClips-lastSeenCounts.videos;
    if(newVids>0&&lastSeenCounts.videos>0) updateBadge('videos',newVids);
    lastSeenCounts.videos=totalClips;
  }catch(e){
    console.warn('Clips API failed:',e);
    status.textContent='Using curated sources';
    grid.innerHTML=getFallbackVideos();
  }
}

function renderVideoClips(){
  const grid=document.getElementById('clipsGrid');
  let clips=allVideoClips;
  if(currentVideoSource==='youtube') clips=clips.filter(v=>v.source==='youtube');
  if(currentVideoSource==='reddit') clips=clips.filter(v=>v.source==='reddit');

  if(!clips.length){
    grid.innerHTML=getFallbackVideos();
    return;
  }

  grid.innerHTML=clips.slice(0,36).map(v=>{
    const isYT=v.source==='youtube'||(v.source==='reddit'&&v.isYouTube);
    const thumb=v.thumbnail||
                (v.videoId?`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`:'');
    const dur=v.duration?formatISO8601Duration(v.duration):'';
    const date=v.publishedAt?timeAgo(new Date(v.publishedAt)):'';
    const safeReddit=escAttr(safeUrl(v.redditUrl||''));
    const safeVideo=escAttr(safeUrl(v.videoUrl||''));
    const onclick=isYT&&v.videoId
      ?`playModal('${escAttr(v.videoId)}')`
      :(safeReddit?`openLink('${safeReddit}')`:`openLink('${safeVideo}')`);
    const srcLabel=v.source==='reddit'?'REDDIT':'YT';
    const srcCls=v.source==='reddit'?'src-reddit':'src-youtube';
    const meta=v.source==='reddit'&&v.score?` · ▲${v.score}`:'';
    return `
      <div class="clip-card" onclick="${onclick}">
        <div class="clip-thumb">
          ${thumb?`<img src="${thumb}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}
          <div class="play-btn"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></div>
          <div class="clip-source ${srcCls}">${srcLabel}</div>
          ${dur?`<div class="clip-duration">${dur}</div>`:''}
        </div>
        <div class="clip-info">
          <div class="clip-title">${escHtml(v.title)}</div>
          <div class="clip-channel">${escHtml(v.author||'')}${meta}</div>
          <div class="clip-date">${date}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Parse ISO 8601 duration (PT1H2M3S) to readable format
function formatISO8601Duration(iso){
  if(!iso) return '';
  const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if(!m) return '';
  const h=parseInt(m[1]||0),min=parseInt(m[2]||0),s=parseInt(m[3]||0);
  if(h) return `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${min}:${String(s).padStart(2,'0')}`;
}

function getFallbackVideos(){
  return `
    <div style="grid-column:1/-1;padding:30px 20px;text-align:center">
      <div style="font-size:2rem;margin-bottom:12px">🎬</div>
      <p style="color:var(--text);font-family:var(--mono);font-size:.85rem;font-weight:700;margin-bottom:8px">
        VIDEO INTELLIGENCE — CURATED SOURCES
      </p>
      <p style="color:var(--text3);font-family:var(--mono);font-size:.6rem;margin-bottom:20px;max-width:500px;margin-left:auto;margin-right:auto">
        Browse verified conflict footage from official news outlets and OSINT communities
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;max-width:700px;margin:0 auto 16px">
        <a href="https://www.youtube.com/@AlJazeeraEnglish/videos" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">📺 Al Jazeera</a>
        <a href="https://www.youtube.com/@skaborshi/videos" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">📺 Sky News</a>
        <a href="https://www.youtube.com/@ABORSHI/videos" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">📺 BBC News</a>
        <a href="https://www.youtube.com/results?search_query=Iran+war+2026+news&sp=CAI%253D" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">🔍 YouTube Search</a>
        <a href="https://www.reddit.com/r/CombatFootage/search/?q=iran&sort=new&t=week" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">🎯 r/CombatFootage</a>
        <a href="https://www.reddit.com/r/worldnews/search/?q=iran+video&sort=new&t=week" target="_blank" class="overlay-btn" style="text-decoration:none;padding:12px 16px;display:flex;align-items:center;gap:8px;justify-content:center">🌍 r/worldnews</a>
      </div>
    </div>
  `;
}
