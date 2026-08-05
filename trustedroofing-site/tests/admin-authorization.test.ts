import test from "node:test";
import assert from "node:assert/strict";
import { middleware } from "../middleware";
import { NextRequest } from "next/server";
test("admin estimate routes reject a missing admin token", () => { const old = process.env.ADMIN_TOKEN; process.env.ADMIN_TOKEN = "secret"; const response = middleware(new NextRequest("https://example.com/admin/estimates")); assert.equal(response.status, 307); process.env.ADMIN_TOKEN = old; });
test("admin estimate routes accept the configured token", () => { const old = process.env.ADMIN_TOKEN; process.env.ADMIN_TOKEN = "secret"; const response = middleware(new NextRequest("https://example.com/admin/estimates", { headers: { "x-admin-token": "secret" } })); assert.equal(response.headers.get("x-middleware-next"), "1"); process.env.ADMIN_TOKEN = old; });
