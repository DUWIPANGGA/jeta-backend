const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding finance data (SalaryProjects, ProgressReports, Payments)...');

    // 1. Ambil all staffs
    let staffs = await prisma.staff.findMany({
        include: { user: true }
    });

    if (staffs.length === 0) {
        console.log('⚠️  Tidak ada staff ditemukan. Seeder dibatalkan.');
        return;
    }

    // Ambil all projects
    const projects = await prisma.project.findMany({
        include: {
            custom_order: {
                include: {
                    items: true
                }
            }
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

    // Hapus data finance lama untuk kebersihan
    await prisma.salaryPaymentDetail.deleteMany();
    await prisma.salaryPayment.deleteMany();
    await prisma.progressReport.deleteMany();
    await prisma.salaryProjects.deleteMany();
    console.log('🗑️  Data lama (SalaryPayment, ProgressReport, SalaryProjects) berhasil dibersihkan.');

    // 2. Seed SalaryProjects (Penyesuaian gaji staff per proyek)
    console.log('📌 Seeding SalaryProjects...');
    for (const staff of staffs) {
        // Set base salary staff (misal Rp 50.000)
        await prisma.staff.update({
            where: { id: staff.id },
            data: { salary: 50000 }
        });

        for (const project of projects) {
            await prisma.salaryProjects.create({
                data: {
                    staff_id: staff.id,
                    project_id: project.id,
                    adjustment_salary: 10000 // Total tarif per unit = 50.000 + 10.000 = 60.000
                }
            });
        }
    }
    console.log('✅ SalaryProjects seeded.');

    // Re-fetch staffs to populate salaryProjects and updated salary
    staffs = await prisma.staff.findMany({
        include: { user: true, salaryProjects: true }
    });

    // 3. Seed ProgressReports (Progres kerja disetujui dalam 4 minggu berbeda)
    console.log('📌 Seeding ProgressReports...');
    const now = new Date();
    
    // Fungsi pembantu untuk membuat tanggal
    function getPastDate(daysAgo) {
        const d = new Date(now);
        d.setDate(now.getDate() - daysAgo);
        return d;
    }

    // Kita buat 4 minggu:
    // Minggu 1: 22 hari lalu (Lunas)
    // Minggu 2: 15 hari lalu (Belum Dibayar)
    // Minggu 3: 8 hari lalu (Sebagian Dibayar)
    // Minggu 4: 2 hari lalu (Belum Dibayar)

    const reportsToCreate = [
        // === MINGGU 1 (LUNAS) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 0, qty: 10, approved: true, daysAgo: 22 },
        { staffIdx: 1, projectIdx: 0, stageIdx: 1, qty: 15, approved: true, daysAgo: 21 },
        { staffIdx: 2, projectIdx: 0, stageIdx: 2, qty: 10, approved: true, daysAgo: 20 },

        // === MINGGU 2 (BELUM DIBAYAR) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 1, qty: 12, approved: true, daysAgo: 15 },
        { staffIdx: 1, projectIdx: 0, stageIdx: 2, qty: 8, approved: true, daysAgo: 14 },

        // === MINGGU 3 (SEBAGIAN DIBAYAR) ===
        { staffIdx: 0, projectIdx: 0, stageIdx: 2, qty: 20, approved: true, daysAgo: 8 }, // Dibayar
        { staffIdx: 1, projectIdx: 0, stageIdx: 3, qty: 15, approved: true, daysAgo: 7 }, // Belum Dibayar

        // === MINGGU 4 (BELUM DIBAYAR) ===
        { staffIdx: 2, projectIdx: 0, stageIdx: 3, qty: 5, approved: true, daysAgo: 2 },
    ];

    const createdReports = [];

    for (const r of reportsToCreate) {
        const staff = staffs[r.staffIdx % staffs.length];
        const project = projects[r.projectIdx % projects.length];
        const stage = stages[r.stageIdx % stages.length];
        const item = project.custom_order?.items?.[0] || null;

        const report = await prisma.progressReport.create({
            data: {
                staff_id: staff.id,
                project_id: project.id,
                custom_order_item_id: item ? item.id : null,
                stage_id: stage.id,
                status: 'selesai',
                quantity: r.qty,
                catatan: `Mengerjakan tahap ${stage.stage_name}`,
                approval_status: r.approved,
                created_at: getPastDate(r.daysAgo),
                updated_at: getPastDate(r.daysAgo),
            }
        });
        createdReports.push({ ...report, staff, project, r });
    }
    console.log(`✅ ${createdReports.length} ProgressReports seeded.`);

    // 4. Seed SalaryPayment & Details (Untuk mensimulasikan status Lunas dan Sebagian Dibayar)
    console.log('📌 Seeding SalaryPayments...');

    // --- PEMBAYARAN MINGGU 1 (Lunas) ---
    // Semua report Minggu 1 dibayar penuh
    const week1Reports = createdReports.filter(cr => cr.r.daysAgo >= 19 && cr.r.daysAgo <= 23);
    
    // Kelompokkan per staff untuk dibayar
    const week1ByStaff = {};
    for (const report of week1Reports) {
        if (!week1ByStaff[report.staff_id]) {
            week1ByStaff[report.staff_id] = [];
        }
        week1ByStaff[report.staff_id].push(report);
    }

    for (const staffId in week1ByStaff) {
        const reports = week1ByStaff[staffId];
        let totalAmount = 0;
        const details = [];

        for (const report of reports) {
            const adjustment = report.staff.salaryProjects.find(sp => sp.project_id === report.project_id);
            const ratePerUnit = (report.staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
            const amount = report.quantity * ratePerUnit;
            totalAmount += amount;
            details.push({ reportId: report.id, amount });
        }

        const payment = await prisma.salaryPayment.create({
            data: {
                staff_id: parseInt(staffId),
                paid_by: financeUser.id,
                total_amount: totalAmount,
                notes: 'Gaji Minggu 1 (Lunas)',
                payment_date: getPastDate(20), // Dibayar pada minggu 1
                period_start: getPastDate(22),
                period_end: getPastDate(16),
            }
        });

        for (const detail of details) {
            await prisma.salaryPaymentDetail.create({
                data: {
                    salary_payment_id: payment.id,
                    progress_report_id: detail.reportId,
                    amount: detail.amount
                }
            });
        }
    }

    // --- PEMBAYARAN MINGGU 3 (Sebagian Dibayar) ---
    // Hanya membayar report milik Staff 0 (idx 0), report Staff 1 dibiarkan unpaid
    const week3Reports = createdReports.filter(cr => cr.r.daysAgo >= 6 && cr.r.daysAgo <= 9);
    const staff0Reports = week3Reports.filter(cr => cr.r.staffIdx === 0);

    if (staff0Reports.length > 0) {
        let totalAmount = 0;
        const details = [];

        for (const report of staff0Reports) {
            const adjustment = report.staff.salaryProjects.find(sp => sp.project_id === report.project_id);
            const ratePerUnit = (report.staff.salary ?? 0) + (adjustment?.adjustment_salary ?? 0);
            const amount = report.quantity * ratePerUnit;
            totalAmount += amount;
            details.push({ reportId: report.id, amount });
        }

        const payment = await prisma.salaryPayment.create({
            data: {
                staff_id: staff0Reports[0].staff_id,
                paid_by: financeUser.id,
                total_amount: totalAmount,
                notes: 'Gaji Minggu 3 (Sebagian Dibayar - Staff 0)',
                payment_date: getPastDate(6), // Dibayar pada minggu 3
                period_start: getPastDate(8),
                period_end: getPastDate(2),
            }
        });

        for (const detail of details) {
            await prisma.salaryPaymentDetail.create({
                data: {
                    salary_payment_id: payment.id,
                    progress_report_id: detail.reportId,
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
    await prisma.progressReport.deleteMany({});
    await prisma.salaryProjects.deleteMany({});
    console.log('✅ Rollback completed');
}

module.exports = { main, down };

if (require.main === module) {
    main()
        .catch(e => console.error('❌ Seeding failed:', e))
        .finally(() => prisma.$disconnect());
}
