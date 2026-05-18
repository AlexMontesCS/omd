/**
 * OMD Configuration Manager
 * Dynamically loads and manages configuration from JSON file
 */

// Configuration data - will be loaded from JSON or provided by user
let configData = null;
let configLoadPromise = null;

// Default configuration (fallback when no config file is available)
const defaultConfig = {
    multiplication: {
        symbol: "·",
        forceImplicit: false,
        implicitCombinations: {
            constantVariable: true,
            variableConstant: false,
            parenthesisAfterVariable: true,
            parenthesisAfterConstant: true,
            variableParenthesis: true,
            parenthesisParenthesis: true,
            parenthesisVariable: true,
            parenthesisConstant: true,
            variableVariable: true
        }
    },
    stepVisualizer: {
        dotSizes: {
            level0: 8,
            level1: 8,
            level2: 8
        },
        fontWeights: {
            level0: 400,
            level1: 400,
            level2: 400
        }
    }
};

/**
 * Loads configuration from JSON file or uses default
 * @param {string|Object} configSource - Optional path to config file or config object
 * @returns {Promise<Object>} Promise that resolves to the configuration object
 */
async function loadConfig(configSource = null) {
    if (configLoadPromise && !configSource) {
        return configLoadPromise;
    }

    // If a config object is provided directly, use it
    if (configSource && typeof configSource === 'object') {
        configData = { ...defaultConfig, ...configSource };
        return configData;
    }

    configLoadPromise = (async () => {
        try {
            // Detect environment and use appropriate loading method
            if (typeof window !== 'undefined') {
                // Browser environment - use fetch
                const configPath = configSource || './omd/config/omdConfig.json';
                const response = await fetch(configPath);
                if (!response.ok) {
                    console.warn(`Config file not found at ${configPath}, using default configuration`);
                    configData = defaultConfig;
                    return configData;
                }
                
                const configText = await response.text();
                const loadedConfig = JSON.parse(configText);
                configData = { ...defaultConfig, ...loadedConfig };
                return configData;
                
            } else {
                // Server/Node.js environment - use filesystem access when available
                const isNodeEnvironment = typeof process !== 'undefined' && !!(process.versions && process.versions.node);
                if (!isNodeEnvironment) {
                    console.warn('Config loading skipped: filesystem APIs unavailable in this environment. Using default configuration.');
                    configData = defaultConfig;
                    return configData;
                }

                try {
                    const fs = await import('node:fs/promises');
                    const path = await import('node:path');
                    const { fileURLToPath } = await import('node:url');
                    
                    const __dirname = path.dirname(fileURLToPath(import.meta.url));
                    const configPath = configSource || path.join(__dirname, 'omdConfig.json');
                    
                    try {
                        const fileContent = await fs.readFile(configPath, 'utf-8');
                        const loadedConfig = JSON.parse(fileContent);
                        configData = { ...defaultConfig, ...loadedConfig };
                    } catch (err) {
                        console.warn(`Config file not found at ${configPath}, using default configuration`);
                        configData = defaultConfig;
                    }
                } catch (nodeImportError) {
                    console.warn('Config loading skipped: unable to access Node filesystem APIs. Using default configuration.', nodeImportError);
                    configData = defaultConfig;
                }
                return configData;
            }
        } catch (error) {
            console.warn('Error loading config, using default configuration:', error);
            configData = defaultConfig;
            return configData;
        }
    })();

    return configLoadPromise;
}

/**
 * Gets the configuration object, loading it if necessary
 * @returns {Promise<Object>} Promise that resolves to the configuration object
 */
async function getConfig() {
    if (!configData) {
        await loadConfig();
    }
    return configData;
}

/**
 * Gets the configuration object synchronously (for backwards compatibility)
 * If config hasn't been loaded yet, returns default config
 * @returns {Object} The configuration object
 */
function getConfigSync() {
    if (!configData) {
        // Auto-initialize with defaults if not loaded
        configData = defaultConfig;
    }
    return configData;
}

/**
 * Initialize configuration loading (call this early in app lifecycle)
 * @param {string|Object} configSource - Optional path to config file or config object
 * @returns {Promise<void>}
 */
export async function initializeConfig(configSource = null) {
    await loadConfig(configSource);
}

/**
 * Set configuration directly without loading from file
 * @param {Object} config - Configuration object
 */
export function setConfig(config) {
    configData = { ...defaultConfig, ...config };
}

/**
 * Get the default configuration
 * @returns {Object} The default configuration object
 */
export function getDefaultConfig() {
    return { ...defaultConfig };
}

/**
 * Utility function to check if a specific feature is enabled
 * @param {string} category - The configuration category (e.g., 'multiplication', 'simplification')
 * @param {string} setting - The specific setting to check
 * @returns {boolean} Whether the setting is enabled
 */
export function isEnabled(category, setting) {
    const config = getConfigSync();
    return config[category]?.[setting] ?? false;
}

/**
 * Check if implicit multiplication should be used for a specific combination
 * @param {string} combination - The type of combination (e.g., 'constantVariable')
 * @returns {boolean} Whether implicit multiplication should be used
 */
export function useImplicitMultiplication(combination = null) {
    const config = getConfigSync();
    if (combination) {
        return config.multiplication.implicitCombinations[combination] ?? false;
    }
    return config.multiplication.forceImplicit;
}

/**
 * Get the configured multiplication symbol
 * @returns {string} The multiplication symbol to use for display
 */
export function getMultiplicationSymbol() {
    const config = getConfigSync();
    return config.multiplication.symbol;
}

/**
 * Update configuration settings at runtime
 * @param {string} category - The configuration category
 * @param {string} setting - The setting to update
 * @param {any} value - The new value
 */
export function updateConfig(category, setting, value) {
    const config = getConfigSync();
    if (config[category] && config[category].hasOwnProperty(setting)) {
        config[category][setting] = value;
    }
}

/**
 * Get a configuration value by path
 * @param {string} path - Dot-separated path to the config value (e.g., 'multiplication.symbol')
 * @returns {any} The configuration value
 */
export function getConfigValue(path) {
    const config = getConfigSync();
    return path.split('.').reduce((obj, key) => obj?.[key], config);
}

/**
 * Set a configuration value by path  
 * @param {string} path - Dot-separated path to the config value
 * @param {any} value - The new value
 */
export function setConfigValue(path, value) {
    const config = getConfigSync();
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, config);
    target[lastKey] = value;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    throw new Error('resetConfig not available - edit omdConfig.json file directly');
}

/**
 * Reload configuration from JSON file
 * @returns {Promise<Object>} Promise that resolves to the reloaded configuration
 */
export async function reloadConfig() {
    configData = null;
    configLoadPromise = null;
    return await loadConfig();
}

/**
 * Get the raw configuration object (async)
 * @returns {Promise<Object>} Promise that resolves to the configuration object
 */
export async function getConfigAsync() {
    return await getConfig();
}

/**
 * Get dot radius for a given step level (0,1,2)
 * @param {number} level
 * @returns {number}
 */
export function getDotRadius(level=0){
    const cfg=getConfigSync();
    const key=`level${level}`;
    return cfg.stepVisualizer?.dotSizes?.[key]??6;
}

/**
 * Get font weight for a given step level (0,1,2)
 * @param {number} level
 * @returns {number}
 */
export function getFontWeight(level=0){
    const cfg=getConfigSync();
    const key=`level${level}`;
    return cfg.stepVisualizer?.fontWeights?.[key]??400;
} 
