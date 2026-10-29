export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ShelfConfig {
  id: string;
  side: 'left' | 'right' | 'endcap';
  tiers: number;
  width: number;
  height: number;
  depth: number;
  tierHeights: number[]; // relative Y offsets
  localOffset: Vector3D;
}

export interface AisleConfig {
  id: string;
  number: number;
  name: string;
  subtitle: string;
  categoryIds: string[];
  worldPosition: Vector3D;
  orientation: 'north-south' | 'east-west';
  length: number;
  width: number;
  color: string;
  cameraPosition: Vector3D;
  cameraTarget: Vector3D;
  signText: string;
  hasEndCap?: boolean;
}

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  isTransitioning: boolean;
}
