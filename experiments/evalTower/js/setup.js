var oldCallback;

function sendData(data) {
  console.log('sending data to mturk');
  jsPsych.turk.submitToTurk({
    'score': 0   //this is a dummy placeholder
  });
}

// Define trial object with boilerplate
function Experiment() {
  this.type = 'image-button-response',
  this.dbname = 'curiotower';
  this.colname = 'curiodrop';
  this.iterationName = 'testing';
  this.numTrials = 6; // TODO: dont hard code this, judy! infer it from the data
  this.condition = _.sample([0, 1]) == 1 ? 'interesting' : 'stable';
  this.prompt = this.condition == 'interesting' ? 'How interesting is this tower?' : 'How stable is this tower?';
};

function setupGame() {
  socket.on('onConnected', function (d) {
    // Get workerId, etc. from URL (so that it can be sent to the server)
    var turkInfo = jsPsych.turk.turkInfo();

    // These are flags to control which trial types are included in the experiment
    const includeIntro = true;
    const includeSurvey = true;
    const includeGoodbye = true;

    var gameid = d.gameid;

    console.log('insetupgame');

    var main_on_start = function (trial) {
      socket.removeListener('stimulus', oldCallback);
      oldCallback = newCallback;

      var newCallback = function (d) {
        trial.image_url = d.imageURL;
        trial.stim_version = d.stim_version;
        trial.towerID = d.towerID;
        trial.gameID = gameid
      };
      // call server for stims
      console.log('inside mainonstart');
      socket.emit('getStim', { gameID: gameid });
      socket.on('stimulus', newCallback);

    };

    // at end of each trial save data locally and send data to server
    var main_on_finish = function (data) {
      socket.emit('currentData', data);
      console.log('emitting data');
    }


    // Now construct trials list    
    var experimentInstance = new Experiment;
    var trials = _.map(_.range(experimentInstance.numTrials), function (n, i) {
      return _.extend({}, experimentInstance, {
        trialNum: i,
        on_finish: main_on_finish,
        on_start: main_on_start,
        image_url: 'URL_PLACEHOLDER',
        towerID: 'TOWERID_PLACEHOLDER',
      });
    });
    console.log('trials', trials);




    var instructionsHTML = {
      'str1': "<p> Welcome to CurioTower! </p>",
      'str2': ['<p>During this task you will see many examples of block towers. We want to know what you think of them! </p> <p> On each trial, you will see an image of a block tower. Your goal is to rate how '+experimentInstance.condition+' it is. The rating scale ranges from 1 (not ' + experimentInstance.condition+ ' at all) to 5 (extremely '+ experimentInstance.condition+'). </p> <p> Here are some example towers that should be given a score of 5 and some towers that should be given a score of 1.</p>',
        '<p>Example' + experimentInstance.condition+ ' tower with score 5: </p>',
        '<div class="eg_div"><img class="eg_img" src="assets/example-interesting.png"></div>',
        '<p>Example' + experimentInstance.condition+ ' tower with score 1: </p>',
        '<div class="eg_div"><img class="eg_img" src="assets/example-not-interesting.png"></div>'].join(' '),
      // 'str3': ['<p> If you notice any of the following, this should reduce the score you assign to that tracing:</p>',
      //     '<ul><li>Adding extra objects to the tracing (e.g. scribbles, heart, flower, smiling faces, text)<img class="notice_img" src="img/extra.png"></li>',
      //     '<li>Painting or "filling in" the reference shape, rather than tracing its outline<img class="notice_img" src="img/paint.png"></li></ul>',].join(' '),
      'str3': '<p> A different tower will appear on each trial, but there may be a few repeats or different angles. After a brief two-second delay, the buttons will become active (dark gray) so you can submit your rating. Please take your time to provide as accurate of a rating as you can.</p> </p> <img class="rating_img" src="img/rating.png">',
      'str4': "<p> When you finish, please click the submit button to finish the task. If a popup appears asking you if you are sure you want to leave the page, you must click YES to confirm that you want to leave the page. This will cause the HIT to submit. Let's begin!"
    };

    // add consent pages
    consentHTML = {
      'str1': '<p>In this HIT, you will view some towers produced by children. Your task is \
      to rate each tower on a 5-point scale. </p>',
      'str2': '<p> We expect this hit to take approximately 5-8 minutes to complete, \
      including the time it takes to read instructions.</p>',
      'str3': "<p>If you encounter a problem or error, send us an email \
      (cogtoolslab.requester@gmail.com) and we will make sure you're compensated \
      for your time! Please pay attention and do your best! Thank you!</p><p> Note: \
        We recommend using Chrome. We have not tested this HIT in other browsers.</p>",
      'str4': ["<u><p id='legal'>Consent to Participate</p></u>",
        "<p id='legal'>By completing this HIT, you are participating in a \
      study being performed by cognitive scientists in the UC San Diego \
      Department of Psychology. The purpose of this research is to find out\
      how people understand visual information. \
      You must be at least 18 years old to participate. There are neither\
      specific benefits nor anticipated risks associated with participation\
      in this study. Your participation in this study is completely voluntary\
      and you can withdraw at any time by simply exiting the study. You may \
      decline to answer any or all of the following questions. Choosing not \
      to participate or withdrawing will result in no penalty. Your anonymity \
      is assured; the researchers who have requested your participation will \
      not receive any personal information about you, and any information you \
      provide will not be shared in association with any personally identifying \
      information.</p>"
      ].join(' '),
      'str5': ["<u><p id='legal'>Consent to Participate</p></u>",
        "<p> If you have questions about this research, please contact the \
      researchers by sending an email to \
      <b><a href='mailto://cogtoolslab.requester@gmail.com'>cogtoolslab.requester@gmail.com</a></b>. \
      These researchers will do their best to communicate with you in a timely, \
      professional, and courteous manner. If you have questions regarding your \
      rights as a research subject, or if problems arise which you do not feel \
      you can discuss with the researchers, please contact the UC San Diego \
      Institutional Review Board.</p><p>Click 'Next' to continue \
      participating in this HIT.</p>"
      ].join(' ')
    };

    //combine instructions and consent
    var introMsg = {
      type: 'instructions',
        pages: [
          consentHTML.str1,
          consentHTML.str2,
          consentHTML.str3,
          instructionsHTML.str1,
          instructionsHTML.str2,
          instructionsHTML.str3,
          instructionsHTML.str4,
          // instructionsHTML.str5,
          consentHTML.str4,
          consentHTML.str5
        ],
      
      show_clickable_nav: true,
      allow_backward: true,
      delay: false,
      delayTime: 2000,
    };


    var exitSurveyChoice = {
      type: 'survey-multi-choice',
      preamble: "<strong><u>Survey</u></strong>",
      questions: [{
          prompt: "What is your sex?",
          name: "participantSex",
          horizontal: true,
          options: ["Male", "Female", "Neither/Other/Do Not Wish To Say"],
          required: true
        },
        {
          prompt: "Did you encounter any technical difficulties while completing this study? \
            This could include: images were glitchy (e.g., did not load), ability to click \
            was glitchy, or sections of the study did \
            not load properly.",
          name: "technicalDifficultiesBinary",
          horizontal: true,
          options: ["Yes", "No"],
          required: true
        }
      ],
    };

    var exitSurveyText = {
      type: 'survey-text',
      questions: [
        { prompt: "Please enter your age:"},
        { prompt: "What strategies did you use to rate the towers?" , rows: 5, columns: 40},
        { prompt: "What criteria mattered most when evaluating "+experimentInstance.condition+"?" , rows: 5, columns: 40},
        { prompt: "What criteria did not matter when evaluating "+experimentInstance.condition+"?" , rows: 5, columns: 40},
        { prompt: "Any final thoughts?" , rows: 5, columns: 40}
      ],
    };

    // add goodbye page
    var goodbye = {
      type: 'instructions',
      pages: [
        'Congrats! You are all done. Thanks for participating in our game! \
        Click NEXT to submit this HIT.'
      ],
      show_clickable_nav: true,
      allow_backward: false,
      delay: false,
      on_finish: function () {
        sendData();
      }
    };

    // add all experiment elements to trials array
    if (includeIntro) trials.unshift(introMsg);
    if (includeSurvey) trials.push(exitSurveyChoice);
    if (includeSurvey) trials.push(exitSurveyText);
    if (includeGoodbye) trials.push(goodbye);


    jsPsych.init({
      timeline: trials,
      default_iti: 1000,
      show_progress_bar: true
    });

  }); // close onConnected
} // close setup game
