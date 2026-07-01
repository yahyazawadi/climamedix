import { useRef, useCallback, useEffect } from 'preact/hooks';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFileToR2 } from '../../../utils/s3Client';

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

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

  return (
    <ReactQuill 
      ref={quillRef}
      theme="snow" 
      value={value} 
      onChange={onChange} 
      modules={modules}
      placeholder={placeholder}
    />
  );
}
