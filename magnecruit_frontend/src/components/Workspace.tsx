// magnecruit_frontend\src\components\Workspace.tsx

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    SquareStack,
    CalendarClock,
    Users,
    BellDot,
    ChartNoAxesCombined,
    MessageSquareShare,
    Grip,
} from "lucide-react";
import { Jobs } from "../lib/types";
import { AppDispatch, RootState } from "../store/store";
import {
    WorkspaceView as WorkspaceViewType,
    setActiveView as setReduxActiveView,
} from "../store/workspaceSlice";

import ActionGridView from "./ActionGridView";
import JobSectionWriterView from "./ActionGridComponents/JobSectionsCuratorView";
import LinkedInPostCreatorView from "./ActionGridComponents/LinkedInPostCreatorView";
import InterviewSchedulerView from "./ActionGridComponents/InterviewSchedulerView";
import CandidateManagerView from "./ActionGridComponents/CandidateManagerView";
import FollowUpReminderView from "./ActionGridComponents/FollowUpReminderView";
import ExpenseSubmitterView from "./ActionGridComponents/ExpenseSubmitterView";

// Interface for the action items
interface ActionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    iconBgColor: string;
    iconColor: string;
}

// Actions for the workspace
const actions: ActionItem[] = [
    {
        id: "job-sections",
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

// Workspace component
const Workspace: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const selectedConversationId = useSelector(
        (state: RootState) => state.chat.selectedConversationId
    );
    const currentJob = useSelector((state: RootState) => state.workspace.aiGeneratedJob);
    const jobSectionsCuratorRef = useRef<{ updateJobs: (data: Partial<Jobs>) => void } | null>(
        null
    );
    const [activeView, setActiveView] = useState<WorkspaceViewType>("actions");

    // Effect to update the Job Section Writer View via ref
    useEffect(() => {
        if (currentJob && currentJob.conversation_id === selectedConversationId) {
            if (jobSectionsCuratorRef.current && activeView === "job-sections") {
                if (currentJob) {
                    jobSectionsCuratorRef.current.updateJobs(currentJob);
                }
            }
        }
    }, [currentJob, selectedConversationId, activeView]);

    // Handler for the action click
    const handleActionClick = (actionId: string) => {
        const newView = actionId as WorkspaceViewType;
        setActiveView(newView);
        dispatch(setReduxActiveView(newView));
    };

    // Handler for the back click
    const handleBackClick = () => {
        setActiveView("actions");
        dispatch(setReduxActiveView("actions"));
    };

    // Render the current view
    const renderCurrentView = () => {
        switch (activeView) {
            case "job-sections":
                return (
                    <JobSectionWriterView
                        userId={currentJob?.user_id || undefined}
                        onRef={(ref) => (jobSectionsCuratorRef.current = ref)}
                    />
                );
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
            {/* Workspace Header */}
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

            <div className="flex-grow p-4 md:p-4 overflow-y-auto bg-gray-100">
                {renderCurrentView()}
            </div>
        </div>
    );
};

export default Workspace;
