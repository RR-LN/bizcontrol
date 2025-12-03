import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        // Check if user is ADMIN or MANAGER
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json(
                { error: "Acesso negado. Apenas Admin e Manager podem fazer upload de imagens." },
                { status: 403 }
            )
        }

        // Get form data
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: "Nenhum arquivo enviado" },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "Arquivo muito grande. Tamanho máximo: 5MB" },
                { status: 400 }
            )
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const dataURI = `data:${file.type};base64,${base64}`

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
            folder: 'bizcontrol360',
            resource_type: 'image',
            transformation: [
                { width: 1000, height: 1000, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        })

        return NextResponse.json({
            success: true,
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
            message: "Imagem enviada com sucesso",
        })
    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao fazer upload da imagem" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        // Check authentication
        const cookieStore = await cookies()
        const userSession = cookieStore.get('user_session')

        if (!userSession) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const user = JSON.parse(userSession.value)

        // Check if user is ADMIN or MANAGER
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return NextResponse.json(
                { error: "Acesso negado" },
                { status: 403 }
            )
        }

        const { publicId } = await request.json()

        if (!publicId) {
            return NextResponse.json(
                { error: "Public ID não fornecido" },
                { status: 400 }
            )
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId)

        return NextResponse.json({
            success: true,
            result,
            message: "Imagem removida com sucesso",
        })
    } catch (error: any) {
        console.error('Delete error:', error)
        return NextResponse.json(
            { error: error.message || "Erro ao remover imagem" },
            { status: 500 }
        )
    }
}
