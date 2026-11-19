// Shared building blocks for the launch film and the carousel.
// Icons are simple stroke glyphs drawn for this film (Lucide-style geometry, ISC).
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.7 0-2.8.8-2.8 2s1.1 1.6 2.8 2 2.8.8 2.8 2-1.1 2-2.8 2c-1.3 0-2.3-.4-2.8-1.2M12 6.5V8m0 8v1.5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="3"/><path d="M11 18h2"/>',
  car: '<path d="M19 17h2v-4l-2-5H5L3 13v4h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  house: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  poll: '<path d="M3 3v18h18"/><path d="M7 16V11M12 16V7M17 16v-3"/>',
  home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
};
function icon(name, sw = 2.4) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}
function el(tag, cls, html, parent, style) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (style) Object.assign(e.style, style);
  if (parent) parent.appendChild(e);
  return e;
}
// "Plain words *highlighted phrase*" with "/" as a line break. Each word gets a mask so it can rise in.
function headline(text, size, parent, extraCls = '') {
  const h = el('div', 'disp ' + extraCls, null, parent, { fontSize: size + 'px' });
  const lines = text.split('/');
  lines.forEach((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
    parts.forEach((p) => {
      const isHl = p.startsWith('*');
      const host = isHl ? el('span', 'hl', null, h) : h;
      const words = p.replace(/\*/g, '').trim().split(/\s+/).filter(Boolean);
      words.forEach((w, i) => {
        const m = el('span', 'mask', `<span class="wi">${w}</span>`, host);
        if (i < words.length - 1) host.appendChild(document.createTextNode(' '));
        if (!isHl && i === words.length - 1) host.appendChild(document.createTextNode(' '));
      });
    });
    if (li < lines.length - 1) el('br', null, null, h);
  });
  return h;
}
// shrink a headline until every line fits maxW
function fit(h, maxW) {
  let s = parseFloat(h.style.fontSize);
  for (let i = 0; i < 40; i++) {
    const tooWide = h.scrollWidth > maxW + 1 || [...h.querySelectorAll('.hl')].some((x) => x.offsetWidth > maxW);
    if (!tooWide) break;
    s -= 3; h.style.fontSize = s + 'px';
  }
  return h;
}
function sticker(text, tone, parent, opt = {}) {
  const s = el('div', 'stk ' + (tone || '') + (opt.tile ? ' tile' : ''), (opt.icon ? icon(opt.icon) : '') + `<span>${text}</span>`, parent);
  s.style.fontSize = (opt.size || 34) + 'px';
  if (opt.at) { s.style.left = opt.at[0] + 'px'; s.style.top = opt.at[1] + 'px'; }
  if (opt.center) { s.style.transform = 'translate(-50%,-50%)'; }
  return s;
}
const STATUS_ICONS = `<span class="ic"><svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#15131d"/><rect x="5" y="5" width="3" height="7" rx="1" fill="#15131d"/><rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#15131d"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#15131d"/></svg><svg width="26" height="13" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#15131d" opacity=".4"/><rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="#15131d"/><rect x="24" y="4.5" width="1.6" height="4" rx=".8" fill="#15131d" opacity=".5"/></svg></span>`;
// A phone with a status bar and a stack of screens. Screens: {key, src, tall?, chrome?}
function phone(parent, screens, at) {
  const dev = el('div', 'dev', null, parent, { left: at[0] + 'px', top: at[1] + 'px' });
  const ph = el('div', 'phone', null, dev);
  const scr = el('div', 'screen', null, ph);
  el('div', 'sb', `<span>10:30</span>${STATUS_ICONS}`, scr);
  el('div', 'island', null, scr);
  const view = el('div', 'view', null, scr);
  const map = {};
  screens.forEach((s, i) => {
    const d = el('div', 'scr', null, view);
    const img = el('img', 'full', null, d);
    img.src = 'assets/shots/' + s.src;
    if (s.chrome) {
      el('div', 'chromeTop', null, d, { backgroundImage: `url(assets/shots/${s.chrome})` });
      el('div', 'chromeBot', null, d, { backgroundImage: `url(assets/shots/${s.chrome})` });
    }
    if (i > 0) d.style.visibility = 'hidden';
    map[s.key] = { box: d, img };
  });
  const cur = el('div', 'cur', '<div class="ring"></div><div class="dot"></div>', scr);
  cur.style.opacity = 0;
  return { dev, ph, scr, view, screens: map, cur };
}
function browser(parent, src, url, w) {
  const b = el('div', 'browser', `<div class="bar"><i></i><i></i><i></i><div class="url">${url}</div></div>`, parent, { width: w + 'px' });
  const img = el('img', null, null, b); img.src = 'assets/shots/' + src;
  return b;
}
function logoMark(size, parent) {
  const d = el('div', null, null, parent, { width: size + 'px', height: size + 'px', position: 'absolute' });
  const img = el('img', null, null, d, { width: '100%', height: '100%', display: 'block' });
  img.src = 'assets/logo.svg';
  return d;
}
async function waitAssets() {
  await document.fonts.ready;
  await Promise.all(['400 20px Figtree', '800 20px "Bricolage Grotesque"'].map((f) => document.fonts.load(f)));
  const imgs = [...document.images];
  await Promise.all(imgs.map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => { i.onload = () => i.decode().then(r, r); i.onerror = r; }))));
  const bgs = new Set();
  document.querySelectorAll('[style*="background-image"]').forEach((e) => { const m = e.style.backgroundImage.match(/url\("?([^")]+)/); if (m) bgs.add(m[1]); });
  await Promise.all([...bgs].map((u) => new Promise((r) => { const i = new Image(); i.onload = () => i.decode().then(r, r); i.onerror = r; i.src = u; })));
}
