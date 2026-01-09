/**
 * Quiz Index
 *
 * Central export for all SCORM quiz modules.
 */

export { QuizEngine } from "./QuizEngine.js";
export { MaterialDomainQuestions } from "./MaterialDomainQuiz.js";
export { BlendModeQuestions } from "./BlendModeQuiz.js";
export { ShadingModelQuestions } from "./ShadingModelQuiz.js";
export { PBRInputsQuestions } from "./PBRInputsQuiz.js";

/**
 * Get all quiz questions combined
 */
export function getAllQuestions() {
  return {
    domain: MaterialDomainQuestions,
    blendMode: BlendModeQuestions,
    shadingModel: ShadingModelQuestions,
    pbrInputs: PBRInputsQuestions,
  };
}

/**
 * Get total question count
 */
export function getTotalQuestionCount() {
  return (
    MaterialDomainQuestions.length +
    BlendModeQuestions.length +
    ShadingModelQuestions.length +
    PBRInputsQuestions.length
  );
}
