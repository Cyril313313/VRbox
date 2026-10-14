// 模块4：日夜时间切换（正午为当前档；清晨/黄昏/夜景为预留接口，机制已可运行）
export function createDayNight(stage, hud) {
  return {
    name: '日夜切换',
    enter() {
      stage.orbit.enabled = true;
      stage.camera.position.set(90, 70, 110);
      stage.orbit.target.set(0, 8, 0);
      stage.orbit.update();
      hud.showTimePanel();
    },
    exit() { hud.hideTimePanel(); },
    update() {},
  };
}
