# Configuration Options

This document details all available configuration options for the OMD library, managed by the `omdConfigManager` module. These options allow you to customize various aspects of the library's behavior, appearance, and mathematical preferences.

## Overview

The OMD configuration is a single JavaScript object that can be loaded from a JSON file or set programmatically. It is organized into logical categories.

## Default Configuration Structure

If no custom configuration is provided, the library uses the following default structure:

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

## Configuration Categories and Options

### `multiplication`

Settings related to how multiplication is displayed and handled.

-   **`symbol`** {string}
    -   The character used to represent multiplication. Default: `"·"` (middle dot).
    -   Example: `"*"` or `"×"`.

-   **`forceImplicit`** {boolean}
    -   If `true`, implicit multiplication (e.g., `2x` instead of `2 * x`) is always used where mathematically valid, overriding `implicitCombinations`.
    -   Default: `false`.

-   **`implicitCombinations`** {Object}
    -   An object defining specific scenarios where implicit multiplication should be used. Each property is a boolean.
    -   **`constantVariable`** {boolean}: `2x` (Default: `true`)
    -   **`variableConstant`** {boolean}: `x2` (Default: `false`)
    -   **`parenthesisAfterVariable`** {boolean}: `x(y+z)` (Default: `true`)
    -   **`parenthesisAfterConstant`** {boolean}: `2(x+y)` (Default: `true`)
    -   **`variableParenthesis`** {boolean}: `(x+y)z` (Default: `true`)
    -   **`parenthesisParenthesis`** {boolean}: `(x+y)(a+b)` (Default: `true`)
    -   **`parenthesisVariable`** {boolean}: `(x+y)z` (Default: `true`)
    -   **`parenthesisConstant`** {boolean}: `(x+y)2` (Default: `true`)
    -   **`variableVariable`** {boolean}: `xy` (Default: `true`)

### `stepVisualizer`

Settings specific to the `omdStepVisualizer` component, controlling the appearance of step dots and text.

-   **`dotSizes`** {Object}
    -   Defines the radius of the step dots based on their importance level.
    -   **`level0`** {number}: Radius for major steps. Default: `8`.
    -   **`level1`** {number}: Radius for minor steps. Default: `6`.
    -   **`level2`** {number}: Radius for detailed steps. Default: `4`.

-   **`fontWeights`** {Object}
    -   Defines the font weight for the equations based on their importance level.
    -   **`level0`** {number}: Font weight for major steps. Default: `400`.
    -   **`level1`** {number}: Font weight for minor steps. Default: `400`.
    -   **`level2`** {number}: Font weight for detailed steps. Default: `400`.

## Usage

Configuration options can be set during initialization or updated at runtime using the `omdConfigManager` functions.

### `initializeConfig(configSource)`

Initializes the configuration by loading it from a file or object. This should be called early in the application lifecycle.

-   **`configSource`** {string|Object} (optional) - The path to a JSON configuration file or a configuration object.

```javascript
import { initializeConfig } from '@teachinglab/omd';

// Initialize with a custom config file
await initializeConfig('./my-custom-omd-config.json');
```

### `setConfig(config)`

Sets the configuration directly, bypassing file loading.

-   **`config`** {Object} - A configuration object.

```javascript
import { setConfig } from '@teachinglab/omd';

setConfig({
    multiplication: {
        symbol: '*'
    }
});
```

### `getDefaultConfig()`

Returns a copy of the default configuration object.

-   **Returns** {Object} - The default configuration.

### `isEnabled(category, setting)`

Checks if a specific feature is enabled in the configuration.

-   **`category`** {string} - The configuration category (e.g., 'multiplication').
-   **`setting`** {string} - The specific setting to check.
-   **Returns** {boolean} - `true` if the setting is enabled, `false` otherwise.

### `useImplicitMultiplication(combination)`

Checks if implicit multiplication should be used for a specific combination of terms.

-   **`combination`** {string} (optional) - The type of combination (e.g., 'constantVariable'). If not provided, it checks the `forceImplicit` setting.
-   **Returns** {boolean} - `true` if implicit multiplication should be used.

### `getMultiplicationSymbol()`

Returns the configured multiplication symbol.

-   **Returns** {string} - The multiplication symbol.

### `updateConfig(category, setting, value)`

Updates a configuration setting at runtime.

-   **`category`** {string} - The configuration category.
-   **`setting`** {string} - The setting to update.
-   **`value`** {any} - The new value.

### `getConfigValue(path)`

Retrieves a configuration value using a dot-separated path.

-   **`path`** {string} - The path to the value (e.g., 'multiplication.symbol').
-   **Returns** {any} - The configuration value.

### `setConfigValue(path, value)`

Sets a configuration value using a dot-separated path.

-   **`path`** {string} - The path to the value.
-   **`value`** {any} - The new value.

### `resetConfig()`

Resets the configuration to its default state. Note: In the current implementation, this throws an error and advises to edit the `omdConfig.json` file directly.

### `reloadConfig()`

Reloads the configuration from the JSON file.

-   **Returns** {Promise<Object>} - A promise that resolves to the reloaded configuration object.

### `getConfigAsync()`

Asynchronously retrieves the configuration object, loading it if necessary.

-   **Returns** {Promise<Object>} - A promise that resolves to the configuration object.

### `getDotRadius(level)`

Gets the dot radius for a given step level in the step visualizer.

-   **`level`** {number} (optional, default: 0) - The step level (0, 1, or 2).
-   **Returns** {number} - The dot radius.

### `getFontWeight(level)`

Gets the font weight for a given step level in the step visualizer.

-   **`level`** {number} (optional, default: 0) - The step level (0, 1, or 2).
-   **Returns** {number} - The font weight.

