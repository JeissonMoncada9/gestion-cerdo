import { supabaseClient } from './config.js';

console.log("🚀 Dashboard iniciando...");

// ============================================
// MODO OSCURO
// ============================================
const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

// ============================================
// 1. CARGAR DATOS DU DASHBOARD
// ============================================
async function cargarDashboard() {
    try {
        console.log(" Cargando datos...");

        const { data: ingresos, error: errorIngresos } = await supabaseClient
            .from('ingresos').select('*').order('creado_en', { ascending: false });

        if (errorIngresos) throw errorIngresos;

        const { data: gastos, error: errorGastos } = await supabaseClient
            .from('gastos').select('*').order('creado_en', { ascending: false });

        if (errorGastos) throw errorGastos;

        // CALCULAR LOS TOTALES CORRECTOS
        const totalIngresos = ingresos.reduce((sum, v) => sum + v.valor, 0);
        const totalCobrado = ingresos.reduce((sum, v) => sum + v.pago_realizado, 0);
        const totalDeudas = ingresos.reduce((sum, v) => sum + v.pago_pendiente, 0);
        const totalGastos = gastos.reduce((sum, v) => sum + v.monto, 0);

        document.getElementById('total-ingresos').textContent = `$${totalIngresos.toLocaleString()}`;
        document.getElementById('total-deudas').textContent = `$${totalDeudas.toLocaleString()}`;
        document.getElementById('total-gastos').textContent = `$${totalGastos.toLocaleString()}`;

        mostrarUltimasVentas(ingresos.slice(0, 5));
        mostrarUltimosGastos(gastos.slice(0, 5));
        await cargarCerdos();

        // Dibujar la gráfica con el dinero COBRADO
        dibujarGraficaCircular(totalCobrado, totalDeudas, totalGastos);

    } catch (error) {
        console.error(" Error:", error);
        document.getElementById('ventas-recientes').innerHTML = `
            <div class="mensaje-error" style="background: #ffebee; color: #d32f2f; padding: 15px; border-radius: 8px;">
                Error al cargar las ventas recientes: ${error.message}
            </div>
        `;
    }
}

// ============================================
// 2. GRÁFICA CIRCULAR (CORREGIDA)
// ============================================
function dibujarGraficaCircular(totalCobrado, totalDeudas, totalGastos) {
    // Datos basados en el dinero REAL en caja, deuda y gastos
    const data = [
        { label: "Cobrado", value: totalCobrado > 0 ? totalCobrado : 1, color: "#29b6f6" }, 
        { label: "Deudas", value: totalDeudas > 0 ? totalDeudas : 1, color: "#ec407a" },
        { label: "Gastos", value: totalGastos > 0 ? totalGastos : 1, color: "#ffa726" },
    ];

    const dataFiltrada = data.filter(d => d.value > 0);
    if(dataFiltrada.length === 0) return;

    const width = 600;
    const height = 600;
    d3.select("#contenedor-grafica").select("svg").remove();

    const svg = d3.select("#contenedor-grafica")
        .append("svg").attr("width", width).attr("height", height)
        .append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc().innerRadius(80).outerRadius(150).padAngle(0.02).padRadius(100);
    const arcOuter = d3.arc().innerRadius(150).outerRadius(210).padAngle(0.05).padRadius(100);
    
    const pie = d3.pie().value(d => d.value).sort(null);

    svg.selectAll('.arcOuter').data(pie(dataFiltrada)).enter().append('path')
        .attr('d', arcOuter).attr('fill', d => d.data.color)
        .attr('class', 'segmento').style('stroke', 'white').style('stroke-width', '4px');

    svg.selectAll('.arcInner').data(pie(dataFiltrada)).enter().append('path')
        .attr('d', arc).attr('fill', d => d.data.color).attr('class', 'segmento');

    svg.selectAll('.texto-segmento').data(pie(dataFiltrada)).enter().append('text')
        .attr('transform', d => `translate(${arcOuter.centroid(d)})`)
        .attr('dy', '0.35em').attr('class', 'texto-segmento')
        .text(d => d.data.label + " $" + d.data.value.toLocaleString());

    // Actualizar el centro de la gráfica
    document.querySelector('#centro-grafica span').textContent = `$${totalCobrado.toLocaleString()}`;
}

// ============================================
// 3. MOSTRAR ÚLTIMOS GASTOS
// ============================================
function mostrarUltimosGastos(gastos) {
    const container = document.getElementById('gastos-recientes');

    if (!gastos || gastos.length === 0) {
        container.innerHTML = `
            <div class="mensaje-vacio" style="text-align: center; padding: 30px; background: white; border-radius: 12px; color: #666;">
                📭 No hay gastos registrados
            </div>
        `;
        return;
    }

    let html = `
        <table class="tabla">
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
    `;

    const categoriaMap = {
        'purina': '🌾 Purina',
        'compra_cerdos': ' Compra cerdos',
        'retiro_dinero': ' Retiro',
        'veterinario': ' Veterinario',
        'transporte': ' Transporte',
        'otros': ' Otros'
    };

    gastos.forEach(gasto => {
        html += `
            <tr>
                <td>${categoriaMap[gasto.tipo_gasto] || gasto.tipo_gasto}</td>
                <td>${gasto.concepto}</td>
                <td>$${gasto.monto.toLocaleString()}</td>
                <td>${gasto.fecha}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// ============================================
// 4. GESTIÓN DE CERDOS (SUPABASE)
// ============================================
async function cargarCerdos() {
    try {
        const { data, error } = await supabaseClient
            .from('configuracion')
            .select('valor')
            .eq('clave', 'total_cerdos')
            .single();

        if (error) {
            console.error(" Error al cargar cerdos:", error);
            document.getElementById('total-cerdos').textContent = '12';
            return;
        }

        if (data) {
            document.getElementById('total-cerdos').textContent = data.valor;
            console.log(` Cerdos cargados: ${data.valor}`);
        } else {
            document.getElementById('total-cerdos').textContent = '12';
        }

    } catch (error) {
        console.error(" Error:", error);
        document.getElementById('total-cerdos').textContent = '12';
    }
}

async function actualizarCerdos(cantidad) {
    try {
        const { error } = await supabaseClient
            .from('configuracion')
            .update({ valor: cantidad.toString() })
            .eq('clave', 'total_cerdos');

        if (error) throw error;

        document.getElementById('total-cerdos').textContent = cantidad;
        console.log(`🐷 Cerdos actualizados: ${cantidad}`);

    } catch (error) {
        console.error(" Error al actualizar cerdos:", error);
        alert(" Error al guardar en la base de datos");
        throw error;
    }
}

// ============================================
// 5. MODAL DE EDICIÓN DE CERDOS
// ============================================
const modalCerdos = document.getElementById('modal-cerdos');
const inputCerdos = document.getElementById('input-cerdos');

if (document.getElementById('btn-editar-cerdos')) {
    document.getElementById('btn-editar-cerdos').addEventListener('click', function() {
        const cerdosActuales = document.getElementById('total-cerdos').textContent;
        inputCerdos.value = cerdosActuales;
        modalCerdos.classList.add('active');
    });
}

if (document.getElementById('btn-cerrar-modal')) {
    document.getElementById('btn-cerrar-modal').addEventListener('click', function() {
        modalCerdos.classList.remove('active');
    });
}

if (modalCerdos) {
    modalCerdos.addEventListener('click', function(event) {
        if (event.target === modalCerdos) {
            modalCerdos.classList.remove('active');
        }
    });
}

if (document.getElementById('btn-guardar-cerdos')) {
    document.getElementById('btn-guardar-cerdos').addEventListener('click', async function() {
        const cantidad = parseInt(inputCerdos.value);
        
        if (isNaN(cantidad) || cantidad < 0) {
            alert(' Por favor, ingresa un número válido mayor o igual a 0');
            return;
        }

        try {
            await actualizarCerdos(cantidad);
            modalCerdos.classList.remove('active');
            alert(` Cerdos actualizados a ${cantidad}`);
        } catch (error) {
            // El error ya se maneja en actualizarCerdos
        }
    });
}

// ============================================
// 6. GRÁFICA CIRCULAR ESTÉTICA (D3.js)
// ============================================
function dibujarGraficaCircular(ingresos, totalIngresos, totalDeudas, totalGastos) {
    // Datos para la gráfica basados en los totales reales
    const data = [
        { label: "Ventas", value: totalIngresos > 0 ? totalIngresos : 1, color: "#4be70e" }, 
        { label: "Deudas", value: totalDeudas > 0 ? totalDeudas : 1, color: "#e70e0e" },
        { label: "Gastos", value: totalGastos > 0 ? totalGastos : 1, color: "#ffa726" },
    ];

    // Filtrar valores en 0 para que no explote la gráfica
    const dataFiltrada = data.filter(d => d.value > 0);

    if(dataFiltrada.length === 0) return;

    const width = 600;
    const height = 600;
    const radius = Math.min(width, height) / 2;

    // Limpiar el contenedor
    d3.select("#contenedor-grafica").select("svg").remove();

    const svg = d3.select("#contenedor-grafica")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arc = d3.arc().innerRadius(80).outerRadius(150).padAngle(0.02).padRadius(100);
    const arcOuter = d3.arc().innerRadius(150).outerRadius(210).padAngle(0.05).padRadius(100);
    
    const pie = d3.pie().value(d => d.value).sort(null);

    // Pestañas exteriores
    svg.selectAll('.arcOuter')
        .data(pie(dataFiltrada)).enter().append('path')
        .attr('d', arcOuter).attr('fill', d => d.data.color)
        .attr('class', 'segmento')
        .style('stroke', 'white').style('stroke-width', '4px');

    // Anillo interior
    svg.selectAll('.arcInner')
        .data(pie(dataFiltrada)).enter().append('path')
        .attr('d', arc).attr('fill', d => d.data.color)
        .attr('class', 'segmento');

    // Texto (CORREGIDO: muestra dinero, no %)
    svg.selectAll('.texto-segmento')
        .data(pie(dataFiltrada)).enter().append('text')
        .attr('transform', d => `translate(${arcOuter.centroid(d)})`)
        .attr('dy', '0.35em').attr('class', 'texto-segmento')
        .text(d => d.data.label + " $" + d.data.value.toLocaleString());

    // Actualizar el centro de la gráfica
    const centro = document.querySelector('#centro-grafica span');
    if (centro) {
        centro.textContent = `$${totalIngresos.toLocaleString()}`;
    }
}

// ============================================
// 7. EJECUTAR AL CARGAR
// ============================================
window.onload = function() {
    console.log(" Iniciando carga del dashboard...");
    cargarDashboard();
};