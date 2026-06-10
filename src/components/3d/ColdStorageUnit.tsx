import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FloatingLabel from './FloatingLabel';
import { ColdStorage } from '../../types';

interface ColdStorageUnitProps {
  coldStorage: ColdStorage;
  position: [number, number, number];
  onClick?: () => void;
}

export default function ColdStorageUnit({ coldStorage, position, onClick }: ColdStorageUnitProps) {
  const fanRef = useRef<THREE.Group>(null);
  const fogRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (fanRef.current && coldStorage.mainCoolingStatus === 'running') {
      fanRef.current.rotation.y = state.clock.elapsedTime * 8;
    }
    if (fanRef.current && coldStorage.backupCoolingStatus === 'running') {
      fanRef.current.rotation.y = state.clock.elapsedTime * 6;
    }
    if (fogRef.current) {
      fogRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      const positions = fogRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        positions.setY(i, y + 0.01 > 2 ? 0.5 : y + 0.01);
      }
      positions.needsUpdate = true;
    }
  });

  const statusColor =
    coldStorage.status === 'critical'
      ? '#FF3D57'
      : coldStorage.status === 'warning'
      ? '#FF8C00'
      : '#00E5FF';

  const blinkType =
    coldStorage.status === 'critical' ? 'red' : coldStorage.status === 'warning' ? 'orange' : null;

  const fogGeometry = new THREE.BufferGeometry();
  const fogCount = 50;
  const fogPositions = new Float32Array(fogCount * 3);
  for (let i = 0; i < fogCount; i++) {
    fogPositions[i * 3] = (Math.random() - 0.5) * 2.5;
    fogPositions[i * 3 + 1] = Math.random() * 1.5 + 0.5;
    fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
  }
  fogGeometry.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));

  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.1, 3]} />
        <meshStandardMaterial color="#0d1b2e" />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.8, 2.3, 2.8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={coldStorage.status === 'normal' ? 0.1 : 0.25}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshStandardMaterial color="#1a2d45" wireframe transparent opacity={0.4} />
      </mesh>

      <group ref={fanRef} position={[0, 2.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2, (i * Math.PI) / 2, 0]}>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
            <meshStandardMaterial color={coldStorage.backupCoolingStatus === 'running' ? '#FF8C00' : statusColor} />
          </mesh>
        ))}
      </group>

      <points ref={fogRef} geometry={fogGeometry}>
        <pointsMaterial color="#88ccff" size={0.08} transparent opacity={0.5} />
      </points>

      <FloatingLabel
        position={[0, 0, 0]}
        title={coldStorage.name}
        subtitle={`${coldStorage.temperature}℃ | ${coldStorage.humidity}%`}
        color={statusColor}
        blink={blinkType}
      />
    </group>
  );
}
