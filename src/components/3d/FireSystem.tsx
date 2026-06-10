import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { FireAlarm, PathPoint, EvacuationPath } from '../../types';

interface FireSystemProps {
  active: boolean;
  fireAlarm: FireAlarm;
}

function EvacuationPathLine({ path }: { path: EvacuationPath }) {
  const points = useMemo(() => [
    [path.start.x, path.start.y, path.start.z] as [number, number, number],
    [path.end.x, path.end.y, path.end.z] as [number, number, number],
  ], [path]);

  const [opacity, setOpacity] = useState(0.8);
  const ref = useRef<any>(null);

  useFrame((state) => {
    setOpacity(0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.4);
  });

  return (
    <Line
      ref={ref}
      points={points}
      color="#00E5FF"
      lineWidth={3}
      transparent
      opacity={opacity}
    />
  );
}

function FireLaneLine({ points }: { points: PathPoint[] }) {
  const vecPoints = useMemo(
    () => points.map((p) => [p.x, p.y, p.z] as [number, number, number]),
    [points]
  );

  const [opacity, setOpacity] = useState(0.9);
  const ref = useRef<any>(null);

  useFrame((state) => {
    setOpacity(0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.3);
  });

  return (
    <Line
      ref={ref}
      points={vecPoints}
      color="#FF3D57"
      lineWidth={4}
      transparent
      opacity={opacity}
    />
  );
}

function SprinklerParticles({ position }: { position: PathPoint }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 100;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = position.x + (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = position.y + 3;
      pos[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [position]);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y -= 0.05 + Math.random() * 0.02;
        if (y < position.y) {
          y = position.y + 3;
          positions.setX(i, position.x + (Math.random() - 0.5) * 2);
          positions.setZ(i, position.z + (Math.random() - 0.5) * 2);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#66CCFF" size={0.08} transparent opacity={0.8} />
    </points>
  );
}

export default function FireSystem({ active, fireAlarm }: FireSystemProps) {
  const alarmLightRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (alarmLightRef.current && active) {
      const mat = alarmLightRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.7;
    }
  });

  if (!active) return null;

  return (
    <group>
      <mesh
        ref={alarmLightRef}
        position={[fireAlarm.position.x, fireAlarm.position.y + 4, fireAlarm.position.z]}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#FF3D57" transparent opacity={0.8} />
      </mesh>

      <mesh
        position={[fireAlarm.position.x, fireAlarm.position.y + 0.05, fireAlarm.position.z]}
      >
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshBasicMaterial color="#FF3D57" transparent opacity={0.5} />
      </mesh>

      {fireAlarm.evacuationPaths.map((path, i) => (
        <EvacuationPathLine key={i} path={path} />
      ))}

      <FireLaneLine points={fireAlarm.fireLanePath} />

      {fireAlarm.sprinklerActive && (
        <SprinklerParticles position={fireAlarm.position} />
      )}
    </group>
  );
}
