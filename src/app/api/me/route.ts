import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        return NextResponse.json({
            success: true,
            user,
        })
    } catch (error) {
        return NextResponse.json(
            { error: "Erro ao verificar autenticação" },
            { status: 500 }
        )
    }
}
