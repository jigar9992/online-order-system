import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkflowStore } from "../../adapters/in-memory/in-memory-workflow-store.js";
import { AppModule } from "../../app.module.js";
import { FILE_STORAGE, WORKFLOW_STORE } from "../../common/tokens.js";
import type { FileStoragePort } from "../../ports/file-storage.port.js";

describe("workflow integration", () => {
  let app: INestApplication;
  let workflowStore: InMemoryWorkflowStore;
  let fileStorage: FileStoragePort;

  beforeEach(async () => {
    process.env.PRESCRIPTION_FILE_STORAGE_DIR = "storage/test-workflow";

    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    workflowStore = app.get<InMemoryWorkflowStore>(WORKFLOW_STORE);
    fileStorage = app.get<FileStoragePort>(FILE_STORAGE);
    workflowStore.seed();
    seedSecondaryCustomer(workflowStore);
    await fileStorage.reset();
    await app.init();
  });

  afterEach(async () => {
    await fileStorage.reset();
    await app.close();
    delete process.env.PRESCRIPTION_FILE_STORAGE_DIR;
  });

  it("returns tracking history for the owning customer and hides it from other customers", async () => {
    const customerCookie = await loginAs(
      app,
      "customer@example.com",
      "password",
    );
    const otherCustomerCookie = await loginAs(
      app,
      "customer2@example.com",
      "password",
    );
    const adminCookie = await loginAs(app, "admin@example.com", "password");

    const uploadResponse = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", customerCookie)
      .attach("file", Buffer.from("%PDF-1.4 upload%"), {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/admin/reviews/${uploadResponse.body.id}/reject`)
      .set("Cookie", adminCookie)
      .send({ reason: "Please upload a clearer image." })
      .expect(201);

    const ownerTrackingResponse = await request(app.getHttpServer())
      .get(`/api/customer/orders/${uploadResponse.body.orderId}`)
      .set("Cookie", customerCookie)
      .expect(200);

    expect(ownerTrackingResponse.body).toMatchObject({
      id: uploadResponse.body.orderId,
      customerId: "user_customer",
      status: "pending",
      latestDecision: "rejected",
      history: [
        { status: "pending", reason: null },
        {
          status: "rejected",
          reason: "Please upload a clearer image.",
        },
      ],
    });

    await request(app.getHttpServer())
      .get(`/api/customer/orders/${uploadResponse.body.orderId}`)
      .set("Cookie", otherCustomerCookie)
      .expect(404);
  });

  it("requires rejection before resubmission and protects replacement files by ownership", async () => {
    const customerCookie = await loginAs(
      app,
      "customer@example.com",
      "password",
    );
    const otherCustomerCookie = await loginAs(
      app,
      "customer2@example.com",
      "password",
    );
    const adminCookie = await loginAs(app, "admin@example.com", "password");

    const uploadResponse = await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", customerCookie)
      .attach("file", Buffer.from("%PDF-1.4 initial upload%"), {
        filename: "rx.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/customer/orders/${uploadResponse.body.orderId}/resubmit`)
      .set("Cookie", customerCookie)
      .attach("file", Buffer.from("%PDF-1.4 too soon%"), {
        filename: "replacement.pdf",
        contentType: "application/pdf",
      })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/admin/reviews/${uploadResponse.body.id}/reject`)
      .set("Cookie", adminCookie)
      .send({ reason: "Please upload a clearer image." })
      .expect(201);

    const resubmitResponse = await request(app.getHttpServer())
      .post(`/api/customer/orders/${uploadResponse.body.orderId}/resubmit`)
      .set("Cookie", customerCookie)
      .attach("file", Buffer.from("%PDF-1.4 replacement upload%"), {
        filename: "replacement.pdf",
        contentType: "application/pdf",
      })
      .expect(201);

    expect(resubmitResponse.body).toMatchObject({
      orderId: uploadResponse.body.orderId,
      customerId: "user_customer",
      fileName: "replacement.pdf",
      status: "pending",
    });

    await request(app.getHttpServer())
      .get(`/api/files/${resubmitResponse.body.fileId}`)
      .set("Cookie", customerCookie)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/files/${resubmitResponse.body.fileId}`)
      .set("Cookie", adminCookie)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/files/${resubmitResponse.body.fileId}`)
      .set("Cookie", otherCustomerCookie)
      .expect(404);
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

function seedSecondaryCustomer(workflowStore: InMemoryWorkflowStore) {
  const users = (
    workflowStore as unknown as {
      users: Map<
        string,
        {
          id: string;
          email: string;
          role: "customer" | "admin";
          password: string;
        }
      >;
    }
  ).users;

  users.set("customer2@example.com", {
    id: "user_customer_2",
    email: "customer2@example.com",
    role: "customer",
    password: "password",
  });
}
