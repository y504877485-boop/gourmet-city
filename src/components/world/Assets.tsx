import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

const CDN_URL = "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models";

// Fallback Model Component
const FallbackBox = ({ color = "red", scale = 1 }) => (
  <mesh castShadow receiveShadow scale={scale}>
    <boxGeometry />
    <meshStandardMaterial color={color} />
  </mesh>
);

// Safe Model Loader
const SafeModel = ({ url, scale = 1, fallbackColor = "white", ...props }: any) => {
  try {
    const { scene } = useGLTF(url);
    return <Clone object={scene} scale={scale} castShadow receiveShadow {...props} />;
  } catch (e) {
    console.error("Failed to load model:", url, e);
    return <FallbackBox color={fallbackColor} scale={scale} />;
  }
};

// Floor & Grid (Unchanged)
export const Floor = ({ onFloorClick }: any) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow onClick={(e) => { e.stopPropagation(); onFloorClick && onFloorClick(e.point); }}>
    <planeGeometry args={[40, 40]} />
    <meshStandardMaterial color="#7ab885" />
  </mesh>
);

export const Grid = () => <gridHelper args={[40, 40, 0xffffff, 0xffffff]} position={[0, 0.01, 0]} material-opacity={0.2} material-transparent />;

// Entities using Safe Loading
export const Table = ({ position, rotation }: any) => (
  <group position={position} rotation={rotation || [0,0,0]}>
    <Suspense fallback={<FallbackBox color="#8B4513" scale={[1.5,1,1.5]} />}>
        <SafeModel url={`${CDN_URL}/crate-table/model.gltf`} scale={1.5} fallbackColor="#8B4513" />
    </Suspense>
  </group>
);

export const Stove = ({ position, rotation }: any) => (
  <group position={position} rotation={rotation || [0,0,0]}>
    <FallbackBox color="#2c3e50" scale={1.2} /> {/* Keep procedural/box for stove for stability */}
  </group>
);

export const Chef = ({ position, isMoving }: any) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.elapsedTime * 10;
            group.current.position.y = position[1] + (isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5)*0.02);
        }
    });
    return (
        <group ref={group} position={position}>
            <Suspense fallback={<FallbackBox color="white" scale={[0.5,1,0.5]} />}>
                <SafeModel url={`${CDN_URL}/korrigan-hat/model.gltf`} scale={2} fallbackColor="white" />
            </Suspense>
        </group>
    );
};

export const Waiter = ({ position, isMoving }: any) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.elapsedTime * 10;
            group.current.position.y = position[1] + (isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5)*0.02);
        }
    });
    return (
        <group ref={group} position={position}>
            <Suspense fallback={<FallbackBox color="green" scale={[0.5,1,0.5]} />}>
                <SafeModel url={`${CDN_URL}/korrigan-wolf/model.gltf`} scale={2} fallbackColor="#27ae60" />
            </Suspense>
        </group>
    );
};

export const Customer = ({ position, isMoving }: any) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.elapsedTime * 10;
            group.current.position.y = position[1] + (isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5)*0.02);
        }
    });
    return (
        <group ref={group} position={position}>
            <Suspense fallback={<FallbackBox color="blue" scale={[0.5,0.8,0.5]} />}>
                <SafeModel url={`${CDN_URL}/korrigan-baby/model.gltf`} scale={1.5} fallbackColor="#3498db" />
            </Suspense>
        </group>
    );
};


