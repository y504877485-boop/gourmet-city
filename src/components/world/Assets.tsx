import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// --- High Fidelity Materials ---
const tableWoodMaterial = new THREE.MeshStandardMaterial({ color: "#8B4513", roughness: 0.8 });
const clothMaterial = new THREE.MeshStandardMaterial({ color: "#fefefe", roughness: 1.0 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: "#bdc3c7", metalness: 0.8, roughness: 0.2 });
const stoveBodyMaterial = new THREE.MeshStandardMaterial({ color: "#2c3e50", roughness: 0.4 });

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
      <meshStandardMaterial color="#ecf0f1" />
    </mesh>
  );
};

export const Grid = () => {
  return (
    <gridHelper args={[40, 40, 0xbdc3c7, 0xeef2f3]} position={[0, 0.01, 0]} />
  );
};

interface PropProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export const Table: React.FC<PropProps> = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Table Top (Wood) */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow material={tableWoodMaterial}>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
      </mesh>
      
      {/* Table Cloth (Draped) */}
      <mesh position={[0, 0.76, 0]} receiveShadow material={clothMaterial}>
        <cylinderGeometry args={[0.55, 0.8, 0.4, 32, 1, true]} /> 
      </mesh>
      <mesh position={[0, 0.78, 0]} material={clothMaterial}>
         <cylinderGeometry args={[0.55, 0.55, 0.02, 32]} /> 
      </mesh>

      {/* Central Leg (Fancy) */}
      <mesh position={[0, 0.35, 0]} castShadow material={tableWoodMaterial}>
        <cylinderGeometry args={[0.1, 0.15, 0.7, 8]} />
      </mesh>
      
      {/* Base (Fancy) */}
      <mesh position={[0, 0.05, 0]} receiveShadow material={tableWoodMaterial}>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 8]} />
      </mesh>

      {/* Chair (Static Decoration) */}
      <group position={[0, 0, 1.1]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.25, 0]} castShadow material={tableWoodMaterial}>
              <boxGeometry args={[0.5, 0.05, 0.5]} />
          </mesh>
          <mesh position={[0.2, 0.125, 0.2]} material={tableWoodMaterial}><cylinderGeometry args={[0.03,0.03,0.25]} /></mesh>
          <mesh position={[-0.2, 0.125, 0.2]} material={tableWoodMaterial}><cylinderGeometry args={[0.03,0.03,0.25]} /></mesh>
          <mesh position={[0.2, 0.4, -0.2]} material={tableWoodMaterial}><cylinderGeometry args={[0.03,0.03,0.8]} /></mesh>
          <mesh position={[-0.2, 0.4, -0.2]} material={tableWoodMaterial}><cylinderGeometry args={[0.03,0.03,0.8]} /></mesh>
          <mesh position={[0, 0.6, -0.2]} material={tableWoodMaterial}><boxGeometry args={[0.5, 0.2, 0.05]} /></mesh>
      </group>
    </group>
  );
};

export const Stove: React.FC<PropProps> = ({ position, rotation = [0, 0, 0] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Body */}
      <mesh position={[0, 0.5, 0]} castShadow material={stoveBodyMaterial}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      
      {/* Stainless Steel Top */}
      <mesh position={[0, 1.01, 0]} receiveShadow material={metalMaterial}>
        <boxGeometry args={[1, 0.05, 1]} />
      </mesh>

      {/* Burners (Black Iron) */}
      <mesh position={[-0.25, 1.04, -0.25]} rotation={[-Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.25, 1.04, 0.25]} rotation={[-Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Knobs */}
      <group position={[0, 0.85, 0.51]}>
        <mesh position={[-0.3, 0, 0]} rotation={[Math.PI/2, 0, 0]} material={metalMaterial}>
             <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[Math.PI/2, 0, 0]} material={metalMaterial}>
             <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        </mesh>
      </group>
      
      {/* Oven Window */}
      <mesh position={[0, 0.4, 0.51]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
};

interface ChefProps {
  position: [number, number, number];
  isMoving?: boolean;
}

export const Chef: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (group.current && isMoving) {
            const t = state.clock.elapsedTime * 15;
            group.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.1;
            group.current.rotation.z = Math.sin(t) * 0.05;
        } else if (group.current) {
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
            group.current.rotation.z = 0;
        }
    });

    return (
        <group ref={group} position={position}>
            {/* Body */}
            <mesh position={[0, 0.6, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.6, 4, 16]} />
                <meshStandardMaterial color="white" />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 1.15, 0]} castShadow>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>

            {/* Red Scarf */}
            <mesh position={[0, 0.95, 0]} rotation={[0.2, 0, 0]}>
                <torusGeometry args={[0.26, 0.05, 8, 32]} />
                <meshStandardMaterial color="#e74c3c" />
            </mesh>

            {/* Chef Hat */}
            <group position={[0, 1.35, 0]}>
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.2, 0.25, 0.2, 32]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                     <sphereGeometry args={[0.3, 32, 16, 0, Math.PI*2, 0, Math.PI/1.5]} />
                     <meshStandardMaterial color="white" />
                </mesh>
            </group>

            {/* Face */}
            <group position={[0, 1.15, 0.18]}>
                <mesh position={[0.08, 0.02, 0]}>
                    <sphereGeometry args={[0.03]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[-0.08, 0.02, 0]}>
                    <sphereGeometry args={[0.03]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0, -0.05, 0.02]} rotation={[0,0,Math.PI/2]}>
                    <capsuleGeometry args={[0.02, 0.1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
            </group>
            
            <Text position={[0, 2.0, 0]} fontSize={0.15} color="#333" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="white">
                Chef
            </Text>
        </group>
    );
};

export const Waiter: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (group.current && isMoving) {
            const t = state.clock.elapsedTime * 15;
            group.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.1;
            group.current.rotation.z = Math.sin(t) * 0.05;
        } else if (group.current) {
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
            group.current.rotation.z = 0;
        }
    });

    return (
        <group ref={group} position={position}>
            {/* Legs (Black) */}
            <mesh position={[-0.15, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>
            <mesh position={[0.15, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>

            {/* Torso (White Shirt) */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <boxGeometry args={[0.5, 0.7, 0.3]} />
                <meshStandardMaterial color="white" />
            </mesh>

            {/* Apron (Green) */}
            <mesh position={[0, 0.9, 0.16]}>
                <planeGeometry args={[0.4, 0.6]} />
                <meshStandardMaterial color="#27ae60" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 1.15, 0.16]} rotation={[0,0,0]}>
                <planeGeometry args={[0.25, 0.3]} />
                <meshStandardMaterial color="#27ae60" side={THREE.DoubleSide} />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 1.6, 0]} castShadow>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>

            {/* Hair (Black) */}
            <mesh position={[0, 1.7, 0]}>
                <sphereGeometry args={[0.21, 32, 32, 0, Math.PI*2, 0, Math.PI/2]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>

            <Text position={[0, 2.0, 0]} fontSize={0.15} color="#333" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="white">
                Waiter
            </Text>
        </group>
    );
};

export const Customer: React.FC<ChefProps> = ({ position, isMoving = false }) => {
    const group = useRef<THREE.Group>(null);
    
    useFrame((state) => {
        if (group.current && isMoving) {
            const t = state.clock.elapsedTime * 15;
            group.current.position.y = position[1] + Math.abs(Math.sin(t)) * 0.1;
            group.current.rotation.z = Math.sin(t) * 0.05;
        } else if (group.current) {
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
            group.current.rotation.z = 0;
        }
    });

    return (
        <group ref={group} position={position}>
            {/* Legs (Blue Jeans) */}
            <mesh position={[-0.15, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.8]} />
                <meshStandardMaterial color="#2980b9" />
            </mesh>
            <mesh position={[0.15, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.8]} />
                <meshStandardMaterial color="#2980b9" />
            </mesh>

            {/* Torso (T-Shirt) */}
            <mesh position={[0, 1.1, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.6, 4, 16]} />
                <meshStandardMaterial color="#e67e22" />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 1.6, 0]} castShadow>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial color="#ffccaa" />
            </mesh>

            {/* Hair (Brown) */}
            <mesh position={[0, 1.7, 0]}>
                <sphereGeometry args={[0.23, 32, 32, 0, Math.PI*2, 0, Math.PI/2.5]} />
                <meshStandardMaterial color="#795548" />
            </mesh>

            <Text position={[0, 2.0, 0]} fontSize={0.15} color="#333" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="white">
                Guest
            </Text>
        </group>
    );
};

