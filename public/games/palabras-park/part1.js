'use strict';
const W = 480, H = 270;
const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands'];
const PSH = ['O', 'T', 'H', 'Th', 'TTh', 'HTh'];
const PCOL = ['#ff5c5c', '#ffd23f', '#5dff6a', '#3fe0ff', '#ff6bf0', '#ffffff'];
const TCOL = ['#ffd23f', '#3fe0ff'], CPU = '#ff5c5c';

const $ = id => document.getElementById(id);
const cvs = $('c'), ctx = cvs.getContext('2d');
ctx.setTransform(2, 0, 0, 2, 0, 0);

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => n.toLocaleString('en-US');
const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const nd = n => String(n).length;
const cap = s => s[0].toUpperCase() + s.slice(1);
const single = p => PLACE[p].replace(/s$/, '');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ================= SPANISH VOCAB ================= */
const esc2 = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// [masc, fem, english, class list?]
const ADJ = [
  ['serio', 'seria', 'serious', 1], ['inteligente', 'inteligente', 'smart / intelligent', 1], ['cómico', 'cómica', 'funny / comical', 1],
  ['hablador', 'habladora', 'talkative', 1], ['tímido', 'tímida', 'shy', 1], ['cariñoso', 'cariñosa', 'affectionate / loving', 1],
  ['generoso', 'generosa', 'generous', 1], ['creativo', 'creativa', 'creative', 1], ['extrovertido', 'extrovertida', 'outgoing / extroverted', 1],
  ['atlético', 'atlética', 'athletic', 1], ['introvertido', 'introvertida', 'introverted', 1], ['activo', 'activa', 'active', 1],
  ['simpático', 'simpática', 'nice / friendly', 1], ['aburrido', 'aburrida', 'boring', 1],
  ['gracioso', 'graciosa', 'funny', 0], ['perezoso', 'perezosa', 'lazy', 0], ['trabajador', 'trabajadora', 'hardworking', 0],
  ['estudioso', 'estudiosa', 'studious', 0], ['ordenado', 'ordenada', 'neat / organized', 0], ['desordenado', 'desordenada', 'messy', 0],
  ['paciente', 'paciente', 'patient', 0], ['impaciente', 'impaciente', 'impatient', 0], ['artístico', 'artística', 'artistic', 0],
  ['deportista', 'deportista', 'sporty / likes sports', 0], ['reservado', 'reservada', 'reserved / quiet', 0], ['sociable', 'sociable', 'sociable', 0],
  ['atrevido', 'atrevida', 'daring / bold', 0], ['talentoso', 'talentosa', 'talented', 0], ['divertido', 'divertida', 'fun', 0],
  ['amable', 'amable', 'kind', 0], ['responsable', 'responsable', 'responsible', 0]
];
const PHR = [
  ['un poco', 'a little', 1], ['muy', 'very', 1], ['bastante', 'quite / pretty / rather', 1], ['muy bien', 'very well', 1],
  ['a mí tampoco', 'me neither', 1], ['a mí también', 'me too', 0], ['pero', 'but', 0], ['también', 'also / too', 0],
  ['según mi familia', 'according to my family', 0], ['¿Cómo eres?', 'What are you like?', 0], ['¿Cómo es?', 'What is he / she like?', 0],
  ['soy', 'I am', 0], ['no soy', "I'm not", 0], ['eres', 'you are', 0], ['es', 'he / she is', 0]
];
const OPP = [['extrovertido', 'introvertido'], ['hablador', 'reservado'], ['serio', 'cómico'], ['activo', 'perezoso'], ['trabajador', 'perezoso'],
  ['ordenado', 'desordenado'], ['paciente', 'impaciente'], ['aburrido', 'divertido'], ['extrovertido', 'tímido'], ['serio', 'gracioso']];
const NOTES = {
  'simpático': '"Simpático" looks like "sympathetic" but it means NICE or FRIENDLY.',
  'aburrido': 'With "ser" (es aburrido) it means boring. With "estar" (está aburrido) it means bored.',
  'inteligente': 'Only one L in Spanish: inteligente.',
  'cariñoso': 'Don\'t forget the ñ: cariñoso.',
  'hablador': 'Words ending in -dor add -a for a girl: hablador → habladora.',
  'trabajador': 'Words ending in -dor add -a for a girl: trabajador → trabajadora.',
  'a mí tampoco': 'Use "A mí tampoco" to agree with something negative (No me gusta... → A mí tampoco). The "A" is needed. "Mi tampoco" is a common mistake.',
  'bastante': '"Bastante" means quite / pretty. Don\'t put "muy" in front of it.'
};
const lv = () => S.level;
const pool = () => ADJ.filter(a => a[3] || lv() >= 2);
const ppool = () => PHR.filter(p => p[2] || lv() >= 2);
const invariant = a => a[0] === a[1];
const TAGS = {
  meaning: ['WHAT DOES IT MEAN?', 'var(--g)'], sayit: ['SAY IT IN SPANISH', 'var(--y)'], agree: ['BOY OR GIRL?', 'var(--c)'],
  opp: ['OPPOSITES', 'var(--o)'], spell: ['SPELLING & ACCENTS', 'var(--m)'], phrase: ['PHRASES', 'var(--r)']
};
const sayBtn = t => `<button class="saybtn" data-say="${esc2(t)}" aria-label="Hear it">🔊</button>`;
function choicesFrom(ans, smart, gen) {
  const set = new Set([ans]), out = [], why = new Map();
  for (const [s, w] of smart) { if (out.length >= 3) break; if (s && !set.has(s)) { set.add(s); out.push(s); if (w) why.set(s, w); } }
  let g = 0;
  while (out.length < 3 && g++ < 300) { const s = gen(); if (s && !set.has(s)) { set.add(s); out.push(s); } }
  return { choices: shuffle([ans, ...out]), why };
}
function wordCard(a) {
  const forms = invariant(a) ? `<b>${a[0]}</b> (same for boys and girls)` : `<b>${a[0]}</b> (boy) · <b>${a[1]}</b> (girl)`;
  const ex = invariant(a) ? `Mi amigo es ${a[0]}. Mi amiga es ${a[1]}.` : `Mi amigo es muy ${a[0]}. Mi amiga es muy ${a[1]}.`;
  return `<div class="wcard"><p class="wforms">${forms} ${sayBtn(a[0] === a[1] ? a[0] : a[0] + ', ' + a[1])}</p><p class="wen">= ${a[2]}</p>
    <p class="wex">${ex} ${sayBtn(ex)}</p>${NOTES[a[0]] ? `<p class="why">💡 ${NOTES[a[0]]}</p>` : ''}</div>`;
}
function phraseCard(p) {
  return `<div class="wcard"><p class="wforms"><b>${p[0]}</b> ${sayBtn(p[0])}</p><p class="wen">= ${p[1]}</p>${NOTES[p[0]] ? `<p class="why">💡 ${NOTES[p[0]]}</p>` : ''}</div>`;
}
const RULE = '<p class="rulecard">Describing a girl? Change -o to -a (tímido → tímida). Words ending in -e or -ista stay the same (inteligente, deportista). -dor adds -a (hablador → habladora).</p>';
function mk(cat, text, ans, smart, gen, explain, say = null, weight = 1) {
  const { choices, why } = choicesFrom(ans, smart, gen);
  return { cat, ans, choices, why, weight, explain, say,
    html: `<div class="wpbox"><span class="qtag" style="--tc:${TAGS[cat][1]}">${TAGS[cat][0]}</span><p class="wp">${text} ${say ? sayBtn(say) : ''}</p></div>` };
}
const gform = (a, girl) => girl ? a[1] : a[0];
const SUBJ = [
  [false, 'Mi amigo Diego es'], [true, 'Mi amiga Sofía es'], [false, 'Mi hermano es'], [true, 'Mi hermana es'],
  [false, 'El chico es'], [true, 'La chica es'], [false, 'Mi primo Mateo es'], [true, 'Mi profesora es'], [false, 'Mi papá es'], [true, 'Mi mamá es']
];
const QUAL = [['muy', 'very'], ['bastante', 'pretty'], ['un poco', 'a little'], ['', '']];

function genMeaning() {
  if (Math.random() < 0.25) {
    const p = pick(ppool()), others = PHR.filter(x => x !== p).map(x => x[1]);
    return mk('meaning', `What does <b class="n">${p[0]}</b> mean?`, p[1], shuffle(others).slice(0, 3).map(x => [x]), () => pick(others), () => phraseCard(p), p[0]);
  }
  const a = pick(pool()), girl = Math.random() < 0.5, w = gform(a, girl);
  const others = ADJ.filter(x => x !== a && x[2] !== a[2]).map(x => x[2]);
  const smart = [];
  if (a[0] === 'simpático') smart.push(['sympathetic', '"Simpático" is a false friend. It means nice or friendly.']);
  if (a[0] === 'aburrido') smart.push(['bored', 'Close! With "es" (ser) it means boring. "Está aburrido" would mean bored.']);
  if (a[0] === 'cómico' || a[0] === 'gracioso') smart.push(['serious', 'That\'s the opposite. Serio = serious.']);
  shuffle(others).slice(0, 3).forEach(x => smart.push([x]));
  return mk('meaning', `What does <b class="n">${w}</b> mean?`, a[2], smart, () => pick(others), () => wordCard(a), w);
}
function genSayIt() {
  if (Math.random() < 0.25) {
    const p = pick(ppool()), others = PHR.filter(x => x !== p).map(x => x[0]);
    const smart = [];
    if (p[0] === 'a mí tampoco') smart.push(['mi tampoco', 'It needs the "A": a mí tampoco.'], ['a mí también', 'También = too. That means "me too".']);
    if (p[0] === 'bastante') smart.push(['muy bastante', 'Don\'t use "muy" with "bastante". Bastante alone means quite / pretty.']);
    shuffle(others).slice(0, 3).forEach(x => smart.push([x]));
    return mk('sayit', `How do you say <b class="n">"${p[1]}"</b> in Spanish?`, p[0], smart, () => pick(others), () => phraseCard(p));
  }
  const a = pick(pool()), girl = invariant(a) ? Math.random() < 0.5 : Math.random() < 0.5;
  const who = girl ? 'a girl' : 'a boy', ans = gform(a, girl);
  const smart = [];
  if (!invariant(a)) smart.push([gform(a, !girl), `That's the form for ${girl ? 'a boy' : 'a girl'}. For ${who}, use ${ans}.`]);
  if (a[0] === 'inteligente') smart.push(['intelligente', 'Only one L in Spanish: inteligente.']);
  const others = ADJ.filter(x => x !== a && x[2] !== a[2]);
  shuffle(others).slice(0, 3).forEach(x => smart.push([gform(x, girl), `That means "${x[2]}".`]));
  return mk('sayit', `How do you say <b class="n">"${a[2].split(' / ')[0]}"</b> to describe ${who}?`, ans, smart, () => gform(pick(others), girl), () => wordCard(a) + RULE);
}
function genAgree() {
  let a; do { a = pick(pool()); } while (invariant(a) && Math.random() < 0.6);
  const [girl, subj] = pick(SUBJ), q = pick(QUAL);
  const ans = gform(a, girl);
  const sentence = `${subj} ${q[0] ? q[0] + ' ' : ''}___.`;
  const eng = `(${q[1] ? q[1] + ' ' : ''}${a[2].split(' / ')[0]})`;
  const smart = [];
  if (invariant(a)) {
    const wrong = a[0].replace(/e$/, girl ? 'a' : 'o').replace(/ista$/, girl ? 'ista' : 'isto');
    smart.push([wrong, `${a[0]} doesn't change. Words ending in -e or -ista are the same for boys and girls.`]);
  } else smart.push([gform(a, !girl), `${subj.split(' ').slice(0, -1).join(' ')} is ${girl ? 'a girl' : 'a boy'}, so use the ${girl ? '-a' : '-o'} form: ${ans}.`]);
  smart.push([ans + 's', 'That\'s plural (for more than one person). Here it\'s just one person.']);
  const others = ADJ.filter(x => x !== a && x[2] !== a[2]);
  shuffle(others).slice(0, 2).forEach(x => smart.push([gform(x, girl), `That means "${x[2]}", not "${a[2]}".`]));
  return mk('agree', `${sentence.replace('___', '<span class="blank">___</span>')} <i>${eng}</i>`, ans, smart, () => gform(pick(others), girl),
    () => `<p class="say">${subj} ${q[0] ? q[0] + ' ' : ''}<b>${ans}</b>. ${sayBtn(`${subj} ${q[0]} ${ans}`)}</p>` + wordCard(a) + RULE, null, 1.1);
}
function genOpp() {
  const prs = OPP.filter(([x, y]) => [x, y].every(w => pool().some(a => a[0] === w)));
  const [x, y] = pick(prs.length ? prs : OPP), flip = Math.random() < 0.5;
  const q = flip ? y : x, ans = flip ? x : y;
  const A = w => ADJ.find(a => a[0] === w);
  const others = ADJ.filter(a => a[0] !== ans && a[0] !== q && !OPP.some(p => (p[0] === q && p[1] === a[0]) || (p[1] === q && p[0] === a[0])));
  return mk('opp', `What is the OPPOSITE of <b class="n">${q}</b>? <i>(${A(q)[2]})</i>`, ans, shuffle(others).slice(0, 3).map(a => [a[0], `${a[0]} means "${a[2]}".`]),
    () => pick(others)[0], () => `<p class="say"><b>${q}</b> (${A(q)[2]}) ↔ <b>${ans}</b> (${A(ans)[2]})</p>` + wordCard(A(ans)), q);
}
function misspell(w) {
  const out = new Set();
  const strip = w.normalize('NFD').replace(/[\u0301]/g, '').normalize('NFC');
  if (strip !== w) out.add(strip);
  if (w.includes('ñ')) out.add(w.replace('ñ', 'n'));
  if (w.startsWith('int')) out.add(w.replace('int', 'intel').replace('intelel', 'intell'));
  if (w.includes('v')) out.add(w.replace('v', 'b'));
  if (w.includes('b')) out.add(w.replace('b', 'v'));
  if (/c[oaú]/.test(w)) out.add(w.replace(/c([oaú])/, 'k$1'));
  if (w.includes('s')) out.add(w.replace('s', 'z'));
  if (w.includes('ll')) out.add(w.replace('ll', 'y'));
  if (!/[áéíóú]/.test(w)) { const m = w.match(/[aeiou](?=[^aeiou]*[aeiou][^aeiou]*$)/); if (m) out.add(w.slice(0, m.index) + { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }[m[0]] + w.slice(m.index + 1)); }
  out.add(w.replace(/([aeiou])([^aeiou])/, '$1$2$2'));
  out.delete(w);
  return [...out];
}
function genSpell() {
  const tricky = pool().filter(a => /[áéíóúñ]/.test(a[0]) || a[0] === 'inteligente');
  const a = pick(Math.random() < 0.75 && tricky.length ? tricky : pool());
  const girl = !invariant(a) && Math.random() < 0.4, w = gform(a, girl);
  const bad = shuffle(misspell(w));
  const noAcc = w.normalize('NFD').replace(/[\u0301]/g, '').normalize('NFC');
  const smart = bad.map(b => [b, b === noAcc ? `It needs the accent mark: ${w}.` : b === w.replace('ñ', 'n') ? `It needs the ñ: ${w}.` : /intell/.test(b) ? 'Only one L in Spanish: inteligente.' : `Look again. The correct spelling is ${w}.`]);
  smart.sort((x, y) => (y[0] === noAcc || /intell|n(?=o)/.test(y[0]) ? 1 : 0) - (x[0] === noAcc ? 1 : 0));
  const swap = () => { const i = rnd(1, w.length - 3); return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); };
  return mk('spell', `Which spelling is correct? <i>(${a[2]}${invariant(a) ? '' : girl ? ', girl' : ', boy'})</i>`, w, smart, swap, () => wordCard(a), w);
}
function genPhrase() {
  const items = [
    () => ['—No me gusta correr. <br>—<span class="blank">___</span> <i>(Me neither.)</i>', 'a mí tampoco', [['a mí también', 'También means "too". To agree with a NO, use tampoco.'], ['mi tampoco', 'It needs the "A": a mí tampoco.'], ['tampoco a mí', 'The usual order is: a mí tampoco.']], 'No me gusta correr.'],
    () => ['—Me gusta dibujar. <br>—<span class="blank">___</span> <i>(Me too.)</i>', 'a mí también', [['a mí tampoco', 'Tampoco is for agreeing with a NO. For "me too" use también.'], ['mi también', 'It needs the "A": a mí también.'], ['yo tampoco', 'Tampoco is for negatives.']], 'Me gusta dibujar.'],
    () => ['—¿Cómo estás? <br>—<span class="blank">___</span>, gracias. <i>(Very well)</i>', 'Muy bien', [['Muy bueno', '"Bien" (well) answers "¿Cómo estás?".'], ['Un poco', 'Un poco means "a little".'], ['Bastante', 'Bastante alone means "quite".']], '¿Cómo estás?'],
    () => { const a = pick(pool()), girl = Math.random() < 0.5, w = gform(a, girl), q = pick([['un poco', 'a little'], ['muy', 'very'], ['bastante', 'pretty']]);
      const others = [['un poco', 'a little'], ['muy', 'very'], ['bastante', 'pretty']].filter(x => x[0] !== q[0]);
      return [`Say: <b class="n">"I'm ${q[1]} ${a[2].split(' / ')[0]}."</b> <i>(${girl ? 'a girl' : 'a boy'} is talking)</i>`, `Soy ${q[0]} ${w}.`,
        [...others.map(o => [`Soy ${o[0]} ${w}.`, `${o[0]} means "${o[1]}". "${q[1]}" is ${q[0]}.`]), ...(invariant(a) ? [[`Soy muy bastante ${w}.`, 'Don\'t combine muy and bastante.']] : [[`Soy ${q[0]} ${gform(a, !girl)}.`, `The speaker is ${girl ? 'a girl' : 'a boy'}, so use ${w}.`]])], null]; },
    () => { const a = pick(pool()), girl = Math.random() < 0.5, w = gform(a, girl), q = pick([['un poco', 'a little'], ['muy', 'very'], ['bastante', 'pretty'], ['no', 'not']]);
      const s = q[0] === 'no' ? `${girl ? 'Mi amiga' : 'Mi amigo'} no es ${w}.` : `${girl ? 'Mi amiga' : 'Mi amigo'} es ${q[0]} ${w}.`;
      const en = x => `My friend is ${x === 'not' ? 'not' : x} ${a[2].split(' / ')[0]}.`;
      const alts = [['a little', 'Un poco = a little.'], ['very', 'Muy = very.'], ['pretty', 'Bastante = pretty / quite.'], ['not', '"No es" = is not.']].filter(x => x[0] !== q[1]);
      return [`What does this mean? <b class="n">${s}</b>`, en(q[1]), alts.map(x => [en(x[0]), x[1]]), s]; }
  ];
  const [text, ans, smart, say] = pick(items)();
  const gen = () => null;
  return mk('phrase', text, ans, smart, gen, () => {
    const p = PHR.find(x => ans.toLowerCase().includes(x[0].toLowerCase()) && x[0].length > 3);
    return `<p class="say"><b>${ans}</b> ${sayBtn(ans)}</p>` + (p ? phraseCard(p) : '') + '<p class="rulecard">un poco = a little · bastante = pretty / quite · muy = very · a mí también = me too · a mí tampoco = me neither</p>';
  }, say, 1.2);
}
const GENS = { meaning: genMeaning, sayit: genSayIt, agree: genAgree, opp: genOpp, spell: genSpell, phrase: genPhrase };
const CAT_NAMES = { meaning: 'Meanings', sayit: 'Saying it in Spanish', agree: 'Boy / girl endings', opp: 'Opposites', spell: 'Spelling & accents', phrase: 'Phrases' };
const CAT_TIPS = {
  meaning: 'Review the meanings: say each Spanish word out loud and then its English meaning.',
  sayit: 'Practice going from English to Spanish. Cover the Spanish side of your list and quiz yourself.',
  agree: 'Boy or girl? Change -o to -a for girls (tímido → tímida). Words ending in -e stay the same.',
  opp: 'Learn the words in opposite pairs: extrovertido / introvertido, serio / cómico, activo / perezoso.',
  spell: 'Watch the accents and the ñ: tímido, atlético, simpático, cómico, cariñoso. And inteligente has one L.',
  phrase: 'Phrases: un poco = a little, bastante = pretty, muy = very. A mí también = me too, a mí tampoco = me neither.'
};
let ttsOn = true;
function speak(t) {
  if (!t || muted) return;
  try {
    const u = new SpeechSynthesisUtterance(t.replace(/___/g, ''));
    u.lang = 'es-MX'; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find(v => /^es/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.saybtn'); if (b) { e.preventDefault(); speak(b.dataset.say); } });

/* ================= SOUND ================= */
let actx = null, muted = false;
const ac = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());
function tone(f, dur, type = 'square', vol = 0.05, slide = 0) {
  if (muted) return;
  try {
    ac(); const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
function noise(dur, vol) {
  if (muted) return;
  try {
    ac(); const len = Math.floor(dur * actx.sampleRate), buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = actx.createBufferSource(), g = actx.createGain(); s.buffer = buf; g.gain.value = vol;
    s.connect(g).connect(actx.destination); s.start();
  } catch (e) {}
}
const seq = (fs, gap, type, vol, dur = 0.1) => fs.forEach((f, i) => setTimeout(() => tone(f, dur, type, vol), i * gap));
const sfx = {
  crack: () => { noise(0.12, 0.35); tone(1200, 0.05, 'square', 0.04); },
  charge: () => seq([392, 523, 659, 784, 659, 784], 150, 'square', 0.06, 0.16),
  hit: () => seq([523, 659, 784], 70, 'square', 0.05),
  run: () => seq([784, 1046], 60, 'triangle', 0.07),
  strike: () => tone(140, 0.35, 'square', 0.06, -40),
  out: () => seq([392, 330, 262, 196], 140, 'sawtooth', 0.045, 0.16),
  click: () => tone(600, 0.04, 'square', 0.03),
  pitch: () => tone(300, 0.15, 'triangle', 0.04, 200)
};

