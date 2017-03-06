(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events').EventEmitter;
var loadScript = require('load-script2');

var JitsiMeet = function (_EventEmitter) {
    _inherits(JitsiMeet, _EventEmitter);

    function JitsiMeet(baseUrl) {
        _classCallCheck(this, JitsiMeet);

        var _this = _possibleConstructorReturn(this, (JitsiMeet.__proto__ || Object.getPrototypeOf(JitsiMeet)).call(this));

        _this._baseUrl = new window.URL(baseUrl);
        _this._ready = false;

        setTimeout(function () {
            return _this._loadApi();
        });
        return _this;
    }

    _createClass(JitsiMeet, [{
        key: '_loadApi',
        value: function _loadApi() {
            var _this2 = this;

            if (window.JitsiMeetExternalAPI) {
                // Already loaded
                this._ready = true;
                this.emit('ready');
                return;
            }

            var apiUrl = this._baseUrl.href + 'external_api.js';

            loadScript(apiUrl, function (err) {
                if (err) {
                    console.error('Error loading external API from ' + apiUrl);
                    _this2.emit('initError');
                } else {
                    _this2._ready = true;
                    _this2.emit('ready');
                }
            });
        }
    }, {
        key: 'join',
        value: function join(room, selector, options) {
            if (!this._ready) {
                throw new Error('The library is not ready yet!');
            }
            return new JitsiMeetConference(this._baseUrl, '' + room, selector, options);
        }
    }, {
        key: 'ready',
        get: function get() {
            return this._ready;
        }
    }]);

    return JitsiMeet;
}(EventEmitter);

var JitsiMeetConference = function (_EventEmitter2) {
    _inherits(JitsiMeetConference, _EventEmitter2);

    function JitsiMeetConference(baseUrl, room, selector, options) {
        _classCallCheck(this, JitsiMeetConference);

        var _this3 = _possibleConstructorReturn(this, (JitsiMeetConference.__proto__ || Object.getPrototypeOf(JitsiMeetConference)).call(this));

        _this3._roomUrl = '' + baseUrl.href + room;

        _this3._node = typeof selector === 'string' ? document.querySelector(selector) : selector;

        // XXX Fixup config overrides
        var config = Object.assign({}, options.config);
        config.startAudioMuted = 9999; // make sure we always start unmuted
        config.startVideoMuted = 9999; // make sure we always start unmuted
        config.enableRecording = false; // fix bug when customizing toolbars
        fixupConfigObject(config);

        var interfaceConfig = Object.assign({}, options.interfaceConfig);
        fixupConfigObject(interfaceConfig);

        //
        _this3._api = new window.JitsiMeetExternalAPI(baseUrl.host, // domain
        room, undefined, // width
        undefined, // height
        _this3._node, // HTML DOM element
        config, interfaceConfig, baseUrl.protocol !== 'https:' // No SSL?
        );

        // XXX workarounds
        _this3._api.iframeHolder.style.height = '100%';
        _this3._api.iframeHolder.style.width = '100%';
        _this3._api.frame.style.border = 0;

        _this3._avatarUrl = '';
        _this3._displayName = '';
        _this3._email = '';

        _this3._audioMuted = false;
        _this3._videoMuted = false;
        _this3._shareScreen = false;

        // Setup event listeners
        _this3._api.addEventListeners({
            videoConferenceJoined: _this3._onVideoConferenceJoined.bind(_this3),
            videoConferenceLeft: _this3._onVideoConferenceLeft.bind(_this3),
            readyToClose: _this3._onReadyToClose.bind(_this3)
        });
        return _this3;
    }

    _createClass(JitsiMeetConference, [{
        key: 'hangup',
        value: function hangup() {
            this._api.hangup();
        }
    }, {
        key: 'dispose',
        value: function dispose() {
            if (this._api !== null) {
                this._api.dispose();
                this._api = null;
            }
        }
    }, {
        key: '_onVideoConferenceJoined',
        value: function _onVideoConferenceJoined() {
            this.emit('joined');
        }
    }, {
        key: '_onVideoConferenceLeft',
        value: function _onVideoConferenceLeft() {
            this.emit('left');
        }
    }, {
        key: '_onReadyToClose',
        value: function _onReadyToClose() {
            this.dispose();
        }
    }, {
        key: 'avatarUrl',
        get: function get() {
            return this._avatarUrl;
        },
        set: function set(value) {
            this._avatarUrl = value;
            this._api.executeCommand('avatarUrl', value);
        }
    }, {
        key: 'displayName',
        get: function get() {
            return this._displayName;
        },
        set: function set(value) {
            this._displayName = value;
            this._api.executeCommand('displayName', value);
        }
    }, {
        key: 'email',
        get: function get() {
            return this._email;
        },
        set: function set(value) {
            this._email = value;
            this._api.executeCommand('email', value);
        }
    }, {
        key: 'roomUrl',
        get: function get() {
            return this._roomUrl;
        }
    }, {
        key: 'audioMuted',
        get: function get() {
            return this._audioMuted;
        },
        set: function set(muted) {
            if (this._audioMuted === muted) {
                return;
            }

            this._audioMuted = muted;
            this._api.executeCommand('toggleAudio');
        }
    }, {
        key: 'videoMuted',
        get: function get() {
            return this._videoMuted;
        },
        set: function set(muted) {
            if (this._videoMuted === muted) {
                return;
            }

            this._videoMuted = muted;
            this._api.executeCommand('toggleVideo');
        }
    }, {
        key: 'shareScreen',
        get: function get() {
            return this._shareScreen;
        },
        set: function set(share) {
            if (this._shareScreen === share) {
                return;
            }

            this._shareScreen = share;
            this._api.executeCommand('toggleShareScreen');
        }
    }]);

    return JitsiMeetConference;
}(EventEmitter);

function fixupConfigObject(config) {
    for (var key in config) {
        if (typeof key !== 'string') {
            continue;
        }
        try {
            config[key] = encodeURIComponent(JSON.stringify(config[key]));
        } catch (e) {
            console.warn('Error encoding ' + key + ': ' + e);
            delete config[key];
        }
    }
}

module.exports = JitsiMeet;

// Export also to the window object if running in a browser.
if (typeof window !== 'undefined') {
    window.JitsiMeet = JitsiMeet;
}

},{"events":2,"load-script2":3}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
module.exports = load

function load (src, cb) {
  var head = document.head || document.getElementsByTagName('head')[0]
  var script = document.createElement('script')

  script.type = 'text/javascript'
  script.async = true
  script.src = src

  if (cb) {
    script.onload = function () {
      script.onerror = script.onload = null
      cb(null, script)
    }
    script.onerror = function () {
      script.onerror = script.onload = null
      cb(new Error('Failed to load ' + src), script)
    }
  }

  head.appendChild(script)
}

},{}]},{},[1]);
