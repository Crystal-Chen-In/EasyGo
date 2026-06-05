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
  },
  {
    id: 'act_015', name: '豫园及城隍庙街区', type: 'citywalk',
    tags: ['citywalk','历史建筑','小吃','夜景','上海特色'],
    suitable_for: ['family','friends','senior'],
    min_age: 0, duration_min: 120, rating: 4.6, distance_km: 2.6,
    open_now: true, ticket_price: 40, icon: '🏮',
    desc: '古典园林与老城厢商业街相连，适合边逛边吃，节假日人流较大建议错峰。',
    address: '黄浦区福佑路168号'
  },
  {
    id: 'act_016', name: '外滩源历史风貌区', type: 'citywalk',
    tags: ['citywalk','万国建筑','拍照','免费','江景'],
    suitable_for: ['friends','couple','senior'],
    min_age: 0, duration_min: 90, rating: 4.8, distance_km: 2.4,
    open_now: true, ticket_price: 0, icon: '🏛️',
    desc: '圆明园路、虎丘路一带建筑密集，咖啡馆和展览空间多，适合轻松散步。',
    address: '黄浦区圆明园路'
  },
  {
    id: 'act_017', name: '武康大楼打卡线', type: 'citywalk',
    tags: ['citywalk','历史建筑','拍照','梧桐区','免费'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 75, rating: 4.7, distance_km: 4.8,
    open_now: true, ticket_price: 0, icon: '📷',
    desc: '从武康大楼延伸到安福路，沿线小店密集，适合周末半日漫游。',
    address: '徐汇区淮海中路1850号'
  },
  {
    id: 'act_018', name: '上海图书馆东馆', type: 'museum',
    tags: ['室内','阅读','免费','亲子','安静'],
    suitable_for: ['family','friends','senior'],
    min_age: 0, duration_min: 120, rating: 4.8, distance_km: 6.2,
    open_now: true, ticket_price: 0, icon: '📚',
    desc: '空间开阔、儿童阅读区完善，雨天或炎热午后很适合安排低强度活动。',
    address: '浦东新区合欢路300号'
  },
  {
    id: 'act_019', name: '上海儿童博物馆', type: 'museum',
    tags: ['亲子','室内','互动','教育','雨天'],
    suitable_for: ['family'],
    min_age: 2, duration_min: 100, rating: 4.4, distance_km: 6.0,
    open_now: true, ticket_price: 0, icon: '🧸',
    desc: '面向低龄儿童的科普互动空间，动线短、节奏轻，适合亲子周末闲逛。',
    address: '长宁区宋园路61号'
  },
  {
    id: 'act_020', name: '上海海洋水族馆', type: 'museum',
    tags: ['亲子','室内','海洋','雨天','互动'],
    suitable_for: ['family','couple'],
    min_age: 0, duration_min: 120, rating: 4.5, distance_km: 3.1,
    open_now: true, ticket_price: 160, icon: '🐠',
    desc: '海底隧道和主题展区适合孩子观察海洋生物，雨天备用方案很稳。',
    address: '浦东新区陆家嘴环路1388号'
  },
  {
    id: 'act_021', name: '上海迪士尼小镇', type: 'mall',
    tags: ['亲子','免费','购物','演出','户外'],
    suitable_for: ['family','couple','friends'],
    min_age: 0, duration_min: 150, rating: 4.7, distance_km: 20.0,
    open_now: true, ticket_price: 0, icon: '🏰',
    desc: '不用进园也能感受迪士尼氛围，餐饮、商店和湖畔步道适合轻松半日游。',
    address: '浦东新区申迪西路255弄'
  },
  {
    id: 'act_022', name: '上海长风海洋世界', type: 'museum',
    tags: ['亲子','室内','海洋','雨天','表演'],
    suitable_for: ['family'],
    min_age: 2, duration_min: 120, rating: 4.3, distance_km: 7.8,
    open_now: true, ticket_price: 180, icon: '🐬',
    desc: '位于长风公园内，海洋动物展区集中，适合亲子安排一个下午。',
    address: '普陀区大渡河路451号'
  },
  {
    id: 'act_023', name: '长风公园', type: 'park',
    tags: ['亲子','户外','划船','免费','草坪'],
    suitable_for: ['family','senior','couple'],
    min_age: 0, duration_min: 120, rating: 4.5, distance_km: 7.5,
    open_now: true, ticket_price: 0, icon: '🚣',
    desc: '湖面开阔、绿地多，老人散步和孩子放电都合适，还能顺路安排海洋世界。',
    address: '普陀区大渡河路189号'
  },
  {
    id: 'act_024', name: '共青森林公园', type: 'park',
    tags: ['户外','森林','亲子','烧烤','骑行'],
    suitable_for: ['family','friends','senior'],
    min_age: 0, duration_min: 180, rating: 4.6, distance_km: 12.0,
    open_now: true, ticket_price: 15, icon: '🌲',
    desc: '林地面积大，适合骑行、露营感散步和家庭野餐，周末建议早点出发。',
    address: '杨浦区军工路2000号'
  },
  {
    id: 'act_025', name: '上海辰山植物园', type: 'park',
    tags: ['花园','户外','亲子','拍照','自然'],
    suitable_for: ['family','couple','senior'],
    min_age: 0, duration_min: 180, rating: 4.7, distance_km: 28.0,
    open_now: true, ticket_price: 60, icon: '🌷',
    desc: '温室、矿坑花园和大片草坪很适合慢游，亲子和长辈同行都舒服。',
    address: '松江区辰花公路3888号'
  },
  {
    id: 'act_026', name: '上海之鱼泡泡公园', type: 'park',
    tags: ['户外','亲子','免费','湖景','露营'],
    suitable_for: ['family','friends','couple'],
    min_age: 0, duration_min: 150, rating: 4.4, distance_km: 24.0,
    open_now: true, ticket_price: 0, icon: '🫧',
    desc: '奉贤新城的湖畔公园，草坪和步道宽阔，适合轻露营和亲子放风。',
    address: '奉贤区湖堤路'
  },
  {
    id: 'act_027', name: '静安雕塑公园', type: 'park',
    tags: ['免费','户外','艺术','散步','亲子'],
    suitable_for: ['family','couple','senior'],
    min_age: 0, duration_min: 75, rating: 4.5, distance_km: 3.0,
    open_now: true, ticket_price: 0, icon: '🗿',
    desc: '市中心小而精的开放公园，雕塑和草坪适合饭后散步，也能连接自然博物馆。',
    address: '静安区石门二路128号'
  },
  {
    id: 'act_028', name: '徐家汇书院', type: 'museum',
    tags: ['室内','阅读','免费','文化','安静'],
    suitable_for: ['friends','couple','senior'],
    min_age: 0, duration_min: 90, rating: 4.8, distance_km: 5.6,
    open_now: true, ticket_price: 0, icon: '📖',
    desc: '建筑漂亮、阅读氛围好，适合想避开人潮的周末文化休闲。',
    address: '徐汇区漕溪北路158号'
  },
  {
    id: 'act_029', name: '徐家汇源景区', type: 'citywalk',
    tags: ['citywalk','历史建筑','免费','文化','教堂'],
    suitable_for: ['friends','couple','senior'],
    min_age: 0, duration_min: 90, rating: 4.6, distance_km: 5.7,
    open_now: true, ticket_price: 0, icon: '⛪',
    desc: '教堂、藏书楼和书院可串联成轻量路线，适合文艺向 citywalk。',
    address: '徐汇区蒲西路'
  },
  {
    id: 'act_030', name: '上生新所', type: 'mall',
    tags: ['文创','咖啡','展览','拍照','宠物友好'],
    suitable_for: ['friends','couple','family'],
    min_age: 0, duration_min: 90, rating: 4.6, distance_km: 6.8,
    open_now: true, ticket_price: 0, icon: '☕',
    desc: '老建筑改造的开放街区，咖啡、买手店和小展览集中，轻松不赶路。',
    address: '长宁区延安西路1262号'
  },
  {
    id: 'act_031', name: '愚园路历史风貌街区', type: 'citywalk',
    tags: ['citywalk','咖啡','历史建筑','文艺','免费'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 90, rating: 4.7, distance_km: 5.0,
    open_now: true, ticket_price: 0, icon: '🚶',
    desc: '梧桐树、老洋房和独立小店密集，适合朋友聊天散步和轻拍照。',
    address: '长宁区愚园路'
  },
  {
    id: 'act_032', name: 'M50创意园', type: 'exhibition',
    tags: ['艺术','展览','文创','拍照','免费'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 90, rating: 4.4, distance_km: 4.7,
    open_now: true, ticket_price: 0, icon: '🎨',
    desc: '苏州河畔的画廊聚集区，展览更替快，适合周末随机探索。',
    address: '普陀区莫干山路50号'
  },
  {
    id: 'act_033', name: '苏州河华政段步道', type: 'outdoor',
    tags: ['户外','散步','免费','河景','骑行'],
    suitable_for: ['couple','friends','senior'],
    min_age: 0, duration_min: 75, rating: 4.6, distance_km: 5.8,
    open_now: true, ticket_price: 0, icon: '🌉',
    desc: '沿河步道视野舒展，串联校园和历史建筑，傍晚散步体验更好。',
    address: '长宁区万航渡路'
  },
  {
    id: 'act_034', name: '北外滩滨江绿地', type: 'outdoor',
    tags: ['江景','户外','免费','拍照','散步'],
    suitable_for: ['couple','friends','family','senior'],
    min_age: 0, duration_min: 90, rating: 4.7, distance_km: 3.5,
    open_now: true, ticket_price: 0, icon: '🌃',
    desc: '能看到陆家嘴天际线，步道平整，适合夜景拍照和低强度散步。',
    address: '虹口区东大名路'
  },
  {
    id: 'act_035', name: '前滩休闲公园', type: 'park',
    tags: ['户外','亲子','骑行','草坪','免费'],
    suitable_for: ['family','friends','couple'],
    min_age: 0, duration_min: 120, rating: 4.5, distance_km: 7.0,
    open_now: true, ticket_price: 0, icon: '🌿',
    desc: '黄浦江边的大草坪和骑行道，周末适合野餐、遛娃和看夕阳。',
    address: '浦东新区前滩大道'
  },
  {
    id: 'act_036', name: '西岸美术馆', type: 'exhibition',
    tags: ['展览','艺术','室内','拍照','文艺'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 120, rating: 4.7, distance_km: 7.2,
    open_now: true, ticket_price: 80, icon: '🖼️',
    desc: '西岸文化走廊核心展馆，展陈质量稳定，适合搭配滨江散步。',
    address: '徐汇区龙腾大道2600号'
  },
  {
    id: 'act_037', name: '油罐艺术中心', type: 'exhibition',
    tags: ['展览','艺术','工业风','拍照','江景'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 100, rating: 4.6, distance_km: 7.5,
    open_now: true, ticket_price: 60, icon: '🏭',
    desc: '油罐改造空间很有辨识度，展览和户外草坪都适合拍照打卡。',
    address: '徐汇区龙腾大道2380号'
  },
  {
    id: 'act_038', name: '上海电影博物馆', type: 'museum',
    tags: ['室内','电影','文化','雨天','互动'],
    suitable_for: ['friends','couple','family'],
    min_age: 6, duration_min: 120, rating: 4.5, distance_km: 6.3,
    open_now: true, ticket_price: 60, icon: '🎬',
    desc: '电影史、老道具和互动体验丰富，适合影迷或亲子文化活动。',
    address: '徐汇区漕溪北路595号'
  },
  {
    id: 'act_039', name: '上海交响音乐博物馆', type: 'museum',
    tags: ['音乐','室内','文化','免费','安静'],
    suitable_for: ['couple','friends','senior'],
    min_age: 0, duration_min: 75, rating: 4.5, distance_km: 4.2,
    open_now: true, ticket_price: 0, icon: '🎻',
    desc: '藏在复兴中路老洋房里的小众博物馆，安静精致，适合慢节奏探访。',
    address: '徐汇区宝庆路3号'
  },
  {
    id: 'act_040', name: '朵云书院旗舰店', type: 'mall',
    tags: ['室内','书店','高空景观','咖啡','雨天'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 75, rating: 4.6, distance_km: 2.5,
    open_now: true, ticket_price: 0, icon: '☁️',
    desc: '高层书店视野好，适合看书、喝咖啡和短暂停留，雨天也不扫兴。',
    address: '浦东新区银城中路501号上海中心52层'
  },
  {
    id: 'act_041', name: '朵云轩艺术中心', type: 'exhibition',
    tags: ['展览','艺术','室内','书画','文化'],
    suitable_for: ['friends','senior','couple'],
    min_age: 0, duration_min: 80, rating: 4.3, distance_km: 3.8,
    open_now: true, ticket_price: 0, icon: '🖌️',
    desc: '以书画艺术展为主，节奏安静，适合长辈或传统文化爱好者。',
    address: '徐汇区天钥桥路1188号'
  },
  {
    id: 'act_042', name: '南京东路步行街', type: 'citywalk',
    tags: ['购物','citywalk','夜景','免费','上海特色'],
    suitable_for: ['family','friends','senior'],
    min_age: 0, duration_min: 90, rating: 4.4, distance_km: 1.6,
    open_now: true, ticket_price: 0, icon: '🛍️',
    desc: '经典商业步行街，适合首次来沪或饭后轻逛，可顺路走到外滩。',
    address: '黄浦区南京东路'
  },
  {
    id: 'act_043', name: '静安寺商圈', type: 'mall',
    tags: ['购物','室内','咖啡','雨天','地铁方便'],
    suitable_for: ['friends','couple','senior'],
    min_age: 0, duration_min: 90, rating: 4.5, distance_km: 3.9,
    open_now: true, ticket_price: 0, icon: '🏙️',
    desc: '商场、咖啡和寺院景观集中，天气不好时也能轻松衔接餐厅。',
    address: '静安区南京西路'
  },
  {
    id: 'act_044', name: '上海当代艺术馆 MoCA', type: 'exhibition',
    tags: ['展览','室内','艺术','人民公园','文艺'],
    suitable_for: ['friends','couple'],
    min_age: 0, duration_min: 80, rating: 4.3, distance_km: 1.7,
    open_now: true, ticket_price: 60, icon: '🧩',
    desc: '人民公园内的小型当代艺术空间，适合和市中心散步路线组合。',
    address: '黄浦区南京西路231号人民公园7号门'
  },
  {
    id: 'act_045', name: '上海邮政博物馆', type: 'museum',
    tags: ['室内','历史建筑','免费','亲子','文化'],
    suitable_for: ['family','senior','friends'],
    min_age: 0, duration_min: 90, rating: 4.5, distance_km: 3.0,
    open_now: true, ticket_price: 0, icon: '✉️',
    desc: '老建筑本身很有看点，邮政主题展适合亲子科普和长辈怀旧。',
    address: '虹口区天潼路395号'
  },
  {
    id: 'act_046', name: '上海玻璃博物馆', type: 'museum',
    tags: ['亲子','室内','互动','手作','雨天'],
    suitable_for: ['family','friends'],
    min_age: 4, duration_min: 150, rating: 4.6, distance_km: 11.0,
    open_now: true, ticket_price: 80, icon: '🔮',
    desc: '玻璃艺术和互动体验兼具，孩子能看展也能参加手作活动。',
    address: '宝山区长江西路685号'
  },
  {
    id: 'act_047', name: '上海天文馆', type: 'museum',
    tags: ['亲子','室内','科普','宇宙','教育'],
    suitable_for: ['family','friends'],
    min_age: 5, duration_min: 180, rating: 4.9, distance_km: 35.0,
    open_now: true, ticket_price: 30, icon: '🪐',
    desc: '沉浸式天文科普场馆，内容密度高，适合愿意远一点出行的亲子家庭。',
    address: '浦东新区临港大道380号'
  },
  {
    id: 'act_048', name: '上海世博文化公园', type: 'park',
    tags: ['户外','亲子','免费','花园','散步'],
    suitable_for: ['family','couple','senior'],
    min_age: 0, duration_min: 150, rating: 4.7, distance_km: 4.5,
    open_now: true, ticket_price: 0, icon: '🌼',
    desc: '市区内新公园，步道宽、景观丰富，适合全家低负担休闲。',
    address: '浦东新区世博大道2200号'
  },
  {
    id: 'act_049', name: '前滩太古里', type: 'mall',
    tags: ['购物','室内','屋顶花园','咖啡','雨天'],
    suitable_for: ['friends','couple','family'],
    min_age: 0, duration_min: 120, rating: 4.6, distance_km: 7.1,
    open_now: true, ticket_price: 0, icon: '🌤️',
    desc: '开放式商业街区，屋顶步道和餐饮选择多，适合逛吃组合。',
    address: '浦东新区东育路500弄'
  },
  {
    id: 'act_050', name: '龙美术馆西岸馆', type: 'exhibition',
    tags: ['展览','艺术','室内','江景','文艺'],
    suitable_for: ['friends','couple','senior'],
    min_age: 0, duration_min: 100, rating: 4.5, distance_km: 7.0,
    open_now: true, ticket_price: 80, icon: '🏟️',
    desc: '大空间展馆适合看当代艺术，也能与西岸滨江路线顺路衔接。',
    address: '徐汇区龙腾大道3398号'
  }
];

const SCORE_WEIGHTS = {
  suitability: 0.35, rating: 0.25,
  distance: 0.20,    preference: 0.15, child_safety: 0.05
};

// Keyword chips in index.html use this helper for activity suggestions.
// Keeping the tag map here avoids duplicating tool data rules in the page layer.
const ACTIVITY_KEYWORD_TAG_MAP = {
  '剧院': ['音乐','演出','表演','剧院'],
  '餐厅': ['餐厅','美食','小吃','本帮菜','烧烤','火锅'],
  '民宿': ['民宿','酒店','住宿','精品酒店'],
  '游乐场': ['游乐','亲子','互动','刺激','儿童'],
  '商场': ['购物','商场','mall','雨天'],
  '俱乐部': ['夜生活','俱乐部','酒吧','livehouse'],
  '亲子': ['亲子','儿童','互动','教育','科普'],
  '展览': ['展览','艺术','当代艺术','书画','文艺'],
  'citywalk': ['citywalk','历史建筑','梧桐区','法式','街区'],
  '公园': ['公园','户外','草坪','骑行','森林'],
  '咖啡': ['咖啡','文创','书店','下午茶'],
  '电影院': ['电影','室内','文化','雨天'],
  '温泉': ['温泉','放松','休闲','室内'],
  '戏院': ['音乐','演出','表演','戏院','剧院'],
  '酒楼': ['餐厅','美食','本帮菜','酒楼','宴请'],
  '游乐园': ['游乐','亲子','互动','刺激','儿童'],
  '购物中心': ['购物','商场','mall','雨天'],
  'KTV': ['KTV','唱歌','室内','聚会'],
  '火锅': ['火锅','餐厅','美食','聚会'],
  '游泳': ['游泳','运动','亲子','室内'],
  '保龄球': ['保龄球','运动','室内','聚会'],
  '亲子乐园': ['亲子','儿童','互动','游乐','乐园']
};

function matchActivitiesByKeywords(keywords = []) {
  const list = Array.isArray(keywords) ? keywords : [];
  if (list.length === 0) return [];
  const allTags = list.flatMap(k => ACTIVITY_KEYWORD_TAG_MAP[k] || [k]);
  return ACTIVITIES_DB.filter(a =>
    allTags.some(tag => a.tags.some(t => t.includes(tag) || tag.includes(t)))
  );
}

async function searchActivities(intent, options = {}) {
  const { limit = 6, minRating = 4.0, mockDelayMs = 200 } = options;
  await new Promise(r => setTimeout(r, mockDelayMs));

  try {
    let candidates = ACTIVITIES_DB.filter(a => {
      if (a.rating < minRating) return false;
      if (a.distance_km > intent.radius_km * 1.2) return false;
      if (isAvoidedActivity(a, intent)) return false;
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

const AVOID_ACTIVITY_TAG_MAP = {
  '公园': ['公园','森林','草坪'],
  '户外': ['户外','公园','森林','草坪','骑行'],
  '展览': ['展览','博物馆','美术馆','艺术'],
  '博物馆': ['博物馆','展览','科普'],
  '商场': ['商场','购物','mall'],
  '购物': ['购物','商场','mall'],
  '咖啡': ['咖啡','下午茶'],
  '电影': ['电影','影院','观影'],
  'citywalk': ['citywalk','散步','街区']
};

function isAvoidedActivity(activity, intent) {
  const avoidPrefs = intent && Array.isArray(intent.avoid_preferences) ? intent.avoid_preferences : [];
  if (avoidPrefs.length === 0) return false;

  return avoidPrefs.some(pref => {
    if (pref === '公园' && activity.type === 'park') return true;
    if (pref === '户外' && ['park', 'outdoor'].includes(activity.type)) return true;
    const tags = AVOID_ACTIVITY_TAG_MAP[pref] || [pref];
    return tags.some(tag =>
      (activity.name && activity.name.includes(tag)) ||
      (activity.type && activity.type.includes(tag)) ||
      activity.tags.some(t => t.includes(tag) || tag.includes(t))
    );
  });
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
  module.exports = { searchActivities, computeScore, formatActivity, matchActivitiesByKeywords, isAvoidedActivity, ACTIVITIES_DB, ACTIVITY_KEYWORD_TAG_MAP };
} else {
  window.ACTIVITIES_DB = ACTIVITIES_DB;
  window.ACTIVITY_KEYWORD_TAG_MAP = ACTIVITY_KEYWORD_TAG_MAP;
  window.searchActivities = searchActivities;
  window.matchActivitiesByKeywords = matchActivitiesByKeywords;
}
