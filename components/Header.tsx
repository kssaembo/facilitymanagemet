import React from 'react';
import type { ViewType } from '../types';

interface HeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const navItems: { key: ViewType; label: string }[] = [
    { key: 'request', label: '보수요청' },
    { key: 'check', label: '보수요청 확인' },
    { key: 'inspection', label: '시설 안전점검' },
    { key: 'admin', label: '관리자' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 drop-shadow-sm mb-6">
          시설 안전점검 및 보수요청서
        </h1>
        <nav className="flex flex-wrap justify-center items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveView(item.key)}
              className={`px-4 py-2 text-base font-semibold rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 ${
                activeView === item.key
                  ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg shadow-gray-400/50 scale-105'
                  : 'text-gray-600 bg-gradient-to-r from-gray-50 to-gray-200 shadow-sm hover:text-indigo-600 hover:scale-105'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;