import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { requireAuth } from "../middleware/auth.js";

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      cb(new Error("Use JPG, PNG, WEBP ou GIF"));
      return;
    }
    cb(null, true);
  },
});

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".bin";
}

async function saveOriginal(file: Express.Multer.File) {
  const filename = `${randomUUID()}${extFromMime(file.mimetype)}`;
  await fs.promises.writeFile(path.join(uploadDir, filename), file.buffer);
  return filename;
}

async function saveAsWebp(file: Express.Multer.File) {
  const filename = `${randomUUID()}.webp`;
  await sharp(file.buffer)
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 4 })
    .toFile(path.join(uploadDir, filename));
  return filename;
}

export const uploadRouter = Router();

async function persistUpload(file: Express.Multer.File) {
  const keepOriginal = file.mimetype === "image/gif";
  const filename = keepOriginal ? await saveOriginal(file) : await saveAsWebp(file);
  return `/uploads/${filename}`;
}

uploadRouter.post("/", requireAuth, (req, res) => {
  upload.array("file", 24)(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Falha no upload" });
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
