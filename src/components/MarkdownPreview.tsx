import React, { useState } from 'react';
import { FileText, Code, Copy, Check } from 'lucide-react';
import { convertHtmlToMarkdown } from '../utils/markdownConverter';

interface MarkdownPreviewProps {
  htmlContent?: string;
  markdownContent?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  htmlContent = '', 
  markdownContent = '' 
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'markdown'>('html');
  const [copied, setCopied] = useState(false);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const convertedMarkdown = markdownContent || (htmlContent ? convertHtmlToMarkdown(htmlContent) : '');

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Content Conversion Preview
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('html')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'html'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Code className="w-4 h-4 inline mr-1" />
            HTML
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'markdown'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Markdown
          </button>
        </div>
      </div>

      <div className="relative">
        {activeTab === 'html' ? (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">HTML Content</span>
              <button
                onClick={() => handleCopy(htmlContent)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
              {htmlContent || 'No HTML content available'}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Markdown Output</span>
              <button
                onClick={() => handleCopy(convertedMarkdown)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
              {convertedMarkdown || 'No markdown content available'}
            </pre>
          </div>
        )}
      </div>

      {htmlContent && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Conversion Stats:</strong> HTML length: {htmlContent.length} chars → 
            Markdown length: {convertedMarkdown.length} chars 
            ({Math.round((convertedMarkdown.length / htmlContent.length) * 100)}% size)
          </p>
        </div>
      )}
    </div>
  );
};

export default MarkdownPreview; 