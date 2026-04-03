function showForceSubpage(id){
  document.querySelectorAll('#panel-forces .subpage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#forcesSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('forces-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#forcesSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
  // Scroll to top of panel
  document.getElementById('panel-forces').scrollTo({top:0,behavior:'smooth'});
}

function showAssetSubpage(id){
  document.querySelectorAll('#panel-assets .subpage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#assetsSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('assets-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#assetsSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
  document.getElementById('panel-assets').scrollTo({top:0,behavior:'smooth'});
}

function showImpactSubpage(id){
  document.querySelectorAll('#panel-impact .subpage').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#impactSubnav .forces-subnav-btn').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('impact-page-'+id);
  if(page) page.classList.add('active');
  const btn=document.querySelector(`#impactSubnav .forces-subnav-btn[onclick*="'${id}'"]`);
  if(btn) btn.classList.add('active');
  document.getElementById('panel-impact').scrollTo({top:0,behavior:'smooth'});
}

// ===== FORCES & ORDER OF BATTLE =====
function renderForcesPanel(){
  // ===== FORCE COMPARISON — Side by Side =====
  const compareEl=document.getElementById('forceCompare');
  const compareRows=[
    {icon:'👥',label:'Total Personnel',coalition:'~60,000+',iran:'~1,500,000+',note:'Iran includes Basij militia (600k claimed)'},
    {icon:'✈️',label:'Combat Aircraft',coalition:'~250+ (F-35, F-22, F-15, F-16)',iran:'~40 operational',note:'IRIAF severely degraded — most airfields hit'},
    {icon:'🚀',label:'Missiles Launched',coalition:'800+ cruise missiles',iran:'300+ ballistic missiles',note:''},
    {icon:'🛡️',label:'Air Defense Systems',coalition:'Patriot, THAAD, SM-6, Iron Dome, Arrow',iran:'S-300, Bavar-373 (degraded ~80%)',note:''},
    {icon:'🚢',label:'Naval Power',coalition:'3 CSGs, 18+ destroyers, 4+ SSGNs',iran:'Navy destroyed (30+ ships sunk)',note:'Operation Epic Fury — "combat ineffective"'},
    {icon:'🛩️',label:'Drones / UAVs',coalition:'MQ-9 Reaper, RQ-4 Global Hawk',iran:'500+ Shahed-136/129 deployed',note:'Iran drone swarm vs US ISR advantage'},
    {icon:'🎯',label:'Precision Strike',coalition:'Tomahawk, JASSM-ER, GBU-57 MOP',iran:'Fateh-110, Zolfaghar, Emad',note:'US bunker busters confirmed at Fordow'},
    {icon:'💻',label:'Cyber Capability',coalition:'USCYBERCOM + Unit 8200',iran:'APT33, APT42, MuddyWater',note:'Iran internet reduced to ~4%'},
    {icon:'📡',label:'Intelligence',coalition:'NSA, CIA, Mossad, Unit 8200, Five Eyes',iran:'IRGC Quds Force, MOIS',note:''},
    {icon:'🛰️',label:'Space / Satellite',coalition:'Full ISR constellation',iran:'Limited — some imagery',note:'Total information dominance'},
    {icon:'☢️',label:'Nuclear',coalition:'🇺🇸 Arsenal (standby) / 🇮🇱 Undeclared',iran:'Program struck — Natanz, Fordow hit',note:''},
    {icon:'🤝',label:'Proxy Forces',coalition:'—',iran:'Hezbollah, Houthis, Iraqi PMF, Syrian militias',note:'~100,000+ combined fighters'},
  ];

  compareEl.innerHTML=`
    <div class="force-compare-side coalition">
      <div class="compare-header">
        <h2>🇺🇸 🇮🇱 COALITION</h2>
        <div class="compare-sub">United States + Israel · Active Combatants</div>
      </div>
      ${compareRows.map(r=>`
        <div class="compare-stat-row">
          <span class="compare-stat-icon">${r.icon}</span>
          <span class="compare-stat-label">${r.label}</span>
          <span class="compare-stat-val">${r.coalition}</span>
        </div>
      `).join('')}
      <div class="compare-total-bar" style="color:var(--blue)">
        🏆 TECHNOLOGICAL SUPERIORITY
      </div>
    </div>
    <div class="compare-divider">
      <div class="compare-vs">VS</div>
      <div class="compare-center-label">FORCE COMPARISON</div>
    </div>
    <div class="force-compare-side iran-axis">
      <div class="compare-header">
        <h2>🇮🇷 IRAN & AXIS</h2>
        <div class="compare-sub">IRGC + Artesh + Basij + Proxies · Combined</div>
      </div>
      ${compareRows.map(r=>`
        <div class="compare-stat-row">
          <span class="compare-stat-icon">${r.icon}</span>
          <span class="compare-stat-label">${r.label}</span>
          <span class="compare-stat-val">${r.iran}</span>
        </div>
      `).join('')}
      <div class="compare-total-bar" style="color:var(--iran)">
        📊 NUMERICAL + PROXY ADVANTAGE
      </div>
    </div>
  `;

  // Support & Logistics Nations (not actively attacking)
  const supportEl=document.getElementById('supportForces');
  const support=[
    {flag:'🇬🇧',name:'United Kingdom',role:'ISR / Air Defense Support',cls:'us',items:[
      {label:'🛡️ Role',val:'ISR, refueling, defensive intercepts'},
      {label:'✈️ RAF Typhoon Sorties',val:'80+ (CAP / ISR only)'},
      {label:'🚢 HMS Queen Elizabeth',val:'Deployed — E. Med'},
      {label:'🔻 Astute-class Submarines',val:'1-2 (estimated)'},
      {label:'❌ Offensive Strikes',val:'None confirmed'},
    ]},
    {flag:'🇸🇦',name:'Saudi Arabia',role:'Airspace Access / Defensive',cls:'us',items:[
      {label:'🛡️ Role',val:'Airbase access, airspace, missile defense'},
      {label:'🏗️ Prince Sultan Air Base',val:'Open to US forces'},
      {label:'🚀 Patriot Batteries',val:'6+ active'},
      {label:'❌ Offensive Strikes',val:'None'},
    ]},
    {flag:'🇦🇪',name:'UAE',role:'Logistics / Basing',cls:'us',items:[
      {label:'🛡️ Role',val:'Air base hosting, logistics hub'},
      {label:'🏗️ Al Dhafra Air Base',val:'Active — US Air Force'},
      {label:'🚀 THAAD Batteries',val:'2 active — intercepted 3 BMs'},
      {label:'❌ Offensive Strikes',val:'None'},
    ]},
    {flag:'🇧🇭',name:'Bahrain',role:'Naval HQ Hosting',cls:'us',items:[
      {label:'🛡️ Role',val:'Hosts US 5th Fleet HQ'},
      {label:'⚓ NAVCENT / 5th Fleet HQ',val:'Active — NSA Bahrain'},
      {label:'❌ Offensive Strikes',val:'None'},
    ]},
  ];

  supportEl.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1px;background:var(--border)">
    ${support.map(f=>`
      <div style="background:var(--surface);padding:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span style="font-size:2rem">${f.flag}</span>
          <div>
            <div style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--text)">${f.name}</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:.5px">${f.role}</div>
          </div>
        </div>
        ${f.items.map(i=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-family:var(--mono);font-size:.65rem;color:var(--text2)">${i.label}</span>
            <span style="font-family:var(--mono);font-size:.65rem;font-weight:600;color:var(--text);text-align:right">${i.val}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
    </div>
    <div style="padding:12px 20px;font-family:var(--mono);font-size:.5rem;color:var(--text3);background:var(--surface);border-top:1px solid var(--border)">
      ⚠️ DISCLAIMER: These nations are providing support & logistics only. None are conducting offensive military operations against Iran.
    </div>
  `;

  // Proxy & Non-State Actors
  const proxyEl=document.getElementById('proxyForces');
  const proxies=[
    {flag:'🇱🇧',name:'Hezbollah',role:'Iranian Proxy — Lebanon',cls:'proxy',items:[
      {label:'🚀 Rockets Launched (at Israel)',val:'2,000+'},
      {label:'🎯 Precision Missiles',val:'~200 (Fateh-class)'},
      {label:'⚔️ Radwan Force (elite)',val:'~2,500 fighters'},
      {label:'👥 Total Fighters',val:'~30,000 active'},
      {label:'🚢 Anti-Ship Missiles',val:'Yakhont — 2 fired'},
      {label:'📊 Status',val:'⚠️ Heavily engaged'},
    ]},
    {flag:'🇾🇪',name:'Houthis (Ansar Allah)',role:'Iranian Proxy — Yemen',cls:'proxy',items:[
      {label:'🚀 Anti-Ship Missiles Fired',val:'40+'},
      {label:'🛩️ Drones Launched',val:'100+ (Samad/Qasef)'},
      {label:'🚢 Red Sea Shipping Attacks',val:'25+ vessels targeted'},
      {label:'🎯 Ballistic Missiles (at Israel)',val:'8+'},
      {label:'💥 Commercial Ships Hit',val:'12+'},
      {label:'📊 Status',val:'⚠️ Escalating — Red Sea'},
    ]},
    {flag:'🇮🇶',name:'Iraqi Militias (PMF)',role:'Iran-Aligned — Iraq',cls:'proxy',items:[
      {label:'💥 Attacks on US Bases',val:'60+'},
      {label:'⚔️ Groups Active',val:'Kata\'ib Hezbollah, AAH, KSS'},
      {label:'🛩️ One-Way Attack Drones',val:'100+ launched'},
      {label:'🚀 Rockets at Al Asad / Erbil',val:'40+'},
      {label:'📊 Status',val:'⚠️ Active — escalating'},
    ]},
    {flag:'🇸🇾',name:'Syrian Militias',role:'Iran-Aligned — Syria',cls:'proxy',items:[
      {label:'💥 Cross-border Attacks (Golan)',val:'15+'},
      {label:'👥 IRGC Advisors in Syria',val:'~2,000'},
      {label:'📊 Status',val:'Limited — Israeli strikes'},
    ]},
  ];

  // Mini-map data for each proxy — simplified Middle East outlines with operational zones
  const proxyMaps={
    'Hezbollah':{center:'Lebanon / N. Israel',color:'var(--red)',
      zone:'<rect x="98" y="32" width="8" height="14" fill="rgba(248,81,73,0.3)" stroke="var(--red)" stroke-width="0.5" rx="1"/>'+
        '<text x="102" y="28" fill="var(--text)" font-size="5" text-anchor="middle" font-family="var(--mono)">LEBANON</text>'+
        '<text x="102" y="52" fill="var(--text3)" font-size="4" text-anchor="middle" font-family="var(--mono)">N. Israel</text>'+
        '<circle cx="102" cy="39" r="2" fill="var(--red)"><animate attributeName="opacity" from="1" to="0.3" dur="1.5s" repeatCount="indefinite"/></circle>'},
    'Houthis (Ansar Allah)':{center:'Yemen / Red Sea',color:'var(--orange)',
      zone:'<rect x="80" y="75" width="20" height="15" fill="rgba(210,153,34,0.3)" stroke="var(--orange)" stroke-width="0.5" rx="1"/>'+
        '<text x="90" y="72" fill="var(--text)" font-size="5" text-anchor="middle" font-family="var(--mono)">YEMEN</text>'+
        '<line x1="70" y1="65" x2="80" y2="80" stroke="var(--orange)" stroke-width="0.5" stroke-dasharray="2,2"/>'+
        '<text x="65" y="62" fill="var(--orange)" font-size="4" text-anchor="middle" font-family="var(--mono)">RED SEA</text>'+
        '<circle cx="90" cy="82" r="2" fill="var(--orange)"><animate attributeName="opacity" from="1" to="0.3" dur="1.5s" repeatCount="indefinite"/></circle>'},
    'Iraqi Militias (PMF)':{center:'Iraq',color:'var(--orange)',
      zone:'<rect x="108" y="30" width="18" height="25" fill="rgba(210,153,34,0.3)" stroke="var(--orange)" stroke-width="0.5" rx="1"/>'+
        '<text x="117" y="43" fill="var(--text)" font-size="5" text-anchor="middle" font-family="var(--mono)">IRAQ</text>'+
        '<circle cx="112" cy="37" r="1.5" fill="var(--red)"/>'+
        '<text x="112" y="35" fill="var(--text3)" font-size="3.5" text-anchor="middle" font-family="var(--mono)">Al Asad</text>'+
        '<circle cx="122" cy="35" r="1.5" fill="var(--red)"/>'+
        '<text x="122" y="33" fill="var(--text3)" font-size="3.5" text-anchor="middle" font-family="var(--mono)">Erbil</text>'},
    'Syrian Militias':{center:'Syria / Golan',color:'var(--orange)',
      zone:'<rect x="95" y="25" width="15" height="20" fill="rgba(210,153,34,0.3)" stroke="var(--orange)" stroke-width="0.5" rx="1"/>'+
        '<text x="102" y="35" fill="var(--text)" font-size="5" text-anchor="middle" font-family="var(--mono)">SYRIA</text>'+
        '<circle cx="100" cy="42" r="2" fill="var(--orange)"><animate attributeName="opacity" from="1" to="0.3" dur="1.5s" repeatCount="indefinite"/></circle>'+
        '<text x="100" y="48" fill="var(--text3)" font-size="3.5" text-anchor="middle" font-family="var(--mono)">Golan</text>'},
  };

  proxyEl.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:1px;background:var(--border)">
    ${proxies.map(function(f){
      const threatColor=f.name==='Hezbollah'?'var(--red)':'var(--orange)';
      const map=proxyMaps[f.name];
      const mapSvg=map?'<div style="margin:10px 0;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:4px">'+
        '<div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);letter-spacing:1px;margin-bottom:4px">OPERATIONAL ZONE — '+map.center.toUpperCase()+'</div>'+
        '<svg viewBox="50 15 100 85" style="width:100%;height:80px" xmlns="http://www.w3.org/2000/svg">'+
          '<rect x="50" y="15" width="100" height="85" fill="transparent"/>'+
          '<text x="75" y="50" fill="rgba(139,148,158,0.15)" font-size="7" font-family="var(--mono)">MIDDLE EAST</text>'+
          '<path d="M128,20 L140,25 L145,40 L140,55 L130,55 L125,50 L120,55 L110,55 L105,50 L100,48 L95,50 L90,48 L95,42 L100,40 L98,35 L95,30 L98,25 L105,20 Z" fill="rgba(139,148,158,0.06)" stroke="rgba(139,148,158,0.2)" stroke-width="0.5"/>'+
          '<path d="M80,60 L100,55 L105,65 L100,75 L85,80 L75,70 Z" fill="rgba(139,148,158,0.06)" stroke="rgba(139,148,158,0.2)" stroke-width="0.5"/>'+
          '<text x="145" y="45" fill="rgba(139,148,158,0.2)" font-size="5" font-family="var(--mono)">IRAN</text>'+
          map.zone+
        '</svg>'+
      '</div>':'';
      return '<div style="background:var(--surface);padding:20px">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'+
          '<span style="font-size:2rem">'+f.flag+'</span>'+
          '<div>'+
            '<div style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--text)">'+f.name+'</div>'+
            '<div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:.5px">'+f.role+'</div>'+
          '</div>'+
        '</div>'+
        '<div style="display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.55rem;padding:3px 8px;border-radius:3px;background:'+(threatColor==='var(--red)'?'var(--red-dim)':'var(--orange-dim)')+';color:'+threatColor+';margin-bottom:12px">⚠️ '+(f.items.find(function(i){return i.label==='📊 Status'})?.val||'Active')+'</div>'+
        mapSvg+
        f.items.filter(function(i){return i.label!=='📊 Status'}).map(function(i){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">'+
          '<span style="font-family:var(--mono);font-size:.65rem;color:var(--text2)">'+i.label+'</span>'+
          '<span style="font-family:var(--mono);font-size:.65rem;font-weight:600;color:var(--text);text-align:right">'+i.val+'</span>'+
        '</div>';}).join('')+
      '</div>';
    }).join('')}
    </div>
  `;

  // Weapons Systems
  const weaponsEl=document.getElementById('weaponsSystems');
  const weapons=[
    {flag:'🇺🇸',name:'US Air Power',role:'Strike Aircraft',cls:'us',items:[
      {label:'💀 B-2 Spirit (stealth bomber)',val:'6+ deployed'},
      {label:'✈️ B-1B Lancer',val:'12+ sorties'},
      {label:'⚡ F-35A Lightning II',val:'48+ aircraft'},
      {label:'🦅 F-22 Raptor (air superiority)',val:'24+ aircraft'},
      {label:'🎯 F-15E Strike Eagle',val:'36+ aircraft'},
      {label:'🛩️ MQ-9 Reaper (ISR/strike)',val:'20+'},
      {label:'📡 RQ-4 Global Hawk (ISR)',val:'Active'},
      {label:'📡 E-3 AWACS',val:'2+ orbits'},
    ]},
    {flag:'🇺🇸',name:'US Missile Systems',role:'Precision Strike',cls:'us',items:[
      {label:'🚀 Tomahawk (TLAM) Launched',val:'500+'},
      {label:'🎯 JASSM-ER (air-launched)',val:'200+'},
      {label:'💣 GBU-57 MOP (bunker buster)',val:'Confirmed use — Fordow'},
      {label:'🛡️ SM-6 (naval strike/defense)',val:'Active'},
      {label:'🛡️ Patriot PAC-3 (air defense)',val:'12+ batteries'},
      {label:'🛡️ THAAD (ballistic defense)',val:'4 batteries'},
    ]},
    {flag:'🇮🇷',name:'Iranian Missiles',role:'Ballistic & Cruise',cls:'iran',items:[
      {label:'🚀 Shahab-3 (MRBM, 1,300km)',val:'50+ launchers'},
      {label:'🎯 Emad (precision MRBM)',val:'30+'},
      {label:'🚀 Sejjil (solid-fuel MRBM)',val:'Unknown'},
      {label:'🚀 Fateh-110 (SRBM, 300km)',val:'200+'},
      {label:'🚀 Zolfaghar (SRBM, 700km)',val:'100+'},
      {label:'🎯 Soumar/Hoveyzeh (GLCM)',val:'Limited stock'},
      {label:'🚢 Khalij Fars (ASBM)',val:'Anti-ship — Hormuz'},
      {label:'🛩️ Shahed-136 (OWA drone)',val:'500+ deployed'},
    ]},
    {flag:'🇮🇱',name:'Israeli Systems',role:'Strike & Defense',cls:'israel',items:[
      {label:'⚡ F-35I Adir',val:'~50 aircraft'},
      {label:'🎯 F-15I Ra\'am',val:'~25 aircraft'},
      {label:'🛡️ Arrow-3 (exo-atmospheric)',val:'Active — proven'},
      {label:'🛡️ Arrow-2 (endo-atmospheric)',val:'Active'},
      {label:'🛡️ David\'s Sling (MRAD)',val:'Active'},
      {label:'🛡️ Iron Dome (SRAD)',val:'10+ batteries'},
      {label:'🚀 Popeye Turbo ALCM',val:'Deployed'},
      {label:'🎯 Delilah Cruise Missile',val:'Active use'},
    ]},
  ];

  // Head-to-head comparison bars
  const h2h=[
    {cat:'Combat Aircraft',coal:350,iran:40,coalLabel:'~350 (F-35, F-22, F-15, B-2)',iranLabel:'~40 operational'},
    {cat:'Cruise Missiles Fired',coal:700,iran:50,coalLabel:'700+ (Tomahawk, JASSM-ER)',iranLabel:'~50 (Soumar, Hoveyzeh)'},
    {cat:'Ballistic Missiles Fired',coal:0,iran:300,coalLabel:'N/A — precision strike focus',iranLabel:'300+ (Shahab, Emad, Fateh)'},
    {cat:'Air Defense Batteries',coal:28,iran:5,coalLabel:'28+ (Patriot, THAAD, SM-6)',iranLabel:'~5 remaining (S-300, Bavar)'},
    {cat:'Naval Combatants',coal:40,iran:0,coalLabel:'40+ (3 CSGs, SSGNs, DDGs)',iranLabel:'0 — Navy destroyed'},
    {cat:'Drones Deployed',coal:40,iran:500,coalLabel:'40+ MQ-9/RQ-4 (ISR focus)',iranLabel:'500+ Shahed-136 (attack)'},
  ];
  const maxBar=Math.max(...h2h.map(r=>Math.max(r.coal,r.iran)));

  weaponsEl.innerHTML=`
    <div style="background:var(--surface);padding:20px;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:.7rem;font-weight:700;color:var(--text);margin-bottom:16px;letter-spacing:1px">⚔ FORCE COMPARISON — HEAD TO HEAD</div>
      ${h2h.map(r=>{
        const coalPct=Math.max(5,r.coal/maxBar*100);
        const iranPct=Math.max(5,r.iran/maxBar*100);
        return '<div style="margin-bottom:14px">'+
          '<div style="font-family:var(--mono);font-size:.6rem;font-weight:600;color:var(--text);margin-bottom:6px">'+r.cat+'</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
            '<div>'+
              '<div style="display:flex;align-items:center;gap:6px">'+
                '<span style="font-family:var(--mono);font-size:.5rem;color:var(--blue);min-width:20px">🇺🇸🇮🇱</span>'+
                '<div style="flex:1;background:var(--border);border-radius:3px;height:10px;overflow:hidden">'+
                  '<div style="width:'+coalPct+'%;height:100%;background:var(--blue);border-radius:3px"></div>'+
                '</div>'+
              '</div>'+
              '<div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px;padding-left:26px">'+r.coalLabel+'</div>'+
            '</div>'+
            '<div>'+
              '<div style="display:flex;align-items:center;gap:6px">'+
                '<span style="font-family:var(--mono);font-size:.5rem;color:var(--iran);min-width:20px">🇮🇷</span>'+
                '<div style="flex:1;background:var(--border);border-radius:3px;height:10px;overflow:hidden">'+
                  '<div style="width:'+iranPct+'%;height:100%;background:var(--iran);border-radius:3px"></div>'+
                '</div>'+
              '</div>'+
              '<div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px;padding-left:26px">'+r.iranLabel+'</div>'+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1px;background:var(--border)">
    ${weapons.map(f=>{
      const sideColor=f.cls==='iran'?'var(--iran)':'var(--blue)';
      return '<div style="background:var(--surface);padding:20px;border-top:3px solid '+sideColor+'">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'+
          '<span style="font-size:1.6rem">'+f.flag+'</span>'+
          '<div>'+
            '<div style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--text)">'+f.name+'</div>'+
            '<div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:.5px">'+f.role+'</div>'+
          '</div>'+
        '</div>'+
        f.items.map(function(i){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">'+
          '<span style="font-family:var(--mono);font-size:.6rem;color:var(--text2)">'+i.label+'</span>'+
          '<span style="font-family:var(--mono);font-size:.6rem;font-weight:600;color:var(--text);text-align:right">'+i.val+'</span>'+
        '</div>';}).join('')+
      '</div>';
    }).join('')}
    </div>
  `;

  // Military Base Status — redesigned with map & satellite imagery
  const baseEl=document.getElementById('baseStatus');
  const baseMapEl=document.getElementById('baseMapContainer');
  const bases=[
    {name:'Isfahan Air Base (8th TFB)',role:'IRIAF Headquarters',type:'AIR BASE',status:'destroyed',damage:85,
      coord:{lat:32.78,lon:51.89},detail:'Runways cratered, 12+ aircraft destroyed on ground. Hardened shelters penetrated by MOP strikes. Completely non-operational. F-14 squadron eliminated.',
      img:'/images/assets/isfahan-air-base.jpg',
      stats:[{k:'Runway',v:'Cratered — non-operational'},{k:'Aircraft destroyed',v:'12+ confirmed'},{k:'Shelters breached',v:'8 of 12'},{k:'Last strike',v:'Mar 8'}]},
    {name:'Bandar Abbas Naval Base',role:'IRIN Main Fleet Base — Hormuz',type:'NAVAL BASE',status:'destroyed',damage:75,
      coord:{lat:27.15,lon:56.28},detail:'Primary Iranian naval installation on the Strait of Hormuz. Port facilities partially destroyed. Kilo-class submarines sunk at berth. Drydock destroyed.',
      img:'/images/assets/bandar-abbas-naval-base.jpg',
      stats:[{k:'Port facilities',v:'Partially destroyed'},{k:'Ships sunk in port',v:'6+'},{k:'Drydock',v:'Destroyed'},{k:'Last strike',v:'Mar 14'}]},
    {name:'Bushehr Air Base (6th TFB)',role:'IRGCAF — Southwest Coast',type:'AIR BASE',status:'destroyed',damage:90,
      coord:{lat:28.95,lon:50.83},detail:'SAM sites and hardened aircraft shelters destroyed by MOP and JASSM-ER strikes. Bavar-373 battery eliminated by F-35I. Two corvettes destroyed at adjacent naval pier.',
      img:'/images/assets/bushehr-air-base.jpg',
      stats:[{k:'SAM sites',v:'All destroyed'},{k:'Hardened shelters',v:'Penetrated — MOP'},{k:'Bavar-373',v:'Eliminated'},{k:'Last strike',v:'Mar 10'}]},
    {name:'Tabriz Air Base (2nd TFB)',role:'IRIAF — Northwest Azerbaijan',type:'AIR BASE',status:'damaged',damage:55,
      coord:{lat:38.13,lon:46.24},detail:'Runway partially repaired for limited operations. S-300 battery destroyed. MiG-29 squadron relocated before strike. Limited flight ops resumed.',
      img:'/images/assets/tabriz-air-base.jpg',
      stats:[{k:'Runway',v:'Repaired — limited ops'},{k:'S-300 battery',v:'Destroyed'},{k:'MiG-29s',v:'Relocated pre-strike'},{k:'Last strike',v:'Mar 12'}]},
    {name:'Chabahar Naval Base',role:'IRIN — Southeast Coast',type:'NAVAL BASE',status:'operational',damage:15,
      coord:{lat:25.29,lon:60.62},detail:'Least-damaged major base. Only limited strikes on radar installations. Receiving relocated vessels and acting as fallback port. Coastal defense missiles active.',
      img:'/images/assets/chabahar-naval-base.jpg',
      stats:[{k:'Status',v:'Operational — fallback port'},{k:'Radar installations',v:'Limited strikes'},{k:'Coastal defenses',v:'Active'},{k:'Last strike',v:'Mar 8'}]},
    {name:'Mehrabad / Ghale Morghi',role:'Tehran — Mixed Military/Civilian',type:'AIR BASE',status:'damaged',damage:45,
      coord:{lat:35.69,lon:51.31},detail:'Mixed military/civilian airfield. IRGC underground command bunker targeted with deep-penetration munitions. Civilian airport closed. Command dispersed.',
      stats:[{k:'IRGC bunker',v:'Deep strike attempted'},{k:'Civilian airport',v:'Closed'},{k:'Command',v:'Relocated — dispersed'},{k:'Last strike',v:'Mar 15'}]},
    {name:'Jask Naval Base',role:'IRGCN Forward Operating Base',type:'NAVAL BASE',status:'damaged',damage:50,
      coord:{lat:25.64,lon:57.77},detail:'IRGCN forward base. Fast attack craft pens destroyed. IRIS Makran sunk nearby. Coastal defense systems partially active.',
      stats:[{k:'Fast attack pens',v:'Destroyed'},{k:'Makran',v:'Sunk nearby'},{k:'Coastal defenses',v:'Partially active'},{k:'Last strike',v:'Mar 16'}]},
    {name:'Shiraz Air Base (7th TFB)',role:'IRIAF — Fars Province',type:'AIR BASE',status:'damaged',damage:50,
      coord:{lat:29.54,lon:52.59},detail:'F-4E Phantom base. Multiple hangars destroyed. Runway operational after emergency repairs. Limited sortie capability.',
      stats:[{k:'Hangars',v:'Multiple destroyed'},{k:'Runway',v:'Repaired — limited ops'},{k:'F-4E Phantoms',v:'Status unknown'},{k:'Last strike',v:'Mar 9'}]},
    {name:'Bandar Abbas Air Base',role:'IRIAF F-14 Base — Hormuz',type:'AIR BASE',status:'damaged',damage:60,
      coord:{lat:27.22,lon:56.38},detail:'IRIAF F-14 Tomcat base adjacent to naval facilities. Runway partially repaired. Limited flight ops. 4 F-14s confirmed destroyed on ground.',
      stats:[{k:'Runway',v:'Partially repaired'},{k:'F-14s destroyed',v:'4 confirmed'},{k:'Flight ops',v:'Limited'},{k:'Last strike',v:'Mar 14'}]},
    {name:'Bushehr Naval Base',role:'IRIN — Southwest Naval',type:'NAVAL BASE',status:'destroyed',damage:80,
      coord:{lat:28.91,lon:50.82},detail:'Two corvettes (Bayandor, Naghdi) destroyed at pier. Fuel storage hit with secondary explosions. Dockyard severely damaged. Adjacent to Bushehr Air Base.',
      stats:[{k:'Corvettes destroyed',v:'2 (Bayandor, Naghdi)'},{k:'Fuel storage',v:'Hit — secondary explosions'},{k:'Dockyard',v:'Severely damaged'},{k:'Last strike',v:'Mar 12'}]},
    // Missile Sites
    {name:'Imam Ali Missile Base',role:'Ballistic Missile Storage — Kermanshah',type:'MISSILE BASE',status:'destroyed',damage:80,
      coord:{lat:34.35,lon:47.16},detail:'Underground ballistic missile storage facility. Multiple GBU-57 MOP bunker-buster strikes confirmed. Launch pads destroyed. TEL vehicle staging area cratered.',
      stats:[{k:'Underground storage',v:'Struck — MOP penetrators'},{k:'Launch pads',v:'Destroyed'},{k:'TEL staging area',v:'Cratered'},{k:'Last strike',v:'Mar 5'}]},
    {name:'Tabriz Missile Complex',role:'Shahab-3 MRBM Garrison',type:'MISSILE BASE',status:'damaged',damage:55,
      coord:{lat:38.10,lon:46.30},detail:'Shahab-3 launcher garrison. Surface facilities destroyed. Underground tunnel network status unclear — may retain launch capability.',
      stats:[{k:'Surface facilities',v:'Destroyed'},{k:'Underground tunnels',v:'Status unclear'},{k:'Shahab-3 launchers',v:'Unknown survivors'},{k:'Last strike',v:'Mar 7'}]},
    {name:'Khorramabad Missile Site',role:'SRBM Storage — Lorestan',type:'MISSILE BASE',status:'damaged',damage:60,
      coord:{lat:33.49,lon:48.35},detail:'Zolfaghar and Fateh-110 SRBM storage facility. Launch rails destroyed. TEL vehicles dispersed to civilian areas before strike.',
      stats:[{k:'Launch rails',v:'Destroyed'},{k:'TEL vehicles',v:'Dispersed pre-strike'},{k:'Missile type',v:'Zolfaghar / Fateh-110'},{k:'Last strike',v:'Mar 6'}]},
    // Air Defense Sites
    {name:'Tehran IADS Hub',role:'Integrated Air Defense — Capital',type:'AIR DEFENSE',status:'damaged',damage:70,
      coord:{lat:35.72,lon:51.42},detail:'S-300PMU2 and Bavar-373 batteries defending Tehran. 3 of 5 S-300 launchers destroyed by HARM and JASSM strikes. Partial radar coverage remains.',
      stats:[{k:'S-300 launchers',v:'3 of 5 destroyed'},{k:'Bavar-373',v:'Engagement radar damaged'},{k:'Radar coverage',v:'Partial — degraded'},{k:'Last strike',v:'Mar 3'}]},
    {name:'Isfahan S-300 Battery',role:'Air Defense — Central Iran',type:'AIR DEFENSE',status:'destroyed',damage:95,
      coord:{lat:32.65,lon:51.70},detail:'Destroyed by SEAD/DEAD campaign in opening hours. HARM anti-radiation missiles followed by JASSM-ER. No radar emissions detected since Mar 3.',
      stats:[{k:'S-300 system',v:'Completely destroyed'},{k:'Radar emissions',v:'None detected'},{k:'Destroyed by',v:'HARM + JASSM-ER'},{k:'Last strike',v:'Mar 3'}]},
    {name:'Bushehr Bavar-373',role:'Indigenous Long-Range SAM',type:'AIR DEFENSE',status:'destroyed',damage:90,
      coord:{lat:28.98,lon:50.80},detail:'Iran\'s indigenous long-range SAM system (comparable to S-300). Engagement radar destroyed by Israeli F-35I strike. System non-functional.',
      stats:[{k:'Engagement radar',v:'Destroyed'},{k:'Destroyed by',v:'F-35I strike'},{k:'System status',v:'Non-functional'},{k:'Last strike',v:'Mar 4'}]},
  ];

  // Summary counts
  const baseCounts={destroyed:0,damaged:0,operational:0};
  bases.forEach(b=>{
    if(b.damage>=75) baseCounts.destroyed++;
    else if(b.damage>=30) baseCounts.damaged++;
    else baseCounts.operational++;
  });

  // Mini map helper — Iran outline with single pulsing marker per card
  const mapW=600,mapH=400;
  const lonToX=lon=>((lon-44)/(63.5-44))*mapW;
  const latToY=lat=>((40-lat)/(40-25))*mapH;
  const iranBorder=`M${lonToX(44.05)},${latToY(39.4)} L${lonToX(44.8)},${latToY(39.65)} L${lonToX(45.5)},${latToY(38.9)} L${lonToX(46.2)},${latToY(38.85)} L${lonToX(47.5)},${latToY(39.15)} L${lonToX(48.4)},${latToY(38.6)} L${lonToX(48.9)},${latToY(38.45)} L${lonToX(49)},${latToY(37.5)} L${lonToX(50.4)},${latToY(37.3)} L${lonToX(51.0)},${latToY(36.8)} L${lonToX(53.9)},${latToY(37.0)} L${lonToX(54.8)},${latToY(37.3)} L${lonToX(55.5)},${latToY(37.2)} L${lonToX(57.2)},${latToY(37.6)} L${lonToX(59.3)},${latToY(37.5)} L${lonToX(60.6)},${latToY(36.6)} L${lonToX(61.2)},${latToY(36.6)} L${lonToX(61.15)},${latToY(35.3)} L${lonToX(61.3)},${latToY(34.2)} L${lonToX(60.5)},${latToY(33.7)} L${lonToX(60.6)},${latToY(32.9)} L${lonToX(60.8)},${latToY(31.5)} L${lonToX(61.7)},${latToY(31.4)} L${lonToX(61.8)},${latToY(30.8)} L${lonToX(60.9)},${latToY(29.9)} L${lonToX(61.6)},${latToY(28.8)} L${lonToX(62.8)},${latToY(27.2)} L${lonToX(63.2)},${latToY(27.2)} L${lonToX(63.3)},${latToY(26.6)} L${lonToX(62.5)},${latToY(26.4)} L${lonToX(61.9)},${latToY(25.8)} L${lonToX(61.4)},${latToY(25.2)} L${lonToX(59.5)},${latToY(25.4)} L${lonToX(57.8)},${latToY(25.65)} L${lonToX(57.0)},${latToY(25.9)} L${lonToX(56.4)},${latToY(26.2)} L${lonToX(56.1)},${latToY(26.1)} L${lonToX(55.4)},${latToY(25.8)} L${lonToX(54.8)},${latToY(25.6)} L${lonToX(53.7)},${latToY(26.7)} L${lonToX(51.6)},${latToY(27.1)} L${lonToX(50.8)},${latToY(27.0)} L${lonToX(50.0)},${latToY(27.6)} L${lonToX(49.5)},${latToY(27.7)} L${lonToX(49.1)},${latToY(28.4)} L${lonToX(48.8)},${latToY(29.3)} L${lonToX(48.6)},${latToY(29.9)} L${lonToX(48.0)},${latToY(30.5)} L${lonToX(48.0)},${latToY(31.0)} L${lonToX(47.7)},${latToY(31.0)} L${lonToX(47.8)},${latToY(31.8)} L${lonToX(47.0)},${latToY(32.3)} L${lonToX(46.0)},${latToY(32.8)} L${lonToX(46.1)},${latToY(33.2)} L${lonToX(45.4)},${latToY(33.9)} L${lonToX(45.4)},${latToY(34.6)} L${lonToX(45.1)},${latToY(35.5)} L${lonToX(46.0)},${latToY(35.7)} L${lonToX(46.0)},${latToY(36.4)} L${lonToX(45.2)},${latToY(36.8)} L${lonToX(44.8)},${latToY(37.2)} L${lonToX(44.2)},${latToY(37.3)} L${lonToX(44.6)},${latToY(38.0)} L${lonToX(44.0)},${latToY(39.4)} Z`;

  function miniMapSvg(b){
    const x=lonToX(b.coord.lon),y=latToY(b.coord.lat);
    const col=b.damage>=75?'var(--red)':b.damage>=30?'var(--orange)':'var(--green)';
    return `<div style="overflow:hidden;border-radius:4px;margin-bottom:12px;border:1px solid var(--border);background:var(--bg)">
      <svg viewBox="0 0 ${mapW} ${mapH}" style="width:100%;height:130px" xmlns="http://www.w3.org/2000/svg">
        <path d="${iranBorder}" fill="rgba(139,148,158,0.06)" stroke="rgba(139,148,158,0.2)" stroke-width="1.5"/>
        <text x="${lonToX(51)}" y="${latToY(26.5)}" fill="rgba(88,166,255,0.2)" font-size="10" font-family="var(--mono)" text-anchor="middle">PERSIAN GULF</text>
        <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="${col}" stroke-width="1" opacity="0.6">
          <animate attributeName="r" from="8" to="24" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.7" to="0" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x}" cy="${y}" r="12" fill="none" stroke="${col}" stroke-width="0.5" opacity="0.4">
          <animate attributeName="r" from="12" to="32" dur="2s" begin="0.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${x}" cy="${y}" r="7" fill="${col}" stroke="var(--bg)" stroke-width="2" opacity="0.95"/>
        <text x="${x}" y="${y-14}" fill="var(--text)" font-size="8" font-family="var(--mono)" text-anchor="middle" font-weight="700">${b.name.split('(')[0].split('/')[0].trim()}</text>
        <text x="${x}" y="${y+20}" fill="var(--text3)" font-size="6.5" font-family="var(--mono)" text-anchor="middle">${b.coord.lat.toFixed(2)}°N, ${b.coord.lon.toFixed(2)}°E</text>
      </svg>
    </div>`;
  }

  baseMapEl.innerHTML='';

  baseEl.innerHTML=`
    <div class="fleet-summary" style="display:flex;gap:16px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border)">
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--red)"></div>DESTROYED/SEVERE: ${baseCounts.destroyed}</div>
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--orange)"></div>DAMAGED: ${baseCounts.damaged}</div>
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--green)"></div>OPERATIONAL: ${baseCounts.operational}</div>
      <div class="fleet-summary-item" style="margin-left:auto;color:var(--text3)">TOTAL: ${bases.length} INSTALLATIONS</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:1px;background:var(--border)">
    ${bases.map(b=>{
      const borderColor=b.damage>=75?'var(--red)':b.damage>=30?'var(--orange)':'var(--green)';
      const statusLabel=b.damage>=75?'SEVERELY DAMAGED':b.damage>=30?'DAMAGED':'OPERATIONAL';
      const statusClass=b.damage>=75?'destroyed':b.damage>=30?'damaged':'active';
      const typeIcon=b.type==='AIR BASE'?'✈️':b.type==='NAVAL BASE'?'⚓':'🎯';
      const dmgBarColor=b.damage>=75?'var(--red)':b.damage>=30?'var(--orange)':'var(--green)';
      return '<div style="background:var(--surface);padding:16px;border-left:3px solid '+borderColor+'">'+
        miniMapSvg(b)+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
          '<span style="font-size:1.2rem">'+typeIcon+'</span>'+
          '<div style="flex:1">'+
            '<div style="font-family:var(--mono);font-size:.8rem;font-weight:700;color:var(--text)">'+b.name+'</div>'+
            '<div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:.5px">'+b.role+'</div>'+
          '</div>'+
        '</div>'+
        '<div style="margin:10px 0;background:var(--border);border-radius:3px;height:6px;overflow:hidden">'+
          '<div style="width:'+b.damage+'%;height:100%;background:'+dmgBarColor+';border-radius:3px"></div>'+
        '</div>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:10px">'+
          '<span style="font-family:var(--mono);font-size:.55rem;color:var(--text3)">DAMAGE ASSESSMENT</span>'+
          '<span style="font-family:var(--mono);font-size:.55rem;font-weight:700;color:'+dmgBarColor+'">'+b.damage+'%</span>'+
        '</div>'+
        '<div style="font-family:var(--mono);font-size:.58rem;color:var(--text2);line-height:1.5;margin-bottom:10px">'+b.detail+'</div>'+
        '<div style="border-top:1px solid var(--border);padding-top:8px">'+
          b.stats.map(function(s){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">'+
            '<span style="font-family:var(--mono);font-size:.6rem;color:var(--text3)">'+s.k+'</span>'+
            '<span style="font-family:var(--mono);font-size:.6rem;font-weight:600;color:var(--text)">'+s.v+'</span>'+
          '</div>';}).join('')+
        '</div>'+
      '</div>';
    }).join('')}
    </div>
  `;

  // Nuclear Facilities
  const nukeEl=document.getElementById('nukeStatus');
  const nukes=[
    {name:'Natanz (FEP)',location:'Isfahan Province — Underground enrichment',status:'damaged',statusLabel:'STRUCK',detail:'Confirmed GBU-57 MOP and JASSM-ER strikes. Centrifuge halls partially destroyed. IAEA inspectors evacuated. Enrichment status unknown.'},
    {name:'Fordow (FFEP)',location:'Qom Province — Deep underground',status:'damaged',statusLabel:'STRUCK — UNCERTAIN',detail:'Multiple MOP strikes on mountain facility. Depth of penetration uncertain. Iran claims facility intact. US claims "functionally destroyed."'},
    {name:'Isfahan (UCF)',location:'Isfahan — Uranium conversion',status:'destroyed',statusLabel:'DESTROYED',detail:'UF6 conversion facility heavily struck. Satellite imagery shows complete destruction of above-ground structures.'},
    {name:'Arak (IR-40)',location:'Markazi Province — Heavy water reactor',status:'damaged',statusLabel:'DAMAGED',detail:'Modified reactor struck. Heavy water production halted. Radiation leak concerns reported by IAEA.'},
    {name:'Bushehr NPP',location:'Bushehr Province — Power reactor',status:'operational',statusLabel:'NOT TARGETED',detail:'Russian-built civilian reactor. Deliberately avoided per coalition ROE. IAEA monitoring continues.'},
    {name:'Parchin Military Complex',location:'Tehran Province — Weapons research',status:'destroyed',statusLabel:'DESTROYED',detail:'Multiple strikes confirmed. Suspected weaponization research facilities. Entire complex non-functional.'},
  ];

  // Summary
  const nukeCounts={destroyed:0,damaged:0,operational:0};
  nukes.forEach(n=>{nukeCounts[n.status]=(nukeCounts[n.status]||0)+1});

  nukeEl.innerHTML=`
    <div class="fleet-summary" style="display:flex;gap:16px;padding:10px 16px;background:var(--surface);border-bottom:1px solid var(--border);margin-bottom:0">
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--red)"></div>DESTROYED: ${nukeCounts.destroyed||0}</div>
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--orange)"></div>DAMAGED/STRUCK: ${nukeCounts.damaged||0}</div>
      <div class="fleet-summary-item"><div class="fleet-summary-dot" style="background:var(--green)"></div>NOT TARGETED: ${nukeCounts.operational||0}</div>
      <div class="fleet-summary-item" style="margin-left:auto;color:var(--text3)">TOTAL: ${nukes.length} FACILITIES</div>
    </div>
  `+nukes.map(n=>{
    const borderColor=n.status==='destroyed'?'var(--red)':n.status==='damaged'?'var(--orange)':'var(--green)';
    const bgColor=n.status==='destroyed'?'var(--red-dim)':n.status==='damaged'?'var(--orange-dim)':'var(--green-dim)';
    return `
    <div style="background:var(--surface);padding:18px 20px;border-bottom:1px solid var(--border);border-left:3px solid ${borderColor}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-family:var(--mono);font-size:.85rem;font-weight:700;color:var(--text)">☢ ${n.name}</div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);margin-top:2px">${n.location}</div>
        </div>
        <span style="display:inline-flex;align-items:center;gap:4px;font-family:var(--mono);font-size:.6rem;padding:3px 10px;border-radius:3px;background:${bgColor};color:${borderColor};font-weight:600">${n.statusLabel}</span>
      </div>
      <div style="font-size:.65rem;color:var(--text2);line-height:1.5">${n.detail}</div>
    </div>`;
  }).join('');

  // Casualty Estimates
  const casualtyEl=document.getElementById('casualtyStats');

  casualtyEl.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border)">
      <!-- Iran & Proxies -->
      <div style="background:var(--surface);padding:20px;border-top:3px solid var(--iran)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="font-size:1.8rem">🇮🇷</span>
          <div>
            <div style="font-family:var(--mono);font-size:.8rem;font-weight:700;color:var(--text)">IRAN & PROXY FORCES</div>
            <div style="font-family:var(--mono);font-size:.5rem;color:var(--text3)">IRGC + Artesh + Hezbollah + Houthis + PMF</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">💀</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--red)">1,200+</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">MILITARY KIA</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">IRGC + Artesh combined</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">🩹</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--orange)">3,500+</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">MILITARY WIA</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Estimated wounded</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">🚨</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--red)">800–2K</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">CIVILIAN DEATHS</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">UNVERIFIED — Iran claims higher</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">⚔️</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--orange)">920+</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">PROXY FORCES KIA</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Hezbollah 600+ · Houthis 120+ · PMF 200+</div>
          </div>
        </div>
      </div>
      <!-- Coalition -->
      <div style="background:var(--surface);padding:20px;border-top:3px solid var(--blue)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <span style="font-size:1.8rem">🇺🇸</span>
          <div>
            <div style="font-family:var(--mono);font-size:.8rem;font-weight:700;color:var(--text)">COALITION FORCES</div>
            <div style="font-family:var(--mono);font-size:.5rem;color:var(--text3)">United States + Israel + UK</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">🎖</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--orange)">~50</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">MILITARY KIA</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">US ~30 · Israel ~15 · UK ~5</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:2rem;margin-bottom:4px">🩹</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--orange)">~200</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">MILITARY WIA</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Including base attacks by proxies</div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border);grid-column:span 2">
            <div style="font-size:2rem;margin-bottom:4px">🚨</div>
            <div style="font-family:var(--mono);font-size:1.8rem;font-weight:700;color:var(--red)">250+</div>
            <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">ISRAELI CIVILIAN DEATHS</div>
            <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">From Hezbollah rocket + Iranian ballistic missile attacks</div>
          </div>
        </div>
      </div>
    </div>
    <!-- Humanitarian Impact -->
    <div style="background:var(--surface);border-top:1px solid var(--border);padding:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:1.8rem">🌍</span>
        <div>
          <div style="font-family:var(--mono);font-size:.8rem;font-weight:700;color:var(--text)">HUMANITARIAN IMPACT</div>
          <div style="font-family:var(--mono);font-size:.5rem;color:var(--text3)">Displacement, economic damage & press freedom</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">
        <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:1.8rem;margin-bottom:4px">🏚</div>
          <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--blue)">30M+</div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">INTERNALLY DISPLACED</div>
          <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Within Iran</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:1.8rem;margin-bottom:4px">🚶</div>
          <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--blue)">2M+</div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">REFUGEES</div>
          <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">To Turkey, Iraq, Pakistan</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:1.8rem;margin-bottom:4px">💰</div>
          <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--orange)">$2T+</div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">ECONOMIC DAMAGE</div>
          <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Infrastructure + oil disruption</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--bg);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:1.8rem;margin-bottom:4px">📷</div>
          <div style="font-family:var(--mono);font-size:1.6rem;font-weight:700;color:var(--text2)">45+</div>
          <div style="font-family:var(--mono);font-size:.55rem;color:var(--text3);letter-spacing:1px">JOURNALIST CASUALTIES</div>
          <div style="font-family:var(--mono);font-size:.45rem;color:var(--text3);margin-top:2px">Killed or missing</div>
        </div>
      </div>
    </div>
    <div style="padding:10px 20px;font-family:var(--mono);font-size:.45rem;color:var(--text3);background:var(--surface);border-top:1px solid var(--border)">
      ⚠️ ALL FIGURES ARE ESTIMATES BASED ON OPEN-SOURCE REPORTING · Numbers may be significantly higher. Iran restricts independent verification. Coalition figures from official briefings.
    </div>
  `;
}
