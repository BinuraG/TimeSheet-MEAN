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

angular.module('mifortTimesheet')
    .directive('timesheetIntro', ['notifyingService', '$timeout', '$rootScope', 'appVersion', function(notifyingService, $timeout, $rootScope, appVersion) {
        return {
            scope: true,
            link: function(scope, element, attributes) {
                $timeout(function() {
                    scope.IntroOptions = {
                        steps: scope.introSteps,
                        showStepNumbers: false,
                        showBullets: true,
                        exitOnOverlayClick: true,
                        exitOnEsc: true,
                        nextLabel: 'Next',
                        prevLabel: 'Prev',
                        skipLabel: 'Skip',

                        doneLabel: 'Done'
                    };
                    scope.$watch('introSteps', function(n, o){
                        if (n !== o){
                            scope.IntroOptions.steps = n;
                        }
                    });
                    notifyingService.subscribe('startIntro', function() {
                        $('.main-container').animate({ scrollTop: 0 }, 400);
                        scope.startIntro();
                    }, scope);
                });

                scope.introExit = function () {
                    $rootScope.introIsActive = false;
                };
            },
            templateUrl: 'components/timesheetIntro/timesheetIntro.html?rel=' + appVersion
        }
    }]);
