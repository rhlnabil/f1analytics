import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function InteractiveBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1200);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, isMobile ? 0.0008 : 0.0012);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 0, 500);

    const makeSprite = (colorCenter, colorMid) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, colorCenter);
      grad.addColorStop(0.5, colorMid);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    };

    const redSprite = makeSprite('rgba(255,255,255,1)', 'rgba(225,6,0,0.5)');

    const LINE_COUNT = isMobile ? 400 : 900;
    const linesGeo = new THREE.BufferGeometry();
    const linesPos = new Float32Array(LINE_COUNT * 3);
    const linesCol = new Float32Array(LINE_COUNT * 3);
    const linesSpd = new Float32Array(LINE_COUNT);

    for (let i = 0; i < LINE_COUNT; i++) {
      linesPos[i * 3] = (Math.random() - 0.5) * 2000;
      linesPos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
      linesPos[i * 3 + 2] = Math.random() * 2000 - 1000;
      const isWhite = Math.random() > 0.75;
      if (isWhite) { linesCol[i * 3] = 1; linesCol[i * 3 + 1] = 1; linesCol[i * 3 + 2] = 1; }
      else { linesCol[i * 3] = 0.9 + Math.random() * 0.1; linesCol[i * 3 + 1] = Math.random() * 0.25; linesCol[i * 3 + 2] = Math.random() * 0.15; }
      linesSpd[i] = 3 + Math.random() * 10;
    }

    linesGeo.setAttribute('position', new THREE.BufferAttribute(linesPos, 3));
    linesGeo.setAttribute('color', new THREE.BufferAttribute(linesCol, 3));

    const linesMat = new THREE.PointsMaterial({
      size: isMobile ? 4 : 3.5, map: redSprite, vertexColors: true, transparent: true,
      opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });

    const lines = new THREE.Points(linesGeo, linesMat);
    scene.add(lines);

    const GLOW_COUNT = isMobile ? 30 : 60;
    const glowGeo = new THREE.BufferGeometry();
    const glowPos = new Float32Array(GLOW_COUNT * 3);
    const glowCol = new Float32Array(GLOW_COUNT * 3);
    const glowSpd = new Float32Array(GLOW_COUNT);

    for (let i = 0; i < GLOW_COUNT; i++) {
      glowPos[i * 3] = (Math.random() - 0.5) * 2500;
      glowPos[i * 3 + 1] = (Math.random() - 0.5) * 1800;
      glowPos[i * 3 + 2] = Math.random() * 2500 - 1000;
      glowCol[i * 3] = 1; glowCol[i * 3 + 1] = 0.05; glowCol[i * 3 + 2] = 0;
      glowSpd[i] = 2 + Math.random() * 5;
    }

    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowCol, 3));

    const glowMat = new THREE.PointsMaterial({
      size: isMobile ? 18 : 24, map: redSprite, vertexColors: true, transparent: true,
      opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });

    const glow = new THREE.Points(glowGeo, glowMat);
    scene.add(glow);

    let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
    const onMouseMove = (e) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let scrollProgress = 0, targetScrollProgress = 0;
    const onScroll = () => { targetScrollProgress = window.scrollY / Math.max(window.innerHeight, 1); };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (document.hidden) return;
      const time = clock.getElapsedTime();
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.05;

      const lPos = linesGeo.attributes.position.array;
      for (let i = 0; i < LINE_COUNT; i++) {
        lPos[i * 3 + 2] += linesSpd[i];
        if (lPos[i * 3 + 2] > 1000) {
          lPos[i * 3 + 2] = -1000;
          lPos[i * 3] = (Math.random() - 0.5) * 2000;
          lPos[i * 3 + 1] = (Math.random() - 0.5) * 1500;
        }
      }
      linesGeo.attributes.position.needsUpdate = true;

      const gPos = glowGeo.attributes.position.array;
      for (let i = 0; i < GLOW_COUNT; i++) {
        gPos[i * 3 + 2] += glowSpd[i];
        if (gPos[i * 3 + 2] > 1500) {
          gPos[i * 3 + 2] = -1000;
          gPos[i * 3] = (Math.random() - 0.5) * 2500;
          gPos[i * 3 + 1] = (Math.random() - 0.5) * 1800;
        }
      }
      glowGeo.attributes.position.needsUpdate = true;

      camera.position.x = mouseX * 100;
      camera.position.y = -mouseY * 70;
      camera.position.z = 500 + scrollProgress * 150;
      camera.lookAt(mouseX * 50, -mouseY * 35, -500);

      lines.rotation.z = time * 0.015;
      glow.rotation.z = -time * 0.008;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      linesGeo.dispose(); linesMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      redSprite.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
    }} />
  );
}