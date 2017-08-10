/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Andrew Voitov
 */

var users = require('../user');
var projects = require('../project');
var log = require('./logger');

exports.createDefaultProject = function(company, user) {
    var project = projects.generateDefaultProject(company);
    projects.saveInDb(project, function(err, savedProject) {
        if(err) {
            log.error('Cannot save project!', {error: err});
        } else {
            log.info('Defaul project is created!');
            if(user) {
                user.assignments = [{
                    role: 'Owner',
                    projectName: savedProject.name,
                    projectId: savedProject._id
                }];
                user.companyId = company._id;
                users.save(user, function(err, updatedUser) {
                    log.info('Default assignment is added! User ID: %s',
                        updatedUser._id.toHexString());
                });
            }
        }
    });
};
