// contrib.json (GitHub GraphQL contributionCalendar) -> dist/messi-goal.svg
// Aerial play: Xavi(#6) passes to Messi(#10) at bottom-mid; Messi dribbles up & forward past
// the real commits (they grey out), beats the aerial goalkeeper and scores; commentary tab
// reads "XAVI -> MESSI" then "ANKARA MESSI"; on the goal the board erupts and spells GOAL GOAL GOAL GOAL.
const fs = require('fs');
const cal = JSON.parse(fs.readFileSync("contrib.json", "utf8")).data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks;

const CELL = 11, GAP = 3, PITCH = CELL + GAP;
const GX = 34, GY = 24;
const COLS = weeks.length;
const W = 870, H = 150, LOOP = 11.0;
const f = x => (Math.round(x * 100) / 100);
const PAL = { NONE:"#161b22", FIRST_QUARTILE:"#0e4429", SECOND_QUARTILE:"#006d32", THIRD_QUARTILE:"#26a641", FOURTH_QUARTILE:"#39d353" };
const GREY = "#6e7681";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
let _s=42; const rnd=()=>{ _s=(_s*1103515245+12345)&0x7fffffff; return _s/0x7fffffff; };

// ---- choreography ----
const MID = GY + 3*PITCH;
const T0=3, T_PASS0=6, T_RECV=19, TG=74;          // TG lower => Messi a bit faster
const SIX   = [W*0.20, MID];                       // Xavi #6: mid height, 20% across
const START = [W*0.50, GY + 6*PITCH + 1];          // Messi #10: bottom mid
const PLANT = [W - 80, MID];
const GOAL_CY = MID, IMPACT_X = W - 43;
function messi(t){
  if (t <= T_RECV) return [START[0], START[1]];
  if (t <= TG){ const fr=(t-T_RECV)/(TG-T_RECV);
    return [START[0]+fr*(PLANT[0]-START[0]), START[1]+fr*(PLANT[1]-START[1]) + 13*Math.sin(fr*Math.PI*2*2.2)]; }
  return [PLANT[0], PLANT[1]];
}

// ---- commits + dodge (beaten -> grey + slide aside) ----
const THRESH=22, samples=[];
for(let t=T_RECV;t<=TG;t+=0.5){ const [x,y]=messi(t); samples.push([t,x,y]); }
let cells=[], dodgeKf=[], dk=0;
weeks.forEach((w,c)=>{ w.contributionDays.forEach(d=>{
  const x=GX+c*PITCH, y=GY+d.weekday*PITCH, base=PAL[d.contributionLevel]||PAL.NONE;
  const green=d.contributionLevel && d.contributionLevel!=="NONE"; let extra="";
  if(green){ const ccx=x+CELL/2, ccy=y+CELL/2; let best=1e9,bt=0,bmx=0,bmy=0;
    for(const [t,mx,my] of samples){ const dd=Math.hypot(ccx-mx,ccy-my); if(dd<best){best=dd;bt=t;bmx=mx;bmy=my;} }
    if(best<THRESH){ let dx=ccx-bmx,dy=ccy-bmy; const m=Math.hypot(dx,dy)||1;
      const push=Math.min(13,6+(THRESH-best)/THRESH*8); dx=dx/m*push; dy=dy/m*push;
      const pre=clamp(bt-1,0.5,82), hit=clamp(bt+1.5,pre+0.6,84);
      dodgeKf.push(`@keyframes dodge${dk} { 0% {transform:translate(0,0);fill:${base}} ${f(pre)}% {transform:translate(0,0);fill:${base}} ${f(hit)}% {transform:translate(${f(dx)}px,${f(dy)}px);fill:${GREY}} 99% {transform:translate(${f(dx)}px,${f(dy)}px);fill:${GREY}} 100% {transform:translate(0,0);fill:${base}} }`);
      extra=` style="animation: dodge${dk} ${LOOP}s ease-out infinite"`; dk++; } }
  cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${base}"${extra}/>`);
}); });
cells=cells.join("\n      "); dodgeKf=dodgeKf.join("\n      ");

// ---- labels ----
let monthLabels=[], lastM=-1;
weeks.forEach((w,c)=>{ const m=parseInt(w.firstDay.split("-")[1],10)-1; if(m!==lastM && c<COLS-1){ monthLabels.push(`<text x="${GX+c*PITCH}" y="${GY-7}" font-size="9" fill="#7d8590">${MONTHS[m]}</text>`); lastM=m; } });
monthLabels=monthLabels.join("\n      ");
const dayLabels=[[1,"Mon"],[3,"Wed"],[5,"Fri"]].map(([r,t])=>`<text x="${GX-6}" y="${GY+r*PITCH+CELL-2}" font-size="9" fill="#7d8590" text-anchor="end">${t}</text>`).join("\n      ");

// ---- player keyframes ----
let runKf=[];
runKf.push(`  0% { transform:translate(${f(START[0])}px,${f(START[1])}px); opacity:0; }`);
runKf.push(`  3% { transform:translate(${f(START[0])}px,${f(START[1])}px); opacity:1; }`);
for(let t=5;t<=TG;t+=3){ const [x,y]=messi(t); runKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
runKf.push(`  76% { transform:translate(786px,${f(MID)}px); }`);
runKf.push(`  77% { transform:translate(797px,${f(MID)}px); }`);
runKf.push(`  79% { transform:translate(788px,${f(MID)}px); }`);
runKf.push(`  84% { transform:translate(788px,${f(MID)}px); opacity:1; }`);
runKf.push(`  87% { transform:translate(788px,${f(MID)}px); opacity:0; }`);
runKf.push(`  100% { transform:translate(${f(START[0])}px,${f(START[1])}px); opacity:0; }`);
runKf=runKf.join("\n");

// ---- ball: at Xavi, passed, carried forward, struck ----
const TOUCHES=14;
function ballCarry(t){ const [mx,my]=messi(t); const off=15+5*Math.sin(2*Math.PI*TOUCHES*((t-T_RECV)/(TG-T_RECV))); return [mx+off, my]; }
const BALL6=[SIX[0]+9, SIX[1]], BALLRECV=[START[0]+11, START[1]];
let ballKf=[];
ballKf.push(`  0% { transform:translate(${f(BALL6[0])}px,${f(BALL6[1])}px); opacity:0; }`);
ballKf.push(`  3% { transform:translate(${f(BALL6[0])}px,${f(BALL6[1])}px); opacity:1; }`);
ballKf.push(`  6% { transform:translate(${f(BALL6[0])}px,${f(BALL6[1])}px); }`);
ballKf.push(`  ${T_RECV}% { transform:translate(${f(BALLRECV[0])}px,${f(BALLRECV[1])}px); }`);
for(let t=T_RECV+2;t<=72;t+=3){ const [x,y]=ballCarry(t); ballKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
ballKf.push(`  75% { transform:translate(800px,${f(MID)}px); }`);
ballKf.push(`  77% { transform:translate(812px,${f(MID)}px); }`);
ballKf.push(`  79% { transform:translate(${f(IMPACT_X)}px,${f(MID)}px); }`);
ballKf.push(`  86% { transform:translate(${f(IMPACT_X+3)}px,${f(MID+2)}px); opacity:1; }`);
ballKf.push(`  87.5% { opacity:0; }`);
ballKf.push(`  100% { transform:translate(${f(BALL6[0])}px,${f(BALL6[1])}px); opacity:0; }`);
ballKf=ballKf.join("\n");

// ---- goal + aerial keeper ----
const GX0=W-70, GY0=GOAL_CY-26, GY1=GOAL_CY+26;
let net=[];
for(let gx=GX0+4; gx<W-6; gx+=6) net.push(`<line x1="${gx}" y1="${GY0+2}" x2="${gx}" y2="${GY1-2}"/>`);
for(let gy=GY0+4; gy<GY1; gy+=6) net.push(`<line x1="${GX0+2}" y1="${gy}" x2="${W-8}" y2="${gy}"/>`);
net=net.join("\n      ");

// ---- BOOM star ----
let star=[]; for(let i=0;i<20;i++){ const r=i%2===0?17:7; const a=i*Math.PI/10-Math.PI/2; star.push(`${f(r*Math.cos(a))},${f(r*Math.sin(a))}`); } star=star.join(" ");

// ---- finale message: blocks spell GOAL GOAL GOAL GOAL ----
const FONT = { G:[".###","#...","#.##","#..#",".###"], O:["####","#..#","#..#","#..#","####"], A:[".##.","#..#","####","#..#","#..#"], L:["#...","#...","#...","#...","####"] };
const MSG="GOAL GOAL GOAL GOAL", MP=9, MC=7;
let mxp=0, pts=[];
for(const ch of MSG){ if(ch===" "){ mxp+=3*MP; continue; } const g=FONT[ch]; for(let r=0;r<5;r++) for(let c=0;c<4;c++) if(g[r][c]==="#") pts.push([mxp+c*MP, r*MP]); mxp+=5*MP; }
const msgW=mxp-MP, msgX=(W-msgW)/2, msgY=(H-5*MP)/2;
const msgRects = pts.map(([px,py])=>`<rect class="pcell" x="${f(msgX+px)}" y="${f(msgY+py)}" width="${MC}" height="${MC}" rx="1.5" fill="#39d353"/>`).join("\n      ");

// ---- confetti ----
const CC=["#EDBB00","#A50044","#004D98","#39d353","#ffffff"]; let confetti=[];
for(let i=0;i<24;i++){ const cxp=W/2+(rnd()-0.5)*560, cyp=MID+(rnd()-0.5)*70, sz=(2+rnd()*2.2).toFixed(1), col=CC[Math.floor(rnd()*CC.length)];
  confetti.push(`<rect class="conf" x="${f(cxp)}" y="${f(cyp)}" width="${sz}" height="${sz}" rx="0.7" fill="${col}"/>`); }
confetti=confetti.join("\n      ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Aerial play: Xavi passes to Messi who dribbles past my real commits, beats the keeper and scores; the board erupts GOAL GOAL GOAL GOAL">
  <defs>
    <clipPath id="round"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>
    <style>
      rect[style] { transform-box: fill-box; }
      .grid, .scene { animation: gridfade ${LOOP}s ease-in-out infinite; }
      .msg  { opacity: 0; animation: msgshow ${LOOP}s ease-out infinite; }
      .run  { animation: run ${LOOP}s ease-in-out infinite; }
      .ball { animation: ball ${LOOP}s cubic-bezier(.7,0,.9,.4) infinite; }
      .spin { animation: spin 0.5s linear infinite; transform-box: fill-box; transform-origin: center; }
      .gk { animation: gk ${LOOP}s ease-in-out infinite; }
      .six { animation: sixfade ${LOOP}s ease-in-out infinite; }
      .netflash { opacity: 0; animation: flash ${LOOP}s ease-out infinite; }
      .streak { opacity: 0; animation: streak ${LOOP}s linear infinite; }
      .boom { opacity: 0; animation: boom ${LOOP}s ease-out infinite; }
      .erupt { opacity: 0; animation: erupt ${LOOP}s ease-out infinite; }
      .pcell { animation: party 1.1s linear infinite; }
      .conf { opacity: 0; animation: conf ${LOOP}s ease-out infinite; }
      .cmt { opacity: 0; animation: cmt ${LOOP}s linear infinite; }
      .cm-pass { opacity: 0; animation: cmpass ${LOOP}s linear infinite; }
      .cm-drib { opacity: 0; animation: cmdrib ${LOOP}s linear infinite; }
      .cm-blink { animation: blink 0.5s ease-in-out infinite; }
      text { font-family: 'Sora','Poppins','Segoe UI',Verdana,sans-serif; }
      @keyframes gridfade { 0%,84% {opacity:1} 87% {opacity:0} 99% {opacity:0} 100% {opacity:1} }
      @keyframes msgshow { 0%,86% {opacity:0} 88% {opacity:1} 98% {opacity:1} 99.5% {opacity:0} 100% {opacity:0} }
      @keyframes run {
${runKf}
      }
      @keyframes ball {
${ballKf}
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes gk { 0%,72% {transform:translate(0,0)} 75% {transform:translate(1px,-9px)} 78% {transform:translate(2px,-22px)} 86% {transform:translate(2px,-22px)} 100% {transform:translate(0,0)} }
      @keyframes sixfade { 0% {opacity:0} 2% {opacity:1} 84% {opacity:1} 87% {opacity:0} 100% {opacity:0} }
      @keyframes flash { 0%,76% {opacity:0} 79% {opacity:0.85} 86% {opacity:0} 100% {opacity:0} }
      @keyframes streak { 0%,74.5% {opacity:0} 76% {opacity:0.9} 79% {opacity:0} 100% {opacity:0} }
      @keyframes boom {
        0%,76% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.1); }
        79% { opacity:1; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.95); }
        81% { opacity:1; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(1.1); }
        86% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(1.6); }
        100% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.1); }
      }
      @keyframes erupt { 0%,77% {opacity:0} 79% {opacity:0.5} 81% {opacity:0.12} 83% {opacity:0.45} 86% {opacity:0} 100% {opacity:0} }
      @keyframes party { 0% {fill:#39d353} 33% {fill:#EDBB00} 66% {fill:#A50044} 100% {fill:#39d353} }
      @keyframes conf { 0%,86% {opacity:0; transform:translateY(-10px)} 89% {opacity:1; transform:translateY(0)} 97% {opacity:0.9; transform:translateY(30px)} 99% {opacity:0} 100% {opacity:0} }
      @keyframes cmt { 0%,4% {opacity:0} 6% {opacity:1} 78% {opacity:1} 81% {opacity:0} 100% {opacity:0} }
      @keyframes cmpass { 0%,5% {opacity:0} 7% {opacity:1} 18% {opacity:1} 20% {opacity:0} 100% {opacity:0} }
      @keyframes cmdrib { 0%,20% {opacity:0} 22% {opacity:1} 77% {opacity:1} 79% {opacity:0} 100% {opacity:0} }
      @keyframes blink { 0%,100% {opacity:1} 50% {opacity:0.3} }
      ${dodgeKf}
    </style>
  </defs>

  <g clip-path="url(#round)">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0d1117"/>

    <g class="grid">
      ${monthLabels}
      ${dayLabels}
      ${cells}
    </g>

    <rect class="erupt" x="0" y="0" width="${W}" height="${H}" fill="#EDBB00"/>

    <g class="scene">
      <g stroke="#ffffff" stroke-opacity="0.35" stroke-width="1">
        ${net}
      </g>
      <rect class="netflash" x="${GX0+2}" y="${GY0+2}" width="${W-12-GX0}" height="${GY1-GY0-4}" fill="#EDBB00"/>
      <rect x="${GX0-2}" y="${GY0}" width="3.5" height="${GY1-GY0}" fill="#ffffff"/>
      <circle cx="${GX0}" cy="${GY0}" r="2.6" fill="#ffffff"/>
      <circle cx="${GX0}" cy="${GY1}" r="2.6" fill="#ffffff"/>
      <g class="gk">
        <rect x="${GX0+1}" y="${GOAL_CY-11}" width="4" height="22" rx="2" fill="#1f1300"/>
        <circle cx="${GX0+3}" cy="${GOAL_CY-11}" r="2.6" fill="#ffd23f" stroke="#1f1300" stroke-width="0.5"/>
        <circle cx="${GX0+3}" cy="${GOAL_CY+11}" r="2.6" fill="#ffd23f" stroke="#1f1300" stroke-width="0.5"/>
        <ellipse cx="${GX0+3}" cy="${GOAL_CY}" rx="5" ry="6.5" fill="#ff8a1f" stroke="#1f1300" stroke-width="0.7"/>
        <circle cx="${GX0+3}" cy="${GOAL_CY}" r="2.5" fill="#3a2a1a"/>
      </g>
    </g>

    <g class="cmt">
      <rect x="32" y="21" width="92" height="30" rx="5" fill="#0d1117" fill-opacity="0.92" stroke="#EDBB00" stroke-width="1.4"/>
      <circle cx="41" cy="29" r="2.2" fill="#A50044"/>
      <text x="47" y="31.4" font-size="6.5" font-weight="700" letter-spacing="1.5" fill="#9aa4ad">LIVE</text>
      <g class="cm-pass"><text x="78" y="45" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">XAVI → MESSI</text></g>
      <g class="cm-drib"><text class="cm-blink" x="78" y="45.5" text-anchor="middle" font-size="10.5" font-weight="800" fill="#EDBB00">ANKARA MESSI</text></g>
    </g>

    <line class="streak" x1="800" y1="${MID}" x2="${IMPACT_X-4}" y2="${MID}" stroke="#EDBB00" stroke-width="3" stroke-linecap="round"/>

    <g class="six">
      <rect x="${SIX[0]-8}" y="${SIX[1]-8}" width="16" height="16" rx="3.5" fill="#004D98"/>
      <rect x="${SIX[0]-8}" y="${SIX[1]-8}" width="4" height="16" fill="#A50044"/>
      <rect x="${SIX[0]}"   y="${SIX[1]-8}" width="4" height="16" fill="#A50044"/>
      <rect x="${SIX[0]-8}" y="${SIX[1]-8}" width="16" height="16" rx="3.5" fill="none" stroke="#0a1a30" stroke-width="1"/>
      <text x="${SIX[0]}" y="${SIX[1]+3.6}" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff" stroke="#0a1a30" stroke-width="0.6" paint-order="stroke">6</text>
    </g>

    <g class="run">
      <rect x="-8" y="-8" width="16" height="16" rx="3.5" fill="#004D98"/>
      <rect x="-8" y="-8" width="4" height="16" fill="#A50044"/>
      <rect x="0"  y="-8" width="4" height="16" fill="#A50044"/>
      <rect x="-8" y="-8" width="16" height="16" rx="3.5" fill="none" stroke="#0a1a30" stroke-width="1"/>
      <text x="0" y="3.6" text-anchor="middle" font-size="11" font-weight="900" fill="#EDBB00" stroke="#0a1a30" stroke-width="0.6" paint-order="stroke">10</text>
    </g>

    <g class="ball">
      <g class="spin">
        <circle r="2.6" fill="#ffffff" stroke="#111" stroke-width="0.45"/>
        <polygon points="0,-1.4 1.3,-0.4 0.8,1.2 -0.8,1.2 -1.3,-0.4" fill="#111"/>
      </g>
    </g>

    <g class="boom">
      <polygon points="${star}" fill="#EDBB00" stroke="#A50044" stroke-width="1.5" stroke-linejoin="round"/>
      <circle r="4" fill="#fffbe6"/>
      <text x="0" y="3.5" text-anchor="middle" font-size="9" font-weight="900" fill="#A50044">BOOM</text>
    </g>

    <g class="msg">
      ${msgRects}
    </g>
    <g class="confetti">
      ${confetti}
    </g>
  </g>

  <rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="14" fill="none" stroke="#A50044" stroke-width="2.5"/>
</svg>
`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/messi-goal.svg", svg);
console.log("dist/messi-goal.svg | beaten:", dk, "| msg blocks:", pts.length, "| confetti:", 24, "| bytes:", svg.length);
