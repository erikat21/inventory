// Fake inventory (temporary)
let inventory = [
  { name: "Water Bottles", quantity: 50 },
  { name: "Snacks", quantity: 120 },
  { name: "Soda Cases", quantity: 30 }
];

// Detect which page you're on
const isInventoryPage = document.getElementById("inventoryList");
const isDeliveryPage = document.getElementById("itemSelect");

// --------------------
// INVENTORY PAGE
// --------------------
if (isInventoryPage) {
  displayInventory();
}

function displayInventory() {
  const list = document.getElementById("inventoryList");
  list.innerHTML = "";

  inventory.forEach(item => {
    const li = document.createElement("li");

    if (item.quantity < 20) {
      li.style.color = "red";
      li.textContent = `${item.name} - ${item.quantity} (LOW)`;
    } else {
      li.textContent = `${item.name} - ${item.quantity}`;
    }

    list.appendChild(li);
  });
}

// --------------------
// DELIVERY PAGE
// --------------------
if (isDeliveryPage) {
  loadDropdown();
}

function loadDropdown() {
  const select = document.getElementById("itemSelect");

  inventory.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

function updateItem() {
  const index = document.getElementById("itemSelect").value;
  const change = Number(document.getElementById("changeAmount").value);

  if (change <= 0) {
    alert("Enter a valid amount");
    return;
  }

  inventory[index].quantity -= change;

  alert("Inventory updated!");

  document.getElementById("changeAmount").value = "";
}