/**
 * Utility Node Definitions
 * Contains Fresnel, BumpOffset, Time, CameraVector, Noise, SphereMask, etc.
 */

export const UtilityNodes = {
  Fresnel: {
    title: "Fresnel",
    type: "material-expression",
    category: "Utility",
    icon: "F",
    hotkey: "F",
    pins: [
      { id: "exp_in", name: "ExponentIn", type: "float", dir: "in" },
      {
        id: "base_reflect",
        name: "BaseReflect",
        type: "float",
        dir: "in",
        defaultValue: 0.04,
      },
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      Exponent: 5.0,
      BaseReflectFraction: 0.04,
    },
    shaderCode: `
            float3 normal_vec = length({normal}) > 0 ? {normal} : PixelNormalWS;
            float exp_val = {exp_in} != 0.0 ? {exp_in} : {Exponent};
            float {OUTPUT} = {base_reflect} + (1.0 - {base_reflect}) * pow(1.0 - saturate(dot(normal_vec, CameraVectorWS)), exp_val);
        `,
  },

  BumpOffset: {
    title: "BumpOffset",
    type: "material-expression",
    category: "Utility",
    icon: "B",
    hotkey: "B",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "height", name: "Height", type: "float", dir: "in" },
      { id: "height_ratio", name: "HeightRatio", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      HeightRatioInput: 0.05,
      ReferencePlane: 0.5,
    },
    shaderCode: `
            float2 uv_in = {coordinate};
            float h = {height} - {ReferencePlane};
            float ratio = {height_ratio} != 0.0 ? {height_ratio} : {HeightRatioInput};
            float3 viewDir = normalize(CameraVectorWS);
            float2 {OUTPUT} = uv_in + (viewDir.xy / viewDir.z) * h * ratio;
        `,
  },

  Time: {
    title: "Time",
    type: "material-expression",
    category: "Utility",
    icon: "⏱",
    pins: [{ id: "out", name: "", type: "float", dir: "out" }],
    shaderCode: `float {OUTPUT} = Time;`,
  },

  CameraVector: {
    title: "CameraVector",
    type: "material-expression",
    category: "Utility",
    icon: "📷",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = CameraVectorWS;`,
  },

  PixelNormalWS: {
    title: "PixelNormalWS",
    type: "material-expression",
    category: "Utility",
    icon: "N",
    pins: [{ id: "out", name: "", type: "float3", dir: "out" }],
    shaderCode: `float3 {OUTPUT} = PixelNormalWS;`,
  },

  Noise: {
    title: "Noise",
    type: "material-expression",
    category: "Utility",
    icon: "◌",
    pins: [
      { id: "position", name: "Position", type: "float3", dir: "in" },
      { id: "scale", name: "FilterWidth", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      Scale: 1.0,
      Quality: 1,
      Function: "Simplex",
    },
    shaderCode: `float {OUTPUT} = PerlinNoise3D({position} * {Scale});`,
  },

  FlattenNormal: {
    title: "FlattenNormal",
    type: "material-expression",
    category: "Utility",
    icon: "N",
    description: "Flattens a normal towards (0,0,1) based on a flatness value",
    pins: [
      { id: "normal", name: "Normal", type: "float3", dir: "in" },
      { id: "flatness", name: "Flatness", type: "float", dir: "in", defaultValue: 0.5 },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = lerp({normal}, float3(0, 0, 1), {flatness});`,
  },

  SphereMask: {
    title: "SphereMask",
    type: "material-expression",
    category: "Utility",
    icon: "◯",
    description:
      "Creates a spherical falloff mask. Useful for local effects, interaction highlights, and atmospheric effects.",
    pins: [
      { id: "a", name: "A", type: "float3", dir: "in", tooltip: "First position (usually WorldPosition)" },
      { id: "b", name: "B", type: "float3", dir: "in", tooltip: "Sphere center position" },
      {
        id: "radius",
        name: "Radius",
        type: "float",
        dir: "in",
        defaultValue: 100.0,
        tooltip: "Sphere radius in world units",
      },
      {
        id: "hardness",
        name: "Hardness",
        type: "float",
        dir: "in",
        defaultValue: 0.5,
        tooltip: "Falloff sharpness (0=soft, 1=hard edge)",
      },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      AttenuationRadius: 100.0,
      HardnessPercent: 0.5,
    },
    shaderCode: `
            float _dist = distance({a}, {b});
            float _rad = {radius} != 0.0 ? {radius} : {AttenuationRadius};
            float _hard = {hardness} != 0.0 ? {hardness} : {HardnessPercent};
            float _falloff = _rad * (1.0 - _hard);
            float {OUTPUT} = 1.0 - saturate((_dist - _rad + _falloff) / max(_falloff, 0.0001));
        `,
  },

  RotateAboutAxis: {
    title: "RotateAboutAxis",
    type: "material-expression",
    category: "Utility",
    icon: "↻",
    description:
      "Rotates a position around an arbitrary axis. Returns the OFFSET (delta), not the final position. Add to WorldPositionOffset.",
    pins: [
      {
        id: "rotation_axis",
        name: "NormalizedRotationAxis",
        type: "float3",
        dir: "in",
        tooltip: "The axis to rotate around (should be normalized)",
      },
      {
        id: "rotation_angle",
        name: "RotationAngle",
        type: "float",
        dir: "in",
        tooltip: "Rotation angle in radians (0-2π)",
      },
      {
        id: "pivot_point",
        name: "PivotPoint",
        type: "float3",
        dir: "in",
        tooltip: "The center point to rotate around",
      },
      {
        id: "position",
        name: "Position",
        type: "float3",
        dir: "in",
        tooltip: "The position to rotate (usually WorldPosition)",
      },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `
            // Rodrigues' rotation formula - returns OFFSET (delta)
            float3 _axis = normalize({rotation_axis});
            float _angle = {rotation_angle};
            float3 _point = {position} - {pivot_point};
            
            float _cos = cos(_angle);
            float _sin = sin(_angle);
            float3 _rotated = _point * _cos 
                            + cross(_axis, _point) * _sin 
                            + _axis * dot(_axis, _point) * (1.0 - _cos);
            
            float3 {OUTPUT} = _rotated + {pivot_point} - {position};
        `,
  },

  DeriveNormalZ: {
    title: "DeriveNormalZ",
    type: "material-expression",
    category: "Utility",
    icon: "Z",
    description:
      "Reconstructs the Z component of a normal from X and Y (for BC5 normal maps that only store 2 channels)",
    pins: [
      { id: "in", name: "", type: "float2", dir: "in" },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `
            float2 _xy = {in} * 2.0 - 1.0;
            float _z = sqrt(max(1.0 - dot(_xy, _xy), 0.0));
            float3 {OUTPUT} = float3(_xy, _z);
        `,
  },

  DDX: {
    title: "DDX",
    type: "material-expression",
    category: "Utility",
    icon: "∂x",
    description: "Returns the partial derivative of the input with respect to screen-space X",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = ddx({in});`,
  },

  DDY: {
    title: "DDY",
    type: "material-expression",
    category: "Utility",
    icon: "∂y",
    description: "Returns the partial derivative of the input with respect to screen-space Y",
    pins: [
      { id: "in", name: "", type: "float", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = ddy({in});`,
  },
};
