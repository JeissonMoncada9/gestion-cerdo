function cargarDatosSimulados() {
    document.querySelectorAll('.card .numero').forEach(el => {
        el.textContent = '⏳ Cargando...';
    });

    setTimeout(() => {
        const totalIngresos = 1200000;
        const totalDeudas = 298500;
        const totalGastos = 320000;
        const cerdosActivos = 12;  // <--- NUEVO DATO

        const numeros = document.querySelectorAll('.card .numero');
        
        numeros[0].textContent = `$${totalIngresos.toLocaleString()}`;
        numeros[0].style.color = '#2d7d46';
        
        numeros[1].textContent = `$${totalDeudas.toLocaleString()}`;
        numeros[1].style.color = '#d32f2f';
        
        numeros[2].textContent = `$${totalGastos.toLocaleString()}`;
        numeros[2].style.color = '#d32f2f';
        
        // NUEVA TARJETA (posición 3)
        numeros[3].textContent = `${cerdosActivos}`;
        numeros[3].style.color = '#2d7d46';

    }, 1000);
}