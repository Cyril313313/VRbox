// 舞台：渲染器 / 场景 / 相机 / 光照 / 自适应
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TIMES, applyTime } from './dayNight.js';

export class Stage {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 4000);
    this.camera.position.set(90, 70, 110);

    this.orbit = new OrbitControls(this.camera, canvas);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = Math.PI * 0.49;
    this.orbit.minDistance = 8;
    this.orbit.maxDistance = 900;
    this.orbit.target.set(0, 8, 0);
    this.orbit.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    this.sun = new THREE.DirectionalLight(0xfff4e6, 2.6);
    this.sun.position.set(120, 200, 80);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.near = 1; s.far = 900; s.left = -320; s.right = 320; s.top = 320; s.bottom = -320;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.sunTarget = new THREE.Object3D();
    this.scene.add(this.sunTarget);
    this.sun.target = this.sunTarget;

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6b6b5a, 0.65);
    this.scene.add(this.hemi);
    this.amb = new THREE.AmbientLight(0xffffff, 0.22);
    this.scene.add(this.amb);

    this.scene.fog = new THREE.Fog(0xaecbe6, 350, 900);
    this.timeName = 'noon';
    this.setTime('noon');

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setTime(name) {
    this.timeName = name;
    applyTime(this.scene, this.sun, this.hemi, this.amb, TIMES[name]);
  }

  // 按场地实际占地自动取景（真实模型接入后调用）
  frameTo(size) {
    const r = Math.max(size.x, size.z) * 0.5;
    const fovHalf = (this.camera.fov * Math.PI) / 360;
    const d = Math.max(r / Math.tan(fovHalf) * 1.1, 60);
    const hgt = Math.max(size.y || 20, 10);
    this.camera.position.set(d * 0.55, Math.max(d * 0.5, hgt * 3), d * 0.8);
    this.orbit.target.set(0, hgt * 0.35, 0);
    this.orbit.minDistance = Math.max(r * 0.12, 8);
    this.orbit.maxDistance = Math.max(d * 2.2, 900);
    this.orbit.update();

    // 阴影范围与雾距跟随场地尺度
    const sc = this.sun.shadow.camera;
    sc.left = -r * 1.35; sc.right = r * 1.35; sc.top = r * 1.35; sc.bottom = -r * 1.35;
    sc.updateProjectionMatrix();
    this.scene.fog.near = d * 1.2;
    this.scene.fog.far = d * 4.5;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
