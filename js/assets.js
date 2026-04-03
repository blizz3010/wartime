// ===== WARTIME ASSETS JS =====
// Asset subpage navigation, fleet tracker, infrastructure targets, military base status

function showAssetSubpage(id){
  document.querySelectorAll('#panel-assets .subpage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#assetsSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('assets-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#assetsSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
  document.getElementById('panel-assets').scrollTo({top:0,behavior:'smooth'});
}

// ===== IRANIAN NAVAL FLEET TRACKER — OPERATION EPIC FURY =====
const SHIP_ICONS={
  'Submarine':'🔻','Frigate':'🚢','Corvette':'🛥','Fast Attack':'⚡',
  'Catamaran':'⛵','Support Ship':'📦','Patrol Boat':'🔹','Fast Attack Swarm':'💥',
  'Drone Carrier':'🛩'
};

function renderFleetTracker(){
  const vessels=[
    // Submarines
    {name:'IRIS Fateh',class:'Fateh-class SSK (indigenous)',type:'Submarine',status:'destroyed',location:'Bandar Abbas (in port)',date:'Mar 3',
      detail:'Iran\'s most advanced indigenous submarine. Sunk by ATACMS ballistic missiles fired from HIMARS launchers — first known use of a ballistic missile to sink a submarine. Struck while stationary in port.',
      killedBy:'ATACMS / HIMARS',wiki:'https://en.wikipedia.org/wiki/IRIS_Fateh',
      video:'https://www.youtube.com/watch?v=HnMb3kOHQ6Y',
      img:'/images/assets/fateh-submarine.jpg'},
    {name:'IRIS Tariq (901)',class:'Kilo-class SSK (Russian-built)',type:'Submarine',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Sunk in opening strikes. Hull confirmed destroyed via satellite imagery. One of 3 Russian-built Kilo-class boats.',
      killedBy:'Tomahawk TLAM',wiki:'https://en.wikipedia.org/wiki/Kilo-class_submarine',
      img:'/images/assets/kilo-class-submarine.jpg'},
    {name:'IRIS Noor (902)',class:'Kilo-class SSK',type:'Submarine',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Destroyed alongside Tariq in Bandar Abbas port strikes. Satellite imagery confirms both Kilos sunk at berth.',
      killedBy:'Tomahawk TLAM',wiki:'https://en.wikipedia.org/wiki/Kilo-class_submarine',
      img:'/images/assets/kilo-class-submarine.jpg'},
    {name:'IRIS Yunes (903)',class:'Kilo-class SSK',type:'Submarine',status:'unknown',location:'Unknown — possibly at sea',date:'—',
      detail:'Was not at Bandar Abbas during initial strikes. Current location unknown. If at sea, may be Iran\'s last operational diesel submarine.',
      wiki:'https://en.wikipedia.org/wiki/Kilo-class_submarine',
      img:'/images/assets/kilo-class-submarine.jpg'},
    {name:'Nahang',class:'Nahang-class Midget Sub',type:'Submarine',status:'unknown',location:'Unknown',date:'—',
      detail:'Coastal midget submarine. No confirmed sightings since conflict start. Likely hiding in coastal cave shelters.',
      wiki:'https://en.wikipedia.org/wiki/Nahang-class_submarine',
      img:'/images/assets/nahang-submarine.jpg'},
    {name:'Ghadir Fleet (x23)',class:'Ghadir-class Midget Sub',type:'Submarine',status:'damaged',location:'Dispersed — coastal bases',date:'Multiple',
      detail:'Fleet of ~23 midget subs. Several confirmed destroyed at Jask and Bandar-e Jask. Remainder dispersed. Difficult to track due to small size. Est. 8-12 still operational.',
      wiki:'https://en.wikipedia.org/wiki/Ghadir-class_submarine',
      img:'/images/assets/ghadir-submarine.jpg'},

    // Major Surface Combatants — Operation Epic Fury
    {name:'IRIS Dena (75)',class:'Moudge-class Frigate',type:'Frigate',status:'destroyed',location:'Indian Ocean (off Sri Lanka)',date:'Mar 4',
      detail:'Torpedoed by USS Charlotte (SSN-766) ~19nm off Galle, Sri Lanka using Mk 48 torpedoes (2 fired, 1 hit). Sank in 2-3 minutes. ~80-87 of ~180 crew killed. First US submarine torpedo kill since WWII.',
      killedBy:'Mk 48 torpedo / USS Charlotte',wiki:'https://en.wikipedia.org/wiki/IRIS_Dena',
      img:'/images/assets/iris-dena-frigate.jpg'},
    {name:'IRIS Jamaran (76)',class:'Moudge-class Frigate',type:'Frigate',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Destroyed in opening strikes at Bandar Abbas. First Iranian-built frigate. Confirmed sunk at berth.',
      killedBy:'Harpoon / Tomahawk',wiki:'https://en.wikipedia.org/wiki/IRIS_Jamaran',
      img:'/images/assets/iris-jamaran-frigate.jpg'},
    {name:'IRIS Damavand (77)',class:'Moudge-class Frigate',type:'Frigate',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Destroyed alongside Jamaran in port strikes. Capsized at dock.',
      killedBy:'Tomahawk TLAM',wiki:'https://en.wikipedia.org/wiki/IRIS_Damavand_(77)',
      img:'/images/assets/iris-damavand-frigate.jpg'},
    {name:'IRIS Sahand (74)',class:'Moudge-class Frigate',type:'Frigate',status:'destroyed',location:'Chabahar area',date:'Mar 3',
      detail:'Attempted to flee east toward Chabahar. Intercepted and destroyed by coalition naval forces.',
      killedBy:'Harpoon ASCM',wiki:'https://en.wikipedia.org/wiki/IRIS_Sahand_(74)',
      img:'/images/assets/iris-sahand-frigate.jpg'},

    // IRGCN Soleimani-class Catamarans
    {name:'IRIS Shahid Sayyad Shirazi',class:'Soleimani-class Catamaran',type:'Catamaran',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Missile-armed catamaran corvette. All four Soleimani-class ships were reported destroyed in opening strikes.',
      killedBy:'Tomahawk / Harpoon',wiki:'https://en.wikipedia.org/wiki/Shahid_Soleimani-class_catamaran',
      img:'/images/assets/soleimani-catamaran.jpg'},
    {name:'IRIS Shahid Nazeri',class:'Soleimani-class Catamaran',type:'Catamaran',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Destroyed alongside other Soleimani-class vessels. Advanced anti-ship missile platform eliminated.',
      killedBy:'Tomahawk / Harpoon',
      img:'/images/assets/soleimani-catamaran.jpg'},
    {name:'IRIS Shahid Dehghan',class:'Soleimani-class Catamaran',type:'Catamaran',status:'destroyed',location:'Konarak',date:'Mar 1',
      detail:'Destroyed at Konarak naval base. Fire and secondary explosions confirmed.',
      killedBy:'Tomahawk TLAM',
      img:'/images/assets/soleimani-catamaran.jpg'},
    {name:'IRIS Shahid Dalvari',class:'Soleimani-class Catamaran',type:'Catamaran',status:'destroyed',location:'Konarak',date:'Mar 1',
      detail:'Fourth and final Soleimani-class. Destroyed. IRGCN catamaran capability eliminated.',
      killedBy:'Tomahawk TLAM',
      video:'https://www.youtube.com/watch?v=HnMb3kOHQ6Y',
      img:'/images/assets/soleimani-catamaran.jpg'},

    // Drone carrier & other IRGCN
    {name:'IRIS Shahid Bagheri',class:'IRGCN Drone/Helicopter Carrier',type:'Drone Carrier',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'180m flight deck with ski-jump. Iran\'s largest military vessel. Sunk in opening hours of Operation Epic Fury.',
      killedBy:'Multiple Tomahawk / Harpoon strikes',wiki:'https://en.wikipedia.org/wiki/IRIS_Shahid_Bagheri',
      video:'https://www.reddit.com/r/navy/comments/1rm0dzm/video_of_us_sinking_irans_carrier_the_iris_shahid/',
      img:'/images/assets/shahid-bagheri-carrier.jpg'},
    {name:'IRIS Makran (441)',class:'Makran-class Forward Base Ship',type:'Support Ship',status:'destroyed',location:'Jask area',date:'Mar 1',
      detail:'Former tanker converted to floating forward base. Reported burning and sinking in early strikes. Confirmed lost.',
      killedBy:'Harpoon ASCM',wiki:'https://en.wikipedia.org/wiki/IRIS_Makran',
      img:'/images/assets/iris-makran-support.jpg'},

    // Bayandor-class corvettes
    {name:'IRIS Bayandor (81)',class:'Bayandor-class Corvette',type:'Corvette',status:'destroyed',location:'Bushehr',date:'Mar 1',
      detail:'Vosper Mk 5 corvette. Destroyed by airstrike at Bushehr naval pier.',
      killedBy:'Precision airstrike',wiki:'https://en.wikipedia.org/wiki/IRIS_Bayandor_(81)',
      img:'/images/assets/bayandor-corvette.jpg'},
    {name:'IRIS Naghdi (82)',class:'Bayandor-class Corvette',type:'Corvette',status:'destroyed',location:'Bushehr',date:'Mar 1',
      detail:'Destroyed alongside Bayandor at Bushehr. Both corvettes eliminated.',
      killedBy:'Precision airstrike',wiki:'https://en.wikipedia.org/wiki/Bayandor-class_corvette',
      img:'/images/assets/bayandor-corvette.jpg'},

    // Support ships
    {name:'IRIS Kharg (431)',class:'Kharg-class Replenishment',type:'Support Ship',status:'destroyed',location:'Bandar Abbas',date:'Mar 1',
      detail:'Fleet replenishment oiler. Iran\'s only major underway replenishment ship. Destroyed in port. Navy logistics capability eliminated.',
      killedBy:'Tomahawk TLAM',wiki:'https://en.wikipedia.org/wiki/IRIS_Kharg_(431)',
      img:'/images/assets/iris-kharg-support.jpg'},

    // IRGCN Fast Attack fleet
    {name:'IRGCN Fast Attack Fleet',class:'~1,500 boats (Peykaap, Zolfaqar, Seraj, etc.)',type:'Fast Attack Swarm',status:'damaged',location:'Dispersed — coastal',date:'Ongoing',
      detail:'Estimated 200-300 destroyed in strikes on coastal pens and bases at Bandar Abbas, Jask, and Bushehr. Remainder dispersed to civilian ports and hidden coves. Swarm capability significantly degraded. DefSec Hegeseth declared Iranian Navy "combat ineffective, decimated, destroyed, defeated."',
      wiki:'https://en.wikipedia.org/wiki/Peykaap-class_missile_boat',
      img:'/images/assets/peykaap-fast-attack.jpg'},
  ];

  // Summary counts
  const counts={operational:0,damaged:0,destroyed:0,unknown:0};
  vessels.forEach(v=>{
    if(v.status==='operational') counts.operational++;
    else if(v.status==='damaged') counts.damaged++;
    else if(v.status==='destroyed') counts.destroyed++;
    else counts.unknown++;
  });

  const summaryEl=document.getElementById('fleetSummary');
  summaryEl.innerHTML=`
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--green)"></div>OPERATIONAL: ${counts.operational}</div>
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--orange)"></div>DAMAGED: ${counts.damaged}</div>
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--red)"></div>DESTROYED: ${counts.destroyed}</div>
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--text3)"></div>UNKNOWN: ${counts.unknown}</div>
    <div class="fleet-summary-item" style="margin-left:auto;color:var(--text3)">OPERATION EPIC FURY · 30+ SHIPS DESTROYED</div>
  `;

  const gridEl=document.getElementById('fleetTracker');
  gridEl.innerHTML=vessels.map(v=>{
    const icon=SHIP_ICONS[v.type]||'🔹';
    const statusGrad=v.status==='destroyed'?'rgba(248,81,73,0.12),rgba(13,17,23,0.95)':v.status==='damaged'?'rgba(210,153,34,0.12),rgba(13,17,23,0.95)':v.status==='operational'?'rgba(63,185,80,0.12),rgba(13,17,23,0.95)':'rgba(139,148,158,0.12),rgba(13,17,23,0.95)';
    const imgHtml=`<div style="position:relative;overflow:hidden;border-radius:4px;margin-bottom:10px;height:140px;background:linear-gradient(135deg,${statusGrad});border:1px solid var(--border);display:flex;align-items:center;justify-content:center">
      <span style="font-size:3rem;opacity:0.2;filter:${v.status==='destroyed'?'grayscale(1)':'none'}">${icon}</span>
      ${v.img?`<img src="${v.img}" alt="${v.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${v.status==='destroyed'?'0.5':'0.85'};${v.status==='destroyed'?'filter:grayscale(50%)':''}" loading="lazy" onerror="this.remove()">`:''}
      <div style="position:absolute;inset:0;background:linear-gradient(transparent 40%,rgba(13,17,23,0.85))"></div>
      <div style="position:absolute;top:6px;right:6px"><div class="fleet-card-status ${v.status}" style="font-size:.5rem;padding:2px 6px"><span class="force-status ${v.status==='operational'?'active':v.status}"></span>${v.status.toUpperCase()}</div></div>
      <div style="position:absolute;bottom:8px;left:10px;font-family:var(--mono);font-size:.5rem;color:var(--text3);letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,0.8)">${v.type.toUpperCase()}</div>
      <div style="position:absolute;bottom:8px;right:10px;font-family:var(--mono);font-size:.45rem;color:var(--text3);text-shadow:0 1px 3px rgba(0,0,0,0.8)">📍 ${v.location}</div>
      ${v.status==='destroyed'?'<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(248,81,73,.1));height:30px"></div>':''}
    </div>`;
    const killedByHtml=v.killedBy?`<div style="display:flex;align-items:center;gap:4px;margin-top:6px;padding:4px 8px;background:var(--red-dim);border-radius:3px;font-family:var(--mono);font-size:.55rem;color:var(--red);font-weight:600">⚔ ${v.killedBy}</div>`:'';
    const borderColor=v.status==='destroyed'?'var(--red)':v.status==='damaged'?'var(--orange)':v.status==='operational'?'var(--green)':'var(--text3)';
    const wikiHtml=v.wiki?`<a href="${v.wiki}" target="_blank" style="font-family:var(--mono);font-size:.5rem;color:var(--blue);text-decoration:none;margin-top:4px;display:inline-block">Wikipedia ↗</a>`:'';
    const videoHtml=v.video?`<a href="${v.video}" target="_blank" style="font-family:var(--mono);font-size:.5rem;color:var(--red);text-decoration:none;margin-top:4px;margin-left:${v.wiki?'8px':'0'};display:inline-block">Video ▶</a>`:'';
    return `
    <div class="fleet-card" style="border-left:3px solid ${borderColor}">
      ${imgHtml}
      <div class="fleet-card-header">
        <div style="display:flex;align-items:center">
          <span class="ship-type-icon">${icon}</span>
          <div>
            <div class="fleet-card-name">${v.name}</div>
            <div class="fleet-card-class">${v.class}</div>
          </div>
        </div>
        ${''}<!-- status shown in header -->
      </div>
      <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <div style="flex:1">
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);margin-bottom:2px">LOCATION</div>
          <div style="font-family:var(--mono);font-size:.6rem;color:var(--text)">📍 ${v.location}</div>
        </div>
        <div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);margin-bottom:2px">DATE</div>
          <div style="font-family:var(--mono);font-size:.6rem;color:var(--text)">${v.date}</div>
        </div>
      </div>
      ${killedByHtml}
      <div style="font-family:var(--mono);font-size:.58rem;color:var(--text2);margin-top:8px;line-height:1.5">${v.detail}</div>
      <div style="display:flex;align-items:center;flex-wrap:wrap">${wikiHtml}${videoHtml}</div>
    </div>`;
  }).join('');
}

// ===== INFRASTRUCTURE TARGETS TRACKER =====
function renderInfraTracker(){
  const targets=[
    // Oil & Energy
    {name:'Kharg Island Oil Terminal',type:'OIL / ENERGY',location:'Persian Gulf',status:'damaged',damage:40,detail:'Major oil export terminal — handles 90% of Iran\'s exports. Military radar/AA targeted. Export capacity reduced ~60%. Global oil prices spiked.',lastStrike:'Mar 10'},
    {name:'Abadan Refinery',type:'OIL / ENERGY',location:'Khuzestan Province',status:'damaged',damage:35,detail:'Iran\'s largest refinery. Selective strikes on fuel depot supplying IRGC. Civilian capacity partially intact but operating at ~40%.',lastStrike:'Mar 11'},
    {name:'Isfahan Refinery',type:'OIL / ENERGY',location:'Isfahan Province',status:'damaged',damage:30,detail:'Major domestic fuel refinery. Struck near co-located military targets. Gasoline production significantly reduced. Fuel rationing in effect.',lastStrike:'Mar 8'},
    {name:'South Pars Gas Field (onshore)',type:'OIL / ENERGY',location:'Bushehr Province',status:'damaged',damage:20,detail:'World\'s largest gas field (shared with Qatar). Onshore processing hub struck. Pipeline damage confirmed. Qatar operations unaffected.',lastStrike:'Mar 12'},
    // Electrical Grid
    {name:'Isfahan Power Plant',type:'ELECTRICAL',location:'Isfahan Province',status:'destroyed',damage:80,detail:'Major thermal power station. Turbine halls destroyed. Isfahan experiencing rolling blackouts. 3M+ affected.',lastStrike:'Mar 5'},
    {name:'Tehran West Transmission Hub',type:'ELECTRICAL',location:'Tehran Province',status:'damaged',damage:50,detail:'400kV transmission substation. Transformer banks damaged. Tehran power grid operating at ~60% capacity.',lastStrike:'Mar 10'},
    {name:'Bushehr Coastal Grid',type:'ELECTRICAL',location:'Bushehr Province',status:'damaged',damage:45,detail:'Regional distribution network. Multiple substations damaged in proximity to military strikes. Bushehr NPP grid connection intact.',lastStrike:'Mar 10'},
    // Communications
    {name:'Natanz Comms Hub',type:'COMMUNICATIONS',location:'Isfahan Province',status:'destroyed',damage:85,detail:'Military communications relay co-located with nuclear facility. Fiber optic nodes severed. Regional military comms disrupted.',lastStrike:'Mar 4'},
    {name:'Tehran Internet Exchange',type:'COMMUNICATIONS',location:'Tehran',status:'damaged',damage:65,detail:'Primary internet exchange point. Partially struck in proximity to IRGC HQ. Iran internet connectivity reduced to ~4% of pre-war.',lastStrike:'Mar 15'},
    // Command & Control
    {name:'IRGC HQ Complex',type:'C2 / COMMAND',location:'Tehran',status:'damaged',damage:40,detail:'Multiple buildings struck. Underground bunker targeted with deep-penetration munitions. Command relocated to dispersed sites.',lastStrike:'Mar 15'},
    // Transport
    {name:'Bandar Abbas Commercial Port',type:'TRANSPORT',location:'Hormozgan Province',status:'damaged',damage:45,detail:'Iran\'s busiest commercial port. Military wharf destroyed. Civilian port partially operational but shipping routes disrupted by Hormuz closure.',lastStrike:'Mar 14'},
    {name:'Isfahan Highway Bridge (Route 7)',type:'TRANSPORT',location:'Isfahan Province',status:'destroyed',damage:90,detail:'Strategic highway bridge on Tehran-Isfahan corridor. Destroyed to interdict IRGC logistics movement. Civilian traffic rerouted.',lastStrike:'Mar 6'},
  ];

  // Summary
  const statusCounts={destroyed:0,damaged:0,operational:0};
  const typeCounts={};
  targets.forEach(t=>{
    statusCounts[t.status]=(statusCounts[t.status]||0)+1;
    typeCounts[t.type]=(typeCounts[t.type]||0)+1;
  });

  const summaryEl=document.getElementById('infraSummary');
  summaryEl.innerHTML=`
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--red)"></div>DESTROYED: ${statusCounts.destroyed||0}</div>
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--orange)"></div>DAMAGED: ${statusCounts.damaged||0}</div>
    <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--green)"></div>OPERATIONAL: ${statusCounts.operational||0}</div>
    <div class="fleet-summary-item" style="margin-left:auto;color:var(--text3)">TOTAL TARGETS: ${targets.length}</div>
  `;

  const gridEl=document.getElementById('infraTracker');
  gridEl.innerHTML=targets.map(t=>{
    const statusColor=t.status==='destroyed'?'var(--red)':t.status==='damaged'?'var(--orange)':'var(--green)';
    const statusBg=t.status==='destroyed'?'var(--red-dim)':t.status==='damaged'?'var(--orange-dim)':'var(--green-dim)';
    return `
    <div class="infra-card">
      <div class="infra-card-header">
        <div class="infra-card-name">${t.name}</div>
        <div class="infra-card-type">${t.type}</div>
      </div>
      <div class="infra-card-location">📍 ${t.location} · Last strike: ${t.lastStrike}</div>
      <div class="infra-card-status">
        <span class="fleet-card-status ${t.status}"><span class="force-status ${t.status==='operational'?'active':t.status}"></span>${t.status.toUpperCase()}</span>
      </div>
      <div class="infra-card-detail">${t.detail}</div>
      <div class="infra-damage-bar"><div class="infra-damage-fill" style="width:${t.damage}%;background:${statusColor}"></div></div>
      <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:3px">
        <span>DAMAGE ASSESSMENT</span><span>${t.damage}% DEGRADED</span>
      </div>
    </div>`;
  }).join('');
}
