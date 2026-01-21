/**
 * Services - Re-exports all service modules.
 * Individual services have been extracted to services/ folder for better organization.
 */

// Import from extracted modules
import { Compiler } from './services/Compiler.js';
import { HistoryManager } from './services/HistoryManager.js';
import { Persistence } from './services/Persistence.js';
import { GridController } from './services/GridController.js';
import { SimulationEngine } from './services/SimulationEngine.js';

// Re-export all services for backward compatibility
export { Compiler, Persistence, GridController, HistoryManager, SimulationEngine };