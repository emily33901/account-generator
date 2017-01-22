var request = require('request');
var WSS = require('ws').Server;
var fs = require('fs');
var SteamCommunity = require('steamcommunity');
var child_process = require('child_process');

var server = new WSS({ port: 8080 });

server.on('connection', function(socket) {
	sock = socket;
	socket.on('message', function(msg) {
		var data = JSON.parse(msg);
		if (data.act == 'create') {
			if (!IsCreateValid(data)) {
				socket.send(JSON.stringify({ status: "malformed" }));
			} else {
				socket.send(JSON.stringify({ status: "creating" }));
				console.log('creating, data', data);
				CreateAccount(data, socket);
			}
		} else if (data.act == 'captcha') {
			RefreshCaptcha(socket);
		} else if (data.act == 'launch') {
			socket.send(JSON.stringify({ status: "launching" }));
			console.log(data);
			StartSteam(data.login, data.pwd, data.tf, data.launch);
		}
	});
});

function IsCreateValid(data) {
	if (!data) return false;
	if (!(data.name && data.login && data.pwd && data.mail && data.captcha && data.gid)) return false;
	return true;
}

function RefreshCaptcha(socket) {
	request.get('https://store.steampowered.com/join/refreshcaptcha?count=1', function(e, r, b) {
		if (e) console.log(e);
		var d = JSON.parse(b);
		console.log(d);
		gid = d.gid;
		if (socket) socket.send(JSON.stringify({ gid: gid }));
	});
}

function SetupAccount(data, socket) {
	var community = new SteamCommunity();
	console.log("Logging in...");
	community.login({ accountName: data.login, password: data.pwd }, function(err, session) {
		//console.log('error', err);
		//console.log('session', session);
		console.log("Setting up profile..");
		
		function setup() {
			console.log("Editing profile..");	
			var adata = {
				name: data.name
			};
			if (data.summary) adata.summary = data.summary;
			community.editProfile(adata, function() {
				if (data.group) {
					community.getSteamGroup(data.groupid, function(err, group) {
						if (err) console.log(err);
						console.log("Joining group..");
						group.join();
					});
				}
				if (data.avatar) {
					console.log("Uploading avatar..");
					community.uploadAvatar('avatar.png');
				}
			});
		}
		if (data.community)
			community.setupProfile(setup);
		else setup();
		
		
		/*community.request.post('https://store.steampowered.com/twofactor/manage_action', {
			qs: {
				action: "email",
				sessionid: session,
				email_authenticator_check: "on"
			}
		}, function(e, r, b) {
			//console.log(b);
			
		});*/
	});
}

function StartSteam(name, password, starttf, launchopts) {
	var cmd = `steam -login ${name} ${password}`;
	if (starttf) {
		cmd += ' -applaunch 440';
		if (launchopts) {
			cmd += launchopts;
		}
	}
	child_process.exec('killall -9 steam && killall -9 hl2_linux', function() {
		setTimeout(function() {
			child_process.exec(cmd);
		}, 1000);
	});
}

function CreateAccount(data, socket) {
	request.post('https://store.steampowered.com/join/createaccount/', {
		qs: {
			accountname: data.login,
			password: data.pwd,
			email: data.mail,
			captchagid: data.gid,
			captcha_text: data.captcha,
			i_agree: 1,
			ticket: "",
			count: 1
		}
	}, function(e, r, b) {
		if (e) console.log(e);
		if (b.indexOf('true') > 0) {
			fs.appendFileSync('accounts.txt', data.login + ' ' + data.pwd + ' ' + data.mail + '\n');
			console.log("Setting up account..");
			SetupAccount(data);
			socket.send(JSON.stringify({ status: "success", data: data }));
		} else {
			console.log(b);
			socket.send(JSON.stringify({ status: "failure", data: JSON.stringify(b) }));
		}
		console.log(b);
	});
}

RefreshCaptcha();
//CreateAccount("d4rkc4t_8", "292632255E", "0d4rkc4t+cat8@gmail.com", "DPJJED", "334784713586764588", "");