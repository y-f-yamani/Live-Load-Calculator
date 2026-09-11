import { MathUtils, Quaternion, Vector3 } from 'three';
import { normalizedRotation } from '../domain/scene';

/** Euler XYZ yaw folds beyond 90°. Use the horizontal local X axis instead. */
export function planRotationFromQuaternion(quaternion: Quaternion): number {
  const axis = new Vector3(1, 0, 0).applyQuaternion(quaternion);
  return normalizedRotation(MathUtils.radToDeg(Math.atan2(axis.z, axis.x)));
}
