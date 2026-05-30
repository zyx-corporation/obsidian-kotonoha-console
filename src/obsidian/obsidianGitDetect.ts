import type { App } from "obsidian";

const OBSIDIAN_GIT_PLUGIN_ID = "obsidian-git";

interface PluginHost {
  plugins: {
    enabledPlugins: Set<string>;
    getPlugin(id: string): unknown;
  };
}

/** True when Obsidian Git community plugin is installed and enabled. */
export function isObsidianGitPluginEnabled(app: App): boolean {
  const plugins = (app as App & PluginHost).plugins;
  return (
    plugins.enabledPlugins.has(OBSIDIAN_GIT_PLUGIN_ID) &&
    plugins.getPlugin(OBSIDIAN_GIT_PLUGIN_ID) != null
  );
}
