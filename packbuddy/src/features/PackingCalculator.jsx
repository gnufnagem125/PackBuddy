import "./PackingCalculator.css";
import React, { useRef, useState } from "react";


export default function PackingCalculator() {
 const [allowance, setAllowance] = useState("");
 const [items, setItems] = useState([]);
 const [totalWeight, setTotalWeight] = useState(null);
 const [scanning, setScanning] = useState(false);
 const [message, setMessage] = useState("");
 const [photoPreview, setPhotoPreview] = useState("");
 const cameraRef = useRef(null);


 // Open the phone camera or image picker
 function openCamera() {
   cameraRef.current?.click();
 }


 // Scan the selected photograph and identify the product
 async function handlePhoto(event) {
   const file = event.target.files?.[0];
   if (!file) return;


   setPhotoPreview(URL.createObjectURL(file));
   setScanning(true);
   setMessage("Scanning your item and searching for its weight...");


   try {
     const formData = new FormData();
     formData.append("image", file);


     // This endpoint must be implemented on your backend.
     const response = await fetch("/api/identify-product", {
       method: "POST",
       body: formData,
     });


     if (!response.ok) {
       throw new Error("Product lookup failed");
     }


     const product = await response.json();


    if (
  typeof product.name !== 'string' ||
  !product.name.trim() ||
  typeof product.weightKg !== 'number' ||
  !Number.isFinite(product.weightKg) ||
  product.weightKg <= 0
) {
  throw new Error('No reliable product weight was found')
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


     setMessage(
       `Identified ${product.name}. Check the weight before adding it to your final total.`
     );
   } catch (error) {
  console.error("Photo scanning failed:", error);

  setMessage(
    `Photo scanning failed: ${
      error instanceof Error ? error.message : String(error)
    }`
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


 function removeItem(id) {
   setItems((previous) => previous.filter((item) => item.id !== id));
   setTotalWeight(null);
 }


 function addItemManually() {
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
   const validItems = items.filter(
     (item) =>
       item.name.trim() !== "" &&
       item.weight !== "" &&
       Number.isFinite(Number(item.weight)) &&
       Number(item.weight) >= 0
   );


   if (validItems.length !== items.length || items.length === 0) {
     setMessage("Please enter a name and a valid weight for every item.");
     setTotalWeight(null);
     return;
   }


   setTotalWeight(
     items.reduce((sum, item) => sum + Number(item.weight), 0)
   );
   setMessage("Your luggage weight has been calculated.");
 }


 const overLimit =
   totalWeight !== null &&
   allowance !== "" &&
   Number(allowance) >= 0 &&
   totalWeight > Number(allowance);


 const remaining =
   totalWeight !== null && allowance !== "" && Number(allowance) >= 0
     ? Number(allowance) - totalWeight
     : null;


 return (
   <main className="packing-page">
     <button
       className="back-button"
       onClick={() => window.history.back()}
     >
       ← Back
     </button>


     <header className="packing-hero">
       <span className="packing-eyebrow">PACK SMARTER</span>
       <h1>Packing <span>Calculator</span></h1>
       <p className="subtitle">
         Scan your belongings and check your luggage weight.
       </p>
     </header>

     <div className="packing-card">
     {/* Suitcase weight allowance bubble */}
     <section className="allowance-bubble">
       <label htmlFor="allowance">
         🧳 Your suitcase weight allowance
       </label>
       <div className="weight-input">
         <input
           id="allowance"
           type="number"
           min="0"
           step="0.1"
           placeholder="Enter maximum weight"
           value={allowance}
           onChange={(event) => {
             setAllowance(event.target.value);
             setTotalWeight(null);
           }}
         />
         <span>kg</span>
       </div>
     </section>


     {/* Camera input */}
     <input
       ref={cameraRef}
       type="file"
       accept="image/*"
       capture="environment"
       onChange={handlePhoto}
       hidden
     />


     <button
       className="scan-button"
       onClick={openCamera}
       disabled={scanning}
     >
       {scanning ? "🔍 Scanning..." : "📸 Click to Scan"}
     </button>


     {scanning && (
       <div className="scan-status" role="status">
         <div className="scan-line" />
         <p>Recognising your product and checking its weight...</p>
       </div>
     )}


     {photoPreview && (
       <div className="photo-preview">
         <img src={photoPreview} alt="Photo of your item" />
         <p>Photo submitted for scanning</p>
       </div>
     )}


     {message && <p className="status-message">{message}</p>}


     {/* Items and weights */}
     <section className="item-section">
       <h2>Your packing list</h2>


       <div className="item-table">
         <div className="item-row item-header">
           <span>Item name</span>
           <span>Weight (kg)</span>
           <span>Action</span>
         </div>


         {items.map((item) => (
           <div className="item-row" key={item.id}>
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
               className="remove-button"
               onClick={() => removeItem(item.id)}
               aria-label={`Remove ${item.name || "item"}`}
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
           <p className="empty-list">
             Your list is empty. Scan your first item to get started!
           </p>
         )}
       </div>


       <button className="add-button" onClick={addItemManually}>
         + Add item manually
       </button>


       <button
         className="calculate-button"
         onClick={calculateTotal}
         disabled={scanning}
       >
         Calculate Total Weight
       </button>
     </section>


     {/* Comparison with suitcase allowance */}
     {totalWeight !== null && (
       <section
         className={`result-card ${overLimit ? "over-limit" : "within-limit"}`}
         aria-live="polite"
       >
         <h2>📊 Your luggage result</h2>


         <p>
           Total item weight:{" "}
           <strong>{totalWeight.toFixed(3)} kg</strong>
         </p>


         <p>
           Suitcase allowance:{" "}
           <strong>
             {allowance !== "" ? `${Number(allowance)} kg` : "Not entered"}
           </strong>
         </p>


         {remaining !== null && (
           <h3>
             {overLimit
               ? `${Math.abs(remaining).toFixed(3)} kg over your allowance`
               : `${remaining.toFixed(3)} kg remaining`}
           </h3>
         )}


         {allowance === "" && (
           <p>Enter your suitcase allowance to compare your total.</p>
         )}


         {overLimit && (
           <p>⚠️ Your items exceed the weight limit.</p>
         )}


         {totalWeight === 0 && (
           <p>Check your item weights to ensure they are correct.</p>
         )}
       </section>
     )}
     </div>
   </main>
 );
}


