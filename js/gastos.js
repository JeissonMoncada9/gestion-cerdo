// ============================================
// 1. IMPORTAR configuración de Supabase
// ============================================
import { supabaseClient } from './config.js';

// Esto es como decirle a JavaScript:
// "Oye, tráeme la configuración que está en el archivo config.js"


// ============================================
// 2. MAPAS (diccionarios) de categorías
// ============================================
const categoriaMap = {
    'purina': '🌾 Purina',
    'compra_cerdos': '🐷 Compra cerdos',
    'retiro_dinero': '💰 Retiro',
    'veterinario': '💉 Veterinario',
    'transporte': '🚚 Transporte',
    'otros': '📦 Otros'
};

// Esto es como un diccionario:
// Si tienes 'purina', te devuelve '🌾 Purina'


// ============================================
// 3. FUNCIÓN: Cargar gastos desde Supabase
// ============================================
async function cargarGastos() {
    try {
        // Pedir datos a Supabase
        const { data, error } = await supabaseClient
            .from('gastos')
            .select('*')
            .order('creado_en', { ascending: false });

        // Si hay error, mostrarlo y salir
        if (error) {
            alert("❌ Error: " + error.message);
            return;
        }

        // Calcular total de todos los gastos
        const totalGastos = data.reduce((sum, g) => sum + g.monto, 0);
        document.getElementById('total-gastos-valor').textContent = `$${totalGastos.toLocaleString()}`;
        document.getElementById('total-gastos-pie').textContent = data.length;

        // Obtener la tabla donde van los gastos
        const tbody = document.getElementById('cuerpo-gastos');
        tbody.innerHTML = ''; // Limpiar tabla

        // Si no hay gastos, mostrar mensaje
        if (data.length === 0) {
            document.getElementById('sin-gastos').style.display = 'block';
            document.getElementById('contenedor-tabla').style.display = 'none';
            return;
        }

        // Mostrar la tabla
        document.getElementById('sin-gastos').style.display = 'none';
        document.getElementById('contenedor-tabla').style.display = 'block';

        // Recorrer cada gasto y crear una fila en la tabla
        data.forEach((gasto, index) => {
            const categoriaLabel = categoriaMap[gasto.tipo_gasto] || gasto.tipo_gasto;
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${categoriaLabel}</td>
                <td>${gasto.concepto}</td>
                <td>$${gasto.monto.toLocaleString()}</td>
                <td>${gasto.fecha}</td>
                <td>
                    <button class="btn-eliminar" data-id="${gasto.id}" data-concepto="${gasto.concepto}">🗑️</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        // Agregar evento de eliminar a cada botón
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const concepto = this.dataset.concepto;
                eliminarGasto(id, concepto);
            });
        });

    } catch (error) {
        alert("❌ Error: " + error.message);
    }
}


// ============================================
// 4. FUNCIÓN: Eliminar un gasto
// ============================================
async function eliminarGasto(id, concepto) {
    // Preguntar antes de eliminar
    if (!confirm(`⚠️ ¿Eliminar "${concepto}"?`)) return;

    try {
        // Eliminar de Supabase
        const { error } = await supabaseClient
            .from('gastos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert(`✅ "${concepto}" eliminado`);
        cargarGastos(); // Recargar la lista

    } catch (error) {
        alert("❌ Error al eliminar: " + error.message);
    }
}


// ============================================
// 5. EJECUTAR al cargar la página
// ============================================
window.onload = cargarGastos;