import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
        }

        const user = JSON.parse(userSession.value)

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Apenas admin pode acessar configurações" }, { status: 403 })
        }

        // Fetch all settings
        const settings = await prisma.settings.findMany()

        // Convert to key-value object
        const settingsObj: Record<string, string> = {}
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value
        })

        return NextResponse.json({
            success: true,
            data: settingsObj
        })
    } catch (error: any) {
        console.error('Settings fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
        }

        const user = JSON.parse(userSession.value)

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Apenas admin pode alterar configurações" }, { status: 403 })
        }

        const body = await request.json()
        const { key, value, description } = body

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Key e value são obrigatórios" }, { status: 400 })
        }

        // Upsert setting
        const setting = await prisma.settings.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        })

        return NextResponse.json({
            success: true,
            data: setting
        })
    } catch (error: any) {
        console.error('Settings save error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
