/**
 * WGSL compute shader sources for the Faithful GPU compute system.
 * These strings are used by the WebGPUManager to build compute pipelines.
 * In test environments where WebGPU is unavailable, the CPU fallback paths
 * replicate the same logic numerically.
 */

/** Updates entity positions from velocity: position += velocity * dt */
export const entityMovementShader = /* wgsl */ `
  @group(0) @binding(0) var<storage, read> positions: array<vec3<f32>>;
  @group(0) @binding(1) var<storage, read> velocities: array<vec3<f32>>;
  @group(0) @binding(2) var<storage, read_write> outPositions: array<vec3<f32>>;
  @group(0) @binding(3) var<uniform> params: vec4<f32>;

  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    let count = arrayLength(&positions);
    if (idx >= count) {
      return;
    }
    let dt = params.x;
    outPositions[idx] = positions[idx] + velocities[idx] * dt;
  }
`

/** Applies gravity and drag to particle physics state */
export const particlePhysicsShader = /* wgsl */ `
  struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
  }

  @group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
  @group(0) @binding(1) var<uniform> params: vec4<f32>;

  @compute @workgroup_size(64)
  fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    let count = arrayLength(&particles);
    if (idx >= count) {
      return;
    }
    let dt = params.x;
    let gravityX = params.y;
    let gravityY = params.z;
    let drag = params.w;

    var p = particles[idx];
    p.vx += gravityX * dt;
    p.vy += gravityY * dt;
    p.vx *= 1.0 - drag * dt;
    p.vy *= 1.0 - drag * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    particles[idx] = p;
  }
`

/** Computes a simple Euclidean distance-to-goal grid for pathfinding acceleration.
 *  Obstacle cells are written as -1.0. */
export const distanceFieldShader = /* wgsl */ `
  @group(0) @binding(0) var<storage, read> obstacles: array<u32>;
  @group(0) @binding(1) var<storage, read_write> distances: array<f32>;
  @group(0) @binding(2) var<uniform> dims: vec4<u32>;

  @compute @workgroup_size(16, 16)
  fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    let width = dims.x;
    let height = dims.y;
    if (x >= width || y >= height) {
      return;
    }
    let idx = y * width + x;
    if (obstacles[idx] != 0u) {
      distances[idx] = -1.0;
      return;
    }
    let dx = f32(x) - f32(dims.z);
    let dy = f32(y) - f32(dims.w);
    distances[idx] = sqrt(dx * dx + dy * dy);
  }
`
