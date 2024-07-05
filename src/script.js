import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import holographicVertexShader from "./shaders/holographic/vertex.glsl"
import holographicFragmentShader from "./shaders/holographic/fragment.glsl"

const canvas = document.querySelector("canvas.webgl")

const scene = new THREE.Scene()

const gltfLoader = new GLTFLoader()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener("resize", () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.set(5, 2, 6)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableZoom = false

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setClearColor("#020215")
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: holographicVertexShader,
    fragmentShader: holographicFragmentShader,
    uniforms: {
        uTime: new THREE.Uniform(0),
        uColor: new THREE.Uniform(new THREE.Color("#70c1ff"))
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})

let robot = null
gltfLoader.load(
    "./models/robot/scene.gltf",
    (gltf) => {
        robot = gltf.scene
        gltf.scene.scale.set(0.25, 0.25, 0.25)
        gltf.scene.position.y = -0.75
        robot.traverse((child) => {
            if (child.isMesh)
                child.material = shaderMaterial
        })
        scene.add(robot)
    }
)

const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load("/textures/particle.png")

const particlesGeometry = new THREE.BufferGeometry()
const particleCount = 1000
const positions = new Float32Array(particleCount * 3)
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * 5 // x
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * 5 // y
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * 5 // z
}
particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.15,
    sizeAttenuation: true,
    alphaMap: particleTexture,
    transparent: true
})
particlesMaterial.depthWrite = false
particlesMaterial.blending = THREE.AdditiveBlending

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

const clock = new THREE.Clock()

const animate = () => {
    const elapsedTime = clock.getElapsedTime()
    shaderMaterial.uniforms.uTime.value = elapsedTime

    if (robot) {
        robot.rotation.y = elapsedTime * 0.05
    }

    const positions = particlesGeometry.attributes.position.array
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01
        positions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.01
        positions[i * 3 + 2] += Math.sin(Date.now() * 0.001 + i) * 0.01
    }
    particlesGeometry.attributes.position.needsUpdate = true

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}

animate()
