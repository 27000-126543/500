import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FloatingLabel from './FloatingLabel';

interface MonitorCenterProps {
  position: [number, number, number];
  alertCount: number;
  onClick?: () => void;
}

export default function MonitorCenter({ position, alertCount, onClick }: MonitorCenterProps) {
  const screenRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    screenRefs.current.forEach((screen, i) => {
      if (screen) {
        const mat = screen.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.7 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
      }
    });
  });

  const statusColor = alertCount > 2 ? '#FF3D57' : alertCount > 0 ? '#FF8C00' : '#00E5FF';

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.1, 3]} />
        <meshStandardMaterial color="#0d1b2e" />
      </mesh>

      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[4.8, 2.8, 2.8]} />
        <meshStandardMaterial color="#0a1628" transparent opacity={0.7} />
      </mesh>

      {[0, 1, 2, 3, 4, 5].map((i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <mesh
            key={i}
            ref={(el) => {
              if (el) screenRefs.current[i] = el;
            }}
            position={[-1.5 + col * 1.5, 1.8 + row * -1.0, 1.3]}
          >
            <planeGeometry args={[1.3, 0.8]} />
            <meshBasicMaterial
              color={i < alertCount ? '#FF3D57' : statusColor}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      <mesh position={[0, 3.0, 1.3]}>
        <planeGeometry args={[4.5, 0.5]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.9}
        />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.8 + i * 1.8, 3.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
          <meshStandardMaterial color="#334155" />
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={0.8}
            />
          </mesh>
        </mesh>
      ))}

      <FloatingLabel
        position={[0, 0, 0]}
        title="监控指挥中心"
        subtitle={`活动预警: ${alertCount}`}
        color={statusColor}
        blink={alertCount > 2 ? 'red' : alertCount > 0 ? 'orange' : null}
      />
    </group>
  );
}
