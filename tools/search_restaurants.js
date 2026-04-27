/**
 * Tool 3: search_restaurants
 * ─────────────────────────────────────────────────────────────
 * 职责：根据 Intent 查询餐厅，含实时等位模拟、健康度过滤、
 *       儿童友好标记，返回排序后的候选列表
 *
 * 调用：const result = await searchRestaurants(intent, options?)
 * 返回：{ ok, restaurants[], meta }
 * ─────────────────────────────────────────────────────────────
 */

// ── Mock 餐厅数据库 ───────────────────────────────────────────
// wait_base_min  平日基础等位时间（分钟），周末 × 1.5
// healthy_score  健康度 1-5（5=最健康：蔬菜/轻食/低油）
// kid_menu       是否有儿童餐
// wheelchair     是否无障碍/轮椅友好
// reservable     是否支持提前预约

const RESTAURANTS_DB = [
  // ── 本帮菜 / 中餐 ─────────────────────────────────────────
  {
    id: 'rst_001', name: '外婆家菜馆·浦东店', cuisine: '本帮菜',
    tags: ['本帮菜','儿童友好','可预约','家常'],
    suitable_for: ['family','senior'],
    rating: 4.8, distance_km: 0.8,
    price_per_person: 80,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 10,
    open_now: true, icon: '🍜',
    desc: '人气上海本帮菜，宝宝饭可免费加热，靠窗位置风景好。',
    address: '浦东新区世纪大道88号'
  },
  {
    id: 'rst_002', name: '老吉士酒家', cuisine: '本帮菜',
    tags: ['本帮菜','人气','老字号','需排队'],
    suitable_for: ['friends','couple'],
    rating: 4.6, distance_km: 0.3,
    price_per_person: 120,
    healthy_score: 2,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 30,
    open_now: true, icon: '🥘',
    desc: '明星同款本帮菜老字号，红烧肉和腌笃鲜招牌，需提前到场叫号。',
    address: '黄浦区天平路41号'
  },
  {
    id: 'rst_003', name: '南翔馒头店·城隍庙', cuisine: '点心',
    tags: ['小笼包','点心','老字号','上海特色'],
    suitable_for: ['family','friends','senior'],
    rating: 4.5, distance_km: 2.1,
    price_per_person: 60,
    healthy_score: 3,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 40,
    open_now: true, icon: '🥟',
    desc: '百年老字号小笼包，皮薄汤鲜，游客必打卡，周末排队较长。',
    address: '黄浦区豫园路85号'
  },
  {
    id: 'rst_004', name: '鼎泰丰·新天地店', cuisine: '台式点心',
    tags: ['小笼包','精致','可预约','国际知名'],
    suitable_for: ['family','couple','friends'],
    rating: 4.7, distance_km: 1.9,
    price_per_person: 150,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🍱',
    desc: '精工细作的台式点心，儿童专属餐具和儿童餐，预约后基本不用等。',
    address: '黄浦区马当路181号'
  },
  // ── 健康 / 轻食 ───────────────────────────────────────────
  {
    id: 'rst_005', name: 'wagas沙拉·陆家嘴店', cuisine: '轻食',
    tags: ['健康','轻食','沙拉','低卡','减脂'],
    suitable_for: ['friends','couple'],
    rating: 4.4, distance_km: 1.1,
    price_per_person: 90,
    healthy_score: 5,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 5,
    open_now: true, icon: '🥗',
    desc: '上海最受欢迎的健康轻食连锁，沙拉、烤鸡和全麦三明治，减脂首选。',
    address: '浦东新区陆家嘴环路1000号'
  },
  {
    id: 'rst_006', name: '新素代·素食餐厅', cuisine: '素食',
    tags: ['素食','健康','低卡','环保','精致'],
    suitable_for: ['friends','couple','senior'],
    rating: 4.3, distance_km: 3.2,
    price_per_person: 100,
    healthy_score: 5,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 5,
    open_now: true, icon: '🌱',
    desc: '精致素食料理，不输荤菜的口感，减肥或有特殊饮食需求首选。',
    address: '静安区南京西路1068号'
  },
  {
    id: 'rst_007', name: '绿茶餐厅·新天地店', cuisine: '江浙菜',
    tags: ['健康','家常','性价比','江浙菜'],
    suitable_for: ['family','friends','senior'],
    rating: 4.4, distance_km: 1.8,
    price_per_person: 70,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🍃',
    desc: '高性价比江浙家常菜，招牌面包诱惑鸡，家庭聚餐和轻松聚会都合适。',
    address: '黄浦区太仓路181号'
  },
  // ── 日料 / 西餐 ───────────────────────────────────────────
  {
    id: 'rst_008', name: '寿司郎·浦东店', cuisine: '日料',
    tags: ['日料','回转寿司','性价比','新鲜'],
    suitable_for: ['friends','couple','family'],
    rating: 4.5, distance_km: 2.4,
    price_per_person: 110,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 15,
    open_now: true, icon: '🍣',
    desc: '高人气回转寿司连锁，食材新鲜，支持线上候位，减少现场等待。',
    address: '浦东新区张杨路500号'
  },
  {
    id: 'rst_009', name: 'THE CANNERY·新天地', cuisine: '西餐',
    tags: ['西餐','精酿啤酒','聚会','美式'],
    suitable_for: ['friends','couple'],
    rating: 4.5, distance_km: 2.0,
    price_per_person: 180,
    healthy_score: 3,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 10,
    open_now: true, icon: '🍔',
    desc: '工业风美式餐厅，精酿啤酒种类繁多，适合下午茶和朋友聚餐。',
    address: '黄浦区建国中路10号'
  },
  // ── 火锅 / 烧烤 ───────────────────────────────────────────
  {
    id: 'rst_010', name: '海底捞·浦东店', cuisine: '火锅',
    tags: ['火锅','服务好','可预约','聚会'],
    suitable_for: ['family','friends','senior'],
    rating: 4.6, distance_km: 2.7,
    price_per_person: 130,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🫕',
    desc: '服务一流的火锅连锁，有儿童乐园和老人绿色通道，预约后等位时间大幅缩短。',
    address: '浦东新区张杨路500号港汇恒隆广场'
  },
  {
    id: 'rst_011', name: '巴奴毛肚火锅·徐汇店', cuisine: '火锅',
    tags: ['火锅','毛肚','人气','浓汤底'],
    suitable_for: ['friends'],
    rating: 4.7, distance_km: 5.3,
    price_per_person: 140,
    healthy_score: 2,
    kid_menu: false, wheelchair: false, reservable: true,
    wait_base_min: 45,
    open_now: true, icon: '🌶️',
    desc: '以毛肚闻名的网红火锅，汤底浓郁，朋友聚会首选，周末需提前预约。',
    address: '徐汇区天钥桥路388号'
  },
  // ── 咖啡 / 甜品（下午茶） ────────────────────────────────
  {
    id: 'rst_012', name: 'M Stand咖啡·新天地店', cuisine: '咖啡',
    tags: ['咖啡','网红','甜品','下午茶','拍照'],
    suitable_for: ['friends','couple'],
    rating: 4.5, distance_km: 1.6,
    price_per_person: 60,
    healthy_score: 3,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 10,
    open_now: true, icon: '☕',
    desc: '上海最火国产精品咖啡，工业风设计超出片，燕麦拿铁和甜品都是招牌。',
    address: '黄浦区太仓路181弄'
  }
];

// ── 等位时间模拟（考虑周末峰值） ──────────────────────────────
function simulateWaitTime(restaurant) {
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = [0, 6].includes(now.getDay());
  const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 20);

  let multiplier = 1.0;
  if (isWeekend) multiplier *= 1.5;
  if (isPeakHour) multiplier *= 1.4;

  // 加入随机波动 ±20%
  const jitter = 0.8 + Math.random() * 0.4;
  const waitMin = Math.round(restaurant.wait_base_min * multiplier * jitter);

  return {
    wait_minutes: waitMin,
    wait_text: waitMin === 0 ? '无需等位'
      : waitMin < 15 ? `约${waitMin}分钟`
      : waitMin < 30 ? `约${waitMin}分钟`
      : `约${Math.round(waitMin / 5) * 5}分钟`,
    status: waitMin === 0     ? 'no_wait'
      : waitMin < 15          ? 'short_wait'
      : waitMin < 45          ? 'medium_wait'
      : 'long_wait'
  };
}

// ── 评分权重 ──────────────────────────────────────────────────
const RST_SCORE_WEIGHTS = {
  suitability:   0.30,
  rating:        0.25,
  wait_penalty:  0.20,  // 等位越长扣分越多
  healthy:       0.15,  // 健康需求时提权
  distance:      0.10
};

async function searchRestaurants(intent, options = {}) {
  const { limit = 5, maxWaitMin = 60, mockDelayMs = 200 } = options;
  await new Promise(r => setTimeout(r, mockDelayMs));

  try {
    // 1. 基础过滤
    let candidates = RESTAURANTS_DB.filter(r => {
      if (!r.open_now) return false;
      if (r.distance_km > intent.radius_km * 1.2) return false;
      // 有孩子：必须 kid_menu 或评分够高的家庭餐厅
      if (intent.children && intent.children.length > 0) {
        if (!r.kid_menu && !r.suitable_for.includes('family')) return false;
      }
      // 轮椅/无障碍需求
      if ((intent.special_needs || []).includes('无障碍') && !r.wheelchair) return false;
      // 素食需求
      if ((intent.special_needs || []).includes('素食') && r.cuisine !== '素食') return false;
      return true;
    });

    // 2. 注入实时等位时间
    candidates = candidates.map(r => ({
      ...r,
      _wait: simulateWaitTime(r)
    }));

    // 3. 过滤等位超时的（除非可预约）
    candidates = candidates.filter(r =>
      r._wait.wait_minutes <= maxWaitMin || r.reservable
    );

    // 4. 健康饮食场景：healthy_score 低的餐厅降权
    const needHealthy = (intent.special_needs || []).includes('健康饮食');

    // 5. 综合评分排序
    candidates = candidates
      .map(r => ({ ...r, _score: computeRstScore(r, intent, needHealthy) }))
      .sort((a, b) => b._score - a._score);

    // 6. 格式化
    const restaurants = candidates.slice(0, limit).map(r => formatRestaurant(r, intent));

    return {
      ok: true, restaurants,
      meta: {
        total_candidates: candidates.length,
        healthy_mode: needHealthy,
        source: 'mock'
      }
    };
  } catch (err) {
    return {
      ok: false, error: err.message,
      restaurants: getFallbackRestaurants(intent),
      meta: { source: 'fallback' }
    };
  }
}

// ── 餐厅评分计算 ──────────────────────────────────────────────
function computeRstScore(r, intent, needHealthy) {
  let score = 0;

  // 1. 出行类型匹配
  const suit = r.suitable_for.includes(intent.group_type) ? 1.0 : 0.4;
  score += RST_SCORE_WEIGHTS.suitability * suit;

  // 2. 用户评分
  score += RST_SCORE_WEIGHTS.rating * (r.rating / 5.0);

  // 3. 等位惩罚（等位越长分越低；可预约的有折扣）
  const wait = r._wait.wait_minutes;
  const waitPenalty = r.reservable
    ? Math.max(0, 1 - wait / 120)   // 可预约的惩罚减半
    : Math.max(0, 1 - wait / 60);
  score += RST_SCORE_WEIGHTS.wait_penalty * waitPenalty;

  // 4. 健康度（有减肥/健康需求时提权 × 2）
  const healthWeight = needHealthy
    ? RST_SCORE_WEIGHTS.healthy * 2
    : RST_SCORE_WEIGHTS.healthy;
  score += healthWeight * (r.healthy_score / 5.0);

  // 5. 距离
  const distScore = Math.max(0, 1 - r.distance_km / (intent.radius_km * 1.2));
  score += RST_SCORE_WEIGHTS.distance * distScore;

  return score;
}

// ── 格式化输出 ────────────────────────────────────────────────
function formatRestaurant(raw, intent) {
  const wait = raw._wait;

  // 建议就餐时间（出发时间 + 2小时活动 + 30分钟缓冲）
  const [sh, sm] = (intent.start_time || '14:00').split(':').map(Number);
  const dinnerMin = sh * 60 + sm + 150; // 默认活动后2.5小时用餐
  const dinnerTime = minutesToTime(dinnerMin);
  const dinnerEnd  = minutesToTime(dinnerMin + 90);

  // 状态 badge
  const badge = buildRstBadge(wait, raw.reservable);

  return {
    id:               raw.id,
    name:             raw.name,
    cuisine:          raw.cuisine,
    icon:             raw.icon,
    tags:             raw.tags.slice(0, 4),
    desc:             raw.desc,
    address:          raw.address,
    rating:           raw.rating,
    distance_km:      raw.distance_km,
    distance_text:    `${raw.distance_km}km`,
    price_per_person: raw.price_per_person,
    price_text:       `¥${raw.price_per_person}/人`,
    healthy_score:    raw.healthy_score,
    kid_menu:         raw.kid_menu,
    wheelchair:       raw.wheelchair,
    reservable:       raw.reservable,
    wait_minutes:     wait.wait_minutes,
    wait_text:        wait.wait_text,
    wait_status:      wait.status,
    time_range:       `${dinnerTime} - ${dinnerEnd}`,
    arrival_time:     dinnerTime,
    badge,
    score:            Math.round((raw._score || 0) * 100),
    category:         'restaurant'
  };
}

function buildRstBadge(wait, reservable) {
  if (wait.status === 'no_wait')    return '✅ 无需等位';
  if (wait.status === 'short_wait') return `⏱️ ${wait.wait_text}`;
  if (reservable)                   return `📅 可预约·${wait.wait_text}`;
  if (wait.status === 'long_wait')  return `⚠️ 等位${wait.wait_text}`;
  return `🕐 ${wait.wait_text}`;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function getFallbackRestaurants(intent) {
  const pool = RESTAURANTS_DB
    .filter(r => r.suitable_for.includes(intent.group_type))
    .slice(0, 3);
  return pool.map(r => formatRestaurant({ ...r, _wait: { wait_minutes: 0, wait_text: '无需等位', status: 'no_wait' }, _score: 0.5 }, intent));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchRestaurants, simulateWaitTime, computeRstScore, formatRestaurant, RESTAURANTS_DB };
} else {
  window.searchRestaurants = searchRestaurants;
}