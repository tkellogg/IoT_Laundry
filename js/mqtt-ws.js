var MqttIOBridge, Subscriber;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
Subscriber = (function() {
  function Subscriber(topic, qos) {
    this.topic = topic;
    this.qos = qos;
  }
  return Subscriber;
})();
MqttIOBridge = (function() {
  function MqttIOBridge(server, port, username, password, clientid, cleansession, lwtTopic, lwtPayload, lwtQos, subs, iframeId) {
    this.server = server;
    this.port = port;
    this.username = username;
    this.password = password;
    this.clientid = clientid;
    this.cleansession = cleansession;
    this.lwtTopic = lwtTopic;
    this.lwtPayload = lwtPayload;
    this.lwtQos = lwtQos;
    this.websocket;
    this.connected;
    this.retry = true;
    this.subs = subs;
    this.callbackfunc;
    this.bridgeId;
    this.iframeId = iframeId;
    this.cometconnection = false;
    this.haPoll();
  }
  MqttIOBridge.prototype.haPoll = function() {
    return setInterval((__bind(function() {
      return this.sendPing();
    }, this)), 25 * 1000);
  };
  MqttIOBridge.prototype.sendPing = function() {
    var command;
    if (this.websocket) {
      command = 'PING<--';
      return this.doSend(command + 'pinging<--|<--|');
    }
  };
  MqttIOBridge.prototype.isConnected = function() {
    var command;
    if (this.websocket) {
      command = "CHECK<--";
      return this.doSend(command + "is connected?<--|<--|");
    } else {
      return this.connected = false;
    }
  };
  MqttIOBridge.prototype.doSend = function(message) {
    var me;
    me = this;
    if (this.cometconnection) {
      return $.ajax({
        url: '/cometIn',
        type: 'POST',
        data: {
          data: message,
          kod: me.bridgeId
        },
        success: function(data, status, response) {},
        error: function() {}
      });
    } else {
      return this.websocket.send(message);
    }
  };
  MqttIOBridge.prototype.subscribe = function(topic, qos) {
    var command;
    command = "SUBSCRIBE<--";
    if (!qos) {
      qos = 0;
    }
    return this.doSend(command + topic + "<--" + qos + "<--|");
  };
  MqttIOBridge.prototype.publish = function(topic, payload, qos) {
    var command;
    command = "PUBLISH<--";
    if (!qos) {
      qos = 0;
    }
    return this.doSend(command + topic + "<--" + qos + "<--" + payload);
  };
  MqttIOBridge.prototype.disconnect = function() {
    var command, me;
    me = this;
    if (this.cometconnection) {
      $('#' + me.iframeId).html('');
      command = "DISCONNECT<--";
      return this.doSend(command + "disconnect<--|<--|");
    } else if (this.websocket) {
      this.websocket.close();
      return this.websocket = null;
    }
  };
  MqttIOBridge.prototype.makeid = function() {
    var i, possible, text;
    text = "";
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  MqttIOBridge.prototype.onmessage = function(data) {
    var callback, sub, _i, _len, _ref;
    callback = this.callbackfunc;
    if (typeof String.prototype.startsWith !== 'function') {
      String.prototype.startsWith = function(str) {
        return this.slice(0, str.length) === str;
      };
    }
    if (typeof String.prototype.endsWith !== 'function') {
      String.prototype.endsWith = function(str) {
        return this.slice(-str.length) === str;
      };
    }
    if (data.startsWith("-->CONNECTED")) {
      this.connected = true;
      if (this.subs) {
        _ref = this.subs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          this.subscribe(sub.topic, sub.qos);
        }
        return callback(data);
      }
    } else if (data.startsWith("-->LOSTCONNECT")) {
      return callback(data);
    } else if (data.startsWith("-->EXCEPTION")) {
      return callback(data);
    } else if (data.startsWith("-->connected")) {} else if (data.startsWith("-->check")) {} else {
      return callback(data);
    }
  };
  MqttIOBridge.prototype.connectWebsocket = function(callback) {
    var socketServer, url;
    if (!this.websocket) {
      socketServer = this.server + "/" + this.port;
      url = 'ws://socket.m2m.io/mqttio/' + socketServer + "/" + this.clientid + "?un=" + this.username + "&pw=" + this.password + "&clean=" + this.cleansession + "&ttl=30&lwtTopic=" + this.lwtTopic + "&lwtPayload=" + this.lwtPayload + "&lwtQos=" + this.lwtQos;
      if (typeof WebSocket !== 'undefined') {
        this.websocket = new WebSocket(url);
      } else if (typeof MozWebSocket !== 'undefined') {
        this.websocket = new MozWebSocket(url);
      } else {
        return false;
      }
      this.websocket.onopen = __bind(function() {
        return this.isConnected();
      }, this);
      this.websocket.onmessage = __bind(function(evt) {
        var data, sub, _i, _len, _ref;
        data = evt.data;
        if (typeof String.prototype.startsWith !== 'function') {
          String.prototype.startsWith = function(str) {
            return this.slice(0, str.length) === str;
          };
        }
        if (typeof String.prototype.endsWith !== 'function') {
          String.prototype.endsWith = function(str) {
            return this.slice(-str.length) === str;
          };
        }
        if (data.startsWith("-->CONNECTED")) {
          this.connected = true;
          if (this.subs) {
            _ref = this.subs;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              sub = _ref[_i];
              this.subscribe(sub.topic, sub.qos);
            }
            return callback(data);
          }
        } else if (data.startsWith("-->LOSTCONNECT")) {
          return callback(data);
        } else if (data.startsWith("-->EXCEPTION")) {
          return callback(data);
        } else if (data === '-->PONG') {
          return console.log('PONG received.');
        } else {
          return callback(data);
        }
      }, this);
      this.websocket.onclose = __bind(function() {
        if (this.retry) {
          return setTimeout((__bind(function() {}, this)), 1000 * 5);
        }
      }, this);
      this.websocket.onerror = function(error) {};
      return true;
    } else {
      return true;
    }
  };
  MqttIOBridge.prototype.connect = function(callback) {
    var me, socketRes, socketServer, url;
    this.cometconnection = false;
    socketRes = this.connectWebsocket(callback);
    if (socketRes === false) {
      if (this.iframeId !== null) {
        this.cometconnection = true;
        me = this;
        this.bridgeId = this.makeid();
        $.ajax;
        ({
          url: '/getRandom',
          type: 'GET',
          success: function(data, status, response) {
            var bridgeId;
            return bridgeId = data;
          },
          error: function() {}
        });
        socketServer = this.server + "/" + this.port;
        url = "/comet/" + this.bridgeId + "/" + socketServer + "/" + this.clientid + "?un=" + this.username + "&pw=" + this.password + "&clean=" + this.cleansession + "&ttl=30&lwtTopic=" + this.lwtTopic + "&lwtPayload=" + this.lwtPayload + "&lwtQos=" + this.lwtQos;
        $('#' + me.iframeId).html('<iframe src=' + url + '></iframe>');
        bridgeArray[this.bridgeId] = this;
        return this.callbackfunc = callback;
      } else {

      }
    }
  };
  return MqttIOBridge;
})();
/* Example Usage Below
#"iframeId" id div element in html page
initsubs = [new Subscriber("public/ws", 0)]    
bridge = new MqttIOBridge("q.m2m.io", 1883, "<user>", "<pw>", "jsfiddle", true, "", "", 0, initsubs,"iframeId")
bridge.disconnect()

bridge.connect (data) ->
  #console.log 'message: ' + JSON.stringify data*/
