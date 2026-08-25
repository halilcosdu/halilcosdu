// Profile cards rendered from the GitHub contribution calendar — zero runtime deps.
// Outputs: assets/contrib-activity.svg (weekly activity chart)
//          assets/contrib-streak.svg   (streak / total stat tiles)
// Self-contained animated SVG, CSS animations only, GitHub-README safe.

const INK = '#c0caf5', DIM = '#7f88a8', MUTED = '#565f7e';
const LINE = '#7aa2f7', ACCENT = '#bb9af7', CYAN = '#7dcfff';
const GRID = '#272b3d';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 10) / 10;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pretty = (iso) => { const [y, m, d] = iso.split('-'); return `${MON[+m - 1]} ${+d}, ${y}`; };

const shell = (W, H) => `
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14151f"/><stop offset=".55" stop-color="#1a1b26"/><stop offset="1" stop-color="#21232f"/></linearGradient>
<linearGradient id="ttl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${CYAN}"/><stop offset=".5" stop-color="${LINE}"/><stop offset="1" stop-color="${ACCENT}"/></linearGradient>
<clipPath id="panel"><rect width="${W}" height="${H}" rx="14"/></clipPath>`;

// ---------------------------------------------------------------- activity
export function buildActivitySvg(days, meta = {}) {
  const W = 880, H = 252;
  const L = 46, R = 24, T = 66, B = 34;
  const pw = W - L - R, ph = H - T - B;

  // aggregate into calendar weeks (7-day buckets, as the calendar is laid out)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    weeks.push({ start: slice[0].date, end: slice[slice.length - 1].date, count: slice.reduce((s, d) => s + d.count, 0) });
  }
  const maxW = Math.max(1, ...weeks.map((w) => w.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  const peak = weeks.reduce((a, w) => (w.count > a.count ? w : a), weeks[0]);

  // y scale: nice ceiling
  const step = Math.max(10, Math.ceil(maxW / 4 / 10) * 10);
  const top = step * 4;
  const x = (i) => L + (pw * i) / (weeks.length - 1);
  const y = (v) => T + ph - (ph * v) / top;

  const pts = weeks.map((w, i) => [x(i), y(w.count)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${n(p[0])} ${n(p[1])}`).join('');
  const area = `${line}L${n(x(weeks.length - 1))} ${n(T + ph)}L${n(L)} ${n(T + ph)}Z`;

  let grid = '', ylab = '';
  for (let g = 0; g <= 4; g++) {
    const v = (top / 4) * g, gy = y(v);
    grid += `<line x1="${L}" y1="${n(gy)}" x2="${L + pw}" y2="${n(gy)}" stroke="${GRID}" stroke-width="1"/>`;
    ylab += `<text x="${L - 10}" y="${n(gy + 4)}" text-anchor="end" font-size="10.5" fill="${MUTED}">${v}</text>`;
  }

  // month ticks: first week of each month
  let months = '', seen = '';
  weeks.forEach((w, i) => {
    const m = w.start.slice(0, 7);
    if (m !== seen) {
      seen = m;
      if (i > 0 && i < weeks.length - 1) months += `<text x="${n(x(i))}" y="${H - 12}" text-anchor="middle" font-size="10.5" fill="${MUTED}">${MON[+m.slice(5) - 1]}</text>`;
    }
  });

  const pi = weeks.indexOf(peak);
  const px = x(pi), py = y(peak.count);
  const labelRight = pi < weeks.length - 8;
  const labelDy = py < T + 14 ? 18 : 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI',Ubuntu,Helvetica,Arial,sans-serif" role="img" aria-label="${esc(meta.username || '')}: ${total} contributions per week over the last year, peaking at ${peak.count} in the week of ${peak.start}">
<defs>${shell(W, H)}
<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LINE}" stop-opacity=".42"/><stop offset="1" stop-color="${LINE}" stop-opacity="0"/></linearGradient>
<clipPath id="reveal"><rect class="rv" x="${L}" y="${T - 12}" width="${pw + 2}" height="${ph + 14}"/></clipPath>
<style>
.rv{animation:wipe 8s cubic-bezier(.35,0,.2,1) infinite;transform-box:view-box;transform-origin:${L}px 0}
@keyframes wipe{0%{transform:scaleX(0)}52%{transform:scaleX(1)}100%{transform:scaleX(1)}}
.pk{animation:pop 8s ease-out infinite;transform-box:view-box;transform-origin:${n(px)}px ${n(py)}px}
@keyframes pop{0%,${n((pi / (weeks.length - 1)) * 52)}%{opacity:0;transform:scale(.3)}${n((pi / (weeks.length - 1)) * 52 + 5)}%{opacity:1;transform:scale(1)}100%{opacity:1;transform:scale(1)}}
.gl{animation:breathe 4s ease-in-out infinite}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.rv,.pk,.gl{animation:none}.rv{transform:none}.pk{opacity:1;transform:none}}
</style>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="url(#bg)"/>
<text x="30" y="34" font-size="19" font-weight="700" fill="url(#ttl)">${esc(meta.title || 'Contributions per week')}</text>
<text x="30" y="52" font-size="12" fill="${DIM}">${esc(meta.subtitle || '')}</text>
<text class="gl" x="${W - 30}" y="36" text-anchor="end" font-size="24" font-weight="800" fill="${CYAN}">${total.toLocaleString('en-US')}</text>
<text x="${W - 30}" y="52" text-anchor="end" font-size="11" fill="${DIM}">total · peak ${peak.count} in the week of ${esc(pretty(peak.start))}</text>
${grid}${ylab}${months}
<g clip-path="url(#reveal)">
<path d="${area}" fill="url(#fill)"/>
<path d="${line}" fill="none" stroke="${LINE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
</g>
<g class="pk">
<circle cx="${n(px)}" cy="${n(py)}" r="8" fill="${ACCENT}" opacity=".22"/>
<circle cx="${n(px)}" cy="${n(py)}" r="4" fill="${ACCENT}" stroke="#1a1b26" stroke-width="2"/>
<text x="${n(px + (labelRight ? 13 : -13))}" y="${n(py + labelDy)}" text-anchor="${labelRight ? 'start' : 'end'}" font-size="11.5" font-weight="700" fill="${INK}">${peak.count}</text>
</g>
<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" stroke="${GRID}" stroke-width="1"/>
</svg>`;
}

// ---------------------------------------------------------------- streak
export function computeStreaks(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let best = { len: 0, from: null, to: null }, run = 0, runFrom = null;
  for (const d of days) {
    if (d.count > 0) { if (!run) runFrom = d.date; run++; if (run > best.len) best = { len: run, from: runFrom, to: d.date }; }
    else run = 0;
  }
  // current streak: today may still be empty without breaking it
  let i = days.length - 1;
  if (days[i].count === 0) i--;
  let cur = 0, curTo = null, curFrom = null;
  for (; i >= 0; i--) {
    if (days[i].count === 0) break;
    if (!cur) curTo = days[i].date;
    cur++; curFrom = days[i].date;
  }
  return { total, best, current: { len: cur, from: curFrom, to: curTo }, first: days[0].date, last: days[days.length - 1].date };
}

export function buildStreakSvg(days, meta = {}) {
  const W = 700, H = 190;
  const s = computeStreaks(days);
  const col = W / 3;

  const tile = (i, value, label, sub, color, big) => {
    const cx = col * i + col / 2;
    return `<g class="t" style="animation-delay:${n(0.08 + i * 0.14)}s">
<text x="${n(cx)}" y="${big ? 112 : 108}" text-anchor="middle" font-size="${big ? 44 : 36}" font-weight="800" fill="${color}">${value}</text>
<text x="${n(cx)}" y="${big ? 136 : 132}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${INK}">${esc(label)}</text>
<text x="${n(cx)}" y="${big ? 156 : 152}" text-anchor="middle" font-size="10.5" fill="${MUTED}">${esc(sub)}</text>
</g>`;
  };

  const curSub = s.current.len ? `${pretty(s.current.from)} \u2192 ${pretty(s.current.to)}` : 'no active streak';
  const bestSub = s.best.len ? `${pretty(s.best.from)} \u2192 ${pretty(s.best.to)}` : '\u2014';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI',Ubuntu,Helvetica,Arial,sans-serif" role="img" aria-label="${esc(meta.username || '')}: ${s.total} contributions, current streak ${s.current.len} days, longest streak ${s.best.len} days">
<defs>${shell(W, H)}
<linearGradient id="hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ACCENT}" stop-opacity=".12"/><stop offset="1" stop-color="${ACCENT}" stop-opacity=".03"/></linearGradient>
<style>
.t{animation:lift .75s cubic-bezier(.2,.8,.3,1) both;transform-box:view-box}
@keyframes lift{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.hi{animation:glow 5s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.7}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.t,.hi{animation:none}.t{opacity:1;transform:none}}
</style>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="url(#bg)"/>
<rect class="hi" x="${n(col + 6)}" y="54" width="${n(col - 12)}" height="${H - 54 - 14}" rx="12" fill="url(#hi)" stroke="${ACCENT}" stroke-opacity=".24" stroke-width="1"/>
<text x="30" y="34" font-size="15" font-weight="700" fill="url(#ttl)">${esc(meta.title || 'Contribution streak')}</text>
<text x="${W - 30}" y="34" text-anchor="end" font-size="11" fill="${MUTED}">${esc(pretty(s.first))} \u2192 ${esc(pretty(s.last))}</text>
${tile(0, s.total.toLocaleString('en-US'), 'Total contributions', `${pretty(s.first)} \u2192 ${pretty(s.last)}`, CYAN, false)}
${tile(1, s.current.len, 'Current streak', curSub, ACCENT, true)}
${tile(2, s.best.len, 'Longest streak', bestSub, LINE, false)}
</svg>`;
}

// ---- GitHub Action entrypoint ----------------------------------------------
async function fetchDays(user, token) {
  const query = `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { u: user } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount }));
}

if (process.argv[1] && process.argv[1].endsWith('contrib-cards.mjs')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const user = process.env.USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
  const days = await fetchDays(user, process.env.GITHUB_TOKEN);
  mkdirSync('assets', { recursive: true });
  writeFileSync('assets/contrib-activity.svg', buildActivitySvg(days, { username: user, title: 'Contributions per week', subtitle: `@${user} · last 12 months` }));
  writeFileSync('assets/contrib-streak.svg', buildStreakSvg(days, { username: user, title: 'Contribution streak' }));
  console.log('wrote assets/contrib-activity.svg and assets/contrib-streak.svg');
}
