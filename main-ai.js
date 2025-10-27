// OMD AI Visual Generator - Main JavaScript

// Import the factory function - this is all we need!
import { createFromJSON } from './src/omdFactory.js';

class OMDVisualGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.apiEndpoint = '/.netlify/functions/ai-omd-lookup';
    }

    initializeElements() {
        this.requestInput = document.getElementById('requestInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.jsonResult = document.getElementById('jsonResult');
        this.visualResult = document.getElementById('visualResult');
        this.copySvgBtn = document.getElementById('copySvgBtn');
        this.exampleButtons = document.querySelectorAll('.example-btn');
        // Manual JSON input elements
        this.manualJsonBtn = document.getElementById('manualJsonBtn');
        this.manualJsonSection = document.getElementById('manualJsonSection');
        this.manualJsonInput = document.getElementById('manualJsonInput');
        this.renderManualJsonBtn = document.getElementById('renderManualJsonBtn');
        this.closeManualJsonBtn = document.getElementById('closeManualJsonBtn');
        this.manualJsonError = document.getElementById('manualJsonError');
    }

    attachEventListeners() {
        // Generate button click
        this.generateBtn.addEventListener('click', () => this.generateVisual());
        // Copy SVG button click
        this.copySvgBtn.addEventListener('click', () => this.copySvgToClipboard());
        // Enter key in input
        this.requestInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateVisual();
            }
        });
        // Example button clicks
        this.exampleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const request = e.target.getAttribute('data-request');
                this.requestInput.value = request;
                this.generateVisual();
            });
        });
        // Manual JSON input button
        if (this.manualJsonBtn) {
            this.manualJsonBtn.addEventListener('click', () => {
                this.manualJsonSection.style.display = 'block';
                this.manualJsonInput.value = '';
                this.manualJsonError.style.display = 'none';
            });
        }
        // Render manual JSON button
        if (this.renderManualJsonBtn) {
            this.renderManualJsonBtn.addEventListener('click', async () => {
                const jsonText = this.manualJsonInput.value.trim();
                if (!jsonText) {
                    this.manualJsonError.textContent = 'Please enter JSON.';
                    this.manualJsonError.style.display = 'block';
                    return;
                }
                try {
                    const jsonData = JSON.parse(jsonText);
                    this.manualJsonError.style.display = 'none';
                    this.displayJSON(jsonText);
                    await this.renderVisual(jsonData);
                } catch (err) {
                    this.manualJsonError.textContent = 'Invalid JSON: ' + err.message;
                    this.manualJsonError.style.display = 'block';
                }
            });
        }
        // Close manual JSON input section
        if (this.closeManualJsonBtn) {
            this.closeManualJsonBtn.addEventListener('click', () => {
                this.manualJsonSection.style.display = 'none';
                this.manualJsonError.style.display = 'none';
            });
        }
    }

    async generateVisual() {
        const request = this.requestInput.value.trim();
        if (!request) {
            this.showError('Please enter a request');
            return;
        }

        this.setLoading(true);
        this.showMessage('Generating...', 'loading');

        try {
            // Call the AI endpoint
            const response = await fetch(`${this.apiEndpoint}?topic=${encodeURIComponent(request)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonText = await response.text();
            this.displayJSON(jsonText);

            // Parse and render the JSON
            const jsonData = JSON.parse(jsonText);
            await this.renderVisual(jsonData);
            
            this.showMessage('Generated successfully!', 'success');

        } catch (error) {
            console.error('Error:', error);
            this.showError(`Error: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    displayJSON(jsonText) {
        // Pretty format the JSON for display
        try {
            const parsed = JSON.parse(jsonText);
            this.jsonResult.textContent = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If not valid JSON, display as-is
            this.jsonResult.textContent = jsonText;
        }
    }

    async renderVisual(jsonData) {
        console.log('renderVisual called with:', jsonData);
        
        // Clear previous visual
        this.visualResult.innerHTML = '';

        if (!jsonData || !jsonData.omdType) {
            throw new Error('Invalid JSON structure - missing omdType');
        }

        try {
            // Create the OMD object using the factory function
            console.log('Creating OMD object with factory...');
            const omdObject = createFromJSON(jsonData);
            
            if (omdObject) {
                console.log('OMD object created:', omdObject);
                
                // Check if SVG object exists
                if (!omdObject.svgObject) {
                    throw new Error('OMD object has no svgObject property');
                }
                
                console.log('SVG object found:', omdObject.svgObject);
                
                // Get the OMD object's dimensions and viewBox
                const omdWidth = omdObject.width || 300;
                const omdHeight = omdObject.height || 300;
                let viewBox = `0 0 ${omdWidth} ${omdHeight}`;
                
                // For balance hanger, use its specific viewBox which handles negative coordinates
                if (jsonData.omdType === 'balanceHanger' && omdObject.svgObject.getAttribute("viewBox")) {
                    viewBox = omdObject.svgObject.getAttribute("viewBox");
                } else if (omdObject.svgObject.getAttribute("viewBox")) {
                    viewBox = omdObject.svgObject.getAttribute("viewBox");
                }
                
                console.log('Using viewBox:', viewBox);
                
                // Create an SVG wrapper element
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", omdWidth);
                svg.setAttribute("height", omdHeight);
                svg.setAttribute("viewBox", viewBox);
                svg.style.backgroundColor = "white";
                
                // Add the OMD object's group to the SVG
                svg.appendChild(omdObject.svgObject);
                console.log('OMD group added to SVG wrapper');
                
                // Create container and add the SVG
                const container = document.createElement('div');
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.minHeight = '320px'; // Ensure minimum height for balance hanger
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'center';
                container.style.padding = '20px';
                container.style.overflow = 'visible'; // Allow content to be visible even if it extends beyond
                
                // Set SVG to be responsive but maintain aspect ratio
                svg.style.maxWidth = '100%';
                svg.style.maxHeight = '100%';
                svg.style.height = 'auto';
                svg.style.width = 'auto';
                
                // Add the SVG to the container
                container.appendChild(svg);
                console.log('SVG added to container');
                
                // Add to visual result area
                this.visualResult.appendChild(container);
                console.log('Container added to visual result area');
                
                // Enable copy button and store reference to SVG
                this.currentSvg = svg;
                this.copySvgBtn.disabled = false;
                
                // Additional debug info
                console.log('Final SVG:', svg);
                console.log('Final container:', container);
            } else {
                throw new Error(`Failed to create OMD object for type: ${jsonData.omdType}`);
            }
        } catch (renderError) {
            console.error('Render error:', renderError);
            throw new Error(`Rendering failed: ${renderError.message}`);
        }
    }

    setLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        this.generateBtn.textContent = isLoading ? 'Generating...' : 'Generate';
        this.requestInput.disabled = isLoading;
    }

    showMessage(message, type = '') {
        // Remove existing message
        const existingMsg = document.querySelector('.message');
        if (existingMsg) {
            existingMsg.remove();
        }

        // Create new message
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = message;

        // Insert after input section, or fallback to body
        const inputSection = document.querySelector('.input-section');
        if (inputSection) {
            inputSection.insertAdjacentElement('afterend', msgDiv);
        } else {
            // Fallback: append to body if inputSection is missing
            document.body.appendChild(msgDiv);
        }

        // Auto-remove success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (msgDiv.parentNode) {
                    msgDiv.remove();
                }
            }, 3000);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
        this.jsonResult.textContent = `Error: ${message}`;
        this.visualResult.innerHTML = '<div style="color: #f44336;">❌ Failed to generate visual</div>';
        this.copySvgBtn.disabled = true;
        this.currentSvg = null;
    }

    async copySvgToClipboard() {
        if (!this.currentSvg) {
            this.showError('No SVG to copy');
            return;
        }

        try {
            // Clone the SVG to avoid modifying the original
            const svgClone = this.currentSvg.cloneNode(true);
            
            // Add XML namespace if not present
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
            // Get SVG dimensions
            const svgRect = this.currentSvg.getBoundingClientRect();
            const width = parseInt(svgClone.getAttribute('width')) || svgRect.width;
            const height = parseInt(svgClone.getAttribute('height')) || svgRect.height;
            
            // Create a canvas with higher resolution for better quality
            const scale = 2; // 2x resolution for crisp images
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            // Scale the context for high-DPI rendering
            ctx.scale(scale, scale);
            
            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Convert SVG to data URL
            const svgString = new XMLSerializer().serializeToString(svgClone);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            // Create an image and draw it to canvas
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = reject;
                img.src = svgUrl;
            });
            
            // Convert canvas to blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
            
            // Clean up
            URL.revokeObjectURL(svgUrl);
            
            // Visual feedback
            const originalText = this.copySvgBtn.textContent;
            const originalClass = this.copySvgBtn.className;
            
            this.copySvgBtn.textContent = '✅ Copied PNG!';
            this.copySvgBtn.className = originalClass + ' copied';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                this.copySvgBtn.textContent = originalText;
                this.copySvgBtn.className = originalClass;
            }, 2000);
            
            console.log('PNG copied to clipboard');
            
        } catch (error) {
            console.error('Failed to copy PNG:', error);
            this.showError('Failed to copy PNG to clipboard. Your browser may not support image clipboard operations.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OMDVisualGenerator();
});

// Handle any global errors
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Export for debugging
window.OMDVisualGenerator = OMDVisualGenerator;
