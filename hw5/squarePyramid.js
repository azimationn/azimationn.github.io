// squarePyramid.js
export class SquarePyramid {
    constructor(gl) {
        this.gl = gl;

        const halfSize = 0.5;
        const apexY = 1.0;
        const baseY = 0.0;

        // Define vertex coordinates for clarity
        const v_blb = [-halfSize, baseY, -halfSize]; // Base: Back Left
        const v_brb = [ halfSize, baseY, -halfSize]; // Base: Back Right
        const v_frb = [ halfSize, baseY,  halfSize]; // Base: Front Right
        const v_flb = [-halfSize, baseY,  halfSize]; // Base: Front Left
        const v_apex = [0.0, apexY, 0.0];           // Apex

        // Define solid face colors (RGBA)
        const c_magenta = [1.0, 0.0, 1.0, 1.0]; // Back face
        const c_yellow  = [1.0, 1.0, 0.0, 1.0]; // Right face
        const c_red     = [1.0, 0.0, 0.0, 1.0]; // Front face
        const c_cyan    = [0.0, 1.0, 1.0, 1.0]; // Left face
        const c_blue    = [0.0, 0.0, 1.0, 1.0]; // Base face (optional, keeping it blue)

        // Vertices array - arranged per face for distinct coloring
        const vertices = [
            // Back face (Magenta) - Triangle: v_blb, v_brb, v_apex
            ...v_blb,  // 0
            ...v_brb,  // 1
            ...v_apex, // 2

            // Right face (Yellow) - Triangle: v_brb, v_frb, v_apex
            ...v_brb,  // 3
            ...v_frb,  // 4
            ...v_apex, // 5

            // Front face (Red) - Triangle: v_frb, v_flb, v_apex
            ...v_frb,  // 6
            ...v_flb,  // 7
            ...v_apex, // 8

            // Left face (Cyan) - Triangle: v_flb, v_blb, v_apex
            ...v_flb,  // 9
            ...v_blb,  // 10
            ...v_apex, // 11

            // Base face (Blue) - Quad: v_blb, v_brb, v_frb, v_flb
            // (split into two triangles for rendering)
            ...v_blb,  // 12
            ...v_brb,  // 13
            ...v_frb,  // 14
            ...v_flb   // 15
        ];

        // Colors array - one color per vertex, matching the face
        const colors = [
            // Back face (Magenta)
            ...c_magenta, ...c_magenta, ...c_magenta, // 0, 1, 2

            // Right face (Yellow)
            ...c_yellow,  ...c_yellow,  ...c_yellow,  // 3, 4, 5

            // Front face (Red)
            ...c_red,     ...c_red,     ...c_red,     // 6, 7, 8

            // Left face (Cyan)
            ...c_cyan,    ...c_cyan,    ...c_cyan,    // 9, 10, 11

            // Base face (Blue)
            ...c_blue,    ...c_blue,    ...c_blue,    ...c_blue     // 12, 13, 14, 15
        ];

        // Indices for triangles - referencing the duplicated vertices
        const indices = [
            // Sides
            0, 1, 2,    // Back face
            3, 4, 5,    // Right face
            6, 7, 8,    // Front face
            9, 10, 11,  // Left face

            // Base (two triangles)
            12, 13, 14, // First triangle of base
            12, 14, 15  // Second triangle of base
        ];

        // --- WebGL Buffer Setup (mostly unchanged from your original) ---

        // Create and bind VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Vertex buffer (Attribute location 0)
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // vec3 positions
        gl.enableVertexAttribArray(0);

        // Color buffer (Attribute location 2 - assuming your shader uses this)
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        // Make sure your vertex shader expects color at location 2
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); // vec4 colors
        gl.enableVertexAttribArray(2);

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // Store number of indices
        this.numIndices = indices.length;

        // Unbind VAO
        gl.bindVertexArray(null);
        // Unbind buffers (good practice)
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    draw(shader) { // Shader parameter is good practice, though not used directly here
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        // No need to bind ELEMENT_ARRAY_BUFFER again, it's part of the VAO state
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null); // Unbind VAO after drawing
    }
}