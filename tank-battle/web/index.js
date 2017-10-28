// Init nipplejs
const nippleManager = nipplejs.create({
  zone: document.getElementById('nipple'),
  mode: 'static',
  position: { left: '50%', top: '50%' },
  color: 'black',
  multitouch: true,
  threshold: 1
});
const socket = io();
const soundShoot = new Audio('sound/laser.mp3');
const button0 = document.getElementById('button0');
const button0ClassList = button0.classList;
let onCoolDown = false;
let shootTimeout;
let id;

// Check for vibration compatibility
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

const onLifeChange = (lives) => {
  for (let i = 1; i <= 3; i++) {
    if (i <= lives) {
      window[`life${i}`].classList.remove('hidden');
    } else {
      window[`life${i}`].classList.add('hidden');
    }
  }
};

const onMove = (event, nipple) => {
  console.log('force', nipple.force);
  console.log('angle', nipple.angle.radian);
  if (navigator.vibrate) {
    window.navigator.vibrate([50, 100, 50]);
  }

  socket.emit('joystick.moved', {
    force: nipple.force > 2 ? 2 : nipple.force,
    angle: nipple.angle.degree
  });
};

const onEnd = () => {
  console.log('stop');
  socket.emit('joystick.stopped');
};

const shoot = () => {
  if (onCoolDown) {
    return;
  }
  socket.emit('button0.clicked');
  if (!button0ClassList.contains('disabled')) {
    button0ClassList.add('disabled');
  }
  if (navigator.vibrate) {
    window.navigator.vibrate(100);
  }
  onCoolDown = true;
  console.log('button0');
  soundShoot.play();
  shootTimeout = setTimeout(() => {
    shootTimeout = undefined;
    onCoolDown = false;
    if (button0ClassList.contains('disabled')) {
      button0ClassList.remove('disabled');
    }
  }, 1000);
};

const desuscribe = () => {
  nippleManager[0].off('move', onMove);
  nippleManager[0].off('end', onEnd);
  button0.removeEventListener('touchend', shoot);
};

const restart = () => {
  if (shootTimeout) {
    setTimeout(() => {
      if (!button0ClassList.contains('disabled')) {
        button0ClassList.add('disabled');
      }
    }, 1001);
  }

  if (!button0ClassList.contains('disabled')) {
    button0ClassList.add('disabled');
  }

  desuscribe();
};

socket.on('lives', (data) => {
  onLifeChange(data.lives);
  console.log(`lives ${data.lives}`);
});

socket.on('game-over', (data) => {
  if (data.id === id) {
    console.log('Loser');
  } else {
    console.log('Winner');
  }
  restart();
  setTimeout(desuscribe, 500)
});

socket.on('game-start', (data) => {
  id = data.id;
  nippleManager[0].on('move', onMove);
  nippleManager[0].on('end', onEnd);
  button0.addEventListener('touchend', shoot);

  if (button0ClassList.contains('disabled')) {
    button0ClassList.remove('disabled');
  }
});

socket.on('disconnect', () => {
  onLifeChange(0);
  restart();
});
socket.on('rejected', () => {
  onLifeChange(0);
  restart();
});

// Start status
onLifeChange(0);
restart();
