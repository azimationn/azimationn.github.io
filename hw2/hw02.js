import { setupText } from './util.js';

// Get the canvas and WebGL 2 context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set initial canvas size
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
gl.viewport(0, 0, canvas.width, canvas.height);

// Resize viewport while maintaining aspect ratio
window.addEventListener('resize', () => {
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
    } else {
        newHeight = newWidth / aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
});

// Initialize WebGL settings
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Function to load shader source from a file
async function loadShaderSource(url) {
    const response = await fetch(url);
    return await response.text();
}

// Function to compile shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to create shader program
async function createProgram(gl, vertexShaderUrl, fragmentShaderUrl) {
    const vertexShaderSource = await loadShaderSource(vertexShaderUrl);
    const fragmentShaderSource = await loadShaderSource(fragmentShaderUrl);

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Immediately invoked async function to initialize the program
(async () => {
    const program = await createProgram(gl, 'vertexShader.glsl', 'fragmentShader.glsl');
    if (!program) {
        console.error('Failed to create shader program.');
        return;
    }

    // Square vertices with length and height of 0.2
    let vertices = new Float32Array([
        -0.1, -0.1, 0.0,  // Bottom left
         0.1, -0.1, 0.0,  // Bottom right
         0.1,  0.1, 0.0,  // Top right
        -0.1,  0.1, 0.0   // Top left
    ]);

    // Create Vertex Array Object
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Link vertex data
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Rectangle position
    let rectX = 0.0;
    let rectY = 0.0;

    // Function to update rectangle position
    function updateRectanglePosition(dx, dy) {
        let newX = rectX + dx;
        let newY = rectY + dy;

        // Boundary checks
        if (newX > 0.9) newX = 0.9;
        if (newX < -0.9) newX = -0.9;
        if (newY > 0.9) newY = 0.9;
        if (newY < -0.9) newY = -0.9;

        rectX = newX;
        rectY = newY;

        vertices = new Float32Array([
            -0.1 + rectX, -0.1 + rectY, 0.0,  // Bottom left
             0.1 + rectX, -0.1 + rectY, 0.0,  // Bottom right
             0.1 + rectX,  0.1 + rectY, 0.0,  // Top right
            -0.1 + rectX,  0.1 + rectY, 0.0   // Top left
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        render();
    }

    // Event listener for keydown
    window.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp') {
            updateRectanglePosition(0.0, 0.01); // Move up
        } else if (event.key === 'ArrowDown') {
            updateRectanglePosition(0.0, -0.01); // Move down
        } else if (event.key === 'ArrowLeft') {
            updateRectanglePosition(-0.01, 0.0); // Move left
        } else if (event.key === 'ArrowRight') {
            updateRectanglePosition(0.01, 0.0); // Move right
        }
    });

    // Render loop
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw using TRIANGLE_FAN
    }

    // Display message using the utility function
    const message = "Use arrow keys to move the rectangle";
    setupText(message);

    // Start rendering
    render();
})();