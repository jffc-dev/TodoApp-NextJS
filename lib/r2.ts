import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

function r2() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
    // Evita que el SDK agregue checksums a la URL firmada (R2 rechazaría el PUT).
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

// URL temporal para que el navegador suba el archivo directo a R2.
export function createPresignedPutUrl(key: string, contentType: string) {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
}

// Subida desde el servidor (usada al importar imágenes por URL).
export async function putObject(key: string, body: Uint8Array, contentType: string) {
  await r2().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
}
