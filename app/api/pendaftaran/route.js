import { db } from "@/lib/db";

export async function POST(req) {
  const { nama, email, nomor } = await req.json();

  await db.query(
    "INSERT INTO pendaftaran (nama, email, nomor) VALUES (?, ?, ?)",
    [nama, email, nomor]
  );

  return Response.json({ success: true });
}
