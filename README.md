# Jitsi Meet API

This package contains a thin wrapper around the [Jitsi Meet] external
[iframe API] making it easier to use and fixing some its current shortcomings.

## Building

The `dist` directory contains prebuilt and ready to use files, if you want
to use it standalone.

If you want to use it in a web application which uses Node as the toolchain
you can install it as any other module:

    npm install

See the usage section for more details.

If you want to rebuild the distribution files after making changes, run:

    npm run build

## Usage

In a Node application:

```js
const JitsiMeet = require('jitsi-meet-api');

const meet = new JitsiMeet('https://meet.jit.si');
meet.on('ready', () => {
    const conference = meet.join('Test1234', '#meet');
    conference.on('joined', () => {
        console.log('We are in!');
    });
});
```

In a standalone HTML file: see the `examples` directory.

## API

Work in progress. Read the source for now, sorry!

## License

MIT.

[Jitsi Meet]: https://jitsi.org/Projects/JitsiMeet
[iframe API]: https://github.com/jitsi/jitsi-meet/blob/master/doc/api.md
