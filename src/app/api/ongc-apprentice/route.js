import axios from "axios";
import { parse } from "node-html-parser";
import { assertAllowedFetchUrl } from "@/lib/safeFetchUrl";

const ONGC_ALLOWED_HOSTS = [
  "sarkariresult.com.im",
  "www.sarkariresult.com.im",
  "sarkariresult.com",
  "www.sarkariresult.com",
];

// Helper function to create a response
const createResponse = (data, status = 200, headers = {}) => {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
};

// Handle CORS preflight requests (same-origin only — no wildcard)
const handlePreflight = () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    status: 204,
  });
};

// Function to clean text content
const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/\s+/g, " ")
    .replace(/[\n\t\r]+/g, " ")
    .trim();
};

// Function to extract table data
const extractTableData = (table) => {
  const rows = [];
  const tableRows = table.querySelectorAll("tr");
  
  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td, th");
    if (cells.length > 0) {
      const rowData = Array.from(cells).map((cell) => cleanText(cell.textContent));
      rows.push(rowData);
    }
  });
  
  return rows;
};

// Function to extract list items
const extractListItems = (list) => {
  const items = [];
  const listItems = list.querySelectorAll("li");
  listItems.forEach((item) => {
    const text = cleanText(item.textContent);
    if (text) items.push(text);
  });
  return items;
};

// Function to extract dates with better pattern matching
const extractDates = (text) => {
  const dates = [];
  // Multiple date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
    /(\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})/gi,
  ];
  
  datePatterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[0]);
    }
  });
  
  return [...new Set(dates)]; // Remove duplicates
};

// Function to extract key-value pairs from text
const extractKeyValuePairs = (text) => {
  const pairs = {};
  const patterns = [
    /([^:]+):\s*([^\n]+)/g,
    /([^–—]+)[–—]\s*([^\n]+)/g,
  ];
  
  patterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const key = cleanText(match[1]);
      const value = cleanText(match[2]);
      if (key && value && key.length < 100 && value.length < 500) {
        pairs[key] = value;
      }
    }
  });
  
  return pairs;
};

// Function to extract structured sections from content
const extractSections = (entryContent) => {
  const sections = [];
  const headings = entryContent.querySelectorAll("h1, h2, h3, h4, h5, h6");
  
  if (headings.length === 0) return sections;
  
  headings.forEach((heading, index) => {
    const headingText = cleanText(heading.textContent);
    if (!headingText) return;
    
    const section = {
      heading: headingText,
      level: parseInt(heading.tagName.charAt(1)) || 2,
      content: [],
      paragraphs: [],
      lists: [],
      tables: [],
    };
    
    // Find the parent container and get all elements
    const parent = heading.parentNode || entryContent;
    const allChildren = parent.childNodes || [];
    
    // Find heading position and collect content until next heading
    let foundHeading = false;
    let nextHeadingFound = false;
    
    for (let i = 0; i < allChildren.length; i++) {
      const child = allChildren[i];
      
      if (!child || !child.tagName) continue;
      
      if (child === heading) {
        foundHeading = true;
        continue;
      }
      
      if (foundHeading && !nextHeadingFound) {
        const tagName = child.tagName.toUpperCase();
        
        // Check if this is the next heading
        if (tagName.match(/^H[1-6]$/)) {
          nextHeadingFound = true;
          break;
        }
        
        // Collect content
        if (tagName === "P") {
          const text = cleanText(child.textContent);
          if (text && text.length > 10) {
            section.paragraphs.push(text);
            section.content.push(text);
          }
        } else if (tagName === "UL" || tagName === "OL") {
          const listItems = extractListItems(child);
          if (listItems.length > 0) {
            section.lists.push(listItems);
            section.content.push(...listItems);
          }
        } else if (tagName === "TABLE") {
          const tableData = extractTableData(child);
          if (tableData.length > 0) {
            section.tables.push(tableData);
          }
        } else if (tagName === "DIV") {
          // Check if div contains paragraphs or lists
          const divParagraphs = child.querySelectorAll("p");
          const divLists = child.querySelectorAll("ul, ol");
          const divTables = child.querySelectorAll("table");
          
          divParagraphs.forEach((p) => {
            const text = cleanText(p.textContent);
            if (text && text.length > 10) {
              section.paragraphs.push(text);
              section.content.push(text);
            }
          });
          
          divLists.forEach((list) => {
            const listItems = extractListItems(list);
            if (listItems.length > 0) {
              section.lists.push(listItems);
              section.content.push(...listItems);
            }
          });
          
          divTables.forEach((table) => {
            const tableData = extractTableData(table);
            if (tableData.length > 0) {
              section.tables.push(tableData);
            }
          });
        }
      }
    }
    
    if (section.content.length > 0 || section.paragraphs.length > 0 || section.lists.length > 0 || section.tables.length > 0) {
      sections.push(section);
    }
  });
  
  return sections;
};

// Main function to extract structured data from the page
const extractJobData = (root) => {
  const data = {
    jobTitle: "",
    organization: "ONGC",
    postName: "",
    totalVacancies: "",
    jobSummary: "",
    
    dates: {
      applicationStart: "",
      applicationEnd: "",
      lastDateToApply: "",
      examDate: "",
      admitCardRelease: "",
      resultDate: "",
      allDatesFound: [],
    },
    
    eligibilityCriteria: {
      ageLimit: {
        minAge: "",
        maxAge: "",
        ageRelaxation: "",
        ageDetails: "",
      },
      education: {
        requiredQualification: "",
        qualificationDetails: [],
      },
      nationality: "",
      otherRequirements: [],
    },
    
    applicationInfo: {
      applicationFee: {
        generalCategory: "",
        scStCategory: "",
        obcCategory: "",
        feeDetails: "",
      },
      howToApply: "",
      applicationLink: "",
      paymentMethod: "",
    },
    
    selectionProcedure: {
      selectionStages: [],
      selectionDetails: "",
    },
    
    salaryAndBenefits: {
      salaryAmount: "",
      salaryDetails: "",
      benefits: [],
    },
    
    applicationSteps: {
      stepByStepGuide: [],
      detailedInstructions: [],
    },
    
    importantLinks: {
      applyOnline: "",
      officialNotification: "",
      downloadAdmitCard: "",
      checkResult: "",
      officialWebsite: "",
      linksFromTables: [],
      allImportantLinks: [],
    },
    
    detailedContent: {
      fullContentText: "",
      contentSections: [],
      allParagraphs: [],
      allLists: [],
      allTables: [],
      extractedKeyValuePairs: {},
    },
    
    extractedAt: new Date().toISOString(),
  };

  try {
    // Extract title
    const titleElement =
      root.querySelector("h1.entry-title") ||
      root.querySelector("h1") ||
      root.querySelector(".post-title") ||
      root.querySelector("title");
    if (titleElement) {
      data.jobTitle = cleanText(titleElement.textContent);
      data.postName = data.jobTitle;
    }

    // Extract main content
    const entryContent =
      root.querySelector(".entry-content") ||
      root.querySelector(".post-content") ||
      root.querySelector("article") ||
      root.querySelector("main") ||
      root.querySelector(".content");

    if (entryContent) {
      // Remove unwanted elements
      const unwantedElements = entryContent.querySelectorAll(
        "script, style, ins, .adsbygoogle, .advertisement, iframe, noscript, .social-share, .share-buttons"
      );
      unwantedElements.forEach((node) => node.remove());

      // Extract full text content
      const fullText = entryContent.textContent;
      data.detailedContent.fullContentText = cleanText(fullText);
      const contentText = fullText.toLowerCase();

      // Extract sections with headings
      data.detailedContent.contentSections = extractSections(entryContent);

      // Extract all paragraphs
      const paragraphs = entryContent.querySelectorAll("p");
      paragraphs.forEach((para) => {
        const text = cleanText(para.textContent);
        if (text && text.length > 20) {
          data.detailedContent.allParagraphs.push(text);
        }
      });

      // Extract all lists
      const lists = entryContent.querySelectorAll("ul, ol");
      lists.forEach((list) => {
        const listItems = extractListItems(list);
        if (listItems.length > 0) {
          data.detailedContent.allLists.push(listItems);
        }
      });

      // Extract all tables and links from tables
      const tables = entryContent.querySelectorAll("table");
      tables.forEach((table) => {
        const tableData = extractTableData(table);
        if (tableData.length > 0) {
          data.detailedContent.allTables.push(tableData);
          
          // Extract links from table cells
          const tableLinks = table.querySelectorAll("a[href]");
          tableLinks.forEach((link) => {
            const href = link.getAttribute("href");
            const text = cleanText(link.textContent);
            
            // Find parent cell (td or th)
            let parentCell = link.parentNode;
            let cellText = "";
            while (parentCell && parentCell.tagName && !parentCell.tagName.match(/^(TD|TH)$/i)) {
              parentCell = parentCell.parentNode;
            }
            if (parentCell) {
              cellText = cleanText(parentCell.textContent);
            }
            
            // Find which row this link is in
            const allRows = table.querySelectorAll("tr");
            let rowNumber = 0;
            for (let i = 0; i < allRows.length; i++) {
              if (allRows[i].querySelectorAll("a[href]").some(a => a === link)) {
                rowNumber = i + 1;
                break;
              }
            }
            
            if (href) {
              const linkData = {
                text: text || href,
                url: href,
                cellContent: cellText,
                tableRow: rowNumber,
              };
              
              data.importantLinks.linksFromTables.push(linkData);
              
              // Also add to allImportantLinks if not duplicate
              const isDuplicate = data.importantLinks.allImportantLinks.some(
                existing => existing.url === href
              );
              if (!isDuplicate) {
                data.importantLinks.allImportantLinks.push({
                  text: text || href,
                  url: href,
                  source: "table",
                });
              }
            }
          });
        }
      });

      // Extract key-value pairs
      data.detailedContent.extractedKeyValuePairs = extractKeyValuePairs(fullText);

      // Extract all dates
      const allDates = extractDates(fullText);
      data.dates.allDatesFound = allDates;

      // Extract specific dates with better patterns
      const datePatterns = {
        applicationStart: [
          /(?:application|apply|registration).*?(?:start|begin|open|commence).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
          /(?:start|begin|open).*?(?:date|from).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        ],
        applicationEnd: [
          /(?:application|apply|registration).*?(?:end|close|last|deadline).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
          /(?:last|closing).*?(?:date|on).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        ],
        examDate: [
          /(?:exam|test|written|exam).*?(?:date|schedule|on).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        ],
        admitCardRelease: [
          /(?:admit\s*card|hall\s*ticket).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        ],
        resultDate: [
          /(?:result|merit|selection).*?(?:date|on).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        ],
      };

      Object.keys(datePatterns).forEach((key) => {
        datePatterns[key].forEach((pattern) => {
          const match = contentText.match(pattern);
          if (match) {
            const dateMatch = match[0].match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
            if (dateMatch && !data.dates[key]) {
              data.dates[key] = dateMatch[1];
            }
          }
        });
      });

      // Extract total posts with better patterns
      const postsPatterns = [
        /(?:total|number\s*of|vacancy|vacancies).*?(\d+)/i,
        /(\d+).*?(?:posts|vacancies|positions|seats)/i,
      ];
      postsPatterns.forEach((pattern) => {
        const match = contentText.match(pattern);
        if (match && !data.totalVacancies) {
          data.totalVacancies = match[1];
        }
      });

      // Extract age limit with detailed information
      const agePatterns = [
        /(?:age|maximum\s*age|minimum\s*age).*?(\d+)\s*(?:years?|yrs?)/gi,
        /(?:between|from).*?(\d+).*?(?:to|and).*?(\d+).*?(?:years?|yrs?)/gi,
      ];
      agePatterns.forEach((pattern) => {
        const match = contentText.match(pattern);
        if (match) {
          if (match[1] && match[2]) {
            data.eligibilityCriteria.ageLimit.minAge = match[1] + " years";
            data.eligibilityCriteria.ageLimit.maxAge = match[2] + " years";
          } else if (match[1]) {
            data.eligibilityCriteria.ageLimit.maxAge = match[1] + " years";
          }
        }
      });

      // Extract application fee with categories
      const feePatterns = [
        /(?:fee|application\s*fee|registration\s*fee).*?(?:rs\.?|₹|rupees?)?\s*(\d+[\d,]*)/gi,
        /(?:general|ur|unreserved).*?(?:fee|rs\.?|₹).*?(\d+[\d,]*)/gi,
        /(?:sc|st|obc).*?(?:fee|rs\.?|₹).*?(\d+[\d,]*)/gi,
      ];
      feePatterns.forEach((pattern, index) => {
        const match = contentText.match(pattern);
        if (match) {
          const amount = "₹" + match[1].replace(/,/g, "");
          if (index === 0 && !data.applicationInfo.applicationFee.generalCategory) {
            data.applicationInfo.applicationFee.generalCategory = amount;
          } else if (index === 1 && !data.applicationInfo.applicationFee.generalCategory) {
            data.applicationInfo.applicationFee.generalCategory = amount;
          } else if (index === 2 && !data.applicationInfo.applicationFee.scStCategory) {
            data.applicationInfo.applicationFee.scStCategory = amount;
          }
        }
      });

      // Extract salary/stipend
      const salaryPatterns = [
        /(?:salary|stipend|pay|remuneration|emolument).*?(?:rs\.?|₹|rupees?)?\s*(\d+[\d,]*)/gi,
        /(?:rs\.?|₹)\s*(\d+[\d,]*).*?(?:per\s*month|pm|monthly)/gi,
      ];
      salaryPatterns.forEach((pattern) => {
        const match = contentText.match(pattern);
        if (match && !data.salaryAndBenefits.salaryAmount) {
          data.salaryAndBenefits.salaryAmount = "₹" + match[1].replace(/,/g, "");
        }
      });

      // Extract educational qualification
      const qualKeywords = ["qualification", "degree", "education", "diploma", "certificate", "10th", "12th", "graduation"];
      data.detailedContent.allParagraphs.forEach((para) => {
        const paraLower = para.toLowerCase();
        if (qualKeywords.some((keyword) => paraLower.includes(keyword))) {
          if (!data.eligibilityCriteria.education.requiredQualification) {
            data.eligibilityCriteria.education.requiredQualification = para;
          }
          data.eligibilityCriteria.education.qualificationDetails.push(para);
        }
      });

      // Extract selection process stages
      const selectionKeywords = ["written", "exam", "test", "interview", "document", "verification", "medical", "physical"];
      data.detailedContent.allParagraphs.forEach((para) => {
        const paraLower = para.toLowerCase();
        if (paraLower.includes("selection") || selectionKeywords.some((keyword) => paraLower.includes(keyword))) {
          if (!data.selectionProcedure.selectionDetails) {
            data.selectionProcedure.selectionDetails = para;
          }
          data.selectionProcedure.selectionStages.push(para);
        }
      });

      // Extract how to apply steps
      data.detailedContent.allParagraphs.forEach((para) => {
        const paraLower = para.toLowerCase();
        if (paraLower.includes("how to apply") || paraLower.includes("application process") || paraLower.includes("step")) {
          data.applicationSteps.detailedInstructions.push(para);
        }
      });

      // Extract steps from numbered lists
      data.detailedContent.allLists.forEach((list) => {
        const listText = list.join(" ").toLowerCase();
        if (listText.includes("step") || listText.includes("apply") || listText.includes("process")) {
          data.applicationSteps.stepByStepGuide.push(...list);
        }
      });

      // Extract all important links (excluding those already found in tables)
      const links = entryContent.querySelectorAll("a[href]");
      const tableLinkUrls = new Set(data.importantLinks.linksFromTables.map(l => l.url));
      
      links.forEach((link) => {
        const href = link.getAttribute("href");
        const text = cleanText(link.textContent).toLowerCase();
        const linkText = cleanText(link.textContent);
        
        // Skip if already extracted from table
        if (tableLinkUrls.has(href)) return;
        
        if (href && href.startsWith("http")) {
          const linkData = {
            text: linkText || href,
            url: href,
            source: "content",
          };
          
          // Check if already exists
          const isDuplicate = data.importantLinks.allImportantLinks.some(
            existing => existing.url === href
          );
          
          if (!isDuplicate) {
            data.importantLinks.allImportantLinks.push(linkData);
          }
          
          // Categorize links with better matching
          const linkTextLower = text || href.toLowerCase();
          
          if ((linkTextLower.includes("apply") || linkTextLower.includes("application") || 
               href.includes("apply") || href.includes("registration")) && 
              !data.importantLinks.applyOnline) {
            data.importantLinks.applyOnline = href;
            data.applicationInfo.applicationLink = href;
          }
          else if ((linkTextLower.includes("notification") || linkTextLower.includes("advertisement") || 
                    href.includes("notification") || href.includes("pdf") || 
                    href.includes("download")) && 
                   !data.importantLinks.officialNotification) {
            data.importantLinks.officialNotification = href;
          }
          else if ((linkTextLower.includes("admit") || linkTextLower.includes("hall ticket") || 
                    linkTextLower.includes("hallticket") || href.includes("admit")) && 
                   !data.importantLinks.downloadAdmitCard) {
            data.importantLinks.downloadAdmitCard = href;
          }
          else if ((linkTextLower.includes("result") || linkTextLower.includes("merit") || 
                    href.includes("result")) && 
                   !data.importantLinks.checkResult) {
            data.importantLinks.checkResult = href;
          }
          else if ((linkTextLower.includes("official") || linkTextLower.includes("website") || 
                    href.includes("ongc") || href.includes("official")) && 
                   !data.importantLinks.officialWebsite) {
            data.importantLinks.officialWebsite = href;
          }
        }
      });

      // Extract post details from tables - store in a separate array if needed
      // This can be used for post-specific information extracted from tables
    }

    // Extract meta information for description
    const metaDescription = root.querySelector('meta[name="description"]');
    if (metaDescription) {
      const desc = metaDescription.getAttribute("content");
      if (desc) {
        data.jobSummary = cleanText(desc);
      }
    }
    
    // If no meta description, use the first meaningful paragraph
    if (!data.jobSummary && data.detailedContent.allParagraphs.length > 0) {
      const firstPara = data.detailedContent.allParagraphs[0];
      if (firstPara && firstPara.length > 50) {
        data.jobSummary = firstPara.substring(0, 500).trim();
      }
    }

    // Clean up empty arrays and objects
    Object.keys(data.dates).forEach((key) => {
      if (Array.isArray(data.dates[key]) && data.dates[key].length === 0) {
        delete data.dates[key];
      } else if (!Array.isArray(data.dates[key]) && !data.dates[key]) {
        delete data.dates[key];
      }
    });

    // Clean eligibility criteria
    if (data.eligibilityCriteria.ageLimit) {
      Object.keys(data.eligibilityCriteria.ageLimit).forEach((key) => {
        if (!data.eligibilityCriteria.ageLimit[key]) {
          delete data.eligibilityCriteria.ageLimit[key];
        }
      });
      if (Object.keys(data.eligibilityCriteria.ageLimit).length === 0) {
        delete data.eligibilityCriteria.ageLimit;
      }
    }
    
    if (data.eligibilityCriteria.education) {
      if (data.eligibilityCriteria.education.qualificationDetails.length === 0) {
        delete data.eligibilityCriteria.education.qualificationDetails;
      }
      if (!data.eligibilityCriteria.education.requiredQualification && 
          (!data.eligibilityCriteria.education.qualificationDetails || data.eligibilityCriteria.education.qualificationDetails.length === 0)) {
        delete data.eligibilityCriteria.education;
      }
    }
    
    if (data.eligibilityCriteria.otherRequirements && data.eligibilityCriteria.otherRequirements.length === 0) {
      delete data.eligibilityCriteria.otherRequirements;
    }
    if (!data.eligibilityCriteria.nationality) delete data.eligibilityCriteria.nationality;

    // Clean application info
    if (data.applicationInfo.applicationFee) {
      Object.keys(data.applicationInfo.applicationFee).forEach((key) => {
        if (!data.applicationInfo.applicationFee[key]) {
          delete data.applicationInfo.applicationFee[key];
        }
      });
      if (Object.keys(data.applicationInfo.applicationFee).length === 0) {
        delete data.applicationInfo.applicationFee;
      }
    }
    if (!data.applicationInfo.howToApply) delete data.applicationInfo.howToApply;
    if (!data.applicationInfo.applicationLink) delete data.applicationInfo.applicationLink;
    if (!data.applicationInfo.paymentMethod) delete data.applicationInfo.paymentMethod;

    // Clean selection procedure
    if (data.selectionProcedure.selectionStages.length === 0) delete data.selectionProcedure.selectionStages;
    if (!data.selectionProcedure.selectionDetails && (!data.selectionProcedure.selectionStages || data.selectionProcedure.selectionStages.length === 0)) {
      delete data.selectionProcedure;
    }

    // Clean salary and benefits
    if (data.salaryAndBenefits) {
      if (data.salaryAndBenefits.benefits.length === 0) delete data.salaryAndBenefits.benefits;
      if (!data.salaryAndBenefits.salaryAmount && !data.salaryAndBenefits.salaryDetails && 
          (!data.salaryAndBenefits.benefits || data.salaryAndBenefits.benefits.length === 0)) {
        delete data.salaryAndBenefits;
      }
    }

    // Clean application steps
    if (data.applicationSteps) {
      if (data.applicationSteps.stepByStepGuide.length === 0) delete data.applicationSteps.stepByStepGuide;
      if (data.applicationSteps.detailedInstructions.length === 0) delete data.applicationSteps.detailedInstructions;
      if ((!data.applicationSteps.stepByStepGuide || data.applicationSteps.stepByStepGuide.length === 0) && 
          (!data.applicationSteps.detailedInstructions || data.applicationSteps.detailedInstructions.length === 0)) {
        delete data.applicationSteps;
      }
    }

    // Clean important links
    if (data.importantLinks.linksFromTables.length === 0) delete data.importantLinks.linksFromTables;
    if (data.importantLinks.allImportantLinks.length === 0) delete data.importantLinks.allImportantLinks;
    Object.keys(data.importantLinks).forEach((key) => {
      if (key !== "allImportantLinks" && key !== "linksFromTables" && !data.importantLinks[key]) {
        delete data.importantLinks[key];
      }
    });

    // Clean detailed content
    if (data.detailedContent.allParagraphs.length === 0) delete data.detailedContent.allParagraphs;
    if (data.detailedContent.allLists.length === 0) delete data.detailedContent.allLists;
    if (data.detailedContent.allTables.length === 0) delete data.detailedContent.allTables;
    if (Object.keys(data.detailedContent.extractedKeyValuePairs).length === 0) delete data.detailedContent.extractedKeyValuePairs;
    if (data.detailedContent.contentSections.length === 0) delete data.detailedContent.contentSections;
    if (!data.detailedContent.fullContentText) delete data.detailedContent.fullContentText;

  } catch (error) {
    console.error("Error extracting data:", error);
  }

  return data;
};

// Main function to handle the API request
export async function GET(request) {
  const { method } = request;

  // Handle OPTIONS (preflight) requests
  if (method === "OPTIONS") {
    return handlePreflight();
  }

  const url = new URL(request.url);
  const targetUrl =
    url.searchParams.get("url") ||
    "https://sarkariresult.com.im/ongc-apprentice-recruitment/";

  const allowed = assertAllowedFetchUrl(targetUrl, ONGC_ALLOWED_HOSTS);
  if (!allowed.ok) {
    return createResponse({ error: allowed.error }, 400);
  }

  try {
    // Fetch the HTML of the target URL
    const response = await axios.get(allowed.url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 30000, // 30 seconds timeout
    });

    const html = response.data;
    const root = parse(html);

    // Extract structured data
    const extractedData = extractJobData(root);

    // Return the extracted data as JSON
    return createResponse({
      success: true,
      url: allowed.url.toString(),
      data: extractedData,
    });
  } catch (error) {
    console.error("Error fetching or parsing data:", error?.message || error);
    return createResponse(
      {
        success: false,
        error: "Failed to fetch or parse data",
      },
      500
    );
  }
}
