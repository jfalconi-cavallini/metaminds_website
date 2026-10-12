'use strict';
/* ===== UNIT 1 ADD-ONS: telling time, ser, dates, conversation ===== */
const HRS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];
const NUM = ['', 'primero', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y uno'];
const DAYS = [['lunes', 'Monday'], ['martes', 'Tuesday'], ['miércoles', 'Wednesday'], ['jueves', 'Thursday'], ['viernes', 'Friday'], ['sábado', 'Saturday'], ['domingo', 'Sunday']];
const MONTHS = [['enero', 'January', 31], ['febrero', 'February', 28], ['marzo', 'March', 31], ['abril', 'April', 30], ['mayo', 'May', 31], ['junio', 'June', 30], ['julio', 'July', 31], ['agosto', 'August', 31], ['septiembre', 'September', 30], ['octubre', 'October', 31], ['noviembre', 'November', 30], ['diciembre', 'December', 31]];
const MINS = { 0: 'en punto', 5: 'y cinco', 10: 'y diez', 15: 'y cuarto', 20: 'y veinte', 30: 'y media', 40: 'menos veinte', 45: 'menos cuarto', 50: 'menos diez', 55: 'menos cinco' };
Object.assign(TAGS, { time: ['¿QUÉ HORA ES?', 'var(--y)'], ser: ['VERB SER', 'var(--g)'], dates: ['DAYS & DATES', 'var(--c)'], convo: ['CONVERSATION', 'var(--m)'] });

function timeEs(h, m, verbFix) {
  let hh = m > 30 ? h % 12 + 1 : h;
  const one = hh === 1;
  const v = verbFix == null ? one : verbFix;
  return `${v ? 'Es la' : 'Son las'} ${HRS[hh]} ${MINS[m]}.`;
}
const dig2 = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
function clockSVG(h, m) {
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  let t = '';
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; t += `<text x="${50 + 36 * Math.sin(a)}" y="${54 + -36 * Math.cos(a)}" font-size="10" text-anchor="middle" fill="#fff" font-family="monospace">${i}</text>`; }
  return `<svg viewBox="0 0 100 100" width="130" height="130" role="img" aria-label="Clock" style="flex:none"><circle cx="50" cy="50" r="46" fill="#140a26" stroke="#ffd23f" stroke-width="4"/>${t}
<line x1="50" y1="50" x2="50" y2="26" stroke="#5dff6a" stroke-width="5" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
<line x1="50" y1="50" x2="50" y2="14" stroke="#3fe0ff" stroke-width="3" stroke-linecap="round" transform="rotate(${ma} 50 50)"/><circle cx="50" cy="50" r="3" fill="#fff"/></svg>`;
}
const TIME_RULE = '<p class="rulecard">1 o\'clock hour: <b>Es la una</b>. All other hours: <b>Son las</b> dos, tres... · y cuarto = :15 · y media = :30 · After :30, go to the NEXT hour and subtract: 2:45 = Son las tres menos cuarto · 2:50 = Son las tres menos diez.<br><span style="color:#5dff6a">Green = hour hand</span> · <span style="color:#3fe0ff">blue = minute hand</span></p>';
function genTime() {
  const h = rnd(1, 12), m = pick([0, 15, 30, 45, 50, 10, 5, 20, 40, 55, 15, 30, 45]);
  const ans = timeEs(h, m), hh = m > 30 ? h % 12 + 1 : h;
  const smart = [];
  smart.push([timeEs(h, m, hh !== 1), hh === 1 ? 'With one o\'clock it\'s singular: Es la una.' : `Only the 1 o'clock hour uses "Es la". For ${HRS[hh]} use "Son las".`]);
  if (m > 30) smart.push([`${h === 1 ? 'Es la' : 'Son las'} ${HRS[h]} ${MINS[m]}.`, `After :30 you name the NEXT hour and subtract. ${dig2(h, m)} = ${ans}`]);
  if (m === 15) smart.push([`${hh === 1 ? 'Es la' : 'Son las'} ${HRS[hh]} y media.`, 'Y media = :30. Y cuarto = :15.']);
  if (m === 30) smart.push([`${hh === 1 ? 'Es la' : 'Son las'} ${HRS[hh]} y cuarto.`, 'Y cuarto = :15. Y media = :30.']);
  if (m === 45) smart.push([timeEs(h, 15), 'Y cuarto is :15. For :45 use menos cuarto with the next hour.']);
  const gen = () => timeEs(rnd(1, 12), pick(Object.keys(MINS).map(Number)));
  const explain = () => `<div style="display:flex;justify-content:center">${clockSVG(h, m)}</div><p class="say">${dig2(h, m)} = <b>${ans}</b> ${sayBtn(ans)}</p>` + TIME_RULE;
  const r = Math.random();
  if (r < 0.5) return mk('time', `<span style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">${clockSVG(h, m)}<span>¿Qué hora es?</span></span>`, ans, smart, gen, explain, '¿Qué hora es?', 1.2);
  if (r < 0.8) return mk('time', `¿Qué hora es? <b class="n">${dig2(h, m)}</b>`, ans, smart, gen, explain, null, 1.2);
  // reverse: Spanish -> digital
  const alts = [];
  if (m > 30) alts.push([dig2(hh, 60 - m), `Menos means MINUS: ${ans.replace('.', '')} = ${dig2(h, m)}.`]);
  if (m === 15 || m === 30) alts.push([dig2(h, m === 15 ? 30 : 15), 'Y cuarto = :15 · y media = :30.']);
  return mk('time', `What time is it? <b class="n">${ans}</b>`, dig2(h, m), alts, () => dig2(rnd(1, 12), pick([0, 15, 30, 45, 50, 10])), explain, ans, 1.1);
}

const SERF = [['yo', 'soy', 0, 0], ['tú', 'eres', 0, 0], ['él', 'es', 0, 0], ['ella', 'es', 1, 0], ['usted', 'es', -1, 0], ['nosotros', 'somos', 0, 1], ['nosotras', 'somos', 1, 1], ['ellos', 'son', 0, 1], ['ellas', 'son', 1, 1], ['ustedes', 'son', -1, 1]];
const SER_TABLE = '<table class="pc" style="font-size:16px"><tr><td style="width:auto;padding:4px 10px">yo <b style="color:#ffd23f">soy</b></td><td style="width:auto;padding:4px 10px">nosotros/as <b style="color:#ffd23f">somos</b></td></tr><tr><td style="width:auto;padding:4px 10px">tú <b style="color:#ffd23f">eres</b></td><td style="width:auto;padding:4px 10px">(vosotros <b style="color:#ffd23f">sois</b>)</td></tr><tr><td style="width:auto;padding:4px 10px">él / ella / usted <b style="color:#ffd23f">es</b></td><td style="width:auto;padding:4px 10px">ellos / ellas / ustedes <b style="color:#ffd23f">son</b></td></tr></table>';
const plural = w => /[aeiouáéíóú]$/.test(w) ? w + 's' : w + 'es';
const adjForm = (a, fem, pl) => { const w = fem ? a[1] : a[0]; return pl ? plural(w) : w; };
function genSer() {
  const classAdj = ADJ.filter(a => a[3] || lv() >= 2);
  if (Math.random() < 0.5) {
    const [sub, verb] = pick(SERF), a = pick(classAdj), fem = Math.random() < 0.5, f = SERF.find(x => x[0] === sub);
    const isFem = f[2] === 1 || (f[2] !== 0 && fem), w = adjForm(a, isFem, f[3]);
    const smart = ['soy', 'eres', 'es', 'somos', 'son'].filter(v => v !== verb).map(v => [v, `"${v}" goes with ${SERF.filter(x => x[1] === v).map(x => x[0]).join(' / ')}. ${cap(sub)} → ${verb}.`]);
    smart.push(['está', 'Está is from estar. For what someone is LIKE, use ser.']);
    const sent = `${cap(sub)} ${verb} ${w}.`;
    return mk('ser', `${cap(sub)} <span class="blank">___</span> ${w}. <i>(${a[2].split(' / ')[0]})</i>`, verb, shuffle(smart).slice(0, 3), () => null,
      () => `<p class="say">${sent} ${sayBtn(sent)}</p>` + SER_TABLE, null, 1.1);
  }
  let a; do { a = pick(classAdj); } while (invariant(a) && Math.random() < 0.7);
  const subj = pick([['Ella es', 1, 0, 'She'], ['Él es', 0, 0, 'He'], ['Mi amiga es', 1, 0, 'My friend (girl)'], ['Mi hermano es', 0, 0, 'My brother'], ['Nosotros somos', 0, 1, 'We (boys/mixed)'], ['Nosotras somos', 1, 1, 'We (girls)'], ['Ellas son', 1, 1, 'They (girls)'], ['Ellos son', 0, 1, 'They (boys/mixed)'], ['Mis amigas son', 1, 1, 'My friends (girls)']]);
  const ans = adjForm(a, subj[1], subj[2]);
  const smart = [];
  for (const [f, p] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const w = adjForm(a, f, p); if (w !== ans) smart.push([w, p !== subj[2] ? (subj[2] ? 'More than one person: add -s / -es.' : 'Just one person: no -s.') : (subj[1] ? 'Girls: use the -a ending.' : 'Boys or a mixed group: use the -o ending.')]); }
  const sent = `${subj[0]} ${ans}.`;
  return mk('ser', `${subj[0]} <span class="blank">___</span>. <i>(${subj[3]}: ${a[2].split(' / ')[0]})</i>`, ans, smart, () => adjForm(pick(classAdj), subj[1], subj[2]),
    () => `<p class="say">${sent} ${sayBtn(sent)}</p><p class="rulecard">The adjective matches the person: activo (boy) · activa (girl) · activos (boys / mixed) · activas (girls). Words ending in -e only add -s: inteligentes. -dor: habladora, habladores.</p>` + SER_TABLE, null, 1.1);
}

const dateEs = (d, mi) => `el ${NUM[d]} de ${MONTHS[mi][0]}`;
const DATE_RULE = '<p class="rulecard">Dates: <b>Es el</b> + number + <b>de</b> + month. Es el catorce de marzo. The 1st = el primero. Days and months are lowercase in Spanish: lunes, marzo.</p>';
function genDates() {
  const r = Math.random();
  if (r < 0.25) {
    const d = pick(DAYS), en = Math.random() < 0.5;
    const others = DAYS.filter(x => x !== d);
    const smart = d[0] === 'martes' ? [['miércoles', 'Miércoles = Wednesday.']] : d[0] === 'sábado' ? [['domingo', 'Domingo = Sunday.']] : [];
    return en ? mk('dates', `How do you say <b class="n">${d[1]}</b> in Spanish?`, d[0], [...smart, [cap(d[0]), 'Days are lowercase in Spanish.']], () => pick(others)[0], () => `<p class="say"><b>${d[0]}</b> = ${d[1]} ${sayBtn(d[0])}</p><p class="rulecard">lunes · martes · miércoles · jueves · viernes · sábado · domingo (the week starts on Monday)</p>`)
      : mk('dates', `What does <b class="n">${d[0]}</b> mean?`, d[1], [], () => pick(others)[1], () => `<p class="say"><b>${d[0]}</b> = ${d[1]}</p><p class="rulecard">lunes · martes · miércoles · jueves · viernes · sábado · domingo</p>`, d[0]);
  }
  if (r < 0.4) {
    const i = rnd(0, 6), nxt = DAYS[(i + 1) % 7][0];
    return mk('dates', `Hoy es <b class="n">${DAYS[i][0]}</b>. Mañana es <span class="blank">___</span>.`, nxt, [[DAYS[(i + 6) % 7][0], 'That\'s the day BEFORE. Mañana = tomorrow.']], () => pick(DAYS)[0], () => `<p class="say">Hoy es ${DAYS[i][0]}. Mañana es <b>${nxt}</b>. ${sayBtn(`Hoy es ${DAYS[i][0]}. Mañana es ${nxt}.`)}</p><p class="rulecard">lunes · martes · miércoles · jueves · viernes · sábado · domingo</p>`, `Hoy es ${DAYS[i][0]}. Mañana es`);
  }
  if (r < 0.6) {
    const mi = rnd(0, 11), m = MONTHS[mi], others = MONTHS.filter(x => x !== m);
    const smart = [[cap(m[0]), 'Months are lowercase in Spanish.']];
    if (m[0] === 'junio') smart.push(['julio', 'Julio = July.']); if (m[0] === 'julio') smart.push(['junio', 'Junio = June.']);
    return mk('dates', `How do you say <b class="n">${m[1]}</b> in Spanish?`, m[0], smart, () => pick(others)[0], () => `<p class="say"><b>${m[0]}</b> = ${m[1]} ${sayBtn(m[0])}</p>` + DATE_RULE);
  }
  const mi = rnd(0, 11), d = rnd(1, MONTHS[mi][2]), ans = `Es ${dateEs(d, mi)}.`;
  const d2 = d === 1 ? 2 : d;
  const smart = [[`Es ${MONTHS[mi][0]} ${NUM[d2]}.`, 'Spanish puts the number first: el ___ de (month).'], [`Es el ${MONTHS[mi][0]} de ${NUM[d2]}.`, 'Number first, then de + month.'],
    [`Es ${dateEs(d, (mi + pick([1, 11])) % 12)}.`, 'Check the month.']];
  if (d === 1) smart.unshift(['Es el primero ' + MONTHS[mi][0] + '.', 'Don\'t forget de: Es el primero de ' + MONTHS[mi][0] + '.']);
  else smart.push([`Es el ${NUM[d]} de ${cap(MONTHS[mi][0])}.`, 'Months are lowercase in Spanish.']);
  return mk('dates', `¿Cuándo es tu cumpleaños? <i>(${MONTHS[mi][1]} ${d})</i>`, ans, shuffle(smart).slice(0, 3), () => null,
    () => `<p class="say">—¿Cuándo es tu cumpleaños?<br>—<b>${ans}</b> ${sayBtn('¿Cuándo es tu cumpleaños? ' + ans)}</p>` + DATE_RULE, '¿Cuándo es tu cumpleaños?', 1.3);
}

const CONVO = [
  ['¿Cómo te llamas?', 'What\'s your name?', () => pick(['Me llamo Thomas.', 'Me llamo Sofía.', 'Me llamo Diego.']), [['Mi llamo Thomas.', 'It\'s ME llamo, not mi.'], ['Me llamo es Thomas.', 'No "es": Me llamo Thomas.'], ['Yo llamo Thomas.', 'It needs "me": Me llamo...']]],
  ['¿De dónde eres?', 'Where are you from?', () => pick(['Soy de Chicago.', 'Soy de Texas.', 'Soy de México.']), [['Soy en Chicago.', 'From = de: Soy de...'], ['Estoy de Chicago.', 'Use ser for where you are from: Soy de...'], ['Vivo de Chicago.', 'Vivo en = I live in. From = Soy de.']]],
  ['¿Cuándo es tu cumpleaños?', 'When is your birthday?', () => pick(['Es el cinco de mayo.', 'Es el doce de agosto.', 'Es el primero de abril.']), [['Es mayo cinco.', 'Number first: Es el cinco de mayo.'], ['Tengo doce años.', 'That\'s your age, not your birthday.'], ['Es lunes.', 'That\'s a day of the week, not your birthday.']]],
  ['¿Dónde vives?', 'Where do you live?', () => pick(['Vivo en Chicago.', 'Vivo en Connecticut.', 'Vivo en una casa grande.']), [['Vivo de Chicago.', 'Live IN = vivo en.'], ['Soy en Chicago.', 'Use vivir: Vivo en...'], ['Vives en Chicago.', 'Vives = you live. Answer with vivo (I live).']]],
  ['¿Qué te gusta hacer?', 'What do you like to do?', () => pick(['Me gusta jugar al fútbol.', 'Me gusta dibujar.', 'Me gusta escuchar música.']), [['Yo gusta jugar al fútbol.', 'It\'s ME gusta, not yo gusta.'], ['Me gusta juego al fútbol.', 'After me gusta, use the infinitive: jugar.'], ['Te gusta jugar al fútbol.', 'Te gusta = you like. Answer with me gusta.']]],
  ['¿Cómo eres?', 'What are you like?', () => pick(['Soy activo y simpático.', 'Soy bastante serio.', 'Soy un poco tímida.']), [['Estoy activo y simpático.', 'For personality, use ser: Soy...'], ['Eres activo y simpático.', 'Eres = you are. Answer with soy.'], ['Me llamo activo.', 'That answers ¿Cómo te llamas?']]],
  ['¿Cuántos años tienes?', 'How old are you?', () => pick(['Tengo doce años.', 'Tengo trece años.']), [['Soy doce años.', 'Age uses tener: Tengo ___ años.'], ['Tengo doce.', 'Add años: Tengo doce años.'], ['Tienes doce años.', 'Tienes = you have. Answer with tengo.']]]
];
function genConvo() {
  const c = pick(CONVO), ans = c[2]();
  const other = CONVO.filter(x => x !== c);
  const r = Math.random();
  const model = () => `<p class="say">—${c[0]} <i style="color:#9a9a9a">(${c[1]})</i><br>—<b>${ans}</b> ${sayBtn(c[0] + ' ' + ans)}</p><p class="rulecard">${CONVO.map(x => x[0]).join(' · ')}</p>`;
  if (r < 0.45) {
    const smart = [...shuffle(c[3].slice()).slice(0, 2), [pick(other)[2](), 'That answers a different question.']];
    return mk('convo', `—${c[0]}<br>—<span class="blank">___</span> <i>(${c[1]})</i>`, ans, smart, () => pick(other)[2](), model, c[0], 1.3);
  }
  if (r < 0.75) {
    return mk('convo', `Which question gets this answer?<br>—<b class="n">${ans}</b>`, c[0], [], () => pick(other)[0], model, ans, 1.2);
  }
  // build the answer: correct word order
  const w = ans.replace(/[.]$/, '').split(' '); w[0] = w[0].toLowerCase();
  const wrongs = new Set(); let g = 0;
  while (wrongs.size < 3 && g++ < 60) { const s = shuffle(w.slice()).join(' '); if (s !== w.join(' ')) wrongs.add(cap(s) + '.'); }
  return mk('convo', `Build the answer: ${c[0]}<br><b class="n">${shuffle(w.slice()).join(' / ')}</b>`, ans, [...wrongs].map(s => [s, 'Look at the word order again.']), () => null, model, c[0], 1.4);
}

Object.assign(GENS, { time: genTime, ser: genSer, dates: genDates, convo: genConvo });
Object.assign(CAT_NAMES, { time: 'Telling time', ser: 'Ser & adjective endings', dates: 'Days, months & dates', convo: 'Conversation' });
Object.assign(CAT_TIPS, {
  time: 'Telling time: Es la una, but Son las dos/tres... After :30, use the next hour with menos: 2:45 = Son las tres menos cuarto.',
  ser: 'Ser: soy, eres, es, somos, son. Match the adjective: activo / activa / activos / activas.',
  dates: 'Dates: Es el + number + de + month (Es el catorce de marzo). Days and months are lowercase.',
  convo: 'Practice the interview: ¿Cómo te llamas? ¿De dónde eres? ¿Cuándo es tu cumpleaños? ¿Dónde vives? ¿Qué te gusta hacer? ¿Cómo eres?'
});
