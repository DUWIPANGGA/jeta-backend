const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding finance data (SalaryProjects, WorkLogs, Payments)...');

    // 1. Ambil all staffs
    let staffs = await prisma.staff.findMany({
        include: { user: true }
    });

    if (staffs.length === 0) {
        console.log('⚠️  Tidak ada staff ditemukan. Seeder dibatalkan.');
        return;
    }

    // Ambil all projects (beserta custom_order langsung)
    const projects = await prisma.project.findMany({
        include: {
            custom_order: true,
        }
    });

    if (projects.length === 0) {
        console.log('⚠️  Tidak ada project ditemukan. Seeder dibatalkan.');
        return;
    }

    // Ambil all stages
    const stages = await prisma.stage.findMany();
    if (stages.length === 0) {
        console.log('⚠️  Tidak ada stage ditemukan. Seeder dibatalkan.');
        return;
    }

    // Ambil user finance (sebagai paid_by)
    const financeUser = await prisma.user.findFirst({
        where: {
            role: { name: 'finance' }
        }
    }) || await prisma.user.findFirst({
        where: {
            role: { name: 'admin' }
        }
    });

    if (!financeUser) {
        console.log('⚠️  Tidak ada user finance/admin sebagai pembayar. Seeder dibatalkan.');
        return;
    }

    // Hapus data finance lama
    await prisma.salaryPaymentDetail.deleteMany();
    await prisma.salaryPayment.deleteMany();
    await prisma.workLog.deleteMany();
    await prisma.salaryProjects.deleteMany();
    console.log('🗑️  Data lama (SalaryPayment, WorkLog, SalaryProjects) berhasil dibersihkan.');

    // 2. Seed SalaryProjects (Penyesuaian gaji staff per proyek)
    console.log('📌 Seeding SalaryProjects...');
    for (const staff of staffs) {
        await prisma.staff.update({
            where: { id: staff.id },
            data: { salary: 50000 }
        });

        for (const project of projects) {
            await prisma.salaryProjects.create({
                data: {
                    staff_id: staff.id,
                    project_id: project.id,
                    adjustment_salary: 10000
                }
            });
        }
    }
    console.log('✅ SalaryProjects seeded.');

    // Re-fetch staffs to populate salaryProjects
    staffs = await prisma.staff.findMany({
        include: { user: true, salaryProjects: true }
    });

    // 3. Seed WorkLogs (log kerja staff dalam 4 minggu berbeda)
    console.log('📌 Seeding WorkLogs...');
    const now = new Date();

    function getPastDate(daysAgo) {
        const d = new Date(now);
        d.setDate(now.getDate() - daysAgo);
        return d;
    }

    // 4 minggu:
    // Minggu 1: 22 hari lalu (Lunas)
    // Minggu 2: 15 hari lalu (Belum Dibayar)
    // Minggu 3: 8 hari lalu (Sebagian Dibayar)
    // Minggu 4: 2 hari lalu (Belum Dibayar)

    const workLogsToCreate = [
        // === MINGGU 1 (LUNAS) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 0, qty: 10, daysAgo: 22 },
        { staffIdx: 1, projectIdx: 0, stageIdx: 1, qty: 15, daysAgo: 21 },
        { staffIdx: 2, projectIdx: 0, stageIdx: 2, qty: 10, daysAgo: 20 },

        // === MINGGU 2 (BELUM DIBAYAR) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 1, qty: 12, daysAgo: 15 },
        { staffIdx: 1, projectIdx: 0, stageIdx: 2, qty: 8, daysAgo: 14 },

        // === MINGGU 3 (SEBAGIAN DIBAYAR) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 2, qty: 20, daysAgo: 8 },
        { staffIdx: 1, projectIdx: 0, stageIdx: 3, qty: 15, daysAgo: 7 },

        // === MINGGU 4 (BELUM DIBAYAR) ===
        { staffIdx: 2, projectIdx: 0, stageIdx: 3, qty: 5, daysAgo: 2 },
    ];

    const createdWorkLogs = [];

    for (const w of workLogsToCreate) {
        const staff = staffs[w.staffIdx % staffs.length];
        const project = projects[w.projectIdx % projects.length];
        const stage = stages[w.stageIdx % stages.length];

        const workLog = await prisma.workLog.create({
            data: {
                user_id: staff.user_id,
                stage_id: stage.id,
                order_type: 'custom_order',
                custom_order_id: project.custom_order?.id || null,
                quantity: w.qty,
                created_at: getPastDate(w.daysAgo),
                updated_at: getPastDate(w.daysAgo),
            }
        });
        createdWorkLogs.push({ ...workLog, staff, project, stage, w });
    }
    console.log(`✅ ${createdWorkLogs.length} WorkLogs seeded.`);

    // 4. Seed SalaryPayment & Details (Untuk WorkLogs)
    console.log('📌 Seeding SalaryPayments...');

    // --- PEMBAYARAN MINGGU 1 (Lunas) ---
    const week1Logs = createdWorkLogs.filter(wl => wl.w.daysAgo >= 19 && wl.w.daysAgo <= 23);

    const week1ByStaff = {};
    for (const wl of week1Logs) {
        if (!week1ByStaff[wl.staff.id]) {
            week1ByStaff[wl.staff.id] = [];
        }
        week1ByStaff[wl.staff.id].push(wl);
    }

    for (const staffId in week1ByStaff) {
        const logs = week1ByStaff[staffId];
        let totalAmount = 0;
        const details = [];

        for (const wl of logs) {
            const projectId = wl.project.id;
            const adjustment = staffs.find(s => s.id === parseInt(staffId))?.salaryProjects.find(sp => sp.project_id === projectId);
            const ratePerUnit = (wl.staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
            const amount = wl.quantity * ratePerUnit;
            totalAmount += amount;
            details.push({ workLogId: wl.id, amount });
        }

        const payment = await prisma.salaryPayment.create({
            data: {
                staff_id: parseInt(staffId),
                paid_by: financeUser.id,
                total_amount: totalAmount,
                period_type: 'weekly',
                notes: 'Gaji Minggu 1 (Lunas)',
                payment_date: getPastDate(20),
                period_start: getPastDate(22),
                period_end: getPastDate(16),
            }
        });

        for (const detail of details) {
            await prisma.salaryPaymentDetail.create({
                data: {
                    salary_payment_id: payment.id,
                    work_log_id: detail.workLogId,
                    amount: detail.amount
                }
            });
        }
    }

    // --- PEMBAYARAN MINGGU 3 (Sebagian Dibayar) ---
    // Hanya membayar WorkLog Staff 0 (idx 0), WorkLog Staff 1 dibiarkan unpaid
    const week3Logs = createdWorkLogs.filter(wl => wl.w.daysAgo >= 6 && wl.w.daysAgo <= 9);
    const staff0Logs = week3Logs.filter(wl => wl.w.staffIdx === 0);

    if (staff0Logs.length > 0) {
        let totalAmount = 0;
        const details = [];

        for (const wl of staff0Logs) {
            const projectId = wl.project.id;
            const adjustment = staffs.find(s => s.id === wl.staff.id)?.salaryProjects.find(sp => sp.project_id === projectId);
            const ratePerUnit = (wl.staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
            const amount = wl.quantity * ratePerUnit;
            totalAmount += amount;
            details.push({ workLogId: wl.id, amount });
        }

        const payment = await prisma.salaryPayment.create({
            data: {
                staff_id: staff0Logs[0].staff.id,
                paid_by: financeUser.id,
                total_amount: totalAmount,
                period_type: 'weekly',
                notes: 'Gaji Minggu 3 (Sebagian Dibayar - Staff 0)',
                payment_date: getPastDate(6),
                period_start: getPastDate(8),
                period_end: getPastDate(2),
            }
        });

        for (const detail of details) {
            await prisma.salaryPaymentDetail.create({
                data: {
                    salary_payment_id: payment.id,
                    work_log_id: detail.workLogId,
                    amount: detail.amount
                }
            });
        }
    }

    console.log('✅ SalaryPayments & Details seeded.');
    console.log('✨ Finance seeding completed successfully!');
}

async function down() {
    console.log('\n🗑️ Rolling back finance data...');
    await prisma.salaryPaymentDetail.deleteMany({});
    await prisma.salaryPayment.deleteMany({});
    await prisma.workLog.deleteMany({});
    await prisma.salaryProjects.deleteMany({});
    console.log('✅ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Seeding failed:', e))
        .finally(() => prisma.$disconnect());
}
