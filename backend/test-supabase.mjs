/**
 * Registra aramizeth@gmail.com como administrador en Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)="?([^"#\r\n]*)"?/);
  if (match) env[match[1]] = match[2].trim();
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const EMAIL = 'aramizeth@gmail.com';
const FULL_NAME = 'Angel Ramiz';
const ROLE = 'admin';

console.log(`\n🔧 Registrando ${EMAIL} como ${ROLE}...\n`);

// 1. Upsert en allowed_emails
const { error: e1 } = await supabase
  .from('allowed_emails')
  .upsert({ email: EMAIL, role: ROLE, fullName: FULL_NAME }, { onConflict: 'email' });

if (e1) {
  console.error('❌ allowed_emails:', e1.message);
  process.exit(1);
}
console.log(`✅ allowed_emails → ${EMAIL} registrado como ${ROLE}`);

// 2. Verificar si ya existe un usuario en auth.users con ese email
const { data: users, error: e2 } = await supabase.auth.admin.listUsers();
if (e2) {
  console.log('⚠️  No se pudo listar usuarios auth:', e2.message);
} else {
  const existing = users.users.find(u => u.email === EMAIL);
  
  if (existing) {
    console.log(`✅ Usuario auth encontrado: ${existing.id}`);
    
    // Upsert profile con rol admin
    const { error: e3 } = await supabase
      .from('profiles')
      .upsert({
        id: existing.id,
        fullName: FULL_NAME,
        role: ROLE,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(FULL_NAME)}`,
        pointsEarned: 0,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'id' });

    if (e3) {
      console.error('❌ profiles:', e3.message);
    } else {
      console.log(`✅ profiles → rol actualizado a ${ROLE}`);
    }

    // También actualizar user_metadata en auth
    const { error: e4 } = await supabase.auth.admin.updateUserById(existing.id, {
      user_metadata: { role: ROLE, full_name: FULL_NAME }
    });
    if (e4) {
      console.log('⚠️  No se pudo actualizar metadata de auth:', e4.message);
    } else {
      console.log(`✅ auth.users → user_metadata.role = ${ROLE}`);
    }

  } else {
    console.log(`ℹ️  ${EMAIL} aún no tiene cuenta en auth.users`);
    console.log(`   (Se registrará como admin automáticamente cuando inicie sesión)`);
  }
}

console.log('\n═══════════════════════════════════════════');
console.log(` ✅ ${EMAIL} configurado como ADMIN`);
console.log('═══════════════════════════════════════════\n');
