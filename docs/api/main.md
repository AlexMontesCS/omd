# main.js - OMD AI Visual Generator

This `main.js` file powers the OMD AI Visual Generator, an interactive web page that uses AI to create mathematical visualizations from natural language prompts.

## Core Functionality: The `OMDVisualGenerator` Class

The entire application is encapsulated within the `OMDVisualGenerator` class, which manages the UI, handles user input, and orchestrates the process of generating and rendering visuals.

### Initialization

When the DOM is loaded, a new `OMDVisualGenerator` instance is created. The constructor calls:

-   `initializeElements()`: Caches references to all necessary DOM elements (input fields, buttons, result panels).
-   `attachEventListeners()`: Sets up all event listeners for user interactions.

### Event Listeners

The application responds to the following user actions:

-   **Generate Button Click / Enter Key**: Triggers the `generateVisual()` method.
-   **Example Buttons**: Populate the input field with a predefined request and trigger `generateVisual()`.
-   **Copy SVG Button**: Calls `copySvgToClipboard()` to save the generated visual.
-   **Manual JSON Input**: A separate workflow allows users to bypass the AI and render a visual directly from their own OMD JSON.

## Visual Generation Process

The core workflow is handled by the `generateVisual()` method:

1.  **Get Input**: Retrieves the user's natural language request from the input field.
2.  **Set Loading State**: Disables the UI to prevent multiple submissions while a request is in progress.
3.  **API Call**: Sends a `fetch` request to the Netlify serverless function at `/.netlify/functions/ai-omd-lookup`. The user's request is passed as a URL parameter.
4.  **Receive JSON**: The serverless function (not detailed in this file) communicates with an AI service and returns a JSON object that conforms to the OMD specification for a particular visual (e.g., a `balanceHanger` or `tapeDiagram`).
5.  **Display JSON**: The raw JSON response is pretty-printed and displayed in the UI for inspection.
6.  **Render Visual**: The `renderVisual(jsonData)` method is called.

## Rendering the Visual (`renderVisual`)

This method is responsible for turning the AI-generated JSON into an SVG image:

1.  **Clear Previous Visual**: Removes any existing SVG from the display area.
2.  **Select OMD Class**: A `switch` statement reads the `omdType` property from the JSON to determine which OMD class to instantiate (e.g., `omdBalanceHanger`, `omdTable`).
3.  **Load Data**: The `loadFromJSON(jsonData)` method of the instantiated OMD object is called, configuring the object based on the AI-provided data.
4.  **Create SVG**: An SVG wrapper is created, and the OMD object's internal SVG group (`omdObject.svgObject`) is appended to it.
5.  **Display SVG**: The final SVG is added to the `visualResult` panel in the DOM.

## Manual JSON Input

For testing and debugging, users can click the "Manual JSON Input" button to reveal a text area. They can paste their own OMD-compliant JSON and click "Render" to see it visualized, skipping the AI step entirely.

## Utility Methods

-   **`copySvgToClipboard()`**: An advanced feature that converts the generated SVG into a high-resolution PNG and uses the Clipboard API (`navigator.clipboard.write`) to copy it to the user's clipboard.
-   **`setLoading(isLoading)`**: Toggles the disabled state of UI elements.
-   **`showMessage(message, type)` / `showError(message)`**: Displays status messages (e.g., "Generating...", "Error") to the user.

## Usage

This script is designed to be used with an `index.html` file that provides the necessary UI layout. It allows users to:

-   Enter a description of a math concept (e.g., "a balance hanger with 2x + 3 on the left and 7 on the right").
-   Click "Generate" to see it visualized by the AI.
-   Inspect the underlying OMD JSON.
-   Copy the resulting visual as a PNG image.