'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useSupermarketStore } from '@/stores/supermarketStore';
import gsap from 'gsap';

export function CameraController() {
  const { camera, gl } = useThree();
  const {
    targetCameraPos,
    targetCameraLookAt,
    isCameraTransitioning,
    transitionId,
    setIsCameraTransitioning,
    movementInput,
  } = useSupermarketStore();

  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.4, 8));
  const isDraggingRef = useRef(false);
  const previousPointerPositionRef = useRef({ x: 0, y: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const scrollVelocityRef = useRef<number>(0);

  // 1. Smooth GSAP camera transition when navigating via categories, search or minimap
  useEffect(() => {
    if (transitionId === 0) return;

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(currentLookAtRef.current);

    const targetPos = new THREE.Vector3(
      targetCameraPos.x,
      targetCameraPos.y,
      targetCameraPos.z
    );

    const targetLook = new THREE.Vector3(
      targetCameraLookAt.x,
      targetCameraLookAt.y,
      targetCameraLookAt.z
    );

    setIsCameraTransitioning(true);

    // GSAP tween for camera position
    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
    });

    // GSAP tween for lookAt vector
    gsap.to(currentLookAtRef.current, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 1.5,
      ease: 'power3.inOut',
      onComplete: () => {
        setIsCameraTransitioning(false);
        const cb = useSupermarketStore.getState().onTransitionComplete;
        if (cb) {
          useSupermarketStore.getState().setOnTransitionComplete(null);
          cb();
        }
      },
    });
  }, [
    transitionId,
    targetCameraPos,
    targetCameraLookAt,
    camera,
    setIsCameraTransitioning,
  ]);

  // 2. Keyboard walking controls (WASD / Arrow Keys / Shift)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a search bar or input field
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      keysPressedRef.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. Pointer drag navigation (Mouse & Touch)
  useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // Only left button or touch
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || isCameraTransitioning) return;

      const deltaX = e.clientX - previousPointerPositionRef.current.x;
      const deltaY = e.clientY - previousPointerPositionRef.current.y;

      previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };

      // Drag to pan lookAt target
      const sensitivity = 0.0035;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      currentLookAtRef.current.addScaledVector(right, -deltaX * sensitivity * 8);
      currentLookAtRef.current.y += deltaY * sensitivity * 6;
      currentLookAtRef.current.y = THREE.MathUtils.clamp(currentLookAtRef.current.y, 0.4, 3.5);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    // Wheel scroll for pushing/pulling trolley forward and backward
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isCameraTransitioning) return;

      // Scroll UP (deltaY < 0) = Push Forward (+)
      // Scroll DOWN (deltaY > 0) = Pull Backward (-)
      const rawDelta = e.deltaY;
      const normalizedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 60);

      scrollVelocityRef.current -= normalizedDelta * 0.06;
      scrollVelocityRef.current = THREE.MathUtils.clamp(scrollVelocityRef.current, -8, 8);
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, camera, isCameraTransitioning]);

  // 4. Per-frame game movement (Keyboard + Wheel Scroll + On-Screen Game Controls + Bounds Clamping)
  useFrame((_, delta) => {
    if (!isCameraTransitioning) {
      const keys = keysPressedRef.current;
      const isSprint = movementInput.sprint || keys['shift'];
      const baseSpeed = isSprint ? 9.5 : 5.8;
      const moveSpeed = baseSpeed * delta;
      const turnSpeed = 2.2 * delta;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

      // Steering / Turning Left & Right (Rotates lookAt target around camera Y-axis)
      const isTurnLeft = keys['arrowleft'] || movementInput.left;
      const isTurnRight = keys['arrowright'] || movementInput.right;

      if (isTurnLeft) {
        const offset = currentLookAtRef.current.clone().sub(camera.position);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnSpeed);
        currentLookAtRef.current.copy(camera.position).add(offset);
      }
      if (isTurnRight) {
        const offset = currentLookAtRef.current.clone().sub(camera.position);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -turnSpeed);
        currentLookAtRef.current.copy(camera.position).add(offset);
      }

      // Forward & Backward movement (WASD, Arrows, HUD Buttons, Joystick)
      let fwdFactor = 0;
      if (keys['w'] || keys['arrowup'] || movementInput.forward) fwdFactor += 1;
      if (keys['s'] || keys['arrowdown'] || movementInput.backward) fwdFactor -= 1;
      if (Math.abs(movementInput.joystick.y) > 0.15) {
        fwdFactor += movementInput.joystick.y;
      }

      if (fwdFactor !== 0) {
        const clampedFwd = THREE.MathUtils.clamp(fwdFactor, -1.5, 1.5);
        camera.position.addScaledVector(forward, moveSpeed * clampedFwd);
        currentLookAtRef.current.addScaledVector(forward, moveSpeed * clampedFwd);
      }

      // Mouse Wheel / Trackpad Scroll Movement with Momentum Damping
      if (Math.abs(scrollVelocityRef.current) > 0.01) {
        const scrollMove = scrollVelocityRef.current * delta * 5.5;
        camera.position.addScaledVector(forward, scrollMove);
        currentLookAtRef.current.addScaledVector(forward, scrollMove);

        // Smooth exponential friction damping
        scrollVelocityRef.current = THREE.MathUtils.damp(
          scrollVelocityRef.current,
          0,
          9,
          delta
        );
      }

      // Strafe Left & Right movement (A/D or Q/E or HUD Strafe buttons or joystick)
      let strafeFactor = 0;
      if (keys['d'] || keys['e'] || movementInput.strafeRight) strafeFactor += 1;
      if (keys['a'] || keys['q'] || movementInput.strafeLeft) strafeFactor -= 1;
      if (Math.abs(movementInput.joystick.x) > 0.15) {
        strafeFactor += movementInput.joystick.x;
      }

      if (strafeFactor !== 0) {
        const clampedStrafe = THREE.MathUtils.clamp(strafeFactor, -1.5, 1.5);
        camera.position.addScaledVector(right, moveSpeed * clampedStrafe);
        currentLookAtRef.current.addScaledVector(right, moveSpeed * clampedStrafe);
      }

      // Enforce physical bounds inside supermarket
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -16.5, 16.5);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.4, 2.8);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -24.0, 24.0);
    }

    camera.lookAt(currentLookAtRef.current);
  });

  return null;
}
