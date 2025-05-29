let API_KEY = "0609bcc9868340f18ad1e15955a4bfdb";
const URL = `https://newsapi.org/v2/top-headlines?country=co&category=sports&pageSize=6&apiKey=${API_KEY}`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("news-container");
  if (!container) {
    console.error("No se encontró el contenedor #news-container");
    return;
  }

  fetch(URL)
    .then(response => response.json())
    .then(data => {
      if (data.status !== "ok") {
        console.error("Error en la respuesta de NewsAPI:", data);
        container.innerHTML = "<p>Error al cargar noticias.</p>";
        return;
      }

      data.articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "news-card";
        card.innerHTML = `
          <img src="${article.urlToImage || 'https://via.placeholder.com/300x200'}" alt="Imagen noticia" />
          <h3>${article.title}</h3>
          <p>${article.description || ''}</p>
          <a href="${article.url}" target="_blank">Leer más</a>
        `;
        container.appendChild(card);
      });
    })
    .catch(error => {
      console.error("Error cargando noticias:", error);
      container.innerHTML = "<p>No se pudieron cargar las noticias.</p>";
    });
});
