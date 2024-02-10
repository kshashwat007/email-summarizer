// @ts-nocheck
"use client"
import Sidebar from '@/components/Sidebar';
import React, { useState, useEffect } from 'react';
import data from '../../testdata.json'
import {Routes, Route, useNavigate} from 'react-router-dom';
import SummaryData from '../summary-data/[id]/page';
import { useRouter } from 'next/navigation';
import Summary from '@/models/Summary';
import connectMongo from '@/libs/mongoose';
import ButtonAccount from '@/components/ButtonAccount';
import config from '@/config';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";


const EmailSummary = ({ email }) => {
  const router = useRouter();

  const openSummary = () => {
    // Here we navigate to the summary page and pass the email ID as a query parameter
    router.push(`/summary-data/${email.id}`);
  };

  const deleteSummary = () => {
    try {
      fetch(`/api/summary/deleteSummary?id=${email.id}`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log("Summary Deleted")
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
    router.refresh()
    location.reload()
    } catch (error) {
      console.log(error)
    }
    
  }

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
            {email.action_items.slice(0, 1).map((item: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode, index: React.Key) => (
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
            {email.links.slice(0, 1).map((item: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.PromiseLikeOfReactNode, index: React.Key) => (
              <li key={index} className="text-xs text-gray-600">
                <a href={item} className="break-all" target="_blank" rel="noopener noreferrer">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <button className="text-[#5e7fc5] hover:text-blue-700 flex items-center transition-colors duration-200" onClick={openSummary}>
          Open Summary
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
      <div className="additional-actions mb-4 mt-4">
        <button className="btn btn-outline mr-2" onClick={deleteSummary}>Delete</button>
          {/* ... */}
      </div>
    </div>
  );
};


const SummaryFeed = () => {
  const [summaries, setSummaries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    Promise.all([
      fetch(`/api/summaries`).then(res => res.json()),
      fetch(`/api/user`).then(res => res.json())
    ]).then(([summariesData, userData]) => {
      setSummaries(summariesData.summaries);
      setUser(userData.user)
      setLoading(false)
      // You can check here if the elements exist and then start the tour
      // 1. Fetch user. 2. Check if first time. 3. Fetch limited amount of emails for the users to start off. 4. Once tour over, he wont be first time
      console.log("User",userData.user)
      if (userData.user != null && userData.user.firstTime == true) {
        let data = {}
        data["firstTime"] = false
        startTour();
        fetch(`/api/user/updateUser?id=${userData.user.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(data)
        })
        fetch(`/api/email/firstTime?id=${userData.user.id}`)
      }
      
    }).catch(error => {
      setError(error)
      console.error('There was an error!', error);
    });
  }, []);
  
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: [
        { element: '.page-header', popover: { title: 'Welcome', description: `Welcome to Summailize, your personal email summarizer. We are here to help you declutter your inbox and save time. Let's get started` } },
        { element: '.menu-settings', popover: { title: 'Summary Length', description: `You can choose how long you want your email summaries to be. Select your preferred summary length: [Short, Medium, Long].` } },
        { element: '.user-account', popover: { title: 'User', description: 'This here is your logged in user. You can also logout from over here' } },
        { element: '.menu-settings', popover: { title: 'Review Settings', description: 'Take a moment to review your settings.' } },
        { element: '.page-header', popover: { title: 'Email Notification', description: 'Expect an notification everytime your summaries are ready. For now we will fetch a short amount of emails for you to start with in a short while.' } },
        { element: '.page-header', popover: { title: 'Enjoy', description: 'You are all setup. Feel free to leave any feedback for this Beta. Many more features are planned out such as summaries delivered right to your mail, chrome extensions and many more exciting stuff. So stay tuned!' } }
      ]
    });
    
    driverObj.drive();
  };
  
  // ... other component logic
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <div className="flex-grow overflow-auto">
        <div className='p-6 user-account'>
          <ButtonAccount />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-6">
          {summaries.map((summary) => <EmailSummary key={summary._id} email={summary} />)}
        </div>
      </div>
    </div>
  );
};


export default SummaryFeed;