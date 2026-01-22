import { redirect } from "next/navigation";

export default function Home() {
  // In R1, redirect to demo org - will be replaced with auth in production
  redirect("/orgs/demo");
}
