/**
 * DebugNodes.js
 *
 * Debug and Visualization Node Definitions
 * Contains BRDF Visualizer and other educational/debug nodes
 */

export const DebugNodes = {
  /**
   * BRDF Visualizer Node
   * Educational node showing the components of physically-based shading:
   * - D: Normal Distribution Function (GGX/Trowbridge-Reitz)
   * - F: Fresnel (Schlick approximation)
   * - G: Geometry Function (Smith GGX)
   */
  BRDFVisualizer: {
    title: "BRDF Visualizer",
    type: "material-expression",
    category: "Debug",
    icon: "📊",
    headerColor: "#7B1FA2",
    description:
      "Visualizes BRDF components (D, F, G) for educational purposes. Shows how roughness and metallic affect each term.",
    pins: [
      // Inputs
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Surface roughness (0=mirror, 1=diffuse)",
      },
      {
        id: "metallic",
        name: "Metallic",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip: "Metalness (0=dielectric, 1=metal)",
      },
      {
        id: "n_dot_h",
        name: "N·H",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Dot product of Normal and Half-vector",
      },
      {
        id: "n_dot_v",
        name: "N·V",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Dot product of Normal and View direction",
      },
      {
        id: "n_dot_l",
        name: "N·L",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Dot product of Normal and Light direction",
      },
      // Outputs
      {
        id: "d_term",
        name: "D (GGX)",
        type: "float",
        dir: "out",
        tooltip: "Normal Distribution Function - microfacet alignment probability",
      },
      {
        id: "f_term",
        name: "F (Fresnel)",
        type: "float3",
        dir: "out",
        tooltip: "Fresnel reflectance at viewing angle",
      },
      {
        id: "g_term",
        name: "G (Smith)",
        type: "float",
        dir: "out",
        tooltip: "Geometry function - shadowing and masking",
      },
      {
        id: "specular",
        name: "Specular",
        type: "float3",
        dir: "out",
        tooltip: "Combined Cook-Torrance specular: (D * F * G) / (4 * N·V * N·L)",
      },
    ],
    properties: {
      F0_Dielectric: 0.04,
      ShowVisualization: true,
    },
    shaderCode: `
            // GGX/Trowbridge-Reitz Normal Distribution Function (D term)
            // D = α² / (π * ((N·H)² * (α² - 1) + 1)²)
            float alpha = {roughness} * {roughness};
            float alpha2 = alpha * alpha;
            float NdotH2 = {n_dot_h} * {n_dot_h};
            float denom = NdotH2 * (alpha2 - 1.0) + 1.0;
            float {OUTPUT}_d_term = alpha2 / (3.14159 * denom * denom);
            
            // Schlick Fresnel Approximation (F term)
            // F = F0 + (1 - F0) * (1 - N·V)^5
            float3 F0 = lerp(float3({F0_Dielectric}), float3(1.0), {metallic});
            float oneMinusNdotV = 1.0 - {n_dot_v};
            float oneMinusNdotV5 = oneMinusNdotV * oneMinusNdotV * oneMinusNdotV * oneMinusNdotV * oneMinusNdotV;
            float3 {OUTPUT}_f_term = F0 + (1.0 - F0) * oneMinusNdotV5;
            
            // Smith GGX Geometry Function (G term)
            // G = G1(N·V) * G1(N·L)
            // G1(x) = 2*x / (x + sqrt(α² + (1 - α²) * x²))
            float k = alpha / 2.0;
            float G1_V = {n_dot_v} / ({n_dot_v} * (1.0 - k) + k);
            float G1_L = {n_dot_l} / ({n_dot_l} * (1.0 - k) + k);
            float {OUTPUT}_g_term = G1_V * G1_L;
            
            // Combined Cook-Torrance Specular BRDF
            // Specular = (D * F * G) / (4 * N·V * N·L)
            float denominator = 4.0 * {n_dot_v} * {n_dot_l} + 0.0001;
            float3 {OUTPUT}_specular = ({OUTPUT}_d_term * {OUTPUT}_f_term * {OUTPUT}_g_term) / denominator;
        `,
  },

  /**
   * Fresnel Debug - Outputs Fresnel term at different viewing angles
   */
  FresnelDebug: {
    title: "Fresnel Debug",
    type: "material-expression",
    category: "Debug",
    icon: "F",
    headerColor: "#7B1FA2",
    description: "Visualizes Fresnel reflectance across viewing angles. Connect to Emissive to see effect.",
    pins: [
      {
        id: "f0",
        name: "F0",
        type: "float3",
        dir: "in",
        defaultValue: [0.04, 0.04, 0.04],
        tooltip: "Base reflectance at 0° (perpendicular view)",
      },
      {
        id: "n_dot_v",
        name: "N·V",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Viewing angle cosine (1=perpendicular, 0=grazing)",
      },
      {
        id: "out",
        name: "Fresnel",
        type: "float3",
        dir: "out",
      },
    ],
    shaderCode: `
            // Schlick Fresnel: F = F0 + (1 - F0) * (1 - N·V)^5
            float oneMinusNdotV = saturate(1.0 - {n_dot_v});
            float fresnel5 = oneMinusNdotV * oneMinusNdotV * oneMinusNdotV * oneMinusNdotV * oneMinusNdotV;
            float3 {OUTPUT} = {f0} + (1.0 - {f0}) * fresnel5;
        `,
  },

  /**
   * GGX Distribution Debug - Shows microfacet distribution
   */
  GGXDistributionDebug: {
    title: "GGX Distribution",
    type: "material-expression",
    category: "Debug",
    icon: "D",
    headerColor: "#7B1FA2",
    description: "Visualizes the GGX normal distribution function. High values = more aligned microfacets.",
    pins: [
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      {
        id: "n_dot_h",
        name: "N·H",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "Cosine of angle between Normal and Half-vector",
      },
      {
        id: "out",
        name: "D",
        type: "float",
        dir: "out",
      },
    ],
    shaderCode: `
            // GGX/Trowbridge-Reitz: D = α² / (π * ((N·H)² * (α² - 1) + 1)²)
            float alpha = {roughness} * {roughness};
            float alpha2 = alpha * alpha;
            float NdotH2 = {n_dot_h} * {n_dot_h};
            float d = NdotH2 * (alpha2 - 1.0) + 1.0;
            float {OUTPUT} = alpha2 / (3.14159 * d * d);
        `,
  },

  /**
   * Smith Geometry Debug - Shows shadowing/masking function
   */
  SmithGeometryDebug: {
    title: "Smith Geometry",
    type: "material-expression",
    category: "Debug",
    icon: "G",
    headerColor: "#7B1FA2",
    description: "Visualizes the Smith GGX geometry function (shadowing and masking).",
    pins: [
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
      },
      {
        id: "n_dot_v",
        name: "N·V",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      {
        id: "n_dot_l",
        name: "N·L",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      {
        id: "out",
        name: "G",
        type: "float",
        dir: "out",
      },
    ],
    shaderCode: `
            // Smith GGX: G = G1(V) * G1(L), where G1(x) = x / (x * (1 - k) + k)
            float alpha = {roughness} * {roughness};
            float k = alpha / 2.0;
            float G1_V = {n_dot_v} / ({n_dot_v} * (1.0 - k) + k);
            float G1_L = {n_dot_l} / ({n_dot_l} * (1.0 - k) + k);
            float {OUTPUT} = G1_V * G1_L;
        `,
  },

  /**
   * Split-Sum Approximation Visualizer
   * Educational node demonstrating how UE5 approximates Image-Based Lighting.
   * 
   * The Split-Sum approximation divides the rendering equation integral into two parts:
   * 1. Pre-filtered Environment Map (LD term) - Roughness-dependent blurred environment
   * 2. Environment BRDF (DFG term) - Pre-computed Fresnel scale/bias lookup
   * 
   * IBL ≈ LD(R, roughness) × (F0 × DFG.r + DFG.g)
   */
  SplitSumVisualizer: {
    title: "Split-Sum Demo",
    type: "material-expression",
    category: "Debug",
    icon: "☀️",
    headerColor: "#FF6F00",
    description:
      "Educational visualization of the Split-Sum IBL approximation. Shows how environment lighting is decomposed into:\n• Pre-filtered Environment (LD) - blurred based on roughness\n• DFG LUT - Fresnel scale/bias lookup based on N·V and roughness\n• Final IBL = LD × (F0 × DFG.r + DFG.g)",
    pins: [
      // Inputs
      {
        id: "roughness",
        name: "Roughness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Material roughness controls mip level selection for LD",
      },
      {
        id: "metallic",
        name: "Metallic",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
        tooltip: "Affects F0 calculation (dielectric vs metal)",
      },
      {
        id: "base_color",
        name: "Base Color",
        type: "float3",
        dir: "in",
        defaultValue: [0.8, 0.8, 0.8],
        tooltip: "Albedo - used to derive F0 for metals",
      },
      {
        id: "n_dot_v",
        name: "N·V",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
        tooltip: "View angle cosine (1=perpendicular, 0=grazing)",
      },
      {
        id: "env_color",
        name: "Environment",
        type: "float3",
        dir: "in",
        defaultValue: [0.3, 0.35, 0.4],
        tooltip: "Sample from environment cubemap (pre-filtered LD)",
      },
      // Outputs
      {
        id: "f0",
        name: "F0",
        type: "float3",
        dir: "out",
        tooltip: "Base reflectance at perpendicular view angle",
      },
      {
        id: "dfg_scale",
        name: "DFG Scale",
        type: "float",
        dir: "out",
        tooltip: "DFG.r term - multiplies F0",
      },
      {
        id: "dfg_bias",
        name: "DFG Bias",
        type: "float",
        dir: "out",
        tooltip: "DFG.g term - added after F0 multiplication",
      },
      {
        id: "ld_term",
        name: "LD (Prefiltered)",
        type: "float3",
        dir: "out",
        tooltip: "Pre-filtered environment term (roughness-blurred cubemap)",
      },
      {
        id: "ibl_specular",
        name: "IBL Specular",
        type: "float3",
        dir: "out",
        tooltip: "Final split-sum result: LD × (F0 × DFG.r + DFG.g)",
      },
    ],
    properties: {
      F0_Dielectric: 0.04,
      ShowFormula: true,
    },
    shaderCode: `
            // =====================================================
            // SPLIT-SUM IBL APPROXIMATION (Epic Games / UE4-5)
            // =====================================================
            // The rendering equation for IBL is expensive to solve.
            // Split-Sum approximates it by separating into two parts:
            //
            // ∫ Li(l) × f(v,l) × (n·l) dl ≈ LD(r,roughness) × DFG(n·v, roughness)
            //
            // where:
            //   LD  = Pre-filtered environment map (roughness = mip level)
            //   DFG = 2D lookup: x=n·v, y=roughness → (scale, bias)
            // =====================================================

            // Step 1: Calculate F0 (base reflectance)
            // Dielectrics: F0 ≈ 0.04 (index of refraction ~1.5)
            // Metals: F0 = baseColor (albedo becomes specular color)
            float3 {OUTPUT}_f0 = lerp(float3({F0_Dielectric}), {base_color}, {metallic});

            // Step 2: Approximate DFG LUT
            // This is normally a pre-computed 2D texture but we approximate analytically
            // Based on the Lazarov approximation from "Getting More Physical in COD"
            float ndotv = saturate({n_dot_v});
            float a = {roughness};

            // DFG.r (scale factor for F0)
            // At grazing angles: high scale, At perpendicular: depends on roughness
            float4 c0 = float4(-1.0, -0.0275, -0.572, 0.022);
            float4 c1 = float4(1.0, 0.0425, 1.04, -0.04);
            float4 r = a * c0 + c1;
            float a004 = min(r.x * r.x, exp2(-9.28 * ndotv)) * r.x + r.y;
            float {OUTPUT}_dfg_scale = -1.04 * a004 + r.z;
            
            // DFG.g (bias term added)
            float {OUTPUT}_dfg_bias = a004;

            // Step 3: LD term (Pre-filtered Environment)
            // In real-time, this comes from a pre-convolved cubemap
            // Higher roughness = sample from higher mip level (more blurred)
            float3 {OUTPUT}_ld_term = {env_color};

            // Step 4: Final Split-Sum IBL Specular
            // IBL = LD × (F0 × DFG.r + DFG.g)
            float3 {OUTPUT}_ibl_specular = {OUTPUT}_ld_term * ({OUTPUT}_f0 * {OUTPUT}_dfg_scale + {OUTPUT}_dfg_bias);
        `,
  },
};
