import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

export const runtime = "nodejs" // ⬅️ CLAVE

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
    },
})

export async function POST(req: Request) {
    console.log("🧪 R2 ENV CHECK:", {
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        bucket: process.env.CLOUDFLARE_R2_BUCKET,
    })

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File | null
        const path = formData.get("path") as string | null // main/archivo.jpg

        if (!file || !path) {
            return NextResponse.json(
                { error: "Archivo o path faltante" },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        await r2.send(
            new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET!, // media
                Key: path, // ✅ main/archivo.jpg
                Body: buffer,
                ContentType: file.type,
            })
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("❌ Error subiendo a R2:", error)
        return NextResponse.json(
            { error: "Error subiendo archivo a R2" },
            { status: 500 }
        )
    }
}
