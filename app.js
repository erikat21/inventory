// ======================
// FIREBASE IMPORTS
// ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ======================
// FIREBASE CONFIG
// ======================
const firebaseConfig = {
  apiKey: "AIzaSyBPervhylIr3JL9LnxF4Y5RQMRbKYBPa5A",
  authDomain: "inventory-e9bdd.firebaseapp.com",
  projectId: "inventory-e9bdd",
  storageBucket: "inventory-e9bdd.firebasestorage.app",
  messagingSenderId: "425942453345",
  appId: "1:425942453345:web:449ae886b9e3178295ee20"
};

// ======================
// INIT FIREBASE
// ======================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================
// GLOBAL VARIABLES
// ======================
let itemsMap = {};

// ======================
// LOAD INVENTORY
// ======================
async function loadInventory() {
  const snapshot = await getDocs(collection(db, "inventory"));
  itemsMap = {};
  const items = [];
  snapshot.forEach(docSnap => {
    itemsMap[docSnap.id] = docSnap.data();
    items.push({ id: docSnap.id, ...docSnap.data() });
  });
  return items;
}

// ======================
// DISPLAY INVENTORY
// ======================
async function displayInventory() {
  const container = document.getElementById("inventoryList");
  if (!container) return; // skip if not on this page

  container.innerHTML = "";
  const inventory = await loadInventory();

  inventory.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    const statusClass = item.quantity < 20 ? "low" : "ok";
    const statusText = item.quantity < 20 ? "Low Stock" : "In Stock";

    card.innerHTML = `
      <div class="item-name">${item.name}</div>
      <div class="item-qty">Quantity: ${item.quantity}</div>
      <div class="badge ${statusClass}">${statusText}</div>
    `;
    container.appendChild(card);
  });
}

// ======================
// ADD NEW ITEM
// ======================
async function addItem() {
  try {
    const name = document.getElementById("newItemName").value;
    const qty = Number(document.getElementById("newItemQty").value);

    if (!name || qty <= 0) {
      alert("Enter valid item name and quantity");
      return;
    }

    await addDoc(collection(db, "inventory"), { name, quantity: qty });

    document.getElementById("newItemName").value = "";
    document.getElementById("newItemQty").value = "";

    displayInventory();
    alert("Item added!");
  } catch (err) {
    console.error("Firestore error:", err);
    alert("Error: " + err.message);
  }
}

// ======================
// LOAD DROPDOWN FOR DELIVERY PAGE
// ======================
async function loadDropdown() {
  const select = document.getElementById("itemSelect");
  if (!select) return;

  select.innerHTML = "";
  const inventory = await loadInventory();

  inventory.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

// ======================
// UPDATE ITEM QUANTITY (DELIVERY)
// ======================
async function updateItem() {
  const id = document.getElementById("itemSelect").value;
  const change = Number(document.getElementById("changeAmount").value);

  if (change <= 0) {
    alert("Enter a valid amount");
    return;
  }

  const item = itemsMap[id];
  const newQty = item.quantity - change;

  await updateDoc(doc(db, "inventory", id), { quantity: newQty });

  document.getElementById("changeAmount").value = "";
  loadDropdown();
  alert("Inventory updated!");
}



// ======================
// DOM CONTENT LOADED
// ======================
window.addEventListener("DOMContentLoaded", () => {
  // Add button on Inventory page
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.addEventListener("click", addItem);

  // Update button on Delivery page
  const updateBtn = document.getElementById("updateBtn");
  if (updateBtn) updateBtn.addEventListener("click", updateItem);

  // Initial load
  displayInventory();
  loadDropdown();
});