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
  doc,
  deleteDoc,
  getDoc 
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
let currentSort = "qty-asc";   // ✅ default sort
let currentFilter = "all";     // ✅ default filter
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
// async function displayInventory() {
//   const container = document.getElementById("inventoryList");
//   if (!container) return; // skip if not on this page

//   container.innerHTML = "";
//   const inventory = await loadInventory();
//   inventory.sort((a, b) => a.quantity - b.quantity);

//   inventory.forEach(item => {
//     const card = document.createElement("div");
//     card.className = "card";
//     const statusClass = item.quantity < 20 ? "low" : "ok";
//     const statusText = item.quantity < 20 ? "Low Stock" : "In Stock";

//     card.innerHTML = `
//         <div class="item-name">${item.name}</div>
//         <div class="item-qty">Quantity: ${item.quantity}</div>
//         <div class="badge ${statusClass}">${statusText}</div>
//         <input type="number" placeholder="Add stock" class="restockInput" data-id="${item.id}">
//         <button class = "restockBtn" data-id = "${item.id}">Restock</button>
//         <button class="deleteBtn" data-id="${item.id}">Delete</button>
//     `;
//     container.appendChild(card);
//   });
//   showLowStockWarning(inventory);
// }

async function displayInventory(searchTerm = "") {
  const container = document.getElementById("inventoryList");
  if (!container) return;

  container.innerHTML = "";

  const inventory = await loadInventory();

  // 🔍 SEARCH FILTER
  let filtered = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔁 REMOVE DUPLICATES
  const uniqueItems = Array.from(
    new Map(filtered.map(item => [item.id, item])).values()
  );

  // 🔽 SORT (default = qty-asc)
  if (currentSort === "name-asc") {
    uniqueItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === "name-desc") {
    uniqueItems.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSort === "qty-desc") {
    uniqueItems.sort((a, b) => b.quantity - a.quantity);
  } else {
    // ✅ DEFAULT
    uniqueItems.sort((a, b) => a.quantity - b.quantity);
  }

  // 🎨 RENDER
  uniqueItems.forEach(item => {
    const card = document.createElement("div");
    const statusClass = item.quantity < (item.lowStockThreshold || 20) ? "low" : "ok";
    const statusText = item.quantity < (item.lowStockThreshold || 20) ? "Low Stock" : "In Stock";

    card.className = `card ${statusClass}`;

    card.innerHTML = `
      <div class="item-name">${item.name}</div>
      <div class="item-qty">Quantity: ${item.quantity}</div>
      <div class="badge ${statusClass}">${statusText} (low stock threshold ${item.lowStockThreshold})</div>
      <input type="number" placeholder="Add stock" class="restockInput" data-id="${item.id}">
      <button class="restockBtn" data-id="${item.id}">Restock</button>
      <button class="deleteBtn" data-id="${item.id}">Delete</button>
    `;

    container.appendChild(card);
  });

  showLowStockWarning(uniqueItems);
}

async function setupInventorySearch() {
  const input = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("inventorySearchResults");

  if (!input) return;
  input.addEventListener("focus", () => {
  input.value = "";          // clear search box
  resultsDiv.innerHTML = ""; // hide previous results
  resultsDiv.style.display = "none";
});
  async function renderList(query = "") {
    const inventory = await loadInventory();

    resultsDiv.innerHTML = "";

    // Normalize query
    const searchQuery = query.trim().toLowerCase();

    // Filter items by inclusion
    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchQuery)
    );

    if (filtered.length === 0) {
      resultsDiv.style.display = "none";
      displayInventory(""); // reset if nothing matches
      return;
    }

    resultsDiv.style.display = "block";

    filtered.forEach(item => {
      const div = document.createElement("div");
      div.textContent = `${item.name} (${item.quantity})`;

      div.addEventListener("click", () => {
        input.value = item.name;
        resultsDiv.innerHTML = "";
        resultsDiv.style.display = "none";

        // 🔹 Filter inventory exactly
        displayInventory(item.name);
      });

      resultsDiv.appendChild(div);
    });

    // 🔹 If user typed exact match, filter immediately
    const exactMatch = inventory.find(item => item.name.toLowerCase() === searchQuery);
    if (exactMatch) {
      displayInventory(exactMatch.name);
    } else if (searchQuery === "") {
      displayInventory("");
    }
  }

  // Show all items on focus
  input.addEventListener("focus", () => renderList(""));

  // Filter while typing
  input.addEventListener("input", (e) => renderList(e.target.value));
}

function showLowStockWarning(inventory) {
  const warningDiv = document.getElementById("lowStockWarning");
  if (!warningDiv) return;

  const lowStockItems = inventory.filter(
    item => item.quantity < (item.lowStockThreshold || 20)
  );

  if (lowStockItems.length === 0) {
    warningDiv.innerHTML = "";
    return;
  }

  warningDiv.innerHTML = `
    <div class="warning-box">
      ⚠️ Low Stock Items:<br>
      ${lowStockItems.map(
        item => `${item.name}: ${item.quantity} left`
      ).join("<br>")}
    </div>
  `;
}

// ======================
// ADD NEW ITEM
// ======================
async function addItem() {
  try {
    const name = document.getElementById("newItemName").value.trim();
    const qty = Number(document.getElementById("newItemQty").value);
    const threshold = Number(document.getElementById("newItemThreshold")?.value) || 20;

    if (!name || qty <= 0) {
      alert("Enter valid item name and quantity");
      return;
    }

    await loadInventory();
    const exists = Object.values(itemsMap).some(
      item => item.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("Item already exists");
      return;
    }

    await addDoc(collection(db, "inventory"), { 
      name, 
      quantity: qty,
      lowStockThreshold: threshold
    });

    document.getElementById("newItemName").value = "";
    document.getElementById("newItemQty").value = "";
    if (document.getElementById("newItemThreshold")) document.getElementById("newItemThreshold").value = "";

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
let selectedItemId = null;
// async function loadDropdown() {
//   const select = document.getElementById("itemSelect");
//   if (!select) return;

//   select.innerHTML = '<option disabled selected>Select an item</option>';
//   const inventory = await loadInventory();

//   inventory.forEach(item => {
//     const option = document.createElement("option");
//     option.value = item.id;
//     option.textContent = item.name;
//     select.appendChild(option);
//   });
// }

async function setupSearch() {
  const input = document.getElementById("itemSearch");
  const resultsDiv = document.getElementById("searchResults");

  if (!input) return;

  // 🔥 FUNCTION TO RENDER LIST
  async function renderList(query = "") {
    const inventory = await loadInventory();

    resultsDiv.innerHTML = "";

    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    resultsDiv.style.display = "block";
    filtered.forEach(item => {
      const div = document.createElement("div");
      div.textContent = `${item.name} (${item.quantity})`;

      div.addEventListener("click", () => {
        input.value = item.name;
        selectedItemId = item.id;
        resultsDiv.innerHTML = "";
      });

      resultsDiv.appendChild(div);
    });
  }

  // 🔍 Show ALL items on focus
  input.addEventListener("focus", () => {
    renderList("");
  });

  // 🔍 Filter while typing
  input.addEventListener("input", (e) => {
    renderList(e.target.value);
  });
}

// ======================
// UPDATE ITEM QUANTITY (DELIVERY)
// ======================
async function updateItem() {
  const id = selectedItemId;
  const change = Number(document.getElementById("changeAmount").value);

  if (!id) {
  alert("Select an item first");
  return;
}

  if (change <= 0) {
    alert("Enter a valid amount");
    return;
  }

  const item = itemsMap[id];
  if (change > item.quantity){
    alert("That is more than what we have in our inventory list, enter a valid amount");
    return;
  }
  const newQty = item.quantity - change;

  await updateDoc(doc(db, "inventory", id), { quantity: newQty });

  document.getElementById("changeAmount").value = "";
  alert("Inventory updated!");
  selectedItemId = null;
  document.getElementById("itemSearch").value = "";
}



// ======================
// DOM CONTENT LOADED
// ======================
window.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const filterSelect = document.getElementById("filterSelect");

  // 🔥 LOAD SAVED SETTINGS
  currentSort = localStorage.getItem("sort") || "qty-asc";
  currentFilter = localStorage.getItem("filter") || "all";

  // APPLY TO UI
  if (sortSelect) sortSelect.value = currentSort;
  if (filterSelect) filterSelect.value = currentFilter;

  // 🔽 SORT
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value;
      localStorage.setItem("sort", currentSort);

      const searchValue = searchInput?.value || "";
      displayInventory(searchValue);
    });
  }

//   // 🧃 FILTER
//   if (filterSelect) {
//     filterSelect.addEventListener("change", () => {
//       currentFilter = filterSelect.value;
//       localStorage.setItem("filter", currentFilter);

//       const searchValue = searchInput?.value || "";
//       displayInventory(searchValue);
//     });
//   }

  // 🔍 SEARCH
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      displayInventory(e.target.value);
    });
  }

  // ADD ITEM BUTTON
    const addBtn = document.getElementById("addBtn");
    if (addBtn) {
    addBtn.addEventListener("click", addItem);
}
// Update Inventory button
const updateBtn = document.getElementById("updateBtn");
if (updateBtn) {
  updateBtn.addEventListener("click", updateItem);
}

  // 🚀 INITIAL LOAD
  displayInventory();

  setupSearch();
  setupInventorySearch();
});

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("deleteBtn")) {
    const id = e.target.dataset.id;

    const confirmDelete = confirm("Delete this item?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "inventory", id));
    displayInventory();
  }
});

document.addEventListener("click", async (e) => {
  // RESTOCK
  if (e.target.classList.contains("restockBtn")) {
    const id = e.target.dataset.id;

    const input = document.querySelector(`.restockInput[data-id="${id}"]`);
    const amount = Number(input.value);

    if (amount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    const item = itemsMap[id];
    const newQty = item.quantity + amount;

    const confirmRestock = confirm(`Add ${amount} units to ${item.name}?`);
    if (!confirmRestock) return;

    await updateDoc(doc(db, "inventory", id), { quantity: newQty });

    input.value = "";
    displayInventory();
  }
});

const links = document.querySelectorAll("nav a");

let currentPage = window.location.pathname.split("/").pop();

// Handle homepage ("/" → index.html)
if (currentPage === "" || currentPage === "/") {
  currentPage = "index.html";
}

links.forEach(link => {
  const href = link.getAttribute("href");

  if (href === currentPage) {
    link.classList.add("current");
  }
});

document.addEventListener("click", (e) => {
  const searchInput = document.getElementById("itemSearch");
  const resultsDiv = document.getElementById("searchResults");

  const inventorySearchInput = document.getElementById("searchInput");
  const inventoryResultsDiv = document.getElementById("inventorySearchResults");

  // DELIVERY PAGE
  if (searchInput && resultsDiv) {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = "none";
    }
  }

  // INVENTORY PAGE
  if (inventorySearchInput && inventoryResultsDiv) {
    if (
      !inventorySearchInput.contains(e.target) &&
      !inventoryResultsDiv.contains(e.target)
    ) {
      inventoryResultsDiv.style.display = "none";
    }
  }
});