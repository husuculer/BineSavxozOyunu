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
  constructor(scene, collidesAt) {
    this.scene = scene;
    this.collidesAt = collidesAt;
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
      hp: isPolice ? 150 : 100,
      dead: false,
      respawnTimer: 16,
      spawnPos: new THREE.Vector3(x, 0, z),
      state: 'walk', // 'walk' | 'flee' | 'chase' | 'attack'
      dirAngle: Math.random() * Math.PI * 2,
      turnTimer: 1.5 + Math.random() * 3,
      walkSpeed: 2.2 + Math.random() * 0.8,
      runSpeed: isPolice ? 7.6 : 6.4,
      vy: 0,
      jumpCooldown: 1 + Math.random() * 2,
      attackCooldown: 0
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
      if (dist < 38) {
        if (npc.isPolice || wantedLevel >= 2) {
          npc.state = 'chase';
        } else {
          npc.state = 'flee';
          const away = npc.mesh.position.clone().sub(playerPos);
          npc.dirAngle = Math.atan2(away.x, away.z);
        }
      }
    }
  }

  damageNpc(npc, amount, knockDir, onKill) {
    if (npc.dead) return;
    npc.hp -= amount;
    if (knockDir) {
      npc.mesh.position.addScaledVector(knockDir, 0.55);
    }

    if (npc.hp <= 0) {
      npc.dead = true;
      npc.respawnTimer = 16;
      npc.vy = 0;
      npc.mesh.rotation.x = -Math.PI / 2;
      npc.mesh.position.y = 0.22;
      if (onKill) onKill(npc, knockDir);
    } else {
      // Zərbə alan NPC ya qaçır, ya da yaxındırsa vurmağa çalışır
      npc.state = npc.isPolice ? 'chase' : (Math.random() < 0.35 ? 'chase' : 'flee');
    }
  }

  update(dt, { playerPos, playerInCar, wantedLevel, cars, onPlayerHit, onKillNpc }) {
    for (const npc of this.npcs) {
      if (npc.dead) {
        npc.respawnTimer -= dt;
        if (npc.respawnTimer <= 0) {
          npc.dead = false;
          npc.hp = npc.isPolice ? 150 : 100;
          npc.state = npc.isPolice && wantedLevel > 0 ? 'chase' : 'walk';
          npc.mesh.rotation.x = 0;
          npc.mesh.position.copy(npc.spawnPos);
        }
        continue;
      }

      if (npc.attackCooldown > 0) npc.attackCooldown -= dt;
      npc.jumpCooldown -= dt;

      const distToPlayer = npc.mesh.position.distanceTo(playerPos);
      let isAttacking = false;
      let moveSpeed = npc.walkSpeed;
      let speedRatio = 0.45;

      if (npc.isPolice && wantedLevel > 0 && distToPlayer < 45) {
        npc.state = 'chase';
      } else if (npc.state === 'chase' && (wantedLevel === 0 || distToPlayer > 50)) {
        npc.state = 'walk';
      } else if (npc.state === 'flee' && distToPlayer > 35) {
        npc.state = 'walk';
      }

      if (npc.state === 'chase' && !playerInCar) {
        const toPlayer = playerPos.clone().sub(npc.mesh.position);
        toPlayer.y = 0;
        const d = toPlayer.length();
        if (d > 0.01) {
          toPlayer.normalize();
          npc.dirAngle = Math.atan2(toPlayer.x, toPlayer.z);
          npc.mesh.rotation.y = npc.dirAngle;
        }

        if (d < 1.85) {
          // Vurma animasiyası və zərbə
          moveSpeed = 0;
          speedRatio = 0;
          if (npc.attackCooldown <= 0) {
            npc.attackCooldown = 1.05;
            isAttacking = true;
            npc.mesh.userData.triggerAttack();
            if (onPlayerHit) onPlayerHit(npc.isPolice ? 12 : 8);
          }
        } else {
          moveSpeed = npc.runSpeed;
          speedRatio = 1.0;
        }
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
        // Normal yerimə
        npc.turnTimer -= dt;
        if (npc.turnTimer <= 0) {
          npc.dirAngle += (Math.random() - 0.5) * 2.2;
          npc.turnTimer = 2 + Math.random() * 3.5;
        }
        moveSpeed = npc.walkSpeed;
        speedRatio = 0.45;
      }

      // Tullanma (qaçarkən/təqib edərkən və ya maneə qarşısında)
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
          npc.dirAngle += Math.PI * 0.7;
          if (isGrounded) npc.vy = 5.5;
        }
      }

      npc.mesh.userData.updatePose(dt, {
        speedRatio,
        isAirborne: npc.mesh.position.y > 0.02,
        isAttacking
      });

      // Maşınla vurulma
      for (const car of cars) {
        if (Math.abs(car.userData.speed) > 4.5) {
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
