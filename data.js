// Static data only. Edit here to add cities or change forecasts.
window.WeatherData = {
  CITIES: {
    Tbilisi: { base: 17, amp: 6, sky: "sunny", feels: -1, humidity: 48, wind: 9, uv: 5, tz: 4, week: [["sunny", 4], ["sunny", 3], ["cloudy", 1], ["rain", -3], ["cloudy", -1]] },
    London: { base: 13, amp: 3, sky: "cloudy", feels: -2, humidity: 76, wind: 17, uv: 2, tz: 1, week: [["cloudy", 1], ["rain", -1], ["rain", -2], ["cloudy", 0], ["sunny", 2]] },
    Tokyo: { base: 21, amp: 4, sky: "rain", feels: 1, humidity: 82, wind: 12, uv: 3, tz: 9, week: [["rain", 0], ["storm", -1], ["cloudy", 1], ["sunny", 3], ["sunny", 3]] },
    "New York": { base: 15, amp: 5, sky: "sunny", feels: -1, humidity: 55, wind: 14, uv: 4, tz: -4, week: [["sunny", 2], ["cloudy", 0], ["cloudy", -2], ["rain", -3], ["sunny", 1]] },
    Sydney: { base: 22, amp: 4, sky: "cloudy", feels: 0, humidity: 63, wind: 20, uv: 7, tz: 11, week: [["cloudy", 0], ["sunny", 2], ["sunny", 3], ["storm", -2], ["rain", -3]] }
  },
  SKY: {
    sunny: { glyph: "☀️", label: "Sunny", lift: 3 },
    cloudy: { glyph: "☁️", label: "Cloudy", lift: -1 },
    rain: { glyph: "🌧️", label: "Rain", lift: -3 },
    storm: { glyph: "⛈️", label: "Thunderstorms", lift: -4 },
    snow: { glyph: "❄️", label: "Snow", lift: -8 }
  },
  WEEKDAYS: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};
