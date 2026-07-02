-- ============================================
-- 🐖 SISTEMA DE GESTIÓN PORCINA
-- BASE DE DATOS COMPLETA
-- Versión: 3.0
-- Fecha: 2026-07-02
-- ============================================

-- ============================================
-- 1. TABLA: ingresos (Ventas y Abonos)
-- ============================================
CREATE TABLE IF NOT EXISTS ingresos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    producto TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
    pago_realizado DECIMAL(10,2) DEFAULT 0 CHECK (pago_realizado >= 0),
    pago_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (valor - pago_realizado) STORED,
    metodo_pago TEXT DEFAULT 'pendiente',
    fecha_pago DATE,
    fecha_sacrificio DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABLA: gastos (Gastos Operativos)
-- ============================================
CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_gasto TEXT NOT NULL,
    concepto TEXT NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto >= 0),
    fecha DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: configuracion (Configuración del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CREAR ÍNDICES (Para mejorar rendimiento)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ingresos_nombre ON ingresos(nombre);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha_sacrificio);
CREATE INDEX IF NOT EXISTS idx_ingresos_pendiente ON ingresos(pago_pendiente);
CREATE INDEX IF NOT EXISTS idx_gastos_tipo ON gastos(tipo_gasto);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);

-- ============================================
-- 5. LIMPIAR POLÍTICAS VIEJAS
-- ============================================
DROP POLICY IF EXISTS "Usuarios pueden leer ingresos" ON ingresos;
DROP POLICY IF EXISTS "Usuarios pueden crear ingresos" ON ingresos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar ingresos" ON ingresos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar ingresos" ON ingresos;
DROP POLICY IF EXISTS "Usuarios pueden leer gastos" ON gastos;
DROP POLICY IF EXISTS "Usuarios pueden crear gastos" ON gastos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar gastos" ON gastos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar gastos" ON gastos;
DROP POLICY IF EXISTS "Usuarios pueden leer configuracion" ON configuracion;
DROP POLICY IF EXISTS "Usuarios pueden actualizar configuracion" ON configuracion;
DROP POLICY IF EXISTS "Usuarios pueden insertar configuracion" ON configuracion;

-- ============================================
-- 6. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLÍTICAS PARA ingresos
-- ============================================
CREATE POLICY "Usuarios pueden leer ingresos" ON ingresos
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden crear ingresos" ON ingresos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar ingresos" ON ingresos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios pueden eliminar ingresos" ON ingresos
    FOR DELETE USING (true);

-- ============================================
-- 8. POLÍTICAS PARA gastos
-- ============================================
CREATE POLICY "Usuarios pueden leer gastos" ON gastos
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden crear gastos" ON gastos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar gastos" ON gastos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios pueden eliminar gastos" ON gastos
    FOR DELETE USING (true);

-- ============================================
-- 9. POLÍTICAS PARA configuracion
-- ============================================
CREATE POLICY "Usuarios pueden leer configuracion" ON configuracion
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden actualizar configuracion" ON configuracion
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Usuarios pueden insertar configuracion" ON configuracion
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 10. INSERTAR DATOS DE PRUEBA
-- ============================================

-- 10.1 Insertar ventas (ingresos)
INSERT INTO ingresos (nombre, producto, valor, pago_realizado, metodo_pago, fecha_sacrificio)
VALUES 
    ('Pedro Pérez', 'Cerdo 85kg', 598500, 300000, 'efectivo', '2026-06-20'),
    ('María López', '5kg Lomo', 350000, 350000, 'transferencia', '2026-06-19'),
    ('Juan García', '2kg Costilla', 250000, 0, 'pendiente', '2026-06-18'),
    ('Ana Martínez', 'Cerdo 70kg', 490000, 200000, 'nequi', '2026-06-21')
ON CONFLICT (id) DO NOTHING;

-- 10.2 Insertar gastos
INSERT INTO gastos (tipo_gasto, concepto, monto, fecha)
VALUES 
    ('purina', 'Bolsa de purina 40kg', 120000, '2026-06-21'),
    ('compra_cerdos', 'Compra de 2 cerdos', 400000, '2026-06-19'),
    ('retiro_dinero', 'Retiro para gastos personales', 150000, '2026-06-20'),
    ('veterinario', 'Vacunas y desparasitantes', 80000, '2026-06-18'),
    ('purina', 'Bolsa de purina 20kg', 65000, '2026-06-22')
ON CONFLICT (id) DO NOTHING;

-- 10.3 Insertar configuración inicial (cerdos)
INSERT INTO configuracion (clave, valor)
VALUES ('total_cerdos', '12')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- 11. CREAR VISTA DE RESUMEN (Opcional)
-- ============================================
CREATE OR REPLACE VIEW resumen_financiero AS
SELECT 
    (SELECT COALESCE(SUM(valor), 0) FROM ingresos) AS total_ingresos,
    (SELECT COALESCE(SUM(pago_pendiente), 0) FROM ingresos) AS total_deudas,
    (SELECT COALESCE(SUM(monto), 0) FROM gastos) AS total_gastos,
    (SELECT COUNT(*) FROM ingresos) AS total_ventas,
    (SELECT COUNT(*) FROM gastos) AS total_gastos_registrados;

-- ============================================
-- 12. VERIFICAR INSTALACIÓN
-- ============================================
SELECT '✅ BASE DE DATOS COMPLETA INSTALADA' AS estado;

SELECT '📊 TABLAS CREADAS' AS info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('ingresos', 'gastos', 'configuracion');

SELECT '📋 POLÍTICAS CREADAS' AS info;
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('ingresos', 'gastos', 'configuracion')
ORDER BY tablename, cmd;

SELECT '📈 DATOS INSERTADOS' AS info;
SELECT 'Ingresos' AS tabla, COUNT(*) AS cantidad FROM ingresos
UNION ALL
SELECT 'Gastos' AS tabla, COUNT(*) AS cantidad FROM gastos
UNION ALL
SELECT 'Configuración' AS tabla, COUNT(*) AS cantidad FROM configuracion;

SELECT '🐷 CERDOS' AS info;
SELECT * FROM configuracion WHERE clave = 'total_cerdos';

SELECT '📊 RESUMEN FINANCIERO' AS info;
SELECT * FROM resumen_financiero;

SELECT '✅ INSTALACIÓN COMPLETA EXITOSA' AS mensaje_final;