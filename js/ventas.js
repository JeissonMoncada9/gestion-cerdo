import { supabaseClient } from './config.js';

console.log("📄 Página de ventas cargada");

const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

let todasLasVentas = [];
let todosLosGastos = [];

// ============================================
// 1. CARGAR DATOS DESDE SUPABASE
// ============================================
async function cargarDatos() {
    try {
        console.log("🔄 Cargando datos...");

        const { data: ventas, error: errorVentas } = await supabaseClient
            .from('ingresos')
            .select('*')
            .order('fecha_sacrificio', { ascending: false });

        if (errorVentas) throw errorVentas;

        const { data: gastos, error: errorGastos } = await supabaseClient
            .from('gastos')
            .select('*');

        if (errorGastos) throw errorGastos;

        todasLasVentas = ventas;
        todosLosGastos = gastos;

        console.log(`✅ ${ventas.length} ventas y ${gastos.length} gastos cargados`);
        
        // Actualizar resumen global
        actualizarResumenGlobal(ventas, gastos);
        
        // Mostrar ventas agrupadas
        mostrarVentasAgrupadas(ventas, gastos);

    } catch (error) {
        console.error("❌ Error:", error);
        document.getElementById('contenedor-ventas').innerHTML = `
            <div class="sin-ventas" style="color: #d32f2f;">
                ❌ Error al cargar los datos: ${error.message}
            </div>
        `;
    }
}

// ============================================
// 2. AGRUPAR VENTAS POR FECHA
// ============================================
function agruparVentasPorFecha(ventas) {
    const grupos = {};
    
    ventas.forEach(venta => {
        const fecha = venta.fecha_sacrificio || venta.creado_en?.split('T')[0] || 'Sin fecha';
        if (!grupos[fecha]) {
            grupos[fecha] = [];
        }
        grupos[fecha].push(venta);
    });
    
    const fechasOrdenadas = Object.keys(grupos).sort((a, b) => {
        if (a === 'Sin fecha') return 1;
        if (b === 'Sin fecha') return -1;
        return new Date(b) - new Date(a);
    });
    
    const resultado = {};
    fechasOrdenadas.forEach(fecha => {
        resultado[fecha] = grupos[fecha];
    });
    
    return resultado;
}

// ============================================
// 3. CALCULAR GASTOS POR FECHA
// ============================================
function calcularGastosPorFecha(gastos) {
    const gastosPorFecha = {};
    gastos.forEach(gasto => {
        const fecha = gasto.fecha;
        if (!gastosPorFecha[fecha]) {
            gastosPorFecha[fecha] = 0;
        }
        gastosPorFecha[fecha] += gasto.monto;
    });
    return gastosPorFecha;
}

// ============================================
// 4. MOSTRAR VENTAS AGRUPADAS (CORREGIDO)
// ============================================
function mostrarVentasAgrupadas(ventas, gastos) {
    const container = document.getElementById('contenedor-ventas');
    
    if (!ventas || ventas.length === 0) {
        container.innerHTML = `
            <div class="sin-ventas">
                📭 No hay ventas registradas
                <br><br>
                <a href="nueva-venta.html" class="btn">➕ Registrar primera venta</a>
            </div>
        `;
        return;
    }

    const ventasPorFecha = agruparVentasPorFecha(ventas);
    const gastosPorFecha = calcularGastosPorFecha(gastos);
    
    let html = '';

    for (const [fecha, ventasDelDia] of Object.entries(ventasPorFecha)) {
        // CALCULAR TOTALES DEL DÍA (CORREGIDO)
        const totalVentasDia = ventasDelDia.reduce((sum, v) => sum + v.valor, 0);
        const totalPagadoDia = ventasDelDia.reduce((sum, v) => sum + v.pago_realizado, 0);
        const totalDeudaDia = ventasDelDia.reduce((sum, v) => sum + v.pago_pendiente, 0);
        const totalGastosDia = gastosPorFecha[fecha] || 0;
        const gananciaDia = totalVentasDia - totalGastosDia;
        
        const fechaFormateada = fecha === 'Sin fecha' ? '📅 Sin fecha' : formatFecha(fecha);
        const gananciaIcon = gananciaDia >= 0 ? '📈' : '📉';
        const gananciaClass = gananciaDia >= 0 ? 'ganancia' : 'perdida';

        html += `
            <div class="grupo-fecha">
                <div class="grupo-fecha-header">
                    <h3>📅 ${fechaFormateada}</h3>
                    <div class="resumen-dia">
                        <span>💰 Vendido: $${totalVentasDia.toLocaleString()}</span>
                        <span style="color: #2e7d32;">✅ Pagado: $${totalPagadoDia.toLocaleString()}</span>
                        <span style="color: #d32f2f;">⏳ Deben: $${totalDeudaDia.toLocaleString()}</span>
                        <span>📉 Gastos: $${totalGastosDia.toLocaleString()}</span>
                        <span class="${gananciaClass}">${gananciaIcon} Ganancia: $${gananciaDia.toLocaleString()}</span>
                    </div>
                </div>
                <div class="grupo-fecha-body">
                    <table class="tabla">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente</th>
                                <th>Producto</th>
                                <th>Total</th>
                                <th>Pagado</th>
                                <th>Deuda</th>
                                <th>Estado</th>
                                <th>Método</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        ventasDelDia.forEach((venta, index) => {
            const estado = venta.pago_pendiente === 0 ? 'completado' : 'pendiente';
            const badgeClass = estado === 'completado' ? 'badge-completado' : 'badge-pendiente';
            const badgeText = estado === 'completado' ? '✅ Completado' : '⏳ Pendiente';
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${venta.nombre}</strong></td>
                    <td>${venta.producto}</td>
                    <td>$${venta.valor.toLocaleString()}</td>
                    <td>$${venta.pago_realizado.toLocaleString()}</td>
                    <td class="${estado === 'completado' ? 'estado-completado' : 'estado-pendiente'}">
                        $${venta.pago_pendiente.toLocaleString()}
                    </td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td>${venta.metodo_pago || '-'}</td>
                    <td>
                        <a href="detalle-venta.html?id=${venta.id}" class="btn-ver-venta">👁️ Ver</a>
                        <button class="btn-eliminar-venta" data-id="${venta.id}" data-nombre="${venta.nombre}">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
                <div class="total-dia">
                    <span>💰 Vendido: $${totalVentasDia.toLocaleString()} | </span>
                    <span style="color: #2e7d32;">✅ Pagado: $${totalPagadoDia.toLocaleString()} | </span>
                    <span style="color: #d32f2f;">⏳ Deben: $${totalDeudaDia.toLocaleString()}</span>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;

    // CONECTAR BOTONES DE ELIMINAR
    document.querySelectorAll('.btn-eliminar-venta').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;
            eliminarVenta(id, nombre);
        });
    });

    actualizarResumenGlobal(ventas, gastos);
}

// ============================================
// 5. ELIMINAR VENTA (CON DOBLE CONFIRMACIÓN)
// ============================================
async function eliminarVenta(id, nombre) {
    // Primera confirmación
    const confirmar1 = confirm(`⚠️ ¿Estás seguro de eliminar la venta de "${nombre}"?`);
    if (!confirmar1) return;
    
    // Segunda confirmación (escribir "ELIMINAR")
    const confirmar2 = prompt(
        `⚠️ CONFIRMACIÓN FINAL\n\n` +
        `Venta: ${nombre}\n` +
        `Esta acción NO se puede deshacer.\n\n` +
        `Escribe "ELIMINAR" para confirmar:`
    );
    
    if (confirmar2 !== "ELIMINAR") {
        alert("❌ Eliminación cancelada");
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('ingresos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert(`✅ Venta de "${nombre}" eliminada correctamente`);
        
        // Recargar los datos
        await cargarDatos();

    } catch (error) {
        alert("❌ Error al eliminar: " + error.message);
    }
}

// ============================================
// 6. ACTUALIZAR RESUMEN GLOBAL
// ============================================
function actualizarResumenGlobal(ventas, gastos) {
    const totalVentas = ventas.reduce((sum, v) => sum + v.valor, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const gananciaNeta = totalVentas - totalGastos;
    
    document.getElementById('total-ventas-global').textContent = `$${totalVentas.toLocaleString()}`;
    document.getElementById('total-gastos-global').textContent = `$${totalGastos.toLocaleString()}`;
    
    const gananciaEl = document.getElementById('total-ganancia-global');
    gananciaEl.textContent = `$${gananciaNeta.toLocaleString()}`;
    gananciaEl.style.color = gananciaNeta >= 0 ? '#2e7d32' : '#d32f2f';
    
    document.getElementById('total-ventas-count').textContent = ventas.length;
}

// ============================================
// 7. FORMATO DE FECHA
// ============================================
function formatFecha(fechaStr) {
    if (!fechaStr || fechaStr === 'Sin fecha') return fechaStr;
    try {
        const fecha = new Date(fechaStr + 'T00:00:00');
        if (isNaN(fecha.getTime())) return fechaStr;
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
    } catch (e) {
        return fechaStr;
    }
}

// ============================================
// 8. FILTROS
// ============================================
document.getElementById('btn-filtrar').addEventListener('click', function() {
    const filtroCliente = document.getElementById('filtro-cliente').value.toLowerCase().trim();
    const filtroFecha = document.getElementById('filtro-fecha').value;
    const filtroEstado = document.getElementById('filtro-estado').value;
    
    let ventasFiltradas = todasLasVentas;
    
    if (filtroCliente) {
        ventasFiltradas = ventasFiltradas.filter(v => 
            v.nombre.toLowerCase().includes(filtroCliente)
        );
    }
    if (filtroFecha) {
        ventasFiltradas = ventasFiltradas.filter(v => 
            v.fecha_sacrificio === filtroFecha
        );
    }
    if (filtroEstado !== 'todos') {
        ventasFiltradas = ventasFiltradas.filter(v => {
            const estado = v.pago_pendiente === 0 ? 'completado' : 'pendiente';
            return estado === filtroEstado;
        });
    }
    
    mostrarVentasAgrupadas(ventasFiltradas, todosLosGastos);
    actualizarResumenGlobal(ventasFiltradas, todosLosGastos);
});

document.getElementById('btn-limpiar').addEventListener('click', function() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-fecha').value = '';
    document.getElementById('filtro-estado').value = 'todos';
    mostrarVentasAgrupadas(todasLasVentas, todosLosGastos);
    actualizarResumenGlobal(todasLasVentas, todosLosGastos);
});

// ============================================
// 9. EJECUTAR AL CARGAR
// ============================================
window.onload = cargarDatos;