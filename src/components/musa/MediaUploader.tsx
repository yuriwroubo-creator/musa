/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, X, Play, Upload, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { MAX_UPLOAD_FILE_SIZE_LABEL, MUSA_MEDIA_BUCKET } from "@/lib/storage";
import {
  buildUploadPath,
  inferMediaMimeType,
  isOversizedFile,
  isSupportedMediaFile,
  normalizeFileForUpload,
} from "@/lib/media";

interface MediaUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
  capture?: "user" | "environment" | undefined;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadComplete,
  maxFiles = 5,
  // Use explicit extensions to reduce chance mobile browsers open camera directly
  accept = ".jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.m4v,.mp3,.wav,.aac,.m4a",
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (newFiles: File[], mode: "media" | "audio" = "media") => {
    const filteredByMode =
      mode === "audio"
        ? newFiles.filter(
            (file) =>
              file.type.startsWith("audio/") || /\.(mp3|wav|aac|m4a)$/i.test(file.name),
          )
        : newFiles;

    if (filteredByMode.length === 0) {
      toast.error("Seleciona pelo menos um ficheiro de áudio válido.");
      return;
    }

    if (files.length + filteredByMode.length > maxFiles) {
      toast.error(`Podes adicionar no máximo ${maxFiles} ficheiros.`);
      return;
    }

    const oversizedFiles = filteredByMode.filter((file) => isOversizedFile(file));
    if (oversizedFiles.length > 0) {
      toast.error(`Cada ficheiro pode ter no máximo ${MAX_UPLOAD_FILE_SIZE_LABEL}.`);
      return;
    }

    const validFiles = filteredByMode.filter((file) => isSupportedMediaFile(file));

    if (validFiles.length !== filteredByMode.length) {
      toast.error("Apenas imagens, vídeos e áudios são suportados.");
    }

    setFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type:
        file.type.split("/")[0] === "audio" || file.name.match(/\.(mp3|wav|aac|m4a)$/i)
          ? "audio"
          : file.type.split("/")[0] ||
            (file.name.match(/\.(heic|heif|jpg|jpeg|png|webp)$/i) ? "image" : "video"),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: "media" | "audio") => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files), mode);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadFiles = async () => {
    if (!user) {
      toast.error("Precisas de iniciar sessão para fazer upload.");
      return;
    }
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedUrls: string[] = [];

    try {
      let completedCount = 0;

      for (const file of files) {
        const path = buildUploadPath(user.id, file);
        const uploadPayload = await normalizeFileForUpload(file);
        const contentType = inferMediaMimeType(file);

        const { error: uploadError } = await supabase.storage
          .from(MUSA_MEDIA_BUCKET)
          .upload(path, uploadPayload, {
            cacheControl: "3600",
            contentType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(MUSA_MEDIA_BUCKET).getPublicUrl(path);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }

        completedCount++;
        setUploadProgress(Math.round((completedCount / files.length) * 100));
      }

      toast.success("Upload concluído com sucesso! ✨");
      onUploadComplete(uploadedUrls);

      // Cleanup
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload dos ficheiros.", {
        description: error?.message || "Tenta novamente com outro ficheiro.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Zone */}
      {files.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
            ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border-soft bg-card hover:border-primary/50 hover:bg-card/80"
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="rounded-full bg-secondary/50 p-4 mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-primary" />
          </div>

          <p className="text-sm font-medium text-primary-foreground mb-1">
            Arrasta fotos, vídeos ou áudios aqui
          </p>
          <p className="text-xs text-muted-foreground">
            ou clica para selecionar (máx. {maxFiles}, até {MAX_UPLOAD_FILE_SIZE_LABEL} por
            ficheiro)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(e) => handleFileChange(e, "media")}
            disabled={isUploading}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.aac,.m4a,audio/mpeg,audio/wav,audio/aac,audio/mp4"
            multiple
            className="sr-only"
            onChange={(e) => handleFileChange(e, "audio")}
            disabled={isUploading}
          />
          <div className="mt-4 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-neon disabled:opacity-60"
            >
              Selecionar imagem/vídeo
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                audioInputRef.current?.click();
              }}
              disabled={isUploading}
              className="flex-1 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5 text-xs font-bold text-primary disabled:opacity-60"
            >
              Adicionar áudio
            </button>
          </div>
        </div>
      )}

      {/* Previews Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-secondary group border border-border-soft shadow-sm"
            >
              {preview.type === "image" ? (
                <img
                  src={preview.url}
                  alt={`Preview ${index}`}
                  className="w-full h-full object-cover"
                />
              ) : preview.type === "audio" ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-card p-2 text-center">
                  <Music className="w-8 h-8 text-primary mb-1" />
                  <span className="text-[10px] text-muted-foreground truncate w-full">Áudio</span>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <video src={preview.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}

              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Button & Progress */}
      {files.length > 0 && (
        <div className="space-y-3">
          {isUploading && (
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={uploadFiles}
            disabled={isUploading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white shadow-neon flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />A fazer upload... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Fazer Upload de {files.length} {files.length === 1 ? "ficheiro" : "ficheiros"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
