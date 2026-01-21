/**
 * Depth & Shading Node Definitions
 * Contains SceneDepth, DepthFade, CameraDepthFade, SceneColor
 */

export const DepthNodes = {
  SceneColor: {
    title: "SceneColor",
    type: "material-expression",
    category: "Shading",
    icon: "🖼",
    description:
      "Samples the scene color buffer behind this pixel. Used for glass, water, and distortion effects.",
    pins: [
      {
        id: "uv_offset",
        name: "UV Offset",
        type: "float2",
        dir: "in",
        defaultValue: [0, 0],
        tooltip: "Offset for distortion effects",
      },
      { id: "out", name: "", type: "float3", dir: "out" },
    ],
    shaderCode: `float3 {OUTPUT} = SampleSceneColor(ScreenUV + {uv_offset});`,
  },

  CameraDepthFade: {
    title: "CameraDepthFade",
    type: "material-expression",
    category: "Depth",
    icon: "📏",
    description:
      "Fades based on camera distance. Useful for LOD blending, fog, and distance-based effects.",
    pins: [
      {
        id: "fade_length",
        name: "Fade Length",
        type: "float",
        dir: "in",
        defaultValue: 100.0,
      },
      {
        id: "fade_offset",
        name: "Fade Offset",
        type: "float",
        dir: "in",
        defaultValue: 0.0,
      },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      FadeLength: 100.0,
      FadeOffset: 0.0,
    },
    shaderCode: `
            float _fade_len = {fade_length} != 0.0 ? {fade_length} : {FadeLength};
            float _fade_off = {fade_offset} != 0.0 ? {fade_offset} : {FadeOffset};
            float _depth = length(WorldPositionWS - CameraPositionWS);
            float {OUTPUT} = saturate((_depth - _fade_off) / max(_fade_len, 0.0001));
        `,
  },

  SceneDepth: {
    title: "SceneDepth",
    type: "material-expression",
    category: "Depth",
    icon: "S",
    pins: [
      { id: "uv", name: "UV", type: "float2", dir: "in" },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    shaderCode: `float {OUTPUT} = SampleSceneDepth({uv});`,
  },

  DepthFade: {
    title: "DepthFade",
    type: "material-expression",
    category: "Depth",
    icon: "≈",
    pins: [
      {
        id: "opacity",
        name: "Opacity",
        type: "float",
        dir: "in",
        defaultValue: 1.0,
      },
      {
        id: "fade_distance",
        name: "FadeDistance",
        type: "float",
        dir: "in",
        defaultValue: 100.0,
      },
      { id: "out", name: "", type: "float", dir: "out" },
    ],
    properties: {
      FadeDistanceDefault: 100.0,
    },
    shaderCode: `
            float _scene_depth = SampleSceneDepth(ScreenUV);
            float _pixel_depth = length(WorldPositionWS - CameraPositionWS);
            float _fade_dist = {fade_distance} != 0.0 ? {fade_distance} : {FadeDistanceDefault};
            float _depth_diff = _scene_depth - _pixel_depth;
            float {OUTPUT} = {opacity} * saturate(_depth_diff / max(_fade_dist, 0.0001));
        `,
  },
};
