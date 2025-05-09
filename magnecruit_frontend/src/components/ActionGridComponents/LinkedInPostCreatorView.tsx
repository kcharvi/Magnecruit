// magnecruit_frontend\src\components\ActionGridComponents\LinkedInPostCreatorView.tsx

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ChevronDown, ChevronUp, Linkedin, RefreshCw, Copy } from "lucide-react";
import axios, { AxiosError } from "axios";
import { RootState } from "../../store/store";
import { Jobs } from "../../lib/types";

// Using type instead of empty interface
type LinkedInPostCreatorViewProps = Record<string, never>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LinkedInPostCreatorView: React.FC<LinkedInPostCreatorViewProps> = () => {
    const selectedConversationId = useSelector(
        (state: RootState) => state.chat.selectedConversationId
    );

    const [jobDetails, setJobDetails] = useState<Jobs | null>(null);
    const [isLoadingJob, setIsLoadingJob] = useState(false);
    const [fetchJobError, setFetchJobError] = useState<string>("");
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [generatedPost, setGeneratedPost] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [tone, setTone] = useState("professional");
    const [length, setLength] = useState("medium");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchJobDetails = async () => {
            if (!selectedConversationId) {
                setJobDetails(null);
                setJobTitle("");
                setJobDescription("");
                setFetchJobError("");
                return;
            }
            setIsLoadingJob(true);
            setFetchJobError("");
            setJobDetails(null);
            try {
                const response = await axios.get<Jobs>(
                    `${API_BASE_URL}/api/job-sections/get/${selectedConversationId}`
                );
                setJobDetails(response.data);
                setJobTitle(response.data.jobrole || "");
                setJobDescription(response.data.description || "");
                
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setFetchJobError(
                        "No existing job description found for this conversation. Please enter details manually."
                    );
                    setJobTitle("");
                    setJobDescription("");
                } else {
                    setFetchJobError("Failed to load job details. You can enter them manually.");
                    console.error("Error fetching job details:", err);
                }
                setJobDetails(null);
            } finally {
                setIsLoadingJob(false);
            }
        };

        fetchJobDetails();
    }, [selectedConversationId]);

    const generateLinkedInPost = async () => {
        const titleForPost = jobDetails?.jobrole || jobTitle;

        if (!selectedConversationId) {
            setError("No conversation selected. Cannot determine which job to use.");
            return;
        }
        if (!jobDetails && !jobTitle) {
            setError("Please provide a Job Title or load existing job details.");
            return;
        }
        if (!companyName.trim()) {
            setError("Please provide a Company Name.");
            return;
        }

        setIsGenerating(true);
        setError("");
        setGeneratedPost("");

        try {
            const response = await axios.post(`${API_BASE_URL}/api/linkedin-post/generate`, {
                conversation_id: selectedConversationId,
                job_title: titleForPost,
                company_name: companyName,
                job_description_summary: jobDescription,
                tone: tone,
                length: length,
            });

            setGeneratedPost(response.data.linkedin_post);
        } catch (err) {
            console.error("Error generating post:", err);
            const axiosError = err as AxiosError<{ error?: string }>;
            setError(
                axiosError.response?.data?.error ||
                    "Failed to generate LinkedIn post. Please try again."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const openLinkedIn = () => {
        const linkedInUrl = "https://www.linkedin.com/post/new";
        window.open(linkedInUrl, "_blank");
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            {/* Header Section */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold mb-1">LinkedIn Post Creator</h2>
                <p className="text-sm text-gray-500">
                    Generate engaging job posts for LinkedIn using AI, based on the current
                    conversation's job details.
                </p>
            </div>

            {/* Input Section */}
            <div className="p-4 flex-grow overflow-y-auto">
                {isLoadingJob && (
                    <p className="text-center text-gray-500">Loading job details...</p>
                )}
                {fetchJobError && !isLoadingJob && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
                        {fetchJobError}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="jobTitleInput"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Job Title (from saved job or manual input)
                        </label>
                        <input
                            id="jobTitleInput"
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior React Developer"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoadingJob}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="companyNameInput"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Company Name (manual input)
                        </label>
                        <input
                            id="companyNameInput"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Magnecruit Inc."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoadingJob}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="jobDescriptionTextarea"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Job Description Summary (from saved job or manual input)
                        </label>
                        <textarea
                            id="jobDescriptionTextarea"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Brief description of the role"
                            rows={4}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoadingJob}
                        />
                    </div>

                    {/* Advanced Options */}
                    <div className="pt-2">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                        >
                            Advanced Options
                            {showAdvanced ? (
                                <ChevronUp size={16} className="ml-1" />
                            ) : (
                                <ChevronDown size={16} className="ml-1" />
                            )}
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 space-y-3 border-t pt-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tone
                                    </label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="conversational">Conversational</option>
                                        <option value="enthusiastic">Enthusiastic</option>
                                        <option value="formal">Formal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Length
                                    </label>
                                    <select
                                        value={length}
                                        onChange={(e) => setLength(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="short">Short</option>
                                        <option value="medium">Medium</option>
                                        <option value="long">Long</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Generation Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                        {error}
                    </div>
                )}

                {/* Result Area */}
                {generatedPost && (
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Generated LinkedIn Post
                        </label>
                        <div className="relative">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap min-h-[150px] text-sm">
                                {generatedPost}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPost);
                                    const button = document.activeElement as HTMLButtonElement;
                                    const icon = button.querySelector('svg');
                                    if (icon) {
                                        icon.classList.add('scale-90');
                                        setTimeout(() => icon.classList.remove('scale-90'), 100);
                                    }
                                }}
                                className="absolute top-2 right-2 p-1 bg-white rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50"
                                title="Copy to clipboard"
                            >
                                <Copy size={14} className="transition-transform duration-100" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Section */}
            <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
                <button
                    onClick={generateLinkedInPost}
                    disabled={
                        !selectedConversationId ||
                        (!jobDetails && !jobTitle.trim()) ||
                        !companyName.trim()
                    }
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Post"
                    )}
                </button>

                <button
                    onClick={openLinkedIn}
                    disabled={!generatedPost || isGenerating}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                >
                    <Linkedin size={16} className="mr-2" />
                    Open LinkedIn
                </button>
            </div>
        </div>
    );
};

export default LinkedInPostCreatorView;
