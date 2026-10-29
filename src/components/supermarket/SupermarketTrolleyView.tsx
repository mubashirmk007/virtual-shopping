'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSupermarketStore } from '@/stores/supermarketStore';
import { useCartStore } from '@/stores/cartStore';
import { ProductPackage3D } from './ProductPackage3D';
import { soundManager } from '@/lib/sound';

export function SupermarketTrolleyView() {
  const { camera } = useThree();
  const trolleyGroupRef = useRef<THREE.Group>(null);
  const impactRef = useRef<number>(0);
  const walkCycleRef = useRef<number>(0);
  const prevCameraPosRef = useRef<THREE.Vector3 | null>(null);

  const {
    movementInput,
    isCameraTransitioning,
    flyingProduct,
    flyingTimestamp,
    clearFlyingProduct,
  } = useSupermarketStore();
  const { items } = useCartStore();

  // Flying item animation state
  const flyingGroupRef = useRef<THREE.Group>(null);
  const flyingProgressRef = useRef<number>(1); // 1 = done

  // Materials for realistic trolley, hands and sleeves
  const materials = useMemo(() => {
    return {
      redPlastic: new THREE.MeshStandardMaterial({
        color: '#dc2626',
        roughness: 0.22,
        metalness: 0.12,
      }),
      darkRedPlastic: new THREE.MeshStandardMaterial({
        color: '#991b1b',
        roughness: 0.3,
        metalness: 0.08,
      }),
      chromeWire: new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.98,
        roughness: 0.12,
      }),
      darkChassis: new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.85,
        roughness: 0.25,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: '#c58b68',
        roughness: 0.58,
        metalness: 0.04,
      }),
      skinShadow: new THREE.MeshStandardMaterial({
        color: '#b37856',
        roughness: 0.65,
        metalness: 0.04,
      }),
      sleeve: new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.92,
        metalness: 0.02,
      }),
      cuff: new THREE.MeshStandardMaterial({
        color: '#09090b',
        roughness: 0.96,
        metalness: 0.0,
      }),
      casterWheel: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.8,
        metalness: 0.2,
      }),
    };
  }, []);

  // When flyingProduct changes, trigger 3D projectile curve into basket
  useEffect(() => {
    if (flyingProduct && flyingTimestamp > 0) {
      flyingProgressRef.current = 0;
      soundManager.playSelect();
    }
  }, [flyingProduct, flyingTimestamp]);

  useFrame((_, delta) => {
    if (!trolleyGroupRef.current) return;

    // Detect actual camera displacement (works seamlessly for mouse wheel scroll, WASD, joystick & HUD buttons)
    if (!prevCameraPosRef.current) {
      prevCameraPosRef.current = camera.position.clone();
    }
    const distMoved = camera.position.distanceTo(prevCameraPosRef.current);
    prevCameraPosRef.current.copy(camera.position);

    if (distMoved > 0.0004 && !isCameraTransitioning) {
      walkCycleRef.current += distMoved * 18;
    }

    // Authentic shopping cart walk bobbing & vibration
    const bobY = Math.sin(walkCycleRef.current) * 0.006;
    const swayX = Math.cos(walkCycleRef.current * 0.5) * 0.004;
    const tiltZ = Math.sin(walkCycleRef.current * 0.5) * 0.005;

    // Steering lean
    const steerLean =
      (movementInput.left ? 0.025 : 0) + (movementInput.right ? -0.025 : 0);

    // Impact spring decay (when item drops in basket)
    impactRef.current = THREE.MathUtils.damp(impactRef.current, 0, 7.5, delta);

    // Camera transform tracking
    trolleyGroupRef.current.position.copy(camera.position);
    trolleyGroupRef.current.quaternion.copy(camera.quaternion);

    // Camera coordinate basis vectors
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    // Lock trolley in first-person view in front of camera
    // Distance ahead: 0.65m, Height below camera eyes: -0.28m
    trolleyGroupRef.current.position
      .addScaledVector(forward, 0.65)
      .addScaledVector(up, -0.28 + bobY - impactRef.current)
      .addScaledVector(right, swayX);

    // Subtle natural pitch down to see inside basket and ahead into aisle
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    euler.x += 0.08 + Math.abs(bobY) * 0.3;
    euler.y += steerLean * 0.5;
    euler.z += tiltZ + steerLean;
    trolleyGroupRef.current.quaternion.setFromEuler(euler);

    // Flying Item parabolic trajectory animation directly into basket
    if (flyingGroupRef.current && flyingProgressRef.current < 1) {
      flyingProgressRef.current = Math.min(1, flyingProgressRef.current + delta * 1.85);
      const t = flyingProgressRef.current;

      // Arc from top-right (near drawer) into basket center
      const startX = 0.58;
      const targetX = 0.0;
      const startY = 0.42;
      const targetY = -0.08;
      const startZ = -0.2;
      const targetZ = -0.45;

      // Smooth parabolic arc
      const arcHeight = Math.sin(t * Math.PI) * 0.35;

      const currentX = THREE.MathUtils.lerp(startX, targetX, t);
      const currentY = THREE.MathUtils.lerp(startY, targetY, t) + arcHeight;
      const currentZ = THREE.MathUtils.lerp(startZ, targetZ, t);

      flyingGroupRef.current.position.set(currentX, currentY, currentZ);
      flyingGroupRef.current.rotation.set(t * Math.PI * 3, t * Math.PI * 2, t * 1.2);

      // On landing: bounce trolley basket
      if (t >= 1) {
        impactRef.current = 0.045; // spring dip
        soundManager.playSelect();
        clearFlyingProduct();
      }
    }
  });

  // Limit rendering items in trolley to last 5 items
  const basketDisplayItems = useMemo(() => {
    return items.slice(-5);
  }, [items]);

  return (
    <group ref={trolleyGroupRef}>
      {/* Specular fill light for glistening chrome wires and rich red plastic */}
      <pointLight position={[0, 0.45, -0.15]} intensity={1.6} color="#ffffff" distance={2.8} />

      {/* ======================================================== */}
      {/* 1. RED ERGONOMIC HANDLEBAR (Matches user reference image) */}
      {/* ======================================================== */}
      <group position={[0, 0.01, 0.08]}>
        {/* Main Red Tubular Handlebar across bottom of screen */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={materials.redPlastic}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 24]} />
        </mesh>

        {/* Left Red Ergonomic Corner Handle */}
        <mesh position={[-0.305, 0.005, -0.03]} rotation={[0, 0.4, 0]} material={materials.darkRedPlastic}>
          <boxGeometry args={[0.034, 0.034, 0.09]} />
        </mesh>

        {/* Right Red Ergonomic Corner Handle */}
        <mesh position={[0.305, 0.005, -0.03]} rotation={[0, -0.4, 0]} material={materials.darkRedPlastic}>
          <boxGeometry args={[0.034, 0.034, 0.09]} />
        </mesh>

        {/* Chrome Support Struts connecting Handle to Cart Chassis */}
        <mesh position={[-0.29, -0.07, -0.06]} rotation={[0.4, 0, 0]} material={materials.chromeWire}>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 12]} />
        </mesh>
        <mesh position={[0.29, -0.07, -0.06]} rotation={[0.4, 0, 0]} material={materials.chromeWire}>
          <cylinderGeometry args={[0.007, 0.007, 0.16, 12]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. REALISTIC FIRST-PERSON HANDS & ARMS GRIPPING BAR      */}
      {/* ======================================================== */}

      {/* LEFT ARM & HAND */}
      <group position={[-0.2, 0.005, 0.08]}>
        {/* Dark Ribbed Sleeve entering from bottom-left corner */}
        <mesh position={[-0.11, -0.16, 0.14]} rotation={[0.7, -0.32, -0.28]} material={materials.sleeve}>
          <cylinderGeometry args={[0.046, 0.056, 0.28, 20]} />
        </mesh>

        {/* Dark Ribbed Wrist Cuff */}
        <mesh position={[-0.045, -0.06, 0.065]} rotation={[0.45, -0.2, -0.12]} material={materials.cuff}>
          <cylinderGeometry args={[0.036, 0.042, 0.04, 18]} />
        </mesh>

        {/* Wrist */}
        <mesh position={[-0.02, -0.025, 0.035]} rotation={[0.28, -0.12, 0]} material={materials.skin}>
          <cylinderGeometry args={[0.024, 0.028, 0.06, 14]} />
        </mesh>

        {/* Palm resting over red bar */}
        <mesh position={[0, 0.014, -0.004]} rotation={[0.2, 0, 0]} material={materials.skin}>
          <boxGeometry args={[0.065, 0.034, 0.04]} />
        </mesh>

        {/* Thumb wrapped over top of bar */}
        <mesh position={[0.024, 0.02, 0.012]} rotation={[-0.18, 0.42, 0.1]} material={materials.skin}>
          <cylinderGeometry args={[0.0085, 0.0095, 0.042, 10]} />
        </mesh>

        {/* 4 Fingers wrapped tightly underneath handlebar */}
        {[-0.024, -0.008, 0.008, 0.024].map((fX, i) => (
          <mesh key={`lf-${i}`} position={[fX, -0.011, -0.011]} rotation={[Math.PI / 1.72, 0, 0]} material={materials.skinShadow}>
            <cylinderGeometry args={[0.007, 0.007, 0.032, 10]} />
          </mesh>
        ))}
      </group>

      {/* RIGHT ARM & HAND */}
      <group position={[0.2, 0.005, 0.08]}>
        {/* Dark Ribbed Sleeve entering from bottom-right corner */}
        <mesh position={[0.11, -0.16, 0.14]} rotation={[0.7, 0.32, 0.28]} material={materials.sleeve}>
          <cylinderGeometry args={[0.046, 0.056, 0.28, 20]} />
        </mesh>

        {/* Dark Ribbed Wrist Cuff */}
        <mesh position={[0.045, -0.06, 0.065]} rotation={[0.45, 0.2, 0.12]} material={materials.cuff}>
          <cylinderGeometry args={[0.036, 0.042, 0.04, 18]} />
        </mesh>

        {/* Wrist */}
        <mesh position={[0.02, -0.025, 0.035]} rotation={[0.28, 0.12, 0]} material={materials.skin}>
          <cylinderGeometry args={[0.024, 0.028, 0.06, 14]} />
        </mesh>

        {/* Palm resting over red bar */}
        <mesh position={[0, 0.014, -0.004]} rotation={[0.2, 0, 0]} material={materials.skin}>
          <boxGeometry args={[0.065, 0.034, 0.04]} />
        </mesh>

        {/* Thumb wrapped over top of bar */}
        <mesh position={[-0.024, 0.02, 0.012]} rotation={[-0.18, -0.42, -0.1]} material={materials.skin}>
          <cylinderGeometry args={[0.0085, 0.0095, 0.042, 10]} />
        </mesh>

        {/* 4 Fingers wrapped tightly underneath handlebar */}
        {[-0.024, -0.008, 0.008, 0.024].map((fX, i) => (
          <mesh key={`rf-${i}`} position={[fX, -0.011, -0.011]} rotation={[Math.PI / 1.72, 0, 0]} material={materials.skinShadow}>
            <cylinderGeometry args={[0.007, 0.007, 0.032, 10]} />
          </mesh>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 3. CHROME WIREFRAME SUPERMARKET BASKET                   */}
      {/* ======================================================== */}
      <group position={[0, -0.06, -0.1]}>
        {/* Top Rim: Chrome Perimeter Tubular Frame */}
        {/* Rear top wire */}
        <mesh position={[0, 0.06, 0.12]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeWire}>
          <cylinderGeometry args={[0.006, 0.006, 0.54, 16]} />
        </mesh>

        {/* Front top wire (tapered narrower for realistic perspective) */}
        <mesh position={[0, 0.06, -0.58]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeWire}>
          <cylinderGeometry args={[0.006, 0.006, 0.44, 16]} />
        </mesh>

        {/* Left top edge wire */}
        <mesh position={[-0.245, 0.06, -0.23]} rotation={[0, 0.14, 0]} material={materials.chromeWire}>
          <boxGeometry args={[0.008, 0.008, 0.72]} />
        </mesh>

        {/* Right top edge wire */}
        <mesh position={[0.245, 0.06, -0.23]} rotation={[0, -0.14, 0]} material={materials.chromeWire}>
          <boxGeometry args={[0.008, 0.008, 0.72]} />
        </mesh>

        {/* Horizontal Perimeter Tier Wires (4 Tiers around the basket) */}
        {[-0.01, -0.07, -0.13, -0.18].map((yTier, tierIdx) => (
          <group key={`tier-${tierIdx}`} position={[0, yTier, 0]}>
            {/* Front horizontal wire */}
            <mesh position={[0, 0, -0.58]} rotation={[0, 0, Math.PI / 2]} material={materials.chromeWire}>
              <cylinderGeometry args={[0.003, 0.003, 0.42, 10]} />
            </mesh>
            {/* Left horizontal wire */}
            <mesh position={[-0.235, 0, -0.23]} rotation={[0, 0.14, 0]} material={materials.chromeWire}>
              <boxGeometry args={[0.004, 0.004, 0.7]} />
            </mesh>
            {/* Right horizontal wire */}
            <mesh position={[0.235, 0, -0.23]} rotation={[0, -0.14, 0]} material={materials.chromeWire}>
              <boxGeometry args={[0.004, 0.004, 0.7]} />
            </mesh>
          </group>
        ))}

        {/* Dense Vertical Wires along Left and Right Sides */}
        {[-0.52, -0.45, -0.38, -0.31, -0.24, -0.17, -0.1, -0.03, 0.04, 0.1].map((z, idx) => {
          const tZ = (z + 0.58) / 0.7; // 0 at front, 1 at back
          const sideX = THREE.MathUtils.lerp(0.21, 0.26, tZ);
          return (
            <group key={`side-verticals-${idx}`}>
              {/* Left vertical wire */}
              <mesh position={[-sideX, -0.06, z]} material={materials.chromeWire}>
                <cylinderGeometry args={[0.0028, 0.0028, 0.24, 8]} />
              </mesh>
              {/* Right vertical wire */}
              <mesh position={[sideX, -0.06, z]} material={materials.chromeWire}>
                <cylinderGeometry args={[0.0028, 0.0028, 0.24, 8]} />
              </mesh>
            </group>
          );
        })}

        {/* Dense Vertical Wires along Front Panel */}
        {[-0.18, -0.14, -0.1, -0.06, -0.02, 0.02, 0.06, 0.1, 0.14, 0.18].map((x, idx) => (
          <mesh key={`front-v-${idx}`} position={[x, -0.06, -0.58]} material={materials.chromeWire}>
            <cylinderGeometry args={[0.0028, 0.0028, 0.24, 8]} />
          </mesh>
        ))}

        {/* Bottom Wire Grid Floor */}
        <mesh position={[0, -0.18, -0.23]} rotation={[-Math.PI / 2, 0, 0]} material={materials.chromeWire}>
          <planeGeometry args={[0.4, 0.68]} />
        </mesh>

        {/* Longitudinal Floor Ribs */}
        {[-0.16, -0.12, -0.08, -0.04, 0, 0.04, 0.08, 0.12, 0.16].map((x, i) => (
          <mesh key={`floor-rib-${i}`} position={[x, -0.178, -0.23]} material={materials.chromeWire}>
            <boxGeometry args={[0.0035, 0.0035, 0.66]} />
          </mesh>
        ))}

        {/* Rear Red Child-Seat Folding Flap (Classic Supermarket Feature) */}
        <group position={[0, -0.03, 0.08]} rotation={[-0.16, 0, 0]}>
          <mesh material={materials.redPlastic}>
            <boxGeometry args={[0.26, 0.15, 0.012]} />
          </mesh>
          {/* Leg hole cutouts / indentations */}
          {[-0.065, 0.065].map((hX, idx) => (
            <mesh key={`hole-${idx}`} position={[hX, -0.02, 0.007]} material={materials.darkRedPlastic}>
              <boxGeometry args={[0.05, 0.06, 0.006]} />
            </mesh>
          ))}
        </group>

        {/* Lower Steel Tubular Chassis */}
        <mesh position={[0, -0.25, -0.22]} material={materials.darkChassis}>
          <boxGeometry args={[0.36, 0.02, 0.58]} />
        </mesh>

        {/* Front Caster Wheel Mounts */}
        {[-0.16, 0.16].map((wX, i) => (
          <group key={`wheel-${i}`} position={[wX, -0.29, -0.48]}>
            <mesh material={materials.chromeWire}>
              <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
            </mesh>
            <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.casterWheel}>
              <cylinderGeometry args={[0.024, 0.024, 0.015, 14]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 4. ACTUAL PRODUCTS RESTING INSIDE OUR TROLLEY BASKET     */}
      {/* ======================================================== */}
      <group position={[0, -0.22, -0.3]}>
        {basketDisplayItems.map((cartItem, idx) => {
          // Lay products neatly in the trolley basket with subtle natural tilt
          const itemX = ((idx % 3) - 1) * 0.11;
          const itemZ = -0.04 - Math.floor(idx / 3) * 0.14;
          const rotY = (idx * 0.25) - 0.2;
          return (
            <group
              key={cartItem.product.id}
              position={[itemX, 0.02, itemZ]}
              rotation={[0, rotY, 0]}
              scale={[0.48, 0.48, 0.48]}
            >
              <ProductPackage3D product={cartItem.product} />
            </group>
          );
        })}
      </group>

      {/* ======================================================== */}
      {/* 5. DYNAMIC FLYING PRODUCT ANIMATION INTO BASKET          */}
      {/* ======================================================== */}
      {flyingProduct && (
        <group ref={flyingGroupRef} scale={[0.55, 0.55, 0.55]}>
          <ProductPackage3D product={flyingProduct} />
        </group>
      )}
    </group>
  );
}
