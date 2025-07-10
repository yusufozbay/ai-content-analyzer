// src/utils/markdownToHtml.ts

/**
 * Converts markdown to HTML with the following rules:
 * - #, ##, ###, etc. to <h1>..<h6>
 * - **bold** to <b>bold</b>
 * - * item (at line start) to <li>item</li>
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Convert headings (from h6 to h1)
  for (let i = 6; i >= 1; i--) {
    const pattern = new RegExp(`^${'#'.repeat(i)} (.+)$`, 'gm');
    html = html.replace(pattern, `<h${i}>$1</h${i}>`);
  }

  // Convert bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  // Convert * item to <li>item</li> (only at line start)
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');

  return html;
} 