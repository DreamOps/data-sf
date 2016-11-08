/**
 * Factory function for the namespace-service.
 *
 * @param {object} config - Configuration data injected.
 * @return {function} namespace-service takes json data and swaps namespaces.
 */
module.exports = function(config) {
  /**
   * Replace all occurences of NU__, NU., and NC__ in the passed in raw data
   * with config.nuObjectNamespace, config.nuClassNamespace, and config.ncObjectNamespace
   * respectively.
   *
   * @param {object} rawData - The raw json object ready for replacing.
   * @return {object} rawData with fields and values namespaced.
   */
  return function(rawData) {
    var namespacedString = JSON.stringify(rawData)
      .split('NU__').join(config.nuObjectNamespace)
      .split('NU.').join(config.nuClassNamespace)
      .split('NC__').join(config.ncObjectNamespace);
    return JSON.parse(namespacedString);
  };
};
