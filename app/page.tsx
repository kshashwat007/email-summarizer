"use client"
import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import ActionItemsSidebar from "./action-items/page";
import SummaryFeed from "./summary-feed/page";
import data from '../testdata.json'
import Sidebar from "@/components/Sidebar";
import {BrowserRouter as Router} from 'react-router-dom';

export default function Page() {
  return (
    <div className="flex h-screen pl-1/6">
      <SummaryFeed />
    </div>
  );
}
