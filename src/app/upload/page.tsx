"use client";

import AppShell from "@/components/layout/AppShell";
import { useState, useRef, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  Mic,
  Image,
  Loader2,
  FileUp,
  StopCircle,
  Trash2,
} from "lucide-react";

interface UploadedFile {
  name: string;
  type: "document" | "image" | "audio";
  size: number;
}

const MAX_DOC_FILES = 3;
const MAX_IMAGE_FILES = 5;

export default function UploadPage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "audio">("files");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle multiple file upload
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const docFiles: File[] = [];
    const imageFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase().split(".").pop() || "";

      if (["pdf", "txt", "doc", "docx"].includes(ext)) {
        docFiles.push(file);
      } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        imageFiles.push(file);
      }
    }

    if (docFiles.length > MAX_DOC_FILES) {
      setError(`Maximum ${MAX_DOC_FILES} document files allowed`);
      return;
    }

    if (imageFiles.length > MAX_IMAGE_FILES) {
      setError(`Maximum ${MAX_IMAGE_FILES} image files allowed`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/parse-files", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse files");
      }

      setText(data.text);
      setUploadedFiles(
        data.files.map((f: { fileName: string; fileType: string; fileSize: number }) => ({
          name: f.fileName,
          type: f.fileType,
          size: f.fileSize,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to transcribe audio");
      }

      setText(data.text);
      setUploadedFiles([{
        name: data.fileName,
        type: "audio",
        size: data.fileSize,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transcribe audio");
    } finally {
      setIsUploading(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe-audio", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Failed to transcribe");
          }

          setText(data.text);
          setUploadedFiles([{
            name: "Voice Recording",
            type: "audio",
            size: audioBlob.size,
          }]);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to transcribe recording");
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setError("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleClear = () => {
    setText("");
    setSummary("");
    setUploadedFiles([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const generateSummary = async (type: string) => {
    if (!text) {
      setError("Please upload files first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Upload Documents</h1>
          {(text || uploadedFiles.length > 0) && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Upload Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setUploadMode("files")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              uploadMode === "files"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Files (PDF, Word, Images)</span>
          </button>
          <button
            onClick={() => setUploadMode("audio")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
              uploadMode === "audio"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>Audio Recording</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* File Upload Section */}
        {uploadMode === "files" && (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
              multiple
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Select Files"
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Up to {MAX_DOC_FILES} documents (PDF, Word, TXT) or {MAX_IMAGE_FILES} images
              </p>
            </div>
          </div>
        )}

        {/* Audio Upload Section */}
        {uploadMode === "audio" && (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.webm,.ogg,.m4a"
              onChange={handleAudioUpload}
              className="hidden"
              disabled={isUploading || isRecording}
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full ${isRecording ? "bg-red-100 animate-pulse" : "bg-gray-100"}`}>
                <Mic className={`w-8 h-8 ${isRecording ? "text-red-600" : "text-gray-600"}`} />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isUploading || isRecording}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Upload Audio
                </button>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={isUploading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 animate-pulse"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Recording
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                MP3, WAV, WEBM, OGG, M4A (max 25MB)
              </p>
            </div>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-600">Uploaded Files</h3>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {file.type === "document" && <FileUp className="w-5 h-5 text-blue-600" />}
                {file.type === "image" && <Image className="w-5 h-5 text-green-600" />}
                {file.type === "audio" && <Mic className="w-5 h-5 text-purple-600" />}
                <span className="flex-1 text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Extracted Text Preview */}
        {text && (
          <div className="mt-6">
            <h2 className="font-medium mb-2">Extracted Text (Preview)</h2>
            <div className="p-4 bg-white border rounded-lg text-sm max-h-64 overflow-y-auto whitespace-pre-wrap">
              {text.slice(0, 2000)}{text.length > 2000 ? "..." : ""}
            </div>
          </div>
        )}

        {/* Summary Buttons */}
        {text && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => generateSummary("short")}
              disabled={isGenerating}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              Quick Summary
            </button>
            <button
              onClick={() => generateSummary("detailed")}
              disabled={isGenerating}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Detailed Summary
            </button>
            <button
              onClick={() => generateSummary("chronology")}
              disabled={isGenerating}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Timeline
            </button>
            <button
              onClick={() => generateSummary("keypoints")}
              disabled={isGenerating}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Key Points
            </button>
          </div>
        )}

        {/* Summary Output */}
        {summary && (
          <div className="mt-6 p-6 bg-white border rounded-lg">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
