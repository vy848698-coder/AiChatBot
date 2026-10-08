-- Solar Saathi leads, in the Clans Machina database (next to `leads`).
-- The app creates this table by itself on the first lead; run this in
-- phpMyAdmin (or the MySQL CLI) only to create it ahead of time.
-- Keep in sync with CREATE_TABLE in src/lib/leadStore.ts.

USE clansmachina;

CREATE TABLE IF NOT EXISTS saathi_leads (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  journey_id       VARCHAR(32)   NULL,                -- one chat with Saathi
  stage            VARCHAR(10)   NOT NULL,            -- plan | booked
  name             VARCHAR(120)  NOT NULL,
  mobile           VARCHAR(15)   NOT NULL,
  mobile_verified  TINYINT(1)    NOT NULL DEFAULT 0,  -- 1 = SMS code matched
  email            VARCHAR(150)  NOT NULL DEFAULT '', -- empty = skipped
  email_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  language         VARCHAR(20)   NOT NULL DEFAULT '',
  pin_code         VARCHAR(6)    NOT NULL DEFAULT '',
  area             VARCHAR(120)  NOT NULL DEFAULT '',
  district         VARCHAR(80)   NOT NULL DEFAULT '',
  state            VARCHAR(80)   NOT NULL DEFAULT '',
  ownership        VARCHAR(30)   NOT NULL DEFAULT '',
  owner_permission VARCHAR(40)   NOT NULL DEFAULT '',
  property_type    VARCHAR(40)   NOT NULL DEFAULT '',
  panels_on        VARCHAR(40)   NOT NULL DEFAULT '',
  monthly_bill     INT           NULL,                -- rupees
  roof_space       VARCHAR(30)   NOT NULL DEFAULT '', -- "1,200 sq ft" or "Not sure"
  main_goal        VARCHAR(40)   NOT NULL DEFAULT '',
  power_cuts       VARCHAR(30)   NOT NULL DEFAULT '',
  install_when     VARCHAR(30)   NOT NULL DEFAULT '',
  payment          VARCHAR(30)   NOT NULL DEFAULT '',
  system_kw        DECIMAL(6,2)  NULL,
  panels           INT           NULL,
  total_cost       INT           NULL,                -- rupees
  subsidy          INT           NULL,
  investment       INT           NULL,
  monthly_saving   INT           NULL,
  savings_25y      INT           NULL,
  payback_years    DECIMAL(4,1)  NULL,
  consultation     VARCHAR(30)   NOT NULL DEFAULT '', -- Phone call | Site visit | Online video call
  consult_date     DATE          NULL,
  consult_time     VARCHAR(30)   NOT NULL DEFAULT '',
  booking_id       VARCHAR(12)   NOT NULL DEFAULT '',
  score            INT           NOT NULL DEFAULT 0,
  temperature      VARCHAR(10)   NOT NULL DEFAULT '', -- Hot | Warm | Cold
  status           VARCHAR(20)   NOT NULL DEFAULT 'New',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_journey (journey_id),
  KEY idx_mobile (mobile),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
