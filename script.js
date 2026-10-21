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
    mensajeEstado: document.getElementById('mensaje-estado'),
    totalPedido: document.getElementById('total-pedido')
};

let carrito = {};
let catalogo = [];
let enviando = false;
const formatoEuros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

if (window.emailjs) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

async function cargarProductos() {
    try {
        const respuesta = await fetch('productos.json', { cache: 'no-store' });

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar productos.json (${respuesta.status})`);
        }

        catalogo = await respuesta.json();
        pintarProductos(catalogo);
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

        const etiqueta = document.createElement('p');
        etiqueta.className = "producto-etiqueta";
        etiqueta.textContent = producto.etiqueta || "";

        const precio = document.createElement('div');
        precio.className = "producto-precio";
        const importe = document.createElement('strong');
        importe.textContent = formatoEuros.format(producto.precio);
        const iva = document.createElement('span');
        iva.textContent = "IVA incluido";
        precio.append(importe, iva);

        const boton = document.createElement('button');
        boton.type = "button";
        boton.className = "btn-seleccionar";
        boton.dataset.producto = producto.nombre;
        boton.textContent = "Añadir al pedido";
        boton.setAttribute('aria-label', `Añadir ${producto.nombre} por ${formatoEuros.format(producto.precio)}`);

        contenido.append(titulo, descripcion, etiqueta, precio, boton);
        card.append(imagen, contenido);
        elementos.contenedor.appendChild(card);
    });
}

function agregarAlCarrito(nombre) {
    if (enviando) return;
    const producto = catalogo.find(item => item.nombre === nombre);
    if (!producto) return;

    if (!carrito[nombre]) {
        carrito[nombre] = { ...producto, cantidad: 0 };
    }

    carrito[nombre].cantidad += 1;
    actualizarPedido(true);
}

function cambiarCantidad(nombre, cambio) {
    if (enviando || !carrito[nombre]) {
        return;
    }

    carrito[nombre].cantidad += cambio;

    if (carrito[nombre].cantidad <= 0) {
        delete carrito[nombre];
    }

    actualizarPedido();
}

function construirResumenPedido() {
    const lineas = Object.values(carrito).map(item =>
        `${item.cantidad} × ${item.nombre} (${item.descripcion}) — ${formatoEuros.format(item.precio)} cada oferta — Subtotal: ${formatoEuros.format(item.cantidad * item.precio)}`
    );
    lineas.push(`Total: ${contarCajas()} ${contarCajas() === 1 ? 'caja' : 'cajas'}`);
    lineas.push(`TOTAL DEL PEDIDO: ${formatoEuros.format(calcularTotal())} (IVA incluido)`);
    return lineas.join("\n");
}

function contarUnidades() {
    return Object.values(carrito).reduce((total, item) => total + item.cantidad, 0);
}

function contarCajas() {
    return Object.values(carrito).reduce((total, item) => total + item.cantidad * item.cajas, 0);
}

function calcularTotal() {
    return Object.values(carrito).reduce((total, item) => total + item.cantidad * item.precio, 0);
}

function textoCajas(total) {
    return `${total} ${total === 1 ? 'caja' : 'cajas'}`;
}

function actualizarPedido(debeDesplazar = false) {
    const productos = Object.values(carrito);
    const total = contarCajas();

    elementos.contadorCarrito.textContent = `${textoCajas(total)} · ${formatoEuros.format(calcularTotal())}`;
    elementos.resumenUnidades.textContent = `${textoCajas(total)} ${total === 1 ? 'seleccionada' : 'seleccionadas'}`;
    elementos.totalPedido.textContent = formatoEuros.format(calcularTotal());
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
        nombre.className = "pedido-nombre";
        nombre.textContent = item.nombre;

        const cantidad = document.createElement('p');
        cantidad.className = "text-sm text-slate-500";
        cantidad.textContent = `${item.cantidad} × ${formatoEuros.format(item.precio)} · ${textoCajas(item.cantidad * item.cajas)}`;

        const subtotal = document.createElement('p');
        subtotal.className = "pedido-importe";
        subtotal.textContent = formatoEuros.format(item.cantidad * item.precio);

        const controles = document.createElement('div');
        controles.className = "flex shrink-0 items-center gap-2";

        const botonMenos = crearBotonCantidad(item.nombre, -1, "-");
        const numero = document.createElement('span');
        numero.className = "w-8 text-center text-sm font-black text-slate-900";
        numero.textContent = item.cantidad;
        const botonMas = crearBotonCantidad(item.nombre, 1, "+");

        detalle.append(nombre, cantidad, subtotal);
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
    boton.setAttribute('aria-label', `${cambio > 0 ? 'Añadir' : 'Quitar'} una oferta de ${nombre}`);
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
    if (enviando) return;
    limpiarEstado();

    if (contarUnidades() === 0) {
        mostrarEstado("Selecciona al menos un producto antes de enviar el pedido.", "error");
        return;
    }

    elementos.btnEnviar.textContent = "Enviando...";
    enviando = true;
    document.querySelectorAll('button, #formulario-pedido input').forEach(control => { control.disabled = true; });

    const datosEnvio = {
        nombre_cliente: document.getElementById('nombre').value,
        telefono_cliente: document.getElementById('telefono').value,
        direccion_cliente: document.getElementById('direccion').value,
        productos: construirResumenPedido(),
        total_unidades: contarUnidades(),
        total_cajas: contarCajas(),
        total_importe: formatoEuros.format(calcularTotal())
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
        enviando = false;
        elementos.btnEnviar.textContent = "Enviar pedido";
        document.querySelectorAll('button, #formulario-pedido input').forEach(control => { control.disabled = false; });
    }
});

cargarProductos();
