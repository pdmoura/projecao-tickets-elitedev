import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/lib/db/client";

type NamedRow = { name: string };
type EnumRow = { enum_name: string; value: string };

function getTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL?.trim();

  if (!value) {
    throw new Error("TEST_DATABASE_URL is required for integration tests.");
  }

  return value;
}

describe("database schema", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createPrismaClient(getTestDatabaseUrl());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the isolated test database", async () => {
    const result = await prisma.$queryRaw<Array<{ value: number }>>`
      SELECT 1 AS value
    `;

    expect(result).toEqual([{ value: 1 }]);
  });

  it("contains the approved domain and Better Auth tables", async () => {
    const rows = await prisma.$queryRaw<NamedRow[]>`
      SELECT tablename AS name
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
    `;
    const names = new Set(rows.map(({ name }) => name));

    for (const table of [
      "account",
      "event",
      "event_seat",
      "movie_snapshot",
      "payment",
      "reservation",
      "reservation_item",
      "session",
      "ticket",
      "ticket_validation",
      "user",
      "verification",
    ]) {
      expect(names.has(table), `missing table: ${table}`).toBe(true);
    }
  });

  it("contains only the approved state-machine enum values", async () => {
    const rows = await prisma.$queryRaw<EnumRow[]>`
      SELECT type.typname AS enum_name, value.enumlabel AS value
      FROM pg_catalog.pg_type AS type
      JOIN pg_catalog.pg_enum AS value ON value.enumtypid = type.oid
      WHERE type.typname IN (
        'event_status',
        'event_seat_status',
        'payment_status',
        'user_role'
      )
      ORDER BY type.typname, value.enumsortorder
    `;
    const grouped = Object.groupBy(rows, ({ enum_name }) => enum_name);

    expect(grouped.event_status?.map(({ value }) => value)).toEqual([
      "DRAFT",
      "PUBLISHED",
    ]);
    expect(grouped.event_seat_status?.map(({ value }) => value)).toEqual([
      "AVAILABLE",
      "SOLD",
    ]);
    expect(grouped.payment_status?.map(({ value }) => value)).toEqual([
      "APPROVED",
      "DECLINED",
    ]);
    expect(grouped.user_role?.map(({ value }) => value)).toEqual([
      "ORGANIZER",
      "CUSTOMER",
      "GATE",
    ]);
  });

  it("contains the critical structural and domain constraints", async () => {
    const rows = await prisma.$queryRaw<NamedRow[]>`
      SELECT conname AS name
      FROM pg_catalog.pg_constraint
      WHERE connamespace = 'public'::regnamespace
      UNION
      SELECT indexname AS name
      FROM pg_catalog.pg_indexes
      WHERE schemaname = 'public'
    `;
    const names = new Set(rows.map(({ name }) => name));

    for (const constraint of [
      "event_capacity_range_check",
      "event_dimensions_consistent_check",
      "event_published_fields_check",
      "event_rows_range_check",
      "event_seats_per_row_range_check",
      "event_seat_event_label_key",
      "event_seat_event_row_number_key",
      "payment_approved_reservation_check",
      "reservation_item_event_seat_id_key",
      "ticket_manual_code_key",
      "ticket_reservation_item_id_key",
      "ticket_validation_token_hash_key",
    ]) {
      expect(names.has(constraint), `missing constraint: ${constraint}`).toBe(true);
    }
  });
});
