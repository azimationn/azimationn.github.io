import { resizeAspectRatio, Axes } from './util.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error("WebGL 2.0 context not available");
}

// Initialize canvas and viewport
canvas.width = 700;
canvas.height = 700;
resizeAspectRatio(gl, canvas);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.1, 0.2, 0.3, 1.0); // background

let shaderProgram;
let squareVAO;
let axes;
let textOverlay;

async function loadShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load shader: ${url}`);
    }
    return await response.text();
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program linking error: " + gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

async function setupShaderProgram() {
    try {
        const vertexShaderSource = await loadShader('shVert.glsl');
        const fragmentShaderSource = await loadShader('shFrag.glsl');

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        if (!vertexShader || !fragmentShader) {
            return false;
        }

        shaderProgram = createProgram(gl, vertexShader, fragmentShader);
        return !!shaderProgram;

    } catch (e) {
        console.error("Shader setup failed:", e);
        return false;
    }
}

function setupSquareBuffers() {
    const vertices = new Float32Array([
        -0.5,  0.5, 0.0,  // Top-left
        -0.5, -0.5, 0.0,  // Bottom-left
         0.5, -0.5, 0.0,  // Bottom-right
         0.5,  0.5, 0.0   // Top-right
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    squareVAO = gl.createVertexArray();
    gl.bindVertexArray(squareVAO);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function setupAxes() {
    // Create axes with length 1.5 (long enough to be visible)
    axes = new Axes(gl, 1.5);
}

const objects = {
    sun: {
        color: [1.0, 0.0, 0.0, 1.0], // Red
        size: 0.2,
        rotationSpeed: 45 * Math.PI / 180, // radians per second
    },
    earth: {
        color: [0.0, 1.0, 1.0, 1.0], // Cyan
        size: 0.1,
        rotationSpeed: 180 * Math.PI / 180,
        orbitRadius: 0.7,
        orbitSpeed: 30 * Math.PI / 180,
    },
    moon: {
        color: [1.0, 1.0, 0.0, 1.0], // Yellow
        size: 0.05,
        rotationSpeed: 180 * Math.PI / 180,
        orbitRadius: 0.2,
        orbitSpeed: 360 * Math.PI / 180,
    }
};

function drawObject(object, modelMatrix) {
    gl.useProgram(shaderProgram);

    const u_model = gl.getUniformLocation(shaderProgram, "u_model");
    gl.uniformMatrix4fv(u_model, false, modelMatrix);

    const u_color = gl.getUniformLocation(shaderProgram, "u_color");
    gl.uniform4fv(u_color, object.color);

    gl.bindVertexArray(squareVAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}

let lastTime = 0;
function animate(currentTime) {
    const time = (currentTime - lastTime) / 1000; // Delta time in seconds
    lastTime = currentTime;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw axes first (background)
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix, -1, 1, -1, 1, -1, 1);
    axes.draw(viewMatrix, projectionMatrix);

    // Sun (centered, rotates on its own)
    const sunModelMatrix = mat4.create();
    mat4.rotateZ(sunModelMatrix, sunModelMatrix, objects.sun.rotationSpeed * currentTime / 1000);
    mat4.scale(sunModelMatrix, sunModelMatrix, [objects.sun.size, objects.sun.size, 1.0]);
    drawObject(objects.sun, sunModelMatrix);

    // Earth (orbits Sun, rotates on its own)
    const earthOrbitAngle = objects.earth.orbitSpeed * currentTime / 1000;
    const earthModelMatrix = mat4.create();
    mat4.rotateZ(earthModelMatrix, earthModelMatrix, earthOrbitAngle);
    mat4.translate(earthModelMatrix, earthModelMatrix, [objects.earth.orbitRadius, 0.0, 0.0]);
    mat4.rotateZ(earthModelMatrix, earthModelMatrix, objects.earth.rotationSpeed * currentTime / 1000);
    mat4.scale(earthModelMatrix, earthModelMatrix, [objects.earth.size, objects.earth.size, 1.0]);
    drawObject(objects.earth, earthModelMatrix);

    // Moon (orbits Earth, rotates on its own)
    const moonOrbitAngle = objects.moon.orbitSpeed * currentTime / 1000;
    const moonModelMatrix = mat4.create();
    mat4.rotateZ(moonModelMatrix, moonModelMatrix, earthOrbitAngle); // Start from Earth's orbit
    mat4.translate(moonModelMatrix, moonModelMatrix, [objects.earth.orbitRadius, 0.0, 0.0]); // Move to Earth's position
    mat4.rotateZ(moonModelMatrix, moonModelMatrix, moonOrbitAngle); // Moon's orbit around Earth
    mat4.translate(moonModelMatrix, moonModelMatrix, [objects.moon.orbitRadius, 0.0, 0.0]); // Offset from Earth
    mat4.rotateZ(moonModelMatrix, moonModelMatrix, objects.moon.rotationSpeed * currentTime / 1000); // Moon's rotation
    mat4.scale(moonModelMatrix, moonModelMatrix, [objects.moon.size, objects.moon.size, 1.0]);
    drawObject(objects.moon, moonModelMatrix);

    requestAnimationFrame(animate);
}

async function main() {
    if (!await setupShaderProgram()) {
        console.error("Failed to setup shaders");
        return;
    }
    setupSquareBuffers();
    setupAxes();
    
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', main);