import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF, Clone } from '@react-three/drei';
import * as THREE from 'three';

// --- Assets Config ---
const CDN_URL = "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models";

// Preload common assets to prevent pop-in
useGLTF.preload(`${CDN_URL}/korrigan-hat/model.gltf`); // Chef
useGLTF.preload(`${CDN_URL}/korrigan-wolf/model.gltf`); // Waiter
useGLTF.preload(`${CDN_URL}/korrigan-baby/model.gltf`); // Customer
useGLTF.preload(`${CDN_URL}/crate-table/model.gltf`); // Table (Using crate as rustic table)
useGLTF.preload(`${CDN_URL}/stove/model.gltf`); // Stove (If available, else fallback)

// --- Fallback Materials ---
const fallbackMat = new THREE.MeshStandardMaterial({ color: "#e74c3c" });

interface FloorProps {
  onFloorClick?: (point: THREE.Vector3) => void;
}

export const Floor: React.FC<FloorProps> = ({ onFloorClick }) => {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.01, 0]} 
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onFloorClick && onFloorClick(e.point);
      }}
    >
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#7ab885" />
    </mesh>
  );
};

export const Grid = () => {
  return (
    <gridHelper args={[40, 40, 0xffffff, 0xffffff]} position={[0, 0.01, 0]} material-opacity={0.2} material-transparent />
  );
};

interface PropProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export const Table: React.FC<PropProps> = ({ position, rotation = [0, 0, 0] }) => {
  // Using a "Crate Table" for a stylized look
  const { scene } = useGLTF(`${CDN_URL}/crate-table/model.gltf`);
  
  return (
    <group position={position} rotation={[rotation[0], rotation[1], rotation[2]]}>
      <Clone object={scene} scale={1.5} castShadow receiveShadow />
      {/* Table Cloth Overlay */}
      <mesh position={[0, 1.1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.6, 32]} />
          <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

export const Stove: React.FC<PropProps> = ({ position, rotation = [0, 0, 0] }) => {
  // Fallback procedural stove if specific model missing, but let's try to make it look like a pro appliance
  return (
    <group position={position} rotation={rotation}>
      {/* Main Unit */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.2} metalness={0.5} />
      </mesh>
      
      {/* Cooktop */}
      <mesh position={[0, 1.21, 0]}>
        <boxGeometry args={[1.2, 0.05, 1.2]} />
        <meshStandardMaterial color="#95a5a6" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Burners */}
      <mesh position={[-0.3, 1.24, -0.3]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#e74c3c" emissive="#c0392b" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.3, 1.24, 0.3]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color="#e74c3c" emissive="#c0392b" emissiveIntensity={2} />
      </mesh>

      {/* Oven Door */}
      <mesh position={[0, 0.5, 0.61]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.75, 0.65]}>
          <boxGeometry args={[0.6, 0.05, 0.05]} />
          <meshStandardMaterial color="#bdc3c7" />
      </mesh>
    </group>
  );
};

interface ChefProps {
  position: [number, number, number];
  isMoving?: boolean;
}

// Character Components using PMNDRS Models (Cute fantasy creatures as staff)

export const Chef: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    const { scene } = useGLTF(`${CDN_URL}/korrigan-hat/model.gltf`);
    
    useFrame((state) => {
        if (group.current) {
            // Smooth look-at and bounce
            const t = state.clock.elapsedTime * 10;
            const bounce = isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5) * 0.02;
            group.current.position.y = position[1] + bounce;
            
            // Wobble
            group.current.rotation.z = isMoving ? Math.sin(t) * 0.05 : 0;
        }
    });

    return (
        <group ref={group} position={position}>
            <Clone object={scene} scale={2} castShadow />
            {/* Chef Hat Overlay (if model doesn't have one) */}
            <mesh position={[0, 1.8, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.4, 0.6]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <Text position={[0, 2.5, 0]} fontSize={0.2} color="white" outlineWidth={0.02} outlineColor="black">
                Chef
            </Text>
        </group>
    );
};

export const Waiter: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    const { scene } = useGLTF(`${CDN_URL}/korrigan-wolf/model.gltf`);
    
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.elapsedTime * 10;
            const bounce = isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5) * 0.02;
            group.current.position.y = position[1] + bounce;
        }
    });

    return (
        <group ref={group} position={position}>
            <Clone object={scene} scale={2} castShadow />
            {/* Apron Overlay */}
            <mesh position={[0, 0.8, 0.4]} rotation={[-0.2, 0, 0]}>
                <planeGeometry args={[0.5, 0.5]} />
                <meshStandardMaterial color="#2ecc71" />
            </mesh>
            <Text position={[0, 2.2, 0]} fontSize={0.2} color="white" outlineWidth={0.02} outlineColor="black">
                Waiter
            </Text>
        </group>
    );
};

export const Customer: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    const { scene } = useGLTF(`${CDN_URL}/korrigan-baby/model.gltf`);
    
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.elapsedTime * 15; // Faster baby steps
            const bounce = isMoving ? Math.abs(Math.sin(t)) * 0.1 : Math.sin(t*0.5) * 0.02;
            group.current.position.y = position[1] + bounce;
        }
    });

    return (
        <group ref={group} position={position}>
            <Clone object={scene} scale={1.5} castShadow />
            <Text position={[0, 1.5, 0]} fontSize={0.2} color="white" outlineWidth={0.02} outlineColor="black">
                Guest
            </Text>
        </group>
    );
};


