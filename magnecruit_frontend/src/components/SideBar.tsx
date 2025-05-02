// magnecruit_frontend\src\components\SideBar.tsx

import React from "react";
import {
    Home,
    Search,
    CalendarDays,
    PhoneCall,
    Settings,
    LifeBuoy,
    ChevronDown,
    LucideProps,
} from "lucide-react";
import { Conversations, Users } from "../lib/types";
import Avatar from "./Avatar";

interface SidebarProps {
    conversations: Conversations[];
    selectedConversationId: number | null;
    currentUser: Users | null;
    onConversationSelect: (id: number | null) => void;
    onNewChat: () => void;
    onLoginClick: () => void;
    onLogoutClick: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ForwardRefExoticComponent<
        Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    active: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    conversations,
    selectedConversationId,
    currentUser,
    onConversationSelect,
    onNewChat,
    onLoginClick,
    onLogoutClick,
}) => {

    const navigation: NavItem[] = [
        { name: "Home", href: "#", icon: Home, active: true },
        { name: "Meetings", href: "#", icon: CalendarDays, active: false },
        { name: "Contacts", href: "#", icon: PhoneCall, active: false },
        { name: "Settings", href: "#", icon: Settings, active: false },
    ];

    // Handlers for the Navigation Items
    const getNavClasses = (active: boolean) => {
        return `
          group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6
          ${
              active
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }
        `;
    };

    // Handlers for the Secondary Navigation Items
    const getSecondaryNavClasses = (itemId: number, selectedId: number | null) => {
        const baseClasses =
            "text-gray-700 hover:text-gray-900 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium cursor-pointer";
        const activeClasses = "bg-gray-100 font-semibold";
        return `${baseClasses} ${itemId === selectedId ? activeClasses : "hover:bg-gray-100"}`;
    };

    return (
        <div className="flex grow flex-col gap-y-5 border-r border-gray-200 bg-white px-6 pb-4 h-full">

            {/* Side Bar Header */}
            <div className="flex h-16 shrink-0 items-center gap-x-2">
                <img className="h-8 w-auto" src="/src/assets/logo_128x128.png" alt="Magnecruit" />
                <span className="font-semibold text-gray-800">Magnecruit</span>
                <ChevronDown className="ml-auto h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>

            {/* Side Bar Body */}
            <nav className="flex flex-1 flex-col min-h-0">
                <ul role="list" className="flex flex-1 flex-col gap-y-7 min-h-0">

                    {/* Navigation Items */}
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            <li>
                                <a href="#" className={getNavClasses(false)}>
                                    <Search
                                        className="h-5 w-5 shrink-0 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    Search
                                </a>
                            </li>
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <a href={item.href} className={getNavClasses(item.active)}>
                                        <item.icon
                                            className={`h-5 w-5 shrink-0 ${
                                                item.active
                                                    ? "text-gray-700"
                                                    : "text-gray-400 group-hover:text-gray-700"
                                            }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </li>

                    {/* Chat History */}
                    <li className="flex flex-col flex-1 min-h-0">
                        <div className="px-3 text-xs font-semibold leading-6 text-gray-500">
                            Chat History
                        </div>
                        <div className="-mx-2 mt-1 mb-1">
                            <button
                                onClick={onNewChat}
                                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium w-full text-left cursor-pointer"
                            >
                                + New Chat
                            </button>
                        </div>
                        <ul role="list" className="-mx-2 space-y-1 overflow-y-auto flex-1">
                            {conversations.map((convo) => (
                                <li key={convo.id}>
                                    <div
                                        onClick={() => onConversationSelect(convo.id)}
                                        className={getSecondaryNavClasses(
                                            convo.id,
                                            selectedConversationId
                                        )}
                                    >
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-[0.625rem] font-medium text-gray-500 group-hover:border-gray-400 group-hover:text-gray-600">
                                            {convo.id}
                                        </span>
                                        <span className="truncate">
                                            {convo.title || `Chat ${convo.id}`}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </li>

                    {/* Side Bar Footer */}
                    <li className="mt-auto">
                        <button className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left">
                            <LifeBuoy
                                className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-700"
                                aria-hidden="true"
                            />
                            Support
                        </button>

                        <div className="mt-4 border-t border-gray-200 pt-4">
                            {currentUser ? (
                                <div className="space-y-2">
                                    <div className="group -mx-2 flex items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700">
                                        <Avatar
                                            src="/src/assets/logo_32x32.png"
                                            alt={currentUser.username || "User"}
                                            size="sm"
                                        />
                                        <span className="flex-grow">
                                            <span className="block font-semibold">
                                                {currentUser.username || "User"}
                                            </span>
                                            <span className="block text-xs text-gray-500">
                                                {currentUser.email}
                                            </span>
                                        </span>
                                    </div>
                                    <button
                                        onClick={onLogoutClick}
                                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-red-600 hover:bg-gray-100 hover:text-red-700 w-full text-left cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onLoginClick}
                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left cursor-pointer"
                                >
                                    Log In
                                </button>
                            )}
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
