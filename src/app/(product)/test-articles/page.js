'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Eye, 
  ArrowLeft,
  Share2,
  Clock,
  ExternalLink,
  FileText,
  Upload,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

const TestArticlesPage = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [htmlOutput, setHtmlOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Parse markdown table to structured data
  const parseMarkdownTable = (tableText) => {
    if (!tableText || !tableText.trim()) return null;
    
    const lines = tableText.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    // Find the table section (lines with |)
    const tableLines = lines.filter(line => line.includes('|'));
    if (tableLines.length < 2) return null;

    // Extract headers (first line)
    const headerLine = tableLines[0];
    const headers = headerLine.split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    if (headers.length === 0) return null;

    // Extract rows (skip separator line which is usually the second line)
    const rows = [];
    for (let i = 1; i < tableLines.length; i++) {
      const line = tableLines[i];
      // Skip separator lines (lines with only dashes, colons, pipes, and spaces)
      if (line.match(/^[\s\|:\-\|]+$/)) continue;
      
      // Split by | and process cells
      const rawCells = line.split('|');
      let cells = rawCells
        .map(c => c.trim())
        .filter((c, idx) => {
          // Keep all cells, even empty ones, but filter out leading/trailing empty cells from split
          return true;
        });
      
      // Remove leading and trailing empty cells (from split at start/end of line)
      if (cells.length > 0 && cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();
      
      // Only add rows that have some content
      if (cells.length > 0) {
        // Pad or truncate to match header count
        while (cells.length < headers.length) {
          cells.push('');
        }
        if (cells.length > headers.length) {
          cells = cells.slice(0, headers.length);
        }
        rows.push(cells);
      }
    }

    if (rows.length === 0) return null;

    return { headers, rows };
  };

  // Parse the article text into structured sections
  const parseArticle = (articleText) => {
    if (!articleText) return null;

    const sections = {};
    const lines = articleText.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check for section headers (format: **N. Section Name:** or **Section Name:**)
      const sectionMatch = trimmedLine.match(/^\*\*(\d+\.\s*)?(.+?):\*\*\s*$/);
      
      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section - normalize the name
        let sectionName = sectionMatch[2].toLowerCase()
          .replace(/&/g, 'and')      // Replace & with 'and' first
          .replace(/\//g, '_')       // Replace / with _
          .replace(/\s+/g, '_')       // Replace spaces with _
          .replace(/[^a-z0-9_]/g, '') // Remove remaining special chars
          .replace(/_+/g, '_')        // Replace multiple underscores with single
          .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
        
        currentSection = sectionName;
        currentContent = [];
      } else {
        // Add to current section (preserve empty lines for formatting)
        if (currentSection) {
          currentContent.push(line);
        }
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  };

  // Helper function to escape HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
  // Extract table from text and return parts
  const extractTableFromText = (text) => {
    if (!text) return { beforeTable: '', tableText: '', afterTable: '' };
    
    const lines = text.split('\n');
    const tableStartIndex = lines.findIndex(line => line.includes('|') && line.trim().startsWith('|'));
    
    if (tableStartIndex === -1) {
      return { beforeTable: text, tableText: '', afterTable: '' };
    }
    
    // Find table end (first non-table line after table starts)
    let tableEndIndex = tableStartIndex + 1;
    while (tableEndIndex < lines.length && lines[tableEndIndex].includes('|')) {
      tableEndIndex++;
    }
    
    const beforeTable = lines.slice(0, tableStartIndex).join('\n').trim();
    const tableText = lines.slice(tableStartIndex, tableEndIndex).join('\n');
    const afterTable = lines.slice(tableEndIndex).join('\n').trim();
    
    return { beforeTable, tableText, afterTable };
  };

  // Convert text to HTML (handles links, lists, etc.) - excludes tables
  const convertTextToHTML = (text) => {
    if (!text) return '';
    
    // Convert markdown links to HTML
    let html = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert line breaks to paragraphs
    const lines = html.split('\n').filter(line => line.trim() && !line.includes('|'));
    const paragraphs = [];
    let currentParagraph = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for list items
      if (trimmed.match(/^[-*]\s+/)) {
        if (currentParagraph.length > 0) {
          paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        paragraphs.push(`<li>${trimmed.replace(/^[-*]\s+/, '')}</li>`);
      } else if (trimmed.match(/^\d+\.\s+/)) {
        if (currentParagraph.length > 0) {
          paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        paragraphs.push(`<li>${trimmed.replace(/^\d+\.\s+/, '')}</li>`);
      } else if (trimmed.length === 0) {
        if (currentParagraph.length > 0) {
          paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
      } else {
        currentParagraph.push(trimmed);
      }
    }
    
    if (currentParagraph.length > 0) {
      paragraphs.push(`<p>${currentParagraph.join(' ')}</p>`);
    }
    
    // Wrap consecutive list items in ul/ol
    let result = [];
    let inList = false;
    let listType = 'ul';
    let listItems = [];
    
    for (const para of paragraphs) {
      if (para.startsWith('<li>')) {
        if (!inList) {
          inList = true;
          listType = para.match(/^\d+\./) ? 'ol' : 'ul';
        }
        listItems.push(para);
      } else {
        if (inList) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`);
          listItems = [];
          inList = false;
        }
        result.push(para);
      }
    }
    
    if (inList && listItems.length > 0) {
      result.push(`<${listType}>${listItems.join('')}</${listType}>`);
    }
    
    return result.join('\n');
  };
  
  // Convert table to HTML
  const convertTableToHTML = (table) => {
    if (!table || !table.headers || table.headers.length === 0) return '';
    
    let html = '    <table>\n';
    html += '      <thead>\n';
    html += '        <tr>\n';
    table.headers.forEach(header => {
      html += `          <th>${escapeHtml(header)}</th>\n`;
    });
    html += '        </tr>\n';
    html += '      </thead>\n';
    
    if (table.rows && table.rows.length > 0) {
      html += '      <tbody>\n';
      table.rows.forEach(row => {
        html += '        <tr>\n';
        table.headers.forEach((_, index) => {
          const cell = row[index] || '';
          html += `          <td>${escapeHtml(cell)}</td>\n`;
        });
        html += '        </tr>\n';
      });
      html += '      </tbody>\n';
    }
    
    html += '    </table>\n';
    return html;
  };
  
  // Get text after table
  const getTextAfterTable = (text) => {
    if (!text) return '';
    const tableEndIndex = text.indexOf('\n', text.lastIndexOf('|'));
    if (tableEndIndex > 0) {
      return text.substring(tableEndIndex).trim();
    }
    return '';
  };

  // Generate HTML from parsed data
  const generateHTML = (data, allSections) => {
    let html = '<div class="article-content">\n';
    
    // Headline
    if (data.headline) {
      html += `  <h1 class="article-headline">${escapeHtml(data.headline)}</h1>\n`;
    }
    
    // Meta Description
    if (data.metaDescription) {
      html += `  <p class="article-meta-description">${escapeHtml(data.metaDescription)}</p>\n`;
    }
    
    // Introduction
    if (data.introduction) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">Introduction</h2>\n';
      html += `    <div class="section-content">${convertTextToHTML(data.introduction)}</div>\n`;
      html += '  </section>\n';
    }
    
    // Important Details
    if (data.importantDetails) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">Important Details</h2>\n';
      
      // Extract table and text parts
      const { beforeTable, tableText, afterTable } = extractTableFromText(data.importantDetails);
      
      // Add text before table
      if (beforeTable) {
        html += `    <div class="section-content">${convertTextToHTML(beforeTable)}</div>\n`;
      }
      
      // Add table if exists
      if (data.importantDetailsTable) {
        html += convertTableToHTML(data.importantDetailsTable);
      } else if (tableText) {
        // Try to parse table from extracted text
        const table = parseMarkdownTable(tableText);
        if (table) {
          html += convertTableToHTML(table);
        }
      }
      
      // Add text after table
      if (afterTable) {
        html += `    <div class="section-content">${convertTextToHTML(afterTable)}</div>\n`;
      }
      
      html += '  </section>\n';
    }
    
    // Eligibility & Selection Process
    if (data.eligibility) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">Eligibility & Selection Process</h2>\n';
      
      const { beforeTable, tableText, afterTable } = extractTableFromText(data.eligibility);
      
      if (beforeTable) {
        html += `    <div class="section-content">${convertTextToHTML(beforeTable)}</div>\n`;
      }
      
      if (data.eligibilityTable) {
        html += convertTableToHTML(data.eligibilityTable);
      } else if (tableText) {
        const table = parseMarkdownTable(tableText);
        if (table) {
          html += convertTableToHTML(table);
        }
      }
      
      if (afterTable) {
        html += `    <div class="section-content">${convertTextToHTML(afterTable)}</div>\n`;
      }
      
      html += '  </section>\n';
    }
    
    // Salary / Pay Details
    if (data.salary) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">Salary / Pay Details</h2>\n';
      if (data.salaryTable) {
        html += convertTableToHTML(data.salaryTable);
        const remainingText = getTextAfterTable(data.salary);
        if (remainingText) {
          html += `    <div class="section-content">${convertTextToHTML(remainingText)}</div>\n`;
        }
      } else {
        html += `    <div class="section-content">${convertTextToHTML(data.salary)}</div>\n`;
      }
      html += '  </section>\n';
    }
    
    // How to Apply
    if (data.howToApply) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">How to Apply</h2>\n';
      html += `    <div class="section-content">${convertTextToHTML(data.howToApply)}</div>\n`;
      html += '  </section>\n';
    }
    
    // Official Links
    if (data.links && data.links.length > 0) {
      html += '  <section class="article-section">\n';
      html += '    <h2 class="section-heading">Official Links</h2>\n';
      html += '    <div class="links-container">\n';
      data.links.forEach(link => {
        if (link.href) {
          html += `      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" class="official-link">${escapeHtml(link.text)}</a>\n`;
        } else {
          html += `      <div class="official-link-placeholder"><strong>${escapeHtml(link.text)}:</strong> ${escapeHtml(link.placeholder || 'Click here')}</div>\n`;
        }
      });
      html += '    </div>\n';
      html += '  </section>\n';
    }
    
    // Render any other sections
    if (allSections) {
      const handledKeys = ['seo_headline', 'headline', 'seo', 'meta_description', 'metadescription', 'meta', 
                           'introduction', 'intro', 'important_details', 'importantdetails', 'important', 'details',
                           'eligibilityandselectionprocess', 'eligibility_selection_process', 'eligibilityselectionprocess', 
                           'eligibility', 'eligibility_selection', 'selection', 'salary_pay_details', 'salary_pay', 
                           'salarypaydetails', 'salary', 'pay', 'how_to_apply', 'howtoapply', 'how_to', 'apply',
                           'official_links', 'officiallinks', 'official', 'links'];
      
      Object.entries(allSections).forEach(([sectionKey, sectionContent]) => {
        if (!sectionContent || !sectionContent.trim()) return;
        
        const isHandled = handledKeys.some(h => 
          sectionKey.toLowerCase().includes(h.toLowerCase()) || 
          h.toLowerCase().includes(sectionKey.toLowerCase())
        );
        
        if (isHandled) return;
        
        const sectionTitle = sectionKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const sectionTable = data[sectionKey + 'Table'];
        
        html += '  <section class="article-section">\n';
        html += `    <h2 class="section-heading">${escapeHtml(sectionTitle)}</h2>\n`;
        if (sectionTable) {
          html += convertTableToHTML(sectionTable);
          const remainingText = getTextAfterTable(sectionContent);
          if (remainingText) {
            html += `    <div class="section-content">${convertTextToHTML(remainingText)}</div>\n`;
          }
        } else {
          html += `    <div class="section-content">${convertTextToHTML(sectionContent)}</div>\n`;
        }
        html += '  </section>\n';
      });
    }
    
    html += '</div>';
    
    // Wrap in complete HTML document with styles
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.headline || 'Article'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      line-height: 1.6;
      color: #202124;
      background: #fff;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .article-content {
      background: #fff;
    }
    .article-headline {
      font-size: 2.5rem;
      font-weight: 700;
      color: #202124;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    .article-meta-description {
      font-size: 1.125rem;
      color: #5f6368;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .article-section {
      margin-bottom: 2.5rem;
    }
    .section-heading {
      font-size: 1.5rem;
      font-weight: 600;
      color: #202124;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #dadce0;
    }
    .section-content {
      font-size: 1rem;
      color: #3c4043;
      line-height: 1.75;
    }
    .section-content p {
      margin-bottom: 1rem;
    }
    .section-content ul, .section-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .section-content li {
      margin-bottom: 0.5rem;
    }
    .section-content strong {
      font-weight: 600;
      color: #202124;
    }
    .section-content a {
      color: #1a73e8;
      text-decoration: none;
    }
    .section-content a:hover {
      text-decoration: underline;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      border: 1px solid #dadce0;
      border-radius: 8px;
      overflow: hidden;
    }
    table thead {
      background-color: #f8f9fa;
    }
    table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #202124;
      border-bottom: 2px solid #dadce0;
      font-size: 0.875rem;
    }
    table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e8eaed;
      font-size: 0.875rem;
      color: #3c4043;
    }
    table tbody tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    table tbody tr:hover {
      background-color: #f1f3f4;
    }
    .links-container {
      background-color: #e8f0fe;
      border: 1px solid #1a73e8;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }
    .official-link {
      display: block;
      color: #1a73e8;
      text-decoration: none;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }
    .official-link:hover {
      text-decoration: underline;
    }
    .official-link-placeholder {
      color: #5f6368;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }
    @media (max-width: 768px) {
      body {
        padding: 15px;
      }
      .article-headline {
        font-size: 1.75rem;
      }
      table {
        font-size: 0.75rem;
      }
      table th, table td {
        padding: 8px 12px;
      }
    }
  </style>
</head>
<body>
${html}
</body>
</html>`;
    
    return fullHTML;
  };

  // Extract links from text - handles both markdown format and plain text
  const extractLinks = (text) => {
    if (!text) return [];
    const links = [];
    
    // First, extract markdown format links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = markdownLinkRegex.exec(text)) !== null) {
      links.push({
        text: match[1],
        href: match[2]
      });
    }
    
    // Also extract plain text links (format: "Label: Click here" or "Label: URL")
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip if already captured as markdown link
      if (trimmed.includes('[') && trimmed.includes('](')) continue;
      
      // Look for patterns like "Label: Click here" or "Label: URL"
      const plainLinkMatch = trimmed.match(/^[-*]?\s*\*\*?([^:]+):\*\*?\s*(.+)$/);
      if (plainLinkMatch) {
        const label = plainLinkMatch[1].trim();
        const linkText = plainLinkMatch[2].trim();
        
        // Check if linkText is a URL
        const urlMatch = linkText.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          links.push({
            text: label,
            href: urlMatch[1]
          });
        } else if (linkText.toLowerCase().includes('click here')) {
          // For "Click here" without URL, we'll show it but mark as no URL
          links.push({
            text: label,
            href: null,
            placeholder: linkText
          });
        }
      }
      
      // Also check for direct URLs in the line
      const directUrlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
      if (directUrlMatch && !links.some(l => l.href === directUrlMatch[1])) {
        // Extract label from line if available
        const labelMatch = trimmed.match(/^[-*]?\s*\*\*?([^:]+):\*\*?/);
        links.push({
          text: labelMatch ? labelMatch[1].trim() : 'Link',
          href: directUrlMatch[1]
        });
      }
    }
    
    return links;
  };

  // Process the JSON data
  const handleParse = () => {
    try {
      setError(null);
      const data = JSON.parse(jsonInput);
      
      if (!data.success || !data.article) {
        throw new Error('Invalid JSON format. Expected { success: true, article: "..." }');
      }

      const sections = parseArticle(data.article);
      // Debug: log all sections found
      console.log('Parsed sections:', Object.keys(sections));
      console.log('All sections:', sections);

      // Normalize section keys - try multiple variations
      const getSection = (keys) => {
        // First try exact matches
        for (const key of keys) {
          if (sections[key]) return sections[key];
        }
        // Try case-insensitive match
        const sectionKeys = Object.keys(sections);
        for (const sectionKey of sectionKeys) {
          for (const key of keys) {
            if (sectionKey.toLowerCase() === key.toLowerCase()) {
              return sections[sectionKey];
            }
          }
        }
        // Try partial matches (contains)
        for (const sectionKey of sectionKeys) {
          for (const key of keys) {
            if (sectionKey.includes(key) || key.includes(sectionKey)) {
              return sections[sectionKey];
            }
          }
        }
        return '';
      };

      const processedData = {
        headline: getSection(['seo_headline', 'headline', 'seo']),
        metaDescription: getSection(['meta_description', 'metadescription', 'meta']),
        introduction: getSection(['introduction', 'intro']),
        importantDetails: getSection(['important_details', 'importantdetails', 'important', 'details']),
        eligibility: getSection(['eligibilityandselectionprocess', 'eligibility_selection_process', 'eligibilityselectionprocess', 'eligibility', 'eligibility_selection', 'selection']),
        salary: getSection(['salary_pay_details', 'salary_pay', 'salarypaydetails', 'salary', 'pay']),
        howToApply: getSection(['how_to_apply', 'howtoapply', 'how_to', 'apply']),
        officialLinks: getSection(['official_links', 'officiallinks', 'official', 'links'])
      };

      // Parse tables from all sections
      processedData.importantDetailsTable = parseMarkdownTable(processedData.importantDetails);
      processedData.eligibilityTable = parseMarkdownTable(processedData.eligibility);
      processedData.salaryTable = parseMarkdownTable(processedData.salary);
      
      // Check for tables in any other sections dynamically
      for (const [sectionKey, sectionContent] of Object.entries(sections)) {
        if (sectionContent && typeof sectionContent === 'string') {
          const table = parseMarkdownTable(sectionContent);
          if (table) {
            processedData[sectionKey + 'Table'] = table;
          }
        }
      }

      // Extract links
      processedData.links = extractLinks(processedData.officialLinks);
      
      // Store all sections for dynamic rendering of any unhandled sections
      processedData.allSections = sections;

      // Generate HTML output
      const htmlContent = generateHTML(processedData, sections);
      setHtmlOutput(htmlContent);
      setParsedData(processedData);
    } catch (err) {
      setError(err.message);
      setParsedData(null);
    }
  };

  // Render table component
  const renderTable = (table) => {
    if (!table || !table.headers || table.headers.length === 0) return null;

    return (
      <div className="overflow-x-auto rounded-lg border border-neutral-300 shadow-sm my-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-100">
              {table.headers.map((header, index) => (
                <th 
                  key={index}
                  className="px-4 py-2.5 text-left text-sm font-semibold text-neutral-900 border-b border-neutral-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows && table.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
              >
                {table.headers.map((_, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="px-4 py-2.5 text-sm text-neutral-700 border-b border-neutral-200"
                  >
                    {row[cellIndex] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Parse lists from text
  const parseLists = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const lists = [];
    let currentList = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for bullet points (- or *)
      if (trimmed.match(/^[-*]\s+/)) {
        if (!currentList) {
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(trimmed.replace(/^[-*]\s+/, ''));
      }
      // Check for numbered lists
      else if (trimmed.match(/^\d+\.\s+/)) {
        if (!currentList || currentList.type !== 'ol') {
          if (currentList) lists.push(currentList);
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
      // End of list
      else if (trimmed.length === 0 && currentList) {
        lists.push(currentList);
        currentList = null;
      }
      else if (currentList && trimmed.length > 0) {
        // Continue list if line doesn't match pattern
        if (currentList.items.length > 0) {
          currentList.items[currentList.items.length - 1] += ' ' + trimmed;
        }
      }
    }

    if (currentList) {
      lists.push(currentList);
    }

    return lists.length > 0 ? lists : null;
  };

  // Render text with links and lists
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    
    // Check if text contains lists
    const lists = parseLists(text);
    if (lists && lists.length > 0) {
      // Extract non-list text
      const nonListText = text.split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return !trimmed.match(/^[-*]\s+/) && !trimmed.match(/^\d+\.\s+/);
        })
        .join('\n')
        .trim();

      return (
        <div>
          {nonListText && (
            <div className="text-sm text-neutral-700 leading-relaxed mb-3">
              {renderInlineText(nonListText)}
            </div>
          )}
          {lists.map((list, listIndex) => (
            <div key={listIndex} className="mb-4 bg-neutral-50 rounded-lg p-4">
              {list.type === 'ul' ? (
                <ul className="list-disc list-inside space-y-1.5">
                  {list.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-neutral-700">
                      {renderInlineText(item)}
                    </li>
                  ))}
                </ul>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5">
                  {list.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-neutral-700">
                      {renderInlineText(item)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-sm text-neutral-700 leading-relaxed mb-3">{renderInlineText(text)}</div>;
  };

  // Render inline text with links
  const renderInlineText = (text) => {
    if (!text) return null;
    
    const parts = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add link
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          {match[1]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : <>{text}</>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200 group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Test Articles Parser</h1>
          <p className="text-neutral-600">Parse and display structured article JSON data</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-neutral-600" />
            <h2 className="text-xl font-semibold text-neutral-900">JSON Input</h2>
          </div>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste your JSON here, e.g.:\n{\n  "success": true,\n  "article": "**1. SEO Headline:** ..."\n}'
            className="w-full h-64 p-4 border border-neutral-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleParse}
              disabled={!jsonInput.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Parse Article
            </button>
            <button
              onClick={() => {
                const sample = {
                  success: true,
                  article: "**SEO Headline:**  \nSBI Announces 1146 Specialist Cadre Officer Vacancies for VP Wealth, AVP Wealth, and Customer Relationship Executives\n\n**Meta Description:**  \nApply now for SBI's 1146 Specialist Cadre Officer positions, including VP Wealth, AVP Wealth, and Customer Relationship Executives. Last date: Jan 10, 2026.\n\n**Introduction:**  \nThe State Bank of India (SBI) has issued a recruitment notification for 1146 Specialist Cadre Officers. These roles include Vice President (VP) Wealth (SRM), Assistant Vice President (AVP) Wealth (RM), and Customer Relationship Executives.\n\n**Important Details:**\n\n| Post Title | Total Vacancies | Age Limit | Salary Range (CTC) |\n|------------|-----------------|-----------|-------------------|\n| VP Wealth (SRM) | Not specified | 26-42 years | Up to ₹44.70 Lakhs |\n| AVP Wealth (RM) | Not specified | 23-35 years | Up to ₹30.20 Lakhs |\n| Customer Relationship Executive | Not specified | 20-35 years | Up to ₹6.20 Lakhs |\n\n**Eligibility & Selection Process:**  \n| Criteria | Details |\n|----------|----------|\n| Educational Qualification | Graduation from a recognized university |\n| Selection Steps | Application screening, interview, CTC negotiation, merit list |\n\n**Salary / Pay Details:**  \n| Post | Fixed Pay | Total CTC (Upper Range) |\n|------|-----------|----------------------|\n| VP Wealth (SRM) | ₹30,00,000 | ₹44.70 Lakhs |\n| AVP Wealth (RM) | ₹20,00,000 | ₹30.20 Lakhs |\n\n*Contract duration:* 5 years, renewable for an additional 4 years.\n\n**How to Apply:**  \nEligible candidates can apply online by visiting the official SBI careers portal.\n\n**Official Links:**  \n- **Apply Online:** [https://bank.sbi/web/careers/current-openings](https://bank.sbi/web/careers/current-openings)  \n- **Official Website:** [https://sbi.bank.in](https://sbi.bank.in)"
                };
                setJsonInput(JSON.stringify(sample, null, 2));
                setError(null);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Load Sample
            </button>
          </div>
        </div>

        {/* Parsed Content */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 lg:p-12"
          >
            {/* Headline */}
            {parsedData.headline && (
              <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
                {parsedData.headline}
              </h1>
            )}

            {/* Meta Description */}
            {parsedData.metaDescription && (
              <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                {parsedData.metaDescription}
              </p>
            )}

            <div className="space-y-6 mt-8">
              {/* Introduction */}
              {parsedData.introduction && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Introduction</h2>
                  {renderTextWithLinks(parsedData.introduction)}
                </section>
              )}

              {/* Important Details */}
              {parsedData.importantDetails && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Important Details</h2>
                  {parsedData.importantDetailsTable ? (
                    <>
                      {renderTable(parsedData.importantDetailsTable)}
                      {/* Show any additional text after table */}
                      {(() => {
                        const tableEndIndex = parsedData.importantDetails.indexOf('\n', parsedData.importantDetails.lastIndexOf('|'));
                        const remainingText = tableEndIndex > 0 
                          ? parsedData.importantDetails.substring(tableEndIndex).trim()
                          : '';
                        return remainingText ? (
                          <div className="text-sm text-neutral-600 italic mt-4">
                            {renderTextWithLinks(remainingText)}
                          </div>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    renderTextWithLinks(parsedData.importantDetails)
                  )}
                </section>
              )}

              {/* Eligibility & Selection Process */}
              {parsedData.eligibility && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Eligibility & Selection Process</h2>
                  {parsedData.eligibilityTable ? (
                    <>
                      {renderTable(parsedData.eligibilityTable)}
                      {/* Show any additional text after table */}
                      {(() => {
                        const tableEndIndex = parsedData.eligibility.indexOf('\n', parsedData.eligibility.lastIndexOf('|'));
                        const remainingText = tableEndIndex > 0 
                          ? parsedData.eligibility.substring(tableEndIndex).trim()
                          : '';
                        return remainingText ? (
                          <div className="text-sm text-neutral-600 italic mt-4">
                            {renderTextWithLinks(remainingText)}
                          </div>
                        ) : null;
                      })()}
                    </>
                  ) : (
                    renderTextWithLinks(parsedData.eligibility)
                  )}
                </section>
              )}

              {/* Salary / Pay Details */}
              {parsedData.salary && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Salary / Pay Details</h2>
                  {parsedData.salaryTable ? (
                    renderTable(parsedData.salaryTable)
                  ) : (
                    renderTextWithLinks(parsedData.salary)
                  )}
                </section>
              )}

              {/* How to Apply */}
              {parsedData.howToApply && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">How to Apply</h2>
                  {renderTextWithLinks(parsedData.howToApply)}
                </section>
              )}

              {/* Official Links */}
              {parsedData.links && parsedData.links.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Official Links</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {parsedData.links.map((link, index) => (
                        link.href ? (
                          <a
                            key={index}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span><strong>{link.text}:</strong> {link.href}</span>
                          </a>
                        ) : (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-neutral-600 text-sm"
                          >
                            <ExternalLink className="w-4 h-4 text-neutral-400" />
                            <span><strong>{link.text}:</strong> {link.placeholder || 'Click here'}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </section>
              )}
              
              {/* Also show Official Links section if it exists but no links were extracted */}
              {parsedData.officialLinks && (!parsedData.links || parsedData.links.length === 0) && (
                <section>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">Official Links</h2>
                  {renderTextWithLinks(parsedData.officialLinks)}
                </section>
              )}

              {/* Render any other sections that weren't explicitly handled */}
              {parsedData.allSections && Object.entries(parsedData.allSections).map(([sectionKey, sectionContent]) => {
                // Skip if already rendered
                const handledSections = [
                  'seo_headline', 'headline', 'seo',
                  'meta_description', 'metadescription', 'meta',
                  'introduction', 'intro',
                  'important_details', 'importantdetails', 'important', 'details',
                  'eligibilityandselectionprocess', 'eligibility_selection_process', 'eligibilityselectionprocess', 'eligibility', 'eligibility_selection', 'selection',
                  'salary_pay_details', 'salary_pay', 'salarypaydetails', 'salary', 'pay',
                  'how_to_apply', 'howtoapply', 'how_to', 'apply',
                  'official_links', 'officiallinks', 'official', 'links'
                ];
                
                if (handledSections.some(h => sectionKey.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(sectionKey.toLowerCase()))) {
                  return null;
                }
                
                if (!sectionContent || !sectionContent.trim()) return null;
                
                // Format section title from key
                const sectionTitle = sectionKey
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
                
                const sectionTable = parsedData[sectionKey + 'Table'];
                
                return (
                  <section key={sectionKey}>
                    <h2 className="text-xl font-semibold text-neutral-900 mb-3">{sectionTitle}</h2>
                    {sectionTable ? (
                      <>
                        {renderTable(sectionTable)}
                        {(() => {
                          const tableEndIndex = sectionContent.indexOf('\n', sectionContent.lastIndexOf('|'));
                          const remainingText = tableEndIndex > 0 
                            ? sectionContent.substring(tableEndIndex).trim()
                            : '';
                          return remainingText ? (
                            <div className="text-sm text-neutral-600 italic mt-4">
                              {renderTextWithLinks(remainingText)}
                            </div>
                          ) : null;
                        })()}
                      </>
                    ) : (
                      renderTextWithLinks(sectionContent)
                    )}
                  </section>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* HTML Output */}
        {htmlOutput && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-600" />
                <h2 className="text-xl font-semibold text-neutral-900">HTML Output</h2>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(htmlOutput);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy HTML
                  </>
                )}
              </button>
            </div>
            <textarea
              value={htmlOutput}
              readOnly
              className="w-full h-96 p-4 border border-neutral-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TestArticlesPage;

