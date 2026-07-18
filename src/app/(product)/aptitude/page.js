"use client";
import React, { useEffect, useState, useMemo } from "react";
import TabContent from '@/components/layout/TabContent';

const Homepage = () => {
  const [text, setText] = useState("");
  const isTyping = true;
  const tabs = [
    "Aptitude",
    "Verbal Reasoning",
    "Non Verbal Reasoning",
    "Verbal Ability",
    "Programming",
    "OS",
    "CN",
    "DBMS",
    "DSA",
    "COA",
    "SE",
  ];
  const defaultTab = "Aptitude";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState({});

  const apiEndpoint = "/api/aptitude/allsubtopics";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Make the API call directly
        const response1 = await fetch(apiEndpoint);
        if (!response1.ok) {
          throw new Error("Failed to fetch data");
        }

        const response = await response1.json();
        // Use response.data directly if that's the structure
        setData(response.subjectsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // No need to include `apiEndpoint` in dependencies as it's constant

  const messages = useMemo(
    () => [
      "Percentage",
      "Time and Work",
      "Profit and Loss.",
      "Number System",
      "Profit and Loss",
      "Averages",
      "Boats and Streams",
      "Functions",
    ],
    []
  );

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  console.log(data[0]?.subject);
  const tabContents = {
    Aptitude: (
      <div>
        {data[0]?.subject == "aptitude" &&
          Array.isArray(data[0]?.subtopics) && // Ensure topics is an array
          data[0]?.subtopics?.map((topic, i) => {
            return (
              <TabContent
                key={i}
                topics={topic}
                index={i}
                userData={userData}
              />
            );
          })}
      </div>
    ),
  };
  return (
    <div>
      {" "}
      <div>
        <div className="">
          <div className="rain-container">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="raindrop" />
            ))}
          </div>

          <section class="mt-8 text-gray-600 body-font">
            <div class="container mx-auto flex flex-col px-5 py-10 items-center">
              <div class="w-full md:w-2/3 flex flex-col mb-16">
                <div class="mt-4 mb-6 w-full p-4 border rounded-lg border-gray-200 shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700 px-12">
                  <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Prepare Gate
                  </h1>
                  <p class="mt-4 mb-2 text-base text-gray-500 sm:text-lg dark:text-gray-400">
                    Gear up, sharpen your mind, and conquer those aptitude
                    challenges – success awaits in your upcoming exams! 🚀✨{" "}
                  </p>
                </div>
                <div class="max-w-7xl">
                  <div className="mb-8 overflow-x-auto scrolling-touch">
                    <div className="flex border-b border-gray-200">
                      {tabs.map((tab) => (
                        <button
                          key={tab}
                          className={`${
                            activeTab === tab
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          } m-1 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 whitespace-nowrap`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">{tabContents[activeTab]}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
