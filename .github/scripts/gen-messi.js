// contrib.json (GitHub GraphQL contributionCalendar) -> dist/messi-goal.svg
// Real contribution grid. Messi carries a tiny ball, dribbles PAST commits (each beaten commit
// greys out + slides aside), plants and KICKS it into the net with a BOOM, then the whole grid
// vanishes and the blocks reassemble to spell "GOAL ANKARA MESSI" before looping.
const fs = require('fs');

const cal = JSON.parse(fs.readFileSync("contrib.json", "utf8")).data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks;

const CELL = 11, GAP = 3, PITCH = CELL + GAP;
const GX = 34, GY = 24;
const COLS = weeks.length;
const gridRight = GX + (COLS - 1) * PITCH + CELL;
const W = 870, H = 150, LOOP = 11.0;
const f = x => (Math.round(x * 100) / 100);

const PAL = { NONE:"#161b22", FIRST_QUARTILE:"#0e4429", SECOND_QUARTILE:"#006d32", THIRD_QUARTILE:"#26a641", FOURTH_QUARTILE:"#39d353" };
const GREY = "#6e7681";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ---- path ----
const MID = GY + 3 * PITCH;
const AMP = 3 * PITCH, WEAVES = 5;
const T0 = 3, TG = 78;
const xStart = GX - 14, xGridEnd = gridRight + 2;
const GOAL_CY = MID, IMPACT_X = W - 43;
function messi(t){
  if (t <= T0) return [xStart, MID];
  if (t <= TG){ const fr=(t-T0)/(TG-T0); return [xStart+fr*(xGridEnd-xStart), MID+AMP*Math.sin(fr*Math.PI*2*WEAVES)]; }
  return [xGridEnd, MID];
}
function tangent(t){ const [ax,ay]=messi(Math.max(0,t-0.6)), [bx,by]=messi(Math.min(TG,t+0.6)); let dx=bx-ax,dy=by-ay; const m=Math.hypot(dx,dy); return m<0.001?[1,0]:[dx/m,dy/m]; }
const uniq = a => [...new Set(a)].sort((p,q)=>p-q);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

// ---- commits + dodge (beaten -> grey + slide aside, stays beaten) ----
const THRESH = 22;
const samples = [];
for (let t=T0;t<=TG;t+=0.5){ const [x,y]=messi(t); samples.push([t,x,y]); }

let cells=[], dodgeKf=[], dk=0;
weeks.forEach((w,c)=>{
  w.contributionDays.forEach(d=>{
    const x=GX+c*PITCH, y=GY+d.weekday*PITCH;
    const base=PAL[d.contributionLevel]||PAL.NONE;
    const green=d.contributionLevel && d.contributionLevel!=="NONE";
    let extra="";
    if(green){
      const ccx=x+CELL/2, ccy=y+CELL/2;
      let best=1e9,bt=0,bmx=0,bmy=0;
      for(const [t,mx,my] of samples){ const dd=Math.hypot(ccx-mx,ccy-my); if(dd<best){best=dd;bt=t;bmx=mx;bmy=my;} }
      if(best<THRESH){
        let dx=ccx-bmx, dy=ccy-bmy; const m=Math.hypot(dx,dy)||1;
        const push=Math.min(13, 6+(THRESH-best)/THRESH*8); dx=dx/m*push; dy=dy/m*push;
        const pre=clamp(bt-1,0.5,94), hit=clamp(bt+1.5,pre+0.6,96);
        dodgeKf.push(`@keyframes dodge${dk} { 0% {transform:translate(0,0);fill:${base}} ${f(pre)}% {transform:translate(0,0);fill:${base}} ${f(hit)}% {transform:translate(${f(dx)}px,${f(dy)}px);fill:${GREY}} 99% {transform:translate(${f(dx)}px,${f(dy)}px);fill:${GREY}} 100% {transform:translate(0,0);fill:${base}} }`);
        extra=` style="animation: dodge${dk} ${LOOP}s ease-out infinite"`; dk++;
      }
    }
    cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${base}"${extra}/>`);
  });
});
cells=cells.join("\n      ");
dodgeKf=dodgeKf.join("\n      ");

// ---- labels ----
let monthLabels=[], lastM=-1;
weeks.forEach((w,c)=>{ const m=parseInt(w.firstDay.split("-")[1],10)-1; if(m!==lastM && c<COLS-1){ monthLabels.push(`<text x="${GX+c*PITCH}" y="${GY-7}" font-size="9" fill="#7d8590">${MONTHS[m]}</text>`); lastM=m; } });
monthLabels=monthLabels.join("\n      ");
const dayLabels=[[1,"Mon"],[3,"Wed"],[5,"Fri"]].map(([r,t])=>`<text x="${GX-6}" y="${GY+r*PITCH+CELL-2}" font-size="9" fill="#7d8590" text-anchor="end">${t}</text>`).join("\n      ");

// ---- player: dribble, then plant + KICK ----
let runKf=[];
runKf.push(`  0% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:0; }`);
runKf.push(`  3% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:1; }`);
for(let t=5;t<=TG;t+=3){ const [x,y]=messi(t); runKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
runKf.push(`  80% { transform:translate(786px,${f(MID)}px); }`);
runKf.push(`  81% { transform:translate(797px,${f(MID)}px); }`);
runKf.push(`  83% { transform:translate(788px,${f(MID)}px); }`);
runKf.push(`  87% { transform:translate(788px,${f(MID)}px); opacity:1; }`);
runKf.push(`  90% { transform:translate(788px,${f(MID)}px); opacity:0; }`);
runKf.push(`  100% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:0; }`);
runKf=runKf.join("\n");

// ---- ball: carried, then struck into the net ----
const TOUCHES=14;
function ballCarry(t){ const [mx,my]=messi(t); const off=15+5*Math.sin(2*Math.PI*TOUCHES*((t-T0)/(TG-T0))); return [mx+off, my]; }
let ballKf=[];
ballKf.push(`  0% { transform:translate(${f(ballCarry(0)[0])}px,${f(ballCarry(0)[1])}px); opacity:0; }`);
ballKf.push(`  3% { transform:translate(${f(ballCarry(T0)[0])}px,${f(ballCarry(T0)[1])}px); opacity:1; }`);
for(let t=5;t<=77;t+=3){ const [x,y]=ballCarry(t); ballKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
ballKf.push(`  79% { transform:translate(790px,${f(MID)}px); }`);
ballKf.push(`  81% { transform:translate(802px,${f(MID)}px); }`);
ballKf.push(`  83% { transform:translate(${f(IMPACT_X)}px,${f(MID)}px); }`);
ballKf.push(`  89% { transform:translate(${f(IMPACT_X+3)}px,${f(MID+2)}px); opacity:1; }`);
ballKf.push(`  90.5% { opacity:0; }`);
ballKf.push(`  100% { transform:translate(${f(ballCarry(0)[0])}px,${f(ballCarry(0)[1])}px); opacity:0; }`);
ballKf=ballKf.join("\n");

// ---- goal ----
const GX0=W-70, GY0=GOAL_CY-26, GY1=GOAL_CY+26;
let net=[];
for(let gx=GX0+4; gx<W-6; gx+=6) net.push(`<line x1="${gx}" y1="${GY0+2}" x2="${gx}" y2="${GY1-2}"/>`);
for(let gy=GY0+4; gy<GY1; gy+=6) net.push(`<line x1="${GX0+2}" y1="${gy}" x2="${W-8}" y2="${gy}"/>`);
net=net.join("\n      ");

// ---- BOOM star ----
let star=[]; for(let i=0;i<20;i++){ const r=i%2===0?17:7; const a=i*Math.PI/10-Math.PI/2; star.push(`${f(r*Math.cos(a))},${f(r*Math.sin(a))}`); } star=star.join(" ");

// ---- finale message: blocks spell "GOAL ANKARA MESSI" ----
const FONT = {
  G:[".###","#...","#.##","#..#",".###"], O:["####","#..#","#..#","#..#","####"],
  A:[".##.","#..#","####","#..#","#..#"], L:["#...","#...","#...","#...","####"],
  N:["#..#","##.#","#.##","#..#","#..#"], K:["#..#","#.#.","##..","#.#.","#..#"],
  R:["###.","#..#","###.","#.#.","#..#"], M:["#..#","####","#..#","#..#","#..#"],
  E:["####","#...","###.","#...","####"], S:[".###","#...",".##.","...#","###."],
  I:["####",".##.",".##.",".##.","####"]
};
const MSG="GOAL ANKARA MESSI", MP=9, MC=7;
let mx=0, pts=[];
for(const ch of MSG){ if(ch===" "){ mx+=3*MP; continue; } const g=FONT[ch]; for(let r=0;r<5;r++) for(let c=0;c<4;c++) if(g[r][c]==="#") pts.push([mx+c*MP, r*MP]); mx+=5*MP; }
const msgW=mx-MP, msgX=(W-msgW)/2, msgY=(H-5*MP)/2;
const msgRects = pts.map(([px,py])=>`<rect x="${f(msgX+px)}" y="${f(msgY+py)}" width="${MC}" height="${MC}" rx="1.5" fill="#39d353"/>`).join("\n      ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Messi dribbles past my real commits (they grey out and dodge), kicks it into the net with a boom, then the blocks spell GOAL ANKARA MESSI">
  <defs>
    <clipPath id="round"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>
    <style>
      rect[style] { transform-box: fill-box; }
      .grid { animation: gridfade ${LOOP}s ease-in-out infinite; }
      .msg  { opacity: 0; animation: msgshow ${LOOP}s ease-out infinite; }
      .run  { animation: run ${LOOP}s ease-in-out infinite; }
      .ball { animation: ball ${LOOP}s cubic-bezier(.7,0,.9,.4) infinite; }
      .spin { animation: spin 0.5s linear infinite; transform-box: fill-box; transform-origin: center; }
      .netflash { opacity: 0; animation: flash ${LOOP}s ease-out infinite; }
      .streak { opacity: 0; animation: streak ${LOOP}s linear infinite; }
      .boom { opacity: 0; animation: boom ${LOOP}s ease-out infinite; }
      .gk { animation: gk ${LOOP}s ease-in-out infinite; }
      text { font-family: 'Sora','Poppins','Segoe UI',Verdana,sans-serif; }
      @keyframes gridfade { 0%,87% {opacity:1} 90% {opacity:0} 99% {opacity:0} 100% {opacity:1} }
      @keyframes msgshow { 0%,89% {opacity:0} 92% {opacity:1} 98% {opacity:1} 99.5% {opacity:0} 100% {opacity:0} }
      @keyframes run {
${runKf}
      }
      @keyframes ball {
${ballKf}
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes flash { 0%,81% {opacity:0} 83% {opacity:0.85} 90% {opacity:0} 100% {opacity:0} }
      @keyframes streak { 0%,80% {opacity:0} 81.5% {opacity:0.9} 84% {opacity:0} 100% {opacity:0} }
      @keyframes boom {
        0%,81% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.1); }
        83% { opacity:1; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.95); }
        85% { opacity:1; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(1.1); }
        90% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(1.6); }
        100% { opacity:0; transform: translate(${f(IMPACT_X)}px,${f(MID)}px) scale(0.1); }
      }
      @keyframes gk {
        0%,78% { transform: translate(0,0); }
        82% { transform: translate(1px,-9px); }
        85% { transform: translate(2px,-22px); }
        93% { transform: translate(2px,-22px); }
        100% { transform: translate(0,0); }
      }
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

    <g stroke="#ffffff" stroke-opacity="0.35" stroke-width="1">
      ${net}
    </g>
    <rect class="netflash" x="${GX0+2}" y="${GY0+2}" width="${W-12-GX0}" height="${GY1-GY0-4}" fill="#EDBB00"/>
    <rect x="${GX0-2}" y="${GY0}" width="3.5" height="${GY1-GY0}" fill="#ffffff"/>
    <circle cx="${GX0}" cy="${GY0}" r="2.6" fill="#ffffff"/>
    <circle cx="${GX0}" cy="${GY1}" r="2.6" fill="#ffffff"/>

    <g class="gk">
      <rect x="${GX0-2.5}" y="${GOAL_CY-1.5}" width="14" height="3" rx="1.5" fill="#1f1300"/>
      <circle cx="${GX0-2.5}" cy="${GOAL_CY}" r="2.5" fill="#ffd23f" stroke="#1f1300" stroke-width="0.5"/>
      <circle cx="${GX0+11.5}" cy="${GOAL_CY}" r="2.5" fill="#ffd23f" stroke="#1f1300" stroke-width="0.5"/>
      <rect x="${GX0+0.5}" y="${GOAL_CY-6.5}" width="8" height="13" rx="2.6" fill="#ff8a1f" stroke="#1f1300" stroke-width="0.7"/>
      <circle cx="${GX0+4.5}" cy="${GOAL_CY-8.5}" r="2.7" fill="#f1c27d" stroke="#1f1300" stroke-width="0.5"/>
    </g>

    <line class="streak" x1="800" y1="${MID}" x2="${IMPACT_X-4}" y2="${MID}" stroke="#EDBB00" stroke-width="3" stroke-linecap="round"/>

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
  </g>

  <rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="14" fill="none" stroke="#A50044" stroke-width="2.5"/>
</svg>
`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/messi-goal.svg", svg);
console.log("dist/messi-goal.svg | beaten commits:", dk, "| message blocks:", pts.length, "| bytes:", svg.length);
