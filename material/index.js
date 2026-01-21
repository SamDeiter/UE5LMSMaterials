/**
 * Material Editor - Barrel Exports
 * Import all core modules from this single entry point.
 */

// Core graph modules
export { MaterialGraphController } from './core/MaterialGraphController.js';
export { MaterialInputController } from './core/MaterialInputController.js';
export { MaterialWiringController } from './core/MaterialWiringController.js';
export { 
    materialNodeRegistry, 
    MaterialNode, 
    PinTypes,
    TypeCompatibility 
} from './core/MaterialNodeFramework.js';

// Engine
export { ShaderEvaluator } from './engine/ShaderEvaluator.js';
export { textureManager } from './engine/TextureManager.js';

// UI Controllers
export { PaletteController } from './ui/PaletteController.js';
export { DetailsController } from './ui/MaterialDetailsController.js';
export { ViewportController } from './ui/ViewportController.js';
