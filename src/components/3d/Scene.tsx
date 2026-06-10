import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Effects } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Suspense, useEffect } from 'react';
import MarketStall from './MarketStall';
import ColdStorageUnit from './ColdStorageUnit';
import InspectionCenter from './InspectionCenter';
import ParkingLot from './ParkingLot';
import MonitorCenter from './MonitorCenter';
import HeatmapOverlay from './HeatmapOverlay';
import FireSystem from './FireSystem';
import { useAppStore } from '../../store/useAppStore';
import { Stall } from '../../types';

export default function Scene() {
  const {
    stalls,
    coldStorages,
    inspections,
    parkingSpots,
    fireAlarms,
    alerts,
    selectedObjectId,
    heatmapVisible,
    fireEmergencyActive,
    setSelectedObject,
    simulateDataUpdate,
    currentUser,
  } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      simulateDataUpdate();
    }, 3000);
    return () => clearInterval(interval);
  }, [simulateDataUpdate]);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;
  const activeFireAlarm = fireAlarms[0];

  const handleStallClick = (stall: Stall) => {
    const isMerchant = currentUser?.role === 'merchant';
    const isOwnStall = isMerchant && stall.merchantId === currentUser?.id;
    if (isMerchant && !isOwnStall) {
      return;
    }
    setSelectedObject(selectedObjectId === stall.id ? null : stall.id);
  };

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 18, 16], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        onPointerMissed={() => setSelectedObject(null)}
      >
        <color attach="background" args={[fireEmergencyActive ? '#1a0505' : '#0A1628']} />
        <fog attach="fog" args={[fireEmergencyActive ? '#330505' : '#0A1628', 20, 50]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#00E5FF" />
        {fireEmergencyActive && activeFireAlarm && (
          <pointLight
            position={[activeFireAlarm.position.x, activeFireAlarm.position.y + 5, activeFireAlarm.position.z]}
            intensity={2}
            color="#FF3D57"
            distance={30}
          />
        )}

        <Suspense fallback={null}>
          <Stars radius={50} depth={20} count={1000} factor={2} fade speed={0.5} />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[60, 40]} />
            <meshStandardMaterial color="#0a1628" />
          </mesh>

          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <gridHelper args={[60, 60, '#1e3a5f', '#0e2340']} />
          </mesh>

          <HeatmapOverlay stalls={stalls} visible={heatmapVisible} />

          {stalls.map((stall) => {
            const isMerchant = currentUser?.role === 'merchant';
            const isOwnStall = isMerchant && stall.merchantId === currentUser?.id;
            const maskedSensitiveData = isMerchant && !isOwnStall;
            return (
              <MarketStall
                key={stall.id}
                stall={stall}
                onClick={handleStallClick}
                selected={selectedObjectId === stall.id}
                maskedSensitiveData={maskedSensitiveData}
              />
            );
          })}

          {coldStorages.map((cs, i) => (
            <ColdStorageUnit
              key={cs.id}
              coldStorage={cs}
              position={[-10 + i * 0.1, 0, -6]}
            />
          ))}

          <InspectionCenter
            inspections={inspections}
            position={[10, 0, -6]}
          />

          <ParkingLot spots={parkingSpots} />

          <MonitorCenter
            position={[0, 0, -10]}
            alertCount={unacknowledgedAlerts}
          />

          {activeFireAlarm && (
            <FireSystem active={fireEmergencyActive} fireAlarm={activeFireAlarm} />
          )}

          {[-15, 15].map((x) =>
            [-12, 12].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, 4, z]}>
                <pointLight
                  intensity={0.3}
                  distance={12}
                  color={fireEmergencyActive ? '#FF3D57' : '#00E5FF'}
                />
              </mesh>
            ))
          )}
        </Suspense>

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={8}
          maxDistance={40}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />

        <Effects>
          <EffectComposer multisampling={8} enableNormalPass={false}>
            <Bloom
              intensity={fireEmergencyActive ? 2 : 1}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
            <Noise opacity={0.03} />
          </EffectComposer>
        </Effects>
      </Canvas>
    </div>
  );
}
