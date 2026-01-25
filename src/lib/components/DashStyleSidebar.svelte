<!--
  @component DashStyleSidebar

  Navigation sidebar matching dash.selify.ai patterns:
  - Collapsible sections with ChevronDown/ChevronRight
  - Fast appearing tooltips for collapsed state
  - Proper dash.selify.ai colors and styling
  - Modern hover patterns
-->
<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { Badge, Avatar } from '@miozu/jera';
  import { getAdminNavigationState } from '$lib/reactiveStates/adminNavigationSimple.svelte.js';
  import FastTooltip from './FastTooltip.svelte';
  import EnvironmentSwitcher from './EnvironmentSwitcher.svelte';
  import {
    Home, Kanban, TestTube, Activity, CheckCircle, MessageSquare, Mail,
    Users, Building, Server, AlertCircle, Terminal, BarChart, Database, Eye,
    Zap, Package, MapPin, Code2, Rocket, BookOpen,
    ChevronDown, ChevronRight, Sun, Moon
  } from './icons';

  // Props - themeState passed from layout (single source of truth)
  let { teamMember, capabilities, themeState } = $props();

  // Sidebar state
  let collapsed = $state(false);

  // Get singleton navigation state
  const adminNavState = $derived.by(() => {
    const state = getAdminNavigationState();
    state.updateCapabilities(capabilities);
    state.updateCurrentPath($page.url.pathname);
    return state;
  });

  // Get navigation blocks
  const navigationBlocks = $derived(adminNavState.navigationBlocks);

  // Icon mapping for dynamic loading
  const ICON_MAP = {
    Home, Kanban, TestTube, Activity, CheckCircle, MessageSquare, Mail,
    Users, Building, Server, AlertCircle, Terminal, BarChart, Database, Eye,
    Zap, Package, MapPin, Code2, Rocket, BookOpen
  };

  // Role variants
  const ROLE_VARIANTS = Object.freeze({
    super_admin: 'primary',
    developer: 'primary',
    ops: 'success',
    support: 'default'
  });

  // Format role name
  const formatRoleName = $derived.by(() => {
    if (!teamMember?.role_name) return 'Unknown';
    return teamMember.role_name.replace('_', ' ');
  });

  // Handle section toggle
  function toggleSection(sectionId) {
    adminNavState.toggleSection(sectionId);
  }

  // Check if section is expanded
  function isSectionExpanded(sectionId, defaultValue = false) {
    return adminNavState.getSectionExpanded(sectionId, defaultValue);
  }

  // Handle theme toggle
  function toggleTheme() {
    themeState?.toggle();
  }

  // Get icon component
  function getIcon(iconName) {
    return ICON_MAP[iconName] || BookOpen;
  }
</script>

<!-- Sidebar Container -->
<div class="navigation-sidebar" class:collapsed>
  <!-- Header -->
  <div class="sidebar-header">
    <div class="logo">
      <span class="logo-icon">S</span>
      {#if !collapsed}
        <span class="logo-text">Selify</span>
        <Badge variant="primary" size="xs">Admin</Badge>
      {/if}
    </div>
  </div>

  <!-- Content -->
  <div class="sidebar-content">
    {#each navigationBlocks as block (block.id)}
      <div class="nav-section">
        <!-- Section Header -->
        {#if block.title && !collapsed}
          <button
            class="section-header"
            class:collapsible={block.collapsible}
            onclick={() => block.collapsible && toggleSection(block.id)}
            aria-expanded={!block.collapsible || isSectionExpanded(block.id, block.defaultExpanded)}
          >
            <span class="section-title">{block.title}</span>
            {#if block.items?.length > 0}
              <span class="section-count">{block.items.length}</span>
            {/if}
            {#if block.collapsible}
              {#if isSectionExpanded(block.id, block.defaultExpanded)}
                <ChevronDown size={14} class="section-chevron" />
              {:else}
                <ChevronRight size={14} class="section-chevron" />
              {/if}
            {/if}
          </button>
        {:else if block.title && collapsed}
          <!-- Section divider for collapsed state -->
          <div class="section-divider"></div>
        {/if}

        <!-- Section Items -->
        {#if !block.collapsible || isSectionExpanded(block.id, block.defaultExpanded) || collapsed}
          <div class="nav-items" transition:slide={{ duration: 200, easing: quintOut }}>
            {#each block.items || [] as item (item.id)}
              {@const IconComponent = getIcon(item.icon)}

              {#if collapsed}
                <!-- Collapsed state with fast tooltip -->
                <FastTooltip content={item.label} position="right" delay={100}>
                  <a
                    href={item.href}
                    class="nav-item collapsed"
                    class:active={item.active}
                    title={item.label}
                  >
                    <IconComponent size={18} />
                  </a>
                </FastTooltip>
              {:else}
                <!-- Expanded state -->
                <a
                  href={item.href}
                  class="nav-item"
                  class:active={item.active}
                >
                  <IconComponent size={18} />
                  <span class="nav-label">{item.label}</span>
                </a>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Footer -->
  <div class="sidebar-footer">
    <!-- Environment Switcher -->
    <EnvironmentSwitcher {collapsed} />

    <!-- Theme Toggle -->
    {#if themeState}
      {#if collapsed}
        <FastTooltip content={themeState.isDark ? 'Light Mode' : 'Dark Mode'} position="right">
          <button class="theme-toggle collapsed" onclick={toggleTheme}>
            {#if themeState.isDark}
              <Sun size={18} />
            {:else}
              <Moon size={18} />
            {/if}
          </button>
        </FastTooltip>
      {:else}
        <button class="theme-toggle" onclick={toggleTheme}>
          {#if themeState.isDark}
            <Sun size={18} />
            <span>Light Mode</span>
          {:else}
            <Moon size={18} />
            <span>Dark Mode</span>
          {/if}
        </button>
      {/if}
    {/if}

    <!-- User Info -->
    {#if teamMember}
      {#if collapsed}
        <FastTooltip content={teamMember.full_name} position="right">
          <div class="user-info collapsed">
            <Avatar
              name={teamMember.full_name}
              src={teamMember.avatar_url}
              size="sm"
            />
          </div>
        </FastTooltip>
      {:else}
        <div class="user-info">
          <Avatar
            name={teamMember.full_name}
            src={teamMember.avatar_url}
            size="md"
          />
          <div class="user-details">
            <div class="user-name">{teamMember.full_name}</div>
            <Badge variant={ROLE_VARIANTS[teamMember.role_name] || 'default'} size="sm">
              {formatRoleName}
            </Badge>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Collapse Toggle -->
    <button class="collapse-toggle" onclick={() => collapsed = !collapsed}>
      {#if collapsed}
        <ChevronRight size={18} />
      {:else}
        <ChevronRight size={18} class="rotate-180" />
      {/if}
    </button>
  </div>
</div>

<style lang="postcss">
  @reference '$theme';

  /* Main Container - Match dash.selify.ai exactly */
  .navigation-sidebar {
    @apply fixed left-0 top-0 bottom-0 z-50;
    @apply bg-base01 border-r border-border;
    @apply flex flex-col shadow-2xl overflow-hidden;
    width: 300px;
    transition: width 250ms cubic-bezier(0.23, 1, 0.320, 1);
  }

  .navigation-sidebar.collapsed {
    width: 60px;
  }

  /* Header */
  .sidebar-header {
    @apply flex items-center justify-between px-4 py-3;
    @apply border-b border-base03/30;
  }

  .logo {
    @apply flex items-center gap-2;
  }

  .logo-icon {
    @apply w-8 h-8 rounded-lg;
    @apply bg-base0D text-white;
    @apply flex items-center justify-center;
    @apply text-sm font-bold;
  }

  .logo-text {
    @apply text-lg font-semibold text-base06;
    @apply transition-opacity duration-200;
  }

  .collapsed .logo-text {
    @apply opacity-0 pointer-events-none;
  }

  /* Content */
  .sidebar-content {
    @apply flex-1 overflow-y-auto overflow-x-hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--color-base02) transparent;
  }

  .sidebar-content::-webkit-scrollbar {
    @apply w-1;
  }

  .sidebar-content::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  .sidebar-content::-webkit-scrollbar-thumb {
    @apply bg-base02 rounded;
  }

  /* Navigation Sections */
  .nav-section {
    @apply py-1;
  }

  .section-header {
    @apply w-full flex items-center gap-2;
    @apply px-4 py-2 text-left;
    @apply text-xs font-medium;
    @apply text-base04 bg-transparent border-none;
    @apply transition-colors duration-200;
    @apply cursor-pointer justify-start;
    font: inherit;
  }

  .section-header:hover {
    @apply text-base05;
  }

  .section-header:not(.collapsible) {
    @apply cursor-default;
  }

  .section-title {
    @apply flex-1 text-left uppercase tracking-wide;
  }

  .section-count {
    @apply px-1.5 py-0.5 text-[10px];
    @apply bg-base02 text-base05 rounded;
    @apply flex-shrink-0;
  }

  .section-chevron {
    @apply text-base04 flex-shrink-0;
    @apply transition-transform duration-200;
  }

  .section-divider {
    @apply my-1 border-t border-base03/30;
  }

  .nav-items {
    @apply space-y-0;
  }

  /* Navigation Items - Match dash.selify.ai exactly */
  .nav-item {
    @apply w-full flex items-center gap-3;
    @apply px-4 py-2;
    @apply text-sm text-base06;
    @apply no-underline;
    @apply transition-all duration-200;
    @apply cursor-pointer;
  }

  .nav-item:hover {
    @apply bg-base0D/10;
  }

  .nav-item.active {
    @apply bg-base0D/10 text-base0D font-medium;
  }

  .nav-item.collapsed {
    @apply justify-center px-2 py-2 w-10 h-10;
    @apply mx-auto;
  }

  .nav-label {
    @apply flex-1 text-left font-medium;
    @apply whitespace-nowrap overflow-hidden text-ellipsis;
  }

  /* Icon styling to match dash */
  .nav-item :global(svg) {
    @apply flex-shrink-0 text-base06;
  }

  .nav-item.active :global(svg) {
    @apply text-base0D;
  }

  /* Footer */
  .sidebar-footer {
    @apply border-t border-base03/30;
    @apply px-4 py-3 flex flex-col gap-2;
    @apply mt-auto;
  }

  .theme-toggle {
    @apply w-full flex items-center gap-2 p-2 rounded-lg;
    @apply text-base05 bg-transparent border-none;
    @apply transition-all duration-150 cursor-pointer;
    font: inherit;
  }

  .theme-toggle:hover {
    @apply bg-base02 text-base06;
  }

  .theme-toggle.collapsed {
    @apply justify-center w-10 h-10;
  }

  .user-info {
    @apply flex items-center gap-3 p-2;
    @apply rounded-lg bg-base02/50;
  }

  .user-info.collapsed {
    @apply justify-center w-10 h-10;
  }

  .user-details {
    @apply flex-1 min-w-0;
  }

  .user-name {
    @apply text-sm font-semibold text-base06;
    @apply truncate mb-0.5;
  }

  .collapse-toggle {
    @apply w-full flex items-center justify-center;
    @apply p-2 rounded-lg;
    @apply text-base05 bg-transparent border-none;
    @apply transition-all duration-150 cursor-pointer;
    font: inherit;
  }

  .collapse-toggle:hover {
    @apply bg-base02 text-base06;
  }

  .rotate-180 {
    transform: rotate(180deg);
  }

  /* Performance optimizations */
  .navigation-sidebar {
    contain: layout style;
  }

  .nav-item {
    backface-visibility: hidden;
    transform: translateZ(0);
  }
</style>