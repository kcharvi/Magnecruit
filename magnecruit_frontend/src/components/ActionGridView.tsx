// magnecruit_frontend\src\components\ActionGridView.tsx

import React from "react";
import { ArrowUpRight } from "lucide-react";

// Interface for the action item
interface ActionItem {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    iconBgColor: string;
    iconColor: string;
}

// Interface for the action grid view props
interface ActionGridViewProps {
    actions: ActionItem[];
    onActionClick: (actionId: string) => void;
}

// Action grid view component
const ActionGridView: React.FC<ActionGridViewProps> = ({ actions, onActionClick }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {/* Map through the action items and render the action item */}
            {actions.map((action) => {
                const IconComponent = action.icon;
                return (
                    <div
                        key={action.id}
                        onClick={() => onActionClick(action.id)}
                        className="relative group bg-white p-6 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                    >
                        <ArrowUpRight
                            className="absolute top-4 right-4 h-5 w-5 text-gray-300 group-hover:text-gray-400 transition duration-150 ease-in-out"
                            aria-hidden="true"
                        />
                        <div className={`inline-flex p-3 rounded-lg ${action.iconBgColor} mb-4`}>
                            <IconComponent
                                className={`h-6 w-6 ${action.iconColor}`}
                                aria-hidden="true"
                            />
                        </div>
                        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">
                            {action.title}
                        </h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default ActionGridView;
