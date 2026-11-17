import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Upload, X, Check } from 'lucide-react';
import { apiFetch, formatFileSize, uploadImageFile } from '../lib/api';
import type { MediaFile } from '../types/blog';

interface MediaPickerModalProps {
  isOpen: boolean;
  mode: 'featured' | 'inline';
  onClose: () => void;
  onSelect: (payload: { url: string; alt: string; caption?: string }) => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSelect,
}) => {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSelectedUrl('');
    setAltText('');
    setCaption('');
    setLoading(true);
    apiFetch<{ files: MediaFile[] }>('/api/admin/media')
      .then((res) => setFiles(res.files || []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = await uploadImageFile(file);
      const newItem: MediaFile = {
        url: uploaded.url,
        name: uploaded.name,
        size: uploaded.size,
        createdAt: new Date().toISOString(),
      };
      setFiles((prev) => [newItem, ...prev]);
      setSelectedUrl(uploaded.url);
      if (!altText) {
        setAltText(file.name.replace(/\.[^.]+$/, ''));
      }
      setTab('library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در آپلود تصویر.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleConfirm() {
    if (!selectedUrl) {
      setError('لطفاً ابتدا یک تصویر آپلود یا انتخاب کنید.');
      return;
    }
    onSelect({
      url: selectedUrl,
      alt: altText.trim() || 'تصویر مقاله رایا‌نیک',
      caption: caption.trim() || undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            {mode === 'featured' ? 'انتخاب یا آپلود تصویر شاخص' : 'درج تصویر در متن مقاله'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              tab === 'upload'
                ? 'border-[#6E45E9] text-[#6E45E9] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            آپلود تصویر جدید
          </button>
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              tab === 'library'
                ? 'border-[#6E45E9] text-[#6E45E9] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            کتابخانه تصاویر ({files.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {tab === 'upload' ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/70">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
                id="media-upload-input"
              />
              <div className="mx-auto w-12 h-12 rounded-xl bg-[#6E45E9]/10 text-[#6E45E9] flex items-center justify-center mb-3">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {uploading ? 'در حال آپلود تصویر...' : 'فایل تصویر خود را انتخاب کنید'}
              </p>
              <p className="text-xs text-slate-500 mb-5">
                فرمت‌های مجاز: JPG، PNG، WebP، GIF، SVG (حداکثر ۸ مگابایت)
              </p>
              <label
                htmlFor="media-upload-input"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold cursor-pointer hover:bg-[#5c36d1] transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                انتخاب فایل از سیستم
              </label>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-sm text-slate-500">در حال بارگذاری تصاویر...</div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              هنوز تصویری آپلود نشده است. از تب «آپلود تصویر جدید» یک عکس بارگذاری کنید.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((item) => {
                const active = selectedUrl === item.url;
                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setSelectedUrl(item.url)}
                    className={`group relative rounded-xl border text-right overflow-hidden transition-all ${
                      active
                        ? 'border-[#6E45E9] ring-2 ring-[#6E45E9]/30'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {active && (
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#6E45E9] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <div className="p-2 bg-white">
                      <div className="text-xs font-medium text-slate-700 truncate" dir="ltr">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {formatFileSize(item.size)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedUrl && (
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  متن جایگزین تصویر (Alt Text برای سئو)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="توضیح کوتاه تصویر..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#6E45E9]"
                />
              </div>
              {mode === 'inline' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    توضیح زیر تصویر (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="زیرنویس تصویر داخل مقاله..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#6E45E9]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedUrl}
            className="px-5 py-2 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold hover:bg-[#5c36d1] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === 'featured' ? 'تنظیم به عنوان تصویر شاخص' : 'درج تصویر در مقاله'}
          </button>
        </div>
      </div>
    </div>
  );
};
