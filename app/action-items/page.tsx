import React from 'react';

const ActionItem = ({ item }) => {
  return (
    <div className="flex justify-between items-center bg-gray-100 p-2 my-1 rounded">
      <span>{item.task}</span>
      <button className="btn btn-xs btn-primary">Mark as Done</button>
    </div>
  );
};

const ActionItemsSidebar = ({ actionItems }) => {
  return (
    <div>
      <h1>action items</h1>
    </div>
  );
};

export default ActionItemsSidebar;