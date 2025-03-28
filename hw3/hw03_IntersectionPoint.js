/*-------------------------------------------------------------------------
Interactive Drawing Program with Intersection Detection

1. First mode: Draw a circle (click for center, drag for radius)
2. Second mode: Draw a line (click for start, drag for end)
3. Automatically detects and displays intersection points
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from './util.js';
import { Shader, readShaderFile } from './shader.js';

// Global variables
let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let circles = [];
let lines = [];
let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);
let drawingMode = 'circle'; // 'circle' or 'line'

// Number of segments to approximate the circle
const CIRCLE_SEGMENTS = 64;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.8, 0.9, 1.0);
    
    return true;
}

function setupCanvas() {
    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);

    window.addEventListener('resize', () => {
        resizeAspectRatio(gl, canvas);
        render();
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function generateCirclePoints(center, radius, segments) {
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        points.push(x, y);
    }
    return points;
}

function findCircleLineIntersections(circle, line) {
    const [x1, y1, x2, y2] = line;
    const [cx, cy] = circle.center;
    const r = circle.radius;
    
    // Translate system to make circle center origin
    const tx1 = x1 - cx;
    const ty1 = y1 - cy;
    const tx2 = x2 - cx;
    const ty2 = y2 - cy;
    
    const dx = tx2 - tx1;
    const dy = ty2 - ty1;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (tx1 * dx + ty1 * dy);
    const c = tx1 * tx1 + ty1 * ty1 - r * r;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        return []; // No intersection
    }
    
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    
    const intersections = [];
    
    if (t1 >= 0 && t1 <= 1) {
        intersections.push({
            x: x1 + t1 * dx,
            y: y1 + t1 * dy
        });
    }
    
    if (t2 >= 0 && t2 <= 1 && discriminant !== 0) {
        intersections.push({
            x: x1 + t2 * dx,
            y: y1 + t2 * dy
        });
    }
    
    return intersections;
}

function updateIntersectionText() {
    if (circles.length > 0 && lines.length > 0) {
        const lastCircle = circles[circles.length - 1];
        const lastLine = lines[lines.length - 1];
        const intersections = findCircleLineIntersections(lastCircle, lastLine);
        
        let intersectionText = "Intersection Points: " + intersections.length;
        intersections.forEach((point, index) => {
            intersectionText += ` Point ${index+1}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
        });
        
        if (intersections.length === 0) {
            intersectionText = "No intersection";
        }
        
        updateText(textOverlay3, intersectionText);
    } else {
        updateText(textOverlay3, "");
    }
}

function setupMouseEvents() {
    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (!isDrawing) {
            startPoint = convertToWebGLCoordinates(x, y);
            isDrawing = true;
        }
    }

    function handleMouseMove(event) {
        if (isDrawing && startPoint) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            tempEndPoint = convertToWebGLCoordinates(x, y);
            render();
        }
    }

    function handleMouseUp() {
        if (isDrawing && startPoint && tempEndPoint) {
            if (drawingMode === 'circle') {
                // Calculate radius for circle
                const dx = tempEndPoint[0] - startPoint[0];
                const dy = tempEndPoint[1] - startPoint[1];
                const radius = Math.sqrt(dx * dx + dy * dy);
                
                circles.push({
                    center: [...startPoint],
                    radius: radius
                });

                updateText(textOverlay, `Circle: Center (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}), Radius: ${radius.toFixed(2)}`);
                //updateText(textOverlay2);
                
                // Switch to line drawing mode
                drawingMode = 'line';
            } 
            else if (drawingMode === 'line') {
                lines.push([...startPoint, ...tempEndPoint]);
                
                updateText(textOverlay2, `Line segment: (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}) ~ (${tempEndPoint[0].toFixed(2)}, ${tempEndPoint[1].toFixed(2)})`);
            }

            // Update intersection information
            updateIntersectionText();

            isDrawing = false;
            startPoint = null;
            tempEndPoint = null;
            render();
        }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.use();
    
    // Draw stored circles
    for (let circle of circles) {
        const points = generateCirclePoints(circle.center, circle.radius, CIRCLE_SEGMENTS);
        shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]); // Yellow for circle
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, points.length / 2);
    }

    // Draw stored lines
    for (let line of lines) {
        shader.setVec4("u_color", [1.0, 1.0, 1.0, 1.0]); //  White for line
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // Draw temporary shape (circle or line)
    if (isDrawing && startPoint && tempEndPoint) {
        if (drawingMode === 'circle') {
            const dx = tempEndPoint[0] - startPoint[0];
            const dy = tempEndPoint[1] - startPoint[1];
            const radius = Math.sqrt(dx * dx + dy * dy);
            const tempPoints = generateCirclePoints(startPoint, radius, CIRCLE_SEGMENTS);
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // Gray for temporary circle
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tempPoints), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, tempPoints.length / 2);
        } 
        else if (drawingMode === 'line') {
            shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); // Gray for temporary line
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([...startPoint, ...tempEndPoint]), gl.STATIC_DRAW);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // Draw intersection points if they exist
    if (circles.length > 0 && lines.length > 0) {
        const lastCircle = circles[circles.length - 1];
        const lastLine = lines[lines.length - 1];
        const intersections = findCircleLineIntersections(lastCircle, lastLine);
        
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); // Yellow for intersection points
        
        // Draw each intersection point as a large dot
        intersections.forEach(point => {
            const pointVertices = [point.x, point.y];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointVertices), gl.STATIC_DRAW);
            gl.drawArrays(gl.POINTS, 0, 1);
        });
    }

    // Draw axes
    axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        shader = await initShader();
        setupCanvas();
        setupBuffers(shader);
        shader.use();

        textOverlay = setupText(canvas, "", 1);
        textOverlay2 = setupText(canvas, "", 2);
        textOverlay3 = setupText(canvas, "", 3);
        
        setupMouseEvents();
        render();

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}