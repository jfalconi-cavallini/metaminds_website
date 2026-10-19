import { redirect } from "next/navigation";
import { PracticeEntry } from "@/components/sat/PracticeEntry";
import { getSatPracticeViewer } from "@/lib/sat/viewer";

export default async function SatPracticePage() {
  const decision = await getSatPracticeViewer();
  if (decision.type === "redirect") redirect(decision.location);
  return <PracticeEntry userId={decision.userId} />;
}
