# Browser Debugging Guide for AI Agents

**Purpose:** This guide enables AI agents (Claude Code) to visually debug and test UI using a real browser on the user's local machine via Chrome DevTools MCP.

---

## Prerequisites Check

Before using browser debugging tools, verify the tunnel is active:

```bash
# Check if Chrome debug port is accessible
curl -s http://localhost:9222/json/version
```

**If this fails**, the user needs to run the setup on their local machine:

```bash
# On USER'S LOCAL MACHINE (not the server):
./scripts/browser-debug-local.sh ng@server-ip

# Or if Claude Code is running locally:
./scripts/browser-debug-local.sh
```

---

## Available MCP Tools

When Chrome DevTools MCP is connected, these tools are available:

### Navigation & Interaction

| Tool | Description | Example |
|------|-------------|---------|
| `devtools_navigate` | Navigate to a URL | `devtools_navigate({ url: "http://localhost:5174" })` |
| `devtools_click` | Click an element | `devtools_click({ selector: "button.submit" })` |
| `devtools_type` | Type text into input | `devtools_type({ selector: "input[name=email]", text: "test@example.com" })` |
| `devtools_scroll` | Scroll the page | `devtools_scroll({ direction: "down", amount: 500 })` |
| `devtools_hover` | Hover over element | `devtools_hover({ selector: ".menu-item" })` |

### Inspection & Debugging

| Tool | Description | Example |
|------|-------------|---------|
| `devtools_screenshot` | Take a screenshot | `devtools_screenshot({ fullPage: true })` |
| `devtools_get_console_logs` | Get console output | `devtools_get_console_logs({ level: "error" })` |
| `devtools_get_network_requests` | Get network activity | `devtools_get_network_requests({ filter: "api" })` |
| `devtools_evaluate` | Run JavaScript | `devtools_evaluate({ expression: "document.title" })` |
| `devtools_get_page_content` | Get page HTML | `devtools_get_page_content()` |

### Performance & Analysis

| Tool | Description | Example |
|------|-------------|---------|
| `devtools_performance_start_trace` | Start performance recording | `devtools_performance_start_trace()` |
| `devtools_performance_stop_trace` | Stop and get trace data | `devtools_performance_stop_trace()` |
| `devtools_get_accessibility_tree` | Get accessibility info | `devtools_get_accessibility_tree()` |

---

## Common Workflows

### 1. Debug a Page Load Error

```
1. Navigate to the page:
   devtools_navigate({ url: "http://localhost:5174/pm" })

2. Check for console errors:
   devtools_get_console_logs({ level: "error" })

3. Check network failures:
   devtools_get_network_requests({ filter: "failed" })

4. Take screenshot for context:
   devtools_screenshot({ fullPage: true })
```

### 2. Test User Flow

```
1. Start at login:
   devtools_navigate({ url: "http://localhost:5174/auth" })

2. Fill credentials:
   devtools_type({ selector: "input[name=email]", text: "admin@selify.ai" })
   devtools_type({ selector: "input[name=password]", text: "password" })

3. Submit form:
   devtools_click({ selector: "button[type=submit]" })

4. Verify redirect:
   devtools_screenshot()
   devtools_evaluate({ expression: "window.location.href" })
```

### 3. Inspect Component Styling

```
1. Navigate to component:
   devtools_navigate({ url: "http://localhost:5174/pm" })

2. Get computed styles:
   devtools_evaluate({
     expression: "getComputedStyle(document.querySelector('.kanban-board')).cssText"
   })

3. Check accessibility:
   devtools_get_accessibility_tree()
```

---

## Troubleshooting

### "Connection refused" or "Cannot connect to browser"

**Cause:** SSH tunnel is not running or Chrome is not started.

**Solution:** Ask the user to run on their LOCAL machine:

```bash
cd /home/ng/prod/admin.selify.ai
./scripts/browser-debug-local.sh ng@server-ip
```

### "Element not found"

**Cause:** Selector doesn't match or element not loaded yet.

**Solution:**
1. Take a screenshot to see current state
2. Use `devtools_evaluate` to check if element exists:
   ```javascript
   document.querySelector('your-selector') !== null
   ```
3. Wait for element with retry logic

### "Network request failed"

**Cause:** Dev server not running or CORS issues.

**Solution:**
1. Verify dev server: `curl http://localhost:5174`
2. Check if running: `pnpm dev` (port 5174 for admin)

---

## Integration with Playwright Tests

When debugging Playwright test failures:

1. **Reproduce the failure visually:**
   ```
   devtools_navigate({ url: "http://localhost:5174/pm" })
   devtools_screenshot()
   ```

2. **Compare with test assertions:**
   ```
   devtools_evaluate({ expression: "document.querySelector('[data-testid=board]')" })
   ```

3. **Check for timing issues:**
   ```
   devtools_get_network_requests()  // See if requests are still pending
   ```

---

## Session Notes

- **Port:** 9222 (Chrome DevTools Protocol)
- **Admin dev server:** http://localhost:5174
- **Dash dev server:** http://localhost:5173
- **Authenticated sessions:** User's Chrome profile preserves login state

---

## Quick Reference Card

```
# Check tunnel is working
curl http://localhost:9222/json/version

# Common debugging sequence
1. devtools_navigate → Go to page
2. devtools_screenshot → See current state
3. devtools_get_console_logs → Check errors
4. devtools_get_network_requests → Check API calls
5. devtools_evaluate → Run custom JS

# If tunnel not working, tell user:
"Please run on your local machine:
 ./scripts/browser-debug-local.sh ng@server-ip"
```
