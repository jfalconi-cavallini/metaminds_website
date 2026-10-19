'use strict';
/* ===== LA FAMILIA + DESCRIBE UN MIEMBRO DE TU FAMILIA (class notes 10/19/26) ===== */
// [spanish, article, english, gender m/f, partner word]
const FAM = [
  ['mamá', 'la', 'mom', 'f', 'papá'], ['papá', 'el', 'dad', 'm', 'mamá'], ['padre', 'el', 'father', 'm', 'madre'],
  ['hermano', 'el', 'brother', 'm', 'hermana'], ['tía', 'la', 'aunt', 'f', 'tío'], ['tío', 'el', 'uncle', 'm', 'tía'],
  ['hijo', 'el', 'son', 'm', 'hija'], ['hija', 'la', 'daughter', 'f', 'hijo'], ['primo', 'el', 'cousin (boy)', 'm', 'prima'],
  ['prima', 'la', 'cousin (girl)', 'f', 'primo'], ['sobrino', 'el', 'nephew', 'm', 'sobrina'], ['sobrina', 'la', 'niece', 'f', 'sobrino'],
  ['vecino', 'el', 'neighbor', 'm', 'vecina'], ['vecindario', 'el', 'neighborhood', 'm', null],
  ['gemelo', 'el', 'twin (boy)', 'm', 'gemela'], ['gemela', 'la', 'twin (girl)', 'f', 'gemelo']
];
// describe-a-family-member words: [spanish, english, article or '']
const DESC = [
  ['mañana', 'tomorrow', ''], ['ayer', 'yesterday', ''], ['hoy', 'today', ''], ['el cabello', 'hair', 'el'], ['el pelo', 'hair', 'el'],
  ['cerca', 'near / close', ''], ['lejos', 'far', ''], ['pero', 'but', ''], ['también', 'also / too', ''], ['tampoco', 'neither / not either', ''],
  ['el perro', 'dog', 'el'], ['la pera', 'pear', 'la'], ['el sombrero', 'hat', 'el'], ['dice', 'he / she says', '']
];
const famOf = w => FAM.find(f => f[0] === w);
const FAM_RULE = '<p class="rulecard">Family words: -o = boy (el tío, el primo), -a = girl (la tía, la prima). Mamá and papá have an accent on the last a. El vecindario = the neighborhood.</p>';
const DESC_RULE = '<p class="rulecard">Describe un miembro de tu familia: Mi tío es alto. Tiene el pelo negro. Vive cerca, pero mi prima vive lejos. Pero = but · perro = dog (two r\'s!) · pera = pear.</p>';
const art = f => `${f[1]} ${f[0]}`;
function genFam() {
  const r = Math.random(), f = pick(FAM), others = FAM.filter(x => x !== f);
  const card = () => `<p class="say"><b>${art(f)}</b> = ${f[2]} ${sayBtn(art(f))}</p>` + FAM_RULE;
  if (r < 0.35) {
    const smart = f[4] && famOf(f[4]) ? [[famOf(f[4])[2], `Careful: ${f[4]} is ${famOf(f[4])[2]}. ${f[0]} = ${f[2]}.`]] : [];
    return mk('familia', `What does <b class="n">${art(f)}</b> mean?`, f[2], smart, () => pick(others)[2], card, art(f));
  }
  if (r < 0.65) {
    const smart = f[4] && famOf(f[4]) ? [[famOf(f[4])[0], `${f[4]} means ${famOf(f[4])[2]}.`]] : [];
    const noAcc = f[0].normalize('NFD').replace(/[\u0301]/g, '').normalize('NFC');
    if (noAcc !== f[0]) smart.push([noAcc, `It needs the accent mark: ${f[0]}.`]);
    return mk('familia', `How do you say <b class="n">${f[2]}</b> in Spanish?`, f[0], smart, () => pick(others)[0], card);
  }
  if (r < 0.85) {
    const ans = f[1], wrong = f[1] === 'el' ? 'la' : 'el';
    return mk('familia', `<span class="blank">___</span> ${f[0]} <i>(${f[2]})</i>`, ans, [[wrong, f[3] === 'm' ? `${f[0]} is masculine: el ${f[0]}.` : `${f[0]} is feminine: la ${f[0]}.`], ['los', 'Los is plural. Just one person: el or la.'], ['las', 'Las is plural. Just one person: el or la.']], () => null, card);
  }
  const pairs = FAM.filter(x => x[4] && famOf(x[4])), p = pick(pairs), girl = p[3] === 'm';
  return mk('familia', `${girl ? 'Girl' : 'Boy'} version of <b class="n">${p[0]}</b>?`, p[4], [[p[0], 'That\'s the same word. Switch the ending.']], () => pick(pairs.filter(x => x[0] !== p[4]))[0],
    () => `<p class="say"><b>${p[0]}</b> → <b>${p[4]}</b> ${sayBtn(p[0] + ', ' + p[4])}</p>` + FAM_RULE);
}
const DESC_SENT = [
  ['Mi tía vive ___. (near)', 'cerca', [['lejos', 'Lejos = far. Near = cerca.']]],
  ['Mi primo vive ___. (far)', 'lejos', [['cerca', 'Cerca = near. Far = lejos.']]],
  ['Mi hermano tiene ___ negro. (hair)', 'el pelo', [['el perro', 'Perro = dog!'], ['la pera', 'Pera = pear!']]],
  ['Mi mamá tiene ___ largo. (hair)', 'el cabello', [['el sombrero', 'Sombrero = hat.']]],
  ['Mi tío es alto, ___ mi tía es baja. (but)', 'pero', [['perro', 'Perro (two r\'s) = dog. Pero = but.'], ['también', 'También = also.']]],
  ['Mi papá es simpático. Mi mamá ___ es simpática. (also)', 'también', [['tampoco', 'Tampoco = neither.']]],
  ['Mi primo no es serio, y mi prima ___. (not either)', 'tampoco', [['también', 'For a negative, use tampoco.']]],
  ['___ es lunes. Mañana es martes. (today)', 'Hoy', [['Ayer', 'Ayer = yesterday.'], ['Mañana', 'Mañana = tomorrow.']]],
  ['Hoy es lunes. ___ fue domingo. (yesterday)', 'Ayer', [['Mañana', 'Mañana = tomorrow.'], ['Hoy', 'Hoy = today.']]],
  ['Mi vecino tiene ___ grande. (a dog)', 'un perro', [['una pera', 'Una pera = a pear.'], ['un pero', 'Pero = but. Dog = perro, two r\'s.']]],
  ['Mi abuelo lleva ___. (a hat)', 'un sombrero', [['un perro', 'Perro = dog.']]],
  ['Mi hermana ___ "¡Hola!" (says)', 'dice', [['dices', 'Dices = you say. She says = dice.']]]
];
function genDesc() {
  const r = Math.random();
  if (r < 0.5) {
    const d = pick(DESC), others = DESC.filter(x => x[1] !== d[1]), en = Math.random() < 0.5;
    const smart = d[0] === 'pero' ? [['dog', 'Dog is perro (two r\'s). Pero = but.']] : d[0] === 'el perro' ? [['but', 'But is pero (one r). Perro = dog.']] : d[0] === 'la pera' ? [['dog', 'Dog is perro.']] : [];
    const card = () => `<p class="say"><b>${d[0]}</b> = ${d[1]} ${sayBtn(d[0])}</p>` + DESC_RULE;
    return en ? mk('describe', `How do you say <b class="n">${d[1]}</b> in Spanish?`, d[0], d[0] === 'pero' ? [['perro', 'Perro = dog.']] : d[0] === 'el perro' ? [['el pero', 'Pero = but. Dog has two r\'s.']] : [], () => pick(others)[0], card)
      : mk('describe', `What does <b class="n">${d[0]}</b> mean?`, d[1], smart, () => pick(others)[1], card, d[0]);
  }
  const s = pick(DESC_SENT), full = s[0].replace(/ \(.*\)$/, '').replace('___', s[1]);
  return mk('describe', `Describe un miembro de tu familia:<br>${s[0].replace('___', '<span class="blank">___</span>')}`, s[1], s[2], () => pick(DESC_SENT.filter(x => x !== s))[1],
    () => `<p class="say"><b>${full}</b> ${sayBtn(full)}</p>` + DESC_RULE, null, 1.2);
}
Object.assign(TAGS, { familia: ['LA FAMILIA', 'var(--o)'], describe: ['DESCRIBE TU FAMILIA', 'var(--r)'] });
Object.assign(GENS, { familia: genFam, describe: genDesc });
Object.assign(CAT_NAMES, { familia: 'La familia', describe: 'Describe un miembro de tu familia' });
Object.assign(CAT_TIPS, {
  familia: 'La familia: mamá, papá, padre, hermano, tío / tía, hijo / hija, primo / prima, sobrino / sobrina, vecino, vecindario, gemelo / gemela. -o = boy, -a = girl.',
  describe: 'Describe un miembro de tu familia: pelo / cabello (hair), cerca / lejos, pero (but) vs perro (dog), también / tampoco, hoy / ayer / mañana.'
});
