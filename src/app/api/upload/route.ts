import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { IncomingForm } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req as any, async (err, fields, files) => {
      if (err) {
        resolve(
          NextResponse.json({ error: "Upload failed" }, { status: 500 })
        );
        return;
      }

      const file = Array.isArray(files.file)
        ? files.file[0]
        : files.file;

      if (!file || !file.filepath) {
        resolve(
          NextResponse.json({ error: "No file provided" }, { status: 400 })
        );
        return;
      }

      const buffer = fs.readFileSync(file.filepath);
      const data = await pdf(buffer);

      resolve(
        NextResponse.json({
          text: data.text,
        })
      );
    });
  });
}
