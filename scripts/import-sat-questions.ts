import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { mapImportDocument, mergeImportFiles, parseImportArgs, summarizeImport } from "../lib/sat/importRows.ts";

const PAGE_SIZE = 200;

async function main(): Promise<void> {
  const { dryRun, files } = parseImportArgs(process.argv.slice(2));
  const mapped = files.map((fileName) => {
    const parsed: unknown = JSON.parse(readFileSync(fileName, "utf8"));
    return mapImportDocument(parsed, fileName);
  });
  const { rows, warnings } = mergeImportFiles(mapped);

  process.stdout.write(`${summarizeImport(rows)}\n`);
  if (warnings.length > 0) {
    process.stdout.write(`warnings ${warnings.length}\n`);
    for (const warning of warnings.slice(0, 20)) process.stdout.write(`  ${warning}\n`);
  }
  if (dryRun) return;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (let index = 0; index < rows.length; index += PAGE_SIZE) {
    const chunk = rows.slice(index, index + PAGE_SIZE);
    const { error } = await supabase.from("sat_questions").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
  process.stdout.write(`upserted ${rows.length}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Import failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
