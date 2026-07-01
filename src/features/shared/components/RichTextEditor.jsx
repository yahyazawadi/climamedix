import { useRef, useCallback, useEffect } from 'preact/hooks';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFileToR2 } from '../../../utils/s3Client';
import { uploadVideoToR2 } from '../../learning-hub/services/adminLmsService';

// Custom Video Blot
const BlockEmbed = Quill.import('blots/block/embed');
class VideoBlot extends BlockEmbed {
  static create(url) {
    let node = super.create();
    node.setAttribute('src', url);
    node.setAttribute('controls', '');
    node.setAttribute('width', '100%');
    node.style.borderRadius = '8px';
    node.style.marginTop = '10px';
    node.style.marginBottom = '10px';
    return node;
  }
  static value(node) {
    return node.getAttribute('src');
  }
}
VideoBlot.blotName = 'video';
VideoBlot.tagName = 'video';
Quill.register(VideoBlot);

// Custom Audio Blot
class AudioBlot extends BlockEmbed {
  static create(url) {
    let node = super.create();
    node.setAttribute('src', url);
    node.setAttribute('controls', '');
    node.setAttribute('width', '100%');
    node.style.marginTop = '10px';
    node.style.marginBottom = '10px';
    return node;
  }
  static value(node) {
    return node.getAttribute('src');
  }
}
AudioBlot.blotName = 'audio';
AudioBlot.tagName = 'audio';
Quill.register(AudioBlot);

const convertToWebP = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') || file.type === 'image/webp') {
      resolve(file); // Don't convert if it's already webp or not an image
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
        resolve(webpFile);
      }, "image/webp", 0.85);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(e);
    };
    img.src = objectUrl;
  });
};

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  isRtl, 
  onUploadingMedia,
  imageBucketFolder = 'editor_images' 
}) {
  const quillRef = useRef(null);

  // Add tooltips to Quill toolbar
  useEffect(() => {
    const tooltips = {
      '.ql-header[value="1"]': isRtl ? 'عنوان رئيسي 1' : 'Heading 1',
      '.ql-header[value="2"]': isRtl ? 'عنوان فرعي 2' : 'Heading 2',
      '.ql-header[value="3"]': isRtl ? 'عنوان أصغر 3' : 'Heading 3',
      '.ql-header': isRtl ? 'فقرة عادية' : 'Normal Text',
      '.ql-bold': isRtl ? 'عريض (Bold)' : 'Bold',
      '.ql-italic': isRtl ? 'مائل (Italic)' : 'Italic',
      '.ql-underline': isRtl ? 'تسطير (Underline)' : 'Underline',
      '.ql-strike': isRtl ? 'يتوسطه خط (Strike)' : 'Strikethrough',
      '.ql-list[value="ordered"]': isRtl ? 'قائمة رقمية' : 'Numbered List',
      '.ql-list[value="bullet"]': isRtl ? 'قائمة نقطية' : 'Bullet List',
      '.ql-align': isRtl ? 'محاذاة النص' : 'Text Alignment',
      '.ql-link': isRtl ? 'إدراج رابط (Ctrl+K)' : 'Insert Link (Ctrl+K)',
      '.ql-image': isRtl ? 'إدراج صورة' : 'Insert Image',
      '.ql-video': isRtl ? 'إدراج فيديو' : 'Insert Video',
      '.ql-audio': isRtl ? 'إدراج ملف صوتي' : 'Insert Audio',
      '.ql-clean': isRtl ? 'مسح التنسيق' : 'Clear Formatting',
      '.ql-color': isRtl ? 'لون النص' : 'Text Color',
      '.ql-background': isRtl ? 'لون الخلفية' : 'Background Color'
    };

    const timer = setTimeout(() => {
      Object.entries(tooltips).forEach(([selector, title]) => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => el.setAttribute('title', title));
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [isRtl]);

  const uploadAndInsertImage = async (file) => {
    try {
      onUploadingMedia?.(true);
      const webpFile = await convertToWebP(file);
      const url = await uploadFileToR2(webpFile, imageBucketFolder);
      
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert(isRtl ? "فشل رفع الصورة." : "Failed to upload image.");
    } finally {
      onUploadingMedia?.(false);
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        uploadAndInsertImage(file);
      }
    };
  }, []);

  const videoHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          onUploadingMedia?.(true);
          const url = await uploadVideoToR2(file);
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'video', url);
          quill.setSelection(range.index + 1);
        } catch (err) {
          console.error("Failed to upload video:", err);
          alert(isRtl ? "فشل رفع الفيديو." : "Failed to upload video.");
        } finally {
          onUploadingMedia?.(false);
        }
      }
    };
  }, []);

  const audioHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'audio/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          onUploadingMedia?.(true);
          const url = await uploadFileToR2(file, 'course_audio'); // Upload audio file
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'audio', url);
          quill.setSelection(range.index + 1);
        } catch (err) {
          console.error("Failed to upload audio:", err);
          alert(isRtl ? "فشل رفع الملف الصوتي." : "Failed to upload audio.");
        } finally {
          onUploadingMedia?.(false);
        }
      }
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image', 'video', 'audio'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        video: videoHandler,
        audio: audioHandler
      }
    }
  };

  // Add custom icon for audio since Quill doesn't have one natively
  useEffect(() => {
    const audioBtn = document.querySelector('.ql-audio');
    if (audioBtn && !audioBtn.innerHTML.includes('svg')) {
      audioBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
    }
  }, []);

  return (
    <div className="custom-quill-wrapper">
      <ReactQuill 
        ref={quillRef}
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
