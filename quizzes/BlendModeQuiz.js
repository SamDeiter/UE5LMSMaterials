/**
 * BlendModeQuiz.js
 *
 * SCORM 1.2 quiz questions for Blend Mode concepts.
 */

export const BlendModeQuestions = [
  {
    id: "blend_1",
    question: "Which Blend Mode provides the best performance?",
    options: [
      { id: "a", text: "Translucent" },
      { id: "b", text: "Opaque" },
      { id: "c", text: "Masked" },
      { id: "d", text: "Additive" },
    ],
    correctAnswer: "b",
    explanation:
      "Opaque is the most performant because it writes directly to the color and depth buffers without blending calculations.",
    points: 1,
  },
  {
    id: "blend_2",
    question: "What type of transparency does Masked blend mode provide?",
    options: [
      { id: "a", text: "Smooth gradient transparency" },
      { id: "b", text: "Binary (on/off) visibility based on threshold" },
      { id: "c", text: "Additive glow" },
      { id: "d", text: "Multiplicative darkening" },
    ],
    correctAnswer: "b",
    explanation:
      "Masked provides binary visibility - pixels are either fully visible or fully clipped based on the Opacity Mask Clip Value threshold.",
    points: 1,
  },
  {
    id: "blend_3",
    question: "Why are Translucent materials considered 'expensive'?",
    options: [
      { id: "a", text: "They use more texture memory" },
      { id: "b", text: "They require sorting and multiple render passes" },
      { id: "c", text: "They need higher resolution textures" },
      { id: "d", text: "They consume more CPU" },
    ],
    correctAnswer: "b",
    explanation:
      "Translucent materials require expensive sorting for correct draw order and often multiple render passes for proper blending.",
    points: 1,
  },
  {
    id: "blend_4",
    question: "Which Blend Mode is ideal for fire, lasers, and light beams?",
    options: [
      { id: "a", text: "Translucent" },
      { id: "b", text: "Modulate" },
      { id: "c", text: "Additive" },
      { id: "d", text: "Masked" },
    ],
    correctAnswer: "c",
    explanation:
      "Additive adds the material color to the background, creating glowing effects perfect for fire, lasers, and energy beams.",
    points: 1,
  },
  {
    id: "blend_5",
    question: "What does the Modulate blend mode do?",
    options: [
      { id: "a", text: "Adds color to background" },
      { id: "b", text: "Multiplies color with background (darkening)" },
      { id: "c", text: "Replaces background completely" },
      { id: "d", text: "Clips pixels below threshold" },
    ],
    correctAnswer: "b",
    explanation:
      "Modulate multiplies the material color with the background, which always darkens the result. Useful for shadows and stained glass.",
    points: 1,
  },
  {
    id: "blend_6",
    question: "Which blend modes write to the Depth Buffer?",
    options: [
      { id: "a", text: "Only Opaque" },
      { id: "b", text: "Opaque and Masked" },
      { id: "c", text: "All blend modes" },
      { id: "d", text: "Translucent and Additive" },
    ],
    correctAnswer: "b",
    explanation:
      "Only Opaque and Masked write to the depth buffer. Translucent, Additive, and Modulate do not write depth.",
    points: 1,
  },
  {
    id: "blend_7",
    question: "What is the purpose of the 'Opacity Mask Clip Value' setting?",
    options: [
      { id: "a", text: "Controls transparency of Translucent materials" },
      { id: "b", text: "Sets the threshold for Masked mode pixel discard" },
      { id: "c", text: "Adjusts Additive brightness" },
      { id: "d", text: "Changes depth buffer precision" },
    ],
    correctAnswer: "b",
    explanation:
      "Opacity Mask Clip Value (default 0.5) sets the threshold for Masked mode - pixels with Opacity Mask below this value are discarded.",
    points: 1,
  },
  {
    id: "blend_8",
    question: "Which Blend Mode is used for pre-multiplied alpha compositing?",
    options: [
      { id: "a", text: "Translucent" },
      { id: "b", text: "Alpha Composite" },
      { id: "c", text: "Masked" },
      { id: "d", text: "Additive" },
    ],
    correctAnswer: "b",
    explanation:
      "Alpha Composite (Premultiplied Alpha) is designed for pre-multiplied alpha images, commonly used in UI and VFX.",
    points: 1,
  },
  {
    id: "blend_9",
    question: "What sorting issues can occur with Translucent materials?",
    options: [
      { id: "a", text: "Z-fighting with opaque objects" },
      { id: "b", text: "Incorrect draw order causing see-through effects" },
      { id: "c", text: "Shadow resolution problems" },
      { id: "d", text: "Texture mipmap errors" },
    ],
    correctAnswer: "b",
    explanation:
      "Translucent materials can have sorting errors where objects render in the wrong order, causing incorrect overlapping.",
    points: 1,
  },
  {
    id: "blend_10",
    question: "When should you use Masked instead of Translucent?",
    options: [
      { id: "a", text: "When you need smooth gradient transparency" },
      {
        id: "b",
        text: "When you only need hard-edged cutouts and want better performance",
      },
      { id: "c", text: "When creating glass materials" },
      { id: "d", text: "When the material needs to glow" },
    ],
    correctAnswer: "b",
    explanation:
      "Use Masked for hard-edged cutouts (leaves, fences, chains) as it's much more performant than Translucent and writes to the depth buffer.",
    points: 1,
  },
];

export default BlendModeQuestions;
