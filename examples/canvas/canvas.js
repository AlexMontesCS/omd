import { omdCanvas as Canvas, createCanvas } from "../../canvas/index.js";
import { EventManager as Input } from "../../canvas/events/eventManager.js";
import { FocusFrameManager } from "../../canvas/features/focusFrameManager.js";
import {jsvgGroup } from "@teachinglab/jsvg";
// ========================
// Main Entry Point
let canvasConfig = {
    tool: null,
    width: window.innerWidth,
    height: window.innerHeight
};
window.canvas = new Canvas(canvasConfig);
window.canvas.toolbar.activateTool("Pencil");

// Initialize Focus Frame Manager
window.focusFrameManager = new FocusFrameManager(window.canvas);

// Expose Focus Frame API to window for easy developer access
window.FocusFrame = {
    // Create a new focus frame
    create: (options = {}) => {
        return window.focusFrameManager.createFrame(options);
    },
    
    // Remove a focus frame
    remove: (frameId) => {
        return window.focusFrameManager.removeFrame(frameId);
    },
    
    // Get a frame by ID
    get: (frameId) => {
        return window.focusFrameManager.getFrame(frameId);
    },
    
    // Set active frame
    setActive: (frameId) => {
        return window.focusFrameManager.setActiveFrame(frameId);
    },
    
    // Capture content from active frame
    capture: () => {
        return window.focusFrameManager.captureActiveFrame();
    },
    
    // Capture all frames
    captureAll: () => {
        return window.focusFrameManager.captureAllFrames();
    },
    
    // Quick capture and convert to bitmap
    toBitmap: (frameId = null) => {
        const frame = frameId ? window.focusFrameManager.getFrame(frameId) : 
                      window.focusFrameManager.frames.values().next().value;
        return frame?.toBitmap();
    },
    
    // Quick download as image
    download: (frameId = null, filename = 'focus-frame-capture.png') => {
        const frame = frameId ? window.focusFrameManager.getFrame(frameId) : 
                      window.focusFrameManager.frames.values().next().value;
        if (frame) {
            frame.downloadAsBitmap(filename);
        }
    }
};

window.addEventListener("resize", () => window.canvas.resize());
window.canvas.svgObject.addEventListener("pointerdown", Input.onPointerDown);
window.canvas.svgObject.addEventListener("pointerup", Input.onPointerUp);
window.canvas.svgObject.addEventListener("pointermove", Input.onPointerMove);
window.canvas.svgObject.addEventListener("pointerleave", Input.onPointerLeave);

const canvasRoot = document.getElementById("canvas-ui");
canvasRoot.appendChild(window.canvas.svgObject);

function CanvasItem() {
    this.bounds = new BoundingRect({});

    this.move = (dx, dy) => {
        this.setPosition(this.xpos + dx, this.ypos + dy);
        this.bounds.updateBounds();
    }
}

// Demo function for testing Focus Frames
window.demoFocusFrame = function() {
    console.log("Creating demo focus frame...");
    
    // Create a focus frame with visible outline
    const { id, frame } = window.FocusFrame.create({
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        showOutline: true,
        outlineColor: '#ff6b35',
        outlineWidth: 3,
        outlineDashed: true
    });
    
    window.FocusFrame.setActive(id);
    
    console.log(`Focus frame created with ID: ${id}`);
    console.log("Draw something in the frame, then run: window.FocusFrame.capture()");
    console.log("To convert to bitmap: window.FocusFrame.toBitmap()");
    console.log("To download as image: window.FocusFrame.download()");
    
    return { id, frame };
};