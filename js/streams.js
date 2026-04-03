// ===== LIVE STREAM CAROUSEL =====
const STREAMS=[
  {name:'Al Jazeera',channel:'UCNye-wNBqNL5ZzHSJj3l8Bg',liveUrl:'https://www.youtube.com/@AlJazeeraEnglish/live'},
  {name:'Sky News',channel:'UCoMdktPbSTixAyNGwb-UYkQ',liveUrl:'https://www.youtube.com/@skynews/live'},
  {name:'France 24',channel:'UCQfwfsi5VrQ8yKZ-UWmAEFg',liveUrl:'https://www.youtube.com/@FRANCE24English/live'},
  {name:'DW News',channel:'UCknLrEdhRCp1aegoMqRaCZg',liveUrl:'https://www.youtube.com/@DWNews/live'},
  {name:'NBC News',channel:'UCeY0bbntWzzVIaj2z3QigXg',liveUrl:'https://www.youtube.com/@NBCNews/live'},
  {name:'TRT World',channel:'UC7fWeaHhqgM4Ry-RMpM2YYw',liveUrl:'https://www.youtube.com/@taborshi/live'},
  {name:'WION',channel:'UC_gUM8rL-Lrg6O3adPW9K1g',liveUrl:'https://www.youtube.com/c/wion/live'},
  {name:'Times Now',channel:'UCz8QaiQxApLq8sLNcszYyJw',liveUrl:'https://www.youtube.com/TimesNow/live'},
  {name:'CNN',channel:'UCupvZG-5ko_eiXAupbDfxWw',liveUrl:'https://www.youtube.com/@cnn/live'},
  {name:'FOX News',channel:'UCXIJgqnII2ZOINSWNOGFThA',liveUrl:'https://www.youtube.com/@FoxNews/live'},
];
let currentStream=0;
// Cache resolved live stream video IDs
const liveStreamCache={};

function renderStreamNav(){
  const c=document.getElementById('streamChannels');
  c.innerHTML=STREAMS.map((s,i)=>`
    <div class="stream-ch${i===currentStream?' active':''}" onclick="selectStream(${i})">
      <span class="live-dot-sm"></span>${s.name}
    </div>
  `).join('');
}

async function selectStream(idx){
  currentStream=idx;
  const s=STREAMS[idx];
  renderStreamNav();
  document.querySelectorAll('.stream-ch')[idx]?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});

  const player=document.getElementById('streamPlayer');
  const openBtn=document.getElementById('streamOpenBtn');
  if(openBtn) openBtn.href=s.liveUrl||`https://www.youtube.com/channel/${s.channel}/live`;

  // Show loading state
  player.src='about:blank';

  // Try to resolve live video ID (cached for 5 min)
  const cacheKey=s.channel;
  const cached=liveStreamCache[cacheKey];
  const cacheAge=cached?Date.now()-cached.time:Infinity;

  if(cached&&cached.videoId&&cacheAge<300000){
    // Use cached video ID (less than 5 min old)
    player.src=`https://www.youtube.com/embed/${cached.videoId}?autoplay=1&mute=1`;
    return;
  }

  // Try scraping the channel's live URL for current video ID
  try{
    const params=new URLSearchParams({channelId:s.channel});
    if(s.liveUrl) params.set('liveUrl',s.liveUrl);
    const res=await fetch(`/api/livestream?${params}`,{signal:AbortSignal.timeout(8000)});
    if(res.ok){
      const data=await res.json();
      if(data.videoId){
        liveStreamCache[cacheKey]={videoId:data.videoId,time:Date.now()};
        player.src=`https://www.youtube.com/embed/${data.videoId}?autoplay=1&mute=1`;
        return;
      }
    }
  }catch(e){}

  // Fallback: use legacy live_stream embed (works for 24/7 channels like Al Jazeera)
  player.src=`https://www.youtube.com/embed/live_stream?channel=${s.channel}&autoplay=1&mute=1`;
}

function switchStream(dir){
  let next=currentStream+dir;
  if(next<0) next=STREAMS.length-1;
  if(next>=STREAMS.length) next=0;
  selectStream(next);
}

function refreshCurrentStream(){
  // Clear cache for current channel and re-fetch
  const s=STREAMS[currentStream];
  delete liveStreamCache[s.channel];
  selectStream(currentStream);
}

// ===== PiP MINI PLAYER =====
let pipActive=false;
let pipStreamIdx=0;

function showPip(){
  const pip=document.getElementById('pipPlayer');
  const s=STREAMS[pipStreamIdx];
  const cachedId=liveStreamCache[s.channel];
  const cached=liveStreamCache[s.channel];
  const src=cached&&cached.videoId
    ?`https://www.youtube.com/embed/${cached.videoId}?autoplay=1&mute=1`
    :`https://www.youtube.com/embed/live_stream?channel=${s.channel}&autoplay=1&mute=1`;
  document.getElementById('pipFrame').src=src;
  document.getElementById('pipChannelName').textContent=s.name;
  pip.classList.add('show');
  pipActive=true;
}

function closePip(){
  const pip=document.getElementById('pipPlayer');
  document.getElementById('pipFrame').src='';
  pip.classList.remove('show');
  pipActive=false;
}

function togglePipSize(){
  document.getElementById('pipPlayer').classList.toggle('minimized');
}

function pipPrevNext(dir){
  pipStreamIdx+=dir;
  if(pipStreamIdx<0) pipStreamIdx=STREAMS.length-1;
  if(pipStreamIdx>=STREAMS.length) pipStreamIdx=0;
  showPip();
}

function pipGoFull(){
  // Navigate to livestreams tab and close PiP
  closePip();
  const tab=document.querySelector('[data-panel="livestreams"]');
  activateTab(tab);
  selectStream(pipStreamIdx);
}

// Drag PiP player
(function(){
  const pip=document.getElementById('pipPlayer');
  const ctrl=pip.querySelector('.pip-controls');
  let dragging=false,ox,oy;
  ctrl.addEventListener('mousedown',e=>{
    if(e.target.closest('.pip-btn')) return;
    dragging=true;ox=e.clientX-pip.offsetLeft;oy=e.clientY-pip.offsetTop;
    pip.style.transition='none';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging) return;
    pip.style.left=(e.clientX-ox)+'px';pip.style.top=(e.clientY-oy)+'px';
    pip.style.right='auto';pip.style.bottom='auto';
  });
  document.addEventListener('mouseup',()=>{dragging=false;pip.style.transition='all .3s ease'});
})();
