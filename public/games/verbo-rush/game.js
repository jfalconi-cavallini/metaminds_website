/* Verbo Rush — self-contained conjugation drill. No network calls, no accounts. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    root.VerboRush = api;
    api.boot();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var GROUPS = ["yo", "tu", "el", "nosotros", "vosotros", "ellos"];
  var GROUP_LABEL = {
    yo: "yo",
    tu: "tú",
    el: "él / ella / Ud.",
    nosotros: "nosotros",
    vosotros: "vosotros",
    ellos: "ellos / Uds.",
  };
  var PRONOUN_LABELS = {
    yo: ["yo"],
    tu: ["tú"],
    el: ["él", "ella", "usted"],
    nosotros: ["nosotros", "nosotras"],
    vosotros: ["vosotros", "vosotras"],
    ellos: ["ellos", "ellas", "ustedes"],
  };
  var PRONOUN_WORDS = {
    yo: true, tu: true, tú: true, el: true, él: true, ella: true,
    usted: true, ud: true, "ud.": true,
    nosotros: true, nosotras: true, vosotros: true, vosotras: true,
    ellos: true, ellas: true, ustedes: true, uds: true, "uds.": true,
  };
  var ENDINGS = {
    present: {
      ar: ["o", "as", "a", "amos", "áis", "an"],
      er: ["o", "es", "e", "emos", "éis", "en"],
      ir: ["o", "es", "e", "imos", "ís", "en"],
    },
    preterite: {
      ar: ["é", "aste", "ó", "amos", "asteis", "aron"],
      er: ["í", "iste", "ió", "imos", "isteis", "ieron"],
      ir: ["í", "iste", "ió", "imos", "isteis", "ieron"],
    },
  };
  var IRREGULAR = {
    present: {
      ser: ["soy", "eres", "es", "somos", "sois", "son"],
      estar: ["estoy", "estás", "está", "estamos", "estáis", "están"],
      tener: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
      ir: ["voy", "vas", "va", "vamos", "vais", "van"],
      hacer: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    },
    preterite: {
      ser: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
      ir: ["fui", "fuiste", "fue", "fuimos", "fuisteis", "fueron"],
      estar: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvisteis", "estuvieron"],
      tener: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvisteis", "tuvieron"],
      hacer: ["hice", "hiciste", "hizo", "hicimos", "hicisteis", "hicieron"],
    },
  };
  var VERBS = [
    { inf: "hablar", en: "to speak", tier: 1 },
    { inf: "estudiar", en: "to study", tier: 1 },
    { inf: "trabajar", en: "to work", tier: 1 },
    { inf: "bailar", en: "to dance", tier: 1 },
    { inf: "cantar", en: "to sing", tier: 1 },
    { inf: "escuchar", en: "to listen", tier: 1 },
    { inf: "mirar", en: "to watch", tier: 1 },
    { inf: "necesitar", en: "to need", tier: 1 },
    { inf: "usar", en: "to use", tier: 1 },
    { inf: "nadar", en: "to swim", tier: 1 },
    { inf: "tomar", en: "to take, to drink", tier: 1 },
    { inf: "caminar", en: "to walk", tier: 1 },
    { inf: "enseñar", en: "to teach", tier: 1 },
    { inf: "comer", en: "to eat", tier: 2 },
    { inf: "beber", en: "to drink", tier: 2 },
    { inf: "correr", en: "to run", tier: 2 },
    { inf: "aprender", en: "to learn", tier: 2 },
    { inf: "comprender", en: "to understand", tier: 2 },
    { inf: "vender", en: "to sell", tier: 2 },
    { inf: "vivir", en: "to live", tier: 3 },
    { inf: "escribir", en: "to write", tier: 3 },
    { inf: "abrir", en: "to open", tier: 3 },
    { inf: "recibir", en: "to receive", tier: 3 },
    { inf: "subir", en: "to go up", tier: 3 },
    { inf: "decidir", en: "to decide", tier: 3 },
    { inf: "ser", en: "to be (identity)", tier: 4 },
    { inf: "estar", en: "to be (location, condition)", tier: 4 },
    { inf: "tener", en: "to have", tier: 5 },
    { inf: "ir", en: "to go", tier: 5 },
    { inf: "hacer", en: "to do, to make", tier: 5 },
  ];
  var TIPS = {
    "present:ser": "ser does not use regular -er endings.",
    "present:estar": "estar keeps an accent: estás, está, estáis, están.",
    "present:tener": "tener uses tengo in the yo form, and e changes to ie.",
    "present:ir": "ir is irregular in every present form: voy, vas, va…",
    "present:hacer": "hacer uses hago in the yo form.",
    "preterite:ser": "ser and ir share the pretérito: fui, fuiste, fue…",
    "preterite:ir": "ser and ir share the pretérito: fui, fuiste, fue…",
    "preterite:estar": "estar in the pretérito uses the stem estuv-.",
    "preterite:tener": "tener in the pretérito uses the stem tuv-.",
    "preterite:hacer": "hacer in the pretérito uses hic-, and él/ella/usted is hizo.",
  };
  var LEVEL_NOTE = {
    2: "New: -er verbs",
    3: "New: -ir verbs and nosotros",
    4: "New: ser, estar, and ellos",
    5: "New: tener, ir, hacer, and vosotros",
  };
  var SPEED = {
    chill: { base: 14000, step: 800, min: 7000 },
    normal: { base: 10000, step: 700, min: 4500 },
    turbo: { base: 7000, step: 500, min: 3200 },
  };
  var ACCENTS = ["á", "é", "í", "ó", "ú", "ñ"];
  var CHOICE_COLORS = ["#ff5c7a", "#ffd23f", "#3fe0ff", "#ff3d9a"];
  var STORAGE_KEY = "metaminds.verbo-rush.highScore";
  var CORRECT_PER_LEVEL = 6;

  function stripAccents(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function clean(raw) {
    var text = String(raw || "").trim().toLowerCase().normalize("NFC");
    text = text.replace(/[¡!¿?.,;:'"“”«»]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    var parts = text.split(" ");
    if (parts.length === 2 && PRONOUN_WORDS[parts[0]]) return parts[1];
    return text;
  }

  function conjugate(inf, tense) {
    var irregular = IRREGULAR[tense] && IRREGULAR[tense][inf];
    var forms = irregular;
    if (!forms) {
      var ending = inf.slice(-2);
      var stem = inf.slice(0, -2);
      var suffixes = ENDINGS[tense] && ENDINGS[tense][ending];
      if (!suffixes) return null;
      forms = suffixes.map(function (suffix) { return stem + suffix; });
    }
    var out = {};
    GROUPS.forEach(function (group, index) { out[group] = forms[index]; });
    return out;
  }

  function allForms(inf) {
    var present = conjugate(inf, "present");
    var preterite = conjugate(inf, "preterite");
    if (!present || !preterite) return [];
    return GROUPS.map(function (group) { return present[group]; }).concat(
      GROUPS.map(function (group) { return preterite[group]; })
    );
  }

  function gradeAnswer(raw, correct, tolerant, infinitive) {
    var got = clean(raw);
    var want = clean(correct);
    if (!got) return { ok: false, empty: true, accentMiss: false, conflict: false };
    if (got === want) return { ok: true, empty: false, accentMiss: false, conflict: false };
    var accentClose = stripAccents(got) === stripAccents(want);
    var conflict = false;
    if (accentClose && infinitive) {
      conflict = allForms(infinitive).some(function (form) {
        return form === got && form !== want;
      });
    }
    if (tolerant && accentClose && !conflict) {
      return { ok: true, empty: false, accentMiss: false, conflict: false };
    }
    return { ok: false, empty: false, accentMiss: accentClose, conflict: conflict };
  }

  function roundDuration(level, speed) {
    var pace = SPEED[speed] || SPEED.normal;
    return Math.max(pace.min, pace.base - (level - 1) * pace.step);
  }

  function tierForLevel(level) {
    return Math.max(1, Math.min(5, level));
  }

  function groupsForLevel(level) {
    var groups = ["yo", "tu", "el"];
    if (level >= 3) groups.push("nosotros");
    if (level >= 4) groups.push("ellos");
    if (level >= 5) groups.push("vosotros");
    return groups;
  }

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

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function boot() {
    var settings = { tense: "present", input: "both", accent: "strict", speed: "normal", sound: true };
    var run = null;
    var high = loadHigh();
    var token = 0;
    var lastInsert = 0;
    var audioCtx = null;
    var els = {};

    [
      "score", "best", "streak", "level", "time", "lives", "clock", "bar",
      "prompt", "tense", "who", "verb", "gloss", "form", "answer", "go", "accents",
      "answers", "flash", "flashTitle", "flashForm", "flashPts", "overlay",
      "menu", "explain", "explainBody", "pause", "over", "overTitle", "overBody",
      "hi", "sound", "pauseAccent",
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });

    buildAccentKeys();
    paintHigh();
    bindMenu();
    bindPlay();
    showPanel("menu");

    function loadHigh() {
      try {
        var value = Number(localStorage.getItem(STORAGE_KEY));
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
      } catch (err) {
        return 0;
      }
    }

    function saveHigh(value) {
      try {
        localStorage.setItem(STORAGE_KEY, String(value));
      } catch (err) { /* private mode or blocked storage */ }
    }

    function paintHigh() {
      els.best.textContent = String(high);
      els.hi.textContent = String(high);
    }

    function buildAccentKeys() {
      ACCENTS.forEach(function (ch) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "accent";
        button.textContent = ch;
        button.setAttribute("aria-label", "Insert " + ch);
        button.addEventListener("pointerdown", function (event) { event.preventDefault(); });
        button.addEventListener("pointerup", function (event) {
          event.preventDefault();
          insertAccent(ch);
        });
        button.addEventListener("click", function (event) {
          event.preventDefault();
          insertAccent(ch);
        });
        els.accents.appendChild(button);
      });
    }

    function insertAccent(ch) {
      var now = Date.now();
      if (now - lastInsert < 40) return;
      lastInsert = now;
      var input = els.answer;
      var start = input.selectionStart;
      var end = input.selectionEnd;
      if (typeof start === "number" && typeof end === "number") {
        input.value = input.value.slice(0, start) + ch + input.value.slice(end);
        var pos = start + ch.length;
        input.focus();
        input.setSelectionRange(pos, pos);
      } else {
        input.value += ch;
        input.focus();
      }
    }

    function bindMenu() {
      document.querySelectorAll(".tog").forEach(function (button) {
        button.addEventListener("click", function () {
          var group = button.getAttribute("data-group");
          document.querySelectorAll('.tog[data-group="' + group + '"]').forEach(function (other) {
            other.setAttribute("aria-pressed", "false");
          });
          button.setAttribute("aria-pressed", "true");
          settings[group] = button.getAttribute("data-value");
          if (group === "accent") paintPauseAccent();
        });
      });
      document.getElementById("start").addEventListener("click", startRun);
      document.getElementById("again").addEventListener("click", startRun);
      document.getElementById("tomenu").addEventListener("click", function () { showPanel("menu"); });
      document.getElementById("quit").addEventListener("click", function () { showPanel("menu"); });
      document.getElementById("resume").addEventListener("click", resume);
      document.getElementById("cont").addEventListener("click", continueAfterMiss);
      document.getElementById("bp").addEventListener("click", function () {
        if (!run || run.phase === "over") return;
        if (run.phase === "pause") resume();
        else if (run.phase === "play") pause();
      });
      els.sound.addEventListener("click", function () {
        settings.sound = !settings.sound;
        els.sound.textContent = settings.sound ? "SOUND ON" : "SOUND OFF";
        els.sound.setAttribute("aria-pressed", settings.sound ? "true" : "false");
      });
      els.pauseAccent.addEventListener("click", function () {
        settings.accent = settings.accent === "easy" ? "strict" : "easy";
        document.querySelectorAll('.tog[data-group="accent"]').forEach(function (button) {
          var on = button.getAttribute("data-value") === settings.accent;
          button.setAttribute("aria-pressed", on ? "true" : "false");
        });
        paintPauseAccent();
      });
    }

    function bindPlay() {
      els.form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!run || run.phase !== "play") return;
        submitTyped(els.answer.value);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" || event.key === "p" || event.key === "P") {
          if (event.target && event.target.tagName === "INPUT" && (event.key === "p" || event.key === "P")) return;
          if (!run) return;
          if (run.phase === "play") {
            event.preventDefault();
            pause();
          } else if (run.phase === "pause") {
            event.preventDefault();
            resume();
          }
          return;
        }
        if (!run) return;
        if (run.phase === "flash" && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          nextQuestion();
          return;
        }
        if (run.phase === "feedback" && event.key === "Enter") {
          event.preventDefault();
          continueAfterMiss();
          return;
        }
        if (run.phase === "play" && /^[1-4]$/.test(event.key) && settings.input !== "type") {
          if (event.target && event.target.tagName === "INPUT") return;
          var choice = document.querySelector('.ab[data-i="' + (Number(event.key) - 1) + '"]');
          if (choice && !choice.disabled) choice.click();
        }
      });
    }

    function paintPauseAccent() {
      els.pauseAccent.textContent = settings.accent === "easy" ? "ACCENTS: EASY" : "ACCENTS: STRICT";
    }

    function showPanel(name) {
      ["menu", "explain", "pause", "over"].forEach(function (id) {
        document.getElementById(id).hidden = id !== name;
      });
      els.overlay.classList.toggle("show", !!name);
    }

    function startRun() {
      token += 1;
      if (run && run.raf) cancelAnimationFrame(run.raf);
      run = {
        phase: "play",
        score: 0,
        streak: 0,
        bestStreak: 0,
        recordAtStart: high,
        level: 1,
        lives: 3,
        correct: 0,
        wrong: 0,
        lastKey: "",
        deadline: 0,
        duration: 0,
        timeLeft: 0,
        timerOn: false,
        raf: 0,
        prompt: null,
        pendingOver: false,
      };
      els.flash.hidden = true;
      els.prompt.hidden = false;
      paintHud();
      showPanel(null);
      nextQuestion();
      beep(520, 0.06, "square");
    }

    function paintHud() {
      els.score.textContent = String(run.score);
      els.streak.textContent = String(run.streak);
      els.level.textContent = String(run.level);
      paintLives();
      paintHigh();
    }

    function paintLives() {
      els.lives.replaceChildren();
      els.lives.setAttribute("aria-label", "Lives: " + run.lives + " of 3");
      for (var i = 0; i < 3; i++) {
        var pip = document.createElement("i");
        if (i < run.lives) pip.className = "on";
        els.lives.appendChild(pip);
      }
    }

    function nextQuestion() {
      if (!run || run.phase === "over") return;
      token += 1;
      run.pendingOver = false;
      run.phase = "play";
      els.flash.hidden = true;
      els.prompt.hidden = false;
      els.answer.value = "";
      els.answer.classList.remove("empty");
      var prompt = makePrompt();
      run.prompt = prompt;
      run.lastKey = prompt.key;
      els.tense.textContent = prompt.tense === "present" ? "PRESENTE" : "PRETÉRITO";
      els.who.textContent = prompt.label;
      els.verb.textContent = prompt.verb.inf;
      els.gloss.textContent = prompt.verb.en;
      var typeOn = settings.input !== "tap";
      var tapOn = settings.input !== "type";
      els.form.hidden = !typeOn;
      els.answers.hidden = !tapOn;
      if (tapOn) renderChoices(prompt);
      else els.answers.replaceChildren();
      setChoicesDisabled(false);
      els.go.disabled = false;
      els.answer.disabled = false;
      var duration = roundDuration(run.level, settings.speed);
      startTimer(duration, duration);
      if (settings.input === "type") els.answer.focus();
    }

    function makePrompt() {
      var tier = tierForLevel(run.level);
      var pool = VERBS.filter(function (verb) { return verb.tier <= tier; });
      var groups = groupsForLevel(run.level);
      var prompt = null;
      for (var attempt = 0; attempt < 8; attempt++) {
        var verb = pick(pool);
        var group = pick(groups);
        var tense = tenseForQuestion();
        var forms = conjugate(verb.inf, tense);
        var label = pick(PRONOUN_LABELS[group]);
        prompt = {
          verb: verb,
          group: group,
          tense: tense,
          label: label,
          answer: forms[group],
          forms: forms,
          key: tense + ":" + verb.inf + ":" + group + ":" + label,
        };
        if (prompt.key !== run.lastKey) break;
      }
      return prompt;
    }

    function tenseForQuestion() {
      if (settings.tense === "preterite") return "preterite";
      if (settings.tense === "both" && run.level >= 4 && Math.random() < 0.5) return "preterite";
      return "present";
    }

    function renderChoices(prompt) {
      var wrong = [];
      GROUPS.forEach(function (group) {
        if (group !== prompt.group) wrong.push(prompt.forms[group]);
      });
      var otherTense = prompt.tense === "present" ? "preterite" : "present";
      var other = conjugate(prompt.verb.inf, otherTense)[prompt.group];
      if (other && other !== prompt.answer) wrong.push(other);
      if (prompt.verb.inf !== prompt.answer) wrong.push(prompt.verb.inf);
      var regular = regularForms(prompt.verb.inf, prompt.tense);
      if (regular && regular[prompt.group] && regular[prompt.group] !== prompt.answer) {
        wrong.push(regular[prompt.group]);
      }
      allForms(prompt.verb.inf).forEach(function (form) {
        if (form !== prompt.answer) wrong.push(form);
      });
      var unique = [];
      wrong.forEach(function (form) {
        if (form === prompt.answer) return;
        if (unique.indexOf(form) === -1) unique.push(form);
      });
      var choices = shuffle(unique).slice(0, 3);
      choices.push(prompt.answer);
      choices = shuffle(choices);
      els.answers.replaceChildren();
      choices.forEach(function (form, index) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "ab";
        button.dataset.i = String(index);
        button.dataset.form = form;
        button.style.setProperty("--bc", CHOICE_COLORS[index % CHOICE_COLORS.length]);
        var key = document.createElement("span");
        key.className = "k";
        key.textContent = String(index + 1);
        var value = document.createElement("span");
        value.className = "v";
        value.textContent = form;
        button.append(key, value);
        button.addEventListener("click", function () { resolve(form, false); });
        els.answers.appendChild(button);
      });
    }

    function regularForms(inf, tense) {
      var ending = inf.slice(-2);
      var stem = inf.slice(0, -2);
      var suffixes = ENDINGS[tense] && ENDINGS[tense][ending];
      if (!suffixes || !stem) return null;
      var out = {};
      GROUPS.forEach(function (group, index) { out[group] = stem + suffixes[index]; });
      return out;
    }

    function submitTyped(raw) {
      var graded = gradeAnswer(raw, run.prompt.answer, settings.accent === "easy", run.prompt.verb.inf);
      if (graded.empty) {
        els.answer.classList.add("empty");
        return;
      }
      resolve(raw, false);
    }

    function onTimeout() {
      resolve("", true);
    }

    function resolve(raw, timedOut) {
      if (!run || run.phase !== "play") return;
      run.phase = "lock";
      stopTimer(false);
      setChoicesDisabled(true);
      els.go.disabled = true;
      els.answer.disabled = true;
      var prompt = run.prompt;
      var graded = timedOut
        ? { ok: false, empty: true, accentMiss: false, conflict: false, timeout: true }
        : gradeAnswer(raw, prompt.answer, settings.accent === "easy", prompt.verb.inf);
      if (graded.ok) {
        run.streak += 1;
        run.bestStreak = Math.max(run.bestStreak, run.streak);
        run.correct += 1;
        var ratio = run.duration ? Math.max(0, run.timeLeft / run.duration) : 0;
        var gained = pointsFor(ratio, run.streak);
        run.score += gained;
        if (run.score > high) {
          high = run.score;
          saveHigh(high);
        }
        var leveled = false;
        if (run.correct % CORRECT_PER_LEVEL === 0) {
          run.level += 1;
          leveled = true;
        }
        paintHud();
        showFlash(prompt, gained, leveled);
        beep(timedOut ? 180 : 660, 0.07, "square");
        if (!timedOut) setTimeout(function () { beep(880, 0.08, "square"); }, 80);
        return;
      }
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      run.streak = 0;
      run.wrong += 1;
      run.lives -= 1;
      run.pendingOver = run.lives <= 0;
      paintHud();
      showMiss(prompt, raw, graded);
      beep(150, 0.12, "sawtooth");
      document.getElementById("screen").classList.add("shake");
      setTimeout(function () { document.getElementById("screen").classList.remove("shake"); }, 400);
    }

    function pointsFor(ratio, streak) {
      var speed = 80 + Math.round(Math.max(0, Math.min(1, ratio)) * 120);
      var bonus = Math.min(200, (streak - 1) * 20);
      return speed + bonus;
    }

    function showFlash(prompt, gained, leveled) {
      run.phase = "flash";
      els.form.hidden = true;
      els.answers.hidden = true;
      var mine = ++token;
      var title = leveled ? "LEVEL " + run.level : (run.streak >= 5 && run.streak % 5 === 0 ? "¡RACHA x" + run.streak + "!" : "¡SÍ!");
      els.flashTitle.textContent = title;
      els.flashForm.textContent = prompt.label + " + " + prompt.verb.inf + " → " + prompt.answer;
      var note = leveled ? levelNote(run.level) : "";
      els.flashPts.textContent = "+" + gained + "  ·  STREAK " + run.streak + (note ? "  ·  " + note : "");
      els.prompt.hidden = true;
      els.flash.hidden = false;
      setTimeout(function () {
        if (mine !== token || !run || run.phase !== "flash") return;
        nextQuestion();
      }, 680);
    }

    function levelNote(level) {
      if (LEVEL_NOTE[level]) {
        var note = LEVEL_NOTE[level];
        if (settings.tense === "both" && level === 4) note += " · pretérito mixes in";
        return note;
      }
      if (level > 5) return "Faster clock";
      return "";
    }

    function showMiss(prompt, raw, graded) {
      run.phase = "feedback";
      showPanel("explain");
      els.explainBody.replaceChildren();
      var title = document.createElement("p");
      title.className = "big bad";
      title.textContent = graded.timeout ? "Time's up!" : "Not quite.";
      var line = document.createElement("p");
      line.className = "say";
      line.append(document.createTextNode(prompt.label + " + " + prompt.verb.inf + " → "));
      var strong = document.createElement("strong");
      strong.textContent = prompt.answer;
      line.append(strong);
      els.explainBody.append(title, line);
      if (!graded.timeout && clean(raw)) {
        var wrote = document.createElement("p");
        wrote.className = "why";
        wrote.textContent = "You wrote: " + clean(raw);
        els.explainBody.append(wrote);
      }
      var why = document.createElement("p");
      why.className = "why";
      why.textContent = missReason(prompt, raw, graded);
      els.explainBody.append(why);
      var wrap = document.createElement("div");
      wrap.className = "tablewrap";
      wrap.appendChild(buildTable(prompt, raw));
      els.explainBody.append(wrap);
      var tip = TIPS[prompt.tense + ":" + prompt.verb.inf];
      if (tip) {
        var tipEl = document.createElement("p");
        tipEl.className = "tip";
        tipEl.textContent = tip;
        els.explainBody.append(tipEl);
      }
      document.getElementById("cont").textContent = run.pendingOver ? "SEE SCORE" : "NEXT VERB";
      document.getElementById("cont").focus();
    }

    function missReason(prompt, raw, graded) {
      if (graded.timeout) return "The clock hit zero. The form was " + prompt.answer + ".";
      if (graded.conflict) {
        var owner = groupForExact(prompt.verb.inf, clean(raw));
        if (owner) {
          return clean(raw) + " belongs to " + owner.label + " in the " + owner.tense + ". This prompt needs " + prompt.answer + ".";
        }
        return "That spelling is a different form. This one is " + prompt.answer + ".";
      }
      if (graded.accentMiss) return "The letters match. Strict mode still needs the accent: " + prompt.answer + ".";
      var other = groupForExact(prompt.verb.inf, clean(raw));
      if (other && !(other.tense === (prompt.tense === "present" ? "presente" : "pretérito") && other.group === prompt.group)) {
        return "That form belongs to " + other.label + " in the " + other.tense + ".";
      }
      return "Check the full chart, then try the next one.";
    }

    function groupForExact(inf, typed) {
      if (!typed) return null;
      var hits = [];
      var tenses = ["present", "preterite"];
      for (var t = 0; t < tenses.length; t++) {
        var forms = conjugate(inf, tenses[t]);
        for (var g = 0; g < GROUPS.length; g++) {
          if (forms[GROUPS[g]] === typed) {
            hits.push({
              group: GROUPS[g],
              label: GROUP_LABEL[GROUPS[g]],
              tense: tenses[t] === "present" ? "presente" : "pretérito",
            });
          }
        }
      }
      if (!hits.length) return null;
      if (hits.length > 1) {
        return { group: hits[0].group, label: hits[0].label, tense: "presente and the pretérito" };
      }
      return hits[0];
    }

    function buildTable(prompt, raw) {
      var table = document.createElement("table");
      table.className = "grid";
      var caption = document.createElement("caption");
      caption.textContent = prompt.verb.inf + " · " + (prompt.tense === "present" ? "presente" : "pretérito");
      table.appendChild(caption);
      var typed = clean(raw);
      GROUPS.forEach(function (group) {
        var row = document.createElement("tr");
        if (group === prompt.group) row.className = "target";
        else if (typed && prompt.forms[group] === typed) row.className = "missed";
        var who = document.createElement("th");
        who.scope = "row";
        who.textContent = GROUP_LABEL[group];
        var form = document.createElement("td");
        form.textContent = prompt.forms[group];
        row.append(who, form);
        table.appendChild(row);
      });
      return table;
    }

    function continueAfterMiss() {
      if (!run || run.phase !== "feedback") return;
      if (run.pendingOver || run.lives <= 0) {
        gameOver();
        return;
      }
      showPanel(null);
      nextQuestion();
    }

    function gameOver() {
      if (!run) return;
      run.phase = "over";
      stopTimer(false);
      token += 1;
      showPanel("over");
      var fresh = run.score > run.recordAtStart;
      els.overTitle.textContent = fresh ? "NEW RECORD" : "GAME OVER";
      els.overBody.replaceChildren();
      var stats = document.createElement("p");
      stats.className = "stats";
      var total = run.correct + run.wrong;
      stats.textContent = [
        "SCORE " + run.score,
        "BEST " + high,
        "BEST STREAK " + run.bestStreak,
        "LEVEL " + run.level,
        run.correct + " / " + total + " CORRECT",
      ].join("\n");
      els.overBody.appendChild(stats);
      if (fresh) beep(523, 0.08, "square");
    }

    function pause() {
      if (!run || run.phase !== "play") return;
      run.phase = "pause";
      stopTimer(true);
      showPanel("pause");
      paintPauseAccent();
    }

    function resume() {
      if (!run || run.phase !== "pause") return;
      showPanel(null);
      run.phase = "play";
      startTimer(run.timeLeft, run.duration);
      if (settings.input !== "tap") els.answer.focus();
    }

    function startTimer(ms, total) {
      stopTimer(false);
      run.timeLeft = ms;
      run.duration = total || ms;
      run.deadline = performance.now() + ms;
      run.timerOn = true;
      paintTime(ms);
      run.raf = requestAnimationFrame(tick);
    }

    function stopTimer(keepLeft) {
      if (!run) return;
      if (run.raf) cancelAnimationFrame(run.raf);
      run.raf = 0;
      if (run.timerOn && keepLeft) run.timeLeft = Math.max(0, run.deadline - performance.now());
      run.timerOn = false;
    }

    function tick(now) {
      if (!run || !run.timerOn) return;
      var left = run.deadline - now;
      run.timeLeft = left;
      paintTime(left);
      if (left <= 0) {
        run.timerOn = false;
        onTimeout();
        return;
      }
      run.raf = requestAnimationFrame(tick);
    }

    function paintTime(left) {
      var safe = Math.max(0, left);
      var ratio = run && run.duration ? safe / run.duration : 0;
      els.bar.style.transform = "scaleX(" + Math.max(0, Math.min(1, ratio)) + ")";
      els.time.textContent = String(Math.ceil(safe / 1000));
      els.clock.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
      els.clock.classList.toggle("warn", ratio < 0.45 && ratio >= 0.2);
      els.clock.classList.toggle("danger", ratio < 0.2);
    }

    function setChoicesDisabled(disabled) {
      document.querySelectorAll(".ab").forEach(function (button) { button.disabled = disabled; });
    }

    function beep(freq, dur, type) {
      if (!settings.sound) return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      try {
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === "suspended") audioCtx.resume();
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
  }

  return {
    boot: boot,
    conjugate: conjugate,
    gradeAnswer: gradeAnswer,
    clean: clean,
    stripAccents: stripAccents,
    roundDuration: roundDuration,
    groupsForLevel: groupsForLevel,
    tierForLevel: tierForLevel,
    verbs: VERBS,
    groups: GROUPS,
  };
});
