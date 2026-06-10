import { useMemo } from 'react';
import { Stall } from '../../types';
import { heatToColor } from '../../utils/alertEngine';

interface HeatmapOverlayProps {
  stalls: Stall[];
  visible: boolean;
  maskedStallIds?: string[];
  visibleStallIds?: string[];
}

export default function HeatmapOverlay({ stalls, visible, maskedStallIds, visibleStallIds }: HeatmapOverlayProps) {
  const zones = useMemo(() => {
    const result: { name: string; heat: number; position: [number, number, number]; size: [number, number] }[] = [];
    const zoneMap: Record<string, Stall[]> = {};
    stalls.forEach((s) => {
      const zone = s.name.includes('A') ? 'A' : s.name.includes('B') ? 'B' : s.name.includes('C') ? 'C' : 'D';
      if (!zoneMap[zone]) zoneMap[zone] = [];
      zoneMap[zone].push(s);
    });

    const isMasked = (stallId: string) => {
      if (maskedStallIds && maskedStallIds.includes(stallId)) return true;
      if (visibleStallIds && !visibleStallIds.includes(stallId)) return true;
      return false;
    };

    Object.entries(zoneMap).forEach(([zone, stallList], i) => {
      const avgHeat = stallList.reduce((sum, s) => sum + (isMasked(s.id) ? 50 : s.passengerHeat), 0) / stallList.length;
      const positions = stallList.map((s) => s.position);
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgZ = positions.reduce((sum, p) => sum + p.z, 0) / positions.length;
      result.push({
        name: `${zone}区`,
        heat: avgHeat,
        position: [avgX, 0.02, avgZ],
        size: [6, 4],
      });
    });
    return result;
  }, [stalls, maskedStallIds, visibleStallIds]);

  if (!visible) return null;

  return (
    <group>
      {zones.map((zone) => (
        <group key={zone.name} position={zone.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={zone.size} />
            <meshBasicMaterial
              color={heatToColor(zone.heat)}
              transparent
              opacity={0.25 + (zone.heat / 100) * 0.2}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.min(zone.size[0], zone.size[1]) * 0.3, Math.min(zone.size[0], zone.size[1]) * 0.4, 32]} />
            <meshBasicMaterial
              color={heatToColor(zone.heat)}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
