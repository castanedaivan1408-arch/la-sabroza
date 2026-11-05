/* =====================================================================
   INTERACCION.JS · Toda la interactividad del sitio
   Un solo archivo. Cada función se encarga de UNA cosa y se ejecuta solo
   si encuentra en la página los elementos que necesita.
   ===================================================================== */

"use strict"; // Modo estricto: JavaScript avisa de errores de escritura que antes ignoraba.

/* ---------- 1. MENÚ MÓVIL ---------- */
function iniciarMenuMovil() {
  const barra = document.querySelector(".barra-lateral");           // Busca la barra lateral.
  const velo = document.querySelector(".velo");                     // Busca la capa oscura de fondo.
  const botonAbrir = document.querySelector("[data-menu-abrir]");   // Botón "Menú" de la barra móvil.
  if (!barra || !velo || !botonAbrir) return;                       // Si falta algo, no hace nada.

  const alternar = (abrir) => {                                     // Función que abre o cierra el panel.
    barra.classList.toggle("barra-lateral--abierta", abrir);        // Pone/quita la clase que desliza el panel.
    velo.classList.toggle("velo--visible", abrir);                  // Muestra/oculta la capa oscura.
    botonAbrir.setAttribute("aria-expanded", String(abrir));        // Avisa a lectores de pantalla del estado.
  };

  botonAbrir.addEventListener("click", () => alternar(!barra.classList.contains("barra-lateral--abierta"))); // Clic en "Menú": invierte el estado.
  velo.addEventListener("click", () => alternar(false));            // Clic fuera del panel: lo cierra.
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") alternar(false); }); // Tecla Esc: lo cierra.
}

/* ---------- 2. BARRA DE PROGRESO DE LECTURA ---------- */
function iniciarProgreso() {
  const relleno = document.querySelector(".progreso__relleno");     // Busca la barra de progreso.
  if (!relleno) return;                                             // Si no existe, termina.

  const actualizar = () => {                                        // Calcula cuánto se ha leído.
    const html = document.documentElement;                          // El elemento <html>.
    const recorrido = html.scrollHeight - html.clientHeight;        // Cuánto se puede desplazar en total.
    const avance = recorrido > 0 ? html.scrollTop / recorrido : 0;  // Fracción entre 0 y 1 (evita dividir por 0).
    html.style.setProperty("--avance", avance.toFixed(4));          // Guarda la fracción en la variable CSS --avance.
  };

  window.addEventListener("scroll", actualizar, { passive: true }); // Recalcula al hacer scroll (passive = más fluido).
  actualizar();                                                     // Y una vez al cargar.
}

/* ---------- 3. ANIMACIÓN DE ENTRADA (revelar al aparecer) ---------- */
function iniciarRevelado() {
  const elementos = document.querySelectorAll(".revelar");          // Todo lo que debe animarse.
  if (!("IntersectionObserver" in window)) {                        // Navegador antiguo sin soporte:
    elementos.forEach((el) => el.classList.add("revelar--visible")); // los muestra directamente.
    return;                                                         // Y termina.
  }
  const observador = new IntersectionObserver((entradas) => {       // Vigila cuándo entran en pantalla.
    entradas.forEach((entrada) => {                                 // Revisa cada elemento observado.
      if (entrada.isIntersecting) {                                 // Si ya es visible...
        entrada.target.classList.add("revelar--visible");           // ...le pone la clase que lo anima...
        observador.unobserve(entrada.target);                       // ...y deja de vigilarlo (solo anima una vez).
      }
    });
  }, { threshold: 0.12 });                                          // Se activa cuando se ve el 12 % del elemento.

  elementos.forEach((el) => observador.observe(el));                // Empieza a vigilar cada elemento (el escalonado lo hace el CSS con :nth-child).
}

/* ---------- 4. CONTADORES ANIMADOS DE ESTADÍSTICAS ---------- */
function iniciarContadores() {
  const contadores = document.querySelectorAll("[data-contador]");  // Números con atributo data-contador.
  if (!contadores.length) return;                                   // Si no hay, termina.

  const animar = (el) => {                                          // Anima un contador de 0 hasta su valor.
    const meta = parseFloat(el.dataset.contador);                   // Valor final (viene del HTML, ej. 507266).
    const decimales = parseInt(el.dataset.decimales || "0", 10);    // Cuántos decimales mostrar.
    const sufijo = el.dataset.sufijo || "";                         // Texto tras el número (ej. "%").
    const duracion = 1400;                                          // Milisegundos que dura la animación.
    const inicio = performance.now();                               // Momento exacto en que empieza.

    const pintar = (ahora) => {                                     // Se ejecuta en cada fotograma.
      const t = Math.min((ahora - inicio) / duracion, 1);           // Progreso de 0 a 1.
      const suave = 1 - Math.pow(1 - t, 3);                         // Curva "ease-out": empieza rápido y frena.
      el.textContent = (meta * suave).toLocaleString("es-CO", {     // Formato colombiano: 507.266 y 45,5.
        minimumFractionDigits: decimales,                           // Mínimo de decimales.
        maximumFractionDigits: decimales,                           // Máximo de decimales.
      }) + sufijo;                                                  // Añade el sufijo.
      if (t < 1) requestAnimationFrame(pintar);                     // Si no terminó, pide el siguiente fotograma.
    };
    requestAnimationFrame(pintar);                                  // Arranca la animación.
  };

  const observador = new IntersectionObserver((entradas) => {       // Espera a que el número sea visible.
    entradas.forEach((entrada) => {                                 // Para cada número observado:
      if (entrada.isIntersecting) {                                 // Si ya se ve...
        animar(entrada.target);                                     // ...lo anima...
        observador.unobserve(entrada.target);                       // ...y no lo repite.
      }
    });
  }, { threshold: 0.4 });                                           // Visible al 40 %.

  contadores.forEach((el) => observador.observe(el));               // Vigila todos los contadores.
}

/* ---------- 5. FILTROS (hechos/hipótesis y personas) ---------- */
function iniciarFiltros() {
  document.querySelectorAll("[data-filtros]").forEach((grupo) => {  // Cada grupo de botones de filtro.
    const botones = grupo.querySelectorAll("[data-filtrar]");       // Los botones del grupo.
    const objetivo = document.querySelector(grupo.dataset.filtros); // El contenedor a filtrar (selector en el HTML).
    if (!objetivo) return;                                          // Si no existe, salta este grupo.
    const items = objetivo.querySelectorAll("[data-categoria]");    // Elementos filtrables.

    botones.forEach((boton) => {                                    // Para cada botón...
      boton.addEventListener("click", () => {                       // ...al hacer clic:
        const categoria = boton.dataset.filtrar;                    // Lee qué categoría representa.
        botones.forEach((b) => {                                    // Recorre todos los botones...
          const activo = b === boton;                               // ...para saber si es el pulsado.
          b.classList.toggle("filtro--activo", activo);             // Marca solo el pulsado como activo.
          b.setAttribute("aria-pressed", String(activo));           // Accesibilidad: estado "presionado".
        });
        items.forEach((item) => {                                   // Recorre cada elemento filtrable.
          const coincide = categoria === "todos" || item.dataset.categoria === categoria; // ¿Debe verse?
          item.hidden = !coincide;                                  // Oculta o muestra con el atributo hidden.
          if (coincide) {                                           // Si se muestra:
            item.classList.remove("panel");                         // reinicia la animación...
            void item.offsetWidth;                                  // ...forzando al navegador a recalcular...
            item.classList.add("panel");                            // ...y la vuelve a aplicar.
          }
        });
      });
    });
  });
}

/* ---------- 6. PESTAÑAS (mapas de empatía) ---------- */
function iniciarPestanas() {
  document.querySelectorAll("[data-pestanas]").forEach((grupo) => { // Cada grupo de pestañas.
    const botones = grupo.querySelectorAll("[data-pestana]");       // Botones de pestaña.
    const paneles = document.querySelectorAll(`[data-panel-de="${grupo.dataset.pestanas}"]`); // Paneles vinculados al grupo.

    botones.forEach((boton) => {                                    // Para cada botón...
      boton.addEventListener("click", () => {                       // ...al hacer clic:
        botones.forEach((b) => {                                    // Recorre los botones.
          const activo = b === boton;                               // ¿Es el pulsado?
          b.classList.toggle("filtro--activo", activo);             // Resalta solo el pulsado.
          b.setAttribute("aria-selected", String(activo));          // Accesibilidad: pestaña seleccionada.
        });
        paneles.forEach((panel) => {                                // Recorre los paneles.
          panel.hidden = panel.dataset.panel !== boton.dataset.pestana; // Solo muestra el del botón pulsado.
        });
      });
    });
  });
}

/* ---------- 7. LISTA DE VERIFICACIÓN CON MEMORIA ---------- */
function iniciarVerificacion() {
  const lista = document.querySelector("[data-verificacion]");      // La lista de pasos.
  if (!lista) return;                                               // Si no está en esta página, termina.
  const clave = "la-sabroza:" + lista.dataset.verificacion;         // Nombre único para guardar en el navegador.
  const casillas = lista.querySelectorAll("input[type='checkbox']"); // Todas las casillas.
  const medidor = document.querySelector("[data-medidor]");         // La barra de avance de la lista.
  const texto = document.querySelector("[data-medidor-texto]");     // El texto "2 de 4".

  let guardado = [];                                                // Aquí irán los pasos ya marcados.
  try { guardado = JSON.parse(localStorage.getItem(clave)) || []; } // Intenta leer lo guardado antes...
  catch (error) { guardado = []; }                                  // ...y si el navegador lo impide, empieza vacío.

  const refrescar = () => {                                         // Actualiza todo lo visual.
    let hechas = 0;                                                 // Contador de pasos hechos.
    casillas.forEach((c) => {                                       // Recorre cada casilla.
      c.closest("li").classList.toggle("verificacion__item--hecho", c.checked); // Tacha el paso si está marcado.
      if (c.checked) hechas += 1;                                   // Suma si está marcado.
    });
    const fraccion = casillas.length ? hechas / casillas.length : 0; // Fracción completada (0 a 1).
    if (medidor) medidor.style.setProperty("--avance", fraccion);   // Mueve la barra.
    if (texto) texto.textContent = hechas === casillas.length       // Mensaje motivador según el avance:
      ? "¡Validación completa! Ya puedes salir a entrevistar con criterio."
      : `${hechas} de ${casillas.length} pasos listos`;
  };

  casillas.forEach((c, i) => {                                      // Configura cada casilla.
    c.checked = guardado.includes(i);                               // Restaura si estaba marcada.
    c.addEventListener("change", () => {                            // Al marcar/desmarcar:
      const marcadas = [];                                          // Lista nueva de posiciones marcadas.
      casillas.forEach((x, j) => { if (x.checked) marcadas.push(j); }); // La reconstruye.
      try { localStorage.setItem(clave, JSON.stringify(marcadas)); } // La guarda en el navegador.
      catch (error) { /* Sin almacenamiento: la lista sigue funcionando, solo no recuerda. */ }
      refrescar();                                                  // Actualiza lo visual.
    });
  });
  refrescar();                                                      // Primera actualización al cargar.
}

/* ---------- 8. COPIAR REFERENCIAS ---------- */
function iniciarCopiar() {
  document.querySelectorAll("[data-copiar]").forEach((boton) => {   // Cada botón "Copiar".
    boton.addEventListener("click", async () => {                   // Al hacer clic (función asíncrona):
      const origen = document.querySelector(boton.dataset.copiar);  // Elemento cuyo texto se copiará.
      if (!origen) return;                                          // Si no existe, termina.
      const original = boton.textContent;                           // Recuerda el texto original del botón.
      try {
        await navigator.clipboard.writeText(origen.innerText.trim()); // Copia al portapapeles.
        boton.textContent = "¡Copiado! ✓";                          // Confirma al usuario.
      } catch (error) {
        boton.textContent = "Selecciona y copia (Ctrl+C)";          // Si el navegador lo bloquea, da una alternativa.
      }
      setTimeout(() => { boton.textContent = original; }, 2200);    // A los 2,2 s restaura el texto.
    });
  });
}

/* ---------- 9. IMPRIMIR ---------- */
function iniciarImpresion() {
  document.querySelectorAll("[data-imprimir]").forEach((boton) => { // Botones de imprimir.
    boton.addEventListener("click", () => window.print());          // Abre el diálogo de impresión / guardar PDF.
  });
}

/* ---------- 10. FLECHAS DEL TECLADO ENTRE PÁGINAS ---------- */
function iniciarTeclado() {
  document.addEventListener("keydown", (e) => {                     // Escucha el teclado.
    const escribiendo = /input|textarea|select/i.test(document.activeElement.tagName); // ¿Está escribiendo en un campo?
    if (escribiendo || e.altKey || e.ctrlKey || e.metaKey) return;  // Si sí (o usa atajos del navegador), no interfiere.
    const destino = e.key === "ArrowRight" ? document.querySelector("a[rel='next']") // Flecha →: página siguiente.
                  : e.key === "ArrowLeft" ? document.querySelector("a[rel='prev']")  // Flecha ←: página anterior.
                  : null;                                           // Otra tecla: nada.
    if (destino) window.location.href = destino.href;               // Si hay destino, navega.
  });
}

/* ---------- ARRANQUE ---------- */
document.documentElement.classList.remove("sin-js"); // Avisa al CSS de que JavaScript sí funciona.
iniciarMenuMovil();        // Activa el menú móvil.
iniciarProgreso();         // Activa la barra de progreso.
iniciarRevelado();         // Activa las animaciones de entrada.
iniciarContadores();       // Activa los contadores.
iniciarFiltros();          // Activa los filtros.
iniciarPestanas();         // Activa las pestañas.
iniciarVerificacion();     // Activa la lista de verificación.
iniciarCopiar();           // Activa el botón copiar.
iniciarImpresion();        // Activa el botón imprimir.
iniciarTeclado();          // Activa la navegación con flechas.
