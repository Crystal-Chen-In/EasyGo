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
  module.exports = { extractIntent, ruleBasedFallback, parseIntentJSON, validateIntent, applyDefaults };
} else {
  window.extractIntent = extractIntent;
  window.ruleBasedFallback = ruleBasedFallback;
}