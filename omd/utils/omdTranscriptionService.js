/**
 * omdTranscriptionService - AI-powered transcription service for handwritten content
 */

/**
 * Transcription service using server endpoint
 */
export class omdTranscriptionService {
    constructor(options = {}) {
        this.options = {
            endpoint: options.endpoint || this._getDefaultEndpoint(),
            defaultProvider: options.defaultProvider || 'openai',
            defaultModel: options.defaultModel || 'gpt-4o',
            ...options
        };
    }
    
    /**
     * Get the default endpoint based on current environment
     * @private
     */
    _getDefaultEndpoint() {
        return '/.netlify/functions/transcribe';
    }
    
    /**
     * Convert blob to base64
     * @private
     */
    async _blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    /**
     * Transcribe an image using the server endpoint
     * @param {Blob} imageBlob - The image blob to transcribe
     * @param {Object} options - Transcription options
     * @param {string} options.prompt - Custom prompt for transcription
     * @returns {Promise<Object>} Transcription result
     */
    async transcribe(imageBlob, options = {}) {
        try {

            
            // Convert blob to base64
            const base64Image = await this._blobToBase64(imageBlob);
            
            // Call server endpoint
            const response = await fetch(this.options.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageBase64: base64Image,
                    prompt: options.prompt || 'Please transcribe the handwritten mathematical expression in this image. Return only the mathematical expression in pure format (no LaTeX, no dollar signs). For powers use ^, for fractions use /, for square roots use sqrt().',
                    model: options.model || this.options.defaultModel,
                    provider: options.provider || this.options.defaultProvider
                })
            });
            
            if (!response.ok) {
                throw new Error(`Transcription API error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();

            
            return {
                text: (result.text || '').trim(),
                provider: result.provider || this.options.defaultProvider,
                model: result.model || (options.model || this.options.defaultModel),
                confidence: result.confidence || 1.0
            };
            
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }
    
    /**
     * Transcribe with fallback (same as transcribe for now)
     * @param {Blob} imageBlob - The image blob to transcribe
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeWithFallback(imageBlob, options = {}) {
        return this.transcribe(imageBlob, options);
    }
    
    /**
     * Check if transcription service is available
     * @returns {boolean} True if service is available
     */
    isAvailable() {
        return true; // Always available since we use server endpoint
    }
    
    /**
     * Get available providers (simplified)
     * @returns {Array} List of available providers
     */
    getAvailableProviders() {
        return ['openai']; // Server handles actual model execution
    }
    
    /**
     * Check if a specific provider is available
     * @param {string} provider - Provider name
     * @returns {boolean} True if provider is available
     */
    isProviderAvailable(provider) {
        return provider === 'openai';
    }
} 