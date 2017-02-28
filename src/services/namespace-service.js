/**
 * Factory function for the namespace-service.
 *
 * @param {object} config - Configuration data injected.
 * @return {function} namespace-service takes json data and swaps namespaces.
 */
module.exports = function(config) {
  /**
   * Replace all occurences of keys in the config.namespaces object,
   * with the corresponding values.
   *
   * @param {object} rawData - The raw json object ready for replacing.
   * @return {object} rawData with fields and values namespaced.
   */
  return function(rawData) {
    var namespacedString = JSON.stringify(rawData);
    Object.keys(config.namespaces).forEach(function(namespace) {
      namespacedString = namespacedString.split(namespace).join(config.namespaces[namespace]);
    });
    return JSON.parse(namespacedString);
  };
};
