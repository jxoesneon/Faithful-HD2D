import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebGPUManager } from '../webgpu'
import { entityMovementShader, particlePhysicsShader, distanceFieldShader } from '../shaders'

describe('WebGPUManager', () => {
  let manager: WebGPUManager

  beforeEach(() => {
    manager = new WebGPUManager({ useGPU: false, timingEnabled: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // WebGPU Detection
  // --------------------------------------------------------------------------

  it('detects missing WebGPU and falls back to CPU', async () => {
    vi.stubGlobal('navigator', { gpu: undefined })
    const m = new WebGPUManager({ useGPU: true, timingEnabled: false })
    const result = await m.initialize()
    expect(result).toBe(false)
    expect(m.fallbackMode).toBe(true)
    expect(m.isAvailable()).toBe(false)
  })

  it('detects present WebGPU and attempts initialization', async () => {
    const mockDevice = {
      createShaderModule: vi.fn(() => ({})),
      createComputePipeline: vi.fn(() => ({ getBindGroupLayout: vi.fn(() => ({}) as any) })),
      createBuffer: vi.fn(() => ({})),
      createBindGroup: vi.fn(() => ({})),
      createCommandEncoder: vi.fn(() => ({
        beginComputePass: vi.fn(() => ({
          setPipeline: vi.fn(),
          setBindGroup: vi.fn(),
          dispatchWorkgroups: vi.fn(),
          end: vi.fn(),
        })),
        copyBufferToBuffer: vi.fn(),
        finish: vi.fn(() => ({})),
      })),
      queue: {
        writeBuffer: vi.fn(),
        submit: vi.fn(),
      },
    }
    const mockAdapter = {
      requestDevice: vi.fn().mockResolvedValue(mockDevice),
    }
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      },
    })
    const m = new WebGPUManager({ useGPU: true, timingEnabled: false })
    const result = await m.initialize()
    expect(result).toBe(true)
    expect(m.fallbackMode).toBe(false)
    expect(m.isAvailable()).toBe(true)
    expect(mockAdapter.requestDevice).toHaveBeenCalled()
  })

  it('falls back when adapter request returns null', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(null),
      },
    })
    const m = new WebGPUManager({ useGPU: true, timingEnabled: false })
    const result = await m.initialize()
    expect(result).toBe(false)
    expect(m.fallbackMode).toBe(true)
  })

  it('falls back when device request returns null', async () => {
    const mockAdapter = {
      requestDevice: vi.fn().mockResolvedValue(null),
    }
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      },
    })
    const m = new WebGPUManager({ useGPU: true, timingEnabled: false })
    const result = await m.initialize()
    expect(result).toBe(false)
    expect(m.fallbackMode).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Entity Movement (CPU Fallback)
  // --------------------------------------------------------------------------

  it('updates entity positions on CPU fallback', async () => {
    const positions = new Float32Array([
      0, 0, 0,
      1, 1, 1,
      5, 5, 5,
    ])
    const velocities = new Float32Array([
      1, 0, 0,
      0, 2, 0,
      0, 0, 3,
    ])
    const { result } = await manager.updateEntityMovement(positions, velocities, 1.0)
    expect(result[0]).toBeCloseTo(1)
    expect(result[1]).toBeCloseTo(0)
    expect(result[2]).toBeCloseTo(0)
    expect(result[3]).toBeCloseTo(1)
    expect(result[4]).toBeCloseTo(3)
    expect(result[5]).toBeCloseTo(1)
    expect(result[6]).toBeCloseTo(5)
    expect(result[7]).toBeCloseTo(5)
    expect(result[8]).toBeCloseTo(8)
  })

  it('applies dt scaling to entity movement', async () => {
    const positions = new Float32Array([0, 0, 0])
    const velocities = new Float32Array([2, 4, 6])
    const { result } = await manager.updateEntityMovement(positions, velocities, 0.5)
    expect(result[0]).toBeCloseTo(1)
    expect(result[1]).toBeCloseTo(2)
    expect(result[2]).toBeCloseTo(3)
  })

  // --------------------------------------------------------------------------
  // Particle Physics (CPU Fallback)
  // --------------------------------------------------------------------------

  it('applies gravity to particles on CPU fallback', async () => {
    // Particle: [x=0, y=0, vx=0, vy=0]
    const particles = new Float32Array([0, 0, 0, 0])
    const gravity: [number, number] = [0, 10]
    const drag = 0
    const dt = 1.0
    const { result } = await manager.updateParticlePhysics(particles, gravity, drag, dt)
    expect(result[0]).toBeCloseTo(0)   // x unchanged (vx was 0)
    expect(result[1]).toBeCloseTo(10)  // vy = 10, y = 0 + 10*1 = 10
    expect(result[2]).toBeCloseTo(0)   // vx unchanged
    expect(result[3]).toBeCloseTo(10)  // vy = 10
  })

  it('applies drag to particles on CPU fallback', async () => {
    // Particle: [x=0, y=0, vx=10, vy=0]
    const particles = new Float32Array([0, 0, 10, 0])
    const gravity: [number, number] = [0, 0]
    const drag = 0.1
    const dt = 1.0
    const { result } = await manager.updateParticlePhysics(particles, gravity, drag, dt)
    expect(result[2]).toBeCloseTo(9)   // vx = 10 * (1 - 0.1)
    expect(result[3]).toBeCloseTo(0)   // vy unchanged
  })

  it('combines gravity and drag correctly', async () => {
    const particles = new Float32Array([0, 0, 10, 10])
    const gravity: [number, number] = [5, -5]
    const drag = 0.2
    const dt = 0.5
    const { result } = await manager.updateParticlePhysics(particles, gravity, drag, dt)
    // vx = (10 + 5*0.5) * (1 - 0.2*0.5) = 12.5 * 0.9 = 11.25
    // vy = (10 + -5*0.5) * (1 - 0.2*0.5) = 7.5 * 0.9 = 6.75
    expect(result[2]).toBeCloseTo(11.25)
    expect(result[3]).toBeCloseTo(6.75)
    // x = 0 + 11.25 * 0.5 = 5.625
    // y = 0 + 6.75 * 0.5 = 3.375
    expect(result[0]).toBeCloseTo(5.625)
    expect(result[1]).toBeCloseTo(3.375)
  })

  it('handles multiple particles', async () => {
    const particles = new Float32Array([
      0, 0, 1, 0,
      1, 1, 0, 1,
    ])
    const gravity: [number, number] = [0, 0]
    const drag = 0
    const dt = 1.0
    const { result } = await manager.updateParticlePhysics(particles, gravity, drag, dt)
    expect(result[0]).toBeCloseTo(1)
    expect(result[1]).toBeCloseTo(0)
    expect(result[2]).toBeCloseTo(1)
    expect(result[3]).toBeCloseTo(0)
    expect(result[4]).toBeCloseTo(1)
    expect(result[5]).toBeCloseTo(2)
    expect(result[6]).toBeCloseTo(0)
    expect(result[7]).toBeCloseTo(1)
  })

  // --------------------------------------------------------------------------
  // Distance Field (CPU Fallback)
  // --------------------------------------------------------------------------

  it('computes Euclidean distance field on CPU fallback', async () => {
    const width = 3
    const height = 3
    const obstacles = new Uint32Array(width * height).fill(0)
    const { result } = await manager.computeDistanceField(width, height, obstacles, 1, 1)
    // Center (1,1) should be 0
    expect(result[4]).toBeCloseTo(0)
    // Corners should be sqrt(2)
    expect(result[0]).toBeCloseTo(Math.sqrt(2))
    expect(result[2]).toBeCloseTo(Math.sqrt(2))
    expect(result[6]).toBeCloseTo(Math.sqrt(2))
    expect(result[8]).toBeCloseTo(Math.sqrt(2))
    // Edges should be 1
    expect(result[1]).toBeCloseTo(1)
    expect(result[3]).toBeCloseTo(1)
    expect(result[5]).toBeCloseTo(1)
    expect(result[7]).toBeCloseTo(1)
  })

  it('marks obstacles with -1 in distance field', async () => {
    const width = 3
    const height = 3
    const obstacles = new Uint32Array(width * height).fill(0)
    obstacles[4] = 1 // center is obstacle
    const { result } = await manager.computeDistanceField(width, height, obstacles, 1, 1)
    expect(result[4]).toBeCloseTo(-1)
    // Other cells still compute normal distances
    expect(result[0]).toBeCloseTo(Math.sqrt(2))
  })

  it('handles different goal positions', async () => {
    const width = 3
    const height = 3
    const obstacles = new Uint32Array(width * height).fill(0)
    const { result } = await manager.computeDistanceField(width, height, obstacles, 0, 0)
    // (0,0) should be 0
    expect(result[0]).toBeCloseTo(0)
    // (2,2) should be sqrt(8)
    expect(result[8]).toBeCloseTo(Math.sqrt(8))
  })

  it('handles non-square grids', async () => {
    const width = 2
    const height = 4
    const obstacles = new Uint32Array(width * height).fill(0)
    const { result } = await manager.computeDistanceField(width, height, obstacles, 0, 0)
    expect(result[0]).toBeCloseTo(0)
    expect(result[1]).toBeCloseTo(1)
    expect(result[2]).toBeCloseTo(1)
    expect(result[3]).toBeCloseTo(Math.sqrt(2))
  })

  // --------------------------------------------------------------------------
  // Workgroup Dispatch
  // --------------------------------------------------------------------------

  it('calculates 1D workgroup dispatch correctly', () => {
    expect(manager.computeWorkgroupDispatch(100, 64)).toBe(2)
    expect(manager.computeWorkgroupDispatch(64, 64)).toBe(1)
    expect(manager.computeWorkgroupDispatch(1, 64)).toBe(1)
    expect(manager.computeWorkgroupDispatch(0, 64)).toBe(0)
    expect(manager.computeWorkgroupDispatch(128, 64)).toBe(2)
    expect(manager.computeWorkgroupDispatch(129, 64)).toBe(3)
  })

  it('validates buffer sizes', () => {
    expect(manager.validateBufferSize(16)).toBe(true)
    expect(manager.validateBufferSize(32)).toBe(true)
    expect(manager.validateBufferSize(0)).toBe(false)
    expect(manager.validateBufferSize(15)).toBe(false)
    expect(manager.validateBufferSize(64, 32)).toBe(true)
    expect(manager.validateBufferSize(30, 16)).toBe(false)
  })

  // --------------------------------------------------------------------------
  // Timing
  // --------------------------------------------------------------------------

  it('records CPU timing when timing is enabled', async () => {
    const timedManager = new WebGPUManager({ useGPU: false, timingEnabled: true })
    const positions = new Float32Array([0, 0, 0])
    const velocities = new Float32Array([1, 0, 0])
    await timedManager.updateEntityMovement(positions, velocities, 1.0)
    const timings = timedManager.getTimings()
    expect(timings['entityMovement']).toBeDefined()
    expect(typeof timings['entityMovement'].cpu).toBe('number')
    expect(timings['entityMovement'].gpu).toBeUndefined()
  })

  it('clears timings', async () => {
    const timedManager = new WebGPUManager({ useGPU: false, timingEnabled: true })
    const positions = new Float32Array([0, 0, 0])
    const velocities = new Float32Array([1, 0, 0])
    await timedManager.updateEntityMovement(positions, velocities, 1.0)
    expect(Object.keys(timedManager.getTimings()).length).toBeGreaterThan(0)
    timedManager.clearTimings()
    expect(Object.keys(timedManager.getTimings()).length).toBe(0)
  })

  // --------------------------------------------------------------------------
  // Shader Exports
  // --------------------------------------------------------------------------

  it('exports WGSL shader strings', () => {
    expect(entityMovementShader).toContain('@compute')
    expect(particlePhysicsShader).toContain('@compute')
    expect(distanceFieldShader).toContain('@compute')
    expect(entityMovementShader).toContain('workgroup_size(64)')
    expect(particlePhysicsShader).toContain('workgroup_size(64)')
    expect(distanceFieldShader).toContain('workgroup_size(16, 16)')
  })

  // --------------------------------------------------------------------------
  // Pipeline Metadata
  // --------------------------------------------------------------------------

  it('stores pipeline metadata when GPU is initialized', async () => {
    const mockDevice = {
      createShaderModule: vi.fn(() => ({})),
      createComputePipeline: vi.fn(() => ({ getBindGroupLayout: vi.fn(() => ({}) as any) })),
      createBuffer: vi.fn(() => ({})),
      createBindGroup: vi.fn(() => ({})),
      createCommandEncoder: vi.fn(() => ({
        beginComputePass: vi.fn(() => ({
          setPipeline: vi.fn(),
          setBindGroup: vi.fn(),
          dispatchWorkgroups: vi.fn(),
          end: vi.fn(),
        })),
        copyBufferToBuffer: vi.fn(),
        finish: vi.fn(() => ({})),
      })),
      queue: {
        writeBuffer: vi.fn(),
        submit: vi.fn(),
      },
    }
    const mockAdapter = {
      requestDevice: vi.fn().mockResolvedValue(mockDevice),
    }
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
      },
    })
    const m = new WebGPUManager({ useGPU: true, timingEnabled: false })
    await m.initialize()
    expect(m.pipelines.has('entityMovement')).toBe(true)
    expect(m.pipelines.has('particlePhysics')).toBe(true)
    expect(m.pipelines.has('distanceField')).toBe(true)
    const entityPipeline = m.pipelines.get('entityMovement')!
    expect(entityPipeline.workgroupSize).toBe(64)
    const distPipeline = m.pipelines.get('distanceField')!
    expect(distPipeline.workgroupSize).toBe(16)
  })
})
