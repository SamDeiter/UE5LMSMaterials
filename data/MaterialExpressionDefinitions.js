/**
 * MaterialExpressionDefinitions.js
 *
 * MATERIAL EXPRESSION NODE LIBRARY
 * ================================
 * This file re-exports from the modular node structure for backward compatibility.
 * 
 * The actual node definitions are now organized in data/nodes/:
 *   - OutputNodes.js: Main Material Output Node
 *   - ConstantNodes.js: Constant, Constant2Vector, Constant3Vector, Constant4Vector
 *   - ParameterNodes.js: Scalar/Vector/Texture/Bool Parameters
 *   - TextureNodes.js: TextureSample, TextureCoordinate, Panner, Rotator, FlipBook
 *   - MathNodes.js: Add, Subtract, Multiply, Divide, Clamp, Lerp, trig functions, etc.
 *   - VectorNodes.js: Normalize, Dot, Cross, AppendVector, ComponentMask, etc.
 *   - CoordinateNodes.js: WorldPosition, CameraPosition, VertexNormal, ObjectBounds, etc.
 *   - UtilityNodes.js: Fresnel, BumpOffset, Time, Noise, SphereMask, RotateAboutAxis, etc.
 *   - DepthNodes.js: SceneColor, SceneDepth, DepthFade, CameraDepthFade
 *   - ControlFlowNodes.js: StaticSwitch, If, Comment, Reroute nodes
 *   - SubstrateNodes.js: Substrate Slab BSDF, Vertical Layer, Horizontal Blend (UE5.1+)
 *
 * For new code, prefer importing from:
 *   import { MaterialExpressionDefinitions } from './nodes/index.js';
 *   // or import specific categories:
 *   import { MathNodes, TextureNodes } from './nodes/index.js';
 */

// Re-export everything from the modular structure
export { 
  MaterialExpressionDefinitions,
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
} from './nodes/index.js';
