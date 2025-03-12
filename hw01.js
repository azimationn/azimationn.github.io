// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set initial canvas size to 500x500
const initialSize = 500;
canvas.width = initialSize;
canvas.height = initialSize;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);

// Start rendering
render();

// Render loop
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
    
    // Divide the canvas into four regions and fill them with different colors
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    // Top-left (red)
    gl.scissor(0, halfHeight, halfWidth, halfHeight);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(1.0, 0.0, 0.0, 1.0); // Red
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    // Top-right (green)
    gl.scissor(halfWidth, halfHeight, halfWidth, halfHeight);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0.0, 1.0, 0.0, 1.0); // Green
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    // Bottom-left (blue)
    gl.scissor(0, 0, halfWidth, halfHeight);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0.0, 0.0, 1.0, 1.0); // Blue
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    // Bottom-right (yellow)
    gl.scissor(halfWidth, 0, halfWidth, halfHeight);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(1.0, 1.0, 0.0, 1.0); // Yellow
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
}

// Resize viewport when window size changes
window.addEventListener('resize', () => {
    // Mantain 1:1 aspect ratio
    const size = Math.min(window.innerWidth,window.innerHeight)
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

