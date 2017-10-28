const five = require('johnny-five');
const EtherPort = require('etherport');

/**
 * Instantiates the motors on corresponding hardware pins
 */
const tankMotors = (board) => {
  // pins [software], // [adrduino uno] | [node mcu]
  const left = new five.Motor({
    board,
    pins: {
      pwm: '14', // 5 | D5
      dir: '15', // 7 | D8
      cdir: '13' // 6 | D7
    }
  });

  const right = new five.Motor({
    board,
    pins: {
      pwm: '12', // 10 | D6
      dir: '0', // 8 | D3
      cdir: '2' // 9 | D4
    }
  });

  const stop = () => {
    left.fwd(0);
    right.fwd(0);
  };

  return {
    left,
    right,
    stop
  };
};

// pins [software], // [adrduino uno] | [node mcu]
const shotSensor = board => new five.Sensor.Digital({
  board,
  pin: '16' // ? | D0
});

/**
 * Instanciates a johnny five board on the specified port
 * @param {number} port port number where the nodemcu is gonna connect
 */
const getTanks = (ports) => {
  const fiveBoards = new five.Boards(ports.map(port => ({
    id: `port-${port}`,
    port: new EtherPort(port),
    timeout: 300
  })));

  const tanksPromise = new Promise((resolve, reject) => {
    fiveBoards.on('ready', function boardsReady() {
      console.log('tanks ready');
      const boards = [];
      this.each((board) => {
        boards.push(board);
      });
      resolve(boards);
    })//.on('fail', (a, b) => {
    //  throw new Error(a, b)
    //});
  });

  return tanksPromise.then((boards) => {
    const tanks = boards.map(board => ({
      board,
      motors: tankMotors(board),
      shotSensor: shotSensor(board)
    }));

    return tanks;
  });
};

module.exports = getTanks;
