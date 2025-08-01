import Link from "next/link";
import React from "react";
import { DiscordIcon, GithubIcon, TwitterIcon } from "./icons";
import Image from "next/image";

export const Footer = () => {
  return (
    <div className="bg-black text-gray-300 py-16 relative">
      <div className="absolute top-0 inset-0">
        <Image
          src="/assets/footer-image.jpg"
          alt="Footer Background"
          fill
          className="object-cover w-auto h-full max-h-[140px] md:max-h-full min-w-full"
          priority
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        {/* <h2 className="text-white text-3xl font-medium mb-3">
          Stay up to date
        </h2>
        <p className="text-gray-400 mb-8">
          We&apos;ll send you the latest proposals and keep you in the loop for
          important updates
        </p> */}

        {/* Email subscription form */}
        {/* <div className="flex flex-col sm:flex-row gap-3 mb-12 max-w-xl mx-auto">
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
        </div> */}

        {/* Social media icons */}
        <div className="flex justify-center gap-6 mb-8">
          <Link
            className="text-gray-400 hover:text-white transition-colors"
            href="https://github.com/3uild-3thos/govcontract"
            target="_blank"
          >
            <GithubIcon />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link
            className="text-gray-400 hover:text-white transition-colors"
            href="https://x.com/realmsdaos"
            target="_blank"
          >
            <TwitterIcon />
            <span className="sr-only">X</span>
          </Link>
          <Link
            className="text-gray-400 hover:text-white transition-colors"
            href="https://discord.com/channels/910194960941338677/910197899420397588"
            target="_blank"
          >
            <DiscordIcon />
            <span className="sr-only">Discord</span>
          </Link>
        </div>

        {/* Copyright and links */}
        <div className="text-sm text-dao-text-secondary mb-4">
          © 2025 Realms.Today LLC |{" "}
          <Link
            href="https://www.realms.today/terms"
            className="hover:text-white transition-colors underline"
            target="_blank"
          >
            Terms
          </Link>{" "}
          |{" "}
          <Link
            href="https://www.realms.today/privacy-policy"
            className="hover:text-white transition-colors underline"
            target="_blank"
          >
            Privacy Policy
          </Link>
        </div>

        <Link
          href="https://github.com/3uild-3thos/govcontract#solana-validator-governance-system"
          className="hover:text-white transition-colors text-dao-text-secondary text-sm block mb-4"
          target="_blank"
        >
          Read the Docs
        </Link>

        <div className="text-dao-text-secondary text-md">
          Powered by{" "}
          <Link
            href="https://www.realms.today/"
            className="text-white font-bold hover:text-gray-200 transition-colors"
            target="_blank"
          >
            Realms.Today
          </Link>
        </div>
      </div>
    </div>
  );
};
