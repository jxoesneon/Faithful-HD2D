// --- Sprite Vertex Shader (Phase 1, Step 1) ---
export const spriteVertexShader = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;
    uniform mat3 uTextureMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
    }
`;

// --- G-Buffer Sprite Fragment Shader ---
// Outputs Albedo and Normal into separate channels or handles multi-pass
export const spriteFragmentShader = `
    precision highp float;

    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;
    uniform sampler2D uNormalMap;
    uniform vec4 uColor;
    uniform float uHasNormalMap;

    void main(void)
    {
        vec4 albedo = texture2D(uSampler, vTextureCoord) * uColor;
        if (albedo.a < 0.1) discard;

        // Pack normal into RGB (0-1 range)
        vec3 normal = vec3(0.5, 0.5, 1.0); 
        if (uHasNormalMap > 0.5) {
            normal = texture2D(uNormalMap, vTextureCoord).rgb;
        }

        // We output Albedo here. The Normal data will be handled via a separate pass
        // or a MRT layout if WebGL 2.0 is fully leveraged.
        gl_FragColor = albedo;
    }
`;

// --- Fullscreen Quad Vertex Shader for Deferred Lighting ---
export const lightingVertexShader = `
    attribute vec2 aPosition;
    attribute vec2 aUV;

    uniform mat3 projectionMatrix;
    uniform mat3 translationMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aUV;
    }
`;

// --- Deferred Lighting & Post-Processing Pass Shader ---
export const lightingFragmentShader = `
    precision highp float;

    varying vec2 vTextureCoord;

    uniform sampler2D uAlbedoBuffer;
    uniform sampler2D uNormalBuffer;
    
    // Light Data
    uniform vec3 uSunDirection;
    uniform vec3 uSunColor;
    uniform vec3 uAmbientColor;
    
    // Dynamic Point Lights
    #define MAX_POINT_LIGHTS 16
    uniform int uPointLightCount;
    uniform vec3 uPointLightPositions[MAX_POINT_LIGHTS];
    uniform vec3 uPointLightColors[MAX_POINT_LIGHTS];
    uniform float uPointLightRadii[MAX_POINT_LIGHTS];
    uniform float uPointLightIntensities[MAX_POINT_LIGHTS];

    uniform vec2 uResolution;
    
    // VFX Parameters
    uniform float uBloomIntensity;
    uniform float uGodRayIntensity;
    uniform vec2 uSunScreenPos; // Screen space sun position for God Rays
    uniform float uGodsEyeMode;

    void main(void)
    {
        // Sample albedo from G-buffer
        vec4 albedo = texture2D(uAlbedoBuffer, vTextureCoord);

        // Sample packed normal (0..1) and decode to (-1..1)
        vec3 normalRaw = texture2D(uNormalBuffer, vTextureCoord).rgb;
        vec3 normal = normalize(normalRaw * 2.0 - 1.0);

        // --- Directional Sun Lighting ---
        vec3 sunDir = normalize(uSunDirection);
        float nDotL = max(dot(normal, sunDir), 0.0);
        vec3 sunContrib = uSunColor * nDotL;

        // --- Ambient ---
        vec3 ambient = uAmbientColor;

        // --- Point Lights ---
        vec3 pointContrib = vec3(0.0);
        vec2 fragScreenUV = vTextureCoord; // Already in 0..1 screen space
        for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
            if (i >= uPointLightCount) break;
            vec2 lightUV = uPointLightPositions[i].xy;
            float radius = uPointLightRadii[i];
            float intensity = uPointLightIntensities[i];
            vec3 lightColor = uPointLightColors[i];

            float dist = length(fragScreenUV - lightUV);
            if (radius > 0.0 && dist < radius) {
                float atten = 1.0 - (dist / radius);
                atten = atten * atten; // Quadratic falloff
                pointContrib += lightColor * intensity * atten;
            }
        }

        // --- God Ray Volumetric Scattering ---
        float godRay = 0.0;
        if (uGodRayIntensity > 0.0) {
            vec2 dir = vTextureCoord - uSunScreenPos;
            float numSamples = 16.0;
            vec2 delta = dir / numSamples;
            vec2 samplePos = vTextureCoord;
            float decay = 0.92;
            float weight = 0.01;
            float accum = 0.0;
            for (float s = 0.0; s < 16.0; s++) {
                samplePos -= delta;
                vec4 sampleColor = texture2D(uAlbedoBuffer, clamp(samplePos, 0.0, 1.0));
                float brightness = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
                accum += brightness * weight;
                weight *= decay;
            }
            godRay = accum * uGodRayIntensity;
        }

        // --- Combine Lighting ---
        vec3 lighting = ambient + sunContrib + pointContrib;
        vec3 color = albedo.rgb * lighting;

        // Add god rays as additive light scatter
        color += vec3(godRay) * uSunColor;

        // --- Bloom (simple threshold glow) ---
        if (uBloomIntensity > 0.0) {
            float brightness = dot(color, vec3(0.299, 0.587, 0.114));
            if (brightness > 0.85) {
                color += (color - vec3(0.85)) * uBloomIntensity * 2.0;
            }
        }

        // --- God's Eye Mode: Desaturate world ---
        if (uGodsEyeMode > 0.5) {
            float grey = dot(color, vec3(0.299, 0.587, 0.114));
            color = mix(color, vec3(grey), 0.6);
            // Add a subtle teal-green tint for strategic clarity
            color = mix(color, vec3(0.2, 0.45, 0.4), 0.12);
        }

        gl_FragColor = vec4(color, albedo.a);
    }
`;
