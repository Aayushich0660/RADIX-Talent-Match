import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  AlertCircle,
  X,
  LoaderCircle,
  WandSparkles,
} from 'lucide-react';
import { CvFileState } from '../../types/profile';

interface CvUploadSectionProps {
  cvFile: CvFileState | null;
  onChange: (fileState: CvFileState | null) => void;
  onParse: (file: File) => void;
  isParsing: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export const CvUploadSection: React.FC<CvUploadSectionProps> = ({
  cvFile,
  onChange,
  onParse,
  isParsing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Clean up object URLs when component unmounts or cvFile changes
  useEffect(() => {
    return () => {
      if (cvFile?.previewUrl) {
        URL.revokeObjectURL(cvFile.previewUrl);
      }
    };
  }, [cvFile?.previewUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processSelectedFile = (file: File) => {
    setErrorMessage(null);

    if (file.size === 0) {
      setErrorMessage('The selected file is empty.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds the 10 MB maximum size limit (${formatFileSize(file.size)}).`);
      return;
    }

    // Validate extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
    if (!isValidExtension) {
      setErrorMessage(
        `Invalid file format ("${file.name}"). Only PDF (.pdf) and Word documents (.docx) are supported.`
      );
      return;
    }

    // Revoke previous URL if any
    if (cvFile?.previewUrl) {
      URL.revokeObjectURL(cvFile.previewUrl);
    }

    let previewUrl: string | null = null;
    if (file.type === 'application/pdf' || extension === '.pdf') {
      previewUrl = URL.createObjectURL(file);
    }

    const newCvState: CvFileState = {
      file,
      fileName: file.name,
      fileSizeFormatted: formatFileSize(file.size),
      fileType: file.type || extension,
      previewUrl,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onChange(newCvState);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (cvFile?.previewUrl) {
      URL.revokeObjectURL(cvFile.previewUrl);
    }
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const isPdf =
    cvFile?.fileType?.includes('pdf') || cvFile?.fileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-white rounded-2xl border border-[#E8E6F0] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-[#E8E6F0] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center font-bold text-sm">
            8
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#20243A]">Curriculum Vitae (CV)</h2>
              {cvFile ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F0EEFA] text-[#4F46BA] border border-[#DCD8F0]">
                  Selected locally
                </span>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F5F4FA] text-[#73778C] border border-[#E8E6F0]">
                  Optional
                </span>
              )}
            </div>
            <p className="text-xs text-[#73778C]">
              Select a PDF or DOCX, then explicitly parse it to propose editable profile details. The CV is not stored; manual entry works without a CV.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
        id="cvFileInput"
      />

      {/* Upload Box or Attached Box */}
      {!cvFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
            dragActive
              ? 'border-[#6558D9] bg-[#F0EEFA]'
              : 'border-[#DCD8F0] hover:border-[#BDB8DC] bg-[#F5F4FA]'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-white text-[#6558D9] border border-[#E8E6F0] flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#20243A]">
            Drag and drop your CV file here, or browse local files
          </h3>
          <p className="text-xs text-[#73778C] mt-1 max-w-sm mx-auto">
            Supported formats: PDF (<code className="font-mono text-[#20243A]">.pdf</code>) and Word (
            <code className="font-mono text-[#20243A]">.docx</code>). Maximum file size: 10 MB.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTriggerBrowse}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#6558D9] hover:bg-[#5346C8] active:bg-[#4537B8] rounded-lg shadow-xs transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Select File</span>
            </button>
          </div>

          <p className="mt-3 text-[11px] text-[#73778C]">
            The file stays in browser memory until you choose Parse resume. Parsing sends it to the local Role 2 service; it is not saved with your profile.
          </p>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-[#DCD8F0] bg-[#F5F4FA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F0EEFA] text-[#6558D9] border border-[#E0DDF0] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#20243A] break-all">
                    {cvFile.fileName}
                  </span>
                  <span className="text-[11px] font-medium text-[#4F46BA] bg-[#F0EEFA] px-2 py-0.5 rounded-md border border-[#DCD8F0] shrink-0">
                    {cvFile.fileSizeFormatted}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#73778C]">
                  <span>Type: {isPdf ? 'PDF Document' : 'Word DOCX Document'}</span>
                  <span>·</span>
                  <span>                  Selected in browser memory</span>
                </div>
              </div>
            </div>

            {/* Actions on attached file */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => cvFile.file && onParse(cvFile.file)}
                disabled={isParsing || !cvFile.file}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#6558D9] hover:bg-[#5346C8] rounded-lg shadow-2xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <WandSparkles className="w-3.5 h-3.5" />
                )}
                <span>{isParsing ? 'Parsing resume...' : 'Parse resume'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                disabled={isParsing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#20243A] bg-white hover:bg-[#F0EEFA] border border-[#E8E6F0] rounded-lg shadow-2xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#6558D9]" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerBrowse}
                disabled={isParsing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#73778C] bg-white hover:bg-[#F5F4FA] border border-[#E8E6F0] rounded-lg shadow-2xs transition-colors"
                title="Replace with another file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={isParsing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                title="Remove attached CV"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CV Preview Modal */}
      {showPreviewModal && cvFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20243A]/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E8E6F0]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6F0] bg-[#F5F4FA]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6558D9]" />
                <h3 className="font-semibold text-sm text-[#20243A] truncate max-w-md">
                  {cvFile.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-[#73778C] hover:text-[#20243A] hover:bg-[#E8E6F0] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#F5F4FA]">
              {isPdf && cvFile.previewUrl ? (
                <div className="h-[65vh] w-full rounded-xl border border-[#E8E6F0] overflow-hidden bg-white shadow-2xs">
                  <iframe
                    src={cvFile.previewUrl}
                    title="CV Document Preview"
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-[#E8E6F0] shadow-2xs">
                  <FileText className="w-12 h-12 text-[#9E9EAF] mx-auto mb-3" />
                  <h4 className="text-base font-bold text-[#20243A]">{cvFile.fileName}</h4>
                  <p className="text-xs text-[#73778C] mt-1">
                    File size: {cvFile.fileSizeFormatted} · Type: {cvFile.fileType || 'Document'}
                  </p>
                  <div className="mt-4 max-w-md mx-auto p-3.5 rounded-xl bg-[#FDF6E8] border border-[#F4E3BF] text-xs text-[#925B0B] text-left">
                          <p className="font-semibold text-[#8B5812] mb-1">Local file storage:</p>
                    <p>
                            The file is not stored by Role 3. Parsing sends it to the local Role 2 parser only when you explicitly choose Parse resume.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E8E6F0] bg-white text-xs text-[#73778C]">
              <span>Local in-memory preview</span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#20243A] bg-white border border-[#E8E6F0] rounded-lg hover:bg-[#F5F4FA] shadow-2xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
