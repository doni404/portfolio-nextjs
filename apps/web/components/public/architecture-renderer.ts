import * as THREE from "three";

export type LayerKey = "cloud" | "backend" | "ai";
export type ArchitectureRenderer = {
  select: (key: LayerKey) => void;
  reset: () => void;
  dispose: () => void;
};

export function createArchitectureRenderer(
  canvas: HTMLCanvasElement,
  onSelect: (key: LayerKey) => void,
): ArchitectureRenderer {
  const viewport = canvas.parentElement!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
  camera.position.set(7, 5.6, 8);
  camera.lookAt(0, 1.25, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(2, 7, 5);
  scene.add(light);
  const rim = new THREE.DirectionalLight(0x91bcff, 1.8);
  rim.position.set(-4, 3, -3);
  scene.add(rim);
  const model = new THREE.Group();
  scene.add(model);
  const layers: {
    key: LayerKey;
    group: THREE.Group;
    y: number;
    material: THREE.MeshStandardMaterial;
    outline: THREE.LineBasicMaterial;
  }[] = [];
  const targets: THREE.Mesh[] = [];

  function roundedBoard(size: number) {
    const h = size / 2,
      r = 0.12,
      shape = new THREE.Shape();
    shape.moveTo(-h + r, -h);
    shape.lineTo(h - r, -h);
    shape.quadraticCurveTo(h, -h, h, -h + r);
    shape.lineTo(h, h - r);
    shape.quadraticCurveTo(h, h, h - r, h);
    shape.lineTo(-h + r, h);
    shape.quadraticCurveTo(-h, h, -h, h - r);
    shape.lineTo(-h, -h + r);
    shape.quadraticCurveTo(-h, -h, -h + r, -h);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 6,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }

  function line(
    points: number[][],
    color: number,
    parent: THREE.Object3D,
    opacity = 1,
  ) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    const object = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
    );
    parent.add(object);
  }

  function chip(
    parent: THREE.Group,
    x: number,
    z: number,
    width: number,
    depth: number,
    color: number,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.14, depth),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.45,
      }),
    );
    mesh.position.set(x, 0.26, z);
    mesh.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry),
        new THREE.LineBasicMaterial({
          color: 0xd0e4f4,
          transparent: true,
          opacity: 0.4,
        }),
      ),
    );
    parent.add(mesh);
    return mesh;
  }

  function label(parent: THREE.Group, text: string, size: number) {
    const surface = document.createElement("canvas");
    surface.width = 768;
    surface.height = 120;
    const context = surface.getContext("2d");
    if (!context) return;
    context.fillStyle = "#e5efff";
    context.font = "500 36px monospace";
    context.fillText(text, 22, 67);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.82, 0.29),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.205, size * 0.36);
    parent.add(mesh);
  }

  const specs: {
    key: LayerKey;
    size: number;
    y: number;
    color: number;
    label: string;
  }[] = [
    {
      key: "cloud",
      size: 3.45,
      y: 0,
      color: 0x2752c5,
      label: "01 / CLOUD INFRASTRUCTURE",
    },
    {
      key: "backend",
      size: 2.95,
      y: 1.05,
      color: 0x343f53,
      label: "02 / BACKEND SERVICES",
    },
    {
      key: "ai",
      size: 2.45,
      y: 2.1,
      color: 0xadcfb3,
      label: "03 / APPLIED AI",
    },
  ];
  for (const spec of specs) {
    const group = new THREE.Group();
    group.position.y = spec.y;
    model.add(group);
    const material = new THREE.MeshStandardMaterial({
      color: spec.color,
      metalness: 0.48,
      roughness: 0.42,
    });
    const slab = new THREE.Mesh(roundedBoard(spec.size), material);
    slab.userData.layer = spec.key;
    group.add(slab);
    targets.push(slab);
    const outline = new THREE.LineBasicMaterial({
      color: 0xc4dfff,
      transparent: true,
      opacity: 0.35,
    });
    slab.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(slab.geometry, 25),
        outline,
      ),
    );
    label(group, spec.label, spec.size);
    for (let i = 0; i < 5; i++) {
      const z = (i - 2) * 0.37;
      line(
        [
          [-spec.size * 0.45, 0.204, z],
          [-0.6, 0.204, z],
          [-0.6, 0.204, z - 0.14],
          [0.3, 0.204, z - 0.14],
        ],
        0xb8d4ee,
        group,
        0.28,
      );
      line(
        [
          [spec.size * 0.45, 0.204, z],
          [0.7, 0.204, z],
          [0.7, 0.204, z + 0.1],
          [0.25, 0.204, z + 0.1],
        ],
        0xb8d4ee,
        group,
        0.28,
      );
    }
    if (spec.key === "cloud") {
      for (let i = 0; i < 3; i++) {
        const server = chip(group, (i - 1) * 0.78, -0.25, 0.6, 0.85, 0x172e61);
        for (let j = 0; j < 3; j++)
          line(
            [
              [-0.18, 0.076, (j - 1) * 0.18],
              [0.18, 0.076, (j - 1) * 0.18],
            ],
            0x91b9ff,
            server,
            0.85,
          );
      }
    } else if (spec.key === "backend") {
      const cpu = chip(group, 0, -0.14, 0.96, 0.94, 0x274968);
      for (let i = 0; i < 5; i++)
        for (const sign of [-1, 1]) {
          const pin = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.03, 0.12),
            new THREE.MeshStandardMaterial({
              color: 0xb6d5ee,
              metalness: 0.8,
              roughness: 0.3,
            }),
          );
          pin.position.set((i - 2) * 0.16, 0.035, sign * 0.53);
          cpu.add(pin);
        }
      chip(group, -0.88, -0.32, 0.34, 0.5, 0x547666);
      chip(group, 0.88, -0.32, 0.34, 0.5, 0x547666);
    } else {
      const cpu = chip(group, 0, -0.15, 0.9, 0.9, 0x1e4e56);
      for (let x = -1; x <= 1; x++)
        for (let z = -1; z <= 1; z++) {
          const cell = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.06, 0.14),
            new THREE.MeshStandardMaterial({
              color: 0xc7ed9b,
              roughness: 0.55,
            }),
          );
          cell.position.set(x * 0.23, 0.1, z * 0.23);
          cpu.add(cell);
        }
    }
    layers.push({ key: spec.key, group, material, outline, y: spec.y });
  }
  const grid = new THREE.GridHelper(8, 20, 0x364b3d, 0x253c2c);
  grid.position.y = -0.28;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);
  for (const [x, z] of [
    [-1.1, -1.1],
    [1.1, -1.1],
    [1.1, 1.1],
    [-1.1, 1.1],
  ])
    line(
      [
        [x, 0.2, z],
        [x, 2.1, z],
      ],
      0x708ca4,
      model,
      0.25,
    );
  const packets = Array.from({ length: 4 }, (_, i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.055, 0.055),
      new THREE.MeshBasicMaterial({ color: 0xc6eca1 }),
    );
    mesh.position.set(i % 2 ? 1.1 : -1.1, 0.5, i < 2 ? -1.1 : 1.1);
    model.add(mesh);
    return mesh;
  });

  let selected: LayerKey = "cloud",
    rotation = -0.24,
    tilt = 0,
    until = 0,
    frame = 0,
    inView = true,
    disposed = false;
  let drag: { x: number; rotation: number } | null = null;
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  model.rotation.y = rotation;

  // Render briefly on interaction, then let the GPU rest while the page is idle.
  function render(now: number) {
    if (disposed || !inView || document.hidden) return;
    model.rotation.y = reduced.matches
      ? rotation
      : THREE.MathUtils.lerp(model.rotation.y, rotation, 0.12);
    model.rotation.x = reduced.matches
      ? tilt
      : THREE.MathUtils.lerp(model.rotation.x, tilt, 0.12);
    for (const layer of layers) {
      const active = layer.key === selected,
        y = layer.y + (active ? 0.13 : 0);
      layer.group.position.y = reduced.matches
        ? y
        : THREE.MathUtils.lerp(layer.group.position.y, y, 0.12);
      layer.material.emissive.setHex(active ? 0x153663 : 0);
      layer.material.emissiveIntensity = active ? 0.35 : 0;
      layer.outline.opacity = active ? 0.85 : 0.28;
    }
    packets.forEach((packet, i) => {
      packet.position.y = reduced.matches
        ? 0.7 + i * 0.3
        : 0.22 + ((now * 0.00045 + i * 0.38) % 1) * 2;
    });
    renderer.render(scene, camera);
    canvas.dataset.rendered = "true";
    if (!reduced.matches && now < until) frame = requestAnimationFrame(render);
  }
  function requestRender(duration = 900) {
    cancelAnimationFrame(frame);
    until = performance.now() + duration;
    render(performance.now());
  }
  function select(key: LayerKey) {
    selected = key;
    requestRender();
  }
  const events = new AbortController();
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") return;
      drag = { x: e.clientX, rotation };
      canvas.setPointerCapture(e.pointerId);
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch" || reduced.matches) return;
      if (drag) rotation = drag.rotation + (e.clientX - drag.x) * 0.008;
      else {
        const b = canvas.getBoundingClientRect();
        rotation = -0.24 + ((e.clientX - b.left) / b.width - 0.5) * 0.25;
        tilt = ((e.clientY - b.top) / b.height - 0.5) * 0.06;
      }
      requestRender();
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "pointerup",
    (e) => {
      if (e.pointerType === "touch") return;
      const clicked = !drag || Math.abs(e.clientX - drag.x) < 5;
      drag = null;
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      if (!clicked) return;
      const b = canvas.getBoundingClientRect();
      pointer.set(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        -((e.clientY - b.top) / b.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(targets)[0];
      if (hit) {
        const key = hit.object.userData.layer as LayerKey;
        select(key);
        onSelect(key);
      }
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "pointercancel",
    () => {
      drag = null;
    },
    { signal: events.signal },
  );
  canvas.addEventListener(
    "pointerleave",
    () => {
      if (!drag) {
        rotation = -0.24;
        tilt = 0;
        requestRender();
      }
    },
    { signal: events.signal },
  );
  function resize() {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const half = 2.65,
      aspect = width / height;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    requestRender(200);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) requestRender();
    else cancelAnimationFrame(frame);
  });
  visibilityObserver.observe(viewport);
  reduced.addEventListener("change", () => requestRender(), {
    signal: events.signal,
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else requestRender();
    },
    { signal: events.signal },
  );
  resize();
  return {
    select,
    reset() {
      rotation = -0.24;
      tilt = 0;
      select("cloud");
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      events.abort();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line))
          return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if (material instanceof THREE.MeshBasicMaterial)
          material.map?.dispose();
        material.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      delete canvas.dataset.rendered;
    },
  };
}
