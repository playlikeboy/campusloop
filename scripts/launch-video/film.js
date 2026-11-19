// CampusLoop launch film timeline. One paused GSAP timeline, seeked per frame by render.mjs.
// ?v=h -> 1920x1080, ?v=v -> 1080x1920. Times are seconds on a 120 bpm grid (beat = 0.5 s).
const QS = new URLSearchParams(location.search);
const V = QS.get('v') === 'v';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const DURATION = 55;
const stage = document.getElementById('stage');
Object.assign(stage.style, { width: W + 'px', height: H + 'px' });
document.body.classList.add(V ? 'v' : 'h');

const tl = gsap.timeline({ paused: true });
const CUES = []; // sound effects, read by music.py
const CAPS = []; // captions, written to WebVTT
const sfx = (kind, t, gain = 1) => CUES.push({ kind, t: +t.toFixed(3), gain });
const cap = (a, b, text) => CAPS.push({ start: a, end: b, text });
const pos = (h, v) => (V ? v : h);

// Every tween is explicit from->to and never renders before its start; the renderer only seeks forward.
function ft(target, from, to, t) { tl.fromTo(target, from, { ...to, immediateRender: false }, t); }
function at(target, vars, t) { tl.set(target, vars, t); }

const bgLayer = el('div', 'layer', null, stage);
function wipe(color, t, ox = '50%', oy = '50%', dur = 0.6) {
  const w = el('div', 'wipe', null, bgLayer, { background: color, clipPath: `circle(0% at ${ox} ${oy})` });
  ft(w, { clipPath: `circle(0% at ${ox} ${oy})` }, { clipPath: `circle(150% at ${ox} ${oy})`, duration: dur, ease: 'expo.inOut' }, t);
  sfx('whoosh', t, 0.8);
  return w;
}
function scene(t0, t1, cls = '') {
  const s = el('div', 'scene ' + cls, null, stage);
  at(s, { opacity: 1 }, t0);
  at(s, { opacity: 0 }, t1);
  return s;
}
function hideWords(node) { gsap.set(node.querySelectorAll('.wi'), { yPercent: 118 }); node.querySelectorAll('.hl').forEach((h) => gsap.set(h, { scale: 0.7, opacity: 0, rotation: 0 })); }
function inWords(node, t, { stagger = 0.05, dur = 0.8, hlRot = -2, pop = true } = {}) {
  const ws = [...node.querySelectorAll('.wi')];
  ft(ws, { yPercent: 118, rotation: 5 }, { yPercent: 0, rotation: 0, duration: dur, ease: 'expo.out', stagger }, t);
  node.querySelectorAll('.hl').forEach((h) => {
    const i = ws.indexOf(h.querySelector('.wi'));
    const th = t + Math.max(0, i) * stagger - 0.05;
    ft(h, { scale: 0.7, opacity: 0, rotation: 0 }, { scale: 1, opacity: 1, rotation: hlRot, duration: 0.6, ease: 'back.out(2.2)' }, th);
    if (pop) sfx('pop', th + 0.05, 0.9);
  });
}
function outWords(node, t) {
  ft(node.querySelectorAll('.wi'), { yPercent: 0 }, { yPercent: -118, duration: 0.38, ease: 'power3.in', stagger: 0.012 }, t);
  node.querySelectorAll('.hl').forEach((h) => ft(h, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, t + 0.12));
}
function popIn(node, t, rot = 0, s = true, gain = 1) {
  gsap.set(node, { opacity: 0, scale: 0.5 });
  ft(node, { opacity: 0, scale: 0.5, rotation: rot - 10 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.55, ease: 'back.out(2.4)' }, t);
  if (s) sfx('pop', t, gain);
}
function popOut(node, t) { ft(node, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.8, duration: 0.25, ease: 'power2.in' }, t); }
function fadeUp(node, t, d = 0.6) { gsap.set(node, { opacity: 0, y: 30 }); ft(node, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: d, ease: 'expo.out' }, t); }
function fadeOut(node, t, d = 0.3) { ft(node, { opacity: 1 }, { opacity: 0, duration: d, ease: 'power2.in' }, t); }
function centerSet(node) { gsap.set(node, { xPercent: -50, yPercent: -50 }); }

// Copy block for a feature beat: sticker label, headline, sub line.
const C = V
  ? { x: 80, y: 150, w: 920, h: 100, sub: 36, label: 32 }
  : { x: 150, y: null, w: 830, h: 108, sub: 34, label: 32 };
function copy(parent, { label, tone = 'violet', icon: ic, head, sub, cls = '', w = C.w, size = C.h }) {
  const box = el('div', cls, null, parent, { position: 'absolute', left: C.x + 'px', width: w + 'px' });
  if (C.y == null) { box.style.top = '50%'; gsap.set(box, { yPercent: -50 }); } else box.style.top = C.y + 'px';
  let lb = null;
  if (label) { lb = sticker(label, tone, el('div', null, null, box, { height: C.label * 1.6 + 30 + 'px', position: 'relative' }), { icon: ic, size: C.label }); lb.style.position = 'absolute'; lb.style.left = '0'; lb.style.top = '0'; gsap.set(lb, { transformOrigin: '0% 50%' }); }
  const h = fit(headline(head, size, box), w);
  hideWords(h);
  let sb = null;
  if (sub) sb = el('div', 'sub', sub, box, { fontSize: C.sub + 'px', marginTop: '30px', maxWidth: w - 40 + 'px' });
  return { box, lb, h, sb, text: head.replace(/[*/]/g, ' ').replace(/\s+/g, ' ').trim() + (sub ? '\n' + sub : '') };
}
function copyIn(c, t) {
  if (c.lb) popIn(c.lb, t, -3, true, 0.7);
  inWords(c.h, t + 0.12);
  if (c.sb) fadeUp(c.sb, t + 0.5);
}
function copyOut(c, t) {
  if (c.lb) popOut(c.lb, t);
  outWords(c.h, t);
  if (c.sb) fadeOut(c.sb, t);
}

// Phone helpers
function flyIn(p, t, S, from = {}) {
  gsap.set(p.ph, { scale: S, y: 1400 });
  ft(p.ph, { y: 1100, x: 200, rotationX: 28, rotationY: -28, rotationZ: 12, scale: S * 0.85, ...from }, { y: 0, x: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: S, duration: 1.15, ease: 'expo.out' }, t);
  sfx('swoosh', t, 1);
}
function push(p, a, b, t) {
  const A = p.screens[a].box, B = p.screens[b].box;
  gsap.set(B, { xPercent: 100 });
  at(B, { visibility: 'visible' }, t);
  ft(B, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: 'expo.out' }, t);
  ft(A, { xPercent: 0, opacity: 1 }, { xPercent: -35, opacity: 0.6, duration: 0.6, ease: 'expo.out' }, t);
  at(A, { visibility: 'hidden' }, t + 0.62);
}
function tap(p, x, y, t, move = 0.45) {
  const c = p.cur;
  if (!p._c) ft(c, { x: x + 70, y: y + 140, opacity: 0, scale: 1.4 }, { x, y, opacity: 1, scale: 1, duration: move, ease: 'power3.out' }, t - move);
  else ft(c, { x: p._c[0], y: p._c[1] }, { x, y, duration: move, ease: 'power3.inOut' }, t - move);
  p._c = [x, y];
  ft(c.querySelector('.dot'), { scale: 1 }, { scale: 0.72, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
  ft(c.querySelector('.ring'), { scale: 0.6, opacity: 0.95 }, { scale: 2.6, opacity: 0, duration: 0.55, ease: 'expo.out' }, t);
  sfx('click', t);
}
function curHide(p, t) { ft(p.cur, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t); p._c = null; }
function floater(p, html, cls, dxy, t, rot = 0, size = 30) {
  const s = el('div', 'stk ' + cls, html, p.dev, { left: dxy[0] + 'px', top: dxy[1] + 'px', fontSize: size + 'px' });
  centerSet(s);
  popIn(s, t, rot);
  return s;
}
const NAV = { home: 38, events: 116, learn: 195, chat: 272, you: 351 }; // tab centres, screen x
const NAV_Y = 44 + 806;

function build() {
  // ---------- 1. Cold open 0-4 ----------
  {
    const s = scene(0, 4.2);
    const A = el('div', null, null, s, { position: 'absolute', left: '0', right: '0', top: '50%', textAlign: 'center' });
    gsap.set(A, { yPercent: -50 });
    const a = fit(headline('Your campus.', pos(250, 200), A), W - 160);
    a.querySelectorAll('.wi')[1].innerHTML = 'campus<em>.</em>';
    gsap.set(a.querySelectorAll('.wi'), { yPercent: 118 });
    const aw = a.querySelectorAll('.wi');
    ft(aw[0], { yPercent: 118, rotation: 6 }, { yPercent: 0, rotation: 0, duration: 0.7, ease: 'expo.out' }, 0);
    ft(aw[1], { yPercent: 118, rotation: 6 }, { yPercent: 0, rotation: 0, duration: 0.7, ease: 'expo.out' }, 0.5);
    sfx('tick', 0.02, 0.8); sfx('tick', 0.5, 0.9);
    ft(A, { scale: 1 }, { scale: 1.06, duration: 1.75, ease: 'none' }, 0);
    outWords(a, 1.62);
    cap(0, 1.95, 'Your campus.');
    wipe('var(--violet)', 1.7);
    const B = el('div', 'on-violet', null, s, { position: 'absolute', left: '0', right: '0', top: '50%', textAlign: 'center' });
    gsap.set(B, { yPercent: -50 });
    const b = fit(headline('Only/*your campus.*', pos(220, 180), B), W - 160);
    hideWords(b);
    inWords(b, 2.0, { stagger: 0.12 });
    sfx('hit', 2.0, 0.9);
    ft(B, { scale: 1 }, { scale: 1.05, duration: 1.8, ease: 'none' }, 2.0);
    outWords(b, 3.72);
    cap(2.0, 3.95, 'Only your campus.');
  }
  // ---------- 2. Problem 4-8 ----------
  {
    wipe('var(--night)', 3.8, '50%', '100%');
    const s = scene(4, 8.1, 'on-dark');
    const box = el('div', null, null, s, { position: 'absolute', left: pos(150, 80) + 'px', top: '50%', width: W - pos(300, 160) + 'px' });
    gsap.set(box, { yPercent: -50 });
    const groups = [pos(['Fest updates get lost', 'in group chats.'], ['Fest updates', 'get lost in', 'group chats.']), pos(['Notes are all over', 'the place.'], ['Notes are all', 'over the place.'])];
    const size = pos(128, 110);
    const tIn = [4.0, 5.5], tStrike = [6.5, 7.0];
    groups.forEach((g, gi) => {
      const gEl = el('div', null, null, box, { marginTop: gi ? pos(56, 80) + 'px' : '0' });
      g.forEach((line, li) => {
        const row = el('div', null, null, gEl);
        const h = headline(line, size, row);
        h.style.display = 'inline-block'; h.style.position = 'relative';
        hideWords(h);
        inWords(h, tIn[gi] + li * 0.18);
        const bar = el('div', null, null, h, { position: 'absolute', left: '-10px', right: '-10px', top: '52%', height: '12px', borderRadius: '8px', background: 'var(--violet)', transformOrigin: '0% 50%' });
        gsap.set(bar, { scaleX: 0 });
        ft(bar, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'expo.out' }, tStrike[gi] + li * 0.12);
        ft(h.querySelectorAll('.wi'), { opacity: 1 }, { opacity: 0.38, duration: 0.3 }, tStrike[gi] + li * 0.12);
      });
      sfx('strike', tStrike[gi]);
      sfx('whoosh', tIn[gi], 0.5);
    });
    ft(box, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' }, 7.6);
    cap(4.0, 5.45, 'Fest updates get lost in group chats.');
    cap(5.5, 7.9, 'Notes are all over the place.');
    sfx('riser', 6.0);
  }
  // ---------- 3. Logo sting 8-10 ----------
  {
    wipe('#fff', 7.82);
    const s = scene(7.9, 10.1);
    const g = el('div', null, null, s, { position: 'absolute', left: '50%', top: pos('46%', '45%'), display: 'flex', flexDirection: pos('row', 'column'), alignItems: 'center', gap: pos('36px', '30px') });
    centerSet(g);
    const lm = el('div', null, null, g, { width: pos(250, 260) + 'px', height: pos(250, 260) + 'px', position: 'relative', margin: pos('0 -20px 0 -40px', '-30px 0 -40px') });
    el('img', null, null, lm, { width: '100%', height: '100%' }).src = 'assets/logo.svg';
    const wm = headline('CampusLoop', pos(170, 150), g);
    hideWords(wm);
    popIn(lm, 8.0, 0, false);
    ft(lm, { rotation: -140 }, { rotation: 0, duration: 0.8, ease: 'back.out(1.6)' }, 8.0);
    inWords(wm, 8.2, { dur: 0.7 });
    const sub = el('div', 'sub', 'The student app for Indian colleges.', s, { position: 'absolute', left: '50%', top: pos('66%', '60%'), fontSize: pos(40, 44) + 'px', whiteSpace: 'nowrap' });
    gsap.set(sub, { xPercent: -50 });
    fadeUp(sub, 8.7);
    sfx('impact', 8.0);
    ft([g, sub], { scale: 1, opacity: 1 }, { scale: 1.5, opacity: 0, duration: 0.4, ease: 'power3.in' }, 9.62);
    cap(8.0, 9.95, 'CampusLoop. The student app for Indian colleges.');
  }
  // ---------- 4-9. The five tabs 10-35, one phone ----------
  {
    wipe('var(--paper-muted)', 9.7);
    const s = scene(9.9, 35.4);
    const S = pos(1.0, 1.25);
    const P = phone(s, [
      { key: 'home', src: 'mt_feeds.jpg', chrome: 'm_feeds.jpg' },
      { key: 'conf', src: 'm_confessions.jpg' },
      { key: 'events', src: 'mt_events.jpg', chrome: 'm_events.jpg' },
      { key: 'learn', src: 'm_academics.jpg' },
      { key: 'chat', src: 'm_chat.jpg' },
      { key: 'you', src: 'm_profile.jpg' },
    ], pos([1400, 548], [540, 1300]));
    flyIn(P, 10.0, S);
    ft(P.dev, { y: -6 }, { y: 6, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: 11 }, 10.5);
    const phoneOrigin = pos(['73%', '50%'], ['50%', '68%']);

    // Home
    const home = copy(s, { label: 'Home', icon: 'home', head: 'Your campus,/*in one feed.*', sub: 'Posts, polls and questions from students at your college.' });
    copyIn(home, 10.25);
    const homeImg = P.screens.home.img;
    ft(homeImg, { y: 0 }, { y: -560, duration: 1.6, ease: 'power2.inOut' }, 11.0);
    ft(homeImg, { y: -560 }, { y: 0, duration: 0.7, ease: 'expo.out' }, 13.0);
    const f1 = floater(P, icon('poll') + '<span>Polls</span>', '', pos([300, -170], [-300, -330]), 12.0, -4, pos(32, 36));
    const f2 = floater(P, '<span>#HostelLife</span>', 'mist', pos([320, 140], [290, -190]), 12.5, 4, pos(30, 34));
    f2.style.boxShadow = 'var(--sh-sticker)';
    tap(P, 152, 44 + 134, 14.0);
    popOut(f1, 14.1); popOut(f2, 14.15);
    copyOut(home, 14.05);
    cap(10.25, 14.2, home.text);

    // Confessions
    wipe('var(--night)', 14.3, ...phoneOrigin);
    push(P, 'home', 'conf', 14.45);
    curHide(P, 14.6);
    const conf = copy(s, { label: 'Confessions', tone: '', icon: 'lock', head: 'Say it./*No name attached.*', sub: 'Anonymous confessions from your campus. Your name is never shown.', cls: 'on-dark' });
    copyIn(conf, 14.6);
    ft(P.ph, { rotationY: 0 }, { rotationY: -7, duration: 3.0, ease: 'sine.inOut' }, 14.8);
    ft(P.ph, { rotationY: -7 }, { rotationY: 0, duration: 0.6, ease: 'expo.out' }, 17.9);
    const f3 = floater(P, icon('lock') + '<span>Anonymous</span>', 'tile', pos([290, -40], [-300, -280]), 15.6, 4, pos(32, 36));
    tap(P, NAV.events, NAV_Y, 17.7);
    popOut(f3, 17.8);
    copyOut(conf, 17.85);
    cap(14.6, 18.2, conf.text);

    // Events
    wipe('var(--violet)', 18.0, ...phoneOrigin);
    push(P, 'conf', 'events', 18.05);
    const ev = copy(s, { label: 'Events', tone: '', icon: 'cal', head: 'Fests and hackathons./*Register in a tap.*', sub: 'Every fest, hackathon and workshop, with dates and deadlines.', cls: 'on-violet' });
    copyIn(ev, 18.5);
    const f4 = floater(P, '<span>Fests</span>', '', pos([290, -300], [-300, -330]), 19.0, -5, pos(32, 36));
    const f5 = floater(P, '<span>Hackathons</span>', '', pos([300, -190], [300, -250]), 19.5, 4, pos(32, 36));
    const evImg = P.screens.events.img;
    ft(evImg, { y: 0 }, { y: -500, duration: 1.3, ease: 'power2.inOut' }, 19.6);
    tap(P, 305, 44 + 520, 21.3, 0.5);
    const toast = el('div', 'toast', `<div class="ck">${icon('check', 3)}</div><div>You're registered.<br><span style="opacity:.7;font-weight:500">See you there.</span></div>`, P.scr, { top: '700px' });
    popIn(toast, 21.45, 0, true, 0.9);
    ft(toast, { y: 0 }, { y: 0 }, 21.45);
    tap(P, NAV.learn, NAV_Y, 22.55);
    popOut(f4, 22.4); popOut(f5, 22.45);
    copyOut(ev, 22.4);
    fadeOut(toast, 22.6, 0.2);
    cap(18.5, 22.6, ev.text);

    // Learn
    wipe('#fff', 22.8, ...phoneOrigin);
    push(P, 'events', 'learn', 22.85);
    const learn = copy(s, { label: 'Learn', icon: 'cap', head: 'Free courses,/*notes and PYQs.*', sub: 'Notes and past papers for your branch and semester, plus free video courses.' });
    copyIn(learn, 23.0);
    const card = el('div', null, null, P.dev, { position: 'absolute', left: pos(250, 120) + 'px', top: pos(160, 260) + 'px', width: '390px', height: '330px', borderRadius: '22px', background: '#fff url(assets/shots/mt_courses.jpg) no-repeat 0 -468px / 390px auto', boxShadow: 'var(--sh-lift)', border: '1px solid var(--hair)' });
    gsap.set(card, { xPercent: -50, yPercent: -50 });
    gsap.set(card, { opacity: 0 });
    ft(card, { opacity: 0, scale: 0.6, rotation: -8, y: 80 }, { opacity: 1, scale: pos(1.0, 1.1), rotation: 3, y: 0, duration: 0.7, ease: 'back.out(1.8)' }, 24.5);
    sfx('pop', 24.5);
    tap(P, NAV.chat, NAV_Y, 26.45);
    popOut(card, 26.3);
    copyOut(learn, 26.35);
    cap(23.0, 26.6, learn.text);

    // Chat
    wipe('var(--mist)', 26.8, ...phoneOrigin);
    push(P, 'learn', 'chat', 26.85);
    const chat = copy(s, { label: 'Chat', icon: 'chat', head: 'Talk to/*your batch.*', sub: 'Message anyone from your college, one to one or in groups.' });
    copyIn(chat, 27.0);
    const bubbles = [
      ['them', 'Canteen after class?', pos([70, -230], [-460, -300]), 28.0],
      ['me', 'Coming in 5', pos([170, -120], [80, -180]), 28.5],
      ['them', 'Bring the DBMS notes', pos([50, -10], [-460, -60]), 29.0],
    ].map(([who, text, xy, t]) => {
      const b = el('div', 'bub ' + who, text, P.dev, { left: xy[0] + 'px', top: xy[1] + 'px', fontSize: pos(26, 32) + 'px' });
      gsap.set(b, { transformOrigin: who === 'me' ? '100% 100%' : '0% 100%' });
      popIn(b, t, 0, false);
      sfx('blip', t);
      return b;
    });
    tap(P, NAV.you, NAV_Y, 30.0);
    bubbles.forEach((b, i) => popOut(b, 29.85 + i * 0.04));
    copyOut(chat, 29.9);
    cap(27.0, 30.1, chat.text);

    // You
    wipe('var(--yellow-subtle)', 30.3, ...phoneOrigin);
    push(P, 'chat', 'you', 30.35);
    curHide(P, 30.5);
    const you = copy(s, { label: 'You', icon: 'user', head: 'Keep your streak./*Earn Loop Points.*', sub: 'Your profile, your streak and your points, all in one tab.' });
    copyIn(you, 30.5);
    const k = pos(1.45, 1.22);
    ft(P.ph, { scale: S, x: 0, y: 0 }, { scale: S * k, x: (k - 1) * 82 * S, y: -(k - 1) * 181 * S, duration: 1.2, ease: 'expo.inOut' }, 31.6);
    const lp = floater(P, icon('coin') + '<span>Loop Points</span>', 'yellow', pos([-170, 330], [-250, 470]), 32.4, -5, pos(36, 40));
    const st = floater(P, icon('flame') + '<span>Keep your streak</span>', 'tile', pos([250, -250], [230, -420]), 32.9, 4, pos(32, 36));
    popOut(lp, 34.2); popOut(st, 34.25);
    copyOut(you, 34.2);
    ft(P.ph, { y: -(k - 1) * 181 * S, opacity: 1 }, { y: -2800, opacity: 1, rotationZ: -8, duration: 0.6, ease: 'power3.in' }, 34.5);
    sfx('swoosh', 34.5, 0.8);
    cap(30.5, 34.4, you.text);
  }
  // ---------- 10. Campus board + Secret Crush 35-39 ----------
  {
    wipe('#fff', 34.7, '50%', '0%');
    const s = scene(34.9, 39.2);
    const PB = phone(s, [{ key: 'b', src: 'm_board.jpg' }], pos([1240, 548], [370, 1330]));
    const PC = phone(s, [{ key: 'c', src: 'm_crush.jpg' }], pos([1620, 590], [730, 1400]));
    flyIn(PB, 35.0, pos(0.95, 1.05));
    const box = el('div', null, null, s, { position: 'absolute', left: C.x + 'px', width: C.w + 'px', top: pos('50%', C.y + 'px') });
    if (!V) gsap.set(box, { yPercent: -50 });
    const lb = sticker('Campus board', 'ink', el('div', null, null, box, { height: C.label * 1.6 + 30 + 'px', position: 'relative' }), { size: C.label });
    lb.style.left = 0; lb.style.top = 0;
    gsap.set(lb, { transformOrigin: '0% 50%' });
    popIn(lb, 35.0, -3, true, 0.7);
    const lines = ['Rides. Rooms.', 'Lost & found.', 'Buy & sell.'].map((t, i) => {
      const h = headline(t, C.h, el('div', null, null, box));
      hideWords(h);
      inWords(h, 35.1 + i * 0.5, { stagger: 0.12 });
      sfx('tick', 35.1 + i * 0.5, 0.7);
      return h;
    });
    const sub = el('div', 'sub', 'Posted by students at your college.', box, { fontSize: C.sub + 'px', marginTop: '30px' });
    fadeUp(sub, 36.4);
    popOut(lb, 36.8); lines.forEach((h) => outWords(h, 36.8)); fadeOut(sub, 36.8);
    cap(35.0, 36.9, 'Rides. Rooms. Lost & found. Buy & sell.\nPosted by students at your college.');

    wipe('var(--pink-subtle)', 36.9, ...pos(['84%', '55%'], ['68%', '73%']));
    flyIn(PC, 37.0, pos(0.9, 1.0), { x: 300 });
    ft(PC.dev, { rotation: 0 }, { rotation: 5, duration: 1.1, ease: 'expo.out' }, 37.0);
    ft(PB.ph, { opacity: 1 }, { opacity: 0.55, duration: 0.5 }, 37.0);
    const crush = copy(s, { label: 'Secret Crush', tone: 'pink', icon: 'heart', head: 'Like someone?/*Add them in secret.*', sub: 'Nobody is told unless they add you too.', cls: 'crush' });
    crush.h.querySelectorAll('.hl').forEach((h) => (h.style.background = 'var(--pink)'));
    copyIn(crush, 37.15);
    const heart = floater(PC, icon('heart', 2.6), 'pink tile', pos([-170, -330], [-200, -470]), 37.7, -8, pos(64, 70));
    heart.style.padding = '.32em';
    cap(37.15, 39.0, crush.text);
    ft(s, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 38.85);
  }
  // ---------- 11. Verified 39-43 ----------
  {
    wipe('var(--mint-subtle)', 38.85);
    const s = scene(38.9, 43.1, 'on-mint');
    const col = el('div', null, null, s, { position: 'absolute', left: '50%', top: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: W - 160 + 'px' });
    centerSet(col);
    const badge = el('div', null, icon('shield', 2.2), col, { width: pos(180, 220) + 'px', height: pos(180, 220) + 'px', borderRadius: '50%', background: 'var(--mint)', color: 'var(--ink)', display: 'grid', placeItems: 'center', boxShadow: 'var(--sh-lift)', marginBottom: pos(40, 56) + 'px', padding: pos(38, 46) + 'px' });
    popIn(badge, 39.0, 0, false);
    sfx('stamp', 39.0);
    const h = fit(headline('Verified/*students only.*', pos(140, 130), col), W - 200);
    hideWords(h);
    inWords(h, 39.25, { stagger: 0.08 });
    const sub = el('div', 'sub', 'Real students. No outsiders.', col, { fontSize: pos(40, 44) + 'px', marginTop: '34px', color: 'var(--mint-text)', fontWeight: 600 });
    fadeUp(sub, 40.0);
    const row = el('div', null, null, col, { display: 'flex', gap: pos('28px', '30px'), marginTop: pos('48px', '70px') });
    [['AK', '#6b3df5'], ['PS', '#15131d'], ['RM', '#5a2be0'], ['NS', '#57526a']].forEach(([ini, c], i) => {
      const a = el('div', null, `<span>${ini}</span><i style="position:absolute;right:-6px;bottom:-6px;width:44px;height:44px;border-radius:50%;background:var(--mint);color:var(--ink);display:grid;place-items:center;border:4px solid var(--mint-subtle)">${icon('check', 3.4).replace('<svg', '<svg width="22" height="22"')}</i>`, row,
        { position: 'relative', width: pos(110, 130) + 'px', height: pos(110, 130) + 'px', borderRadius: '50%', background: c, color: '#fff', display: 'grid', placeItems: 'center', font: `800 ${pos(38, 44)}px/1 var(--display)`, fontStretch: '88%', boxShadow: 'var(--sh-sticker)' });
      popIn(a, 40.5 + i * 0.25, 0, true, 0.7);
    });
    ft(col, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' }, 42.6);
    cap(39.25, 42.9, 'Verified students only.\nReal students. No outsiders.');
  }
  // ---------- 12. Web + Android 43-49 ----------
  {
    wipe('var(--violet)', 42.8);
    const s = scene(42.9, 49.1, 'on-violet');
    const webT = el('div', null, null, s, { position: 'absolute', left: C.x + 'px', top: pos(110, 170) + 'px', width: W - 2 * C.x + 'px' });
    const wh = fit(headline('On the web at/*campusloop.space*', pos(96, 100), webT), W - 2 * C.x);
    hideWords(wh);
    inWords(wh, 43.0, { stagger: 0.06 });
    const br = browser(s, 'd_feeds.jpg', 'campusloop.space/feeds', pos(1180, 1000));
    Object.assign(br.style, { left: pos(640, 40) + 'px', top: pos(400, 640) + 'px' });
    gsap.set(br, { opacity: 0 });
    ft(br, { opacity: 0, y: 500, rotationX: 20, scale: 0.9 }, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 1.0, ease: 'expo.out' }, 43.1);
    sfx('swoosh', 43.1);
    cap(43.0, 44.6, 'On the web at campusloop.space');
    outWords(wh, 44.45);
    ft(br, { x: 0, opacity: 1, scale: 1 }, { x: pos(-900, -600), opacity: 0, scale: 0.85, duration: 0.6, ease: 'power3.in' }, 44.5);

    const PD = phone(s, [{ key: 'd', src: 'm_download.jpg' }], pos([1370, 548], [540, 1250]));
    const S = pos(1.0, 1.22);
    gsap.set(PD.ph, { scale: S, opacity: 0 });
    ft(PD.ph, { opacity: 0, rotationY: -100, x: 500, scale: S * 0.8, rotationZ: -6 }, { opacity: 1, rotationY: 0, x: 0, scale: S, rotationZ: 0, duration: 1.2, ease: 'expo.out' }, 44.75);
    sfx('swoosh', 44.75, 1);
    const and = copy(s, { label: 'Android beta', tone: '', icon: 'phone', head: 'CampusLoop/*on Android.*', sub: 'Get the beta app. Free, with notifications.', cls: 'on-violet' });
    if (V) and.box.style.top = '150px';
    copyIn(and, 45.0);
    tap(PD, 153, 44 + 416, 46.3, 0.5);
    const dl = el('div', 'toast', `<div class="ck" style="position:relative;background:var(--violet);color:#fff"><span class="a" style="display:grid;place-items:center">${icon('download', 2.6)}</span><span class="b" style="position:absolute;inset:0;border-radius:50%;background:var(--mint);color:var(--ink);display:grid;place-items:center;opacity:0">${icon('check', 3)}</span></div><div style="flex:1;position:relative"><div class="t1">campusloop-beta.apk</div><div class="t2" style="position:absolute;left:0;top:0;opacity:0">Downloaded. Tap to install.</div><div class="prog"><i></i></div></div>`, PD.scr, { top: '700px', display: 'flex' });
    popIn(dl, 46.45, 0, true, 0.8);
    const bar = dl.querySelector('.prog i');
    gsap.set(bar, { scaleX: 0 });
    ft(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.15, ease: 'power1.inOut' }, 46.5);
    sfx('progress', 46.5);
    const ckB = dl.querySelector('.ck .b');
    ft(ckB, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(3)' }, 47.7);
    ft(dl.querySelector('.t1'), { opacity: 1 }, { opacity: 0, duration: 0.15 }, 47.7);
    ft(dl.querySelector('.t2'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 47.75);
    sfx('done', 47.7);
    curHide(PD, 47.0);
    copyOut(and, 48.45);
    ft(PD.ph, { y: 0, opacity: 1 }, { y: -2600, rotationZ: 6, duration: 0.55, ease: 'power3.in' }, 48.5);
    cap(45.0, 48.6, 'CampusLoop on Android.\nGet the beta app. Free, with notifications.');
  }
  // ---------- 13. End card 49-55 ----------
  {
    wipe('#fff', 48.75, '50%', '100%');
    const s = scene(48.85, DURATION + 1);
    const col = el('div', null, null, s, { position: 'absolute', left: '50%', top: pos('45%', '44%'), display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: W - 120 + 'px' });
    centerSet(col);
    const row = el('div', null, null, col, { display: 'flex', alignItems: 'center', gap: '26px', marginBottom: pos('44px', '64px') });
    const lm = el('div', null, null, row, { width: pos(170, 190) + 'px', height: pos(170, 190) + 'px', position: 'relative', margin: '-20px -24px -20px -30px' });
    el('img', null, null, lm, { width: '100%', height: '100%' }).src = 'assets/logo.svg';
    const wm = headline('CampusLoop', pos(104, 112), row);
    hideWords(wm);
    popIn(lm, 49.0, 0, false);
    ft(lm, { rotation: -140 }, { rotation: 0, duration: 0.8, ease: 'back.out(1.6)' }, 49.0);
    sfx('impact', 49.0, 0.9);
    inWords(wm, 49.15);
    const tag = fit(headline('Your campus./*Only your campus.*', pos(118, 112), col), W - 160);
    hideWords(tag);
    inWords(tag, 49.75, { stagger: 0.08 });
    const pills = el('div', null, null, col, { display: 'flex', flexDirection: pos('row', 'column'), alignItems: 'center', gap: pos('26px', '28px'), marginTop: pos('56px', '80px') });
    const url = el('div', 'stk violet', icon('globe') + '<span>campusloop.space</span>', pills, { position: 'relative', fontSize: pos(46, 56) + 'px' });
    const andP = el('div', 'stk ink', icon('phone') + '<span>Android beta out now</span>', pills, { position: 'relative', fontSize: pos(40, 46) + 'px' });
    popIn(url, 50.75, -2);
    popIn(andP, 51.25, 2);
    const tape = el('div', 'tape', null, s, { top: pos(950, 1700) + 'px' });
    const items = ['Home', 'Confessions', 'Events', 'Learn', 'Chat', 'You', 'Campus board', 'Secret Crush', 'Verified students only'];
    const run = el('div', 'run', [...items, ...items, ...items].map((x) => `<span>${x}</span><b></b>`).join(''), tape);
    gsap.set(tape, { yPercent: 200 });
    ft(tape, { yPercent: 200 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, 49.5);
    ft(run, { x: 0 }, { x: -1400, duration: DURATION - 49.5, ease: 'none' }, 49.5);
    const fade = el('div', 'layer', null, stage, { background: '#fff', opacity: 0 });
    ft(fade, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.in' }, DURATION - 0.6);
    cap(49.0, DURATION - 0.3, 'CampusLoop\nYour campus. Only your campus.\ncampusloop.space · Android beta out now');
  }
}

window.FILM = { duration: DURATION, W, H, cues: CUES, caps: CAPS };
window.seek = (t) => { tl.seek(t, false); };
window.__ready = (async () => {
  await document.fonts.load('800 40px "Bricolage Grotesque"');
  await document.fonts.load('500 40px Figtree');
  await document.fonts.ready;
  build();
  await waitAssets();
  tl.seek(0, false);
  return true;
})();
