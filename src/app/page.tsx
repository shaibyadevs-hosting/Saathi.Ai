"use client";

import { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import {
  FileText,
  Send,
  Trash2,
  Upload,
  Bot,
  User,
  Loader2,
  AlertCircle,
  FileUp,
  X,
  Scale,
  Mic,
  Image,
  FileType,
  StopCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  name: string;
  type: "document" | "image" | "audio";
  size: number;
}

// File limits
const MAX_DOC_FILES = 3;
const MAX_IMAGE_FILES = 5;

export default function HomePage() {
  // State management
  const [docText, setDocText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadMode, setUploadMode] = useState<"files" | "audio">("files");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset all state (New Matter)
  const handleNewMatter = () => {
    setDocText("");
    setMessages([]);
    setInputMessage("");
    setError(null);
    setUploadedFiles([]);
    setUploadMode("files");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  // Clear document only
  const handleClearDocument = () => {
    setDocText("");
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  // Handle multiple file upload
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate file counts
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
      setError(`Maximum ${MAX_DOC_FILES} document files allowed (PDF/Word/TXT)`);
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

      const response = await fetch("/api/parse-files", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse files");
      }

      setDocText(data.text);
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

  // Handle audio file upload
  const handleAudioUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transcribe audio");
      }

      setDocText(data.text);
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

  // Start recording audio
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
        
        // Transcribe the recorded audio
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch("/api/transcribe-audio", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to transcribe audio");
          }

          setDocText(data.text);
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
      setError("Could not access microphone. Please allow microphone access.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Handle chat submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    if (!docText.trim()) {
      setError("Please paste or upload a document before asking questions.");
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    try {
      // Prepare chat history (excluding the current message)
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history,
          docText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Add AI response
      const aiMessage: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the user message if request failed
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle textarea key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <Header onNewMatter={handleNewMatter} />

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Case Context (40%) */}
        <div className="w-full lg:w-[40%] bg-slate-900 border-r border-slate-700 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">
                  Case Context
                </h2>
              </div>
              {/* Clear Button */}
              <button
                onClick={handleClearDocument}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 rounded-lg transition-colors text-sm"
                disabled={!docText}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setUploadMode("files")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  uploadMode === "files"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FileType className="w-4 h-4" />
                <span>Files</span>
              </button>
              <button
                onClick={() => setUploadMode("audio")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  uploadMode === "audio"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Audio</span>
              </button>
            </div>

            {/* File Upload Section */}
            {uploadMode === "files" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors text-sm border border-dashed border-slate-600">
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                      multiple
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Max: {MAX_DOC_FILES} docs (PDF/Word/TXT) or {MAX_IMAGE_FILES} images
                </p>
              </div>
            )}

            {/* Audio Upload Section */}
            {uploadMode === "audio" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors text-sm border border-dashed border-slate-600">
                    <Upload className="w-4 h-4" />
                    <span>Upload Audio</span>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept=".mp3,.wav,.webm,.ogg,.m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                      disabled={isUploading || isRecording}
                    />
                  </label>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm animate-pulse"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 text-center">
                  MP3, WAV, WEBM, OGG, M4A (max 25MB) or record directly
                </p>
              </div>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg"
                  >
                    {file.type === "document" && <FileUp className="w-4 h-4 text-blue-400" />}
                    {file.type === "image" && <Image className="w-4 h-4 text-green-400" />}
                    {file.type === "audio" && <Mic className="w-4 h-4 text-purple-400" />}
                    <span className="text-sm text-blue-300 truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="mt-3 flex items-center gap-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {uploadMode === "audio" ? "Transcribing audio..." : "Parsing files..."}
                </span>
              </div>
            )}

            {isRecording && (
              <div className="mt-3 flex items-center gap-2 text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm">Recording... Click Stop when done</span>
              </div>
            )}
          </div>

          {/* Document Text Area */}
          <div className="flex-1 p-4 overflow-hidden">
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste your legal document, case judgment, or petition text here...

You can also upload a PDF or TXT file using the Upload button above.

The AI will use this document as context to answer your questions."
              className="w-full h-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Document Stats */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {docText.length.toLocaleString()} characters | ~
                {Math.ceil(docText.length / 4).toLocaleString()} tokens
              </span>
              {docText.length > 0 && (
                <span className="text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Context loaded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Chat Interface (60%) */}
        <div className="w-full lg:w-[60%] flex flex-col bg-slate-950">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Saathi Assistant
                </h2>
                <p className="text-xs text-slate-400">
                  Your intelligent legal partner
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="p-4 bg-slate-800 rounded-full mb-4">
                  <Scale className="w-12 h-12 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to Saathi.ai
                </h3>
                <p className="text-slate-400 max-w-md mb-6">
                  Your intelligent legal partner for everyday practice.
                </p>
                <div className="grid gap-2 w-full max-w-sm">
                  <div className="p-3 bg-slate-800/50 rounded-lg text-left">
                    <p className="text-sm text-slate-300">
                      &quot;What are the main contentions of the
                      petitioner?&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-left">
                    <p className="text-sm text-slate-300">
                      &quot;Summarize the Hon&apos;ble Court&apos;s observations
                      on Article 21.&quot;
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg text-left">
                    <p className="text-sm text-slate-300">
                      &quot;What precedents are cited in this judgment?&quot;
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "model" && (
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {message.role === "model" ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-blue-300">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-blue-200"
                          : "text-slate-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <div className="shrink-0">
                      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing document...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-4 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    docText
                      ? "Ask a question about the document..."
                      : "Paste a document first, then ask questions..."
                  }
                  disabled={isLoading}
                  rows={1}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim() || !docText.trim()}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
