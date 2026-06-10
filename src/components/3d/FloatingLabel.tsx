import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingLabelProps {
  position: [number, number, number];
  title: string;
  subtitle?: string;
  color?: string;
  blink?: 'orange' | 'red' | null;
}

export default function FloatingLabel({
  position,
  title,
  subtitle,
  color = '#00E5FF',
  blink = null,
}: FloatingLabelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
  });

  const blinkClass =
    blink === 'orange'
      ? 'animate-blink-orange'
      : blink === 'red'
      ? 'animate-blink-red'
      : '';

  return (
    <group ref={groupRef} position={position}>
      <Html position={[0, 0, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
        <div
          className={`pointer-events-none select-none px-3 py-2 rounded-lg backdrop-blur-md bg-bg-glass border ${blinkClass}`}
          style={{
            borderColor: color,
            boxShadow: `0 0 15px ${color}40`,
            minWidth: '120px',
          }}
        >
          <div
            className="text-xs font-tech font-bold whitespace-nowrap"
            style={{ color }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-[10px] text-gray-300 mt-0.5 whitespace-nowrap">{subtitle}</div>
          )}
        </div>
      </Html>
    </group>
  );
}
