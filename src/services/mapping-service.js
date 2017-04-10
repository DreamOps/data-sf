module.exports = function(config, connection, jsforcePartnerService, _, fs) {

    var standardObjectWhitelistSet = toSet(config.standardObjectWhitelist || []);

    // Converts [a, b] to {a: true, b: true}.
    function toSet(arr) {
        return arr.reduce((prev, curr) => { prev[curr] = true; return prev; }, {});
    }

    // Pushes an array of items into an array.
    function pushAll(arr, items) {
        items.forEach(x => arr.push(x));
    }

    // Should the object be included? We ignore custom settings and standard objects that aren't whitelisted.
    function shouldIncludeObject(meta) {
        return meta.name && !isSetting(meta) && (isCustom(meta) || isWhitelistedStandardObject(meta));
    }

    // Is the object a custom setting?
    function isSetting(meta) {
        return meta.customSetting === 'true';
    }

    // Is the object custom (not standard)?
    function isCustom(meta) {
        return meta.name.endsWith('__c');
    }

    // Is the object in the standard object whitelist?
    function isWhitelistedStandardObject(meta) {
        return standardObjectWhitelistSet[meta.name];
    }

    // Is the field a relationship (master-detail or lookup)?
    function isRelationship(field) {
        return field.type === 'reference';
    }

    // Is the field an account field (not a person field)?
    function isAccountField(field) {
        return field.name !== 'FirstName' && field.name !== 'LastName' && field.name !== 'Salutation' &&
            !field.name.endsWith('__pc');
    }

    // Is the field a person field (not an account field)?
    function isPersonField(field) {
        return field.name !== 'Name';
    }

    // Gets the relationship name of a field.
    //     Account__c => Account__r
    //     AccountId => Account
    function getRelationshipName(fieldName) {
        return fieldName.endsWith('__c') ? fieldName.slice(0, -1) + 'r' : fieldName.slice(0, -2);
    }

    // Gets the unnamespaced name of a field.
    //     NU__Account__c => Account__c
    function unnamespacedName(fieldName) {
        var index = fieldName.indexOf('__');
        if (index === -1 || index === fieldName.lastIndexOf('__')) {
            // There are no double underscores, or just one set (the __c)
            return fieldName;
        }
        return fieldName.substring(index + 2);
    }

    // Some JSforce results, such as the describe field list, are an array if there more than one, an object if there is
    // exactly one, or undefined otherwise. This ensures we always get an array.
    function asArray(obj) {
        if (Array.isArray(obj)) {
            return obj;
        }
        if (obj) {
            return [obj];
        }
        return [];
    }

    // Finds the next pass to process by looking for the first un-sorted pass with no outstanding dependencies.
    function findNextPass(passes) {
        var res = _.values(passes).find(x => !x.sorted && x.dependencies.length === 0);
        if (res) {
            res.sorted = true;
        }
        return res;
    };

    // Processes passes until they have all been sorted or all remaining passes are part of a dependency cycle.
    // Returns true if we are done (all passes sorted).
    function sortPasses(passes, sortedPasses) {
        var next = findNextPass(passes);
        while (next) {
            sortedPasses.push(next);

            // Remove dependencies from dependents
            next.dependents.forEach(d => {
                var dependent = passes[d];
                dependent.dependencies = dependent.dependencies.filter(x => x.to !== next.name);
            });

            next = findNextPass(passes);
        }
        return _.values(passes).every(x => x.sorted);
    };

    // Split any self-referencing relationship fields into a second pass.
    function splitSelfReferences(passes) {
        _.values(passes).forEach(pass => {
            var selfReferences = pass.dependencies.filter(d => d.to === pass.type);
            if (selfReferences.length > 0) {

                var selfReferencesNames = selfReferences.map(r => r.name);
                var selfReferencesNamesSet = toSet(selfReferencesNames);

                console.log('Split Self Reference on ' + pass.type + ' ' + selfReferencesNames);

                // Remove dependency on self
                pass.dependencies = pass.dependencies.filter(d => d.to !== pass.type);

                // Create a new pass
                var newPass = {
                    name: pass.name + '`1',
                    dependencies: selfReferences,
                    dependents: [],
                    externalId: pass.externalId,
                    fields: pass.fields.filter(x => selfReferencesNamesSet[x.name]),
                    filter: pass.filter,
                    type: pass.type
                };
                passes[newPass.name] = newPass;

                // New pass is dependent on the original pass
                newPass.dependencies.push({name: null, type: null, to: pass.name});

                // Add the new pass to the dependents list of its dependencies
                newPass.dependencies.forEach(d => {
                    passes[d.to].dependents.push(newPass.name);
                });

                // Remove self-referencing fields from the original pass
                pass.fields = pass.fields.filter(x => !selfReferencesNamesSet[x.name]);
            }
        });
    };

    // Breaks a dependency cycle by splitting a pass into two. For now we just find the pass with the most dependents,
    // where all of its dependencies aren't master-details. This will not always work.
    function splitCycle(passes) {
        // Count the dependents of each pass and sort them descending
        var counts = _.countBy(_.flatMap(_.values(passes), x => _.uniq(x.dependencies.map(d => d.to))));
        var countsArr = _.orderBy(Object.keys(counts).map(x => ({name: x, count: counts[x]})), ['count'], ['desc']);

        var passToSplit = countsArr.find(x => passes[x.name].dependencies.every(d => d.type !== 'MasterDetail'));
        if (!passToSplit) {
            throw 'Failed to Split Cycle';
        }

        var oldPassName = passToSplit.name;
        var oldPass = passes[passToSplit.name];
        console.log('Splitting Cycle on ' + oldPassName);

        // Create a new pass that is dependent on the original pass
        var newPass = passes[oldPassName + '`1'];
        if (!newPass) {
            newPass = {
                name: oldPassName + '`1',
                dependencies: [{name: null, type: null, to: oldPassName}],
                dependents: [],
                externalId: oldPass.externalId,
                fields: [],
                type: oldPass.type
            };
            oldPass.dependents.push(newPass.name);
            passes[newPass.name] = newPass;
        }

        // Move the fields corresponding to the dependencies to the new pass
        var fieldsSet = toSet(oldPass.dependencies.map(x => x.name));
        pushAll(newPass.fields, oldPass.fields.filter(f => fieldsSet[f.name]));
        oldPass.fields = oldPass.fields.filter(f => !fieldsSet[f.name]);

        // Move the dependencies to the new pass
        pushAll(newPass.dependencies, oldPass.dependencies);
        oldPass.dependencies = [];
        newPass.dependencies.forEach(d => {
            passes[d.to].dependents.push(newPass.name);
        });
    };

    // Builds the pass JSON that will be saved.
    function buildPassJSON(pass, passes) {
        var whereClause = pass.filter ? ' WHERE ' + pass.filter : '';
        var result = {
            name: pass.name,
            query: 'SELECT Id, ' + pass.fields.map(f => f.name).join(', ') + ' FROM ' + pass.type + whereClause,
            type: pass.type,
            id: pass.externalId,
            mappings: [{
                'sourceColumn': 'Id',
                'destColumn': pass.externalId
            }]
        };
        pushAll(result.mappings, pass.fields.filter(isRelationship).map(f => ({
            'sourceColumn': f.name,
            'destColumn': getRelationshipName(f.name) + '.' + passes[f.referenceTo].externalId
        })));
        return result;
    }

    // Splits the account pass into separate passes for regular accounts, person accounts, and populating
    // PersonContact__c. Also maps the contact external id field for person accounts.
    function handleAccountPassForPersonAccounts(pass, passes, results) {
        var accountFields = pass.fields.filter(isAccountField);
        var personFields = pass.fields.filter(isPersonField);

        var pcExternalId = pass.fields.find(f => f.name.match(/externalid/i) && f.name.endsWith('__pc'));
        if (pcExternalId) {
            personFields = personFields.filter(x => x.name != pcExternalId.name);
            personFields.push({name: 'PersonContactId'});
        }

        var accountFilter = 'IsPersonAccount = false';
        var personFilter = 'IsPersonAccount = true';

        var accountPass = buildPassJSON({
            name: pass.name,
            type: pass.type,
            fields: accountFields,
            externalId: pass.externalId,
            filter: accountFilter
        }, passes);

        var personPass = buildPassJSON({
            name: 'Person' + pass.name,
            type: pass.type,
            fields: personFields,
            externalId: pass.externalId,
            filter: personFilter
        }, passes);

        if (pcExternalId) {
            personPass.mappings.push({
                'sourceColumn': 'PersonContactId',
                'destColumn': pcExternalId.name
            });
        }

        results.push(accountPass);
        results.push(personPass);

        // If this is the original Account pass, add another pass to populate PersonContact__c.
        if (pass.name === 'Account') {
            var personContact = passes['Account`1'].fields.find(x => unnamespacedName(x.name) === 'PersonContact__c');
            if (personContact) {
                results.push(buildPassJSON({
                    name: 'PersonAccount`PersonContact',
                    type: 'Account',
                    fields: [personContact],
                    externalId: pass.externalId,
                    filter: personFilter
                }, passes));
            }
        }
    }

    // Generates a mapping file and saves it at the specified path.
    var map = function(path) {
        return connection().then(function(conn) {
            // Get the global describe
            return conn.describeGlobal().then(describe => ({conn: conn, describe: describe}));

        }).then(function(result) {
            // Get the detailed sobject describe in chunks
            var objNames = result.describe.sobjects.map(x => x.name);
            var objNameChunks = _.chunk(objNames, 100);
            var partnerService = jsforcePartnerService.create(result.conn);
            return Promise.all(objNameChunks.map(x => partnerService.describeSObjects(x)));

        }).then(function(results) {
            var describes = _.flatten(results).filter(describe => shouldIncludeObject(describe));

            var passes = {};
            describes.forEach(describe => {
                var fields = asArray(describe.fields).filter(f => f.createable === 'true');

                // Add RecordTypeId if there are record types
                if (asArray(describe.recordTypeInfos).length > 1) {
                    fields.push({
                        name: 'RecordTypeId'
                    });
                }

                // Find the external id. If there isn't one, skip this object.
                var externalId = fields.find(f => f.externalId === 'true' && f.name.match(/externalid/i));
                externalId = externalId && externalId.name;
                if (!externalId) {
                    return;
                }

                var pass = {
                    name: describe.name,
                    dependencies: fields.filter(isRelationship).filter(f => f.referenceTo).map(f => ({
                        name: f.name,
                        type: f.relationshipOrder ? 'MasterDetail' : 'Lookup',
                        to: f.referenceTo
                    })),
                    dependents: [],
                    externalId: externalId,
                    fields: fields,
                    type: describe.name
                };
                passes[pass.name] = pass;
            });

            _.values(passes).forEach(pass => {
                // Exclude relationships to objects we aren't handling
                pass.fields = pass.fields.filter(f => !isRelationship(f) || passes[f.referenceTo]);
                pass.dependencies = pass.dependencies.filter(f => passes[f.to]);

                // Determine the dependents for each pass
                pass.dependencies.forEach(d => {
                    passes[d.to].dependents.push(pass.name);
                });
            });

            // Split up passes that reference themselves
            splitSelfReferences(passes);

            var sortedPasses = [];

            // Sort passes until only cycles remain, then split one and continue
            while (!sortPasses(passes, sortedPasses)) {
                splitCycle(passes);
            }

            var personAccountsEnabled = passes.Account && passes.Account.fields.find(f => f.name === 'LastName');

            var results = [];
            sortedPasses.forEach(pass => {
                if (personAccountsEnabled) {
                    if (pass.type === 'Account') {
                        handleAccountPassForPersonAccounts(pass, passes, results);
                        return;

                    } else if (pass.type === 'Contact') {
                        // Just exclude person account records
                        pass.filter = 'Account.IsPersonAccount = false';
                    }
                }

                results.push(buildPassJSON(pass, passes));
            });

            return fs.writeFile(path, JSON.stringify(results, null, 4));
        });
        return result;
    };

    return {
        map: map
    };
};
