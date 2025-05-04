// magnecruit_frontend\src\components\ActionGridComponents\JobSectionsCuratorView.tsx

import React, { useState, useEffect, useCallback } from "react";
import axios, { AxiosError } from "axios";
import { Plus, Save, Trash2 } from "lucide-react";
import { Jobs, JobSections } from "../../lib/types";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Interface for the job sections input data
interface JobSectionsInputData{
    section_number: number;
    heading: string;
    body: string;
}

// Interface for the job sections curator view props
interface JobSectionsCuratorViewProps {
    userId?: number;
    onRef?: (ref: { updateJobs: (data: Partial<Jobs>) => void }) => void;
}

// Job sections curator view component
const JobSectionsCuratorView: React.FC<JobSectionsCuratorViewProps> = ({ userId, onRef }) => {
    const selectedConversationId = useSelector((state: RootState) => state.chat.selectedConversationId);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [jobs, setJobs] = useState<Jobs>({
        jobrole: "",
        description: "",
        sections: [
            {
                id: Date.now(),
                section_number: 1,
                heading: "About the Company",
                body: "Enter company information here...",
            },
        ],
    });

    // Update the jobs state
    const updateJobs = useCallback((data: Partial<Jobs>) => {
        setJobs((prevState) => {
            const newState = { ...prevState, ...data };
            if (data.jobrole) {
                newState.jobrole = data.jobrole;
            }
            if (data.description) {
                newState.description = data.description;
            }
            if (data.sections) {
                newState.sections = data.sections;
            }
            return newState;
        });
        setSuccess("Job description updated from chat");
        setTimeout(() => setSuccess(""), 5000);
    }, []);

    // Fetch the jobs from the database
    const fetchJobs = useCallback(
        async (convId: number) => {
            try {
                setLoading(true);
                setError("");
                const response = await axios.get<Jobs>(
                    `${API_BASE_URL}/job-sections/get/${convId}`
                );
                const fetchedData = response.data;
                fetchedData.sections = fetchedData.sections?.sort((a, b) => a.section_number - b.section_number) || [];
                fetchedData.jobrole = fetchedData.jobrole || "";
                fetchedData.description = fetchedData.description || "";
                setJobs(fetchedData);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setJobs({
                        conversation_id: convId,
                        user_id: userId,
                        jobrole: "",
                        description: "",
                        sections: [
                            {
                                id: Date.now(),
                                section_number: 1,
                                heading: "About the Company / Role",
                                body: "",
                            },
                            {
                                id: Date.now() + 1,
                                section_number: 2,
                                heading: "Responsibilities",
                                body: "",
                            },
                            {
                                id: Date.now() + 2,
                                section_number: 3,
                                heading: "Required Qualifications",
                                body: "",
                            },
                            {
                                id: Date.now() + 3,
                                section_number: 4,
                                heading: "Benefits / Offer Details",
                                body: "",
                            },
                            {
                                id: Date.now() + 4,
                                section_number: 5,
                                heading: "Additional Information",
                                body: "",
                            },
                        ],
                    });
                    setError("");
                } else {
                    setError("Failed to load job description data. Please try refreshing.");
                    setJobs({
                        conversation_id: convId,
                        user_id: userId,
                        jobrole: "",
                        description: "",
                        sections: [
                            {
                                id: Date.now(),
                                section_number: 1,
                                heading: "Error Loading Data",
                                body: "Could not load existing data.",
                            },
                        ],
                    });
                }
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    // Effect to update the jobs state
    useEffect(() => {
        if (onRef) {
            onRef({ updateJobs });
        }
    }, [onRef, updateJobs]);

    // Effect to fetch the jobs from the database
    useEffect(() => {
        if (selectedConversationId) {
            fetchJobs(selectedConversationId);
        } else {
            setJobs({
                jobrole: "",
                description: "",
                sections: [
                    {
                        id: Date.now(),
                        section_number: 1,
                        heading: "Section 1",
                        body: "",
                    },
                ],
            });
            setLoading(false);
            setError("");
        }
    }, [selectedConversationId, fetchJobs]);

    // Handle the job role change
    const handleJobroleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setJobs((prevState) => ({
            ...prevState,
            jobrole: e.target.value,
        }));
    };

    // Handle the job description change
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJobs((prevState) => ({
            ...prevState,
            description: e.target.value,
        }));
    };

    // Handle the job section heading change
    const handleJobSectionHeadingChange = (index: number, value: string) => {
        const updatedSection = [...jobs.sections];
        updatedSection[index] = {
            ...updatedSection[index],
            heading: value,
        };
        setJobs((prevState) => ({
            ...prevState,
            sections: updatedSection,
        }));
    };

    // Handle the job section body change
    const handleJobSectionBodyChange = (index: number, value: string) => {
        const updatedJobSections = [...jobs.sections];
        updatedJobSections[index] = {
            ...updatedJobSections[index],
            body: value,
        };
        setJobs((prevState) => ({
            ...prevState,
            sections: updatedJobSections,
        }));
    };

    // Add a new job section
    const onAddJobSection = () => {
        const newJobSection: JobSections = {
            id: Date.now(),
            section_number: jobs.sections.length + 1,
            heading: `Section ${jobs.sections.length + 1}`,
            body: "Enter content here...",
        };
        setJobs((prevState) => ({
            ...prevState,
            sections: [...prevState.sections, newJobSection],
        }));
    };

    // Remove a job section
    const onRemoveJobSection = (index: number) => {
        if (jobs.sections.length <= 1) {
            setError("You need at least one section in the job description.");
            setTimeout(() => setError(""), 5000);
            return;
        }
        const sectionsAfterRemoval = jobs.sections.filter((_, i) => i !== index);
        const updatedSectionsWithNumbers  = sectionsAfterRemoval.map((section, i) => {
            return {
                ...section,
                section_number: i + 1,
            }
        })
        setJobs((prevState) => ({
            ...prevState,
            sections: updatedSectionsWithNumbers,
        }));
    };

    // Save the jobs
    const onSaveJobs = async () => {
        if (!jobs.jobrole.trim()) {
            setError("Job title is required");
            setTimeout(() => setError(""), 5000);
            return;
        }
        const currentConvId = selectedConversationId;
        if (!currentConvId) {
            setError("Cannot save: No active conversation selected.");
            setTimeout(() => setError(""), 5000);
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const jobSectionsInput: JobSectionsInputData[] = jobs.sections.map((section) => ({
                section_number: section.section_number,
                heading: section.heading,
                body: section.body,
            }));

            const dataToSend = {
                id: jobs.id,
                conversation_id: currentConvId,
                user_id: userId || jobs.user_id,
                jobrole: jobs.jobrole,
                description: jobs.description,
                sections: jobSectionsInput,
            };
            if (!dataToSend.user_id) {
                console.warn(
                    "JobSectionsCuratorView: User ID is missing when trying to save. Ensure userId prop is passed or retrieved."
                );
            }
            const response = await axios.post<{
                id: number;
                sections?: JobSections[];
                message?: string;
            }>(`${API_BASE_URL}/job-sections/save`, dataToSend);

            if (response.data.id) {
                if (response.data.sections && Array.isArray(response.data.sections)) {
                    setJobs((prev) => ({
                        ...prev,
                        id: response.data.id,
                        conversation_id: currentConvId,
                        sections: response.data.sections!.map((s) => ({
                            ...s,
                            heading: s.heading || "",
                        })),
                    }));
                } else {
                    setJobs((prevState) => ({
                        ...prevState,
                        id: response.data.id,
                        conversation_id: currentConvId,
                    }));
                }
            }

            setSuccess(response.data.message || "Job description saved successfully!");
            setTimeout(() => setSuccess(""), 5000);
        } catch (err: unknown) {
            let errorMsg = "Failed to save job description. Please try again.";
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<{ error?: string }>;
                errorMsg = axiosError.response?.data?.error || axiosError.message || errorMsg;
            } else if (err instanceof Error) {
                errorMsg = err.message;
            }
            setError(errorMsg);
            setTimeout(() => setError(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full min-h-[400px]">

            {/* Header: Job Title and Description */}
            <div className="p-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Job Title"
                    value={jobs.jobrole || ""}
                    onChange={handleJobroleChange}
                    className="text-lg font-semibold w-full border-none focus:ring-0 p-0 mb-2 outline-none"
                />
                <textarea
                    placeholder="Write a job description..."
                    value={jobs.description}
                    onChange={handleDescriptionChange}
                    className="text-sm text-gray-600 w-full border border-gray-200 rounded-md p-2 resize-none outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                    rows={2}
                />
            </div>

            {/* Sections Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Job Sections:</h4>
                    <button
                        onClick={onAddJobSection}
                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <Plus size={12} className="mr-1" /> Add Section
                    </button>
                </div>

                {/* Sections List */}
                {jobs.sections.length > 0 ? (
                    <div className="space-y-3">
                        {jobs.sections.map((section, index) => (
                            <div
                                key={section.id || index}
                                className="p-3 border rounded-md bg-gray-50"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center flex-grow mr-2">
                                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">
                                            Section {section.section_number}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Section Heading"
                                            value={section.heading}
                                            onChange={(e) =>
                                                handleJobSectionHeadingChange(index, e.target.value)
                                            }
                                            className="text-sm font-medium text-gray-700 border-none bg-transparent focus:ring-0 p-0 outline-none w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onRemoveJobSection(index)}
                                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                        title="Remove Section"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <textarea
                                    value={section.body}
                                    onChange={(e) => handleJobSectionBodyChange(index, e.target.value)}
                                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-md p-2 min-h-[80px] focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter content for this section..."
                                    rows={3}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm text-center py-8">
                        No job sections yet. Add sections to build your job description.
                    </p>
                )}
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="mx-4 mb-2 p-2 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="mx-4 mb-2 p-2 bg-green-100 text-green-700 text-sm rounded-md border border-green-200">
                    {success}
                </div>
            )}

            {/* Footer: Save Button */}
            <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                    onClick={onSaveJobs}
                    disabled={loading || !selectedConversationId}
                    className="text-sm px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                >
                    {loading ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={14} className="mr-1" /> Save Job Description
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default JobSectionsCuratorView;