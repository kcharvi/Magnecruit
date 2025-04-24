// magnecruit_frontend\src\components\ActionGridComponents\SequenceCuratorView.tsx

import React from "react";

const SequenceCuratorView: React.FC = () => {
    return (
        <div className="p-6 bg-white rounded-lg shadow h-full">
            <p className="text-gray-700 leading-relaxed">
                The recruiter can provide context (job description, candidate profile link, specific
                points they want to highlight). The AI then generates personalized outreach message
                drafts (LinkedIn InMail, email) tailored to the candidate's background and the role.
            </p>
            {/* TODO: Add actual sequence display and editing UI here */}
            <p className="text-gray-500 italic text-sm mt-6">
                (Sequence generation/display functionality pending...)
            </p>
        </div>
    );
};

export default SequenceCuratorView;
