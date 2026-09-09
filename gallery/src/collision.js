export const EYE_HEIGHT = 1.65;
export const PLAYER_RADIUS = .25;
export function intersects(x, z, obstacle, radius=PLAYER_RADIUS) {
  const nearX = Math.max(obstacle.minX, Math.min(x, obstacle.maxX));
  const nearZ = Math.max(obstacle.minZ, Math.min(z, obstacle.maxZ));
  return (x-nearX)**2 + (z-nearZ)**2 < radius*radius;
}
export function canOccupy(x,z,obstacles) {
  return Math.abs(x) <= 11.22 && Math.abs(z) <= 11.22 && !obstacles.some(o=>intersects(x,z,o));
}
// Substeps prevent tunnelling after a slow frame; axis separation permits sliding along walls.
export function moveWithCollision(position, dx, dz, obstacles) {
  const steps = Math.max(1,Math.ceil(Math.hypot(dx,dz)/.1));
  for(let i=0;i<steps;i++) {
    if(canOccupy(position.x+dx/steps,position.z,obstacles))position.x+=dx/steps;
    if(canOccupy(position.x,position.z+dz/steps,obstacles))position.z+=dz/steps;
  }
  position.y=EYE_HEIGHT;
  return position;
}
