import { INestApplication } from "@nestjs/common";
import { maxPrescriptionUploadSizeBytes } from "@online-order-system/types";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../../app.module.js";
import { InMemoryWorkflowStore } from "../../adapters/in-memory/in-memory-workflow-store.js";
import { FILE_STORAGE, WORKFLOW_STORE } from "../../common/tokens.js";
import type { FileStoragePort } from "../../ports/file-storage.port.js";

function binaryParser(
  response: NodeJS.ReadableStream,
  callback: (error: Error | null, body: Buffer) => void,
) {
  const chunks: Buffer[] = [];

  response.on("data", (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on("end", () => {
    callback(null, Buffer.concat(chunks));
  });
  response.on("error", (error: Error) => {
    callback(error, Buffer.alloc(0));
  });
}

describe("multipart prescription submissions", () => {
  let app: INestApplication;
  let fileStorage: FileStoragePort;

  beforeEach(async () => {
    process.env.PRESCRIPTION_FILE_STORAGE_DIR = "storage/test-submissions";

    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    const workflowStore = app.get<InMemoryWorkflowStore>(WORKFLOW_STORE);
    fileStorage = app.get<FileStoragePort>(FILE_STORAGE);
    workflowStore.seed();
    await fileStorage.reset();
    await app.init();
  });

  afterEach(async () => {
    await fileStorage.reset();
    await app.close();
    delete process.env.PRESCRIPTION_FILE_STORAGE_DIR;
  });

  it("creates a pending submission for an authenticated customer and stores the file", async () => {
    const authCookie = await loginAs(app, "customer@example.com", "password");
    const fileBuffer = Buffer.from("%PDF-1.4 prescription%");

    const uploadResponse = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", authCookie)
      .attach("file", fileBuffer, {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    expect(uploadResponse.body).toMatchObject({
      customerId: "user_customer",
      fileName: "rx.pdf",
      fileKind: "pdf",
      status: "pending",
      rejectionReason: null,
      reviewedAt: null,
    });
    expect(uploadResponse.body.id).toEqual(expect.any(String));
    expect(uploadResponse.body.orderId).toEqual(expect.any(String));
    expect(uploadResponse.body.fileId).toEqual(expect.any(String));

    const fileResponse = await request(app.getHttpServer())
      .get(`/api/files/${uploadResponse.body.fileId}`)
      .set("Cookie", authCookie)
      .buffer(true)
      .parse(
        binaryParser as unknown as (
          response: unknown,
          callback: (error: Error | null, body: Buffer) => void,
        ) => void,
      )
      .expect(200);

    expect(fileResponse.headers["content-type"]).toContain("application/pdf");
    expect(fileResponse.headers["content-disposition"]).toContain("inline");
    expect(fileResponse.headers["content-disposition"]).toContain("rx.pdf");
    expect(Buffer.isBuffer(fileResponse.body)).toBe(true);
    expect((fileResponse.body as Buffer).equals(fileBuffer)).toBe(true);
  });

  it("rejects unsupported upload MIME types", async () => {
    const authCookie = await loginAs(app, "customer@example.com", "password");

    const response = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from("plain text"), {
        filename: "rx.txt",
        contentType: "text/plain",
      })
      .expect(400);

    expect(response.body.message).toContain(
      "Unsupported prescription file type",
    );
  });

  it("rejects files larger than 5 MB", async () => {
    const authCookie = await loginAs(app, "customer@example.com", "password");

    const response = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", authCookie)
      .attach("file", Buffer.alloc(maxPrescriptionUploadSizeBytes + 1, 1), {
        filename: "large.pdf",
        contentType: "application/pdf",
      })
      .expect(400);

    expect(response.body.message).toBe("Prescription file exceeds 5 MB limit");
  });

  it("requires authentication for uploads and file fetches", async () => {
    const uploadResponse = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .attach("file", Buffer.from("%PDF-1.4 prescription%"), {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(401);

    expect(uploadResponse.body.message).toBe("Authentication required");

    const authCookie = await loginAs(app, "customer@example.com", "password");
    const createdResponse = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from("%PDF-1.4 prescription%"), {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/files/${createdResponse.body.fileId}`)
      .expect(401);
  });

  it("forbids admins from creating customer submissions", async () => {
    const authCookie = await loginAs(app, "admin@example.com", "password");

    await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from("%PDF-1.4 prescription%"), {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(403);
  });
});

async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return response.headers["set-cookie"]?.[0] ?? "";
}
