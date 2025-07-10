import { extractContentFromUrl } from '../services/contentExtractorService';

// Utility function to convert HTML string to Markdown
export const convertHtmlToMarkdown = (htmlString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'script', 'style', 'nav', 'header', 'footer', 'aside',
    '.advertisement', '.ads', '.social-share', '.newsletter',
    '.popup', '.modal', '.cookie-banner', '.sidebar',
    '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
    '.comments', '.comment-section', '.related-posts',
    '.breadcrumb', '.pagination', '.tags', '.categories',
    '.author-bio', '.share-buttons', '.social-media'
  ];

  unwantedSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Convert to markdown using the existing logic
  const convertElementToMarkdown = (element: Element): string => {
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = cleanTextForMarkdown(node.textContent || '');
        return text.length > 2 ? text : '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      const textContent = cleanTextForMarkdown(el.textContent || '');

      if (!textContent || textContent.length < 3) return '';

      switch (tagName) {
        case 'h1': return `\n# ${textContent}\n\n`;
        case 'h2': return `\n## ${textContent}\n\n`;
        case 'h3': return `\n### ${textContent}\n\n`;
        case 'h4': return `\n#### ${textContent}\n\n`;
        case 'h5': return `\n##### ${textContent}\n\n`;
        case 'h6': return `\n###### ${textContent}\n\n`;
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

      terms.forEach((term) => {
        const termText = cleanTextForMarkdown(processChildren(term));
        if (termText) {
          result += `**${termText}**\n`;
          
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
      const processedRows: string[][] = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length === 0) return;

        const rowData: string[] = [];
        cells.forEach(cell => {
          const cellText = cleanTextForMarkdown(processChildren(cell)).replace(/\|/g, '\\|');
          const colspan = parseInt(cell.getAttribute('colspan') || '1');
          
          rowData.push(cellText);
          
          for (let i = 1; i < colspan; i++) {
            rowData.push('');
          }
        });
        
        processedRows.push(rowData);
        maxColumns = Math.max(maxColumns, rowData.length);
      });

      if (processedRows.length === 0) return '';

      processedRows.forEach((rowData, rowIndex) => {
        while (rowData.length < maxColumns) {
          rowData.push('');
        }

        let rowMarkdown = '|';
        rowData.forEach(cellText => {
          rowMarkdown += ` ${cellText} |`;
        });
        
        tableMarkdown += rowMarkdown + '\n';

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

    const cleanTextForMarkdown = (text: string): string => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    };

    const result = processNode(element)
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();

    return result;
  };

  return convertElementToMarkdown(doc.body);
};

// Export the function for use in other parts of the application
export default convertHtmlToMarkdown; 