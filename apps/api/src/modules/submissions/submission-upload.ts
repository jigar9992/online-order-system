import { BadRequestException } from "@nestjs/common";
import {
  isSupportedPrescriptionMimeType,
  maxPrescriptionUploadSizeBytes,
  type FileKind,
  supportedPrescriptionMimeTypes,
} from "@online-order-system/types";
import { basename } from "node:path";

export type UploadedPrescriptionFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ValidatedPrescriptionUpload = {
  fileName: string;
  fileKind: FileKind;
  fileSize: number;
  contentType: string;
  body: Buffer;
};

export function validateUploadedPrescriptionFile(
  file: UploadedPrescriptionFile | undefined,
): ValidatedPrescriptionUpload {
  if (!file) {
    throw new BadRequestException("Prescription file is required");
  }

  const fileName = basename(file.originalname ?? "").trim();
  if (!fileName) {
    throw new BadRequestException("Prescription file name is required");
  }

  if (!isSupportedPrescriptionMimeType(file.mimetype)) {
    throw new BadRequestException(
      `Unsupported prescription file type. Allowed: ${supportedPrescriptionMimeTypes.join(", ")}`,
    );
  }

  if (file.size > maxPrescriptionUploadSizeBytes) {
    throw new BadRequestException("Prescription file exceeds 5 MB limit");
  }

  return {
    fileName,
    fileKind: toFileKind(file.mimetype),
    fileSize: file.size,
    contentType: file.mimetype,
    body: file.buffer,
  };
}

function toFileKind(mimeType: string): FileKind {
  return mimeType === "application/pdf" ? "pdf" : "image";
}
