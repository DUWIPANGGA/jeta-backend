import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
    console.log('🚀 Memulai seeding massal (Stand-alone mode)...');

    const seedersDir = path.join(__dirname, 'seeders');
    
    // Urutan seeder berdasarkan dependensi foreign key
    const seeders = [
        'roles.js',
        'pages.js',
        'accesses.js',
        'users.js',
        'staffs.js',
        'categories.js',
        'products.js',
        'custom-variants.js',
        'product-variants.js',
        'payment_methods.js',
        'stages.js',
        'orders.js',
        'custom-orders.js',
        'projects.js',
        'finance-data.js',
        'logistics.js',
        'portofolio.js',
        'consultation.js'
    ];

    for (const file of seeders) {
        const seederPath = path.join(seedersDir, file);
        
        if (!fs.existsSync(seederPath)) {
            console.warn(`⚠️  Peringatan: File ${file} tidak ditemukan, melewati...`);
            continue;
        }

        console.log(`\n-----------------------------------------`);
        console.log(`📦 Menjalankan: node prisma/seeders/${file}`);
        
        try {
            // Jalankan sebagai proses terpisah agar tidak bentrok
            const output = execSync(`node "${seederPath}"`, { 
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'development' }
            });
        } catch (error) {
            console.error(`❌ Gagal menjalankan ${file}. Melanjutkan ke seeder berikutnya...`);
        }
    }

    console.log(`\n=========================================`);
    console.log('✨ Seluruh proses seeding selesai!');
}

main().catch((e) => {
    console.error('❌ Master seeding gagal:', e);
    process.exit(1);
});