import { entityMovementShader, particlePhysicsShader, distanceFieldShader } from './shaders'
import type { GPUComputeConfig, ComputePipeline } from '../../types'

const DEFAULT_CONFIG: GPUComputeConfig = {
  workgroupSize: 64,
  maxEntities: 65536,
  maxParticles: 65536,
  gridSize: 256,
  useGPU: true,
  timingEnabled: true,
}

function getNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now()
  }
  return Date.now()
}

/**
 * WebGPUManager manages GPU compute pipelines for the Faithful engine.
 * If WebGPU is unavailable, all operations gracefully fall back to
 * equivalent CPU implementations with performance timing.
 */
export class WebGPUManager {
  device: GPUDevice | null = null
  adapter: GPUAdapter | null = null
  fallbackMode = true
  timingEnabled = false
  timings: Record<string, { gpu?: number; cpu?: number }> = {}
  pipelines: Map<string, ComputePipeline> = new Map()

  private entityMovementGPU: GPUComputePipeline | null = null
  private particlePhysicsGPU: GPUComputePipeline | null = null
  private distanceFieldGPU: GPUComputePipeline | null = null
  private config: GPUComputeConfig

  constructor(config?: Partial<GPUComputeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.timingEnabled = this.config.timingEnabled
    this.fallbackMode = !this.config.useGPU
  }

  /**
   * Detect WebGPU support and initialize adapter + device.
   * Returns true if GPU compute is ready, false if falling back to CPU.
   */
  async initialize(): Promise<boolean> {
    if (!this.config.useGPU) {
      this.fallbackMode = true
      return false
    }
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      this.fallbackMode = true
      return false
    }
    try {
      this.adapter = await navigator.gpu.requestAdapter()
      if (!this.adapter) {
        this.fallbackMode = true
        return false
      }
      this.device = await this.adapter.requestDevice()
      if (!this.device) {
        this.fallbackMode = true
        return false
      }
      this.fallbackMode = false
      this._createPipelines()
      return true
    } catch {
      this.fallbackMode = true
      return false
    }
  }

  /** Returns true when the GPU device is active and ready. */
  isAvailable(): boolean {
    return !this.fallbackMode && this.device !== null
  }

  /** Computes the number of workgroups to dispatch for a 1D problem. */
  computeWorkgroupDispatch(count: number, workgroupSize: number): number {
    return Math.ceil(count / workgroupSize)
  }

  /** Validates that a buffer size is positive and aligned. */
  validateBufferSize(size: number, alignment = 16): boolean {
    return size > 0 && size % alignment === 0
  }

  // --------------------------------------------------------------------------
  // Entity Movement
  // --------------------------------------------------------------------------

  /**
   * Parallel entity movement update: position += velocity * dt.
   * Positions and velocities are interleaved Float32 arrays of vec3 per entity.
   */
  async updateEntityMovement(
    positions: Float32Array,
    velocities: Float32Array,
    dt: number
  ): Promise<{ result: Float32Array; timing: number }> {
    const start = getNow()
    if (!this.fallbackMode && this.device) {
      const result = await this._gpuEntityMovement(positions, velocities, dt)
      const t = getNow() - start
      if (this.timingEnabled) {
        this.timings['entityMovement'] = { gpu: t }
      }
      return { result, timing: t }
    }
    const result = this._cpuEntityMovement(positions, velocities, dt)
    const t = getNow() - start
    if (this.timingEnabled) {
      this.timings['entityMovement'] = { cpu: t }
    }
    return { result, timing: t }
  }

  // --------------------------------------------------------------------------
  // Particle Physics
  // --------------------------------------------------------------------------

  /**
   * Applies gravity and drag to a flat particle buffer.
   * Each particle is 4 floats: [x, y, vx, vy].
   */
  async updateParticlePhysics(
    particles: Float32Array,
    gravity: [number, number],
    drag: number,
    dt: number
  ): Promise<{ result: Float32Array; timing: number }> {
    const start = getNow()
    if (!this.fallbackMode && this.device) {
      const result = await this._gpuParticlePhysics(particles, gravity, drag, dt)
      const t = getNow() - start
      if (this.timingEnabled) {
        this.timings['particlePhysics'] = { gpu: t }
      }
      return { result, timing: t }
    }
    const result = this._cpuParticlePhysics(particles, gravity, drag, dt)
    const t = getNow() - start
    if (this.timingEnabled) {
      this.timings['particlePhysics'] = { cpu: t }
    }
    return { result, timing: t }
  }

  // --------------------------------------------------------------------------
  // Distance Field
  // --------------------------------------------------------------------------

  /**
   * Computes a simple distance-to-goal grid.
   * Obstacles are encoded as 1 in the Uint32Array, 0 for free cells.
   * Returns distances where obstacle cells are -1.0.
   */
  async computeDistanceField(
    width: number,
    height: number,
    obstacles: Uint32Array,
    goalX: number,
    goalY: number
  ): Promise<{ result: Float32Array; timing: number }> {
    const start = getNow()
    if (!this.fallbackMode && this.device) {
      const result = await this._gpuDistanceField(width, height, obstacles, goalX, goalY)
      const t = getNow() - start
      if (this.timingEnabled) {
        this.timings['distanceField'] = { gpu: t }
      }
      return { result, timing: t }
    }
    const result = this._cpuDistanceField(width, height, obstacles, goalX, goalY)
    const t = getNow() - start
    if (this.timingEnabled) {
      this.timings['distanceField'] = { cpu: t }
    }
    return { result, timing: t }
  }

  /** Returns a shallow copy of the current timing map. */
  getTimings(): Record<string, { gpu?: number; cpu?: number }> {
    return { ...this.timings }
  }

  /** Clears recorded timings. */
  clearTimings(): void {
    this.timings = {}
  }

  // --------------------------------------------------------------------------
  // GPU Pipeline Setup
  // --------------------------------------------------------------------------

  private _createPipelines(): void {
    if (!this.device) return

    const entityModule = this.device.createShaderModule({
      label: 'entityMovementShader',
      code: entityMovementShader,
    })
    this.entityMovementGPU = this.device.createComputePipeline({
      label: 'entityMovementPipeline',
      layout: 'auto',
      compute: { module: entityModule, entryPoint: 'main' },
    })
    this.pipelines.set('entityMovement', {
      label: 'entityMovementPipeline',
      shader: entityMovementShader,
      workgroupSize: 64,
      dispatchX: 1,
      dispatchY: 1,
      dispatchZ: 1,
    })

    const particleModule = this.device.createShaderModule({
      label: 'particlePhysicsShader',
      code: particlePhysicsShader,
    })
    this.particlePhysicsGPU = this.device.createComputePipeline({
      label: 'particlePhysicsPipeline',
      layout: 'auto',
      compute: { module: particleModule, entryPoint: 'main' },
    })
    this.pipelines.set('particlePhysics', {
      label: 'particlePhysicsPipeline',
      shader: particlePhysicsShader,
      workgroupSize: 64,
      dispatchX: 1,
      dispatchY: 1,
      dispatchZ: 1,
    })

    const distanceModule = this.device.createShaderModule({
      label: 'distanceFieldShader',
      code: distanceFieldShader,
    })
    this.distanceFieldGPU = this.device.createComputePipeline({
      label: 'distanceFieldPipeline',
      layout: 'auto',
      compute: { module: distanceModule, entryPoint: 'main' },
    })
    this.pipelines.set('distanceField', {
      label: 'distanceFieldPipeline',
      shader: distanceFieldShader,
      workgroupSize: 16,
      dispatchX: 1,
      dispatchY: 1,
      dispatchZ: 1,
    })
  }

  // --------------------------------------------------------------------------
  // GPU Implementations
  // --------------------------------------------------------------------------

  private async _gpuEntityMovement(
    positions: Float32Array,
    velocities: Float32Array,
    dt: number
  ): Promise<Float32Array> {
    if (!this.device || !this.entityMovementGPU) {
      return this._cpuEntityMovement(positions, velocities, dt)
    }
    const count = Math.floor(positions.length / 3)
    const posSize = Math.max(positions.byteLength, 16)
    const velSize = Math.max(velocities.byteLength, 16)
    const outSize = posSize

    const posBuffer = this.device.createBuffer({
      size: posSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    const velBuffer = this.device.createBuffer({
      size: velSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    const outBuffer = this.device.createBuffer({
      size: outSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })
    const uniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.device.queue.writeBuffer(posBuffer, 0, positions)
    this.device.queue.writeBuffer(velBuffer, 0, velocities)
    this.device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([dt, 0, 0, 0]))

    const bindGroup = this.device.createBindGroup({
      layout: this.entityMovementGPU.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: posBuffer } },
        { binding: 1, resource: { buffer: velBuffer } },
        { binding: 2, resource: { buffer: outBuffer } },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    })

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(this.entityMovementGPU)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(count / 64))
    pass.end()

    const staging = this.device.createBuffer({
      size: outSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    encoder.copyBufferToBuffer(outBuffer, 0, staging, 0, outSize)
    this.device.queue.submit([encoder.finish()])

    await staging.mapAsync(GPUMapMode.READ)
    const result = new Float32Array(staging.getMappedRange().slice(0) as ArrayBuffer)
    staging.unmap()
    return result
  }

  private async _gpuParticlePhysics(
    particles: Float32Array,
    gravity: [number, number],
    drag: number,
    dt: number
  ): Promise<Float32Array> {
    if (!this.device || !this.particlePhysicsGPU) {
      return this._cpuParticlePhysics(particles, gravity, drag, dt)
    }
    const count = Math.floor(particles.length / 4)
    const bufSize = Math.max(particles.byteLength, 16)

    const buffer = this.device.createBuffer({
      size: bufSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    })
    const uniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.device.queue.writeBuffer(buffer, 0, particles)
    this.device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([dt, gravity[0], gravity[1], drag]))

    const bindGroup = this.device.createBindGroup({
      layout: this.particlePhysicsGPU.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    })

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(this.particlePhysicsGPU)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(count / 64))
    pass.end()

    const staging = this.device.createBuffer({
      size: bufSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    encoder.copyBufferToBuffer(buffer, 0, staging, 0, bufSize)
    this.device.queue.submit([encoder.finish()])

    await staging.mapAsync(GPUMapMode.READ)
    const result = new Float32Array(staging.getMappedRange().slice(0) as ArrayBuffer)
    staging.unmap()
    return result
  }

  private async _gpuDistanceField(
    width: number,
    height: number,
    obstacles: Uint32Array,
    goalX: number,
    goalY: number
  ): Promise<Float32Array> {
    if (!this.device || !this.distanceFieldGPU) {
      return this._cpuDistanceField(width, height, obstacles, goalX, goalY)
    }
    const cellCount = width * height
    const obstacleSize = Math.max(obstacles.byteLength, 16)
    const outSize = Math.max(cellCount * 4, 16)

    const obstacleBuffer = this.device.createBuffer({
      size: obstacleSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    const outBuffer = this.device.createBuffer({
      size: outSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })
    const uniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.device.queue.writeBuffer(obstacleBuffer, 0, obstacles)
    this.device.queue.writeBuffer(uniformBuffer, 0, new Uint32Array([width, height, goalX, goalY]))

    const bindGroup = this.device.createBindGroup({
      layout: this.distanceFieldGPU.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: obstacleBuffer } },
        { binding: 1, resource: { buffer: outBuffer } },
        { binding: 2, resource: { buffer: uniformBuffer } },
      ],
    })

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginComputePass()
    pass.setPipeline(this.distanceFieldGPU)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(width / 16), Math.ceil(height / 16))
    pass.end()

    const staging = this.device.createBuffer({
      size: outSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
    encoder.copyBufferToBuffer(outBuffer, 0, staging, 0, outSize)
    this.device.queue.submit([encoder.finish()])

    await staging.mapAsync(GPUMapMode.READ)
    const result = new Float32Array(staging.getMappedRange().slice(0) as ArrayBuffer)
    staging.unmap()
    return result
  }

  // --------------------------------------------------------------------------
  // CPU Fallback Implementations
  // --------------------------------------------------------------------------

  private _cpuEntityMovement(
    positions: Float32Array,
    velocities: Float32Array,
    dt: number
  ): Float32Array {
    const count = Math.floor(positions.length / 3)
    const out = new Float32Array(positions.length)
    for (let i = 0; i < count; i++) {
      out[i * 3] = positions[i * 3] + velocities[i * 3] * dt
      out[i * 3 + 1] = positions[i * 3 + 1] + velocities[i * 3 + 1] * dt
      out[i * 3 + 2] = positions[i * 3 + 2] + velocities[i * 3 + 2] * dt
    }
    return out
  }

  private _cpuParticlePhysics(
    particles: Float32Array,
    gravity: [number, number],
    drag: number,
    dt: number
  ): Float32Array {
    const count = Math.floor(particles.length / 4)
    const out = new Float32Array(particles.length)
    for (let i = 0; i < count; i++) {
      const idx = i * 4
      let x = particles[idx]
      let y = particles[idx + 1]
      let vx = particles[idx + 2]
      let vy = particles[idx + 3]

      vx += gravity[0] * dt
      vy += gravity[1] * dt
      vx *= 1.0 - drag * dt
      vy *= 1.0 - drag * dt
      x += vx * dt
      y += vy * dt

      out[idx] = x
      out[idx + 1] = y
      out[idx + 2] = vx
      out[idx + 3] = vy
    }
    return out
  }

  private _cpuDistanceField(
    width: number,
    height: number,
    obstacles: Uint32Array,
    goalX: number,
    goalY: number
  ): Float32Array {
    const out = new Float32Array(width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (obstacles[idx] !== 0) {
          out[idx] = -1.0
        } else {
          const dx = x - goalX
          const dy = y - goalY
          out[idx] = Math.sqrt(dx * dx + dy * dy)
        }
      }
    }
    return out
  }
}
