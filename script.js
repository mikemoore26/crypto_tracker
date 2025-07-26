document.addEventListener("DOMContentLoaded", () => {
  const coinList = document.getElementById("coin-list");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");
  const favoritesFilter = document.getElementById("favorites-filter");
  const loading = document.getElementById("loading");
  const modal = document.getElementById("portfolio-modal");
  const modalCoinName = document.getElementById("modal-coin-name");
  const modalPrice = document.getElementById("modal-price");
  const modalValue = document.getElementById("modal-value");
  const modalAmount = document.getElementById("portfolio-amount");
  const modalSave = document.getElementById("modal-save");
  const modalCancel = document.getElementById("modal-cancel");
  const portfolioSection = document.getElementById("portfolio-summary");
  const portfolioTotal = document.getElementById("portfolio-total");
  const portfolioChange = document.getElementById("portfolio-change");
  const newsList = document.getElementById("news-list");

  let selectedCoin = null;
  let portfolio = JSON.parse(localStorage.getItem("portfolio")) || {};
  let coins = [];
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

  async function fetchCoins() {
    try {
      loading.classList.remove("hidden");
      coinList.innerHTML = "";
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

  async function fetchNews() {
    try {
      const res = await fetch("https://newsdata.io/api/1/news?apikey=pub_843c3c0503c349b7a84dc63981bf7a95&q=crypto&language=en");
      const data = await res.json();
      displayNews(data.results || []);
    } catch (err) {
      console.error("Failed to fetch news", err);
    }
  }

  function displayNews(articles) {
    if (!newsList) return;
    newsList.innerHTML = "";
    if (!articles.length) {
      newsList.innerHTML = "<p class='text-gray-400 text-center'>No news available.</p>";
      return;
    }
    articles.slice(0, 6).forEach(article => {
      const item = document.createElement("div");
      item.className = "bg-gray-800 rounded-lg p-4 shadow hover:shadow-lg transition text-sm";
      item.innerHTML = `
        <a href="${article.link}" target="_blank" class="block hover:underline">
          <h3 class="font-bold text-white mb-2">${article.title}</h3>
          <p class="text-gray-400">${article.description?.slice(0, 100) || ''}...</p>
          <p class="text-gray-500 mt-2 text-xs">${new Date(article.pubDate).toLocaleString()}</p>
        </a>
      `;
      newsList.appendChild(item);
    });
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
      const chartId = `chart-${coin.id}`;
      card.innerHTML = `
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <img src="${coin.image}" alt="${coin.name}" class="w-10 h-10" />
            <div>
              <h2 class="font-semibold text-lg">${coin.name}</h2>
              <p class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</p>
            </div>
          </div>
          <button class="favorite-btn text-yellow-400 text-xl" data-id="${coin.id}">
            ${favorites.includes(coin.id) ? '★' : '☆'}
          </button>
        </div>
        <div class="mt-4">
          <p class="text-xl font-bold">$${coin.current_price.toLocaleString()}</p>
          <p class="${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'} text-sm">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </p>
        </div>
        <div class="h-16 mt-4">
          <canvas id="${chartId}" class="w-full h-full"></canvas>
        </div>
      `;
      coinList.appendChild(card);

      const ctx = document.getElementById(chartId).getContext("2d");
      const labels = coin.sparkline_in_7d.price.map((_, i) => {
        const now = Date.now();
        const timestamp = now - (coin.sparkline_in_7d.price.length - i) * 60 * 60 * 1000;
        return new Date(timestamp);
      });
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: coin.sparkline_in_7d.price,
            borderColor: "#10B981",
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              callbacks: {
                title: context => new Date(context[0].label).toLocaleString(),
                label: context => `$${context.parsed.y.toFixed(2)}`
              },
              backgroundColor: "#1F2937",
              titleColor: "#10B981",
              bodyColor: "#F9FAFB",
              padding: 8
            }
          },
          scales: {
            x: {
              type: "time",
              display: false,
              time: { unit: "day", tooltipFormat: "MMM d, h a" }
            },
            y: { display: false }
          }
        }
      });

      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("favorite-btn")) return;
        selectedCoin = coin;
        modalCoinName.textContent = coin.name;
        modalPrice.textContent = `$${coin.current_price.toLocaleString()}`;
        const prevAmount = portfolio[coin.id]?.amount || 0;
        modalAmount.value = prevAmount;
        updateModalValue();
        modal.classList.remove("hidden");
      });
    });
  }

  function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    let filtered = coins.filter(coin => coin.name.toLowerCase().includes(searchTerm));
    if (favoritesFilter.checked) {
      filtered = filtered.filter(coin => favorites.includes(coin.id));
    }
    const sortOption = sortSelect.value;
    
    switch (sortOption) {
      case "price":
        filtered.sort((a, b) => b.current_price - a.current_price);
        break;

      case "price_low":
        filtered.sort((a, b) => a.current_price - b.current_price);
        break;

      case "market_cap":
        filtered.sort((a, b) => b.market_cap - a.market_cap);
        break;

      case "market_cap_low":
        filtered.sort((a, b) => a.market_cap - b.market_cap);
        break;

      case "volume":
        filtered.sort((a, b) => b.total_volume - a.total_volume);
        break;

      case "change":
        filtered.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        break;

      case "change_low":
        filtered.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
        break;

      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;

      // NEW: Hype Score (Volume / Market Cap)
      case "hype":
        filtered.sort((a, b) => 
          (b.total_volume / b.market_cap) - (a.total_volume / a.market_cap)
        );
        break;

      // NEW: Volatility Score (Abs(% change) * Volume)
      case "volatility":
        filtered.sort((a, b) =>
          (Math.abs(b.price_change_percentage_24h) * b.total_volume) -
          (Math.abs(a.price_change_percentage_24h) * a.total_volume)
        );
        break;

      // NEW: Efficiency Score (Market Cap / Price)
      case "efficiency":
        filtered.sort((a, b) =>
          (b.market_cap / b.current_price) - (a.market_cap / a.current_price)
        );
        break;

      default:
        // No sort
        break;
}
displayCoins(filtered);
  }

  coinList.addEventListener("click", (e) => {
    if (e.target.classList.contains("favorite-btn")) {
      const coinId = e.target.dataset.id;
      if (favorites.includes(coinId)) favorites = favorites.filter(id => id !== coinId);
      else favorites.push(coinId);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      filterAndDisplay();
    }
  });

  modalAmount.addEventListener("input", updateModalValue);
  modalCancel.addEventListener("click", () => modal.classList.add("hidden"));
  modalSave.addEventListener("click", () => {
    const amount = parseFloat(modalAmount.value) || 0;
    if (amount > 0) portfolio[selectedCoin.id] = { amount };
    else delete portfolio[selectedCoin.id];
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
    updatePortfolioSummary();
    modal.classList.add("hidden");
  });

  searchInput.addEventListener("input", filterAndDisplay);
  sortSelect.addEventListener("change", filterAndDisplay);
  favoritesFilter.addEventListener("change", filterAndDisplay);

  fetchCoins();
  fetchNews();
  updatePortfolioSummary();
});

function updateModalValue() {
  const amount = parseFloat(modalAmount.value) || 0;
  const price = selectedCoin?.current_price || 0;
  const value = amount * price;
  modalValue.textContent = `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function updatePortfolioSummary() {
  const portfolioSection = document.getElementById("portfolio-summary");
  const portfolioTotal = document.getElementById("portfolio-total");
  const portfolioChange = document.getElementById("portfolio-change");
  const coins = window.coins || [];
  const portfolio = JSON.parse(localStorage.getItem("portfolio")) || {};

  let total = 0;
  let yesterdayValue = 0;
  coins.forEach(coin => {
    const data = portfolio[coin.id];
    if (data?.amount) {
      const valueNow = data.amount * coin.current_price;
      const percentChange = coin.price_change_percentage_24h || 0;
      const valueYesterday = valueNow / (1 + percentChange / 100);
      total += valueNow;
      yesterdayValue += valueYesterday;
    }
  });

  if (total === 0) {
    portfolioSection.classList.add("hidden");
    return;
  }

  const change = total - yesterdayValue;
  const percent = (change / yesterdayValue) * 100;

  portfolioTotal.textContent = `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  portfolioChange.textContent = `${percent >= 0 ? '▲' : '▼'} ${percent.toFixed(2)}% today`;
  portfolioChange.className = `text-sm ${percent >= 0 ? 'text-green-400' : 'text-red-400'}`;
  portfolioSection.classList.remove("hidden");

  
}
