// 硅谷科技园 · 项目常量（权威口径，见 2026-10-13 决策记录）
// 楼栋：排除 13-B → 24 栋 4 层商务单元 + 博宏大厦(8层) + 设备房(2层)
// 技术指标：以介绍文档 1.55 为准

export const PROJECT = {
  name: '硅谷科技园',
  slogan: 'LEED 第五代总部办公园区',
  metrics: {
    landMu: 49.06,        // 用地 亩
    far: 1.55,            // 容积率（介绍文档口径）
    grossArea: 48248.48,  // 总建面 ㎡
    unitMin: 630,         // 单套最小 ㎡
    unitMax: 693,         // 单套最大 ㎡
    villas: 24,           // 4 层商务单元栋数
    floorsVilla: 4,
    towerHeight: 8,       // 博宏大厦层数
    equipment: 1,
  },
  // 商务单元分层功能（用于「户型3D展示」模块）
  villaFloors: [
    { name: '一层 · 礼遇前厅', h: 5.4, mat: 'SM1_0022' },
    { name: '二层 · 静界会谈', h: 3.5, mat: 'SM1_0022' },
    { name: '三层 · 决策场',   h: 3.3, mat: 'SM2_1465' },
    { name: '四层 · 中式热厨', h: 3.3, mat: 'SM2_1465' },
  ],
};

// 占位几何尺寸（单位：米，依据总图建筑统计表）
export const BUILDINGS = {
  villaHeight: 14.9,
  villaFoot: 16.7,
  towerHeight: 33.8,
  towerFoot: 34,
  equipHeight: 9.1,
  equipFoot: 21,
};
