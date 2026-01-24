import React from "react";
import { Link, NavLink } from "react-router-dom";
import { GitHubIcon } from "./Icons";

type SiteNavProps = {
  isHidden?: boolean;
  theme?: "light" | "dark";
};

export function SiteNav({ isHidden = false, theme = "light" }: SiteNavProps) {
  const isDark = theme === "dark";
  const logoSrc = isDark ? "/logo-white.png" : "/logo-black.png";

  const navLinkBase =
    "transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center text-sm";

  const getNavLinkClass = (isActive: boolean) => {
    if (isActive) {
      return `${navLinkBase} relative ${isDark ? "text-[#f4c98d]" : "text-[#c9a66b]"} after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-full after:rounded-full ${isDark ? "after:bg-[#f4c98d]" : "after:bg-[#c9a66b]"}`;
    }

    return `${navLinkBase} ${isDark ? "text-white/80 hover:text-[#f4c98d]" : "hover:text-[#c9a66b]"}`;
  };

  return (
    <header className="sticky top-6 z-50">
      <div className="mx-auto flex max-w-[1440px] items-center px-6 lg:px-12">
        <div
          className={`flex w-full items-center justify-center transition-all duration-300 ${
            isHidden ? "-translate-y-4 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
          }`}
        >
          <nav
            className={`flex items-center gap-6 rounded-full border-2 px-4 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-all duration-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${
              isDark
                ? "border-[#2f3642] bg-[#0b0f19] text-white"
                : "border-[#e5e7eb] bg-white text-[#6b7280]"
            }`}
          >
            <Link className="flex h-9 w-9 items-center justify-center" to="/" aria-label="QRAG Home">
              <img src={logoSrc} alt="QRAG Logo" className="h-7 w-7 object-contain" />
            </Link>
            <NavLink className={({ isActive }) => getNavLinkClass(isActive)} to="/process">
              Process
            </NavLink>
            <NavLink className={({ isActive }) => getNavLinkClass(isActive)} to="/results">
              Results
            </NavLink>
            <NavLink className={({ isActive }) => getNavLinkClass(isActive)} to="/about">
              About
            </NavLink>
            <a
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-semibold tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,166,107,0.35)] ${
                isDark
                  ? "bg-[#f4c98d] text-[#1f2937] hover:bg-[#f0bd73]"
                  : "bg-[#c9a66b] text-white hover:bg-[#b8955c]"
              }`}
              href="https://github.com/microsoft/qdk"
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
