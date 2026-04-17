function transform(input) {
  const plugins =
    input && input.data && Array.isArray(input.data.plugins)
      ? input.data.plugins
      : Array.isArray(input.plugins)
        ? input.plugins
        : null;

  if (!plugins) {
    return input;
  }

  const sortBy =
    input &&
    input.trmnl &&
    input.trmnl.plugin_settings &&
    input.trmnl.plugin_settings.custom_fields_values &&
    input.trmnl.plugin_settings.custom_fields_values.sort_by
      ? input.trmnl.plugin_settings.custom_fields_values.sort_by
      : "connections";

  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const statePriority = (plugin) => {
    if (!plugin || !plugin.state) {
      return 0;
    }

    if (plugin.state === "error") {
      return 2;
    }

    if (plugin.state === "degraded") {
      return 1;
    }

    return 0;
  };

  const metricFor = (plugin) => {
    if (sortBy === "install") {
      return toNumber(plugin && plugin.installs);
    }

    if (sortBy === "forks") {
      return toNumber(plugin && plugin.forks);
    }

    return toNumber(plugin && plugin.installs) + toNumber(plugin && plugin.forks);
  };

  const sortedPlugins = plugins
    .map((plugin, index) => ({ plugin, index }))
    .sort((a, b) => {
      const stateDiff = statePriority(b.plugin) - statePriority(a.plugin);
      if (stateDiff !== 0) {
        return stateDiff;
      }

      if (sortBy === "alpha") {
        const nameA = (a.plugin && a.plugin.name ? a.plugin.name : "").toString();
        const nameB = (b.plugin && b.plugin.name ? b.plugin.name : "").toString();
        const nameDiff = nameA.localeCompare(nameB);
        if (nameDiff !== 0) {
          return nameDiff;
        }

        return a.index - b.index;
      }

      const metricDiff = metricFor(b.plugin) - metricFor(a.plugin);
      if (metricDiff !== 0) {
        return metricDiff;
      }

      const nameA = (a.plugin && a.plugin.name ? a.plugin.name : "").toString();
      const nameB = (b.plugin && b.plugin.name ? b.plugin.name : "").toString();
      const nameDiff = nameA.localeCompare(nameB);
      if (nameDiff !== 0) {
        return nameDiff;
      }

      return a.index - b.index;
    })
    .map(({ plugin }) => plugin);

  if (input.data && Array.isArray(input.data.plugins)) {
    return {
      ...input,
      data: {
        ...input.data,
        plugins: sortedPlugins,
      },
    };
  }

  return {
    ...input,
    plugins: sortedPlugins,
  };
}
