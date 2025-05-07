import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 py-16 relative overflow-hidden">
      {/* Subtle curved lines in background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1350,0 1500,100"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 C1150,300 1350,100 1500,200"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-white text-3xl font-medium mb-3">
          Stay up to date
        </h2>
        <p className="text-gray-400 mb-8">
          We&apos;ll send you the latest proposals and keep you in the loop for
          important updates
        </p>

        {/* Email subscription form */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12 max-w-xl mx-auto">
          <input
            type="email"
            placeholder="Email Address"
            value={"email"}
            onChange={(e) => console.log("email", e.target.value)}
            required
            className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
          <button
            type="submit"
            className="bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Submit
          </button>
        </div>

        {/* Social media icons */}
        <div className="flex justify-center gap-6 mb-8">
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Github size={24} />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Twitter size={24} />
            <span className="sr-only">Twitter</span>
          </Link>
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            {/* <DiscordIcon size={24} /> */}
            <span className="sr-only">Discord</span>
          </Link>
        </div>

        {/* Copyright and links */}
        <div className="text-sm text-gray-500 mb-4">
          © 2025 Realms.Today LLC |{" "}
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Terms
          </Link>{" "}
          |{" "}
          <Link
            href="#"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
        </div>

        <Link
          href="#"
          className="text-gray-400 hover:text-white transition-colors text-sm block mb-4"
        >
          Read the Docs
        </Link>

        <div className="text-gray-500 text-sm">
          Powered by{" "}
          <Link
            href="#"
            className="text-white font-medium hover:text-gray-200 transition-colors"
          >
            Realms.Today
          </Link>
        </div>
      </div>
    </footer>
  );
};
