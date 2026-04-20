import {
  isSupportedPrescriptionMimeType,
  maxPrescriptionUploadSizeBytes,
  supportedPrescriptionMimeTypes,
} from "@online-order-system/types";

export { maxPrescriptionUploadSizeBytes };

export const supportedPrescriptionFormatLabel = "PNG, JPG, and PDF";

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

export function describePrescriptionFileType(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "PNG image";
    case "image/jpeg":
      return "JPEG image";
    case "application/pdf":
      return "PDF document";
    default:
      return mimeType || "Unknown file type";
  }
}

export function validatePrescriptionFile(file: File): string | null {
  if (!isSupportedPrescriptionMimeType(file.type)) {
    return `Unsupported file type. Upload ${supportedPrescriptionFormatLabel}.`;
  }

  if (file.size > maxPrescriptionUploadSizeBytes) {
    return `File is too large. Upload a file up to ${formatFileSize(maxPrescriptionUploadSizeBytes)}.`;
  }

  return null;
}

export const acceptedPrescriptionMimeTypes = supportedPrescriptionMimeTypes;
