// 效果图素材索引
// 来源：项目素材库「园区效果图」13 张方案效果图，已按 Web 尺寸压缩为 JPEG
// 主图 ≤1920px 存于 public/assets/renders/，缩略图 ≤420px 存于 thumbs/
// 说明：以下文字为依据画面内容的客观描述，非项目方文案引用。

export const RENDER_BASE = '/assets/renders';

export const RENDERS = [
  {
    slug: '图片1',
    title: '园区整体鸟瞰',
    cat: '鸟瞰',
    note: '自西南向东北俯视：成排四层白色商务楼沿道路网格展开，屋面与内部道路关系清晰。',
  },
  {
    slug: '图片11__1_',
    title: '单体鸟瞰（退台与首层空间）',
    cat: '单体立面',
    note: '单体建筑半鸟瞰剖切视角：可见逐层退台形成的露台、内部庭院，以及首层停车空间与车辆。',
  },
  {
    slug: '图片11__2_',
    title: '沿街透视（园区出口段）',
    cat: '沿街',
    note: '沿街低层建筑立面与行道树并列，视线尽头为高层背景体量。',
  },
  {
    slug: '图片2',
    title: '主干道街景',
    cat: '沿街',
    note: '主干道一侧连续排布的四层商务楼，底层近人尺度立面与道路缓冲绿带成组出现。',
  },
  {
    slug: '图片3',
    title: '内部庭院与广场',
    cat: '内院景观',
    note: '园区内部院落：铺装广场、整形绿化与建筑围合，远景可见城市高层建筑群。',
  },
  {
    slug: '图片4',
    title: '首层架空停车与门厅',
    cat: '首层空间',
    note: '首层架空停车区域：柱网与开敞车库、车辆停放，贯通行人视线可穿透至庭院。',
  },
  {
    slug: '图片5',
    title: '中央草坪景观',
    cat: '内院景观',
    note: '大面积中央草坪与对称种植，两侧建筑呈退台形态，远景为高层塔楼。',
  },
  {
    slug: '图片6',
    title: '单体立面（带材料标注）',
    cat: '单体立面',
    note: '四层商务楼正立面透视，画面带材料做法标注文本框，用于对照封样材料。',
  },
  {
    slug: '图片7',
    title: '秋景街道透视',
    cat: '沿街',
    note: '街道两侧建筑与秋色乔木，强调沿街界面完整性与人行空间尺度。',
  },
  {
    slug: '图片8',
    title: '草坪与建筑群',
    cat: '内院景观',
    note: '以草坪为主景的建筑群透视，近景树阵遮挡部分体量，突出景观与建筑的层次关系。',
  },
  {
    slug: '图片9',
    title: '建筑群与城市天际线',
    cat: '内院景观',
    note: '园区低层建筑群体与远景城市天际线并置，反映项目与城市背景的高度关系。',
  },
  {
    slug: '博宏大厦1',
    title: '博宏大厦：黄昏沿街透视',
    cat: '博宏大厦',
    note: '园区内高层博宏大厦黄昏视角，玻璃幕墙接暖色天光，底层为沿街商业界面。',
  },
  {
    slug: '博宏大厦2',
    title: '博宏大厦：日间沿街透视',
    cat: '博宏大厦',
    note: '同一栋楼的日间视角，幕墙反射与街景清晰，可与黄昏视角对照日夜效果。',
  },
];

export const CATS = ['全部', '鸟瞰', '沿街', '内院景观', '单体立面', '首层空间', '博宏大厦'];

// 各功能模块进入画廊时的默认分类
export const MODULE_CAT = {
  sandtable: '鸟瞰',
  facade: '单体立面',
  roaming: '沿街',
  daynight: '博宏大厦',
  apartment: '单体立面',
};

export function url(slug, thumb) {
  return RENDER_BASE + (thumb ? '/thumbs/' : '/') + encodeURI(slug + '.jpg');
}

export function byCat(cat) {
  if (!cat || cat === '全部') return RENDERS.slice();
  return RENDERS.filter((r) => r.cat === cat);
}
