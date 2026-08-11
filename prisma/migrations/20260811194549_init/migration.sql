-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ORGANIZER', 'CUSTOMER', 'GATE');

-- CreateEnum
CREATE TYPE "movie_source" AS ENUM ('TMDB');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "event_seat_status" AS ENUM ('AVAILABLE', 'SOLD');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('SIMULATOR');

-- CreateEnum
CREATE TYPE "ticket_validation_result" AS ENUM ('VALID', 'INVALID', 'ALREADY_USED', 'WRONG_EVENT');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_snapshot" (
    "id" TEXT NOT NULL,
    "source" "movie_source" NOT NULL DEFAULT 'TMDB',
    "external_id" INTEGER NOT NULL,
    "original_title" TEXT,
    "title" TEXT NOT NULL,
    "overview" TEXT,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "release_date" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movie_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "movie_snapshot_id" TEXT NOT NULL,
    "status" "event_status" NOT NULL DEFAULT 'DRAFT',
    "venue_name" TEXT,
    "room_name" TEXT,
    "starts_at" TIMESTAMPTZ(3),
    "price_cents" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "rows" INTEGER,
    "seats_per_row" INTEGER,
    "capacity" INTEGER,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_seat" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "row_label" TEXT NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" "event_seat_status" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "event_seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "subtotal_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_item" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "event_seat_id" TEXT NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "payment_status" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "provider" "payment_provider" NOT NULL DEFAULT 'SIMULATOR',
    "reference" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket" (
    "id" TEXT NOT NULL,
    "reservation_item_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "event_seat_id" TEXT NOT NULL,
    "validation_token_hash" VARCHAR(64) NOT NULL,
    "validation_token_ciphertext" TEXT NOT NULL,
    "validation_token_iv" VARCHAR(16) NOT NULL,
    "validation_token_auth_tag" VARCHAR(24) NOT NULL,
    "manual_code" VARCHAR(32) NOT NULL,
    "share_token_hash" VARCHAR(64),
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_validation" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "event_id" TEXT NOT NULL,
    "gate_user_id" TEXT NOT NULL,
    "result" "ticket_validation_result" NOT NULL,
    "validated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_validation_pkey" PRIMARY KEY ("id")
);

-- Domain checks that cannot be represented in Prisma Schema Language.
ALTER TABLE "movie_snapshot"
    ADD CONSTRAINT "movie_snapshot_external_id_positive_check"
    CHECK ("external_id" > 0);

ALTER TABLE "event"
    ADD CONSTRAINT "event_currency_brl_check"
    CHECK ("currency" = 'BRL'),
    ADD CONSTRAINT "event_price_positive_check"
    CHECK ("price_cents" IS NULL OR "price_cents" > 0),
    ADD CONSTRAINT "event_rows_range_check"
    CHECK ("rows" IS NULL OR "rows" BETWEEN 1 AND 20),
    ADD CONSTRAINT "event_seats_per_row_range_check"
    CHECK ("seats_per_row" IS NULL OR "seats_per_row" BETWEEN 1 AND 30),
    ADD CONSTRAINT "event_capacity_range_check"
    CHECK ("capacity" IS NULL OR "capacity" BETWEEN 1 AND 600),
    ADD CONSTRAINT "event_dimensions_consistent_check"
    CHECK (
        "rows" IS NULL
        OR "seats_per_row" IS NULL
        OR "capacity" IS NULL
        OR "capacity" = "rows" * "seats_per_row"
    ),
    ADD CONSTRAINT "event_published_fields_check"
    CHECK (
        "status" <> 'PUBLISHED'
        OR (
            NULLIF(BTRIM("venue_name"), '') IS NOT NULL
            AND NULLIF(BTRIM("room_name"), '') IS NOT NULL
            AND "starts_at" IS NOT NULL
            AND "price_cents" IS NOT NULL
            AND "rows" IS NOT NULL
            AND "seats_per_row" IS NOT NULL
            AND "capacity" IS NOT NULL
            AND "published_at" IS NOT NULL
        )
    ),
    ADD CONSTRAINT "event_draft_unpublished_check"
    CHECK ("status" <> 'DRAFT' OR "published_at" IS NULL);

ALTER TABLE "event_seat"
    ADD CONSTRAINT "event_seat_number_range_check"
    CHECK ("seat_number" BETWEEN 1 AND 30),
    ADD CONSTRAINT "event_seat_labels_not_blank_check"
    CHECK (
        NULLIF(BTRIM("row_label"), '') IS NOT NULL
        AND NULLIF(BTRIM("label"), '') IS NOT NULL
    );

ALTER TABLE "reservation"
    ADD CONSTRAINT "reservation_amounts_check"
    CHECK (
        "subtotal_cents" > 0
        AND "total_cents" > 0
        AND "subtotal_cents" = "total_cents"
    );

ALTER TABLE "reservation_item"
    ADD CONSTRAINT "reservation_item_unit_price_positive_check"
    CHECK ("unit_price_cents" > 0);

ALTER TABLE "payment"
    ADD CONSTRAINT "payment_amount_positive_check"
    CHECK ("amount_cents" > 0),
    ADD CONSTRAINT "payment_reference_not_blank_check"
    CHECK (NULLIF(BTRIM("reference"), '') IS NOT NULL),
    ADD CONSTRAINT "payment_approved_reservation_check"
    CHECK ("status" <> 'APPROVED' OR "reservation_id" IS NOT NULL);

ALTER TABLE "ticket"
    ADD CONSTRAINT "ticket_validation_hash_length_check"
    CHECK (CHAR_LENGTH("validation_token_hash") = 64),
    ADD CONSTRAINT "ticket_share_hash_length_check"
    CHECK (
        "share_token_hash" IS NULL
        OR CHAR_LENGTH("share_token_hash") = 64
    ),
    ADD CONSTRAINT "ticket_ciphertext_not_blank_check"
    CHECK (NULLIF(BTRIM("validation_token_ciphertext"), '') IS NOT NULL),
    ADD CONSTRAINT "ticket_iv_base64_check"
    CHECK ("validation_token_iv" ~ '^[A-Za-z0-9+/]{16}$'),
    ADD CONSTRAINT "ticket_auth_tag_base64_check"
    CHECK ("validation_token_auth_tag" ~ '^[A-Za-z0-9+/]{22}==$'),
    ADD CONSTRAINT "ticket_manual_code_not_blank_check"
    CHECK (NULLIF(BTRIM("manual_code"), '') IS NOT NULL);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_account_id_key" ON "account"("provider_id", "account_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "movie_snapshot_source_external_id_key" ON "movie_snapshot"("source", "external_id");

-- CreateIndex
CREATE INDEX "event_organizer_id_status_idx" ON "event"("organizer_id", "status");

-- CreateIndex
CREATE INDEX "event_movie_snapshot_id_idx" ON "event"("movie_snapshot_id");

-- CreateIndex
CREATE INDEX "event_status_starts_at_idx" ON "event"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "event_seat_event_row_number_key" ON "event_seat"("event_id", "row_label", "seat_number");

-- CreateIndex
CREATE UNIQUE INDEX "event_seat_event_label_key" ON "event_seat"("event_id", "label");

-- CreateIndex
CREATE INDEX "reservation_customer_id_created_at_idx" ON "reservation"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "reservation_event_id_idx" ON "reservation"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_item_event_seat_id_key" ON "reservation_item"("event_seat_id");

-- CreateIndex
CREATE INDEX "reservation_item_reservation_id_idx" ON "reservation_item"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_reservation_id_key" ON "payment"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_reference_key" ON "payment"("reference");

-- CreateIndex
CREATE INDEX "payment_customer_id_created_at_idx" ON "payment"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_event_id_created_at_idx" ON "payment"("event_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_status_created_at_idx" ON "payment"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_reservation_item_id_key" ON "ticket"("reservation_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_event_seat_id_key" ON "ticket"("event_seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_validation_token_hash_key" ON "ticket"("validation_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_manual_code_key" ON "ticket"("manual_code");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_share_token_hash_key" ON "ticket"("share_token_hash");

-- CreateIndex
CREATE INDEX "ticket_event_id_used_at_idx" ON "ticket"("event_id", "used_at");

-- CreateIndex
CREATE INDEX "ticket_customer_id_created_at_idx" ON "ticket"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "ticket_validation_ticket_id_validated_at_idx" ON "ticket_validation"("ticket_id", "validated_at");

-- CreateIndex
CREATE INDEX "ticket_validation_event_id_validated_at_idx" ON "ticket_validation"("event_id", "validated_at");

-- CreateIndex
CREATE INDEX "ticket_validation_gate_user_id_validated_at_idx" ON "ticket_validation"("gate_user_id", "validated_at");

-- CreateIndex
CREATE INDEX "ticket_validation_result_validated_at_idx" ON "ticket_validation"("result", "validated_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_movie_snapshot_id_fkey" FOREIGN KEY ("movie_snapshot_id") REFERENCES "movie_snapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_seat" ADD CONSTRAINT "event_seat_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_item" ADD CONSTRAINT "reservation_item_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_item" ADD CONSTRAINT "reservation_item_event_seat_id_fkey" FOREIGN KEY ("event_seat_id") REFERENCES "event_seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_reservation_item_id_fkey" FOREIGN KEY ("reservation_item_id") REFERENCES "reservation_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_event_seat_id_fkey" FOREIGN KEY ("event_seat_id") REFERENCES "event_seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validation" ADD CONSTRAINT "ticket_validation_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validation" ADD CONSTRAINT "ticket_validation_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_validation" ADD CONSTRAINT "ticket_validation_gate_user_id_fkey" FOREIGN KEY ("gate_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
