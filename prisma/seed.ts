import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const adminPassword = await hash('admin123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@bizcontrol.com' },
        update: {},
        create: {
            email: 'admin@bizcontrol.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'Sistema',
            role: 'ADMIN',
            isActive: true,
        },
    })
    console.log('✅ Admin user created:', admin.email)

    // Create manager user
    const managerPassword = await hash('manager123', 12)
    const manager = await prisma.user.upsert({
        where: { email: 'manager@bizcontrol.com' },
        update: {},
        create: {
            email: 'manager@bizcontrol.com',
            password: managerPassword,
            firstName: 'João',
            lastName: 'Silva',
            role: 'MANAGER',
            isActive: true,
        },
    })
    console.log('✅ Manager user created:', manager.email)

    // Create operator user
    const operatorPassword = await hash('operator123', 12)
    const operator = await prisma.user.upsert({
        where: { email: 'operator@bizcontrol.com' },
        update: {},
        create: {
            email: 'operator@bizcontrol.com',
            password: operatorPassword,
            firstName: 'Maria',
            lastName: 'Santos',
            role: 'OPERATOR',
            isActive: true,
        },
    })
    console.log('✅ Operator user created:', operator.email)

    // Create sample categories
    const electronics = await prisma.category.upsert({
        where: { name: 'Eletrônicos' },
        update: {},
        create: {
            name: 'Eletrônicos',
            description: 'Produtos eletrônicos',
        },
    })

    const food = await prisma.category.upsert({
        where: { name: 'Alimentos' },
        update: {},
        create: {
            name: 'Alimentos',
            description: 'Produtos alimentícios',
        },
    })

    console.log('✅ Categories created')

    // Create sample warehouse
    const warehouse = await prisma.warehouse.upsert({
        where: { code: 'MAIN' },
        update: {},
        create: {
            name: 'Armazém Principal',
            code: 'MAIN',
            address: 'Luanda, Angola',
            isActive: true,
        },
    })
    console.log('✅ Warehouse created:', warehouse.name)

    // Create sample supplier
    const supplier = await prisma.supplier.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Fornecedor Exemplo',
            email: 'fornecedor@example.com',
            phone: '+244 900000000',
            isActive: true,
        },
    })
    console.log('✅ Supplier created:', supplier.name)

    console.log('🎉 Seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
