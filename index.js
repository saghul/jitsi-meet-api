const EventEmitter = require('events').EventEmitter;
const loadScript = require('load-script2');


class JitsiMeet extends EventEmitter {
    constructor(baseUrl) {
        super();

        this._baseUrl = new window.URL(baseUrl);
        this._ready = false;

        setTimeout(() => this._loadApi());
    }

    _loadApi() {
        if (window.JitsiMeetExternalAPI) {
            // Already loaded
            this._ready = true;
            this.emit('ready');
            return;
        }

        const apiUrl = `${this._baseUrl.href}external_api.js`;

        loadScript(apiUrl, err => {
            if (err) {
                console.error(`Error loading external API from ${apiUrl}`);
                this.emit('initError');
            } else {
                this._ready = true;
                this.emit('ready');
            }
        });
    }

    get ready() {
        return this._ready;
    }

    join(room, selector, options) {
        if (!this._ready) {
            throw new Error('The library is not ready yet!');
        }
        return new JitsiMeetConference(this._baseUrl, ''+room, selector, options);
    }
}


class JitsiMeetConference extends EventEmitter {
    constructor(baseUrl, room, selector, options) {
        super();

        this._roomUrl = `${baseUrl.href}${room}`;

        this._node = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        // XXX Fixup config overrides
        const config = Object.assign({}, options.config);
        config.startAudioMuted = 9999;      // make sure we always start unmuted
        config.startVideoMuted = 9999;      // make sure we always start unmuted
        config.enableRecording = false;     // fix bug when customizing toolbars
        fixupConfigObject(config);

        const interfaceConfig = Object.assign({}, options.interfaceConfig);
        fixupConfigObject(interfaceConfig);

        //
        this._api = new window.JitsiMeetExternalAPI(
            baseUrl.host,                  // domain
            room,
            undefined,                     // width
            undefined,                     // height
            this._node,                    // HTML DOM element
            config,
            interfaceConfig,
            baseUrl.protocol !== 'https:'  // No SSL?
        );

        // XXX workarounds
        this._api.iframeHolder.style.height = '100%';
        this._api.iframeHolder.style.width = '100%';
        this._api.frame.style.border = 0;

        this._avatarUrl = '';
        this._displayName = '';
        this._email = '';

        this._audioMuted = false;
        this._videoMuted = false;
        this._shareScreen = false;

        // Setup event listeners
        this._api.addEventListeners({
            videoConferenceJoined : this._onVideoConferenceJoined.bind(this),
            videoConferenceLeft: this._onVideoConferenceLeft.bind(this),
            readyToClose: this._onReadyToClose.bind(this)
        });
    }

    get avatarUrl() {
        return this._avatarUrl;
    }

    set avatarUrl(value) {
        this._avatarUrl = value;
        this._api.executeCommand('avatarUrl', value);
    }

    get displayName() {
        return this._displayName;
    }

    set displayName(value) {
        this._displayName = value;
        this._api.executeCommand('displayName', value);
    }

    get email() {
        return this._email;
    }

    set email(value) {
        this._email = value;
        this._api.executeCommand('email', value);
    }

    get roomUrl() {
        return this._roomUrl;
    }

    get audioMuted() {
        return this._audioMuted;
    }

    set audioMuted(muted) {
        if (this._audioMuted === muted) {
            return;
        }

        this._audioMuted = muted;
        this._api.executeCommand('toggleAudio');
    }

    get videoMuted() {
        return this._videoMuted;
    }

    set videoMuted(muted) {
        if (this._videoMuted === muted) {
            return;
        }

        this._videoMuted = muted;
        this._api.executeCommand('toggleVideo');
    }

    get shareScreen() {
        return this._shareScreen;
    }

    set shareScreen(share) {
        if (this._shareScreen === share) {
            return;
        }

        this._shareScreen = share;
        this._api.executeCommand('toggleShareScreen');
    }

    hangup() {
        this._api.hangup();
    }

    dispose() {
        if (this._api !== null) {
            this._api.dispose();
            this._api = null;
        }
    }

    _onVideoConferenceJoined() {
        this.emit('joined');
    }

    _onVideoConferenceLeft() {
        this.emit('left');
    }

    _onReadyToClose() {
        this.dispose();
    }

}


function fixupConfigObject(config) {
    for (const key in config) {
        if (typeof key !== 'string') {
            continue;
        }
        try {
            config[key] = encodeURIComponent(JSON.stringify(config[key]));
        } catch (e) {
            console.warn(`Error encoding ${key}: ${e}`);
            delete config[key];
        }
    }
}


module.exports = JitsiMeet;

// Export also to the window object if running in a browser.
if (typeof window !== 'undefined') {
    window.JitsiMeet = JitsiMeet;
}
