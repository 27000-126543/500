import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FloatingLabel from './FloatingLabel';
import { InspectionRecord } from '../../types';

interface InspectionCenterProps {
  inspections: InspectionRecord[];
  position: [number, number, number];
  onClick?: () => void;
}

export default function InspectionCenter({ inspections, position, onClick }: InspectionCenterProps) {
  const scannerRef = useRef<THREE.Mesh>(null);
  const unqualifiedCount = inspections.filter((i) => i.overallResult === 'fail').length;
  const hasUnqualified = unqualifiedCount > 0;

  useFrame((state) => {
    if (scannerRef.current) {
      scannerRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  const statusColor = hasUnqualified ? '#FF3D57' : '#00C48C';

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshStandardMaterial color="#0d1b2e" />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3.8, 2.3, 2.8]} />
        <meshStandardMaterial color="#0f1f3a" transparent opacity={0.5} />
      </mesh>

      <mesh ref={scannerRef} position={[0, 2, 0]}>
        <torusGeometry args={[0.5, 0.03, 16, 32]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.8}
        />
      </mesh>

      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-1.2 + i * 0.6, 1.2, 0.8]}>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial
            color={i < unqualifiedCount ? '#FF3D57' : '#00C48C'}
            emissive={i < unqualifiedCount ? '#FF3D57' : '#00C48C'}
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      <mesh position={[0, 1.5, 1.2]}>
        <planeGeometry args={[2.5, 1.2]} />
        <meshBasicMaterial color="#001122" transparent opacity={0.9} />
      </mesh>

      <FloatingLabel
        position={[0, 0, 0]}
        title="农产品检测中心"
        subtitle={`合格:${inspections.length - unqualifiedCount} | 不合格:${unqualifiedCount}`}
        color={statusColor}
        blink={hasUnqualified ? 'red' : null}
      />
    </group>
  );
}
