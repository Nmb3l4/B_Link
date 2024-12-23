export async function createARSession(glbFilePath) {
  const canvas = document.getElementById('xr-canvas');
  const context = canvas.getContext('webgl');

  // Ocultar el overlay después de comenzar
  document.getElementById('overlay').style.display = 'none';

  // Configuración del sonido
  const sound = new Audio('./tech_liquid.mp3'); // Reemplaza con el archivo de sonido
  sound.loop = true;

  // Verificar compatibilidad con WebXR
  if (!navigator.xr) {
    alert('WebXR no es compatible en este navegador.');
    return;
  }

  const xrSession = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body },
  });

  const xrRefSpace = await xrSession.requestReferenceSpace('local');
  const viewerRefSpace = await xrSession.requestReferenceSpace('viewer');

  const gl = context;
  xrSession.updateRenderState({
    baseLayer: new XRWebGLLayer(xrSession, gl),
  });

  // Crear un hit test para detectar superficies
  const hitTestSource = await xrSession.requestHitTestSource({ space: viewerRefSpace });

  // Cargar el modelo 3D
  const model = await loadGLTF(glbFilePath);

  xrSession.requestAnimationFrame((time, frame) => {
    const session = frame.session;
    const pose = frame.getViewerPose(xrRefSpace);

    if (pose) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(xrRefSpace);

        // Colocar el modelo en la posición detectada
        model.position.set(
          hitPose.transform.position.x,
          hitPose.transform.position.y,
          hitPose.transform.position.z
        );

        // Reproducir el sonido
        if (sound.paused) {
          sound.play();
        }
      }
    }
  });

  xrSession.addEventListener('end', () => {
    alert('Sesión AR terminada.');
    sound.pause();
  });
}

async function loadGLTF(url) {
  const loader = new THREE.GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error)
    );
  });
}

// Llama a la función de inicio
document.getElementById('start-ar').addEventListener('click', () => {
  createARSession('./scene.glb'); // Cambia a tu archivo GLB si está en otra ruta
});
