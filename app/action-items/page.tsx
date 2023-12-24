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
    <div className="p-4">
      <h4 className="font-semibold mb-2">Action Items</h4>
      {actionItems.map(item => <ActionItem key={item.id} item={item} />)}
    </div>
  );
};

export default ActionItemsSidebar;