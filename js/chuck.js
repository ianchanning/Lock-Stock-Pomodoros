/**
 * A general object for ticking a set of values up or down
 *
 * Updated with ES6 syntax
 *
 * Each tick is done on a unit (e.g. hour / minute / second)
 * And compared against all the fractions of the unit
 * e.g. seconds are fractions of a minute
 *
 * This code was based off https://github.com/kellishaver/stopwatch
 * all that is left of that are the zeroPad and hand functions
 * they've both been modifed as well, but conceptually the same
 *
 * @todo I still get confused by how this all hangs together
 */
const chuck = () => {
  "use strict";
  /**
   * The checkSum to see if the current unit should tick up or down
   *
   * This is the magic to allow all the chaining
   * It means that a larger unit will only tick
   * when all smaller factions have just 'ticked'
   *
   * Going up we know that all the values have ticked
   * if they are zero
   * Going down we know that all the values have ticked
   * if they are one less than the limit e.g. 59 seconds
   *
   * The default of null means always tick
   *
   * effectively internal state
   * we use external state from the state of the counters in the HTML elements
   * @type {Number}
   */
  let _checkSum = null;

  /**
   * What to set the value to when it overflows the limit
   * @param  {Number} limit The count at which to overflow and cycle back
   * @return {Number} zero, ignoring the limit
   */
  const _upOverflow = () => 0;

  /**
   * What to set the value to when it overflows the limit
   *
   * @todo the down overflow for the primary number should be 'limit'
   * for example t-minus goes from 10...1, but possibly it should also hit zero,
   * the counter should be left at zero after the lift off
   * but for tenths of a second counting down it goes 9...0
   * so the action happens on the transition from 1 -> 0 instead of 0 -> 9
   * for a regular clock though the tick happens from 00 -> 59
   *
   * @param  {Number}   limit        The count at which to overflow and cycle back, cannot be less than zero
   * @return {Number}
   */
  const _downOverflow = (limit) => (limit <= 0 ? 0 : limit - 1);

  /**
   * Tick up
   * @param  {Number}  unit   The current value
   * @param  {Boolean} check  Whether to tick this value up by one
   * @return {Number}         The ticked unit - this will be the same as unit unless check is true
   */
  const _countUp = (unit, check) => (check ? unit + 1 : unit);

  /**
   * Tick down
   * @param  {number}  unit   the current value
   * @param  {boolean} check  whether to tick this value down by one
   * @return {number}         the ticked unit - this will be the same as unit unless check is true
   */
  const _countDown = (unit, check) => (check ? unit - 1 : unit);

  /**
   * Wrap around
   * @param  {Number} unit     The current value
   * @param  {Number} limit    The count of how many units e.g. (gone in) 60 seconds
   * @param  {Number} overflow Where to go when you're over the limit (avoiding jail)
   * @return {Number}          The wrapped unit - this will be the same as unit unless we've gone over the limit
   */
  const _wrapUp = (unit, limit, overflow) => (unit >= limit ? overflow : unit);

  /**
   * Wrap around
   *
   * @todo in the primary number case the wrap should happen when the everything is zero except the smallest unit is 1
   *
   * @param  {Number} unit     The current value
   * @param  {Number} limit    The count of how many units e.g. (gone in) 60 seconds
   * @param  {Number} overflow Where to go when you're over the limit (avoiding jail)
   * @return {Number}          The wrapped unit - this will be the same as unit unless we've gone over the limit
   */
  const _wrapDown = (unit, limit, overflow) => (unit < 0 ? overflow : unit);

  /**
   * Whether to tick up/down
   * @param  {Number}  checkSum sum of all dependent chuck objects
   * @return {Boolean}          tick or not to tick
   */
  const _check = () =>
    typeof _checkSum === undefined || _checkSum === null || _checkSum === 0;

  /**
   * Update the internal state
   *
   * The sum being calculated here is actually
   * a sum of all the previous chained states
   * See details of _checkSum property for more info
   *
   * @param  {Number} newHand     new value after tick
   * @param  {Number} overflow    Where to go when you're over the limit
   */
  const _setCheckSum = (newHand, overflow) => {
    _checkSum += newHand - overflow;
  };

  /**
   * Change the outside world
   *
   * @param  {Object} unitElement JavaScript element
   * @param  {Object} displayHand zero padded value after tick
   */
  const _print = (unitElement, displayHand) => {
    if (unitElement.tagName === 'INPUT') {
      unitElement.value = displayHand;
    } else {
      unitElement.innerHTML = displayHand;
    }
  };

  /**
   * Get from the outside world the value of one of the clock 'hands'
   *
   * The meaning doesn't apply if you're using values
   * that aren't hours / minutes / seconds
   * But it's just getting the value for the current unit
   *
   * @param  {Object} unitElement JavaScript element
   * @return {Number}             The integer value
   */
  const _hand = (unitElement) => parseFloat(
    unitElement.tagName === 'INPUT'
      ? unitElement.value
      : unitElement.innerText
  );

  /**
   * Convert a value to a power of 10
   *
   * @todo for the main count down e.g. t-minus we want 10..01 (then blast off at 00)
   * this is also similar to the primary counter in a count down timer
   * e.g. for a 25:00 pomodoro, when you get down to 00:01 you want to transition to 25:00 again
   * but at 01:01 you want to transition to 01:00 and then to 00:59
   * for regular time count down e.g. tenth's of a second we want 9..0
   * this function can't handle both
   * to handle the t-minus/pomodoro minutes case we should use limit + 1
   *
   * @param  {Number} limit Max value for the counter
   * @return {Number}       Length of zeros for the limit
   */
  const limitLength = (limit) => Math.ceil(Math.log10(limit));

  /**
   * Pad numbers with a single zero for printing
   *
   * these functions are still confusing
   * we prepend length zeros
   * and then cut off as many zeros as newhand.length
   * zeroPad(3)(99) ---> '00099' ---> '099'
   * zeroPad(1)(99) ---> '099' ---> '9'
   *
   * @param  {Number} length  How many zeros to pad
   * @param  {Number} newHand The new value to print 0+
   * @return {String}         01, ..., 09, 10, ...
   */
  const zeroPad = (length) => (newHand) =>
    ("0".repeat(length) + newHand).slice(-length);

  /**
   * Calculate the number of zeros based on the max value
   *
   * @todo With the comments for limitLength we have an oddity for zeroPadLimit(100)(1) === '01' not '001'
   *
   * @param  {Number} limit Max value for the counter
   * @return {Number}       Zero padded limit
   */
  const zeroPadLimit = (limit) => zeroPad(limitLength(limit));

  /**
   * call the callback
   * @param  {Function} func  Callback function
   * @param  {Number} newHand new value after tick
   * @param  {Number} oldHand old value before tick
   * @return {None}
   */
  const _callback = (func, newHand, oldHand) => {
    if (typeof func == "function" && newHand != oldHand) {
      try {
        func();
      } catch (e) {
        // bury the chucker
        console.log(e);
      }
    }
  };

  /**
   * Get the unit, update it, print it and store chained state
   * This is now the central function
   * It allows passing in overflowFunc, countFunc and wrapFunc
   * to be independent of counting up / down
   *
   * @param  {Object}   unitElement  JavaScript element for getting, setting
   * @param  {Number}   limit        The count at which to overflow and cycle back, cannot be less than zero
   * @param  {Function} func         Callback function
   * @param  {Function} overflowFunc get the overflow value beyond the limit
   * @param  {Function} countFunc    the tick function
   * @param  {Function} wrapFunc     the wrap around function
   * @return {Object}                this (with updated _checkSum property)
   */
  const _controller = (
    unitElement,
    limit,
    func,
    overflowFunc,
    countFunc,
    wrapFunc
  ) => {
    const overflow = overflowFunc(limit);
    const oldHand = _hand(unitElement);
    const newHand = wrapFunc(countFunc(oldHand, _check()), limit, overflow);
    _callback(func, newHand, oldHand);
    _print(unitElement, zeroPadLimit(limit)(newHand));
    _setCheckSum(newHand, overflow);
  };
  return {
    /**
     * Stopwatch style tick up
     *
     * @param  {Object}   unitElement JavaScript element
     * @param  {Number}   limit       The count at which to overflow and cycle back
     * @param  {Function} func        Callback function for each tick of this object
     * @return {Object}               this, allow for chaining
     */
    up: function (unitElement, limit, func) {
      _controller(unitElement, limit, func, _upOverflow, _countUp, _wrapUp);
      return this;
    },
    /**
     * Timer style tick down
     *
     * @param  {Object} unitElement JavaScript element
     * @param  {Number} limit       The count at which to overflow and cycle back, cannot be less than zero
     * @return {Object}             this, allow for chaining
     */
    down: function (unitElement, limit, func) {
      _controller(
        unitElement,
        limit,
        func,
        _downOverflow,
        _countDown,
        _wrapDown
      );
      return this;
    },
    zeroPadLimit: zeroPadLimit,
    zeroPad: zeroPad,
    limitLength: limitLength,
  };
};
export { chuck };
