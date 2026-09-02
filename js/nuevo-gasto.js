import { supabaseClient } from './config.js';

console.log("📄 Formulario de nuevo gasto cargado");

const btnDark = document.getElementById('btn-dark-mode');
if (btnDark) {
    btnDark.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        btnDark.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
}

const form = document.getElementById('form-nuevo-gasto');
const mensajeExito = document.getElementById('mensaje-exito');
const mensajeError = document.getElementById('mensaje-error');

// Fecha por defecto: hoy
document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

form.addEventListener('submit', async function(event) {
    event.preventDefault();

    mensajeExito.classList.remove('mostrar');
    mensajeError.classList.remove('mostrar');

    const tipoGasto = document.getElementById('tipo-gasto').value;
    const concepto = document.getElementById('concepto').value.trim();
    const monto = parseFloat(document.getElementById('monto').value);
    const fecha = document.getElementById('fecha').value;

    if (!concepto || !monto || monto <= 0 || !fecha) {
        mensajeError.textContent = '❌ Por favor, completa todos los campos obligatorios';
        mensajeError.classList.add('mostrar');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('gastos')
            .insert([
                {
                    tipo_gasto: tipoGasto,
                    concepto: concepto,
                    monto: monto,
                    fecha: fecha
                }
            ]);

        if (error) {
            console.error('❌ Error:', error);
            mensajeError.textContent = `❌ Error al registrar: ${error.message}`;
            mensajeError.classList.add('mostrar');
            return;
        }

        mensajeExito.textContent = `✅ Gasto "${concepto}" registrado exitosamente`;
        mensajeExito.classList.add('mostrar');

        form.reset();
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];

        setTimeout(() => {
            window.location.href = 'gastos.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Error:', error);
        mensajeError.textContent = `❌ Error inesperado: ${error.message}`;
        mensajeError.classList.add('mostrar');
    }
});