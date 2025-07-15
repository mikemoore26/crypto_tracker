document.addEventListener("DOMContentLoaded", () => {
  const coinList = document.getElementById("coin-list");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");
  const favoritesFilter = document.getElementById("favorites-filter");
  const loading = document.getElementById("loading");

  let coins = [];
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  async function fetchCoins() {
    try {
      loading.classList.remove("hidden");
      coinList.innerHTML = "";

      //const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
      const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&sparkline=true");

      coins = await res.json();

      filterAndDisplay();
    } catch (err) {
      console.error(err);
      coinList.innerHTML = "<p class='text-red-400'>Failed to load data.</p>";
    } finally {
      loading.classList.add("hidden");
    }
  }

  function displayCoins(data) {
    coinList.innerHTML = "";

    if (!data.length) {
      coinList.innerHTML = "<p class='text-gray-400 text-center'>No coins found.</p>";
      return;
    }

    data.forEach((coin) => {
      const card = document.createElement("div");
      card.className = "bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition";

      card.innerHTML = `
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <img src="${coin.image}" alt="${coin.name}" class="w-10 h-10" />
      <div>
        <h2 class="font-semibold text-lg">${coin.name}</h2>
        <p class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</p>
      </div>
    </div>
    <button class="favorite-btn text-yellow-400 text-xl" data-id="${coin.id}" aria-label="Toggle Favorite">
      ${favorites.includes(coin.id) ? '★' : '☆'}
    </button>
  </div>
  <div class="mt-4">
    <p class="text-xl font-bold">$${coin.current_price.toLocaleString()}</p>
    <p class="${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'} text-sm">
      ${coin.price_change_percentage_24h.toFixed(2)}%
    </p>
  </div>
  <canvas id="chart-${coin.id}" height="60"></canvas>
`;
      coinList.appendChild(card);
      const ctx = document.getElementById(`chart-${coin.id}`).getContext('2d');

new Chart(ctx, {
  type: 'line',
  data: {
    labels: coin.sparkline_in_7d.price.map((_, i) => i), // dummy labels
    datasets: [{
      data: coin.sparkline_in_7d.price,
      borderColor: "#10B981", // tailwind green
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { borderJoinStyle: 'round' }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    }
  }
});

    });
  }

  function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase();

    let filtered = coins.filter(coin =>
      coin.name.toLowerCase().includes(searchTerm)
    );

    if (favoritesFilter.checked) {
      filtered = filtered.filter(coin => favorites.includes(coin.id));
    }

    const sortOption = sortSelect.value;
    if (sortOption === "price") {
      filtered.sort((a, b) => b.current_price - a.current_price);
    } else if (sortOption === "market_cap") {
      filtered.sort((a, b) => b.market_cap - a.market_cap);
    } else if (sortOption === "change") {
      filtered.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    }

    displayCoins(filtered);
  }

  coinList.addEventListener("click", (e) => {
    if (e.target.classList.contains("favorite-btn")) {
      const coinId = e.target.dataset.id;

      if (favorites.includes(coinId)) {
        favorites = favorites.filter(id => id !== coinId);
      } else {
        favorites.push(coinId);
      }

      localStorage.setItem("favorites", JSON.stringify(favorites));
      filterAndDisplay();
    }
  });

  searchInput.addEventListener("input", filterAndDisplay);
  sortSelect.addEventListener("change", filterAndDisplay);
  favoritesFilter.addEventListener("change", filterAndDisplay);

  fetchCoins();
});

