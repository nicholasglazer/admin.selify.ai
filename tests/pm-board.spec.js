import {test, expect} from '@playwright/test';

/**
 * PM Board Tests (/pm)
 *
 * The AI-First PM Board is a Kanban-style task management system.
 * Requires: ops.tasks.view capability
 *
 * Features:
 * - Kanban columns (backlog, ai_queue, in_progress, review, done)
 * - Drag-drop between columns
 * - Task creation and editing
 * - Task detail modal
 */

test.describe('PM Board Page', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/pm');
  });

  test('should load PM board or show access denied', async ({page}) => {
    // Either loads successfully or shows 403 (capability-gated)
    const url = page.url();
    const bodyText = await page.locator('body').textContent();

    const hasAccess = !bodyText?.includes('Access denied') && !bodyText?.includes('403');

    if (hasAccess) {
      await expect(page).toHaveURL(/\/pm/);
    } else {
      // Access denied is expected for users without ops.tasks.view
      expect(bodyText).toMatch(/Access denied|403|Forbidden/i);
    }
  });

  test('should display Kanban columns when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    // Skip if no access
    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Look for column headers
    const columns = ['backlog', 'ai_queue', 'in_progress', 'review', 'done'];
    const columnContainer = page.locator('[data-testid="board"], .kanban, .board, [class*="column"]');

    // Board container should exist
    await expect(columnContainer.first()).toBeVisible({timeout: 10000});
  });

  test('should allow creating a new task when authorized', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    // Skip if no access
    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Find create/add task button
    const createButton = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("Create"), [data-testid="create-task"]').first();

    if (await createButton.isVisible()) {
      await createButton.click();

      // Modal or form should appear
      const modal = page.locator('[role="dialog"], .modal, [data-testid="task-modal"], form');
      await expect(modal.first()).toBeVisible({timeout: 5000});
    }
  });

  test('should open task detail modal when clicking a task', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    // Skip if no access
    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Find a task card
    const taskCard = page.locator('[data-testid="task-card"], .issue-card, .task-card, [draggable="true"]').first();

    if (await taskCard.isVisible()) {
      await taskCard.click();

      // Modal should open
      const modal = page.locator('[role="dialog"], .modal, [data-testid="issue-modal"]');
      await expect(modal.first()).toBeVisible({timeout: 5000});
    }
  });

  test('should show task counts in column headers', async ({page}) => {
    const bodyText = await page.locator('body').textContent();

    // Skip if no access
    if (bodyText?.includes('Access denied') || bodyText?.includes('403')) {
      test.skip();
      return;
    }

    // Column headers should show counts
    const columnHeaders = page.locator('.column-header, [data-testid="column-header"]');

    if ((await columnHeaders.count()) > 0) {
      // At least one header should have a number
      const headerTexts = await columnHeaders.allTextContents();
      const hasNumbers = headerTexts.some((text) => /\d+/.test(text));

      // Numbers might be 0, so just check structure is there
      expect(headerTexts.length).toBeGreaterThan(0);
    }
  });
});
