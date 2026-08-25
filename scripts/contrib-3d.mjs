// Isometric 3D contribution wall — zero runtime deps.
// Emits a self-contained animated SVG (CSS animations only, GitHub-README safe).

// Axonometric basis: U = one week to the right, V = one weekday down-left.
const UX = 11.6, UY = 1.7;
const VX = -6.2, VY = 9.0;
const HMAX = 62;    // tallest bar in px
const PADX = 40, TOP = 74, BOT = 54;

const RAMP = ['#222941', '#2b4a8f', '#3d6ecb', '#7aa2f7', '#7dcfff', '#bb9af7'];

const shade = (hex, f) => {
  const v = parseInt(hex.slice(1), 16);
  const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) => Math.round(x * f));
  return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1);
};

const rampColor = (c, max) => {
  if (!c) return RAMP[0];
  const t = Math.min(1, c / max);
  return t <= 0.15 ? RAMP[1] : t <= 0.35 ? RAMP[2] : t <= 0.6 ? RAMP[3] : t <= 0.82 ? RAMP[4] : RAMP[5];
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 10) / 10;

export function buildSvg(days, meta = {}) {
  const maxC = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  const active = days.filter((d) => d.count > 0).length;
  const best = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]);

  // corner offsets of a tile's top face, relative to its centre
  const K = [
    [(-UX - VX) / 2, (-UY - VY) / 2], // back
    [(UX - VX) / 2, (UY - VY) / 2],   // right
    [(UX + VX) / 2, (UY + VY) / 2],   // front
    [(-UX + VX) / 2, (-UY + VY) / 2], // left
  ];
  const kx = Math.max(...K.map((p) => Math.abs(p[0])));
  const ky = Math.max(...K.map((p) => Math.abs(p[1])));

  const cells = days.map((d, i) => {
    const col = Math.floor(i / 7), row = i % 7;
    return {
      ...d, col, row,
      cx: col * UX + row * VX,
      cy: col * UY + row * VY,
      h: d.count ? 4 + Math.pow(d.count / maxC, 0.7) * HMAX : 2,
    };
  });

  const minX = Math.min(...cells.map((c) => c.cx)) - kx;
  const minY = Math.min(...cells.map((c) => c.cy)) - ky;
  const spanX = Math.max(...cells.map((c) => c.cx)) + kx - minX;
  const spanY = Math.max(...cells.map((c) => c.cy)) + ky - minY;

  const W = Math.round(PADX * 2 + spanX);
  const H = Math.round(TOP + HMAX + spanY + BOT);
  const ox = PADX - minX;
  const oy = TOP + HMAX - minY;

  cells.sort((p, q) => p.cy - q.cy || p.col - q.col); // painter: far → near

  let bars = '';
  for (const c of cells) {
    const X = c.cx + ox, Y = c.cy + oy, h = c.h;
    const pt = (i, lift) => `${n(X + K[i][0])} ${n(Y + K[i][1] - lift)}`;
    const top = rampColor(c.count, maxC);
    const hot = c.count / maxC > 0.62;
    const delay = n(c.col * 0.052 + c.row * 0.014);

    const cls = c.count ? `b${hot ? ' h' : ''}` : 'f';
    const style = c.count ? ` style="transform-origin:${n(X)}px ${n(Y)}px;animation-delay:${delay}s"` : '';
    bars +=
      `<g class="${cls}"${style}>` +
      `<path fill="${shade(top, 0.44)}" d="M${pt(3, h)}L${pt(2, h)}L${pt(2, 0)}L${pt(3, 0)}Z"/>` +
      `<path fill="${shade(top, 0.7)}" d="M${pt(2, h)}L${pt(1, h)}L${pt(1, 0)}L${pt(2, 0)}Z"/>` +
      `<path fill="${top}" d="M${pt(0, h)}L${pt(1, h)}L${pt(2, h)}L${pt(3, h)}Z"/>` +
      `</g>`;
  }

  const legend = RAMP.slice(1)
    .map((col, i) => `<rect x="${W - 164 + i * 20}" y="${H - 30}" width="13" height="13" rx="3" fill="${col}"/>`)
    .join('');
  const SW = 200;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI',Ubuntu,Helvetica,Arial,sans-serif" role="img" aria-label="${esc(meta.username || '')}: ${total} contributions rendered as a 3D wall">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14151f"/><stop offset=".55" stop-color="#1a1b26"/><stop offset="1" stop-color="#21232f"/></linearGradient>
<linearGradient id="ttl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7dcfff"/><stop offset=".5" stop-color="#7aa2f7"/><stop offset="1" stop-color="#bb9af7"/></linearGradient>
<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7dcfff" stop-opacity="0"/><stop offset=".5" stop-color="#c0caf5" stop-opacity=".14"/><stop offset="1" stop-color="#bb9af7" stop-opacity="0"/></linearGradient>
<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7aa2f7" stop-opacity=".2"/><stop offset="1" stop-color="#7aa2f7" stop-opacity="0"/></radialGradient>
<clipPath id="panel"><rect width="${W}" height="${H}" rx="14"/></clipPath>
<style>
.b{animation:rise 11s cubic-bezier(.2,.8,.3,1) infinite;transform-box:view-box}
@keyframes rise{0%{transform:scaleY(.02);opacity:.25}7%{transform:scaleY(1.14);opacity:1}11%{transform:scaleY(.96)}14%{transform:scaleY(1)}86%{transform:scaleY(1);opacity:1}100%{transform:scaleY(.02);opacity:.25}}
.h{filter:drop-shadow(0 0 5px rgba(187,154,247,.7))}
.sw{animation:slide 6.5s linear infinite}
@keyframes slide{0%{transform:translateX(-${SW}px)}100%{transform:translateX(${W + SW}px)}}
.pl{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){.b,.sw,.pl{animation:none}.b{transform:none;opacity:1}}
</style>
</defs>
<rect width="${W}" height="${H}" rx="14" fill="url(#bg)"/>
<ellipse cx="${W / 2}" cy="${TOP + HMAX + spanY / 2}" rx="${n(W * 0.44)}" ry="${n(spanY * 1.5)}" fill="url(#halo)"/>
<text x="30" y="40" font-size="21" font-weight="700" fill="url(#ttl)">${esc(meta.title || 'Contribution wall')}</text>
<text x="30" y="60" font-size="12.5" fill="#7f88a8">${esc(meta.subtitle || '')}</text>
<text class="pl" x="${W - 30}" y="41" text-anchor="end" font-size="27" font-weight="800" fill="#7dcfff">${total.toLocaleString('en-US')}</text>
<text x="${W - 30}" y="59" text-anchor="end" font-size="11.5" fill="#7f88a8">contributions · ${active} active days · peak ${best.count} on ${esc(best.date)}</text>
<g>${bars}</g>
<g clip-path="url(#panel)"><rect class="sw" x="0" y="0" width="${SW}" height="${H}" fill="url(#sweep)"/></g>
<text x="30" y="${H - 19}" font-size="11" fill="#565f7e">${esc(days[0].date)} → ${esc(days[days.length - 1].date)}</text>
<text x="${W - 172}" y="${H - 19}" text-anchor="end" font-size="11" fill="#565f7e">less</text>
${legend}
<text x="${W - 30}" y="${H - 19}" text-anchor="end" font-size="11" fill="#565f7e">more</text>
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

if (process.argv[1] && process.argv[1].endsWith('contrib-3d.mjs')) {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const user = process.env.USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
  const days = await fetchDays(user, process.env.GITHUB_TOKEN);
  const svg = buildSvg(days, { username: user, title: 'A year in commits', subtitle: `@${user} · contribution graph, rendered in 3D` });
  mkdirSync('assets', { recursive: true });
  writeFileSync('assets/contrib-3d.svg', svg);
  console.log(`wrote assets/contrib-3d.svg (${(svg.length / 1024).toFixed(1)} KB)`);
}
