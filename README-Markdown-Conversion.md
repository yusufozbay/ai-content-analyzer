# HTML to Markdown Conversion System

This project includes a comprehensive HTML to Markdown conversion system that can handle various HTML elements and convert them to properly formatted Markdown.

## Features

### Headers
- **H1-H6**: All header levels are supported
- **Format**: `# Header 1`, `## Header 2`, etc.

### Text Formatting
- **Bold**: `<strong>` and `<b>` → `**text**`
- **Italic**: `<em>` and `<i>` → `*text*`
- **Strikethrough**: `<del>` and `<s>` → `~~text~~`
- **Inserted**: `<ins>` → `++text++`
- **Highlighted**: `<mark>` → `==text==`
- **Small**: `<small>` → `<small>text</small>`
- **Subscript**: `<sub>` → `<sub>text</sub>`
- **Superscript**: `<sup>` → `<sup>text</sup>`

### Lists
- **Unordered Lists**: `<ul>` → `- item`
- **Ordered Lists**: `<ol>` → `1. item`
- **Nested Lists**: Supports unlimited nesting with proper indentation
- **Definition Lists**: `<dl>`, `<dt>`, `<dd>` → `**term**\n: definition`

### Tables
- **Basic Tables**: Converts `<table>`, `<tr>`, `<td>`, `<th>` to Markdown tables
- **Header Row**: Automatically adds separator row after first row
- **Colspan Support**: Handles `colspan` attributes
- **Pipe Escaping**: Escapes pipe characters in cell content

### Links and Images
- **Links**: `<a href="...">` → `[text](url)`
- **Images**: `<img src="..." alt="...">` → `![alt](src)`

### Code
- **Inline Code**: `<code>` → `` `code` ``
- **Code Blocks**: `<pre><code>` → ``` ```code``` ```

### Blockquotes
- **Blockquotes**: `<blockquote>` → `> text`

### Other Elements
- **Horizontal Rules**: `<hr>` → `---`
- **Line Breaks**: `<br>` → `\n`

## Usage

### Basic Usage
```typescript
import { convertHtmlToMarkdown } from './utils/markdownConverter';

const htmlString = '<h1>Title</h1><p>This is <strong>bold</strong> text.</p>';
const markdown = convertHtmlToMarkdown(htmlString);
console.log(markdown);
```

### URL Content Extraction
```typescript
import { extractContentFromUrl } from './services/contentExtractorService';

const content = await extractContentFromUrl('https://example.com');
console.log(content.markdown);
```

## Conversion Examples

### Input HTML
```html
<h1>Main Title</h1>
<h2>Subtitle</h2>
<p>This is a <strong>bold text</strong> and this is <em>italic text</em>.</p>
<ul>
    <li>First item</li>
    <li>Second item with <strong>bold text</strong></li>
    <li>Third item
        <ul>
            <li>Nested item 1</li>
            <li>Nested item 2</li>
        </ul>
    </li>
</ul>
<table>
    <tr>
        <th>Header 1</th>
        <th>Header 2</th>
    </tr>
    <tr>
        <td>Cell 1</td>
        <td>Cell 2</td>
    </tr>
</table>
```

### Output Markdown
```markdown
# Main Title

## Subtitle

This is a **bold text** and this is *italic text*.

- First item
- Second item with **bold text**
- Third item
  - Nested item 1
  - Nested item 2

| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |
```

## Advanced Features

### Content Cleaning
- Removes unwanted elements (ads, navigation, etc.)
- Cleans up whitespace and formatting
- Handles nested elements properly

### Error Handling
- Graceful handling of malformed HTML
- Fallback for unsupported elements
- Validation of extracted content

### Performance
- Efficient DOM parsing
- Minimal memory usage
- Fast conversion for large documents

## Configuration

The system can be customized by modifying the `unwantedSelectors` array in the conversion functions to remove specific elements from the output.

## Browser Compatibility

This system works in all modern browsers that support:
- `DOMParser`
- `querySelector` and `querySelectorAll`
- `fetch` API (for URL content extraction)

## Dependencies

- No external dependencies required
- Uses native browser APIs
- Compatible with React and other frameworks

## Testing

Use the provided `test-markdown-conversion.html` file to test the conversion system with various HTML elements and structures. 