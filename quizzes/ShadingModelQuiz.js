/**
 * ShadingModelQuiz.js
 *
 * SCORM 1.2 quiz questions for Shading Model concepts.
 */

export const ShadingModelQuestions = [
  {
    id: "shading_1",
    question:
      "Which Shading Model should you use for standard PBR surfaces like plastic, wood, or metal?",
    options: [
      { id: "a", text: "Unlit" },
      { id: "b", text: "Default Lit" },
      { id: "c", text: "Subsurface" },
      { id: "d", text: "Clear Coat" },
    ],
    correctAnswer: "b",
    explanation:
      "Default Lit is the standard PBR shading model that works for most surfaces, providing proper metallic/roughness workflow.",
    points: 1,
  },
  {
    id: "shading_2",
    question: "When should you use the 'Unlit' Shading Model?",
    options: [
      { id: "a", text: "For metallic surfaces" },
      {
        id: "b",
        text: "For surfaces that emit their own light and ignore scene lighting",
      },
      { id: "c", text: "For transparent materials" },
      { id: "d", text: "For skin rendering" },
    ],
    correctAnswer: "b",
    explanation:
      "Unlit is for self-illuminated surfaces that should ignore scene lighting, like LED screens, holograms, or stylized effects.",
    points: 1,
  },
  {
    id: "shading_3",
    question:
      "Which Shading Model simulates light scattering through translucent materials like wax, jade, or ice?",
    options: [
      { id: "a", text: "Default Lit" },
      { id: "b", text: "Clear Coat" },
      { id: "c", text: "Subsurface" },
      { id: "d", text: "Cloth" },
    ],
    correctAnswer: "c",
    explanation:
      "Subsurface simulates sub-surface scattering where light penetrates the material and scatters before exiting.",
    points: 1,
  },
  {
    id: "shading_4",
    question: "What is the 'Clear Coat' Shading Model used for?",
    options: [
      { id: "a", text: "Transparent glass" },
      {
        id: "b",
        text: "Materials with a secondary specular layer like car paint or lacquered wood",
      },
      { id: "c", text: "Water surfaces" },
      { id: "d", text: "Fabric materials" },
    ],
    correctAnswer: "b",
    explanation:
      "Clear Coat adds a secondary specular layer simulating a clear varnish or lacquer over the base material.",
    points: 1,
  },
  {
    id: "shading_5",
    question:
      "Which Shading Model is designed specifically for rendering human skin?",
    options: [
      { id: "a", text: "Subsurface" },
      { id: "b", text: "Preintegrated Skin" },
      { id: "c", text: "Cloth" },
      { id: "d", text: "Default Lit" },
    ],
    correctAnswer: "b",
    explanation:
      "Preintegrated Skin is a low-cost skin shader optimized specifically for human skin rendering.",
    points: 1,
  },
  {
    id: "shading_6",
    question:
      "What special input does the 'Two Sided Foliage' Shading Model use?",
    options: [
      { id: "a", text: "Clear Coat" },
      { id: "b", text: "Subsurface Color (for backlit appearance)" },
      { id: "c", text: "Anisotropy" },
      { id: "d", text: "Refraction" },
    ],
    correctAnswer: "b",
    explanation:
      "Two Sided Foliage uses Subsurface Color to simulate light passing through thin surfaces like leaves when backlit.",
    points: 1,
  },
  {
    id: "shading_7",
    question:
      "Which Shading Model is specifically designed for rendering hair strands?",
    options: [
      { id: "a", text: "Cloth" },
      { id: "b", text: "Subsurface Profile" },
      { id: "c", text: "Hair" },
      { id: "d", text: "Default Lit" },
    ],
    correctAnswer: "c",
    explanation:
      "Hair provides anisotropic specular reflections that simulate the cylindrical shape of hair strands.",
    points: 1,
  },
  {
    id: "shading_8",
    question: "What unique property does the 'Cloth' Shading Model provide?",
    options: [
      { id: "a", text: "Refraction like glass" },
      { id: "b", text: "Fuzz layer for velvet/fabric sheen" },
      { id: "c", text: "Mirror-like reflection" },
      { id: "d", text: "Subsurface scattering" },
    ],
    correctAnswer: "b",
    explanation:
      "Cloth provides a fuzz layer that simulates the soft sheen of fabric materials like velvet and cotton.",
    points: 1,
  },
  {
    id: "shading_9",
    question:
      "What is unique about 'Single Layer Water' compared to Translucent materials?",
    options: [
      { id: "a", text: "It uses less memory" },
      {
        id: "b",
        text: "It renders opaque but appears transparent with refraction, absorption, and scattering",
      },
      { id: "c", text: "It doesn't require any inputs" },
      { id: "d", text: "It only works in forward rendering" },
    ],
    correctAnswer: "b",
    explanation:
      "Single Layer Water renders as opaque but achieves transparency through refraction, absorption, and scattering in a single pass.",
    points: 1,
  },
  {
    id: "shading_10",
    question:
      "Which Shading Model should you use for thin transparent surfaces that still need specular reflections?",
    options: [
      { id: "a", text: "Unlit" },
      { id: "b", text: "Subsurface" },
      { id: "c", text: "Thin Translucent" },
      { id: "d", text: "Default Lit with Translucent blend" },
    ],
    correctAnswer: "c",
    explanation:
      "Thin Translucent provides colored transparency with proper specular reflections, ideal for thin materials like colored plastic.",
    points: 1,
  },
];

export default ShadingModelQuestions;
