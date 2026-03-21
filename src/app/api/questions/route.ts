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

async function saveQuestions(questions: AdminQuestion[]) {
  await writeFile(DATA_PATH, JSON.stringify(questions, null, 2));
}

export async function GET() {
  const questions = await readQuestions();
  return Response.json(questions);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { topicId, year, season, paperNumber, variant, number, marks } = body;
  if (!topicId || !year || !season || !paperNumber || !variant || !number || !marks) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const questions = await readQuestions();
  const newQuestion: AdminQuestion = {
    id: `admin-${Date.now()}`,
    number: Number(number),
    marks: Number(marks),
    text: body.text ?? "",
    imageUrl: body.imageUrl ?? "",
    markScheme: body.markScheme ?? "",
    topicId,
    year: Number(year),
    season,
    paperNumber: Number(paperNumber),
    variant: Number(variant),
    addedAt: new Date().toISOString(),
  };

  questions.push(newQuestion);
  await saveQuestions(questions);

  return Response.json(newQuestion, { status: 201 });
}
