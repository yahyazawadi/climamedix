import { createElement } from 'preact';
import { CustomVideoPlayer } from '../../learning-hub/components/player/CustomVideoPlayer';
import { CustomAudioPlayer } from './CustomAudioPlayer';

export function RichTextRenderer({ html, lang = 'ar', userId, lessonId, courseId }) {
  if (!html) return null;

  // Parse the HTML string into a DOM tree
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Recursive function to convert DOM nodes to Preact VNodes
  const renderNode = (node, index) => {
    // 1. Text Node
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    // 2. Element Node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // -- Intercept Media Tags --
      if (tagName === 'video') {
        const src = node.getAttribute('src');
        return <div key={index} style={{ margin: '20px 0' }}><CustomVideoPlayer videoUrl={src} lang={lang} userId={userId} lessonId={lessonId} courseId={courseId} /></div>;
      }
      
      if (tagName === 'audio') {
        const src = node.getAttribute('src');
        let title = 'Audio Track';
        if (src) {
           const parts = src.split('/');
           title = parts[parts.length - 1] || 'Audio Track';
           title = decodeURIComponent(title).replace(/\.[^/.]+$/, "");
        }
        return <div key={index} style={{ margin: '20px 0' }}><CustomAudioPlayer src={src} title={title} userId={userId} lessonId={lessonId} /></div>;
      }

      // -- Standard HTML Tags --
      const props = { key: index };
      
      // Map attributes
      for (let attr of node.attributes) {
        let name = attr.name;
        if (name === 'class') name = 'className';
        if (name === 'for') name = 'htmlFor';
        
        if (name === 'style') {
          // Convert inline style string to React/Preact style object
          const styleObj = {};
          attr.value.split(';').forEach(style => {
            if (!style.trim()) return;
            const splitIndex = style.indexOf(':');
            if (splitIndex > -1) {
              const key = style.substring(0, splitIndex).trim();
              const value = style.substring(splitIndex + 1).trim();
              const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
              styleObj[camelKey] = value;
            }
          });
          props.style = styleObj;
          continue;
        }
        props[name] = attr.value;
      }

      // Process children
      const children = Array.from(node.childNodes).map((child, i) => renderNode(child, `${index}-${i}`));
      
      // Use createElement to render the dynamic tag
      return createElement(tagName, props, children.length > 0 ? children : null);
    }
    
    return null;
  };

  return (
    <div className={`rich-text-renderer ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      {Array.from(doc.body.childNodes).map((child, i) => renderNode(child, i))}
    </div>
  );
}
