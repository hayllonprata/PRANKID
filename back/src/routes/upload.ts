import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import convertHeic from "heic-convert";
import { requireAuth } from "../middleware/auth.js";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const heicMimes = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const heicBrands = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);

function hasHeicExtension(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".heic") || lower.endsWith(".heif");
}

function looksLikeHeic(buffer: Buffer) {
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  return heicBrands.has(buffer.toString("ascii", 8, 12).toLowerCase());
}

function isHeicUpload(file: Express.Multer.File) {
  const mime = (file.mimetype || "").toLowerCase();
  return heicMimes.has(mime) || hasHeicExtension(file.originalname || "") || looksLikeHeic(file.buffer);
}

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_FILES = 40;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || "").toLowerCase();
    const octetHeic =
      (mime === "application/octet-stream" || mime === "application/heic" || !mime) &&
      hasHeicExtension(file.originalname || "");
    if (!allowed.has(mime) && !octetHeic) {
      cb(new Error("Use JPG, PNG, WEBP, GIF ou HEIC"));
      return;
    }
    cb(null, true);
  },
});

function uploadErrorMessage(err: unknown) {
  if (!err || typeof err !== "object") return "Falha no upload";
  const code = "code" in err ? String(err.code) : "";
  const message = "message" in err ? String(err.message) : "";
  if (code === "LIMIT_FILE_SIZE") return "A imagem passou de 40 MB. Envie um arquivo menor.";
  if (code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE") {
    return "Não foi possível receber todas as imagens. Envie de novo; arquivos muito grandes são recusados.";
  }
  return message || "Falha no upload";
}

async function rasterBuffer(file: Express.Multer.File) {
  if (!isHeicUpload(file)) return file.buffer;
  const jpeg = await convertHeic({ buffer: file.buffer, format: "JPEG", quality: 0.8 });
  return Buffer.from(jpeg);
}

async function saveAsWebp(file: Express.Multer.File) {
  const filename = `${randomUUID()}.webp`;
  const buffer = await rasterBuffer(file);
  const meta = await sharp(buffer, { animated: true, failOn: "none" }).metadata();
  const animated = (meta.pages ?? 1) > 1;
  let pipeline = sharp(buffer, { animated, failOn: "none" });
  if (!animated) pipeline = pipeline.rotate();
  await pipeline
    .resize({
      width: 1400,
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 4 })
    .toFile(path.join(uploadDir, filename));
  return filename;
}

export const uploadRouter = Router();

async function persistUpload(file: Express.Multer.File) {
  const filename = await saveAsWebp(file);
  return `/uploads/${filename}`;
}

uploadRouter.post("/", requireAuth, (req, res) => {
  upload.array("file", MAX_FILES)(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: uploadErrorMessage(err) });
      return;
    }
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      res.status(400).json({ error: "Arquivo obrigatório" });
      return;
    }

    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await persistUpload(file));
      }
      res.json({ url: urls[0], urls });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Não foi possível converter a imagem para WEBP" });
    }
  });
});

export { uploadDir };
