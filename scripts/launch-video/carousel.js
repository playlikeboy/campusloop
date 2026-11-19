// Six 1080x1350 Instagram carousel slides. carousel.html?slide=1..6
const SLIDE = Number(new URLSearchParams(location.search).get('slide') || 1);
const W = 1080, H = 1350;
const stage = document.getElementById('stage');
Object.assign(stage.style, { width: W + 'px', height: H + 'px' });

function bg(color) { stage.style.background = color; }
function copyAt(parent, { label, tone = 'violet', ic, head, sub, cls = '', y = 96, size = 96 }) {
  const box = el('div', cls, null, parent, { position: 'absolute', left: '80px', top: y + 'px', width: '920px' });
  if (label) { const w = el('div', null, null, box, { height: '82px', position: 'relative' }); const s = sticker(label, tone, w, { icon: ic, size: 32 }); s.style.left = 0; s.style.top = 0; s.style.transform = 'rotate(-3deg)'; }
  const h = fit(headline(head, size, box), 920);
  h.querySelectorAll('.hl').forEach((x) => (x.style.transform = 'rotate(-2deg)'));
  if (sub) el('div', 'sub', sub, box, { fontSize: '34px', marginTop: '26px', maxWidth: '880px' });
  return box;
}
function ph(screens, x, y, s, rot = 0) {
  const p = phone(stage, screens, [x, y]);
  p.ph.style.transform = `scale(${s}) rotate(${rot}deg)`;
  return p;
}
function float(parent, html, cls, x, y, rot, size = 32) {
  const s = el('div', 'stk ' + cls, html, parent, { left: x + 'px', top: y + 'px', fontSize: size + 'px', transform: `translate(-50%,-50%) rotate(${rot}deg)` });
  return s;
}
function pageDots() {
  const d = el('div', null, null, stage, { position: 'absolute', right: '80px', top: '1270px', display: 'flex', gap: '10px', zIndex: 30 });
  for (let i = 1; i <= 6; i++) el('i', null, null, d, { width: i === SLIDE ? '30px' : '10px', height: '10px', borderRadius: '99px', background: i === SLIDE ? 'var(--violet)' : 'rgb(21 19 29 / .25)', display: 'block' });
}

function build() {
  if (SLIDE === 1) {
    bg('var(--violet)');
    const top = el('div', null, null, stage, { position: 'absolute', left: '80px', top: '80px', display: 'flex', alignItems: 'center', gap: '18px' });
    const lm = el('div', null, null, top, { width: '84px', height: '84px', background: '#fff', borderRadius: '24px', display: 'grid', placeItems: 'center' });
    el('img', null, null, lm, { width: '96px', height: '96px' }).src = 'assets/logo.svg';
    el('div', 'disp', 'CampusLoop', top, { fontSize: '52px', color: '#fff' });
    const box = el('div', 'on-violet', null, stage, { position: 'absolute', left: '80px', top: '250px', width: '920px' });
    const h = fit(headline('Your campus./*Only your campus.*', 132, box), 920);
    h.querySelectorAll('.hl').forEach((x) => (x.style.transform = 'rotate(-2deg)'));
    el('div', 'sub', 'A student-only app for Indian colleges.', box, { fontSize: '38px', marginTop: '34px' });
    const p = ph([{ key: 'a', src: 'm_feeds.jpg' }], 700, 1240, 1.05, -8);
    float(stage, icon('shield') + '<span>Verified students only</span>', 'mint', 300, 880, -5, 36);
    float(stage, '<span>Swipe</span>' + icon('check').replace(ICONS.check, '<path d="M5 12h14M13 6l6 6-6 6"/>'), '', 260, 1180, 3, 34);
  }
  if (SLIDE === 2) {
    bg('var(--paper-muted)');
    copyAt(stage, { label: 'Home', ic: 'home', head: 'Your campus feed./*Plus confessions.*', sub: 'Posts, polls and anonymous confessions from students at your college.' });
    const p = ph([{ key: 'a', src: 'm_feeds.jpg' }], 540, 1110, 1.1, 0);
    float(stage, icon('poll') + '<span>Polls</span>', '', 200, 760, -5, 34);
    float(stage, icon('lock') + '<span>Say it. No name attached.</span>', 'ink tile', 760, 1020, 4, 30);
  }
  if (SLIDE === 3) {
    bg('var(--violet)');
    copyAt(stage, { label: 'Events', tone: '', ic: 'cal', head: 'Fests and hackathons./*Register in a tap.*', sub: 'Every fest, hackathon and workshop, with dates and deadlines.', cls: 'on-violet' });
    const p = ph([{ key: 'a', src: 'mt_events.jpg', chrome: 'm_events.jpg' }], 540, 1120, 1.1, 0);
    p.screens.a.img.style.transform = 'translateY(-500px)';
    el('div', 'toast', `<div class="ck">${icon('check', 3)}</div><div>You're registered.<br><span style="opacity:.7;font-weight:500">See you there.</span></div>`, p.scr, { top: '700px' });
    float(stage, '<span>Fests</span>', '', 190, 760, -5, 34);
    float(stage, '<span>Hackathons</span>', '', 880, 820, 4, 34);
  }
  if (SLIDE === 4) {
    bg('#fff');
    copyAt(stage, { label: 'Learn', ic: 'cap', head: 'Free courses,/*notes and PYQs.*', sub: 'Notes and past papers for your branch and semester, plus free video courses.' });
    ph([{ key: 'a', src: 'm_academics.jpg' }], 430, 1130, 1.1, -3);
    el('div', null, null, stage, { position: 'absolute', left: '560px', top: '820px', width: '390px', height: '330px', borderRadius: '22px', background: '#fff url(assets/shots/mt_courses.jpg) no-repeat 0 -468px / 390px auto', boxShadow: 'var(--sh-lift)', border: '1px solid var(--hair)', transform: 'scale(1.15) rotate(3deg)' });
  }
  if (SLIDE === 5) {
    bg('var(--mist)');
    copyAt(stage, { label: 'Chat + You', ic: 'chat', head: 'Talk to your batch./*Earn Loop Points.*', sub: 'DMs and groups, plus your profile, streak and points.' });
    ph([{ key: 'a', src: 'm_chat.jpg' }], 330, 1150, 0.98, -5);
    ph([{ key: 'b', src: 'm_profile.jpg' }], 760, 1190, 0.98, 5);
    float(stage, icon('coin') + '<span>Loop Points</span>', 'yellow', 780, 760, -4, 38);
    float(stage, icon('flame') + '<span>Keep your streak</span>', 'tile', 270, 790, 4, 32);
  }
  if (SLIDE === 6) {
    bg('#fff');
    const col = el('div', null, null, stage, { position: 'absolute', left: '50%', top: '560px', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '960px' });
    const row = el('div', null, null, col, { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '50px' });
    el('img', null, null, row, { width: '150px', height: '150px', margin: '-20px -24px -20px -30px' }).src = 'assets/logo.svg';
    el('div', 'disp', 'CampusLoop', row, { fontSize: '96px' });
    const h = fit(headline('Your campus./*Only your campus.*', 104, col), 920);
    h.querySelectorAll('.hl').forEach((x) => (x.style.transform = 'rotate(-2deg)'));
    const pills = el('div', null, null, col, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '70px' });
    el('div', 'stk violet', icon('globe') + '<span>campusloop.space</span>', pills, { position: 'relative', fontSize: '52px', transform: 'rotate(-2deg)' });
    el('div', 'stk ink', icon('phone') + '<span>Android beta out now</span>', pills, { position: 'relative', fontSize: '42px', transform: 'rotate(2deg)' });
    el('div', 'sub', 'Link in bio', col, { fontSize: '34px', marginTop: '40px' });
    const tape = el('div', 'tape', null, stage, { top: '1150px' });
    const items = ['Home', 'Confessions', 'Events', 'Learn', 'Chat', 'You', 'Campus board', 'Secret Crush'];
    el('div', 'run', [...items, ...items].map((x) => `<span>${x}</span><b></b>`).join(''), tape, { transform: 'translateX(-260px)' });
  }
  pageDots();
}
window.__ready = (async () => {
  await document.fonts.load('800 40px "Bricolage Grotesque"');
  await document.fonts.load('500 40px Figtree');
  build();
  await waitAssets();
  return true;
})();
