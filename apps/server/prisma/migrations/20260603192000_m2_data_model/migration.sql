CREATE TYPE "CapsuleStatus" AS ENUM ('active', 'home', 'retired');
CREATE TYPE "JourneyStatus" AS ENUM ('travelling', 'returned');
CREATE TYPE "MemoryEventType" AS ENUM ('scar', 'transform', 'stamp', 'cargo', 'trace', 'place_time', 'myth');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "handle" TEXT,
  "age_band" TEXT,
  "region_coarse" TEXT,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capsules" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shell" TEXT NOT NULL,
  "core" TEXT NOT NULL,
  "cargo" TEXT,
  "intent_default" TEXT NOT NULL,
  "current_state" JSONB NOT NULL DEFAULT '{}',
  "status" "CapsuleStatus" NOT NULL DEFAULT 'home',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "capsules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hearths" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "charge" INTEGER NOT NULL DEFAULT 0,
  "tend_last_at" TIMESTAMP(3),
  "unlocked_features" JSONB NOT NULL DEFAULT '[]',
  "appearance_state" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "hearths_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "journeys" (
  "id" TEXT NOT NULL,
  "capsule_id" TEXT NOT NULL,
  "intent_id" TEXT NOT NULL,
  "launch_time" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER NOT NULL,
  "coarse_region_id" TEXT NOT NULL,
  "seed_hash" TEXT NOT NULL,
  "secret_version" TEXT NOT NULL,
  "capsule_snapshot_at_launch" JSONB NOT NULL,
  "influence_events" JSONB NOT NULL DEFAULT '[]',
  "status" "JourneyStatus" NOT NULL DEFAULT 'travelling',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "memory_events" (
  "id" TEXT NOT NULL,
  "capsule_id" TEXT NOT NULL,
  "journey_id" TEXT,
  "type" "MemoryEventType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "coarse_region_id" TEXT,
  "payload" JSONB NOT NULL,
  "causes" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "memory_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "world_snapshots" (
  "coarse_region_id" TEXT NOT NULL,
  "time_window" TIMESTAMP(3) NOT NULL,
  "canonical" JSONB NOT NULL,
  "signals" JSONB NOT NULL,
  "source_version" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION,
  CONSTRAINT "world_snapshots_pkey" PRIMARY KEY ("coarse_region_id", "time_window")
);

CREATE TABLE "artifacts" (
  "id" TEXT NOT NULL,
  "capsule_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "rarity" TEXT NOT NULL,
  "display_meta" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hearths_owner_id_key" ON "hearths"("owner_id");
CREATE INDEX "capsules_owner_id_idx" ON "capsules"("owner_id");
CREATE INDEX "journeys_capsule_id_idx" ON "journeys"("capsule_id");
CREATE INDEX "journeys_coarse_region_id_launch_time_idx" ON "journeys"("coarse_region_id", "launch_time");
CREATE INDEX "memory_events_capsule_id_timestamp_idx" ON "memory_events"("capsule_id", "timestamp");
CREATE INDEX "memory_events_journey_id_timestamp_idx" ON "memory_events"("journey_id", "timestamp");
CREATE INDEX "memory_events_type_idx" ON "memory_events"("type");
CREATE INDEX "artifacts_capsule_id_idx" ON "artifacts"("capsule_id");

ALTER TABLE "capsules"
  ADD CONSTRAINT "capsules_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hearths"
  ADD CONSTRAINT "hearths_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journeys"
  ADD CONSTRAINT "journeys_capsule_id_fkey"
  FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_events"
  ADD CONSTRAINT "memory_events_capsule_id_fkey"
  FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memory_events"
  ADD CONSTRAINT "memory_events_journey_id_fkey"
  FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "artifacts"
  ADD CONSTRAINT "artifacts_capsule_id_fkey"
  FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

