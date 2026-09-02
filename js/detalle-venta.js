import { supabaseClient } from './config.js';

console.log("📄 Página de detalle cargada");

// ============================================
// MODO OSCURO (A PRUEBA DE ERRORES)
// ============================================
const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

// ============================================
// OBTENER ID DE LA URL
// ============================================
function obtenerIdDeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

const ventaId = obtenerIdDeURL();
console.log(`📌 ID de venta recibido: ${ventaId}`);

// ============================================
// 1. CARGAR DETALLE DE VENTA
// ============================================
async function cargarDetalleVenta(id) {
    if (!id) {
        document.getElementById('detalle-venta').innerHTML = `
            <p style="color: #d32f2f; font-size: 18px;">❌ No se especificó qué venta ver</p>
            <p>Por favor, vuelve a la lista de ventas y selecciona una.</p>
        `;
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('ingresos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            document.getElementById('detalle-venta').innerHTML = `
                <p style="color: #d32f2f; font-size: 18px;">❌ Venta no encontrada</p>
                <p>No existe una venta con ID: ${id}</p>
            `;
            return;
        }

        mostrarDetalleVenta(data);

    } catch (error) {
        console.error("❌ Error:", error);
        document.getElementById('detalle-venta').innerHTML = `
            <p style="color: #d32f2f; font-size: 18px;">❌ Error inesperado</p>
            <p>${error.message}</p>
        `;
    }
}

// ============================================
// 2. MOSTRAR DETALLE TIPO FACTURA
// ============================================
function mostrarDetalleVenta(venta) {
    const estado = venta.pago_pendiente === 0 ? 'completado' : 'pendiente';
    const estadoBadge = estado === 'completado'
        ? '<span class="estado-badge estado-completado-badge">✅ Completado</span>'
        : '<span class="estado-badge estado-pendiente-badge">⏳ Pendiente</span>';

    // Formato tipo factura
    const detalleHTML = `
        <div class="factura-datos">
            <div>
                <strong>Cliente</strong>
                <p>${venta.nombre}</p>
            </div>
            <div>
                <strong>Producto</strong>
                <p>${venta.producto}</p>
            </div>
            <div>
                <strong>Fecha Sacrificio</strong>
                <p>${venta.fecha_sacrificio || 'No registrada'}</p>
            </div>
            <div>
                <strong>Método de Pago</strong>
                <p>${venta.metodo_pago || 'No registrado'}</p>
            </div>
        </div>

        <div class="factura-totales">
            <p><span>Valor Total:</span> <strong>$${venta.valor.toLocaleString()}</strong></p>
            <p><span>Pagado:</span> <strong style="color: #2e7d32;">$${venta.pago_realizado.toLocaleString()}</strong></p>
            <p><span>Pendiente:</span> <strong style="color: ${venta.pago_pendiente === 0 ? '#2e7d32' : '#d32f2f'};">
                $${venta.pago_pendiente.toLocaleString()}
            </strong></p>
            <p class="total-final"><span>Estado:</span> ${estadoBadge}</p>
        </div>
    `;

    document.getElementById('detalle-venta').innerHTML = detalleHTML;

    const historialBody = document.getElementById('historial-pagos');
    if (venta.pago_realizado > 0) {
        historialBody.innerHTML = `
            <tr>
                <td>${venta.fecha_pago || 'Fecha no registrada'}</td>
                <td>$${venta.pago_realizado.toLocaleString()}</td>
                <td>${venta.metodo_pago || 'No registrado'}</td>
            </tr>
        `;
    } else {
        historialBody.innerHTML = `
            <tr>
                <td colspan="3" class="historial-vacio">No hay pagos registrados</td>
            </tr>
        `;
    }

    console.log(`✅ Mostrando datos de: ${venta.nombre}`);
}

// ============================================
// 3. REGISTRAR ABONO
// ============================================
async function registrarAbono(id, montoAbono, metodoPago) {
    if (montoAbono <= 0) {
        alert('❌ El monto debe ser mayor a cero');
        return;
    }

    try {
        const { data: venta, error: errorGet } = await supabaseClient
            .from('ingresos')
            .select('*')
            .eq('id', id)
            .single();

        if (errorGet) throw errorGet;

        if (venta.pago_pendiente === 0) {
            alert('✅ Esta venta ya está completamente pagada');
            return;
        }

        let montoFinal = montoAbono;
        if (montoAbono > venta.pago_pendiente) {
            if (confirm(`⚠️ El abono ($${montoAbono.toLocaleString()}) supera la deuda ($${venta.pago_pendiente.toLocaleString()}).\n¿Deseas registrar el excedente como pago completo?`)) {
                montoFinal = venta.pago_pendiente;
            } else {
                return;
            }
        }

        const nuevoPagado = venta.pago_realizado + montoFinal;
        const hoy = new Date().toISOString().split('T')[0];

        const { error: errorUpdate } = await supabaseClient
            .from('ingresos')
            .update({
                pago_realizado: nuevoPagado,
                metodo_pago: metodoPago,
                fecha_pago: hoy
            })
            .eq('id', id);

        if (errorUpdate) throw errorUpdate;

        const nuevoPendiente = venta.valor - nuevoPagado;
        const estado = nuevoPendiente === 0 ? 'COMPLETADO ✅' : 'PENDIENTE ⏳';

        alert(
            `✅ Abono registrado exitosamente!\n\n` +
            `💰 Monto: $${montoFinal.toLocaleString()}\n` +
            `📌 Método: ${metodoPago}\n` +
            `📉 Nuevo pendiente: $${nuevoPendiente.toLocaleString()}\n` +
            `📊 Estado: ${estado}`
        );

        location.reload();

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}

// ============================================
// 4. EVENT LISTENERS
// ============================================
document.getElementById('form-abono').addEventListener('submit', function(event) {
    event.preventDefault();

    const monto = parseFloat(document.getElementById('monto-abono').value);
    const metodo = document.getElementById('metodo-abono').value;

    if (isNaN(monto) || monto <= 0) {
        alert('❌ Por favor, ingresa un monto válido');
        return;
    }

    registrarAbono(ventaId, monto, metodo);
    document.getElementById('monto-abono').value = '';
});

// ============================================
// 5. EJECUTAR AL CARGAR
// ============================================
window.onload = function() {
    cargarDetalleVenta(ventaId);
};