/**
 * Tool 7: get_weather
 * 功能：根据城市名获取 Seniverse 实况天气，并将结果渲染到页面元素。
 * 支持浏览器 window 全局挂载 与 Node.js module.exports 双环境。
 *
 * 对外暴露：
 *   getWeather(city, options?)  → Promise<WeatherResult>
 *   updateWeatherForLocation(city)  → void（浏览器环境，直接更新 DOM）
 *   WEATHER_CODE_ICON  → { [code: string]: string }  图标 URL 映射表
 */

// ── 天气现象代码 → 心知图示 URL 对照表 ────────────────────────────
var WEATHER_CODE_ICON = {
  '0':  'https://s1.sencdn.com/web/icons/black/0@1x.png',
  '1':  'https://s1.sencdn.com/web/icons/black/1@1x.png',
  '2':  'https://s3.sencdn.com/web/icons/black/2@1x.png',
  '3':  'https://s4.sencdn.com/web/icons/black/3@1x.png',
  '4':  'https://s5.sencdn.com/web/icons/black/4@1x.png',
  '5':  'https://s1.sencdn.com/web/icons/black/5@1x.png',
  '6':  'https://s1.sencdn.com/web/icons/black/6@1x.png',
  '7':  'https://s1.sencdn.com/web/icons/black/7@1x.png',
  '8':  'https://s1.sencdn.com/web/icons/black/8@1x.png',
  '9':  'https://s4.sencdn.com/web/icons/black/9@1x.png',
  '10': 'https://s4.sencdn.com/web/icons/black/10@1x.png',
  '11': 'https://s4.sencdn.com/web/icons/black/11@1x.png',
  '12': 'https://s1.sencdn.com/web/icons/black/12@1x.png',
  '13': 'https://s1.sencdn.com/web/icons/black/13@1x.png',
  '14': 'https://s1.sencdn.com/web/icons/black/14@1x.png',
  '15': 'https://s1.sencdn.com/web/icons/black/15@1x.png',
  '16': 'https://s1.sencdn.com/web/icons/black/16@1x.png',
  '17': 'https://s1.sencdn.com/web/icons/black/17@1x.png',
  '18': 'https://s1.sencdn.com/web/icons/black/18@1x.png',
  '19': 'https://s4.sencdn.com/web/icons/black/19@1x.png',
  '20': 'https://s5.sencdn.com/web/icons/black/20@1x.png',
  '21': 'https://s5.sencdn.com/web/icons/black/21@1x.png',
  '22': 'https://s5.sencdn.com/web/icons/black/22@1x.png',
  '23': 'https://s5.sencdn.com/web/icons/black/23@1x.png',
  '24': 'https://s5.sencdn.com/web/icons/black/24@1x.png',
  '25': 'https://s5.sencdn.com/web/icons/black/25@1x.png',
  '26': 'https://s5.sencdn.com/web/icons/black/26@1x.png',
  '27': 'https://s5.sencdn.com/web/icons/black/27@1x.png',
  '28': 'https://s5.sencdn.com/web/icons/black/28@1x.png',
  '29': 'https://s5.sencdn.com/web/icons/black/29@1x.png',
  '30': 'https://s5.sencdn.com/web/icons/black/30@1x.png',
  '31': 'https://s5.sencdn.com/web/icons/black/31@1x.png',
  '32': 'https://s5.sencdn.com/web/icons/black/32@1x.png',
  '33': 'https://s5.sencdn.com/web/icons/black/33@1x.png',
  '34': 'https://s5.sencdn.com/web/icons/black/34@1x.png',
  '35': 'https://s5.sencdn.com/web/icons/black/35@1x.png',
  '36': 'https://s5.sencdn.com/web/icons/black/36@1x.png',
  '37': 'https://s1.sencdn.com/web/icons/black/37@1x.png',
  '38': 'https://s5.sencdn.com/web/icons/black/38@1x.png',
};

/**
 * 核心方法：调用 Seniverse API 获取实况天气。
 *
 * @param {string} city   城市名称，如 "上海"
 * @param {object} [opts]
 * @param {string} [opts.apiKey]   心知 API Key（优先级高于 window.WEATHER_API_KEY）
 * @returns {Promise<{ok:boolean, text:string, temperature:string, code:string, iconUrl:string, error?:string}>}
 */
function getWeather(city, opts) {
  opts = opts || {};
  var key = opts.apiKey || (typeof window !== 'undefined' && window.WEATHER_API_KEY) || '';

  if (!key || !city) {
    return Promise.resolve({ ok: false, error: '缺少 API Key 或城市名', text: '', temperature: '', code: '', iconUrl: '' });
  }

  var url = 'https://api.seniverse.com/v3/weather/now.json'
    + '?key=' + encodeURIComponent(key)
    + '&location=' + encodeURIComponent(city)
    + '&language=zh-Hans&unit=c';

  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var now = data.results && data.results[0] && data.results[0].now;
      if (!now) return { ok: false, error: '天气数据为空', text: '', temperature: '', code: '', iconUrl: '' };

      var code    = String(now.code || now.icon || '0');
      var iconUrl = WEATHER_CODE_ICON[code]
        || ('https://s1.sencdn.com/web/icons/black/' + code + '@1x.png');

      return {
        ok:          true,
        text:        now.text        || '',
        temperature: now.temperature || '',
        code:        code,
        iconUrl:     iconUrl,
      };
    })
    .catch(function(err) {
      return { ok: false, error: String(err), text: '', temperature: '', code: '', iconUrl: '' };
    });
}

/**
 * 浏览器专用：获取天气后直接更新 DOM（#weather-info 与 #weather-icon）。
 * 与原有 index.html 逻辑完全对等，可直接替换调用。
 *
 * @param {string} city
 */
function updateWeatherForLocation(city) {
  var el     = typeof document !== 'undefined' ? document.getElementById('weather-info')  : null;
  var iconEl = typeof document !== 'undefined' ? document.getElementById('weather-icon') : null;

  if (!city) {
    if (el) el.textContent = '天气信息不可用';
    return;
  }

  getWeather(city).then(function(result) {
    if (!result.ok) {
      if (el) el.textContent = result.error || '天气信息获取失败';
      return;
    }

    // 更新图标
    if (iconEl) {
      var img    = document.createElement('img');
      img.src    = result.iconUrl;
      img.alt    = result.text;
      img.style.width          = '28px';
      img.style.height         = '28px';
      img.style.verticalAlign  = 'middle';
      img.onerror = function() {
        try { this.remove(); } catch(e) {}
        iconEl.textContent = '🌈';
      };
      iconEl.innerHTML = '';
      iconEl.appendChild(img);
    }

    // 更新文字
    if (el) el.textContent = result.text + '，' + result.temperature + '°C';
  });
}

// ── 环境适配：浏览器全局挂载 / Node.js module.exports ──────────────
(function(global) {
  // 暴露到全局（浏览器）
  if (typeof window !== 'undefined') {
    window.getWeather               = getWeather;
    window.updateWeatherForLocation = updateWeatherForLocation;
    window.WEATHER_CODE_ICON        = WEATHER_CODE_ICON;
    // 兼容旧代码中直接读取 window.weatherCodeIcon 的写法
    window.weatherCodeIcon          = WEATHER_CODE_ICON;
  }

  // Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      getWeather,
      updateWeatherForLocation,
      WEATHER_CODE_ICON,
    };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
