import axios from "axios";
import { parse } from "node-html-parser";
import {
  forbiddenArticlesWriteResponse,
  verifyAdminOrAutomationSecret,
} from '@/features/articles/lib/verifyArticlesWriteAuth';

// Helper function to create a response
const createResponse = (data, status = 200, headers = {}) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      ...headers,
    },
  });
};

// Handle CORS preflight requests
const handlePreflight = () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    status: 204,
  });
};

// Function to clean unwanted tags and attributes
const cleanHTMLContent = (element) => {
  // Remove script, style, and unwanted tags
  element
    .querySelectorAll("script, style, ins")
    .forEach((node) => node.remove());

  // Remove classes, styles, and other unnecessary attributes
  element.querySelectorAll("*").forEach((node) => {
    node.removeAttribute("class");
    node.removeAttribute("style");
    node.removeAttribute("id"); // Remove IDs if unnecessary
  });

  // Remove unwanted links by matching specific hrefs
  const unwantedLinks = [
    "https://whatsapp.com/channel/0029Va9UXdXFsn0k0mc9UV2w",
    "https://telegram.me/haryana_jobs_in",
    "https://www.whatsapp.com/channel/0029VaaAunOJ93waKekmpG3T",
  ];
  unwantedLinks.forEach((href) => {
    element
      .querySelectorAll(`a[href="${href}"]`)
      .forEach((node) => node.remove());
  });

  // Convert cleaned HTML to string and sanitize
  let htmlString = element.innerHTML; // Use innerHTML for the cleaned content
  htmlString = htmlString
    .replace(/\\/g, "") // Remove backslashes
    .replace(/[\n\t\r]+/g, "") // Remove newlines, tabs, and carriage returns
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing whitespace

  return htmlString;
};

// Main function to handle the API request
export async function GET(request) {
  const authResult = await verifyAdminOrAutomationSecret(request);
  if (!authResult.ok) {
    return forbiddenArticlesWriteResponse(authResult.error);
  }
  const { method } = request;

  // Handle OPTIONS (preflight) requests
  if (method === "OPTIONS") {
    return handlePreflight();
  }

  const url = new URL(request.url);
  const targetParam = decodeURIComponent(url.searchParams.get("url"));

  // Validate the 'url' parameter
  if (!targetParam || !/^https?:\/\/.+\..+/.test(targetParam)) {
    return createResponse({ error: "Invalid or missing URL parameter" }, 400);
  }

  try {
    // Fetch the HTML of the target URL
    const response = await axios.get(targetParam, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
      },
    });

    const html = response.data;
    const root = parse(html);

    // Select content inside the 'entry-content' class
    const entryContentElement = root.querySelector(".entry-content");

    if (!entryContentElement) {
      return createResponse(
        { error: "No content found in 'entry-content'" },
        404
      );
    }

    // Clean the extracted content
    const cleanedContent = cleanHTMLContent(entryContentElement);

    return createResponse({ content: cleanedContent });
  } catch (error) {
    console.error("Error fetching or parsing data:", error.message);
    return createResponse({ error: "Failed to fetch or parse data" }, 500);
  }
}
