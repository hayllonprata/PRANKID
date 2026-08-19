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

uploadRouter.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message || "Falha no upload" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Arquivo obrigatório" });
      return;
    }

    try {
      const keepOriginal = req.file.mimetype === "image/gif";
      const filename = keepOriginal ? await saveOriginal(req.file) : await saveAsWebp(req.file);
      res.json({ url: `/uploads/${filename}` });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Não foi possível converter a imagem para WEBP" });
    }
  });
});

export { uploadDir };
