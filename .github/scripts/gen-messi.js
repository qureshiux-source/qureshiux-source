// contrib.json (GitHub GraphQL contributionCalendar) -> dist/messi-goal.svg
// Real contribution grid. A mini Messi (long hair flowing like a tail) carries a tiny ball
// AHEAD of him, dribbling through the grid; every block he runs over turns blaugrana
// (blue->garnet) as a claimed trail. Then he kicks it into the net with a BOOM and the
// blocks reassemble to spell "GOAL ANKARA MESSI".
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
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ---- path ----
const MID = GY + 3 * PITCH;
const AMP = 3 * PITCH, WEAVES = 5;
const T0 = 3, TG = 78;
const xStart = GX - 16, xGridEnd = gridRight + 2;
const GOAL_CY = MID, IMPACT_X = W - 43;
function messi(t){
  if (t <= T0) return [xStart, MID];
  if (t <= TG){ const fr=(t-T0)/(TG-T0); return [xStart+fr*(xGridEnd-xStart), MID+AMP*Math.sin(fr*Math.PI*2*WEAVES)]; }
  return [xGridEnd, MID];
}
const uniq = a => [...new Set(a)].sort((p,q)=>p-q);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

// ---- commits + blaugrana trail (blocks he covers recolor and stay) ----
const TRAIL = 10;
const samples = [];
for (let t=T0;t<=TG;t+=0.4){ const [x,y]=messi(t); samples.push([t,x,y]); }

let cells=[], trailKf=[], tk=0;
weeks.forEach((w,c)=>{
  w.contributionDays.forEach(d=>{
    const x=GX+c*PITCH, y=GY+d.weekday*PITCH;
    const base=PAL[d.contributionLevel]||PAL.NONE;
    const ccx=x+CELL/2, ccy=y+CELL/2;
    let best=1e9,bt=0;
    for(const [t,mx,my] of samples){ const dd=Math.hypot(ccx-mx,ccy-my); if(dd<best){best=dd;bt=t;} }
    let extra="";
    if(best<TRAIL){
      const pre=clamp(bt-0.8,0.3,95), hit=clamp(bt+0.8,pre+0.4,97);
      trailKf.push(`@keyframes trail${tk} { 0% {fill:${base}} ${f(pre)}% {fill:${base}} ${f(hit)}% {fill:url(#bgcell)} 99% {fill:url(#bgcell)} 100% {fill:${base}} }`);
      extra=` style="animation: trail${tk} ${LOOP}s linear infinite"`; tk++;
    }
    cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${base}"${extra}/>`);
  });
});
cells=cells.join("\n      ");
trailKf=trailKf.join("\n      ");

// ---- labels ----
let monthLabels=[], lastM=-1;
weeks.forEach((w,c)=>{ const m=parseInt(w.firstDay.split("-")[1],10)-1; if(m!==lastM && c<COLS-1){ monthLabels.push(`<text x="${GX+c*PITCH}" y="${GY-7}" font-size="9" fill="#7d8590">${MONTHS[m]}</text>`); lastM=m; } });
monthLabels=monthLabels.join("\n      ");
const dayLabels=[[1,"Mon"],[3,"Wed"],[5,"Fri"]].map(([r,t])=>`<text x="${GX-6}" y="${GY+r*PITCH+CELL-2}" font-size="9" fill="#7d8590" text-anchor="end">${t}</text>`).join("\n      ");

// ---- player keyframes (dribble, plant + KICK) ----
let runKf=[];
runKf.push(`  0% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:0; }`);
runKf.push(`  3% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:1; }`);
for(let t=5;t<=TG;t+=3){ const [x,y]=messi(t); runKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
runKf.push(`  80% { transform:translate(784px,${f(MID)}px); }`);
runKf.push(`  81% { transform:translate(796px,${f(MID)}px); }`);
runKf.push(`  83% { transform:translate(786px,${f(MID)}px); }`);
runKf.push(`  87% { transform:translate(786px,${f(MID)}px); opacity:1; }`);
runKf.push(`  90% { transform:translate(786px,${f(MID)}px); opacity:0; }`);
runKf.push(`  100% { transform:translate(${f(xStart)}px,${f(MID)}px); opacity:0; }`);
runKf=runKf.join("\n");

// ---- ball: carried AHEAD (forward = +x), then struck ----
const TOUCHES=14;
function ballCarry(t){ const [mx,my]=messi(t); const off=14+5*Math.sin(2*Math.PI*TOUCHES*((t-T0)/(TG-T0))); return [mx+off, my]; }
let ballKf=[];
ballKf.push(`  0% { transform:translate(${f(ballCarry(0)[0])}px,${f(ballCarry(0)[1])}px); opacity:0; }`);
ballKf.push(`  3% { transform:translate(${f(ballCarry(T0)[0])}px,${f(ballCarry(T0)[1])}px); opacity:1; }`);
for(let t=5;t<=77;t+=3){ const [x,y]=ballCarry(t); ballKf.push(`  ${t}% { transform:translate(${f(x)}px,${f(y)}px); }`); }
ballKf.push(`  79% { transform:translate(800px,${f(MID)}px); }`);
ballKf.push(`  81% { transform:translate(812px,${f(MID)}px); }`);
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

// ---- finale message ----
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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A mini Messi with flowing hair carries a tiny ball, painting the blocks he covers blaugrana, then kicks it into the net (BOOM); the blocks spell GOAL ANKARA MESSI">
  <defs>
    <clipPath id="round"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>
    <linearGradient id="bgcell" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#004D98"/><stop offset="1" stop-color="#A50044"/>
    </linearGradient>
    <style>
      rect[style] { transform-box: fill-box; }
      .grid { animation: gridfade ${LOOP}s ease-in-out infinite; }
      .msg  { opacity: 0; animation: msgshow ${LOOP}s ease-out infinite; }
      .run  { animation: run ${LOOP}s ease-in-out infinite; }
      .ball { animation: ball ${LOOP}s cubic-bezier(.7,0,.9,.4) infinite; }
      .spin { animation: spin 0.5s linear infinite; transform-box: fill-box; transform-origin: center; }
      .hairA { animation: ha 0.42s steps(1) infinite; }
      .hairB { animation: hb 0.42s steps(1) infinite; }
      .netflash { opacity: 0; animation: flash ${LOOP}s ease-out infinite; }
      .streak { opacity: 0; animation: streak ${LOOP}s linear infinite; }
      .boom { opacity: 0; animation: boom ${LOOP}s ease-out infinite; }
      text { font-family: 'Sora','Poppins','Segoe UI',Verdana,sans-serif; }
      @keyframes gridfade { 0%,87% {opacity:1} 90% {opacity:0} 99% {opacity:0} 100% {opacity:1} }
      @keyframes msgshow { 0%,89% {opacity:0} 92% {opacity:1} 98% {opacity:1} 99.5% {opacity:0} 100% {opacity:0} }
      @keyframes ha { 0%,49% {opacity:1} 50%,100% {opacity:0} }
      @keyframes hb { 0%,49% {opacity:0} 50%,100% {opacity:1} }
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
      ${trailKf}
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

    <line class="streak" x1="810" y1="${MID}" x2="${IMPACT_X-4}" y2="${MID}" stroke="#EDBB00" stroke-width="3" stroke-linecap="round"/>

    <g class="run">
      <g transform="scale(1.5)">
        <g class="hairB">
          <path d="M3,-3.6 Q -9,-9 -17,-5" fill="none" stroke="#241405" stroke-width="2.3" stroke-linecap="round"/>
          <path d="M3,-1.2 Q -10,-3 -18,-1" fill="none" stroke="#2e1908" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M3,1.2 Q -10,3.5 -18,2" fill="none" stroke="#2e1908" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M3,3.6 Q -9,8 -16.5,6" fill="none" stroke="#241405" stroke-width="2.3" stroke-linecap="round"/>
        </g>
        <g class="hairA">
          <path d="M3,-3.6 Q -8,-6.5 -16,-6.5" fill="none" stroke="#241405" stroke-width="2.3" stroke-linecap="round"/>
          <path d="M3,-1.2 Q -10,-1.5 -18,-2.5" fill="none" stroke="#2e1908" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M3,1.2 Q -10,1.5 -18,0.5" fill="none" stroke="#2e1908" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M3,3.6 Q -8,6 -16,3" fill="none" stroke="#241405" stroke-width="2.3" stroke-linecap="round"/>
        </g>
        <ellipse cx="0" cy="0" rx="6" ry="5.2" fill="#004D98"/>
        <rect x="-1.8" y="-5.2" width="1.9" height="10.4" fill="#A50044"/>
        <rect x="2.6"  y="-4.4" width="1.7" height="8.8"  fill="#A50044"/>
        <rect x="-5.2" y="-4.4" width="1.7" height="8.8"  fill="#A50044"/>
        <ellipse cx="0" cy="0" rx="6" ry="5.2" fill="none" stroke="#06203f" stroke-width="0.7"/>
        <circle cx="4.8" cy="0" r="2.7" fill="#f1c27d" stroke="#06203f" stroke-width="0.5"/>
      </g>
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
console.log("dist/messi-goal.svg | blaugrana-trail blocks:", tk, "| message blocks:", pts.length, "| bytes:", svg.length);
