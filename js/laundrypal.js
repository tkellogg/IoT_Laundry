$(function() {
	// maybe we want to change this later...
	var storage = window.localStorage;
	function json(str) {
		if (!str) return str;
		try {
			return JSON.parse(str);
		} catch(err) {
			return null;
		}
	}

	function Selections() {
		this.selections = [ ];
		this.people = json(storage['people']) || [
			{name: 'Jay', phone: '303-543-7799', gravatar:"f8fc07ca372a012efc1aa072b62af31f"},
			{name: 'Tim?', phone: '303-759-2188', gravatar:"610f9ec2a3482c1706afb5a79d766219"},
			{name: 'Adrian', phone: '720-184-9002', gravatar:"dbe53b80c6427e684e41e0ecc098b960"}
		];

		this.machines = {
			1:{name:'Washer 1', on: false}, 
			2:{name:'Washer 2', on: false}, 
			3:{name:'Drier 1', on: false}, 
			4:{name:'Drier 2', on: false}
		};

		storage['people'] = JSON.stringify(this.people);
		storage['machines'] = JSON.stringify(this.machines);
	}

	Selections.prototype.add = function(person, machine) {
		selections.push({person: person, machine: machine});
	};
	
	Selections.prototype.ensureClientUp = function(id) {
		this.machines[id].on = true;
		var name = this.machines[id].name;
		$('[data-value="'+name+'"]').switchClass('unavailable claimed', 'unclaimed');
		console.log('client "'+id+'" is up');
	};

	Selections.prototype.ensureClientDown = function(id) {
		this.machines[id].on = false;
		var name = this.machines[id].name;
		$('[data-value="'+name+'"]').switchClass('unclaimed claimed', 'unavailable');
		console.log('client "'+id+'" is down');
	};

	Selections.prototype.ensureClientStarted = function(id, started) {
		var name = this.machines[id].name;
		this.machines[id].occupied = started;
		if (started) {
			this.machines[id].startTime = new Date();
			$('[data-value="'+name+'"]').switchClass('unavailable', 'claimed');
			console.log('client "'+id+'" is busy');
		} else {
			this.machines[id].startTime = null;
			$('[data-value="'+name+'"]').switchClass('claimed unavailable', 'unclaimed');
			console.log('client "'+id+'" is not busy');
		}
	};

	Selections.prototype.route = function(topic, payload) {
		var topicSegments = topic ? topic.split('/') : null;
		var clientId = topicSegments.length >= 3 ? topicSegments[2] : null;

		if (payload.info == "bootup" && clientId) {
			this.ensureClientUp(clientId);
		} else if (payload.info == "shutdown" && clientId) {
			this.ensureClientDown(clientId);
		} else if (typeof(payload.started) === 'boolean') {
			this.ensureClientStarted(clientId, payload.started);
		}
	};

	var sel = new Selections();
	var $table = $('#machine-selector');
	
	var $tr = $table.append('<tr/>').children().last();
	for (var i in sel.people) {
		var val = sel.people[i].name;
		var grav = sel.people[i].gravatar;
		$tr.append('<td><img src="http://www.gravatar.com/avatar/'+grav+'?s=200" class="person" data-value="'+val+'"/>');
	}

	$tr = $table.append('<tr/>').children().last();
	for (var i in sel.machines) {
		var val = sel.machines[i].name;
		$tr.append('<td><div class="machine unavailable" data-value="'+val+'">'+val+'</div>');
	}

	$(".person").draggable();
	$(".machine").droppable({
		drop: function(event, ui) {
			var $dragElem = $(ui.draggable[0]);

			// make it go back to where it started
			$dragElem.css({top:'auto', left:'auto'});
		}
	});
	$('.machine,.person').each(function() {
		$(this).html($(this).attr('data-value'));
	});

	var ip = 'q.m2m.io',
		port = 1883,
		un = '',
		pw = '',
		cid = 'WEBSOCKET-the_web',
		clean = true,
		lwtTopic = '',
		lwtPayload = '',
		lwtQos = 0,
		initsubs = [new Subscriber("public/laundarypal/#", 0)];
	var wsbridge = new MqttIOBridge(ip, port, un, pw, cid, clean, lwtTopic, lwtPayload, lwtQos, initsubs,"mqtt-iframe");
	wsbridge.connect(function(data) {
		var lines = data.split(/\r?\n/);
		if (lines.length < 2) return;
		var params = json(lines[0]);
		if (!params) return;
		var payload = lines[1];
		var parsed = json(payload);
		if (!parsed) return;
		console.log('recieved "'+payload+'" on topic "'+params.topic+'"');
		sel.route(params.topic, parsed);
	});

});
