const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

export async function mountProceduralViewer(container, lessonId, snapshot) {
  try {
    const THREE = await import(THREE_URL);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.setAttribute("aria-label", "Interactive 3D lesson view");
    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1, 8);
    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x25382e, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(4, 6, 5);
    scene.add(light);

    if (lessonId === "max-average-643") {
      const { values, start, end, bestStart, k } = snapshot.state;
      values.forEach((value, index) => {
        const active = index >= start && index <= end;
        const best = index >= bestStart && index < bestStart + k;
        const material = new THREE.MeshStandardMaterial({ color: active ? 0xf4cf76 : best ? 0x75b68a : 0xdfece0, roughness: 0.55 });
        const block = new THREE.Mesh(new THREE.BoxGeometry(.75, .75, .75), material);
        block.position.x = (index - (values.length - 1) / 2) * .98;
        block.position.y = active ? .2 : 0;
        group.add(block);
      });
      const frame = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(k * .98, 1.1, 1)),
        new THREE.LineBasicMaterial({ color: 0x296a51 })
      );
      frame.position.x = ((start + end) / 2 - (values.length - 1) / 2) * .98;
      frame.position.y = .2;
      group.add(frame);
    } else {
      const nodes = [["reader",-3,0],["gateway",-1.5,1.3],["feed-service",0,0],["metadata-cache",1.5,1.3],["timeline-db",3,0],["cdn",-1.5,-1.8],["object-storage",1.5,-1.8]];
      const active = new Set([snapshot.state.current.from, snapshot.state.current.to]);
      nodes.forEach(([id, x, y]) => {
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(.42, 1),
          new THREE.MeshStandardMaterial({ color: active.has(id) ? 0xd87961 : 0x75b68a, roughness: .35 })
        );
        mesh.position.set(x, y, 0);
        group.add(mesh);
      });
    }

    const observer = new ResizeObserver(() => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    observer.observe(container);
    renderer.render(scene, camera);
    return {
      dispose() {
        observer.disconnect();
        group.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material?.dispose?.();
        });
        renderer.dispose();
      }
    };
  } catch (error) {
    throw new Error("3D view could not load. The complete 2D diagram remains available.");
  }
}
