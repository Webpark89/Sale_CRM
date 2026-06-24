-- ============================================================
-- QoraQot CRM — MySQL Database Schema
-- รัน Script นี้ครั้งเดียวเพื่อสร้างฐานข้อมูลและตาราง
-- ============================================================

CREATE DATABASE IF NOT EXISTS qoraqot_crm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE qoraqot_crm;

-- ------------------------------------------------------------
-- ตาราง users: ข้อมูลผู้ใช้งาน (Admin / Sales)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           CHAR(36)      NOT NULL DEFAULT (UUID()),
  username     VARCHAR(50)   NOT NULL,
  password     VARCHAR(255)  NOT NULL,   -- bcrypt hash เท่านั้น ห้ามเก็บ plaintext
  full_name    VARCHAR(100)  DEFAULT NULL,
  role         ENUM('admin','sales') NOT NULL DEFAULT 'sales',
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ตาราง leads: ข้อมูลลูกค้า/ลีด
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                  CHAR(36)       NOT NULL DEFAULT (UUID()),
  owner_id            CHAR(36)       NOT NULL,
  company_name        VARCHAR(200)   NOT NULL,
  company_number      VARCHAR(20)    DEFAULT NULL,
  contact_name        VARCHAR(100)   DEFAULT NULL,
  contact_phone       VARCHAR(20)    DEFAULT NULL,
  contact_email       VARCHAR(150)   DEFAULT NULL,
  description         TEXT           DEFAULT NULL,
  revenue             DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  registered_capital  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  profit              DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
  latest_status       VARCHAR(50)    NOT NULL DEFAULT 'ต้องตามต่อ',
  latest_contact_date DATE           DEFAULT NULL,
  next_followup_date  DATE           DEFAULT NULL,
  is_starred          TINYINT(1)     NOT NULL DEFAULT 0,
  ever_had_meeting    TINYINT(1)     NOT NULL DEFAULT 0,
  created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_company_number (company_number),
  KEY idx_owner_id          (owner_id),
  KEY idx_latest_status     (latest_status),
  KEY idx_next_followup     (next_followup_date),
  KEY idx_latest_contact    (latest_contact_date),
  CONSTRAINT fk_leads_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ตาราง followups: ประวัติการติดตาม
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS followups (
  id                  CHAR(36)    NOT NULL DEFAULT (UUID()),
  lead_id             CHAR(36)    NOT NULL,
  sequence            INT         NOT NULL DEFAULT 1,
  date                DATE        DEFAULT NULL,
  detail              TEXT        DEFAULT NULL,
  status              VARCHAR(50) DEFAULT NULL,
  next_followup_date  DATE        DEFAULT NULL,
  completed           TINYINT(1)  NOT NULL DEFAULT 0,
  created_at          DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_lead_id (lead_id),
  KEY idx_date    (date),
  CONSTRAINT fk_followups_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ตาราง audit_logs: บันทึกการแก้ไขข้อมูล
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     CHAR(36)      NOT NULL,
  action      ENUM('create','update','delete') NOT NULL,
  table_name  VARCHAR(50)   NOT NULL,
  record_id   CHAR(36)      DEFAULT NULL,
  changes     JSON          DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_user      (user_id),
  KEY idx_record    (record_id),
  KEY idx_created   (created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
