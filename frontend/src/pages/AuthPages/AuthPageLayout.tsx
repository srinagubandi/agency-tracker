import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-[#1a5276] dark:bg-[#0d2d3e] lg:grid">
          <div className="relative flex items-center justify-center z-1">
            <div className="flex flex-col items-center max-w-xs gap-6 text-center px-8">
              <Link to="/" className="block">
                <img
                  src="/hsd-logo.png"
                  alt="Health Scale Digital"
                  className="w-64 brightness-0 invert"
                />
              </Link>
              <h2 className="text-xl font-bold text-white">Agency Tracker</h2>
              <p className="text-blue-200 text-sm leading-relaxed">
                Manage clients, campaigns, time tracking, and reporting — all in one place.
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
