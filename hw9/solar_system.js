import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'lil-gui';

// Scene, Renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Perspective camera by default
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 150);

// Controls & Stats
let orbitControls = new OrbitControls(camera, renderer.domElement); // Declare with 'let'
const stats = new Stats();
document.body.appendChild(stats.dom);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// Texture loader
const textureLoader = new THREE.TextureLoader();
const textures = {
    Mercury: textureLoader.load('Mercury.jpg'),
    Venus: textureLoader.load('Venus.jpg'),
    Earth: textureLoader.load('Earth.jpg'),
    Mars: textureLoader.load('Mars.jpg')
};

// Create planet function
function createPlanet({ name, radius, distance = 0, color, texture, rotationSpeed, orbitSpeed }) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = texture ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.2 }) : new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = distance;

    scene.add(mesh);

    return {
        name,
        mesh,
        radius,
        distance,
        rotationSpeed,
        orbitSpeed
    };
}

// Planets
const planets = [
    createPlanet({ name: 'Sun', radius: 10, color: 0xffff00, rotationSpeed: 0.005, orbitSpeed: 0 }),
    createPlanet({ name: 'Mercury', radius: 1.5, distance: 20, color: '#a6a6a6', texture: textures.Mercury, rotationSpeed: 0.02, orbitSpeed: 0.02 }),
    createPlanet({ name: 'Venus', radius: 3, distance: 35, color: '#e39e1c', texture: textures.Venus, rotationSpeed: 0.015, orbitSpeed: 0.015 }),
    createPlanet({ name: 'Earth', radius: 3.5, distance: 50, color: '#3498db', texture: textures.Earth, rotationSpeed: 0.01, orbitSpeed: 0.01 }),
    createPlanet({ name: 'Mars', radius: 2.5, distance: 65, color: '#c0392b', texture: textures.Mars, rotationSpeed: 0.008, orbitSpeed: 0.008 })
];

// Camera toggle logic
const cameraSettings = {
    mode: 'Perspective',
    switchCamera: () => {
        const aspect = window.innerWidth / window.innerHeight;
        if (camera instanceof THREE.PerspectiveCamera) {
            scene.remove(camera); // Remove the old camera
            camera = null; // Clear the reference
            camera = new THREE.OrthographicCamera(
                window.innerWidth / -16, window.innerWidth / 16,
                window.innerHeight / 16, window.innerHeight / -16,
                -200, 500
            );
            camera.position.set(0, 50, 150);
            camera.lookAt(scene.position); // Important to look at the scene
            orbitControls.dispose(); // Dispose of the old controls
            orbitControls = new OrbitControls(camera, renderer.domElement); // Create new controls
            cameraSettings.mode = 'Orthographic';
        } else {
            scene.remove(camera); // Remove the old camera
            camera = null; // Clear the reference
            camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            camera.position.set(0, 50, 150);
            camera.lookAt(scene.position); // Important to look at the scene
            orbitControls.dispose(); // Dispose of the old controls
            orbitControls = new OrbitControls(camera, renderer.domElement); // Create new controls
            cameraSettings.mode = 'Perspective';
        }
    }
};

// GUI controls
const gui = new GUI();
const camFolder = gui.addFolder('Camera');
camFolder.add(cameraSettings, 'switchCamera').name('Switch Camera');
camFolder.add(cameraSettings, 'mode').listen();

planets.forEach(planet => {
    if (planet.name !== 'Sun') {
        const folder = gui.addFolder(planet.name);
        folder.add(planet, 'rotationSpeed', 0, 0.1, 0.001);
        folder.add(planet, 'orbitSpeed', 0, 0.1, 0.001);
    }
});

// Animate
function animate() {
    stats.update();
    orbitControls.update();

    const time = Date.now() * 0.1;

    planets.forEach(planet => {
        planet.mesh.rotation.y += planet.rotationSpeed;
        if (planet.distance > 0) {
            planet.mesh.position.x = Math.cos(time * planet.orbitSpeed) * planet.distance;
            planet.mesh.position.z = Math.sin(time * planet.orbitSpeed) * planet.distance;
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight; // Calculate aspect ratio
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
    } else {
        camera.left = window.innerWidth / -16;
        camera.right = window.innerWidth / 16;
        camera.top = window.innerHeight / 16;
        camera.bottom = window.innerHeight / -16;
    }
    camera.updateProjectionMatrix();
});