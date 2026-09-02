// 📁 config.js - VERSIÓN QUE FUNCIONA CON LIVE SERVER

// 🔥 IMPORTANTE: Este archivo SOLO para desarrollo local
// Para producción usa variables de entorno

// Detectar si estamos en desarrollo o producción
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// Credenciales para desarrollo
const DEV_URL = "https://flemnrcuwwbbuatqszwl.supabase.co";
const DEV_KEY = "sb_publishable_nPf8AsX3d6kzbCYwM6neRg_R2rihING";

// Credenciales para producción (las reemplazará GitHub Actions)
const PROD_URL = "https://yzachirxuxtiloeugrrl.supabase.co";
const PROD_KEY = "sb_publishable_k-PLRbDUSgLU-6ZRWlpyvw_fyt_IDpL";

// Elegir según el entorno
const SUPABASE_URL = isDevelopment ? DEV_URL : PROD_URL;
const SUPABASE_KEY = isDevelopment ? DEV_KEY : PROD_KEY;

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Exportar para usar en otros archivos
export { SUPABASE_URL, SUPABASE_KEY, supabaseClient };

console.log(`✅ Supabase configurado - Entorno: ${isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`📡 Conectado a: ${SUPABASE_URL}`);