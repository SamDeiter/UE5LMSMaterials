/**
 * Material Expression Node Definitions - Modular Structure
 * 
 * This barrel export combines all node category modules into a single
 * MaterialExpressionDefinitions object for backward compatibility.
 * 
 * Structure:
 * - OutputNodes.js: Main Material Output Node
 * - ConstantNodes.js: Constant, Constant2Vector, etc.
 * - ParameterNodes.js: Scalar/Vector/Texture Parameters
 * 
 * The remaining nodes are still in the legacy file and will be 
 * extracted incrementally.
 */

import { OutputNodes } from './OutputNodes.js';
import { ConstantNodes } from './ConstantNodes.js';
import { ParameterNodes } from './ParameterNodes.js';

// Combine all node modules into a single export
export const MaterialExpressionDefinitions = {
  ...OutputNodes,
  ...ConstantNodes,
  ...ParameterNodes,
};

// Also export individual modules for direct imports
export { OutputNodes, ConstantNodes, ParameterNodes };
