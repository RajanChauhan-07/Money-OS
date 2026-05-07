"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogIn } from "lucide-react";
import Link from "next/link";

function NavHeader() {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <div className="relative group">
       <style>{`
          .nav-glass {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
              0 8px 32px 0 rgba(0, 0, 0, 0.08),
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          
          .nav-glass::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.4) 0%,
              rgba(255, 255, 255, 0.1) 20%,
              rgba(255, 255, 255, 0) 100%
            );
            pointer-events: none;
            z-index: 1;
            border-radius: 9999px 9999px 0 0;
          }
        `}</style>
        <ul
          className="nav-glass relative mx-auto flex w-fit rounded-full p-1.5 overflow-hidden transition-all duration-500"
          onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
        >
          <Tab setPosition={setPosition} href="/">Home</Tab>
          <Tab setPosition={setPosition}>Pricing</Tab>
          <Tab setPosition={setPosition}>About</Tab>
          <Tab setPosition={setPosition}>Services</Tab>
          <Tab setPosition={setPosition}>Contact</Tab>

          <div className="w-[1px] h-6 bg-white/20 self-center mx-2 z-20" />

          <Tab setPosition={setPosition}>
            <div className="flex items-center gap-1">
              English <ChevronDown className="w-4 h-4" />
            </div>
          </Tab>
          
          <Tab setPosition={setPosition} href="/login">
            <div className="flex items-center gap-2">
              Log in
            </div>
          </Tab>

          <Cursor position={position} />
        </ul>
    </div>
  );
}

const Tab = ({
  children,
  setPosition,
  href,
}: {
  children: React.ReactNode;
  setPosition: any;
  href?: string;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const content = (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className="relative z-20 block cursor-pointer px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-300 md:px-6 md:py-2.5 md:text-base whitespace-nowrap"
    >
      {children}
    </li>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-10 h-9 rounded-full bg-white/20 border border-white/40 shadow-[0_4px_12px_0_rgba(0,0,0,0.1)] backdrop-blur-md md:h-[42px]"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
};

export default NavHeader;
