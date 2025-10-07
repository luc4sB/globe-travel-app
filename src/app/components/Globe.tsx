"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";

export default function Globe() {
  return (
    <div className="w-[600px] h-[600px] my-8">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh rotation={[0, 0, 0]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Stars />
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}
