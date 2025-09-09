// Cena 3D: Three.js + WebXR + GLTF do pulmão (ES Modules)
import * as THREE from 'three';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from '/node_modules/three/examples/jsm/webxr/VRButton.js';

let renderer; let scene; let camera; let controls; let lungRoot = null;
let placeholderMesh = null; let axesHelper = null;

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - iniciando cena com ES Modules');
  init();
  animate();
});

function init() {
  console.log('init() chamado');
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Container #canvas-container não encontrado');
  }

  // Renderer com WebXR habilitado
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const rect = container.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Cena e câmera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a); // slate-900

  camera = new THREE.PerspectiveCamera(60, (rect.width || 1) / (rect.height || 1), 0.01, 100);
  camera.position.set(0.5, 0.3, 2.0); // afastei a câmera para caber o pulmão maior

  // Luzes tipo estúdio
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dir1.position.set(1, 1, 1);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dir2.position.set(-1, 0.5, -0.5);
  scene.add(dir2);

  // Ajudas visuais
  axesHelper = new THREE.AxesHelper(0.5);
  scene.add(axesHelper);

  // Placeholder até carregar o pulmão
  const placeholderGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const placeholderMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
  placeholderMesh = new THREE.Mesh(placeholderGeo, placeholderMat);
  scene.add(placeholderMesh);
  console.log('Placeholder adicionado');

  // Controles
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.1;
  controls.maxDistance = 5.0; // aumentei para permitir observar o pulmão inteiro

  // Carrega o modelo GLB do pulmão
  const loader = new GLTFLoader();
  loader.load(
    'models/lung.glb',
    (gltf) => {
      lungRoot = gltf.scene || gltf.scenes[0];
      centerAndScaleModel(lungRoot);
      scene.add(lungRoot);
      if (placeholderMesh) {
        scene.remove(placeholderMesh);
        placeholderMesh.geometry.dispose();
        placeholderMesh.material.dispose();
        placeholderMesh = null;
      }
      console.log('pulmão carregado com sucesso');
    },
    (xhr) => {
      if (xhr.total) {
        const pct = ((xhr.loaded / xhr.total) * 100).toFixed(0);
        if (pct % 10 === 0) console.log(`Carregando pulmão: ${pct}%`);
      }
    },
    (error) => {
      console.error('Falha ao carregar models/lung.glb', error);
      const errorLabel = document.createElement('div');
      errorLabel.style.position = 'absolute';
      errorLabel.style.top = '56px';
      errorLabel.style.left = '16px';
      errorLabel.style.padding = '8px 12px';
      errorLabel.style.background = 'rgba(239,68,68,0.15)';
      errorLabel.style.border = '1px solid #7f1d1d';
      errorLabel.style.color = '#fecaca';
      errorLabel.style.borderRadius = '6px';
      errorLabel.style.fontFamily = 'ui-sans-serif, system-ui';
      errorLabel.style.fontSize = '12px';
      errorLabel.textContent = 'Erro ao carregar o modelo: verifique se models/lung.glb existe.';
      document.body.appendChild(errorLabel);
    }
  );

  // VR Button
  document.getElementById('vrButtonContainer').appendChild(VRButton.createButton(renderer));

  // Botões UI
  document.getElementById('resetCameraBtn').addEventListener('click', resetCamera);
  document.getElementById('toggleAxesBtn').addEventListener('click', () => {
    if (axesHelper) axesHelper.visible = !axesHelper.visible;
  });
  document.getElementById('mouseModeBtn').addEventListener('click', () => {
    if (renderer?.xr?.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) session.end();
    }
  });

  // Resize
  window.addEventListener('resize', onWindowResize);
}

function centerAndScaleModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  // Centralizar no (0,0,0)
  root.position.sub(center);

  // Escala alvo: maior dimensão ~ 1.2 m (120 cm)
  const targetMax = 1.2;
  const currentMax = Math.max(size.x, size.y, size.z) || 1.0;
  const scale = targetMax / currentMax;
  root.scale.setScalar(scale);
}

function resetCamera() {
  camera.position.set(0.5, 0.3, 2.0);
  controls.target.set(0, 0, 0);
  controls.update();
}

function onWindowResize() {
  const container = document.getElementById('canvas-container');
  const rect = container.getBoundingClientRect();
  camera.aspect = (rect.width || 1) / (rect.height || 1);
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
  console.log('Resize ->', rect.width, rect.height);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  if (controls) controls.update();
  if (placeholderMesh) {
    placeholderMesh.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}

window.addEventListener('error', (e) => {
  console.error('GlobalError:', e.message, e.filename, e.lineno);
});
