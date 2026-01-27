// Inicializa con tu Public Key de EmailJS
emailjs.init("WD5pzOC5mv7CZ0sMa"); 

const contenedor = document.getElementById('contenedor-productos');
let carrito = [];

async function cargarProductos() {
    try {
        const respuesta = await fetch('productos.json');
        const productos = await respuesta.json();
        pintarProductos(productos);
    } catch (error) {
        console.error("Error al cargar JSON:", error);
    }
}

function pintarProductos(productos) {
    contenedor.innerHTML = "";
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = "bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center";
        card.innerHTML = `
            <img src="${producto.imagen}" class="w-full h-48 object-contain mb-4 rounded">
            <h3 class="font-bold text-lg">${producto.nombre}</h3>
            <p class="text-sm text-gray-500 mb-4">${producto.descripcion}</p>
            <button onclick="agregarAlCarrito('${producto.nombre}')" 
                class="mt-auto w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Seleccionar
            </button>
        `;
        contenedor.appendChild(card);
    });
}

function agregarAlCarrito(nombre) {
    carrito.push(nombre);
    document.getElementById('seccion-pedido').classList.remove('hidden');
    document.getElementById('lista-seleccionados').innerText = "Productos: " + carrito.join(", ");
    document.getElementById('seccion-pedido').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario-pedido');
    
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = document.getElementById('btn-enviar');
        btn.innerText = "Enviando...";
        btn.disabled = true;

        const datosEnvio = {
            nombre_cliente: document.getElementById('nombre').value,
            telefono_cliente: document.getElementById('telefono').value,
            direccion_cliente: document.getElementById('direccion').value,
            productos: carrito.join(", ")
        };

        // Usa tu Service ID y Template ID reales
        emailjs.send('service_vmoccs7', 'template_9am5qhd', datosEnvio)
            .then(() => {
                alert("¡Pedido enviado correctamente!");
                carrito = [];
                formulario.reset();
                document.getElementById('seccion-pedido').classList.add('hidden');
            }, (err) => {
                alert("Error al enviar pedido: " + JSON.stringify(err));
            })
            .finally(() => {
                btn.innerText = "Enviar Pedido";
                btn.disabled = false;
            });
    });
});

cargarProductos();