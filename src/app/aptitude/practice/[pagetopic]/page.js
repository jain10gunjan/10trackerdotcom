"use client";
import React, { useEffect, useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import toast from "react-hot-toast";
// import { topicData } from "./assests/aptitudetopicslist";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useParams } from "next/navigation";
import Head from "next/head";

const Pagetracker = () => {
  const { pagetopic } = useParams();
  const [data, setData] = useState([null]);

  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [data3, setData3] = useState([]);
  const [topicInfo, settopicInfo] = useState([]);

  const tabs = ["easy", "medium", "hard"];
  const defaultTab = "easy";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userData, setUserData] = useState({});
  //   const topicInfo = topicData[pagetopic];
  const chapterName = topicInfo.name;
  // const storageKey = topicInfo.storageKey;

  useEffect(() => {
    if (!pagetopic) {
      return;
    }

    const fetchData = async () => {
      console.log(pagetopic);
      try {
        const response1 = await fetch(
          `/api/aptitude/fetchdata?topic=${pagetopic}`
        );
        if (!response1.ok) {
          throw new Error("Failed to fetch data");
        }

        const response = await response1.json();

        // Assuming data comes with "difficulty" field (easy, medium, hard)
        const easyData = response?.filter((item) => item.difficulty === "easy");
        const mediumData = response?.filter(
          (item) => item.difficulty === "medium"
        );
        const hardData = response?.filter((item) => item.difficulty === "hard");

        setData(response); // All data
        setData1(easyData); // Easy level
        console.log(easyData);
        setData2(mediumData); // Medium level
        setData3(hardData); // Hard level
      } catch (error) {
        console.error("Failed to fetch data:", error.response || error.message);
        if (error.response) {
          console.error("Error response data:", error.response);
          console.error("Error response status:", error.response.status);
        }
      }
    };

    fetchData();
  }, [pagetopic]);

  // function customSort(a, b) {
  //   return a.id - b.id;
  // }

  // data.sort(customSort);

  const handleOptionClick = (option, id) => {
    const filteredData = data.filter((item) => item._id === id);

    if (option === filteredData[0]?.correct_option) {
      toast.success("Correct option");

      if (!userData[filteredData[0]?.topic]?.completedQuestions.includes(id)) {
        const topicData = userData[filteredData[0]?.topic] || {}; // Get topic data or default to an empty object
        const newCompletedQuestions = [
          ...(topicData.completedQuestions || []),
          id,
        ];
        const newCorrectlyAnsweredQuestionIds = [
          ...(topicData.correctlyAnsweredQuestionIds || []),
          filteredData[0]?._id,
        ];
        const newPreviouslyCorrectlyAnsweredQuestionIds = [
          ...(topicData.previouslyCorrectlyAnsweredQuestionIds || []),
          filteredData[0]?._id,
        ];
        const newPoints = (topicData.points || 0) + 100;

        const updatedUserData = {
          ...userData,
          [filteredData[0]?.topic]: {
            points: newPoints,
            completedQuestions: newCompletedQuestions,
            correctlyAnsweredQuestionIds: newCorrectlyAnsweredQuestionIds,
            previouslyCorrectlyAnsweredQuestionIds:
              newPreviouslyCorrectlyAnsweredQuestionIds,
            totalquestion: data.length,
          },
        };

        localStorage.setItem("userData", JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
      }
    } else {
      toast.error("Wrong option");
    }
  };

  const handleProgressFunction = (id) => {
    const filteredData = data.filter((item) => item._id === id);

    toast.success("Mark Completed...");

    if (!userData[filteredData[0]?.topic]?.completedQuestions.includes(id)) {
      const topicData = userData[filteredData[0]?.topic] || {}; // Get topic data or default to an empty object
      const newCompletedQuestions = [
        ...(topicData.completedQuestions || []),
        id,
      ];
      const newCorrectlyAnsweredQuestionIds = [
        ...(topicData.correctlyAnsweredQuestionIds || []),
        filteredData[0]?._id,
      ];
      const newPreviouslyCorrectlyAnsweredQuestionIds = [
        ...(topicData.previouslyCorrectlyAnsweredQuestionIds || []),
        filteredData[0]?._id,
      ];
      const newPoints = (topicData.points || 0) + 100;

      const updatedUserData = {
        ...userData,
        [filteredData[0]?.topic]: {
          points: newPoints,
          completedQuestions: newCompletedQuestions,
          correctlyAnsweredQuestionIds: newCorrectlyAnsweredQuestionIds,
          previouslyCorrectlyAnsweredQuestionIds:
            newPreviouslyCorrectlyAnsweredQuestionIds,
          totalquestion: data.length,
        },
      };

      localStorage.setItem("userData", JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
    }
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  useEffect(() => {
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
        processEscapes: true,
      },
      svg: {
        fontCache: "global",
      },
    };
  }, []);

  const tabContents = {
    easy: (
      <div className="overflow-x-auto">
        <h1 className="title-font sm:text-2xl text-2xl  font-medium text-gray-900">
          Easy Level Questions{" "}
        </h1>
        <h3 className="title-font sm:text-sm text-xs mb-4 font-medium text-gray-600">
          Total Questions: {data1?.length}
        </h3>
        <MathJaxContext>
          {data1?.map((index, i) => (
            <div key={i}>
              {index?.question?.trim() ? (
                <div key={index._id}>
                  <div className="relative question-numbercontainer">
                    <p className="text-xs text-gray-600">
                      Topic : {index.topic.replace(/-/g, " ")}{" "}
                    </p>
                    <p className="text-xs text-gray-600">Year : {index.year}</p>
                    <p className="mt-2 text-xs text-gray-400 justify-end">
                      {" "}
                      {userData[index?.topic]?.completedQuestions.includes(
                        index._id.toString()
                      )
                        ? "Attempted"
                        : "Not Attempted"}{" "}
                      {userData[index?.topic]?.completedQuestions.length != null
                        ? Math.round(
                            (userData[index?.topic]?.completedQuestions.length /
                              data.length) *
                              100
                          )
                        : 0}{" "}
                      % Module Completed{" "}
                    </p>
                  </div>
                  <MathJax>
                    <div className="questioncontainer">
                      {index?.questionextratext != "No extra text available" ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: index.questionextratext,
                          }}
                        />
                      ) : null}
                      Q{i + 1 + ": "}{" "}
                      <p dangerouslySetInnerHTML={{ __html: index.question }} />
                      {index?.questionImage ? (
                        <img src={index?.questionImage} alt="QuestionImage" />
                      ) : null}
                      {index?.questionCode ? (
                        <SyntaxHighlighter language="cpp" style={docco}>
                          {index?.questionCode}
                        </SyntaxHighlighter>
                      ) : null}
                    </div>
                  </MathJax>
                  {index.options_A && (
                    <div
                      id={i}
                      className="flex-col leading-none optionscontainer"
                    >
                      <MathJax>
                        <div
                          onClick={() => handleOptionClick("A", index._id)}
                          id="A"
                          dangerouslySetInnerHTML={{ __html: index.options_A }}
                        ></div>
                      </MathJax>
                      <MathJax>
                        <div
                          onClick={() => handleOptionClick("B", index._id)}
                          id="B"
                          dangerouslySetInnerHTML={{ __html: index.options_B }}
                        ></div>
                      </MathJax>
                      <MathJax>
                        <div
                          onClick={() => handleOptionClick("C", index._id)}
                          id="C"
                          dangerouslySetInnerHTML={{ __html: index.options_C }}
                        ></div>
                      </MathJax>
                      <MathJax>
                        <div
                          onClick={() => handleOptionClick("D", index._id)}
                          id="D"
                          dangerouslySetInnerHTML={{ __html: index.options_D }}
                        ></div>
                      </MathJax>
                    </div>
                  )}

                  <div></div>
                  <div className="relative mt-0 mb-20 flex flex-wrap items-center">
                    {/* Accordian */}
                    <details className="py-2 group">
                      <summary className="hover:bg-gray-400 text-xs mr-2 py-1.5 px-4 text-gray-600 bg-green-100 rounded-2xl">
                        View Solution
                      </summary>
                      <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                        {/* Correct Option:  <span dangerouslySetInnerHTML={{ __html: index.correct_option}}></span> */}

                        <p>Correct Option: {index.correct_option}</p>
                        <a
                          href={index.solution}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          See Solution:{" "}
                          <span
                            dangerouslySetInnerHTML={{ __html: index.solution }}
                          ></span>
                        </a>
                      </div>
                    </details>
                    {!index.options_A && (
                      <button
                        onClick={() => handleProgressFunction(index._id)}
                        class="absolute bottom-0 right-0   hover:bg-gray-400 text-xs mr-2 py-1.5 px-4 text-gray-600 bg-green-100 rounded-2xl"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </MathJaxContext>
      </div>
    ),
    medium: (
      <div>
        <h1 className="title-font sm:text-2xl text-2xl font-medium text-gray-900">
          Medium Level Questions{" "}
        </h1>
        <h3 className="title-font sm:text-sm text-xs mb-4 font-medium text-gray-600">
          Total Questions: {data2?.length}
        </h3>
        <MathJaxContext>
          {data2?.map((index, i) => (
            <div key={i}>
              {index?.question?.trim() ? (
                <div key={index._id}>
                  <div className="relative question-numbercontainer">
                    <p className="text-xs text-gray-600">
                      Topic : {index.topic.replace(/-/g, " ")}{" "}
                    </p>
                    <p className="text-xs text-gray-600">Year : {index.year}</p>
                    <p className="mt-2 text-xs text-gray-400 justify-end">
                      {" "}
                      {userData[index?.topic]?.completedQuestions.includes(
                        index._id.toString()
                      )
                        ? "Attempted"
                        : "Not Attempted"}{" "}
                      {userData[index?.topic]?.completedQuestions.length != null
                        ? Math.round(
                            (userData[index?.topic]?.completedQuestions.length /
                              data.length) *
                              100
                          )
                        : 0}{" "}
                      % Module Completed{" "}
                    </p>
                  </div>
                  <MathJax>
                    <div className="questioncontainer">
                      {index?.questionextratext != "No extra text available" ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: index.questionextratext,
                          }}
                        />
                      ) : null}
                      Q{i + 1 + ": "}{" "}
                      <span
                        dangerouslySetInnerHTML={{ __html: index.question }}
                      />
                      {index?.questionImage ? (
                        <img src={index?.questionImage} alt="QuestionImage" />
                      ) : null}
                      {index?.questionCode ? (
                        <SyntaxHighlighter language="cpp" style={docco}>
                          {index?.questionCode}
                        </SyntaxHighlighter>
                      ) : null}
                    </div>
                  </MathJax>
                  <div
                    id={i}
                    className="flex-col leading-none optionscontainer"
                  >
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("A", index._id)}
                        id="A"
                        dangerouslySetInnerHTML={{ __html: index.options_A }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("B", index._id)}
                        id="B"
                        dangerouslySetInnerHTML={{ __html: index.options_B }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("C", index._id)}
                        id="C"
                        dangerouslySetInnerHTML={{ __html: index.options_C }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("D", index._id)}
                        id="D"
                        dangerouslySetInnerHTML={{ __html: index.options_D }}
                      ></div>
                    </MathJax>
                  </div>
                  <div></div>
                  <div className="relative mt-0 mb-20 flex flex-wrap items-center">
                    {/* Accordian */}
                    <details className="py-2 group">
                      <summary className="hover:bg-gray-400 text-xs mr-2 py-1.5 px-4 text-gray-600 bg-green-100 rounded-2xl">
                        View Solution
                      </summary>
                      <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                        {/* Correct Option:  <span dangerouslySetInnerHTML={{ __html: index.correct_option}}></span> */}

                        <p>Correct Option: {index.correct_option}</p>
                        <div>
                          See Solution:{" "}
                          <span
                            dangerouslySetInnerHTML={{ __html: index.solution }}
                          ></span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </MathJaxContext>
      </div>
    ),
    hard: (
      <div>
        <h1 className="title-font sm:text-2xl text-2xl font-medium text-gray-900">
          Hard Level Questions{" "}
        </h1>
        <h3 className="title-font sm:text-sm text-xs mb-4 font-medium text-gray-600">
          Total Questions: {data3?.length}
        </h3>
        <MathJaxContext>
          {data3?.map((index, i) => (
            <div key={i}>
              {index?.question?.trim() ? (
                <div key={index._id}>
                  <div className="relative question-numbercontainer">
                    <p className="text-xs text-gray-600">
                      Topic : {index.topic.replace(/-/g, " ")}{" "}
                    </p>
                    <p className="text-xs text-gray-600">Year : {index.year}</p>

                    <p className="mt-2 text-xs text-gray-400 justify-end">
                      {" "}
                      {userData[index?.topic]?.completedQuestions.includes(
                        index._id.toString()
                      )
                        ? "Attempted"
                        : "Not Attempted"}{" "}
                      {userData[index?.topic]?.completedQuestions.length != null
                        ? Math.round(
                            (userData[index?.topic]?.completedQuestions.length /
                              data.length) *
                              100
                          )
                        : 0}{" "}
                      % Module Completed{" "}
                    </p>
                  </div>
                  <MathJax>
                    <div className="questioncontainer">
                      {index?.questionextratext != "No extra text available" ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: index.questionextratext,
                          }}
                        />
                      ) : null}
                      Q{i + 1 + ": "}{" "}
                      <span
                        dangerouslySetInnerHTML={{ __html: index.question }}
                      />
                      {index?.questionImage ? (
                        <img src={index?.questionImage} alt="QuestionImage" />
                      ) : null}
                      {index?.questionCode ? (
                        <SyntaxHighlighter language="cpp" style={docco}>
                          {index?.questionCode}
                        </SyntaxHighlighter>
                      ) : null}
                    </div>
                  </MathJax>
                  <div
                    id={i}
                    className="flex-col leading-none optionscontainer"
                  >
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("A", index._id)}
                        id="A"
                        dangerouslySetInnerHTML={{ __html: index.options_A }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("B", index._id)}
                        id="B"
                        dangerouslySetInnerHTML={{ __html: index.options_B }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("C", index._id)}
                        id="C"
                        dangerouslySetInnerHTML={{ __html: index.options_C }}
                      ></div>
                    </MathJax>
                    <MathJax>
                      <div
                        onClick={() => handleOptionClick("D", index._id)}
                        id="D"
                        dangerouslySetInnerHTML={{ __html: index.options_D }}
                      ></div>
                    </MathJax>
                  </div>
                  <div></div>
                  <div className="relative mt-0 mb-20 flex flex-wrap items-center">
                    {/* Accordian */}
                    <details className="py-2 group">
                      <summary className="hover:bg-gray-400 text-xs mr-2 py-1.5 px-4 text-gray-600 bg-green-100 rounded-2xl">
                        View Solution
                      </summary>
                      <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                        {/* Correct Option:  <span dangerouslySetInnerHTML={{ __html: index.correct_option}}></span> */}

                        <p>Correct Option: {index.correct_option}</p>
                        <a
                          href={index.solution}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          See Solution:{" "}
                          <span
                            dangerouslySetInnerHTML={{ __html: index.solution }}
                          ></span>
                        </a>
                      </div>
                    </details>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </MathJaxContext>
      </div>
    ),
  };

  if (data == null) {
    return (
      <div className="loader flex justify-center items-center h-screen">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6 animate-spin"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>{" "}
        <p>Loading...</p>
      </div>
    );
  }
  return (
    <div className="app overflow-x-hidden">
      <Head>
        <title>{pagetopic}</title>
      </Head>
      <section className="mt-20 text-gray-600 body-font">
        <div className="container mx-auto flex flex-col px-5 py-10 justify-center items-center">
          <div className="w-full md:w-2/3 flex flex-col mb-16">
            <h1 className="title-font sm:text-4xl text-3xl mb-2 font-medium text-gray-900">
              {data[0]?.subject?.replace(/-/g, " ").toUpperCase()} |{" "}
              {data[0]?.topic?.replace(/-/g, " ").toUpperCase()}
              <p className="text-sm text-gray-600">
                Total Questions: {data.length}{" "}
              </p>
              <p className="text-sm text-gray-600">
                Points Gained:{" "}
                {userData[data[0]?.topic]?.points != null
                  ? userData[data[0]?.topic]?.points
                  : "0"}{" "}
              </p>
            </h1>
            <p className="mb-8 leading-relaxed">
              Practice {chapterName} questions and improve your problem-solving
              skills with our comprehensive collection of multiple choice
              questions and answers.
            </p>

            {/* <Adsense dataAdSlot='9103370999' /> */}

            <div className="w-full h-4 bg-gray-400 rounded-full mb-4">
              <div
                className="bg-green-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
                style={{
                  width: `${Math.round(
                    (userData[data[0]?.topic]?.completedQuestions.length != null
                      ? userData[data[0]?.topic]?.completedQuestions.length /
                        data.length
                      : "0") * 100
                  )}%`,
                }}
              >
                {" "}
                {userData[data[0]?.topic]?.completedQuestions.length != null
                  ? Math.round(
                      (userData[data[0]?.topic]?.completedQuestions.length /
                        data.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>

            <div className="mb-8 overflow-x-auto scrolling-touch">
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } px-4 py-2 border-b-2 font-medium whitespace-nowrap`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="">{tabContents[activeTab]}</div>
          </div>
        </div>
      </section>

</div>
  );
};

export default Pagetracker;
