/**
 * PBRInputsQuiz.js
 *
 * SCORM 1.2 quiz questions for PBR (Physically Based Rendering) inputs.
 */

export const PBRInputsQuestions = [
  {
    id: "pbr_1",
    question:
      "What does the Base Color input represent for non-metallic (dielectric) surfaces?",
    options: [
      { id: "a", text: "The color of specular reflections" },
      { id: "b", text: "The diffuse albedo - the actual color of the object" },
      { id: "c", text: "The emissive glow color" },
      { id: "d", text: "The transparency color" },
    ],
    correctAnswer: "b",
    explanation:
      "For dielectrics, Base Color represents the diffuse albedo - the specific wavelengths of light reflected diffusely.",
    points: 1,
  },
  {
    id: "pbr_2",
    question: "What is the valid range for Base Color values in PBR?",
    options: [
      { id: "a", text: "0.0 to 0.5" },
      { id: "b", text: "0.0 to infinity" },
      { id: "c", text: "Approximately 0.02 to 0.9" },
      { id: "d", text: "Exactly 0 or 1" },
    ],
    correctAnswer: "c",
    explanation:
      "Realistic Base Color values range from ~0.02 (darkest real materials) to ~0.9 (brightest). Pure black/white are physically impossible.",
    points: 1,
  },
  {
    id: "pbr_3",
    question: "The Metallic input should typically be set to which values?",
    options: [
      { id: "a", text: "0.5 for all materials" },
      { id: "b", text: "0 (non-metal) or 1 (metal) - binary" },
      { id: "c", text: "Any value from 0 to 1" },
      { id: "d", text: "Negative values for reflective surfaces" },
    ],
    correctAnswer: "b",
    explanation:
      "Metallic is a binary switch - 0 for dielectrics, 1 for metals. Gray values are generally physically invalid except for transitions.",
    points: 1,
  },
  {
    id: "pbr_4",
    question: "What does Roughness = 0.0 produce?",
    options: [
      { id: "a", text: "A matte, diffuse surface" },
      { id: "b", text: "A mirror-like, perfectly smooth reflection" },
      { id: "c", text: "No reflection at all" },
      { id: "d", text: "A glowing effect" },
    ],
    correctAnswer: "b",
    explanation:
      "Roughness 0.0 produces a perfectly smooth surface with mirror-like specular reflections.",
    points: 1,
  },
  {
    id: "pbr_5",
    question:
      "What is the default value for the Specular input, and what does it represent?",
    options: [
      { id: "a", text: "0.0, representing no reflection" },
      { id: "b", text: "1.0, representing maximum reflection" },
      {
        id: "c",
        text: "0.5, representing 4% reflectance (F0) for most materials",
      },
      { id: "d", text: "0.25, representing metallic intensity" },
    ],
    correctAnswer: "c",
    explanation:
      "The default Specular value of 0.5 maps to 4% Fresnel reflectance, which is correct for most real-world dielectric materials.",
    points: 1,
  },
  {
    id: "pbr_6",
    question:
      "Which input is used to create glowing effects with HDR values above 1.0?",
    options: [
      { id: "a", text: "Base Color" },
      { id: "b", text: "Specular" },
      { id: "c", text: "Emissive Color" },
      { id: "d", text: "Ambient Occlusion" },
    ],
    correctAnswer: "c",
    explanation:
      "Emissive Color accepts HDR values above 1.0 to create glowing effects and trigger bloom post-processing.",
    points: 1,
  },
  {
    id: "pbr_7",
    question: "What color should a Normal Map appear when viewed as an image?",
    options: [
      { id: "a", text: "Black and white" },
      { id: "b", text: "Red and green only" },
      { id: "c", text: "Blue-purple (tangent space)" },
      { id: "d", text: "Yellow and cyan" },
    ],
    correctAnswer: "c",
    explanation:
      "Tangent space normal maps appear blue-purple because the Z (up) component dominates, encoded in the blue channel.",
    points: 1,
  },
  {
    id: "pbr_8",
    question: "What is the purpose of Ambient Occlusion in a Lumen-lit scene?",
    options: [
      { id: "a", text: "Replace global illumination" },
      { id: "b", text: "Primarily serve as a specular occluder in crevices" },
      { id: "c", text: "Add emissive lighting" },
      { id: "d", text: "Control transparency" },
    ],
    correctAnswer: "b",
    explanation:
      "With Lumen GI, baked AO mainly serves to occlude specular reflections in crevices, preventing unrealistic shine.",
    points: 1,
  },
  {
    id: "pbr_9",
    question: "What does World Position Offset (WPO) manipulate?",
    options: [
      { id: "a", text: "Pixel colors in the fragment shader" },
      { id: "b", text: "Vertex positions in world space via vertex shader" },
      { id: "c", text: "Normal vectors" },
      { id: "d", text: "Texture coordinates" },
    ],
    correctAnswer: "b",
    explanation:
      "WPO moves vertex positions in world space via the vertex shader, used for animation effects like swaying grass.",
    points: 1,
  },
  {
    id: "pbr_10",
    question: "What is Pixel Depth Offset used for?",
    options: [
      { id: "a", text: "Making objects transparent" },
      {
        id: "b",
        text: "Soft blending at intersections (e.g., rocks into terrain)",
      },
      { id: "c", text: "Increasing texture resolution" },
      { id: "d", text: "Adding motion blur" },
    ],
    correctAnswer: "b",
    explanation:
      "PDO pushes pixels deeper into the depth buffer, creating soft blending at intersections like rocks meeting terrain.",
    points: 1,
  },
  {
    id: "pbr_11",
    question: "What Index of Refraction (IOR) value should you use for glass?",
    options: [
      { id: "a", text: "1.0" },
      { id: "b", text: "1.33" },
      { id: "c", text: "1.52" },
      { id: "d", text: "2.42" },
    ],
    correctAnswer: "c",
    explanation:
      "Glass has an IOR of approximately 1.52. Air is 1.0, water is 1.33, and diamond is 2.42.",
    points: 1,
  },
  {
    id: "pbr_12",
    question:
      "For metallic surfaces (Metallic = 1), what happens to the Base Color?",
    options: [
      { id: "a", text: "It becomes the diffuse color" },
      { id: "b", text: "It tints the specular reflection instead of diffuse" },
      { id: "c", text: "It is ignored completely" },
      { id: "d", text: "It becomes emissive" },
    ],
    correctAnswer: "b",
    explanation:
      "For metals, Base Color tints the specular reflection rather than providing diffuse color (metals have no diffuse).",
    points: 1,
  },
  {
    id: "pbr_13",
    question: "What common mistake should you avoid with Roughness values?",
    options: [
      { id: "a", text: "Using the same roughness everywhere" },
      { id: "b", text: "Using values above 0.5" },
      {
        id: "c",
        text: "Using 0.0 for all shiny surfaces - pure mirrors are rare",
      },
      { id: "d", text: "Texturing roughness at all" },
    ],
    correctAnswer: "c",
    explanation:
      "Using Roughness 0.0 for 'shiny' is unrealistic - even polished surfaces have some microscopic roughness.",
    points: 1,
  },
  {
    id: "pbr_14",
    question:
      "What problem can occur if you use World Position Offset to move vertices outside the mesh's bounding box?",
    options: [
      { id: "a", text: "The material will turn black" },
      {
        id: "b",
        text: "Culling issues - the object may disappear at certain angles",
      },
      { id: "c", text: "Texture stretching" },
      { id: "d", text: "Shadow artifacts" },
    ],
    correctAnswer: "b",
    explanation:
      "Displacing vertices outside the bounding box causes frustum culling to incorrectly hide the mesh. Increase Bounds Scale to fix.",
    points: 1,
  },
  {
    id: "pbr_15",
    question: "The Specular input has no effect when which condition is true?",
    options: [
      { id: "a", text: "When Roughness is 0" },
      { id: "b", text: "When Base Color is black" },
      { id: "c", text: "When Metallic is 1" },
      { id: "d", text: "When the material is translucent" },
    ],
    correctAnswer: "c",
    explanation:
      "The Specular input only affects dielectrics. When Metallic = 1, the surface uses the metal's intrinsic reflectance instead.",
    points: 1,
  },
];

export default PBRInputsQuestions;
