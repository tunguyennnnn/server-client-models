$(document).ready(startClient);

function startClient(){
  var $select = $('#question-list').selectize({
    maxItems: 1,
    valueField: 'id',
    labelField: 'name',
  });
  var $questionField = $('#myModalLabel');
  var selectize = $select[0].selectize;
  var $logger = $('#data-logging');

  // Node
  var node;

  function compilingNW(root, data){
    let node = data[root];
    if (typeof node === "object"){
      let question = node[0], firstChoice = node[1], secondChoice = node[2];
      let firstChoiceFunc = compilingNW(firstChoice, data);
      let secondChoiceFunc = compilingNW(secondChoice, data);
      return function(){
        $questionField.text(question);
        selectize.clearOptions();
        selectize.addOption({id: firstChoice, name: firstChoice.split("-")[0]});
        selectize.addOption({id: secondChoice, name: secondChoice.split("-")[0]});
        selectize.off('item_add');
        selectize.on('item_add', function(value, $item){
          if (value === firstChoice){
            firstChoiceFunc();
          }
          else{
            secondChoiceFunc();
          }
        });
      }
    }else{
      return function(){
        $questionField.text("The answer is "  + node)
        selectize.clearOptions();
      }
    }
  }

  function progress(){
    console.log("Request is on progress");
  }

  function finished(data, time){
    $logger.text("Sent data is:\n" + data);
    console.log((new Date().getTime()) - time)
    compilingNW("root", JSON.parse(data))();
  }

  function finishedPb(data, time){
    $logger.text("Sent data is:\n" + data);
    console.log((new Date().getTime()) - time)
    protobuf.load('a.proto', function(err, root){
      data = new Uint8Array(data.replace("[", "").replace("]", "").split(","));
      var QuestionAnswer = root.lookup('questionanswer.QuestionAnswer');
      var questionAnswer = QuestionAnswer.decode(data);
      console.log(questionAnswer)
      compilePB(questionAnswer)();
    })
  }

  function compilePB(qaObject){
    if (qaObject.question !== ""){
      let firstChoiceFunc = compilePB(qaObject.next_q1);
      let secondChoiceFunc = compilePB(qaObject.next_q2);
      return function(){
        $questionField.text(qaObject.question);
        selectize.clearOptions();
        selectize.addOption({id: qaObject.answer1, name: qaObject.answer1.split("-")[0]});
        selectize.addOption({id: qaObject.answer2, name: qaObject.answer2.split("-")[0]});
        selectize.off('item_add');
        selectize.on('item_add', function(value, $item){
          if (value === qaObject.answer1){
            firstChoiceFunc();
          }
          else{
            secondChoiceFunc();
          }
        });
      }
    }
    else{
      return function(){
        $questionField.text("The answer is "  + qaObject.animal)
        selectize.clearOptions();
      }
    }
  }

  function finishedML(data, time){
    console.log(data);
    console.log((new Date().getTime()) - time);
    protobuf.load('a.proto', function(err, root){
      data = new Uint8Array(data.replace("[", "").replace("]", "").split(","));
      var QuestionAnswer = root.lookup('questionanswer.QuestionAnswer');
      var questionAnswer = QuestionAnswer.decode(data);
      if (questionAnswer.question !== ""){
        $questionField.text(questionAnswer.question);
        selectize.clearOptions();
        selectize.addOption({id: questionAnswer.answer1, name: questionAnswer.answer1.split("-")[0]});
        selectize.addOption({id: questionAnswer.answer2, name: questionAnswer.answer2.split("-")[0]});
        selectize.off('item_add');
        selectize.on('item_add', function(value, $item){
          post(window.location.href + 'animal_guessing_multi', {"answer": value}, finishedML);
        });
      }
      else{
        $questionField.text(questionAnswer.animal);
        selectize.clearOptions();
      }
    });
  }

  $('#start-game-protobuf').on('click', function(){
    createRequest(window.location.href + 'animal_guessing_pb', progress, finishedPb);
  })
  $('#start-game-json').on('click', function(){
    createRequest(window.location.href + 'animal_guessing_json', progress, finished);
  });

  $('#start-game-multi-request').on('click', function(){
    createRequest(window.location.href + 'animal_guessing_multi', progress, finishedML);
  })
}

function createRequest(url, progress, finished){
  var startTime = new Date().getTime();
  var xhr = new XMLHttpRequest(), received =0;
  xhr.open('get', url, true);
  xhr.onreadystatechange = function(){
    var result;
    if (xhr.readyState == 3){
      result = xhr.responseText.substring(received);
      received += result.length;
      progress(result);
    }
    else if (xhr.readyState == 4){
      finished(xhr.responseText, startTime)
    }
  }
  xhr.send(null);
  return xhr;
}


function post(url, message, callback){
  $.ajax({
    url: url,
    type: 'POST',
    data: message,
    success: function(data){
      console.log(data);
      callback(data);
    }
  })
}
