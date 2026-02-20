import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import { useStore, Customer as CustomerData, Staff } from '../../store/gameStore';
import { Chef, Waiter, Customer } from './Assets';
import * as THREE from 'three';

// --- Utils ---
const SPEED = 2.5;

// --- Components ---

export const ChefEntity = ({ data }: { data: Staff }) => {
  const group = useRef<THREE.Group>(null);
  const updateStaff = useStore(state => state.updateStaff);
  const items = useStore(state => state.items);

  useFrame((_state, delta) => {
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
        updateStaff(data.id, { state: 'idle', targetPos: null });
      }
    } else {
        // Idle Logic: Find Job
        const stoves = items.filter(i => i.type === 'stove' && !i.isCooking && !i.food);
        if (stoves.length > 0) {
            const stove = stoves[0];
            const dist = Math.hypot(stove.x - group.current.position.x, stove.y - group.current.position.z);
            
            if (dist < 1.5) {
                useStore.getState().updateItem(stove.id, { isCooking: true, cookingProgress: 0 });
                updateStaff(data.id, { state: 'cooking', targetId: stove.id });
            } else {
                updateStaff(data.id, { targetPos: [stove.x, 0, stove.y], state: 'moving' });
            }
        }
    }
  });

  return (
    <group ref={group} position={data.position}>
        <Chef position={[0,0,0]} isMoving={data.state === 'moving'} />
    </group>
  );
};

export const WaiterEntity = ({ data }: { data: Staff }) => {
    const group = useRef<THREE.Group>(null);
    const updateStaff = useStore(state => state.updateStaff);
    const items = useStore(state => state.items);
  
    useFrame((_state, delta) => {
      if (!group.current) return;
  
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
            if (data.state === 'carrying' && data.targetId) {
                useStore.getState().updateItem(data.targetId, { food: 'burger' });
                updateStaff(data.id, { state: 'idle', holding: null, targetId: undefined, targetPos: null });
            } else if (data.state === 'moving' && data.targetId) {
                 useStore.getState().updateItem(data.targetId, { food: null });
                 updateStaff(data.id, { state: 'carrying', holding: 'burger', targetId: undefined, targetPos: null });
            } else {
                updateStaff(data.id, { state: 'idle', targetPos: null });
            }
        }
      } else {
          if (!data.holding) {
              const readyStove = items.find(i => i.type === 'stove' && i.food);
              if (readyStove) {
                  updateStaff(data.id, { state: 'moving', targetPos: [readyStove.x, 0, readyStove.y], targetId: readyStove.id });
              }
          } else {
              const hungryTable = items.find(i => i.type === 'table' && i.occupiedBy && !i.food);
              if (hungryTable) {
                  updateStaff(data.id, { state: 'carrying', targetPos: [hungryTable.x, 0, hungryTable.y], targetId: hungryTable.id });
              }
          }
      }
    });
  
    return (
      <group ref={group} position={data.position}>
        <Waiter position={[0,0,0]} isMoving={data.state === 'moving' || data.state === 'carrying'} />
        {data.holding && (
            <mesh position={[0, 1.2, 0.4]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="gold" />
            </mesh>
        )}
      </group>
    );
  };

export const CustomerEntity = ({ data }: { data: CustomerData }) => {
  const group = useRef<THREE.Group>(null);
  const updateCustomer = useStore(state => state.updateCustomerState);
  const removeCustomer = useStore(state => state.removeCustomer);
  const addMoney = useStore(state => state.addMoney);
  const items = useStore(state => state.items);

  useFrame((_state, delta) => {
    if (!group.current) return;

    const currentPos = new THREE.Vector3(group.current.position.x, 0, group.current.position.z);
    const targetVec = new THREE.Vector3(data.targetPos[0], 0, data.targetPos[2]);
    const dist = currentPos.distanceTo(targetVec);

    if (dist > 0.1) {
      const dir = targetVec.sub(currentPos).normalize().multiplyScalar(SPEED * delta);
      group.current.position.x += dir.x;
      group.current.position.z += dir.z;
      group.current.lookAt(targetVec.x, group.current.position.y, targetVec.z);
    } else {
      if (data.state === 'walking_in') {
        updateCustomer(data.id, { state: 'waiting_for_food' });
        group.current.rotation.y = Math.PI; 
      } else if (data.state === 'leaving') {
        useStore.getState().updateItem(data.tableId!, { occupiedBy: undefined, food: undefined });
        removeCustomer(data.id);
      }
    }

    if (data.state === 'waiting_for_food') {
        const table = items.find(i => i.id === data.tableId);
        if (table && table.food) {
            updateCustomer(data.id, { state: 'eating', progress: 0 });
        }
    } else if (data.state === 'eating') {
        const newProgress = data.progress + delta * 20; 
        if (newProgress >= 100) {
            addMoney(50);
            updateCustomer(data.id, { state: 'leaving', targetPos: [0, 0, 10] }); 
        } else {
            updateCustomer(data.id, { progress: newProgress });
        }
    }
  });

  return (
    <group ref={group} position={[0,0,10]}> 
      <Customer position={[0,0,0]} isMoving={data.state === 'walking_in' || data.state === 'leaving'} />
      
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
