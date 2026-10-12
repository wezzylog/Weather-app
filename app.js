(function () {
  "use strict";
  const { CITIES, SKY, WEEKDAYS } = window.WeatherData;
  const state = { city: "Tbilisi", unit: "C" };
  const $ = (id) => document.getElementById(id);
  const el = {};
  ["cities", "unitC", "unitF", "sky", "cityName", "when", "tempNow", "unitMark",
   "glyph", "summary", "range", "curve", "days", "facts"].forEach((id) => (el[id] = $(id)));

  const fmt = (c) => Math.round(state.unit === "C" ? c : (c * 9) / 5 + 32);

  function localNow(city) {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000;
    return new Date(utc + CITIES[city].tz * 3600000);
  }

  function hourTemp(d, hour) {
    return d.base + SKY[d.sky].lift * 0.2 + d.amp * Math.sin(((hour - 9) * Math.PI) / 12);
  }

  // Everything derived from the city + current time, computed once per render.
  function buildContext() {
    const d = CITIES[state.city];
    const now = localNow(state.city);
    const hour = now.getHours();
    const temps = Array.from({ length: 24 }, (_, h) => hourTemp(d, h));
    return { d, now, hour, temps, cur: hourTemp(d, hour + now.getMinutes() / 60) };
  }

  // City chips are built once; clicks are handled by one delegated listener.
  function buildCities() {
    el.cities.innerHTML = Object.keys(CITIES)
      .map((n) => '<button type="button" class="chip" data-city="' + n + '"></button>')
      .join("");
    el.cities.querySelectorAll(".chip").forEach((b) => (b.textContent = b.dataset.city));
    el.cities.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b || b.dataset.city === state.city) return;
      state.city = b.dataset.city;
      render();
    });
  }

  function updatePressed() {
    el.cities.querySelectorAll(".chip").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.city === state.city)));
    el.unitC.setAttribute("aria-pressed", String(state.unit === "C"));
    el.unitF.setAttribute("aria-pressed", String(state.unit === "F"));
  }

  function renderHero({ d, now, temps, cur }) {
    el.sky.dataset.sky = d.sky;
    el.cityName.textContent = state.city;
    el.when.textContent =
      now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) +
      ", " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    el.tempNow.textContent = fmt(cur);
    el.unitMark.textContent = "°" + state.unit;
    el.glyph.textContent = SKY[d.sky].glyph;
    el.summary.textContent = SKY[d.sky].label + ", feels like " + fmt(cur + d.feels) + "°";
    el.range.textContent = "High " + fmt(Math.max(...temps)) + "°  Low " + fmt(Math.min(...temps)) + "°";
  }

  function renderCurve({ d, hour }) {
    const points = Array.from({ length: 24 }, (_, i) => {
      const h = (hour + i) % 24;
      return { h, t: hourTemp(d, h) };
    });
    const W = 720, top = 34, bottom = 118, left = 24, right = 24;
    const lo = Math.min(...points.map((p) => p.t));
    const hi = Math.max(...points.map((p) => p.t));
    const span = Math.max(hi - lo, 1);
    const step = (W - left - right) / 23;
    const xy = points.map((p, i) => [left + i * step, bottom - ((p.t - lo) / span) * (bottom - top)]);
    const line = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = line + " L" + xy[23][0].toFixed(1) + " 140 L" + xy[0][0].toFixed(1) + " 140 Z";
    const parts = [
      '<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#ffb050" stop-opacity="0.35"/>' +
        '<stop offset="1" stop-color="#5aa0ff" stop-opacity="0"/></linearGradient></defs>',
      '<path d="' + area + '" fill="url(#fade)"/>',
      '<path d="' + line + '" fill="none" stroke="#ff9a3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    ];
    points.forEach((p, i) => {
      if (i % 3 !== 0) return;
      const label = p.h === 0 ? "12 AM" : p.h === 12 ? "12 PM" : p.h > 12 ? p.h - 12 + " PM" : p.h + " AM";
      const x = xy[i][0].toFixed(1), y = xy[i][1];
      parts.push(
        '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="4.5" fill="var(--surface)" stroke="#ff9a3c" stroke-width="2.5"/>',
        '<text class="val" x="' + x + '" y="' + (y - 12).toFixed(1) + '" text-anchor="middle">' + fmt(p.t) + "°</text>",
        '<text x="' + x + '" y="160" text-anchor="middle">' + (i === 0 ? "Now" : label) + "</text>"
      );
    });
    el.curve.innerHTML = parts.join("");
  }

  function renderDays({ d, now }) {
    const rows = d.week.map(([sky, shift], i) => {
      const date = new Date(now.getTime() + i * 86400000);
      const lift = SKY[sky].lift * 0.2;
      return {
        name: i === 0 ? "Today" : WEEKDAYS[date.getDay()],
        sky,
        hi: d.base + d.amp * 0.75 + shift + lift,
        lo: d.base - d.amp * 0.85 + shift + lift
      };
    });
    const min = Math.min(...rows.map((r) => r.lo));
    const max = Math.max(...rows.map((r) => r.hi));
    const span = max - min;
    el.days.innerHTML = rows.map((r) => {
      const left = ((r.lo - min) / span) * 100;
      const width = ((r.hi - r.lo) / span) * 100;
      return '<li class="day"><span class="name">' + r.name + "</span>" +
        '<span aria-label="' + SKY[r.sky].label + '">' + SKY[r.sky].glyph + "</span>" +
        '<span class="lo">' + fmt(r.lo) + "°</span>" +
        '<span class="track"><span class="fill" style="left:' + left.toFixed(1) + "%;width:" + width.toFixed(1) + '%"></span></span>' +
        '<span class="hi">' + fmt(r.hi) + "°</span></li>";
    }).join("");
  }

  function renderFacts({ d, cur }) {
    const wind = state.unit === "C" ? d.wind + " <small>km/h</small>" : Math.round(d.wind * 0.621) + " <small>mph</small>";
    const uvLevel = d.uv <= 2 ? "Low" : d.uv <= 5 ? "Moderate" : d.uv <= 7 ? "High" : "Very high";
    const items = [
      ["Humidity", d.humidity + "<small>%</small>"],
      ["Wind", wind],
      ["UV index", d.uv + " <small>" + uvLevel + "</small>"],
      ["Feels like", fmt(cur + d.feels) + "°"]
    ];
    el.facts.innerHTML = items.map(([k, v]) => '<div class="fact"><dt>' + k + "</dt><dd>" + v + "</dd></div>").join("");
  }

  function render() {
    const ctx = buildContext();
    updatePressed();
    renderHero(ctx);
    renderCurve(ctx);
    renderDays(ctx);
    renderFacts(ctx);
  }

  el.unitC.addEventListener("click", () => { if (state.unit !== "C") { state.unit = "C"; render(); } });
  el.unitF.addEventListener("click", () => { if (state.unit !== "F") { state.unit = "F"; render(); } });

  buildCities();
  render();
})();
