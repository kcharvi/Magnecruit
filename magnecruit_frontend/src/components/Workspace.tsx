// magnecruit_frontend\src\components\Workspace.tsx

import React, { useState } from "react";
import {
    SquareStack,
    CalendarClock,
    Users,
    BellDot,
    ChartNoAxesCombined,
    MessageSquareShare,
    Grip,
} from "lucide-react";

import ActionGridView from "./ActionGridView";
import SequenceCuratorView from "./ActionGridComponents/SequenceCuratorView";
import LinkedInPostCreatorView from "./ActionGridComponents/LinkedInPostCreatorView";
import InterviewSchedulerView from "./ActionGridComponents/InterviewSchedulerView";
import CandidateManagerView from "./ActionGridComponents/CandidateManagerView";
import FollowUpReminderView from "./ActionGridComponents/FollowUpReminderView";
import ExpenseSubmitterView from "./ActionGridComponents/ExpenseSubmitterView";

// Define the SequenceData type
interface SequenceStepData {
    id: number;
    step_number: number;
    channel: string;
    delay_days: number | null;
    subject: string | null;
    body: string;
}

interface SequenceData {
    id: number;
    conversation_id: number;
    user_id: number;
    name: string | null;
    description: string | null;
    steps: SequenceStepData[];
    created_at: string;
}

interface ActionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    iconBgColor: string;
    iconColor: string;
}

const actions: ActionItem[] = [
    {
        id: "job-sequence",
        title: "Job Description Writer",
        description: "Draft your job description and publish on multiple sites with one-click.",
        icon: SquareStack,
        iconBgColor: "bg-teal-50",
        iconColor: "text-teal-600",
    },
    {
        id: "linkedin-post-creation",
        title: "LinkedIn Post Creation",
        description: "Quickly generate engaging posts for LinkedIn.",
        icon: MessageSquareShare,
        iconBgColor: "bg-purple-50",
        iconColor: "text-purple-600",
    },
    {
        id: "interview-scheduling",
        title: "Interview Scheduling",
        description: "Easily coordinate interview times with selected candidates using AI.",
        icon: CalendarClock,
        iconBgColor: "bg-sky-50",
        iconColor: "text-sky-600",
    },
    {
        id: "candidate-management",
        title: "Candidate Management",
        description: "Analyze compare and select your potential candidates with ease.",
        icon: Users,
        iconBgColor: "bg-yellow-50",
        iconColor: "text-yellow-600",
    },
    {
        id: "follow-up",
        title: "Send Follow-up Reminder",
        description: "Automate with AI to send personalized follow-ups based on previous chats.",
        icon: BellDot,
        iconBgColor: "bg-rose-50",
        iconColor: "text-rose-600",
    },
    {
        id: "submit-expense",
        title: "Submit Hiring Expenses",
        description: "One-click submits automatically compiled expense and hiring cost reports.",
        icon: ChartNoAxesCombined,
        iconBgColor: "bg-indigo-50",
        iconColor: "text-indigo-600",
    },
];

type WorkspaceView =
    | "actions"
    | "job-sequence"
    | "linkedin-post-creation"
    | "interview-scheduling"
    | "candidate-management"
    | "follow-up"
    | "submit-expense";

const Workspace: React.FC = () => {
    const [activeView, setActiveView] = useState<WorkspaceView>("actions");
    const [currentSequence, setCurrentSequence] = useState<SequenceData | null>(null);

    const handleActionClick = (actionId: string) => {
        console.log(`Action clicked: ${actionId}`);
        setActiveView(actionId as WorkspaceView);

        // Create mock data when job-sequence is selected
        if (actionId === "job-sequence") {
            setCurrentSequence({
                id: 1,
                conversation_id: 1,
                user_id: 1,
                name: "Sample Sequence",
                description: "Sample job sequence for demonstration",
                steps: [
                    {
                        id: 1,
                        step_number: 1,
                        channel: "email",
                        delay_days: 0,
                        subject: "Initial Contact",
                        body: "This is the first step in our sequence.",
                    },
                ],
                created_at: new Date().toISOString(),
            });
        }
    };

    const handleBackClick = () => {
        setActiveView("actions");
    };

    const renderCurrentView = () => {
        switch (activeView) {
            case "job-sequence":
                return <SequenceCuratorView currentSequence={currentSequence} />;
            case "linkedin-post-creation":
                return <LinkedInPostCreatorView />;
            case "interview-scheduling":
                return <InterviewSchedulerView />;
            case "candidate-management":
                return <CandidateManagerView />;
            case "follow-up":
                return <FollowUpReminderView />;
            case "submit-expense":
                return <ExpenseSubmitterView />;
            case "actions":
            default:
                return <ActionGridView actions={actions} onActionClick={handleActionClick} />;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold mb-1 text-gray-700">
                    {activeView === "actions"
                        ? "Workspace"
                        : `Workspace: ${
                              actions.find((a) => a.id === activeView)?.title || activeView
                          }`}
                </h2>
                <button
                    onClick={handleBackClick}
                    disabled={activeView === "actions"}
                    className={`p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-400`}
                    aria-label="Back to actions grid"
                >
                    <Grip size={24} className="text-gray-500" />
                </button>
            </div>

            <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-gray-100">
                {renderCurrentView()}
            </div>
        </div>
    );
};

export default Workspace;
