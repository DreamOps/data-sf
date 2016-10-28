/**
 * Factory function for the namespace-service.
 * @param {object} config - Configuration data injected.
 * @return namespace-service.
 */
module.exports = function(config) {
  /**
   * Replace all occurences of NU__, NU., and NC__ in the passed in raw data
   * with config.nuObjectNamespace, config.nuClassNamespace, and config.ncObjectNamespace
   * respectively.
   * @param {object} rawData - The raw json object ready for replacing.
   * @return Object with fields and values namespaced.
   */
  return function(rawData) {
    var namespacedString = JSON.stringify(rawData)
      .split('NU__').join(config.nuObjectNamespace)
      .split('NU.').join(config.nuClassNamespace)
      .split('NC__').join(config.ncObjectNamespace);
    return JSON.parse(namespacedString);
  };
};
