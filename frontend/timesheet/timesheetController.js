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
 */

'use strict';

angular.module('mifortTimesheet.timesheet', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function ($routeProvider, appVersion) {
        $routeProvider.when('/timesheet', {
            templateUrl: 'timesheet/timesheetView.html?rel=' + appVersion,
            controller: 'timesheetController'
        });

        $routeProvider.when('/timesheet/:userId', {
            templateUrl: 'timesheet/timesheetView.html?rel=' + appVersion,
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', 'timesheetService', 'calendarService', 'preferences', 'loginService', '$routeParams', '$timeout', 'Notification', "$q", "projectSummaryService", "$filter", '$location', '$http', '$rootScope',
        function ($scope, timesheetService, calendarService, preferences, loginService, $routeParams, $timeout, Notification, $q, projectSummaryService, $filter, $location, $http, $rootScope) {
            var user;

            $scope.projects = [];
            $scope.currentPeriodIndex = 0;
            $scope.timesheetKeys = timesheetService.getTimesheetKeys();
            $scope.logs = [];
            $scope.filteredLogs = [];
            $scope.customUserId = $routeParams.userId;
            $scope.grid = {options: {reportFilters: []}};
            $scope.activeRequest = false;
            $scope.pendingChanges = false;
            $scope.timer = null;
            $scope.lastSaveTimeout = null;
            $scope.lastSavedLogs = [];
            $scope.readonly = false;

            var userRole = preferences.get('user').role.toLowerCase();

            loginService.getUser($scope.customUserId).success(function (loggedUser) {
                if (loggedUser) {
                    $scope.loading = true;

                    var uniqueProjectAssignments = [],
                        loadedProjects = 0;

                    $scope.customUserName = loggedUser.displayName;
                    user = loggedUser;

                    if (!$scope.customUserId) {
                        preferences.set('user', loggedUser);

                        //get accounts
                        $http.get('api/v1/user/accounts/' + user.email).success(function(accounts) {
                            $rootScope.accounts = accounts.filter(function (acc) {
                                return acc.companyId != user.companyId && acc.external;
                            });
                        });
                    }

                    if (user.assignments && user.assignments.length) {
                        user.assignments.forEach(function (assignment) {
                            uniqueProjectAssignments.push(assignment.projectId);
                        });
                        uniqueProjectAssignments = _.uniq(uniqueProjectAssignments);
                    }

                    //get timesheets
                    if (!uniqueProjectAssignments.length) {
                        $scope.noAssignments = true;
                        $scope.loading = false;
                    }

                    uniqueProjectAssignments.forEach(function (assignment, index) {
                        timesheetService.getProject(assignment).success(function (project) {
                            if (project && project.active) {
                                project.assignments = _.where(user.assignments, {projectId: project._id});

                                $scope.projects.splice(index, 0, project);
                            }

                            loadedProjects++;
                        }).then(function () {
                            //when all projects are loaded
                            $scope.projects = $scope.getSortedProjects();

                            var filterProjects = $scope.projects.map(function (project) {
                                return {_id: project._id, name: project.name};
                            });
                            $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];

                            if (loadedProjects == uniqueProjectAssignments.length) {
                                $scope.init();
                            }
                        });
                    });
                }
            });

            $scope.addLogs = function (index) {
                $scope.logs.push({index: index, data: $scope.groupDatePeriodsProjects(index)});
            };
            $scope.currentPeriodLogsLoaded = function () {
                $scope.$root.$emit('projectsAndLogsLoaded', {
                    projects: $scope.projects,
                    logs: $scope.logs,
                    index: $scope.currentPeriodIndex
                });
            };
            function blockTable() {
                var blockday = $scope.getFilteredDates();
                var counter = false;
                var reject = false;
                var approve = false;
                for(var key in blockday) {
                    if(blockday[key].readyForApprove === true){
                        counter = true;
                    }else if(blockday[key].readyForApprove === false){
                        reject = true;
                    }
                    if(blockday[key].Approve === true){
                        approve = true;
                    }
                }
                if (counter === true) {
                    $scope.readonly = true;
                    $scope.rejectColor = false;
                    $scope.approveColor = false;
                } else {
                    $scope.readonly = false;
                    $scope.approveColor = false;
                    $scope.rejectColor = true;
                }
                if(reject === true){
                    $scope.readonly = false;
                    $scope.approveColor = false;
                    $scope.rejectColor = true;
                } else {
                    $scope.approveColor = false;
                    $scope.rejectColor = false;
                }
                if(approve === true){
                    $scope.readonly = true;
                    $scope.approveColor = true;
                    $scope.rejectColor = false;
                }
            }
            $scope.init = function () {
                if(localStorage["redirectDate"] && !moment(localStorage["redirectDate"], '"MM/DD/YYYY"', true).isValid()) {
                    delete localStorage["redirectDate"];
                }
                var promises = [];
                $scope.projects.forEach(function (project) {
                    var today = moment();
                    if(localStorage["redirectDate"]){
                        var redirectDate = JSON.parse(localStorage["redirectDate"]);
                        project.periods.forEach(function (v, i, arr) {
                            if(v.start === redirectDate){
                                localStorage['currentPeriodIndex']=i;
                            }
                        })
                    }
                    //scroll into cuttent week
                    project.periods.forEach(function (period, periodIndex) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));
                        if (today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')) {
                            $scope.currentPeriodIndex = +preferences.get('currentPeriodIndex') || periodIndex || 0;
                        }
                    });
                    promises.push(initPeriod(project, $scope.currentPeriodIndex));
                });

                $q.all(promises).then(function () {
                    $scope.addLogs($scope.currentPeriodIndex);
                    initWatchers("logs");
                    $scope.currentPeriodLogsLoaded();

                    $scope.filteredLogs = $scope.getFilteredDates();

                    blockTable();

                    $scope.watchFilterChanges();

                    $scope.projects.forEach(function (project) {
                        applyProjectDefaultValues(project, $scope.currentPeriodIndex);
                    });
                    $scope.loading = false;
                });
            };

            $scope.introSteps = timesheetService.introSteps;

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timesheet = [];
                project.periods[periodIndex].userTimesheets = [];

                return timesheetService.getTimesheet(user._id, project._id, startDate, endDate).success(function (dataTimesheet) {
                    project.periods[periodIndex].userTimesheets.push.apply(project.periods[periodIndex].userTimesheets, dataTimesheet.timesheet);
                }).then(function () {

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimesheets(project, periodIndex);
                });
            }

            function applyUserTimesheets(project, periodIndex) {
                var period = project.periods[periodIndex];

                project.periods[periodIndex].userTimesheets.forEach(function (day, index) {
                    var timesheetDayIndex = _.findIndex(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")}),
                        sameDateDays,
                        lastDayWithSameDate;

                    if (timesheetDayIndex != -1) {
                        sameDateDays = _.where(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                        lastDayWithSameDate = _.findIndex(period.timesheet, {_id: sameDateDays[sameDateDays.length - 1]._id});

                        //reset client saved data
                        delete day.color;
                        delete day.placeholder;
                        day.timePlaceholder = sameDateDays[0].timePlaceholder;

                        //if current iterated log is not the first for this date to push
                        if (project.periods[periodIndex].timesheet[timesheetDayIndex] && project.periods[periodIndex].timesheet[timesheetDayIndex].date == day.date) {
                            if (!period.timesheet[timesheetDayIndex]._id) {
                                day.isFirstDayRecord = true;
                                period.timesheet[timesheetDayIndex] = day;
                            }
                            else {
                                day.isFirstDayRecord = false;
                                day.position = day.position ? day.position : period.timesheet[timesheetDayIndex].position + 1;
                                period.timesheet.splice(lastDayWithSameDate + 1, 0, day);
                            }
                        }
                        else {
                            day.isFirstDayRecord = true;
                            if (!_.findWhere(period.timesheet, {date: day.date}).comment) {
                                _.findWhere(period.timesheet, {date: day.date}).comment = day.comment;
                            }
                            angular.extend(period.timesheet[timesheetDayIndex], day);
                        }
                    }
                });
            }

            function applyProjectDefaultValues(project) {
                if (project.defaultValues) {
                    project.defaultValues.forEach(function (day) {
                        var existedDays = $scope.getSameDateDays($scope.getCurrentLogData(), day.date);

                        if (existedDays.length && day.dayId) {
                            existedDays.forEach(function (existedDay) {
                                var assignedDayType = _.findWhere(project.dayTypes, {id: day.dayId});

                                existedDay.color = assignedDayType.color;
                                existedDay.placeholder = assignedDayType.name;

                                if (!existedDay.timePlaceholder) {
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                                if (assignedDayType.time < existedDay.timePlaceholder) {
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                            });
                        }
                    });
                }
            }

            function generateDaysTemplates(project, periodIndex) {
                var startDate = moment(new Date(project.periods[periodIndex].start)),
                    endDate = moment(new Date(project.periods[periodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days'),
                    userRole = project.assignments[0].role,
                    timePlaceholder = getTimePlaceholder(project);

                for (var i = 0; i < daysToGenerate + 1; i++) {
                    var dayToPush;

                    //TODO: to template
                    project.template.userId = user._id;
                    delete project.template.time;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
                    dayToPush.role = userRole;
                    dayToPush.isFirstDayRecord = true;
                    dayToPush.userName = user.displayName;
                    dayToPush.timePlaceholder = timePlaceholder;
                    project.periods[periodIndex].timesheet.push(dayToPush);
                }
            }

            function initWatchers(property) {
                $scope.lastSavedLogs = angular.copy($scope.logs);
                $scope.$watch(property, function (newValue, oldValue) {
                if($scope.logs.length > 1) {
                    $scope.lastSavedLogs = angular.copy(oldValue);
                }
                    updateTimelog();
                }, true);
            }

            function updateTimelog() {
                var newLogs = $scope.getCurrentLog($scope.logs),
                    oldLogs = $scope.getCurrentLog($scope.lastSavedLogs);
                if (newLogs && !oldLogs) return;

                var newLogsData = newLogs.data,
                    oldLogsData = oldLogs.data;
                if (newLogsData.length >= oldLogsData.length) {
                    var newValueToCompare = $scope.getNotEmptyLogs(newLogsData).map(function (log) {
                        return {projectId: log.projectId, time: log.time, comment: log.comment};
                    });

                    var oldValueToCompare = $scope.getNotEmptyLogs(oldLogsData).map(function (log) {
                        return {projectId: log.projectId, time: log.time, comment: log.comment};
                    });

                    if (!_.isEqual(newValueToCompare, oldValueToCompare)) {
                        var dates = $scope.getSortedLogs();

                        var timesheetToSave = angular.copy(dates);

                        timesheetToSave.map(function (log) {
                            if (log.time !== '' && log.time !== null) {
                                log.time = +log.time;
                            }
                            if (log.time == "") {
                                log.time = null;
                            }
                            return log;
                        });

                        if ($scope.timer) {
                            $timeout.cancel($scope.timer);
                        }

                        var logsToDelete = angular.copy($scope.getLogsToDelete());

                        if (logsToDelete.length || timesheetToSave.length) {
                            $scope.timer = $timeout(function () {
                                if (!$scope.activeRequest) {
                                    $scope.activeRequest = true;

                                    $scope.lastSavedLogs = angular.copy($scope.logs);

                                    timesheetService.updateTimesheet(user._id, timesheetToSave, logsToDelete).success(function (data) {
                                        var periodTimesheet = $scope.getNotEmptyDates(),
                                            noIdLog = _.find(periodTimesheet, function (log) {
                                                return !log._id;
                                            });

                                        if (noIdLog) {
                                            var index = 0;
                                            dates.forEach(function (item) {
                                                if (item.time || item.comment) {
                                                    if (!item._id) {
                                                        item._id = data.timesheet[index]._id;
                                                    }
                                                    index++;
                                                }
                                            });
                                        }

                                        Notification.success('Changes saved');

                                        $scope.activeRequest = false;

                                        if ($scope.pendingChanges) {
                                            console.log('pending changes are saving...');
                                            $scope.pendingChanges = false;
                                            updateTimelog();
                                        } else {
                                            console.log('no pending changes');
                                        }
                                    }).error(function () {
                                        $scope.activeRequest = false;
                                    });
                                }
                                else {
                                    $scope.pendingChanges = true;
                                }
                            }, 500);
                        }
                    }
                }
            }

            $scope.getSortedLogs = function () {
                var dates = $scope.getNotEmptyDates();
                return dates.sort(function (a, b) {
                    var result = 0;
                    if (a.date > b.date) {
                        result = 1;
                    }
                    if (a.date < b.date) {
                        result = -1;
                    }

                    if (!result && a.position > b.position) {
                        result = 1;
                    }
                    if (!result && a.position < b.position) {
                        result = -1;
                    }
                    return result;
                });
            };

            $scope.calcNewLogPosition = function (logs, date) {
                var sameDateDays = $scope.getSameDateDays(logs, date);

                var maxPosition = 0;

                sameDateDays.forEach(function (sameDateDay) {
                    if (sameDateDay.position > maxPosition) {
                        maxPosition = sameDateDay.position;
                    }
                });

                return maxPosition + 1;
            };

            $scope.getSameDateDays = function (logs, date) {
                return _.filter(logs, function (log) {
                    return log.date == date;
                });
            };
            // function AddTimesheetBt() {
            //     var add_timesheet = document.getElementsByClassName("add-timesheet");
            //     console.log(add_timesheet.length);
            //     for(var i; i<add_timesheet.length;i++){
            //         add_timesheet[i].onclick=function () {
            //             console.log(123);
            //         }
            //     }
            // }
            $scope.addLog = function (log) {

                var projectId = $scope.getDefaultProject()._id;
                var project = $scope.getProjectById(projectId);
                var newRow = angular.copy(project.template),
                    currentPeriod = $scope.getCurrentLogData(),
                    dayPeriodIndex = _.findIndex(currentPeriod, {date: log.date});

                newRow.date = log.date;
                newRow.userName = log.userName;
                newRow.color = log.color;
                newRow.placeholder = log.placeholder;
                newRow.timePlaceholder = getTimePlaceholder(project);
                newRow.role = log.role;
                newRow.isFirstDayRecord = false;
                newRow.position = $scope.calcNewLogPosition(currentPeriod, log.date);
                $scope.setDefaultProject(newRow);

                newRow.hasLog = true;
                newRow.isCreatedManually = true;
                currentPeriod.splice(dayPeriodIndex + $scope.getSameDateDays(currentPeriod, log.date).length, 0, newRow);

                $scope.filteredLogs = $scope.getFilteredDates();
            };
            $scope.removeRow = function (log, project, periodIndex) {
                var dates = $scope.getCurrentLogData();

                if (log._id && (log.time || log.comment)) {
                    timesheetService.removeTimesheet(log).success(function () {
                        Notification.success('Changes saved');
                    });
                }

                dates.splice(dates.indexOf(log), 1);

                $scope.filteredLogs = $scope.getFilteredDates();
                $scope.lastSavedLogs = angular.copy($scope.logs);
            };

            $scope.showPreviousPeriod = function (projects) {
                delete localStorage["redirectDate"];
                var lastPeriod = $scope.currentPeriodIndex;

                if ($scope.currentPeriodIndex) {
                    $scope.currentPeriodIndex--;

                    loadLogs(projects, lastPeriod, $scope.currentPeriodIndex);
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.showNextPeriod = function (projects) {
                delete localStorage["redirectDate"];
                var lastPeriod = $scope.currentPeriodIndex;

                if ($scope.currentPeriodIndex < projects[0].periods.length - 1) {
                    $scope.currentPeriodIndex++;

                    loadLogs(projects, lastPeriod, $scope.currentPeriodIndex);
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.showCurrentPeriod = function (projects) {
                delete localStorage["redirectDate"];
                var today = moment(),
                    lastPeriod = $scope.currentPeriodIndex;

                if (!$scope.currentDatePeriod) {
                    projects[0].periods.some(function (period, index) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));

                        if (today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')) {
                            $scope.currentDatePeriod = index;

                            return true;
                        }
                    });
                }

                var isCurrentExist = $scope.currentDatePeriod !== undefined;

                if(isCurrentExist) {
                    $scope.currentPeriodIndex = $scope.currentDatePeriod;
                    loadLogs(projects, lastPeriod, $scope.currentDatePeriod);
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            function loadLogs(projects, lastPeriod, targetPeriod) {
                var promises = [];
                projects.forEach(function (project) {
                    project.lastPeriodRecords = project.periods[lastPeriod].timesheet.length;

                    if (!project.periods[targetPeriod].timesheet) {
                        promises.push(initPeriod(project, targetPeriod));
                    }
                });

                $q.all(promises).then(function () {
                    $scope.addLogs(targetPeriod);

                    $scope.currentPeriodLogsLoaded();

                    $scope.filteredLogs = $scope.getFilteredDates();

                    blockTable();
                });
            }

            $scope.getCurrentLog = function (logs) {
                return _.findWhere(logs, {index: $scope.currentPeriodIndex});
            };
            function maxSize() {
                var maxSizeArr = document.getElementsByClassName("timesheet-hours");
                for(var i=0; i< maxSizeArr.length;i++){
                    maxSizeArr[i].setAttribute("maxlength","4");
                }
            }
            setTimeout(function () {
                maxSize();
            },200);
            $scope.getCurrentLogData = function () {
                var log = $scope.getCurrentLog($scope.logs);
                return log ? log.data : [];
            };

            $scope.getCheckedProjectFilters = function () {
                var filterProjects = _.findWhere($scope.grid.options.reportFilters, {field: "projects"});
                var checkedProjects = _.filter(filterProjects.value, {isChecked: true});
                return checkedProjects.length ? checkedProjects : filterProjects.value;
            };

            $scope.getFilteredLogs = function (logs) {
                if (!logs.length) return [];
                var checkedProjects = $scope.getCheckedProjectFilters();
                return _.filter(logs, function (logPeriod) {
                    return _.filter(checkedProjects, {_id: logPeriod.projectId}).length > 0;
                });
            };

            $scope.onSearchProjectByText = function () {
                var text = this.$parent.searchProjectByText.toLocaleLowerCase();

                var filterProjects = $scope.projects.map(function (project) {
                    return {_id: project._id, name: project.name};
                });
                $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];
                var filterProjectsByName = _.filter($scope.grid.options.reportFilters[0].value, function (filter) {
                    return filter.name.toLowerCase().startsWith(text);
                });
                $scope.grid.options.reportFilters[0].value = filterProjectsByName;
            };

            $scope.getFilteredDates = function () {
                var data = $scope.getCurrentLogData();
                var filteredLogs = $scope.getFilteredLogs(data);
                var startDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].start)),
                    endDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].end));
                if (localStorage["redirectDate"]) {
                    var endRedirectDate = $scope.startRedirectDate.split("/");
                    endRedirectDate[1] = String(Number(endRedirectDate[1])+6);
                    endRedirectDate = endRedirectDate.join("/");
                    startDate = moment(new Date($scope.startRedirectDate));
                    endDate = moment(new Date(endRedirectDate));
                }
                var daysToGenerate = endDate.diff(startDate, 'days');
                var projectId = $scope.getDefaultProject()._id;
                var project = $scope.getProjectById(projectId);
                var logs = [];
                for (var i = 0; i < daysToGenerate + 1; i++) {
                    var date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");

                    var logsOnDate = $scope.getSameDateDays(filteredLogs, date);

                    if (!logsOnDate.length) {
                        var newRow = angular.copy(project.template);
                        newRow.date = date;
                        newRow.time = null;
                        newRow.comment = null;
                        newRow._id = null;
                        newRow.isCreatedManually = false;
                        newRow.position = $scope.calcNewLogPosition(data, date);
                        newRow.timePlaceholder = getTimePlaceholder(project);
                        newRow.userName = user.displayName;

                        $scope.setDefaultProject(newRow);
                        newRow.isFirstDayRecord = $scope.isFirstDayRecord(logs, date);

                        logs.push(newRow);

                        var dayPeriodIndex = _.findIndex(data, {date: date});
                        data.splice(dayPeriodIndex + $scope.getSameDateDays(data, date).length, 0, newRow);

                        applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                    }
                    else {
                        var wasAdded = false;
                        logsOnDate.forEach(function (log, index) {
                            if (log._id || log.time || log.comment || log.isCreatedManually ||
                                (!index && $scope.isAtOrAfterIndexCreatedManuallyLog(index, logsOnDate))) {
                                log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);
                                logs.push(log);

                                applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);

                                wasAdded = true;
                            }
                        });
                        if (!wasAdded) {
                            var log = logsOnDate[0];

                            log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);

                            logs.push(log);

                            applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                        }
                    }
                }

                return logs;
            };
            $scope.isAtOrAfterIndexCreatedManuallyLog = function (index, logs) {
                for (var i = index; i < logs.length; i++) {
                    if (logs[i].isCreatedManually) {
                        return true;
                    }
                }
                return false;
            };

            $scope.getSortedProjects = function () {
                return $scope.projects.sort(function (a, b) {
                    var result = 0;
                    if (!result && a.assignments[0].workload && !b.assignments[0].workload) {
                        result = -1;
                    }
                    if (!result && !a.assignments[0].workload && b.assignments[0].workload) {
                        result = 1;
                    }
                    if (!result && a.assignments[0].workload && b.assignments[0].workload) {
                        if (!result && +a.assignments[0].workload > +b.assignments[0].workload) {
                            result = -1;
                        }
                        if (!result && +a.assignments[0].workload < +b.assignments[0].workload) {
                            result = 1;
                        }
                    }
                    if (!result && a.name > b.name) {
                        result = 1;
                    }
                    if (!result && a.name < b.name) {
                        result = -1;
                    }
                    return result;
                });
            };

            $scope.getNotEmptyLogs = function (logs) {
                return _.filter(logs, function (item) {
                    return item.time || item.comment;
                });
            };

            $scope.getNotEmptyDates = function () {
                var dates = $scope.getCurrentLogData();
                return $scope.getNotEmptyLogs(dates);
            };

            $scope.getLogsToDelete = function () {
                var dates = $scope.getCurrentLogData();
                return _.filter(dates, function (item) {
                    return !item.time && !item.comment && item._id;
                });
            };

            $scope.status = {
                isOpen: false
            };

            $scope.toggleDropdown = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.status.isOpen = !$scope.status.isOpen;
            };

            $scope.assignRole = function (role, log) {
                log.role = role;
            };

            function getTimePlaceholder(project) {
                return project ? (project.assignments[0].workload ? project.assignments[0].workload : '0') : '0';
            }

            $scope.getProjectById = function (projectId) {
                return _.findWhere($scope.projects, {_id: projectId});
            };

            $scope.assignProject = function (projectId, log) {
                var project = $scope.getProjectById(projectId);
                log.projectName = project ? project.name : '';
                log.projectId = projectId;
                log.timePlaceholder = Number(getTimePlaceholder(project));
            };

            $scope.getWeekDay = function (date) {
                return moment(new Date(date)).format("dddd");
            };

            $scope.isToday = function (date) {
                return moment(new Date(date)).isSame(new Date(), 'day');
            };

            $scope.isLastTodaysRecord = function (timesheet, index) {
                if (timesheet[index + 1]) {
                    return timesheet[index].date != timesheet[index + 1].date;
                }
            };

            $scope.getTotalLoggedTime = function () {
                return projectSummaryService.getTotalLoggedTime($scope.filteredLogs);
            };

            $scope.getTotalWorkload = function () {
                var projectsWithTime = projectSummaryService.getProjectsWithTime($scope.projects, $scope.getCurrentLogData());
                return projectSummaryService.getTotalWorkloadTime(projectsWithTime, $scope.getCurrentLogData());
            };

            $scope.watchFilterChanges = function () {
                $scope.$watch("grid.options.reportFilters", function (newValue, oldValue) {
                    $scope.filteredLogs = $scope.getFilteredDates();
                }, true);
            };

            $scope.groupDatePeriodsProjects = function (periodIndex) {
                if (!$scope.projects.length || !$scope.projects[0].periods[periodIndex].timesheet) return [];

                var allLogs = [];
                $scope.projects[0].periods[periodIndex].timesheet.forEach(function (logGroup) {
                    var logOfDate = $scope.getSameDateDays(allLogs, logGroup.date);

                    if (logOfDate.length == 0) {
                        $scope.projects.forEach(function (project) {
                            var timesheet = project.periods[periodIndex].timesheet;
                            timesheet.forEach(function (log) {
                                if (log.date == logGroup.date) {
                                    if (!log._id) {
                                        var thisDayHasLog = $scope.getSameDateDays(allLogs, log.date).length > 0;
                                        if (!thisDayHasLog && !$scope.someProjectHasLog(log.date)) {
                                            $scope.addLogToArray(log, allLogs);
                                        }
                                    }
                                    else {
                                        $scope.addLogToArray(log, allLogs);
                                    }
                                }
                            });
                        });
                    }
                });
                return allLogs;
            };

            $scope.getDefaultProject = function () {
                var checked = $scope.getCheckedProjectFilters();
                return checked.length ? checked[0] : $scope.projects[0];
            };

            $scope.setDefaultProject = function (log) {
                var project = $scope.getDefaultProject();
                log.projectId = project._id;
                log.projectName = project.name;
            };

            $scope.addLogToArray = function (log, allLogs) {
                if (!log.projectId) {
                    $scope.setDefaultProject(log);
                }

                allLogs.push(log);
            };

            $scope.isFirstDayRecord = function (allLogs, date) {
                return $scope.getSameDateDays(allLogs, date).length == 0;
            };

            $scope.someProjectHasLog = function (date) {
                var someProjectHasLog = false;
                $scope.projects.forEach(function (project) {
                    var timesheet = project.periods[$scope.currentPeriodIndex].timesheet;
                    timesheet.forEach(function (log) {
                        if (log.date == date && (log.projectId || log.time || log.comment)) {
                            someProjectHasLog = true;
                        }
                    });
                });

                return someProjectHasLog;
            };

            $scope.isStartEndPeriodSameMonth = function (period) {
                if (period) {
                    var periodStart = moment(new Date(period.start)),
                        periodEnd = moment(new Date(period.end));
                    return periodStart.format("MMM") == periodEnd.format("MMM")
                }
                return false;
            };
            $scope.dateMonth = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            $scope.getPeriodLabel = function (period) {
                if (period) {
                    var periodStart = moment(new Date(period.start)),
                        periodEnd = moment(new Date(period.end));
                    if (periodStart.format("MMM") == periodEnd.format("MMM")) {
                        periodStart = periodStart.format("DD");
                    }
                    else {
                        periodStart = periodStart.format("DD MMM");
                    }
                    periodEnd = periodEnd.format("DD MMM");
                    if (localStorage["redirectDate"]){
                        var startRedirectDate = JSON.parse(localStorage["redirectDate"]).slice(3,5);
                        $scope.startRedirectDate = JSON.parse(localStorage["redirectDate"]);
                        var monthIndex = Number(JSON.parse(localStorage["redirectDate"]).slice(0,2));
                        var monthName = $scope.dateMonth[monthIndex-1];
                        var endRedirectDate = Number(startRedirectDate) + 6;
                        if (endRedirectDate < 10){
                            endRedirectDate = "0"+endRedirectDate;
                        }
                        endRedirectDate = endRedirectDate + " " + monthName;
                        return startRedirectDate + ' - ' + endRedirectDate;
                    } else {
                        return periodStart + ' - ' + periodEnd;
                    }

                }
                else {
                    return '';
                }
            };

            $scope.userRole = preferences.get('user').role.toLowerCase();

            if ($location.$$path === "/timesheet") {
                $scope.viewUser = false;
            } else {
                $scope.viewUser = true;
            }

            $scope.locations = preferences.get('location');

            $scope.backTo = function () {
                if ($scope.locations === 'Employees') {
                    $location.path('/employees');
                } else if ($scope.locations === 'Report') {
                    $location.path('/report');
                }
            };
            $scope.approve = function (button) {
                var dates = $scope.getSortedLogs();
                var timesheetToSave = angular.copy(dates);
                timesheetToSave.forEach(function (userData) {
                    if(button === "ready") {
                        userData.readyForApprove = true;
                        userData.isreadyForApproveNeeded = true;
                        userData.Approve = false;
                    }
                    if(button === "approve") {
                        userData.Approve = true;
                        userData.readyForApprove = true;
                    }
                    if(button === "reject") {
                        userData.readyForApprove = false;
                        userData.Approve = false;
                    }
                });
                var logsToDelete = angular.copy($scope.getLogsToDelete());
                timesheetService.updateTimesheet(user._id, timesheetToSave, logsToDelete).success(function (data) {
                    Notification.success('Changes saved');
                    if(button === "ready") {
                        $scope.readonly = true;
                        $scope.approveColor = false;
                        $scope.rejectColor = false;
                    }
                    if(button === "approve") {
                        $scope.readonly = true;
                        $scope.approveColor = true;
                        $scope.rejectColor = false;
                    }
                    if(button === "reject") {
                        $scope.readonly = false;
                        $scope.approveColor = false;
                        $scope.rejectColor = true;
                    }
                }).error(function () {
                    Notification.error('Changes not saved');
                });
            };

        }]);
