/**
 * NodeEvaluators.js
 *
 * Node-specific evaluation logic for the material graph.
 *
 * This file re-exports all evaluators from modular files for backward compatibility.
 *
 * Structure:
 * - evaluators/ConstantEvaluators.js - Constant node evaluation
 * - evaluators/MathEvaluators.js - Math operations (Add, Multiply, Lerp, etc.)
 * - evaluators/TextureEvaluators.js - Texture sampling
 * - evaluators/UtilityEvaluators.js - Fresnel, Noise, WorldPosition, etc.
 * - evaluators/SubstrateEvaluators.js - UE5.1+ Substrate BSDF nodes
 * - evaluators/NodeDispatcher.js - Main dispatch function
 */

export * from "./evaluators/index.js";
