import * as THREE from 'three';

export function createDetailedHuman(options = {}) {
  const shirtColor = options.shirtColor ?? 0x1d3557;
  const pantsColor = options.pantsColor ?? 0x2b2d42;
  const skinColor  = options.skinColor  ?? 0xe0ac69;
  const hairColor  = options.hairColor  ?? 0x181818;
  const shoeColor  = options.shoeColor  ?? 0x141414;
  const isPolice   = Boolean(options.isPolice);

  const root = new THREE.Group();

  const skinMat  = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.68 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.78 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85 });
  const hairMat  = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
  const shoeMat  = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.55 });
  const beltMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.3 });

  // Gövdə + Yaxa + Kəmər
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.3), shirtMat);
  chest.position.y = 1.28;
  chest.castShadow = true;
  root.add(chest);

  const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.27), shirtMat);
  abdomen.position.y = 0.96;
  abdomen.castShadow = true;
  root.add(abdomen);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.29), beltMat);
  belt.position.y = 0.83;
  belt.castShadow = true;
  root.add(belt);

  if (isPolice) {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.7, roughness: 0.2 })
    );
    badge.position.set(0.14, 1.32, 0.16);
    root.add(badge);
  }

  // Boyun
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.13, 12), skinMat);
  neck.position.y = 1.56;
  neck.castShadow = true;
  root.add(neck);

  // Baş (kəllə, saç, qaş, göz, burun, polis papağı varsa)
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.78;

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), skinMat);
  skull.castShadow = true;
  headPivot.add(skull);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 6), skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.0, 0.19);
  headPivot.add(nose);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const browMat = new THREE.MeshBasicMaterial({ color: hairColor });

  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.02), eyeMat);
    eye.position.set(s * 0.075, 0.035, 0.165);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.025, 0.025), browMat);
    brow.position.set(s * 0.075, 0.075, 0.168);
    headPivot.add(eye, brow);
  }

  if (isPolice) {
    const capBrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.03, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x101820 })
    );
    capBrim.position.set(0, 0.18, 0.04);
    const capTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.12, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x1b2a4a })
    );
    capTop.position.set(0, 0.24, -0.01);
    headPivot.add(capBrim, capTop);
  } else {
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.35), hairMat);
    hairTop.position.set(0, 0.18, -0.01);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.08), hairMat);
    hairBack.position.set(0, 0.06, -0.14);
    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.28), hairMat);
    hairSideL.position.set(-0.16, 0.1, -0.01);
    const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.28), hairMat);
    hairSideR.position.set(0.16, 0.1, -0.01);
    headPivot.add(hairTop, hairBack, hairSideL, hairSideR);
  }

  root.add(headPivot);

  // Qollar (Çiyin + Üst qol + Dirsək + Bilək/Yumruq)
  function createArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.35, 1.44, 0);

    const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), shirtMat);
    deltoid.castShadow = true;
    shoulder.add(deltoid);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.27, 0.15), shirtMat);
    upperArm.position.y = -0.14;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.28;

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.13), skinMat);
    forearm.position.y = -0.14;
    forearm.castShadow = true;
    elbow.add(forearm);

    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.15), skinMat);
    fist.position.set(0, -0.32, 0.02);
    fist.castShadow = true;
    elbow.add(fist);

    shoulder.add(elbow);
    return { shoulder, elbow };
  }

  const leftArm = createArm(-1);
  const rightArm = createArm(1);
  root.add(leftArm.shoulder, rightArm.shoulder);

  // Ayaqlar (Omba + Bud + Diz + Baldır + Ayaqqabı)
  function createLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.14, 0.8, 0);

    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.36, 0.21), pantsMat);
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.36;

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.35, 0.19), pantsMat);
    shin.position.y = -0.175;
    shin.castShadow = true;
    knee.add(shin);

    const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.31), shoeMat);
    shoeSole.position.set(0, -0.37, 0.04);
    const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.26), shoeMat);
    shoeUpper.position.set(0, -0.31, 0.02);
    shoeUpper.castShadow = true;
    knee.add(shoeSole, shoeUpper);

    hip.add(knee);
    return { hip, knee };
  }

  const leftLeg = createLeg(-1);
  const rightLeg = createLeg(1);
  root.add(leftLeg.hip, rightLeg.hip);

  let animPhase = Math.random() * 10;
  let attackTimer = 0;

  root.userData.triggerAttack = () => {
    attackTimer = 0.32;
  };

  root.userData.updatePose = (dt, { speedRatio = 0, isAirborne = false, isAttacking = false }) => {
    if (isAttacking && attackTimer <= 0) {
      attackTimer = 0.32;
    }

    if (attackTimer > 0) {
      attackTimer -= dt;
      const p = 1 - attackTimer / 0.32;
      const thrust = Math.sin(p * Math.PI);
      rightArm.shoulder.rotation.x = -Math.PI * 0.55 * thrust;
      rightArm.elbow.rotation.x = -0.5 * (1 - thrust);
      leftArm.shoulder.rotation.x = 0.35 * thrust;
      chest.rotation.y = -0.25 * thrust;
      return;
    }

    chest.rotation.y *= 0.8;
    rightArm.elbow.rotation.x *= 0.8;

    if (isAirborne) {
      leftLeg.hip.rotation.x = 0.55;
      leftLeg.knee.rotation.x = -0.7;
      rightLeg.hip.rotation.x = -0.35;
      rightLeg.knee.rotation.x = -0.4;
      leftArm.shoulder.rotation.x = -0.7;
      rightArm.shoulder.rotation.x = -0.7;
      return;
    }

    if (speedRatio > 0.05) {
      const freq = 7.5 + speedRatio * 7.5;
      animPhase += dt * freq;
      const amp = 0.42 + speedRatio * 0.45;
      const s = Math.sin(animPhase);

      leftLeg.hip.rotation.x = s * amp;
      rightLeg.hip.rotation.x = -s * amp;
      leftLeg.knee.rotation.x = Math.max(0, -s) * -0.65;
      rightLeg.knee.rotation.x = Math.max(0, s) * -0.65;

      leftArm.shoulder.rotation.x = -s * amp * 0.85;
      rightArm.shoulder.rotation.x = s * amp * 0.85;
      leftArm.elbow.rotation.x = -0.25;
      rightArm.elbow.rotation.x = -0.25;

      const bob = Math.abs(Math.cos(animPhase)) * (0.025 + speedRatio * 0.03);
      chest.position.y = 1.28 + bob;
      abdomen.position.y = 0.96 + bob;
      belt.position.y = 0.83 + bob;
      neck.position.y = 1.56 + bob;
      headPivot.position.y = 1.78 + bob;
    } else {
      leftLeg.hip.rotation.x *= 0.75;
      rightLeg.hip.rotation.x *= 0.75;
      leftLeg.knee.rotation.x *= 0.75;
      rightLeg.knee.rotation.x *= 0.75;
      leftArm.shoulder.rotation.x *= 0.75;
      rightArm.shoulder.rotation.x *= 0.75;
      leftArm.elbow.rotation.x *= 0.75;
      rightArm.elbow.rotation.x *= 0.75;

      chest.position.y = 1.28;
      abdomen.position.y = 0.96;
      belt.position.y = 0.83;
      neck.position.y = 1.56;
      headPivot.position.y = 1.78;
    }
  };

  return root;
}
