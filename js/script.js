/* js/script.js for Fútbol Total */

document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = '0609bcc9868340f18ad1e15955a4bfdb';
  const NEWS_URL = `https://newsapi.org/v2/everything?q=deportes&language=es&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;
  let currentUser = null;
  

  // 1. Toggle theme
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.body.dataset.theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  });

  // 2. Toggle language
  const textos = {
    es: { politica: 'Política', sobre: 'Sobre Nosotros', ultimas: 'Últimas Noticias', colombia: 'Fútbol Colombia', config: 'Configuración ⚙️', tema: 'Cambiar Tema', idioma: 'Cambiar Idioma' },
    en: { politica: 'Policy', sobre: 'About Us', ultimas: 'Latest News', colombia: 'Colombian Football', config: 'Settings ⚙️', tema: 'Toggle Theme', idioma: 'Change Language' }
  };
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    const nuevoLang = document.body.dataset.lang === 'es' ? 'en' : 'es';
    document.body.dataset.lang = nuevoLang;
    Object.entries(textos[nuevoLang]).forEach(([key, txt]) => {
      document.querySelectorAll(`[data-key="${key}"]`).forEach(el => el.textContent = txt);
    });
  });

  // 3. Fade-in animations
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('visible'));
  });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // 4. Load news articles
  const newsContainer = document.getElementById('news-container');
  if (newsContainer) {
    fetch(NEWS_URL)
      .then(res => res.json())
      .then(data => {
        newsContainer.innerHTML = '';
        if (!data.articles?.length) {
          newsContainer.innerHTML = '<p>No se encontraron noticias deportivas.</p>';
          return;
        }
        data.articles.forEach(article => {
          const card = document.createElement('div');
          card.className = 'news-item fade-in';
          card.innerHTML = `
            <h3>${article.title}</h3>
            <p>${article.description || 'Sin descripción.'}</p>
            <a href="${article.url}" target="_blank">Leer más</a>
            <hr/>
          `;
          newsContainer.appendChild(card);
        });
      })
      .catch(err => {
        console.error('Error cargando noticias:', err);
        newsContainer.innerHTML = '<p>Error cargando noticias. Intenta más tarde.</p>';
      });
  }

  // 5. Comment form (unauthenticated)
  document.getElementById('comentario-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = e.target.nombre.value;
    const mensaje = e.target.mensaje.value;
    const div = document.createElement('div');
    div.className = 'comentario';
    div.innerHTML = `<strong>${nombre}</strong><p>${mensaje}</p>`;
    document.getElementById('comentarios-lista').prepend(div);
    e.target.reset();
  });

  // 6. Firebase Authentication
  firebase.auth().onAuthStateChanged(user => {
    currentUser = user;
    const loginBtn = document.getElementById('login-google');
    const userInfo = document.getElementById('user-info');
    const commentsForm = document.getElementById('comentarios-form');

    if (user) {
      loginBtn.style.display = 'none';
      userInfo.style.display = 'flex';
      document.getElementById('user-name').textContent = `Hola, ${user.displayName}`;
      document.getElementById('user-pic').src = user.photoURL;
      commentsForm.style.display = 'block';
      cargarComentarios();
    } else {
      loginBtn.style.display = 'block';
      userInfo.style.display = 'none';
      commentsForm.style.display = 'none';
    }
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => firebase.auth().signOut());

  // 7. Post authenticated comments
  document.getElementById('publicar-comentario')?.addEventListener('click', () => {
    const texto = document.getElementById('comentario-input').value.trim();
    if (!texto || !currentUser) return;
    db.collection('comentarios').add({
      uid: currentUser.uid,
      nombre: currentUser.displayName,
      foto: currentUser.photoURL,
      comentario: texto,
      fecha: new Date()
    }).then(() => {
      document.getElementById('comentario-input').value = '';
      cargarComentarios();
    });
  });

  function cargarComentarios() {
    db.collection('comentarios').orderBy('fecha', 'desc').limit(20).get()
      .then(snapshot => {
        const lista = document.getElementById('comentarios-lista');
        lista.innerHTML = '';
        snapshot.forEach(doc => {
          const data = doc.data();
          const div = document.createElement('div');
          div.className = 'comentario';
          div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
              <img src="${data.foto}" style="width:30px;height:30px;border-radius:50%;" />
              <strong>${data.nombre}</strong>
            </div>
            <p>${data.comentario}</p><hr/>
          `;
          lista.appendChild(div);
        });
      });
  }

  // 8. Contact form with validation & Firestore
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    ['nombre','email','mensaje'].forEach(name => {
      const input = contactForm[name];
      const errDiv = document.createElement('div'); errDiv.className='error-msg';
      input.insertAdjacentElement('afterend', errDiv);
    });
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      contactForm.querySelectorAll('.error-msg').forEach(el => el.textContent='');
      const nombre = contactForm.nombre.value.trim();
      const email = contactForm.email.value.trim();
      const mensaje = contactForm.mensaje.value.trim();
      let valid = true;
      if (!nombre) { contactForm.nombre.nextElementSibling.textContent='El nombre es obligatorio.'; valid=false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { contactForm.email.nextElementSibling.textContent='Email inválido.'; valid=false; }
      if (!mensaje) { contactForm.mensaje.nextElementSibling.textContent='El mensaje no puede estar vacío.'; valid=false; }
      if (!valid) return;
      try {
        await db.collection('contactos').add({ nombre, email, mensaje, fecha: firebase.firestore.FieldValue.serverTimestamp() });
        const succ = document.createElement('div'); succ.className='success-msg'; succ.textContent='¡Mensaje enviado correctamente!';
        contactForm.appendChild(succ); contactForm.reset(); setTimeout(() => succ.remove(), 5000);
      } catch {
        const fail = document.createElement('div'); fail.className='error-msg'; fail.textContent='Error al enviar, intenta de nuevo.';
        contactForm.appendChild(fail);
      }
    });
  }
});
document.getElementById('buscar-btn')?.addEventListener('click', () => {
  const query = document.getElementById('buscar-input').value.trim();
  if (!query) return;

  const searchURL = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&pageSize=10&sortBy=publishedAt&apiKey=${API_KEY}`;
  const newsContainer = document.getElementById('news-container');
  newsContainer.innerHTML = '<p>Cargando resultados...</p>';

  fetch(searchURL)
    .then(res => res.json())
    .then(data => {
      newsContainer.innerHTML = '';
      if (!data.articles || data.articles.length === 0) {
        newsContainer.innerHTML = '<p>No se encontraron noticias para esa búsqueda.</p>';
        return;
      }
      data.articles.forEach(article => {
        const card = document.createElement('div');
        card.className = 'news-item fade-in';
        card.innerHTML = `
          <h3>${article.title}</h3>
          <p>${article.description || 'Sin descripción disponible.'}</p>
          <a href="${article.url}" target="_blank">Leer más</a>
          <hr/>
        `;
        newsContainer.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Error en la búsqueda:', err);
      newsContainer.innerHTML = '<p>Error cargando resultados. Intenta de nuevo.</p>';
    });
});
document.getElementById('buscar-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('buscar-btn').click();
  }
});
const sugerencias = ['Barcelona', 'Real Madrid', 'Messi', 'Cristiano Ronaldo', 'Champions League', 'Selección Colombia', 'Copa América', 'Mbappé', 'Fútbol femenino', 'Premier League'];

const inputBuscar = document.getElementById('buscar-input');
const listaSugerencias = document.getElementById('sugerencias');

inputBuscar.addEventListener('input', () => {
  const valor = inputBuscar.value.toLowerCase();
  listaSugerencias.innerHTML = '';

  if (!valor) {
    listaSugerencias.style.display = 'none';
    return;
  }

  const filtradas = sugerencias.filter(s => s.toLowerCase().includes(valor));
  filtradas.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    li.addEventListener('click', () => {
      inputBuscar.value = s;
      listaSugerencias.style.display = 'none';
      document.getElementById('buscar-btn').click(); // Ejecuta búsqueda
    });
    listaSugerencias.appendChild(li);
  });

  listaSugerencias.style.display = filtradas.length ? 'block' : 'none';
});

// Ocultar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!document.querySelector('.buscador').contains(e.target)) {
    listaSugerencias.style.display = 'none';
  }
});
document.getElementById('login-google')?.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      console.log('Usuario autenticado:', result.user);
    })
    .catch(error => {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión: ' + error.message);
    });
});
