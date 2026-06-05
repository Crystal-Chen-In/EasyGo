/**
 * Tool 1: extract_intent
 * ─────────────────────────────────────────────────────────────
 * 职责：把用户一句自然语言 → 结构化 Intent 对象
 *
 * 调用方式（浏览器环境，GLM-4-Flash）：
 *   const result = await extractIntent(userText, { apiKey, onClarify });
 *
 * 返回值（IntentResult）：
 *   { ok: true,  intent: IntentObject }   ← 成功
 *   { ok: false, clarify: string }        ← 需要追问
 *   { ok: false, error: string }          ← API/解析失败，已降级
 *
 * 依赖：无第三方库，纯原生 fetch
 * ─────────────────────────────────────────────────────────────
 */

// ── 常量 ──────────────────────────────────────────────────────

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_MODEL   = 'glm-4-flash';       // 免费额度
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL   = 'deepseek-chat'; // 备用

// 最大追问轮数（超过则用规则引擎降级）
const MAX_CLARIFY_ROUNDS = 2;

// 追问检测：这些字段缺失时必须追问
const REQUIRED_FIELDS = ['group_type', 'adults'];

// ── System Prompt ─────────────────────────────────────────────

const SYSTEM_PROMPT = `你是美团本地出行规划助手的意图解析模块。
用户发来一句自然语言，描述他们的周末出行需求。
你的任务是把这句话解析成一个 JSON 对象，**只输出 JSON，不要任何解释或 markdown 代码块**。

JSON 结构如下（所有字段说明见注释，实际输出不含注释）：
{
  "group_type": "family" | "friends" | "couple" | "senior",
  "adults": <整数，成年人数量，默认2>,
  "children": [{ "age": <整数> }],       // 无孩子则为空数组 []
  "radius_km": <整数，出行半径公里，默认5>,
  "start_time": "HH:MM",                // 出发时间，默认 "14:00"
  "duration_hours": <整数，总时长，默认5>,
  "preferences": ["string"],            // 偏好关键词，如 "亲子""健康饮食""citywalk"
  "budget_per_person": <整数，人均预算元，不确定则为 null>,
  "special_needs": ["string"],          // 如 "减肥""轮椅友好""素食"
  "missing_fields": ["string"]          // 你认为缺少哪些关键信息，填字段名；信息充足则为 []
}

解析规则：
- "老婆最近在减肥" → special_needs 加 "健康饮食"
- "孩子5岁" → children: [{"age": 5}]，group_type 推断为 "family"
- "4个人2男2女" → adults: 4，group_type 推断为 "friends"
- "别太远" → radius_km: 5
- 用户没提预算 → budget_per_person: null
- 信息足够规划时 missing_fields 为空数组
- 以下情况必须在 missing_fields 中标注：用户完全没提人数时填 "adults"；完全没提场景（家庭/朋友/情侣）时填 "group_type"

只输出合法 JSON，不要输出任何其他内容。`;

// 追问 Prompt：当 missing_fields 非空时，让 AI 生成一句自然追问
const CLARIFY_SYSTEM_PROMPT = `你是一个温柔的出行规划助手。
用户填写了部分信息，但还缺少一些关键内容。
请用一句简短、友好的中文问句（不超过30字）向用户追问缺失信息。
只输出这一句话，不要任何其他内容。
缺失字段：{MISSING}`;

// ── 主函数 ────────────────────────────────────────────────────

/**
 * @param {string}   userText   用户原始输入
 * @param {object}   options
 * @param {string}   options.glmApiKey      智谱 GLM API Key
 * @param {string}   [options.deepseekApiKey]  DeepSeek 备用 Key
 * @param {number}   [options.round=0]      当前追问轮数（内部递归用）
 * @returns {Promise<IntentResult>}
 */
async function extractIntent(userText, options = {}) {
  const { glmApiKey, deepseekApiKey, round = 0 } = options;

  // 1. 调用 AI 解析意图
  let raw = null;
  let usedFallback = false;

  try {
    raw = await callGLM(userText, glmApiKey);
  } catch (glmErr) {
    console.warn('[extract_intent] GLM 失败，尝试 DeepSeek:', glmErr.message);
    try {
      raw = await callDeepSeek(userText, deepseekApiKey);
    } catch (dsErr) {
      console.warn('[extract_intent] DeepSeek 也失败，使用规则降级:', dsErr.message);
      raw = ruleBasedFallback(userText);
      usedFallback = true;
    }
  }

  // 2. 解析 JSON
  let intent;
  try {
    intent = parseIntentJSON(raw);
  } catch (parseErr) {
    console.warn('[extract_intent] JSON 解析失败，使用规则降级:', parseErr.message);
    intent = ruleBasedFallback(userText);
    usedFallback = true;
  }

  intent = normalizeIntentFromText(intent, userText);

  // 3. 校验必填字段
  const validation = validateIntent(intent);
  if (!validation.ok) {
    // 规则降级时直接填默认值，不追问
    if (usedFallback) {
      intent = applyDefaults(intent);
      return { ok: true, intent, source: 'fallback' };
    }

    // 超过最大追问次数 → 用默认值填充
    if (round >= MAX_CLARIFY_ROUNDS) {
      intent = applyDefaults(intent);
      return { ok: true, intent, source: 'default_filled' };
    }

    // 生成追问文案
    const clarifyText = await generateClarifyQuestion(
      intent.missing_fields || validation.missingFields,
      glmApiKey
    );
    return { ok: false, clarify: clarifyText, intent, round };
  }

  // 4. 补全可选字段的默认值
  intent = applyDefaults(intent);
  return { ok: true, intent, source: usedFallback ? 'fallback' : 'ai' };
}

function normalizeIntentFromText(intent, text) {
  const t = String(text || '');
  const normalized = {
    ...intent,
    children: Array.isArray(intent.children) ? intent.children.slice() : [],
    preferences: Array.isArray(intent.preferences) ? intent.preferences.slice() : [],
    special_needs: Array.isArray(intent.special_needs) ? intent.special_needs.slice() : [],
    missing_fields: Array.isArray(intent.missing_fields) ? intent.missing_fields.slice() : []
  };

  applyFamilyAndHeadcountHints(normalized, t);
  applyPositivePreferenceHints(normalized, t);
  applySpecialNeedHints(normalized, t);
  applyNegativePreferenceHints(normalized, t);
  dedupeIntentArrays(normalized);
  return normalized;
}

function applyFamilyAndHeadcountHints(intent, text) {
  const hasChildMention = /孩子|宝宝|小孩|小朋友|儿子|女儿|娃|一家三口/.test(text);
  const hasSpouseMention = /老婆|老公|媳妇|爱人|太太|先生|妻子|丈夫|另一半|对象/.test(text);
  const explicitAdults = extractExplicitAdults(text);
  const explicitTotal = extractExplicitTotalPeople(text);

  if (hasChildMention) {
    intent.group_type = 'family';
    const ages = extractChildAges(text);
    if (intent.children.length === 0) {
      if (ages.length > 0) intent.children = ages.map(age => ({ age }));
      else intent.children = [{ age: 5 }];
    }
    if (!intent.preferences.includes('亲子')) intent.preferences.push('亲子');
  } else if (hasSpouseMention) {
    intent.group_type = 'couple';
  }

  if (explicitAdults !== null) {
    intent.adults = explicitAdults;
  } else if (hasSpouseMention && hasChildMention) {
    intent.adults = Math.max(Number(intent.adults) || 0, 2);
  } else if (hasSpouseMention) {
    intent.adults = 2;
  } else if (hasChildMention && /我.*(带|和|跟|同)|带.*(孩子|宝宝|小孩|小朋友|儿子|女儿|娃)/.test(text) && !explicitTotal) {
    intent.adults = 1;
  }

  if (explicitTotal !== null && hasChildMention && explicitAdults === null) {
    const childCount = Math.max(1, intent.children.length || 1);
    intent.adults = Math.max(1, explicitTotal - childCount);
  }

  if (hasSpouseMention || hasChildMention || explicitAdults !== null || explicitTotal !== null) {
    intent.missing_fields = intent.missing_fields.filter(f => f !== 'adults' && f !== 'group_type');
  }
}

function applyPositivePreferenceHints(intent, text) {
  const rules = [
    { re: /亲子|孩子|宝宝|小孩|小朋友|儿子|女儿|娃|游乐/, pref: '亲子' },
    { re: /citywalk|散步|逛逛|压马路|街区|梧桐/, pref: 'citywalk' },
    { re: /展览|看展|博物馆|美术馆|艺术展/, pref: '展览' },
    { re: /购物|逛街|商场|购物中心|买东西/, pref: '购物' },
    { re: /自然|公园|爬山|户外|露营|骑行/, pref: '户外' },
    { re: /下午茶|甜品|咖啡|蛋糕|茶饮/, pref: '下午茶' },
    { re: /电影|影院|观影|看电影/, pref: '电影' },
    { re: /酒店|住宿|住酒店|民宿/, pref: '酒店' },
    { re: /室内|雨天|下雨|太热|太冷/, pref: '室内' }
  ];
  for (const rule of rules) {
    if (rule.re.test(text) && !intent.preferences.includes(rule.pref)) {
      intent.preferences.push(rule.pref);
    }
  }
}

function applyNegativePreferenceHints(intent, text) {
  const avoided = detectAvoidPreferences(text);
  if (avoided.length === 0) return;

  intent.avoid_preferences = [
    ...(Array.isArray(intent.avoid_preferences) ? intent.avoid_preferences : []),
    ...avoided
  ];

  const avoidTagSet = new Set(avoided.flatMap(pref => NEGATIVE_PREF_TAGS[pref] || [pref]));
  intent.preferences = intent.preferences.filter(pref => {
    if (avoided.includes(pref)) return false;
    const prefTags = POSITIVE_PREF_TAGS[pref] || [pref];
    return !prefTags.some(tag => avoidTagSet.has(tag) || [...avoidTagSet].some(a => a.includes(tag) || tag.includes(a)));
  });
}

function applySpecialNeedHints(intent, text) {
  const rules = [
    { re: /减肥|健康|轻食|低卡|清淡|少油|低脂|控糖|少糖/, need: '健康饮食' },
    { re: /素食|不吃肉|吃素/, need: '素食' },
    { re: /轮椅|无障碍|行动不便/, need: '无障碍' }
  ];
  for (const rule of rules) {
    if (rule.re.test(text) && !intent.special_needs.includes(rule.need)) {
      intent.special_needs.push(rule.need);
    }
  }
}

const NEGATIVE_PREF_TAGS = {
  '公园': ['公园','park','森林','草坪'],
  '户外': ['户外','公园','骑行','森林','草坪'],
  '展览': ['展览','博物馆','美术馆','艺术'],
  '博物馆': ['博物馆','展览','室内','科普'],
  '商场': ['商场','购物','mall'],
  '购物': ['购物','商场','mall'],
  '餐厅': ['餐厅','美食'],
  '咖啡': ['咖啡','下午茶'],
  '火锅': ['火锅'],
  '烧烤': ['烧烤','烤串'],
  '日料': ['日料','寿司'],
  '西餐': ['西餐','汉堡','披萨'],
  '甜品': ['甜品','蛋糕','下午茶'],
  '电影': ['电影','影院','观影'],
  'citywalk': ['citywalk','散步','街区']
};

const POSITIVE_PREF_TAGS = {
  '亲子': ['亲子','孩子','游乐'],
  'citywalk': ['citywalk','散步','逛逛'],
  '展览': ['展览','博物馆','美术馆'],
  '购物': ['购物','逛街','商场'],
  '户外': ['户外','自然','公园','爬山'],
  '下午茶': ['下午茶','甜品','咖啡','蛋糕'],
  '电影': ['电影','影院','观影','看电影'],
  '酒店': ['酒店','住宿','民宿']
};

function detectAvoidPreferences(text) {
  const keywords = Object.keys(NEGATIVE_PREF_TAGS);
  const result = [];
  for (const keyword of keywords) {
    const escaped = escapeRegExp(keyword);
    const before = new RegExp(`(不想|不要|不去|别去|不考虑|避开|排除|别安排|不要安排|不安排|不喜欢|不爱|没兴趣)[^，。；,;！!？?]{0,10}${escaped}`);
    const after = new RegExp(`${escaped}[^，。；,;！!？?]{0,8}(不想去|不想要|不要|不去|算了|别安排|不喜欢|不爱|没兴趣)`);
    if (before.test(text) || after.test(text)) result.push(keyword);
  }
  return [...new Set(result)];
}

function extractChildAges(text) {
  const ages = [];
  const re = /(?:孩子|宝宝|小孩|小朋友|儿子|女儿|娃)\s*(\d{1,2})\s*岁|(\d{1,2})\s*岁(?:的)?(?:孩子|宝宝|小孩|小朋友|儿子|女儿|娃)/g;
  for (const m of text.matchAll(re)) {
    const age = parseInt(m[1] || m[2], 10);
    if (!Number.isNaN(age) && age >= 0 && age < 18) ages.push(age);
  }
  return [...new Set(ages)];
}

function extractExplicitAdults(text) {
  const m = text.match(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(个|位|名)?\s*(大人|成人|成年人)/);
  return m ? parseChineseCount(m[1]) : null;
}

function extractExplicitTotalPeople(text) {
  const family = text.match(/一家\s*(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*口/);
  if (family) return parseChineseCount(family[1]);
  const total = text.match(/(\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(个|位|名)?\s*(人|口)/);
  return total ? parseChineseCount(total[1]) : null;
}

function parseChineseCount(raw) {
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const map = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  return map[raw] ?? null;
}

function dedupeIntentArrays(intent) {
  intent.preferences = [...new Set(intent.preferences.filter(Boolean))];
  intent.special_needs = [...new Set(intent.special_needs.filter(Boolean))];
  intent.avoid_preferences = [...new Set((intent.avoid_preferences || []).filter(Boolean))];
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── GLM API 调用 ──────────────────────────────────────────────

async function callGLM(userText, apiKey) {
  if (!apiKey) throw new Error('GLM API Key 未配置');

  const res = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      max_tokens: 512,
      temperature: 0.1,   // 低温保证 JSON 稳定输出
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userText }
      ]
    }),
    signal: AbortSignal.timeout(8000)   // 8秒超时
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GLM HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── DeepSeek 备用 ─────────────────────────────────────────────

async function callDeepSeek(userText, apiKey) {
  if (!apiKey) throw new Error('DeepSeek API Key 未配置');

  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: 512,
      temperature: 0.1,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userText }
      ]
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── 规则降级（无网络/无 Key 时） ───────────────────────────────

/**
 * 纯关键词匹配，保证离线也能跑
 * 不调用 AI，直接从文本提取关键信息
 */
function ruleBasedFallback(text) {
  const t = text;

  // group_type
  let group_type = 'friends';
  if (/孩子|宝宝|亲子|小孩|儿子|女儿/.test(t)) group_type = 'family';
  else if (/老婆|老公|媳妇|爱人|两个人.*约会|约会/.test(t)) group_type = 'couple';
  else if (/爸妈|父母|爷爷|奶奶|姥姥|姥爷|长辈|老人/.test(t)) group_type = 'senior';

  // adults
  const adultMatch = t.match(/(\d+)\s*[个名位人]/);
  let adults = adultMatch ? parseInt(adultMatch[1]) : 2;
  if (group_type === 'couple') adults = 2;

  // children
  const children = [];
  const childAgeMatches = [...t.matchAll(/孩子\s*(\d+)\s*岁|(\d+)\s*岁.*?孩子/g)];
  childAgeMatches.forEach(m => {
    const age = parseInt(m[1] || m[2]);
    if (!isNaN(age) && age < 18) children.push({ age });
  });
  if (group_type === 'family' && children.length === 0) children.push({ age: 5 });

  // radius
  let radius_km = 5;
  if (/别.*太远|不.*太远|附近|周边/.test(t)) radius_km = 5;
  else if (/稍微远|可以远/.test(t)) radius_km = 15;
  else if (/市内|市区/.test(t)) radius_km = 10;

  // time
  const timeMatch = t.match(/(上午|下午|晚上|早上)?\s*(\d{1,2})\s*[点:时]\s*(\d{0,2})/);
  let start_time = '14:00';
  if (timeMatch) {
    const period = timeMatch[1] || '';
    let h = parseInt(timeMatch[2]);
    const m = (timeMatch[3] || '00').padStart(2, '0');
    if ((period === '下午' || period === '晚上') && h < 12) h += 12;
    if (period === '上午' && h === 12) h = 0;
    start_time = `${String(h).padStart(2, '0')}:${m}`;
  }

  // duration
  const durMatch = t.match(/(\d+)\s*[个]?\s*小时/);
  const duration_hours = durMatch ? parseInt(durMatch[1]) : 5;

  // preferences
  const preferences = [];
  if (/亲子|孩子|游乐/.test(t)) preferences.push('亲子');
  if (/citywalk|散步|逛逛/.test(t)) preferences.push('citywalk');
  if (/展览|博物馆|美术馆/.test(t)) preferences.push('展览');
  if (/购物|逛街/.test(t)) preferences.push('购物');
  if (/自然|公园|爬山/.test(t)) preferences.push('户外');
  if (/下午茶|甜品|咖啡|蛋糕/.test(t)) preferences.push('下午茶');
  if (/电影|影院|观影|看电影/.test(t)) preferences.push('电影');
  if (/酒店|住宿|住酒店|民宿/.test(t)) preferences.push('酒店');

  // special_needs
  const special_needs = [];
  if (/减肥|健康|轻食|低卡/.test(t)) special_needs.push('健康饮食');
  if (/素食|不吃肉/.test(t)) special_needs.push('素食');
  if (/轮椅|无障碍/.test(t)) special_needs.push('无障碍');

  return {
    group_type, adults, children,
    radius_km, start_time, duration_hours,
    preferences, special_needs,
    budget_per_person: null,
    missing_fields: []
  };
}

// ── JSON 解析（健壮版） ────────────────────────────────────────

function parseIntentJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('空响应');

  // 去掉 AI 可能输出的 markdown 代码块包裹
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // 提取第一个 { ... } 块（防止 AI 在 JSON 后多输出文字）
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('响应中找不到 JSON 对象');
  cleaned = cleaned.slice(start, end + 1);

  const obj = JSON.parse(cleaned);   // 若格式错误会抛出

  // 类型归一化
  if (typeof obj.adults !== 'number') obj.adults = parseInt(obj.adults) || 2;
  if (!Array.isArray(obj.children))   obj.children = [];
  if (!Array.isArray(obj.preferences)) obj.preferences = [];
  if (!Array.isArray(obj.avoid_preferences)) obj.avoid_preferences = [];
  if (!Array.isArray(obj.special_needs)) obj.special_needs = [];
  if (!Array.isArray(obj.missing_fields)) obj.missing_fields = [];

  return obj;
}

// ── 校验 ──────────────────────────────────────────────────────

function validateIntent(intent) {
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    if (intent[field] === undefined || intent[field] === null || intent[field] === '') {
      missing.push(field);
    }
  }
  // 也把 AI 自己标注的 missing_fields 合并进来
  const aiMissing = intent.missing_fields || [];
  const allMissing = [...new Set([...missing, ...aiMissing])];

  if (allMissing.length > 0) {
    return { ok: false, missingFields: allMissing };
  }
  return { ok: true };
}

// ── 默认值填充 ────────────────────────────────────────────────

function applyDefaults(intent) {
  return {
    group_type:        intent.group_type        ?? 'friends',
    adults:            intent.adults            ?? 2,
    children:          intent.children          ?? [],
    radius_km:         intent.radius_km         ?? 5,
    start_time:        intent.start_time        ?? '14:00',
    duration_hours:    intent.duration_hours    ?? 5,
    preferences:       intent.preferences       ?? [],
    avoid_preferences: intent.avoid_preferences ?? [],
    special_needs:     intent.special_needs     ?? [],
    budget_per_person: intent.budget_per_person ?? null,
    missing_fields:    []   // 已处理，清空
  };
}

// ── 生成追问文案 ──────────────────────────────────────────────

const CLARIFY_QUESTIONS = {
  adults:     '请问这次出行一共几个人呢？',
  group_type: '请问是和家人、朋友，还是和另一半出行呢？',
  start_time: '请问打算几点出发呢？',
  radius_km:  '请问可以接受离家多远的地方？'
};

async function generateClarifyQuestion(missingFields, apiKey) {
  // 优先用本地模板（快速，无需网络）
  if (missingFields.length === 1 && CLARIFY_QUESTIONS[missingFields[0]]) {
    return CLARIFY_QUESTIONS[missingFields[0]];
  }

  // 多个字段缺失：尝试让 AI 生成自然的追问
  if (apiKey) {
    try {
      const prompt = CLARIFY_SYSTEM_PROMPT.replace('{MISSING}', missingFields.join('、'));
      const res = await fetch(GLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GLM_MODEL,
          max_tokens: 60,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (_) { /* 降级到模板 */ }
  }

  // 最终降级：拼接模板
  return missingFields
    .map(f => CLARIFY_QUESTIONS[f] ?? `请补充 ${f} 信息`)
    .join('另外，');
}

// ── 导出（浏览器 + Node 双兼容） ──────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractIntent, ruleBasedFallback, normalizeIntentFromText, parseIntentJSON, validateIntent, applyDefaults };
} else {
  window.extractIntent = extractIntent;
  window.ruleBasedFallback = ruleBasedFallback;
  window.normalizeIntentFromText = normalizeIntentFromText;
}
