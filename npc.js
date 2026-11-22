import * as THREE from 'three';
import { createDetailedHuman } from './character.js';

const CIVILIAN_STYLES = [
  { shirt: 0xe63946, pants: 0x1d3557, hair: 0x141414 },
  { shirt: 0xf4a261, pants: 0x264653, hair: 0x3b2314 },
  { shirt: 0x2a9d8f, pants: 0x2b2d42, hair: 0x111111 },
  { shirt: 0x6d597a, pants: 0x1f2421, hair: 0x4a3525 },
  { shirt: 0x457b9d, pants: 0x333533, hair: 0x0d0d0d },
  { shirt: 0xe9c46a, pants: 0x22223b, hair: 0x2b1d0e },
  { shirt: 0x8d99ae, pants: 0x2b2d42, hair: 0x1c1c1c }
];

export class NpcManager {
  constructor(scene, collidesAt, onShootTracer) {
    this.scene = scene;
    this.collidesAt = collidesAt;
    this.onShootTracer = onShootTracer;
    this.npcs = [];
  }

  spawnNpc(x, z, index = 0, isPolice = false) {
    const style = CIVILIAN_STYLES[index % CIVILIAN_STYLES.length];
    const mesh = createDetailedHuman(
      isPolice
        ? { shirtColor: 0x1b3b6f, pantsColor: 0x141e30, hairColor: 0x111111, isPolice: true }
        : { shirtColor: style.shirt, pantsColor: style.pants, hairColor: style.hair, isPolice: false }
    );
    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    const npc = {
      mesh,
      isPolice,
      hp: isPolice ? 160 : 100,
      dead: false,
      respawnTimer: 18,
      spawnPos: new THREE.Vector3(x, 0, z),
      state: 'walk', // 'walk' | 'idle' | 'flee' | 'cower' | 'chase'
      stateTimer: 1.5 + Math.random() * 3.5,
      dirAngle: Math.random() * Math.PI * 2,
      walkSpeed: 2.2 + Math.random() * 0.8,
      runSpeed: isPolice ? 7.8 : 6.5,
      vy: 0,
      jumpCooldown: 1 + Math.random() * 2,
      attackCooldown: 0,
      shootCooldown: 0.6 + Math.random() * 0.6
    };

    this.npcs.push(npc);
    return npc;
  }

  populateInitial(spots) {
    spots.forEach(([x, z], i) => this.spawnNpc(x, z, i, false));
  }

  alertNearby(origin, playerPos, wantedLevel) {
    for (const npc of this.npcs) {
      if (npc.dead) continue;
      const dist = npc.mesh.position.distanceTo(origin);
      if (dist < 42) {
        if (npc.isPolice || wantedLevel >= 2) {
          npc.state = 'chase';
          npc.stateTimer = 8;
        } else {
          npc.state = Math.random() < 0.35 ? 'cower' : 'flee';
          npc.stateTimer = 4 + Math.random() * 3;
          const away = npc.mesh.position.clone().sub(playerPos);
          npc.dirAngle = Math.atan2(away.x, away.z);
        }
      }
    }
  }

  damageNpc(npc, amount, knockDir, onKill) {
    if (npc.dead) return;
    npc.hp -= amount;
    npc.mesh.userData.triggerHitReact();

    if (knockDir) {
      const nextP = npc.mesh.position.clone().addScaledVector(knockDir, 0.35);
      if (!this.collidesAt(nextP, 0.42)) {
        npc.mesh.position.x = nextP.x;
        npc.mesh.position.z = nextP.z;
      }
    }

    if (npc.hp <= 0) {
      npc.dead = true;
      npc.respawnTimer = 18;
      npc.vy = 0;
      npc.mesh.rotation.x = -Math.PI / 2;
      npc.mesh.position.y = 0.22;
      if (onKill) onKill(npc, knockDir);
    } else {
      // Bir vuruşda ölmür: ya sarsılır/qorxur, ya qaçır, ya da təqib/atəş edir
      if (npc.isPolice) {
        npc.state = 'chase';
        npc.stateTimer = 10;
      } else {
        npc.state = Math.random() < 0.45 ? 'cower' : 'flee';
        npc.stateTimer = 3.5 + Math.random() * 2.5;
      }
    }
  }

  update(dt, { playerPos, playerInCar, wantedLevel, cars, onPlayerHit, onKillNpc }) {
    for (const npc of this.npcs) {
      if (npc.dead) {
        npc.respawnTimer -= dt;
        if (npc.respawnTimer <= 0) {
          npc.dead = false;
          npc.hp = npc.isPolice ? 160 : 100;
          npc.state = npc.isPolice && wantedLevel > 0 ? 'chase' : 'walk';
          npc.stateTimer = 2 + Math.random() * 3;
          npc.mesh.rotation.x = 0;
          npc.mesh.position.copy(npc.spawnPos);
        }
        continue;
      }

      if (npc.attackCooldown > 0) npc.attackCooldown -= dt;
      if (npc.shootCooldown > 0) npc.shootCooldown -= dt;
      npc.jumpCooldown -= dt;
      npc.stateTimer -= dt;

      const toPlayer = playerPos.clone().sub(npc.mesh.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();

      let isAttacking = false;
      let isAiming = false;
      let isCowering = false;
      let moveSpeed = 0;
      let speedRatio = 0;

      if (npc.isPolice && wantedLevel > 0 && distToPlayer < 52) {
        npc.state = 'chase';
      } else if (npc.state === 'chase' && (wantedLevel === 0 || distToPlayer > 60)) {
        npc.state = 'walk';
        npc.stateTimer = 2.5;
      } else if ((npc.state === 'flee' || npc.state === 'cower') && npc.stateTimer <= 0) {
        npc.state = 'walk';
        npc.stateTimer = 3 + Math.random() * 3;
      }

      if (npc.state === 'chase') {
        if (distToPlayer > 0.01) {
          const dir = toPlayer.clone().normalize();
          npc.dirAngle = Math.atan2(dir.x, dir.z);
          npc.mesh.rotation.y = npc.dirAngle;
        }

        if (npc.isPolice && distToPlayer < 26) {
          // Polis silahla atəş açır və yaxınlaşır
          isAiming = true;
          moveSpeed = distToPlayer > 7 ? npc.runSpeed * 0.7 : 0;
          speedRatio = moveSpeed > 0 ? 0.8 : 0;

          if (npc.shootCooldown <= 0) {
            npc.shootCooldown = 0.85 + Math.random() * 0.45;
            const muzzle = npc.mesh.position.clone().add(new THREE.Vector3(0, 1.35, 0));
            const targetPt = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
            if (this.onShootTracer) this.onShootTracer(muzzle, targetPt);
            if (!playerInCar && distToPlayer < 25 && onPlayerHit) {
              onPlayerHit(10);
            }
          }
        } else if (!playerInCar && distToPlayer < 1.85) {
          moveSpeed = 0;
          speedRatio = 0;
          if (npc.attackCooldown <= 0) {
            npc.attackCooldown = 1.05;
            isAttacking = true;
            npc.mesh.userData.triggerAttack();
            if (onPlayerHit) onPlayerHit(npc.isPolice ? 12 : 7);
          }
        } else {
          moveSpeed = npc.runSpeed;
          speedRatio = 1.0;
        }
      } else if (npc.state === 'cower') {
        isCowering = true;
        moveSpeed = 0;
        speedRatio = 0;
      } else if (npc.state === 'flee') {
        const away = npc.mesh.position.clone().sub(playerPos);
        away.y = 0;
        if (away.lengthSq() > 0.01) {
          away.normalize();
          npc.dirAngle = Math.atan2(away.x, away.z);
        }
        moveSpeed = npc.runSpeed;
        speedRatio = 1.0;
      } else {
        // Normal gəzinti və yerində fasilə (idle hərəkətləri ilə)
        if (npc.stateTimer <= 0) {
          if (npc.state === 'walk') {
            npc.state = Math.random() < 0.45 ? 'idle' : 'walk';
            npc.stateTimer = npc.state === 'idle' ? (1.5 + Math.random() * 2.5) : (2.5 + Math.random() * 4);
            npc.dirAngle += (Math.random() - 0.5) * 2.2;
          } else {
            npc.state = 'walk';
            npc.stateTimer = 2.5 + Math.random() * 4;
            npc.dirAngle += (Math.random() - 0.5) * 2.4;
          }
        }

        if (npc.state === 'walk') {
          moveSpeed = npc.walkSpeed;
          speedRatio = 0.45;
        } else {
          moveSpeed = 0;
          speedRatio = 0;
        }
      }

      const isGrounded = npc.mesh.position.y <= 0.001 && npc.vy === 0;
      if (isGrounded && npc.jumpCooldown <= 0 && (npc.state === 'flee' || npc.state === 'chase')) {
        npc.vy = 6.2;
        npc.jumpCooldown = 1.8 + Math.random() * 2.5;
      }

      if (npc.mesh.position.y > 0 || npc.vy !== 0) {
        npc.vy -= 16.5 * dt;
        npc.mesh.position.y += npc.vy * dt;
        if (npc.mesh.position.y <= 0) {
          npc.mesh.position.y = 0;
          npc.vy = 0;
        }
      }

      if (moveSpeed > 0) {
        const step = new THREE.Vector3(Math.sin(npc.dirAngle), 0, Math.cos(npc.dirAngle));
        const nextPos = npc.mesh.position.clone().addScaledVector(step, moveSpeed * dt);

        if (Math.abs(nextPos.x) < 220 && Math.abs(nextPos.z) < 220 && !this.collidesAt(nextPos, 0.42)) {
          npc.mesh.position.x = nextPos.x;
          npc.mesh.position.z = nextPos.z;
          npc.mesh.rotation.y = npc.dirAngle;
        } else {
          npc.dirAngle += Math.PI * 0.75;
          if (isGrounded) npc.vy = 5.5;
        }
      }

      npc.mesh.userData.updatePose(dt, {
        speedRatio,
        isAirborne: npc.mesh.position.y > 0.02,
        isAttacking,
        isAiming,
        isCowering
      });

      // Maşınla vurulma
      for (const car of cars) {
        if (Math.abs(car.userData.speed) > 5.0) {
          const dist = npc.mesh.position.distanceTo(car.position);
          if (dist < 2.4) {
            const knock = npc.mesh.position.clone().sub(car.position);
            knock.y = 0;
            if (knock.lengthSq() > 0.001) knock.normalize();
            this.damageNpc(npc, 100, knock, onKillNpc);
            break;
          }
        }
      }
    }
  }
}
