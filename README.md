# lgtv-utils.js

<!-- toc -->

- [Installation](#installation)
- [Configuration](#configuration)
  * [`ipaddress`](#ipaddress)
  * [`maxVolume`](#maxvolume)
  * [`overstep`](#overstep)
    + [`overstep.count`](#overstepcount)
    + [`overstep.period`](#overstepperiod)
    + [`overstep.timeout`](#oversteptimeout)
- [Utils](#utils)
  * [`watcher`](#watcher)

<!-- tocstop -->

This is a small util package for WebOS based LG Smart TVs, built by using node module [`lgtv2`](https://www.npmjs.com/package/lgtv2).

For this to work, you'll have to allow _LG Connected Apps_ on your TV, see [LG Documentation](http://www.lg.com/uk/support/product-help/CT00008334-1437131798537-others) for more information.

## Installation

It is assumed that you already have `node` and `npm` installed on your system.

Clone this git repository and install dependencies:

```bash
git clone https://github.com/mgor/lgtv-utils.js.git
cd lgtv-utils.js/
npm install
```

## Configuration

An example configuration file exists in `config/example.json`:

```json
{
    "ipaddress": "192.168.0.20",
    "maxVolume": 10,
    "overstep": {
        "period": 60,
        "count": 3,
        "timeout": 120
    }
}
```

Copy the example configuration to `config/default.json` and edit the values according to your preference.

### `ipaddress`

Type: `string`

Unit: IPv4 address

The LG Smart TV IP address in your network.

### `maxVolume`

Type: `integer`

Unit: level

Maximum allowed volume level.

### `overstep`

If volume goes over `maxVolume`, `overstep.count` number of times within `overstep.period`, the TV will shutoff.  

If volume stays below `maxVolume` (after exceeding it the first time), the overstep state will be cleared after `overstep.timeout` seconds.

#### `overstep.count`

Type: `integer`

Unit: number

#### `overstep.period`

Type: `integer`

Unit: seconds

#### `overstep.timeout`

Type: `integer`

Unit: seconds

## Utils

### `watcher`

A util that will log all channel and volume changes. It will also monitor the volume level and don't allow going over a configured value. If the configured value is exceeded to many times with in a specified time period, the TV will shutoff.

To run the watcher:

```bash
cd lgtv-utils.js/
./watcher
```

Information is printed to `stdout` (colorized) and written in `log/watcher.log`

If the TV is not on, it will try to connect to it every 5 seconds, hence it will automagically connect if the TV was off when it was started.

The first time you run the util you'll have to allow it as an _LG Connected App_. The approved credentials will be stored in `credentials/`.
