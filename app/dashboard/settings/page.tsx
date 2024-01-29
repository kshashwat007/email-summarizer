/* eslint-disable react-hooks/rules-of-hooks */
// @ts-nocheck
"use client"
import ButtonAccount from '@/components/ButtonAccount';
import { authOptions } from '@/libs/next-auth';
import { getServerSession } from 'next-auth';
import email from 'next-auth/providers/email';
import React, { useState } from 'react'
import { useSession, signOut } from "next-auth/react";
import { Bounce, ToastContainer, toast } from 'react-toastify';

const page = () => {

  const [openTab, setOpenTab] = useState(1);
  const [openaiKey, setOpenaiKey] = useState("")
  const [summaryTime, setSummaryTime] = useState("")
  const [summaryLength, setSummaryLength] = useState("")
  const { data: session, status } = useSession();

  const updateUser = () => {
    // const session = await getServerSession(authOptions);
    let data = {}
    if (openaiKey != "") {
      data["openaiKey"]  = openaiKey
    }
    
    if (summaryTime != "") {
      data["summaryTime"]  = summaryTime
    }
    
    if (summaryLength != "") {
      data["summaryLength"]  = summaryLength
    }
    console.log("Data",data)
    console.log("ID",session.user.id)
    fetch(`http://localhost:3000/api/user/updateUser?id=${session.user.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        toast.success('😊 You settings are saved!', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Bounce,
          });
        return response.json();
      })
      .then(data => {
        console.log("User Updated")
        
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  return (
    
    <div className='container m-8'>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className='p-4'>
        <ButtonAccount />
      </div>
      
      <h1 className='text-4xl font-bold mb-8 p-4'>Settings</h1>
      <div role="tablist" className="tabs tabs-lifted">
        <a role="tab" className={`tab text-xl ${(openTab === 1 ? "tab-active" : "")}`} onClick={() => setOpenTab(1)}>User Details</a>
        <a role="tab" className={`tab text-xl ${(openTab === 2 ? "tab-active" : "")}`} onClick={() => setOpenTab(2)}>Summary Settings</a>
        <a role="tab" className={`tab text-xl ${(openTab === 3 ? "tab-active" : "")}`} onClick={() => setOpenTab(3)}>Notifications</a>
      </div>

      <div className={`${(openTab === 1 ? "block" : "hidden")}`}>
        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">Name</span>
          </div>
          <input type="text" placeholder="Krishanu" className="input input-bordered w-full max-w-xs" disabled/>
        </label>

        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">Email</span>
          </div>
          <input type="text" placeholder="test@gmail.com" className="input input-bordered w-full max-w-xs" disabled/>
        </label>

        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">OpenAI Key(Optional)</span>
          </div>
          <input type="text" placeholder="a**************" className="input input-bordered w-full max-w-xs" id="openaiKey" onChange={(e) => {
            setOpenaiKey(e.target.value)
          }}/>
        </label>
      </div>

      <div className={`${(openTab === 2 ? "block" : "hidden")}`}>
        <div className="label pl-4 mt-4">
          <span className="label-text">Summary Time</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" onChange={(e) => {
          setSummaryTime(e.target.value)
        }} disabled>
          <option disabled selected>Select Time (Coming Soon)</option>
          <option>9am-12pm</option>
          <option>1pm-4pm</option>
          <option>4pm-8pm</option>
        </select>
        <div className="label pl-4 mt-4">
          <span className="label-text">Summary Length</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" onChange={(e) => {
          setSummaryLength(e.target.value)
        }}>
          <option disabled selected>Length Preference</option>
          <option>Very Short</option>
          <option>Short</option>
          <option>Medium</option>
          <option>Detailed</option>
        </select>
        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">Label Preference</span>
          </div>
          <input type="text" placeholder="Select Labels (Coming Soon)" className="input input-bordered w-full max-w-xs" disabled/>
        </label>
        
      </div>

      <div className={`${(openTab === 3 ? "block" : "hidden")}`}>
        <div className="label pl-4 mt-4">
          <span className="label-text">Notification Preference</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" disabled>
          <option disabled selected>Notification Preference (Coming Soon)</option>
          <option>On</option>
          <option>Off</option>
        </select>
      </div>
      

      <div className="additional-actions mb-4 mt-4 p-4">
        <button className="btn btn-outline mr-2 w-[148px]" onClick={updateUser}>Save</button>
        
          {/* ... */}
      </div>
    </div>
  )
}

export default page