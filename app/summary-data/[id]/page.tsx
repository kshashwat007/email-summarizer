"use client"
import React, { useEffect, useState } from 'react'

const SummaryData = ({ params }: { params: { id: string } }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      fetch(`http://localhost:3000/api/summary?id=${params.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log("Data", data)
        setSummary(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
      });
    } catch (error) {
      console.log(error)
    }
    
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container p-4 top-0">
      <div className='p-[24px]'>
        {/* Email Subject */}
        <h2 className="text-2xl font-bold mb-2">{summary.subject}</h2>

        {/* Sender Information */}
        <div className="flex items-center mb-2">
          <span>{summary.sender}</span>
        </div>

        {/* Date and Time */}
        <p className="text-gray-600 mb-4">{summary.date}</p>

        {/* Email Content */}
        <div className="email-content mb-4">
          <p>{summary.summary}</p>
          {/* ... */}
        </div>

        {/* Action Items */}
        {summary.action_items && summary.action_items.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Action Items</h3>
            <ul className="list-disc pr-4 space-y-2"> {/* Adjusted right padding */}
              {summary.action_items.map((item:any, index:any) => (
                <div key={index} className='flex items-center'>
                  <input type="checkbox" id={`action-item-${index}`} className="checkbox checkbox-sm mr-2" />
                  <label className="text-xs text-gray-600 break-all" htmlFor={`action-item-${index}`}>{item}</label>
                  {/* <li key={index} className="text-xs text-gray-600 break-all">
                    {item}
                  </li> */}
                </div>
              ))}
            </ul>
          </div>
        )}

        {/* Extracted Links */}
        {summary.links && summary.links.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Extracted Links</h3>
            <ul className="list-disc pl-4 space-y-2">
              {summary.links.map((item:any, index:any) => (
                <li key={index} className="text-xs text-gray-600">
                  <a href={item} className="break-all" target="_blank" rel="noopener noreferrer">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Additional Actions */}
        <div className="additional-actions mb-4 mt-4">
          {/* <button className="btn btn-outline mr-2">Delete</button> */}
          {/* ... */}
        </div>
      </div>
    </div>
  )
}

export default SummaryData