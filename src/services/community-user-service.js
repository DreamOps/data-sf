/**
 * Factory function for the community-user-service.
 *
 * @param {function} query - Dependency on the query-service provided.
 * @param {object} recordService - Dependency on the record-service provided.
 * @param {object} promise - Dependency on a promise library provided.
 * @param {function} logger - Function that prints a passed in string.
 * @return {object} An object to manage community users.
 */
module.exports = function(query, recordService, promise, logger) {
  /**
   * Deactivate/rename users, and delete the associated account.
   * Best case scenario when it comes to deleting CH users.
   *
   * @param {string} username - The username for the user that we want to 'delete'.
   * @return {object} Promise that resolves with the result of the account deletion
   *         when the upsert and delete finish.
   */
  var deleteCommunityUser = function(username) {
    var deferred = new promise.Deferred();
    var userQuery = 'SELECT Id, AccountId FROM User WHERE Username = \'' + username + '\'';
    var accountId;
    query(userQuery).then(function(res) {
      if (res.length == 0) {
        deferred.resolve();
        return;
      }
      var rec = res[0];
      accountId = rec.AccountId;
      var updatedUser = {
          Id: rec.Id,
          IsActive: false,
          IsPortalEnabled: false,
          Username: rec.Id + '@example.com',
          CommunityNickname: rec.Id + '@example.com',
          Email: rec.Id + '@example.com',
          FirstName: rec.Id,
          LastName: rec.Id
      };
      return recordService.upsertRecord('User', updatedUser, 'Id');
    }).then(function(record) {
      logger('User response: ' + JSON.stringify(record));
      return recordService.deleteRecord('Account', accountId);
    }).then(function(res) {
      deferred.resolve(res);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  return {
    deleteCommunityUser: deleteCommunityUser
  };
};
