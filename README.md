# node-rdm6300-reader

A RDM6300 125KHz RFID parser

## Contents

 * [About](#about)
   * [Built With](#built-with)
 * [Getting Started](#getting-started)
   * [Prerequisites](#prerequisites)
   * [Installation](#installation)
 * [Usage](#usage)
 * [Roadmap](#roadmap)
 * [Release History](#release-history)
 * [License](#license)
 * [Contact](#contact)
 * [Acknowledgements](#acknowledgements)

## About

The node-rdm6300-reader reads and parses a RDM63x string

### Built With

* [mqtt](https://github.com/mqttjs/MQTT.js)
* [serialport](https://github.com/serialport/node-serialport)

## Getting Started

### Prerequisites

* A 125KHz RFID RDM63x module
* An USB TTL adapter
* A mqtt server

### Installation

```sh
git clone https://github.com/13/node-rdm6300-reader.git

npm install
```

## Usage

```sh
node run.js -p 'tty port'
            -m 'mqtt address'
            -t 'show timestamp'
            -v 'verbose'
```
 
## Roadmap

- [ ] ...

## Release History

* 1.0.0
    * Initial release

## Contact

* **13** - *Initial work* - [13](https://github.com/13)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Thank you
