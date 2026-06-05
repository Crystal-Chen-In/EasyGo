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
  },
  {
    id: 'rst_013', name: '光明邨大酒家·淮海中路店', cuisine: '本帮菜',
    tags: ['本帮菜','老字号','点心','上海特色'],
    suitable_for: ['family','senior','friends'],
    rating: 4.5, distance_km: 1.4,
    price_per_person: 90,
    healthy_score: 3,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 35,
    open_now: true, icon: '🥢',
    desc: '老上海人常去的本帮菜和熟食点心店，适合想吃传统口味的家庭聚餐。',
    address: '黄浦区淮海中路588号'
  },
  {
    id: 'rst_014', name: '上海老饭店·豫园店', cuisine: '本帮菜',
    tags: ['本帮菜','老字号','宴请','上海特色'],
    suitable_for: ['family','senior','friends'],
    rating: 4.4, distance_km: 2.5,
    price_per_person: 160,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🍲',
    desc: '经典本帮菜馆，八宝鸭和红烧类菜品稳定，适合豫园路线后的正餐。',
    address: '黄浦区福佑路242号'
  },
  {
    id: 'rst_015', name: '德兴馆·广东路总店', cuisine: '本帮菜',
    tags: ['本帮菜','老字号','面馆','性价比'],
    suitable_for: ['family','senior','friends'],
    rating: 4.3, distance_km: 1.8,
    price_per_person: 55,
    healthy_score: 3,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 20,
    open_now: true, icon: '🍜',
    desc: '焖肉面、爆鱼面等上海老味道集中，适合活动前后快速补能。',
    address: '黄浦区广东路471号'
  },
  {
    id: 'rst_016', name: '绿波廊·豫园店', cuisine: '本帮菜',
    tags: ['本帮菜','点心','老字号','景观'],
    suitable_for: ['family','senior','couple'],
    rating: 4.5, distance_km: 2.6,
    price_per_person: 180,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🥟',
    desc: '豫园核心位置的老牌餐厅，点心和本帮菜兼有，适合带长辈慢慢吃。',
    address: '黄浦区豫园路115号'
  },
  {
    id: 'rst_017', name: '小杨生煎·南京东路店', cuisine: '小吃',
    tags: ['小吃','生煎','性价比','上海特色'],
    suitable_for: ['friends','family'],
    rating: 4.3, distance_km: 1.5,
    price_per_person: 35,
    healthy_score: 2,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 18,
    open_now: true, icon: '🥟',
    desc: '经典生煎连锁，翻台快，适合南京路或人民广场附近的轻食安排。',
    address: '黄浦区南京东路720号'
  },
  {
    id: 'rst_018', name: '佳家汤包·黄河路店', cuisine: '点心',
    tags: ['小笼包','点心','人气','上海特色'],
    suitable_for: ['friends','family'],
    rating: 4.5, distance_km: 1.6,
    price_per_person: 45,
    healthy_score: 2,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 35,
    open_now: true, icon: '🥣',
    desc: '汤包人气店，适合想体验上海点心的游客，周末排队明显。',
    address: '黄浦区黄河路90号'
  },
  {
    id: 'rst_019', name: '莱莱小笼·天津路店', cuisine: '点心',
    tags: ['小笼包','蟹粉','点心','人气'],
    suitable_for: ['friends','couple','family'],
    rating: 4.6, distance_km: 1.7,
    price_per_person: 70,
    healthy_score: 2,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 40,
    open_now: true, icon: '🦀',
    desc: '蟹粉小笼口碑高，适合愿意排队尝鲜的朋友或情侣。',
    address: '黄浦区天津路506号'
  },
  {
    id: 'rst_020', name: '苏小柳点心·陆家嘴中心店', cuisine: '江浙菜',
    tags: ['点心','江浙菜','儿童友好','可预约'],
    suitable_for: ['family','friends','senior'],
    rating: 4.5, distance_km: 2.3,
    price_per_person: 95,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🍵',
    desc: '环境清爽、菜品口味温和，适合亲子和长辈一起用餐。',
    address: '浦东新区浦东南路899号'
  },
  {
    id: 'rst_021', name: '桂满陇·新天地店', cuisine: '江浙菜',
    tags: ['江浙菜','杭州菜','环境好','可预约'],
    suitable_for: ['family','couple','friends'],
    rating: 4.5, distance_km: 1.9,
    price_per_person: 120,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🍃',
    desc: '江浙菜口味清淡，装修有氛围，适合逛新天地后的轻松正餐。',
    address: '黄浦区兴业路123弄'
  },
  {
    id: 'rst_022', name: '弄堂里·静安大悦城店', cuisine: '江浙菜',
    tags: ['江浙菜','家常','性价比','儿童友好'],
    suitable_for: ['family','friends','senior'],
    rating: 4.3, distance_km: 3.4,
    price_per_person: 75,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🍚',
    desc: '菜式丰富、口味稳妥，适合多人随意聚餐和亲子商场动线。',
    address: '静安区西藏北路166号'
  },
  {
    id: 'rst_023', name: '丰收日·人民广场店', cuisine: '江浙菜',
    tags: ['海鲜','江浙菜','家庭聚餐','可预约'],
    suitable_for: ['family','senior','friends'],
    rating: 4.4, distance_km: 1.4,
    price_per_person: 130,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 18,
    open_now: true, icon: '🦐',
    desc: '海鲜和江浙家常菜选择多，包间友好，适合家庭或长辈聚餐。',
    address: '黄浦区南京西路'
  },
  {
    id: 'rst_024', name: '松鹤楼面馆·新天地店', cuisine: '苏帮菜',
    tags: ['面馆','苏帮菜','性价比','清淡'],
    suitable_for: ['family','senior','friends'],
    rating: 4.4, distance_km: 1.8,
    price_per_person: 60,
    healthy_score: 4,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 12,
    open_now: true, icon: '🍜',
    desc: '苏式汤面和小菜稳定，清淡不重油，适合作为活动后的轻正餐。',
    address: '黄浦区太仓路181弄'
  },
  {
    id: 'rst_025', name: '蔡嘉法式甜品·淮海中路店', cuisine: '甜品',
    tags: ['甜品','下午茶','精致','拍照'],
    suitable_for: ['friends','couple'],
    rating: 4.6, distance_km: 1.3,
    price_per_person: 85,
    healthy_score: 2,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 10,
    open_now: true, icon: '🍰',
    desc: '精致甜品和咖啡适合下午茶，适合朋友聊天或情侣短暂停留。',
    address: '黄浦区淮海中路'
  },
  {
    id: 'rst_026', name: 'Seesaw Coffee·静安嘉里中心店', cuisine: '咖啡',
    tags: ['咖啡','下午茶','商场','轻食'],
    suitable_for: ['friends','couple'],
    rating: 4.4, distance_km: 3.7,
    price_per_person: 55,
    healthy_score: 3,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 8,
    open_now: true, icon: '☕',
    desc: '精品咖啡连锁，商场内交通方便，适合雨天活动中转休息。',
    address: '静安区南京西路1515号'
  },
  {
    id: 'rst_027', name: 'Peet’s Coffee·陆家嘴店', cuisine: '咖啡',
    tags: ['咖啡','轻食','下午茶','商务'],
    suitable_for: ['friends','couple','family'],
    rating: 4.3, distance_km: 2.2,
    price_per_person: 50,
    healthy_score: 3,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 6,
    open_now: true, icon: '🥐',
    desc: '咖啡和简餐都稳，适合陆家嘴附近活动前后的短休。',
    address: '浦东新区世纪大道8号'
  },
  {
    id: 'rst_028', name: 'Manner Coffee·武康路店', cuisine: '咖啡',
    tags: ['咖啡','citywalk','性价比','外带'],
    suitable_for: ['friends','couple'],
    rating: 4.4, distance_km: 4.7,
    price_per_person: 25,
    healthy_score: 3,
    kid_menu: false, wheelchair: false, reservable: false,
    wait_base_min: 8,
    open_now: true, icon: '☕',
    desc: '适合武康路散步时外带一杯，价格友好但座位有限。',
    address: '徐汇区武康路'
  },
  {
    id: 'rst_029', name: 'Baker & Spice·安福路店', cuisine: '西餐',
    tags: ['轻食','面包','咖啡','早午餐'],
    suitable_for: ['friends','couple','family'],
    rating: 4.4, distance_km: 4.6,
    price_per_person: 95,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: false,
    wait_base_min: 15,
    open_now: true, icon: '🥖',
    desc: '面包、沙拉和简餐选择丰富，适合安福路周边慢逛后的早午餐。',
    address: '徐汇区安福路'
  },
  {
    id: 'rst_030', name: 'Blue Frog蓝蛙·新天地店', cuisine: '西餐',
    tags: ['西餐','汉堡','聚会','可预约'],
    suitable_for: ['friends','couple','family'],
    rating: 4.3, distance_km: 1.8,
    price_per_person: 130,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 15,
    open_now: true, icon: '🍔',
    desc: '汉堡、沙拉和饮品选择多，氛围轻松，适合朋友聚餐。',
    address: '黄浦区太仓路181弄'
  },
  {
    id: 'rst_031', name: 'Shake Shack·新天地店', cuisine: '西餐',
    tags: ['汉堡','快餐','亲子','网红'],
    suitable_for: ['friends','family','couple'],
    rating: 4.4, distance_km: 1.7,
    price_per_person: 85,
    healthy_score: 2,
    kid_menu: true, wheelchair: true, reservable: false,
    wait_base_min: 18,
    open_now: true, icon: '🍟',
    desc: '汉堡和奶昔适合快速解决一餐，亲子接受度高，饭点会排队。',
    address: '黄浦区兴业路123弄'
  },
  {
    id: 'rst_032', name: 'Pizza Marzano·来福士店', cuisine: '西餐',
    tags: ['披萨','儿童友好','商场','可预约'],
    suitable_for: ['family','friends','couple'],
    rating: 4.4, distance_km: 1.2,
    price_per_person: 115,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 12,
    open_now: true, icon: '🍕',
    desc: '披萨、意面和沙拉都稳，商场位置方便，适合带孩子用餐。',
    address: '黄浦区西藏中路268号'
  },
  {
    id: 'rst_033', name: 'gaga·前滩太古里店', cuisine: '轻食',
    tags: ['轻食','健康','下午茶','拍照'],
    suitable_for: ['friends','couple','family'],
    rating: 4.5, distance_km: 7.0,
    price_per_person: 105,
    healthy_score: 5,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 12,
    open_now: true, icon: '🥗',
    desc: '沙拉、意面和茶饮选择多，环境明亮，适合前滩路线后的清爽餐。',
    address: '浦东新区东育路500弄'
  },
  {
    id: 'rst_034', name: 'Element Fresh新元素·陆家嘴店', cuisine: '轻食',
    tags: ['健康','轻食','沙拉','低卡'],
    suitable_for: ['friends','couple','family'],
    rating: 4.4, distance_km: 2.4,
    price_per_person: 120,
    healthy_score: 5,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 10,
    open_now: true, icon: '🥙',
    desc: '健康轻食和果昔选择多，适合有减脂或低油需求的人群。',
    address: '浦东新区世纪大道8号'
  },
  {
    id: 'rst_035', name: '大蔬无界·外滩店', cuisine: '素食',
    tags: ['素食','健康','精致','可预约'],
    suitable_for: ['couple','friends','senior'],
    rating: 4.6, distance_km: 2.2,
    price_per_person: 220,
    healthy_score: 5,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 10,
    open_now: true, icon: '🥬',
    desc: '精致素食餐厅，环境安静，适合有素食需求或想吃清淡的人。',
    address: '黄浦区中山东一路'
  },
  {
    id: 'rst_036', name: '福和慧', cuisine: '素食',
    tags: ['素食','米其林','精致','可预约'],
    suitable_for: ['couple','friends','senior'],
    rating: 4.8, distance_km: 4.8,
    price_per_person: 600,
    healthy_score: 5,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 5,
    open_now: true, icon: '🍄',
    desc: '高端素食代表，适合纪念日或安静精致的晚餐安排。',
    address: '长宁区愚园路1037号'
  },
  {
    id: 'rst_037', name: '耶里夏丽·南京西路店', cuisine: '新疆菜',
    tags: ['新疆菜','烤串','聚会','家庭'],
    suitable_for: ['family','friends'],
    rating: 4.5, distance_km: 3.1,
    price_per_person: 110,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 22,
    open_now: true, icon: '🍢',
    desc: '大盘鸡、羊肉串和手抓饭适合多人分享，家庭聚餐氛围热闹。',
    address: '静安区南京西路'
  },
  {
    id: 'rst_038', name: '西贝莜面村·环球港店', cuisine: '西北菜',
    tags: ['西北菜','儿童友好','商场','可预约'],
    suitable_for: ['family','senior','friends'],
    rating: 4.4, distance_km: 7.2,
    price_per_person: 95,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 20,
    open_now: true, icon: '🥘',
    desc: '儿童餐和亲子服务成熟，商场动线友好，适合全家稳定吃饭。',
    address: '普陀区中山北路3300号'
  },
  {
    id: 'rst_039', name: '赤坂亭·陆家嘴店', cuisine: '日料',
    tags: ['日料','烧肉','自助','聚会'],
    suitable_for: ['friends','family','couple'],
    rating: 4.3, distance_km: 2.6,
    price_per_person: 180,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 18,
    open_now: true, icon: '🥩',
    desc: '日式烧肉选择丰富，适合朋友聚餐或家庭改善餐。',
    address: '浦东新区陆家嘴西路'
  },
  {
    id: 'rst_040', name: '平成屋·人民广场店', cuisine: '日料',
    tags: ['日料','居酒屋','性价比','聚会'],
    suitable_for: ['friends','couple'],
    rating: 4.4, distance_km: 1.3,
    price_per_person: 100,
    healthy_score: 3,
    kid_menu: false, wheelchair: false, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🍱',
    desc: '居酒屋氛围浓，适合朋友小聚，位置靠近市中心活动区。',
    address: '黄浦区浙江中路'
  },
  {
    id: 'rst_041', name: '鳗重·静安寺店', cuisine: '日料',
    tags: ['日料','鳗鱼饭','安静','可预约'],
    suitable_for: ['couple','friends','senior'],
    rating: 4.6, distance_km: 3.8,
    price_per_person: 160,
    healthy_score: 4,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 15,
    open_now: true, icon: '🍚',
    desc: '鳗鱼饭出品稳定，环境安静，适合不想吃太油重的一餐。',
    address: '静安区南京西路'
  },
  {
    id: 'rst_042', name: '左庭右院鲜牛肉火锅·人民广场店', cuisine: '火锅',
    tags: ['火锅','牛肉','可预约','家庭'],
    suitable_for: ['family','friends','senior'],
    rating: 4.5, distance_km: 1.5,
    price_per_person: 140,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🍲',
    desc: '鲜牛肉火锅口味相对清爽，老人和孩子接受度比重辣火锅更高。',
    address: '黄浦区西藏中路'
  },
  {
    id: 'rst_043', name: '怂重庆火锅厂·新天地店', cuisine: '火锅',
    tags: ['火锅','重庆','网红','聚会'],
    suitable_for: ['friends','couple'],
    rating: 4.5, distance_km: 1.9,
    price_per_person: 150,
    healthy_score: 2,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 35,
    open_now: true, icon: '🌶️',
    desc: '氛围热闹、锅底重口，适合朋友聚会，周末最好提前预约。',
    address: '黄浦区马当路'
  },
  {
    id: 'rst_044', name: '小龙坎火锅·南京东路店', cuisine: '火锅',
    tags: ['火锅','川渝','人气','聚会'],
    suitable_for: ['friends'],
    rating: 4.3, distance_km: 1.6,
    price_per_person: 125,
    healthy_score: 2,
    kid_menu: false, wheelchair: false, reservable: true,
    wait_base_min: 40,
    open_now: true, icon: '🥘',
    desc: '川渝火锅氛围足，适合朋友饭局，不适合清淡或低油需求。',
    address: '黄浦区南京东路'
  },
  {
    id: 'rst_045', name: '很久以前羊肉串·静安店', cuisine: '烧烤',
    tags: ['烧烤','羊肉串','聚会','夜宵'],
    suitable_for: ['friends','couple'],
    rating: 4.4, distance_km: 3.6,
    price_per_person: 130,
    healthy_score: 2,
    kid_menu: false, wheelchair: true, reservable: true,
    wait_base_min: 30,
    open_now: true, icon: '🍖',
    desc: '烤串氛围强，适合朋友活动后继续聊天，饭点排队偏明显。',
    address: '静安区南京西路'
  },
  {
    id: 'rst_046', name: '宝莱纳餐厅·北外滩店', cuisine: '西餐',
    tags: ['西餐','德餐','江景','聚会'],
    suitable_for: ['friends','couple','family'],
    rating: 4.4, distance_km: 3.4,
    price_per_person: 190,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 12,
    open_now: true, icon: '🍺',
    desc: '德式餐厅和江景组合，适合北外滩散步后的聚餐。',
    address: '虹口区东大名路'
  },
  {
    id: 'rst_047', name: 'COMMUNE·上生新所店', cuisine: '西餐',
    tags: ['西餐','轻食','聚会','宠物友好'],
    suitable_for: ['friends','couple','family'],
    rating: 4.3, distance_km: 6.8,
    price_per_person: 120,
    healthy_score: 3,
    kid_menu: true, wheelchair: true, reservable: true,
    wait_base_min: 18,
    open_now: true, icon: '🍹',
    desc: '开放街区里的轻松西餐，适合上生新所逛完后继续聊天。',
    address: '长宁区延安西路1262号'
  },
  {
    id: 'rst_048', name: '鸟啸·安福路店', cuisine: '日料',
    tags: ['日料','烧鸟','小酒馆','可预约'],
    suitable_for: ['friends','couple'],
    rating: 4.5, distance_km: 4.6,
    price_per_person: 170,
    healthy_score: 3,
    kid_menu: false, wheelchair: false, reservable: true,
    wait_base_min: 25,
    open_now: true, icon: '🍢',
    desc: '烧鸟小店氛围适合二三人小聚，安福路路线后很顺。',
    address: '徐汇区安福路'
  },
  {
    id: 'rst_049', name: '老乡鸡·人民广场店', cuisine: '中式快餐',
    tags: ['中式快餐','性价比','健康','亲子'],
    suitable_for: ['family','friends','senior'],
    rating: 4.2, distance_km: 1.2,
    price_per_person: 35,
    healthy_score: 4,
    kid_menu: true, wheelchair: true, reservable: false,
    wait_base_min: 5,
    open_now: true, icon: '🍗',
    desc: '快速、便宜、口味稳定，适合不想排队时的兜底选择。',
    address: '黄浦区人民广场商圈'
  },
  {
    id: 'rst_050', name: '和府捞面·陆家嘴店', cuisine: '中式快餐',
    tags: ['面馆','中式快餐','清淡','商场'],
    suitable_for: ['family','senior','friends'],
    rating: 4.3, distance_km: 2.1,
    price_per_person: 55,
    healthy_score: 4,
    kid_menu: false, wheelchair: true, reservable: false,
    wait_base_min: 8,
    open_now: true, icon: '🍜',
    desc: '汤面和小食出餐快，环境比普通快餐安静，适合商场路线兜底。',
    address: '浦东新区陆家嘴商圈'
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
      if (isAvoidedRestaurant(r, intent)) return false;
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
const AVOID_RESTAURANT_TAG_MAP = {
  '餐厅': ['餐厅','美食'],
  '咖啡': ['咖啡','下午茶'],
  '火锅': ['火锅'],
  '烧烤': ['烧烤','烤串'],
  '日料': ['日料','寿司'],
  '西餐': ['西餐','汉堡','披萨'],
  '甜品': ['甜品','蛋糕','下午茶'],
  '素食': ['素食']
};

function isAvoidedRestaurant(restaurant, intent) {
  const avoidPrefs = intent && Array.isArray(intent.avoid_preferences) ? intent.avoid_preferences : [];
  if (avoidPrefs.length === 0) return false;

  return avoidPrefs.some(pref => {
    const tags = AVOID_RESTAURANT_TAG_MAP[pref];
    if (!tags) return false;
    return tags.some(tag =>
      (restaurant.name && restaurant.name.includes(tag)) ||
      (restaurant.cuisine && restaurant.cuisine.includes(tag)) ||
      restaurant.tags.some(t => t.includes(tag) || tag.includes(t))
    );
  });
}

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
  module.exports = { searchRestaurants, simulateWaitTime, computeRstScore, formatRestaurant, isAvoidedRestaurant, RESTAURANTS_DB };
} else {
  window.searchRestaurants = searchRestaurants;
}
