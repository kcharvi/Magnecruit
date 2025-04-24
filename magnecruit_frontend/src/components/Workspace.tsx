// magnecruit_frontend\src\components\Workspace.tsx

import React from 'react';

const Workspace: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Workspace</h2>
      <p className="text-gray-500">Workspace content goes here...</p>
      <div className="mt-4 p-6 bg-blue-50 rounded border border-blue-200">
         Task Item 1
      </div>
       <div className="mt-4 p-6 bg-green-50 rounded border border-green-200">
         Document Preview
      </div>
    </div>
  );
};

export default Workspace;
