import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// アップロードディレクトリを作成（Netlify対応）
const isNetlify = process.env.NETLIFY === 'true';
const uploadDir = isNetlify ? '/tmp/uploads' : path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `myosoku-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // 画像ファイルのみ許可
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('画像ファイル（JPEG、PNG、GIF、PDF、WebP）のみアップロード可能です。'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: fileFilter
});

// ファイル提供エンドポイント
export const serveUpload = (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "ファイルが見つかりません" });
  }

  res.sendFile(filePath);
};