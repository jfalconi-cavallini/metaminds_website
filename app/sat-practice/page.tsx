import { redirect } from "next/navigation";
import { PracticeEntry } from "@/components/sat/PracticeEntry";
import { allowsPracticeDevBypass } from "@/lib/sat/access";
import { getSatPracticeViewer } from "@/lib/sat/viewer";

export default async function SatPracticePage() {
  const decision = await getSatPracticeViewer();
  if (decision.type === "redirect") redirect(decision.location);
  const mockFallback = allowsPracticeDevBypass(process.env.NODE_ENV, process.env.SAT_PRACTICE_DEV_BYPASS);
  return <PracticeEntry userId={decision.userId} mockFallback={mockFallback} />;
}
