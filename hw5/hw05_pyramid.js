/*-------------------------------------------------------------------------
10_CameraCircle.js

- Viewing a 3D square pyramid at origin with perspective projection
- The pyramid is fixed (not rotating)
- A camera is rotating around the origin through the circle of radius 3
- The height (y position) of the camera follows a sine wave from 0 to 10
- The camera is always looking at the origin.
---------------------------------------------------------------------------*/

import { resizeAspectRatio, setupText, updateText, Axes } from './util/util.js';
import { Shader, readShaderFile } from './util/shader.js';
import { SquarePyramid } from './squarePyramid.js'; // Changed from Cube to SquarePyramid

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;

let isInitialized = false;

let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create(); 
const cameraCircleRadius = 3.0; // Changed from 5 to 3 as per requirements
const cameraCircleSpeed = 90.0; // degrees per second
const cameraHeightSpeed = 45.0; // degrees per second for y movement
const pyramid = new SquarePyramid(gl); // Changed from Cube to SquarePyramid
const axes = new Axes(gl, 1.8);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('program terminated');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('program terminated with error:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0;
    const elapsedTime = (currentTime - startTime) / 1000.0;
    lastFrameTime = currentTime;

    // Clear canvas
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Model transformation matrix - pyramid is fixed (no rotation)
    mat4.identity(modelMatrix); // Reset to identity matrix (no transformation)

    // Viewing transformation matrix
    // Calculate camera position (x and z follow circular path, y follows sine wave)
    const angle = glMatrix.toRadian(cameraCircleSpeed * elapsedTime);
    let camX = cameraCircleRadius * Math.sin(angle);
    let camZ = cameraCircleRadius * Math.cos(angle);
    
    // Calculate y position (0 to 10 range using sine wave)
    const heightAngle = glMatrix.toRadian(cameraHeightSpeed * elapsedTime);
    let camY = 5.0 + 5.0 * Math.sin(heightAngle); // Oscillates between 0 and 10
    
    mat4.lookAt(viewMatrix, 
        vec3.fromValues(camX, camY, camZ), // camera position
        vec3.fromValues(0, 0, 0), // look at origin
        vec3.fromValues(0, 1, 0)); // up vector

    // drawing the pyramid
    shader.use();
    shader.setMat4('u_model', modelMatrix);
    shader.setMat4('u_view', viewMatrix);
    shader.setMat4('u_projection', projMatrix);
    pyramid.draw(shader);

    // drawing the axes
    axes.draw(viewMatrix, projMatrix);

    requestAnimationFrame(render);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL initialization failed');
        }
        
        shader = await initShader();

        // Projection transformation matrix
        mat4.perspective(
            projMatrix,
            glMatrix.toRadian(60),  // field of view
            canvas.width / canvas.height, // aspect ratio
            0.1, // near
            100.0 // far
        );

        // starting time for animation
        startTime = lastFrameTime = Date.now();

        // call the render function
        requestAnimationFrame(render);

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('Failed to initialize program');
        return false;
    }
}