import type { NextApiRequest, NextApiResponse } from "next"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
    },
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    console.log("✅ R2 API HIT:", {
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        bucket: process.env.CLOUDFLARE_R2_BUCKET,
    })

    try {
        const busboy = require("busboy")
        const bb = busboy({ headers: req.headers })

        let buffer: Buffer | null = null
        let path = ""
        let contentType = ""

        bb.on("file", (_: any, file: any, info: any) => {
            contentType = info.mimeType
            const chunks: Buffer[] = []
            file.on("data", (data: Buffer) => chunks.push(data))
            file.on("end", () => {
                buffer = Buffer.concat(chunks)
            })
        })

        bb.on("field", (name: string, val: string) => {
            if (name === "path") path = val
        })

        bb.on("finish", async () => {
            if (!buffer || !path) {
                return res.status(400).json({ error: "Datos incompletos" })
            }

            await r2.send(
                new PutObjectCommand({
                    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
                    Key: path, // main/banner-x.jpg
                    Body: buffer,
                    ContentType: contentType,
                })
            )

            return res.status(200).json({ success: true })
        })

        req.pipe(bb)
    } catch (error) {
        console.error("❌ Error R2:", error)
        return res.status(500).json({ error: "Error subiendo a R2" })
    }
}
