// magnecruit_frontend\src\components\ActionGridComponents\SequenceCuratorView.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import axios, { AxiosError } from "axios";
// Import shared types
import { SequenceData, SequenceStepData } from "../../lib/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Type for steps being sent to the backend save endpoint
interface SequenceStepInputData {
    step_number: number;
    heading: string;
    body: string;
}

interface SequenceCuratorViewProps {
    conversationId?: number;
    userId?: number;
    onRef?: (ref: { updateSequence: (data: Partial<SequenceData>) => void }) => void;
}

const SequenceCuratorView: React.FC<SequenceCuratorViewProps> = ({
    conversationId,
    userId,
    onRef,
}) => {
    const [sequence, setSequence] = useState<SequenceData>({
        jobrole: "",
        description: "",
        steps: [
            {
                id: Date.now(),
                step_number: 1,
                heading: "About the Company",
                body: "Enter company information here...",
            },
        ],
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const updateSequence = useCallback((data: Partial<SequenceData>) => {
        console.log("SequenceCuratorView: updateSequence called with:", data);
        setSequence((prevState) => {
            // Merge intelligently, ensuring steps are overwritten if provided
            const newState = { ...prevState, ...data };
            // Ensure jobrole/name consistency
            if (data.jobrole) {
                newState.jobrole = data.jobrole;
            }
            // Make sure steps array is replaced, not merged if provided
            if (data.steps) {
                newState.steps = data.steps;
            }
            return newState;
        });
        setSuccess("Job description updated from chat");
        // Clear error/success messages after a delay
        setTimeout(() => setSuccess(""), 5000);
    }, []);

    useEffect(() => {
        if (onRef) {
            onRef({ updateSequence });
        }
    }, [onRef, updateSequence]);

    const fetchSequence = useCallback(
        async (convId: number) => {
            try {
                setLoading(true);
                setError("");
                console.log(`JobSequenceWriterView: Fetching sequence for conversation ${convId}`);
                const response = await axios.get<SequenceData>(
                    `${API_BASE_URL}/job-sequence/get/${convId}`
                );
                const fetchedData = response.data;
                console.log(
                    "JobSequenceWriterView: Sequence data fetched successfully",
                    fetchedData
                );
                fetchedData.steps =
                    fetchedData.steps?.sort((a, b) => a.step_number - b.step_number) || [];
                fetchedData.jobrole = fetchedData.jobrole || "";
                fetchedData.description = fetchedData.description || "";
                setSequence(fetchedData);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    console.log(
                        `JobSequenceWriterView: No existing sequence found for conversation ${convId} (404). Setting initial state.`
                    );
                    setSequence({
                        conversation_id: convId,
                        user_id: userId,
                        jobrole: "",
                        description: "",
                        steps: [
                            {
                                id: Date.now(),
                                step_number: 1,
                                heading: "About the Company / Role",
                                body: "",
                            },
                            {
                                id: Date.now() + 1,
                                step_number: 2,
                                heading: "Responsibilities",
                                body: "",
                            },
                            {
                                id: Date.now() + 2,
                                step_number: 3,
                                heading: "Required Qualifications",
                                body: "",
                            },
                            {
                                id: Date.now() + 3,
                                step_number: 4,
                                heading: "Benefits / Offer Details",
                                body: "",
                            },
                            {
                                id: Date.now() + 4,
                                step_number: 5,
                                heading: "Additional Information",
                                body: "",
                            },
                        ],
                    });
                    setError("");
                } else {
                    console.error("JobSequenceWriterView: Error fetching sequence:", err);
                    setError("Failed to load job description data. Please try refreshing.");
                    setSequence({
                        conversation_id: convId,
                        user_id: userId,
                        jobrole: "",
                        description: "",
                        steps: [
                            {
                                id: Date.now(),
                                step_number: 1,
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

    useEffect(() => {
        if (conversationId) {
            fetchSequence(conversationId);
        } else {
            console.log("JobSequenceWriterView: No conversation selected. Resetting state.");
            setSequence({
                jobrole: "",
                description: "",
                steps: [
                    {
                        id: Date.now(),
                        step_number: 1,
                        heading: "About the Company / Role",
                        body: "",
                    },
                    // Add other default steps
                ],
            });
            setLoading(false);
            setError("");
        }
    }, [conversationId, fetchSequence]);

    const handleJobroleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSequence((prevState) => ({
            ...prevState,
            jobrole: e.target.value,
        }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSequence((prevState) => ({
            ...prevState,
            description: e.target.value,
        }));
    };

    const handleStepHeadingChange = (index: number, value: string) => {
        const updatedSteps = [...sequence.steps];
        updatedSteps[index] = {
            ...updatedSteps[index],
            heading: value,
        };
        setSequence((prevState) => ({
            ...prevState,
            steps: updatedSteps,
        }));
    };

    const handleStepBodyChange = (index: number, value: string) => {
        const updatedSteps = [...sequence.steps];
        updatedSteps[index] = {
            ...updatedSteps[index],
            body: value,
        };
        setSequence((prevState) => ({
            ...prevState,
            steps: updatedSteps,
        }));
    };

    const addStep = () => {
        const newStep: SequenceStepData = {
            id: Date.now(),
            step_number: sequence.steps.length + 1,
            heading: `Step ${sequence.steps.length + 1}`,
            body: "Enter content here...",
        };

        setSequence((prevState) => ({
            ...prevState,
            steps: [...prevState.steps, newStep],
        }));
    };

    const removeStep = (index: number) => {
        if (sequence.steps.length <= 1) {
            setError("You need at least one step in the sequence.");
            setTimeout(() => setError(""), 5000);
            return;
        }

        const updatedSteps = sequence.steps.filter((_, i) => i !== index);
        updatedSteps.forEach((step, i) => {
            step.step_number = i + 1;
        });

        setSequence((prevState) => ({
            ...prevState,
            steps: updatedSteps,
        }));
    };

    const saveSequence = async () => {
        if (!sequence.jobrole.trim()) {
            setError("Job title is required");
            setTimeout(() => setError(""), 5000);
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Map steps to the input type expected by the backend
            const stepsInput: SequenceStepInputData[] = sequence.steps.map((step) => ({
                step_number: step.step_number,
                heading: step.heading,
                body: step.body,
            }));

            const dataToSend = {
                // Send only necessary fields for save/update
                id: sequence.id, // Include ID if updating an existing sequence
                conversation_id: conversationId || sequence.conversation_id,
                user_id: userId || sequence.user_id,
                jobrole: sequence.jobrole,
                description: sequence.description,
                steps: stepsInput,
            };

            if (!dataToSend.conversation_id || !dataToSend.user_id) {
                throw new Error("Conversation ID and User ID are required to save");
            }

            console.log("Saving sequence data:", dataToSend);
            const response = await axios.post<{
                id: number;
                steps?: SequenceStepData[];
                message?: string;
            }>(`${API_BASE_URL}/job-sequence/save`, dataToSend);
            console.log("Sequence saved response:", response.data);

            // Update local state based on backend response
            if (response.data.id) {
                // If backend returns full updated sequence with step IDs:
                if (response.data.steps && Array.isArray(response.data.steps)) {
                    setSequence((prev) => ({
                        ...prev,
                        id: response.data.id,
                        steps: response.data.steps!.map((s) => ({
                            ...s,
                            heading: s.heading || "",
                        })),
                    }));
                } else {
                    // Only update the sequence ID if steps aren't returned or valid
                    setSequence((prevState) => ({
                        ...prevState,
                        id: response.data.id,
                    }));
                }
            }

            setSuccess(response.data.message || "Job description saved successfully!");
            setTimeout(() => setSuccess(""), 5000);
        } catch (err: unknown) {
            // Type error as unknown
            console.error("Error saving sequence:", err);
            let errorMsg = "Failed to save job description. Please try again.";
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<{ error?: string }>; // Type assertion
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
                    value={sequence.jobrole || ""}
                    onChange={handleJobroleChange}
                    className="text-lg font-semibold w-full border-none focus:ring-0 p-0 mb-2 outline-none"
                />
                <textarea
                    placeholder="Write a job description..."
                    value={sequence.description}
                    onChange={handleDescriptionChange}
                    className="text-sm text-gray-600 w-full border border-gray-200 rounded-md p-2 resize-none outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                    rows={3}
                />
            </div>

            {/* Steps Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Sequence Steps:</h4>
                    <button
                        onClick={addStep}
                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <Plus size={14} className="mr-1" /> Add Step
                    </button>
                </div>

                {/* Steps List */}
                {sequence.steps.length > 0 ? (
                    <div className="space-y-3">
                        {sequence.steps.map((step, index) => (
                            <div
                                key={step.id || index}
                                className="p-3 border rounded-md bg-gray-50"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center flex-grow mr-2">
                                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full mr-2 whitespace-nowrap">
                                            Step {step.step_number}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Step Heading"
                                            value={step.heading}
                                            onChange={(e) =>
                                                handleStepHeadingChange(index, e.target.value)
                                            }
                                            className="text-sm font-medium text-gray-700 border-none bg-transparent focus:ring-0 p-0 outline-none w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeStep(index)}
                                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                        title="Remove step"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <textarea
                                    value={step.body}
                                    onChange={(e) => handleStepBodyChange(index, e.target.value)}
                                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-md p-2 min-h-[80px] focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter content for this step..."
                                    rows={3}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-sm text-center py-8">
                        No sequence steps yet. Add steps to build your job description.
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
                    onClick={saveSequence}
                    disabled={loading}
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
                            <Save size={16} className="mr-1" /> Save Job Description
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SequenceCuratorView;
