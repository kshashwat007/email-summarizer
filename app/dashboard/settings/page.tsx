"use client"
import React, { useState } from 'react'

const page = () => {

  const [openTab, setOpenTab] = useState(1);

  return (
    <div className='container p-12 m-8'>
      <h1 className='text-4xl font-bold mb-8 p-4'>Settings</h1>
      <div role="tablist" className="tabs tabs-lifted">
        <a role="tab" className={`tab text-xl ${(openTab === 1 ? "tab-active" : "")}`} onClick={() => setOpenTab(1)}>User Details</a>
        <a role="tab" className={`tab text-xl ${(openTab === 2 ? "tab-active" : "")}`} onClick={() => setOpenTab(2)}>Summary Settings</a>
        <a role="tab" className={`tab text-xl ${(openTab === 3 ? "tab-active" : "")}`} onClick={() => setOpenTab(3)}>Accounts</a>
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
        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">OpenAI Key(Optional)</span>
          </div>
          <input type="text" placeholder="a**************" className="input input-bordered w-full max-w-xs" />
        </label>
      </div>

      <div className={`${(openTab === 3 ? "block" : "hidden")}`}>
        <label className="form-control w-full max-w-xs p-4">
          <div className="label">
            <span className="label-text">Name</span>
          </div>
          <input type="text" placeholder="Krishanu" className="input input-bordered w-full max-w-xs" disabled/>
        </label>
      </div>
      

      <div className="additional-actions mb-4 mt-4 p-4">
        <button className="btn btn-outline mr-2 w-[148px]">Save</button>
          {/* ... */}
      </div>
    </div>
  )
}

export default page