import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import FloatingLabel from './FloatingLabel';
import { Stall } from '../../types';
import { heatToColor } from '../../utils/alertEngine';

interface MarketStallProps {
  stall: Stall;
  onClick?: (stall: Stall) => void;
  selected?: boolean;
  maskedSensitiveData?: boolean;
}

const categoryColors: Record<string, string> = {
  vegetable: '#4CAF50',
  meat: '#F44336',
  seafood: '#2196F3',
  fruit: '#FF9800',
  grain: '#FFC107',
};

export default function MarketStall({ stall, onClick, selected, maskedSensitiveData }: MarketStallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseColor = categoryColors[stall.category] || '#00E5FF';
  const heatColor = heatToColor(stall.passengerHeat);

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (maskedSensitiveData) {
        mat.opacity = 0.15;
      } else {
        const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        mat.opacity = stall.status === 'unqualified' || stall.status === 'lowStock' ? pulse : 0.15;
      }
    }
  });

  const statusColor = maskedSensitiveData
    ? baseColor
    : stall.status === 'unqualified'
    ? '#FF3D57'
    : stall.status === 'lowStock'
    ? '#FF8C00'
    : baseColor;

  const displayHeatColor = maskedSensitiveData ? baseColor : heatColor;
  const emissiveIntensity = maskedSensitiveData ? 0 : 0.3;

  const blinkType = maskedSensitiveData
    ? null
    : stall.status === 'unqualified'
    ? 'red'
    : stall.status === 'lowStock'
    ? 'orange'
    : null;

  return (
    <group position={[stall.position.x, stall.position.y, stall.position.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(stall);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[1.6, 0.05, 1.6]} />
        <meshStandardMaterial color={statusColor} transparent opacity={0.9} />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#1a2a40" transparent opacity={0.6} />
      </mesh>

      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.55, 0.05, 1.55]} />
        <meshStandardMaterial color={displayHeatColor} emissive={displayHeatColor} emissiveIntensity={emissiveIntensity} transparent opacity={0.8} />
      </mesh>

      {(hovered || selected || blinkType) && (
        <mesh ref={glowRef} position={[0, 0.55, 0]}>
          <boxGeometry args={[1.8, 1.2, 1.8]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial
          color={selected ? '#00E5FF' : hovered ? '#ffffff' : statusColor}
          transparent
          opacity={selected ? 1 : hovered ? 0.8 : 0.4}
        />
      </mesh>

      <FloatingLabel
        position={[0, 0, 0]}
        title={stall.name}
        subtitle={maskedSensitiveData ? '***' : `库存:${stall.inventory} | 客流:${stall.passengerHeat}%`}
        color={statusColor}
        blink={blinkType}
      />
    </group>
  );
}
