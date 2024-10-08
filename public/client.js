$(function () {

  var socket = io();
  var createdSelf = false;

  socket.emit('createChar');

  var wKey = 87;
  var aKey = 65;
  var sKey = 83;
  var dKey = 68;

  var eKey = 69;
  var qKey = 81;
  var shiftKey = 16;

  var controller = new Object();

  var screenX = 0;
  var screenY = 0;
  if (true) {
    var w = window;
    d = document;
    e = d.documentElement;
    g = d.getElementsByTagName('body')[0];
    x = w.innerWidth || e.clientWidth || g.clientWidth;
    y = w.innerHeight || e.clientHeight || g.clientHeight;
    screenX = x;
    screenY = y;
  }

  var gameScreenX = 5 * screenX / 6;

  const mainGUI = document.getElementById("mainGUI");

  mainGUI.style.left = gameScreenX + "px";
  mainGUI.style.top = 0 + "px";
  mainGUI.style.width = screenX / 6 + "px";
  mainGUI.style.height = screenY + "px";

  var players = [];

  var player = new Object();
  player.x = 0;
  player.y = 0;
  player.moveSpeed = 14;
  player.w = 25;
  player.h = 25;
  player.world = 'Hub';
  player.invincibility = 0;
  player.weapon = "none";
  player.mouse = {};
  player.mouse.x = 0
  player.mouse.y = 0

  var bullets = [];
  var portals = [];
  var floors = [];
  var enemies = [];
  var items = [];
  var enemyProjectiles = [];
  var particles = [];

  var invItems = [];
  var invSlots = [];

  var invItemNumber = 0;

  var pickupItem = 'none';

  var mouse;
  var isMouseDown = false;

  var bulletTimer = 0;



  //Weapon Slot
  createSlot('WeaponSlot', gameScreenX + screenX / 12 - (screenX * 0.026) / 2, screenY / 2 - (screenX * 0.026) / 2 - (screenX * 0.026) * 1.25, screenX * 0.026, screenX * 0.026, 'rgb(50, 50, 50)');

  //Extra Slots
  createSlot('Slot1', gameScreenX + screenX / 12 - (screenX * 0.026) / 2, screenY / 2 - (screenX * 0.026) / 2, screenX * 0.026, screenX * 0.026, 'rgb(0, 0, 0)');
  createSlot('Slot2', gameScreenX + screenX / 12 - (screenX * 0.026) / 2, screenY / 2 - (screenX * 0.026) / 2 + (screenX * 0.026) * 1.25, screenX * 0.026, screenX * 0.026, 'rgb(0, 0, 0)');



  function checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function createSprite(element, x, y, w, h) {
    var result = new Object();
    result.element = element;
    result.x = x;
    result.y = y;
    result.w = w;
    result.h = h;

    return result;
  }


  let camera = {
    x: 0,
    y: 0,
  }
  function setPosition(sprite) {
    if (createdSelf) {
      var e = document.getElementById(sprite.element);
      if (e !== null || undefined) {
        if (sprite.element === player.element) {
          e.style.left = player.x - camera.x + "px";
          e.style.top = player.y - camera.y + "px";
        } else {
          if (player.world === sprite.world) {
            e.style.left = sprite.x - camera.x + "px";
            e.style.top = sprite.y - camera.y + "px";
            e.style.display = 'block';
          } else {
            e.style.display = 'none';
          }
        }
      }
    }
  }
  document.onkeydown = function (evt) {
    toggleKey(evt.keyCode, true);
    if (evt.keyCode == eKey) {
      equipWeapon();

      for (i = 0; i < portals.length; i++) {
        if (portals[i].world === player.world) {
          if (checkCollision(player, portals[i])) {
            if (portals[i].world !== 'Hub') {
              socket.emit('dungeonComplete', portals[i].world);
            } else {
              player.world = portals[i].teleport;
              player.x = 0;
              player.y = 0;
              player.invincibility = 25;
            }
          }
        }
      }
    }
  };
  document.onkeyup = function (evt) {
    toggleKey(evt.keyCode, false)
  };
  document.onmousemove = function (evt) {
    mouse = createSprite('Mouse', evt.x, evt.y, 1, 1);

    var angle = Math.atan2((evt.y - screenY / 2), (evt.x - gameScreenX / 2)) * (180 / Math.PI);
    player.angle = angle;

    if (pickupItem !== 'none') {
      for (i = 0; i < invItems.length; i++) {
        if (invItems[i].element === pickupItem) {
          invItems[i].x = evt.x - invItems[i].w / 2;
          invItems[i].y = evt.y - invItems[i].h / 2;
        }
      }
    }
  };
  document.onmouseup = function (evt) {
    if (evt.which === 1) {
      isMouseDown = false;
    }
  }
  document.onmousedown = function (evt) {
    if (evt.which === 1) {
      isMouseDown = true;

      for (i = 0; i < invItems.length; i++) {
        if (checkCollision(invItems[i], mouse)) {
          if (pickupItem === 'none') {
            invItems[i].holder.isHolding = false;
            if (invItems[i].holder.element === 'WeaponSlot') {
              player.weapon = 'none';
            }

            pickupItem = invItems[i].element;
          } else {
            var gameScreen = createSprite('screen', 0, 0, gameScreenX, screenY);

            if (checkCollision(gameScreen, invItems[i])) {
              pickupItem = 'none';
              unEquipWeapon(invItems[i].element);
            } else {
              for (j = 0; j < invSlots.length; j++) {
                if (checkCollision(invSlots[j], mouse)) {
                  pickupItem = 'none';
                  invItems[i].x = invSlots[j].itemX;
                  invItems[i].y = invSlots[j].itemY;
                  invSlots[j].isHolding = true;
                  invItems[i].holder = invSlots[j];
                  if (j === 0) {
                    player.weapon = invItems[i].type;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  function bulletFiring() {
    bulletTimer++;

    if (player.weapon === 'greenOrangeMint') {
      if (bulletTimer >= 12 && isMouseDown) {
        bulletTimer = 0;
        socket.emit('createBullet', player, 'greenOrangeMint');
      }
    } else {
      if (player.weapon === 'limeLifeSaver') {
        if (bulletTimer >= 12 && isMouseDown) {
          bulletTimer = 0;
          socket.emit('createBullet', player, 'limeLifeSaver');
        }
      } else {

        if (bulletTimer >= 4 && isMouseDown) {
          bulletTimer = 0;

          if (player.weapon === 'none') {
            socket.emit('createBullet', player, 'mint');
          }
          if (player.weapon === 'mint') {
            var preAngle = player.angle;
            player.angle += Math.random() * 30 - 15;
            socket.emit('createBullet', player, 'mint');
            player.angle += Math.random() * 30 - 15;
            socket.emit('createBullet', player, 'mint');
            player.angle = preAngle;
          }
          if (player.weapon === 'lifeSaver') {
            socket.emit('createBullet', player, 'lifeSaver');
          }
          if (player.weapon === 'blueMint') {
            var preAngle = player.angle;
            player.angle = Math.random() * 360;
            socket.emit('createBullet', player, 'blueMint');
            player.angle = preAngle;
          }
          if (player.weapon === 'purpleMint') {
            socket.emit('createBullet', player, 'purpleMint');
          }

        }
      }
    }
  }

  function createSlot(element, x, y, w, h, color) {
    var slotSprite = createSprite(element, x, y, w, h);

    slotSprite.itemX = x + w / 2 - screenX * 0.0104;
    slotSprite.itemY = y + h / 2 - screenX * 0.0104;

    slotSprite.isHolding = false;

    var slot = document.createElement("div");
    slot.style.left = slotSprite.x + "px";
    slot.style.top = slotSprite.y + "px";
    slot.style.width = slotSprite.w + "px";
    slot.style.height = slotSprite.h + "px";
    slot.style.borderRadius = (screenX * 0.026) / 5 + "px";
    slot.className = "inventorySlot";
    slot.style.background = color;
    slot.id = slotSprite.element;
    document.getElementById("inventorySlots").appendChild(slot);

    invSlots[invSlots.length] = slotSprite;
  }

  function toggleKey(keyCode, isPressed) {
    if (keyCode == wKey) {
      controller.w = isPressed;
    }
    if (keyCode == aKey) {
      controller.a = isPressed;
    }
    if (keyCode == sKey) {
      controller.s = isPressed;
    }
    if (keyCode == dKey) {
      controller.d = isPressed;
    }
    if (keyCode == shiftKey) {
      controller.shift = isPressed;
    }
  }
  function handleControls() {
    var speed = 1;

    if (controller.shift) {
      speed = 0.5;
    }
    if (controller.w) {
      player.y -= player.moveSpeed * speed;
      blocker(player);
    }
    if (controller.a) {
      player.x -= player.moveSpeed * speed;
      blocker(player);
    }
    if (controller.s) {
      player.y += player.moveSpeed * speed;
      blocker(player);
    }
    if (controller.d) {
      player.x += player.moveSpeed * speed;
      blocker(player);
    }
  }

  socket.on('loadNewChar', function (value) {

    var element = document.createElement('div');
    element.className = 'player';
    //element.innerHTML = usr;
    element.id = value;
    element.style.left = '-50px';
    element.style.top = '-50px';

    if (createdSelf === false) {
      createdSelf = true;
      player.element = value;

      element.style.left = gameScreenX / 2 + 'px';
      element.style.top = screenY / 2 + 'px';
    }

    document.getElementById('playerContainer').appendChild(element);
  });

  socket.on('showPlayer', function (playerSprite) {
    if (createdSelf && playerSprite.element !== null && playerSprite.element !== undefined) {
      if ($("#" + playerSprite.element).length == 0) {
        var element = document.createElement('div');
        element.className = 'player';
        //element.innerHTML = name;
        element.id = playerSprite.element;
        document.getElementById('playerContainer').appendChild(element);
      }

      var inPlayerArray = false;
      for (i = 0; i < players.length; i++) {
        if (playerSprite.element === players[i].element) {
          inPlayerArray = true;
          players[i] = playerSprite;
        }
      }

      if (inPlayerArray === false) {
        players[players.length] = playerSprite;
      }

      document.getElementById(playerSprite.element).style.transform = 'rotate(' + playerSprite.angle + 'deg)';
    }
  });

  socket.on('delete', function (value) {
    var element = document.getElementById(value);
    if (element !== null) {
      element.style.display = 'none';
      element.parentNode.removeChild(element);
    }
  });

  socket.on('playerDungeonComplete', function (dungeon) {
    if (player.world === dungeon) {
      player.world = 'Hub';
      player.x = 0;
      player.y = 0;
    }
  });

  function bulletHandler() {
    if (createdSelf && mouse != undefined) {
      player.mouse.y = mouse.y + player.y - screenY / 2;
      player.mouse.x = mouse.x + player.x - gameScreenX / 2;
    }
    for (i = 0; i < bullets.length; i++) {

      if (createdSelf && bullets[i].element !== null) {
        if ($("#" + bullets[i].element).length == 0) {
          var element = document.createElement('div');
          element.className = bullets[i].type;
          element.id = bullets[i].element;
          document.getElementById('bulletContainer').appendChild(element);
        }
      }

      var element = document.getElementById(bullets[i].element);

      if (element !== null) {
        if (bullets[i].lifeTimer < 0) {
          element.style.display = "none";
          element.parentNode.removeChild(element);
        } else {
          element.style.transform = 'rotate(' + bullets[i].angle + 'deg)';
          setPosition(bullets[i]);
        }
      }
    }
  }

  function portalHandler() {
    for (i = 0; i < portals.length; i++) {
      if ($("#" + portals[i].element).length !== 0) {
        document.getElementById(portals[i].element).style.transform = 'rotate(' + portals[i].angle + 'deg)';
      }

      if (createdSelf && portals[i].element !== null) {
        if ($("#" + portals[i].element).length == 0) {
          var element = document.createElement("div");
          element.className = "portal";
          element.id = portals[i].element;
          //element.innerHTML = portals[i].teleport;
          element.style.left = '-50px';
          element.style.top = '-50px';
          document.getElementById('portalContainer').appendChild(element);
        }
      }

      setPosition(portals[i]);
    }
  }

  function floorHandler() {
    for (i = 0; i < floors.length; i++) {

      if (createdSelf && floors[i].element !== null) {
        if ($("#" + floors[i].element).length == 0) {
          var element = document.createElement("div");
          element.className = "floor";
          element.id = floors[i].element;
          element.style.left = '-50px';
          element.style.top = '-50px';
          if (floors[i].world == 'Hub') {
            element.style.backgroundImage = 'url(\'/assets/floorTileHub.gif\')'
          }
          document.getElementById('floors').appendChild(element);
        }
      }

      setPosition(floors[i]);
    }
  }

  function enemyHandler() {
    for (i = 0; i < enemies.length; i++) {

      if (enemies[i].element !== null) {
        if ($("#" + enemies[i].element).length == 0) {
          var element = document.createElement("div");
          element.className = enemies[i].type;
          element.id = enemies[i].element;
          element.style.left = '-50px';
          element.style.top = '-50px';
          document.getElementById('enemyContainer').appendChild(element);
        }
      }

      setPosition(enemies[i]);
      document.getElementById(enemies[i].element).style.transform = 'rotate(' + enemies[i].angle + 'deg)';

      for (j = 0; j < bullets.length; j++) {
        if (bullets[j].owner === player.element) {
          if (bullets[j].world === enemies[i].world) {
            if (checkCollision(bullets[j], enemies[i])) {
              socket.emit('deleteBullet', bullets[j].element);
              socket.emit('hurtEnemy', enemies[i].element, bullets[j]);
            }
          }
        }
      }
    }
  }

  function blocker(sprite) {
    if (sprite.preX === undefined) {
      sprite.preX = sprite.x;
      sprite.preY = sprite.Y;
    }

    var onFloor = false;

    for (i = 0; i < floors.length; i++) {
      if (sprite.world === floors[i].world) {
        if (checkCollision(sprite, floors[i])) {
          onFloor = true;
        }
      }
    }

    if (!onFloor) {
      sprite.x = sprite.preX;
      sprite.y = sprite.preY;
    }

    sprite.preX = sprite.x;
    sprite.preY = sprite.y;
  }

  function playerDamage() {

    if (player.invincibility > 0) {
      player.invincibility--;
    }

    if (player.invincibility === 0) {
      for (i = 0; i < enemies.length; i++) {
        if (player.world === enemies[i].world) {
          if (checkCollision(player, enemies[i])) {
            player.x = 0;
            player.y = 0;
            player.world = "Hub";
          }
        }
      }

      for (i = 0; i < enemyProjectiles.length; i++) {
        if (player.world === enemyProjectiles[i].world) {
          if (checkCollision(player, enemyProjectiles[i])) {
            player.x = 0;
            player.y = 0;
            player.world = "Hub";
          }
        }
      }
    }
  }

  function playerCheck() {
    for (i = 0; i < players.length; i++) {
      if ($("#" + players[i].element).length == 0) {
        var element = document.createElement('div');
        element.className = 'player';
        //element.innerHTML = usr;
        element.id = players[i].element;
        element.style.left = '-50px';
        element.style.top = '-50px';
      }
    }
  }

  function itemHandler() {
    for (i = 0; i < items.length; i++) {
      if ($("#" + items[i].element).length == 0) {
        var element = document.createElement('div');
        element.className = items[i].type + 'Dropped';
        element.id = items[i].element;
        element.style.left = '-50px';
        element.style.top = '-50px';

        document.getElementById('items').appendChild(element);
      }

      setPosition(items[i]);
    }

    for (i = 0; i < invItems.length; i++) {
      var e = document.getElementById(invItems[i].element);

      if (e !== null) {
        e.style.left = invItems[i].x + "px";
        e.style.top = invItems[i].y + "px";
      }
    }
  }

  function enemyProjectileHandler() {
    for (i = 0; i < enemyProjectiles.length; i++) {

      if (enemyProjectiles[i].element !== null) {
        if ($("#" + enemyProjectiles[i].element).length == 0) {
          var element = document.createElement("div");
          element.className = 'enemyProjectile';
          element.id = enemyProjectiles[i].element;
          element.style.left = '-50px';
          element.style.top = '-50px';
          document.getElementById('enemyContainer').appendChild(element);
        }
      }

      for (j = 0; j < bullets.length; j++) {
        if (bullets[j].owner === player.element) {
          if (bullets[j].world === enemyProjectiles[i].world) {
            if (checkCollision(bullets[j], enemyProjectiles[i])) {
              socket.emit('hurtEnemyProjectile', enemyProjectiles[i].element);
              socket.emit('deleteBullet', bullets[j].element);
            }
          }
        }
      }

      var element = document.getElementById(enemyProjectiles[i].element);

      if (element !== null) {
        if (enemyProjectiles[i].lifeTimer < 0) {
          element.style.display = "none";
          element.parentNode.removeChild(element);
        } else {
          setPosition(enemyProjectiles[i]);
          document.getElementById(enemyProjectiles[i].element).style.transform = 'rotate(' + enemyProjectiles[i].angle + 'deg)';
        }
      }
    }
  }

  //Weapon
  function equipWeapon() {
    for (s = 1; s < invSlots.length; s++) {
      if (invSlots[s].isHolding === false) {
        for (i = 0; i < items.length; i++) {
          if (checkCollision(player, items[i])) {
            //player.weapon = 'mint';

            invSlots[s].isHolding = true;

            var invItem = {};
            invItem.element = 'item' + invItemNumber;
            invItem.x = gameScreenX + screenX / 12 - (screenX * 0.0208) / 2;
            invItem.y = screenY / 2 - (screenX * 0.0208) / 2 + (screenX * 0.026) * 1.25 * (s - 1);
            invItem.w = screenX * 0.0208;
            invItem.h = screenX * 0.0208;
            invItem.holder = invSlots[s];
            invItem.type = items[i].type;

            var item = document.createElement("div");
            item.style.left = invItem.x + "px";
            item.style.top = invItem.y + "px";
            item.style.width = invItem.w + "px";
            item.style.height = invItem.h + "px";
            item.className = items[i].type + 'Item';
            item.id = 'item' + invItemNumber;

            invItemNumber++;

            document.getElementById("inventorySlots").appendChild(item);

            socket.emit('deleteItem', items[i].element);

            invItems[invItems.length] = invItem;
            break;
          }
        }
        break;
      }
    }
  }

  function unEquipWeapon(id) {
    var itemType;

    if ($("#" + id).length !== 0) {
      var element = document.getElementById(id);

      element.style.display = "none";
      element.parentNode.removeChild(element);

      for (i = 0; i < invItems.length; i++) {
        if (invItems[i].element === id) {
          itemType = invItems[i].type

          invItems.splice(i, 1);
          break;
        }
      }

      socket.emit('itemDropped', player.world, player.x, player.y, itemType);
    }
  }

  function particlesHandler() {
    for (i = 0; i < particles.length; i++) {
      if (particles[i].element !== null) {
        if ($("#" + particles[i].element).length == 0) {
          var element = document.createElement("div");
          element.className = 'hitParticle';
          element.id = particles[i].element;
          element.style.left = '-50px';
          element.style.top = '-50px';
          document.getElementById('particleContainer').appendChild(element);
        }
      }

      var element = document.getElementById(particles[i].element);

      if (particles[i].world === player.world) {
        element.style.display = "block";
      } else {
        element.style.display = "none";
      }

      if (element !== null) {
        if (particles[i].lifeTimer < 0) {
          element.style.display = "none";
          element.parentNode.removeChild(element);
        } else {
          setPosition(particles[i]);
        }
      }
    }
  }

  //Update
  socket.on('loop', function (bulletsSetter, portalsSetter, floorsSetter, enemiesSetter, itemsSetter, enemyProjectilesSetter, particlesSetter) {

    camera.x += (player.x - (gameScreenX / 2) - camera.x) / 3.0;
    camera.y += (player.y - (screenY / 2) - camera.y) / 3.0;

    bullets = bulletsSetter
    portals = portalsSetter;
    floors = floorsSetter;
    enemies = enemiesSetter;
    items = itemsSetter;
    enemyProjectiles = enemyProjectilesSetter;
    particles = particlesSetter;

    handleControls();
    bulletHandler();
    portalHandler();
    floorHandler();
    enemyHandler();
    playerDamage();
    playerCheck();
    itemHandler();
    bulletFiring();
    enemyProjectileHandler();
    particlesHandler();

    for (i = 0; i < players.length; i++) {
      setPosition(players[i]);
    }
    socket.emit('playerInfo', player, isMouseDown)
  });

  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  }, false);

});