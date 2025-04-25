// magnecruit_frontend\src\components\ActionGridComponents\SequenceCuratorView.tsx

import React, { useState, useEffect } from "react";

// Define Sequence/Step interfaces (should match parent)
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

// Define props: receive the current sequence data
interface SequenceCuratorViewProps {
    currentSequence: SequenceData | null;
    // onSequenceUpdate: (updatedSequence: Partial<SequenceData>) => void; // For manual edits later
}

const SequenceCuratorView: React.FC<SequenceCuratorViewProps> = ({
    currentSequence /*, onSequenceUpdate */,
}) => {
    // Removed Mock data - use prop directly

    // Local state for editable fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Update local state when the prop changes
    useEffect(() => {
        setTitle(currentSequence?.name || "");
        setDescription(currentSequence?.description || "");
    }, [currentSequence]);

    const handleSave = () => {
        console.log("Save clicked (manual edit)");
        // TODO: Call prop function (onSequenceUpdate) or API endpoint to save changes
        // Pass back the ID and the changed fields
        // if (currentSequence) {
        //     onSequenceUpdate({ id: currentSequence.id, name: title, description });
        // }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
            {/* Top Section: Title & Description */}
            <div className="p-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-semibold w-full border-none focus:ring-0 p-0 mb-1 outline-none"
                />
                <textarea
                    placeholder="Write a description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-sm text-gray-500 w-full border-none focus:ring-0 p-0 resize-none outline-none h-10"
                    rows={1}
                />
            </div>

            {/* Middle Section: Steps Display */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sequence Steps:</h4>
                {currentSequence && currentSequence.steps.length > 0 ? (
                    currentSequence.steps.map((step) => (
                        <div key={step.id} className="p-3 border rounded-md bg-gray-50 text-sm">
                            <p className="font-medium text-xs text-gray-700 mb-1">
                                Step {step.step_number} ({step.channel}) - Delay:{" "}
                                {step.delay_days ?? 0} days
                            </p>
                            {step.subject && (
                                <p className="text-xs text-gray-500 mb-1 truncate">
                                    Subject: {step.subject}
                                </p>
                            )}
                            <p className="text-gray-800 whitespace-pre-wrap text-xs line-clamp-2">
                                {step.body}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 italic text-sm text-center py-4">
                        No sequence steps generated yet. Ask the AI in the chat!
                    </p>
                )}
            </div>

            {/* Bottom Section: Actions */}
            <div className="p-4 border-t border-gray-200 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                        disabled
                    >
                        Assign
                    </button>
                    <button
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                        disabled
                    >
                        Label
                    </button>
                    <button
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                        disabled
                    >
                        Due date
                    </button>
                    <button
                        className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 disabled:opacity-50"
                        disabled
                    >
                        Attach a file
                    </button>
                </div>
                <button
                    onClick={handleSave}
                    className="text-sm px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Save Sequence
                </button>
            </div>
        </div>
    );
};

export default SequenceCuratorView;
