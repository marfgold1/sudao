import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load the heavy 3D components
const Canvas = lazy(() => import('@react-three/fiber').then(module => ({ default: module.Canvas })));
const OrbitControls = lazy(() => import('@react-three/drei').then(module => ({ default: module.OrbitControls })));
const Sphere = lazy(() => import('@react-three/drei').then(module => ({ default: module.Sphere })));

// Lazy load our custom 3D components
const Globe3DComponents = lazy(() => import('./Globe3D').then(module => ({
  default: () => (
    <>
      <module.EarthSphere />
      <module.FlyingConnections />
      <module.FloatingParticles />
    </>
  )
})));

// Fallback component for 3D globe
const GlobeFallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse flex items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-blue-800 opacity-50"></div>
    </div>
  </div>
);

interface LazyGlobe3DProps {
  isVisible: boolean;
}

export default function LazyGlobe3D({ isVisible }: LazyGlobe3DProps) {
  if (!isVisible) {
    return <GlobeFallback />;
  }

  return (
    <Suspense fallback={<GlobeFallback />}>
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.3} />
        
        {/* Atmosphere glow */}
        <Suspense fallback={null}>
          <Sphere args={[1.3, 64, 64]}>
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.1} side={2} />
          </Sphere>
        </Suspense>

        <Suspense fallback={null}>
          <Globe3DComponents />
        </Suspense>

        <Suspense fallback={null}>
          <OrbitControls
            autoRotate
            autoRotateSpeed={1}
            enableZoom={false}
            enablePan={false}
            minDistance={2}
            maxDistance={6}
          />
        </Suspense>
      </Canvas>
    </Suspense>
  );
}