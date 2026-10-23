import type { Metadata } from "next";
import CampusLeadForm from "@/components/CampusLeadForm";

export const metadata: Metadata = {
  title: "Get a tutor for your class",
  robots: { index: false, follow: false },
};

export default function SmuLeadPage() {
  return <CampusLeadForm source="smu" campusLabel="SMU" />;
}
