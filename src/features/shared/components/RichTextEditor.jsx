import { useRef, useCallback, useEffect, useState } from 'preact/hooks';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFileToR2 } from '../../../utils/s3Client';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'compressing', 'uploading'
  const [uploadProgress, setUploadProgress] = useState(0);
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
      '.ql-media': isRtl ? 'إدراج وسائط (صورة/فيديو)' : 'Insert Media',
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
      setUploadStatus('compressing');
      const webpFile = await convertToWebP(file);
      setUploadStatus('uploading');
      const url = await uploadFileToR2(webpFile, imageBucketFolder, (pct) => setUploadProgress(pct));
      
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true) || { index: quill.getLength() };
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert(isRtl ? "فشل رفع الصورة." : "Failed to upload image.");
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('multiple', 'true');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        setIsUploading(true);
        onUploadingMedia?.(true);
        for (let i = 0; i < input.files.length; i++) {
          await uploadAndInsertImage(input.files[i]);
          setUploadProgress(0);
        }
        setIsUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        onUploadingMedia?.(false);
      }
    };
  }, []);

  const videoHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.setAttribute('multiple', 'true');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        setIsUploading(true);
        onUploadingMedia?.(true);
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          try {
            setUploadStatus('uploading');
            const url = await uploadFileToR2(file, 'videos', (pct) => setUploadProgress(pct));
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true) || { index: quill.getLength() };
            quill.insertEmbed(range.index, 'video', url);
            quill.setSelection(range.index + 1);
          } catch (err) {
            console.error("Failed to upload video:", err);
            alert(isRtl ? "فشل رفع الفيديو." : "Failed to upload video.");
          }
          setUploadProgress(0);
        }
        setIsUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        onUploadingMedia?.(false);
      }
    };
  }, []);

  const mediaHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*,video/*');
    input.setAttribute('multiple', 'true');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        setIsUploading(true);
        onUploadingMedia?.(true);
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          if (file.type.startsWith('image/')) {
            await uploadAndInsertImage(file);
          } else if (file.type.startsWith('video/')) {
            try {
              setUploadStatus('uploading');
              const url = await uploadFileToR2(file, 'videos', (pct) => setUploadProgress(pct));
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection(true) || { index: quill.getLength() };
              quill.insertEmbed(range.index, 'video', url);
              quill.setSelection(range.index + 1);
            } catch (err) {
              console.error("Failed to upload video:", err);
              alert(isRtl ? "فشل رفع الفيديو." : "Failed to upload video.");
            }
          }
          setUploadProgress(0);
        }
        setIsUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        onUploadingMedia?.(false);
      }
    };
  }, []);

  const audioHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'audio/*');
    input.setAttribute('multiple', 'true');
    input.click();

    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        setIsUploading(true);
        onUploadingMedia?.(true);
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          try {
            setUploadStatus('uploading');
            const url = await uploadFileToR2(file, 'course_audio', (pct) => setUploadProgress(pct));
            const quill = quillRef.current.getEditor();
            const range = quill.getSelection(true) || { index: quill.getLength() };
            quill.insertEmbed(range.index, 'audio', url);
            quill.setSelection(range.index + 1);
          } catch (err) {
            console.error("Failed to upload audio:", err);
            alert(isRtl ? "فشل رفع الملف الصوتي." : "Failed to upload audio.");
          }
          setUploadProgress(0);
        }
        setIsUploading(false);
        setUploadStatus('');
        setUploadProgress(0);
        onUploadingMedia?.(false);
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
        ['link', 'image', 'video', 'audio', 'media'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
        video: videoHandler,
        media: mediaHandler,
        audio: audioHandler
      }
    }
  };

  // Add custom icons for media and audio since Quill doesn't have them natively
  useEffect(() => {
    const mediaBtn = document.querySelector('.ql-media');
    if (mediaBtn && !mediaBtn.innerHTML.includes('svg')) {
      mediaBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }
    const audioBtn = document.querySelector('.ql-audio');
    if (audioBtn && !audioBtn.innerHTML.includes('svg')) {
      audioBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
    }
  }, []);

  return (
    <div className="custom-quill-wrapper" style={{ position: 'relative' }}>
      {isUploading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.85)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(21, 180, 122, 0.2)',
            borderTopColor: '#15b47a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '12px', fontWeight: 'bold', color: '#0b2849' }}>
            {uploadStatus === 'compressing' ? (isRtl ? 'جاري ضغط الصورة ومعالجتها...' : 'Compressing Image...') : (isRtl ? `جاري رفع الملف... ${uploadProgress}%` : `Uploading Media... ${uploadProgress}%`)}
          </p>
          {uploadStatus === 'uploading' && (
            <div style={{ width: '200px', height: '6px', background: 'rgba(11,40,73,0.1)', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#15b47a', transition: 'width 0.2s ease' }} />
            </div>
          )}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}
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
