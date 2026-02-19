import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, TiltShift2 } from '@react-three/postprocessing';
import { useStore, Item } from './store/gameStore';
import { ChefEntity, WaiterEntity, CustomerEntity } from './components/world/Entities';
import { Floor, Table, Stove } from './components/world/Assets';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// --- Components ---
// Wrapper for Table to map game store item to 3D asset
const TableObj = ({ item }: { item: Item }) => {
    return (
      <group position={[item.x, 0, item.y]} rotation={[0, item.rotation, 0]}>
        <Table position={[0,0,0]} />
        {item.food && (
             <mesh position={[0, 1.0, 0]} castShadow>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.2} />
             </mesh>
        )}
      </group>
    );
};
  
const StoveObj = ({ item }: { item: Item }) => {
    const updateItem = useStore(state => state.updateItem);
    
    useFrame((_state, delta) => {
        if (item.isCooking) {
            const newProgress = (item.cookingProgress || 0) + delta * 30; // Cook speed
            if (newProgress >= 100) {
                updateItem(item.id, { isCooking: false, cookingProgress: 0, food: 'burger' });
            } else {
                updateItem(item.id, { cookingProgress: newProgress });
            }
        }
    });

    return (
      <group position={[item.x, 0, item.y]} rotation={[0, item.rotation, 0]}>
        <Stove position={[0,0,0]} />
        
        {item.isCooking && (
             <group>
                <pointLight position={[0, 1.2, 0]} intensity={2} color="orange" distance={3} decay={2} />
                <mesh position={[0, 1.2, 0]}>
                    <sphereGeometry args={[0.15]} />
                    <meshStandardMaterial color="orange" emissive="#ff4500" emissiveIntensity={4} toneMapped={false} />
                </mesh>
             </group>
        )}
        {item.food && !item.isCooking && (
             <mesh position={[0, 1.1, 0]}>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="gold" />
             </mesh>
        )}
        {item.isCooking && (
            <Html position={[0, 2, 0]} center>
                <div className="w-16 h-2 bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 shadow-lg">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-75" style={{ width: `${item.cookingProgress}%` }}></div>
                </div>
            </Html>
        )}
      </group>
    );
};

// --- Main App Logic ---

function GameWorld() {
    const { items, customers, staff, mode, placeItem } = useStore();
    const [previewPos, setPreviewPos] = useState<[number, number] | null>(null);

    const handleFloorClick = (point: THREE.Vector3) => {
        if (mode === 'edit') {
            const gridX = Math.round(point.x);
            const gridY = Math.round(point.z);
            placeItem(useStore.getState().selectedItemType!, gridX, gridY);
        }
    };

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight 
                position={[15, 20, 10]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
                shadow-radius={4} // Soft shadows
            >
                <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
            </directionalLight>
            
            <Environment preset="city" />
            
            <EffectComposer>
                <SSAO radius={0.4} intensity={25} luminanceInfluence={0.5} color={new THREE.Color('black')} />
                <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.6} />
                <TiltShift2 blur={0.1} />
            </EffectComposer>

            <Floor onFloorClick={handleFloorClick} />
            
            {/* Furniture */}
            {items.map(item => (
                item.type === 'table' ? <TableObj key={item.id} item={item} /> : <StoveObj key={item.id} item={item} />
            ))}

            {/* Entities */}
            {staff.map(s => (s.role === 'chef' ? <ChefEntity key={s.id} data={s} /> : <WaiterEntity key={s.id} data={s} />))}
            {customers.map(c => <CustomerEntity key={c.id} data={c} />)}
            
            {/* Edit Mode Preview */}
            {mode === 'edit' && (
                <mesh position={[0,0,0]} visible={false} 
                      onPointerMove={(e) => setPreviewPos([Math.round(e.point.x), Math.round(e.point.z)])}>
                    <planeGeometry args={[40, 40]} />
                </mesh>
            )}
            {mode === 'edit' && previewPos && (
                <group position={[previewPos[0], 0, previewPos[1]]}>
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2,0,0]}>
                        <planeGeometry args={[0.9, 0.9]} />
                        <meshBasicMaterial color="#3498db" transparent opacity={0.3} />
                    </mesh>
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2,0,0]}>
                        <ringGeometry args={[0.45, 0.5, 32]} />
                        <meshBasicMaterial color="#3498db" />
                    </mesh>
                </group>
            )}
        </>
    );
}

function UI() {
    const money = useStore(state => state.money);
    const mode = useStore(state => state.mode);
    const selectItemType = useStore(state => state.selectItemType);
    const setMode = useStore(state => state.setMode);

    return (
        <div className="absolute inset-0 pointer-events-none select-none font-sans overflow-hidden">
            {/* Top Bar - Glassmorphism */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto z-10">
                <div className="bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 transition-all hover:bg-white/20">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center text-xl shadow-inner border border-white/30">💰</div>
                    <span className="text-3xl font-black text-white drop-shadow-md tracking-wide">${money.toLocaleString()}</span>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></div>
                    <span className="text-white font-bold text-sm tracking-wider">ONLINE</span>
                </div>
            </div>

            {/* Bottom Menu - Floating Dock */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-auto items-end z-10">
                 {mode === 'play' ? (
                     <>
                        <button 
                            onClick={() => selectItemType('table')}
                            className="group relative w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-4 hover:bg-white/20 active:scale-95"
                        >
                            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white">$100</div>
                            <span className="text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">🪑</span>
                            <span className="text-xs font-bold text-white/80 mt-2 uppercase tracking-widest">Table</span>
                        </button>
                        
                        <button 
                             onClick={() => selectItemType('stove')}
                             className="group relative w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-4 hover:bg-white/20 active:scale-95"
                        >
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-white">$300</div>
                            <span className="text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">🍳</span>
                            <span className="text-xs font-bold text-white/80 mt-2 uppercase tracking-widest">Stove</span>
                        </button>
                     </>
                 ) : (
                    <button 
                        onClick={() => setMode('play')}
                        className="px-10 py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-black text-lg rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.5)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.6)] hover:-translate-y-1 transition-all active:scale-95 border-2 border-white/20"
                    >
                        ❌ CANCEL BUILD
                    </button>
                 )}
            </div>
            
            {/* Vignette Overlay for Cinema Look */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
        </div>
    );
}

function GameLoop() {
    const spawnCustomer = useStore(state => state.spawnCustomer);
    
    useEffect(() => {
        const interval = setInterval(() => {
            spawnCustomer();
        }, 3000); 
        return () => clearInterval(interval);
    }, []);

    return null;
}

function App() {
  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden touch-none">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [10, 10, 10], fov: 35 }}>
        <color attach="background" args={['#2c3e50']} />
        <fog attach="fog" args={['#2c3e50', 10, 50]} />
        <GameWorld />
        <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2.2} 
            maxDistance={30} 
            minDistance={5}
            enableDamping
            dampingFactor={0.05}
        />
        <GameLoop />
      </Canvas>
      <UI />
    </div>
  );
}

export default App;

