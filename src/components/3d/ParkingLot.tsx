import { useMemo } from 'react';
import FloatingLabel from './FloatingLabel';
import { ParkingSpot } from '../../types';

interface ParkingLotProps {
  spots: ParkingSpot[];
  onSpotClick?: (spot: ParkingSpot) => void;
}

export default function ParkingLot({ spots, onSpotClick }: ParkingLotProps) {
  const occupiedCount = spots.filter((s) => s.occupied).length;
  const mainSpots = spots.filter((s) => s.zone === 'main');
  const backupSpots = spots.filter((s) => s.zone === 'backup');
  const mainOccupied = mainSpots.filter((s) => s.occupied).length;
  const mainRemaining = mainSpots.length - mainOccupied;
  const mainRemainingPercent = mainSpots.length > 0 ? mainRemaining / mainSpots.length : 0;
  const needsBackup = mainRemainingPercent < 0.1;

  const stats = useMemo(
    () => ({
      total: spots.length,
      occupied: occupiedCount,
      remaining: spots.length - occupiedCount,
    }),
    [spots, occupiedCount]
  );

  const statusColor = needsBackup ? '#FF8C00' : '#00C48C';

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.01, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#1a2a40" />
      </mesh>

      <mesh position={[0, 0.001, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <gridHelper args={[22, 22, '#1e3a5f', '#0e2340']} />
      </mesh>

      {mainSpots.map((spot) => (
        <group key={spot.id} position={[spot.position.x, 0, spot.position.z]}>
          <mesh
            position={[0, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={() => onSpotClick?.(spot)}
          >
            <planeGeometry args={[1.8, 1.2]} />
            <meshStandardMaterial
              color={spot.occupied ? '#334155' : needsBackup ? '#FF8C00' : '#00C48C'}
              transparent
              opacity={spot.occupied ? 0.5 : 0.4}
              emissive={spot.occupied ? '#334155' : needsBackup ? '#FF8C00' : '#00C48C'}
              emissiveIntensity={spot.occupied ? 0.1 : 0.3}
            />
          </mesh>
          {spot.occupied && (
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[1.6, 0.5, 0.9]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          )}
        </group>
      ))}

      {backupSpots.map((spot) => (
        <group key={spot.id} position={[spot.position.x, 0, spot.position.z]}>
          <mesh
            position={[0, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={() => onSpotClick?.(spot)}
          >
            <planeGeometry args={[1.8, 1.2]} />
            <meshStandardMaterial
              color={spot.occupied ? '#334155' : '#7B61FF'}
              transparent
              opacity={spot.occupied ? 0.5 : needsBackup ? 0.6 : 0.3}
              emissive={spot.occupied ? '#334155' : '#7B61FF'}
              emissiveIntensity={needsBackup ? 0.5 : 0.1}
            />
          </mesh>
          {spot.occupied && (
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[1.6, 0.5, 0.9]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          )}
        </group>
      ))}

      <FloatingLabel
        position={[0, 0, 6]}
        title="智能停车场"
        subtitle={`剩余:${stats.remaining}/${stats.total}${needsBackup ? ' | 备用区已开放' : ''}`}
        color={statusColor}
        blink={needsBackup ? 'orange' : null}
      />
    </group>
  );
}
