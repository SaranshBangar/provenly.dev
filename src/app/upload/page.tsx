import { redirect } from "next/navigation";

// Bulk issuing now lives on the unified /issue page.
export default function UploadPage() {
  redirect("/issue");
}
