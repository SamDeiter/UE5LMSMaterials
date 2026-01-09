/**
 * MaterialDomainQuiz.js
 *
 * SCORM 1.2 quiz questions for Material Domain concepts.
 */

export const MaterialDomainQuestions = [
  {
    id: "domain_1",
    question:
      "Which Material Domain should you use for a standard 3D mesh like a character or prop?",
    options: [
      { id: "a", text: "Surface" },
      { id: "b", text: "Deferred Decal" },
      { id: "c", text: "Post Process" },
      { id: "d", text: "User Interface" },
    ],
    correctAnswer: "a",
    explanation:
      "Surface is the default domain for physical objects like meshes, landscapes, and characters.",
    points: 1,
  },
  {
    id: "domain_2",
    question:
      "What happens to PBR inputs when you set Material Domain to 'Post Process'?",
    options: [
      { id: "a", text: "They become more powerful" },
      {
        id: "b",
        text: "They are replaced with a single Emissive Color output",
      },
      { id: "c", text: "They work exactly the same" },
      { id: "d", text: "They only affect metallic surfaces" },
    ],
    correctAnswer: "b",
    explanation:
      "Post Process domain replaces all PBR inputs with a single Emissive Color, representing the screen pixel color for effects like thermal vision.",
    points: 1,
  },
  {
    id: "domain_3",
    question:
      "Which Material Domain is used for projecting textures onto other surfaces?",
    options: [
      { id: "a", text: "Surface" },
      { id: "b", text: "Deferred Decal" },
      { id: "c", text: "Light Function" },
      { id: "d", text: "Volume" },
    ],
    correctAnswer: "b",
    explanation:
      "Deferred Decal is a projection shader that projects onto other surfaces, commonly used for bullet holes, graffiti, etc.",
    points: 1,
  },
  {
    id: "domain_4",
    question: "What is the Light Function domain typically used for?",
    options: [
      { id: "a", text: "Creating emissive materials" },
      { id: "b", text: "Light masking like flashlight gobos or cloud shadows" },
      { id: "c", text: "Volumetric fog effects" },
      { id: "d", text: "UI elements" },
    ],
    correctAnswer: "b",
    explanation:
      "Light Function creates masks for lights, such as flashlight patterns (gobos) or simulating cloud shadows.",
    points: 1,
  },
  {
    id: "domain_5",
    question:
      "Which domain should you use for rendering volumetric fog or clouds?",
    options: [
      { id: "a", text: "Surface" },
      { id: "b", text: "Post Process" },
      { id: "c", text: "Volume" },
      { id: "d", text: "Deferred Decal" },
    ],
    correctAnswer: "c",
    explanation:
      "Volume domain is specifically designed for volumetric rendering effects like fog, clouds, and atmospheric effects.",
    points: 1,
  },
  {
    id: "domain_6",
    question:
      "The User Interface domain is designed for what type of rendering?",
    options: [
      { id: "a", text: "3D meshes with full PBR lighting" },
      { id: "b", text: "Slate and UMG (2D graphics with no 3D lighting)" },
      { id: "c", text: "Volumetric effects" },
      { id: "d", text: "Light projections" },
    ],
    correctAnswer: "b",
    explanation:
      "User Interface domain is for Slate and UMG 2D graphics, rendered without 3D lighting calculations.",
    points: 1,
  },
  {
    id: "domain_7",
    question: "What is the Virtual Texture domain primarily used for?",
    options: [
      { id: "a", text: "Creating virtual reality materials" },
      {
        id: "b",
        text: "Baking into Runtime Virtual Textures for landscape optimization",
      },
      { id: "c", text: "Screen-space reflections" },
      { id: "d", text: "Procedural texture generation" },
    ],
    correctAnswer: "b",
    explanation:
      "Virtual Texture domain materials are baked into Runtime Virtual Textures, primarily for landscape optimization.",
    points: 1,
  },
  {
    id: "domain_8",
    question:
      "Which domain would you choose for creating a heat vision post-processing effect?",
    options: [
      { id: "a", text: "Surface" },
      { id: "b", text: "Light Function" },
      { id: "c", text: "Post Process" },
      { id: "d", text: "Volume" },
    ],
    correctAnswer: "c",
    explanation:
      "Post Process domain is used for screen-space effects like thermal vision, edge detection, and color grading.",
    points: 1,
  },
  {
    id: "domain_9",
    question:
      "Can a material with the Volume domain write to the depth buffer?",
    options: [
      { id: "a", text: "Yes, always" },
      { id: "b", text: "Only in Opaque mode" },
      { id: "c", text: "No, volumetric materials are inherently transparent" },
      { id: "d", text: "Only when Metallic is set to 1" },
    ],
    correctAnswer: "c",
    explanation:
      "Volume materials are inherently transparent and don't write to the depth buffer in the traditional sense.",
    points: 1,
  },
  {
    id: "domain_10",
    question: "What is the DEFAULT Material Domain in Unreal Engine?",
    options: [
      { id: "a", text: "Post Process" },
      { id: "b", text: "Deferred Decal" },
      { id: "c", text: "Surface" },
      { id: "d", text: "User Interface" },
    ],
    correctAnswer: "c",
    explanation:
      "Surface is the default domain, as it covers the most common use case: rendering 3D objects.",
    points: 1,
  },
];

export default MaterialDomainQuestions;
