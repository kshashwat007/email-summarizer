import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import ActionItemsSidebar from "./action-items/page";
import SummaryFeed from "./summary-feed/page";
import data from '../testdata.json'
import Sidebar from "@/components/Sidebar";

export default function Page() {
  return (
    <div className="flex h-screen pl-1/6">
      <SummaryFeed emails={data.summaryDetails} />
    </div>
  );
}
