'use strict';
/* ================= FIELD GEOMETRY ================= */
const BASES = [[240, 244], [318, 170], [240, 96], [162, 170], [240, 244]];
const MOUND = [240, 172], PLATE = [240, 240], CATCH = [240, 258];
const FIELDERS = [[322, 156], [274, 112], [206, 112], [158, 156], [118, 66], [240, 48], [362, 66]];
function pathPoint(t) {
  const i = Math.min(3, Math.floor(t)), f = Math.min(1, t - i);
  const a = BASES[i], b = BASES[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
const crowd = Array.from({ length: 3 * 96 }, () => pick(['#ff5c5c', '#ffd23f', '#3fe0ff', '#ff6bf0', '#ffffff', '#ff9b3f', '#5dff6a']));

/* ================= STATE ================= */
const blankStats = () => Object.fromEntries(Object.keys(GENS).map(k => [k, [0, 0]]));
const S = {
  mode: 'menu', prev: null, teams: 2, innings: 3, level: 2, speed: 'normal',
  ops: Object.fromEntries(Object.keys(GENS).map(k => [k, true])), names: ['TEAM A', 'TEAM B'],
  inning: 1, half: 0, outs: 0, strikes: 0, runs: [0, 0], line: [[], []],
  runners: [], problem: null, elapsed: 0, ptime: 30, wait: 0, after: null,
  ball: null, parts: [], banner: null, cheer: 0, canCont: 0, clock: 0,
  stats: [blankStats(), blankStats()],
  hiRuns: 0, swing: 0
};
try { S.hiRuns = Number(localStorage.getItem('palabras-park-hi')) || 0; } catch (e) {}
const batting = () => S.half;

/* ================= UI ================= */
function renderBoard() {
  $('nA').textContent = S.names[0];
  $('nB').textContent = S.teams === 2 ? S.names[1] : 'CPU';
  $('rA').textContent = S.runs[0];
  $('rB').textContent = S.teams === 2 ? S.runs[1] : '–';
  $('tA').classList.toggle('up', S.mode !== 'menu' && S.half === 0);
  $('tB').classList.toggle('up', S.mode !== 'menu' && S.half === 1);
  $('inn').textContent = (S.half === 0 ? '▲' : '▼') + S.inning;
  [...$('sd').children].forEach((d, i) => d.classList.toggle('on', i < S.strikes));
  [...$('od').children].forEach((d, i) => d.classList.toggle('on', i < S.outs));
  $('hiRuns').textContent = S.hiRuns;
}
const btns = [...document.querySelectorAll('.ab')];
function setAnswers(vals) {
  btns.forEach((b, i) => { b.querySelector('.v').textContent = vals ? vals[i] : '—'; b.disabled = !vals; });
}
function show(id) {
  ['menu', 'explain', 'pause', 'over'].forEach(s => $(s).hidden = s !== id);
  $('overlay').classList.add('show'); $('overlay').scrollTop = 0;
}
const hideOverlay = () => $('overlay').classList.remove('show');
const zoneEls = [...$('zones').querySelectorAll('span')];
function setClock(f) {
  $('marker').style.left = `calc(${Math.min(1, f) * 100}% - 2px)`;
  const z = f < 0.25 ? 0 : f < 0.45 ? 1 : f < 0.7 ? 2 : 3;
  zoneEls.forEach((e, i) => e.classList.toggle('now', i === z && S.mode === 'pitch'));
}
function banner(text, sub, col = '#ffd23f', t = 1.8) { S.banner = { text, sub, col, t, max: t }; }

/* ================= GAME FLOW ================= */
function pitchTime(p) {
  const base = { chill: 45, normal: 26, turbo: 15 }[S.speed];
  return base * (p.weight || 1);
}
function startGame() {
  S.names = [($('inA').value.trim() || 'TEAM A').toUpperCase(), ($('inB').value.trim() || 'TEAM B').toUpperCase()];
  if (S.teams === 1) S.names[0] = ($('inA').value.trim() || 'YOU').toUpperCase();
  Object.assign(S, { inning: 1, half: 0, outs: 0, strikes: 0, runs: [0, 0], line: [Array(S.innings).fill(null), Array(S.innings).fill(null)], runners: [], ball: null, parts: [],
    stats: [blankStats(), blankStats()] });
  S.line[0][0] = 0;
  if (document.activeElement) document.activeElement.blur();
  hideOverlay();
  S.mode = 'anim'; S.wait = 1.8; S.after = startPitch;
  banner('PLAY BALL!', S.names[0] + ' UP TO BAT', TCOL[0], 1.8);
  $('prob').innerHTML = `<span class="ready">${esc(S.names[0])} UP TO BAT</span>`;
  sfx.charge(); renderBoard();
}
function startPitch() {
  const cats = Object.keys(S.ops).filter(k => S.ops[k]);
  const cat = pick(cats);
  S.problem = GENS[cat]();
  S.mode = 'windup'; S.wait = 1.0; S.ball = null; S.swing = 0;
  $('prob').innerHTML = `<span class="ready">${esc(S.names[batting()] || 'CPU')} BATTING<br>HERE COMES THE PITCH...</span>`;
  setAnswers(null); setClock(0); renderBoard();
}
function throwPitch() {
  S.mode = 'pitch'; S.elapsed = 0; S.ptime = pitchTime(S.problem);
  $('prob').innerHTML = S.problem.html;
  setAnswers(S.problem.choices);
  sfx.pitch();
  if (ttsOn && S.problem.say) setTimeout(() => speak(S.problem.say), 250);
}
function stat(correct) {
  const s = S.stats[batting()][S.problem.cat]; s[1]++; if (correct) s[0]++;
}
function answer(i) {
  if (S.mode !== 'pitch') return;
  const v = S.problem.choices[i];
  setAnswers(null);
  if (v === S.problem.ans) hit(S.elapsed / S.ptime);
  else wrong(v);
}
function hit(f) {
  stat(true);
  const bases = f < 0.25 ? 4 : f < 0.45 ? 3 : f < 0.7 ? 2 : 1;
  const name = ['', 'SINGLE!', 'DOUBLE!', 'TRIPLE!', 'HOME RUN!'][bases];
  const target = bases === 4 ? [rnd(110, 370), -20] : bases === 3 ? pick([[56, 96], [424, 96]]) : bases === 2 ? pick([[162, 70], [318, 70]]) : pick([[176, 122], [304, 122], [240, 128]]);
  const [bx, by] = S.ballPos || PLATE;
  S.ball = { x0: bx, y0: by, x1: target[0], y1: target[1], t: 0, dur: bases === 4 ? 1.3 : 0.9, h: bases === 4 ? 70 : 40 + bases * 8, hr: bases === 4 };
  S.swing = 0.3;
  sfx.crack();
  setTimeout(() => bases === 4 ? sfx.charge() : sfx.hit(), 150);
  for (const r of S.runners) r.target = r.pos + bases;
  S.runners.push({ pos: 0, target: bases, team: batting() });
  S.strikes = 0; S.cheer = bases === 4 ? 3 : 1.2;
  banner(name, '', ['', '#5dff6a', '#ffd23f', '#ff9b3f', '#ff6bf0'][bases], 2);
  $('prob').innerHTML = `<span class="ready" style="color:#5dff6a">CORRECT! ${Math.round(S.elapsed)} SECONDS</span>`;
  S.mode = 'anim'; S.wait = 1.4; S.after = afterHit;
  renderBoard();
}
function afterHit() {
  if (S.teams === 2 && S.half === 1 && S.inning >= S.innings && S.runs[1] > S.runs[0]) {
    S.mode = 'anim'; S.wait = 2.4; S.after = gameOver; banner('WALK-OFF!', S.names[1] + ' WINS', TCOL[1], 2.4); sfx.charge(); return;
  }
  startPitch();
}
function wrong(v) {
  stat(false);
  S.outs++; S.strikes = 0;
  const f = pick(FIELDERS.slice(0, 4));
  S.ball = { x0: PLATE[0], y0: PLATE[1], x1: f[0], y1: f[1] + 6, t: 0, dur: 1.1, h: 90, hr: false };
  S.swing = 0.3; sfx.crack(); setTimeout(sfx.out, 500);
  banner(pick(['POP OUT!', 'CAUGHT!', 'OUT!']), '', '#ff5c5c', 1.4);
  S.mode = 'anim'; S.wait = 1.5; S.after = () => showExplain('wrong', v);
  renderBoard();
}
function strike() {
  stat(false);
  S.strikes++;
  let k = false;
  if (S.strikes >= 3) { S.outs++; S.strikes = 0; k = true; }
  S.ball = { x0: PLATE[0], y0: PLATE[1], x1: CATCH[0], y1: CATCH[1], t: 0, dur: 0.25, h: 0, hr: false };
  setAnswers(null); sfx.strike(); if (k) setTimeout(sfx.out, 350);
  banner(k ? 'STRIKE 3!' : 'STRIKE ' + S.strikes + '!', k ? "YOU'RE OUT!" : 'TOO SLOW', '#ff5c5c', 1.4);
  S.mode = 'anim'; S.wait = 1.4; S.after = () => showExplain(k ? 'k' : 'slow');
  renderBoard();
}
function showExplain(kind, hitV) {
  S.mode = 'explain';
  const p = S.problem;
  const title = kind === 'wrong' ? 'OUT!' : kind === 'k' ? 'STRIKE 3! OUT!' : `STRIKE ${S.strikes}!`;
  let html = `<h2 class="big bad">${title}</h2>`;
  if (kind === 'wrong') html += `<p class="say">You picked <span class="ansv" style="color:var(--r)">${hitV}</span></p>`;
  else html += `<p class="say">The pitch clock ran out.</p>`;
  html += `<p class="say">The answer is <span class="ansv">${p.ans}</span></p>`;
  if (kind === 'wrong' && p.why.has(hitV)) html += `<p class="why">💡 ${p.why.get(hitV)}</p>`;
  html += p.explain();
  html += `<p class="say" style="color:#9a9a9a">${S.outs} out${S.outs === 1 ? '' : 's'} · ${S.strikes} strike${S.strikes === 1 ? '' : 's'}</p>`;
  $('exbody').innerHTML = html;
  $('cont').textContent = S.outs >= 3 ? 'END OF INNING' : 'NEXT PITCH';
  show('explain');
  S.canCont = performance.now() + 700;
}
function cont() {
  if (S.mode !== 'explain' || performance.now() < S.canCont) return;
  if (document.activeElement) document.activeElement.blur();
  hideOverlay();
  if (S.outs >= 3) {
    S.mode = 'anim'; S.wait = 1.8; S.after = endHalf;
    banner('3 OUTS', 'SIDE RETIRED', '#ff5c5c', 1.8);
    $('prob').innerHTML = '<span class="ready">SIDE RETIRED</span>';
  } else startPitch();
}
function endHalf() {
  S.outs = 0; S.strikes = 0; S.runners = []; S.ball = null;
  let over = false;
  if (S.teams === 1) { if (S.inning >= S.innings) over = true; else S.inning++; }
  else if (S.half === 0) {
    if (S.inning >= S.innings && S.runs[1] > S.runs[0]) over = true; else S.half = 1;
  } else {
    if (S.inning >= S.innings) over = true; else { S.inning++; S.half = 0; }
  }
  if (over) return gameOver();
  const t = batting();
  if (S.line[t][S.inning - 1] == null) S.line[t][S.inning - 1] = 0;
  renderBoard();
  S.mode = 'anim'; S.wait = 1.8; S.after = startPitch;
  banner((S.half === 0 ? 'TOP ' : 'BOTTOM ') + S.inning, S.names[t] + ' UP TO BAT', TCOL[t], 1.8);
  $('prob').innerHTML = `<span class="ready">${esc(S.names[t])} UP TO BAT</span>`;
}
function scoreRun(team) {
  S.runs[team]++;
  S.line[team][S.inning - 1] = (S.line[team][S.inning - 1] || 0) + 1;
  sfx.run(); S.cheer = Math.max(S.cheer, 1);
  const [x, y] = BASES[0];
  burst(x, y, TCOL[team], 18);
  renderBoard();
}
function burst(x, y, col, n) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 130; S.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5 + Math.random() * 0.7, col, s: pick([2, 3]) }); }
}
function gameOver() {
  S.mode = 'over'; setAnswers(null);
  const names = CAT_NAMES, tips = CAT_TIPS;
  let head = '<tr><th></th>', rows = '';
  for (let i = 1; i <= S.innings; i++) head += `<th>${i}</th>`;
  head += '<th>R</th></tr>';
  for (let t = 0; t < S.teams; t++) {
    rows += `<tr><td style="color:${TCOL[t]}">${esc(S.names[t])}</td>`;
    for (let i = 0; i < S.innings; i++) rows += `<td>${S.line[t][i] == null ? 'X' : S.line[t][i]}</td>`;
    rows += `<td class="r">${S.runs[t]}</td></tr>`;
  }
  let title, html = `<table class="line">${head}${rows}</table>`;
  if (S.teams === 2) {
    title = S.runs[0] === S.runs[1] ? 'TIE<br><span>GAME</span>' : `${esc(S.names[S.runs[0] > S.runs[1] ? 0 : 1])}<br><span>WINS!</span>`;
  } else {
    title = `${S.runs[0]} RUN${S.runs[0] === 1 ? '' : 'S'}<br><span>FINAL</span>`;
    if (S.runs[0] > S.hiRuns) { S.hiRuns = S.runs[0]; try { localStorage.setItem('palabras-park-hi', String(S.hiRuns)); } catch (e) {} html += '<p class="big good">NEW RECORD!</p>'; }
  }
  const tot = blankStats();
  for (let t = 0; t < S.teams; t++) for (const k in tot) { tot[k][0] += S.stats[t][k][0]; tot[k][1] += S.stats[t][k][1]; }
  let st = '', weakest = null, worst = 2;
  for (const k of Object.keys(CAT_NAMES)) {
    const [c, t] = tot[k]; if (!t) continue;
    st += `${names[k]}: <b>${c}/${t}</b> correct<br>`;
    if (c / t < worst) { worst = c / t; weakest = k; }
  }
  if (st) html += `<p class="stats">${st}</p>`;
  if (weakest && worst < 0.75) html += `<p class="tip">${tips[weakest]}</p>`;
  html += `<p class="big" style="font-size:12px;margin-top:18px">MODEL PARAGRAPH FOR YOUR TEST</p><div class="model">Me llamo Alex. Soy bastante extrovertido y muy simpático, pero también soy un poco tímido en clase. Según mi familia, soy cariñoso y generoso. No soy aburrido. Mi amiga Sofía es muy habladora y atlética. ¡Ella no es perezosa y yo tampoco! ${sayBtn('Me llamo Alex. Soy bastante extrovertido y muy simpático, pero también soy un poco tímido en clase. Según mi familia, soy cariñoso y generoso. No soy aburrido. Mi amiga Sofía es muy habladora y atlética. Ella no es perezosa y yo tampoco.')}<p class="en">My name is Alex. I'm pretty outgoing and very nice, but I'm also a little shy in class. According to my family, I'm affectionate and generous. I'm not boring. My friend Sofía is very talkative and athletic. She isn't lazy and neither am I!</p></div>`;
  $('overTitle').innerHTML = title;
  $('overbody').innerHTML = html;
  $('prob').innerHTML = '<span class="ready">GAME OVER</span>';
  renderBoard(); show('over');
}
function pauseToggle() {
  if (S.mode === 'pitch' || S.mode === 'windup' || S.mode === 'anim') { S.prev = S.mode; S.mode = 'paused'; show('pause'); }
  else if (S.mode === 'paused') { S.mode = S.prev; hideOverlay(); }
}
function toMenu() {
  S.mode = 'menu'; S.runners = []; S.ball = null; setAnswers(null); setClock(0);
  $('prob').innerHTML = '<span class="ready">PLAY BALL!</span>'; renderBoard(); show('menu');
}

/* ================= UPDATE ================= */
function update(dt) {
  S.clock += dt;
  if (S.cheer > 0) S.cheer -= dt;
  if (S.swing > 0) S.swing -= dt;
  for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  if (S.mode === 'paused' || S.mode === 'menu' || S.mode === 'over' || S.mode === 'explain') return;
  if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }

  if (S.ball) {
    const b = S.ball;
    b.t = Math.min(1, b.t + dt / b.dur);
    if (b.hr && b.t >= 1 && !b.done) { b.done = true; for (let i = 0; i < 4; i++) setTimeout(() => burst(rnd(80, 400), rnd(20, 70), pick(['#ff6bf0', '#ffd23f', '#3fe0ff', '#5dff6a']), 30), i * 250); }
  }
  let moving = false;
  for (const r of S.runners) {
    if (r.pos < r.target) { r.pos = Math.min(r.target, r.pos + 2.6 * dt); moving = true; }
    if (r.pos >= 4 && !r.scored) { r.scored = true; scoreRun(r.team); }
  }
  S.runners = S.runners.filter(r => !r.scored);

  if (S.mode === 'windup') {
    S.wait -= dt; if (S.wait <= 0) throwPitch();
  } else if (S.mode === 'pitch') {
    S.elapsed += dt;
    const f = S.elapsed / S.ptime;
    setClock(f);
    S.ballPos = [MOUND[0], MOUND[1] + (PLATE[1] - MOUND[1]) * Math.min(1, f)];
    if (f >= 1) strike();
  } else if (S.mode === 'anim') {
    S.wait -= dt;
    if (S.wait <= 0 && !moving) { const f = S.after; S.after = null; f && f(); }
  }
}

/* ================= DRAW ================= */
const PERSON = ['.##.', '.##.', '####', '#..#', '.##.', '#..#'];
function person(x, y, col, skin = '#f1c27d') {
  x = Math.round(x - 4); y = Math.round(y - 12);
  for (let r = 0; r < PERSON.length; r++) for (let c = 0; c < 4; c++) if (PERSON[r][c] === '#') { ctx.fillStyle = r < 2 ? skin : col; ctx.fillRect(x + c * 2, y + r * 2, 2, 2); }
}
function poly(pts, col) { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
function draw() {
  for (let y = 0; y < H; y += 12) { ctx.fillStyle = (y / 12) % 2 ? '#1f7a2e' : '#248a37'; ctx.fillRect(0, y, W, 12); }
  // crowd + wall
  ctx.fillStyle = '#0b0b1a'; ctx.fillRect(0, 0, W, 24);
  const jump = S.cheer > 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 96; c++) {
    const up = jump && ((c + r + Math.floor(S.clock * 10)) % 3 === 0) ? -2 : 0;
    ctx.fillStyle = crowd[r * 96 + c]; ctx.fillRect(c * 5 + 1, 3 + r * 6 + up, 3, 3);
  }
  ctx.fillStyle = '#0b3d16'; ctx.fillRect(0, 24, W, 6);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 24, W, 2);
  // foul lines
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(240, 244); ctx.lineTo(0, 4); ctx.moveTo(240, 244); ctx.lineTo(480, 4); ctx.stroke();
  // infield
  poly([[240, 266], [348, 170], [240, 66], [132, 170]], '#b07a40');
  poly([[240, 228], [294, 172], [240, 118], [186, 172]], '#248a37');
  ctx.fillStyle = '#b07a40'; ctx.beginPath(); ctx.arc(MOUND[0], MOUND[1], 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i < 4; i++) ctx.fillRect(BASES[i][0] - 4, BASES[i][1] - 4, 8, 8);
  poly([[234, 240], [246, 240], [246, 245], [240, 250], [234, 245]], '#ffffff');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(MOUND[0] - 4, MOUND[1] - 1, 8, 2);

  const active = S.mode !== 'menu';
  const defCol = S.teams === 2 ? TCOL[1 - S.half] : CPU;
  const offCol = S.teams === 2 ? TCOL[S.half] : TCOL[0];
  if (active) {
    for (const f of FIELDERS) person(f[0], f[1], defCol);
    person(MOUND[0], MOUND[1] - 2, defCol);
    person(CATCH[0], CATCH[1] + 8, defCol);
    // batter
    const bx = 224, by = 244;
    person(bx, by, offCol);
    ctx.fillStyle = '#c98b4a';
    if (S.swing > 0) ctx.fillRect(bx + 2, by - 7, 16, 3);
    else ctx.fillRect(bx - 4, by - 20, 3, 12);
    for (const r of S.runners) { const [x, y] = pathPoint(r.pos); person(x, y + 2, TCOL[r.team]); }
  }
  // ball
  let bp = null, hgt = 0;
  if (S.mode === 'windup') bp = [MOUND[0] + 5, MOUND[1] - 10];
  else if (S.mode === 'pitch' || (S.mode === 'paused' && S.prev === 'pitch')) bp = S.ballPos;
  else if (S.ball) {
    const b = S.ball, e = b.hr ? b.t : 1 - Math.pow(1 - b.t, 2);
    bp = [b.x0 + (b.x1 - b.x0) * e, b.y0 + (b.y1 - b.y0) * e]; hgt = Math.sin(Math.PI * b.t) * b.h;
  }
  if (bp) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(bp[0] - 2, bp[1] - 1, 5, 3);
    const s = 3 + hgt / 25;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bp[0] - s / 2, bp[1] - hgt - s / 2 - 2, s, s);
  }
  for (const p of S.parts) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s); }
  ctx.globalAlpha = 1;
  // banner
  if (S.banner && S.mode !== 'menu') {
    const b = S.banner;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 118, W, b.sub ? 58 : 40);
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillStyle = '#000'; ctx.fillText(b.text, W / 2 + 3, 141);
    ctx.fillStyle = Math.floor(S.clock * 6) % 2 ? b.col : '#ffffff'; ctx.fillText(b.text, W / 2, 138);
    if (b.sub) { ctx.font = '9px "Press Start 2P", monospace'; ctx.fillStyle = '#ffffff'; ctx.fillText(b.sub, W / 2, 163); }
  }
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ================= INPUT ================= */
btns.forEach((b, i) => b.addEventListener('click', () => answer(i)));
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter' && S.mode === 'menu') startGame(); return; }
  const k = e.key;
  if (S.mode === 'pitch' && ['1', '2', '3', '4'].includes(k)) { e.preventDefault(); answer(Number(k) - 1); }
  if ((k === 'p' || k === 'P' || k === 'Escape') && S.mode !== 'menu' && S.mode !== 'over' && S.mode !== 'explain') { e.preventDefault(); pauseToggle(); }
  if (k === 'm' || k === 'M') toggleMute();
  if (S.mode === 'explain' && (k === 'Enter' || k === ' ') && !e.repeat) { e.preventDefault(); cont(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && ['pitch', 'windup', 'anim'].includes(S.mode)) pauseToggle(); });

function toggleMute() { muted = !muted; $('bm').textContent = muted ? 'SOUND OFF' : 'SOUND ON'; }
$('bm').addEventListener('click', toggleMute);
$('bp').addEventListener('click', pauseToggle);
$('start').addEventListener('click', startGame);
$('cont').addEventListener('click', cont);
$('resume').addEventListener('click', pauseToggle);
$('quit').addEventListener('click', toMenu);
$('again').addEventListener('click', startGame);
$('tomenu').addEventListener('click', toMenu);

document.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.op, on = !S.ops[k];
  if (!on && Object.values(S.ops).filter(Boolean).length === 1) return;
  S.ops[k] = on; b.setAttribute('aria-pressed', String(on)); sfx.click();
}));
function radio(attr, apply) {
  const group = document.querySelectorAll(`[data-${attr}]`);
  group.forEach(b => b.addEventListener('click', () => {
    group.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    apply(b.dataset[attr]); sfx.click();
  }));
}
radio('speed', v => { S.speed = v; });
radio('tts', v => { ttsOn = v === '1'; });
radio('lv', v => { S.level = Number(v); });
radio('inn', v => { S.innings = Number(v); });
radio('mode', v => {
  S.teams = Number(v);
  $('inB').hidden = S.teams === 1;
  if (S.teams === 1 && $('inA').value === 'TEAM A') $('inA').value = 'YOU';
  if (S.teams === 2 && $('inA').value === 'YOU') $('inA').value = 'TEAM A';
  renderBoard();
});
renderBoard();
