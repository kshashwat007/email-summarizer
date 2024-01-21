"use client"
import ButtonAccount from '@/components/ButtonAccount';
import React, { useState } from 'react'

const page = () => {

  const [openTab, setOpenTab] = useState(1);

  return (
    <div className='container m-8'>
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
          <input type="text" placeholder="a**************" className="input input-bordered w-full max-w-xs" />
        </label>
      </div>

      <div className={`${(openTab === 2 ? "block" : "hidden")}`}>
        <div className="label pl-4 mt-4">
          <span className="label-text">Summary Time</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4">
          <option disabled selected>Select time</option>
          <option>9am-12pm</option>
          <option>1pm-4pm</option>
          <option>4pm-8pm</option>
        </select>
        <div className="label pl-4 mt-4">
          <span className="label-text">Email Preference</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" disabled>
          <option disabled selected>Select Email Preference</option>
          <option>On</option>
          <option>Off</option>
        </select>
        <div className="label pl-4 mt-4">
          <span className="label-text">Prioritization</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" disabled>
          <option disabled selected>Select Email Preference</option>
          <option>On</option>
          <option>Off</option>
        </select>
        
      </div>

      <div className={`${(openTab === 3 ? "block" : "hidden")}`}>
        <div className="label pl-4 mt-4">
          <span className="label-text">Notification Preference</span>
        </div>
        <select className="select select-bordered w-full max-w-xs m-4" disabled>
          <option disabled selected>Select Email Preference</option>
          <option>On</option>
          <option>Off</option>
        </select>
      </div>
      

      <div className="additional-actions mb-4 mt-4 p-4">
        <button className="btn btn-outline mr-2 w-[148px]">Save</button>
          {/* ... */}
      </div>
    </div>
  )
}

export default page