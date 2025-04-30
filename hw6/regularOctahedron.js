// Updated RegularOctahedron with horizontal wrapping and taller height
export class RegularOctahedron {
    constructor(gl) {
        this.gl = gl;

        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ebo = gl.createBuffer();

        const s = Math.sqrt(2) / 2;
        const h = 1.0; // Increased height for top and bottom

        // Define per-face vertices (duplicated for each triangle)
        const vertexMap = [
            // Top faces (0 on top)
            [0, h, 0], [s, 0, s], [s, 0, -s],    // 0-1-2
            [0, h, 0], [s, 0, -s], [-s, 0, -s],  // 0-2-3
            [0, h, 0], [-s, 0, -s], [-s, 0, s],  // 0-3-4
            [0, h, 0], [-s, 0, s], [s, 0, s],    // 0-4-1

            // Bottom faces (5 on bottom)
            [0, -h, 0], [s, 0, -s], [s, 0, s],   // 5-2-1
            [0, -h, 0], [-s, 0, -s], [s, 0, -s], // 5-3-2
            [0, -h, 0], [-s, 0, s], [-s, 0, -s], // 5-4-3
            [0, -h, 0], [s, 0, s], [-s, 0, s]    // 5-1-4
        ];

        this.vertices = new Float32Array(vertexMap.flat());

        // No index buffer since vertices are expanded per-face
        this.indices = new Uint16Array([...Array(24).keys()]);

        // Normals (same as face normals, per vertex)
        this.normals = new Float32Array(24 * 3);
        for (let i = 0; i < this.vertices.length; i += 9) {
            const ax = this.vertices[i];
            const ay = this.vertices[i+1];
            const az = this.vertices[i+2];
            const bx = this.vertices[i+3];
            const by = this.vertices[i+4];
            const bz = this.vertices[i+5];
            const cx = this.vertices[i+6];
            const cy = this.vertices[i+7];
            const cz = this.vertices[i+8];

            const ux = bx - ax;
            const uy = by - ay;
            const uz = bz - az;
            const vx = cx - ax;
            const vy = cy - ay;
            const vz = cz - az;

            const nx = uy * vz - uz * vy;
            const ny = uz * vx - ux * vz;
            const nz = ux * vy - uy * vx;
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);

            for (let j = 0; j < 3; j++) {
                const idx = (i / 3 + j) * 3;
                this.normals[idx] = nx / len;
                this.normals[idx + 1] = ny / len;
                this.normals[idx + 2] = nz / len;
            }
        }

        // Wrapped texture coordinates (u left to right)
        this.texCoords = new Float32Array([
            // top faces
            0.0, 1.0,   0.25, 0.5,   0.125, 0.5,
            0.125, 1.0, 0.375, 0.5,  0.25, 0.5,
            0.25, 1.0,  0.5, 0.5,   0.375, 0.5,
            0.375, 1.0, 0.625, 0.5, 0.5, 0.5,
            // bottom faces
            0.0, 0.0,   0.125, 0.5,  0.25, 0.5,
            0.125, 0.0, 0.375, 0.5,  0.25, 0.5,
            0.25, 0.0,  0.5, 0.5,   0.375, 0.5,
            0.375, 0.0, 0.625, 0.5, 0.5, 0.5
        ]);

        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;

        const vSize = this.vertices.byteLength;
        const nSize = this.normals.byteLength;
        const tSize = this.texCoords.byteLength;
        const totalSize = vSize + nSize + tSize;

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
        gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.texCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize);
        gl.enableVertexAttribArray(3);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }

    draw(shader) {
        const gl = this.gl;
        shader.use();
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    delete() {
        const gl = this.gl;
        gl.deleteBuffer(this.vbo);
        gl.deleteBuffer(this.ebo);
        gl.deleteVertexArray(this.vao);
    }
}
