'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('https://sarkariresult.com.im/ongc-apprentice-recruitment/');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/ongc-apprentice?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">ONGC Recruitment Scraper</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to scrape"
          className="w-full p-3 border rounded-lg mb-3"
        />
        <button
          onClick={handleScrape}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Scraping...' : 'Scrape Data'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Job Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">{data.jobTitle || data.postName}</h2>
            <p className="text-gray-600 mb-2">Organization: {data.organization}</p>
            {data.totalVacancies && (
              <p className="text-gray-600 mb-2">Total Vacancies: {data.totalVacancies}</p>
            )}
            {data.jobSummary && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-sm text-gray-700">{data.jobSummary}</p>
              </div>
            )}
          </div>

          {/* Important Dates */}
          {data.dates && Object.keys(data.dates).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Important Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                {data.dates.applicationStart && (
                  <div>
                    <span className="font-semibold">Application Start: </span>
                    <span>{data.dates.applicationStart}</span>
                  </div>
                )}
                {data.dates.applicationEnd && (
                  <div>
                    <span className="font-semibold">Application End: </span>
                    <span>{data.dates.applicationEnd}</span>
                  </div>
                )}
                {data.dates.examDate && (
                  <div>
                    <span className="font-semibold">Exam Date: </span>
                    <span>{data.dates.examDate}</span>
                  </div>
                )}
                {data.dates.admitCardRelease && (
                  <div>
                    <span className="font-semibold">Admit Card: </span>
                    <span>{data.dates.admitCardRelease}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tables with Links */}
          {data.detailedContent?.allTables && data.detailedContent.allTables.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Tables</h3>
              {data.detailedContent.allTables.map((table, index) => (
                <div key={index} className="overflow-x-auto mb-6">
                  <table className="min-w-full border">
                    <tbody>
                      {table.map((row, i) => (
                        <tr key={i} className={i === 0 ? "bg-gray-100" : ""}>
                          {row.map((cell, j) => (
                            <td key={j} className="border p-2">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Show links from this table */}
                  {data.importantLinks?.linksFromTables && 
                   data.importantLinks.linksFromTables.filter(link => link.tableRow === index + 1).length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <h4 className="font-semibold mb-2">Links from this table:</h4>
                      <ul className="space-y-1">
                        {data.importantLinks.linksFromTables
                          .filter(link => link.tableRow === index + 1)
                          .map((link, linkIndex) => (
                            <li key={linkIndex}>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {link.text}
                              </a>
                              {link.cellContent && (
                                <span className="text-gray-600 text-sm ml-2">({link.cellContent.substring(0, 50)}...)</span>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Links from Tables Section */}
          {data.importantLinks?.linksFromTables && data.importantLinks.linksFromTables.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Important Links from Tables</h3>
              <div className="space-y-3">
                {data.importantLinks.linksFromTables.map((link, index) => (
                  <div key={index} className="p-3 border rounded hover:bg-gray-50">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {link.text}
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Row {link.tableRow}: {link.cellContent}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Important Links */}
          {data.importantLinks?.allImportantLinks && data.importantLinks.allImportantLinks.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">All Important Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {data.importantLinks.applyOnline && (
                  <div className="p-3 bg-green-50 rounded">
                    <span className="font-semibold">Apply Online: </span>
                    <a href={data.importantLinks.applyOnline} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Click here
                    </a>
                  </div>
                )}
                {data.importantLinks.officialNotification && (
                  <div className="p-3 bg-yellow-50 rounded">
                    <span className="font-semibold">Notification: </span>
                    <a href={data.importantLinks.officialNotification} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Download
                    </a>
                  </div>
                )}
                {data.importantLinks.downloadAdmitCard && (
                  <div className="p-3 bg-purple-50 rounded">
                    <span className="font-semibold">Admit Card: </span>
                    <a href={data.importantLinks.downloadAdmitCard} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Download
                    </a>
                  </div>
                )}
                {data.importantLinks.checkResult && (
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="font-semibold">Result: </span>
                    <a href={data.importantLinks.checkResult} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Check
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">All Links ({data.importantLinks.allImportantLinks.length}):</h4>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {data.importantLinks.allImportantLinks.map((link, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${link.source === 'table' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {link.source}
                      </span>
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Eligibility Criteria */}
          {data.eligibilityCriteria && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Eligibility Criteria</h3>
              {data.eligibilityCriteria.ageLimit && (
                <div className="mb-3">
                  <span className="font-semibold">Age Limit: </span>
                  {data.eligibilityCriteria.ageLimit.minAge && <span>{data.eligibilityCriteria.ageLimit.minAge} - </span>}
                  {data.eligibilityCriteria.ageLimit.maxAge && <span>{data.eligibilityCriteria.ageLimit.maxAge}</span>}
                </div>
              )}
              {data.eligibilityCriteria.education?.requiredQualification && (
                <div className="mb-3">
                  <span className="font-semibold">Education: </span>
                  <span>{data.eligibilityCriteria.education.requiredQualification}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
