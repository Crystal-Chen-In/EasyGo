/**
 * Tool 2: search_activities
 * ─────────────────────────────────────────────────────────────
 * 职责：根据 Intent 查询适合的活动场所，返回评分排序后的候选列表
 *
 * 调用：const result = await searchActivities(intent, options?)
 * 返回：{ ok, activities[], meta }
 * ─────────────────────────────────────────────────────────────
 */

const ACTIVITIES_DB = [
  // ── 亲子 / 家庭 ──────────────────────────────────────────────
  {
    id: 'act_001', name: '世纪公园', type: 'park',
    tags: ['亲子','免费','宽敞','户外','草坪'],
    suitable_for: ['family','couple','senior'],
    min_age: 0, duration_min: 120, rating: 4.7, distance_km: 3.2,
    open_now: true, ticket_price: 0, icon: '🌳',
    desc: '上海最大城市公园，儿童游乐设施齐全，草坪宽阔适合野餐，老人推着轮椅也能轻松游览。',
    address: '浦东新区锦绣路1001号'
  },
  {
    id: 'act_002', name: '上海科技馆', type: 'museum',
    tags: ['亲子','室内','科技','互动','教育'],
    suitable_for: ['family'],
    min_age: 3, duration_min: 150, rating: 4.6, distance_km: 3.8,
    open_now: true, ticket_price: 60, icon: '🔬',
    desc: '寓教于乐的科技互动体验馆，孩子能亲手做实验，周末需提前预约。',
    address: '浦东新区世纪大道2000号'
  },
  {
    id: 'act_003', name: '上海野生动物园', type: 'park',
    tags: ['亲子','动物','户外','刺激'],
    suitable_for: ['family'],
    min_age: 2, duration_min: 180, rating: 4.5, distance_km: 28.0,
    open_now: true, ticket_price: 180, icon: '🦁',
    desc: '可近距离接触动物，小朋友最爱，距市区较远建议自驾。',
    address: '浦东新区南六公路178号'
  },
  {
    id: 'act_004', name: 'K11购物艺术中心', type: 'mall',
    tags: ['亲子','室内','艺术','购物','雨天'],
    suitable_for: ['family','couple','friends'],
    min_age: 0, duration_min: 90, rating: 4.5, distance_km: 1.2,
    open_now: true, ticket_price: 0, icon: '🛍️',
    desc: '艺术与商业结合，B3层有互动儿童区，适合饭后遛娃，雨天首选。',
    address: '黄浦区淮海中路300号'
  },
  {
    id: 'act_005', name: '上海自然博物馆', type: 'museum',
    tags: ['亲子','室内','科普','恐龙','教育'],
    suitable_for: ['family'],
    min_age: 3, duration_min: 120, rating: 4.8, distance_km: 5.5,
    open_now: true, ticket_price: 30, icon: '🦕',
    desc: '超人气科普博物馆，恐龙化石镇馆之宝，周末需提前一周预约门票。',
    address: '静安区北京西路510号'
  },
  // ── Citywalk / 朋友 ──────────────────────────────────────────
  {
    id: 'act_006', name: '武康路历史文化街区', type: 'citywalk',
    tags: ['citywalk','打卡','历史建筑','咖啡','法式'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 90, rating: 4.9, distance_km: 4.1,
    open_now: true, ticket_price: 0, icon: '🏛️',
    desc: '上海最美法式梧桐马路，沿途精品咖啡馆、独立书店和历史建筑，4人同行正好。',
    address: '徐汇区武康路'
  },
  {
    id: 'act_007', name: 'TX淮海·潮流文化公园', type: 'mall',
    tags: ['潮流','艺术','拍照','展览','年轻'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 90, rating: 4.6, distance_km: 1.5,
    open_now: true, ticket_price: 0, icon: '🎨',
    desc: '沉浸式潮流地标，周末常有快闪展览和文化活动，适合年轻人打卡拍照。',
    address: '黄浦区淮海中路999号'
  },
  {
    id: 'act_008', name: '上海当代艺术博物馆 PSA', type: 'exhibition',
    tags: ['展览','当代艺术','室内','拍照','文艺'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 120, rating: 4.7, distance_km: 2.3,
    open_now: true, ticket_price: 40, icon: '🖼️',
    desc: '中国第一家公立当代艺术博物馆，常设大型国际展览，文艺青年必去。',
    address: '黄浦区花园港路200号'
  },
  {
    id: 'act_009', name: '思南公馆', type: 'citywalk',
    tags: ['citywalk','历史建筑','咖啡','文艺','花园'],
    suitable_for: ['friends','couple','family'],
    min_age: 0, duration_min: 60, rating: 4.6, distance_km: 2.8,
    open_now: true, ticket_price: 0, icon: '🌸',
    desc: '保存完好的欧式历史建筑群，周末常有市集和文化活动，咖啡馆遍布，适合漫步。',
    address: '黄浦区复兴中路517号'
  },
  {
    id: 'act_010', name: '上海滨江大道', type: 'outdoor',
    tags: ['户外','江景','骑行','散步','免费'],
    suitable_for: ['friends','couple','family','senior'],
    min_age: 0, duration_min: 90, rating: 4.5, distance_km: 2.0,
    open_now: true, ticket_price: 0, icon: '🌊',
    desc: '浦东滨江景观带，可俯瞰外滩对岸景色，傍晚最美，适合散步或骑行。',
    address: '浦东新区滨江大道'
  },
  // ── 情侣 ─────────────────────────────────────────────────────
  {
    id: 'act_011', name: '上海植物园', type: 'park',
    tags: ['花园','浪漫','户外','拍照','情侣'],
    suitable_for: ['couple','family','senior'],
    min_age: 0, duration_min: 120, rating: 4.4, distance_km: 9.5,
    open_now: true, ticket_price: 15, icon: '🌺',
    desc: '四季有花，温室展览别具一格，是拍照和悠闲漫步的好去处。',
    address: '徐汇区龙吴路1111号'
  },
  {
    id: 'act_012', name: '1933老场坊', type: 'exhibition',
    tags: ['工业遗址','文创','展览','拍照','独特'],
    suitable_for: ['couple','friends'],
    min_age: 0, duration_min: 60, rating: 4.3, distance_km: 4.6,
    open_now: true, ticket_price: 0, icon: '🏭',
    desc: '百年屠宰场改造的创意园区，空间极具设计感，各类展览轮番上演。',
    address: '虹口区沙泾路10号'
  },
  // ── 长辈 / 老年人 ─────────────────────────────────────────────
  {
    id: 'act_013', name: '人民广场及周边', type: 'outdoor',
    tags: ['散步','免费','无障碍','长辈','市中心'],
    suitable_for: ['senior','family'],
    min_age: 0, duration_min: 60, rating: 4.3, distance_km: 1.5,
    open_now: true, ticket_price: 0, icon: '🏙️',
    desc: '市中心广场，平坦宽阔无台阶，适合老人散步，周边博物馆群可顺道参观。',
    address: '黄浦区人民大道'
  },
  {
    id: 'act_014', name: '上海博物馆', type: 'museum',
    tags: ['文化','历史','室内','免费','长辈','无障碍'],
    suitable_for: ['senior','family','friends'],
    min_age: 0, duration_min: 120, rating: 4.8, distance_km: 1.8,
    open_now: true, ticket_price: 0, icon: '🏺',
    desc: '免费开放的国家级历史博物馆，青铜器、书画藏品丰富，老人文化游首选。',
    address: '黄浦区人民大道201号'
  }
];

const SCORE_WEIGHTS = {
  suitability: 0.35, rating: 0.25,
  distance: 0.20,    preference: 0.15, child_safety: 0.05
};

async function searchActivities(intent, options = {}) {
  const { limit = 6, minRating = 4.0, mockDelayMs = 200 } = options;
  await new Promise(r => setTimeout(r, mockDelayMs));

  try {
    let candidates = ACTIVITIES_DB.filter(a => {
      if (a.rating < minRating) return false;
      if (a.distance_km > intent.radius_km * 1.2) return false;
      if (intent.children && intent.children.length > 0) {
        const minChildAge = Math.min(...intent.children.map(c => c.age));
        if (a.min_age > minChildAge) return false;
      }
      return true;
    });

    candidates = candidates
      .map(a => ({ ...a, _score: computeScore(a, intent) }))
      .sort((a, b) => b._score - a._score);

    const result = diversify(candidates, limit);
    const activities = result.map(a => formatActivity(a, intent));

    return {
      ok: true, activities,
      meta: { total_candidates: candidates.length, source: 'mock' }
    };
  } catch (err) {
    return {
      ok: false, error: err.message,
      activities: getFallbackActivities(intent),
      meta: { source: 'fallback' }
    };
  }
}

function computeScore(activity, intent) {
  let score = 0;
  const suitability = activity.suitable_for.includes(intent.group_type) ? 1.0 : 0.3;
  score += SCORE_WEIGHTS.suitability * suitability;
  score += SCORE_WEIGHTS.rating * (activity.rating / 5.0);
  const distScore = Math.max(0, 1 - activity.distance_km / (intent.radius_km * 1.2));
  score += SCORE_WEIGHTS.distance * distScore;
  const prefs = intent.preferences || [];
  if (prefs.length > 0) {
    const matchCount = prefs.filter(p =>
      activity.tags.some(t => t.includes(p) || p.includes(t))
    ).length;
    score += SCORE_WEIGHTS.preference * (matchCount / prefs.length);
  } else {
    score += SCORE_WEIGHTS.preference * 0.5;
  }
  if (intent.children && intent.children.length > 0) {
    const cf = activity.tags.some(t => ['亲子','儿童','互动','游乐'].includes(t));
    score += SCORE_WEIGHTS.child_safety * (cf ? 1.0 : 0.0);
  }
  return score;
}

function diversify(sorted, limit) {
  const result = [], typeCount = {};
  for (const a of sorted) {
    if (result.length >= limit) break;
    typeCount[a.type] = typeCount[a.type] || 0;
    if (typeCount[a.type] < 2) { result.push(a); typeCount[a.type]++; }
  }
  if (result.length < Math.min(limit, 3)) {
    for (const a of sorted) {
      if (result.length >= limit) break;
      if (!result.find(r => r.id === a.id)) result.push(a);
    }
  }
  return result;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function mockAvailability(type) {
  const needBooking = ['museum','exhibition'].includes(type);
  const r = Math.random();
  if (needBooking) {
    if (r < 0.4) return { status: 'available', label: '可直接入场' };
    if (r < 0.8) return { status: 'booking',   label: '建议提前预约' };
    return           { status: 'crowded',       label: '今日较拥挤' };
  }
  if (r < 0.7) return { status: 'available', label: '随时可去' };
  return         { status: 'busy',           label: '周末较热门' };
}

function buildBadge(availability, ticketPrice) {
  const map = { available: null, booking: '📅 建议预约', crowded: '⚠️ 今日拥挤', busy: '🔥 周末热门' };
  const badge = map[availability.status];
  if (ticketPrice === 0 && !badge) return '✅ 免费';
  return badge;
}

function formatActivity(raw, intent) {
  const [sh, sm] = (intent.start_time || '14:00').split(':').map(Number);
  const startMin = sh * 60 + sm;
  const arrivalTime = minutesToTime(startMin);
  const endTime = minutesToTime(startMin + raw.duration_min);
  const availability = mockAvailability(raw.type);
  return {
    id: raw.id, name: raw.name, type: raw.type, icon: raw.icon,
    tags: raw.tags.slice(0, 4), desc: raw.desc, address: raw.address,
    rating: raw.rating, distance_km: raw.distance_km,
    distance_text: `${raw.distance_km}km`,
    duration_min: raw.duration_min,
    duration_text: raw.duration_min >= 60
      ? `${raw.duration_min / 60}小时` : `${raw.duration_min}分钟`,
    time_range: `${arrivalTime} - ${endTime}`,
    arrival_time: arrivalTime,
    ticket_price: raw.ticket_price,
    price_text: raw.ticket_price === 0 ? '免费' : `¥${raw.ticket_price}/人`,
    open_now: raw.open_now, availability,
    badge: buildBadge(availability, raw.ticket_price),
    score: Math.round((raw._score || 0) * 100),
    category: 'activity'
  };
}

function getFallbackActivities(intent) {
  const isFamily = ['family','senior'].includes(intent.group_type);
  const pool = isFamily
    ? ACTIVITIES_DB.filter(a => a.suitable_for.includes('family')).slice(0, 3)
    : ACTIVITIES_DB.filter(a => a.suitable_for.includes('friends')).slice(0, 3);
  return pool.map(a => formatActivity({ ...a, _score: 0.5 }, intent));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchActivities, computeScore, formatActivity, ACTIVITIES_DB };
} else {
  window.searchActivities = searchActivities;
}