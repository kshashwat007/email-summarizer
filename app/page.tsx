import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import ActionItemsSidebar from "./action-items/page";
import SummaryFeed from "./summary-feed/page";
import data from '../testdata.json'

export default function Page() {
  return (
    <>
      <SummaryFeed emails={data.summaryDetails} />
    </>
  );
}
