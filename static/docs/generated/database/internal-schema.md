---
title: internal Schema Reference
description: PostgreSQL schema documentation for internal.* tables
category: database
tags: [database, schema, internal, postgresql]
generated_at: 2026-01-20T23:06:40.377131+00:00
generator: schema_generator.py
table_count: 28
frontend_tables: 13
backend_tables: 15
external_tables: 12
internal_tables: 16
domains: [ai, ops, other]
---

# internal Schema Reference

> Auto-generated from live PostgreSQL database. 28 tables, 471 columns.
> Do not edit manually - regenerated on schema changes.

## Classification Legend

**Usage:** `frontend` (dash/admin UI) | `backend` (services only) | `both`

**Audience:** `external` (customer-facing) | `internal` (ops/admin only)

**Domain:** billing, social, ai, commerce, auth, ops, analytics, other

## Overview

This document describes all tables in the `internal` schema.

| Table | Usage | Audience | Domain | Columns | RLS |
|-------|-------|----------|--------|---------|-----|
| [ai_audit_log](#ai_audit_log) | `frontend` | `internal` | `ai` | 16 | Yes |
| [approval_outcomes](#approval_outcomes) | `frontend` | `internal` | `ops` | 16 | Yes |
| [approval_policies](#approval_policies) | `frontend` | `internal` | `ops` | 19 | Yes |
| [approval_requests](#approval_requests) | `frontend` | `internal` | `ops` | 36 | Yes |
| [approval_votes](#approval_votes) | `backend` | `external` | `other` | 6 | Yes |
| [confidence_calibration](#confidence_calibration) | `backend` | `external` | `other` | 16 | Yes |
| [documentation_chunks](#documentation_chunks) | `backend` | `internal` | `ops` | 13 | No |
| [documentation_manifest](#documentation_manifest) | `backend` | `internal` | `ops` | 9 | No |
| [error_occurrences](#error_occurrences) | `backend` | `external` | `other` | 22 | Yes |
| [errors](#errors) | `frontend` | `internal` | `ops` | 24 | Yes |
| [git_events](#git_events) | `frontend` | `internal` | `ops` | 27 | Yes |
| [git_repos](#git_repos) | `backend` | `external` | `other` | 13 | Yes |
| [git_trust_config](#git_trust_config) | `backend` | `external` | `other` | 12 | Yes |
| [health_checks](#health_checks) | `backend` | `internal` | `ops` | 9 | Yes |
| [incidents](#incidents) | `frontend` | `internal` | `ops` | 19 | Yes |
| [monitored_services](#monitored_services) | `frontend` | `internal` | `ops` | 22 | Yes |
| [saved_views](#saved_views) | `backend` | `external` | `other` | 15 | Yes |
| [task_activities](#task_activities) | `frontend` | `internal` | `ops` | 13 | Yes |
| [task_attachments](#task_attachments) | `backend` | `external` | `other` | 14 | Yes |
| [task_comments](#task_comments) | `backend` | `external` | `other` | 14 | Yes |
| [task_links](#task_links) | `backend` | `external` | `other` | 8 | Yes |
| [task_time_entries](#task_time_entries) | `backend` | `external` | `other` | 10 | Yes |
| [tasks](#tasks) | `frontend` | `internal` | `ops` | 53 | Yes |
| [team_audit_log](#team_audit_log) | `backend` | `external` | `other` | 9 | Yes |
| [team_capabilities](#team_capabilities) | `frontend` | `internal` | `ops` | 5 | Yes |
| [team_email_accounts](#team_email_accounts) | `backend` | `external` | `other` | 17 | Yes |
| [team_members](#team_members) | `frontend` | `internal` | `ops` | 26 | Yes |
| [team_roles](#team_roles) | `frontend` | `internal` | `ops` | 8 | Yes |

## ai_audit_log

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ai`

Immutable audit log of all AI actions

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `action` | `text` | No | - | - |
| `agent_type` | `text` | Yes | - | - |
| `persona_id` | `uuid` | Yes | - | - |
| `input_summary` | `text` | Yes | - | - |
| `output_summary` | `text` | Yes | - | - |
| `autonomous` | `boolean` | Yes | `false` | - |
| `approval_required` | `boolean` | Yes | `false` | - |
| `approval_id` | `uuid` | Yes | - | - |
| `success` | `boolean` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `tokens_used` | `integer` | Yes | - | - |
| `cost_micro_units` | `integer` | Yes | - | - |
| `latency_ms` | `integer` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) ai_audit_log_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_audit_log_pkey ON internal.ai_audit_log USING btree (id)
  ```
- **idx_ai_audit_workspace**
  ```sql
  CREATE INDEX idx_ai_audit_workspace ON internal.ai_audit_log USING btree (workspace_id, created_at DESC)
  ```
- **idx_ai_audit_log_persona_id**
  ```sql
  CREATE INDEX idx_ai_audit_log_persona_id ON internal.ai_audit_log USING btree (persona_id)
  ```
- **idx_ai_audit_log_approval_id**
  ```sql
  CREATE INDEX idx_ai_audit_log_approval_id ON internal.ai_audit_log USING btree (approval_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role insert on ai_audit_log` | INSERT | Yes |
| `Service role select on ai_audit_log` | SELECT | Yes |
| `ai_audit_log_access` | ALL | Yes |

## approval_outcomes

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Track approval decisions for ML learning loop

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `approval_request_id` | `uuid` | No | - | - |
| `ai_recommendation` | `text` | Yes | - | - |
| `ai_confidence` | `numeric(3,2)` | Yes | - | - |
| `ai_tier_assigned` | `integer` | Yes | - | - |
| `ai_reasoning` | `text` | Yes | - | - |
| `human_decision` | `text` | Yes | - | - |
| `human_decision_at` | `timestamp with time zone` | Yes | - | - |
| `human_decision_by` | `uuid` | Yes | - | - |
| `was_override` | `boolean` | Yes | `false` | - |
| `override_reason` | `text` | Yes | - | - |
| `outcome_correct` | `boolean` | Yes | - | - |
| `outcome_verified_at` | `timestamp with time zone` | Yes | - | - |
| `outcome_verification_notes` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) approval_outcomes_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_outcomes_pkey ON internal.approval_outcomes USING btree (id)
  ```
- **(UQ) approval_outcomes_approval_request_id_key**
  ```sql
  CREATE UNIQUE INDEX approval_outcomes_approval_request_id_key ON internal.approval_outcomes USING btree (approval_request_id)
  ```
- **idx_approval_outcomes_request**
  ```sql
  CREATE INDEX idx_approval_outcomes_request ON internal.approval_outcomes USING btree (approval_request_id)
  ```
- **idx_approval_outcomes_override**
  ```sql
  CREATE INDEX idx_approval_outcomes_override ON internal.approval_outcomes USING btree (was_override) WHERE (was_override = true)
  ```
- **idx_approval_outcomes_unverified**
  ```sql
  CREATE INDEX idx_approval_outcomes_unverified ON internal.approval_outcomes USING btree (outcome_correct) WHERE (outcome_correct IS NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `approval_outcomes_service_insert` | INSERT | Yes |
| `approval_outcomes_team_select` | SELECT | Yes |
| `approval_outcomes_team_update` | UPDATE | Yes |

## approval_policies

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Configurable rules for approval routing based on context type and risk

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `context_type` | `text` | No | - | - |
| `context_pattern` | `text` | Yes | - | - |
| `base_tier` | `integer` | Yes | `2` | - |
| `confidence_threshold_tier0` | `numeric(3,2)` | Yes | `0.98` | - |
| `confidence_threshold_tier1` | `numeric(3,2)` | Yes | `0.95` | - |
| `confidence_threshold_tier2` | `numeric(3,2)` | Yes | `0.85` | - |
| `auto_approve_low_risk` | `boolean` | Yes | `true` | - |
| `require_tests_pass` | `boolean` | Yes | `true` | - |
| `max_auto_approve_per_hour` | `integer` | Yes | `10` | - |
| `escalation_after_minutes` | `integer` | Yes | `60` | - |
| `notify_on_escalation` | `boolean` | Yes | `true` | - |
| `override_window_minutes` | `integer` | Yes | `60` | - |
| `created_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) approval_policies_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_policies_pkey ON internal.approval_policies USING btree (id)
  ```
- **(UQ) approval_policies_name_key**
  ```sql
  CREATE UNIQUE INDEX approval_policies_name_key ON internal.approval_policies USING btree (name)
  ```
- **idx_approval_policies_context**
  ```sql
  CREATE INDEX idx_approval_policies_context ON internal.approval_policies USING btree (context_type, is_active)
  ```
- **idx_approval_policies_active**
  ```sql
  CREATE INDEX idx_approval_policies_active ON internal.approval_policies USING btree (is_active) WHERE (is_active = true)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `approval_policies_team_select` | SELECT | Yes |

## approval_requests

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

AI-first workflow approval queue with human checkpoints. Temporal workflows pause here awaiting human approval.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `workspace_id` | `uuid` | No | - | - |
| `action` | `text` | No | - | - |
| `context` | `jsonb` | No | - | - |
| `reason` | `text` | No | - | - |
| `status` | `text` | No | `'pending'::text` | - |
| `resolved_by` | `uuid` | Yes | - | - |
| `resolution_notes` | `text` | Yes | - | - |
| `resolved_at` | `timestamp with time zone` | Yes | - | - |
| `expires_at` | `timestamp with time zone` | Yes | `(now() + '24:00:00'::inter...` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `tier` | `integer` | Yes | `3` | - |
| `policy_id` | `uuid` | Yes | - | - |
| `auto_approved_at` | `timestamp with time zone` | Yes | - | - |
| `override_window_ends` | `timestamp with time zone` | Yes | - | - |
| `escalated_at` | `timestamp with time zone` | Yes | - | - |
| `escalation_reason` | `text` | Yes | - | - |
| `batch_id` | `uuid` | Yes | - | - |
| `request_type` | `text` | Yes | `'manual'::text` | - |
| `title` | `text` | Yes | - | - |
| `description` | `text` | Yes | - | - |
| `source_system` | `text` | Yes | `'manual'::text` | - |
| `source_id` | `text` | Yes | - | - |
| `source_url` | `text` | Yes | - | - |
| `ai_recommendation` | `text` | Yes | - | - |
| `ai_confidence` | `numeric(4,3)` | Yes | - | - |
| `ai_reasoning` | `text` | Yes | - | - |
| `ai_metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `risk_level` | `text` | Yes | `'medium'::text` | - |
| `required_approvals` | `integer` | Yes | `1` | - |
| `current_approvals` | `integer` | Yes | `0` | - |
| `temporal_workflow_id` | `text` | Yes | - | - |
| `temporal_run_id` | `text` | Yes | - | - |
| `action_payload` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) approval_requests_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_requests_pkey ON internal.approval_requests USING btree (id)
  ```
- **idx_approval_requests_pending**
  ```sql
  CREATE INDEX idx_approval_requests_pending ON internal.approval_requests USING btree (workspace_id, status) WHERE (status = 'pending'::text)
  ```
- **idx_approval_requests_status**
  ```sql
  CREATE INDEX idx_approval_requests_status ON internal.approval_requests USING btree (status)
  ```
- **idx_approval_requests_created**
  ```sql
  CREATE INDEX idx_approval_requests_created ON internal.approval_requests USING btree (created_at DESC)
  ```
- **idx_approval_requests_batch**
  ```sql
  CREATE INDEX idx_approval_requests_batch ON internal.approval_requests USING btree (batch_id) WHERE (batch_id IS NOT NULL)
  ```
- **idx_approval_requests_tier**
  ```sql
  CREATE INDEX idx_approval_requests_tier ON internal.approval_requests USING btree (tier, status)
  ```
- **idx_approval_requests_override_window**
  ```sql
  CREATE INDEX idx_approval_requests_override_window ON internal.approval_requests USING btree (override_window_ends) WHERE ((override_window_ends IS NOT NULL) AND (status = 'auto_approved'::text))
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access on approval_requests` | ALL | Yes |
| `approval_requests_access` | ALL | Yes |
| `approval_requests_service_insert` | INSERT | Yes |
| `approval_requests_team_select` | SELECT | Yes |
| `approval_requests_team_update` | UPDATE | Yes |

## approval_votes

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Individual votes on approval requests from team members.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `request_id` | `uuid` | No | - | - |
| `voter_id` | `uuid` | No | - | - |
| `vote` | `text` | No | - | - |
| `comment` | `text` | Yes | - | - |

### Indexes

- **(PK) approval_votes_pkey**
  ```sql
  CREATE UNIQUE INDEX approval_votes_pkey ON internal.approval_votes USING btree (id)
  ```
- **(UQ) approval_votes_request_id_voter_id_key**
  ```sql
  CREATE UNIQUE INDEX approval_votes_request_id_voter_id_key ON internal.approval_votes USING btree (request_id, voter_id)
  ```
- **idx_approval_votes_request**
  ```sql
  CREATE INDEX idx_approval_votes_request ON internal.approval_votes USING btree (request_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `approval_votes_team_all` | ALL | Yes |

## confidence_calibration

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Track AI confidence accuracy over time for threshold tuning

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `computed_at` | `timestamp with time zone` | No | `now()` | - |
| `context_type` | `text` | No | - | - |
| `context_pattern` | `text` | Yes | - | - |
| `period_start` | `timestamp with time zone` | No | - | - |
| `period_end` | `timestamp with time zone` | No | - | - |
| `total_decisions` | `integer` | Yes | `0` | - |
| `correct_decisions` | `integer` | Yes | `0` | - |
| `false_positives` | `integer` | Yes | `0` | - |
| `false_negatives` | `integer` | Yes | `0` | - |
| `human_overrides` | `integer` | Yes | `0` | - |
| `calibration_score` | `numeric(5,4)` | Yes | - | - |
| `accuracy_rate` | `numeric(5,4)` | Yes | - | - |
| `override_rate` | `numeric(5,4)` | Yes | - | - |
| `avg_confidence` | `numeric(3,2)` | Yes | - | - |
| `confidence_distribution` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) confidence_calibration_pkey**
  ```sql
  CREATE UNIQUE INDEX confidence_calibration_pkey ON internal.confidence_calibration USING btree (id)
  ```
- **(UQ) confidence_calibration_context_type_context_pattern_period__key**
  ```sql
  CREATE UNIQUE INDEX confidence_calibration_context_type_context_pattern_period__key ON internal.confidence_calibration USING btree (context_type, context_pattern, period_start, period_end)
  ```
- **idx_confidence_calibration_context**
  ```sql
  CREATE INDEX idx_confidence_calibration_context ON internal.confidence_calibration USING btree (context_type, computed_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `confidence_calibration_service_all` | ALL | Yes |
| `confidence_calibration_team_select` | SELECT | Yes |

## documentation_chunks

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `ops`

Embedded documentation sections for semantic search. Auto-populated by DocumentationWorkflow.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `file_path` | `text` | No | - | - |
| `section_path` | `text` | Yes | - | - |
| `chunk_index` | `integer` | No | - | - |
| `title` | `text` | No | - | - |
| `content` | `text` | No | - | - |
| `content_hash` | `text` | No | - | SHA256 hash (first 16 chars) for detecting content changes |
| `doc_type` | `text` | No | - | - |
| `category` | `text` | Yes | - | - |
| `tags` | `text[]` | Yes | `'{}'::text[]` | - |
| `embedding` | `vector(1536)` | Yes | - | Vector embedding from Modal BGE model (bge-small-en-v1.5, padded to 1536 dims) |
| `source_updated_at` | `timestamp with time zone` | Yes | - | - |
| `indexed_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) documentation_chunks_pkey**
  ```sql
  CREATE UNIQUE INDEX documentation_chunks_pkey ON internal.documentation_chunks USING btree (id)
  ```
- **(UQ) documentation_chunks_file_path_chunk_index_key**
  ```sql
  CREATE UNIQUE INDEX documentation_chunks_file_path_chunk_index_key ON internal.documentation_chunks USING btree (file_path, chunk_index)
  ```
- **idx_doc_chunks_embedding**
  ```sql
  CREATE INDEX idx_doc_chunks_embedding ON internal.documentation_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists='50')
  ```
- **idx_doc_chunks_category**
  ```sql
  CREATE INDEX idx_doc_chunks_category ON internal.documentation_chunks USING btree (category) WHERE (category IS NOT NULL)
  ```
- **idx_doc_chunks_tags**
  ```sql
  CREATE INDEX idx_doc_chunks_tags ON internal.documentation_chunks USING gin (tags)
  ```
- **idx_doc_chunks_file_path**
  ```sql
  CREATE INDEX idx_doc_chunks_file_path ON internal.documentation_chunks USING btree (file_path)
  ```
- **idx_doc_chunks_doc_type**
  ```sql
  CREATE INDEX idx_doc_chunks_doc_type ON internal.documentation_chunks USING btree (doc_type)
  ```

## documentation_manifest

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `ops`

Tracks document hashes for change detection. Used by generators to skip unchanged content.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `file_path` | `text` | No | - | - |
| `content_hash` | `text` | No | - | - |
| `doc_type` | `text` | No | - | - |
| `category` | `text` | Yes | - | - |
| `generator` | `text` | Yes | - | - |
| `chunk_count` | `integer` | Yes | `0` | - |
| `file_size_bytes` | `integer` | Yes | - | - |
| `generated_at` | `timestamp with time zone` | Yes | - | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) documentation_manifest_pkey**
  ```sql
  CREATE UNIQUE INDEX documentation_manifest_pkey ON internal.documentation_manifest USING btree (file_path)
  ```

## error_occurrences

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `error_id` | `uuid` | No | - | - |
| `event_id` | `text` | No | - | - |
| `message` | `text` | Yes | - | - |
| `stacktrace` | `jsonb` | Yes | - | - |
| `frames` | `jsonb` | Yes | - | - |
| `user_id` | `text` | Yes | - | - |
| `user_email` | `text` | Yes | - | - |
| `user_ip` | `text` | Yes | - | - |
| `request_url` | `text` | Yes | - | - |
| `request_method` | `text` | Yes | - | - |
| `request_headers` | `jsonb` | Yes | - | - |
| `request_data` | `jsonb` | Yes | - | - |
| `browser` | `text` | Yes | - | - |
| `browser_version` | `text` | Yes | - | - |
| `os` | `text` | Yes | - | - |
| `device` | `text` | Yes | - | - |
| `breadcrumbs` | `jsonb` | Yes | - | - |
| `contexts` | `jsonb` | Yes | - | - |
| `extra` | `jsonb` | Yes | - | - |
| `raw_event` | `jsonb` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) error_occurrences_pkey**
  ```sql
  CREATE UNIQUE INDEX error_occurrences_pkey ON internal.error_occurrences USING btree (id)
  ```
- **(UQ) error_occurrences_event_id_key**
  ```sql
  CREATE UNIQUE INDEX error_occurrences_event_id_key ON internal.error_occurrences USING btree (event_id)
  ```
- **idx_occurrences_error_id**
  ```sql
  CREATE INDEX idx_occurrences_error_id ON internal.error_occurrences USING btree (error_id)
  ```
- **idx_occurrences_created_at**
  ```sql
  CREATE INDEX idx_occurrences_created_at ON internal.error_occurrences USING btree (created_at DESC)
  ```
- **idx_occurrences_user_id**
  ```sql
  CREATE INDEX idx_occurrences_user_id ON internal.error_occurrences USING btree (user_id) WHERE (user_id IS NOT NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `error_occurrences_service_access` | ALL | Yes |
| `error_occurrences_team_access` | ALL | Yes |

## errors

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `fingerprint` | `text` | No | - | - |
| `title` | `text` | No | - | - |
| `culprit` | `text` | Yes | - | - |
| `error_type` | `text` | No | - | - |
| `service` | `text` | No | - | - |
| `environment` | `text` | No | `'production'::text` | - |
| `platform` | `text` | Yes | - | - |
| `release` | `text` | Yes | - | - |
| `status` | `text` | No | `'unresolved'::text` | - |
| `resolved_at` | `timestamp with time zone` | Yes | - | - |
| `resolved_by` | `uuid` | Yes | - | - |
| `task_id` | `uuid` | Yes | - | - |
| `auto_resolved` | `boolean` | Yes | `false` | - |
| `ai_analysis` | `jsonb` | Yes | - | - |
| `suggested_fix` | `text` | Yes | - | - |
| `occurrence_count` | `integer` | No | `1` | - |
| `user_count` | `integer` | No | `0` | - |
| `first_seen` | `timestamp with time zone` | No | `now()` | - |
| `last_seen` | `timestamp with time zone` | No | `now()` | - |
| `tags` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **idx_errors_service**
  ```sql
  CREATE INDEX idx_errors_service ON internal.errors USING btree (service)
  ```
- **(PK) errors_pkey**
  ```sql
  CREATE UNIQUE INDEX errors_pkey ON internal.errors USING btree (id)
  ```
- **(UQ) errors_fingerprint_key**
  ```sql
  CREATE UNIQUE INDEX errors_fingerprint_key ON internal.errors USING btree (fingerprint)
  ```
- **idx_errors_status**
  ```sql
  CREATE INDEX idx_errors_status ON internal.errors USING btree (status)
  ```
- **idx_errors_last_seen**
  ```sql
  CREATE INDEX idx_errors_last_seen ON internal.errors USING btree (last_seen DESC)
  ```
- **idx_errors_environment**
  ```sql
  CREATE INDEX idx_errors_environment ON internal.errors USING btree (environment)
  ```
- **idx_errors_task_id**
  ```sql
  CREATE INDEX idx_errors_task_id ON internal.errors USING btree (task_id) WHERE (task_id IS NOT NULL)
  ```
- **idx_errors_fingerprint**
  ```sql
  CREATE INDEX idx_errors_fingerprint ON internal.errors USING btree (fingerprint)
  ```
- **idx_errors_resolved_by**
  ```sql
  CREATE INDEX idx_errors_resolved_by ON internal.errors USING btree (resolved_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `errors_service_access` | ALL | Yes |
| `errors_team_access` | ALL | Yes |

## git_events

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Audit log of all git events with AI analysis results

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `repo_id` | `uuid` | Yes | - | - |
| `repo_name` | `text` | No | - | - |
| `event_type` | `text` | No | - | - |
| `ref` | `text` | Yes | - | - |
| `branch` | `text` | Yes | - | - |
| `old_rev` | `text` | Yes | - | - |
| `new_rev` | `text` | Yes | - | - |
| `commit_count` | `integer` | Yes | - | - |
| `commit_message` | `text` | Yes | - | - |
| `author_name` | `text` | Yes | - | - |
| `author_email` | `text` | Yes | - | - |
| `files_changed` | `integer` | Yes | - | - |
| `lines_added` | `integer` | Yes | - | - |
| `lines_removed` | `integer` | Yes | - | - |
| `ai_analysis` | `jsonb` | Yes | - | - |
| `ai_risk_level` | `text` | Yes | - | - |
| `ai_confidence` | `numeric(3,2)` | Yes | - | - |
| `ai_recommendation` | `text` | Yes | - | - |
| `trust_level_applied` | `trust_level` | Yes | - | - |
| `auto_approved` | `boolean` | Yes | `false` | - |
| `temporal_workflow_id` | `text` | Yes | - | - |
| `approval_request_id` | `uuid` | Yes | - | - |
| `outcome` | `text` | Yes | - | - |
| `outcome_at` | `timestamp with time zone` | Yes | - | - |
| `outcome_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) git_events_pkey**
  ```sql
  CREATE UNIQUE INDEX git_events_pkey ON internal.git_events USING btree (id)
  ```
- **idx_git_events_repo**
  ```sql
  CREATE INDEX idx_git_events_repo ON internal.git_events USING btree (repo_name, created_at DESC)
  ```
- **idx_git_events_type**
  ```sql
  CREATE INDEX idx_git_events_type ON internal.git_events USING btree (event_type)
  ```
- **idx_git_events_workflow**
  ```sql
  CREATE INDEX idx_git_events_workflow ON internal.git_events USING btree (temporal_workflow_id)
  ```
- **idx_git_events_pending**
  ```sql
  CREATE INDEX idx_git_events_pending ON internal.git_events USING btree (outcome) WHERE (outcome = 'pending'::text)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `git_events_service_all` | ALL | Yes |
| `git_events_team_select` | SELECT | Yes |

## git_repos

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Registry of git repositories managed by git-api service

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `default_branch` | `text` | Yes | `'main'::text` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_by` | `uuid` | Yes | - | - |
| `ssh_url` | `text` | Yes | `(('git@git.selify.ai:'::te...` | - |
| `last_push_at` | `timestamp with time zone` | Yes | - | - |
| `total_commits` | `integer` | Yes | `0` | - |
| `total_branches` | `integer` | Yes | `0` | - |
| `has_claude_md` | `boolean` | Yes | `false` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |

### Indexes

- **(PK) git_repos_pkey**
  ```sql
  CREATE UNIQUE INDEX git_repos_pkey ON internal.git_repos USING btree (id)
  ```
- **(UQ) git_repos_name_key**
  ```sql
  CREATE UNIQUE INDEX git_repos_name_key ON internal.git_repos USING btree (name)
  ```
- **idx_git_repos_name**
  ```sql
  CREATE INDEX idx_git_repos_name ON internal.git_repos USING btree (name)
  ```
- **idx_git_repos_updated**
  ```sql
  CREATE INDEX idx_git_repos_updated ON internal.git_repos USING btree (updated_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `git_repos_service_all` | ALL | Yes |
| `git_repos_team_select` | SELECT | Yes |

## git_trust_config

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Trust level configuration per repo/branch for AI autonomy

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `repo_id` | `uuid` | Yes | - | - |
| `branch_pattern` | `text` | Yes | `'*'::text` | - |
| `trust_level` | `trust_level` | No | `'ai_recommend'::trust_level` | - |
| `require_tests_pass` | `boolean` | Yes | `true` | - |
| `require_claude_md` | `boolean` | Yes | `true` | - |
| `max_files_changed` | `integer` | Yes | `50` | - |
| `max_lines_changed` | `integer` | Yes | `500` | - |
| `blocked_paths` | `text[]` | Yes | `'{}'::text[]` | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `created_by` | `uuid` | Yes | - | - |

### Indexes

- **(PK) git_trust_config_pkey**
  ```sql
  CREATE UNIQUE INDEX git_trust_config_pkey ON internal.git_trust_config USING btree (id)
  ```
- **(UQ) git_trust_config_repo_id_branch_pattern_key**
  ```sql
  CREATE UNIQUE INDEX git_trust_config_repo_id_branch_pattern_key ON internal.git_trust_config USING btree (repo_id, branch_pattern)
  ```
- **idx_git_trust_repo**
  ```sql
  CREATE INDEX idx_git_trust_repo ON internal.git_trust_config USING btree (repo_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `git_trust_service_all` | ALL | Yes |
| `git_trust_team_all` | ALL | Yes |
| `git_trust_team_select` | SELECT | Yes |

## health_checks

> **Usage:** `backend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `service_id` | `uuid` | No | - | - |
| `status` | `text` | No | - | - |
| `status_code` | `integer` | Yes | - | - |
| `response_time_ms` | `integer` | Yes | - | - |
| `error_message` | `text` | Yes | - | - |
| `error_details` | `jsonb` | Yes | - | - |
| `metrics` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `checked_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) health_checks_pkey**
  ```sql
  CREATE UNIQUE INDEX health_checks_pkey ON internal.health_checks USING btree (id)
  ```
- **idx_health_checks_service_id**
  ```sql
  CREATE INDEX idx_health_checks_service_id ON internal.health_checks USING btree (service_id)
  ```
- **idx_health_checks_checked_at**
  ```sql
  CREATE INDEX idx_health_checks_checked_at ON internal.health_checks USING btree (checked_at DESC)
  ```
- **idx_health_checks_status**
  ```sql
  CREATE INDEX idx_health_checks_status ON internal.health_checks USING btree (status)
  ```
- **idx_health_checks_service_time**
  ```sql
  CREATE INDEX idx_health_checks_service_time ON internal.health_checks USING btree (service_id, checked_at DESC)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `health_checks_service_access` | ALL | Yes |
| `health_checks_team_access` | ALL | Yes |

## incidents

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `service_id` | `uuid` | No | - | - |
| `title` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `severity` | `text` | No | `'medium'::text` | - |
| `status` | `text` | No | `'investigating'::text` | - |
| `started_at` | `timestamp with time zone` | No | `now()` | - |
| `identified_at` | `timestamp with time zone` | Yes | - | - |
| `resolved_at` | `timestamp with time zone` | Yes | - | - |
| `resolved_by` | `uuid` | Yes | - | - |
| `resolution_notes` | `text` | Yes | - | - |
| `root_cause` | `text` | Yes | - | - |
| `task_id` | `uuid` | Yes | - | - |
| `ai_analysis` | `jsonb` | Yes | - | - |
| `auto_resolved` | `boolean` | Yes | `false` | - |
| `total_downtime_seconds` | `integer` | Yes | - | - |
| `checks_failed` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) incidents_pkey**
  ```sql
  CREATE UNIQUE INDEX incidents_pkey ON internal.incidents USING btree (id)
  ```
- **idx_incidents_service_id**
  ```sql
  CREATE INDEX idx_incidents_service_id ON internal.incidents USING btree (service_id)
  ```
- **idx_incidents_status**
  ```sql
  CREATE INDEX idx_incidents_status ON internal.incidents USING btree (status)
  ```
- **idx_incidents_started_at**
  ```sql
  CREATE INDEX idx_incidents_started_at ON internal.incidents USING btree (started_at DESC)
  ```
- **idx_incidents_task_id**
  ```sql
  CREATE INDEX idx_incidents_task_id ON internal.incidents USING btree (task_id)
  ```
- **idx_incidents_resolved_by**
  ```sql
  CREATE INDEX idx_incidents_resolved_by ON internal.incidents USING btree (resolved_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `incidents_service_access` | ALL | Yes |
| `incidents_team_access` | ALL | Yes |

## monitored_services

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `name` | `text` | No | - | - |
| `display_name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `check_type` | `text` | No | `'http'::text` | - |
| `check_url` | `text` | Yes | - | - |
| `check_host` | `text` | Yes | - | - |
| `check_port` | `integer` | Yes | - | - |
| `check_query` | `text` | Yes | - | - |
| `check_interval_seconds` | `integer` | No | `60` | - |
| `timeout_seconds` | `integer` | No | `10` | - |
| `expected_status_codes` | `integer[]` | Yes | `'{200,201,204}'::integer[]` | - |
| `expected_body_contains` | `text` | Yes | - | - |
| `alert_after_failures` | `integer` | No | `3` | - |
| `alert_channels` | `text[]` | Yes | `'{}'::text[]` | - |
| `category` | `text` | Yes | `'internal'::text` | - |
| `priority` | `integer` | Yes | `1` | - |
| `tags` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `is_active` | `boolean` | No | `true` | - |
| `is_critical` | `boolean` | No | `false` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) monitored_services_pkey**
  ```sql
  CREATE UNIQUE INDEX monitored_services_pkey ON internal.monitored_services USING btree (id)
  ```
- **(UQ) monitored_services_name_key**
  ```sql
  CREATE UNIQUE INDEX monitored_services_name_key ON internal.monitored_services USING btree (name)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `monitored_services_service_access` | ALL | Yes |
| `monitored_services_team_access` | ALL | Yes |

## saved_views

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `owner_id` | `uuid` | Yes | - | - |
| `name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `icon` | `text` | Yes | - | - |
| `color` | `text` | Yes | - | - |
| `filters` | `jsonb` | No | `'{}'::jsonb` | - |
| `columns` | `text[]` | Yes | `'{title,status,priority,as...` | - |
| `sort_by` | `text` | Yes | `'created_at'::text` | - |
| `sort_order` | `text` | Yes | `'desc'::text` | - |
| `is_public` | `boolean` | Yes | `false` | - |
| `is_default` | `boolean` | Yes | `false` | - |
| `position` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pm_saved_filters_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_saved_filters_pkey ON internal.saved_views USING btree (id)
  ```
- **idx_saved_views_owner_id**
  ```sql
  CREATE INDEX idx_saved_views_owner_id ON internal.saved_views USING btree (owner_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `saved_views_access` | ALL | Yes |

## task_activities

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `issue_id` | `uuid` | No | - | - |
| `actor_id` | `uuid` | Yes | - | - |
| `actor_type` | `text` | No | `'human'::text` | - |
| `actor_name` | `text` | Yes | - | - |
| `activity_type` | `pm_activity_type` | No | - | - |
| `field_name` | `text` | Yes | - | - |
| `old_value` | `text` | Yes | - | - |
| `new_value` | `text` | Yes | - | - |
| `content` | `text` | Yes | - | - |
| `content_html` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pm_issue_activities_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issue_activities_pkey ON internal.task_activities USING btree (id)
  ```
- **idx_pm_activities_issue**
  ```sql
  CREATE INDEX idx_pm_activities_issue ON internal.task_activities USING btree (issue_id, created_at DESC)
  ```
- **idx_pm_activities_actor**
  ```sql
  CREATE INDEX idx_pm_activities_actor ON internal.task_activities USING btree (actor_id) WHERE (actor_id IS NOT NULL)
  ```
- **idx_pm_activities_type**
  ```sql
  CREATE INDEX idx_pm_activities_type ON internal.task_activities USING btree (activity_type)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `task_activities_team_access` | ALL | Yes |

## task_attachments

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `issue_id` | `uuid` | No | - | - |
| `comment_id` | `uuid` | Yes | - | - |
| `uploaded_by` | `uuid` | Yes | - | - |
| `filename` | `text` | No | - | - |
| `file_type` | `text` | Yes | - | - |
| `file_size` | `integer` | Yes | - | - |
| `storage_path` | `text` | No | - | - |
| `url` | `text` | Yes | - | - |
| `width` | `integer` | Yes | - | - |
| `height` | `integer` | Yes | - | - |
| `thumbnail_url` | `text` | Yes | - | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pm_issue_attachments_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issue_attachments_pkey ON internal.task_attachments USING btree (id)
  ```
- **idx_pm_attachments_issue**
  ```sql
  CREATE INDEX idx_pm_attachments_issue ON internal.task_attachments USING btree (issue_id)
  ```
- **idx_task_attachments_comment_id**
  ```sql
  CREATE INDEX idx_task_attachments_comment_id ON internal.task_attachments USING btree (comment_id)
  ```
- **idx_task_attachments_uploaded_by**
  ```sql
  CREATE INDEX idx_task_attachments_uploaded_by ON internal.task_attachments USING btree (uploaded_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `task_attachments_team_access` | ALL | Yes |

## task_comments

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `issue_id` | `uuid` | No | - | - |
| `author_id` | `uuid` | Yes | - | - |
| `author_type` | `text` | No | `'human'::text` | - |
| `author_name` | `text` | Yes | - | - |
| `content` | `text` | No | - | - |
| `content_html` | `text` | Yes | - | - |
| `parent_id` | `uuid` | Yes | - | - |
| `reactions` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `edited_at` | `timestamp with time zone` | Yes | - | - |
| `edit_count` | `integer` | Yes | `0` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `deleted_at` | `timestamp with time zone` | Yes | - | - |

### Indexes

- **(PK) pm_issue_comments_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issue_comments_pkey ON internal.task_comments USING btree (id)
  ```
- **idx_pm_comments_issue**
  ```sql
  CREATE INDEX idx_pm_comments_issue ON internal.task_comments USING btree (issue_id, created_at DESC) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_comments_author**
  ```sql
  CREATE INDEX idx_pm_comments_author ON internal.task_comments USING btree (author_id) WHERE (deleted_at IS NULL)
  ```
- **idx_task_comments_parent_id**
  ```sql
  CREATE INDEX idx_task_comments_parent_id ON internal.task_comments USING btree (parent_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `task_comments_team_access` | ALL | Yes |

## task_links

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `source_issue_id` | `uuid` | No | - | - |
| `target_issue_id` | `uuid` | Yes | - | - |
| `target_url` | `text` | Yes | - | - |
| `target_title` | `text` | Yes | - | - |
| `link_type` | `text` | No | - | - |
| `created_by` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pm_issue_links_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issue_links_pkey ON internal.task_links USING btree (id)
  ```
- **idx_pm_links_source**
  ```sql
  CREATE INDEX idx_pm_links_source ON internal.task_links USING btree (source_issue_id)
  ```
- **idx_pm_links_target**
  ```sql
  CREATE INDEX idx_pm_links_target ON internal.task_links USING btree (target_issue_id) WHERE (target_issue_id IS NOT NULL)
  ```
- **idx_task_links_created_by**
  ```sql
  CREATE INDEX idx_task_links_created_by ON internal.task_links USING btree (created_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `task_links_team_access` | ALL | Yes |

## task_time_entries

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `issue_id` | `uuid` | No | - | - |
| `user_id` | `uuid` | Yes | - | - |
| `user_type` | `text` | Yes | `'human'::text` | - |
| `hours` | `numeric(6,2)` | No | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `ended_at` | `timestamp with time zone` | Yes | - | - |
| `description` | `text` | Yes | - | - |
| `billable` | `boolean` | Yes | `false` | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |

### Indexes

- **(PK) pm_issue_time_entries_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issue_time_entries_pkey ON internal.task_time_entries USING btree (id)
  ```
- **idx_task_time_entries_issue_id**
  ```sql
  CREATE INDEX idx_task_time_entries_issue_id ON internal.task_time_entries USING btree (issue_id)
  ```
- **idx_task_time_entries_user_id**
  ```sql
  CREATE INDEX idx_task_time_entries_user_id ON internal.task_time_entries USING btree (user_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `task_time_entries_team_access` | ALL | Yes |

## tasks

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `issue_number` | `integer` | No | `nextval('internal.pm_issue...` | - |
| `title` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `issue_type` | `pm_issue_type` | No | `'task'::pm_issue_type` | - |
| `status` | `pm_issue_status` | No | `'backlog'::pm_issue_status` | - |
| `priority` | `pm_issue_priority` | No | `'medium'::pm_issue_priority` | - |
| `labels` | `text[]` | Yes | `'{}'::text[]` | - |
| `assignee_id` | `uuid` | Yes | - | - |
| `assignee_type` | `text` | Yes | `'human'::text` | - |
| `ai_agent_id` | `text` | Yes | - | - |
| `reporter_id` | `uuid` | Yes | - | - |
| `source` | `pm_issue_source` | No | `'manual'::pm_issue_source` | - |
| `source_id` | `text` | Yes | - | - |
| `source_url` | `text` | Yes | - | - |
| `parent_id` | `uuid` | Yes | - | - |
| `due_date` | `timestamp with time zone` | Yes | - | - |
| `started_at` | `timestamp with time zone` | Yes | - | - |
| `completed_at` | `timestamp with time zone` | Yes | - | - |
| `sla_deadline` | `timestamp with time zone` | Yes | - | - |
| `sla_breached` | `boolean` | Yes | `false` | - |
| `story_points` | `integer` | Yes | - | - |
| `estimated_hours` | `numeric(6,2)` | Yes | - | - |
| `actual_hours` | `numeric(6,2)` | Yes | - | - |
| `branch_name` | `text` | Yes | - | - |
| `pr_url` | `text` | Yes | - | - |
| `pr_number` | `integer` | Yes | - | - |
| `pr_status` | `text` | Yes | - | - |
| `commit_sha` | `text` | Yes | - | - |
| `ai_analysis` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `ai_confidence` | `numeric(3,2)` | Yes | - | - |
| `ai_summary` | `text` | Yes | - | - |
| `ai_suggested_fix` | `text` | Yes | - | - |
| `ai_estimated_complexity` | `text` | Yes | - | - |
| `ai_automatable` | `boolean` | Yes | - | - |
| `ai_requires_human` | `boolean` | Yes | `false` | - |
| `ai_attempts` | `integer` | Yes | `0` | - |
| `ai_last_error` | `text` | Yes | - | - |
| `custom_fields` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | - |
| `watchers` | `uuid[]` | Yes | `'{}'::uuid[]` | - |
| `environment` | `text` | Yes | - | - |
| `affected_services` | `text[]` | Yes | - | - |
| `affected_repos` | `text[]` | Yes | - | - |
| `resolution` | `text` | Yes | - | - |
| `resolution_type` | `text` | Yes | - | - |
| `duplicate_of` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | No | `now()` | - |
| `updated_at` | `timestamp with time zone` | No | `now()` | - |
| `deleted_at` | `timestamp with time zone` | Yes | - | - |
| `deleted_by` | `uuid` | Yes | - | - |
| `git_event_id` | `uuid` | Yes | - | - |
| `backlog_position` | `integer` | Yes | - | Position in backlog priority queue. Lower = higher priority. NULL for non-backlog tasks. |

### Indexes

- **(PK) pm_issues_pkey**
  ```sql
  CREATE UNIQUE INDEX pm_issues_pkey ON internal.tasks USING btree (id)
  ```
- **(UQ) pm_issues_issue_number_key**
  ```sql
  CREATE UNIQUE INDEX pm_issues_issue_number_key ON internal.tasks USING btree (issue_number)
  ```
- **idx_pm_issues_status**
  ```sql
  CREATE INDEX idx_pm_issues_status ON internal.tasks USING btree (status) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_priority**
  ```sql
  CREATE INDEX idx_pm_issues_priority ON internal.tasks USING btree (priority) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_type**
  ```sql
  CREATE INDEX idx_pm_issues_type ON internal.tasks USING btree (issue_type) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_assignee**
  ```sql
  CREATE INDEX idx_pm_issues_assignee ON internal.tasks USING btree (assignee_id) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_reporter**
  ```sql
  CREATE INDEX idx_pm_issues_reporter ON internal.tasks USING btree (reporter_id) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_parent**
  ```sql
  CREATE INDEX idx_pm_issues_parent ON internal.tasks USING btree (parent_id) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_source**
  ```sql
  CREATE INDEX idx_pm_issues_source ON internal.tasks USING btree (source, source_id)
  ```
- **idx_pm_issues_created**
  ```sql
  CREATE INDEX idx_pm_issues_created ON internal.tasks USING btree (created_at DESC) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_due**
  ```sql
  CREATE INDEX idx_pm_issues_due ON internal.tasks USING btree (due_date) WHERE ((deleted_at IS NULL) AND (due_date IS NOT NULL))
  ```
- **idx_pm_issues_labels**
  ```sql
  CREATE INDEX idx_pm_issues_labels ON internal.tasks USING gin (labels) WHERE (deleted_at IS NULL)
  ```
- **idx_pm_issues_ai_queue**
  ```sql
  CREATE INDEX idx_pm_issues_ai_queue ON internal.tasks USING btree (status, ai_automatable) WHERE ((status = 'ai_queue'::pm_issue_status) AND (deleted_at IS NULL))
  ```
- **idx_pm_issues_search**
  ```sql
  CREATE INDEX idx_pm_issues_search ON internal.tasks USING gin (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(description, ''::text)))) WHERE (deleted_at IS NULL)
  ```
- **idx_tasks_duplicate_of**
  ```sql
  CREATE INDEX idx_tasks_duplicate_of ON internal.tasks USING btree (duplicate_of)
  ```
- **idx_tasks_deleted_by**
  ```sql
  CREATE INDEX idx_tasks_deleted_by ON internal.tasks USING btree (deleted_by)
  ```
- **idx_tasks_git_event_id**
  ```sql
  CREATE INDEX idx_tasks_git_event_id ON internal.tasks USING btree (git_event_id) WHERE (git_event_id IS NOT NULL)
  ```
- **idx_tasks_backlog_position**
  ```sql
  CREATE INDEX idx_tasks_backlog_position ON internal.tasks USING btree (backlog_position) WHERE ((status = 'backlog'::pm_issue_status) AND (deleted_at IS NULL))
  ```
- **idx_tasks_parent_id**
  ```sql
  CREATE INDEX idx_tasks_parent_id ON internal.tasks USING btree (parent_id) WHERE (deleted_at IS NULL)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `tasks_team_access` | ALL | Yes |

## team_audit_log

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Audit trail for all admin actions

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `actor_id` | `uuid` | Yes | - | - |
| `action` | `text` | No | - | Action type: member.created, member.role_changed, workspace.impersonated, etc. |
| `target_id` | `uuid` | Yes | - | - |
| `target_type` | `text` | Yes | - | What was affected: team_member, workspace, billing, etc. |
| `details` | `jsonb` | Yes | - | - |
| `ip_address` | `inet` | Yes | - | - |
| `user_agent` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) team_audit_log_pkey**
  ```sql
  CREATE UNIQUE INDEX team_audit_log_pkey ON internal.team_audit_log USING btree (id)
  ```
- **idx_team_audit_log_actor**
  ```sql
  CREATE INDEX idx_team_audit_log_actor ON internal.team_audit_log USING btree (actor_id)
  ```
- **idx_team_audit_log_action**
  ```sql
  CREATE INDEX idx_team_audit_log_action ON internal.team_audit_log USING btree (action)
  ```
- **idx_team_audit_log_created**
  ```sql
  CREATE INDEX idx_team_audit_log_created ON internal.team_audit_log USING btree (created_at DESC)
  ```
- **idx_team_audit_log_target**
  ```sql
  CREATE INDEX idx_team_audit_log_target ON internal.team_audit_log USING btree (target_type, target_id)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `team_audit_log_access` | ALL | Yes |

## team_capabilities

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Available permissions for internal team members

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `name` | `text` | No | - | Capability identifier (e.g., admin.workspaces.view) |
| `category` | `text` | No | - | Grouping: admin, team, ops, infra |
| `description` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) team_capabilities_pkey**
  ```sql
  CREATE UNIQUE INDEX team_capabilities_pkey ON internal.team_capabilities USING btree (id)
  ```
- **(UQ) team_capabilities_name_key**
  ```sql
  CREATE UNIQUE INDEX team_capabilities_name_key ON internal.team_capabilities USING btree (name)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `service_role_access` | ALL | Yes |
| `team_capabilities_access` | ALL | Yes |

## team_email_accounts

> **Usage:** `backend` · **Audience:** `external` · **Domain:** `other`

Team member email accounts for webmail. Provisioned during onboarding.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `user_id` | `uuid` | No | - | - |
| `email` | `text` | No | - | - |
| `display_name` | `text` | Yes | - | - |
| `color` | `text` | Yes | `'#8b5cf6'::text` | - |
| `imap_host` | `text` | No | `'shadow.mxrouting.net'::text` | - |
| `imap_port` | `integer` | No | `993` | - |
| `imap_secure` | `boolean` | Yes | `true` | - |
| `smtp_host` | `text` | No | `'shadow.mxrouting.net'::text` | - |
| `smtp_port` | `integer` | No | `465` | - |
| `smtp_secure` | `boolean` | Yes | `true` | - |
| `password_encrypted` | `text` | No | - | - |
| `is_active` | `boolean` | Yes | `true` | - |
| `last_sync_at` | `timestamp with time zone` | Yes | - | - |
| `sync_error` | `text` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) team_email_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX team_email_accounts_pkey ON internal.team_email_accounts USING btree (id)
  ```
- **(UQ) team_email_accounts_user_id_email_key**
  ```sql
  CREATE UNIQUE INDEX team_email_accounts_user_id_email_key ON internal.team_email_accounts USING btree (user_id, email)
  ```
- **idx_team_email_accounts_user_id**
  ```sql
  CREATE INDEX idx_team_email_accounts_user_id ON internal.team_email_accounts USING btree (user_id)
  ```
- **idx_team_email_accounts_email**
  ```sql
  CREATE INDEX idx_team_email_accounts_email ON internal.team_email_accounts USING btree (email)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `Service role full access` | ALL | Yes |
| `Team members can delete own email accounts` | DELETE | Yes |
| `Team members can insert own email accounts` | INSERT | Yes |
| `Team members can update own email accounts` | UPDATE | Yes |
| `Team members can view own email accounts` | SELECT | Yes |

## team_members

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Internal Selify team members

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `user_id` | `uuid` | Yes | - | - |
| `email` | `text` | No | - | @selify.ai email address |
| `personal_email` | `text` | Yes | - | Personal email for onboarding credentials |
| `full_name` | `text` | No | - | - |
| `role_id` | `uuid` | Yes | - | - |
| `custom_capabilities` | `text[]` | Yes | `'{}'::text[]` | Additional capabilities beyond role |
| `github_username` | `text` | Yes | - | - |
| `github_invited_at` | `timestamp with time zone` | Yes | - | - |
| `plane_user_id` | `text` | Yes | - | - |
| `plane_invited_at` | `timestamp with time zone` | Yes | - | - |
| `modal_access` | `boolean` | Yes | `false` | - |
| `cloudflare_access` | `boolean` | Yes | `false` | - |
| `kong_consumer_id` | `text` | Yes | - | - |
| `status` | `text` | Yes | `'pending'::text` | pending=awaiting onboarding, active=can login, suspended=temp disabled, offboarded=removed |
| `onboarded_at` | `timestamp with time zone` | Yes | - | - |
| `last_login_at` | `timestamp with time zone` | Yes | - | - |
| `suspended_at` | `timestamp with time zone` | Yes | - | - |
| `offboarded_at` | `timestamp with time zone` | Yes | - | - |
| `notes` | `text` | Yes | - | - |
| `created_by` | `uuid` | Yes | - | - |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |
| `display_name` | `text` | Yes | - | - |
| `role_name` | `text` | Yes | - | - |
| `avatar_url` | `text` | Yes | - | - |

### Indexes

- **(PK) team_members_pkey**
  ```sql
  CREATE UNIQUE INDEX team_members_pkey ON internal.team_members USING btree (id)
  ```
- **(UQ) team_members_user_id_key**
  ```sql
  CREATE UNIQUE INDEX team_members_user_id_key ON internal.team_members USING btree (user_id)
  ```
- **(UQ) team_members_email_key**
  ```sql
  CREATE UNIQUE INDEX team_members_email_key ON internal.team_members USING btree (email)
  ```
- **idx_team_members_email**
  ```sql
  CREATE INDEX idx_team_members_email ON internal.team_members USING btree (email)
  ```
- **idx_team_members_status**
  ```sql
  CREATE INDEX idx_team_members_status ON internal.team_members USING btree (status)
  ```
- **idx_team_members_role**
  ```sql
  CREATE INDEX idx_team_members_role ON internal.team_members USING btree (role_id)
  ```
- **idx_team_members_created_by**
  ```sql
  CREATE INDEX idx_team_members_created_by ON internal.team_members USING btree (created_by)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `team_members_access` | ALL | Yes |

## team_roles

> **Usage:** `frontend` · **Audience:** `internal` · **Domain:** `ops`

Named bundles of capabilities for convenience

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | - |
| `name` | `text` | No | - | - |
| `display_name` | `text` | No | - | - |
| `description` | `text` | Yes | - | - |
| `capabilities` | `text[]` | No | `'{}'::text[]` | Array of capability names from team_capabilities |
| `is_system` | `boolean` | Yes | `false` | System roles cannot be deleted |
| `created_at` | `timestamp with time zone` | Yes | `now()` | - |
| `updated_at` | `timestamp with time zone` | Yes | `now()` | - |

### Indexes

- **(PK) team_roles_pkey**
  ```sql
  CREATE UNIQUE INDEX team_roles_pkey ON internal.team_roles USING btree (id)
  ```
- **(UQ) team_roles_name_key**
  ```sql
  CREATE UNIQUE INDEX team_roles_name_key ON internal.team_roles USING btree (name)
  ```

### RLS Policies

| Policy | Command | Permissive |
|--------|---------|------------|
| `service_role_access` | ALL | Yes |
| `team_roles_access` | ALL | Yes |

---

*Generated at 2026-01-20T23:06:40.377131+00:00 by schema_generator.py*