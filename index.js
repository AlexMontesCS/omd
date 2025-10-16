/**
 * OMD Library - Main Entry Point
 * 
 * This is the main entry point for the OMD (On-screen Math Display) library.
 * It exports all core OMD components and visualization tools from a single endpoint.
 * 
 * Usage:
 * import { omdTable, omdBalanceHanger, omdEquationNode, omdDisplay } from '@teachinglab/omd'
 * 
 * Or for dynamic imports:
 * const { omdTable } = await import('@teachinglab/omd')
 */

// Import everything first to ensure proper loading order
import * as omdCore from './omd/core/index.js';
import * as omdCanvas from './canvas/index.js';
import * as omdVisualizations from './src/index.js';

// Re-export everything
export * from './omd/core/index.js';
export * from './canvas/index.js';
export * from './src/index.js';

// Explicitly export canvas components to ensure proper resolution
export { omdCanvas } from './canvas/core/omdCanvas.js';
export { createCanvas } from './canvas/index.js';
// Re-export canvas helpers/events so package consumers can import them from the package root
export { EventManager } from './canvas/events/eventManager.js';

// Export utility components
export { omdNodeOverlay, omdNodeOverlayPresets } from './omd/utils/omdNodeOverlay.js';

// Re-export the most commonly used components for easy access
export { omdTable } from './src/omdTable.js';
export { omdBalanceHanger } from './src/omdBalanceHanger.js';
export { omdCoordinatePlane } from './src/omdCoordinatePlane.js';
export { omdTapeDiagram } from './src/omdTapeDiagram.js';

// Export factory functions
export { createFromJSON, getSupportedTypes, isTypeSupported } from './src/omdFactory.js';

// Default export combining core and visualizations
export default {
    // Core OMD framework (from omd/core/index.js)
    core: () => import('./omd/core/index.js'),
    
    // Visualization components (from src/index.js)  
    visualizations: () => import('./src/index.js'),
    
    // Direct access to most used components
    async createTable(config) {
        const { omdTable } = await import('./src/omdTable.js');
        return new omdTable(config);
    },
    
    async createBalanceHanger(config) {
        const { omdBalanceHanger } = await import('./src/omdBalanceHanger.js');
        return new omdBalanceHanger(config);
    },
    
    async createCoordinatePlane(config) {
        const { omdCoordinatePlane } = await import('./src/omdCoordinatePlane.js');
        return new omdCoordinatePlane(config);
    },
    
    async createTapeDiagram(config) {
        const { omdTapeDiagram } = await import('./src/omdTapeDiagram.js');
        return new omdTapeDiagram(config);
    },
    
    async createEquation(equationString) {
        const { omdEquationNode } = await import('./omd/core/index.js');
        return omdEquationNode.fromString(equationString);
    },
    
    async createDisplay(container) {
        const { omdDisplay } = await import('./omd/core/index.js');
        return new omdDisplay(container);
    }
}; 