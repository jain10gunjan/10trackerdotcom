import React from "react";

const page = () => {
  const data = [
    {
      id: 1,
      title: "HTML CSS Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/html-css",
    },

    {
      id: 3,
      title: "JavaScript Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/javascript",
    },
    {
      id: 4,
      title: "ReactJS Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/reactjs",
    },
    {
      id: 5,
      title: "NextJS Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/nextjs",
    },
    {
      id: 6,
      title: "NodeJS Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/nodejs",
      color: "text-gray-300",
    },
    {
      id: 7,
      title: "MongoDB Prep",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/mongodb",
      color: "text-gray-300",
    },
    {
      id: 7,
      title: "Projects MERN Stack ",
      desc: "Plan it, create it, launch it. Collaborate seamlessly with all the organization and hit your marketing goals every month with our marketing plan.",
      url: "/web-development/mern-projects",
      color: "text-gray-300",
    },
  ];
  return (
    <div>
      <div className="py-24 px-4 mx-auto max-w-screen-xl sm:py-24 lg:px-6">
        <div className="md:w-2/3 lg:w-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-secondary"
          >
            <path
              fill-rule="evenodd"
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z"
              clip-rule="evenodd"
            ></path>
          </svg>

          <h2 className="my-8 text-2xl font-bold text-gray-700  md:text-4xl">
            Explore a wide range of subjects, all in one place.
          </h2>
          <p className="text-gray-600 ">
            Discover a comprehensive selection of subjects tailored for your
            learning needs. From foundational concepts to advanced topics,
            access everything in one platform. Practice, track progress, and
            master each subject effortlessly!
          </p>
        </div>
        <div className="mt-16 grid divide-x divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-3xl border border-gray-100 text-gray-600 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 xl:grid-cols-4">
          {data.slice(0, 4).map((data, index) => (
            <div key={data.id} className="group relative  ">
              <div className="relative space-y-8 py-12 p-8 transition duration-300 group-hover:bg-white dark:group-hover:bg-gray-200 hover:cursor-pointer ">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4341/4341025.png"
                  className="w-12"
                  width="512"
                  height="512"
                  alt="burger illustration"
                />

                <div className="space-y-2">
                  <h5
                    className={`text-xl font-semibold ${
                      data.color ? data.color : "text-gray-700"
                    }   transition group-hover:text-secondary `}
                  >
                    {data.title}
                  </h5>
                  <p
                    className={`${data.color ? data.color : "text-gray-700"} `}
                  >
                    {data.desc}
                  </p>
                </div>
                <a
                  href={data.url}
                  className="flex items-center justify-between group-hover:text-secondary"
                >
                  {data.color ? null : <span className="text-sm">Explore</span>}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 -translate-x-4 text-2xl opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 grid divide-x divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-3xl border border-gray-100 text-gray-600 dark:border-gray-700 sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 xl:grid-cols-4">
          {data.slice(4, 8).map((data, index) => (
            <div key={data.id} className="group relative  ">
              <div className="relative space-y-8 py-12 p-8 transition duration-300 group-hover:bg-white dark:group-hover:bg-gray-200 hover:cursor-pointer">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4341/4341025.png"
                  className="w-12"
                  width="512"
                  height="512"
                  alt="burger illustration"
                />

                <div className="space-y-2">
                  <h5
                    className={`text-xl font-semibold ${
                      data.color ? data.color : "text-gray-700"
                    }   transition group-hover:text-secondary `}
                  >
                    {data.title}
                  </h5>
                  <p
                    className={`${data.color ? data.color : "text-gray-700"} `}
                  >
                    {data.desc}
                  </p>
                </div>
                <a
                  href={data.url}
                  className="flex items-center justify-between group-hover:text-secondary"
                >
                  {data.color ? null : <span className="text-sm">Explore</span>}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 -translate-x-4 text-2xl opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;
