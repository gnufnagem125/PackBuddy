
import React, { useRef, useState } from "react";
import "./PackingCalculator.css";

export default function PackingCalculator() {
  const [allowance, setAllowance] = useState("");
  const [items, setItems] = useState([]);
  const [totalWeight, setTotalWeight] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const cameraRef = useRef(null);

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setMessage("Scanning your item and searching for its weight...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/identify-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Product lookup failed");
      }

      const product = await response.json();

      if (
        !product.name ||
        !Number.isFinite(Number(product.weightKg)) ||
        Number(product.weightKg) < 0
      ) {
        throw new Error("No verified product weight found");
      }

      setItems((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          name: product.name,
          weight: Number(product.weightKg),
          source: product.source || "",
        },
      ]);

      setTotalWeight(null);
      setMessage(`Added ${product.name} to your packing list.`);
    } catch {
      setMessage(
        "We couldn't identify a verified weight. Please add the item manually."
      );
    } finally {
      setScanning(false);
      event.target.value = "";
    }
  }

  function updateItem(id, field, value) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setTotalWeight(null);
  }

  function addItem() {
    setItems((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        name: "",
        weight: "",
        source: "",
      },
    ]);
    setTotalWeight(null);
  }

  function calculateTotal() {
    const valid = items.every(
      (item) =>
        item.name.trim() !== "" &&
        item.weight !== "" &&
        Number.isFinite(Number(item.weight)) &&
        Number(item.weight) >= 0
    );

    if (!items.length || !valid) {
      setTotalWeight(null);
      setMessage("Add a name and valid weight for every item first.");
      return;
    }

    setTotalWeight(
      items.reduce((sum, item) => sum + Number(item.weight), 0)
    );
    setMessage("Your packing list has been calculated.");
  }

  const overLimit =
    totalWeight !== null &&
    allowance !== "" &&
    totalWeight > Number(allowance);

  return (
    <main className="feature-page packing-calculator">
      <a className="back-link" href="/">← Back to home</a>

      <span className="feature-eyebrow">PACKBUDDY TOOL 01</span>
      <h1>Smart Packing Calculator</h1>
      <p>
        Scan your belongings, build your packing list, and check
        your luggage weight before travelling.
      </p>

      <section className="allowance-panel">
        <label htmlFor="suitcase-allowance">
          🧳 Your suitcase weight allowance
        </label>
        <div className="allowance-input">
          <input
            id="suitcase-allowance"
            type="number"
            min="0"
            step="0.1"
            placeholder="Enter your maximum weight"
            value={allowance}
            onChange={(event) => {
              setAllowance(event.target.value);
              setTotalWeight(null);
            }}
          />
          <span>kg</span>
        </div>
      </section>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePhoto}
      />

      <button
        type="button"
        className="scan-button"
        disabled={scanning}
        onClick={() => cameraRef.current?.click()}
      >
        {scanning ? "🔍 Scanning..." : "📸 Click to Scan"}
      </button>

      {scanning && (
        <p className="scan-status" role="status">
          Identifying your item and checking its published weight...
        </p>
      )}

      {message && <p className="packing-message">{message}</p>}

      <section className="packing-list">
        <h2>Your packing list</h2>

        <div className="packing-row packing-header">
          <span>Item name</span>
          <span>Weight (kg)</span>
          <span>Remove</span>
        </div>

        {items.map((item) => (
          <div className="packing-row" key={item.id}>
            <input
              aria-label="Item name"
              placeholder="Item name"
              value={item.name}
              onChange={(event) =>
                updateItem(item.id, "name", event.target.value)
              }
            />

            <input
              aria-label="Item weight in kilograms"
              type="number"
              min="0"
              step="0.001"
              placeholder="0.000"
              value={item.weight}
              onChange={(event) =>
                updateItem(item.id, "weight", event.target.value)
              }
            />

            <button
              type="button"
              className="remove-item"
              aria-label={`Remove ${item.name || "item"}`}
              onClick={() => {
                setItems((previous) =>
                  previous.filter((entry) => entry.id !== item.id)
                );
                setTotalWeight(null);
              }}
            >
              ✕
            </button>

            {item.source && (
              <a
                className="product-source"
                href={item.source}
                target="_blank"
                rel="noreferrer"
              >
                Verify product weight
              </a>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="empty-packing-list">
            <span>🧳</span>
            <p>Your list is empty. Scan an item to get started!</p>
          </div>
        )}
      </section>

      <button
        type="button"
        className="add-item-button"
        onClick={addItem}
      >
        + Add item
      </button>

      <button
        type="button"
        className="calculate-weight-button"
        onClick={calculateTotal}
        disabled={scanning}
      >
        Calculate Total Weight
      </button>

      {totalWeight !== null && (
        <section
          className={`packing-result ${
            overLimit ? "packing-over-limit" : "packing-within-limit"
          }`}
          aria-live="polite"
        >
          <h2>Your luggage result</h2>
          <p>
            Total item weight: <strong>{totalWeight.toFixed(3)} kg</strong>
          </p>
          <p>
            Suitcase allowance:{" "}
            <strong>
              {allowance === "" ? "Not entered" : `${allowance} kg`}
            </strong>
          </p>

          {allowance !== "" && (
            <h3>
              {overLimit
                ? `${(totalWeight - Number(allowance)).toFixed(3)} kg over your limit`
                : `${(Number(allowance) - totalWeight).toFixed(3)} kg remaining`}
            </h3>
          )}

          {overLimit && <p>⚠️ Your items exceed your suitcase allowance.</p>}
        </section>
      )}
    </main>
  );
}
