// 项目指标面板：显示当前生效口径的技术指标
// 口径说明：技术指标以项目介绍文档为准（容积率 1.55）
import { PROJECT } from '../data/project.js';

export class InfoPanel {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'info-panel';
    const m = PROJECT.metrics;
    const rows = [
      ['项目名称', PROJECT.name],
      ['用地面积', m.landMu + ' 亩'],
      ['容积率', String(m.far) + '（介绍文档口径）'],
      ['总建筑面积', m.grossArea.toLocaleString('zh-CN') + ' ㎡'],
      ['商务单元单套', m.unitMin + '–' + m.unitMax + ' ㎡'],
      ['4 层商务单元', m.villas + ' 栋 / ' + m.floorsVilla + ' 层 / 高 14.9 m'],
      ['博宏大厦', m.towerHeight + ' 层（+1 地下）/ 高 33.8 m'],
      ['设备房', m.equipment + ' 栋 / 2 层'],
    ];
    this.root.innerHTML = `
      <div class="ip-head">
        <div>
          <div class="ip-title">项目指标</div>
          <div class="ip-sub">${PROJECT.slogan}</div>
        </div>
        <button class="ip-close" type="button" aria-label="关闭">✕</button>
      </div>
      <table class="ip-table">
        ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
      </table>
      <div class="ip-foot">楼栋数已排除 13-B，全园合计 26 个单体。指标为方案阶段数据。</div>
    `;
    document.body.appendChild(this.root);
    this.root.querySelector('.ip-close').addEventListener('click', () => this.close());
    addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
  }

  toggle() { this.root.classList.toggle('show'); }
  open() { this.root.classList.add('show'); }
  close() { this.root.classList.remove('show'); }
}
