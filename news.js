const API_KEY = "pub_843c3c0503c349b7a84dc63981bf7a95"

document.addEventListener("DOMContentLoaded", async () => {
  const newsList = document.getElementById("news-list");
  const loading = document.getElementById("loading");

  try {
    const res = await fetch(`https://newsdata.io/api/1/news?apikey=${API_KEY}&q=crypto&language=en`);
    const data = await res.json();

    loading.style.display = "none";

    if (!data.results || data.results.length === 0) {
      newsList.innerHTML = "<p class='text-gray-400 text-center'>No news found.</p>";
      return;
    }

    data.results.forEach((article) => {
      const div = document.createElement("div");
      div.className = "bg-gray-800 p-4 rounded-lg shadow";

      div.innerHTML = `
        <h2 class="text-lg font-semibold text-green-400 mb-1">
          <a href="${article.link}" target="_blank" class="hover:underline">${article.title}</a>
        </h2>
        <p class="text-sm text-gray-300 mb-2">${article.description || "No description."}</p>
        <p class="text-xs text-gray-500">${new Date(article.pubDate).toLocaleString()}</p>
      `;

      newsList.appendChild(div);
    });
  } catch (err) {
    loading.textContent = "Failed to load news.";
    console.error("News error:", err);
  }
});
