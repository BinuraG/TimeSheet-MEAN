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

angular.module('mifortTimesheet.employees', ['ngRoute', 'constants'])

    .config(['$routeProvider', 'appVersion', function($routeProvider, appVersion) {
        $routeProvider.when('/employees', {
            templateUrl: 'employees/employeesView.html?rel=' + appVersion,
            controller: 'employeesController'
        });
    }])

    .controller('employeesController', ['$scope', '$uibModal', '$timeout', 'employeesService', 'preferences', '$location', 'Notification','notifyingService','$rootScope', 'appVersion',
        function($scope, $uibModal, $timeout, employeesService, preferences, $location, Notification, notifyingService, $rootScope, appVersion) {
            var companyId = preferences.get('user').companyId;

            $scope.path = $location.path();

            employeesService.getCompanyEmployers(companyId).success(function(employees) {
                employees.forEach(function(employee) {
                    if(employee.external && employee.external.photos.length){
                        employee.photo = employee.external.photos[0].value.split("?")[0] + '?sz=132';
                    }

                    employee.isCollapsed = true;
                });

                $scope.employees = employees;
                $scope.setIntroSteps();
            });

            $scope.setIntroSteps = function() {
                $timeout(function(){
                    $scope.introSteps = [
                        {
                            element: angular.element(".employee-card")[0],
                            intro: "<p>In this section you can enter information to find specific employee.</p>" +
                            "<p>Press enter key or <b>“Search”<b> button to show employees that were found.</p>",
                            position: 'right'
                        },
                        {
                            element: angular.element("section.employee-card")[0],
                            intro: "<p>Here you can see information about particular employee.</p>" +
                            "<p>Click on this section to open timesheet of appropriate user.</p>",
                            position: 'left'
                        },
                        {
                            element: angular.element(".add-project-wrapper")[0],
                            intro: "<p>You can invite a new employee by pressing this button.</p>",
                            position: 'auto'
                        }
                    ];
                });
            };

            $scope.getInitials = function(name) {
                var initials = name.match(/\b\w/g);
                initials = (initials.shift() + initials.pop()).toUpperCase();
                 return initials;
            };

            $scope.calculateWorkload = function(employee) {
                var totalWorkload = 0;

                if(employee.assignments){
                    employee.assignments.forEach(function(assignment) {
                        if (!assignment.archived) {
                            totalWorkload += +assignment.workload;
                        }
                    });
                }

                return totalWorkload;
            };

            $scope.searchEmployees = function(employeeSearch) {
                //delete fields from filter so angular will use it's native search correctly(so it won't leave the empty search properties)
                for(var field in employeeSearch){
                    if(!employeeSearch[field].length
                        && (!angular.isObject(employeeSearch[field]) || employeeSearch[field].projectName === '')){
                        delete employeeSearch[field];
                    }
                }

                $scope.activeSearch = angular.copy(employeeSearch);
            };

            $scope.clearSearch = function() {
                $scope.employeeSearch = {};
                $scope.activeSearch = {};
            };

            $scope.hasArchivedProjects = function(assignments) {
                return _.findWhere(assignments, {archived: true});
            };

            $scope.editEmployeeTimesheet = function(userId) {
                $scope.locations = localStorage.setItem('location','Employees');
                $location.path('timesheet/' + userId);
                // window.location.reload();
            };

            $scope.user = preferences.get('user');

            $scope.company = {
                _id: companyId,
                emails: []
            };

            function getEmployees(){
                employeesService.getCompanyEmployers($scope.user.companyId).success(function(employees) {
                    employees.forEach(function(employee) {
                        if(employee.external && employee.external.photos.length){
                            employee.photo = employee.external.photos[0].value.split("?")[0] + '?sz=132';
                        }

                        employee.isCollapsed = true;
                    });

                    $scope.employees = employees;
                });
            }

            $scope.inviteEmployees = function() {
                employeesService.saveCompany($scope.company).success(function () {
                    getEmployees();
                    $scope.company.emails = [];
                    Notification.success('Changes saved');
                });
            };

            $scope.$watch('company.emails', function (newValue) {
                if (newValue && typeof newValue == 'string') {
                    $scope.company.emails = newValue.split(/[\s,]+/);
                }
            }, true);

            $scope.removeEmployee = function (employee) {
                var modalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: './employees/confirmDeleteModal/confirmDeleteModal.html?rel=' + appVersion,
                    controller: 'confirmDeleteEmployeeModal',
                    windowClass: "confirm-delete-company-modal",
                    resolve: {
                        employeeName: function () {
                            return employee.displayName
                        }
                    }
                });

                modalInstance.result.then(function(isConfirmed){
                    if (isConfirmed) {
                        $scope.employees = _.filter($scope.employees, function(companyEmployee){
                            return companyEmployee._id !== employee._id;
                        });
                        employeesService.removeEmployee(employee._id).success(function() {
                            Notification.success('Changes saved');
                        });
                    }
                });
            };

            $scope.clearInvite = function() {
                $scope.company.emails = [];
            };

        }]);
