export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
}

export const extractContentFromUrl = async (url: string): Promise<ExtractedContent> => {
  try {
    const response = await fetch('/.netlify/functions/fetchContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    const htmlContent = await response.text();
    return parseHtmlToMarkdown(htmlContent, url);
  } catch (error) {
    console.error('Error extracting content:', error);
    throw new Error('İçerik çekilirken bir hata oluştu. Lütfen URL\'nin doğru olduğundan emin olun.');
  }
};

// Utility function to clean and format text for markdown
const cleanTextForMarkdown = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
};

// Utility function to escape markdown special characters
const escapeMarkdown = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
};

const parseHtmlToMarkdown = (html: string, url: string): ExtractedContent => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements first
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    '.advertisement', '.ads', '.social-share', '.newsletter',
    '.popup', '.modal', '.cookie-banner', '.sidebar',
    '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
    '.comments', '.comment-section', '.related-posts',
    '.breadcrumb', '.pagination', '.tags', '.categories',
    '.author-bio', '.share-buttons', '.social-media',
    // Oggusto specific selectors to remove
    '.py-8', '.sticky', '.flex.items-center.font-jost.py-2',
    'nav', 'header', 'footer', '.navigation', '.menu'
  ];

  unwantedSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Extract title - try multiple methods
  let title = '';
  
  // Try to get title from various sources
  const titleSources = [
    'h1',
    '.post-title',
    '.article-title',
    '.entry-title',
    '.title',
    'title'
  ];
  
  for (const selector of titleSources) {
    const titleElement = doc.querySelector(selector);
    if (titleElement && titleElement.textContent?.trim()) {
      title = titleElement.textContent.trim();
      break;
    }
  }
  
  if (!title) {
    title = 'Başlık Bulunamadı';
  }

  // Find main content area with improved selectors for Oggusto
  const contentSelectors = [
    // Oggusto specific selectors
    'body > div.container.relative > div',
    '.container.relative > div',
    // Generic content selectors
    'main',
    'article', 
    '.content', 
    '.post', 
    '.entry',
    '.post-content', 
    '.article-content', 
    '.main-content',
    '[role="main"]',
    '.prose',
    '.text-content'
  ];

  let mainContent: Element | null = null;
  
  for (const selector of contentSelectors) {
    const elements = doc.querySelectorAll(selector);
    
    // Find the element with the most text content
    let bestElement: Element | null = null;
    let maxTextLength = 0;
    
    elements.forEach(el => {
      const textLength = el.textContent?.length || 0;
      if (textLength > maxTextLength) {
        maxTextLength = textLength;
        bestElement = el;
      }
    });
    
    if (bestElement && maxTextLength > 100) { // Minimum content length
      mainContent = bestElement;
      break;
    }
  }

  // If no specific content area found, use body but clean it more
  if (!mainContent) {
    mainContent = doc.body;
    
    // Remove more unwanted elements from body
    const bodyUnwantedSelectors = [
      'nav', 'header', 'footer', 'aside', '.sidebar',
      '.navigation', '.menu', '.breadcrumb', '.pagination'
    ];
    
    bodyUnwantedSelectors.forEach(selector => {
      const elements = mainContent!.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  // Convert to markdown
  const markdown = convertElementToMarkdown(mainContent);

  // Validate that we got meaningful content
  if (markdown.length < 50) {
    throw new Error('Yeterli içerik bulunamadı. Sayfa yapısı desteklenmiyor olabilir.');
  }

  return {
    title,
    content: markdown,
    url
  };
};

const convertElementToMarkdown = (element: Element): string => {
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = cleanTextForMarkdown(node.textContent || '');
      // Skip very short text nodes that are likely formatting
      return text.length > 2 ? text : '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as Element;
    const tagName = el.tagName.toLowerCase();
    
    // Skip elements that are likely navigation or unwanted content
    const skipClasses = ['nav', 'navigation', 'menu', 'breadcrumb', 'pagination', 'sidebar'];
    const className = el.className.toString().toLowerCase();
    if (skipClasses.some(cls => className.includes(cls))) {
      return '';
    }

    const textContent = cleanTextForMarkdown(el.textContent || '');

    // Skip empty elements or very short ones that are likely formatting
    if (!textContent || textContent.length < 3) return '';

    switch (tagName) {
      case 'h1':
        return `\n# ${textContent}\n\n`;
      case 'h2':
        return `\n## ${textContent}\n\n`;
      case 'h3':
        return `\n### ${textContent}\n\n`;
      case 'h4':
        return `\n#### ${textContent}\n\n`;
      case 'h5':
        return `\n##### ${textContent}\n\n`;
      case 'h6':
        return `\n###### ${textContent}\n\n`;
      case 'p':
        const pContent = processChildren(el);
        return pContent ? `\n${pContent}\n\n` : '';
      case 'strong':
      case 'b':
        return `**${processChildren(el)}**`;
      case 'em':
      case 'i':
        return `*${processChildren(el)}*`;
      case 'del':
      case 's':
        return `~~${processChildren(el)}~~`;
      case 'ins':
        return `++${processChildren(el)}++`;
      case 'mark':
        return `==${processChildren(el)}==`;
      case 'small':
        return `<small>${processChildren(el)}</small>`;
      case 'sub':
        return `<sub>${processChildren(el)}</sub>`;
      case 'sup':
        return `<sup>${processChildren(el)}</sup>`;
      case 'code':
        return `\`${processChildren(el)}\``;
      case 'pre':
        return `\n\`\`\`\n${processChildren(el)}\n\`\`\`\n\n`;
      case 'blockquote':
        const lines = processChildren(el).split('\n').map(line => `> ${line}`).join('\n');
        return `\n${lines}\n\n`;
      case 'ul':
        return `\n${processListItems(el, '-', 0)}\n`;
      case 'ol':
        return `\n${processListItems(el, '1.', 0)}\n`;
      case 'dl':
        return `\n${processDefinitionList(el)}\n`;
      case 'li':
        return processChildren(el);
      case 'a':
        const href = el.getAttribute('href');
        const linkText = processChildren(el);
        if (href && !href.startsWith('#')) {
          return `[${linkText}](${href})`;
        }
        return linkText;
      case 'img':
        const src = el.getAttribute('src');
        const alt = el.getAttribute('alt') || 'Image';
        if (src) {
          return `![${alt}](${src})`;
        }
        return '';
      case 'table':
        return processTable(el);
      case 'br':
        return '\n';
      case 'hr':
        return '\n---\n\n';
      case 'div':
      case 'section':
      case 'article':
        // For container elements, just process children
        return processChildren(el);
      default:
        return processChildren(el);
    }
  };

  const processChildren = (element: Element): string => {
    let result = '';
    for (const child of element.childNodes) {
      const childResult = processNode(child);
      if (childResult.trim()) {
        result += childResult;
      }
    }
    return result;
  };

  const processListItems = (listElement: Element, marker: string, depth: number = 0): string => {
    const items = listElement.querySelectorAll('li');
    let result = '';
    const indent = '  '.repeat(depth);
    
    items.forEach((item, index) => {
      const itemMarker = marker === '1.' ? `${index + 1}.` : marker;
      const itemText = cleanTextForMarkdown(processChildren(item));
      
      if (itemText) {
        result += `${indent}${itemMarker} ${itemText}\n`;
        
        // Handle nested lists
        const nestedLists = item.querySelectorAll('ul, ol');
        nestedLists.forEach(nestedList => {
          const nestedMarker = nestedList.tagName.toLowerCase() === 'ol' ? '1.' : '-';
          const nestedContent = processListItems(nestedList, nestedMarker, depth + 1);
          result += nestedContent;
        });
      }
    });
    
    return result;
  };

  const processDefinitionList = (dlElement: Element): string => {
    const terms = dlElement.querySelectorAll('dt');
    let result = '';

    terms.forEach((term, index) => {
      const termText = cleanTextForMarkdown(processChildren(term));
      if (termText) {
        result += `**${termText}**\n`;
        
        // Find corresponding dd element
        const nextElement = term.nextElementSibling;
        if (nextElement && nextElement.tagName.toLowerCase() === 'dd') {
          const descriptionText = cleanTextForMarkdown(processChildren(nextElement));
          if (descriptionText) {
            result += `: ${descriptionText}\n\n`;
          }
        } else {
          result += '\n';
        }
      }
    });

    return result;
  };

  const processTable = (tableElement: Element): string => {
    const rows = tableElement.querySelectorAll('tr');
    if (rows.length === 0) return '';

    let tableMarkdown = '\n';
    let maxColumns = 0;

    // First pass: determine max columns and build rows
    const processedRows: string[][] = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 0) return;

      const rowData: string[] = [];
      cells.forEach(cell => {
        const cellText = cleanTextForMarkdown(processChildren(cell)).replace(/\|/g, '\\|'); // Escape pipe characters
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        
        // Add the cell content
        rowData.push(cellText);
        
        // Add empty cells for colspan > 1
        for (let i = 1; i < colspan; i++) {
          rowData.push('');
        }
      });
      
      processedRows.push(rowData);
      maxColumns = Math.max(maxColumns, rowData.length);
    });

    if (processedRows.length === 0) return '';

    // Second pass: build markdown table with proper alignment
    processedRows.forEach((rowData, rowIndex) => {
      // Pad row with empty cells if needed
      while (rowData.length < maxColumns) {
        rowData.push('');
      }

      let rowMarkdown = '|';
      rowData.forEach(cellText => {
        rowMarkdown += ` ${cellText} |`;
      });
      
      tableMarkdown += rowMarkdown + '\n';

      // Add header separator for first row
      if (rowIndex === 0) {
        let separator = '|';
        rowData.forEach(() => {
          separator += ' --- |';
        });
        tableMarkdown += separator + '\n';
      }
    });

    return tableMarkdown + '\n';
  };

  const result = processNode(element)
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .trim();

  return result;
};