import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

// --- Variáveis principais ---
let camera, scene, renderer;
let controller;
let lungModel;

init();
animate();

function init() {
  // Cena
  scene = new THREE.Scene();

  // Câmera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  // Renderizador: alpha true para permitir ver a câmera do dispositivo por trás
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.setClearColor(0x000000, 0); // transparente
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  document.body.appendChild(renderer.domElement);

  // ARButton: inicia sessão AR; 'local-floor' ajuda a manter medidas em metros
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['local-floor'] }));

  // Luz básica
  const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.0);
  scene.add(hemi);

  // Carregador GLTF
  const loader = new GLTFLoader();
  loader.load(
    'models/lung.glb',
    (gltf) => {
      lungModel = gltf.scene;

      // --- ESCALA: ajustar para ~30cm de altura ---
      const bbox = new THREE.Box3().setFromObject(lungModel);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const targetHeight = 0.30; // metros (30 cm)
      if (size.y > 1e-6) {
        const uniformScale = targetHeight / size.y;
        lungModel.scale.setScalar(uniformScale);
      } else {
        // fallback conservador
        lungModel.scale.setScalar(0.3);
      }

      // --- POSIÇÃO INICIAL: 1.2m do chão, 0.5m à frente da câmera ---
      lungModel.position.set(0, 1.2, -0.5);

      scene.add(lungModel);
    },
    undefined,
    (err) => {
      console.error('Erro ao carregar models/lung.glb:', err);
    }
  );

  // --- Controller XR: permitir "pegar/soltar" com controlador / mão ---
  controller = renderer.xr.getController(0);
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  scene.add(controller);

  // Resize
  window.addEventListener('resize', onWindowResize);
}

function onSelectStart() {
  if (!lungModel) return;
  try {
    controller.attach(lungModel);
  } catch (e) {
    console.warn('attach falhou, tentando alternativa:', e);
    // fallback: remove/adicionar manualmente
    try {
      scene.remove(lungModel);
    } catch {}
    controller.add(lungModel);
  }
}

function onSelectEnd() {
  if (!lungModel) return;
  try {
    scene.attach(lungModel);
  } catch (e) {
    console.warn('attach para cena falhou, tentando fallback:', e);
    try {
      controller.remove(lungModel);
    } catch {}
    scene.add(lungModel);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
