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
        vec4 albedo = texture2D(uAlbedoBuffer, vTextureCoord);
        vec3 normal = texture2D(uNormalBuffer, vTextureCoord).rgb * 2.0 - 1.0;
        
        if (albedo.a < 0.01) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Background
            return;
        }

        // 1. Basic Lighting (Lambertian)
        float diff = max(dot(normal, normalize(uSunDirection)), 0.0);
        vec3 diffuse = diff * uSunColor;
        
        // 2. Point Lights
        vec3 pointLightContrib = vec3(0.0);
        for(int i=0; i<MAX_POINT_LIGHTS; i++) {
            if (i >= uPointLightCount) break;
            
            vec2 lightPosUV = uPointLightPositions[i].xy;
            float radius = uPointLightRadii[i];
            
            // Screen space distance
            vec2 diffVec = (vTextureCoord - lightPosUV) * uResolution;
            float dist = length(diffVec);
            
            if (dist < radius) {
                float atten = 1.0 - clamp(dist / radius, 0.0, 1.0);
                atten = atten * atten; // Quadratic falloff
                
                // Normal calculation for point light
                vec3 lightDir = normalize(vec3(lightPosUV - vTextureCoord, 0.1));
                float nDotL = max(dot(normal, lightDir), 0.0);
                
                pointLightContrib += uPointLightColors[i] * uPointLightIntensities[i] * atten * (nDotL * 0.5 + 0.5);
            }
        }

        // 3. Final Color Synthesis
        vec3 finalColor = albedo.rgb * (diffuse + uAmbientColor + pointLightContrib);
        
        // 4. Volumetric Rays (Pseudo-God Rays)
        // Simple radial blur centered on uSunScreenPos
        vec2 rayDir = vTextureCoord - uSunScreenPos;
        float rayWeight = 1.0;
        vec3 rays = vec3(0.0);
        for(int i=0; i<8; i++) {
            rays += texture2D(uAlbedoBuffer, vTextureCoord - rayDir * float(i) * 0.01).rgb;
        }
        finalColor += (rays / 8.0) * uGodRayIntensity;

        if (uGodsEyeMode > 0.5) {
            float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
            vec3 ethereal = mix(vec3(lum), vec3(lum * 0.5, lum * 0.8, lum * 1.5), 0.8);
            finalColor = mix(finalColor, ethereal, 1.0);
        }

        gl_FragColor = vec4(finalColor, albedo.a);
    }
`;
