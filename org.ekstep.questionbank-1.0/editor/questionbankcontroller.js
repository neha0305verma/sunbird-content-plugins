/**
 * Plugin to add questions in question set
 * @class QuestionFormController
 * Swati singh <Swati.singh@tarento.com>
 */
'use strict';
angular.module('createquestionapp', [])
  .controller('QuestionFormController', ['$scope', 'pluginInstance', function($scope, pluginInstance) {

    $scope.isQuestionTab = true;
    $scope.selectedQuestions = [];
    $scope.showConfigForm = false;
    $scope.isQuestionSetConfig = false;
    $scope.selQuestionObj = {};
    $scope.filterObj = {};
    $scope.questions = [];
    $scope.unselectedQuestions = [];
    $scope.itemRange = [];
    $scope.Totalconcepts;
    $scope.selectedConceptsData;
    $scope.grades;
    $scope.languages = [];
    $scope.difficultyLevels = ['Easy', 'Medium', 'Difficult'];
    $scope.questionTypes = ['mcq', 'ftb', 'mtf'];
    $scope.filterObj = {};
    $scope.selectedIndex;
    $scope.pluginIdObj = {
      "question_set_id": "org.ekstep.questionset",
      "question_create_id": "org.ekstep.question",
      "concepts_id": "org.ekstep.conceptselector"
    }
    $scope.csspath = ecEditor.resolvePluginResource(pluginInstance.manifest.id, pluginInstance.manifest.ver, 'editor/style.css');

    $scope.questionSetConfigObj = {
      "title": "",
      "max_score": 1,
      "allow_skip": true,
      "show_feedback": true,
      "shuffle_questions": false,
      "shuffle_options": false,
      "total_items": 1
    };

    $scope.searchQuestions = function() {
      var data = {
        request: {
          "sortOrder": [
            { "sortField": "code", "sortOrder": "ASC" }
          ]
        }
      };

      for (var key in $scope.filterObj) {
        if ($scope.filterObj.hasOwnProperty(key)){
          data.request.metadata = {};
          data.request.metadata.filters = [];
        }else{
          delete data.request.metadata;
          delete data.request.metadata.filters;
        }
      }

      // setting filters values and title to request data
      ecEditor._.forEach($scope.filterObj, function(value, key) {
        if (value) {
          switch (key) {
            case "question_title":
              data.request.metadata.filters.push({ "property": "title", "operator": "contains", "value": value });
              break;
            case "gradeLevel":
              if (value.length) {
                data.request.metadata.filters.push({ "property": "gradeLevel", "operator": "=", "value": value });
              }
              break;
            case "language":
              data.request.metadata.filters.push({ "property": "language", "operator": "=", "value": value });
              break;
            case "qlevel":
              data.request.metadata.filters.push({ "property": "qlevel", "operator": "=", "value": value });
              break;
            case "type":
              if (value.length) {
                data.request.metadata.filters.push({ "property": "type", "operator": "=", "value": value });
              }
              break;
            case "concepts":
              data.request.metadata.filters.push({ "property": "concepts", "operator": "=", "value": value });
              break;
          }
        }
      });
      ecEditor.getService('assessment').getQuestionItems(data, function(err, resp) {
        if (!err) {
          $scope.questions = resp.data.result.assessment_items;
          $scope.getUnselectedQuestionList();
          $scope.$safeApply();
        } else {
          ctrl.itemsLoading = false;
          ctrl.errorMessage = true;
          $scope.$safeApply();
          return;
        }
      });
    };

    $scope.getUnselectedQuestionList = function() {
      $scope.unselectedQuestions = _.difference($scope.questions, $scope.selectedQuestions);
    }


    /**
     *  init funtion is called when html is loaded
     *  @memberof QuestionFormController
     */
    $scope.init = function() {
      $scope.searchQuestions();
      $scope.selectedIndex = undefined;
      if (pluginInstance.editData) {
        $scope.selectedQuestions = pluginInstance.editData.data;
        $scope.questionSetConfigObj = pluginInstance.editData.config;
        $scope.isQuestionTab = false;
        $scope.isQuestionSetConfig = true;
        $scope.createTotalItemRange();
        $scope.questions = $scope.selectedQuestions.concat($scope.questions);
        for (var i = 0; i < $scope.selectedQuestions.length; i++) {
          for (var j = 0; j < $scope.questions.length; j++) {
            if ($scope.selectedQuestions[i].questionId == $scope.questions[j].questionId) {
              $scope.questions[j].isSelected = true;
            }
          }
        }
        for (var i = 0; i < $scope.selectedQuestions.length; i++) {
          for (var j = 0; j < $scope.questions.length; j++) {
            if ($scope.selectedQuestions[i].questionId == $scope.questions[j].questionId) {
              $scope.questions[j].isSelected = true;
            }
          }
        }
      }

      ecEditor.dispatchEvent($scope.pluginIdObj.concepts_id + ':init', {
        element: 'queSetConceptsTextBox',
        selectedConcepts: [], // All composite keys except mediaType
        callback: function(data) {
          $scope.Totalconcepts = data.length;
          $scope.selectedConceptsData = data;
          $scope.$safeApply();
        }
      });

      ecEditor.getService('meta').getConfigOrdinals(function(err, res) {
        if (!err) {
          $scope.grades = res.data.result.ordinals.gradeLevel;
          $scope.languages = res.data.result.ordinals.language;
          $scope.$safeApply();
        }
        ecEditor.jQuery('.ui.dropdown.lableCls').dropdown({ useLabels: false, forceSelection: false });
      });

      ecEditor.addEventListener(pluginInstance.manifest.id + ":saveQuestion", function(event, data) {
        if (!data.isSelected) {
          data.isSelected = true;
        }

        var selQueIndex = _.findLastIndex($scope.questions, {
          questionId: data.questionId
        });
        if (selQueIndex < 0) {
          $scope.questions.unshift(data);
        } else {
          $scope.questions[selQueIndex] = data;
        }
        $scope.selectQuestion(data);


      }, false);

    }

    /**
     *  creating range of number of items to display as per number of question selected
     *  @memberof QuestionFormController
     */
    $scope.createTotalItemRange = function() {
      $scope.itemRange = [];
      for (var i = 1; i <= $scope.selectedQuestions.length; i++) {
        $scope.itemRange.push(i);
      }
    }

    /**
     *  Creating list of selected questions for creating question set
     *  @memberof QuestionFormController
     */
    $scope.selectQuestion = function(selQuestion) {
      var selObjindex = $scope.selectedQuestions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.selectedQuestions.splice(selObjindex, 1);
      } else {
        $scope.selectedQuestions.unshift(selQuestion);
      }
      $scope.getUnselectedQuestionList();

    }

    /**
     *  Funtion to edit the config data of question
     *  @memberof QuestionFormController
     */
    $scope.editConfig = function(quesObj, index) {
      /*var length = $scope.selectedQuestions.length;
      for(var i =0 ; i<length; i++){
          if(quesObj.questionId != $scope.selectedQuestions.questionId){
              $scope.selectedQuestions[i].isDivSelected = false;
          }
      }
      quesObj.isDivSelected = true;*/
      $scope.selectedIndex = index;
      $scope.selQuestionObj = {};
      $scope.selQuestionObj = quesObj;
      $scope.showConfigForm = true;
    }


    /**
     *  Funtion to remove question from selected question list
     *  @memberof QuestionFormController
     */
    $scope.removeQuestion = function(selQuestion) {
      var selObjindex = $scope.selectedQuestions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.selectedQuestions.splice(selObjindex, 1);
      }
      selObjindex = $scope.questions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.questions[selObjindex].isSelected = false;
      }
      $scope.getUnselectedQuestionList();
    }


    /**
     *  Funtion to remove question from selected question list
     *  @memberof QuestionFormController
     */
    $scope.saveConfig = function() {
      /* var selectedObjIndex = _.findLastIndex($scope.selectedQuestions, {
         questionId: $scope.selQuestionObj.questionId
       });
       if (selectedObjIndex > -1) {
         $scope.selectedQuestions[selectedObjIndex] = $scope.selQuestionObj;
         $scope.showConfigForm = false;
       }*/
      selectedObjIndex = _.findLastIndex($scope.questions, {
        questionId: $scope.selQuestionObj.questionId
      });
      if (selectedObjIndex > -1) {
        $scope.questions[selectedObjIndex] = $scope.selQuestionObj;
      }

      delete $scope.questionObj;
    }

    $scope.closeConfigForm = function() {
      $scope.selQuestionObj = {};
      $scope.showConfigForm = false;
    }



    /**
     *  Funtion to save question set
     *  @memberof QuestionFormController
     */
    $scope.createQuestionSet = function() {
      $scope.questionSetConfigObj.total_items = $scope.selectedQuestions.length;
      $scope.questionSetConfigObj.max_score = $scope.selectedQuestions.length;
      $scope.isQuestionSetConfig = true;
      $scope.isQuestionTab = false;
      $scope.createTotalItemRange();
    }


    /**
     *  Funtion to add question set to editor. It dispatch an event to question set plugin for adding question set
     *  @memberof QuestionFormController
     */
    $scope.addQuestionSet = function() {
      var questionSet = {};
      var callback = pluginInstance.callback;
      questionSet.data = [];
      questionSet.config = $scope.questionSetConfigObj;
      questionSet.data = $scope.selectedQuestions;
      ecEditor.dispatchEvent($scope.pluginIdObj.question_set_id + ":addQS", { callback: callback, data: questionSet });
      $scope.closeThisDialog();
    }



    /**  Funtion to dispatch event to question creation plugin for creating new questions
     *  @memberof QuestionFormController
     */
    $scope.createQuestion = function() {
      ecEditor.dispatchEvent($scope.pluginIdObj.question_create_id + ":showpopup", {});
    }

    /**
     * [createQuestion description]
     * @return {[type]} [description]
     */
    $scope.editQuestion = function(questionObj) {
      ecEditor.dispatchEvent($scope.pluginIdObj.question_create_id + ":showpopup", questionObj);
    }

    $scope.previewItem = function(question, bool) {
      var qObj = {
        "config": "{'metadata':{'title':'question title','description':'question description','language':'English'},'max_time':0,'max_score':1,'partial_scoring':false}",
        "data": question.data.data,
        "id": "c943d0a907274471a0572e593eab49c2",
        "pluginId": question.data.plugin.id,
        "pluginVer": question.data.plugin.version,
        "templateId": "horizontalMCQ",
        "type": "unit"
      }
      var questions = [];
      var data = {
        "org.ekstep.questionset": {}
      }
      questions.push(qObj);
      data["org.ekstep.questionset"]['org.ekstep.question'] = questions;
      var confData={"contentBody":{}, "parentElement":true, "element":"#itemIframe"};
      var questionSetInstance = ecEditor.instantiatePlugin('org.ekstep.questionset.preview');
      confData.contentBody = questionSetInstance.getQuestionPreviwContent(data['org.ekstep.questionset']);
      ecEditor.dispatchEvent("atpreview:show", confData);
    }

    $scope.cancel = function() {
      $scope.closeThisDialog();
    }

    $scope.generateTelemetry = function(data, event) {
      var eventId;
      if (event.target) eventId = event.target.id;
      else eventId = event;
      if (data) ecEditor.getService('telemetry').interact({
        "type": data.type,
        "subtype": data.subtype,
        "id": data.id,
        "pageId": ecEditor.getCurrentStage().id,
        "target": {
          "id": eventId,
          "ver": "1.0",
          "type": data.type
        },
        "plugin": {
          "id": pluginInstance.manifest.id,
          "ver": pluginInstance.manifest.ver
        }
      })
    }


  }])


//# sourceURL=questionbankctrl.js