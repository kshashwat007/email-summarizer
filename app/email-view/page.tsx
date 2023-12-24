import React from 'react';

const EmailDetailView = ({ email }) => {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{email.subject}</h3>
        <p className="py-4">{email.detailedSummary}</p>
        <div className="modal-action">
          <a href="#" className="btn">Close</a>
        </div>
      </div>
    </div>
  );
};

export default EmailDetailView;