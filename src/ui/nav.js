// 底部 5 模块导航栏
export class Nav {
  constructor(order, titles, onSwitch) {
    this.el = document.getElementById('nav');
    this.el.innerHTML = '';
    order.forEach((key, i) => {
      const b = document.createElement('button');
      b.dataset.key = key;
      b.innerHTML = `<span class="dot"></span>${titles[key]}`;
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => {
        [...this.el.children].forEach((c) => c.classList.remove('active'));
        b.classList.add('active');
        onSwitch(key);
      });
      this.el.appendChild(b);
    });
  }
}
