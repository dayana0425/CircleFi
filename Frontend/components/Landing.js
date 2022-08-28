import Head from "next/head";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Image from "next/image";

import HeroBG from "../public/images/hero-bg.jpg";
import CircleRotating from "../public/images/circle-rotating.svg";

export default function Landing({ children }) {
  const { data: account } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    // <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div>
      <Head>
        <title>CircleFi</title>
        <meta
          name="description"
          content="Find, join, and create virtual events with your web3 frens"
        />
      </Head>
      <section className="py-24 landing-section">
        <div className="flex flex-row mx-64">
          <div className="w-full md:w-8/12 text-left">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="text-white">Move in the right </span>
              <span className="text-white">circles</span>
            </h1>
            <p className="mt-3 text-base text-gray-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Create and join circles of like-minded savers
              <br></br>
              Build your wealth and community by saving together
            </p>
            <div className="">
              {account ? (
                <div className="loggedin-buttons mt-12 gap-6">
                  <Link href="/all-circles">
                    <a className="inline-flex items-center px-8 py-4 border border-transparent text-md font-medium rounded-md text-indigo-700 border border-indigo-100 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Enter App
                    </a>
                  </Link>
                  <Link href="/my-circles/member">
                    <a className="inline-flex items-center px-8 py-4 border border-transparent text-md  font-medium rounded-md text-indigo-700 border border-indigo-100 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      My Circles
                    </a>
                  </Link>
                </div>
              ) : (
                <div className="loggedout-buttons mt-12">
                  <Link href="/all-circles">
                    <a className="inline-flex items-center px-8 py-4 border border-transparent text-md font-medium rounded-md text-indigo-700 border border-indigo-100 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Enter App
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="spinning-circle-container  animate-spin-slow">
            <Image
              className="spinning-circle"
              src={CircleRotating}
              height="460px"
            />
          </div>
        </div>
      </section>
      {/* <section className="py-12">{children}</section> */}
      <div className="my-12 mx-64">
        <h1 className="text-3xl tracking-tight font-semibold text-gray-600">Savings Circles on the Blockchain</h1>
        <div className="mt-4 text-m text-gray-600">
          Before there were credit, microloans, or online crowdfunding, there
          were savings circles: a centuries-old system of informal lending where
          friends and family help eachother save for short-term goals.
          Members of a savings circle agree to equally contribute money to a collective fund on a
          regular basis. A member is selected to receive the full amount, which continues on a rotating basis until every member has had a chance to receive the full amount. We at CircleFi have made a new twist to savings circles by allowing savers across the world to organize over the internet, while leveraging Web 3 blockchain technology to create a safer and more secure savings circle for the modern age.
        </div>
      </div>
      <div className="my-12 mx-64">
        <h1 className="text-3xl tracking-tight font-semibold text-gray-600">How CircleFi Works</h1>
        <div className="mt-4 text-m text-gray-600">
          Add a graphic here detailing how the savings circle works / how the blockchain stuff works
        </div>
      </div>
    </div>
  );
}
