export const ROOM_TYPES = {
  single: {
    id: "single",
    label: "Single room",
    width: 3.0,
    depth: 4.5,
    height: 2.4,
    ensuite: false,
    kitchenette: false,
    occupants: 1,
  },
  ensuite: {
    id: "ensuite",
    label: "Ensuite room",
    width: 3.2,
    depth: 5.0,
    height: 2.4,
    ensuite: true,
    kitchenette: false,
    occupants: 1,
  },
  studio: {
    id: "studio",
    label: "Studio",
    width: 4.0,
    depth: 5.5,
    height: 2.4,
    ensuite: true,
    kitchenette: true,
    occupants: 1,
  },
  twin: {
    id: "twin",
    label: "Twin room",
    width: 4.2,
    depth: 5.0,
    height: 2.4,
    ensuite: false,
    kitchenette: false,
    occupants: 2,
  },
};


export const DEFAULT_ROOM = ROOM_TYPES.single;


export const ITEM_TYPES = {
  bed: {
    label: "Single bed",
    width: 0.9,
    depth: 2.0,
    height: 0.55,
    color: "#b8c7d9",
  },
  desk: {
    label: "Study desk",
    width: 1.1,
    depth: 0.55,
    height: 0.75,
    color: "#c69b70",
  },
  wardrobe: {
    label: "Wardrobe",
    width: 0.9,
    depth: 0.55,
    height: 1.9,
    color: "#b28a68",
  },
  chair: {
    label: "Desk chair",
    width: 0.48,
    depth: 0.48,
    height: 0.85,
    color: "#53677c",
  },

    suitcase24: {
    label: "24-inch suitcase",
    width: 0.42,
    depth: 0.25,
    height: 0.60,
    color: "#64748b",
  },
  suitcase26: {
    label: "26-inch suitcase",
    width: 0.45,
    depth: 0.28,
    height: 0.66,
    color: "#475569",
  },
  suitcase28: {
    label: "28-inch suitcase",
    width: 0.48,
    depth: 0.30,
    height: 0.72,
    color: "#334155",
  },
  microwave: {
    label: "Microwave",
    width: 0.50,
    depth: 0.38,
    height: 0.30,
    color: "#cbd5e1",
  },
  toaster: {
    label: "Toaster",
    width: 0.30,
    depth: 0.20,
    height: 0.20,
    color: "#d1d5db",
  },
  airFryer: {
    label: "Air fryer",
    width: 0.30,
    depth: 0.30,
    height: 0.34,
    color: "#374151",
  },
  fan: {
    label: "Desk fan",
    width: 0.30,
    depth: 0.30,
    height: 0.48,
    color: "#e5e7eb",
  },
  laundryBasket: {
    label: "Laundry basket",
    width: 0.38,
    depth: 0.32,
    height: 0.42,
    color: "#b8a58a",
  },
  bedsideTable: {
    label: "Bedside table",
    width: 0.42,
    depth: 0.38,
    height: 0.48,
    color: "#a98260",
  },
  floorLamp: {
    label: "Floor lamp",
    width: 0.30,
    depth: 0.30,
    height: 1.55,
    color: "#d6c3a1",
  },


  miniFridge: {
    label: "Mini fridge",
    width: 0.48,
    depth: 0.5,
    height: 0.85,
    color: "#d9e0e6",
  },
  kettle: {
    label: "Kettle",
    width: 0.22,
    depth: 0.22,
    height: 0.28,
    color: "#e2e8f0",
  },
  riceCooker: {
    label: "Rice cooker",
    width: 0.28,
    depth: 0.28,
    height: 0.25,
    color: "#e2e8f0",
  },
};


export function getBounds(item) {
  const angle = ((item.rotation || 0) % 180 + 180) % 180;
  const rotated = angle >= 45 && angle < 135;


  const width = rotated ? item.depth : item.width;
  const depth = rotated ? item.width : item.depth;


  return {
    minX: item.x - width / 2,
    maxX: item.x + width / 2,
    minZ: item.z - depth / 2,
    maxZ: item.z + depth / 2,
  };
}


export function isOutsideRoom(item, room = DEFAULT_ROOM) {
  const b = getBounds(item);


  return (
    b.minX < -room.width / 2 ||
    b.maxX > room.width / 2 ||
    b.minZ < -room.depth / 2 ||
    b.maxZ > room.depth / 2
  );
}


export function overlaps(a, b) {
  const A = getBounds(a);
  const B = getBounds(b);


  return (
    A.minX < B.maxX - 0.001 &&
    A.maxX > B.minX + 0.001 &&
    A.minZ < B.maxZ - 0.001 &&
    A.maxZ > B.minZ + 0.001
  );
}


export function getItemStatus(item, items, room = DEFAULT_ROOM) {
  if (isOutsideRoom(item, room)) return "outside";


  const collision = items.some(
    (other) => other.id !== item.id && overlaps(item, other)
  );


  return collision ? "overlap" : "ok";
}


export function calculateStats(items, room = DEFAULT_ROOM) {
  const roomArea = room.width * room.depth;


  const totalFootprint = items.reduce(
    (sum, item) => sum + item.width * item.depth,
    0
  );


  const outsideCount = items.filter((item) =>
    isOutsideRoom(item, room)
  ).length;


  const overlapPairs = new Set();


  items.forEach((item, index) => {
    items.slice(index + 1).forEach((other) => {
      if (overlaps(item, other)) {
        overlapPairs.add(`${item.id}:${other.id}`);
      }
    });
  });


  // This is a rough estimate, not a precise measurement of free floor.
  const estimatedFreeArea = Math.max(
    0,
    roomArea - totalFootprint
  );


  return {
    roomArea,
    totalFootprint,
    estimatedFreeArea,
    outsideCount,
    overlapCount: overlapPairs.size,
  };
}


export function createInitialItems(
  room = DEFAULT_ROOM,
  roomType = room.id || "single"
) {
  const layouts = {
    single: [
      { id: "bed-1", type: "bed", x: 0, z: 0, rotation: 0 },
      { id: "desk-1", type: "desk", x: 0.8, z: -1.4, rotation: 0 },
      { id: "chair-1", type: "chair", x: 0.8, z: -0.7, rotation: 180 },
      { id: "wardrobe-1", type: "wardrobe", x: -1.225, z: 0.65, rotation: 90 },
    ],


    ensuite: [
      { id: "bed-1", type: "bed", x: 0, z: 0, rotation: 0 },
      { id: "desk-1", type: "desk", x: 0.8, z: -1.8, rotation: 0 },
      { id: "chair-1", type: "chair", x: 0.8, z: -1.0, rotation: 180},
      { id: "wardrobe-1", type: "wardrobe", x: -1.325, z: 0.7, rotation: 90 },
    ],


    studio: [
      { id: "bed-1", type: "bed", x: 0, z: 0, rotation: 0 },
      { id: "desk-1", type: "desk", x: 0.2, z: -1.4, rotation: 0 },
      { id: "chair-1", type: "chair", x: 0.2, z: -0.65, rotation: 180 },
      { id: "wardrobe-1", type: "wardrobe", x: -1.725, z: 0.2, rotation: 90 },
      { id: "mini-fridge-1", type: "miniFridge", x: 1.25, z: -1.2, rotation: 0 },
    ],


        twin: [
     // Beds in opposite back corners
     { id: "bed-1", type: "bed", x: -1.2, z: -1.35, rotation: 0 },
     { id: "bed-2", type: "bed", x: 1.2, z: -1.35, rotation: 0 },


     // Desks moved toward the entrance
{ id: "desk-1", type: "desk", x: -1.825, z: 1.20, rotation: 90 },
{ id: "desk-2", type: "desk", x: 1.825, z: 1.20, rotation: 90 },
        // Wardrobes along the side walls
    { id: "wardrobe-1", type: "wardrobe", x: -1.825, z: 0.0, rotation: 90 },
    { id: "wardrobe-2", type: "wardrobe", x: 1.825, z: 0.0, rotation: 90 },
       // Chairs in front of the desks, closer to the entrance
{ id: "chair-1", type: "chair", x: -1.2, z: 1.2, rotation: 270 },
{ id: "chair-2", type: "chair", x: 1.2, z: 1.2, rotation: 90 },
     ],
  };


  const selectedLayout = layouts[roomType] || layouts.single;


  const items = selectedLayout.map((item) => ({
    ...ITEM_TYPES[item.type],
    ...item,
  }));


  // Position beds in the back corners, using their actual dimensions.
  const beds = items.filter((item) => item.type === "bed");
  const bedDepth = beds[0]?.depth ?? 2;
  const bedWidth = beds[0]?.width ?? 1;


  if (beds.length === 1) {
    beds[0].x = -room.width / 2 + bedWidth / 2;
    beds[0].z = -room.depth / 2 + bedDepth / 2;
  } else if (beds.length >= 2) {
    beds[0].x = -room.width / 2 + bedWidth / 2;
    beds[0].z = -room.depth / 2 + bedDepth / 2;


    beds[1].x = room.width / 2 - bedWidth / 2;
    beds[1].z = -room.depth / 2 + bedDepth / 2;
  }


  return items;
}

