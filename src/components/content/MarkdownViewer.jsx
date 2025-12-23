'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';
import { cn } from '@/lib/utils';

// Custom components for markdown rendering
const MarkdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 className="text-3xl font-bold mt-6 mb-4 pb-2 border-b" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-2xl font-semibold mt-5 mb-3 pt-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-medium mt-4 mb-2" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-lg font-medium mt-3 mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="my-3 leading-relaxed text-gray-800" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a 
      className="text-blue-600 hover:underline break-words" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props} 
    />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="my-1 pl-1" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote 
      className="border-l-4 border-gray-300 pl-4 py-1 my-3 text-gray-600 italic" 
      {...props} 
    />
  ),
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <div className="my-4 rounded-md overflow-hidden">
        <div className="bg-gray-100 px-4 py-1 text-xs text-gray-600 font-mono border-b border-gray-200">
          {match ? match[1] : 'code'}
        </div>
        <pre className="bg-gray-50 p-4 overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-red-600">
        {children}
      </code>
    );
  },
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-gray-50" {...props} />
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="divide-y divide-gray-200" {...props} />
  ),
  tr: ({ node, ...props }) => (
    <tr className="hover:bg-gray-50" {...props} />
  ),
  th: ({ node, ...props }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" 
      {...props} 
    />
  ),
  td: ({ node, ...props }) => (
    <td 
      className="px-6 py-4 whitespace-nowrap text-sm text-gray-700" 
      {...props} 
    />
  ),
  img: ({ node, ...props }) => (
    <img 
      className="my-4 rounded-lg max-w-full h-auto mx-auto shadow-sm border border-gray-200" 
      loading="lazy"
      {...props} 
    />
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-6 border-t border-gray-200" {...props} />
  ),
};

const MarkdownViewer = ({ 
  content, 
  className = '',
  allowHtml = false,
  sanitize = true
}) => {
  const containerRef = useRef(null);

  // Add anchor links to headings
  useEffect(() => {
    if (!containerRef.current) return;

    const headings = containerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach(heading => {
      if (!heading.id) {
        const id = heading.textContent
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        heading.id = id;
      }

      // Add anchor link
      const anchor = document.createElement('a');
      anchor.href = `#${heading.id}`;
      anchor.className = 'opacity-0 group-hover:opacity-100 ml-2 text-blue-500 no-underline';
      anchor.innerHTML = '#';
      anchor.setAttribute('aria-hidden', 'true');
      
      // Check if the anchor already exists
      if (!heading.querySelector('a[aria-hidden="true"]')) {
        heading.classList.add('group', 'flex', 'items-center');
        heading.appendChild(anchor);
      }
    });
  }, [content]);

  // Add copy button to code blocks
  useEffect(() => {
    if (!containerRef.current) return;

    const codeBlocks = containerRef.current.querySelectorAll('pre');
    
    codeBlocks.forEach(block => {
      // Skip if already has copy button
      if (block.querySelector('.copy-button')) return;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'relative';
      
      const button = document.createElement('button');
      button.className = 'copy-button absolute top-2 right-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors';
      button.textContent = 'Copy';
      button.onclick = async () => {
        const code = block.querySelector('code')?.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = 'Copied!';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
          button.textContent = 'Failed';
        }
      };
      
      // Wrap the pre tag with our wrapper
      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(block);
      wrapper.appendChild(button);
    });
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={cn('prose max-w-none', className)}
    >
      <ReactMarkdown
        components={MarkdownComponents}
        rehypePlugins={[
          ...(allowHtml ? [rehypeRaw] : []),
          ...(sanitize ? [rehypeSanitize] : []),
          [rehypeHighlight, { ignoreMissing: true }]
        ]}
        remarkPlugins={[remarkGfm]}
        linkTarget="_blank"
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
