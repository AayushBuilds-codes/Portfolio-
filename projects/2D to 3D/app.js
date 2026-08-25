import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/exporters/GLTFExporter.js';
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';

// Configure Transformers.js to skip local files and fetch from Hub
env.allowLocalModels = false;

// Global Application State
const state = {
  modelName: 'onnx-community/depth-anything-v2-small',
  depthEstimator: null,
  isModelLoading: false,
  isEstimating: false,
  
  // Image Data
  originalImg: null,       // HTMLImageElement
  originalImgUrl: '',      // dataURL or objectURL
  depthRawImage: null,     // Hugging Face RawImage object
  aspectRatio: 1.0,
  
  // Three.js Objects
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  active3DObject: null,    // The mesh, wireframe, or point cloud in the scene
  lights: {
    ambient: null,
    directional: null,
  },
  
  // Render Settings
  visMode: 'mesh',         // mesh, wireframe, points
  depthScale: 2.0,
  resolutionLevel: 5,      // 3=32x32, 4=64x64, 5=128x128, 6=256x256
  pointSize: 0.05,
  autoRotate: false,
  rotateSpeed: 1.0,
  lightIntensity: 1.2,
};

// Preset Sample Images (Unsplash URLs with CORS allowed, fallback if local copy_assets.py not run)
const samples = {
  mountain: {
    local: 'assets/mountain.png',
    fallback: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
  },
  robot: {
    local: 'assets/robot.png',
    fallback: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=800&q=80'
  },
  cat: {
    local: 'assets/cat.png',
    fallback: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'
  }
};

// DOM Elements
const elements = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  modelSelect: document.getElementById('model-select'),
  
  // Controls
  modeMesh: document.getElementById('mode-mesh'),
  modeWireframe: document.getElementById('mode-wireframe'),
  modePoints: document.getElementById('mode-points'),
  depthScaleSlider: document.getElementById('depth-scale'),
  depthScaleVal: document.getElementById('depth-scale-val'),
  resolutionSlider: document.getElementById('resolution-slider'),
  resolutionVal: document.getElementById('resolution-val'),
  pointSizeContainer: document.getElementById('point-size-container'),
  pointSizeSlider: document.getElementById('point-size'),
  pointSizeVal: document.getElementById('point-size-val'),
  autoRotateCheckbox: document.getElementById('auto-rotate'),
  rotateSpeedContainer: document.getElementById('rotate-speed-container'),
  rotateSpeedSlider: document.getElementById('rotate-speed'),
  rotateSpeedVal: document.getElementById('rotate-speed-val'),
  lightIntensitySlider: document.getElementById('light-intensity'),
  lightVal: document.getElementById('light-val'),
  
  // Action Buttons
  btnExportGltf: document.getElementById('btn-export-gltf'),
  btnDownloadDepth: document.getElementById('btn-download-depth'),
  btnScreenshot: document.getElementById('btn-screenshot'),
  btnResetCam: document.getElementById('btn-reset-cam'),
  
  // Tabs & Views
  tab3d: document.getElementById('tab-3d'),
  tabImage: document.getElementById('tab-image'),
  tabDepth: document.getElementById('tab-depth'),
  view3d: document.getElementById('view-3d'),
  viewImage: document.getElementById('view-image'),
  viewDepth: document.getElementById('view-depth'),
  canvasContainer: document.getElementById('canvas-container'),
  loadedImgPreview: document.getElementById('loaded-img-preview'),
  imagePlaceholder: document.getElementById('image-placeholder'),
  depthCanvas: document.getElementById('depth-canvas'),
  depthPlaceholder: document.getElementById('depth-placeholder'),
  
  // Loader Overlay
  loaderOverlay: document.getElementById('loader-overlay'),
  loaderTitle: document.getElementById('loader-title'),
  loaderSubtitle: document.getElementById('loader-subtitle'),
  loaderProgressBar: document.getElementById('loader-progress-bar'),
  loaderStatus: document.getElementById('loader-status'),
  loaderPct: document.getElementById('loader-pct'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  toastIcon: document.getElementById('toast-icon'),
};
let sampleData = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  initThreeJS();
  setupEventListeners();
  
  // Try loading base64 samples.js dynamically (for offline file:// compatibility)
  try {
    const module = await import('./samples.js');
    sampleData = module.sampleData;
    console.log("Successfully loaded base64 sampleData");
  } catch (e) {
    console.log("samples.js not loaded, falling back to local files or online URLs");
  }
  
  checkSampleImages();
  lucide.createIcons();
  
  // Render an initial nice 3D placeholder shape
  renderInitialPlaceholder();
});

// --- THREE.JS ENGINE SETUP ---
function initThreeJS() {
  const width = elements.canvasContainer.clientWidth;
  const height = elements.canvasContainer.clientHeight || 500;
  
  // Scene
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x09090b); // zinc-950
  
  // Camera
  state.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  state.camera.position.set(0, 0, 8);
  
  // Renderer
  state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  state.renderer.setSize(width, height);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  state.renderer.shadowMap.enabled = true;
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  elements.canvasContainer.appendChild(state.renderer.domElement);
  
  // Orbit Controls
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.05;
  state.controls.maxDistance = 20;
  state.controls.minDistance = 2;
  
  // Lighting
  state.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
  state.scene.add(state.lights.ambient);
  
  state.lights.directional = new THREE.DirectionalLight(0xffffff, state.lightIntensity);
  state.lights.directional.position.set(3, 5, 5);
  state.lights.directional.castShadow = true;
  state.lights.directional.shadow.mapSize.width = 1024;
  state.lights.directional.shadow.mapSize.height = 1024;
  state.lights.directional.shadow.bias = -0.001;
  state.scene.add(state.lights.directional);
  
  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    
    // Update Orbit Controls
    state.controls.update();
    
    // Auto Rotation
    if (state.autoRotate && state.active3DObject) {
      state.active3DObject.rotation.y += 0.005 * state.rotateSpeed;
    }
    
    state.renderer.render(state.scene, state.camera);
  };
  animate();
  
  // Handle Resize
  window.addEventListener('resize', () => {
    const w = elements.canvasContainer.clientWidth;
    const h = elements.canvasContainer.clientHeight || 500;
    
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);
  });
}

// Render a rotating torus knot as landing page experience
let placeholderKnot = null;
function renderInitialPlaceholder() {
  const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 120, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6, // violet-500
    roughness: 0.1,
    metalness: 0.8,
    wireframe: false
  });
  
  placeholderKnot = new THREE.Mesh(geometry, material);
  placeholderKnot.castShadow = true;
  placeholderKnot.receiveShadow = true;
  state.scene.add(placeholderKnot);
  state.active3DObject = placeholderKnot;
  state.autoRotate = true;
  
  // Synchronize UI checked state
  elements.autoRotateCheckbox.checked = true;
  elements.rotateSpeedContainer.classList.remove('hidden');
  elements.rotateSpeedVal.classList.remove('hidden');
}

// Remove the landing page placeholder shape
function clearPlaceholder() {
  if (placeholderKnot) {
    state.scene.remove(placeholderKnot);
    placeholderKnot.geometry.dispose();
    placeholderKnot.material.dispose();
    placeholderKnot = null;
  }
}

// --- EVENT LISTENERS SETUP ---
function setupEventListeners() {
  // Drag & Drop
  elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('border-purple-500', 'bg-purple-950/10');
  });
  
  elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('border-purple-500', 'bg-purple-950/10');
  });
  
  elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('border-purple-500', 'bg-purple-950/10');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
  });
  
  elements.dropZone.addEventListener('click', () => {
    elements.fileInput.click();
  });
  
  elements.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  });
  
  // Model select
  elements.modelSelect.addEventListener('change', (e) => {
    state.modelName = e.target.value;
    showToast(`Switched model to ${state.modelName.split('/').pop()}`, 'info');
    // If we already have an image loaded, re-run depth estimation with the new model
    if (state.originalImg) {
      runDepthEstimation();
    }
  });
  
  // Visualization Mode buttons
  const modeButtons = [elements.modeMesh, elements.modeWireframe, elements.modePoints];
  modeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.visMode = btn.dataset.mode;
      
      // Toggle Point Size display
      if (state.visMode === 'points') {
        elements.pointSizeContainer.classList.remove('hidden');
      } else {
        elements.pointSizeContainer.classList.add('hidden');
      }
      
      showToast(`Switched visualization to ${state.visMode}`, 'info');
      reconstruct3D();
    });
  });
  
  // Parameter Sliders
  elements.depthScaleSlider.addEventListener('input', (e) => {
    state.depthScale = parseFloat(e.target.value);
    elements.depthScaleVal.textContent = state.depthScale.toFixed(1);
    
    if (state.active3DObject && !placeholderKnot) {
      reconstruct3D();
    }
  });
  
  elements.resolutionSlider.addEventListener('input', (e) => {
    state.resolutionLevel = parseInt(e.target.value);
    const resMap = { 3: 32, 4: 64, 5: 128, 6: 256 };
    const side = resMap[state.resolutionLevel];
    elements.resolutionVal.textContent = `${side} × ${side}`;
    
    if (state.active3DObject && !placeholderKnot) {
      reconstruct3D();
    }
  });
  
  elements.pointSizeSlider.addEventListener('input', (e) => {
    state.pointSize = parseFloat(e.target.value);
    elements.pointSizeVal.textContent = state.pointSize.toFixed(2);
    
    if (state.active3DObject && state.visMode === 'points' && !placeholderKnot) {
      // Modify point material directly for speed
      if (state.active3DObject.material) {
        state.active3DObject.material.size = state.pointSize;
      }
    }
  });
  
  elements.lightIntensitySlider.addEventListener('input', (e) => {
    state.lightIntensity = parseFloat(e.target.value);
    elements.lightVal.textContent = state.lightIntensity.toFixed(1);
    
    if (state.lights.directional) {
      state.lights.directional.intensity = state.lightIntensity;
    }
  });
  
  elements.autoRotateCheckbox.addEventListener('change', (e) => {
    state.autoRotate = e.target.checked;
    if (state.autoRotate) {
      elements.rotateSpeedContainer.classList.remove('hidden');
      elements.rotateSpeedVal.classList.remove('hidden');
    } else {
      elements.rotateSpeedContainer.classList.add('hidden');
      elements.rotateSpeedVal.classList.add('hidden');
    }
  });
  
  elements.rotateSpeedSlider.addEventListener('input', (e) => {
    state.rotateSpeed = parseFloat(e.target.value);
    elements.rotateSpeedVal.textContent = state.rotateSpeed.toFixed(1);
  });
  
  // Action Buttons
  elements.btnExportGltf.addEventListener('click', exportGLBModel);
  
  elements.btnDownloadDepth.addEventListener('click', () => {
    if (!state.depthRawImage) return;
    const link = document.createElement('a');
    link.download = 'depth_map.png';
    link.href = elements.depthCanvas.toDataURL('image/png');
    link.click();
    showToast('Depth map downloaded!', 'success');
  });
  
  elements.btnScreenshot.addEventListener('click', () => {
    // Hide controls helper during screenshot
    state.renderer.render(state.scene, state.camera);
    const dataURL = state.renderer.domElement.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = 'depth3d_screenshot.png';
    link.href = dataURL;
    link.click();
    showToast('Screenshot downloaded!', 'success');
  });
  
  elements.btnResetCam.addEventListener('click', resetCamera);
  
  // Workspace Tab buttons
  const tabs = [elements.tab3d, elements.tabImage, elements.tabDepth];
  const views = [elements.view3d, elements.viewImage, elements.viewDepth];
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      views.forEach(v => v.classList.add('hidden'));
      
      tab.classList.add('active');
      const targetView = document.getElementById(`view-${tab.dataset.tab}`);
      targetView.classList.remove('hidden');
      
      // Trigger canvas resize just in case
      if (tab.dataset.tab === '3d') {
        const w = elements.canvasContainer.clientWidth;
        const h = elements.canvasContainer.clientHeight || 500;
        state.camera.aspect = w / h;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(w, h);
      }
    });
  });
  
  // Sample card triggers
  document.querySelectorAll('.sample-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.sample;
      loadSample(type);
    });
  });
}

// --- VERIFY SAMPLE IMAGES AND LOAD PATHS ---
function checkSampleImages() {
  const types = ['mountain', 'robot', 'cat'];
  types.forEach(type => {
    const thumb = document.getElementById(`sample-thumb-${type}`);
    const status = document.getElementById(`sample-status-${type}`);
    
    if (sampleData && sampleData[type]) {
      // Use base64 sampleData immediately!
      thumb.src = sampleData[type];
      thumb.classList.remove('hidden');
      if (status) status.classList.add('hidden');
    } else {
      // Try local files
      const img = new Image();
      img.src = samples[type].local;
      img.onload = () => {
        thumb.src = samples[type].local;
        thumb.classList.remove('hidden');
        if (status) status.classList.add('hidden');
      };
      img.onerror = () => {
        // Fallback to URL
        thumb.src = samples[type].fallback;
        thumb.classList.remove('hidden');
        if (status) status.classList.add('hidden');
      };
    }
  });
}

// Load a specific sample image
function loadSample(type) {
  showLoader('Loading Sample Image', 'Loading image asset...', 20);
  
  const img = new Image();
  img.crossOrigin = 'anonymous'; // Enable CORS
  
  // If base64 sampleData is loaded, use it directly (CORS-safe and fast!)
  if (sampleData && sampleData[type]) {
    img.onload = () => {
      onImageLoaded(img, sampleData[type]);
    };
    img.onerror = () => {
      // Fallback to URL in case of base64 error
      loadSampleFallback(type);
    };
    img.src = sampleData[type];
    return;
  }
  
  loadSampleFallback(type);
}

// Fallback image loading from local file or online URL
function loadSampleFallback(type) {
  const localUrl = samples[type].local;
  const fallbackUrl = samples[type].fallback;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    onImageLoaded(img, localUrl);
  };
  img.onerror = () => {
    // Try fallback URL
    const fallbackImg = new Image();
    fallbackImg.crossOrigin = 'anonymous';
    fallbackImg.src = fallbackUrl;
    fallbackImg.onload = () => {
      onImageLoaded(fallbackImg, fallbackUrl);
    };
    fallbackImg.onerror = () => {
      hideLoader();
      showToast(`Failed to load sample image for ${type}`, 'error');
    };
  };
  img.src = localUrl;
}

// --- IMAGE LOADING HANDLERS ---
function handleImageFile(file) {
  const reader = new FileReader();
  showLoader('Processing Image', 'Reading image file...', 30);
  
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      onImageLoaded(img, e.target.result);
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    hideLoader();
    showToast('Failed to read image file.', 'error');
  };
  reader.readAsDataURL(file);
}

function onImageLoaded(img, url) {
  state.originalImg = img;
  state.originalImgUrl = url;
  state.aspectRatio = img.width / img.height;
  
  // Update Preview UI
  elements.loadedImgPreview.src = url;
  elements.loadedImgPreview.classList.remove('hidden');
  elements.imagePlaceholder.classList.add('hidden');
  
  // Trigger tab switch to Interactive 3D View so they see progress
  elements.tab3d.click();
  
  // Run Depth Estimation
  runDepthEstimation();
}

// --- DEPTHESTIMATION PIPELINE ---
async function runDepthEstimation() {
  if (!state.originalImg) return;
  
  try {
    state.isEstimating = true;
    showLoader('AI Processing', 'Loading depth estimation model...', 10);
    
    // Load model pipeline if not already loaded or if model selection changed
    if (!state.depthEstimator || state.depthEstimator.model !== state.modelName) {
      showLoader('AI Model Download', 'Downloading model files (runs locally)...', 15);
      
      state.depthEstimator = await pipeline('depth-estimation', state.modelName, {
        progress_callback: (info) => {
          if (info.status === 'progress') {
            const pct = Math.round(info.progress);
            updateLoaderProgress(
              'AI Model Download',
              `Downloading ${info.file.split('/').pop()}...`,
              pct
            );
          } else if (info.status === 'ready') {
            updateLoaderProgress('AI Model Setup', 'Compiling WebAssembly binaries...', 99);
          }
        }
      });
    }
    
    // Run Inference
    updateLoaderProgress('AI Depth Estimation', 'Analyzing image depth maps...', 50);
    
    // We pass the original image source to the pipeline.
    // The pipeline will fetch the image, process it, and return depth output.
    const result = await state.depthEstimator(state.originalImgUrl);
    
    state.depthRawImage = result.depth;
    
    // Render the depth map to the 2D canvas
    renderDepthCanvas(result.depth);
    
    // Clear initial landing knot if it is still present
    clearPlaceholder();
    
    // Reconstruct the 3D scene using depth data
    reconstruct3D();
    
    // Enable Export Buttons
    elements.btnExportGltf.disabled = false;
    elements.btnDownloadDepth.disabled = false;
    elements.btnScreenshot.disabled = false;
    
    hideLoader();
    showToast('3D Scene generated successfully!', 'success');
    
  } catch (error) {
    console.error('Depth estimation failed:', error);
    hideLoader();
    showToast(`Depth estimation error: ${error.message || error}`, 'error');
  } finally {
    state.isEstimating = false;
  }
}

// Draw the Hugging Face RawImage depth map to the 2D canvas
function renderDepthCanvas(rawImage) {
  elements.depthCanvas.width = rawImage.width;
  elements.depthCanvas.height = rawImage.height;
  
  const ctx = elements.depthCanvas.getContext('2d');
  const imgData = ctx.createImageData(rawImage.width, rawImage.height);
  
  const pixelData = rawImage.data;
  const channels = rawImage.channels;
  
  // Depth Anything outputs single-channel grayscale (channels = 1)
  if (channels === 1) {
    for (let i = 0; i < pixelData.length; i++) {
      const val = pixelData[i];
      const offset = i * 4;
      imgData.data[offset] = val;     // R
      imgData.data[offset + 1] = val; // G
      imgData.data[offset + 2] = val; // B
      imgData.data[offset + 3] = 255; // A
    }
  } else {
    // In case there are 3 channels (RGB)
    for (let i = 0; i < pixelData.length / channels; i++) {
      const offset = i * 4;
      const srcOffset = i * channels;
      imgData.data[offset] = pixelData[srcOffset];
      imgData.data[offset + 1] = pixelData[srcOffset + 1];
      imgData.data[offset + 2] = pixelData[srcOffset + 2];
      imgData.data[offset + 3] = 255;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  elements.depthCanvas.classList.remove('hidden');
  elements.depthPlaceholder.classList.add('hidden');
}

// --- 3D RECONSTRUCTION ENGINE ---
function reconstruct3D() {
  if (!state.originalImg || !state.depthRawImage) return;
  
  // Clear any existing active 3D object from scene
  if (state.active3DObject) {
    state.scene.remove(state.active3DObject);
    // Recursively dispose geometry and materials
    if (state.active3DObject.geometry) state.active3DObject.geometry.dispose();
    if (state.active3DObject.material) {
      if (Array.isArray(state.active3DObject.material)) {
        state.active3DObject.material.forEach(m => m.dispose());
      } else {
        state.active3DObject.material.dispose();
      }
    }
    state.active3DObject = null;
  }
  
  // Determine Grid Resolution based on slider
  const resMap = { 3: 32, 4: 64, 5: 128, 6: 256 };
  const gridRes = resMap[state.resolutionLevel] || 128;
  
  // Set dimensions to fit scene (e.g. max width 5 units, height proportional to aspect ratio)
  const meshWidth = 5.0;
  const meshHeight = meshWidth / state.aspectRatio;
  
  if (state.visMode === 'points') {
    createPointCloud(gridRes, meshWidth, meshHeight);
  } else {
    createDisplacedMesh(gridRes, meshWidth, meshHeight);
  }
  
  // Center camera target on the newly added object
  resetCamera();
}

// Reconstruct 3D as a standard or wireframe displacement mesh
function createDisplacedMesh(gridRes, width, height) {
  // Create Plane Geometry with given segments
  const geometry = new THREE.PlaneGeometry(width, height, gridRes - 1, gridRes - 1);
  
  // Retrieve raw depth values
  const depthData = state.depthRawImage.data;
  const depthWidth = state.depthRawImage.width;
  const depthHeight = state.depthRawImage.height;
  
  // Get positions attribute to modify Z vertex values
  const posAttr = geometry.attributes.position;
  
  for (let y = 0; y < gridRes; y++) {
    for (let x = 0; x < gridRes; x++) {
      // Map grid coordinates to depth image coordinates
      const imgX = Math.floor((x / (gridRes - 1)) * (depthWidth - 1));
      const imgY = Math.floor((y / (gridRes - 1)) * (depthHeight - 1));
      const depthIndex = imgY * depthWidth + imgX;
      
      // Get depth value (0 to 255)
      const depthVal = depthData[depthIndex] / 255.0;
      
      // Vertex Index in geometry
      const vertexIdx = y * gridRes + x;
      
      // Calculate displaced Z coordinate
      // We displace along Z axis since PlaneGeometry lies on XY plane
      // In monocular depth maps, whiter = closer. Scale Z by depthScale.
      const z = depthVal * state.depthScale;
      posAttr.setZ(vertexIdx, z);
    }
  }
  
  // Update geometry variables
  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  
  // Load original image texture
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(state.originalImgUrl);
  texture.minFilter = THREE.LinearFilter;
  
  let material;
  if (state.visMode === 'wireframe') {
    // Glowing wireframe
    material = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // purple-500
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
  } else {
    // Standard displaced texture mesh
    material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
      flatShading: false
    });
  }
  
  state.active3DObject = new THREE.Mesh(geometry, material);
  state.active3DObject.castShadow = true;
  state.active3DObject.receiveShadow = true;
  
  // Center mesh relative to origin
  state.scene.add(state.active3DObject);
}

// Reconstruct 3D as a Holographic Point Cloud
function createPointCloud(gridRes, width, height) {
  const numPoints = gridRes * gridRes;
  const positions = new Float32Array(numPoints * 3);
  const colors = new Float32Array(numPoints * 3);
  
  const depthData = state.depthRawImage.data;
  const depthWidth = state.depthRawImage.width;
  const depthHeight = state.depthRawImage.height;
  
  // To get colors, we extract pixel RGB from a temporary canvas drawing the original image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = gridRes;
  tempCanvas.height = gridRes;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(state.originalImg, 0, 0, gridRes, gridRes);
  const imgPixels = tempCtx.getImageData(0, 0, gridRes, gridRes).data;
  
  let idx = 0;
  for (let y = 0; y < gridRes; y++) {
    for (let x = 0; x < gridRes; x++) {
      // Normalized coordinates
      const u = x / (gridRes - 1);
      const v = y / (gridRes - 1);
      
      // Calculate 3D Position
      const posX = (u - 0.5) * width;
      const posY = (0.5 - v) * height; // Invert Y for WebGL vs Canvas space
      
      // Retrieve Depth Value
      const imgX = Math.floor(u * (depthWidth - 1));
      const imgY = Math.floor(v * (depthHeight - 1));
      const depthIndex = imgY * depthWidth + imgX;
      const depthVal = depthData[depthIndex] / 255.0;
      const posZ = depthVal * state.depthScale;
      
      positions[idx * 3] = posX;
      positions[idx * 3 + 1] = posY;
      positions[idx * 3 + 2] = posZ;
      
      // Retrieve Color Values (R, G, B)
      const colorIdx = (y * gridRes + x) * 4;
      colors[idx * 3] = imgPixels[colorIdx] / 255.0;
      colors[idx * 3 + 1] = imgPixels[colorIdx + 1] / 255.0;
      colors[idx * 3 + 2] = imgPixels[colorIdx + 2] / 255.0;
      
      idx++;
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: state.pointSize,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9
  });
  
  state.active3DObject = new THREE.Points(geometry, material);
  state.scene.add(state.active3DObject);
}

// Reset camera angle and focus on mesh
function resetCamera() {
  if (!state.active3DObject) return;
  
  state.camera.position.set(0, 0, 7);
  state.controls.target.set(0, 0, state.depthScale / 2.0); // Focus camera halfway into the depth
  state.controls.update();
  
  if (state.active3DObject && !placeholderKnot) {
    state.active3DObject.rotation.set(0, 0, 0); // Clear any rotation angles
  }
}

// --- EXPORT 3D MODEL (.GLB BINARY) ---
function exportGLBModel() {
  if (!state.active3DObject || placeholderKnot) return;
  
  showLoader('Exporting Model', 'Compiling geometry & textures into 3D binary format...', 40);
  
  const exporter = new GLTFExporter();
  
  // We export the active 3D object
  exporter.parse(state.active3DObject, (glbArrayBuffer) => {
    const blob = new Blob([glbArrayBuffer], { type: 'application/octet-stream' });
    
    // Download
    const link = document.createElement('a');
    link.download = 'depth3d_model.glb';
    link.href = URL.createObjectURL(blob);
    link.click();
    
    hideLoader();
    showToast('3D Model exported successfully as .GLB!', 'success');
  }, (error) => {
    console.error('GLTF Export failed:', error);
    hideLoader();
    showToast(`GLTF Export error: ${error}`, 'error');
  }, {
    binary: true,  // Export binary GLB (compact & self-contained with images embedded)
    animations: []
  });
}

// --- TOAST NOTIFICATIONS ---
let toastTimeout = null;
function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  
  elements.toastMessage.textContent = message;
  
  // Set Icon and style based on type
  if (type === 'success') {
    elements.toastIcon.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`;
    elements.toastIcon.className = 'w-4 h-4 text-emerald-400';
  } else if (type === 'error') {
    elements.toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`;
    elements.toastIcon.className = 'w-4 h-4 text-red-400';
  } else {
    // Info
    elements.toastIcon.innerHTML = `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`;
    elements.toastIcon.className = 'w-4 h-4 text-purple-400';
  }
  
  elements.toast.classList.remove('opacity-0', 'translate-y-[-100px]');
  elements.toast.classList.add('opacity-100', 'translate-y-0');
  
  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove('opacity-100', 'translate-y-0');
    elements.toast.classList.add('opacity-0', 'translate-y-[-100px]');
  }, 4000);
}

// --- LOADER OVERLAY CONTROLS ---
function showLoader(title, subtitle, percent = 0) {
  elements.loaderTitle.textContent = title;
  elements.loaderSubtitle.textContent = subtitle;
  elements.loaderProgressBar.style.width = `${percent}%`;
  elements.loaderPct.textContent = `${percent}%`;
  elements.loaderStatus.textContent = subtitle;
  
  elements.loaderOverlay.classList.remove('hidden');
}

function updateLoaderProgress(title, subtitle, percent) {
  elements.loaderTitle.textContent = title;
  elements.loaderSubtitle.textContent = subtitle;
  elements.loaderProgressBar.style.width = `${percent}%`;
  elements.loaderPct.textContent = `${percent}%`;
  elements.loaderStatus.textContent = subtitle;
}

function hideLoader() {
  elements.loaderOverlay.classList.add('hidden');
}
