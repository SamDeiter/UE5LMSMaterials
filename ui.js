/**
 * UI Panel Logic: VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController.
 * This file handles all side panel and menu interactions.
 * 
 * REFACTOR NOTE: This file now serves as an aggregator for the individual controller modules.
 */
/**
 * UI Panel Logic: VariableController, PaletteController, ActionMenu, ContextMenu, DetailsController.
 * This file handles all side panel and menu interactions.
 * 
 * REFACTOR NOTE: This file now serves as an aggregator for the individual controller modules.
 */

import { LayoutController } from './ui/LayoutController.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { VariableController } from './ui/VariableController.js';
import { PaletteController } from './ui/PaletteController.js';
import { ActionMenu } from './ui/ActionMenu.js';
import { DetailsController } from './ui/DetailsController.js';
import { TaskController } from './ui/TaskController.js';

export {
    LayoutController,
    ContextMenu,
    VariableController,
    PaletteController,
    ActionMenu,
    DetailsController,
    TaskController
};