/**
 * Texture Node Definitions
 * Contains TextureSample, TextureCoordinate, TextureObject, Panner, Rotator, FlipBook
 */

export const TextureNodes = {
  TextureSample: {
    title: "Texture Sample",
    type: "material-expression",
    category: "Texture",
    icon: "T",
    hotkey: "T",
    showPreview: true,
    pins: [
      { id: "uv", name: "UVs", type: "float2", dir: "in" },
      { id: "tex", name: "Tex", type: "texture", dir: "in" },
      { id: "rgb", name: "RGB", type: "float3", dir: "out" },
      { id: "r", name: "R", type: "float", dir: "out" },
      { id: "g", name: "G", type: "float", dir: "out" },
      { id: "b", name: "B", type: "float", dir: "out" },
      { id: "a", name: "A", type: "float", dir: "out" },
    ],
    properties: {
      TextureAsset: null,
      SamplerType: "Linear",
    },
    shaderCode: `
            float2 uv_coords = {uv} != float2(0,0) ? {uv} : GetDefaultUVs();
            float4 {OUTPUT}_sample = Texture2DSample({tex}, uv_coords);
            float3 {OUTPUT}_rgb = {OUTPUT}_sample.rgb;
            float {OUTPUT}_r = {OUTPUT}_sample.r;
            float {OUTPUT}_g = {OUTPUT}_sample.g;
            float {OUTPUT}_b = {OUTPUT}_sample.b;
            float {OUTPUT}_a = {OUTPUT}_sample.a;
        `,
  },

  TextureCoordinate: {
    title: "TexCoord",
    type: "material-expression",
    category: "Texture",
    icon: "●",
    pins: [{ id: "out", name: "", type: "float2", dir: "out" }],
    properties: {
      CoordinateIndex: 0,
      UTiling: 1.0,
      VTiling: 1.0,
    },
    shaderCode: `float2 {OUTPUT} = GetTextureCoordinates({CoordinateIndex}) * float2({UTiling}, {VTiling});`,
  },

  TextureObject: {
    title: "Texture Object",
    type: "material-expression",
    category: "Texture",
    icon: "□",
    showPreview: true,
    pins: [{ id: "out", name: "", type: "texture", dir: "out" }],
    properties: {
      TextureAsset: null,
    },
    shaderCode: `Texture2D {OUTPUT} = {TextureAsset};`,
  },

  Panner: {
    title: "Panner",
    type: "material-expression",
    category: "Texture",
    icon: "→",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "time", name: "Time", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      SpeedX: 0.0,
      SpeedY: 0.0,
    },
    shaderCode: `
            float time_val = {time} != 0.0 ? {time} : Time;
            float2 {OUTPUT} = {coordinate} + float2({SpeedX}, {SpeedY}) * time_val;
        `,
  },

  Rotator: {
    title: "Rotator",
    type: "material-expression",
    category: "Texture",
    icon: "↻",
    pins: [
      { id: "coordinate", name: "Coordinate", type: "float2", dir: "in" },
      { id: "center", name: "Center", type: "float2", dir: "in" },
      { id: "time", name: "Time", type: "float", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      Speed: 0.25,
    },
    shaderCode: `
            float2 center_pt = {center};
            float rot_time = {time} != 0.0 ? {time} : Time;
            float angle = rot_time * {Speed} * 6.28318;
            float2 offset = {coordinate} - center_pt;
            float2 {OUTPUT} = center_pt + float2(
                offset.x * cos(angle) - offset.y * sin(angle),
                offset.x * sin(angle) + offset.y * cos(angle)
            );
        `,
  },

  FlipBook: {
    title: "FlipBook",
    type: "material-expression",
    category: "Texture",
    icon: "▦",
    pins: [
      {
        id: "animation",
        name: "Animation Phase (0-1)",
        type: "float",
        dir: "in",
      },
      { id: "uv", name: "UVs", type: "float2", dir: "in" },
      { id: "out", name: "", type: "float2", dir: "out" },
    ],
    properties: {
      NumberOfRows: 4,
      NumberOfColumns: 4,
    },
    shaderCode: `
            float totalFrames = {NumberOfRows} * {NumberOfColumns};
            float frame = floor({animation} * totalFrames);
            float row = floor(frame / {NumberOfColumns});
            float col = fmod(frame, {NumberOfColumns});
            float2 frameSize = float2(1.0 / {NumberOfColumns}, 1.0 / {NumberOfRows});
            float2 {OUTPUT} = {uv} * frameSize + float2(col, row) * frameSize;
        `,
  },
};
