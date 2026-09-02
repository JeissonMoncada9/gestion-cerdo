import { supabaseClient } from './config.js';

console.log("📄 Página de Gastos cargada");
const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

// ============================================
// 1. CARGAR Y MOSTRAR GASTOS
// ============================================
async function cargarGastos() {
    try {
        console.log("Cargando gastos...");

        const { data: gastos, error } = await supabaseClient
            .from('gastos')
            .select('*')
            .order('fecha', { ascending: false }); // Ordenar por fecha descendente

        if (error) throw error;

        console.log(`✅ Gastos cargados: ${gastos.length}`);

        // Calcular total
        const total = gastos.reduce((sum, g) => sum + g.monto, 0);
        document.getElementById('total-gastos-valor').textContent = `$${total.toLocaleString()}`;
        document.getElementById('total-gastos-pie').textContent = total.toLocaleString();

        // Mostrar tabla o mensaje vacío
        if (!gastos || gastos.length === 0) {
            document.getElementById('contenedor-tabla').style.display = 'none';
            document.getElementById('sin-gastos').style.display = 'block';
            return;
        }

        document.getElementById('contenedor-tabla').style.display = 'block';
        document.getElementById('sin-gastos').style.display = 'none';

        renderizarTabla(gastos);

    } catch (error) {
        console.error("❌ Error al cargar gastos:", error);
        alert("❌ Error al cargar los gastos: " + error.message);
    }
}

// ============================================
// 2. RENDERIZAR TABLA
// ============================================
function renderizarTabla(gastos) {
    const cuerpo = document.getElementById('cuerpo-gastos');
    cuerpo.innerHTML = '';

    const categoriaMap = {
        'purina': { clase: 'categoria-purina', icono: '🌾' },
        'compra_cerdos': { clase: 'categoria-compra', icono: '🐖' },
        'retiro_dinero': { clase: 'categoria-retiro', icono: '💸' },
        'veterinario': { clase: 'categoria-veterinario', icono: '💉' },
        'transporte': { clase: 'categoria-transporte', icono: '🚚' },
        'otros': { clase: 'categoria-otros', icono: '📦' }
    };

    gastos.forEach((gasto, index) => {
        const cat = categoriaMap[gasto.tipo_gasto] || categoriaMap['otros'];
        
        const fila = `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <span class="categoria-badge ${cat.clase}">
                        ${cat.icono} ${gasto.tipo_gasto.replace(/_/g, ' ')}
                    </span>
                </td>
                <td>${gasto.concepto}</td>
                <td><strong>$${gasto.monto.toLocaleString()}</strong></td>
                <td>${gasto.fecha}</td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarGasto('${gasto.id}')">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
        cuerpo.innerHTML += fila;
    });
}

// ============================================
// 3. ELIMINAR GASTO
// ============================================
window.eliminarGasto = async function(id) {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return;

    try {
        const { error } = await supabaseClient
            .from('gastos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert("✅ Gasto eliminado correctamente");
        cargarGastos(); // Recargar la tabla

    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        alert("❌ No se pudo eliminar el gasto");
    }
}

// ============================================
// 4. EJECUTAR AL CARGAR
// ============================================
window.onload = function() {
    cargarGastos();
};