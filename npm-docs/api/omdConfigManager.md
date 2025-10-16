# omdConfigManager

A module for managing the configuration of the OMD library. It handles loading settings from a JSON file, providing default values, and allowing runtime modifications.

## Overview

The configuration is managed as a single JSON object. The system can be initialized with a path to a `omdConfig.json` file, or it will fall back to a default configuration. The manager supports both asynchronous and synchronous access to configuration values.

### Default Configuration

If no `omdConfig.json` is found, the following default structure is used:

```json
{
    "multiplication": {
        "symbol": "·",
        "forceImplicit": false,
        "implicitCombinations": {
            "constantVariable": true,
            "variableConstant": false,
            "parenthesisAfterVariable": true,
            "parenthesisAfterConstant": true,
            "variableParenthesis": true,
            "parenthesisParenthesis": true,
            "parenthesisVariable": true,
            "parenthesisConstant": true,
            "variableVariable": true
        }
    },
    "stepVisualizer": {
        "dotSizes": {
            "level0": 8,
            "level1": 6,
            "level2": 4
        },
        "fontWeights": {
            "level0": 400,
            "level1": 400,
            "level2": 400
        }
    }
}
```

## Core Functions

### `async initializeConfig(configSource)`

Loads the configuration from a file or object. It automatically detects the environment (browser or Node.js) to use the appropriate file loading mechanism (`fetch` or `fs`). This should be called once when your application starts.

-   **`configSource`** (`string` | `object`, optional): A path to a JSON configuration file or a configuration object to use directly.
-   **Returns**: `Promise<void>`

### `async getConfig()`

Asynchronously gets the entire configuration object. If it hasn't been loaded yet, it will trigger the loading process with default settings.

-   **Returns**: `Promise<object>` - A promise that resolves to the configuration object.

### `getConfigSync()`

Synchronously gets the configuration object. 

**Warning:** If called before `initializeConfig` has completed, this will return the default configuration, not the loaded one.

-   **Returns**: `object` - The configuration object.

### `setConfig(config)`

Sets the entire configuration directly, merging it with the default values.

-   **`config`** (`object`): The configuration object to set.

### `getConfigValue(path)`

Gets a specific configuration value using a dot-separated path (e.g., `'multiplication.symbol'`).

-   **Returns**: The value at the specified path.

### `setConfigValue(path, value)`

Sets a specific configuration value using a dot-separated path.

## Utility Functions

-   **`getMultiplicationSymbol()`**: Returns the configured symbol for multiplication.
-   **`useImplicitMultiplication(combination)`**: Checks if implicit multiplication should be used, either globally or for a specific combination of operand types.
-   **`getDotRadius(level)`**: Gets the dot radius for a given step level in the `omdStepVisualizer`.
-   **`getFontWeight(level)`**: Gets the font weight for a given step level.
-   **`getDefaultConfig()`**: Returns a copy of the default configuration object.
-   **`isEnabled(category, setting)`**: Checks if a specific boolean setting is enabled.
-   **`updateConfig(category, setting, value)`**: Updates a top-level configuration setting.
-   **`resetConfig()`**: Throws an error. Direct file editing is required to reset the configuration.
-   **`async reloadConfig()`**: Forces a reload of the configuration from the original file path.
-   **`async getConfigAsync()`**: An alias for `getConfig()`.

## Example

```javascript
import { initializeConfig, getConfigValue, setConfigValue } from '@teachinglab/omd';

// Initialize at the start of your application
(async () => {
    await initializeConfig();

    // Get a specific value
    const multSymbol = getConfigValue('multiplication.symbol'); // -> '·'

    // Change a value at runtime
    setConfigValue('multiplication.symbol', '*');
    const newSymbol = getConfigValue('multiplication.symbol'); // -> '*'
})();
```