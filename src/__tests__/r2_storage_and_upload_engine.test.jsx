import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Mock the presigner module so getSignedUrl can be controlled in ESM
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn()
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uploadFileToR2, r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from '../utils/s3Client';

describe('Cloudflare R2 Storage & Upload Engine Exhaustive Matrix (36 Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── 1. Parameter Validation & Guard Rails (5 Tests) ────────────────────────
  describe('1. Parameter Validation & Guard Rails (5 Tests)', () => {
    it('returns null immediately when file is null', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send');
      const result = await uploadFileToR2(null);
      expect(result).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('returns null immediately when file is undefined', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send');
      const result = await uploadFileToR2(undefined);
      expect(result).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('returns null immediately when file is false', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send');
      const result = await uploadFileToR2(false);
      expect(result).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('returns null immediately when file is empty string', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send');
      const result = await uploadFileToR2('');
      expect(result).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('defaults folder parameter to "uploads" when not specified', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const url = await uploadFileToR2(file);
      
      expect(sendSpy).toHaveBeenCalledTimes(1);
      const command = sendSpy.mock.calls[0][0];
      expect(command.input.Key.startsWith('uploads/')).toBe(true);
      expect(url).toContain('/uploads/');
    });
  });

  // ─── 2. Key Generation, Extensions & Path Invariants (8 Tests) ─────────────
  describe('2. Key Generation, Extensions & Path Invariants (8 Tests)', () => {
    it('preserves standard single extension (.pdf)', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['pdf-data'], 'research-paper.pdf', { type: 'application/pdf' });
      
      const url = await uploadFileToR2(file, 'research_publications');
      expect(url).toMatch(new RegExp(`^${R2_PUBLIC_URL}/research_publications/\\d+-[a-z0-9]+\\.pdf$`));
    });

    it('extracts only the final extension on multi-dot filenames (.tar.gz)', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['archive'], 'climate.dataset.backup.tar.gz', { type: 'application/gzip' });
      
      const url = await uploadFileToR2(file, 'datasets');
      expect(url.endsWith('.gz')).toBe(true);
      expect(url).toContain('datasets/');
    });

    it('handles files with no extension cleanly', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['plain text'], 'LICENSE', { type: 'text/plain' });
      
      const url = await uploadFileToR2(file, 'legal');
      expect(url.endsWith('.LICENSE')).toBe(true);
    });

    it('preserves uppercase extensions (.PNG)', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['image'], 'DIAGRAM.PNG', { type: 'image/png' });
      
      const url = await uploadFileToR2(file, 'images');
      expect(url.endsWith('.PNG')).toBe(true);
    });

    it('handles spaces and special characters in filename without crashing', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['data'], 'Health & Climate [2026] #FINAL.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      const url = await uploadFileToR2(file, 'documents');
      expect(url.endsWith('.docx')).toBe(true);
    });

    it('handles non-ASCII and Arabic filenames', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['arabic'], 'تقرير_جودة_الهواء_2026.pdf', { type: 'application/pdf' });
      
      const url = await uploadFileToR2(file, 'reports');
      expect(url.endsWith('.pdf')).toBe(true);
      expect(url).toContain('reports/');
    });

    it('generates distinct, non-colliding keys on rapid successive uploads of identical file', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValue({});
      const file = new File(['identical'], 'doc.pdf', { type: 'application/pdf' });
      
      const url1 = await uploadFileToR2(file, 'cvs');
      const url2 = await uploadFileToR2(file, 'cvs');
      
      expect(url1).not.toBe(url2);
      expect(url1.startsWith(`${R2_PUBLIC_URL}/cvs/`)).toBe(true);
      expect(url2.startsWith(`${R2_PUBLIC_URL}/cvs/`)).toBe(true);
    });

    it('isolates custom folders (avatars, cvs, videos, slider)', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValue({});
      const file = new File(['dummy'], 'sample.webp', { type: 'image/webp' });
      
      const folders = ['avatars', 'cvs', 'videos', 'slider', 'course_covers', 'article_thumbnails'];
      for (const folder of folders) {
        const url = await uploadFileToR2(file, folder);
        expect(url.includes(`/${folder}/`)).toBe(true);
      }
    });
  });

  // ─── 3. Direct S3 Client Upload Mode (onProgress = null) (8 Tests) ─────────
  describe('3. Direct S3 Client Upload Mode (onProgress = null) (8 Tests)', () => {
    it('converts file arrayBuffer into Uint8Array body', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const fileContent = 'Hello ClimaMedix S3 Storage';
      const file = new File([fileContent], 'hello.txt', { type: 'text/plain' });

      await uploadFileToR2(file, 'text_files');

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const command = sendSpy.mock.calls[0][0];
      expect(command.input.Body).toBeInstanceOf(Uint8Array);
      
      const decoded = new TextDecoder().decode(command.input.Body);
      expect(decoded).toBe(fileContent);
    });

    it('passes accurate Bucket and ContentType to PutObjectCommand', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['{}'], 'schema.json', { type: 'application/json' });

      await uploadFileToR2(file, 'schemas');

      const command = sendSpy.mock.calls[0][0];
      expect(command.input.Bucket).toBe(R2_BUCKET_NAME);
      expect(command.input.ContentType).toBe('application/json');
    });

    it('returns exact public URL combining R2_PUBLIC_URL and generated Key', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const file = new File(['binary'], 'sample.pdf', { type: 'application/pdf' });

      const url = await uploadFileToR2(file, 'research');

      const command = sendSpy.mock.calls[0][0];
      expect(url).toBe(`${R2_PUBLIC_URL}/${command.input.Key}`);
    });

    it('handles empty 0-byte file without crashing', async () => {
      const sendSpy = vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      const url = await uploadFileToR2(emptyFile, 'empty_test');
      expect(url).toBeDefined();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      const command = sendSpy.mock.calls[0][0];
      expect(command.input.Body.byteLength).toBe(0);
    });

    it('rethrows storage error with "Failed to upload file to storage" prefix when S3 send fails', async () => {
      vi.spyOn(r2Client, 'send').mockRejectedValueOnce(new Error('AccessDenied: Invalid signature'));
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(uploadFileToR2(file, 'fail_test')).rejects.toThrow(
        'Failed to upload file to storage: AccessDenied: Invalid signature'
      );
    });

    it('handles non-Error rejection object gracefully in S3 mode', async () => {
      vi.spyOn(r2Client, 'send').mockRejectedValueOnce('Network Timeout');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(uploadFileToR2(file, 'fail_test')).rejects.toThrow(
        'Failed to upload file to storage: Network Timeout'
      );
    });

    it('handles arrayBuffer failure gracefully', async () => {
      const fakeFile = {
        name: 'corrupted.bin',
        type: 'application/octet-stream',
        arrayBuffer: vi.fn().mockRejectedValueOnce(new Error('Disk read error'))
      };

      await expect(uploadFileToR2(fakeFile, 'disk_error')).rejects.toThrow(
        'Failed to upload file to storage: Disk read error'
      );
    });

    it('does not instantiate XMLHttpRequest when onProgress is null or omitted', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValueOnce({});
      const xhrSpy = vi.fn();
      vi.stubGlobal('XMLHttpRequest', class { constructor() { xhrSpy(); } });

      const file = new File(['data'], 'test.txt', { type: 'text/plain' });

      await uploadFileToR2(file, 'test', null);
      expect(xhrSpy).not.toHaveBeenCalled();
    });
  });

  // ─── 4. Presigned URL & XHR Progress Upload Mode (12 Tests) ─────────────────
  describe('4. Presigned URL & XHR Progress Upload Mode (12 Tests)', () => {
    function createMockXHR({ status = 200, responseText = '', shouldFail = false }) {
      const xhrInstance = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function(file) {
          setTimeout(() => {
            if (shouldFail) {
              if (this.onerror) this.onerror(new Error('Network offline'));
            } else {
              this.status = status;
              this.responseText = responseText;
              if (this.onload) this.onload();
            }
          }, 0);
        }),
        upload: {},
        status: status,
        responseText: responseText,
        onload: null,
        onerror: null,
      };
      
      class MockXHR {
        constructor() {
          return xhrInstance;
        }
      }

      vi.stubGlobal('XMLHttpRequest', MockXHR);
      return xhrInstance;
    }

    it('requests signed URL with expiresIn: 3600 and correct PutObjectCommand', async () => {
      getSignedUrl.mockResolvedValueOnce('https://r2-upload.storage.com/signed-put');
      const mockXhr = createMockXHR({ status: 200 });

      const file = new File(['content'], 'avatar.webp', { type: 'image/webp' });
      const onProgress = vi.fn();

      await uploadFileToR2(file, 'avatars', onProgress);

      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      expect(getSignedUrl).toHaveBeenCalledWith(
        r2Client,
        expect.any(PutObjectCommand),
        { expiresIn: 3600 }
      );
    });

    it('opens PUT request to the signed URL and sets Content-Type header', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/upload-target');
      const mockXhr = createMockXHR({ status: 200 });

      const file = new File(['data'], 'clip.mp4', { type: 'video/mp4' });
      const onProgress = vi.fn();

      await uploadFileToR2(file, 'videos', onProgress);

      expect(mockXhr.open).toHaveBeenCalledWith('PUT', 'https://signed.r2.com/upload-target', true);
      expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'video/mp4');
      expect(mockXhr.send).toHaveBeenCalledWith(file);
    });

    it('emits accurate progress percentages (0%, 25%, 50%, 100%) rounded to integer', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/progress');
      
      let capturedOnProgress;
      const xhrInstance = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function() {
          setTimeout(() => {
            if (capturedOnProgress) {
              capturedOnProgress({ lengthComputable: true, loaded: 0, total: 1000 });
              capturedOnProgress({ lengthComputable: true, loaded: 254, total: 1000 });
              capturedOnProgress({ lengthComputable: true, loaded: 789, total: 1000 });
              capturedOnProgress({ lengthComputable: true, loaded: 1000, total: 1000 });
            }
            this.status = 200;
            if (this.onload) this.onload();
          }, 0);
        }),
        upload: {},
        status: 200,
        onload: null,
        onerror: null,
      };

      Object.defineProperty(xhrInstance.upload, 'onprogress', {
        set(fn) { capturedOnProgress = fn; },
        get() { return capturedOnProgress; }
      });

      class MockXHR {
        constructor() {
          return xhrInstance;
        }
      }
      vi.stubGlobal('XMLHttpRequest', MockXHR);

      const file = new File(['audio-stream'], 'lecture.mp3', { type: 'audio/mpeg' });
      const progressTracker = vi.fn();

      await uploadFileToR2(file, 'course_audio', progressTracker);

      expect(progressTracker).toHaveBeenCalledWith(0);
      expect(progressTracker).toHaveBeenCalledWith(25); // Math.round(25.4)
      expect(progressTracker).toHaveBeenCalledWith(79); // Math.round(78.9)
      expect(progressTracker).toHaveBeenCalledWith(100);
    });

    it('ignores progress events when lengthComputable is false', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/progress');
      
      let capturedOnProgress;
      const xhrInstance = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(function() {
          setTimeout(() => {
            if (capturedOnProgress) {
              capturedOnProgress({ lengthComputable: false, loaded: 50, total: 0 });
            }
            this.status = 200;
            if (this.onload) this.onload();
          }, 0);
        }),
        upload: {},
        status: 200,
        onload: null,
        onerror: null,
      };

      Object.defineProperty(xhrInstance.upload, 'onprogress', {
        set(fn) { capturedOnProgress = fn; },
        get() { return capturedOnProgress; }
      });

      class MockXHR {
        constructor() {
          return xhrInstance;
        }
      }
      vi.stubGlobal('XMLHttpRequest', MockXHR);

      const file = new File(['text'], 'file.txt', { type: 'text/plain' });
      const progressTracker = vi.fn();

      await uploadFileToR2(file, 'uploads', progressTracker);
      expect(progressTracker).not.toHaveBeenCalled();
    });

    it('resolves on HTTP 200 status', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 200 });

      const file = new File(['abc'], 'test.txt', { type: 'text/plain' });
      const url = await uploadFileToR2(file, 'cvs', vi.fn());

      expect(url).toContain('/cvs/');
      expect(url.startsWith(R2_PUBLIC_URL)).toBe(true);
    });

    it('resolves on HTTP 201 Created status', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 201 });

      const file = new File(['abc'], 'test.txt', { type: 'text/plain' });
      const url = await uploadFileToR2(file, 'cvs', vi.fn());

      expect(url).toContain('/cvs/');
    });

    it('resolves on HTTP 204 No Content status', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 204 });

      const file = new File(['abc'], 'test.txt', { type: 'text/plain' });
      const url = await uploadFileToR2(file, 'cvs', vi.fn());

      expect(url).toContain('/cvs/');
    });

    it('rejects with "Upload failed: 400 Bad Request" on client error', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 400, responseText: 'Bad Request' });

      const file = new File(['abc'], 'bad.txt', { type: 'text/plain' });
      await expect(uploadFileToR2(file, 'test', vi.fn())).rejects.toThrow(
        'Upload failed: 400 Bad Request'
      );
    });

    it('rejects with "Upload failed: 403 Request has expired" when signed url expired', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 403, responseText: 'Request has expired' });

      const file = new File(['abc'], 'expired.txt', { type: 'text/plain' });
      await expect(uploadFileToR2(file, 'test', vi.fn())).rejects.toThrow(
        'Upload failed: 403 Request has expired'
      );
    });

    it('rejects with "Upload failed: 500 S3 Internal Server Error" on server error', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ status: 500, responseText: 'S3 Internal Server Error' });

      const file = new File(['abc'], 'err.txt', { type: 'text/plain' });
      await expect(uploadFileToR2(file, 'test', vi.fn())).rejects.toThrow(
        'Upload failed: 500 S3 Internal Server Error'
      );
    });

    it('rejects with "Network error during upload" when XHR onerror fires', async () => {
      getSignedUrl.mockResolvedValueOnce('https://signed.r2.com/target');
      createMockXHR({ shouldFail: true });

      const file = new File(['abc'], 'net.txt', { type: 'text/plain' });
      await expect(uploadFileToR2(file, 'test', vi.fn())).rejects.toThrow(
        'Network error during upload'
      );
    });

    it('rethrows clean message when getSignedUrl throws', async () => {
      getSignedUrl.mockRejectedValueOnce(new Error('Signing credentials missing'));
      const file = new File(['abc'], 'fail.txt', { type: 'text/plain' });

      await expect(uploadFileToR2(file, 'test', vi.fn())).rejects.toThrow(
        'Failed to upload file to storage: Signing credentials missing'
      );
    });
  });

  // ─── 5. Concurrency & Performance Stability (3 Tests) ──────────────────────
  describe('5. Concurrency & Performance Stability (3 Tests)', () => {
    it('handles 10 parallel direct uploads without race conditions or key collisions', async () => {
      vi.spyOn(r2Client, 'send').mockResolvedValue({});
      
      const files = Array.from({ length: 10 }, (_, i) => 
        new File([`content-${i}`], `file-${i}.pdf`, { type: 'application/pdf' })
      );

      const urls = await Promise.all(files.map((f, i) => uploadFileToR2(f, `batch_${i}`)));

      expect(urls).toHaveLength(10);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(10);
    });

    it('maintains independent progress callbacks for concurrent XHR uploads', async () => {
      getSignedUrl.mockResolvedValue('https://signed.r2.com/multi');
      
      const file1 = new File(['data1'], 'file1.mp4', { type: 'video/mp4' });
      const file2 = new File(['data2'], 'file2.mp4', { type: 'video/mp4' });
      
      const progress1 = vi.fn();
      const progress2 = vi.fn();

      let instanceCount = 0;
      class MockXHR {
        constructor() {
          const id = ++instanceCount;
          let onprogress;
          return {
            open: vi.fn(),
            setRequestHeader: vi.fn(),
            send: vi.fn(function() {
              setTimeout(() => {
                if (onprogress) onprogress({ lengthComputable: true, loaded: id * 50, total: 100 });
                this.status = 200;
                if (this.onload) this.onload();
              }, 0);
            }),
            upload: {
              set onprogress(fn) { onprogress = fn; },
              get() { return onprogress; }
            },
            status: 200,
            onload: null,
            onerror: null,
          };
        }
      }

      vi.stubGlobal('XMLHttpRequest', MockXHR);

      await Promise.all([
        uploadFileToR2(file1, 'videos', progress1),
        uploadFileToR2(file2, 'videos', progress2)
      ]);

      expect(progress1).toHaveBeenCalledWith(50);
      expect(progress2).toHaveBeenCalledWith(100);
    });

    it('one failed upload in a concurrent batch does not disrupt another successful upload', async () => {
      let callCount = 0;
      vi.spyOn(r2Client, 'send').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('S3 Outage');
        return {};
      });

      const file1 = new File(['bad'], 'bad.txt', { type: 'text/plain' });
      const file2 = new File(['good'], 'good.txt', { type: 'text/plain' });

      const results = await Promise.allSettled([
        uploadFileToR2(file1, 'concurrent'),
        uploadFileToR2(file2, 'concurrent')
      ]);

      expect(results[0].status).toBe('rejected');
      expect(results[0].reason.message).toContain('S3 Outage');
      expect(results[1].status).toBe('fulfilled');
      expect(results[1].value).toContain('/concurrent/');
    });
  });
});
