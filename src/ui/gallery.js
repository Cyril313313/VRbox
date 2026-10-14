// 效果图画廊：分类浏览 + 大图查看（方案效果图素材）
import { RENDERS, CATS, MODULE_CAT, byCat, url } from '../data/renders.js';

export class Gallery {
  constructor({ onOpen, onClose } = {}) {
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.cat = '全部';
    this.index = 0;
    this.list = [];
    this.open = false;
    this._build();
    this._bindKeys();
  }

  _build() {
    this.root = document.createElement('div');
    this.root.id = 'gallery';
    this.root.innerHTML = `
      <div class="g-head">
        <div class="g-hd-left">
          <div class="g-title">效果图赏析</div>
          <div class="g-note">素材来源：项目园区效果图（方案效果图，非建成实景）　共 ${RENDERS.length} 张</div>
        </div>
        <button class="g-close" type="button" aria-label="关闭">关闭 ✕</button>
      </div>
      <div class="g-tabs"></div>
      <div class="g-grid"></div>
      <div class="g-viewer">
        <button class="g-nav g-prev" type="button" aria-label="上一张">‹</button>
        <figure class="g-stage">
          <img alt="" />
          <figcaption>
            <div class="g-cap-title"></div>
            <div class="g-cap-note"></div>
            <div class="g-cap-count"></div>
          </figcaption>
        </figure>
        <button class="g-nav g-next" type="button" aria-label="下一张">›</button>
        <button class="g-viewer-close" type="button" aria-label="返回列表">返回列表</button>
      </div>
    `;
    document.body.appendChild(this.root);

    this.tabsEl = this.root.querySelector('.g-tabs');
    this.gridEl = this.root.querySelector('.g-grid');
    this.viewer = this.root.querySelector('.g-viewer');
    this.imgEl = this.viewer.querySelector('img');
    this.capTitle = this.viewer.querySelector('.g-cap-title');
    this.capNote = this.viewer.querySelector('.g-cap-note');
    this.capCount = this.viewer.querySelector('.g-cap-count');

    CATS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.dataset.cat = c;
      b.addEventListener('click', () => this.setCat(c));
      this.tabsEl.appendChild(b);
    });

    this.root.querySelector('.g-close').addEventListener('click', () => this.close());
    this.root.querySelector('.g-viewer-close').addEventListener('click', () => this.hideViewer());
    this.viewer.querySelector('.g-prev').addEventListener('click', (e) => { e.stopPropagation(); this.step(-1); });
    this.viewer.querySelector('.g-next').addEventListener('click', (e) => { e.stopPropagation(); this.step(1); });
    this.viewer.addEventListener('click', (e) => { if (e.target === this.viewer) this.hideViewer(); });
  }

  _bindKeys() {
    addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.key === 'Escape') {
        if (this.viewer.classList.contains('show')) this.hideViewer();
        else this.close();
      }
      if (this.viewer.classList.contains('show')) {
        if (e.key === 'ArrowLeft') this.step(-1);
        if (e.key === 'ArrowRight') this.step(1);
      }
    });
  }

  _renderGrid() {
    this.gridEl.innerHTML = '';
    this.list = byCat(this.cat);
    if (!this.list.length) {
      const empty = document.createElement('div');
      empty.className = 'g-empty';
      empty.textContent = '该分类暂无效果图。';
      this.gridEl.appendChild(empty);
      return;
    }
    this.list.forEach((r, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'g-card';
      card.innerHTML = `
        <img loading="lazy" src="${url(r.slug, true)}" alt="${r.title}" />
        <div class="g-card-txt"><b>${r.title}</b><span>${r.cat}</span></div>
      `;
      card.addEventListener('click', () => this.showViewer(i));
      this.gridEl.appendChild(card);
    });
  }

  setCat(c) {
    this.cat = c;
    [...this.tabsEl.children].forEach((b) => b.classList.toggle('active', b.dataset.cat === c));
    this._renderGrid();
  }

  showViewer(i) {
    if (!this.list.length) return;
    this.index = (i + this.list.length) % this.list.length;
    const r = this.list[this.index];
    this.imgEl.src = url(r.slug, false);
    this.imgEl.alt = r.title;
    this.capTitle.textContent = r.title;
    this.capNote.textContent = r.note;
    this.capCount.textContent = `${this.cat} · 第 ${this.index + 1} / ${this.list.length} 张`;
    this.viewer.classList.add('show');
  }

  hideViewer() { this.viewer.classList.remove('show'); }

  step(d) { this.showViewer(this.index + d); }

  show(cat) {
    this.setCat(cat && CATS.includes(cat) ? cat : '全部');
    this.root.classList.add('show');
    if (!this.open) {
      this.open = true;
      if (this.onOpen) this.onOpen();
    }
  }

  showFor(moduleKey) { this.show(MODULE_CAT[moduleKey]); }

  close() {
    this.hideViewer();
    this.root.classList.remove('show');
    if (this.open) {
      this.open = false;
      if (this.onClose) this.onClose();
    }
  }

  toggle() { this.open ? this.close() : this.show(); }
}
