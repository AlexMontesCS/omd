# Netlify Function: transcribe

This Netlify serverless function provides a backend for the `omdTranscriptionService`. It receives an image, sends it to the Gemini API for transcription, and returns the result.

## Endpoint

`/.netlify/functions/transcribe`

## Method

`POST`

## Request Body

The request body should be a JSON object with the following properties:

*   **imageBase64** (`string`, required): The base64 encoded image data (without the `data:image/png;base64,` prefix).
*   **prompt** (`string`, optional): A custom prompt to guide the transcription. If not provided, a default prompt for mathematical expressions is used.

## Responses

### Success Response (200 OK)

A successful response will be a JSON object with the following properties:

*   **text** (`string`): The transcribed text.
*   **provider** (`string`): The transcription provider used (always `'gemini'`).
*   **confidence** (`number`): The confidence score of the transcription (currently hardcoded to `1.0`).

### Error Responses

*   **400 Bad Request**: This error is returned if the `imageBase64` property is missing from the request body.
*   **500 Internal Server Error**: This error is returned if there is an issue with the transcription process on the server, such as an error from the Gemini API.

## Environment Variables

This function requires the following environment variable to be set in your Netlify environment:

*   `GEMINI_API_KEY`: Your API key for the Gemini service.

## CORS

The function is configured to allow cross-origin requests from any origin.
