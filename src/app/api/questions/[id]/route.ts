import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { AdminQuestion } from "@/types/admin";

const DATA_PATH = join(process.cwd(), "src", "data", "questions.json");

async function readQuestions(): Promise<AdminQuestion[]> {
  try {
    const data = await readFile(DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const questions = await readQuestions();
  const filtered = questions.filter((q) => q.id !== id);

  if (filtered.length === questions.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await writeFile(DATA_PATH, JSON.stringify(filtered, null, 2));
  return new Response(null, { status: 204 });
}
