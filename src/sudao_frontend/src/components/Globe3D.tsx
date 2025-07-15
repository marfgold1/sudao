import * as THREE from "three";
import { useFrame } from "@react-three/fiber"
import { useMemo, useRef, useState } from "react"

export function EarthSphere() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Ocean base with custom shader for smooth gradient */}
      <mesh>
        <sphereGeometry args={[0.99, 64, 64]} />
        <meshStandardMaterial 
          color="#2563eb"
          roughness={0.3}
          metalness={0.2}
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              'void main() {',
              `
                varying vec3 vWorldPosition;
                void main() {
              `
            ).replace(
              '#include <project_vertex>',
              `
                #include <project_vertex>
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
              `
            ).replace(
              'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
              `
                float gradient = dot(normalize(vWorldPosition), normalize(vec3(1.0, 0.5, 0.5)));
                gradient = smoothstep(-0.5, 1.0, gradient);
                
                vec3 lightBlue = vec3(0.149, 0.392, 0.922);  // blue-600
                vec3 mediumBlue = vec3(0.118, 0.227, 0.541); // blue-800  
                vec3 darkBlue = vec3(0.090, 0.145, 0.329);   // blue-950
                
                vec3 gradientColor = mix(darkBlue, mediumBlue, gradient);
                gradientColor = mix(gradientColor, lightBlue, pow(gradient, 2.0));
                
                outgoingLight = mix(outgoingLight * gradientColor, outgoingLight, 0.3);
                gl_FragColor = vec4( outgoingLight, diffuseColor.a );
              `
            );
            
            shader.vertexShader = shader.vertexShader.replace(
              'void main() {',
              `
                varying vec3 vWorldPosition;
                void main() {
              `
            );
          }}
        />
      </mesh>

      <ContinentDots />
      <MajorCities />
    </group>
  )
}

function ContinentDots() {
  const continents = useMemo(() => {
    // Convert lat/lng to 3D coordinates on sphere
    const latLngToVector3 = (lat: number, lng: number, radius = 1.01) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)

      const x = -(radius * Math.sin(phi) * Math.cos(theta))
      const z = radius * Math.sin(phi) * Math.sin(theta)
      const y = radius * Math.cos(phi)

      return [x, y, z] as [number, number, number]
    }

    return {
      // North America
      northAmerica: {
        color: "#ff6b35",
        points: [
          // USA outline
          [49, -125],
          [49, -95],
          [45, -85],
          [42, -75],
          [35, -75],
          [30, -85],
          [25, -95],
          [25, -105],
          [30, -115],
          [35, -120],
          [40, -125],
          [45, -125],
          // Canada
          [60, -140],
          [65, -120],
          [70, -100],
          [65, -80],
          [60, -70],
          [55, -75],
          [50, -80],
          [45, -85],
          // Mexico
          [30, -115],
          [25, -110],
          [20, -105],
          [15, -95],
          [20, -90],
          [25, -95],
          // Additional coastal points
          [35, -125],
          [40, -124],
          [45, -124],
          [50, -125],
          [55, -130],
          [60, -135],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // South America
      southAmerica: {
        color: "#4ecdc4",
        points: [
          // Brazil and eastern coast
          [5, -35],
          [0, -50],
          [-5, -55],
          [-10, -60],
          [-15, -65],
          [-20, -65],
          [-25, -60],
          [-30, -55],
          [-35, -60],
          [-40, -65],
          [-45, -70],
          [-50, -70],
          [-55, -68],
          // Western coast
          [10, -75],
          [5, -80],
          [0, -78],
          [-5, -75],
          [-10, -75],
          [-15, -70],
          [-20, -70],
          [-25, -70],
          [-30, -71],
          [-35, -72],
          [-40, -73],
          [-45, -74],
          [-50, -75],
          // Northern coast
          [10, -60],
          [8, -65],
          [5, -70],
          [0, -70],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // Europe
      europe: {
        color: "#f7931e",
        points: [
          // Scandinavia
          [70, 25],
          [65, 20],
          [60, 15],
          [55, 10],
          [60, 5],
          [65, 10],
          [70, 15],
          // Western Europe
          [50, -5],
          [45, 0],
          [40, 5],
          [45, 10],
          [50, 5],
          [55, 0],
          [60, 5],
          // Mediterranean
          [40, 0],
          [35, 5],
          [35, 15],
          [40, 20],
          [45, 15],
          [40, 10],
          // Eastern Europe
          [55, 20],
          [50, 25],
          [45, 30],
          [50, 35],
          [55, 30],
          [60, 25],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // Africa
      africa: {
        color: "#06ffa5",
        points: [
          // Northern Africa
          [30, 0],
          [25, 10],
          [20, 20],
          [15, 25],
          [10, 30],
          [5, 35],
          [0, 40],
          [10, 45],
          [20, 40],
          [30, 35],
          [35, 25],
          [30, 15],
          [25, 5],
          // Eastern coast
          [15, 40],
          [10, 42],
          [5, 45],
          [0, 48],
          [-5, 50],
          [-10, 45],
          [-15, 40],
          [-20, 35],
          [-25, 30],
          [-30, 25],
          [-35, 20],
          // Western coast
          [15, 0],
          [10, -5],
          [5, -10],
          [0, -15],
          [-5, -10],
          [-10, -5],
          [-15, 0],
          [-20, 5],
          [-25, 10],
          [-30, 15],
          [-35, 20],
          // Southern tip
          [-30, 20],
          [-35, 25],
          [-34, 18],
          [-33, 25],
          [-30, 28],
          [-25, 30],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // Asia
      asia: {
        color: "#ffd23f",
        points: [
          // Russia/Siberia
          [70, 60],
          [65, 80],
          [60, 100],
          [55, 120],
          [60, 140],
          [65, 160],
          [70, 180],
          [65, 170],
          [60, 150],
          [55, 130],
          [50, 110],
          [55, 90],
          [60, 70],
          [65, 50],
          // China
          [40, 80],
          [35, 90],
          [30, 100],
          [25, 110],
          [30, 120],
          [35, 115],
          [40, 110],
          [45, 100],
          [40, 90],
          // India
          [30, 70],
          [25, 75],
          [20, 80],
          [15, 75],
          [10, 70],
          [8, 77],
          [15, 85],
          [20, 88],
          [25, 85],
          [30, 80],
          // Southeast Asia
          [20, 100],
          [15, 105],
          [10, 110],
          [5, 115],
          [0, 120],
          [5, 125],
          [10, 120],
          [15, 115],
          [20, 110],
          // Middle East
          [35, 35],
          [30, 40],
          [25, 45],
          [30, 50],
          [35, 55],
          [40, 50],
          [35, 45],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // Australia
      australia: {
        color: "#45b7d1",
        points: [
          // Australia mainland
          [-10, 130],
          [-15, 135],
          [-20, 140],
          [-25, 145],
          [-30, 150],
          [-35, 150],
          [-40, 145],
          [-35, 140],
          [-30, 135],
          [-25, 130],
          [-20, 125],
          [-15, 125],
          [-10, 128],
          // Additional points for better shape
          [-12, 132],
          [-18, 142],
          [-28, 148],
          [-38, 147],
          [-32, 138],
          [-22, 128],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },

      // Antarctica
      antarctica: {
        color: "#ffffff",
        points: [
          // Antarctica circle
          [-70, 0],
          [-70, 30],
          [-70, 60],
          [-70, 90],
          [-70, 120],
          [-70, 150],
          [-70, 180],
          [-70, -150],
          [-70, -120],
          [-70, -90],
          [-70, -60],
          [-70, -30],
          [-75, 0],
          [-75, 45],
          [-75, 90],
          [-75, 135],
          [-75, 180],
          [-75, -135],
          [-75, -90],
          [-75, -45],
          [-80, 0],
          [-80, 60],
          [-80, 120],
          [-80, 180],
          [-80, -120],
          [-80, -60],
        ].map(([lat, lng]) => latLngToVector3(lat, lng)),
      },
    }
  }, [])

  return (
    <>
      {Object.entries(continents).map(([continent, data]) =>
        data.points.map((position, index) => (
          <AnimatedContinentDot key={`${continent}-${index}`} position={position} color={data.color} index={index} />
        )),
      )}
    </>
  )
}

function AnimatedContinentDot({
  position,
  color,
  index,
}: { position: [number, number, number]; color: string; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      const scale = 0.018 + Math.sin(time * 0.5 + index * 0.1) * 0.008
      meshRef.current.scale.setScalar(scale)

      const intensity = 0.4 + Math.sin(time * 0.8 + index * 0.15) * 0.3
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = intensity
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  )
}

function MajorCities() {
  const cities = useMemo(() => {
    const latLngToVector3 = (lat: number, lng: number, radius = 1.05) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)

      const x = -(radius * Math.sin(phi) * Math.cos(theta))
      const z = radius * Math.sin(phi) * Math.sin(theta)
      const y = radius * Math.cos(phi)

      return [x, y, z] as [number, number, number]
    }

    return [
      { name: "New York", pos: latLngToVector3(40.7128, -74.006), color: "#ff6b35" },
      { name: "London", pos: latLngToVector3(51.5074, -0.1278), color: "#f7931e" },
      { name: "Tokyo", pos: latLngToVector3(35.6762, 139.6503), color: "#ffd23f" },
      { name: "Sydney", pos: latLngToVector3(-33.8688, 151.2093), color: "#45b7d1" },
      { name: "São Paulo", pos: latLngToVector3(-23.5505, -46.6333), color: "#4ecdc4" },
      { name: "Cairo", pos: latLngToVector3(30.0444, 31.2357), color: "#06ffa5" },
      { name: "Mumbai", pos: latLngToVector3(19.076, 72.8777), color: "#ffd23f" },
      { name: "Los Angeles", pos: latLngToVector3(34.0522, -118.2437), color: "#ff6b35" },
    ]
  }, [])

  return (
    <>
      {cities.map((city, _) => (
        <mesh key={city.name} position={city.pos}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={city.color} emissive={city.color} emissiveIntensity={1.2} />
        </mesh>
      ))}
    </>
  )
}

export function FlyingConnections() {
  const [connections, setConnections] = useState<
    Array<{
      start: [number, number, number]
      end: [number, number, number]
      progress: number
      id: number
      color: string
    }>
  >([])

  // Major city coordinates for realistic connections
  const majorCities = useMemo(() => {
    const latLngToVector3 = (lat: number, lng: number) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lng + 180) * (Math.PI / 180)

      const x = -(Math.sin(phi) * Math.cos(theta))
      const z = Math.sin(phi) * Math.sin(theta)
      const y = Math.cos(phi)

      return [x, y, z] as [number, number, number]
    }

    return [
      latLngToVector3(40.7128, -74.006), // New York
      latLngToVector3(51.5074, -0.1278), // London
      latLngToVector3(35.6762, 139.6503), // Tokyo
      latLngToVector3(-33.8688, 151.2093), // Sydney
      latLngToVector3(-23.5505, -46.6333), // São Paulo
      latLngToVector3(30.0444, 31.2357), // Cairo
      latLngToVector3(19.076, 72.8777), // Mumbai
      latLngToVector3(34.0522, -118.2437), // Los Angeles
    ]
  }, [])

  useFrame(() => {
    setConnections((prev: any) => {
      const updated = prev
        .map((conn: any) => ({ ...conn, progress: conn.progress + 0.012 }))
        .filter((conn: any) => conn.progress < 1)

      if (Math.random() < 0.03 && updated.length < 6) {
        const colors = ["#ff6b35", "#f7931e", "#ffd23f", "#06ffa5", "#4ecdc4", "#45b7d1"]

        const startCity = majorCities[Math.floor(Math.random() * majorCities.length)]
        const endCity = majorCities[Math.floor(Math.random() * majorCities.length)]

        if (startCity !== endCity) {
          updated.push({
            start: startCity,
            end: endCity,
            progress: 0,
            id: Math.random(),
            color: colors[Math.floor(Math.random() * colors.length)],
          })
        }
      }

      return updated
    })
  })

  return (
    <>
      {connections.map((connection: any) => (
        <FlyingDot key={connection.id} connection={connection} />
      ))}
      {connections.map((connection: any) => (
        <ConnectionTrail key={`trail-${connection.id}`} connection={connection} />
      ))}
    </>
  )
}

function FlyingDot({ connection }: { connection: any }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      const { start, end, progress } = connection

      const t = progress
      const x = start[0] + (end[0] - start[0]) * t
      const y = start[1] + (end[1] - start[1]) * t
      const z = start[2] + (end[2] - start[2]) * t

      const length = Math.sqrt(x * x + y * y + z * z)
      const height = 1.15 + Math.sin(progress * Math.PI) * 0.3

      meshRef.current.position.set((x / length) * height, (y / length) * height, (z / length) * height)

      const scale = Math.sin(progress * Math.PI) * 0.06
      meshRef.current.scale.setScalar(Math.max(scale, 0.01))
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color={connection.color} emissive={connection.color} emissiveIntensity={1.5} />
    </mesh>
  )
}

function ConnectionTrail({ connection }: { connection: any }) {
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (lineRef.current) {
      const { start, end, progress } = connection
      const points = []

      const trailLength = 0.25
      const startProgress = Math.max(0, progress - trailLength)

      for (let i = 0; i <= 15; i++) {
        const t = startProgress + (progress - startProgress) * (i / 15)
        const x = start[0] + (end[0] - start[0]) * t
        const y = start[1] + (end[1] - start[1]) * t
        const z = start[2] + (end[2] - start[2]) * t

        const length = Math.sqrt(x * x + y * y + z * z)
        const height = 1.15 + Math.sin(t * Math.PI) * 0.3

        points.push(new THREE.Vector3((x / length) * height, (y / length) * height, (z / length) * height))
      }

      if (points.length > 0) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        if (lineRef.current.geometry) {
          lineRef.current.geometry.dispose()
        }
        lineRef.current.geometry = geometry
      }
    }
  })

  return (
    <primitive object={new THREE.Line()} ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color={connection.color} opacity={0.7} transparent linewidth={2} />
    </primitive>
  )
}

export function FloatingParticles() {
  const particlesRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particlesArray = []
    for (let i = 0; i < 30; i++) {
      particlesArray.push({
        position: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6] as [
          number,
          number,
          number,
        ],
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return particlesArray
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime
      particlesRef.current.children.forEach((child, index) => {
        const particle = particles[index]
        if (particle) {
          child.position.y += Math.sin(time * particle.speed + particle.phase) * 0.001
          child.rotation.z += particle.speed

          const scale = 0.5 + Math.sin(time * particle.speed + particle.phase) * 0.3
          child.scale.setScalar(scale)
        }
      })
    }
  })

  return (
    <group ref={particlesRef}>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[0.005, 4, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}