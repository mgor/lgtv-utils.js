'use strict';

const config = require('config');
const moment = require('moment');
const winston = require('winston');
const lgtv = require('lgtv2')({
    url: 'ws://'+ config.ipaddress +':3000',
    timeout: 5000,
    keyFile: './credentials/lgtv-'
});

winston.loggers.add('standard', {
    console: {
        level: 'silly',
        colorize: true,
        timestamp: function() { return moment().format(); }
    },
    file: {
        filename: './log/watcher.log',
        level: 'silly',
        timestamp: function() { return moment().format(); },
        json: false
    }
});

const log = winston.loggers.get('standard');

var runtime = {
    graceTimeout: undefined,
    connected: false,
    from: {
        volume: {
            level: undefined,
            muted: undefined
        },
        channel: {
            number: undefined,
            name: undefined
        }
    },
    overstep: {
        started: undefined,
        count: 0
    }
};

function getTimestamp() {
    return moment(new Date()).unix();
}

lgtv.on('connect', function() {
    log.info('connected');
    runtime.connected = true;

    lgtv.subscribe('ssap://audio/getVolume', function(error, response) {
        if (error) {
            log.error(error);
        } else {
            if (runtime.from.volume.muted !== response.muted && runtime.from.volume.muted !== undefined && response.muted) {
                response.volume = 'muted';
            }

            if (runtime.from.volume.level !== response.volume && runtime.from.volume.level !== undefined && runtime.overstep.started === undefined) {
                log.info('volume changed: '+ runtime.from.volume.level +' -> '+ response.volume);
            }

            runtime.from.volume = {
                muted: response.muted,
                level: response.volume
            };

            var now = getTimestamp();

            if (response.volume > config.maxVolume) {
                runtime.overstep.count++;

                lgtv.request('ssap://audio/setVolume', {volume: config.maxVolume});

                log.warn('forced volume to allowed max level, ' + runtime.overstep.count + ' time');

                if (runtime.overstep.started === undefined) {
                    runtime.overstep.started = getTimestamp();
                } else {
                    if (runtime.overstep.count >= config.overstep.count && (now - runtime.overstep.started) < config.overstep.period) {
                        log.error('turning off TV, volume changed over allowed max too many times');

                        if (runtime.graceTimeout !== undefined) {
                            clearTimeout(runtime.graceTimeout);
                        }

                        lgtv.request('ssap://system/turnOff', function (error, response) {
                            lgtv.disconnect();
                            runtime.connected = false;
                            process.exit(1);
                        });
                    }
                }

                if (runtime.graceTimeout === undefined) {
                    log.info('started timeout for clearing');
                    runtime.graceTimeout = setTimeout(function () {
                        if (runtime.overstep.started !== undefined) {
                            log.info('grace time passed, clear overstep counter');
                            runtime.overstep = {
                                started: undefined,
                                count: 0
                            };
                        }
                        runtime.graceTimeout = undefined;
                    }, (config.overstep.timeout * 1000));
                }
            }
        }
    });

    lgtv.subscribe('ssap://tv/getCurrentChannel', function(error, response) {
        if (error) {
            log.error(error);
        } else {
            if (runtime.from.channel.number !== response.channelNumber && runtime.from.channel.number !== undefined) {
                log.info('channel changed: '+ runtime.from.channel.name +' ('+ runtime.from.channel.number +') -> '+ response.channelName.trim() +' ('+ response.channelNumber +')');
            }

            runtime.from.channel = {
                number: response.channelNumber,
                name: response.channelName.trim()
            };
        }
    });
});

process.on('uncaughtException', function(error) {
    if (runtime.connected) {
        log.info('disconnected');
    }
    process.exit(1);
});
