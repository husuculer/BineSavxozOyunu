import * as THREE from 'three';

export function createDetailedCar(x, z, yaw, options = {}) {
  const bodyColor = options.bodyColor ?? 0xd62828;
  const isPolice  = Boolean(options.isPolice);
  const isTraffic = Boolean(options.isTraffic);

  const car = new THREE.Group();

  const mainMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0xf8f9fa : bodyColor,
    roughness: 0.32,
    metalness: 0.28
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0x1d3557 : 0x1b1f24,
    roughness: 0.5,
    metalness: 0.3
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2634,
    roughness: 0.12,
    metalness: 0.75
  });

  // Aşağı şassi və bamperlər
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.55, 4.45), mainMat);
  lowerBody.position.y = 0.62;
  lowerBody.castShadow = true;
  car.add(lowerBody);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.26, 0.24), trimMat);
  frontBumper.position.set(0, 0.45, 2.26);
  frontBumper.castShadow = true;
  car.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.26, 0.24), trimMat);
  rearBumper.position.set(0, 0.45, -2.26);
  rearBumper.castShadow = true;
  car.add(rearBumper);

  // Polis zolağı (yan tərəflər)
  if (isPolice) {
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 4.35), trimMat);
    stripeL.position.set(-1.08, 0.72, 0);
    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 4.35), trimMat);
    stripeR.position.set(1.08, 0.72, 0);
    car.add(stripeL, stripeR);
  }

  // Əyilə bilən kapot
  const hoodMat = new THREE.MeshStandardMaterial({
    color: isPolice ? 0xf8f9fa : bodyColor,
    roughness: 0.35,
    metalness: 0.28
  });
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.16, 1.25), hoodMat);
  hood.position.set(0, 0.94, 1.52);
  hood.castShadow = true;
  car.add(hood);

  // Kabin və şüşələr
  const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.56, 1.95), mainMat);
  cabinRoof.position.set(0, 1.38, -0.22);
  cabinRoof.castShadow = true;
  car.add(cabinRoof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.44, 0.12), glassMat);
  windshield.position.set(0, 1.32, 0.76);
  windshield.rotation.x = -0.35;
  car.add(windshield);

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.42, 0.12), glassMat);
  rearWindow.position.set(0, 1.32, -1.2);
  rearWindow.rotation.x = 0.35;
  car.add(rearWindow);

  // Yan güzgülər
  for (const s of [-1, 1]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.14), trimMat);
    mirror.position.set(s * 1.18, 1.08, 0.62);
    car.add(mirror);
  }

  // Ön və arxa faralar
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), headMat);
    hl.position.set(s * 0.72, 0.72, 2.25);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), tailMat);
    tl.position.set(s * 0.72, 0.74, -2.25);
    car.add(hl, tl);
  }

  // Polis miqalkası (göy + qırmızı)
  let sirenRed = null;
  let sirenBlue = null;
  if (isPolice) {
    const lightBarBase = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.28), trimMat);
    lightBarBase.position.set(0, 1.69, -0.15);

    sirenRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.14, 0.24),
      new THREE.MeshBasicMaterial({ color: 0xff1e42 })
    );
    sirenRed.position.set(-0.27, 1.77, -0.15);

    sirenBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.14, 0.24),
      new THREE.MeshBasicMaterial({ color: 0x1e90ff })
    );
    sirenBlue.position.set(0.27, 1.77, -0.15);

    car.add(lightBarBase, sirenRed, sirenBlue);
  }

  // Detallı təkərlər (şin + disk)
  const tireGeo = new THREE.CylinderGeometry(0.43, 0.43, 0.34, 14);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });

  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 10);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.65, roughness: 0.25 });

  const wheelCoords = [
    [-1.12, 0.43, 1.4],
    [1.12, 0.43, 1.4],
    [-1.12, 0.43, -1.4],
    [1.12, 0.43, -1.4]
  ];
  for (const [wx, wy, wz] of wheelCoords) {
    const wGroup = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wGroup.add(tire, rim);
    wGroup.position.set(wx, wy, wz);
    car.add(wGroup);
  }

  car.position.set(x, 0, z);
  car.rotation.y = yaw;
  car.userData = {
    speed: isTraffic ? 10.5 : 0,
    hp: 100,
    maxHp: 100,
    wrecked: false,
    isPolice,
    isTraffic,
    baseColor: isPolice ? 0xf8f9fa : bodyColor,
    hood,
    hoodMat,
    mainMat,
    sirenRed,
    sirenBlue,
    knockVel: new THREE.Vector3(),
    smokeTimer: 0
  };

  return car;
}
