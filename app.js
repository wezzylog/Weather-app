(function () {
  "use strict";
  const { CITIES, SKY, WEEKDAYS } = window.WeatherData;
  const state = { city: "Tbilisi", unit: "C" };

  const el = {};
  ["cities", "unitC", "unitF", "sky", "cityName", "when", "tempNow", "unitMark",
   "glyph", "summary", "range", "curve", "days", "facts"]
    .forEach((id) => (el[id] = document.getElementById(id)));

  const DATE_FMT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
  const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  const HOUR_LABELS = Array.from({ length: 24 }, (_, h) =>
    h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? h - 12 + " PM" : h + " AM");
  const CURVE_DEFS =
    '<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#ffb050" stop-opacity="0.35"/>' +
    '<stop offset="1" stop-color="#5aa0ff" stop-opacity="0"/></linearGradient></defs>';
  const DAY_MS = 86400000;

  const fmt = (c) => Math.round(state.unit === "C" ? c : (c * 9) / 5 + 32);

  function minMax(arr) {
    let lo = Infinity, hi = -Infinity;
    for (const v of arr) { if (v < lo) lo = v; if (v > hi) hi = v; }
    return [lo, hi];
  }

  const models = new Map();
  function getModel(name) {
    let m = models.get(name);
    if (m) return m;

    const d = CITIES[name];
    const base = d.base + SKY[d.sky].lift * 0.2;
    const at = (hour) => base + d.amp * Math.sin(((hour - 9) * Math.PI) / 12);
    const temps = Array.from({ length: 24 }, (_, h) => at(h));
    const [lo, hi] = minMax(temps);

    const week = d.week.map(([sky, shift]) => {
      const lift = SKY[sky].lift * 0.2;
      return {
        sky,
        hi: d.base + d.amp * 0.75 + shift + lift,
        lo: d.base - d.amp * 0.85 + shift + lift
      };
    });
    const wMin = minMax(week.map((r) => r.lo))[0];
    const wMax = minMax(week.map((r) => r.hi))[1];
    const span = wMax - wMin || 1;
    week.forEach((r) => {
      r.left = (((r.lo - wMin) / span) * 100).toFixed(1);
      r.width = (((r.hi - r.lo) / span) * 100).toFixed(1);
    });

    m = { d, at, temps, hi, lo, week };
    models.set(name, m);
    return m;
  }

  function localNow(city) {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + CITIES[city].tz * 3600000);
  }

  const chips = new Map();
  function buildCities() {
    const frag = document.createDocumentFragment();
    for (const name of Object.keys(CITIES)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.city = name;
      b.textContent = name;
      chips.set(name, b);
      frag.appendChild(b);
    }
    el.cities.replaceChildren(frag);
    el.cities.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b || b.dataset.city === state.city) return;
      state.city = b.dataset.city;
      render();
    });
  }

  function updatePressed() {
    chips.forEach((b, name) => b.setAttribute("aria-pressed", String(name === state.city)));
    el.unitC.setAttribute("aria-pressed", String(state.unit === "C"));
    el.unitF.setAttribute("aria-pressed", String(state.unit === "F"));
  }

  function renderHero(m, now, cur) {
    const { d } = m;
    const sky = SKY[d.sky];
    el.sky.dataset.sky = d.sky;
    el.cityName.textContent = state.city;
    el.when.textContent = DATE_FMT.format(now) + ", " + TIME_FMT.format(now);
    el.tempNow.textContent = fmt(cur);
    el.unitMark.textContent = "°" + state.unit;
    el.glyph.textContent = sky.glyph;
    el.summary.textContent = sky.label + ", feels like " + fmt(cur + d.feels) + "°";
    el.range.textContent = "High " + fmt(m.hi) + "°  Low " + fmt(m.lo) + "°";
  }

  function renderCurve(m, hour) {
    const { temps } = m;
    const W = 720, top = 34, bottom = 118, left = 24, right = 24;
    const n = 24;
    const hours = Array.from({ length: n }, (_, i) => (hour + i) % n);
    const lo = m.lo, hi = m.hi;
    const span = Math.max(hi - lo, 1);
    const step = (W - left - right) / (n - 1);

    let line = "";
    const xs = new Array(n), ys = new Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = left + i * step;
      ys[i] = bottom - ((temps[hours[i]] - lo) / span) * (bottom - top);
      line += (i ? "L" : "M") + xs[i].toFixed(1) + " " + ys[i].toFixed(1) + " ";
    }
    line = line.trimEnd();
    const area = line + " L" + xs[n - 1].toFixed(1) + " 140 L" + xs[0].toFixed(1) + " 140 Z";

    let out = CURVE_DEFS +
      '<path d="' + area + '" fill="url(#fade)"/>' +
      '<path d="' + line + '" fill="none" stroke="#ff9a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    for (let i = 0; i < n; i += 3) {
      const x = xs[i].toFixed(1), y = ys[i];
      out +=
        '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="4.5" fill="var(--surface)" stroke="#ff9a3c" stroke-width="2.5"/>' +
        '<text class="val" x="' + x + '" y="' + (y - 12).toFixed(1) + '" text-anchor="middle">' + fmt(temps[hours[i]]) + "°</text>" +
        '<text x="' + x + '" y="160" text-anchor="middle">' + (i === 0 ? "Now" : HOUR_LABELS[hours[i]]) + "</text>";
    }
    el.curve.innerHTML = out;
  }

  function renderDays(m, now) {
    const t0 = now.getTime();
    el.days.innerHTML = m.week.map((r, i) => {
      const name = i === 0 ? "Today" : WEEKDAYS[new Date(t0 + i * DAY_MS).getDay()];
      const sky = SKY[r.sky];
      return '<li class="day"><span class="name">' + name + "</span>" +
        '<span aria-label="' + sky.label + '">' + sky.glyph + "</span>" +
        '<span class="lo">' + fmt(r.lo) + "°</span>" +
        '<span class="track"><span class="fill" style="left:' + r.left + "%;width:" + r.width + '%"></span></span>' +
        '<span class="hi">' + fmt(r.hi) + "°</span></li>";
    }).join("");
  }

  function renderFacts(m, cur) {
    const { d } = m;
    const wind = state.unit === "C"
      ? d.wind + " <small>km/h</small>"
      : Math.round(d.wind * 0.621) + " <small>mph</small>";
    const uvLevel = d.uv <= 2 ? "Low" : d.uv <= 5 ? "Moderate" : d.uv <= 7 ? "High" : "Very high";
    const items = [
      ["Humidity", d.humidity + "<small>%</small>"],
      ["Wind", wind],
      ["UV index", d.uv + " <small>" + uvLevel + "</small>"],
      ["Feels like", fmt(cur + d.feels) + "°"]
    ];
    el.facts.innerHTML = items
      .map(([k, v]) => '<div class="fact"><dt>' + k + "</dt><dd>" + v + "</dd></div>")
      .join("");
  }

  function render() {
    const m = getModel(state.city);
    const now = localNow(state.city);
    const hour = now.getHours();
    const cur = m.at(hour + now.getMinutes() / 60);

    updatePressed();
    renderHero(m, now, cur);
    renderCurve(m, hour);
    renderDays(m, now);
    renderFacts(m, cur);
  }

  function setUnit(u) {
    if (state.unit === u) return;
    state.unit = u;
    render();
  }

  el.unitC.addEventListener("click", () => setUnit("C"));
  el.unitF.addEventListener("click", () => setUnit("F"));

  buildCities();
  render();
})();
