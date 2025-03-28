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

    var files = [
      'bacon.txt',
      'bacon.txt',
      'eddie.txt',
      'soap.txt',
      'tom.txt',
      'rory_breaker.txt',
    ];
    var alarm = document.getElementById('alarm');

    var queryString = function () {
      return window.location.search;
    };

    var param = function (key) {
      var urlParams = new URLSearchParams(queryString());
      return urlParams.get(key);
    };

    var quotesFile = function () {
      return files[
        parseInt(
          param('quote') ? param('quote') : Math.random() * (files.length - 1)
        )
      ];
    };

    var shouldPlaySound = function () {
      return !['true', '1', ''].includes(param('silent'));
    };

    // :scream: Validate your inputs son...
    var loadQuotes = function (fileName) {
      // 1. Check for null or undefined
      if (!fileName) {
        console.error('Filename is missing.');
        return [];
      }

      // 2. Check for potentially malicious characters (Defense in Depth)
      const forbiddenCharacters = /[^\w\-.]/; // Allow only alphanumeric, dash, underscore, and dot
      if (forbiddenCharacters.test(fileName)) {
        console.error('Invalid characters in filename.');
        return [];
      }

      // 3. Check for ".." sequences (Defense in Depth)
      if (fileName.includes('..')) {
        console.error('Directory traversal attempt detected.');
        return [];
      }

      // 4. Check file extension (Defense in Depth)
      if (!fileName.endsWith('.txt')) {
        console.error('Invalid file extension.  Only .txt files are allowed.');
        return [];
      }

      // If all checks pass (Defense in Depth - Client Side. SERVER SIDE is key)
      $.get('quotes/' + fileName, function (data) {
        try {
          return Hjson.parse('[' + data + ']');
        } catch (error) {
          console.error('Error parsing Hjson:', error);
          // Handle the parsing error gracefully (e.g., display an error message)
          return [];
        }
      }).fail(function (_, textStatus, errorThrown) {
        console.error('get failed:', textStatus, errorThrown);
        // Handle the AJAX error (e.g., display an error message)
        return [];
      });
    };

    var fileName = quotesFile();
    var quotes;

    // :scream: Validate your inputs son...
    $.get('quotes/' + fileName, function (data) {
      quotes = Hjson.parse('[' + data + ']');
    });

    $(".tabs a[href*='?quote=" + param('quote') + "']").addClass('active');

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
      var timerText = Array.from(document.querySelector('.time').childNodes)
        .filter((node) => node.tagName !== 'A')
        .map((node) => node.value || node.textContent.trim())
        .join(' ');
      document.title = timerText + ' - ' + appName + ' : ' + siteName;
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
      if (parseInt(pp.value) >= 1) {
        stopTimer();
      }

      if (shouldPlaySound()) {
        alarm.play();
      }

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
        '<blockquote>&ldquo;' +
        prettyQuote +
        '&rdquo;<figcaption>&mdash; says ' +
        speaker +
        ' <cite>@ ' +
        formattedTime +
        '</cite></figcaption></blockquote>'
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
