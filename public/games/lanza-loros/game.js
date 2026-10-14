/* Lanza Loros — slingshot forts. No network calls, no accounts, no saved data. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    root.LanzaLoros = api;
    api.boot();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var W = 960;
  var H = 540;
  var GROUND = 468;
  var GRAVITY = 980;
  var MAX_PULL = 112;
  var LAUNCH_SCALE = 8.4;
  var SLING = { x: 172, y: 398 };
  var QTIME = 12000;
  var COLORS = ["#ff4d6a", "#ffe14a", "#3dfff3", "#ff4dff"];

  var KINDS = {
    plain: { r: 15, mass: 1, dmg: 1, rest: 0.34, color: "#ffe14a", beak: "#ff9a3c", label: "NORMAL · PÍO" },
    big: { r: 24, mass: 3.4, dmg: 2.5, rest: 0.1, color: "#b7c0d0", beak: "#8e97a8", label: "GRANDE · ROCA" },
    super: { r: 15, mass: 1, dmg: 1.05, rest: 0.4, color: "#ff4dff", beak: "#ffe14a", label: "SÚPER · TRÍO" },
    mega: { r: 16, mass: 1.15, dmg: 1.4, rest: 0.3, color: "#ff9a3c", beak: "#ff4d4d", label: "MEGA · ¡BOOM!" },
  };

  function Q(prompt, answer, choices, why) {
    return { prompt: prompt, answer: answer, choices: choices, why: why };
  }

  var QUESTIONS = {
    1: [
      Q("¿Cómo se dice red?", "rojo", ["rojo", "azul", "verde", "negro"], "Red se dice rojo."),
      Q("¿Cómo se dice blue?", "azul", ["azul", "rojo", "blanco", "gris"], "Blue se dice azul."),
      Q("¿Cómo se dice green?", "verde", ["verde", "amarillo", "morado", "rosa"], "Green se dice verde."),
      Q("¿Cómo se dice yellow?", "amarillo", ["amarillo", "naranja", "negro", "azul"], "Yellow se dice amarillo."),
      Q("¿Cómo se dice black?", "negro", ["negro", "blanco", "marrón", "gris"], "Black se dice negro."),
      Q("¿Cómo se dice white?", "blanco", ["blanco", "negro", "rosa", "verde"], "White se dice blanco."),
      Q("El sol es…", "amarillo", ["amarillo", "azul", "negro", "morado"], "El sol es amarillo. (The sun is yellow.)"),
      Q("La hierba es…", "verde", ["verde", "roja", "blanca", "gris"], "La hierba es verde. (Grass is green.)"),
      Q("¿Cómo se dice dog?", "perro", ["perro", "gato", "pájaro", "pez"], "Dog se dice perro."),
      Q("¿Cómo se dice cat?", "gato", ["gato", "perro", "casa", "libro"], "Cat se dice gato."),
      Q("¿Cómo se dice house?", "casa", ["casa", "escuela", "agua", "mesa"], "House se dice casa."),
      Q("¿Cómo se dice water?", "agua", ["agua", "leche", "pan", "jugo"], "Water se dice agua."),
      Q("¿Cómo se dice book?", "libro", ["libro", "lápiz", "silla", "mesa"], "Book se dice libro."),
      Q("¿Cómo se dice school?", "escuela", ["escuela", "casa", "tienda", "parque"], "School se dice escuela."),
      Q("¿Cómo se dice friend?", "amigo", ["amigo", "familia", "maestro", "primo"], "Friend se dice amigo."),
      Q("¿Qué número es 3?", "tres", ["tres", "trece", "treinta", "dos"], "3 = tres."),
      Q("¿Qué número es 8?", "ocho", ["ocho", "siete", "nueve", "seis"], "8 = ocho."),
      Q("¿Qué número es 15?", "quince", ["quince", "cinco", "cincuenta", "catorce"], "15 = quince."),
      Q("¿Cómo se dice 20?", "veinte", ["veinte", "doce", "dos", "treinta"], "20 = veinte."),
      Q("Dos más dos son…", "cuatro", ["cuatro", "tres", "cinco", "seis"], "2 + 2 = cuatro."),
    ],
    2: [
      Q("___ mesa", "la", ["la", "el", "los", "las"], "Mesa es femenina: la mesa."),
      Q("___ libro", "el", ["el", "la", "las", "una"], "Libro es masculino: el libro."),
      Q("___ casas", "las", ["las", "los", "el", "la"], "Casas es femenino plural: las casas."),
      Q("___ perros", "los", ["los", "las", "el", "la"], "Perros es masculino plural: los perros."),
      Q("___ profesora", "la", ["la", "el", "los", "un"], "Profesora termina en -a y es femenina: la profesora."),
      Q("___ mapa", "el", ["el", "la", "las", "una"], "Mapa termina en -a, pero es masculino: el mapa."),
      Q("___ mano", "la", ["la", "el", "los", "un"], "Mano termina en -o, pero es femenina: la mano."),
      Q("___ problema", "el", ["el", "la", "las", "una"], "Problema es masculino: el problema."),
      Q("___ día", "el", ["el", "la", "las", "una"], "Día es masculino: el día."),
      Q("La casa es ___.", "roja", ["roja", "rojo", "rojos", "azules"], "Casa es femenina, entonces roja."),
      Q("El libro es ___.", "rojo", ["rojo", "roja", "rojas", "amarillas"], "Libro es masculino, entonces rojo."),
      Q("___ chica inteligente", "una", ["una", "un", "unos", "el"], "Chica es femenina: una chica."),
      Q("___ chico alto", "un", ["un", "una", "unas", "la"], "Chico es masculino: un chico."),
      Q("El plural de la mesa es…", "las mesas", ["las mesas", "los mesas", "las mesa", "el mesas"], "Femenino plural: las mesas."),
      Q("El plural de el amigo es…", "los amigos", ["los amigos", "las amigos", "los amigas", "el amigos"], "Masculino plural: los amigos."),
      Q("The female cat is…", "la gata", ["la gata", "el gata", "la gato", "los gata"], "Gata es la hembra: la gata."),
    ],
    3: [
      Q("yo + hablar", "hablo", ["hablo", "hablas", "habla", "hablan"], "Yo usa -o: hablo."),
      Q("tú + comer", "comes", ["comes", "como", "come", "comen"], "Tú de un verbo -er usa -es: comes."),
      Q("ella + vivir", "vive", ["vive", "vivo", "vives", "viven"], "Ella de un verbo -ir usa -e: vive."),
      Q("nosotros + estudiar", "estudiamos", ["estudiamos", "estudio", "estudias", "estudian"], "Nosotros de un verbo -ar usa -amos: estudiamos."),
      Q("ellos + beber", "beben", ["beben", "bebo", "bebes", "bebe"], "Ellos de un verbo -er usa -en: beben."),
      Q("yo + ser", "soy", ["soy", "eres", "es", "somos"], "Ser es irregular: yo soy."),
      Q("tú + estar", "estás", ["estás", "estoy", "está", "están"], "Estar: tú estás. Lleva acento."),
      Q("yo + tener", "tengo", ["tengo", "tienes", "tiene", "tienen"], "Tener es irregular: yo tengo."),
      Q("él + ir", "va", ["va", "voy", "vas", "van"], "Ir es irregular: él va."),
      Q("nosotros + hacer", "hacemos", ["hacemos", "hago", "haces", "hacen"], "Nosotros hacemos. El cambio raro es yo hago."),
      Q("ellos + ser", "son", ["son", "somos", "soy", "eres"], "Ellos son."),
      Q("yo + ir", "voy", ["voy", "vas", "va", "vamos"], "Yo voy."),
      Q("tú + tener", "tienes", ["tienes", "tengo", "tiene", "tienen"], "Tú tienes. La e cambia a ie."),
      Q("ella + estar", "está", ["está", "estoy", "estás", "estamos"], "Ella está. Lleva acento."),
      Q("ellos + hablar", "hablan", ["hablan", "hablas", "hablo", "hablamos"], "Ellos hablan."),
      Q("yo + escribir", "escribo", ["escribo", "escribes", "escribe", "escriben"], "Yo escribo."),
    ],
    4: [
      Q("Yo ___ estudiante.", "soy", ["soy", "estoy", "está", "son"], "Profesión o identidad: ser. Yo soy estudiante."),
      Q("Ella ___ en casa.", "está", ["está", "es", "soy", "son"], "Lugar: estar. Ella está en casa."),
      Q("Nosotros ___ cansados.", "estamos", ["estamos", "somos", "están", "son"], "Una condición de ahora: estar. Estamos cansados."),
      Q("Tú ___ de Perú.", "eres", ["eres", "estás", "es", "están"], "Origen: ser. Tú eres de Perú."),
      Q("El libro ___ de María.", "es", ["es", "está", "son", "están"], "Posesión: ser. El libro es de María."),
      Q("¿Dónde ___ las llaves?", "están", ["están", "son", "es", "somos"], "Lugar: estar. Las llaves están…"),
      Q("La sopa ___ fría.", "está", ["está", "es", "son", "estoy"], "Temperatura de ahora: estar. La sopa está fría."),
      Q("Ellos ___ médicos.", "son", ["son", "están", "es", "estamos"], "Profesión: ser. Ellos son médicos."),
      Q("Madrid ___ la capital.", "es", ["es", "está", "son", "están"], "Identidad: ser. Madrid es la capital."),
      Q("Hoy yo ___ contento.", "estoy", ["estoy", "soy", "es", "están"], "Emoción de hoy: estar. Hoy estoy contento."),
      Q("A mí ___ el chocolate.", "me gusta", ["me gusta", "me gustan", "te gusta", "les gusta"], "Chocolate es singular: me gusta."),
      Q("A mí ___ los gatos.", "me gustan", ["me gustan", "me gusta", "le gustan", "nos gusta"], "Gatos es plural: me gustan."),
      Q("A ella ___ bailar.", "le gusta", ["le gusta", "me gusta", "les gusta", "le gustan"], "Bailar es singular: le gusta."),
      Q("A nosotros ___ la pizza.", "nos gusta", ["nos gusta", "nos gustan", "les gusta", "me gustan"], "A nosotros nos gusta. Pizza es singular."),
      Q("A ellos ___ los videojuegos.", "les gustan", ["les gustan", "les gusta", "le gustan", "me gusta"], "A ellos les gustan. Videojuegos es plural."),
      Q("A ti ___ esta canción.", "te gusta", ["te gusta", "te gustan", "le gusta", "me gustan"], "A ti te gusta. Canción es singular."),
    ],
    5: [
      Q("Ayer yo ___ pizza.", "comí", ["comí", "comía", "como", "comeré"], "Ayer + acción terminada = pretérito: comí."),
      Q("De niño, yo ___ al parque cada sábado.", "iba", ["iba", "fui", "voy", "iré"], "Hábito del pasado = imperfecto: iba."),
      Q("Anoche nosotros ___ una película.", "vimos", ["vimos", "veíamos", "vemos", "veremos"], "Anoche, una vez = pretérito: vimos."),
      Q("Mientras ella ___, yo cocinaba.", "leía", ["leía", "leyó", "lee", "leerá"], "Mientras = acción en progreso: imperfecto, leía."),
      Q("El año pasado ellos ___ a México.", "fueron", ["fueron", "iban", "van", "irán"], "Un viaje terminado = pretérito: fueron."),
      Q("La casa de mi abuela ___ enorme.", "era", ["era", "fue", "es", "será"], "Descripción del pasado = imperfecto: era."),
      Q("De repente ___ el teléfono.", "sonó", ["sonó", "sonaba", "suena", "sonará"], "De repente = acción puntual: pretérito, sonó."),
      Q("De niños, nosotros siempre ___ en la calle.", "jugábamos", ["jugábamos", "jugamos", "juegan", "jugaremos"], "Siempre, en aquella época = imperfecto: jugábamos."),
      Q("Ayer tú ___ tarde.", "llegaste", ["llegaste", "llegabas", "llegas", "llegarás"], "Ayer = pretérito: llegaste."),
      Q("Cuando era pequeño, ___ un perro.", "tenía", ["tenía", "tuve", "tengo", "tendré"], "Lo que tenías por un tiempo = imperfecto: tenía."),
      Q("El martes pasado yo ___ la tarea.", "hice", ["hice", "hacía", "hago", "haré"], "Un día pasado y terminado = pretérito: hice."),
      Q("A las ocho, ellos ___ en clase.", "estaban", ["estaban", "estuvieron", "están", "estarán"], "A una hora, la escena de fondo = imperfecto: estaban."),
      Q("De niños, mis padres ___ en Cuba.", "vivían", ["vivían", "vivieron", "viven", "vivirán"], "Una situación continua del pasado = imperfecto: vivían."),
      Q("Yo ___ a Ana ayer.", "vi", ["vi", "veía", "veo", "veré"], "Ayer, un encuentro = pretérito: vi."),
      Q("Antes no ___ computadoras.", "había", ["había", "hubo", "hay", "habrá"], "Descripción de cómo era el mundo = imperfecto: había."),
      Q("Una vez nosotros ___ la montaña.", "subimos", ["subimos", "subíamos", "suben", "subiremos"], "Una vez = pretérito: subimos."),
    ],
  };

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function block(x, y, w, h, stone) {
    var health = stone ? 130 : 46;
    return {
      x: x, y: y, w: w, h: h, stone: !!stone, health: health, max: health,
      mass: stone ? 3.2 : 1, vx: 0, vy: 0, awake: false, scored: false,
    };
  }

  function blob(x, y) {
    return { x: x, y: y, r: 18, health: 34, vx: 0, vy: 0, awake: false, alive: true, scored: false };
  }

  function forts() {
    return [
      {
        blocks: [block(600, 368, 18, 100), block(800, 368, 18, 100), block(590, 352, 230, 16)],
        enemies: [blob(660, 334), blob(710, 334), blob(760, 334)],
      },
      {
        blocks: [
          block(540, 368, 18, 100), block(650, 368, 18, 100), block(530, 352, 150, 16),
          block(760, 388, 18, 80, true), block(860, 388, 18, 80, true), block(750, 372, 140, 16),
        ],
        enemies: [blob(590, 334), blob(640, 334), blob(800, 354), blob(850, 354)],
      },
      {
        blocks: [
          block(560, 368, 18, 100), block(700, 368, 18, 100), block(840, 368, 18, 100),
          block(550, 352, 180, 16), block(730, 352, 140, 16),
          block(630, 268, 18, 84), block(760, 268, 18, 84), block(620, 252, 170, 16),
        ],
        enemies: [blob(640, 334), blob(800, 334), blob(700, 234), blob(900, 450)],
      },
      {
        blocks: [
          block(560, 400, 22, 68, true), block(820, 400, 22, 68, true), block(548, 384, 300, 16, true),
          block(620, 300, 16, 84), block(760, 300, 16, 84), block(600, 284, 190, 16),
        ],
        enemies: [blob(660, 266), blob(730, 266), blob(690, 366), blob(900, 450)],
      },
      {
        blocks: [
          block(530, 368, 16, 100), block(670, 368, 16, 100), block(810, 368, 16, 100),
          block(520, 352, 170, 16), block(690, 352, 150, 16),
          block(590, 268, 16, 84), block(750, 268, 16, 84), block(575, 252, 200, 16),
        ],
        enemies: [blob(580, 334), blob(640, 334), blob(740, 334), blob(800, 334), blob(680, 234)],
      },
      {
        blocks: [
          block(520, 400, 20, 68, true), block(680, 400, 20, 68, true), block(860, 400, 20, 68, true),
          block(510, 384, 190, 16, true), block(710, 384, 180, 16),
          block(560, 300, 16, 84), block(650, 300, 16, 84), block(780, 300, 16, 84),
          block(548, 284, 130, 16), block(760, 284, 120, 16),
        ],
        enemies: [blob(600, 266), blob(640, 366), blob(800, 266), blob(830, 366), blob(470, 450), blob(930, 450)],
      },
    ];
  }

  function makeWorld(index) {
    var src = forts()[index];
    return {
      time: 0,
      birds: [],
      particles: [],
      blocks: src.blocks.map(function (b) {
        return {
          x: b.x, y: b.y, w: b.w, h: b.h, stone: b.stone, health: b.health, max: b.max,
          mass: b.mass, vx: 0, vy: 0, awake: false, scored: false,
        };
      }),
      enemies: src.enemies.map(function (e) {
        return { x: e.x, y: e.y, r: e.r, health: e.health, vx: 0, vy: 0, awake: false, alive: true, scored: false };
      }),
      onScore: null,
    };
  }

  function addScore(world, amount) {
    if (world.onScore) world.onScore(amount);
  }

  function burst(world, x, y, color) {
    for (var i = 0; i < 8; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = 40 + Math.random() * 180;
      world.particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45, color: color });
    }
  }

  function boxSupported(box, blocks) {
    var bottom = box.y + box.h;
    if (bottom >= GROUND - 2) return true;
    for (var i = 0; i < blocks.length; i++) {
      var other = blocks[i];
      if (other === box || other.health <= 0) continue;
      var overlap = Math.min(box.x + box.w, other.x + other.w) - Math.max(box.x, other.x);
      if (overlap > 8 && Math.abs(other.y - bottom) <= 5) return true;
    }
    return false;
  }

  function circleSupported(circle, blocks) {
    if (circle.y + circle.r >= GROUND - 3) return true;
    var bottom = circle.y + circle.r;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.health <= 0) continue;
      if (Math.abs(b.y - bottom) <= 6 && circle.x >= b.x + 2 && circle.x <= b.x + b.w - 2) return true;
    }
    return false;
  }

  function hurtEnemy(world, enemy, amount) {
    if (!enemy.alive) return;
    enemy.health -= amount;
    if (enemy.health <= 0) {
      enemy.alive = false;
      if (!enemy.scored) {
        enemy.scored = true;
        addScore(world, 500);
      }
      burst(world, enemy.x, enemy.y, "#b44dff");
    }
  }

  function killBlock(world, box) {
    if (box.health > 0 || box.scored) return;
    box.scored = true;
    addScore(world, 50);
    burst(world, box.x + box.w / 2, box.y + box.h / 2, box.stone ? "#9aa3b2" : "#c4843a");
  }

  function hitCircleBox(world, circle, box, dmgMul, bounce) {
    if (box.health <= 0) return;
    var closestX = clamp(circle.x, box.x, box.x + box.w);
    var closestY = clamp(circle.y, box.y, box.y + box.h);
    var dx = circle.x - closestX;
    var dy = circle.y - closestY;
    var dist = Math.hypot(dx, dy);
    if (dist > circle.r && dist > 0.001) return;
    var nx;
    var ny;
    if (dist < 0.001) {
      var left = circle.x - box.x;
      var right = box.x + box.w - circle.x;
      var top = circle.y - box.y;
      var bottom = box.y + box.h - circle.y;
      var minSide = Math.min(left, right, top, bottom);
      nx = minSide === left ? -1 : minSide === right ? 1 : 0;
      ny = minSide === top ? -1 : minSide === bottom ? 1 : 0;
      if (nx === 0 && ny === 0) ny = -1;
      dist = 0.001;
    } else {
      nx = dx / dist;
      ny = dy / dist;
    }
    var overlap = circle.r - Math.min(dist, circle.r);
    circle.x += nx * overlap;
    circle.y += ny * overlap;
    var vn = circle.vx * nx + circle.vy * ny;
    if (vn < 0) {
      circle.vx -= (1 + bounce) * vn * nx;
      circle.vy -= (1 + bounce) * vn * ny;
      var impact = -vn;
      box.health -= impact * 0.055 * dmgMul;
      box.awake = true;
      var push = impact * 0.22 / box.mass;
      box.vx -= nx * push;
      box.vy -= ny * push;
      killBlock(world, box);
    }
  }

  function hitBirdEnemy(world, bird, enemy) {
    if (!enemy.alive) return;
    var dx = bird.x - enemy.x;
    var dy = bird.y - enemy.y;
    var dist = Math.hypot(dx, dy) || 0.001;
    var min = bird.r + enemy.r;
    if (dist > min) return;
    var nx = dx / dist;
    var ny = dy / dist;
    var overlap = min - dist;
    bird.x += nx * overlap;
    bird.y += ny * overlap;
    var vn = (bird.vx - enemy.vx) * nx + (bird.vy - enemy.vy) * ny;
    if (vn < 0) {
      var bounce = KINDS[bird.kind].rest;
      bird.vx -= (1 + bounce) * vn * nx;
      bird.vy -= (1 + bounce) * vn * ny;
      enemy.awake = true;
      enemy.vx -= nx * vn * 0.4;
      enemy.vy -= ny * vn * 0.4;
      hurtEnemy(world, enemy, -vn * 0.045 * KINDS[bird.kind].dmg);
    }
  }

  function separateCircleBox(circle, box) {
    if (box.health <= 0) return;
    var closestX = clamp(circle.x, box.x, box.x + box.w);
    var closestY = clamp(circle.y, box.y, box.y + box.h);
    var dx = circle.x - closestX;
    var dy = circle.y - closestY;
    var dist = Math.hypot(dx, dy);
    if (dist >= circle.r) return;
    var nx = dist < 0.001 ? 0 : dx / dist;
    var ny = dist < 0.001 ? -1 : dy / dist;
    circle.x += nx * (circle.r - dist);
    circle.y += ny * (circle.r - dist);
  }

  function stepOnce(world, dt) {
    var blocks = world.blocks;
    blocks.forEach(function (box) {
      if (box.health > 0 && !box.awake && !boxSupported(box, blocks)) box.awake = true;
    });
    world.enemies.forEach(function (enemy) {
      if (enemy.alive && !enemy.awake && !circleSupported(enemy, blocks)) enemy.awake = true;
    });

    world.birds.forEach(function (bird) {
      if (!bird.alive || bird.resting) return;
      bird.vy += GRAVITY * dt;
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      if (bird.y + bird.r > GROUND) {
        bird.y = GROUND - bird.r;
        if (bird.vy > 80) bird.vy = -bird.vy * KINDS[bird.kind].rest;
        else bird.vy = 0;
        bird.vx *= 0.72;
        if (Math.abs(bird.vx) < 36 && Math.abs(bird.vy) < 36) {
          bird.vx = 0;
          bird.vy = 0;
          bird.resting = true;
        }
      }
      if (bird.x < -120 || bird.x > W + 120) bird.alive = false;
      blocks.forEach(function (box) {
        hitCircleBox(world, bird, box, KINDS[bird.kind].dmg, KINDS[bird.kind].rest);
      });
      world.enemies.forEach(function (enemy) { hitBirdEnemy(world, bird, enemy); });
    });

    blocks.forEach(function (box) {
      if (box.health <= 0 || !box.awake) return;
      box.vy += GRAVITY * dt;
      box.x += box.vx * dt;
      box.y += box.vy * dt;
      box.vx *= 0.992;
      if (box.y + box.h > GROUND) {
        box.y = GROUND - box.h;
        if (box.vy > 80) box.health -= box.vy * 0.015;
        box.vy = 0;
        box.vx *= 0.55;
        killBlock(world, box);
      }
      if (Math.hypot(box.vx, box.vy) < 28 && boxSupported(box, blocks)) {
        box.vx = 0;
        box.vy = 0;
        box.awake = false;
      }
    });

    world.enemies.forEach(function (enemy) {
      if (!enemy.alive || !enemy.awake) return;
      enemy.vy += GRAVITY * dt;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.y + enemy.r > GROUND) {
        var impact = enemy.vy;
        enemy.y = GROUND - enemy.r;
        enemy.vy = 0;
        enemy.vx *= 0.6;
        if (impact > 420) hurtEnemy(world, enemy, impact * 0.04);
      }
      if (enemy.y > H + 30) hurtEnemy(world, enemy, 999);
      blocks.forEach(function (box) {
        if (box.health <= 0) return;
        if (box.awake && box.vy > 160) {
          var dx = enemy.x - (box.x + box.w / 2);
          var dy = enemy.y - (box.y + box.h / 2);
          if (Math.hypot(dx, dy) < enemy.r + Math.max(box.w, box.h) * 0.45) {
            hurtEnemy(world, enemy, box.vy * 0.03);
          }
        }
        separateCircleBox(enemy, box);
      });
      if (Math.hypot(enemy.vx, enemy.vy) < 28 && circleSupported(enemy, blocks)) {
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.awake = false;
      }
    });

    world.particles.forEach(function (p) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * 0.3 * dt;
    });
    world.particles = world.particles.filter(function (p) { return p.life > 0; });
  }

  function step(world, dt) {
    world.time += dt;
    var slices = 4;
    for (var i = 0; i < slices; i++) stepOnce(world, dt / slices);
  }

  function makeBird(kind, x, y, vx, vy) {
    var spec = KINDS[kind] || KINDS.plain;
    return {
      kind: kind, x: x, y: y, vx: vx, vy: vy, r: spec.r,
      alive: true, resting: false, used: kind === "plain" || kind === "big",
    };
  }

  function launchBird(world, kind, x, y, vx, vy) {
    var bird = makeBird(kind, x, y, vx, vy);
    world.birds.push(bird);
    world.time = 0;
    return bird;
  }

  function explodeBird(world, bird) {
    if (!bird || !bird.alive || bird.used) return false;
    bird.used = true;
    var radius = 175;
    burst(world, bird.x, bird.y, "#ff9a3c");
    world.enemies.forEach(function (enemy) {
      if (!enemy.alive) return;
      var dx = enemy.x - bird.x;
      var dy = enemy.y - bird.y;
      var dist = Math.hypot(dx, dy) || 1;
      if (dist < radius) {
        var power = 1 - dist / radius;
        hurtEnemy(world, enemy, 42 + power * 40);
        enemy.awake = true;
        enemy.vx += (dx / dist) * 520 * power;
        enemy.vy += (dy / dist) * 420 * power - 180;
      }
    });
    world.blocks.forEach(function (box) {
      if (box.health <= 0) return;
      var cx = box.x + box.w / 2;
      var cy = box.y + box.h / 2;
      var dx = cx - bird.x;
      var dy = cy - bird.y;
      var dist = Math.hypot(dx, dy) || 1;
      if (dist < radius) {
        var power = 1 - dist / radius;
        box.health -= 36 + power * 80;
        box.awake = true;
        box.vx += (dx / dist) * 460 * power;
        box.vy += (dy / dist) * 360 * power - 160;
        killBlock(world, box);
      }
    });
    bird.alive = false;
    return true;
  }

  function splitBird(world, bird) {
    if (!bird || !bird.alive || bird.used) return false;
    bird.used = true;
    var speed = Math.hypot(bird.vx, bird.vy) || 420;
    var angle = Math.atan2(bird.vy, bird.vx);
    [-0.45, 0.45].forEach(function (delta) {
      world.birds.push(makeBird(
        "plain",
        bird.x,
        bird.y,
        Math.cos(angle + delta) * speed,
        Math.sin(angle + delta) * speed
      ));
    });
    return true;
  }

  function moving(body) {
    return Math.hypot(body.vx, body.vy) > 36;
  }

  function settled(world) {
    if (world.time < 0.35) return false;
    if (world.birds.some(function (bird) { return bird.alive && !bird.resting; })) return false;
    if (world.blocks.some(function (box) { return box.health > 0 && box.awake && moving(box); })) return false;
    if (world.enemies.some(function (enemy) { return enemy.alive && enemy.awake && moving(enemy); })) return false;
    return true;
  }

  function enemiesLeft(world) {
    return world.enemies.filter(function (enemy) { return enemy.alive; }).length;
  }

  function auditQuestions() {
    var problems = [];
    Object.keys(QUESTIONS).forEach(function (level) {
      QUESTIONS[level].forEach(function (q, index) {
        if (!q.choices || q.choices.length !== 4) problems.push(level + ":" + index + " count");
        if (q.choices.indexOf(q.answer) < 0) problems.push(level + ":" + index + " missing");
        var seen = {};
        q.choices.forEach(function (choice) {
          seen[choice] = (seen[choice] || 0) + 1;
        });
        Object.keys(seen).forEach(function (choice) {
          if (seen[choice] > 1) problems.push(level + ":" + index + " dup " + choice);
        });
      });
    });
    return problems;
  }

  function countUnstable(world) {
    var unstable = world.blocks.filter(function (box) { return box.health > 0 && !boxSupported(box, world.blocks); }).length;
    unstable += world.enemies.filter(function (enemy) { return enemy.alive && !circleSupported(enemy, world.blocks); }).length;
    return unstable;
  }

  function simulateShot(fortIndex, angle, power) {
    var world = makeWorld(fortIndex);
    var speed = MAX_PULL * LAUNCH_SCALE * power;
    launchBird(world, "mega", SLING.x, SLING.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
    var exploded = false;
    var maxX = SLING.x;
    for (var frame = 0; frame < 360; frame++) {
      step(world, 1 / 60);
      world.birds.forEach(function (bird) {
        if (bird.x > maxX) maxX = bird.x;
        if (!exploded && bird.kind === "mega" && bird.alive && bird.x > 620 && bird.y < 380) {
          exploded = explodeBird(world, bird);
        }
      });
    }
    for (var extra = 0; extra < 180 && !settled(world); extra++) step(world, 1 / 60);
    return {
      exploded: exploded,
      maxX: Math.round(maxX),
      enemiesLeft: enemiesLeft(world),
    };
  }

  function simulateClear() {
    var world = makeWorld(0);
    var startBlocks = world.blocks[0].y;
    var startEnemies = enemiesLeft(world);
    var unstable = countUnstable(world);
    for (var i = 0; i < 90; i++) step(world, 1 / 60);
    var idleMoved = world.blocks[0].y !== startBlocks || enemiesLeft(world) !== startEnemies;
    var shot = simulateShot(0, -0.7, 0.9);
    return {
      idleMoved: idleMoved,
      unstable: unstable,
      exploded: shot.exploded,
      maxX: shot.maxX,
      enemiesLeft: shot.enemiesLeft,
      startEnemies: startEnemies,
    };
  }

  function auditForts() {
    return forts().map(function (_fort, index) {
      var world = makeWorld(index);
      var unstable = countUnstable(world);
      var start = enemiesLeft(world);
      for (var i = 0; i < 120; i++) step(world, 1 / 60);
      return {
        fort: index + 1,
        unstable: unstable,
        fell: enemiesLeft(world) !== start,
        enemies: enemiesLeft(world),
      };
    });
  }

  var api = {
    boot: boot,
    simulateClear: simulateClear,
    simulateShot: simulateShot,
    auditForts: auditForts,
    auditQuestions: auditQuestions,
    questions: QUESTIONS,
    getState: function () { return null; },
    launch: function () {},
    power: function () {},
  };

  function boot() {
    var canvas = document.getElementById("c");
    var ctx = canvas.getContext("2d");
    var els = {};
    ["fortLabel", "score", "enemies", "birdsLeft", "streak", "banner", "prompt", "zones", "marker", "now", "zoneLabel", "answers", "why", "hintline", "overlay", "launchBtn", "soundBtn"].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
    var state = {
      phase: "menu",
      paused: false,
      sound: true,
      spanishLevel: 1,
      fort: 0,
      score: 0,
      streak: 0,
      birdsLeft: 0,
      kind: null,
      world: null,
      q: null,
      deck: [],
      lastPrompt: "",
      qStart: 0,
      explainUntil: 0,
      angle: -0.7,
      power: 0.9,
      dragging: false,
      pull: null,
      settledLock: false,
    };
    var audioCtx = null;
    var last = 0;
    var clouds = [
      { x: 120, y: 70, s: 1 },
      { x: 420, y: 48, s: 0.8 },
      { x: 700, y: 90, s: 1.1 },
    ];

    document.querySelectorAll(".tog").forEach(function (button) {
      button.addEventListener("click", function () {
        var group = button.getAttribute("data-group");
        document.querySelectorAll('.tog[data-group="' + group + '"]').forEach(function (other) {
          other.setAttribute("aria-pressed", "false");
        });
        button.setAttribute("aria-pressed", "true");
      });
    });
    document.getElementById("start").addEventListener("click", startGame);
    document.getElementById("again").addEventListener("click", startGame);
    document.getElementById("retry").addEventListener("click", function () { beginFort(false); });
    document.getElementById("nextFort").addEventListener("click", function () {
      state.fort += 1;
      if (state.fort >= 6) { showVictory(); return; }
      beginFort(false);
    });
    ["quit", "clearMenu", "failMenu", "wonMenu"].forEach(function (id) {
      document.getElementById(id).addEventListener("click", showMenu);
    });
    document.getElementById("resume").addEventListener("click", function () { setPaused(false); });
    document.getElementById("pauseBtn").addEventListener("click", function () {
      if (state.phase === "menu") return;
      setPaused(!state.paused);
    });
    els.soundBtn.addEventListener("click", function () {
      state.sound = !state.sound;
      els.soundBtn.textContent = state.sound ? "SONIDO SÍ" : "SONIDO NO";
      els.soundBtn.setAttribute("aria-pressed", state.sound ? "true" : "false");
    });
    els.launchBtn.addEventListener("click", function () {
      if (state.phase === "aim") launchFromAngle(state.angle, state.power);
    });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("keydown", onKey);

    api.getState = function () {
      return {
        phase: state.paused ? "pause" : state.phase,
        answer: state.q ? state.q.answer : null,
        prompt: state.q ? state.q.prompt : "",
        fort: state.fort + 1,
        enemies: state.world ? enemiesLeft(state.world) : 0,
        birds: state.birdsLeft,
        score: state.score,
        streak: state.streak,
        kind: state.kind,
        spanishLevel: state.spanishLevel,
        bird: activeBird(),
      };
    };
    function activeBird() {
      if (!state.world) return null;
      var bird = null;
      state.world.birds.forEach(function (item) {
        if (!bird && item.alive && !item.resting) bird = item;
      });
      if (!bird) return null;
      return { x: Math.round(bird.x), y: Math.round(bird.y), kind: bird.kind };
    }

    api.launch = function (angle, power) {
      if (state.phase !== "aim") return false;
      launchFromAngle(angle, power);
      return true;
    };
    api.power = function () { return doPower(); };

    requestAnimationFrame(loop);

    function loop(now) {
      requestAnimationFrame(loop);
      var dt = last ? Math.min(0.033, (now - last) / 1000) : 0.016;
      last = now;
      if (!state.paused) {
        if (state.phase === "question") updateTimer(now);
        if (state.phase === "explain" && now >= state.explainUntil) beginAim();
        if (state.phase === "flight" && state.world) {
          step(state.world, dt);
          if (!state.settledLock && (settled(state.world) || state.world.time > 8)) finishFlight();
        }
        clouds.forEach(function (cloud) {
          cloud.x += dt * 8;
          if (cloud.x > W + 80) cloud.x = -80;
        });
      }
      if (state.phase !== "menu") draw();
    }

    function selected(group) {
      var button = document.querySelector('.tog[data-group="' + group + '"][aria-pressed="true"]');
      return Number(button.getAttribute("data-value"));
    }

    function startGame() {
      unlockAudio();
      state.spanishLevel = selected("level");
      state.fort = selected("fort") - 1;
      state.score = 0;
      state.streak = 0;
      state.deck = [];
      state.paused = false;
      beginFort(true);
      beep(520, 0.06, "square");
    }

    function beginFort() {
      state.world = makeWorld(state.fort);
      state.world.onScore = function (amount) {
        state.score += amount;
        paintHud();
      };
      state.birdsLeft = state.world.enemies.length + 2;
      state.kind = null;
      state.settledLock = false;
      hideOverlay();
      paintHud();
      ask();
    }

    function ask() {
      state.phase = "question";
      state.kind = null;
      state.pull = null;
      if (!state.deck.length) state.deck = shuffle(QUESTIONS[state.spanishLevel].slice());
      var next = state.deck.pop();
      if (next.prompt === state.lastPrompt && state.deck.length) {
        state.deck.unshift(next);
        next = state.deck.pop();
      }
      state.lastPrompt = next.prompt;
      state.q = { prompt: next.prompt, answer: next.answer, why: next.why, choices: shuffle(next.choices.slice()) };
      state.qStart = performance.now();
      els.banner.textContent = "RESPONDE PARA CARGAR TU LORO";
      els.prompt.textContent = state.q.prompt;
      els.zones.hidden = false;
      els.now.hidden = false;
      els.why.hidden = true;
      els.hintline.textContent = "";
      els.launchBtn.disabled = true;
      renderChoices();
      paintHud();
    }

    function renderChoices() {
      els.answers.hidden = false;
      els.answers.replaceChildren();
      state.q.choices.forEach(function (choice, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "ab";
        button.dataset.i = String(index);
        button.dataset.choice = choice;
        button.style.setProperty("--bc", COLORS[index]);
        var key = document.createElement("span");
        key.className = "k";
        key.textContent = String(index + 1);
        var label = document.createElement("span");
        label.textContent = choice;
        button.append(key, label);
        button.addEventListener("click", function () { pick(choice); });
        els.answers.appendChild(button);
      });
    }

    function updateTimer(now) {
      var ratio = clamp((now - state.qStart) / QTIME, 0, 1);
      els.marker.style.left = "calc(" + (ratio * 100) + "% - 2px)";
      var zone = zoneAt(ratio);
      els.zoneLabel.textContent = zone.name;
      els.zoneLabel.style.color = zone.color;
      if (ratio >= 1) pick("");
    }

    function zoneAt(ratio) {
      if (ratio < 0.3) return { id: "mega", name: "MEGA · ¡BOOM!", color: "#ff9a3c", tier: 3 };
      if (ratio < 0.64) return { id: "super", name: "SÚPER · TRÍO", color: "#d46bff", tier: 2 };
      return { id: "big", name: "GRANDE · ROCA", color: "#3dfff3", tier: 1 };
    }

    function pick(choice) {
      if (state.phase !== "question") return;
      var ok = choice === state.q.answer;
      var ratio = clamp((performance.now() - state.qStart) / QTIME, 0, 1);
      document.querySelectorAll(".ab").forEach(function (button) { button.disabled = true; });
      if (ok) {
        state.streak += 1;
        var tier = zoneAt(ratio >= 1 ? 0.99 : ratio).tier;
        if (state.streak >= 3) tier = Math.min(3, tier + 1);
        state.kind = ["", "big", "super", "mega"][tier];
        state.score += 80 + tier * 40;
        beep(660, 0.07, "square");
        setTimeout(function () { beep(880, 0.08, "square"); }, 80);
        els.why.hidden = false;
        els.why.textContent = "¡Sí! " + KINDS[state.kind].label + (state.streak >= 3 ? " · la racha sube el loro" : "");
        state.phase = "explain";
        state.explainUntil = performance.now() + 420;
      } else {
        state.streak = 0;
        state.kind = "plain";
        beep(150, 0.12, "sawtooth");
        els.why.hidden = false;
        els.why.textContent = (choice ? "Casi. " : "Se acabó el tiempo. ") + "La respuesta es " + state.q.answer + ". " + state.q.why;
        state.phase = "explain";
        state.explainUntil = performance.now() + 1700;
      }
      els.answers.hidden = true;
      els.now.hidden = true;
      paintHud();
    }

    function beginAim() {
      if (state.phase !== "explain" && state.phase !== "question") return;
      state.phase = "aim";
      state.pull = { x: -Math.cos(state.angle) * MAX_PULL * state.power, y: -Math.sin(state.angle) * MAX_PULL * state.power };
      els.banner.textContent = "LORO LISTO: " + KINDS[state.kind].label;
      els.zones.hidden = true;
      els.now.hidden = true;
      els.answers.hidden = true;
      els.why.hidden = true;
      els.prompt.textContent = "";
      els.hintline.textContent = state.kind === "mega" || state.kind === "super"
        ? "Arrastra y suelta. En el aire, toca para el poder."
        : "Arrastra en el campo y suelta para lanzar.";
      els.launchBtn.disabled = false;
      paintHud();
    }

    function canvasPoint(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height,
      };
    }

    function onPointerDown(event) {
      if (state.paused) return;
      if (state.phase === "flight") {
        doPower();
        return;
      }
      if (state.phase !== "aim") return;
      state.dragging = true;
      state.dragOrigin = canvasPoint(event);
      state.dragMoved = 0;
      canvas.setPointerCapture(event.pointerId);
      setPull(state.dragOrigin);
    }

    function onPointerMove(event) {
      if (!state.dragging || state.phase !== "aim") return;
      var point = canvasPoint(event);
      state.dragMoved = Math.max(state.dragMoved, Math.hypot(point.x - state.dragOrigin.x, point.y - state.dragOrigin.y));
      setPull(point);
    }

    function onPointerUp(event) {
      if (!state.dragging) return;
      state.dragging = false;
      if (state.phase !== "aim") return;
      if (state.dragMoved < 8) return;
      var len = Math.hypot(state.pull.x, state.pull.y);
      if (len > 22) {
        launchVelocity(-state.pull.x * LAUNCH_SCALE, -state.pull.y * LAUNCH_SCALE);
      }
    }

    function setPull(point) {
      var dx = point.x - SLING.x;
      var dy = point.y - SLING.y;
      if (dx > 24) dx = 24;
      var len = Math.hypot(dx, dy) || 1;
      var scale = Math.min(MAX_PULL, len) / len;
      state.pull = { x: dx * scale, y: dy * scale };
      state.power = Math.hypot(state.pull.x, state.pull.y) / MAX_PULL;
      state.angle = Math.atan2(-state.pull.y, -state.pull.x);
    }

    function launchFromAngle(angle, power) {
      var speed = MAX_PULL * LAUNCH_SCALE * clamp(power, 0.2, 1);
      launchVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    function launchVelocity(vx, vy) {
      if (state.phase !== "aim" || state.birdsLeft <= 0) return;
      state.birdsLeft -= 1;
      launchBird(state.world, state.kind, SLING.x, SLING.y, vx, vy);
      state.phase = "flight";
      state.settledLock = false;
      state.pull = null;
      els.launchBtn.disabled = true;
      els.banner.textContent = state.kind === "mega" || state.kind === "super" ? "TOCA EN EL AIRE PARA EL PODER" : "¡AHÍ VA!";
      els.hintline.textContent = "";
      beepSlide(220, 640, 0.12);
      paintHud();
    }

    function doPower() {
      if (state.phase !== "flight" || !state.world) return false;
      var bird = null;
      state.world.birds.forEach(function (item) {
        if (!bird && item.alive && !item.resting && !item.used && (item.kind === "mega" || item.kind === "super")) bird = item;
      });
      if (!bird) return false;
      var used = bird.kind === "mega" ? explodeBird(state.world, bird) : splitBird(state.world, bird);
      if (used) beep(bird.kind === "mega" ? 90 : 740, 0.1, "square");
      return used;
    }

    function finishFlight() {
      state.settledLock = true;
      var left = enemiesLeft(state.world);
      paintHud();
      if (left <= 0) fortCleared();
      else if (state.birdsLeft <= 0) fortFailed();
      else ask();
    }

    function fortCleared() {
      var stars = state.birdsLeft;
      var bonus = stars * 300;
      state.score += bonus;
      paintHud();
      if (state.fort >= 5) {
        showVictory();
        return;
      }
      state.phase = "cleared";
      document.getElementById("clearTitle").textContent = "¡FUERTE " + (state.fort + 1) + " LIMPIO!";
      document.getElementById("clearBody").textContent = "Loros sin usar: " + stars + "\nEstrellas: " + starText(stars) + "\n+" + bonus + " puntos";
      showCover("cleared");
      beep(523, 0.08, "square");
    }

    function fortFailed() {
      state.phase = "failed";
      state.streak = 0;
      showCover("failed");
      beep(110, 0.16, "sawtooth");
    }

    function showVictory() {
      state.phase = "won";
      document.getElementById("wonBody").textContent = "Seis fuertes limpios.\nPuntos: " + state.score;
      showCover("won");
      beep(523, 0.08, "square");
      setTimeout(function () { beep(659, 0.08, "square"); }, 90);
      setTimeout(function () { beep(784, 0.12, "square"); }, 180);
    }

    function starText(count) {
      var text = "";
      for (var i = 0; i < count; i++) text += "★";
      return text || "—";
    }

    function showMenu() {
      state.phase = "menu";
      state.paused = false;
      showSheet("menu");
      els.launchBtn.disabled = true;
    }

    function setPaused(paused) {
      if (state.phase === "menu") return;
      state.paused = paused;
      if (paused) showCover("paused");
      else hideOverlay();
    }

    function showSheet(id) {
      ["menu", "paused", "cleared", "failed", "won"].forEach(function (name) {
        document.getElementById(name).hidden = name !== id;
      });
      els.overlay.className = "show sheet";
    }

    function showCover(id) {
      ["menu", "paused", "cleared", "failed", "won"].forEach(function (name) {
        document.getElementById(name).hidden = name !== id;
      });
      els.overlay.className = "show cover";
    }

    function hideOverlay() {
      els.overlay.className = "";
      ["menu", "paused", "cleared", "failed", "won"].forEach(function (name) {
        document.getElementById(name).hidden = true;
      });
    }

    function paintHud() {
      els.fortLabel.textContent = (state.fort + 1) + "/6";
      els.score.textContent = String(state.score).padStart(6, "0");
      els.enemies.textContent = String(state.world ? enemiesLeft(state.world) : 0);
      els.birdsLeft.textContent = String(state.birdsLeft);
      els.streak.textContent = String(state.streak);
    }

    function onKey(event) {
      if (event.key === "p" || event.key === "P") {
        if (state.phase !== "menu") setPaused(!state.paused);
        return;
      }
      if (state.paused) {
        if (event.key === "Escape") setPaused(false);
        return;
      }
      if (state.phase === "question" && /^[1-4]$/.test(event.key)) {
        var button = document.querySelector('.ab[data-i="' + (Number(event.key) - 1) + '"]');
        if (button && !button.disabled) button.click();
      }
      if (state.phase === "aim") {
        if (event.key === "ArrowLeft") state.angle -= 0.05;
        if (event.key === "ArrowRight") state.angle += 0.05;
        if (event.key === "ArrowUp") state.power = Math.min(1, state.power + 0.04);
        if (event.key === "ArrowDown") state.power = Math.max(0.25, state.power - 0.04);
        if (event.key.indexOf("Arrow") === 0) {
          event.preventDefault();
          state.angle = clamp(state.angle, -1.15, 0.2);
          state.pull = {
            x: -Math.cos(state.angle) * MAX_PULL * state.power,
            y: -Math.sin(state.angle) * MAX_PULL * state.power,
          };
        }
        if (event.key === " ") {
          event.preventDefault();
          launchFromAngle(state.angle, state.power);
        }
      }
      if (state.phase === "flight" && event.key === " ") {
        event.preventDefault();
        doPower();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, "#8fd4ff");
      sky.addColorStop(1, "#d7f2ff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      clouds.forEach(drawCloud);
      drawHills();
      ctx.fillStyle = "#3f9d45";
      ctx.fillRect(0, GROUND - 8, W, H - GROUND + 8);
      ctx.fillStyle = "#2f7d34";
      ctx.fillRect(0, GROUND + 18, W, H);
      if (state.world) {
        state.world.blocks.forEach(drawBlock);
        state.world.enemies.forEach(drawEnemy);
      }
      var pouch = null;
      if (state.phase === "aim" && state.pull) pouch = { x: SLING.x + state.pull.x, y: SLING.y + state.pull.y };
      drawSling(pouch);
      if (state.phase === "aim" && state.kind) {
        drawBird(pouch || SLING, state.kind);
        drawDots(pouch || SLING);
      }
      if (state.world) {
        state.world.birds.forEach(function (bird) {
          if (bird.alive) drawBird(bird, bird.kind);
        });
        state.world.particles.forEach(function (p) {
          ctx.globalAlpha = Math.max(0, p.life * 2);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 4, 4);
          ctx.globalAlpha = 1;
        });
      }
      if (state.phase === "question") {
        ctx.fillStyle = "#16324a";
        ctx.font = "28px VT323, monospace";
        ctx.textAlign = "center";
        ctx.fillText("RESPONDE PARA CARGAR TU LORO", W / 2, 150);
        ctx.font = "20px VT323, monospace";
        ctx.fillText("LA PREGUNTA ESTÁ ABAJO", W / 2, 178);
      }
    }

    function drawCloud(cloud) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, 36 * cloud.s, 16 * cloud.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + 24 * cloud.s, cloud.y + 4, 24 * cloud.s, 12 * cloud.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawHills() {
      ctx.fillStyle = "#46b14d";
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.quadraticCurveTo(180, 300, 360, GROUND);
      ctx.quadraticCurveTo(560, 250, 780, GROUND);
      ctx.quadraticCurveTo(880, 390, W, GROUND);
      ctx.fill();
      ctx.fillStyle = "#2f9a3a";
      ctx.beginPath();
      ctx.moveTo(0, GROUND);
      ctx.quadraticCurveTo(240, 360, 520, GROUND);
      ctx.quadraticCurveTo(700, 400, W, 430);
      ctx.lineTo(W, GROUND);
      ctx.fill();
    }

    function drawSling(pouch) {
      ctx.strokeStyle = "#6b3d1c";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(SLING.x - 16, GROUND);
      ctx.lineTo(SLING.x - 8, SLING.y - 52);
      ctx.moveTo(SLING.x + 18, GROUND);
      ctx.lineTo(SLING.x + 10, SLING.y - 44);
      ctx.stroke();
      if (pouch) {
        ctx.strokeStyle = "#2a140c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(SLING.x - 8, SLING.y - 52);
        ctx.lineTo(pouch.x, pouch.y);
        ctx.lineTo(SLING.x + 10, SLING.y - 44);
        ctx.stroke();
      }
    }

    function drawBlock(box) {
      if (box.health <= 0) return;
      ctx.fillStyle = box.stone ? "#8e97a8" : "#d08a3e";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = box.stone ? "#5e6778" : "#8a4e18";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
      if (!box.stone) {
        ctx.strokeStyle = "#f0c27a";
        ctx.beginPath();
        ctx.moveTo(box.x + 4, box.y + box.h / 2);
        ctx.lineTo(box.x + box.w - 4, box.y + box.h / 2);
        ctx.stroke();
      }
    }

    function drawEnemy(enemy) {
      if (!enemy.alive) return;
      ctx.fillStyle = "#7a3ff0";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(enemy.x - 2, enemy.y - 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1020";
      ctx.beginPath();
      ctx.arc(enemy.x - 4, enemy.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5a22c0";
      ctx.fillRect(enemy.x - 8, enemy.y + enemy.r - 4, 6, 5);
      ctx.fillRect(enemy.x + 2, enemy.y + enemy.r - 4, 6, 5);
    }

    function drawBird(pos, kind) {
      var spec = KINDS[kind];
      ctx.fillStyle = "rgba(0,0,0,.15)";
      ctx.beginPath();
      ctx.ellipse(pos.x, GROUND - 4, spec.r * 0.7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      if (kind === "big") {
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, spec.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#6d7688";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x - 8, pos.y - 4);
        ctx.lineTo(pos.x + 6, pos.y + 8);
        ctx.stroke();
        return;
      }
      ctx.fillStyle = spec.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, spec.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.beak;
      ctx.beginPath();
      ctx.moveTo(pos.x + spec.r - 4, pos.y);
      ctx.lineTo(pos.x + spec.r + 8, pos.y + 3);
      ctx.lineTo(pos.x + spec.r - 4, pos.y + 7);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(pos.x + 2, pos.y - 6, 6, 6);
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(pos.x + 4, pos.y - 4, 3, 3);
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.beginPath();
      ctx.ellipse(pos.x - 4, pos.y + 2, 6, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawDots(origin) {
      var vx = -state.pull.x * LAUNCH_SCALE;
      var vy = -state.pull.y * LAUNCH_SCALE;
      var x = origin.x;
      var y = origin.y;
      ctx.fillStyle = "rgba(20,30,40,.45)";
      for (var i = 1; i <= 10; i++) {
        vy += GRAVITY * 0.06;
        x += vx * 0.06;
        y += vy * 0.06;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    function unlockAudio() {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
    }

    function beep(freq, dur, type) {
      if (!state.sound || !audioCtx) return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = type || "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch (err) { /* audio is optional */ }
    }

    function beepSlide(from, to, dur) {
      if (!state.sound || !audioCtx) return;
      try {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(from, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(to, audioCtx.currentTime + dur);
        gain.gain.value = 0.035;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch (err) { /* audio is optional */ }
    }
  }

  return api;
});
