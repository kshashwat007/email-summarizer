import React from 'react'
import data from '../../../testdata.json'

const SummaryData = ({ params }: { params: { id: string } }) => {
  const email = data.summaryDetails[1]
  return (
    <div className="container p-4 top-0">
      <div className='p-[24px]'>
        {/* Email Subject */}
        <h2 className="text-2xl font-bold mb-2">{email.subject}</h2>

        {/* Sender Information */}
        <div className="flex items-center mb-2">
          <span>{email.sender}</span>
        </div>

        {/* Date and Time */}
        <p className="text-gray-600 mb-4">{email.date}</p>

        {/* Email Content */}
        <div className="email-content mb-4">
          <p>{email.summary}</p>
          {/* ... */}
        </div>

        {/* Action Items */}
        {email.action_items && email.action_items.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Action Items</h3>
            <ul className="list-disc pr-4 space-y-2"> {/* Adjusted right padding */}
              {email.action_items.map((item, index) => (
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
        {email.links && email.links.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 uppercase">Extracted Links</h3>
            <ul className="list-disc pl-4 space-y-2">
              {email.links.map((item, index) => (
                <li key={index} className="text-xs text-gray-600">
                  <a href={item} className="break-all" target="_blank" rel="noopener noreferrer">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        )}


        {/* Additional Actions */}
        <div className="additional-actions mb-4 mt-4">
          <button className="btn btn-outline mr-2">Delete</button>
          {/* ... */}
        </div>
      </div>
    </div>
  )
}

export default SummaryData