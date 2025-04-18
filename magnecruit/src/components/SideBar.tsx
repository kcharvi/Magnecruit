import React from 'react';
import {
  Home,
  Search,
  CalendarDays,
  PhoneCall,
  Settings,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  LucideProps,
} from 'lucide-react';
import Avatar from './Avatar';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  active: boolean;
}

interface SecondaryNavItem {
  name: string;
  href: string;
  initial: string; 
}

const Sidebar: React.FC = () => {
  const navigation: NavItem[] = [
    { name: 'Home', href: '#', icon: Home, active: true },
    { name: 'Meetings', href: '#', icon: CalendarDays, active: false },
    { name: 'Contacts', href: '#', icon: PhoneCall, active: false },
    { name: 'Settings', href: '#', icon: Settings, active: false },
  ];

  const secondaryNavigation: SecondaryNavItem[] = [
    { name: 'Recruit Outreach 1', href: '#', initial: '1' },
    { name: 'Recruit Outreach 2', href: '#', initial: '2' },
  ];

  const getNavClasses = (active: boolean) => {
    return `
      group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium leading-6
      ${
        active
          ? 'bg-gray-200 text-gray-900' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' 
      }
    `;
  };
  return (

<div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 h-full">
      {/* Top Logo/Dropdown Area */}
      <div className="flex h-16 shrink-0 items-center gap-x-2">
        <img
          className="h-8 w-auto"
          src="/src/assets/logo_128x128.png"
          alt="Magnecruit"
        />
        <span className="font-semibold text-gray-800">Magnecruit</span>
        <ChevronDown className="ml-auto h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>

      {/* Navigation Sections */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Primary Navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {/* Top Search/Inbox Links */}
              <li>
                <a href="#" className={getNavClasses(false)}>
                  <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  Search
                </a>
              </li>
              {/* Main Nav Items */}
              {navigation.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className={getNavClasses(item.active)}>
                    <item.icon
                      className={`h-5 w-5 shrink-0 ${item.active ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-700'}`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>

          {/* Secondary Navigation Chat History style */}
          <li>
            <div className="px-3 text-xs font-semibold leading-6 text-gray-500">Chat History</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
                  >
                    {/* Optional: Add a colored dot or initial here if needed */}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-[0.625rem] font-medium text-gray-500 group-hover:border-gray-400 group-hover:text-gray-600">
                      {item.initial}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>

          {/* Bottom Section (Pushed down) */}
          <li className="mt-auto">
             <a
              href="#"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <LifeBuoy className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-700" aria-hidden="true" />
              Support
            </a>

            {/* User Profile Section */}
            <div className="mt-4 border-t border-gray-200 pt-4">
                 <a href="#" className="group -mx-2 flex items-center gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                   <Avatar src="/src/assets/logo_32x32.png" alt="Magnecruit" size="sm"/>
                   <span className="flex-grow">
                       <span className="block font-semibold">Magnec</span>
                       <span className="block text-xs text-gray-500">magnec@example.com</span>
                   </span>
                   <ChevronUp className="ml-auto h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                 </a>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;