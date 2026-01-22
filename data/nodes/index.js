/**
 * Material Expression Node Definitions - Modular Structure
 *
 * This barrel export combines all node category modules into a single
 * MaterialExpressionDefinitions object for backward compatibility.
 *
 * Structure:
 * - OutputNodes.js: Main Material Output Node
 * - ConstantNodes.js: Constant, Constant2Vector, Constant3Vector, Constant4Vector
 * - ParameterNodes.js: Scalar/Vector/Texture/Bool Parameters
 * - TextureNodes.js: TextureSample, TextureCoordinate, Panner, Rotator, FlipBook
 * - MathNodes.js: Add, Subtract, Multiply, Divide, Clamp, Lerp, trig functions, etc.
 * - VectorNodes.js: Normalize, Dot, Cross, AppendVector, ComponentMask, etc.
 * - CoordinateNodes.js: WorldPosition, CameraPosition, VertexNormal, ObjectBounds, etc.
 * - UtilityNodes.js: Fresnel, BumpOffset, Time, Noise, SphereMask, RotateAboutAxis, etc.
 * - DepthNodes.js: SceneColor, SceneDepth, DepthFade, CameraDepthFade
 * - ControlFlowNodes.js: StaticSwitch, If, Comment, Reroute nodes
 * - SubstrateNodes.js: Substrate Slab BSDF, Vertical Layer, Horizontal Blend (UE5.1+)
 * - DebugNodes.js: BRDF Visualizer, Fresnel Debug, GGX/Smith debug nodes
 */

import { OutputNodes } from './OutputNodes.js';
import { ConstantNodes } from './ConstantNodes.js';
import { ParameterNodes } from './ParameterNodes.js';
import { TextureNodes } from './TextureNodes.js';
import { MathNodes } from './MathNodes.js';
import { VectorNodes } from './VectorNodes.js';
import { CoordinateNodes } from './CoordinateNodes.js';
import { UtilityNodes } from './UtilityNodes.js';
import { DepthNodes } from './DepthNodes.js';
import { ControlFlowNodes } from './ControlFlowNodes.js';
import { SubstrateNodes } from './SubstrateNodes.js';
import { DebugNodes } from './DebugNodes.js';

// Combine all node modules into a single export
export const MaterialExpressionDefinitions = {
  ...OutputNodes,
  ...ConstantNodes,
  ...ParameterNodes,
  ...TextureNodes,
  ...MathNodes,
  ...VectorNodes,
  ...CoordinateNodes,
  ...UtilityNodes,
  ...DepthNodes,
  ...ControlFlowNodes,
  ...SubstrateNodes,
  ...DebugNodes,
};

// Also export individual modules for direct imports
export {
  OutputNodes,
  ConstantNodes,
  ParameterNodes,
  TextureNodes,
  MathNodes,
  VectorNodes,
  CoordinateNodes,
  UtilityNodes,
  DepthNodes,
  ControlFlowNodes,
  SubstrateNodes,
  DebugNodes,
};

