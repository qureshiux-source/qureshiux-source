// Reads contrib.json (GitHub GraphQL contributionCalendar) and writes dist/messi-goal.svg
// Renders the REAL contribution grid; Messi dribbles a tiny ball past the commits, then scores.
const fs = require('fs');

const cal = JSON.parse(fs.readFileSync("contrib.json", "utf8"))
              .data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks;

const CELL = 11, GAP = 3, PITCH = CELL + GAP;
const GX = 34, GY = 24;
const COLS = weeks.length;
const gridRight = GX + (COLS - 1) * PITCH + CELL;
const W = 870, H = 150, LOOP = 11.0;
const f = x => (Math.round(x * 100) / 100);

const PAL = { NONE:"#161b22", FIRST_QUARTILE:"#0e4429", SECOND_QUARTILE:"#006d32",
              THIRD_QUARTILE:"#26a641", FOURTH_QUARTILE:"#39d353" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

let cells = [];
weeks.forEach((w, c) => {
  w.contributionDays.forEach(d => {
    const x = GX + c * PITCH, y = GY + d.weekday * PITCH;
    cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${PAL[d.contributionLevel] || PAL.NONE}"/>`);
  });
});
cells = cells.join("\n    ");

let monthLabels = [], lastM = -1;
weeks.forEach((w, c) => {
  const m = parseInt(w.firstDay.split("-")[1], 10) - 1;
  if (m !== lastM && c < COLS - 1) {
    monthLabels.push(`<text x="${GX + c * PITCH}" y="${GY - 7}" font-size="9" fill="#7d8590">${MONTHS[m]}</text>`);
    lastM = m;
  }
});
monthLabels = monthLabels.join("\n    ");

const dayLabels = [[1,"Mon"],[3,"Wed"],[5,"Fri"]].map(([r,t]) =>
  `<text x="${GX - 6}" y="${GY + r * PITCH + CELL - 2}" font-size="9" fill="#7d8590" text-anchor="end">${t}</text>`
).join("\n    ");

const MID = GY + 3 * PITCH;
const AMP = 3 * PITCH, WEAVES = 5;
const T0 = 3, TG = 78, TS = 86;
const xStart = GX - 14, xGridEnd = gridRight + 2, xPlant = W - 78;
const GOAL_CY = MID;

function messi(t){
  if (t <= T0) return [xStart, MID];
  if (t <= TG){ const fr=(t-T0)/(TG-T0); return [xStart+fr*(xGridEnd-xStart), MID+AMP*Math.sin(fr*Math.PI*2*WEAVES)]; }
  if (t <= TS){ const fr=(t-TG)/(TS-TG); const y0=MID+AMP*Math.sin(Math.PI*2*WEAVES); return [xGridEnd+fr*(xPlant-xGridEnd), y0+fr*(GOAL_CY-y0)]; }
  return [xPlant, GOAL_CY];
}
const uniq = a => [...new Set(a)].sort((p,q)=>p-q);

let runPts=[0,T0]; for(let t=5;t<TG;t+=3) runPts.push(t); runPts.push(TG,82,TS,96,97,100);
let runKf = uniq(runPts).map(t=>{
  let [x,y]=messi(t), op="";
  if(t===0)op="opacity:0;"; if(t===T0)op="opacity:1;"; if(t===96)op="opacity:1;";
  if(t===97)op="opacity:0;"; if(t===100){op="opacity:0;";[x,y]=[xStart,MID];}
  return `  ${t}% { transform:translate(${f(x)}px,${f(y)}px); ${op} }`;
}).join("\n");

function ball(t){ const [x,y]=messi(t); return [x+10, y-2]; }
let ballPts=[0,T0]; for(let t=5;t<=78;t+=3) ballPts.push(t);
let ballKf = uniq(ballPts).map(t=>{
  let [x,y]=ball(t); let op = t===0?"opacity:0;":(t===T0?"opacity:1;":"");
  return `  ${t}% { transform:translate(${f(x)}px,${f(y)}px); ${op} }`;
});
ballKf.push(`  81% { transform:translate(${f(W-118)}px,${f(GOAL_CY-22)}px); }`);
ballKf.push(`  84% { transform:translate(${f(W-66)}px,${f(GOAL_CY-10)}px); }`);
ballKf.push(`  86% { transform:translate(${f(W-44)}px,${f(GOAL_CY+4)}px); }`);
ballKf.push(`  96% { transform:translate(${f(W-44)}px,${f(GOAL_CY+4)}px); opacity:1; }`);
ballKf.push(`  97% { opacity:0; }`);
ballKf.push(`  100% { transform:translate(${f(ball(0)[0])}px,${f(ball(0)[1])}px); opacity:0; }`);
ballKf = ballKf.join("\n");

const GX0 = W - 70, GY0 = GOAL_CY - 26, GY1 = GOAL_CY + 26;
let net=[];
for(let gx=GX0+4; gx<W-6; gx+=6) net.push(`<line x1="${gx}" y1="${GY0+2}" x2="${gx}" y2="${GY1-2}"/>`);
for(let gy=GY0+4; gy<GY1; gy+=6) net.push(`<line x1="${GX0+2}" y1="${gy}" x2="${W-8}" y2="${gy}"/>`);
net = net.join("\n      ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Aerial view: Messi dribbles a tiny ball past my real commit graph and scores">
  <defs>
    <clipPath id="round"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath>
    <style>
      .run  { animation: run ${LOOP}s ease-in-out infinite; }
      .ball { animation: ball ${LOOP}s ease-in-out infinite; }
      .spin { animation: spin 0.6s linear infinite; transform-box: fill-box; transform-origin: center; }
      .gol, .netflash { opacity: 0; animation: gol ${LOOP}s ease-in-out infinite; }
      text { font-family: 'Sora','Poppins','Segoe UI',Verdana,sans-serif; }
      @keyframes run {
${runKf}
      }
      @keyframes ball {
${ballKf}
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes gol {
        0%,79% { opacity:0; transform:translateY(5px); }
        85% { opacity:1; transform:translateY(0); }
        95% { opacity:1; }
        98% { opacity:0; }
        100% { opacity:0; }
      }
    </style>
  </defs>

  <g clip-path="url(#round)">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0d1117"/>
    ${monthLabels}
    ${dayLabels}
    ${cells}
    <g stroke="#ffffff" stroke-opacity="0.35" stroke-width="1">
      ${net}
    </g>
    <rect class="netflash" x="${GX0+2}" y="${GY0+2}" width="${W-12-GX0}" height="${GY1-GY0-4}" fill="#EDBB00"/>
    <rect x="${GX0-2}" y="${GY0}" width="3.5" height="${GY1-GY0}" fill="#ffffff"/>
    <circle cx="${GX0}" cy="${GY0}" r="2.6" fill="#ffffff"/>
    <circle cx="${GX0}" cy="${GY1}" r="2.6" fill="#ffffff"/>

    <g class="run">
      <ellipse cx="0" cy="0" rx="6" ry="5.2" fill="#004D98"/>
      <rect x="-1.8" y="-5.2" width="1.9" height="10.4" fill="#A50044"/>
      <rect x="2.6"  y="-4.4" width="1.7" height="8.8"  fill="#A50044"/>
      <rect x="-5.2" y="-4.4" width="1.7" height="8.8"  fill="#A50044"/>
      <ellipse cx="0" cy="0" rx="6" ry="5.2" fill="none" stroke="#06203f" stroke-width="0.7"/>
      <circle cx="4.4" cy="0" r="2.5" fill="#f1c27d" stroke="#06203f" stroke-width="0.5"/>
    </g>

    <g class="ball">
      <g class="spin">
        <circle r="2.6" fill="#ffffff" stroke="#111" stroke-width="0.45"/>
        <polygon points="0,-1.4 1.3,-0.4 0.8,1.2 -0.8,1.2 -1.3,-0.4" fill="#111"/>
      </g>
    </g>

    <g class="gol" text-anchor="middle">
      <rect x="${W-250}" y="6" width="186" height="40" rx="9" fill="#0d1117" fill-opacity="0.82" stroke="#A50044" stroke-width="1.5"/>
      <text x="${W-157}" y="29" font-size="22" font-weight="900" fill="#EDBB00" stroke="#A50044" stroke-width="0.8" paint-order="stroke">GOOOOL!</text>
      <text x="${W-157}" y="41" font-size="9" font-weight="700" fill="#ffffff" letter-spacing="3">ANKARA MESSI</text>
    </g>
  </g>

  <rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="14" fill="none" stroke="#A50044" stroke-width="2.5"/>
</svg>
`;
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/messi-goal.svg", svg);
console.log("generated dist/messi-goal.svg | weeks:", COLS, "| total:", cal.totalContributions, "| bytes:", svg.length);
