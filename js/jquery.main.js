// the dogiest ever example of mixing jQuery  and ES6...
// the jQuery will disappear...
import { chuck } from './chuck.js';
(function ($) {
  $.fn.chker = function () {
    var timer = $(this);
    var timerId = 0;
    var tickInterval = 1000;
    var appName = 'Lock Stock Pomodoros';
    var siteName = 'ianchanning';

    var mm = document.querySelector('.min');
    var ss = document.querySelector('.sec');
    var pp = document.querySelector('.pomo');
    var start = timer.find('.start');
    var stop = timer.find('.stop');

    var defaultFile = 'bacon';
    var alarm = document.getElementById('alarm');

    var queryString = function () {
      return location.search;
    };

    var quotesFile = function () {
      return queryString() ? queryString().substr(1) : defaultFile;
    };

    var fileName = quotesFile();
    var quotes;

    $.get('quotes/' + fileName + '.txt', function (data) {
      quotes = Hjson.parse('[' + data + ']');
    });

    $('.clock a').removeClass('active');
    $(".clock a[href='?" + fileName + "']").addClass('active');

    Notification.requestPermission();

    /**
     * Start the timer
     *
     * Primary method that calls `updateTimer` each second
     */
    var startTimer = function () {
      // prevent spamming the link
      if (timerId === 0) {
        timerId = setInterval(updateTimer, tickInterval);
        timer.addClass('ticking');
      }
    };

    /**
     * Stop the timer
     */
    var stopTimer = function () {
      clearInterval(timerId);
      timerId = 0;
      timer.removeClass('ticking');
    };

    start.click(startTimer);
    stop.click(stopTimer);

    /**
     * display the timer in the title
     */
    var updateTitle = function () {
      document.title =
        timer.find('.time').text() + ' - ' + appName + ' : ' + siteName;
    };

    /**
     * Use the chk jQuery plugin as Pomodoro timer
     *
     * This function needs to be called once per second
     *
     * Tick down 60 seconds,
     * then down 25 minutes
     * and then up to 100 pomodoros
     *
     * The state is stored in the HTML elements within the span.time element
     *
     */
    var chkIt = function () {
      chuck()
        .down(ss, 60) // seconds
        .down(mm, 25) // minutes
        .up(pp, 100, randomNotification); // pomodoros
    };

    /**
     * Timer callback
     *
     * Primary ticking function
     */
    var updateTimer = function () {
      chkIt();
      updateTitle();
    };

    /**
     * Convert the first letter of each word to upper case
     * @param  {string} str Lower case string
     * @return {string}
     */
    var ucwords = function (str) {
      return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    };

    var quoter = function (fileName) {
      var file = fileName.split('.');
      return ucwords(file[0].replace(/_/g, ' '));
    };

    var randomNotification = function () {
      // don't stop after the first notification
      if (parseInt(pp.innerText) >= 1) {
        stopTimer();
      }

      alarm.play();

      var randomQuote = quoteChooser();
      var options = {
        body: randomQuote,
      };

      var n = new Notification(quoter(fileName) + ' says', options);
      setTimeout(n.close.bind(n), 10000);

      $('.notifications').prepend(formatQuote(randomQuote, quoter(fileName)));
    };

    /**
     * Generate the HTML for a quote
     * @param  {string} quote   The raw quote
     * @param  {string} speaker Name of the quoter
     * @return {string}         HTML with paragraph and quoter beneath
     */
    var formatQuote = function (quote, speaker) {
      // format single quotes nicely
      var prettyQuote = quote.replace(/'/g, '&rsquo;');

      var now = new Date();
      // Options for a nicely formatted time: 12-hour format with hours, minutes
      var timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
      var formattedTime = now.toLocaleTimeString('en-US', timeOptions);

      // Append the time to the speaker name, wrapped in a span for easy styling
      return (
        '<blockquote>' +
        prettyQuote +
        '<figcaption>&mdash; ' +
        speaker +
        ' <span class="quote-time">@ ' +
        formattedTime +
        '</span></figcaption></blockquote>'
      );
    };

    var quoteChooser = function () {
      var randomNumber = Math.floor(Math.random() * quotes.length);
      var quote = quotes[randomNumber];
      return quote;
    };
  };

  $('#chker').chker();

  var checkToggle = function (stopButton, startButton) {
    return $('#chker').hasClass('ticking') ? stopButton : startButton;
  };

  var myToggle = function (myButton) {
    myButton.click().focus().toggleClass('button-activated');
  };

  var myActive = function (myButton) {
    myButton.toggleClass('button-activated');
  };

  $(document).keydown(function (event) {
    if (event.keyCode == '32') {
      // space bar
      event.preventDefault(); // the default being scroll the page down
      myActive(checkToggle($('#chker .stop'), $('#chker .start')));
    }
  });

  $(document).keyup(function (event) {
    if (event.keyCode == '32') {
      // space bar
      event.preventDefault();
      myToggle(checkToggle($('#chker .stop'), $('#chker .start')));
    }
  });

  $('#reminder').click(function () {
    if ($(this).text() === '+') {
      $('.reminder').fadeIn('slow');
      $(this).html('&times;');
    } else {
      $('.reminder').fadeOut('slow');
      $(this).html('+');
    }
  });
})(jQuery);
