var jsforce = require('jsforce');
var Deferred = require('promised-io/promise').Deferred;
var all = require('promised-io/promise').all;
var seq = require('promised-io/promise').seq;

/**
 * Constructor function for NimbleForce
 */
function NimbleForce(username, password, url) {
    this.username = username;
    this.password = password;
    this.conn = new jsforce.Connection({loginUrl: url});
    this.conn.bulk.pollInterval = 3000; // 5 sec
    this.conn.bulk.pollTimeout = 60000; // 60 sec
    this._loggedInConnection = undefined;
}

NimbleForce.prototype = {
  constructor: NimbleForce,
  /**
   * Login to SF, cache the logged in conn for multiple requests.
   */
  login: function() {
    var deferred = new Deferred();
    if (this._loggedInConnection === undefined) {
      var self = this;
      this.conn.login(this.username, this.password, function(err, res) {
        self._loggedInConnection = self.conn;
        deferred.resolve(self._loggedInConnection);
      });
    } else {
      deferred.resolve(this._loggedInConnection);
    }
    return deferred.promise;
  },

  /**
   * Queries data from a SF org. Returns the data assigned to a
   * variable passed in through the q param.
   */
  queryData: function(q) {
    var deferred = new Deferred();
    this.login().then(function(connection) {
      connection.query(q.query, function(err, result) {
        if (err) { deferred.reject(err); }
        //if it is only one record return that record
        if (result.totalSize == 1) {
          return deferred.resolve({variable: q.variable, data: result.records[0]});
        }
        deferred.resolve({variable: q.variable, data: result.records});
      });
    });
    return deferred.promise;
  },

  /**
   * Processes the queries property of a json object and
   * resolves with a map of the variables to their data.
   */
  processData: function(data) {
    var deferred = new Deferred();
    var variables = {};
    var self = this;
    all(data.queries.map(function(q) { return self.queryData(q); })).then(function(results) {
      results.forEach(function(result) {
        variables[result.variable] = result.data;
      });
      self.replaceVariablesAndInsert(data.records, variables, data.extId).then(function() {
          deferred.resolve();
      });
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  },

  /**
   * Replacing variables in an array of records.
   */
  replaceVariables: function(records, variables) {
    var re = /\$\{(.+)\}/;
    var replacer = function(match, expression) {
      var tokens = expression.split('.');
      return variables[tokens[0]][tokens[1]];
    };

    return records.map(function(record) {
      var newRecord = {};
      Object.keys(record).forEach(function(field) {
        newRecord[field] = record[field];
        if (typeof newRecord[field] == 'string') {
          newRecord[field] = newRecord[field].replace(re, replacer);
        }
      });
      return newRecord;
    });
  },

  /**
   * Upserting a list of json records. The NU__ExternalId__c is
   * the Id used for upsert.
   */
  insertRecords: function(type, records, extId) {
    var deferred = new Deferred();
    extId = extId || 'NU__ExternalID__c';
    this.login().then(function(connection) {
      var fnArray = records.map(function(record, index) {
        // jscs:disable
        record[extId] = record[extId] || index+1;
        // jscs: enable
        return function() {
          var subDeferred = new Deferred();
          connection.sobject(type).upsert(record, extId, function(err, res2) {
            if (err) {
              console.log('Upsert Failure: ' + type + ' ' + err + '\n\tId: ' + record[extId]);
              subDeferred.resolve(err);
            } else {
              console.log('Upsert success: ' + type);
              subDeferred.resolve(res2);
            }
          });
          return subDeferred.promise;
        };
      });
      seq(fnArray).then(function(results) {
        deferred.resolve(results);
      }, function(err) { deferred.reject(err); });
    });
    return deferred.promise;
  },

  /**
   * Replaces the variables and calls insert on all the records.
   */
  replaceVariablesAndInsert: function(records, variables, extId) {
    var deferred = new Deferred();
    var self = this;
    var fnArray = Object.keys(records).map(function(type) {
      var jsonRecords = records[type];
      var recordsToInsert = self.replaceVariables(jsonRecords, variables);
      return function() {
        return self.insertRecords(type, recordsToInsert, extId);
      };
    });
    seq(fnArray).then(function(results) {
      deferred.resolve();
    }, function(err) { deferred.reject(err); });
    return deferred.promise;
  },

  /**
   * Execute an apexBody and resolve with the result when it finishes.
   */
  executeApex: function(apexBody) {
    var deferred = new Deferred();
    this.login().then(function(connection) {
      connection.tooling.executeAnonymous(apexBody, function(err, res) {
          if (err) { return deferred.reject(err); }
          if (!res.compiled) {
              return deferred.reject(res.compileProblem);
          }
          console.log(res);
          deferred.resolve();
      });
    });
    return deferred.promise;
  },

  /**
   * Process a list of json records for cleaning a SF org.
   */
  cleanDataFor: function(records) {
    var deferred = new Deferred();
    var self = this;
    var promises = records.map(function(record) {
      if (record.type === 'ApexScript') {
        return self.executeApex(record.body.join('\n'));
      }
    });
    all(promises).then(function(results) {
      deferred.resolve();
    }, function(err) { deferred.reject(err); });
    return deferred.promise;
  },

  /**
   * Query for the CH url.
   */
  retrieveCommunityUrl: function() {
    var deferred = new Deferred();
    this.login().then(function(connection) {
      connection.query('SELECT Domain, DomainType FROM Domain', function(err, res) {
        if (err) { return deferred.reject(err); }
        connection.query('SELECT Name,UrlPathPrefix FROM Network', function(err, res2) {
          if (err) { return deferred.reject(err); }
          var domain = 'http://' + res.records[0].Domain + '/' + res2.records[0].UrlPathPrefix;
          return deferred.resolve(domain);
        });
      });
    });
    return deferred.promise;
  },

  /**
   * Deactivate users, and delete the associated account.
   */
  deleteCommunityUser: function(username) {
    var deferred = new Deferred();
    this.login().then(function(connection) {
      var userQuery = 'SELECT Id, AccountId FROM User WHERE Username = \'' + username + '\'';
      connection.query(userQuery, function(err, res) {
        var rec = res.records[0];
        var accountId = rec.AccountId;
        var updatedUser = {
            Id: rec.Id,
            NU__ExternalId__c: rec.Id + '#',
            IsActive: false,
            IsPortalEnabled: false,
            Username: rec.Id + '@example.com',
            CommunityNickname: rec.Id + '@example.com',
            Email: rec.Id + '@example.com',
            FirstName: rec.Id,
            LastName: rec.Id
        };
        connection.sobject('User').upsert(updatedUser, 'Id', function(err, record) {
          console.log('User response: ' + JSON.stringify(record));
          if (err) { return deferred.reject(err); }
          connection.del('Account', accountId, function(err, rets) {
            console.log('Account response: ' + JSON.stringify(rets));
            if (err) { return deferred.reject(err); }
            deferred.resolve(rets);
          });
        });
      });
    });
    return deferred.promise;
  }
};

module.exports = NimbleForce;
