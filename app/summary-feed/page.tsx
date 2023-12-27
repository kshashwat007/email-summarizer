'use client'
import Sidebar from '@/components/Sidebar';
import React, { useState } from 'react';

const EmailSummary = ({ email }) => {
  return (
    <div className="card bg-[#FFFFFF] p-6 mt-3 w-full max-w-md lg:max-w-lg xl:max-w-xl shadow-md rounded-xl overflow-hidden border border-[#d5e3f9]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          <div className="text-lg font-medium text-[#8bacf2]">{`${email.sender || `No Sender`}`}</div>
          <div className="text-md font-semibold text-gray-900">{`Subject: ${email.subject || `No Subject`}`}</div>
          <div className="text-xs text-gray-500 mt-1">{email.date || 'Date/Time'}</div>
        </div>
      </div>
      <p className="text-gray-600 line-clamp-2 mb-4">{email.summary || 'No summary provided.'}</p>
      <div className="divider"></div>
      {email.action_items && email.action_items.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Action Items</h3>
          <ul className="list-disc pl-4 pr-4 space-y-2"> {/* Adjusted right padding */}
            {email.action_items.slice(0, 1).map((item, index) => (
              <li key={index} className="text-xs text-gray-600 break-all">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {email.links && email.links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Extracted Links</h3>
          <ul className="list-disc pl-4 space-y-2">
            {email.links.slice(0, 1).map((item, index) => (
              <li key={index} className="text-xs text-gray-600">
                <a href={item} className="break-all" target="_blank" rel="noopener noreferrer">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <button className="text-[#5e7fc5] hover:text-blue-700 flex items-center transition-colors duration-200">
          Open Summary
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};


const SummaryFeed = ({ emails }) => {
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      
      <div className="flex-grow overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-6">
          {emails.map(email => <EmailSummary key={email.id} email={email} />)}
        </div>
      </div>
    </div>
  );
};


export default SummaryFeed;