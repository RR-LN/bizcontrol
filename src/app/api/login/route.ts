import { NextResponse } from "next/server"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email e senha são obrigatórios" },
                { status: 400 }
            )
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        // Check if account is active
        if (!user.isActive) {
            return NextResponse.json(
                { error: "Conta desativada. Contacte o administrador." },
                { status: 403 }
            )
        }

        // Check if account is locked
        if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
            return NextResponse.json(
                { error: "Conta bloqueada temporariamente. Tente novamente mais tarde." },
                { status: 403 }
            )
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password)

        if (!isPasswordValid) {
            // Increment failed attempts
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: user.failedLoginAttempts + 1,
                    isLocked: user.failedLoginAttempts + 1 >= 5,
                    lockedUntil: user.failedLoginAttempts + 1 >= 5
                        ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
                        : null,
                },
            })

            // Log failed login
            await prisma.userActivity.create({
                data: {
                    userId: user.id,
                    actionType: "FAILED_LOGIN",
                    details: "Invalid password",
                },
            })

            return NextResponse.json(
                { error: "Credenciais inválidas" },
                { status: 401 }
            )
        }

        // Reset failed attempts and update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                isLocked: false,
                lockedUntil: null,
                lastLogin: new Date(),
            },
        })

        // Log successful login
        await prisma.userActivity.create({
            data: {
                userId: user.id,
                actionType: "LOGIN",
                details: "Successful login",
            },
        })

        // Create session (simple cookie-based for now)
        const cookieStore = await cookies()
        cookieStore.set('user_session', JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email,
            },
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: "Erro ao fazer login. Tente novamente." },
            { status: 500 }
        )
    }
}
