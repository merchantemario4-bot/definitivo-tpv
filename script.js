const EMAILJS_PUBLIC_KEY = "WD5pzOC5mv7CZ0sMa";
const EMAILJS_SERVICE_ID = "service_vmoccs7";
const EMAILJS_TEMPLATE_ID = "template_9am5qhd";

const elementos = {
    contenedor: document.getElementById('contenedor-productos'),
    seccionPedido: document.getElementById('seccion-pedido'),
    listaSeleccionados: document.getElementById('lista-seleccionados'),
    contadorCarrito: document.getElementById('contador-carrito'),
    resumenUnidades: document.getElementById('resumen-unidades'),
    formulario: document.getElementById('formulario-pedido'),
    btnEnviar: document.getElementById('btn-enviar'),
    mensajeEstado: document.getElementById('mensaje-estado')
};

let carrito = {};

if (window.emailjs) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

async function cargarProductos() {
    try {
        const respuesta = await fetch('productos.json');

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar productos.json (${respuesta.status})`);
        }

        const productos = await respuesta.json();
        pintarProductos(productos);
    } catch (error) {
        console.error("Error al cargar productos:", error);
        elementos.contenedor.innerHTML = `
            <div class="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                No se pudieron cargar los productos.
            </div>
        `;
    }
}

function pintarProductos(productos) {
    elementos.contenedor.innerHTML = "";

    productos.forEach(producto => {
        const card = document.createElement('article');
        card.className = "producto-card";

        const imagen = document.createElement('img');
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;
        imagen.loading = "lazy";
        imagen.className = "producto-imagen";
        imagen.onerror = () => {
            imagen.onerror = null;
            imagen.src = "img/rollo80.jpg";
        };

        const contenido = document.createElement('div');
        contenido.className = "flex min-h-0 flex-1 flex-col p-4";

        const titulo = document.createElement('h3');
        titulo.className = "text-lg font-black text-slate-950";
        titulo.textContent = producto.nombre;

        const descripcion = document.createElement('p');
        descripcion.className = "mt-1 min-h-10 text-sm leading-5 text-slate-600";
        descripcion.textContent = producto.descripcion;

        const boton = document.createElement('button');
        boton.type = "button";
        boton.className = "btn-seleccionar";
        boton.dataset.producto = producto.nombre;
        boton.textContent = "Seleccionar";

        contenido.append(titulo, descripcion, boton);
        card.append(imagen, contenido);
        elementos.contenedor.appendChild(card);
    });
}

function agregarAlCarrito(nombre) {
    if (!carrito[nombre]) {
        carrito[nombre] = { nombre, cantidad: 0 };
    }

    carrito[nombre].cantidad += 1;
    actualizarPedido(true);
}

function cambiarCantidad(nombre, cambio) {
    if (!carrito[nombre]) {
        return;
    }

    carrito[nombre].cantidad += cambio;

    if (carrito[nombre].cantidad <= 0) {
        delete carrito[nombre];
    }

    actualizarPedido();
}

function construirResumenPedido() {
    return Object.values(carrito)
        .map(item => `${item.cantidad} ${item.cantidad === 1 ? 'unidad' : 'unidades'} - ${item.nombre}`)
        .join("\n");
}

function contarUnidades() {
    return Object.values(carrito).reduce((total, item) => total + item.cantidad, 0);
}

function textoUnidades(total) {
    return `${total} ${total === 1 ? 'unidad' : 'unidades'}`;
}

function actualizarPedido(debeDesplazar = false) {
    const productos = Object.values(carrito);
    const total = contarUnidades();

    elementos.contadorCarrito.textContent = textoUnidades(total);
    elementos.resumenUnidades.textContent = `${textoUnidades(total)} seleccionadas`;
    elementos.listaSeleccionados.innerHTML = "";

    if (productos.length === 0) {
        elementos.seccionPedido.classList.add('hidden');
        return;
    }

    elementos.seccionPedido.classList.remove('hidden');

    productos.forEach(item => {
        const fila = document.createElement('div');
        fila.className = "pedido-linea";

        const detalle = document.createElement('div');
        detalle.className = "min-w-0";

        const nombre = document.createElement('p');
        nombre.className = "truncate font-bold text-slate-900";
        nombre.textContent = item.nombre;

        const cantidad = document.createElement('p');
        cantidad.className = "text-sm text-slate-500";
        cantidad.textContent = textoUnidades(item.cantidad);

        const controles = document.createElement('div');
        controles.className = "flex shrink-0 items-center gap-2";

        const botonMenos = crearBotonCantidad(item.nombre, -1, "-");
        const numero = document.createElement('span');
        numero.className = "w-8 text-center text-sm font-black text-slate-900";
        numero.textContent = item.cantidad;
        const botonMas = crearBotonCantidad(item.nombre, 1, "+");

        detalle.append(nombre, cantidad);
        controles.append(botonMenos, numero, botonMas);
        fila.append(detalle, controles);
        elementos.listaSeleccionados.appendChild(fila);
    });

    if (debeDesplazar && window.matchMedia('(max-width: 1023px)').matches) {
        elementos.seccionPedido.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function crearBotonCantidad(nombre, cambio, texto) {
    const boton = document.createElement('button');
    boton.type = "button";
    boton.className = "btn-cantidad";
    boton.dataset.producto = nombre;
    boton.dataset.cambio = cambio;
    boton.setAttribute('aria-label', `${cambio > 0 ? 'Añadir' : 'Quitar'} una unidad de ${nombre}`);
    boton.textContent = texto;
    return boton;
}

function mostrarEstado(mensaje, tipo) {
    elementos.mensajeEstado.textContent = mensaje;
    elementos.mensajeEstado.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'bg-emerald-50', 'text-emerald-700');
    elementos.mensajeEstado.classList.add(
        tipo === 'error' ? 'bg-red-50' : 'bg-emerald-50',
        tipo === 'error' ? 'text-red-700' : 'text-emerald-700'
    );
}

function limpiarEstado() {
    elementos.mensajeEstado.textContent = "";
    elementos.mensajeEstado.classList.add('hidden');
}

elementos.contenedor.addEventListener('click', event => {
    const boton = event.target.closest('[data-producto]');

    if (!boton || !boton.classList.contains('btn-seleccionar')) {
        return;
    }

    agregarAlCarrito(boton.dataset.producto);
});

elementos.listaSeleccionados.addEventListener('click', event => {
    const boton = event.target.closest('[data-cambio]');

    if (!boton) {
        return;
    }

    cambiarCantidad(boton.dataset.producto, Number(boton.dataset.cambio));
});

elementos.formulario.addEventListener('submit', async event => {
    event.preventDefault();
    limpiarEstado();

    if (contarUnidades() === 0) {
        mostrarEstado("Selecciona al menos un producto antes de enviar el pedido.", "error");
        return;
    }

    elementos.btnEnviar.textContent = "Enviando...";
    elementos.btnEnviar.disabled = true;

    const datosEnvio = {
        nombre_cliente: document.getElementById('nombre').value,
        telefono_cliente: document.getElementById('telefono').value,
        direccion_cliente: document.getElementById('direccion').value,
        productos: construirResumenPedido(),
        total_unidades: contarUnidades()
    };

    try {
        if (!window.emailjs || typeof emailjs.send !== 'function') {
            throw new Error("EmailJS no está disponible");
        }

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, datosEnvio);
        carrito = {};
        elementos.formulario.reset();
        actualizarPedido();
        alert("¡Pedido enviado correctamente!");
    } catch (error) {
        console.error("Error al enviar pedido:", error);
        mostrarEstado("No se pudo enviar el pedido. Revisa la conexión e inténtalo de nuevo.", "error");
    } finally {
        elementos.btnEnviar.textContent = "Enviar pedido";
        elementos.btnEnviar.disabled = false;
    }
});

cargarProductos();
