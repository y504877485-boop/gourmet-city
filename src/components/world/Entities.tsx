import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Float } from '@react-three/drei';
import { useStore, Customer, Staff, Item } from '../../store/gameStore';
import * as THREE from 'three';

// --- Utils ---
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
const SPEED = 2.5;

// --- Components ---

export const ChefEntity = ({ data }: { data: Staff }) => {
  const group = useRef<THREE.Group>(null);
  const updateStaff = useStore(state => state.updateStaff);
  const items = useStore(state => state.items);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Simple AI Logic
    // 1. Find Stove with order
    // 2. Walk to Stove
    // 3. Cook
    
    // Movement Logic
    if (data.targetPos) {
      const currentPos = new THREE.Vector3(group.current.position.x, 0, group.current.position.z);
      const targetVec = new THREE.Vector3(data.targetPos[0], 0, data.targetPos[2]);
      const dist = currentPos.distanceTo(targetVec);

      if (dist > 0.1) {
        const dir = targetVec.sub(currentPos).normalize().multiplyScalar(SPEED * delta);
        group.current.position.x += dir.x;
        group.current.position.z += dir.z;
        group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z);
      } else {
        // Reached target
        updateStaff(data.id, { state: 'idle', targetPos: null });
      }
    } else {
        // Idle Logic: Find Job
        const stoves = items.filter(i => i.type === 'stove' && !i.isCooking && !i.food);
        if (stoves.length > 0) {
            // Find a stove and start cooking
            const stove = stoves[0];
            const dist = Math.hypot(stove.x - group.current.position.x, stove.y - group.current.position.z);
            
            if (dist < 1.5) {
                // Start cooking
                useStore.getState().updateItem(stove.id, { isCooking: true, cookingProgress: 0 });
                updateStaff(data.id, { state: 'cooking', targetId: stove.id });
            } else {
                // Move to stove
                updateStaff(data.id, { targetPos: [stove.x, 0, stove.y], state: 'moving' });
            }
        }
    }
  });

  return (
    <group ref={group} position={data.position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.4, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <Text position={[0, 2.2, 0]} fontSize={0.2} color="black">Chef</Text>
    </group>
  );
};

export const WaiterEntity = ({ data }: { data: Staff }) => {
    const group = useRef<THREE.Group>(null);
    const updateStaff = useStore(state => state.updateStaff);
    const items = useStore(state => state.items);
  
    useFrame((state, delta) => {
      if (!group.current) return;
  
      // Movement Logic
      if (data.targetPos) {
        const currentPos = new THREE.Vector3(group.current.position.x, 0, group.current.position.z);
        const targetVec = new THREE.Vector3(data.targetPos[0], 0, data.targetPos[2]);
        const dist = currentPos.distanceTo(targetVec);
  
        if (dist > 0.1) {
          const dir = targetVec.sub(currentPos).normalize().multiplyScalar(SPEED * delta);
          group.current.position.x += dir.x;
          group.current.position.z += dir.z;
          group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z);
        } else {
            // Reached
            if (data.state === 'carrying' && data.targetId) {
                // Delivered food
                useStore.getState().updateItem(data.targetId, { food: 'burger' }); // Put food on table
                updateStaff(data.id, { state: 'idle', holding: null, targetId: undefined, targetPos: null });
            } else if (data.state === 'moving' && data.targetId) {
                 // Picked up food
                 useStore.getState().updateItem(data.targetId, { food: null }); // Remove from stove
                 updateStaff(data.id, { state: 'carrying', holding: 'burger', targetId: undefined, targetPos: null });
            } else {
                updateStaff(data.id, { state: 'idle', targetPos: null });
            }
        }
      } else {
          // Idle Logic
          if (!data.holding) {
              // Look for cooked food
              const readyStove = items.find(i => i.type === 'stove' && i.food);
              if (readyStove) {
                  updateStaff(data.id, { state: 'moving', targetPos: [readyStove.x, 0, readyStove.y], targetId: readyStove.id });
              }
          } else {
              // Look for hungry customer table
              const hungryTable = items.find(i => i.type === 'table' && i.occupiedBy && !i.food);
              if (hungryTable) {
                  updateStaff(data.id, { state: 'carrying', targetPos: [hungryTable.x, 0, hungryTable.y], targetId: hungryTable.id });
              }
          }
      }
    });
  
    return (
      <group ref={group} position={data.position}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#ffccaa" />
        </mesh>
        {data.holding && (
            <mesh position={[0, 1.2, 0.4]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="gold" />
            </mesh>
        )}
        <Text position={[0, 2.0, 0]} fontSize={0.2} color="black">Waiter</Text>
      </group>
    );
  };

export const CustomerEntity = ({ data }: { data: Customer }) => {
  const group = useRef<THREE.Group>(null);
  const updateCustomer = useStore(state => state.updateCustomerState);
  const removeCustomer = useStore(state => state.removeCustomer);
  const addMoney = useStore(state => state.addMoney);
  const items = useStore(state => state.items);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Movement
    const currentPos = new THREE.Vector3(group.current.position.x, 0, group.current.position.z);
    const targetVec = new THREE.Vector3(data.targetPos[0], 0, data.targetPos[2]);
    const dist = currentPos.distanceTo(targetVec);

    if (dist > 0.1) {
      const dir = targetVec.sub(currentPos).normalize().multiplyScalar(SPEED * delta);
      group.current.position.x += dir.x;
      group.current.position.z += dir.z;
      group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z);
    } else {
      // Reached Target Logic
      if (data.state === 'walking_in') {
        updateCustomer(data.id, { state: 'waiting_for_food' });
        // Face the table
        group.current.rotation.y = Math.PI; // Simplified facing
      } else if (data.state === 'leaving') {
        // Left the map
        useStore.getState().updateItem(data.tableId!, { occupiedBy: undefined, food: undefined });
        removeCustomer(data.id);
      }
    }

    // Eating Logic
    if (data.state === 'waiting_for_food') {
        const table = items.find(i => i.id === data.tableId);
        if (table && table.food) {
            updateCustomer(data.id, { state: 'eating', progress: 0 });
        }
    } else if (data.state === 'eating') {
        const newProgress = data.progress + delta * 20; // 5 seconds to eat
        if (newProgress >= 100) {
            // Done eating
            addMoney(50);
            updateCustomer(data.id, { state: 'leaving', targetPos: [0, 0, 10] }); // Leave to bottom
        } else {
            updateCustomer(data.id, { progress: newProgress });
        }
    }
  });

  return (
    <group ref={group} position={[0,0,10]}> {/* Spawn at door */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.9, 4, 8]} />
        <meshStandardMaterial color="#3498db" />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffccaa" />
      </mesh>
      {data.state === 'waiting_for_food' && (
        <Float speed={5} rotationIntensity={0} floatIntensity={0.5}>
            <Text position={[0, 2.2, 0]} fontSize={0.3} color="black">💭</Text>
        </Float>
      )}
      {data.state === 'eating' && (
        <Text position={[0, 2.2, 0]} fontSize={0.3} color="green">😋</Text>
      )}
    </group>
  );
};
