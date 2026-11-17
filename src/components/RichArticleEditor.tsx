import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code2,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  MousePointerClick,
  Pilcrow,
  Quote,
  Underline,
  X,
} from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';

interface RichArticleEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type EditorMode = 'visual' | 'html' | 'preview';

export const RichArticleEditor: React.FC<RichArticleEditorProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<EditorMode>('visual');
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isButtonOpen, setIsButtonOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  // CTA Button Builder State
  const [btnLabel, setBtnLabel] = useState('درخواست مشاوره و سفارش');
  const [btnUrl, setBtnUrl] = useState('https://rayanik.net/contact-us');
  const [btnVariant, setBtnVariant] = useState<'primary' | 'cyan' | 'outline' | 'dark'>('primary');
  const [btnAlign, setBtnAlign] = useState<'start' | 'center' | 'end'>('center');
  const [btnNewTab, setBtnNewTab] = useState(true);

  // Link Builder State
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://rayanik.net/');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastSyncedValueRef = useRef<string>('');

  useEffect(() => {
    if (mode !== 'visual') return;
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value && lastSyncedValueRef.current !== value) {
      el.innerHTML = value || '<p><br></p>';
      lastSyncedValueRef.current = value;
    }
  }, [value, mode]);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }

  function restoreSelection() {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }

  function syncFromDom() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastSyncedValueRef.current = html;
    onChange(html);
  }

  function execFormat(command: string, commandValue?: string) {
    if (mode !== 'visual') return;
    restoreSelection();
    document.execCommand(command, false, commandValue);
    syncFromDom();
  }

  function insertHtmlAtCursor(htmlSnippet: string) {
    if (mode === 'html') {
      onChange(`${value}\n${htmlSnippet}`);
      return;
    }
    if (mode !== 'visual') {
      setMode('visual');
    }
    const el = editorRef.current;
    if (!el) {
      onChange(`${value}\n${htmlSnippet}`);
      return;
    }
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const temp = document.createElement('div');
      temp.innerHTML = htmlSnippet;
      const frag = document.createDocumentFragment();
      let lastNode: ChildNode | null = null;
      while (temp.firstChild) {
        lastNode = temp.firstChild;
        frag.appendChild(lastNode);
      }
      range.insertNode(frag);
      if (lastNode) {
        const nextRange = document.createRange();
        nextRange.setStartAfter(lastNode);
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
      }
    } else {
      el.insertAdjacentHTML('beforeend', htmlSnippet);
    }
    syncFromDom();
  }

  function openMediaModal() {
    saveSelection();
    setIsMediaOpen(true);
  }

  function openButtonModal() {
    saveSelection();
    setIsButtonOpen(true);
  }

  function openLinkModal() {
    saveSelection();
    const sel = window.getSelection();
    setLinkText(sel ? sel.toString() : '');
    setIsLinkOpen(true);
  }

  function handleInsertImage(payload: { url: string; alt: string; caption?: string }) {
    const safeAlt = payload.alt.replace(/"/g, '&quot;');
    const safeCaption = payload.caption
      ? `<figcaption>${payload.caption.replace(/</g, '&lt;')}</figcaption>`
      : '';
    const html = `<figure><img src="${payload.url}" alt="${safeAlt}" />${safeCaption}</figure><p><br></p>`;
    insertHtmlAtCursor(html);
  }

  function handleInsertButton(e: React.FormEvent) {
    e.preventDefault();
    const label = btnLabel.trim() || 'مشاهده بیشتر';
    const url = btnUrl.trim() || '#';
    const targetAttr = btnNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const html = `<div class="raya-btn-wrap" data-align="${btnAlign}"><a class="raya-btn raya-btn--${btnVariant}" href="${url.replace(/"/g, '&quot;')}"${targetAttr}>${label.replace(/</g, '&lt;')}</a></div><p><br></p>`;
    insertHtmlAtCursor(html);
    setIsButtonOpen(false);
  }

  function handleInsertLink(e: React.FormEvent) {
    e.preventDefault();
    const text = linkText.trim() || linkUrl.trim();
    const url = linkUrl.trim() || '#';
    const html = `<a href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${text.replace(/</g, '&lt;')}</a>`;
    insertHtmlAtCursor(html);
    setIsLinkOpen(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => execFormat('formatBlock', '<h2>')}
            title="تیتر ۲ (H2)"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', '<h3>')}
            title="تیتر ۳ (H3)"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', '<p>')}
            title="پاراگراف"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Pilcrow className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execFormat('bold')}
            title="ضخیم (Bold)"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('italic')}
            title="کج (Italic)"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('underline')}
            title="زیرخط"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => execFormat('insertUnorderedList')}
            title="لیست نقطه‌ای"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('insertOrderedList')}
            title="لیست شماره‌دار"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execFormat('formatBlock', '<blockquote>')}
            title="نقل‌قول"
            disabled={mode !== 'visual'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={openLinkModal}
            title="درج لینک"
            disabled={mode === 'preview'}
            className="p-2 rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <Link2 className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={openMediaModal}
            disabled={mode === 'preview'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:border-[#6E45E9] hover:text-[#6E45E9] transition-colors whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            درج تصویر
          </button>

          <button
            type="button"
            onClick={openButtonModal}
            disabled={mode === 'preview'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold hover:bg-[#5c36d1] transition-colors whitespace-nowrap"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            درج دکمه (CTA)
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'visual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            دیداری
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'html' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            HTML
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            پیش‌نمایش
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      {mode === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromDom}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          className="raya-article-content min-h-[420px] p-6 text-slate-800 focus:outline-none prose-img:rounded-xl"
          dir="rtl"
        />
      )}

      {mode === 'html' && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir="ltr"
          className="w-full min-h-[420px] p-5 font-mono-ltr text-sm text-slate-800 bg-slate-50 focus:outline-none resize-y"
          placeholder="<p>متن مقاله...</p>"
        />
      )}

      {mode === 'preview' && (
        <div className="min-h-[420px] p-6 bg-[#110a14] text-slate-100">
          <div className="text-xs text-[#86defe] mb-4 pb-2 border-b border-white/10">
            پیش‌نمایش ظاهری روی تم تیره رایا‌نیک (rayanik.net)
          </div>
          <div
            className="raya-article-content max-w-2xl mx-auto"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaOpen}
        mode="inline"
        onClose={() => setIsMediaOpen(false)}
        onSelect={handleInsertImage}
      />

      {/* CTA Button Builder Modal */}
      {isButtonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleInsertButton}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900">ساخت و درج دکمه داخل مقاله</h4>
              <button
                type="button"
                onClick={() => setIsButtonOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">متن روی دکمه</label>
                <input
                  type="text"
                  required
                  value={btnLabel}
                  onChange={(e) => setBtnLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#6E45E9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">لینک مقصد دکمه</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={btnUrl}
                  onChange={(e) => setBtnUrl(e.target.value)}
                  placeholder="https://rayanik.net/contact-us"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-ltr focus:outline-none focus:border-[#6E45E9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رنگ و استایل</label>
                  <select
                    value={btnVariant}
                    onChange={(e) =>
                      setBtnVariant(e.target.value as 'primary' | 'cyan' | 'outline' | 'dark')
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#6E45E9]"
                  >
                    <option value="primary">بنفش اصلی رایا‌نیک</option>
                    <option value="cyan">فیروزه‌ای روشن</option>
                    <option value="outline">کادردار بنفش</option>
                    <option value="dark">مشکی تیره</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">چینش دکمه</label>
                  <select
                    value={btnAlign}
                    onChange={(e) => setBtnAlign(e.target.value as 'start' | 'center' | 'end')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#6E45E9]"
                  >
                    <option value="center">وسط‌چین</option>
                    <option value="start">راست‌چین</option>
                    <option value="end">چپ‌چین</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={btnNewTab}
                  onChange={(e) => setBtnNewTab(e.target.checked)}
                  className="rounded border-slate-300 text-[#6E45E9]"
                />
                باز شدن لینک در تب جدید مرورگر
              </label>

              {/* Live Button Preview */}
              <div className="p-4 rounded-xl bg-[#110a14] border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-2">پیش‌نمایش دکمه روی سایت:</div>
                <div className="raya-btn-wrap !my-0" data-align={btnAlign}>
                  <span className={`raya-btn raya-btn--${btnVariant}`}>{btnLabel || 'متن دکمه'}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsButtonOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold hover:bg-[#5c36d1]"
              >
                درج دکمه در متن
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Link Modal */}
      {isLinkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleInsertLink}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h4 className="text-base font-bold text-slate-900">درج لینک متنی</h4>
              <button
                type="button"
                onClick={() => setIsLinkOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">متن لینک</label>
                <input
                  type="text"
                  required
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="مثلاً: خدمات طراحی سایت"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#6E45E9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس URL</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-ltr focus:outline-none focus:border-[#6E45E9]"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLinkOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold hover:bg-[#5c36d1]"
              >
                درج لینک
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
