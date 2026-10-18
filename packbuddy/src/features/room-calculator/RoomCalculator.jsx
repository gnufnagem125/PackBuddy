import "./Room.css";
import { useMemo, useState } from "react";
import RoomScene from "./RoomScene";


import {
  DEFAULT_ROOM,
  ROOM_TYPES,
  ITEM_TYPES,
  createInitialItems,
  calculateStats,
  getItemStatus,
} from "./spaceCalculations";


export default function RoomCalculator() {
const [roomType, setRoomType] = useState("single");
const [bathroomRotation, setBathroomRotation] = useState(0);
const [kitchenRotation, setKitchenRotation] = useState(0);
const [room, setRoom] = useState({
  ...ROOM_TYPES.single,
});


const [items, setItems] = useState(() =>
  createInitialItems(ROOM_TYPES.single, "single")
);


const [selectedId, setSelectedId] = useState("bed-1");
const [newType, setNewType] = useState("suitcase24");
const [heatmapEnabled, setHeatmapEnabled] = useState(true);


  const selectedItem = items.find((item) => item.id === selectedId);
  const stats = useMemo(
    () => calculateStats(items, room),
    [items, room]
  );


  function updateRoom(key, value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return;


    setRoom((current) => ({ ...current, [key]: number }));
  }


  function addItem() {
    const info = ITEM_TYPES[newType];


    if (!info) return;


    const id = `${newType}-${Date.now()}`;


    const item = {
      ...info,
      id,
      type: newType,
      name: info.label,
      x: 0,
      z: 0,
      rotation: 0,
    };

    setItems((current) => [...current, item]);
    setSelectedId(id);
  }
  function deleteItem(id) {
  setItems((current) => current.filter((item) => item.id !== id));


  if (selectedId === id) {
    setSelectedId(null);
  }
}
  function handleRoomTypeChange(nextRoomType) {
  const nextRoom = ROOM_TYPES[nextRoomType];


  setRoomType(nextRoomType);
  setRoom({ ...nextRoom });


  setItems(
    createInitialItems(nextRoom, nextRoomType)
  );


  setSelectedId(null);
}
  function updateSelected(changes) {
    if (!selectedId) return;


    setItems((current) =>
      current.map((item) =>
        item.id === selectedId ? { ...item, ...changes } : item
      )
    );
  }

  function handleMoveItem(id, x, z) {
    setItems((current) =>
      current.map((item) =>
       item.id === id ? { ...item, x, z } : item
      )
   );
  }






  function moveSelected(dx, dz) {
    if (!selectedItem) return;


    updateSelected({
      x: Number((selectedItem.x + dx).toFixed(2)),
      z: Number((selectedItem.z + dz).toFixed(2)),
    });
  }


  function rotateSelected() {
    if (!selectedItem) return;


    updateSelected({
      rotation: ((selectedItem.rotation || 0) + 90) % 180,
    });
  }


  function deleteSelected() {
    if (selectedId) deleteItem(selectedId);
  }


  function resetRoom() {
  setRoomType("single");
  setRoom({ ...DEFAULT_ROOM });


  setItems(
    createInitialItems(DEFAULT_ROOM, "single")
  );


  setSelectedId("bed-1");
  setHeatmapEnabled(true);
}


  function statusLabel(item) {
    const status = getItemStatus(item, items, room);
    if (status === "outside") return "Outside room";
    if (status === "overlap") return "Overlap";
    return "Fits";
  }


  return (
    <main className="room-calculator app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <div>
            <h1>RoomSpace</h1>
            <p>Your university room, planned in 3D</p>
          </div>
        </div>
        <button className="secondary-button" onClick={resetRoom}>
          Reset demo
        </button>
      </header>


      <section className="intro">
        <div>
          <span className="eyebrow">YOUR ROOM, YOUR RULES</span>
          <h2>Make your space work for you.</h2>
          <p>
            Plan your room, try different furniture layouts and check
            whether your belongings fit before moving in.
          </p>
          <div className="hero-room-illustration" aria-label="Illustration of a cosy student bedroom">
            <div className="illustration-sparkle sparkle-one">✦</div>
            <div className="illustration-sparkle sparkle-two">✧</div>
            <div className="illustration-window">
              <span />
              <span />
            </div>
            <div className="illustration-picture">✿</div>
            <div className="illustration-bed">
              <div className="illustration-pillow" />
              <div className="illustration-duvet" />
            </div>
            <div className="illustration-desk">
              <span className="illustration-lamp">☼</span>
              <span className="illustration-book" />
            </div>
            <div className="illustration-plant">♧</div>
            <span className="illustration-caption">A little space to call yours</span>
          </div>




        </div>
        <div className="control-group">
          <label htmlFor="room-type">Accommodation type</label>


          <select
            id="room-type"
            value={roomType}
            onChange={(event) =>
              handleRoomTypeChange(event.target.value)
            }
          >
            {Object.values(ROOM_TYPES).map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
         <div className="control-group">
          <label htmlFor="bathroom-rotation">
            Bathroom direction
           </label>
           <select
            id="bathroom-rotation"
            value={bathroomRotation}
            onChange={(event) =>
               setBathroomRotation(Number(event.target.value))
             }
            >
              <option value={0}>Original direction (0°)</option>
              <option value={90}>Turn right (90°)</option>
              <option value={180}>Turn around (180°)</option>
              <option value={270}>Turn left (270°)</option>
            </select>
          </div>


          <div className="control-group">
            <label htmlFor="kitchen-rotation">
              Kitchenette direction
            </label>
            <select
              id="kitchen-rotation"
              value={kitchenRotation}
              onChange={(event) =>
                setKitchenRotation(Number(event.target.value))
              }
            >
              <option value={0}>Original direction (0°)</option>
              <option value={90}>Turn right (90°)</option>
              <option value={180}>Turn around (180°)</option>
              <option value={270}>Turn left (270°)</option>
            </select>
          </div>
          <p>
            {room.width.toFixed(1)} m × {room.depth.toFixed(1)} m
            {" · "}
            {room.occupants} occupant
            {room.occupants > 1 ? "s" : ""}
          </p>
        </div>
        <div className="room-size">
          <span>Current floor area</span>
          <strong>{stats.roomArea.toFixed(2)} m²</strong>
          <small>
            {room.width.toFixed(2)} × {room.depth.toFixed(2)} m
          </small>
        </div>
      </section>


<section className="accommodation-section">
  <div className="section-heading">
    <div>
      <span className="eyebrow">FIND YOUR FIT</span>
      <h3>Choose your room</h3>
      <p>Every room is a blank canvas. Make it your own.</p>
    </div>
    <span className="section-decoration">✳</span>
  </div>


  <div className="accommodation-grid">
    {Object.values(ROOM_TYPES).map((type) => {
      const illustrations = {
        single: { icon: "🛏️", caption: "Your own cosy corner" },
        ensuite: { icon: "🪞", caption: "A little extra privacy" },
        studio: { icon: "🪴", caption: "Everything in one space" },
        twin: { icon: "🛏️ 🛏️", caption: "Room to share" },
      };


      const illustration = illustrations[type.id] || {
        icon: "🏡",
        caption: "Make it feel like home",
      };


      return (
        <button
          type="button"
          key={type.id}
          className={`accommodation-card ${
            roomType === type.id ? "active" : ""
          }`}
          onClick={() => handleRoomTypeChange(type.id)}
          aria-pressed={roomType === type.id}
        >
          <span className="accommodation-art">
            <span className="accommodation-icon">
              {illustration.icon}
            </span>
            <span className="art-sparkle">✦</span>
          </span>
          <span className="accommodation-card-title">
            {type.label}
          </span>
          <span className="accommodation-card-caption">
            {illustration.caption}
          </span>
          <span className="accommodation-card-action">
            {roomType === type.id ? "✓ Selected" : "Choose room →"}
          </span>
        </button>
       );
     })}
    </div>
  </section>


      <section className="dashboard">
        <div className="workspace">
          <div className="panel-heading">
            <div>
              <h3>3D room planner</h3>
              <p>Select furniture to move, rotate or remove it.</p>
            </div>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={heatmapEnabled}
                onChange={(event) => setHeatmapEnabled(event.target.checked)}
              />
              Heatmap
            </label>
          </div>



          <RoomScene
            bathroomRotation={bathroomRotation}
            kitchenRotation={kitchenRotation}
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMoveItem={handleMoveItem}
            heatmapEnabled={heatmapEnabled}
            room={room}
              />





          <div className="legend">
            <span><i className="dot free" /> Free floor</span>
            <span><i className="dot occupied" /> Occupied</span>
            <span><i className="dot overlap" /> Overlap</span>
          </div>


          <div className="stats-grid">
            <div className="stat-card">
              <span>Room area</span>
              <strong>{stats.roomArea.toFixed(2)} m²</strong>
            </div>
            <div className="stat-card">
              <span>Total item footprints</span>
              <strong>{stats.totalFootprint.toFixed(2)} m²</strong>
            </div>
            <div className="stat-card">
              <span>Estimated free area</span>
              <strong>{stats.estimatedFreeArea.toFixed(2)} m²</strong>
            </div>
          </div>


          <p className="fine-print">
            These are estimates. The free-area calculation does not subtract
            overlapping footprints twice, and the heatmap currently treats
            every item as occupying floor space. Allow for walking space and
            door clearance when planning your layout.
          </p>
        </div>


        <aside className="sidebar">
          <section className="side-card">
            <div className="side-title">
              <div>
                <h3>Room dimensions</h3>
                <p>Enter measured internal dimensions in metres.</p>
              </div>
            </div>


            <div className="dimension-grid">
              <label>
                Width (m)
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.05"
                  value={room.width}
                  onChange={(event) => updateRoom("width", event.target.value)}
                />
              </label>
              <label>
                Depth (m)
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="0.05"
                  value={room.depth}
                  onChange={(event) => updateRoom("depth", event.target.value)}
                />
              </label>
              <label>
                Height (m)
                <input
                  type="number"
                  min="1.5"
                  max="5"
                  step="0.05"
                  value={room.height}
                  onChange={(event) => updateRoom("height", event.target.value)}
                />
              </label>
            </div>
          </section>


          <section className="side-card">
            <div className="side-title">
              <div>
                <h3>Add an item</h3>
                <p>Choose furniture or belongings.</p>
              </div>
            </div>


            <label htmlFor="item-type">Item type</label>
            <select
              id="item-type"
              value={newType}
              onChange={(event) => setNewType(event.target.value)}
            >
              {Object.entries(ITEM_TYPES).map(([type, info]) => (
                <option key={type} value={type}>{info.label}</option>
              ))}
            </select>


            <div className="item-preview">
              <span>{ITEM_TYPES[newType].label}</span>
              <small>
                {ITEM_TYPES[newType].width} × {ITEM_TYPES[newType].depth} m
              </small>
            </div>


            <button className="primary-button full-button" onClick={addItem}>
              + Add to room
            </button>
          </section>


          <section className="side-card">
            <div className="side-title">
              <div>
                <h3>Move selected item</h3>
                <p>{selectedItem?.name || "Select an item first."}</p>
              </div>
            </div>


            <div className="movement-pad">
              <span />
              <button disabled={!selectedItem} onClick={() => moveSelected(0, -0.1)}>↑</button>
              <span />
              <button disabled={!selectedItem} onClick={() => moveSelected(-0.1, 0)}>←</button>
              <button disabled={!selectedItem} onClick={() => moveSelected(0, 0.1)}>↓</button>
              <button disabled={!selectedItem} onClick={() => moveSelected(0.1, 0)}>→</button>
            </div>


            <button
              className="secondary-button full-button"
              disabled={!selectedItem}
              onClick={rotateSelected}
            >
              Rotate 90°
            </button>


            {selectedItem && (
              <div className="coordinates">
                <span>X: {selectedItem.x.toFixed(2)} m</span>
                <span>Z: {selectedItem.z.toFixed(2)} m</span>
              </div>
            )}


            <button
              className="delete-button full-button"
              disabled={!selectedItem}
              onClick={deleteSelected}
            >
              Remove selected item
            </button>
          </section>


          <section className="side-card">
            <div className="side-title">
              <div>
                <h3>Room inventory</h3>
                <p>{items.length} items placed</p>
              </div>
            </div>


            <div className="inventory-list">
              {items.map((item) => {
                const status = statusLabel(item);
                return (
                  <button
                    key={item.id}
                    className={`inventory-item ${item.id === selectedId ? "selected" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span
                      className="inventory-swatch"
                      style={{ background: item.color }}
                    />
                    <span className="inventory-name">
                      <strong>{item.name}</strong>
                      <small>
                        {item.width.toFixed(2)} × {item.depth.toFixed(2)} m
                      </small>
                    </span>
                    <span className={`status ${status === "Fits" ? "status-ok" : "status-warning"}`}>
                      {status}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </section>


      <footer className="footer">
        HallSpace 3D · University room planning prototype
      </footer>
    </main>
  );
}



