import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1741813200000 implements MigrationInterface {
  name = 'InitSchema1741813200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('admin', 'operator', 'manager', 'makeup_artist', 'guest')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'manager',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    );

    await queryRunner.query(
      `CREATE TYPE "artists_category_enum" AS ENUM ('premium', 'top', 'master', 'new')`,
    );
    await queryRunner.query(
      `CREATE TYPE "artists_services_enum" AS ENUM ('aquagrim', 'beauty_bar', 'caricatures', 'master_classes', 'mehendi', 'makeup', 'grim', 'braids', 'airbrush', 'body_art')`,
    );
    await queryRunner.query(
      `CREATE TYPE "artists_visibility_enum" AS ENUM ('only_me', 'team', 'public', 'hidden')`,
    );
    await queryRunner.query(
      `CREATE TABLE "artists" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "full_name" varchar(255) NOT NULL,
        "phone_personal" varchar(32) NOT NULL,
        "city" varchar(120) NOT NULL,
        "district" varchar(120),
        "metro_station" varchar(120),
        "location" geography(Point,4326),
        "work_radius_km" integer NOT NULL DEFAULT 20,
        "has_car" boolean NOT NULL DEFAULT false,
        "category" "artists_category_enum" NOT NULL DEFAULT 'master',
        "services" "artists_services_enum" array NOT NULL DEFAULT '{}'::"artists_services_enum"[],
        "languages" text[] NOT NULL DEFAULT '{}'::text[],
        "visibility" "artists_visibility_enum" NOT NULL DEFAULT 'team',
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_artists" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artists_city" ON "artists" ("city")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artists_district" ON "artists" ("district")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artists_metro_station" ON "artists" ("metro_station")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artists_category" ON "artists" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artists_location" ON "artists" USING GIST ("location")`,
    );

    await queryRunner.query(
      `CREATE TYPE "stationary_points_type_enum" AS ENUM ('shop', 'rent', 'entertainment')`,
    );
    await queryRunner.query(
      `CREATE TYPE "stationary_points_visibility_enum" AS ENUM ('only_me', 'team', 'public', 'hidden')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stationary_points" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(255) NOT NULL,
        "type" "stationary_points_type_enum" NOT NULL,
        "address" varchar(500) NOT NULL,
        "city" varchar(120) NOT NULL,
        "district" varchar(120),
        "metro_station" varchar(120),
        "location" geography(Point,4326),
        "working_hours" jsonb,
        "phone" varchar(32),
        "description" text,
        "visibility" "stationary_points_visibility_enum" NOT NULL DEFAULT 'team',
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_stationary_points" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stationary_points_type" ON "stationary_points" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stationary_points_city" ON "stationary_points" ("city")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stationary_points_district" ON "stationary_points" ("district")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stationary_points_metro_station" ON "stationary_points" ("metro_station")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stationary_points_location" ON "stationary_points" USING GIST ("location")`,
    );

    await queryRunner.query(
      `CREATE TABLE "artist_availability" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "artist_id" uuid NOT NULL,
        "day_of_week" smallint NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_artist_availability" PRIMARY KEY ("id"),
        CONSTRAINT "FK_artist_availability_artist_id" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_artist_availability_artist_id" ON "artist_availability" ("artist_id")`,
    );

    await queryRunner.query(
      `CREATE TYPE "media_files_owner_type_enum" AS ENUM ('artist', 'point')`,
    );
    await queryRunner.query(
      `CREATE TABLE "media_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "owner_type" "media_files_owner_type_enum" NOT NULL,
        "owner_id" uuid NOT NULL,
        "storage_provider" varchar(50) NOT NULL,
        "file_key" varchar(500) NOT NULL,
        "public_url" varchar(500) NOT NULL,
        "mime_type" varchar(120) NOT NULL,
        "size_bytes" integer NOT NULL,
        CONSTRAINT "PK_media_files" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_files_owner_id" ON "media_files" ("owner_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_media_files_file_key" ON "media_files" ("file_key")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_files_file_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_files_owner_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media_files"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "media_files_owner_type_enum"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_artist_availability_artist_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "artist_availability"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stationary_points_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stationary_points_metro_station"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stationary_points_district"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stationary_points_city"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stationary_points_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stationary_points"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "stationary_points_visibility_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "stationary_points_type_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_metro_station"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_district"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artists_city"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "artists"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "artists_visibility_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "artists_services_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "artists_category_enum"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
