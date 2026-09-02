import { supabaseClient } from './config.js';

console.log("📄 Formulario de nueva venta cargado");

const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

const form = document.getElementById('form-nueva-venta');
const mensajeExito = document.getElementById('mensaje-exito');
const mensajeError = document.getElementById('mensaje-error');

form.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Ocultar mensajes anteriores
    mensajeExito.classList.remove('mostrar');
    mensajeError.classList.remove('mostrar');

    // Obtener datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const producto = document.getElementById('producto').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const pagoInicial = parseFloat(document.getElementById('pago-inicial').value) || 0;
    const metodoPago = document.getElementById('metodo-pago').value;
    const fechaSacrificio = document.getElementById('fecha-sacrificio').value || null;

    // Validar
    if (!nombre || !producto || !valor || valor <= 0) {
        mensajeError.textContent = '❌ Por favor, completa todos los campos obligatorios';
        mensajeError.classList.add('mostrar');
        return;
    }

    if (pagoInicial > valor) {
        mensajeError.textContent = '❌ El pago inicial no puede ser mayor al valor total';
        mensajeError.classList.add('mostrar');
        return;
    }

    try {
        // Insertar en Supabase
        const { data, error } = await supabaseClient
            .from('ingresos')
            .insert([
                {
                    nombre: nombre,
                    producto: producto,
                    valor: valor,
                    pago_realizado: pagoInicial,
                    metodo_pago: metodoPago,
                    fecha_sacrificio: fechaSacrificio,
                    fecha_pago: pagoInicial > 0 ? new Date().toISOString().split('T')[0] : null
                }
            ]);

        if (error) {
            console.error('❌ Error:', error);
            mensajeError.textContent = `❌ Error al registrar: ${error.message}`;
            mensajeError.classList.add('mostrar');
            return;
        }

        // Éxito
        mensajeExito.textContent = `✅ Venta registrada exitosamente para "${nombre}"`;
        mensajeExito.classList.add('mostrar');

        // Limpiar formulario
        form.reset();
        document.getElementById('pago-inicial').value = 0;

        // Después de 2 segundos, redirigir
        setTimeout(() => {
            window.location.href = 'ventas.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        mensajeError.textContent = `❌ Error inesperado: ${error.message}`;
        mensajeError.classList.add('mostrar');
    }
});