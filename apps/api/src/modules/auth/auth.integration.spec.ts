import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../../app.module.js";
import { InMemoryWorkflowStore } from "../../adapters/in-memory/in-memory-workflow-store.js";
import { WORKFLOW_STORE } from "../../common/tokens.js";

describe("auth and RBAC", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    app.setGlobalPrefix("api");
    const workflowStore = app.get<InMemoryWorkflowStore>(WORKFLOW_STORE);
    workflowStore.seed();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("logs in a customer and returns the session cookie", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "password" })
      .expect(200);

    expect(response.body).toMatchObject({
      userId: "user_customer",
      email: "customer@example.com",
      role: "customer",
    });
    expect(response.headers["set-cookie"]?.[0]).toContain("auth_token=");
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
  });

  it("logs in an admin and returns the session payload", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "password" })
      .expect(200);

    expect(response.body).toMatchObject({
      userId: "user_admin",
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("rejects invalid credentials", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "wrong" })
      .expect(401);
  });

  it("returns me only when the auth cookie is present", async () => {
    await request(app.getHttpServer()).get("/api/auth/me").expect(401);

    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "password" })
      .expect(200);

    const authCookie = loginResponse.headers["set-cookie"]?.[0];
    expect(authCookie).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", authCookie ?? "")
      .expect(200);

    expect(meResponse.body).toMatchObject({
      userId: "user_customer",
      role: "customer",
    });
  });

  it("prevents customers from visiting admin routes", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "password" })
      .expect(200);

    await request(app.getHttpServer())
      .get("/api/admin/reviews")
      .set("Cookie", loginResponse.headers["set-cookie"]?.[0] ?? "")
      .expect(403);
  });

  it("prevents admins from using customer mutation routes", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "password" })
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/customer/submissions")
      .set("Cookie", loginResponse.headers["set-cookie"]?.[0] ?? "")
      .send({ fileName: "rx.pdf", fileKind: "pdf", fileSize: 1024 })
      .expect(403);
  });

  it("clears the cookie on logout and blocks later access", async () => {
    const loginResponse = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "customer@example.com", password: "password" })
      .expect(200);

    const logoutResponse = await request(app.getHttpServer())
      .post("/api/auth/logout")
      .set("Cookie", loginResponse.headers["set-cookie"]?.[0] ?? "")
      .expect(204);

    expect(logoutResponse.headers["set-cookie"]?.[0]).toContain("Max-Age=0");

    await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Cookie", logoutResponse.headers["set-cookie"]?.[0] ?? "")
      .expect(401);
  });
});
