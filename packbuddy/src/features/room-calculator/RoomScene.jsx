import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  DEFAULT_ROOM,
  getBounds,
  getItemStatus,
} from "./spaceCalculations";
import { useRef, useState } from "react";
import { Plane, Vector3 } from "three";
function DraggableFixture({
  position,
  rotation = 0,
  onMove,
  onDragChange,
  children,
}) {
    const dragging = useRef(false);
    const offset = useRef({ x: 0, z: 0 });
    const floorPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
    const intersection = useRef(new Vector3());


    function handlePointerDown(event) {
      event.stopPropagation();
      const point = event.ray.intersectPlane(floorPlane.current, intersection.current);
      if (!point) return;


      offset.current = {
        x: position[0] - point.x,
        z: position[2] - point.z,
      };
      dragging.current = true;
      onDragChange(true);
      event.target.setPointerCapture(event.pointerId);
    }


    function handlePointerMove(event) {
      if (!dragging.current) return;
      const point = event.ray.intersectPlane(floorPlane.current, intersection.current);
      if (!point) return;


      onMove([
        point.x + offset.current.x,
        0,
        point.z + offset.current.z,
      ]);
    }


    function handlePointerUp(event) {
      if (!dragging.current) return;
      dragging.current = false;
      onDragChange(false);
      if (event.target.hasPointerCapture(event.pointerId)) {
        event.target.releasePointerCapture(event.pointerId);
      }
    }


    return (
      <group
        position={position}
        rotation={[0, (rotation * Math.PI) / 180, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </group>
    );
}


function RoomShell({ room }) {
  const { width, depth, height } = room;
  const plankRows = Math.ceil(depth / 0.32);


  return (
    <group>
      {/* Warm oak flooring with staggered plank seams */}
      {Array.from({ length: 24 }, (_, i) => {
        const plankWidth = width / 24;
        return (
          <mesh
            key={`floor-${i}`}
            position={[-width / 2 + (i + 0.5) * plankWidth, -0.025, 0]}
            receiveShadow
          >
            <boxGeometry args={[plankWidth - 0.008, 0.04, depth]} />
            <meshStandardMaterial
              color={
                i % 3 === 0
                  ? "#b88b60"
                  : i % 3 === 1
                    ? "#c69b70"
                    : "#d0aa80"
              }
              roughness={0.88}
            />
          </mesh>
        );
      })}


      {/* Subtle floorboard joints */}
      {Array.from({ length: plankRows + 1 }, (_, i) => (
        <mesh
          key={`floor-joint-${i}`}
          position={[0, -0.003, -depth / 2 + i * 0.32]}
        >
          <boxGeometry args={[width, 0.003, 0.006]} />
          <meshStandardMaterial color="#9f7956" roughness={1} />
        </mesh>
      ))}


      {/* Back wall */}
      <mesh
        position={[0, height / 2, -depth / 2]}
        receiveShadow
      >
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial
          color="#f4f0e9"
          roughness={0.96}
        />
      </mesh>


      {/* Left wall */}
      <mesh
        position={[-width / 2, height / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.1, height, depth]} />
        <meshStandardMaterial
          color="#e9e8e2"
          roughness={0.96}
        />
      </mesh>


      {/* White skirting boards */}
      <mesh position={[0, 0.07, -depth / 2 + 0.06]}>
        <boxGeometry args={[width - 0.1, 0.14, 0.04]} />
        <meshStandardMaterial color="#fffdf9" roughness={0.72} />
      </mesh>


      <mesh position={[-width / 2 + 0.06, 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, depth - 0.1]} />
        <meshStandardMaterial color="#fffdf9" roughness={0.72} />
      </mesh>


      {/* Window recess and frame */}
      <group position={[0, 1.55, -depth / 2 + 0.065]}>
        {/* Outer frame */}
        <mesh>
          <boxGeometry args={[1.22, 0.92, 0.065]} />
          <meshStandardMaterial
            color="#fffdf9"
            roughness={0.48}
          />
        </mesh>


        {/* Glass */}
        <mesh position={[0, 0, 0.037]}>
          <boxGeometry args={[1.08, 0.76, 0.012]} />
          <meshStandardMaterial
            color="#b8dce9"
            metalness={0.05}
            roughness={0.2}
            emissive="#8ab6c8"
            emissiveIntensity={0.12}
          />
        </mesh>


        {/* Window frame bars */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.025, 0.78, 0.025]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>


        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.1, 0.025, 0.025]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>


        {/* Window sill */}
        <mesh position={[0, -0.48, 0.09]} castShadow>
          <boxGeometry args={[1.32, 0.06, 0.24]} />
          <meshStandardMaterial color="#fffdf9" roughness={0.5} />
        </mesh>


        {/* Curtain panels */}
        {[-1, 1].map((side) => (
          <mesh
            key={`curtain-${side}`}
            position={[side * 0.68, -0.02, -0.015]}
          >
            <boxGeometry args={[0.2, 1.02, 0.055]} />
            <meshStandardMaterial
              color="#d8c9b7"
              roughness={0.98}
            />
          </mesh>
        ))}


        {/* Curtain rail */}
        <mesh position={[0, 0.51, 0.015]}>
          <boxGeometry args={[1.55, 0.025, 0.035]} />
          <meshStandardMaterial
            color="#a88c6a"
            metalness={0.25}
            roughness={0.45}
          />
        </mesh>
      </group>


      {/* Radiator */}
      <group position={[0, 0.32, -depth / 2 + 0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.42, 0.18]} />
          <meshStandardMaterial
            color="#f8f8f5"
            roughness={0.6}
          />
        </mesh>


        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={`radiator-fin-${i}`}
            position={[-0.39 + i * 0.098, 0, 0.095]}
          >
            <boxGeometry args={[0.018, 0.34, 0.012]} />
            <meshStandardMaterial
              color="#d8dedf"
              roughness={0.5}
            />
          </mesh>
        ))}


        {/* Radiator control */}
        <mesh position={[0.48, -0.12, 0.025]}>
          <cylinderGeometry args={[0.035, 0.035, 0.07, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}


function Bathroom() {
  const width = 1.2;
  const depth = 1.5;


  return (
    <group>
      {/* Enclosed bathroom walls */}
  {/* Back wall */}
  <mesh position={[0, 1.1, -0.73]}>
    <boxGeometry args={[1.2, 2.2, 0.08]} />
    <meshStandardMaterial color="#e5e7eb" />
  </mesh>

  {/* Enclosed bathroom walls */}
  {/* wall in direction of door */}
  <mesh position={[0, 1.1, 0.73]}>
    <boxGeometry args={[1.2, 2.2, 0.08]} />
    <meshStandardMaterial color="#e5e7eb" />
  </mesh>


     {/* Wall facing closet with doorway opening */}
{/* Left section */}
<mesh position={[-0.58, 1.1, -0.55]}>
  <boxGeometry args={[0.08, 2.2, depth / 2 - 0.35]} />
  <meshStandardMaterial color="#e5e7eb" />
</mesh>


{/* Right section */}
<mesh position={[-0.58, 1.1, 0.55]}>
  <boxGeometry args={[0.08, 2.2, depth / 2 - 0.35]} />
  <meshStandardMaterial color="#e5e7eb" />
</mesh>


{/* Wall above the doorway */}
<mesh position={[-0.58, 2.0, 0]}>
  <boxGeometry args={[0.08, 0.4, 0.7]} />
  <meshStandardMaterial color="#e5e7eb" />
</mesh>
{/* Toilet door */}
<mesh position={[-0.58, 1.0, 0]}>
  <boxGeometry args={[0.04, 2.0, 0.66]} />
  <meshStandardMaterial color="#9b7653" />
</mesh>



      {/* Tiled bathroom floor */}
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[width, 0.05, depth]} />
        <meshStandardMaterial color="#d9e2e3" />
      </mesh>


             {/* SHOWER AREA - upper-right side of the toilet */}


      {/* Raised shower base */}
      <mesh position={[0.27, 0.09, -0.43]}>
        <boxGeometry args={[0.52, 0.12, 0.58]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>


      {/* Shower floor */}
      <mesh position={[0.27, 0.155, -0.43]}>
        <boxGeometry args={[0.46, 0.015, 0.52]} />
        <meshStandardMaterial
          color="#b8dce5"
          roughness={0.3}
        />
      </mesh>


            {/* Glass partition 1 - separates shower from toilet */}
      <mesh position={[-0.02, 0.9, -0.43]}>
        <boxGeometry args={[0.025, 1.5, 0.58]} />
        <meshStandardMaterial
          color="#b8dce5"
          transparent
          opacity={0.4}
          roughness={0.12}
        />
      </mesh>


      {/* Support for glass partition 1 */}
      <mesh position={[-0.02, 0.9, -0.72]}>
        <boxGeometry args={[0.035, 1.5, 0.035]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.65}
        />
      </mesh>


      {/* Glass partition 2 - perpendicular to partition 1 */}
      {/* Runs along the front edge of the shower */}
      <mesh position={[0.27, 0.9, -0.14]}>
        <boxGeometry args={[0.58, 1.5, 0.025]} />
        <meshStandardMaterial
          color="#b8dce5"
          transparent
          opacity={0.4}
          roughness={0.12}
          side={2}
        />
      </mesh>


      {/* Support for glass partition 2 */}
      <mesh position={[0.56, 0.9, -0.14]}>
        <boxGeometry args={[0.035, 1.5, 0.035]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.65}
        />
      </mesh>


      {/* Shower head - mounted near the back-right corner */}
      <mesh position={[0.43, 1.75, -0.55]}>
        <cylinderGeometry args={[0.07, 0.07, 0.035, 20]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.75}
        />
      </mesh>


      {/* Shower riser - vertical pipe */}
      <mesh position={[0.49, 1.35, -0.55]}>
        <cylinderGeometry args={[0.018, 0.018, 0.75, 12]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.75}
        />
      </mesh>


              {/* TOILET - stays near the right edge, slightly towards the sink */}


      {/* Cistern */}
      <mesh position={[0.48, 0.43, 0.14]}>
        <boxGeometry args={[0.22, 0.55, 0.28]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>


      {/* Bowl projecting inward from the cistern */}
      <mesh
        position={[0.32, 0.23, 0.14]}
        scale={[0.25, 0.12, 0.19]}
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>


      {/* SINK - near the entrance on the right */}
      {/* Pedestal */}
      <mesh position={[-0.15, 0.38, 0.48]}>
        <boxGeometry args={[0.12, 0.62, 0.12]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>


           {/* SINK - moved forward towards the entrance */}


      {/* Pedestal */}
      <mesh position={[-0.15, 0.38, 0.60]}>
        <boxGeometry args={[0.12, 0.62, 0.12]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>


      {/* Sink basin */}
      <mesh position={[-0.15, 0.72, 0.60]}>
        <boxGeometry args={[0.42, 0.10, 0.34]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>


      {/* Inner basin */}
      <mesh position={[-0.15, 0.775, 0.60]}>
        <boxGeometry args={[0.30, 0.015, 0.23]} />
        <meshStandardMaterial
          color="#d9e2e3"
          roughness={0.3}
        />
      </mesh>


      {/* Tap */}
      <mesh position={[-0.15, 0.84, 0.48]}>
        <cylinderGeometry args={[0.018, 0.018, 0.13, 12]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.75}
          roughness={0.25}
        />
      </mesh>
</group>
  );
}


function Kitchenette() {
  return (
    <group>
      {/* Base cabinets, running parallel to the right wall */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.65, 0.8, 1.6]} />
        <meshStandardMaterial color="#b88f6b" />
      </mesh>


      {/* Continuous worktop */}
      <mesh position={[-0.01, 0.85, 0]}>
        <boxGeometry args={[0.72, 0.08, 1.68]} />
        <meshStandardMaterial color="#e9e4dc" roughness={0.35} />
      </mesh>


      {/* Wall cupboards */}
      <mesh position={[-0.22, 1.65, 0]}>
        <boxGeometry args={[0.35, 0.65, 1.45]} />
        <meshStandardMaterial color="#f0e8dc" />
      </mesh>


      {/* Sink */}
      <mesh position={[-0.12, 0.91, -0.48]}>
        <boxGeometry args={[0.32, 0.025, 0.38]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} />
      </mesh>


      {/* Hob */}
      <mesh position={[-0.12, 0.91, 0.12]}>
        <boxGeometry args={[0.34, 0.025, 0.38]} />
        <meshStandardMaterial color="#303943" roughness={0.25} />
      </mesh>


      {/* Two hob rings */}
      {[-0.08, 0.08].map((offset) => (
        <mesh
          key={offset}
          position={[-0.12, 0.93, 0.12 + offset]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.055, 0.08, 24]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}


      {/* Fridge front, under the worktop */}
      <mesh position={[-0.335, 0.4, 0.57]}>
        <boxGeometry args={[0.025, 0.65, 0.36]} />
        <meshStandardMaterial color="#dce3e8" />
      </mesh>
    </group>
  );
}
function Heatmap({ items, room }) {
  const columns = 30;
  const rows = 24;
  const cells = [];


  for (let ix = 0; ix < columns; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const cellWidth = room.width / columns;
      const cellDepth = room.depth / rows;
      const x = -room.width / 2 + (ix + 0.5) * cellWidth;
      const z = -room.depth / 2 + (iz + 0.5) * cellDepth;


      const count = items.filter((item) => {
        const b = getBounds(item);
        return (
          x >= b.minX &&
          x <= b.maxX &&
          z >= b.minZ &&
          z <= b.maxZ
        );
      }).length;


      const color = count > 1 ? "#ff0000" : count === 1 ? "#ffd700" : "#4ade80";


      cells.push(
        <mesh
          key={`${ix}-${iz}`}
          position={[x, 0.004, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cellWidth * 0.94, cellDepth * 0.94]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.8}
            depthWrite={false}
            side={2}
          />
        </mesh>
      );
    }
  }


  return <group>{cells}</group>;
}


function FurnitureShape({ item, color }) {
  const { width: w, depth: d, height: h, type } = item;


  const wood = "#c69b70";
  const darkWood = "#a98260";
  const metal = "#aeb5bd";
  const fabric = "#e8e0d4";


  // BED
  if (type === "bed") {
    return (
      <group>
        {/* Wooden bed frame */}
        <mesh position={[0, h * 0.25, 0]} castShadow>
          <boxGeometry args={[w, h * 0.45, d]} />
          <meshStandardMaterial
            color={darkWood}
            roughness={0.8}
          />
        </mesh>


        {/* Mattress */}
        <mesh position={[0, h * 0.56, 0]} castShadow>
          <boxGeometry args={[w * 0.97, h * 0.28, d * 0.98]} />
          <meshStandardMaterial
            color={fabric}
            roughness={0.96}
          />
        </mesh>


        {/* Duvet */}
        <mesh position={[0, h * 0.73, d * 0.12]} castShadow>
          <boxGeometry args={[w * 0.92, 0.045, d * 0.68]} />
          <meshStandardMaterial
            color="#b9cbdc"
            roughness={1}
          />
        </mesh>


        {/* Folded blanket */}
        <mesh position={[0, h * 0.77, d * 0.37]}>
          <boxGeometry args={[w * 0.92, 0.025, d * 0.16]} />
          <meshStandardMaterial
            color="#8fa8bd"
            roughness={1}
          />
        </mesh>


        {/* Pillow pair */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * w * 0.23, h * 0.74, -d * 0.36]}
          >
            <boxGeometry args={[w * 0.42, 0.065, d * 0.17]} />
            <meshStandardMaterial
              color="#fffdf9"
              roughness={1}
            />
          </mesh>
        ))}


        {/* Headboard */}
        <mesh position={[0, h * 0.78, -d * 0.49]} castShadow>
          <boxGeometry args={[w, h * 0.42, 0.075]} />
          <meshStandardMaterial
            color={darkWood}
            roughness={0.75}
          />
        </mesh>
      </group>
    );
  }


  // STUDY DESK
  if (type === "desk") {
    return (
      <group>
        {/* Desktop */}
        <mesh position={[0, h - 0.06, 0]} castShadow>
          <boxGeometry args={[w, 0.12, d]} />
          <meshStandardMaterial color={wood} roughness={0.76} />
        </mesh>


        {/* Four legs */}
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${x}-${z}`}
              position={[
                x * w * 0.43,
                (h - 0.12) / 2,
                z * d * 0.4,
              ]}
              castShadow
            >
              <boxGeometry args={[0.055, h - 0.12, 0.055]} />
              <meshStandardMaterial
                color={darkWood}
                roughness={0.8}
              />
            </mesh>
          ))
        )}


        {/* Drawer body */}
        <mesh position={[0, h - 0.23, -d * 0.12]}>
          <boxGeometry args={[w * 0.42, 0.2, d * 0.72]} />
          <meshStandardMaterial color={darkWood} roughness={0.8} />
        </mesh>


        {/* Drawer front */}
        <mesh position={[0, h - 0.23, d * 0.26]}>
          <boxGeometry args={[w * 0.4, 0.15, 0.018]} />
          <meshStandardMaterial color={wood} roughness={0.76} />
        </mesh>


        {/* Drawer handle */}
        <mesh position={[0, h - 0.23, d * 0.26 + 0.014]}>
          <boxGeometry args={[0.1, 0.018, 0.025]} />
          <meshStandardMaterial
            color={metal}
            metalness={0.65}
            roughness={0.32}
          />
        </mesh>
      </group>
    );
  }


  // CHAIR
  if (type === "chair") {
    return (
      <group>
        {/* Cushioned seat */}
        <mesh position={[0, h * 0.54, 0]} castShadow>
          <boxGeometry args={[w, 0.09, d]} />
          <meshStandardMaterial color={color} roughness={0.94} />
        </mesh>


        {/* Backrest */}
        <mesh position={[0, h * 0.77, -d * 0.42]} castShadow>
          <boxGeometry args={[w, h * 0.44, 0.07]} />
          <meshStandardMaterial color={color} roughness={0.94} />
        </mesh>


        {/* Legs */}
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <mesh
              key={`${x}-${z}`}
              position={[x * w * 0.38, h * 0.25, z * d * 0.38]}
            >
              <boxGeometry args={[0.035, h * 0.5, 0.035]} />
              <meshStandardMaterial
                color="#414b56"
                metalness={0.35}
                roughness={0.55}
              />
            </mesh>
          ))
        )}
      </group>
    );
  }


  // WARDROBE
  if (type === "wardrobe") {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={wood} roughness={0.8} />
        </mesh>


        {/* Two doors */}
        {[-1, 1].map((side) => (
          <mesh
            key={`door-${side}`}
            position={[side * w * 0.25, h / 2, d / 2 + 0.006]}
          >
            <boxGeometry args={[w * 0.48, h * 0.94, 0.015]} />
            <meshStandardMaterial
              color={side === -1 ? "#cda780" : "#c29a70"}
              roughness={0.78}
            />
          </mesh>
        ))}


        {/* Door handles */}
        {[-1, 1].map((side) => (
          <mesh
            key={`handle-${side}`}
            position={[side * w * 0.045, h * 0.52, d / 2 + 0.025]}
          >
            <boxGeometry args={[0.025, 0.16, 0.025]} />
            <meshStandardMaterial
              color={metal}
              metalness={0.65}
              roughness={0.32}
            />
          </mesh>
        ))}
      </group>
    );
  }


  // KETTLE AND RICE COOKER
  if (type === "kettle" || type === "riceCooker") {
    return (
      <group>
        <mesh position={[0, h * 0.42, 0]} castShadow>
          <cylinderGeometry
            args={[w * 0.42, w * 0.48, h * 0.7, 32]}
          />
          <meshStandardMaterial
            color={color}
            metalness={0.18}
            roughness={0.3}
          />
        </mesh>


        <mesh position={[0, h * 0.8, 0]}>
          <cylinderGeometry args={[w * 0.4, w * 0.4, 0.035, 32]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} />
        </mesh>


        {type === "kettle" && (
          <mesh
            position={[w * 0.32, h * 0.48, 0]}
            rotation={[0, 0, -Math.PI / 2]}
          >
            <torusGeometry args={[w * 0.22, 0.018, 10, 20, Math.PI]} />
            <meshStandardMaterial color="#303943" roughness={0.5} />
          </mesh>
        )}
      </group>
    );
  }


  // SUITCASES: regular, 24-inch, 26-inch and 28-inch
  if (
    ["suitcase", "suitcase24", "suitcase26", "suitcase28"].includes(type)
  ) {
    return (
      <group>
        <mesh position={[0, h * 0.44, 0]} castShadow>
          <boxGeometry args={[w, h * 0.86, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>


        {/* Front shell panel */}
        <mesh position={[0, h * 0.44, d / 2 + 0.006]}>
          <boxGeometry args={[w * 0.88, h * 0.72, 0.012]} />
          <meshStandardMaterial
            color={color}
            roughness={0.85}
          />
        </mesh>


        {/* Shell ridges */}
        {[-0.25, 0, 0.25].map((fraction) => (
          <mesh
            key={fraction}
            position={[w * fraction, h * 0.44, d / 2 + 0.014]}
          >
            <boxGeometry args={[0.012, h * 0.68, 0.008]} />
            <meshStandardMaterial
              color="#64748b"
              roughness={0.65}
            />
          </mesh>
        ))}


        {/* Telescopic handle */}
        <mesh position={[0, h * 0.91, 0]}>
          <boxGeometry args={[w * 0.045, h * 0.13, 0.025]} />
          <meshStandardMaterial color="#64748b" metalness={0.65} />
        </mesh>


        <mesh position={[0, h * 0.98, 0]}>
          <boxGeometry args={[w * 0.3, 0.035, 0.045]} />
          <meshStandardMaterial color="#303943" roughness={0.55} />
        </mesh>


        {/* Small wheels */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * w * 0.38, 0.035, d * 0.3]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.035, 0.035, 0.035, 16]} />
            <meshStandardMaterial color="#303943" roughness={0.6} />
          </mesh>
        ))}
      </group>
    );
  }


  // MINI FRIDGE
  if (type === "miniFridge") {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color="#dbe3e9"
            metalness={0.12}
            roughness={0.35}
          />
        </mesh>


        {/* Front door */}
        <mesh position={[0, h * 0.48, d / 2 + 0.008]}>
          <boxGeometry args={[w * 0.9, h * 0.88, 0.018]} />
          <meshStandardMaterial
            color="#edf1f4"
            metalness={0.1}
            roughness={0.32}
          />
        </mesh>


        {/* Handle */}
        <mesh position={[w * 0.34, h * 0.53, d / 2 + 0.025]}>
          <boxGeometry args={[0.018, h * 0.16, 0.025]} />
          <meshStandardMaterial
            color={metal}
            metalness={0.65}
            roughness={0.32}
          />
        </mesh>
      </group>
    );
  }


  // MICROWAVE
  if (type === "microwave") {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>


        <mesh position={[-w * 0.08, h * 0.52, d / 2 + 0.008]}>
          <boxGeometry args={[w * 0.68, h * 0.65, 0.012]} />
          <meshStandardMaterial
            color="#263442"
            roughness={0.22}
            metalness={0.15}
          />
        </mesh>


        <mesh position={[w * 0.39, h * 0.5, d / 2 + 0.015]}>
          <boxGeometry args={[w * 0.07, h * 0.48, 0.02]} />
          <meshStandardMaterial color={metal} metalness={0.65} />
        </mesh>


        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[w * 0.35, h * (0.72 - i * 0.19), d / 2 + 0.018]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.012, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.4} />
          </mesh>
        ))}
      </group>
    );
  }


  // TOASTER
  if (type === "toaster") {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h * 0.85, d]} />
          <meshStandardMaterial
            color="#d1d5db"
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>


        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * w * 0.2, h * 0.94, 0]}
          >
            <boxGeometry args={[w * 0.12, 0.008, d * 0.65]} />
            <meshStandardMaterial color="#303943" />
          </mesh>
        ))}


        <mesh position={[w * 0.52, h * 0.48, 0]}>
          <boxGeometry args={[0.025, h * 0.22, 0.035]} />
          <meshStandardMaterial color={metal} metalness={0.65} />
        </mesh>
      </group>
    );
  }


  // AIR FRYER
  if (type === "airFryer") {
    return (
      <group>
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[w * 0.9, h * 0.9, d * 0.9]} />
          <meshStandardMaterial color="#374151" roughness={0.38} />
        </mesh>


        <mesh position={[0, h * 0.4, d * 0.46]}>
          <boxGeometry args={[w * 0.78, h * 0.46, 0.025]} />
          <meshStandardMaterial color="#4b5563" roughness={0.4} />
        </mesh>


        <mesh position={[0, h * 0.4, d * 0.49]}>
          <boxGeometry args={[w * 0.28, 0.035, 0.035]} />
          <meshStandardMaterial color={metal} metalness={0.55} />
        </mesh>


        <mesh position={[0, h * 0.78, d * 0.47]}>
          <boxGeometry args={[w * 0.4, 0.025, 0.018]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    );
  }


  // DESK FAN
  if (type === "fan") {
    return (
      <group>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[w * 0.42, w * 0.46, 0.08, 24]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.45} />
        </mesh>


        <mesh position={[0, h * 0.38, 0]}>
          <cylinderGeometry args={[0.025, 0.035, h * 0.6, 16]} />
          <meshStandardMaterial color={metal} metalness={0.5} />
        </mesh>


        <group position={[0, h * 0.76, 0]}>
          <mesh>
            <cylinderGeometry args={[w * 0.12, w * 0.12, 0.1, 20]} />
            <meshStandardMaterial color="#64748b" metalness={0.45} />
          </mesh>


          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              position={[0, 0, 0.025]}
              rotation={[0, 0, (i * Math.PI * 2) / 3]}
            >
              <boxGeometry args={[w * 0.16, h * 0.27, 0.025]} />
              <meshStandardMaterial color="#e5e7eb" roughness={0.45} />
            </mesh>
          ))}


          <mesh position={[0, 0, 0.07]}>
            <torusGeometry args={[w * 0.38, 0.012, 8, 32]} />
            <meshStandardMaterial color={metal} metalness={0.55} />
          </mesh>
        </group>
      </group>
    );
  }


  // LAUNDRY BASKET
  if (type === "laundryBasket") {
    return (
      <group>
        <mesh position={[0, h * 0.43, 0]}>
          <boxGeometry args={[w, h * 0.82, d]} />
          <meshStandardMaterial color="#b8a58a" roughness={0.95} />
        </mesh>


        {Array.from({ length: 4 }, (_, i) => (
          <mesh
            key={i}
            position={[0, h * (0.22 + i * 0.16), d / 2 + 0.008]}
          >
            <boxGeometry args={[w * 0.75, 0.018, 0.012]} />
            <meshStandardMaterial color="#8d7c67" roughness={0.95} />
          </mesh>
        ))}


        <mesh position={[0, h * 0.86, 0]}>
          <boxGeometry args={[w * 1.04, 0.035, d * 1.04]} />
          <meshStandardMaterial color="#a28d74" roughness={0.9} />
        </mesh>
      </group>
    );
  }


  // BEDSIDE TABLE
  if (type === "bedsideTable") {
    return (
      <group>
        <mesh position={[0, h * 0.45, 0]} castShadow>
          <boxGeometry args={[w, h * 0.82, d]} />
          <meshStandardMaterial color={wood} roughness={0.8} />
        </mesh>


        <mesh position={[0, h * 0.7, d / 2 + 0.012]}>
          <boxGeometry args={[w * 0.82, h * 0.22, 0.018]} />
          <meshStandardMaterial color="#d0aa80" roughness={0.8} />
        </mesh>


        <mesh position={[0, h * 0.7, d / 2 + 0.027]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color={metal} metalness={0.65} />
        </mesh>
      </group>
    );
  }


  // FLOOR LAMP
  if (type === "floorLamp") {
    return (
      <group>
        <mesh position={[0, 0.035, 0]}>
          <cylinderGeometry args={[w * 0.48, w * 0.48, 0.07, 24]} />
          <meshStandardMaterial color={metal} metalness={0.5} />
        </mesh>


        <mesh position={[0, h * 0.47, 0]}>
          <cylinderGeometry args={[0.018, 0.025, h * 0.84, 16]} />
          <meshStandardMaterial color="#b6a184" metalness={0.3} />
        </mesh>


        <mesh position={[0, h * 0.86, 0]}>
          <cylinderGeometry args={[w * 0.5, w * 0.32, h * 0.23, 24, 1, true]} />
          <meshStandardMaterial
            color="#e8dfd1"
            side={2}
            roughness={0.9}
          />
        </mesh>


        <mesh position={[0, h * 0.74, 0]}>
          <sphereGeometry args={[0.045, 16, 12]} />
          <meshStandardMaterial
            color="#fff0c2"
            emissive="#ffcf70"
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>
    );
  }


  // POTTED PLANT
  if (type === "plant") {
    return (
      <group>
        <mesh position={[0, h * 0.16, 0]}>
          <cylinderGeometry args={[w * 0.38, w * 0.28, h * 0.32, 20]} />
          <meshStandardMaterial color="#b87553" roughness={0.92} />
        </mesh>


        <mesh position={[0, h * 0.33, 0]}>
          <cylinderGeometry args={[w * 0.4, w * 0.4, 0.035, 20]} />
          <meshStandardMaterial color="#4a392e" roughness={1} />
        </mesh>


        <mesh position={[0, h * 0.57, 0]}>
          <cylinderGeometry args={[0.018, 0.025, h * 0.45, 12]} />
          <meshStandardMaterial color="#527247" roughness={1} />
        </mesh>


        {[
          [0, 0.68, 0],
          [-0.12, 0.58, 0.02],
          [0.12, 0.58, -0.02],
          [0, 0.52, 0.1],
          [0, 0.52, -0.1],
        ].map(([x, y, z], i) => (
          <mesh
            key={i}
            position={[x * (w / 0.35), y * h, z * (d / 0.35)]}
            scale={[0.85, 1, 0.8]}
          >
            <sphereGeometry args={[w * 0.27, 16, 12]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#477a55" : "#5b8b60"}
              roughness={1}
            />
          </mesh>
        ))}
      </group>
    );
  }


  // GENERIC FALLBACK
  return (
    <mesh position={[0, h / 2, 0]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  );
}


function RoomObject({
  item,
  items,
  selected,
  onSelect,
  room,
  onMoveItem,
  onDragStart,
  onDragEnd,
}) {
  const status = getItemStatus(item, items, room);


  const color =
    status === "overlap"
      ? "#ef4444"
      : status === "outside"
        ? "#f97316"
        : item.color;


  const dragOffset = useRef(null);
  const floorPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const intersection = useRef(new Vector3());


  function handlePointerDown(event) {
    if (event.button !== 0) return;


    event.stopPropagation();
    onSelect(item.id);


    const point = event.ray.intersectPlane(
      floorPlane.current,
      intersection.current
    );


    if (!point) return;


    dragOffset.current = {
      x: item.x - point.x,
      z: item.z - point.z,
    };


    onDragStart();


    // Keep receiving pointer events while dragging.
    event.target.setPointerCapture(event.pointerId);
    document.body.style.cursor = "grabbing";
  }


  function handlePointerMove(event) {
    if (!dragOffset.current) return;


    event.stopPropagation();


    const point = event.ray.intersectPlane(
      floorPlane.current,
      intersection.current
    );


    if (!point) return;


    onMoveItem(
      item.id,
      Number((point.x + dragOffset.current.x).toFixed(3)),
      Number((point.z + dragOffset.current.z).toFixed(3))
    );
  }


  function finishDragging(event) {
    if (!dragOffset.current) return;


    dragOffset.current = null;
    document.body.style.cursor = "";


    try {
      event.target.releasePointerCapture(event.pointerId);
    } catch {
      // The pointer may already have been released.
    }


    onDragEnd();
  }


  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDragging}
      onPointerCancel={finishDragging}
      onLostPointerCapture={finishDragging}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      <FurnitureShape item={item} color={color} />
        {status === "overlap" && (
    <mesh
        position={[0, item.height / 2, 0]}
    >
        <boxGeometry
        args={[
            item.width + 0.05,
            item.height + 0.05,
            item.depth + 0.05,
        ]}
        />
        <meshBasicMaterial
        color="#ff0000"
        wireframe
        depthTest={false}
        toneMapped={false}
        />
    </mesh>
    )}


      {selected && (
        <mesh position={[0, item.height + 0.06, 0]}>
          <boxGeometry
            args={[
              item.width + 0.12,
              0.025,
              item.depth + 0.12,
            ]}
          />
          <meshBasicMaterial color="#2563eb" wireframe />
        </mesh>
      )}
    </group>
  );
}


    function EntranceDoor({ room }) {
    // Offset from the centre, but not pushed into a corner.
    const doorX = -room.width * 0.05;
    const doorZ = room.depth / 2 - 0.04;
    const doorWidth = 0.85;
    const doorHeight = 2.05;


    return (
        <group position={[doorX, 0, doorZ]}>
        {/* Left door frame */}
        <mesh position={[-doorWidth / 2, doorHeight / 2, 0]}>
            <boxGeometry args={[0.07, doorHeight, 0.12]} />
            <meshStandardMaterial color="#b28a68" />
        </mesh>


        {/* Right door frame */}
        <mesh position={[doorWidth / 2, doorHeight / 2, 0]}>
            <boxGeometry args={[0.07, doorHeight, 0.12]} />
            <meshStandardMaterial color="#b28a68" />
        </mesh>


        {/* Top of frame */}
        <mesh position={[0, doorHeight, 0]}>
            <boxGeometry args={[doorWidth + 0.07, 0.08, 0.12]} />
            <meshStandardMaterial color="#b28a68" />
        </mesh>


        {/* Door panel */}
        <mesh position={[0, doorHeight / 2, -0.045]}>
            <boxGeometry args={[doorWidth - 0.06, doorHeight - 0.04, 0.045]} />
            <meshStandardMaterial color="#c69b70" />
        </mesh>


        {/* Door handle */}
        <mesh position={[doorWidth * 0.3, 1.0, 0.015]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
        </group>
    );
    }


export default function RoomScene({
  items,
  selectedId,
  onSelect,
  onMoveItem,
  heatmapEnabled,
  room = DEFAULT_ROOM,
  bathroomRotation = 0,
  kitchenRotation = 0,
}) {
  const [bathroomOffset, setBathroomOffset] = useState([0, 0]);
  const [kitchenOffset, setKitchenOffset] = useState([0, 0]);
  const bathroomAnchor = [room.width / 2 - 0.65, room.depth / 2 - 1.0];
  const kitchenAnchor = [-room.width / 2 + 0.7, room.depth / 2 - 0.8];
  const bathroomPosition = [
    bathroomAnchor[0] + bathroomOffset[0],
    0,
    bathroomAnchor[1] + bathroomOffset[1],
  ];
  const kitchenPosition = [
    kitchenAnchor[0] + kitchenOffset[0],
    0,
    kitchenAnchor[1] + kitchenOffset[1],
  ];
  const [fixtureDragging, setFixtureDragging] = useState(false);
  const [isDragging, setIsDragging] = useState(false);


  function moveBathroom(position) {
    setBathroomOffset([
      position[0] - bathroomAnchor[0],
      position[2] - bathroomAnchor[1],
    ]);
  }


  function moveKitchen(position) {
    setKitchenOffset([
      position[0] - kitchenAnchor[0],
      position[2] - kitchenAnchor[1],
    ]);
  }
  return (
    <div className="scene-container">
      <Canvas
        shadows="soft"
        camera={{ position: [6.5, 5.5, 7], fov: 40 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        >
        <color attach="background" args={["#e8e5df"]} />
        <fog attach="fog" args={["#e8e5df", 14, 26]} />


        {/* Soft general room lighting */}
        <ambientLight intensity={0.65} />
        <hemisphereLight
            args={["#ffffff", "#b6a18b", 1.1]}
        />


        {/* Main light entering from the window side */}
        <directionalLight
            position={[-4, 8, 5]}
            intensity={2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0003}
        />


  {/* Gentle fill light to soften dark corners */}
  <pointLight
    position={[0, 2, -2]}
    intensity={0.3}
    distance={9}
  />


  {/* Keep the rest of your existing scene here */}


    <RoomShell room={room} />


    <EntranceDoor room={room} />


    {room.ensuite && (
  <DraggableFixture
    position={bathroomPosition}
      rotation={bathroomRotation}
    onMove={moveBathroom}
    onDragChange={setFixtureDragging}
  >
    <Bathroom />
  </DraggableFixture>
)}


    {room.kitchenette && (
    <DraggableFixture
        position={kitchenPosition}
        rotation={kitchenRotation}
        onMove={moveKitchen}
        onDragChange={setFixtureDragging}
    >
        <Kitchenette />
    </DraggableFixture>
    )}


        {heatmapEnabled && <Heatmap items={items} room={room} />}


        {items.map((item) => (
          <RoomObject
            key={item.id}
            item={item}
            items={items}
            selected={selectedId === item.id}
            onSelect={onSelect}
            room={room}
            onMoveItem={onMoveItem}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
          />
        ))}


        <OrbitControls
          makeDefault
          enableDamping
          enabled={!fixtureDragging && !isDragging}
          target={[0, 0.8, 0]}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.02}
        />
      </Canvas>


      <div className="scene-hint">
        Drag furniture to move · Drag empty space to rotate · Scroll to zoom
      </div>
    </div>
  );
}



