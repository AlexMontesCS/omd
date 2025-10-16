# omdTranscriptionService

The `omdTranscriptionService` class provides an interface to an AI-powered transcription service for handwritten content. It sends image data to a server-side endpoint for processing, abstracting away the complexities of AI model interaction and API key management.

## Class Definition

```javascript
export class omdTranscriptionService
```

## Constructor

### `new omdTranscriptionService([options])`

Creates a new `omdTranscriptionService` instance.

-   **`options`** (`object`, optional): Configuration options for the service:
    -   `endpoint` (`string`): The server endpoint for the transcription service. Defaults to `'/.netlify/functions/transcribe'`.
    -   `defaultProvider` (`string`): The default transcription provider to use. Defaults to `'gemini'`.

## Public Properties

-   **`options`** (`object`): The configuration options for the service, including `endpoint` and `defaultProvider`.

## Public Methods

### `async transcribe(imageBlob, [options])`

Transcribes an image containing handwritten content by sending it to the configured server endpoint. The image is converted to base64 before transmission.

-   **`imageBlob`** (`Blob`): The image blob to transcribe.
-   **`options`** (`object`, optional): Transcription options:
    -   `prompt` (`string`): A custom prompt for the transcription service. If not provided, a default mathematical transcription prompt is used.
-   **Returns**: `Promise<object>` - A promise that resolves with the transcription result, containing the `text`, `provider`, and `confidence`.
-   **Throws**: `Error` if the API call fails.

### `async transcribeWithFallback(imageBlob, [options])`

Transcribes an image with a fallback mechanism. Currently, this method simply calls `transcribe()`, but it is designed to allow for future implementations of fallback transcription providers or strategies.

-   **`imageBlob`** (`Blob`): The image blob to transcribe.
-   **`options`** (`object`, optional): Transcription options.
-   **Returns**: `Promise<object>` - A promise that resolves with the transcription result.

### `isAvailable()`

Checks if the transcription service is available. In the current implementation, this always returns `true` as it relies on a serverless function endpoint.

-   **Returns**: `boolean` - `true` if the service is available, `false` otherwise.

### `getAvailableProviders()`

Gets the list of available transcription providers. In the current implementation, this always returns `['gemini']` as the server handles the actual provider selection.

-   **Returns**: `Array<string>` - An array of available provider names.

### `isProviderAvailable(provider)`

Checks if a specific transcription provider is available. In the current implementation, this only returns `true` for the `'gemini'` provider.

-   **`provider`** (`string`): The name of the provider to check.
-   **Returns**: `boolean` - `true` if the provider is available, `false` otherwise.

## Internal Methods

-   **`_getDefaultEndpoint()`**: Returns the default server endpoint URL for the transcription service (`'/.netlify/functions/transcribe'`).
-   **`_blobToBase64(blob)`**: Converts an `imageBlob` into a base64 encoded string, suitable for sending in a JSON payload.

## Example Usage

```javascript
import { omdTranscriptionService } from '@teachinglab/omd';

// Create a transcription service instance
const transcriptionService = new omdTranscriptionService();

// Assume getMyImageBlob() is a function that returns an image Blob
async function getMyImageBlob() {
    // Example: Create a dummy canvas and get its blob
    const canvas = document.createElement('canvas');
    canvas.width = 100; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.fillText('2x + 3', 10, 30);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// Get an image blob from a canvas or file input
const imageBlob = await getMyImageBlob();

// Transcribe the image
const result = await transcriptionService.transcribe(imageBlob, {
    prompt: 'Transcribe the handwritten math equation. Return only the mathematical expression.'
});

console.log(result.text); // The transcribed text (e.g., "2x + 3")
```