const coinList = document.getElementById("coin-list");
const searchInput = document.getElementById("search");

let coins = [];

// Fetch live prices from CoinGecko
async function fetchCoins() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
    coins = await res.json();
    displayCoins(coins);
  } catch (error) {
    console.error("Error fetching data:", error);
    coinList.innerHTML = "<p class='text-red-400'>Failed to load data. Try again later.</p>";
  }
}

// Display coins as cards
function displayCoins(data) {
  coinList.innerHTML = "";

  data.forEach((coin) => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition";

    card.innerHTML = `
      <div class="flex items-center gap-4">
        <img src="${coin.image}" alt="${coin.name}" class="w-10 h-10">
        <div>
          <h2 class="font-semibold text-lg">${coin.name}</h2>
          <p class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</p>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-xl font-bold">$${coin.current_price.toLocaleString()}</p>
        <p class="${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'} text-sm">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </p>
      </div>
    `;

    coinList.appendChild(card);
  });
}

// Filter coins by search
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = coins.filter((coin) =>
    coin.name.toLowerCase().includes(term)
  );
  displayCoins(filtered);
});

fetchCoins();
