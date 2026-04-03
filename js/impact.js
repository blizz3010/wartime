// ===== WARTIME IMPACT JS =====
// Impact statistics dashboard

// ===== IMPACT / STATISTICS DASHBOARD =====
function renderImpactDashboard(){
  // Estimated conflict statistics (from open-source reports)
  const conflictDays=Math.floor((new Date()-new Date('2026-02-28T00:00:00Z'))/(1000*60*60*24))+1;
  const stats=[
    {val:conflictDays+'+',label:'Days of Conflict',color:'var(--red)',sub:'Since Feb 28, 2026'},
    {val:'115+',label:'Confirmed Strikes',color:'var(--orange)',sub:'On Iranian territory'},
    {val:'CLOSED',label:'Strait of Hormuz',color:'var(--red)',sub:'Oil transit blocked'},
    {val:'$105+',label:'Brent Crude /bbl',color:'var(--orange)',sub:'Up from ~$75 pre-conflict'},
    {val:'~4%',label:'Iran Internet',color:'var(--red)',sub:'Near-total shutdown'},
    {val:'7+',label:'Countries Involved',color:'var(--blue)',sub:'Direct or proxy participation'},
    {val:'100+',label:'UN Resolutions Filed',color:'var(--blue)',sub:'Security Council deadlocked'},
    {val:'30M+',label:'Displaced Estimates',color:'var(--green)',sub:'Internal + cross-border'},
  ];

  const statsEl=document.getElementById('impactStats');
  statsEl.innerHTML=stats.map(s=>`
    <div class="impact-card">
      <div class="impact-val" style="color:${s.color}">${s.val}</div>
      <div class="impact-label">${s.label}</div>
      <div class="impact-sub">${s.sub}</div>
    </div>
  `).join('');

  // Infrastructure bars
  const bars=[
    {label:'Power Grid',pct:25,color:'var(--red)'},
    {label:'Internet',pct:4,color:'var(--red)'},
    {label:'Airports',pct:15,color:'var(--red)'},
    {label:'Oil Infrastructure',pct:30,color:'var(--orange)'},
    {label:'Military Bases',pct:35,color:'var(--orange)'},
    {label:'Water Supply',pct:55,color:'var(--orange)'},
    {label:'Hospitals',pct:60,color:'var(--green)'},
    {label:'Telecom',pct:20,color:'var(--red)'},
  ];

  const barsEl=document.getElementById('impactBars');
  barsEl.innerHTML=bars.map(b=>`
    <div class="impact-bar">
      <div class="impact-bar-label">${b.label}</div>
      <div class="impact-bar-track">
        <div class="impact-bar-fill" style="width:${b.pct}%;background:${b.color}"></div>
      </div>
      <span style="font-family:var(--mono);font-size:.6rem;color:var(--text3);width:35px;text-align:right">${b.pct}%</span>
    </div>
  `).join('')+'<div style="font-family:var(--mono);font-size:.5rem;color:var(--text3);margin-top:8px">Estimated operational capacity remaining</div>';

  // Key events timeline
  const events=[
    {date:'Mar 22',text:'Continued strikes on IRGC positions; Strait of Hormuz remains closed; 3rd carrier group arrives'},
    {date:'Mar 21',text:'USCYBERCOM confirms offensive cyber operations against IRGC C2 networks'},
    {date:'Mar 20',text:'UN emergency session; China & Russia veto ceasefire; Iran fires Shahab-3 salvo at Al Dhafra'},
    {date:'Mar 19',text:'B-2 Spirit strikes on Fordow nuclear facility with GBU-57 MOP bunker busters'},
    {date:'Mar 18',text:'Major cyberattack disrupts Iranian communications; internet drops to ~4% capacity'},
    {date:'Mar 17',text:'Iraqi PMF launches 30+ drones at US forces at Al Asad Air Base'},
    {date:'Mar 16',text:'Israel intercepts ballistic missile barrage with Arrow-3; Hezbollah fires 500+ rockets'},
    {date:'Mar 15',text:'USS Gerald Ford CSG deploys to Persian Gulf; total 3 carrier groups in theater'},
    {date:'Mar 14',text:'Iran Kilo-class submarine sunk at Bandar Abbas; IRIN surface fleet heavily damaged'},
    {date:'Mar 12',text:'Iran retaliatory missile barrage (300+ missiles) targeting Israeli military installations'},
    {date:'Mar 11',text:'Houthis fire anti-ship missile at USS Eisenhower; SM-6 intercept confirmed'},
    {date:'Mar 10',text:'Houthi forces escalate Red Sea attacks; 12+ commercial ships hit to date'},
    {date:'Mar 8',text:'Saudi Arabia grants US access to Prince Sultan Air Base; RSAF on full alert'},
    {date:'Mar 7',text:'Brent crude surpasses $110/barrel; OPEC emergency meeting; global markets crash'},
    {date:'Mar 5',text:'Iran activates Basij militia; 600,000+ called to mobilize for national defense'},
    {date:'Mar 4',text:'First confirmed strikes on Natanz nuclear facility; IAEA inspectors evacuated'},
    {date:'Mar 3',text:'SEAD/DEAD campaign destroys 80% of Iranian integrated air defense system'},
    {date:'Mar 2',text:'Tomahawk and JASSM-ER strikes on 200+ IRGC targets across Iran'},
    {date:'Mar 1',text:'US and Israel commence joint military operations — Operation designation classified'},
    {date:'Feb 28',text:'Conflict begins: coordinated strikes on IRGC targets; Iran closes Strait of Hormuz'},
  ];

  const timelineEl=document.getElementById('impactTimeline');
  timelineEl.innerHTML=`<div style="padding:16px 20px">${events.map(e=>`
    <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="font-family:var(--mono);font-size:.7rem;font-weight:700;color:var(--orange);min-width:60px;white-space:nowrap">${e.date}</div>
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--text);line-height:1.5">${e.text}</div>
    </div>
  `).join('')}</div>`;

  // Cyber operations
  const cyberOps=[
    {date:'Mar 21',actor:'🇺🇸 USCYBERCOM',target:'IRGC C2 Networks',detail:'Offensive cyber ops disrupting command & control communications across IRGC network'},
    {date:'Mar 18',actor:'🇺🇸 / 🇮🇱 Joint',target:'Iranian Telecom Infrastructure',detail:'Coordinated attack bringing Iran internet to ~4% normal capacity; mobile networks disabled'},
    {date:'Mar 15',actor:'🇮🇷 APT33/Elfin',target:'US CENTCOM Contractors',detail:'Spear-phishing campaign targeting defense contractors; largely mitigated by CISA'},
    {date:'Mar 12',actor:'🇮🇱 Unit 8200',target:'Iranian Air Defense Radars',detail:'Electronic warfare / cyber disruption of S-300 and Bavar-373 radar systems prior to airstrikes'},
