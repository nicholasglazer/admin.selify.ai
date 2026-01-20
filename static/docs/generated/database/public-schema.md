---
title: public Schema Reference
description: PostgreSQL schema documentation for public.* tables
category: database
tags: [database, schema, public, postgresql]
generated_at: 2026-01-20T23:06:10.044647+00:00
generator: schema_generator.py
table_count: 73
frontend_tables: 48
backend_tables: 24
external_tables: 62
internal_tables: 11
domains: [ai, analytics, auth, billing, commerce, ops, social]
---

# public Schema Reference

> Auto-generated from live PostgreSQL database. 73 tables, 1325 columns.
> Do not edit manually - regenerated on schema changes.

## Classification Legend

**Usage:** `frontend` (dash/admin UI) | `backend` (services only) | `both`

**Audience:** `external` (customer-facing) | `internal` (ops/admin only)

**Domain:** billing, social, ai, commerce, auth, ops, analytics, other

## Overview

This document describes all tables in the `public` schema.

| Table | Usage | Audience | Domain | Columns | RLS |
|-------|-------|----------|--------|---------|-----|
| [account_metrics_daily](#account_metrics_daily) | `frontend` | `external` | `analytics` | 28 | Yes |
| [account_sync_metadata](#account_sync_metadata) | `backend` | `external` | `analytics` | 9 | No |
| [affiliate_commissions](#affiliate_commissions) | `backend` | `external` | `billing` | 17 | Yes |
| [ai_personas](#ai_personas) | `frontend` | `external` | `ai` | 52 | Yes |
| [amazon_connected_accounts](#amazon_connected_accounts) | `frontend` | `external` | `commerce` | 16 | Yes |
| [autonomous_tasks](#autonomous_tasks) | `backend` | `external` | `ai` | 15 | Yes |
| [billing_meters](#billing_meters) | `backend` | `external` | `billing` | 9 | Yes |
| [bot_interactions](#bot_interactions) | `frontend` | `external` | `social` | 28 | Yes |
| [brand_intelligence](#brand_intelligence) | `frontend` | `external` | `ai` | 12 | Yes |
| [brand_knowledge_chunks](#brand_knowledge_chunks) | `backend` | `external` | `ai` | 22 | Yes |
| [brand_settings](#brand_settings) | `frontend` | `external` | `commerce` | 36 | Yes |
| [catalog_generation_jobs](#catalog_generation_jobs) | `frontend` | `external` | `ai` | 44 | Yes |
| [connected_social_accounts](#connected_social_accounts) | `frontend` | `external` | `social` | 20 | Yes |
| [contact_email_log](#contact_email_log) | `backend` | `internal` | `ops` | 9 | Yes |
| [contact_submissions](#contact_submissions) | `frontend` | `internal` | `ops` | 14 | Yes |
| [conversation_messages](#conversation_messages) | `frontend` | `external` | `social` | 13 | Yes |
| [conversation_sessions](#conversation_sessions) | `frontend` | `external` | `social` | 15 | Yes |
| [cross_brand_analytics](#cross_brand_analytics) | `frontend` | `external` | `analytics` | 11 | Yes |
| [imported_products](#imported_products) | `frontend` | `external` | `commerce` | 36 | Yes |
| [instagram_account_health](#instagram_account_health) | `frontend` | `external` | `social` | 13 | Yes |
| [instagram_message_queue](#instagram_message_queue) | `backend` | `external` | `social` | 10 | Yes |
| [instagram_post_metrics](#instagram_post_metrics) | `frontend` | `external` | `social` | 31 | Yes |
| [instagram_rate_limits](#instagram_rate_limits) | `backend` | `external` | `social` | 9 | Yes |
| [instagram_webhook_subscriptions](#instagram_webhook_subscriptions) | `backend` | `external` | `social` | 10 | Yes |
| [knowledge_ingestion_jobs](#knowledge_ingestion_jobs) | `frontend` | `external` | `ai` | 19 | Yes |
| [lora_training_history](#lora_training_history) | `frontend` | `external` | `ai` | 27 | Yes |
| [notifications](#notifications) | `frontend` | `external` | `ops` | 12 | Yes |
| [oauth_audit_logs](#oauth_audit_logs) | `backend` | `internal` | `auth` | 12 | Yes |
| [pending_shopify_installations](#pending_shopify_installations) | `backend` | `external` | `commerce` | 14 | Yes |
| [processed_webhook_events](#processed_webhook_events) | `backend` | `external` | `ops` | 2 | Yes |
| [product_import_batches](#product_import_batches) | `frontend` | `external` | `commerce` | 18 | Yes |
| [profiles](#profiles) | `frontend` | `external` | `auth` | 31 | Yes |
| [qa_test_results](#qa_test_results) | `frontend` | `internal` | `ops` | 28 | Yes |
| [qa_test_runs](#qa_test_runs) | `frontend` | `internal` | `ops` | 38 | Yes |
| [qa_test_specs](#qa_test_specs) | `frontend` | `internal` | `ops` | 42 | Yes |
| [shopify_collections](#shopify_collections) | `frontend` | `external` | `commerce` | 20 | Yes |
| [shopify_inventory_history](#shopify_inventory_history) | `backend` | `external` | `commerce` | 9 | Yes |
| [shopify_product_variants](#shopify_product_variants) | `frontend` | `external` | `commerce` | 30 | Yes |
| [shopify_products](#shopify_products) | `frontend` | `external` | `commerce` | 43 | Yes |
| [social_account_sync_metadata](#social_account_sync_metadata) | `backend` | `external` | `social` | 15 | Yes |
| [social_conversations](#social_conversations) | `frontend` | `external` | `social` | 17 | Yes |
| [social_messages](#social_messages) | `frontend` | `external` | `social` | 10 | Yes |
| [social_posts](#social_posts) | `frontend` | `external` | `social` | 20 | Yes |
| [social_posts_garment_bindings](#social_posts_garment_bindings) | `frontend` | `external` | `social` | 28 | Yes |
| [sso_audit_log](#sso_audit_log) | `backend` | `internal` | `auth` | 15 | Yes |
| [studio_creations](#studio_creations) | `frontend` | `external` | `ai` | 24 | Yes |
| [studio_models](#studio_models) | `frontend` | `external` | `ai` | 11 | Yes |
| [studio_projects](#studio_projects) | `frontend` | `external` | `ai` | 10 | Yes |
| [subscription_cancellation_feedback](#subscription_cancellation_feedback) | `backend` | `external` | `billing` | 13 | Yes |
| [subscription_tiers](#subscription_tiers) | `frontend` | `external` | `billing` | 15 | Yes |
| [temporal_workflows](#temporal_workflows) | `frontend` | `internal` | `ops` | 16 | No |
| [user_email_accounts](#user_email_accounts) | `frontend` | `external` | `social` | 17 | Yes |
| [user_feedback](#user_feedback) | `frontend` | `internal` | `ops` | 23 | Yes |
| [user_preferences](#user_preferences) | `backend` | `external` | `ai` | 12 | Yes |
| [vr_garments](#vr_garments) | `frontend` | `external` | `commerce` | 14 | Yes |
| [vr_shop_tokens](#vr_shop_tokens) | `backend` | `external` | `auth` | 18 | Yes |
| [vr_shops](#vr_shops) | `frontend` | `external` | `commerce` | 10 | Yes |
| [vr_tryons](#vr_tryons) | `frontend` | `external` | `ai` | 12 | Yes |
| [wardrobe_collections](#wardrobe_collections) | `frontend` | `external` | `commerce` | 14 | Yes |
| [wardrobe_garments](#wardrobe_garments) | `frontend` | `external` | `commerce` | 23 | Yes |
| [wardrobe_usage_events](#wardrobe_usage_events) | `backend` | `external` | `commerce` | 6 | Yes |
| [webhook_events](#webhook_events) | `backend` | `external` | `ops` | 20 | Yes |
| [workspace_auto_reload_settings](#workspace_auto_reload_settings) | `backend` | `external` | `ops` | 11 | Yes |
| [workspace_email_account_members](#workspace_email_account_members) | `frontend` | `internal` | `social` | 5 | Yes |
| [workspace_email_accounts](#workspace_email_accounts) | `frontend` | `internal` | `social` | 17 | Yes |
| [workspace_events](#workspace_events) | `backend` | `external` | `ops` | 5 | Yes |
| [workspace_financial_transactions](#workspace_financial_transactions) | `both` | `external` | `billing` | 23 | Yes |
| [workspace_members](#workspace_members) | `frontend` | `external` | `auth` | 11 | Yes |
| [workspace_payg_balance](#workspace_payg_balance) | `frontend` | `external` | `billing` | 8 | Yes |
| [workspace_quotas](#workspace_quotas) | `backend` | `external` | `billing` | 9 | Yes |
| [workspace_subscriptions](#workspace_subscriptions) | `frontend` | `external` | `billing` | 15 | Yes |
| [workspace_usage_events](#workspace_usage_events) | `backend` | `external` | `billing` | 18 | Yes |
| [workspaces](#workspaces) | `frontend` | `external` | `auth` | 16 | Yes |

## account_metrics_daily

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `analytics`

Daily aggregated metrics for account dashboard

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `account_id` | `uuid` | Yes | - | - |
| `metric_date` | `date` | No | - | - |
| `total_posts` | `integer` | Yes | `0` | - |
| `posts_with_garments` | `integer` | Yes | `0` | - |
| `total_impressions` | `integer` | Yes | `0` | - |
| `total_reach` | `integer` | Yes | `0` | - |
| `total_likes` | `integer` | Yes | `0` | - |
| `total_comments` | `integer` | Yes | `0` | - |
| `total_shares` | `integer` | Yes | `0` | - |
| `total_bot_triggers` | `integer` | Yes | `0` | - |
| `total_dm_conversations` | `integer` | Yes | `0` | - |
| `total_photos_received` | `integer` | Yes | `0` | - |
| `total_generations` | `integer` | Yes | `0` | - |
| `successful_generations` | `integer` | Yes | `0` | - |
| `overall_trigger_rate` | `numeric(5,2)` | Yes | `0` | - |
| `overall_dm_rate` | `numeric(5,2)` | Yes | `0` | - |
| `overall_photo_rate` | `numeric(5,2)` | Yes | `0` | - |
| `overall_success_rate` | `numeric(5,2)` | Yes | `0` | - |
| `total_cost_cents` | `integer` | Yes | `0` | - |
| `total_revenue_cents` | `integer` | Yes | `0` | - |
| `total_profit_cents` | `integer` | Yes | `0` | - |
| `roi_percentage` | `numeric(8,2)` | Yes | `0` | - |
| `avg_response_time_ms` | `integer` | Yes | - | - |
| `avg_generation_time_ms` | `integer` | Yes | - | - |
| `uptime_percentage` | `numeric(5,2)` | Yes | `100` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(UQ) account_metrics_daily_account_id_metric_date_key**
  ```sql
  CREATE UNIQUE INDEX account_metrics_daily_account_id_metric_date_key ON public.account_metrics_daily USING btree (account_id, metric_date)
  ```
- **(PK) account_metrics_daily_pkey**
  ```sql
  CREATE UNIQUE INDEX account_metrics_daily_pkey ON public.account_metrics_daily USING btree (id)
  ```
- **idx_account_metrics_account**
  ```sql
  CREATE INDEX idx_account_metrics_account ON public.account_metrics_daily USING btree (account_id)
  ```
- **idx_account_metrics_date**
  ```sql
  CREATE INDEX idx_account_metrics_date ON public.account_metrics_daily USING btree (metric_date DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Workspace members can view account metrics` | SELECT | Yes |

## account_sync_metadata

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `analytics`

Metadata for tracking account sync status and activity classification

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `account_id` | `uuid` | No | - | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `posts_synced_count` | `integer` | Yes | `0` | - |
| `sync_status` | `text` | Yes | `'pending'::text` | - |
| `sync_error` | `text` | Yes | - | - |
| `activity_classification` | `text` | Yes | - | - |
| `sync_frequency_minutes` | `integer` | Yes | `5` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) account_sync_metadata_pkey**
  ```sql
  CREATE UNIQUE INDEX account_sync_metadata_pkey ON public.account_sync_metadata USING btree (account_id)
  ```
- **idx_account_sync_metadata_activity**
  ```sql
  CREATE INDEX idx_account_sync_metadata_activity ON public.account_sync_metadata USING btree (activity_classification, last_sync_at)
  ```
- **idx_account_sync_metadata_status**
  ```sql
  CREATE INDEX idx_account_sync_metadata_status ON public.account_sync_metadata USING btree (sync_status, last_sync_at)
  ```

## affiliate_commissions

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `billing`

Affiliate commission records.
SECURITY: INSERT/UPDATE/DELETE restricted to service_role only.
SELECT allowed for authenticated users (own records only via affiliate_user_id = auth.uid()).
Created: Dec 11, 2025. Security fix: Dec 12, 2025.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `affiliate_user_id` | `uuid` | No | - | - |
| `referred_user_id` | `uuid` | Yes | - | - |
| `source_workspace_id` | `uuid` | Yes | - | - |
| `source_transaction_id` | `uuid` | Yes | - | - |
| `commission_type` | `text` | No | - | - |
| `source_amount_cents` | `integer` | No | `0` | - |
| `commission_rate` | `numeric(4,3)` | No | - | - |
| `commission_cents` | `integer` | No | - | - |
| `status` | `text` | Yes | `'pending'::text` | - |
| `clears_at` | `timestamp with time zone` | Yes | `(now() + '14 days'::interv...` | - |
| `paid_at` | `timestamp with time zone` | Yes | - | - |
| `reversed_at` | `timestamp with time zone` | Yes | - | - |
| `reversal_reason` | `text` | Yes | - | - |
| `notes` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) affiliate_commissions_pkey**
  ```sql
  CREATE UNIQUE INDEX affiliate_commissions_pkey ON public.affiliate_commissions USING btree (id)
  ```
- **idx_aff_comm_affiliate**
  ```sql
  CREATE INDEX idx_aff_comm_affiliate ON public.affiliate_commissions USING btree (affiliate_user_id)
  ```
- **idx_aff_comm_created**
  ```sql
  CREATE INDEX idx_aff_comm_created ON public.affiliate_commissions USING btree (created_at DESC)
  ```
- **idx_aff_comm_referred**
  ```sql
  CREATE INDEX idx_aff_comm_referred ON public.affiliate_commissions USING btree (referred_user_id)
  ```
- **idx_aff_comm_source**
  ```sql
  CREATE INDEX idx_aff_comm_source ON public.affiliate_commissions USING btree (source_transaction_id)
  ```
- **idx_aff_comm_status**
  ```sql
  CREATE INDEX idx_aff_comm_status ON public.affiliate_commissions USING btree (status, clears_at)
  ```
- **idx_affiliate_commissions_source_workspace**
  ```sql
  CREATE INDEX idx_affiliate_commissions_source_workspace ON public.affiliate_commissions USING btree (source_workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Affiliates can view their own commissions` | SELECT | Yes |
| `Only service_role can delete commissions` | DELETE | Yes |
| `Only service_role can insert commissions` | INSERT | Yes |
| `Only service_role can update commissions` | UPDATE | Yes |

## ai_personas

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

AI-generated consistent fashion models for brands to use in try-ons and product shoots

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `name` | `text` | No | - | - |
| `status` | `text` | Yes | `'draft'::text` | - |
| `gender` | `text` | Yes | - | - |
| `age_range` | `text` | Yes | - | - |
| `ethnicity` | `text` | Yes | - | - |
| `body_type` | `text` | Yes | - | - |
| `height_cm` | `integer` | Yes | - | - |
| `face_prompt` | `text` | No | - | Text description used to generate the persona face |
| `face_seed` | `integer` | Yes | - | - |
| `face_images` | `text[]` | Yes | `'{}'::text[]` | Array of generated face image URLs |
| `selected_face_index` | `integer` | Yes | `0` | Index of the selected face from face_images array |
| `style` | `text` | Yes | `'editorial'::text` | - |
| `default_pose` | `text` | Yes | `'front'::text` | - |
| `lighting_preset` | `text` | Yes | `'studio'::text` | - |
| `lora_model_id` | `text` | Yes | - | ID of the trained LoRA model for consistent generation |
| `lora_status` | `text` | Yes | `'not_trained'::text` | Status of LoRA training: not_trained, training, ready, failed |
| `lora_training_started_at` | `timestamp with time zone` | Yes | - | - |
| `lora_training_completed_at` | `timestamp with time zone` | Yes | - | - |
| `generation_settings` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `usage_count` | `integer` | Yes | `0` | - |
| `last_used_at` | `timestamp with time zone` | Yes | - | - |
| `is_favorite` | `boolean` | Yes | `false` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `face_reference_url` | `text` | Yes | - | - |
| `skin_tone` | `text` | Yes | - | - |
| `style_aesthetic` | `text` | Yes | - | - |
| `voice_profile` | `jsonb` | Yes | `'{"tone": "friendly", "voc...` | - |
| `role` | `text` | Yes | `'brand_ambassador'::text` | - |
| `autonomy_level` | `integer` | Yes | `2` | - |
| `requires_approval_for` | `text[]` | Yes | `ARRAY['discount_offer'::te...` | - |
| `max_autonomous_value_cents` | `integer` | Yes | `5000` | - |
| `pinned_facts` | `text[]` | Yes | - | - |
| `memory_categories` | `text[]` | Yes | - | - |
| `disclosure_text` | `text` | Yes | `'I''m an AI assistant'::text` | - |
| `minor_interaction_mode` | `boolean` | Yes | `false` | - |
| `total_interactions` | `integer` | Yes | `0` | - |
| `avg_satisfaction_score` | `numeric(3,2)` | Yes | - | - |
| `is_default` | `boolean` | Yes | `false` | - |
| `lora_training_error` | `text` | Yes | - | Error message if LoRA training failed |
| `lora_version` | `integer` | Yes | `1` | Version number, incremented on each successful training |
| `lora_cost_micro` | `integer` | Yes | `0` | Total cost spent on LoRA training for this persona |
| `lora_trigger_word` | `text` | Yes | `'person'::text` | Trigger word to activate the LoRA in prompts |
| `lora_rank` | `integer` | Yes | `32` | - |
| `lora_alpha` | `integer` | Yes | `16` | - |
| `lora_resolution` | `integer` | Yes | `512` | - |
| `lora_base_model` | `text` | Yes | `'FLUX.1-dev'::text` | - |
| `lora_training_job_id` | `text` | Yes | - | - |
| `lora_size_bytes` | `bigint` | Yes | - | - |
| `lora_processed_images` | `integer` | Yes | - | - |

### Indexes

- **(PK) ai_personas_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_personas_pkey ON public.ai_personas USING btree (id)
  ```
- **idx_ai_personas_favorites**
  ```sql
  CREATE INDEX idx_ai_personas_favorites ON public.ai_personas USING btree (workspace_id, is_favorite) WHERE (is_favorite = true)
  ```
- **idx_ai_personas_status**
  ```sql
  CREATE INDEX idx_ai_personas_status ON public.ai_personas USING btree (workspace_id, status)
  ```
- **idx_ai_personas_usage**
  ```sql
  CREATE INDEX idx_ai_personas_usage ON public.ai_personas USING btree (workspace_id, usage_count DESC)
  ```
- **idx_ai_personas_workspace**
  ```sql
  CREATE INDEX idx_ai_personas_workspace ON public.ai_personas USING btree (workspace_id)
  ```
- **(UQ) idx_personas_default_per_role**
  ```sql
  CREATE UNIQUE INDEX idx_personas_default_per_role ON public.ai_personas USING btree (workspace_id, role) WHERE (is_default = true)
  ```
- **idx_personas_lora_ready**
  ```sql
  CREATE INDEX idx_personas_lora_ready ON public.ai_personas USING btree (workspace_id, lora_status) WHERE (lora_status = 'ready'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can delete own workspace personas` | DELETE | Yes |
| `Users can insert own workspace personas` | INSERT | Yes |
| `Users can update own workspace personas` | UPDATE | Yes |
| `Users can view own workspace personas` | SELECT | Yes |

## amazon_connected_accounts

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Amazon SP-API connected seller accounts for product import

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `seller_id` | `text` | Yes | - | Amazon Merchant ID (MID) |
| `marketplace_id` | `text` | Yes | - | Amazon Marketplace ID (e.g., ATVPDKIKX0DER for US) |
| `region` | `text` | Yes | `'us-east-1'::text` | - |
| `access_token` | `text` | Yes | - | LWA OAuth access token (short-lived) |
| `refresh_token` | `text` | Yes | - | LWA OAuth refresh token (long-lived) |
| `token_expires_at` | `timestamp with time zone` | Yes | - | - |
| `seller_name` | `text` | Yes | - | - |
| `selling_status` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'active'::text` | - |
| `connected_at` | `timestamp with time zone` | Yes | `now()` | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `sync_error` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) amazon_connected_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX amazon_connected_accounts_pkey ON public.amazon_connected_accounts USING btree (id)
  ```
- **(UQ) amazon_connected_accounts_workspace_id_key**
  ```sql
  CREATE UNIQUE INDEX amazon_connected_accounts_workspace_id_key ON public.amazon_connected_accounts USING btree (workspace_id)
  ```
- **idx_amazon_accounts_status**
  ```sql
  CREATE INDEX idx_amazon_accounts_status ON public.amazon_connected_accounts USING btree (status)
  ```
- **idx_amazon_connected_accounts_workspace**
  ```sql
  CREATE INDEX idx_amazon_connected_accounts_workspace ON public.amazon_connected_accounts USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `service_role_full_access` | ALL | Yes |
| `workspace_members_access` | ALL | Yes |

## autonomous_tasks

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ai`

Tracks autonomous AI task executions

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `task_type` | `text` | No | - | - |
| `status` | `text` | No | `'pending'::text` | - |
| `config` | `jsonb` | No | `'{}'::jsonb` | - |
| `result` | `jsonb` | Yes | - | - |
| `items_processed` | `integer` | Yes | `0` | - |
| `items_succeeded` | `integer` | Yes | `0` | - |
| `items_failed` | `integer` | Yes | `0` | - |
| `scheduled_at` | `timestamp with time zone` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_details` | `jsonb` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) autonomous_tasks_pkey**
  ```sql
  CREATE UNIQUE INDEX autonomous_tasks_pkey ON public.autonomous_tasks USING btree (id)
  ```
- **idx_autonomous_tasks_workspace**
  ```sql
  CREATE INDEX idx_autonomous_tasks_workspace ON public.autonomous_tasks USING btree (workspace_id)
  ```
- **idx_autonomous_tasks_status**
  ```sql
  CREATE INDEX idx_autonomous_tasks_status ON public.autonomous_tasks USING btree (workspace_id, status) WHERE (status = ANY (ARRAY['pending'::text, 'running'::text]))
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on autonomous_tasks` | ALL | Yes |

## billing_meters

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `billing`

Catalog of billable meters (virtual try-on, bot message, etc.)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `slug` | `text` | No | - | - |
| `display_name` | `text` | No | - | - |
| `unit_label` | `text` | No | - | - |
| `default_unit_amount_cents` | `integer` | No | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) billing_meters_pkey**
  ```sql
  CREATE UNIQUE INDEX billing_meters_pkey ON public.billing_meters USING btree (id)
  ```
- **(UQ) billing_meters_slug_key**
  ```sql
  CREATE UNIQUE INDEX billing_meters_slug_key ON public.billing_meters USING btree (slug)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `service_role_only` | ALL | Yes |

## bot_interactions

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Detailed tracking of every bot interaction for funnel analysis

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `account_id` | `uuid` | Yes | - | - |
| `post_id` | `text` | Yes | - | - |
| `binding_id` | `uuid` | Yes | - | - |
| `instagram_user_id` | `text` | No | - | - |
| `instagram_username` | `text` | Yes | - | - |
| `user_demographics` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `interaction_type` | `text` | No | - | - |
| `interaction_source` | `text` | Yes | - | - |
| `trigger_word` | `text` | Yes | - | - |
| `original_message` | `text` | Yes | - | - |
| `conversation_id` | `text` | Yes | - | - |
| `message_count` | `integer` | Yes | `1` | - |
| `bot_responded` | `boolean` | Yes | `false` | - |
| `response_type` | `text` | Yes | - | - |
| `response_time_ms` | `integer` | Yes | - | - |
| `user_sent_photo` | `boolean` | Yes | `false` | - |
| `photo_quality_score` | `integer` | Yes | - | - |
| `generation_attempted` | `boolean` | Yes | `false` | - |
| `generation_successful` | `boolean` | Yes | `false` | - |
| `user_satisfied` | `boolean` | Yes | - | - |
| `user_shared_result` | `boolean` | Yes | `false` | - |
| `user_made_purchase` | `boolean` | Yes | `false` | Track if interaction led to purchase - requires shop integration |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `photo_received_at` | `timestamp with time zone` | Yes | - | - |
| `generation_started_at` | `timestamp with time zone` | Yes | - | - |
| `generation_completed_at` | `timestamp with time zone` | Yes | - | - |
| `conversation_ended_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) bot_interactions_pkey**
  ```sql
  CREATE UNIQUE INDEX bot_interactions_pkey ON public.bot_interactions USING btree (id)
  ```
- **idx_bot_interactions_account**
  ```sql
  CREATE INDEX idx_bot_interactions_account ON public.bot_interactions USING btree (account_id)
  ```
- **idx_bot_interactions_conversation**
  ```sql
  CREATE INDEX idx_bot_interactions_conversation ON public.bot_interactions USING btree (conversation_id)
  ```
- **idx_bot_interactions_post**
  ```sql
  CREATE INDEX idx_bot_interactions_post ON public.bot_interactions USING btree (post_id)
  ```
- **idx_bot_interactions_user**
  ```sql
  CREATE INDEX idx_bot_interactions_user ON public.bot_interactions USING btree (instagram_user_id)
  ```
- **idx_bot_interactions_binding_id**
  ```sql
  CREATE INDEX idx_bot_interactions_binding_id ON public.bot_interactions USING btree (binding_id)
  ```
- **idx_bot_interactions_created_at**
  ```sql
  CREATE INDEX idx_bot_interactions_created_at ON public.bot_interactions USING btree (created_at DESC)
  ```
- **idx_bot_interactions_account_created**
  ```sql
  CREATE INDEX idx_bot_interactions_account_created ON public.bot_interactions USING btree (account_id, created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages bot interactions` | ALL | Yes |
| `Workspace members can view interactions` | SELECT | Yes |

## brand_intelligence

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Stores extracted brand voice and intelligence per workspace

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `voice_embedding` | `vector(1536)` | Yes | - | - |
| `voice_attributes` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `avg_quality_score` | `numeric(5,2)` | Yes | - | - |
| `total_products_generated` | `integer` | Yes | `0` | - |
| `conversion_rate` | `numeric(5,4)` | Yes | - | - |
| `trending_styles` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `seasonal_preferences` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `shared_learnings` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) brand_intelligence_pkey**
  ```sql
  CREATE UNIQUE INDEX brand_intelligence_pkey ON public.brand_intelligence USING btree (id)
  ```
- **(UQ) uq_brand_intelligence_workspace**
  ```sql
  CREATE UNIQUE INDEX uq_brand_intelligence_workspace ON public.brand_intelligence USING btree (workspace_id)
  ```
- **idx_brand_intelligence_workspace**
  ```sql
  CREATE INDEX idx_brand_intelligence_workspace ON public.brand_intelligence USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on brand_intelligence` | ALL | Yes |

## brand_knowledge_chunks

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ai`

Stores chunked, embedded knowledge from various sources for RAG retrieval

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `source_type` | `text` | No | - | - |
| `source_url` | `text` | Yes | - | - |
| `source_title` | `text` | Yes | - | - |
| `source_doc_id` | `uuid` | Yes | - | - |
| `content` | `text` | No | - | - |
| `content_hash` | `text` | Yes | - | - |
| `embedding` | `vector(1536)` | Yes | - | - |
| `embedding_model` | `text` | Yes | `'bge-small-en-v1.5'::text` | - |
| `embedding_updated_at` | `timestamp with time zone` | Yes | - | - |
| `chunk_index` | `integer` | Yes | `0` | - |
| `total_chunks` | `integer` | Yes | `1` | - |
| `char_count` | `integer` | Yes | - | - |
| `token_estimate` | `integer` | Yes | - | - |
| `quality_score` | `numeric(3,2)` | Yes | - | - |
| `relevance_tags` | `text[]` | Yes | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `last_verified_at` | `timestamp with time zone` | Yes | - | - |
| `expires_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) brand_knowledge_chunks_pkey**
  ```sql
  CREATE UNIQUE INDEX brand_knowledge_chunks_pkey ON public.brand_knowledge_chunks USING btree (id)
  ```
- **idx_brand_knowledge_workspace**
  ```sql
  CREATE INDEX idx_brand_knowledge_workspace ON public.brand_knowledge_chunks USING btree (workspace_id) WHERE (is_active = true)
  ```
- **idx_brand_knowledge_embedding**
  ```sql
  CREATE INDEX idx_brand_knowledge_embedding ON public.brand_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists='100') WHERE ((is_active = true) AND (embedding IS NOT NULL))
  ```
- **idx_brand_knowledge_source_type**
  ```sql
  CREATE INDEX idx_brand_knowledge_source_type ON public.brand_knowledge_chunks USING btree (workspace_id, source_type) WHERE (is_active = true)
  ```
- **idx_brand_knowledge_content_hash**
  ```sql
  CREATE INDEX idx_brand_knowledge_content_hash ON public.brand_knowledge_chunks USING btree (workspace_id, content_hash) WHERE (content_hash IS NOT NULL)
  ```
- **idx_brand_knowledge_source_doc**
  ```sql
  CREATE INDEX idx_brand_knowledge_source_doc ON public.brand_knowledge_chunks USING btree (source_doc_id) WHERE (source_doc_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on brand_knowledge_chunks` | ALL | Yes |

## brand_settings

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `connected_account_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | No | - | - |
| `brand_name` | `text` | Yes | - | - |
| `brand_tagline` | `text` | Yes | - | - |
| `brand_story` | `text` | Yes | - | - |
| `brand_voice` | `text` | Yes | `'casual'::text` | - |
| `tone_keywords` | `text[]` | Yes | `ARRAY[]::text[]` | - |
| `avoid_keywords` | `text[]` | Yes | `ARRAY[]::text[]` | - |
| `target_gender` | `text` | Yes | `'all'::text` | - |
| `target_age_min` | `integer` | Yes | `18` | - |
| `target_age_max` | `integer` | Yes | `65` | - |
| `target_lifestyle` | `text[]` | Yes | - | - |
| `target_income_level` | `text` | Yes | `'moderate'::text` | - |
| `pricing_strategy` | `text` | Yes | `'value'::text` | - |
| `price_ranges` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `currency` | `text` | Yes | `'USD'::text` | - |
| `default_markup_percent` | `numeric(5,2)` | Yes | `50.00` | - |
| `description_template` | `text` | Yes | - | - |
| `description_length` | `text` | Yes | `'medium'::text` | - |
| `include_materials` | `boolean` | Yes | `true` | - |
| `include_care_instructions` | `boolean` | Yes | `true` | - |
| `include_sizing_info` | `boolean` | Yes | `true` | - |
| `include_sustainability` | `boolean` | Yes | `false` | - |
| `include_origin_story` | `boolean` | Yes | `false` | - |
| `preferred_model_style` | `text` | Yes | `'diverse'::text` | - |
| `preferred_background` | `text` | Yes | `'white'::text` | - |
| `model_diversity_enabled` | `boolean` | Yes | `true` | - |
| `sample_titles` | `text[]` | Yes | `ARRAY[]::text[]` | - |
| `sample_descriptions` | `text[]` | Yes | `ARRAY[]::text[]` | - |
| `common_tags` | `text[]` | Yes | `ARRAY[]::text[]` | - |
| `products_analyzed` | `integer` | Yes | `0` | - |
| `last_analysis_at` | `timestamp with time zone` | Yes | - | - |
| `analysis_insights` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) brand_settings_pkey**
  ```sql
  CREATE UNIQUE INDEX brand_settings_pkey ON public.brand_settings USING btree (id)
  ```
- **(UQ) unique_brand_per_account**
  ```sql
  CREATE UNIQUE INDEX unique_brand_per_account ON public.brand_settings USING btree (connected_account_id)
  ```
- **idx_brand_settings_account**
  ```sql
  CREATE INDEX idx_brand_settings_account ON public.brand_settings USING btree (connected_account_id)
  ```
- **idx_brand_settings_workspace**
  ```sql
  CREATE INDEX idx_brand_settings_workspace ON public.brand_settings USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `brand_settings_delete` | DELETE | Yes |
| `brand_settings_insert` | INSERT | Yes |
| `brand_settings_select` | SELECT | Yes |
| `brand_settings_update` | UPDATE | Yes |

## catalog_generation_jobs

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Tracks bulk catalog generation jobs with chunking, parallel processing (both chunk-level and product-level), checkpoints for resume, and incremental billing. Designed for enterprise clients with 5000+ SKUs. parallel_chunks controls concurrent chunks, parallel_products_per_chunk controls concurrent products within each chunk.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `connected_account_id` | `uuid` | No | - | - |
| `temporal_workflow_id` | `text` | Yes | - | - |
| `temporal_run_id` | `text` | Yes | - | - |
| `config` | `jsonb` | No | `'{}'::jsonb` | - |
| `status` | `text` | No | `'pending'::text` | - |
| `total_products` | `integer` | Yes | `0` | - |
| `products_new` | `integer` | Yes | `0` | - |
| `products_updated` | `integer` | Yes | `0` | - |
| `products_skipped` | `integer` | Yes | `0` | - |
| `total_chunks` | `integer` | Yes | `0` | - |
| `chunks_completed` | `integer` | Yes | `0` | - |
| `chunks_failed` | `integer` | Yes | `0` | - |
| `chunk_size` | `integer` | Yes | `500` | - |
| `parallel_chunks` | `integer` | Yes | `5` | - |
| `items_processed` | `integer` | Yes | `0` | - |
| `items_succeeded` | `integer` | Yes | `0` | - |
| `items_failed` | `integer` | Yes | `0` | - |
| `last_checkpoint_at` | `timestamp with time zone` | Yes | - | - |
| `checkpoint_data` | `jsonb` | Yes | `'{}'::jsonb` | JSON with {completed_chunks: int[], failed_products: [{shopify_id, title, error}]} for resume capability |
| `priority_mode` | `text` | Yes | `'new_first'::text` | Determines product processing order: new_first prioritizes products without AI descriptions |
| `delta_only` | `boolean` | Yes | `false` | When true, only process products that changed since last generation (uses content hash comparison) |
| `delta_detected_at` | `timestamp with time zone` | Yes | - | - |
| `estimated_cost_micro` | `bigint` | Yes | `0` | - |
| `actual_cost_micro` | `bigint` | Yes | `0` | - |
| `billing_event_ids` | `text[]` | Yes | `'{}'::text[]` | Array of workspace_usage_events.id for charges made during this job. Used for refunds on failure. |
| `billing_strategy` | `text` | Yes | `'per_chunk'::text` | - |
| `generate_tryons` | `boolean` | Yes | `true` | - |
| `tryon_count` | `integer` | Yes | `2` | - |
| `auto_publish` | `boolean` | Yes | `false` | - |
| `custom_instructions` | `text` | Yes | - | - |
| `estimated_duration_seconds` | `integer` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `last_activity_at` | `timestamp with time zone` | Yes | `now()` | - |
| `error_message` | `text` | Yes | - | - |
| `error_details` | `jsonb` | Yes | - | - |
| `retry_count` | `integer` | Yes | `0` | - |
| `max_retries` | `integer` | Yes | `3` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_by` | `uuid` | Yes | - | - |
| `parallel_products_per_chunk` | `integer` | Yes | `5` | Number of products to process concurrently within each chunk. Default 5 to stay within Modal.com free tier (10 GPU containers). Each product may use 2 GPU calls (vision + try-on), so 5 products = up to 10 concurrent GPU containers. |

### Indexes

- **(PK) catalog_generation_jobs_pkey**
  ```sql
  CREATE UNIQUE INDEX catalog_generation_jobs_pkey ON public.catalog_generation_jobs USING btree (id)
  ```
- **(UQ) catalog_generation_jobs_temporal_workflow_id_key**
  ```sql
  CREATE UNIQUE INDEX catalog_generation_jobs_temporal_workflow_id_key ON public.catalog_generation_jobs USING btree (temporal_workflow_id)
  ```
- **idx_catalog_jobs_workspace**
  ```sql
  CREATE INDEX idx_catalog_jobs_workspace ON public.catalog_generation_jobs USING btree (workspace_id, created_at DESC)
  ```
- **idx_catalog_jobs_active**
  ```sql
  CREATE INDEX idx_catalog_jobs_active ON public.catalog_generation_jobs USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'preparing'::text, 'processing'::text, 'resuming'::text]))
  ```
- **idx_catalog_jobs_workflow**
  ```sql
  CREATE INDEX idx_catalog_jobs_workflow ON public.catalog_generation_jobs USING btree (temporal_workflow_id) WHERE (temporal_workflow_id IS NOT NULL)
  ```
- **idx_catalog_jobs_account**
  ```sql
  CREATE INDEX idx_catalog_jobs_account ON public.catalog_generation_jobs USING btree (connected_account_id, status)
  ```
- **idx_catalog_generation_jobs_created_by**
  ```sql
  CREATE INDEX idx_catalog_generation_jobs_created_by ON public.catalog_generation_jobs USING btree (created_by)
  ```
- **idx_catalog_generation_jobs_status**
  ```sql
  CREATE INDEX idx_catalog_generation_jobs_status ON public.catalog_generation_jobs USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on catalog_generation_jobs` | ALL | Yes |
| `Users can create catalog jobs in own workspaces` | INSERT | Yes |
| `Users can update catalog jobs in own workspaces` | UPDATE | Yes |
| `Users can view own workspace catalog jobs` | SELECT | Yes |

## connected_social_accounts

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Business social media accounts connected to workspaces (Instagram pages, WhatsApp business numbers, etc.). This is different from social_conversations which tracks customer conversations.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | Yes | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `platform` | `text` | No | - | Platform identifier (instagram, shopify, whatsapp, etc.). No CHECK constraint to allow flexibility - validation handled in application layer. |
| `platform_account_id` | `text` | No | - | - |
| `platform_username` | `text` | Yes | - | - |
| `platform_profile_picture` | `text` | Yes | - | - |
| `access_token` | `text` | No | - | OAuth access token. MUST BE ENCRYPTED in production using pgcrypto or application-level encryption! |
| `token_expires_at` | `timestamp with time zone` | Yes | - | - |
| `token_last_refreshed_at` | `timestamp with time zone` | Yes | - | - |
| `refresh_token` | `text` | Yes | - | - |
| `platform_data` | `jsonb` | Yes | `'{}'::jsonb` | Platform-specific metadata stored as JSONB for maximum flexibility across different social platforms. |
| `settings` | `jsonb` | Yes | `'{"tryon_enabled": true, "...` | Account settings including:
- trigger_keywords: Global trigger words for starting virtual try-on
- message_templates: Customizable bot response messages
- tryon_enabled: Enable/disable virtual try-on feature
- auto_reply_enabled: Enable/disable automatic replies
- notifications_enabled: Enable/disable notifications
- business_hours_enabled: Enable/disable business hours restrictions |
| `status` | `text` | Yes | `'active'::text` | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `stats` | `jsonb` | Yes | `'{"last_message_at": null,...` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `disconnected_at` | `timestamp with time zone` | Yes | - | Timestamp when the Instagram account was disconnected. Used for 90-day retention grace period. |

### Indexes

- **(PK) connected_social_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX connected_social_accounts_pkey ON public.connected_social_accounts USING btree (id)
  ```
- **(UQ) connected_social_accounts_workspace_platform_account_key**
  ```sql
  CREATE UNIQUE INDEX connected_social_accounts_workspace_platform_account_key ON public.connected_social_accounts USING btree (workspace_id, platform, platform_account_id)
  ```
- **(UQ) connected_social_accounts_active_platform_account_unique**
  ```sql
  CREATE UNIQUE INDEX connected_social_accounts_active_platform_account_unique ON public.connected_social_accounts USING btree (platform, platform_account_id) WHERE (status = ANY (ARRAY['active'::text, 'pending'::text]))
  ```
- **idx_connected_social_accounts_platform_id**
  ```sql
  CREATE INDEX idx_connected_social_accounts_platform_id ON public.connected_social_accounts USING btree (platform, platform_account_id)
  ```
- **idx_connected_social_accounts_shopify**
  ```sql
  CREATE INDEX idx_connected_social_accounts_shopify ON public.connected_social_accounts USING btree (workspace_id, status) WHERE (platform = 'shopify'::text)
  ```
- **idx_connected_social_accounts_status**
  ```sql
  CREATE INDEX idx_connected_social_accounts_status ON public.connected_social_accounts USING btree (workspace_id, status) WHERE (status = 'active'::text)
  ```
- **idx_connected_social_accounts_workspace**
  ```sql
  CREATE INDEX idx_connected_social_accounts_workspace ON public.connected_social_accounts USING btree (workspace_id, platform)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role can do anything with connected_social_accounts` | ALL | Yes |
| `Users can delete connected accounts in their workspaces` | DELETE | Yes |
| `Users can insert connected accounts in their workspaces` | INSERT | Yes |
| `Users can update connected accounts in their workspaces` | UPDATE | Yes |
| `Users can view connected accounts in their workspaces` | SELECT | Yes |

## contact_email_log

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `ops`

Tracks auto-response and notification emails sent by the backend

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `contact_submission_id` | `uuid` | Yes | - | - |
| `email_type` | `text` | No | - | - |
| `sent_to` | `text` | No | - | - |
| `sent_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `subject` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'sent'::text` | - |
| `error_message` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) contact_email_log_pkey**
  ```sql
  CREATE UNIQUE INDEX contact_email_log_pkey ON public.contact_email_log USING btree (id)
  ```
- **idx_contact_email_log_sent_at**
  ```sql
  CREATE INDEX idx_contact_email_log_sent_at ON public.contact_email_log USING btree (sent_at DESC)
  ```
- **idx_contact_email_log_submission**
  ```sql
  CREATE INDEX idx_contact_email_log_submission ON public.contact_email_log USING btree (contact_submission_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages contact emails` | ALL | Yes |

## contact_submissions

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Contact form submissions from jko.ai, managed by api.jko.ai:8443 backend

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `name` | `text` | No | - | - |
| `email` | `text` | No | - | - |
| `message` | `text` | No | - | - |
| `created_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `status` | `text` | Yes | `'new'::text` | - |
| `notes` | `text` | Yes | - | - |
| `ip_address` | `text` | Yes | - | - |
| `user_agent` | `text` | Yes | - | - |
| `source` | `text` | Yes | `'jko.ai'::text` | - |
| `auto_response_sent` | `boolean` | Yes | `false` | - |
| `auto_response_sent_at` | `timestamp with time zone` | Yes | - | - |
| `replied_at` | `timestamp with time zone` | Yes | - | - |
| `replied_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) contact_submissions_pkey**
  ```sql
  CREATE UNIQUE INDEX contact_submissions_pkey ON public.contact_submissions USING btree (id)
  ```
- **idx_contact_submissions_created_at**
  ```sql
  CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions USING btree (created_at DESC)
  ```
- **idx_contact_submissions_email**
  ```sql
  CREATE INDEX idx_contact_submissions_email ON public.contact_submissions USING btree (email)
  ```
- **idx_contact_submissions_source**
  ```sql
  CREATE INDEX idx_contact_submissions_source ON public.contact_submissions USING btree (source)
  ```
- **idx_contact_submissions_status**
  ```sql
  CREATE INDEX idx_contact_submissions_status ON public.contact_submissions USING btree (status)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Allow public to insert contact submissions` | INSERT | Yes |
| `Service role manages contact submissions` | ALL | Yes |

## conversation_messages

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Individual messages within conversation sessions

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `session_id` | `uuid` | No | - | - |
| `role` | `text` | No | - | - |
| `content` | `text` | No | - | - |
| `tool_name` | `text` | Yes | - | - |
| `tool_input` | `jsonb` | Yes | - | - |
| `tool_output` | `jsonb` | Yes | - | - |
| `model_used` | `text` | Yes | - | - |
| `tokens_used` | `integer` | Yes | - | - |
| `latency_ms` | `integer` | Yes | - | - |
| `confidence` | `numeric(3,2)` | Yes | - | - |
| `cost_micro_units` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) conversation_messages_pkey**
  ```sql
  CREATE UNIQUE INDEX conversation_messages_pkey ON public.conversation_messages USING btree (id)
  ```
- **idx_conv_messages_session**
  ```sql
  CREATE INDEX idx_conv_messages_session ON public.conversation_messages USING btree (session_id)
  ```
- **idx_conv_messages_created**
  ```sql
  CREATE INDEX idx_conv_messages_created ON public.conversation_messages USING btree (session_id, created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on conversation_messages` | ALL | Yes |

## conversation_sessions

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Tracks customer conversation sessions across channels

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `customer_id` | `uuid` | Yes | - | - |
| `anonymous_id` | `text` | Yes | - | - |
| `channel` | `text` | No | - | - |
| `platform_session_id` | `text` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | `now()` | - |
| `last_activity_at` | `timestamp with time zone` | Yes | `now()` | - |
| `ended_at` | `timestamp with time zone` | Yes | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `session_state` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `extracted_preferences` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `message_count` | `integer` | Yes | `0` | - |
| `tool_calls_count` | `integer` | Yes | `0` | - |
| `conversion_value` | `numeric(10,2)` | Yes | `0` | - |

### Indexes

- **(PK) conversation_sessions_pkey**
  ```sql
  CREATE UNIQUE INDEX conversation_sessions_pkey ON public.conversation_sessions USING btree (id)
  ```
- **idx_conv_sessions_workspace**
  ```sql
  CREATE INDEX idx_conv_sessions_workspace ON public.conversation_sessions USING btree (workspace_id)
  ```
- **idx_conv_sessions_customer**
  ```sql
  CREATE INDEX idx_conv_sessions_customer ON public.conversation_sessions USING btree (customer_id) WHERE (customer_id IS NOT NULL)
  ```
- **idx_conv_sessions_anonymous**
  ```sql
  CREATE INDEX idx_conv_sessions_anonymous ON public.conversation_sessions USING btree (anonymous_id) WHERE (anonymous_id IS NOT NULL)
  ```
- **idx_conv_sessions_active**
  ```sql
  CREATE INDEX idx_conv_sessions_active ON public.conversation_sessions USING btree (workspace_id, is_active) WHERE (is_active = true)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on conversation_sessions` | ALL | Yes |

## cross_brand_analytics

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `analytics`

Aggregate analytics for holding companies

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `holding_workspace_id` | `uuid` | No | - | - |
| `total_skus` | `integer` | Yes | - | - |
| `total_revenue_30d` | `numeric(12,2)` | Yes | - | - |
| `top_performing_brand` | `uuid` | Yes | - | - |
| `shared_customer_segments` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `brand_cannibalization_risk` | `numeric(5,4)` | Yes | - | - |
| `cross_sell_opportunities` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `portfolio_trends` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `recommended_actions` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `computed_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) cross_brand_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX cross_brand_analytics_pkey ON public.cross_brand_analytics USING btree (id)
  ```
- **idx_cross_brand_holding**
  ```sql
  CREATE INDEX idx_cross_brand_holding ON public.cross_brand_analytics USING btree (holding_workspace_id, computed_at DESC)
  ```
- **idx_cross_brand_analytics_top_brand**
  ```sql
  CREATE INDEX idx_cross_brand_analytics_top_brand ON public.cross_brand_analytics USING btree (top_performing_brand)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on cross_brand_analytics` | ALL | Yes |

## imported_products

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Source-agnostic product storage for bulk imports from CSV, Amazon, eBay, etc.
Supports the same AI generation workflow as shopify_products.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `source` | `text` | No | `'csv'::text` | Origin of the product: csv (manual import), amazon, ebay, woocommerce, etc. |
| `external_id` | `text` | Yes | - | Original ID from source system (ASIN for Amazon, item ID for eBay, etc.) |
| `sku` | `text` | Yes | - | - |
| `title` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `images` | `jsonb` | No | `'[]'::jsonb` | - |
| `primary_image_url` | `text` | Yes | - | - |
| `price_cents` | `integer` | Yes | - | - |
| `compare_at_price_cents` | `integer` | Yes | - | - |
| `currency` | `text` | Yes | `'USD'::text` | - |
| `product_type` | `text` | Yes | - | - |
| `vendor` | `text` | Yes | - | - |
| `tags` | `text[]` | Yes | - | - |
| `variants` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `has_variants` | `boolean` | Yes | `(jsonb_array_length(varian...` | - |
| `ai_generated_at` | `timestamp with time zone` | Yes | - | - |
| `ai_body_html` | `text` | Yes | - | - |
| `ai_meta_title` | `text` | Yes | - | - |
| `ai_meta_description` | `text` | Yes | - | - |
| `ai_tags` | `text[]` | Yes | - | - |
| `ai_quality_score` | `integer` | Yes | - | - |
| `garment_type` | `text` | Yes | - | - |
| `garment_category` | `text` | Yes | - | - |
| `garment_color` | `text` | Yes | - | - |
| `garment_material` | `text` | Yes | - | - |
| `garment_fit` | `text` | Yes | - | - |
| `embedding` | `vector(1536)` | Yes | - | - |
| `content_hash` | `text` | Yes | - | - |
| `import_batch_id` | `uuid` | Yes | - | - |
| `import_row_number` | `integer` | Yes | - | - |
| `import_errors` | `jsonb` | Yes | - | - |
| `status` | `text` | Yes | `'pending'::text` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) imported_products_pkey**
  ```sql
  CREATE UNIQUE INDEX imported_products_pkey ON public.imported_products USING btree (id)
  ```
- **(UQ) imported_products_workspace_id_source_external_id_key**
  ```sql
  CREATE UNIQUE INDEX imported_products_workspace_id_source_external_id_key ON public.imported_products USING btree (workspace_id, source, external_id)
  ```
- **idx_imported_products_workspace**
  ```sql
  CREATE INDEX idx_imported_products_workspace ON public.imported_products USING btree (workspace_id, created_at DESC)
  ```
- **idx_imported_products_status**
  ```sql
  CREATE INDEX idx_imported_products_status ON public.imported_products USING btree (workspace_id, status)
  ```
- **idx_imported_products_batch**
  ```sql
  CREATE INDEX idx_imported_products_batch ON public.imported_products USING btree (import_batch_id)
  ```
- **idx_imported_products_source**
  ```sql
  CREATE INDEX idx_imported_products_source ON public.imported_products USING btree (workspace_id, source)
  ```
- **idx_imported_products_pending_ai**
  ```sql
  CREATE INDEX idx_imported_products_pending_ai ON public.imported_products USING btree (workspace_id, status) WHERE ((status = 'pending'::text) AND (ai_generated_at IS NULL))
  ```
- **idx_imported_products_embedding**
  ```sql
  CREATE INDEX idx_imported_products_embedding ON public.imported_products USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on imported_products` | ALL | Yes |
| `Users can delete own workspace imported products` | DELETE | Yes |
| `Users can insert imported products` | INSERT | Yes |
| `Users can update own workspace imported products` | UPDATE | Yes |
| `Users can view own workspace imported products` | SELECT | Yes |

## instagram_account_health

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `account_id` | `uuid` | No | - | - |
| `health_status` | `character varying(20)` | Yes | `'healthy'::character varying` | - |
| `token_valid` | `boolean` | Yes | `true` | - |
| `last_successful_api_call` | `timestamp with time zone` | Yes | - | - |
| `last_failed_api_call` | `timestamp with time zone` | Yes | - | - |
| `consecutive_failures` | `integer` | Yes | `0` | - |
| `error_types` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `webhook_delivery_rate` | `numeric(5,2)` | Yes | `100.00` | - |
| `avg_response_time_ms` | `integer` | Yes | - | - |
| `messages_processed_today` | `integer` | Yes | `0` | - |
| `messages_failed_today` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) instagram_account_health_pkey**
  ```sql
  CREATE UNIQUE INDEX instagram_account_health_pkey ON public.instagram_account_health USING btree (account_id)
  ```
- **idx_account_health_status**
  ```sql
  CREATE INDEX idx_account_health_status ON public.instagram_account_health USING btree (account_id, health_status) WHERE ((health_status)::text <> 'healthy'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages account health` | ALL | Yes |
| `workspace_members_view_account_health` | SELECT | Yes |

## instagram_message_queue

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `account_id` | `uuid` | Yes | - | - |
| `entry_id` | `text` | No | - | - |
| `webhook_payload` | `jsonb` | No | - | - |
| `status` | `character varying(20)` | Yes | `'pending'::character varying` | - |
| `attempts` | `integer` | Yes | `0` | - |
| `max_attempts` | `integer` | Yes | `3` | - |
| `last_error` | `text` | Yes | - | - |
| `processed_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) instagram_message_queue_pkey**
  ```sql
  CREATE UNIQUE INDEX instagram_message_queue_pkey ON public.instagram_message_queue USING btree (id)
  ```
- **idx_message_queue_status_created**
  ```sql
  CREATE INDEX idx_message_queue_status_created ON public.instagram_message_queue USING btree (status, created_at) WHERE ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text]))
  ```
- **idx_instagram_message_queue_account_id**
  ```sql
  CREATE INDEX idx_instagram_message_queue_account_id ON public.instagram_message_queue USING btree (account_id)
  ```
- **idx_instagram_message_queue_status**
  ```sql
  CREATE INDEX idx_instagram_message_queue_status ON public.instagram_message_queue USING btree (status) WHERE ((status)::text = 'pending'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages message queue` | ALL | Yes |

## instagram_post_metrics

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Instagram API metrics + bot performance for shop owner insights

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `post_id` | `text` | No | - | - |
| `account_id` | `uuid` | Yes | - | - |
| `binding_id` | `uuid` | Yes | - | - |
| `impressions` | `integer` | Yes | `0` | - |
| `reach` | `integer` | Yes | `0` | - |
| `likes` | `integer` | Yes | `0` | - |
| `comments` | `integer` | Yes | `0` | - |
| `shares` | `integer` | Yes | `0` | - |
| `saves` | `integer` | Yes | `0` | - |
| `engagement_rate` | `numeric(5,2)` | Yes | `0` | - |
| `bot_comments` | `integer` | Yes | `0` | - |
| `bot_dms` | `integer` | Yes | `0` | - |
| `bot_conversations` | `integer` | Yes | `0` | - |
| `viewers_to_commenters` | `numeric(5,2)` | Yes | `0` | - |
| `commenters_to_triggers` | `numeric(5,2)` | Yes | `0` | - |
| `triggers_to_tryons` | `numeric(5,2)` | Yes | `0` | - |
| `tryons_to_shares` | `numeric(5,2)` | Yes | `0` | - |
| `estimated_sales` | `integer` | Yes | `0` | - |
| `estimated_revenue` | `numeric(10,2)` | Yes | `0` | - |
| `cost_per_tryon` | `numeric(6,4)` | Yes | `0.023` | - |
| `revenue_per_tryon` | `numeric(6,4)` | Yes | `0.115` | - |
| `total_profit` | `numeric(10,2)` | Yes | `0` | - |
| `roi_percentage` | `numeric(8,2)` | Yes | `0` | Return on investment for this post - critical for shop owners |
| `peak_engagement_hour` | `integer` | Yes | - | - |
| `avg_time_to_dm` | `integer` | Yes | - | - |
| `avg_time_to_tryon` | `integer` | Yes | - | - |
| `metric_date` | `date` | Yes | `CURRENT_DATE` | - |
| `metric_hour` | `integer` | Yes | `EXTRACT(hour FROM now())` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) instagram_post_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX instagram_post_metrics_pkey ON public.instagram_post_metrics USING btree (id)
  ```
- **(UQ) instagram_post_metrics_post_id_account_id_metric_date_metri_key**
  ```sql
  CREATE UNIQUE INDEX instagram_post_metrics_post_id_account_id_metric_date_metri_key ON public.instagram_post_metrics USING btree (post_id, account_id, metric_date, metric_hour)
  ```
- **idx_post_metrics_account**
  ```sql
  CREATE INDEX idx_post_metrics_account ON public.instagram_post_metrics USING btree (account_id)
  ```
- **idx_post_metrics_binding**
  ```sql
  CREATE INDEX idx_post_metrics_binding ON public.instagram_post_metrics USING btree (binding_id)
  ```
- **idx_post_metrics_date**
  ```sql
  CREATE INDEX idx_post_metrics_date ON public.instagram_post_metrics USING btree (metric_date DESC)
  ```
- **idx_post_metrics_post**
  ```sql
  CREATE INDEX idx_post_metrics_post ON public.instagram_post_metrics USING btree (post_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages post metrics` | ALL | Yes |
| `Workspace members can view metrics` | SELECT | Yes |

## instagram_rate_limits

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `account_id` | `uuid` | No | - | - |
| `messages_sent_today` | `integer` | Yes | `0` | - |
| `messages_sent_this_hour` | `integer` | Yes | `0` | - |
| `last_message_at` | `timestamp with time zone` | Yes | - | - |
| `daily_limit` | `integer` | Yes | `1000` | - |
| `hourly_limit` | `integer` | Yes | `200` | - |
| `reset_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) instagram_rate_limits_pkey**
  ```sql
  CREATE UNIQUE INDEX instagram_rate_limits_pkey ON public.instagram_rate_limits USING btree (account_id)
  ```
- **idx_rate_limits_account_message**
  ```sql
  CREATE INDEX idx_rate_limits_account_message ON public.instagram_rate_limits USING btree (account_id, last_message_at)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages rate limits` | ALL | Yes |
| `workspace_members_view_rate_limits` | SELECT | Yes |

## instagram_webhook_subscriptions

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `connected_account_id` | `uuid` | No | - | - |
| `webhook_id` | `text` | Yes | - | - |
| `subscribed_fields` | `text[]` | Yes | `ARRAY['messages'::text, 'm...` | - |
| `subscription_status` | `character varying(20)` | Yes | `'active'::character varying` | - |
| `last_verified_at` | `timestamp with time zone` | Yes | - | - |
| `error_count` | `integer` | Yes | `0` | - |
| `last_error` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(UQ) instagram_webhook_subscriptions_connected_account_id_key**
  ```sql
  CREATE UNIQUE INDEX instagram_webhook_subscriptions_connected_account_id_key ON public.instagram_webhook_subscriptions USING btree (connected_account_id)
  ```
- **(PK) instagram_webhook_subscriptions_pkey**
  ```sql
  CREATE UNIQUE INDEX instagram_webhook_subscriptions_pkey ON public.instagram_webhook_subscriptions USING btree (id)
  ```
- **idx_webhook_subs_account_status**
  ```sql
  CREATE INDEX idx_webhook_subs_account_status ON public.instagram_webhook_subscriptions USING btree (connected_account_id, subscription_status) WHERE ((subscription_status)::text = 'active'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages webhook subscriptions` | ALL | Yes |
| `workspace_members_view_webhook_subs` | SELECT | Yes |

## knowledge_ingestion_jobs

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Tracks knowledge ingestion workflow jobs (website scraping, document processing)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `job_type` | `text` | No | - | - |
| `config` | `jsonb` | No | `'{}'::jsonb` | - |
| `status` | `text` | No | `'pending'::text` | - |
| `items_total` | `integer` | Yes | `0` | - |
| `items_processed` | `integer` | Yes | `0` | - |
| `items_succeeded` | `integer` | Yes | `0` | - |
| `items_failed` | `integer` | Yes | `0` | - |
| `chunks_created` | `integer` | Yes | `0` | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_details` | `jsonb` | Yes | - | - |
| `workflow_id` | `text` | Yes | - | - |
| `workflow_run_id` | `text` | Yes | - | - |
| `cost_micro_units` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) knowledge_ingestion_jobs_pkey**
  ```sql
  CREATE UNIQUE INDEX knowledge_ingestion_jobs_pkey ON public.knowledge_ingestion_jobs USING btree (id)
  ```
- **idx_knowledge_jobs_workspace**
  ```sql
  CREATE INDEX idx_knowledge_jobs_workspace ON public.knowledge_ingestion_jobs USING btree (workspace_id, status)
  ```
- **idx_knowledge_jobs_workflow**
  ```sql
  CREATE INDEX idx_knowledge_jobs_workflow ON public.knowledge_ingestion_jobs USING btree (workflow_id) WHERE (workflow_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on knowledge_ingestion_jobs` | ALL | Yes |

## lora_training_history

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Tracks all LoRA training jobs with parameters, results, and billing

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `persona_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | No | - | - |
| `version` | `integer` | No | - | - |
| `image_count` | `integer` | No | - | - |
| `trigger_word` | `text` | No | `'person'::text` | - |
| `epochs` | `integer` | Yes | `3` | - |
| `rank` | `integer` | Yes | `32` | - |
| `alpha` | `integer` | Yes | `16` | - |
| `resolution` | `integer` | Yes | `512` | - |
| `learning_rate` | `numeric(10,8)` | Yes | `0.0001` | - |
| `base_model` | `text` | Yes | `'FLUX.1-dev'::text` | - |
| `status` | `text` | No | - | - |
| `job_id` | `text` | Yes | - | - |
| `lora_path` | `text` | Yes | - | - |
| `lora_size_bytes` | `bigint` | Yes | - | - |
| `processed_images` | `integer` | Yes | - | - |
| `training_time_seconds` | `numeric(10,2)` | Yes | - | - |
| `total_time_seconds` | `numeric(10,2)` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_details` | `jsonb` | Yes | - | - |
| `cost_micro_units` | `integer` | Yes | `0` | - |
| `charged_at` | `timestamp with time zone` | Yes | - | - |
| `refunded_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) lora_training_history_pkey**
  ```sql
  CREATE UNIQUE INDEX lora_training_history_pkey ON public.lora_training_history USING btree (id)
  ```
- **idx_lora_history_persona**
  ```sql
  CREATE INDEX idx_lora_history_persona ON public.lora_training_history USING btree (persona_id, created_at DESC)
  ```
- **idx_lora_history_workspace**
  ```sql
  CREATE INDEX idx_lora_history_workspace ON public.lora_training_history USING btree (workspace_id, created_at DESC)
  ```
- **idx_lora_history_status**
  ```sql
  CREATE INDEX idx_lora_history_status ON public.lora_training_history USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'training'::text]))
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on lora_training_history` | ALL | Yes |
| `Users can view own workspace lora history` | SELECT | Yes |

## notifications

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ops`

Unified notification system for workspace and system events

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `user_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | Yes | - | - |
| `type` | `text` | No | - | - |
| `title` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `action_url` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `read_at` | `timestamp with time zone` | Yes | - | - |
| `archived_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) notifications_pkey**
  ```sql
  CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)
  ```
- **idx_notifications_created_at**
  ```sql
  CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC)
  ```
- **idx_notifications_dashboard**
  ```sql
  CREATE INDEX idx_notifications_dashboard ON public.notifications USING btree (user_id, workspace_id, created_at DESC) WHERE ((read_at IS NULL) AND (archived_at IS NULL))
  ```
- **idx_notifications_type**
  ```sql
  CREATE INDEX idx_notifications_type ON public.notifications USING btree (type)
  ```
- **idx_notifications_user_id**
  ```sql
  CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)
  ```
- **idx_notifications_user_unread**
  ```sql
  CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, read_at) WHERE (read_at IS NULL)
  ```
- **idx_notifications_workspace_id**
  ```sql
  CREATE INDEX idx_notifications_workspace_id ON public.notifications USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role creates notifications` | INSERT | Yes |
| `Users can delete their own notifications` | DELETE | Yes |
| `Users can update their own notifications` | UPDATE | Yes |
| `Users can view their own notifications` | SELECT | Yes |

## oauth_audit_logs

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `auth`

OAuth event audit trail with realtime enabled.
Tracks OAuth authorization, connections, disconnections, errors.
Frontend can subscribe to receive instant notifications when OAuth events occur.
REPLICA IDENTITY FULL ensures complete data in realtime UPDATE events.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `event_type` | `character varying(50)` | No | - | Type of OAuth event: oauth_initiated, oauth_callback_success, oauth_callback_failed, account_connected, account_disconnected, token_refreshed, token_refresh_failed, invalid_state, rate_limit_exceeded |
| `workspace_id` | `uuid` | Yes | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `platform` | `character varying(50)` | No | - | OAuth provider platform: instagram, shopify, etc. |
| `platform_account_id` | `text` | Yes | - | - |
| `ip_address` | `inet` | Yes | - | - |
| `user_agent` | `text` | Yes | - | - |
| `success` | `boolean` | No | `true` | - |
| `error_message` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | Additional event-specific metadata in JSON format |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) oauth_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_audit_logs_pkey ON public.oauth_audit_logs USING btree (id)
  ```
- **idx_oauth_audit_logs_event_type**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_event_type ON public.oauth_audit_logs USING btree (event_type, created_at DESC)
  ```
- **idx_oauth_audit_logs_metadata**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_metadata ON public.oauth_audit_logs USING gin (metadata)
  ```
- **idx_oauth_audit_logs_platform**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_platform ON public.oauth_audit_logs USING btree (platform, created_at DESC)
  ```
- **idx_oauth_audit_logs_success**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_success ON public.oauth_audit_logs USING btree (success, created_at DESC) WHERE (success = false)
  ```
- **idx_oauth_audit_logs_user_id**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_user_id ON public.oauth_audit_logs USING btree (user_id, created_at DESC)
  ```
- **idx_oauth_audit_logs_workspace_id**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_workspace_id ON public.oauth_audit_logs USING btree (workspace_id, created_at DESC)
  ```
- **idx_oauth_audit_logs_workspace_platform**
  ```sql
  CREATE INDEX idx_oauth_audit_logs_workspace_platform ON public.oauth_audit_logs USING btree (workspace_id, platform, created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role has full access to audit logs` | ALL | Yes |
| `Users can view audit logs for their workspaces` | SELECT | Yes |

## pending_shopify_installations

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `commerce`

Tracks Shopify app installations awaiting account creation and setup

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `shop` | `text` | No | - | Shopify shop domain (e.g., store.myshopify.com) |
| `access_token` | `text` | No | - | Encrypted Shopify access token from OAuth flow |
| `scopes` | `text[]` | No | `'{}'::text[]` | - |
| `hmac` | `text` | Yes | - | - |
| `status` | `text` | No | `'pending_account_creation'...` | Installation status: pending_account_creation (waiting), active (linked), expired (timeout) |
| `oauth_data` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `installed_at` | `timestamp with time zone` | No | `now()` | - |
| `expires_at` | `timestamp with time zone` | No | `(now() + '7 days'::interval)` | When this pending installation expires (7 days from installation) |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `linked_workspace_id` | `uuid` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pending_shopify_installations_pkey**
  ```sql
  CREATE UNIQUE INDEX pending_shopify_installations_pkey ON public.pending_shopify_installations USING btree (id)
  ```
- **(UQ) pending_shopify_installations_shop_key**
  ```sql
  CREATE UNIQUE INDEX pending_shopify_installations_shop_key ON public.pending_shopify_installations USING btree (shop)
  ```
- **idx_pending_shopify_expires**
  ```sql
  CREATE INDEX idx_pending_shopify_expires ON public.pending_shopify_installations USING btree (expires_at) WHERE (status = 'pending_account_creation'::text)
  ```
- **idx_pending_shopify_shop**
  ```sql
  CREATE INDEX idx_pending_shopify_shop ON public.pending_shopify_installations USING btree (shop)
  ```
- **idx_pending_shopify_status**
  ```sql
  CREATE INDEX idx_pending_shopify_status ON public.pending_shopify_installations USING btree (status) WHERE (status = 'pending_account_creation'::text)
  ```
- **idx_pending_shopify_workspace**
  ```sql
  CREATE INDEX idx_pending_shopify_workspace ON public.pending_shopify_installations USING btree (linked_workspace_id) WHERE (linked_workspace_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `pending_shopify_service_full_access` | ALL | Yes |
| `pending_shopify_user_view_own` | SELECT | Yes |

## processed_webhook_events

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ops`

Tracks processed Stripe webhook event IDs to prevent duplicate processing

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `event_id` | `text` | No | - | Stripe event ID (e.g., evt_xxx) |
| `processed_at` | `timestamp with time zone` | No | `now()` | When the event was processed |

### Indexes

- **(PK) processed_webhook_events_pkey**
  ```sql
  CREATE UNIQUE INDEX processed_webhook_events_pkey ON public.processed_webhook_events USING btree (event_id)
  ```
- **idx_webhook_events_cleanup**
  ```sql
  CREATE INDEX idx_webhook_events_cleanup ON public.processed_webhook_events USING btree (processed_at)
  ```
- **idx_processed_webhook_events_event**
  ```sql
  CREATE INDEX idx_processed_webhook_events_event ON public.processed_webhook_events USING btree (event_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `service_role_only` | ALL | Yes |

## product_import_batches

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Tracks bulk import jobs with validation, progress, and error tracking.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `source` | `text` | No | - | - |
| `source_file_name` | `text` | Yes | - | - |
| `source_file_url` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'pending'::text` | - |
| `total_rows` | `integer` | Yes | `0` | - |
| `valid_rows` | `integer` | Yes | `0` | - |
| `invalid_rows` | `integer` | Yes | `0` | - |
| `imported_count` | `integer` | Yes | `0` | - |
| `validation_errors` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `error_message` | `text` | Yes | - | - |
| `catalog_job_id` | `uuid` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) product_import_batches_pkey**
  ```sql
  CREATE UNIQUE INDEX product_import_batches_pkey ON public.product_import_batches USING btree (id)
  ```
- **idx_import_batches_workspace**
  ```sql
  CREATE INDEX idx_import_batches_workspace ON public.product_import_batches USING btree (workspace_id, created_at DESC)
  ```
- **idx_product_import_batches_created_by**
  ```sql
  CREATE INDEX idx_product_import_batches_created_by ON public.product_import_batches USING btree (created_by)
  ```
- **idx_product_import_batches_catalog_job_id**
  ```sql
  CREATE INDEX idx_product_import_batches_catalog_job_id ON public.product_import_batches USING btree (catalog_job_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on import_batches` | ALL | Yes |
| `Users can create import batches` | INSERT | Yes |
| `Users can view own workspace import batches` | SELECT | Yes |

## profiles

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `auth`

User profiles with extended information linked to auth.users

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | - | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `username` | `text` | Yes | - | - |
| `full_name` | `text` | Yes | - | - |
| `avatar_url` | `text` | Yes | - | - |
| `website` | `text` | Yes | - | - |
| `location` | `text` | Yes | - | - |
| `timezone` | `timestamp with time zone` | Yes | - | - |
| `language` | `text` | Yes | `'en'::text` | - |
| `phone` | `text` | Yes | - | - |
| `referral_id` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `status` | `text` | Yes | `'active'::text` | - |
| `email` | `text` | Yes | - | - |
| `deleted_at` | `timestamp with time zone` | Yes | - | - |
| `invited_at` | `timestamp with time zone` | Yes | - | - |
| `banned_until` | `timestamp with time zone` | Yes | - | - |
| `email_confirmed_at` | `timestamp with time zone` | Yes | - | - |
| `preferences` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `onboarded_at` | `timestamp with time zone` | Yes | - | - |
| `referral_code` | `character varying(8)` | Yes | - | - |
| `affiliate_status` | `text` | Yes | `'user'::text` | - |
| `affiliate_commission_rate` | `numeric(4,3)` | Yes | `0.20` | - |
| `affiliate_balance_cents` | `bigint` | Yes | `0` | - |
| `affiliate_total_earned_cents` | `bigint` | Yes | `0` | - |
| `affiliate_total_referrals` | `integer` | Yes | `0` | - |
| `affiliate_total_conversions` | `integer` | Yes | `0` | - |
| `affiliate_payout_method` | `text` | Yes | `'credits'::text` | - |
| `affiliate_payout_email` | `text` | Yes | - | - |
| `affiliate_custom_slug` | `character varying(50)` | Yes | - | - |
| `affiliate_approved_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) profiles_pkey**
  ```sql
  CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)
  ```
- **(UQ) profiles_referral_code_key**
  ```sql
  CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles USING btree (referral_code)
  ```
- **(UQ) profiles_username_key**
  ```sql
  CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username)
  ```
- **(UQ) idx_profiles_affiliate_slug**
  ```sql
  CREATE UNIQUE INDEX idx_profiles_affiliate_slug ON public.profiles USING btree (affiliate_custom_slug) WHERE (affiliate_custom_slug IS NOT NULL)
  ```
- **idx_profiles_affiliate_status**
  ```sql
  CREATE INDEX idx_profiles_affiliate_status ON public.profiles USING btree (affiliate_status) WHERE (affiliate_status = 'affiliate'::text)
  ```
- **idx_profiles_email**
  ```sql
  CREATE INDEX idx_profiles_email ON public.profiles USING btree (email)
  ```
- **idx_profiles_preferences**
  ```sql
  CREATE INDEX idx_profiles_preferences ON public.profiles USING gin (preferences)
  ```
- **idx_profiles_referral_code**
  ```sql
  CREATE INDEX idx_profiles_referral_code ON public.profiles USING btree (referral_code) WHERE (referral_code IS NOT NULL)
  ```
- **idx_profiles_referral_id**
  ```sql
  CREATE INDEX idx_profiles_referral_id ON public.profiles USING btree (referral_id)
  ```
- **idx_profiles_status**
  ```sql
  CREATE INDEX idx_profiles_status ON public.profiles USING btree (status)
  ```
- **idx_profiles_username**
  ```sql
  CREATE INDEX idx_profiles_username ON public.profiles USING btree (username)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Public profiles are viewable by everyone` | SELECT | Yes |
| `Users can insert their own profile` | INSERT | Yes |
| `Users can update their own profile` | UPDATE | Yes |

## qa_test_results

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `run_id` | `uuid` | No | - | - |
| `spec_id` | `uuid` | No | - | - |
| `status` | `qa_result_status` | No | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `duration_ms` | `integer` | Yes | - | - |
| `attempt_number` | `integer` | Yes | `1` | - |
| `total_attempts` | `integer` | Yes | `1` | - |
| `error_message` | `text` | Yes | - | - |
| `error_stack` | `text` | Yes | - | - |
| `error_screenshot_url` | `text` | Yes | - | - |
| `failure_step` | `text` | Yes | - | - |
| `was_healed` | `boolean` | Yes | `false` | - |
| `heal_reason` | `text` | Yes | - | - |
| `original_code` | `text` | Yes | - | - |
| `healed_code` | `text` | Yes | - | - |
| `healer_confidence` | `numeric(3,2)` | Yes | - | - |
| `visual_diff_url` | `text` | Yes | - | - |
| `visual_diff_percent` | `numeric(5,2)` | Yes | - | - |
| `visual_passed` | `boolean` | Yes | - | - |
| `screenshot_url` | `text` | Yes | - | - |
| `video_url` | `text` | Yes | - | - |
| `trace_url` | `text` | Yes | - | - |
| `console_logs` | `jsonb` | Yes | - | - |
| `network_logs` | `jsonb` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) qa_test_results_pkey**
  ```sql
  CREATE UNIQUE INDEX qa_test_results_pkey ON public.qa_test_results USING btree (id)
  ```
- **idx_qa_results_run**
  ```sql
  CREATE INDEX idx_qa_results_run ON public.qa_test_results USING btree (run_id, status)
  ```
- **idx_qa_results_spec**
  ```sql
  CREATE INDEX idx_qa_results_spec ON public.qa_test_results USING btree (spec_id, created_at DESC)
  ```
- **idx_qa_results_healed**
  ```sql
  CREATE INDEX idx_qa_results_healed ON public.qa_test_results USING btree (was_healed) WHERE (was_healed = true)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `qa_results_team_access` | ALL | Yes |

## qa_test_runs

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `run_number` | `integer` | No | `nextval('qa_test_runs_run_...` | - |
| `name` | `text` | Yes | - | - |
| `description` | `text` | Yes | - | - |
| `status` | `qa_run_status` | No | `'queued'::qa_run_status` | - |
| `target_app` | `qa_target_app` | Yes | - | - |
| `environment` | `text` | Yes | `'staging'::text` | - |
| `base_url` | `text` | Yes | - | - |
| `triggered_by` | `uuid` | Yes | - | - |
| `trigger_type` | `text` | Yes | `'manual'::text` | - |
| `trigger_ref` | `text` | Yes | - | - |
| `spec_ids` | `uuid[]` | Yes | - | - |
| `tags` | `text[]` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `duration_ms` | `integer` | Yes | - | - |
| `total_specs` | `integer` | Yes | `0` | - |
| `passed_count` | `integer` | Yes | `0` | - |
| `failed_count` | `integer` | Yes | `0` | - |
| `skipped_count` | `integer` | Yes | `0` | - |
| `healed_count` | `integer` | Yes | `0` | - |
| `flaky_count` | `integer` | Yes | `0` | - |
| `auto_heals_applied` | `integer` | Yes | `0` | - |
| `heal_details` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `report_url` | `text` | Yes | - | - |
| `trace_url` | `text` | Yes | - | - |
| `video_url` | `text` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_stack` | `text` | Yes | - | - |
| `git_branch` | `text` | Yes | - | - |
| `git_commit` | `text` | Yes | - | - |
| `git_message` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `git_workflow_id` | `text` | Yes | - | - |
| `git_repo` | `text` | Yes | - | - |
| `git_push_sha` | `text` | Yes | - | - |

### Indexes

- **(PK) qa_test_runs_pkey**
  ```sql
  CREATE UNIQUE INDEX qa_test_runs_pkey ON public.qa_test_runs USING btree (id)
  ```
- **(UQ) qa_test_runs_run_number_key**
  ```sql
  CREATE UNIQUE INDEX qa_test_runs_run_number_key ON public.qa_test_runs USING btree (run_number)
  ```
- **idx_qa_runs_status**
  ```sql
  CREATE INDEX idx_qa_runs_status ON public.qa_test_runs USING btree (status)
  ```
- **idx_qa_runs_target**
  ```sql
  CREATE INDEX idx_qa_runs_target ON public.qa_test_runs USING btree (target_app)
  ```
- **idx_qa_runs_created**
  ```sql
  CREATE INDEX idx_qa_runs_created ON public.qa_test_runs USING btree (created_at DESC)
  ```
- **idx_qa_runs_trigger**
  ```sql
  CREATE INDEX idx_qa_runs_trigger ON public.qa_test_runs USING btree (trigger_type, trigger_ref)
  ```
- **idx_qa_runs_workflow**
  ```sql
  CREATE INDEX idx_qa_runs_workflow ON public.qa_test_runs USING btree (git_workflow_id) WHERE (git_workflow_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `qa_runs_team_access` | ALL | Yes |

## qa_test_specs

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `spec_number` | `integer` | No | `nextval('qa_test_specs_spe...` | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `target_app` | `qa_target_app` | No | `'dash.selify.ai'::qa_targe...` | - |
| `target_url` | `text` | Yes | - | - |
| `nl_spec` | `text` | No | - | - |
| `generated_code` | `text` | Yes | - | - |
| `generated_at` | `timestamp with time zone` | Yes | - | - |
| `generated_by` | `text` | Yes | - | - |
| `generation_model` | `text` | Yes | - | - |
| `spec_file_path` | `text` | Yes | - | - |
| `test_file_path` | `text` | Yes | - | - |
| `status` | `qa_spec_status` | No | `'draft'::qa_spec_status` | - |
| `tags` | `text[]` | Yes | `'{}'::text[]` | - |
| `category` | `text` | Yes | - | - |
| `priority` | `integer` | Yes | `50` | - |
| `timeout_ms` | `integer` | Yes | `30000` | - |
| `retries` | `integer` | Yes | `2` | - |
| `browser` | `text` | Yes | `'chromium'::text` | - |
| `viewport_width` | `integer` | Yes | `1280` | - |
| `viewport_height` | `integer` | Yes | `720` | - |
| `depends_on` | `uuid[]` | Yes | - | - |
| `setup_spec_id` | `uuid` | Yes | - | - |
| `heal_count` | `integer` | Yes | `0` | - |
| `last_healed_at` | `timestamp with time zone` | Yes | - | - |
| `heal_history` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `flaky_score` | `numeric(5,2)` | Yes | `0` | - |
| `consecutive_passes` | `integer` | Yes | `0` | - |
| `consecutive_fails` | `integer` | Yes | `0` | - |
| `visual_baseline_url` | `text` | Yes | - | - |
| `visual_threshold` | `numeric(3,2)` | Yes | `0.01` | - |
| `created_by` | `uuid` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `last_run_at` | `timestamp with time zone` | Yes | - | - |
| `deleted_at` | `timestamp with time zone` | Yes | - | - |
| `trigger_on_repos` | `text[]` | Yes | `'{}'::text[]` | - |
| `run_on_push` | `boolean` | Yes | `false` | - |
| `push_priority` | `integer` | Yes | `100` | - |
| `push_timeout_ms` | `integer` | Yes | `60000` | - |

### Indexes

- **(PK) qa_test_specs_pkey**
  ```sql
  CREATE UNIQUE INDEX qa_test_specs_pkey ON public.qa_test_specs USING btree (id)
  ```
- **(UQ) qa_test_specs_spec_number_key**
  ```sql
  CREATE UNIQUE INDEX qa_test_specs_spec_number_key ON public.qa_test_specs USING btree (spec_number)
  ```
- **idx_qa_specs_status**
  ```sql
  CREATE INDEX idx_qa_specs_status ON public.qa_test_specs USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_target**
  ```sql
  CREATE INDEX idx_qa_specs_target ON public.qa_test_specs USING btree (target_app) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_category**
  ```sql
  CREATE INDEX idx_qa_specs_category ON public.qa_test_specs USING btree (category) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_tags**
  ```sql
  CREATE INDEX idx_qa_specs_tags ON public.qa_test_specs USING gin (tags) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_flaky**
  ```sql
  CREATE INDEX idx_qa_specs_flaky ON public.qa_test_specs USING btree (flaky_score DESC) WHERE ((deleted_at IS NULL) AND (flaky_score > (10)::numeric))
  ```
- **idx_qa_specs_priority**
  ```sql
  CREATE INDEX idx_qa_specs_priority ON public.qa_test_specs USING btree (priority DESC) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_search**
  ```sql
  CREATE INDEX idx_qa_specs_search ON public.qa_test_specs USING gin (to_tsvector('english'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(nl_spec, ''::text)))) WHERE (deleted_at IS NULL)
  ```
- **idx_qa_specs_push_repos**
  ```sql
  CREATE INDEX idx_qa_specs_push_repos ON public.qa_test_specs USING gin (trigger_on_repos) WHERE ((deleted_at IS NULL) AND (status = 'active'::qa_spec_status) AND (run_on_push = true))
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `qa_specs_team_access` | ALL | Yes |

## shopify_collections

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Shopify product collections - can sync to wardrobe collections

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `connected_account_id` | `uuid` | No | - | - |
| `shopify_collection_id` | `text` | No | - | - |
| `collection_type` | `text` | Yes | - | - |
| `title` | `text` | No | - | - |
| `body_html` | `text` | Yes | - | - |
| `handle` | `text` | Yes | - | - |
| `sort_order` | `text` | Yes | - | - |
| `image_url` | `text` | Yes | - | - |
| `image_alt` | `text` | Yes | - | - |
| `wardrobe_collection_id` | `uuid` | Yes | - | - |
| `auto_sync_enabled` | `boolean` | Yes | `false` | - |
| `published` | `boolean` | Yes | `true` | - |
| `published_at` | `timestamp with time zone` | Yes | - | - |
| `product_count` | `integer` | Yes | `0` | - |
| `last_synced_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `shopify_updated_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(UQ) shopify_collections_connected_account_id_shopify_collection_key**
  ```sql
  CREATE UNIQUE INDEX shopify_collections_connected_account_id_shopify_collection_key ON public.shopify_collections USING btree (connected_account_id, shopify_collection_id)
  ```
- **(PK) shopify_collections_pkey**
  ```sql
  CREATE UNIQUE INDEX shopify_collections_pkey ON public.shopify_collections USING btree (id)
  ```
- **idx_shopify_collections_account**
  ```sql
  CREATE INDEX idx_shopify_collections_account ON public.shopify_collections USING btree (connected_account_id)
  ```
- **idx_shopify_collections_published**
  ```sql
  CREATE INDEX idx_shopify_collections_published ON public.shopify_collections USING btree (workspace_id, published)
  ```
- **idx_shopify_collections_wardrobe**
  ```sql
  CREATE INDEX idx_shopify_collections_wardrobe ON public.shopify_collections USING btree (wardrobe_collection_id)
  ```
- **idx_shopify_collections_workspace**
  ```sql
  CREATE INDEX idx_shopify_collections_workspace ON public.shopify_collections USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can manage collections in their workspaces` | ALL | Yes |

## shopify_inventory_history

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `commerce`

Audit trail of inventory changes for analytics

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `variant_id` | `uuid` | No | - | - |
| `previous_quantity` | `integer` | No | - | - |
| `new_quantity` | `integer` | No | - | - |
| `change_amount` | `integer` | No | - | - |
| `change_reason` | `text` | Yes | - | - |
| `change_source` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `changed_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) shopify_inventory_history_pkey**
  ```sql
  CREATE UNIQUE INDEX shopify_inventory_history_pkey ON public.shopify_inventory_history USING btree (id)
  ```
- **idx_inventory_history_variant**
  ```sql
  CREATE INDEX idx_inventory_history_variant ON public.shopify_inventory_history USING btree (variant_id, changed_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can view inventory history of their products` | SELECT | Yes |

## shopify_product_variants

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Individual product variants with size, color, and real-time inventory

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `product_id` | `uuid` | No | - | - |
| `shopify_variant_id` | `text` | No | - | - |
| `shopify_inventory_item_id` | `text` | Yes | - | - |
| `title` | `text` | No | - | - |
| `sku` | `text` | Yes | - | - |
| `barcode` | `text` | Yes | - | - |
| `option1` | `text` | Yes | - | - |
| `option2` | `text` | Yes | - | - |
| `option3` | `text` | Yes | - | - |
| `price_cents` | `integer` | No | - | - |
| `compare_at_price_cents` | `integer` | Yes | - | - |
| `cost_cents` | `integer` | Yes | - | - |
| `inventory_quantity` | `integer` | Yes | `0` | Real-time stock level - synced via webhooks |
| `inventory_policy` | `text` | Yes | `'deny'::text` | deny = out of stock prevents purchase, continue = allow backorder |
| `inventory_management` | `text` | Yes | - | - |
| `fulfillment_service` | `text` | Yes | `'manual'::text` | - |
| `available` | `boolean` | Yes | `true` | - |
| `requires_shipping` | `boolean` | Yes | `true` | - |
| `taxable` | `boolean` | Yes | `true` | - |
| `weight_grams` | `integer` | Yes | - | - |
| `weight_unit` | `text` | Yes | `'g'::text` | - |
| `image_id` | `text` | Yes | - | - |
| `image_url` | `text` | Yes | - | - |
| `position` | `integer` | Yes | `1` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `shopify_created_at` | `timestamp with time zone` | Yes | - | - |
| `shopify_updated_at` | `timestamp with time zone` | Yes | - | - |
| `inventory_item_id` | `text` | Yes | - | Shopify inventory_item_id - different from variant_id, required for inventory webhook matching |

### Indexes

- **(PK) shopify_product_variants_pkey**
  ```sql
  CREATE UNIQUE INDEX shopify_product_variants_pkey ON public.shopify_product_variants USING btree (id)
  ```
- **(UQ) shopify_product_variants_shopify_variant_id_key**
  ```sql
  CREATE UNIQUE INDEX shopify_product_variants_shopify_variant_id_key ON public.shopify_product_variants USING btree (shopify_variant_id)
  ```
- **idx_shopify_variants_inventory_item_id**
  ```sql
  CREATE INDEX idx_shopify_variants_inventory_item_id ON public.shopify_product_variants USING btree (inventory_item_id) WHERE (inventory_item_id IS NOT NULL)
  ```
- **idx_variants_in_stock**
  ```sql
  CREATE INDEX idx_variants_in_stock ON public.shopify_product_variants USING btree (product_id) WHERE ((inventory_quantity > 0) AND (available = true))
  ```
- **idx_variants_inventory**
  ```sql
  CREATE INDEX idx_variants_inventory ON public.shopify_product_variants USING btree (product_id, inventory_quantity, available)
  ```
- **idx_variants_options**
  ```sql
  CREATE INDEX idx_variants_options ON public.shopify_product_variants USING btree (product_id, option1, option2, option3)
  ```
- **idx_variants_product**
  ```sql
  CREATE INDEX idx_variants_product ON public.shopify_product_variants USING btree (product_id)
  ```
- **idx_variants_shopify_id**
  ```sql
  CREATE INDEX idx_variants_shopify_id ON public.shopify_product_variants USING btree (shopify_variant_id)
  ```
- **idx_variants_sku**
  ```sql
  CREATE INDEX idx_variants_sku ON public.shopify_product_variants USING btree (sku) WHERE (sku IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can manage variants of their products` | ALL | Yes |

## shopify_products

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Cached Shopify product data for fast Instagram bot access

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `connected_account_id` | `uuid` | No | - | - |
| `shopify_product_id` | `text` | No | - | - |
| `shopify_admin_graphql_api_id` | `text` | Yes | - | - |
| `title` | `text` | No | - | - |
| `body_html` | `text` | Yes | - | - |
| `vendor` | `text` | Yes | - | - |
| `product_type` | `text` | Yes | - | - |
| `tags` | `text[]` | Yes | `'{}'::text[]` | - |
| `price_min_cents` | `integer` | Yes | - | - |
| `price_max_cents` | `integer` | Yes | - | - |
| `compare_at_price_min_cents` | `integer` | Yes | - | - |
| `currency` | `text` | Yes | `'USD'::text` | - |
| `images` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `featured_image_url` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'active'::text` | - |
| `published_at` | `timestamp with time zone` | Yes | - | - |
| `available_for_sale` | `boolean` | Yes | `true` | - |
| `total_inventory` | `integer` | Yes | `0` | Denormalized sum of all variant inventory for quick checks |
| `variants_count` | `integer` | Yes | `0` | - |
| `has_variants_in_stock` | `boolean` | Yes | `false` | True if ANY variant has inventory > 0 |
| `lowest_stock_level` | `integer` | Yes | - | Lowest inventory count across variants (for urgency messaging) |
| `options` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `handle` | `text` | Yes | - | - |
| `shopify_store_url` | `text` | Yes | - | - |
| `collection_ids` | `text[]` | Yes | `'{}'::text[]` | - |
| `seo_title` | `text` | Yes | - | - |
| `seo_description` | `text` | Yes | - | - |
| `metafields` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `last_synced_at` | `timestamp with time zone` | Yes | `now()` | - |
| `sync_status` | `text` | Yes | `'synced'::text` | - |
| `sync_error` | `text` | Yes | - | - |
| `sync_hash` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `shopify_created_at` | `timestamp with time zone` | Yes | - | - |
| `shopify_updated_at` | `timestamp with time zone` | Yes | - | - |
| `embedding` | `vector(1536)` | Yes | - | - |
| `embedding_model` | `text` | Yes | `'text-embedding-3-small'::...` | - |
| `embedding_updated_at` | `timestamp with time zone` | Yes | - | - |
| `ai_generated_at` | `timestamp with time zone` | Yes | - | Timestamp when AI description was last generated for this product |
| `content_hash_at_generation` | `text` | Yes | - | Content hash at time of last AI generation for delta detection |

### Indexes

- **(UQ) shopify_products_connected_account_id_shopify_product_id_key**
  ```sql
  CREATE UNIQUE INDEX shopify_products_connected_account_id_shopify_product_id_key ON public.shopify_products USING btree (connected_account_id, shopify_product_id)
  ```
- **(PK) shopify_products_pkey**
  ```sql
  CREATE UNIQUE INDEX shopify_products_pkey ON public.shopify_products USING btree (id)
  ```
- **idx_shopify_products_sync**
  ```sql
  CREATE INDEX idx_shopify_products_sync ON public.shopify_products USING btree (sync_status, last_synced_at)
  ```
- **idx_shopify_products_account**
  ```sql
  CREATE INDEX idx_shopify_products_account ON public.shopify_products USING btree (connected_account_id)
  ```
- **idx_shopify_products_available**
  ```sql
  CREATE INDEX idx_shopify_products_available ON public.shopify_products USING btree (workspace_id, available_for_sale, has_variants_in_stock) WHERE ((status = 'active'::text) AND (has_variants_in_stock = true))
  ```
- **idx_shopify_products_inventory**
  ```sql
  CREATE INDEX idx_shopify_products_inventory ON public.shopify_products USING btree (workspace_id, has_variants_in_stock, total_inventory)
  ```
- **idx_shopify_products_low_stock**
  ```sql
  CREATE INDEX idx_shopify_products_low_stock ON public.shopify_products USING btree (workspace_id, lowest_stock_level) WHERE ((lowest_stock_level < 10) AND (has_variants_in_stock = true))
  ```
- **idx_shopify_products_search**
  ```sql
  CREATE INDEX idx_shopify_products_search ON public.shopify_products USING gin (to_tsvector('english'::regconfig, ((((title || ' '::text) || COALESCE(body_html, ''::text)) || ' '::text) || COALESCE(vendor, ''::text))))
  ```
- **idx_shopify_products_status**
  ```sql
  CREATE INDEX idx_shopify_products_status ON public.shopify_products USING btree (workspace_id, status, available_for_sale)
  ```
- **idx_shopify_products_sync_status**
  ```sql
  CREATE INDEX idx_shopify_products_sync_status ON public.shopify_products USING btree (sync_status) WHERE (sync_status <> 'deleted'::text)
  ```
- **idx_shopify_products_tags**
  ```sql
  CREATE INDEX idx_shopify_products_tags ON public.shopify_products USING gin (tags)
  ```
- **idx_shopify_products_title_search**
  ```sql
  CREATE INDEX idx_shopify_products_title_search ON public.shopify_products USING gin (to_tsvector('english'::regconfig, title))
  ```
- **idx_shopify_products_workspace**
  ```sql
  CREATE INDEX idx_shopify_products_workspace ON public.shopify_products USING btree (workspace_id)
  ```
- **shopify_products_embedding_idx**
  ```sql
  CREATE INDEX shopify_products_embedding_idx ON public.shopify_products USING hnsw (embedding vector_cosine_ops)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can manage products in their workspaces` | ALL | Yes |

## social_account_sync_metadata

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `connected_account_id` | `uuid` | No | - | - |
| `last_sync_started_at` | `timestamp with time zone` | Yes | - | - |
| `last_sync_completed_at` | `timestamp with time zone` | Yes | - | - |
| `sync_in_progress` | `boolean` | Yes | `false` | - |
| `api_calls_this_hour` | `integer` | Yes | `0` | - |
| `hour_window_start` | `timestamp with time zone` | Yes | `timezone('utc'::text, now())` | - |
| `total_posts_synced` | `integer` | Yes | `0` | - |
| `last_post_id` | `text` | Yes | - | - |
| `last_post_timestamp` | `timestamp with time zone` | Yes | - | - |
| `consecutive_errors` | `integer` | Yes | `0` | - |
| `last_error` | `text` | Yes | - | - |
| `last_error_at` | `timestamp with time zone` | Yes | - | - |
| `next_allowed_sync` | `timestamp with time zone` | Yes | `timezone('utc'::text, now())` | - |
| `created_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `updated_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |

### Indexes

- **(PK) social_account_sync_metadata_pkey**
  ```sql
  CREATE UNIQUE INDEX social_account_sync_metadata_pkey ON public.social_account_sync_metadata USING btree (connected_account_id)
  ```
- **idx_sync_metadata_next_sync**
  ```sql
  CREATE INDEX idx_sync_metadata_next_sync ON public.social_account_sync_metadata USING btree (next_allowed_sync, sync_in_progress)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role has full access to sync metadata` | ALL | Yes |

## social_conversations

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Multi-platform social media conversations (Instagram, Messenger, WhatsApp, etc.). Acts as performance index and metadata cache.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | Yes | - | - |
| `platform` | `text` | No | - | Social media platform identifier (instagram, messenger, whatsapp, tiktok, telegram, twitter). |
| `platform_user_id` | `text` | No | - | - |
| `platform_username` | `text` | Yes | - | - |
| `platform_profile_url` | `text` | Yes | - | - |
| `last_message_at` | `timestamp with time zone` | Yes | `now()` | - |
| `last_message_text` | `text` | Yes | - | - |
| `unread_count` | `integer` | Yes | `0` | - |
| `conversation_state` | `jsonb` | Yes | `'{"stage": "initial", "awa...` | - |
| `status` | `text` | Yes | `'active'::text` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `connected_account_id` | `uuid` | Yes | - | Links conversation to specific Instagram account (e.g., @bodyspire). Enables multi-account management. |
| `category` | `text` | Yes | `'general'::text` | Inbox category: primary (VIP), general (regular), requests (new/unknown), hidden (spam). Matches Instagram UX. |
| `is_accepted` | `boolean` | Yes | `false` | Whether conversation was accepted from Requests tab and moved to General/Primary. |
| `message_count` | `integer` | Yes | `0` | - |

### Indexes

- **(PK) social_conversations_pkey**
  ```sql
  CREATE UNIQUE INDEX social_conversations_pkey ON public.social_conversations USING btree (id)
  ```
- **(UQ) social_conversations_unique_per_account**
  ```sql
  CREATE UNIQUE INDEX social_conversations_unique_per_account ON public.social_conversations USING btree (connected_account_id, platform_user_id)
  ```
- **idx_social_conversations_account**
  ```sql
  CREATE INDEX idx_social_conversations_account ON public.social_conversations USING btree (connected_account_id, last_message_at DESC)
  ```
- **idx_social_conversations_account_category**
  ```sql
  CREATE INDEX idx_social_conversations_account_category ON public.social_conversations USING btree (connected_account_id, category, last_message_at DESC)
  ```
- **idx_social_conversations_active**
  ```sql
  CREATE INDEX idx_social_conversations_active ON public.social_conversations USING btree (workspace_id, status) WHERE (status = 'active'::text)
  ```
- **idx_social_conversations_connected_account**
  ```sql
  CREATE INDEX idx_social_conversations_connected_account ON public.social_conversations USING btree (connected_account_id)
  ```
- **idx_social_conversations_platform**
  ```sql
  CREATE INDEX idx_social_conversations_platform ON public.social_conversations USING btree (workspace_id, platform, status)
  ```
- **idx_social_conversations_workspace**
  ```sql
  CREATE INDEX idx_social_conversations_workspace ON public.social_conversations USING btree (workspace_id, last_message_at DESC)
  ```
- **idx_social_conversations_status**
  ```sql
  CREATE INDEX idx_social_conversations_status ON public.social_conversations USING btree (status) WHERE (status <> 'closed'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role can do anything with social_conversations` | ALL | Yes |
| `Users can insert conversations in their workspaces` | INSERT | Yes |
| `Users can update conversations in their workspaces` | UPDATE | Yes |
| `Users can view conversations in their workspaces` | SELECT | Yes |

## social_messages

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Individual messages within social conversations across all platforms.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `conversation_id` | `uuid` | Yes | - | - |
| `platform_message_id` | `text` | Yes | - | - |
| `sender_platform_id` | `text` | No | - | - |
| `message_text` | `text` | Yes | - | - |
| `message_type` | `text` | Yes | `'text'::text` | - |
| `attachments` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `read_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `reactions` | `jsonb` | Yes | `'[]'::jsonb` | Array of reaction objects: [{"emoji": "❤️", "actor_id": "123", "created_at": "2025-11-01T10:00:00Z"}] |

### Indexes

- **(PK) social_messages_pkey**
  ```sql
  CREATE UNIQUE INDEX social_messages_pkey ON public.social_messages USING btree (id)
  ```
- **(UQ) social_messages_platform_message_id_unique**
  ```sql
  CREATE UNIQUE INDEX social_messages_platform_message_id_unique ON public.social_messages USING btree (platform_message_id)
  ```
- **idx_social_messages_platform_message_id**
  ```sql
  CREATE INDEX idx_social_messages_platform_message_id ON public.social_messages USING btree (platform_message_id) WHERE (platform_message_id IS NOT NULL)
  ```
- **idx_social_messages_reactions**
  ```sql
  CREATE INDEX idx_social_messages_reactions ON public.social_messages USING gin (reactions) WHERE ((reactions IS NOT NULL) AND (reactions <> '[]'::jsonb))
  ```
- **idx_social_messages_type**
  ```sql
  CREATE INDEX idx_social_messages_type ON public.social_messages USING btree (conversation_id, message_type)
  ```
- **idx_social_messages_unread**
  ```sql
  CREATE INDEX idx_social_messages_unread ON public.social_messages USING btree (conversation_id) WHERE (read_at IS NULL)
  ```
- **idx_social_messages_created_at**
  ```sql
  CREATE INDEX idx_social_messages_created_at ON public.social_messages USING btree (created_at DESC)
  ```
- **idx_social_messages_conversation_created**
  ```sql
  CREATE INDEX idx_social_messages_conversation_created ON public.social_messages USING btree (conversation_id, created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role can do anything with social_messages` | ALL | Yes |
| `Users can insert messages in their workspace conversations` | INSERT | Yes |
| `Users can view messages in their workspace conversations` | SELECT | Yes |

## social_posts

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `connected_account_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | No | - | - |
| `platform` | `text` | No | - | - |
| `platform_post_id` | `text` | No | - | - |
| `platform_url` | `text` | Yes | - | - |
| `caption` | `text` | Yes | - | - |
| `media_type` | `text` | Yes | - | - |
| `media_urls` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `thumbnail_url` | `text` | Yes | - | - |
| `like_count` | `integer` | Yes | `0` | - |
| `comment_count` | `integer` | Yes | `0` | - |
| `view_count` | `integer` | Yes | `0` | - |
| `posted_at` | `timestamp with time zone` | No | - | - |
| `created_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `updated_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `last_synced_at` | `timestamp with time zone` | No | `timezone('utc'::text, now())` | - |
| `shopify_product_id` | `uuid` | Yes | - | Shopify product featured in this Instagram post |
| `shopify_variant_id` | `uuid` | Yes | - | Specific variant if post shows particular size/color |
| `bot_config` | `jsonb` | Yes | - | Post-level bot configuration overrides for campaigns (custom messages, triggers, promo codes, etc.) |

### Indexes

- **(UQ) social_posts_connected_account_id_platform_post_id_key**
  ```sql
  CREATE UNIQUE INDEX social_posts_connected_account_id_platform_post_id_key ON public.social_posts USING btree (connected_account_id, platform_post_id)
  ```
- **(PK) social_posts_pkey**
  ```sql
  CREATE UNIQUE INDEX social_posts_pkey ON public.social_posts USING btree (id)
  ```
- **idx_social_posts_bot_config**
  ```sql
  CREATE INDEX idx_social_posts_bot_config ON public.social_posts USING gin (bot_config)
  ```
- **idx_social_posts_last_synced**
  ```sql
  CREATE INDEX idx_social_posts_last_synced ON public.social_posts USING btree (connected_account_id, last_synced_at)
  ```
- **idx_social_posts_platform**
  ```sql
  CREATE INDEX idx_social_posts_platform ON public.social_posts USING btree (platform)
  ```
- **idx_social_posts_shopify_product**
  ```sql
  CREATE INDEX idx_social_posts_shopify_product ON public.social_posts USING btree (shopify_product_id)
  ```
- **idx_social_posts_workspace**
  ```sql
  CREATE INDEX idx_social_posts_workspace ON public.social_posts USING btree (workspace_id, posted_at DESC)
  ```
- **idx_social_posts_shopify_variant_id**
  ```sql
  CREATE INDEX idx_social_posts_shopify_variant_id ON public.social_posts USING btree (shopify_variant_id)
  ```
- **idx_social_posts_account_posted**
  ```sql
  CREATE INDEX idx_social_posts_account_posted ON public.social_posts USING btree (connected_account_id, posted_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access to social_posts` | ALL | Yes |
| `Service role has full access to posts` | ALL | Yes |
| `Workspace members can view posts` | SELECT | Yes |

## social_posts_garment_bindings

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Links Instagram posts to garment images for virtual try-on. Garments are stored in wardrobe_garments table and can be reused across multiple posts. When user removes a garment from a post, only this binding is deleted - garment stays in wardrobe.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `post_id` | `uuid` | No | - | - |
| `account_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | Yes | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `garment_url` | `text` | Yes | - | - |
| `garment_name` | `text` | Yes | - | - |
| `garment_description` | `text` | Yes | - | - |
| `garment_metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `trigger_keywords` | `text[]` | Yes | `ARRAY['tryon'::text, 'try ...` | - |
| `use_global_keywords` | `boolean` | Yes | `true` | - |
| `total_triggers` | `integer` | Yes | `0` | - |
| `total_dm_conversations` | `integer` | Yes | `0` | - |
| `total_photo_requests` | `integer` | Yes | `0` | - |
| `total_photos_received` | `integer` | Yes | `0` | - |
| `total_generations` | `integer` | Yes | `0` | - |
| `successful_generations` | `integer` | Yes | `0` | - |
| `trigger_to_dm_rate` | `numeric(5,2)` | Yes | `0` | - |
| `dm_to_photo_rate` | `numeric(5,2)` | Yes | `0` | - |
| `photo_to_success_rate` | `numeric(5,2)` | Yes | `0` | - |
| `overall_conversion_rate` | `numeric(5,2)` | Yes | `0` | Key metric: % of trigger words that result in successful try-ons |
| `avg_response_time_ms` | `integer` | Yes | - | - |
| `avg_generation_time_ms` | `integer` | Yes | - | - |
| `last_used_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `wardrobe_garment_id` | `uuid` | Yes | - | Reference to wardrobe_garments table. ALL garments now go through wardrobe: 1. Direct uploads: Upload to wardrobe then create binding. 2. Wardrobe selection: Use existing then create binding. 3. Shopify gallery: Import to wardrobe then create binding. This ensures single source of truth and protects against external URL changes. |

### Indexes

- **(PK) garment_bindings_pkey**
  ```sql
  CREATE UNIQUE INDEX garment_bindings_pkey ON public.social_posts_garment_bindings USING btree (id)
  ```
- **(UQ) garment_bindings_post_id_account_id_key**
  ```sql
  CREATE UNIQUE INDEX garment_bindings_post_id_account_id_key ON public.social_posts_garment_bindings USING btree (post_id, account_id)
  ```
- **idx_garment_bindings_account**
  ```sql
  CREATE INDEX idx_garment_bindings_account ON public.social_posts_garment_bindings USING btree (account_id)
  ```
- **idx_garment_bindings_active**
  ```sql
  CREATE INDEX idx_garment_bindings_active ON public.social_posts_garment_bindings USING btree (is_active) WHERE (is_active = true)
  ```
- **idx_garment_bindings_post**
  ```sql
  CREATE INDEX idx_garment_bindings_post ON public.social_posts_garment_bindings USING btree (post_id)
  ```
- **idx_garment_bindings_workspace**
  ```sql
  CREATE INDEX idx_garment_bindings_workspace ON public.social_posts_garment_bindings USING btree (workspace_id)
  ```
- **idx_social_posts_garment_bindings_wardrobe_garment_id**
  ```sql
  CREATE INDEX idx_social_posts_garment_bindings_wardrobe_garment_id ON public.social_posts_garment_bindings USING btree (wardrobe_garment_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role can do anything with social_posts_garment_bindings` | ALL | Yes |
| `Workspace members can manage garments` | ALL | Yes |

## sso_audit_log

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `auth`

Audit log for SSO authentication events across *.selify.ai subdomains

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `user_id` | `uuid` | Yes | - | - |
| `email` | `text` | Yes | - | - |
| `event_type` | `text` | No | - | - |
| `source_subdomain` | `text` | Yes | - | - |
| `return_to_url` | `text` | Yes | - | - |
| `login_method` | `text` | Yes | - | - |
| `ip_address` | `inet` | Yes | - | - |
| `user_agent` | `text` | Yes | - | - |
| `country_code` | `text` | Yes | - | - |
| `success` | `boolean` | No | `true` | - |
| `error_message` | `text` | Yes | - | - |
| `error_code` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) sso_audit_log_pkey**
  ```sql
  CREATE UNIQUE INDEX sso_audit_log_pkey ON public.sso_audit_log USING btree (id)
  ```
- **idx_sso_audit_user_id**
  ```sql
  CREATE INDEX idx_sso_audit_user_id ON public.sso_audit_log USING btree (user_id)
  ```
- **idx_sso_audit_email**
  ```sql
  CREATE INDEX idx_sso_audit_email ON public.sso_audit_log USING btree (email)
  ```
- **idx_sso_audit_created_at**
  ```sql
  CREATE INDEX idx_sso_audit_created_at ON public.sso_audit_log USING btree (created_at DESC)
  ```
- **idx_sso_audit_event_type**
  ```sql
  CREATE INDEX idx_sso_audit_event_type ON public.sso_audit_log USING btree (event_type)
  ```
- **idx_sso_audit_source**
  ```sql
  CREATE INDEX idx_sso_audit_source ON public.sso_audit_log USING btree (source_subdomain)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role can insert SSO audit logs` | INSERT | Yes |
| `Team members can read all SSO audit logs` | SELECT | Yes |
| `Users can read own SSO audit logs` | SELECT | Yes |

## studio_creations

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

History of all studio generations (try-on, bg removal, color change, text-to-image, etc.)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `project_id` | `uuid` | Yes | - | - |
| `creation_type` | `text` | No | `'tryon'::text` | Type: tryon, bg_remove, color_change, text_to_image, image_to_image, upscale, video |
| `garment_id` | `uuid` | Yes | - | - |
| `model_id` | `uuid` | Yes | - | - |
| `model_image_url` | `text` | Yes | - | - |
| `model_storage_path` | `text` | Yes | - | - |
| `input_image_url` | `text` | Yes | - | - |
| `prompt` | `text` | Yes | - | - |
| `quality` | `text` | Yes | `'balanced'::text` | Generation quality: fast (20 steps), balanced (30 steps), high (40 steps), ultra (50+ steps) |
| `category` | `text` | Yes | `'upper_body'::text` | - |
| `num_outputs` | `integer` | Yes | `1` | - |
| `settings` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `result_urls` | `text[]` | Yes | `'{}'::text[]` | - |
| `thumbnail_url` | `text` | Yes | - | - |
| `replicate_prediction_id` | `text` | Yes | - | - |
| `fal_request_id` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'pending'::text` | - |
| `cost_micro_units` | `integer` | Yes | - | Cost in micro-units: 100000 = $1.00, 10000 = $0.10 |
| `error_message` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) studio_creations_pkey**
  ```sql
  CREATE UNIQUE INDEX studio_creations_pkey ON public.studio_creations USING btree (id)
  ```
- **idx_studio_creations_garment**
  ```sql
  CREATE INDEX idx_studio_creations_garment ON public.studio_creations USING btree (garment_id)
  ```
- **idx_studio_creations_model**
  ```sql
  CREATE INDEX idx_studio_creations_model ON public.studio_creations USING btree (model_id)
  ```
- **idx_studio_creations_prediction**
  ```sql
  CREATE INDEX idx_studio_creations_prediction ON public.studio_creations USING btree (replicate_prediction_id) WHERE (replicate_prediction_id IS NOT NULL)
  ```
- **idx_studio_creations_status**
  ```sql
  CREATE INDEX idx_studio_creations_status ON public.studio_creations USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))
  ```
- **idx_studio_creations_type**
  ```sql
  CREATE INDEX idx_studio_creations_type ON public.studio_creations USING btree (workspace_id, creation_type)
  ```
- **idx_studio_creations_workspace**
  ```sql
  CREATE INDEX idx_studio_creations_workspace ON public.studio_creations USING btree (workspace_id)
  ```
- **idx_studio_creations_workspace_date**
  ```sql
  CREATE INDEX idx_studio_creations_workspace_date ON public.studio_creations USING btree (workspace_id, created_at DESC)
  ```
- **idx_studio_creations_project_id**
  ```sql
  CREATE INDEX idx_studio_creations_project_id ON public.studio_creations USING btree (project_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can delete own workspace creations` | DELETE | Yes |
| `Users can insert own workspace creations` | INSERT | Yes |
| `Users can update own workspace creations` | UPDATE | Yes |
| `Users can view own workspace creations` | SELECT | Yes |

## studio_models

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Saved person photos for reuse in virtual try-ons and AI model generation

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `name` | `text` | Yes | - | - |
| `storage_path` | `text` | No | - | - |
| `thumbnail_url` | `text` | Yes | - | - |
| `attributes` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `usage_count` | `integer` | Yes | `0` | - |
| `is_favorite` | `boolean` | Yes | `false` | - |
| `last_used_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) studio_models_pkey**
  ```sql
  CREATE UNIQUE INDEX studio_models_pkey ON public.studio_models USING btree (id)
  ```
- **idx_studio_models_favorites**
  ```sql
  CREATE INDEX idx_studio_models_favorites ON public.studio_models USING btree (workspace_id, is_favorite) WHERE (is_favorite = true)
  ```
- **idx_studio_models_usage**
  ```sql
  CREATE INDEX idx_studio_models_usage ON public.studio_models USING btree (workspace_id, usage_count DESC)
  ```
- **idx_studio_models_workspace**
  ```sql
  CREATE INDEX idx_studio_models_workspace ON public.studio_models USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can delete own workspace models` | DELETE | Yes |
| `Users can insert own workspace models` | INSERT | Yes |
| `Users can update own workspace models` | UPDATE | Yes |
| `Users can view own workspace models` | SELECT | Yes |

## studio_projects

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Organize creations into campaigns/collections

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `default_settings` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `total_creations` | `integer` | Yes | `0` | - |
| `total_cost_micro_units` | `integer` | Yes | `0` | - |
| `is_archived` | `boolean` | Yes | `false` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) studio_projects_pkey**
  ```sql
  CREATE UNIQUE INDEX studio_projects_pkey ON public.studio_projects USING btree (id)
  ```
- **idx_studio_projects_active**
  ```sql
  CREATE INDEX idx_studio_projects_active ON public.studio_projects USING btree (workspace_id, is_archived) WHERE (is_archived = false)
  ```
- **idx_studio_projects_workspace**
  ```sql
  CREATE INDEX idx_studio_projects_workspace ON public.studio_projects USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can delete own workspace projects` | DELETE | Yes |
| `Users can insert own workspace projects` | INSERT | Yes |
| `Users can update own workspace projects` | UPDATE | Yes |
| `Users can view own workspace projects` | SELECT | Yes |

## subscription_cancellation_feedback

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `billing`

Stores user feedback when cancelling subscriptions for product improvement analytics

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `subscription_tier` | `character varying(50)` | No | - | - |
| `stripe_subscription_id` | `text` | Yes | - | - |
| `cancellation_type` | `character varying(20)` | No | - | Type of cancellation: end_of_period (keeps access) or immediate (loses access now) |
| `cancellation_reason` | `text` | No | - | User-provided reason for cancelling their subscription |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `user_role` | `character varying` | Yes | - | Role of user who cancelled (owner, admin, member) - helps identify if cancellations are from decision-makers |
| `cancellation_flow` | `character varying(50)` | Yes | - | UI flow where cancellation was initiated (settings_page, billing_page) - helps identify UX friction points |
| `had_payment_failures` | `boolean` | Yes | - | Whether workspace had recent payment failures - helps distinguish billing issues from product dissatisfaction |
| `billing_cycle` | `character varying(20)` | Yes | - | Billing cycle type (monthly, annual) - helps analyze retention by payment frequency |
| `previous_tier` | `character varying(50)` | Yes | - | Previous tier if user downgraded before cancelling - helps identify tier transition patterns |

### Indexes

- **(PK) subscription_cancellation_feedback_pkey**
  ```sql
  CREATE UNIQUE INDEX subscription_cancellation_feedback_pkey ON public.subscription_cancellation_feedback USING btree (id)
  ```
- **idx_cancellation_feedback_created_at**
  ```sql
  CREATE INDEX idx_cancellation_feedback_created_at ON public.subscription_cancellation_feedback USING btree (created_at DESC)
  ```
- **idx_cancellation_feedback_tier**
  ```sql
  CREATE INDEX idx_cancellation_feedback_tier ON public.subscription_cancellation_feedback USING btree (subscription_tier)
  ```
- **idx_cancellation_feedback_type**
  ```sql
  CREATE INDEX idx_cancellation_feedback_type ON public.subscription_cancellation_feedback USING btree (cancellation_type)
  ```
- **idx_cancellation_feedback_workspace**
  ```sql
  CREATE INDEX idx_cancellation_feedback_workspace ON public.subscription_cancellation_feedback USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Workspace members can insert cancellation feedback` | INSERT | Yes |
| `Workspace members can view cancellation feedback` | SELECT | Yes |

## subscription_tiers

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `billing`

Configurable subscription tier definitions with Stripe price mappings

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `slug` | `text` | No | - | URL-friendly identifier (starter, pro, enterprise) |
| `display_name` | `text` | No | - | - |
| `stripe_price_id` | `text` | No | - | Stripe price ID from Stripe Dashboard |
| `monthly_price_cents` | `integer` | No | - | - |
| `monthly_tokens_micro` | `bigint` | No | - | Monthly token grant in micro-units (1 dollar = 100,000) |
| `weekly_credits_limit` | `bigint` | No | - | - |
| `display_order` | `integer` | No | `0` | Sort order for displaying tiers (lower = first) |
| `is_active` | `boolean` | Yes | `true` | - |
| `is_featured` | `boolean` | Yes | `false` | - |
| `description` | `text` | Yes | - | - |
| `features` | `jsonb` | Yes | `'[]'::jsonb` | JSON array of feature strings for display |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) subscription_tiers_pkey**
  ```sql
  CREATE UNIQUE INDEX subscription_tiers_pkey ON public.subscription_tiers USING btree (id)
  ```
- **(UQ) subscription_tiers_slug_key**
  ```sql
  CREATE UNIQUE INDEX subscription_tiers_slug_key ON public.subscription_tiers USING btree (slug)
  ```
- **(UQ) subscription_tiers_stripe_price_id_key**
  ```sql
  CREATE UNIQUE INDEX subscription_tiers_stripe_price_id_key ON public.subscription_tiers USING btree (stripe_price_id)
  ```
- **idx_subscription_tiers_active**
  ```sql
  CREATE INDEX idx_subscription_tiers_active ON public.subscription_tiers USING btree (is_active) WHERE (is_active = true)
  ```
- **idx_subscription_tiers_display_order**
  ```sql
  CREATE INDEX idx_subscription_tiers_display_order ON public.subscription_tiers USING btree (display_order)
  ```
- **idx_subscription_tiers_slug**
  ```sql
  CREATE INDEX idx_subscription_tiers_slug ON public.subscription_tiers USING btree (slug)
  ```
- **idx_subscription_tiers_stripe_price_id**
  ```sql
  CREATE INDEX idx_subscription_tiers_stripe_price_id ON public.subscription_tiers USING btree (stripe_price_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Active subscription tiers are publicly readable` | SELECT | Yes |

## temporal_workflows

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Centralized tracking of all Temporal workflow executions with real-time notifications

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workflow_id` | `text` | No | - | - |
| `workflow_type` | `text` | No | - | - |
| `status` | `text` | No | `'RUNNING'::text` | - |
| `progress_percentage` | `integer` | Yes | `0` | - |
| `current_step` | `text` | Yes | - | - |
| `steps_completed` | `text[]` | Yes | - | - |
| `total_steps` | `integer` | Yes | - | - |
| `task_queue` | `text` | Yes | - | - |
| `workspace_id` | `uuid` | Yes | - | - |
| `friendly_name` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `started_at` | `timestamp with time zone` | Yes | `now()` | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) temporal_workflows_pkey**
  ```sql
  CREATE UNIQUE INDEX temporal_workflows_pkey ON public.temporal_workflows USING btree (id)
  ```
- **(UQ) temporal_workflows_workflow_id_key**
  ```sql
  CREATE UNIQUE INDEX temporal_workflows_workflow_id_key ON public.temporal_workflows USING btree (workflow_id)
  ```
- **idx_temporal_workflows_active**
  ```sql
  CREATE INDEX idx_temporal_workflows_active ON public.temporal_workflows USING btree (status, started_at) WHERE (status = 'RUNNING'::text)
  ```
- **idx_temporal_workflows_workspace**
  ```sql
  CREATE INDEX idx_temporal_workflows_workspace ON public.temporal_workflows USING btree (workspace_id, status)
  ```
- **idx_temporal_workflows_type**
  ```sql
  CREATE INDEX idx_temporal_workflows_type ON public.temporal_workflows USING btree (workflow_type, status)
  ```

## user_email_accounts

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `social`

Personal email accounts owned by individual users

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `user_id` | `uuid` | No | - | - |
| `email` | `text` | No | - | - |
| `display_name` | `text` | Yes | - | - |
| `color` | `text` | Yes | - | - |
| `imap_host` | `text` | No | - | - |
| `imap_port` | `integer` | No | `993` | - |
| `imap_secure` | `boolean` | Yes | `true` | - |
| `smtp_host` | `text` | No | - | - |
| `smtp_port` | `integer` | No | `465` | - |
| `smtp_secure` | `boolean` | Yes | `true` | - |
| `password_encrypted` | `text` | No | - | AES-GCM encrypted IMAP/SMTP password with IV prepended |
| `is_active` | `boolean` | Yes | `true` | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `sync_error` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) user_email_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX user_email_accounts_pkey ON public.user_email_accounts USING btree (id)
  ```
- **(UQ) user_email_accounts_user_id_email_key**
  ```sql
  CREATE UNIQUE INDEX user_email_accounts_user_id_email_key ON public.user_email_accounts USING btree (user_id, email)
  ```
- **idx_user_email_accounts_user_id**
  ```sql
  CREATE INDEX idx_user_email_accounts_user_id ON public.user_email_accounts USING btree (user_id)
  ```
- **idx_user_email_accounts_email**
  ```sql
  CREATE INDEX idx_user_email_accounts_email ON public.user_email_accounts USING btree (email)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can delete own email accounts` | DELETE | Yes |
| `Users can insert own email accounts` | INSERT | Yes |
| `Users can update own email accounts` | UPDATE | Yes |
| `Users can view own email accounts` | SELECT | Yes |

## user_feedback

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

External user feedback and bug reports for manual triage

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `user_id` | `uuid` | Yes | - | - |
| `user_email` | `text` | Yes | - | - |
| `title` | `text` | No | - | - |
| `description` | `text` | No | - | - |
| `category` | `text` | No | `'bug'::text` | - |
| `affected_area` | `text` | Yes | - | - |
| `steps_to_reproduce` | `text` | Yes | - | - |
| `expected_behavior` | `text` | Yes | - | - |
| `actual_behavior` | `text` | Yes | - | - |
| `screenshots` | `text[]` | Yes | - | - |
| `metadata` | `jsonb` | Yes | - | - |
| `status` | `text` | No | `'new'::text` | - |
| `source` | `text` | No | `'dashboard'::text` | - |
| `assigned_to` | `uuid` | Yes | - | - |
| `internal_notes` | `text` | Yes | - | - |
| `resolution` | `text` | Yes | - | - |
| `plane_issue_id` | `text` | Yes | - | - |
| `github_issue_number` | `integer` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `resolved_at` | `timestamp with time zone` | Yes | - | - |
| `task_id` | `uuid` | Yes | - | - |

### Indexes

- **idx_user_feedback_task_id**
  ```sql
  CREATE INDEX idx_user_feedback_task_id ON public.user_feedback USING btree (task_id) WHERE (task_id IS NOT NULL)
  ```
- **(PK) user_feedback_pkey**
  ```sql
  CREATE UNIQUE INDEX user_feedback_pkey ON public.user_feedback USING btree (id)
  ```
- **idx_user_feedback_user_id**
  ```sql
  CREATE INDEX idx_user_feedback_user_id ON public.user_feedback USING btree (user_id)
  ```
- **idx_user_feedback_status**
  ```sql
  CREATE INDEX idx_user_feedback_status ON public.user_feedback USING btree (status)
  ```
- **idx_user_feedback_category**
  ```sql
  CREATE INDEX idx_user_feedback_category ON public.user_feedback USING btree (category)
  ```
- **idx_user_feedback_created_at**
  ```sql
  CREATE INDEX idx_user_feedback_created_at ON public.user_feedback USING btree (created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Anyone can submit feedback` | INSERT | Yes |
| `Internal team can update feedback` | UPDATE | Yes |
| `Users can view own feedback` | SELECT | Yes |

## user_preferences

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ai`

Long-term user preferences extracted via Mem0 pattern

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `customer_id` | `uuid` | Yes | - | - |
| `anonymous_id` | `text` | Yes | - | - |
| `category` | `text` | No | - | - |
| `preference_key` | `text` | No | - | - |
| `preference_value` | `jsonb` | No | - | - |
| `confidence` | `numeric(3,2)` | Yes | `0.5` | - |
| `source` | `text` | Yes | - | - |
| `last_confirmed_at` | `timestamp with time zone` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) user_preferences_pkey**
  ```sql
  CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id)
  ```
- **idx_user_prefs_workspace_customer**
  ```sql
  CREATE INDEX idx_user_prefs_workspace_customer ON public.user_preferences USING btree (workspace_id, customer_id) WHERE (customer_id IS NOT NULL)
  ```
- **idx_user_prefs_workspace_anon**
  ```sql
  CREATE INDEX idx_user_prefs_workspace_anon ON public.user_preferences USING btree (workspace_id, anonymous_id) WHERE (anonymous_id IS NOT NULL)
  ```
- **(UQ) idx_user_prefs_unique_customer**
  ```sql
  CREATE UNIQUE INDEX idx_user_prefs_unique_customer ON public.user_preferences USING btree (workspace_id, customer_id, category, preference_key) WHERE (customer_id IS NOT NULL)
  ```
- **(UQ) idx_user_prefs_unique_anon**
  ```sql
  CREATE UNIQUE INDEX idx_user_prefs_unique_anon ON public.user_preferences USING btree (workspace_id, anonymous_id, category, preference_key) WHERE (anonymous_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on user_preferences` | ALL | Yes |

## vr_garments

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

3D garment models displayed in VR shops

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `shop_id` | `uuid` | No | - | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `garment_type` | `text` | No | - | - |
| `model_glb_url` | `text` | No | - | 3D GLB model (<5K polygons, Draco compressed) |
| `thumbnail_url` | `text` | No | - | 2D reference image sent to Nano Banana 2 for try-on |
| `price_usd` | `numeric(10,2)` | Yes | - | - |
| `polygon_count` | `integer` | Yes | - | - |
| `texture_size` | `integer` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `display_order` | `integer` | Yes | `0` | Position on circular rack (0-5 for 6 garments) |
| `is_active` | `boolean` | Yes | `true` | - |

### Indexes

- **(PK) vr_garments_pkey**
  ```sql
  CREATE UNIQUE INDEX vr_garments_pkey ON public.vr_garments USING btree (id)
  ```
- **idx_vr_garments_active**
  ```sql
  CREATE INDEX idx_vr_garments_active ON public.vr_garments USING btree (is_active)
  ```
- **idx_vr_garments_display_order**
  ```sql
  CREATE INDEX idx_vr_garments_display_order ON public.vr_garments USING btree (shop_id, display_order)
  ```
- **idx_vr_garments_shop_id**
  ```sql
  CREATE INDEX idx_vr_garments_shop_id ON public.vr_garments USING btree (shop_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Workspace members can manage garments` | ALL | Yes |

## vr_shop_tokens

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `auth`

API tokens for VR shop access without user authentication

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `shop_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | No | - | Denormalized for fast billing lookups |
| `token` | `text` | No | - | Secure token with vrt_ prefix (e.g., vrt_abc123...) |
| `token_name` | `text` | Yes | - | - |
| `rate_limit_per_minute` | `integer` | Yes | `30` | Max requests per minute for this token |
| `rate_limit_per_hour` | `integer` | Yes | `500` | - |
| `rate_limit_per_day` | `integer` | Yes | `2000` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `expires_at` | `timestamp with time zone` | Yes | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `total_uses` | `integer` | Yes | `0` | - |
| `total_successful` | `integer` | Yes | `0` | - |
| `total_failed` | `integer` | Yes | `0` | - |
| `last_used_at` | `timestamp with time zone` | Yes | - | - |
| `last_used_ip` | `text` | Yes | - | - |
| `created_by` | `uuid` | Yes | - | - |
| `notes` | `text` | Yes | - | - |

### Indexes

- **(PK) vr_shop_tokens_pkey**
  ```sql
  CREATE UNIQUE INDEX vr_shop_tokens_pkey ON public.vr_shop_tokens USING btree (id)
  ```
- **(UQ) vr_shop_tokens_token_key**
  ```sql
  CREATE UNIQUE INDEX vr_shop_tokens_token_key ON public.vr_shop_tokens USING btree (token)
  ```
- **idx_vr_shop_tokens_active**
  ```sql
  CREATE INDEX idx_vr_shop_tokens_active ON public.vr_shop_tokens USING btree (is_active, expires_at) WHERE (is_active = true)
  ```
- **idx_vr_shop_tokens_shop_id**
  ```sql
  CREATE INDEX idx_vr_shop_tokens_shop_id ON public.vr_shop_tokens USING btree (shop_id)
  ```
- **idx_vr_shop_tokens_token**
  ```sql
  CREATE INDEX idx_vr_shop_tokens_token ON public.vr_shop_tokens USING btree (token)
  ```
- **idx_vr_shop_tokens_workspace_id**
  ```sql
  CREATE INDEX idx_vr_shop_tokens_workspace_id ON public.vr_shop_tokens USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access to shop tokens` | ALL | Yes |
| `Workspace members can create shop tokens` | INSERT | Yes |
| `Workspace members can update their shop tokens` | UPDATE | Yes |
| `Workspace members can view their shop tokens` | SELECT | Yes |

## vr_shops

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

Virtual reality shops in the VR shopping mall

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `brand` | `text` | Yes | - | - |
| `logo_url` | `text` | Yes | - | Shop logo displayed in shop selection grid |
| `environment_glb_url` | `text` | Yes | - | Custom 3D shop interior (optional, uses default if null) |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `workspace_id` | `uuid` | Yes | - | Fashion brand workspace that owns this VR shop. Try-ons are charged to this workspace. |

### Indexes

- **(UQ) vr_shops_name_unique**
  ```sql
  CREATE UNIQUE INDEX vr_shops_name_unique ON public.vr_shops USING btree (name)
  ```
- **(PK) vr_shops_pkey**
  ```sql
  CREATE UNIQUE INDEX vr_shops_pkey ON public.vr_shops USING btree (id)
  ```
- **idx_vr_shops_workspace_id**
  ```sql
  CREATE INDEX idx_vr_shops_workspace_id ON public.vr_shops USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Workspace members can manage their shop` | ALL | Yes |

## vr_tryons

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `ai`

Virtual try-on history (Nano Banana 2 generations)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `user_id` | `uuid` | Yes | - | Null if user not logged in (anonymous try-on) |
| `garment_id` | `uuid` | No | - | - |
| `user_photo_url` | `text` | No | - | - |
| `result_url` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'pending'::text` | pending → processing → completed/failed |
| `error_message` | `text` | Yes | - | - |
| `generation_time_ms` | `integer` | Yes | - | - |
| `cost_usd` | `numeric(10,4)` | Yes | `0.03` | Cost per generation ($0.03 for Nano Banana 2) |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `workspace_id` | `uuid` | Yes | - | Workspace that was charged for this try-on (the shop owner) |

### Indexes

- **(PK) vr_tryons_pkey**
  ```sql
  CREATE UNIQUE INDEX vr_tryons_pkey ON public.vr_tryons USING btree (id)
  ```
- **idx_vr_tryons_created_at**
  ```sql
  CREATE INDEX idx_vr_tryons_created_at ON public.vr_tryons USING btree (created_at DESC)
  ```
- **idx_vr_tryons_status**
  ```sql
  CREATE INDEX idx_vr_tryons_status ON public.vr_tryons USING btree (status)
  ```
- **idx_vr_tryons_user_id**
  ```sql
  CREATE INDEX idx_vr_tryons_user_id ON public.vr_tryons USING btree (user_id)
  ```
- **idx_vr_tryons_workspace_id**
  ```sql
  CREATE INDEX idx_vr_tryons_workspace_id ON public.vr_tryons USING btree (workspace_id)
  ```
- **idx_vr_tryons_garment_id**
  ```sql
  CREATE INDEX idx_vr_tryons_garment_id ON public.vr_tryons USING btree (garment_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can create tryons` | INSERT | Yes |
| `Users can view their own tryons` | SELECT | Yes |

## wardrobe_collections

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `thumbnail_url` | `text` | Yes | - | - |
| `display_order` | `integer` | Yes | `0` | - |
| `is_default` | `boolean` | Yes | `false` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_by` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `shopify_collection_id` | `uuid` | Yes | - | Linked Shopify collection for auto-sync |
| `auto_sync_enabled` | `boolean` | Yes | `false` | Automatically sync new products from Shopify collection |
| `last_shopify_sync_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(UQ) unique_collection_name_per_workspace**
  ```sql
  CREATE UNIQUE INDEX unique_collection_name_per_workspace ON public.wardrobe_collections USING btree (workspace_id, name)
  ```
- **(PK) wardrobe_collections_pkey**
  ```sql
  CREATE UNIQUE INDEX wardrobe_collections_pkey ON public.wardrobe_collections USING btree (id)
  ```
- **idx_collections_shopify**
  ```sql
  CREATE INDEX idx_collections_shopify ON public.wardrobe_collections USING btree (workspace_id, shopify_collection_id)
  ```
- **idx_wardrobe_collections_created_at**
  ```sql
  CREATE INDEX idx_wardrobe_collections_created_at ON public.wardrobe_collections USING btree (created_at DESC)
  ```
- **idx_wardrobe_collections_display_order**
  ```sql
  CREATE INDEX idx_wardrobe_collections_display_order ON public.wardrobe_collections USING btree (display_order)
  ```
- **idx_wardrobe_collections_workspace**
  ```sql
  CREATE INDEX idx_wardrobe_collections_workspace ON public.wardrobe_collections USING btree (workspace_id)
  ```
- **(UQ) unique_default_collection_per_workspace**
  ```sql
  CREATE UNIQUE INDEX unique_default_collection_per_workspace ON public.wardrobe_collections USING btree (workspace_id) WHERE (is_default = true)
  ```
- **idx_wardrobe_collections_created_by**
  ```sql
  CREATE INDEX idx_wardrobe_collections_created_by ON public.wardrobe_collections USING btree (created_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can create collections in their workspaces` | INSERT | Yes |
| `Users can delete collections in their workspaces` | DELETE | Yes |
| `Users can update collections in their workspaces` | UPDATE | Yes |
| `Users can view collections in their workspaces` | SELECT | Yes |

## wardrobe_garments

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `commerce`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `collection_id` | `uuid` | Yes | - | - |
| `storage_path` | `text` | No | - | - |
| `filename` | `text` | No | - | - |
| `name` | `text` | Yes | - | - |
| `description` | `text` | Yes | - | - |
| `sku` | `text` | Yes | - | - |
| `tags` | `text[]` | Yes | `'{}'::text[]` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `usage_count` | `integer` | Yes | `0` | - |
| `last_used_at` | `timestamp with time zone` | Yes | - | - |
| `has_transparency` | `boolean` | Yes | `false` | - |
| `mime_type` | `text` | Yes | - | - |
| `file_size` | `bigint` | Yes | - | - |
| `created_by` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `shopify_product_id` | `uuid` | Yes | - | Link to Shopify product if garment sourced from store |
| `shopify_variant_id` | `uuid` | Yes | - | Specific variant (size/color) if selected |
| `shopify_image_index` | `integer` | Yes | `0` | Which product image was chosen (0-based index) |
| `linked_source` | `text` | Yes | `'manual'::text` | How garment was created: manual, shopify_sync, instagram_post |
| `leffa_metadata` | `jsonb` | Yes | - | Structured metadata for Leffa model compatibility.
Structure:
{
  "leffa_category": "upper_body" | "lower_body" | "dresses",
  "category_confidence": 0.0-1.0,
  "sleeve_type": "sleeveless" | "cap" | "short" | "3/4" | "long" | null,
  "neckline": "crew" | "v-neck" | "scoop" | "high" | "off-shoulder" | null,
  "length": "crop" | "regular" | "tunic" | "midi" | "maxi" | null,
  "fit": "fitted" | "regular" | "relaxed" | "oversized" | null,
  "has_print": boolean,
  "has_pattern": boolean,
  "pattern_type": "solid" | "stripes" | "plaid" | "floral" | "graphic" | null,
  "warnings": ["text warnings about garment"],
  "recommended_body_visible": "upper" | "lower" | "full",
  "recommended_pose": "front_standing" | "side" | "back",
  "analyzed_at": "ISO timestamp",
  "analyzer_version": "qwen-vl-2.5-7b"
} |

### Indexes

- **(UQ) unique_storage_path_per_workspace**
  ```sql
  CREATE UNIQUE INDEX unique_storage_path_per_workspace ON public.wardrobe_garments USING btree (workspace_id, storage_path)
  ```
- **(PK) wardrobe_garments_pkey**
  ```sql
  CREATE UNIQUE INDEX wardrobe_garments_pkey ON public.wardrobe_garments USING btree (id)
  ```
- **idx_garments_shopify_product**
  ```sql
  CREATE INDEX idx_garments_shopify_product ON public.wardrobe_garments USING btree (shopify_product_id)
  ```
- **idx_garments_shopify_variant**
  ```sql
  CREATE INDEX idx_garments_shopify_variant ON public.wardrobe_garments USING btree (shopify_variant_id)
  ```
- **idx_wardrobe_garments_collection**
  ```sql
  CREATE INDEX idx_wardrobe_garments_collection ON public.wardrobe_garments USING btree (collection_id)
  ```
- **idx_wardrobe_garments_created_at**
  ```sql
  CREATE INDEX idx_wardrobe_garments_created_at ON public.wardrobe_garments USING btree (created_at DESC)
  ```
- **idx_wardrobe_garments_leffa_category**
  ```sql
  CREATE INDEX idx_wardrobe_garments_leffa_category ON public.wardrobe_garments USING btree (((leffa_metadata ->> 'leffa_category'::text))) WHERE (leffa_metadata IS NOT NULL)
  ```
- **idx_wardrobe_garments_shopify_account**
  ```sql
  CREATE INDEX idx_wardrobe_garments_shopify_account ON public.wardrobe_garments USING btree (((metadata ->> 'account_id'::text))) WHERE ((metadata -> 'shopify'::text) IS NOT NULL)
  ```
- **idx_wardrobe_garments_shopify_product_id**
  ```sql
  CREATE INDEX idx_wardrobe_garments_shopify_product_id ON public.wardrobe_garments USING btree ((((metadata -> 'shopify'::text) ->> 'product_id'::text))) WHERE ((metadata -> 'shopify'::text) IS NOT NULL)
  ```
- **idx_wardrobe_garments_sku**
  ```sql
  CREATE INDEX idx_wardrobe_garments_sku ON public.wardrobe_garments USING btree (sku)
  ```
- **idx_wardrobe_garments_storage_path**
  ```sql
  CREATE INDEX idx_wardrobe_garments_storage_path ON public.wardrobe_garments USING btree (storage_path)
  ```
- **idx_wardrobe_garments_tags**
  ```sql
  CREATE INDEX idx_wardrobe_garments_tags ON public.wardrobe_garments USING gin (tags)
  ```
- **idx_wardrobe_garments_usage**
  ```sql
  CREATE INDEX idx_wardrobe_garments_usage ON public.wardrobe_garments USING btree (usage_count DESC)
  ```
- **idx_wardrobe_garments_workspace**
  ```sql
  CREATE INDEX idx_wardrobe_garments_workspace ON public.wardrobe_garments USING btree (workspace_id)
  ```
- **idx_wardrobe_garments_created_by**
  ```sql
  CREATE INDEX idx_wardrobe_garments_created_by ON public.wardrobe_garments USING btree (created_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can create garments in their workspaces` | INSERT | Yes |
| `Users can delete garments in their workspaces` | DELETE | Yes |
| `Users can update garments in their workspaces` | UPDATE | Yes |
| `Users can view garments in their workspaces` | SELECT | Yes |

## wardrobe_usage_events

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `commerce`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `garment_id` | `uuid` | No | - | - |
| `workspace_id` | `uuid` | No | - | - |
| `event_type` | `text` | No | - | - |
| `event_metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) wardrobe_usage_events_pkey**
  ```sql
  CREATE UNIQUE INDEX wardrobe_usage_events_pkey ON public.wardrobe_usage_events USING btree (id)
  ```
- **idx_wardrobe_usage_events_created_at**
  ```sql
  CREATE INDEX idx_wardrobe_usage_events_created_at ON public.wardrobe_usage_events USING btree (created_at DESC)
  ```
- **idx_wardrobe_usage_events_garment**
  ```sql
  CREATE INDEX idx_wardrobe_usage_events_garment ON public.wardrobe_usage_events USING btree (garment_id)
  ```
- **idx_wardrobe_usage_events_type**
  ```sql
  CREATE INDEX idx_wardrobe_usage_events_type ON public.wardrobe_usage_events USING btree (event_type)
  ```
- **idx_wardrobe_usage_events_workspace**
  ```sql
  CREATE INDEX idx_wardrobe_usage_events_workspace ON public.wardrobe_usage_events USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can create usage events in their workspaces` | INSERT | Yes |
| `Users can view usage events in their workspaces` | SELECT | Yes |

## webhook_events

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ops`

Event queue and audit log for all incoming webhook events. Enables async processing and idempotency.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `platform` | `character varying(50)` | No | - | - |
| `platform_message_id` | `character varying(255)` | Yes | - | Platform-specific message ID (Instagram mid, TikTok msg_id). NULL for events without message IDs (comments). |
| `event_fingerprint` | `text` | No | - | SHA-256 hash of normalized payload. Ensures deduplication even without message_id. |
| `event_type` | `character varying(50)` | No | - | - |
| `connected_account_id` | `uuid` | Yes | - | - |
| `payload` | `jsonb` | No | - | - |
| `parsed_data` | `jsonb` | Yes | - | - |
| `status` | `character varying(50)` | No | `'pending'::character varying` | pending: waiting to process, processing: currently being processed, completed: done, failed: error occurred, skipped: intentionally not processed |
| `retry_count` | `integer` | No | `0` | Number of times processing has been attempted. Incremented on each failure. |
| `max_retries` | `integer` | No | `3` | - |
| `processing_result` | `jsonb` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_stack` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `processing_started_at` | `timestamp with time zone` | Yes | - | - |
| `processed_at` | `timestamp with time zone` | Yes | - | - |
| `next_retry_at` | `timestamp with time zone` | Yes | - | When to retry processing if status=failed. Uses exponential backoff. |
| `processing_duration_ms` | `integer` | Yes | - | - |
| `worker_id` | `character varying(255)` | Yes | - | - |

### Indexes

- **(PK) webhook_events_pkey**
  ```sql
  CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id)
  ```
- **webhook_events_account_idx**
  ```sql
  CREATE INDEX webhook_events_account_idx ON public.webhook_events USING btree (connected_account_id, created_at DESC)
  ```
- **(UQ) webhook_events_fingerprint_unique**
  ```sql
  CREATE UNIQUE INDEX webhook_events_fingerprint_unique ON public.webhook_events USING btree (event_fingerprint)
  ```
- **(UQ) webhook_events_message_id_unique**
  ```sql
  CREATE UNIQUE INDEX webhook_events_message_id_unique ON public.webhook_events USING btree (platform, platform_message_id) WHERE (platform_message_id IS NOT NULL)
  ```
- **webhook_events_payload_idx**
  ```sql
  CREATE INDEX webhook_events_payload_idx ON public.webhook_events USING gin (payload jsonb_path_ops)
  ```
- **webhook_events_pending_idx**
  ```sql
  CREATE INDEX webhook_events_pending_idx ON public.webhook_events USING btree (status, created_at) WHERE ((status)::text = 'pending'::text)
  ```
- **webhook_events_retry_idx**
  ```sql
  CREATE INDEX webhook_events_retry_idx ON public.webhook_events USING btree (status, next_retry_at) WHERE (((status)::text = 'failed'::text) AND (retry_count < max_retries))
  ```
- **webhook_events_status_idx**
  ```sql
  CREATE INDEX webhook_events_status_idx ON public.webhook_events USING btree (status, created_at DESC)
  ```
- **idx_webhook_events_platform_status**
  ```sql
  CREATE INDEX idx_webhook_events_platform_status ON public.webhook_events USING btree (platform, status, created_at)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `webhook_events_service_all` | ALL | Yes |
| `webhook_events_workspace_read` | SELECT | Yes |

## workspace_auto_reload_settings

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ops`

Auto-reload configuration. REPLICA IDENTITY FULL for realtime settings updates.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `workspace_id` | `uuid` | No | - | - |
| `enabled` | `boolean` | No | `false` | - |
| `threshold_cents` | `integer` | No | - | Balance threshold in cents that triggers auto-reload (minimum $5.00) |
| `reload_amount_cents` | `integer` | No | - | Amount in cents to charge when auto-reload triggers (minimum $15.00) |
| `stripe_payment_method_id` | `text` | Yes | - | Managed via Stripe Customer Portal - not stored directly |
| `last_reload_at` | `timestamp with time zone` | Yes | - | - |
| `last_reload_status` | `text` | Yes | - | - |
| `failed_attempts` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `created_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) workspace_auto_reload_settings_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_auto_reload_settings_pkey ON public.workspace_auto_reload_settings USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `workspace_members_manage_auto_reload` | ALL | Yes |

## workspace_email_account_members

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `social`

Access control for workspace email accounts

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `account_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | No | - | - |
| `role` | `text` | No | `'member'::text` | owner: created the account, admin: full control, member: send/receive, readonly: view only |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) workspace_email_account_members_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_email_account_members_pkey ON public.workspace_email_account_members USING btree (id)
  ```
- **(UQ) workspace_email_account_members_account_id_user_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_email_account_members_account_id_user_id_key ON public.workspace_email_account_members USING btree (account_id, user_id)
  ```
- **idx_workspace_email_access_account**
  ```sql
  CREATE INDEX idx_workspace_email_access_account ON public.workspace_email_account_members USING btree (account_id)
  ```
- **idx_workspace_email_access_user**
  ```sql
  CREATE INDEX idx_workspace_email_access_user ON public.workspace_email_account_members USING btree (user_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Email admins can manage access` | ALL | Yes |

## workspace_email_accounts

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `social`

Shared email accounts for team/workspace use (e.g., info@, support@)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `email` | `text` | No | - | - |
| `display_name` | `text` | Yes | - | - |
| `color` | `text` | Yes | - | - |
| `imap_host` | `text` | No | - | - |
| `imap_port` | `integer` | No | `993` | - |
| `imap_secure` | `boolean` | Yes | `true` | - |
| `smtp_host` | `text` | No | - | - |
| `smtp_port` | `integer` | No | `465` | - |
| `smtp_secure` | `boolean` | Yes | `true` | - |
| `password_encrypted` | `text` | No | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `sync_error` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) workspace_email_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_email_accounts_pkey ON public.workspace_email_accounts USING btree (id)
  ```
- **(UQ) workspace_email_accounts_workspace_id_email_key**
  ```sql
  CREATE UNIQUE INDEX workspace_email_accounts_workspace_id_email_key ON public.workspace_email_accounts USING btree (workspace_id, email)
  ```
- **idx_workspace_email_accounts_workspace_id**
  ```sql
  CREATE INDEX idx_workspace_email_accounts_workspace_id ON public.workspace_email_accounts USING btree (workspace_id)
  ```
- **idx_workspace_email_accounts_email**
  ```sql
  CREATE INDEX idx_workspace_email_accounts_email ON public.workspace_email_accounts USING btree (email)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can view accessible workspace email accounts` | SELECT | Yes |
| `Workspace admins can delete email accounts` | DELETE | Yes |
| `Workspace admins can insert email accounts` | INSERT | Yes |
| `Workspace admins can update email accounts` | UPDATE | Yes |

## workspace_events

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `ops`

DEPRECATED: This table is no longer used for realtime notifications.
Use oauth_audit_logs instead for OAuth event notifications.
This table is kept for historical audit data only.
Not in realtime publication - events are not broadcast.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `event_type` | `text` | No | - | - |
| `event_data` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) workspace_events_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_events_pkey ON public.workspace_events USING btree (id)
  ```
- **idx_workspace_events_created_at**
  ```sql
  CREATE INDEX idx_workspace_events_created_at ON public.workspace_events USING btree (created_at DESC)
  ```
- **idx_workspace_events_workspace_id**
  ```sql
  CREATE INDEX idx_workspace_events_workspace_id ON public.workspace_events USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can view workspace events` | SELECT | Yes |

## workspace_financial_transactions

> **Usage:** `both` · **Audience:** `external` · **Domain:** `billing`

Financial audit trail. REPLICA IDENTITY FULL for realtime transaction tracking.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `transaction_type` | `character varying(50)` | No | - | subscription_payment: Initial subscription purchase, subscription_renewal: Monthly renewal, payg_purchase: One-time credit purchase |
| `amount_usd_cents` | `integer` | No | - | Actual money amount in cents (e.g., 2900 for $29.00) |
| `amount_micro_units` | `bigint` | No | - | Equivalent in micro-units (e.g., 3,500,000 for $35.00 worth of credits) |
| `stripe_payment_intent_id` | `text` | Yes | - | - |
| `stripe_subscription_id` | `text` | Yes | - | - |
| `stripe_invoice_id` | `text` | Yes | - | - |
| `stripe_session_id` | `text` | Yes | - | - |
| `stripe_customer_id` | `text` | Yes | - | - |
| `subscription_tier` | `character varying(50)` | Yes | - | - |
| `billing_period_start` | `timestamp with time zone` | Yes | - | - |
| `billing_period_end` | `timestamp with time zone` | Yes | - | - |
| `payg_balance_before` | `bigint` | Yes | - | - |
| `payg_balance_after` | `bigint` | Yes | - | - |
| `status` | `character varying(20)` | No | `'completed'::character var...` | - |
| `description` | `text` | No | - | - |
| `notes` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `refunded_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) workspace_financial_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_financial_transactions_pkey ON public.workspace_financial_transactions USING btree (id)
  ```
- **idx_financial_revenue**
  ```sql
  CREATE INDEX idx_financial_revenue ON public.workspace_financial_transactions USING btree (workspace_id, status, transaction_type, created_at DESC) WHERE ((status)::text = 'completed'::text)
  ```
- **idx_financial_status**
  ```sql
  CREATE INDEX idx_financial_status ON public.workspace_financial_transactions USING btree (status)
  ```
- **idx_financial_stripe_pi**
  ```sql
  CREATE INDEX idx_financial_stripe_pi ON public.workspace_financial_transactions USING btree (stripe_payment_intent_id) WHERE (stripe_payment_intent_id IS NOT NULL)
  ```
- **idx_financial_stripe_sub**
  ```sql
  CREATE INDEX idx_financial_stripe_sub ON public.workspace_financial_transactions USING btree (stripe_subscription_id) WHERE (stripe_subscription_id IS NOT NULL)
  ```
- **idx_financial_type**
  ```sql
  CREATE INDEX idx_financial_type ON public.workspace_financial_transactions USING btree (transaction_type, created_at DESC)
  ```
- **idx_financial_type_workspace**
  ```sql
  CREATE INDEX idx_financial_type_workspace ON public.workspace_financial_transactions USING btree (transaction_type, workspace_id)
  ```
- **idx_financial_workspace_created**
  ```sql
  CREATE INDEX idx_financial_workspace_created ON public.workspace_financial_transactions USING btree (workspace_id, created_at DESC)
  ```
- **idx_workspace_financial_transactions_shopify_attributed**
  ```sql
  CREATE INDEX idx_workspace_financial_transactions_shopify_attributed ON public.workspace_financial_transactions USING btree (workspace_id, (((metadata ->> 'attributed_to_tryon'::text))::boolean)) WHERE (((transaction_type)::text = 'shopify_order'::text) AND ((status)::text = 'completed'::text))
  ```
- **idx_workspace_financial_transactions_shopify_orders**
  ```sql
  CREATE INDEX idx_workspace_financial_transactions_shopify_orders ON public.workspace_financial_transactions USING btree (workspace_id, ((metadata ->> 'account_id'::text))) WHERE ((transaction_type)::text = 'shopify_order'::text)
  ```
- **idx_workspace_financial_transactions_created_at**
  ```sql
  CREATE INDEX idx_workspace_financial_transactions_created_at ON public.workspace_financial_transactions USING btree (created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages financial transactions` | ALL | Yes |
| `workspace_financial_transactions_select` | SELECT | Yes |

## workspace_members

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `auth`

Workspace members are now created atomically via create_workspace_with_owner function, not via triggers

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | No | - | - |
| `role` | `text` | No | `'member'::text` | - |
| `permissions` | `jsonb` | Yes | `'[]'::jsonb` | - |
| `invited_by` | `uuid` | Yes | - | - |
| `invited_at` | `timestamp with time zone` | Yes | - | - |
| `joined_at` | `timestamp with time zone` | Yes | - | - |
| `expires_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) workspace_members_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_members_pkey ON public.workspace_members USING btree (id)
  ```
- **(UQ) workspace_members_workspace_id_user_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_members_workspace_id_user_id_key ON public.workspace_members USING btree (workspace_id, user_id)
  ```
- **idx_workspace_members_role**
  ```sql
  CREATE INDEX idx_workspace_members_role ON public.workspace_members USING btree (role)
  ```
- **idx_workspace_members_user_id**
  ```sql
  CREATE INDEX idx_workspace_members_user_id ON public.workspace_members USING btree (user_id)
  ```
- **idx_workspace_members_workspace_id**
  ```sql
  CREATE INDEX idx_workspace_members_workspace_id ON public.workspace_members USING btree (workspace_id)
  ```
- **idx_workspace_members_user_workspace**
  ```sql
  CREATE INDEX idx_workspace_members_user_workspace ON public.workspace_members USING btree (user_id, workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `workspace_members_delete` | DELETE | Yes |
| `workspace_members_insert` | INSERT | Yes |
| `workspace_members_select` | SELECT | Yes |
| `workspace_members_update` | UPDATE | Yes |

## workspace_payg_balance

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `billing`

Pay-As-You-Go (PAYG) balance for workspaces. Tracks micro-units purchased via one-time payments. Separate from subscription credits (tracked in workspace_quotas). All values in micro-units (1 micro-unit = $0.00001).

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `balance_micro_units` | `bigint` | No | `0` | Current PAYG balance in micro-units. Users can buy credits and use them anytime. Does not expire. Example: 1,000,000 micro-units = $10.00 worth. |
| `total_purchased` | `bigint` | No | `0` | Lifetime total micro-units purchased via PAYG. Includes all purchases and grants. Never decreases. |
| `total_used` | `bigint` | No | `0` | Lifetime total micro-units consumed from PAYG balance. Never decreases. Used when subscription credits are exhausted. |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `stripe_customer_id` | `text` | Yes | - | - |

### Indexes

- **(PK) workspace_payg_balance_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_payg_balance_pkey ON public.workspace_payg_balance USING btree (id)
  ```
- **(UQ) workspace_payg_balance_workspace_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_payg_balance_workspace_id_key ON public.workspace_payg_balance USING btree (workspace_id)
  ```
- **idx_workspace_payg_balance_stripe_customer**
  ```sql
  CREATE INDEX idx_workspace_payg_balance_stripe_customer ON public.workspace_payg_balance USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages PAYG balance` | ALL | Yes |
| `Workspace members can view tokens` | SELECT | Yes |

## workspace_quotas

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `billing`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `subscription_tier` | `character varying(50)` | No | `'free'::character varying` | - |
| `period_start` | `timestamp with time zone` | No | - | - |
| `period_end` | `timestamp with time zone` | No | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `weekly_credits_limit` | `integer` | No | `100` | Weekly credit allocation (10k = free tier baseline of $0.60/week) |
| `weekly_credits_used` | `integer` | No | `0` | Credits consumed this week (383 per generation, 17 per message) |

### Indexes

- **(PK) workspace_quotas_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_quotas_pkey ON public.workspace_quotas USING btree (id)
  ```
- **(UQ) workspace_quotas_workspace_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_quotas_workspace_id_key ON public.workspace_quotas USING btree (workspace_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages quotas` | ALL | Yes |
| `Workspace members can view quotas` | SELECT | Yes |

## workspace_subscriptions

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `billing`

Workspace subscription records. Removed metadata column (2025-11-04) as it contained redundant data (tier, workspace_id) already available as separate columns.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `tier` | `character varying(50)` | No | - | - |
| `status` | `character varying(50)` | No | `'active'::character varying` | - |
| `stripe_subscription_id` | `text` | Yes | - | - |
| `stripe_customer_id` | `text` | Yes | - | - |
| `current_period_start` | `timestamp with time zone` | Yes | - | - |
| `current_period_end` | `timestamp with time zone` | Yes | - | - |
| `cancel_at_period_end` | `boolean` | Yes | `false` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `cancelled_at` | `timestamp with time zone` | Yes | - | when sub. cancellation was done |
| `scheduled_tier` | `character varying(50)` | Yes | - | Pending tier change scheduled for future (e.g., user on "enterprise" scheduled to downgrade to "pro" at end of billing period) |
| `scheduled_tier_effective_date` | `timestamp with time zone` | Yes | - | When the scheduled tier change will take effect (typically end of current billing period) |
| `stripe_schedule_id` | `text` | Yes | - | Stripe subscription schedule ID for tracking scheduled changes |

### Indexes

- **(PK) workspace_subscriptions_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_subscriptions_pkey ON public.workspace_subscriptions USING btree (id)
  ```
- **(UQ) workspace_subscriptions_stripe_subscription_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_subscriptions_stripe_subscription_id_key ON public.workspace_subscriptions USING btree (stripe_subscription_id)
  ```
- **(UQ) workspace_subscriptions_workspace_id_key**
  ```sql
  CREATE UNIQUE INDEX workspace_subscriptions_workspace_id_key ON public.workspace_subscriptions USING btree (workspace_id)
  ```
- **idx_workspace_subscriptions_scheduled**
  ```sql
  CREATE INDEX idx_workspace_subscriptions_scheduled ON public.workspace_subscriptions USING btree (scheduled_tier, scheduled_tier_effective_date) WHERE (scheduled_tier IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages subscriptions` | ALL | Yes |
| `Workspace members can view subscriptions` | SELECT | Yes |

## workspace_usage_events

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `billing`

Unified event log for all paid actions (generations, messages, photo shoots, etc). Single source of truth for usage analytics.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `service_type` | `character varying(50)` | No | - | Type of service: generation, message, photo_shoot, etc. |
| `service_subtype` | `character varying(50)` | Yes | - | - |
| `cost_credits` | `bigint` | No | - | - |
| `cost_source` | `character varying(20)` | No | - | Where credits were charged from: "subscription" (weekly allowance) or "payg_balance" (pay-as-you-go credits). Renamed from "payg" to match workspace_payg_balance table. |
| `status` | `character varying(20)` | No | `'completed'::character var...` | - |
| `processing_time_ms` | `integer` | Yes | - | - |
| `source_platform` | `character varying(50)` | Yes | - | Platform that initiated the usage: "website", "mobile_ios", "mobile_android", "api", "bot", etc. Should be passed in metadata from frontend/client. Defaults to "unknown" if not provided. |
| `source_id` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | Service-specific details in JSONB format. For generations: image URLs, AI model info. For messages: message text, recipient info. |
| `error_code` | `character varying(50)` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `subscription_tier` | `character varying(20)` | No | - | Subscription tier at time of usage (free, starter, pro). Critical for analytics and debugging. Captured at usage time so historical data remains accurate even if tier changes. |
| `refunded_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) workspace_usage_events_pkey**
  ```sql
  CREATE UNIQUE INDEX workspace_usage_events_pkey ON public.workspace_usage_events USING btree (id)
  ```
- **idx_usage_events_cost_source**
  ```sql
  CREATE INDEX idx_usage_events_cost_source ON public.workspace_usage_events USING btree (cost_source, workspace_id)
  ```
- **idx_usage_events_platform_created**
  ```sql
  CREATE INDEX idx_usage_events_platform_created ON public.workspace_usage_events USING btree (source_platform, created_at DESC)
  ```
- **idx_usage_events_refunded**
  ```sql
  CREATE INDEX idx_usage_events_refunded ON public.workspace_usage_events USING btree (refunded_at) WHERE (refunded_at IS NOT NULL)
  ```
- **idx_usage_events_status**
  ```sql
  CREATE INDEX idx_usage_events_status ON public.workspace_usage_events USING btree (status, created_at DESC)
  ```
- **idx_usage_events_workspace_created**
  ```sql
  CREATE INDEX idx_usage_events_workspace_created ON public.workspace_usage_events USING btree (workspace_id, created_at DESC)
  ```
- **idx_usage_service_type**
  ```sql
  CREATE INDEX idx_usage_service_type ON public.workspace_usage_events USING btree (service_type, created_at DESC)
  ```
- **idx_usage_source**
  ```sql
  CREATE INDEX idx_usage_source ON public.workspace_usage_events USING btree (source_platform) WHERE (source_platform IS NOT NULL)
  ```
- **idx_usage_status**
  ```sql
  CREATE INDEX idx_usage_status ON public.workspace_usage_events USING btree (status)
  ```
- **idx_usage_tier_time**
  ```sql
  CREATE INDEX idx_usage_tier_time ON public.workspace_usage_events USING btree (subscription_tier, created_at DESC)
  ```
- **idx_usage_user**
  ```sql
  CREATE INDEX idx_usage_user ON public.workspace_usage_events USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL)
  ```
- **idx_workspace_usage_events_created_at**
  ```sql
  CREATE INDEX idx_workspace_usage_events_created_at ON public.workspace_usage_events USING btree (created_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role manages usage events` | ALL | Yes |
| `workspace_usage_events_select` | SELECT | Yes |

## workspaces

> **Usage:** `frontend` · **Audience:** `external` · **Domain:** `auth`

Workspaces for managing multiple Instagram shop accounts (multi-client support)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `uuid_generate_v4()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `name` | `text` | No | - | - |
| `slug` | `text` | No | - | - |
| `type` | `text` | Yes | `'workspace'::text` | - |
| `owner_id` | `uuid` | No | - | - |
| `settings` | `jsonb` | Yes | `'{"credits_enabled": true,...` | - |
| `description` | `text` | Yes | - | - |
| `avatar_url` | `text` | Yes | - | - |
| `deleted_at` | `timestamp with time zone` | Yes | - | - |
| `social_platforms_config` | `jsonb` | Yes | `'{"platforms": {"whatsapp"...` | Multi-platform social media settings including auto-responses, trigger keywords, and try-on configurations for each connected platform. |
| `parent_workspace_id` | `uuid` | Yes | - | - |
| `is_holding_company` | `boolean` | Yes | `false` | - |
| `brand_voice` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `brand_metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) workspaces_pkey**
  ```sql
  CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id)
  ```
- **(UQ) workspaces_slug_key**
  ```sql
  CREATE UNIQUE INDEX workspaces_slug_key ON public.workspaces USING btree (slug)
  ```
- **idx_workspaces_owner_id**
  ```sql
  CREATE INDEX idx_workspaces_owner_id ON public.workspaces USING btree (owner_id)
  ```
- **idx_workspaces_settings**
  ```sql
  CREATE INDEX idx_workspaces_settings ON public.workspaces USING gin (settings)
  ```
- **idx_workspaces_slug**
  ```sql
  CREATE INDEX idx_workspaces_slug ON public.workspaces USING btree (slug)
  ```
- **idx_workspaces_type**
  ```sql
  CREATE INDEX idx_workspaces_type ON public.workspaces USING btree (type)
  ```
- **idx_workspaces_parent**
  ```sql
  CREATE INDEX idx_workspaces_parent ON public.workspaces USING btree (parent_workspace_id) WHERE (parent_workspace_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Users can create their own workspaces` | INSERT | Yes |
| `Users can view workspaces they're members of` | SELECT | Yes |
| `Workspace owners can delete their workspaces` | DELETE | Yes |
| `Workspace owners can update their workspaces` | UPDATE | Yes |

---

*Generated at 2026-01-20T23:06:10.044647+00:00 by schema_generator.py*