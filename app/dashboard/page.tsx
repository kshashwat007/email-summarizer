import ButtonAccount from "@/components/ButtonAccount";
import SummaryFeed from "../summary-feed/page";
export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  return (
    <div className="flex h-screen pl-1/6">
      <SummaryFeed />
    </div>
  );
}
