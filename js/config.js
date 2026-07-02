// 🔑 CREDENCIALES REALES
const SUPABASE_URL = "https://yzachirxuxtiloeugrrl.supabase.co";
const SUPABASE_KEY = "sb_publishable_k-PLRbDUSgLU-6ZRWlpyvw_fyt_IDpL";

// Inicializar el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Exportar para usar en otros archivos
export { SUPABASE_URL, SUPABASE_KEY, supabaseClient };

console.log(" Supabase configurado correctamente");