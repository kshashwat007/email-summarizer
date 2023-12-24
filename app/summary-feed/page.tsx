'use client'
import Sidebar from '@/components/Sidebar';
import React, { useState } from 'react';

const EmailSummary = ({ email }) => {
  return (
    <div className="card bg-base-200 p-4 mt-3 w-full max-w-xs shadow rounded-lg overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium text-gray-800">{email.sender || 'Sender'}</div>
          <div className="text-lg font-semibold text-gray-900">{email.subject || 'Subject'}</div>
        </div>
        <div className="text-xs text-gray-400 self-end">{email.date || 'Date/Time'}</div>
      </div>
      <div className="divider"></div> 
      <p className="text-gray-600 mt-1 line-clamp-2">{email.summary || 'No summary provided.'}</p>
      <div className="divider"></div> 
      {/* If there are action items, display up to two */}
      {email.action_items && email.action_items.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-700">Action Items (showing 2)</h3>
          <ul className="list-disc pl-5 mt-1">
            {email.action_items.slice(0, 2).map((item, index) => (
              <li key={index} className="text-xs text-gray-600">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* If there are links, display up to two */}
      {email.links && email.links.length > 0 && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-700">Extracted Links (showing 2)</h3>
          <ul className="list-disc pl-5 mt-1">
            {email.links.slice(0, 2).map((item, index) => (
              <li key={index} className="text-xs text-gray-600"><a href={item} target="_blank" rel="noopener noreferrer">{item}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* Expand button/icon */}
      <div className="mt-2">
        <button className="text-orange-500 hover:text-orange-600 flex items-center transition-colors duration-200">
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
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex justify-center h-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 overflow-auto">
          {emails.map(email => <EmailSummary key={email.id} email={email} />)}
        </div>
      </div>
    </div>
  );
};


export default SummaryFeed;