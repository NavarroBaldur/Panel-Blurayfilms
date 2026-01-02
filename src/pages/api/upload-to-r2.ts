import type { NextApiRequest, NextApiResponse } from "next"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT as string,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY as string,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY as string,
    },
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const formData = await new Promise<FormData>((resolve, reject) => {
            const formidable = require("formidable")
            const form = formidable.default({ multiples: false })

            form.parse(req, (err: unknown, fields: unknown, files: unknown) => {
                if (err) reject(err)

                const data = new FormData()

                const f = files as Record<string, any>
                const uploadedFile = f.file?.[0] ?? f.file

                if (!uploadedFile) reject("No file")

                data.append(
                    "file",
                    uploadedFile.filepath
                        ? require("fs").readFileSync(uploadedFile.filepath)
                        : uploadedFile
                )

                data.append("path", fields.path as string)
                resolve(data)
            })
        })

        const file = formData.get("file") as Buffer
        const path = formData.get("path") as string

        await r2.send(
            new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_R2_BUCKET as string,
                Key: path, // ⚠️ AQUÍ VA main/archivo.jpg
                Body: file,
                ContentType: "image/jpeg",
            })
        )

        return res.status(200).json({ success: true })
    } catch (error) {
        console.error("R2 upload error:", error)
        return res.status(500).json({ error: "Upload failed" })
    }
}
