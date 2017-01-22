$(function() {

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function request(path, params, method, callback) {
    //method = method || "post"; // Set method to post by default if not specified.

   

	var request = new XMLHttpRequest();

    if(callback)
    {
    	request.onreadystatechange = function()
    	{
    		if (request.readyState == 4 && request.status == 200)
        	{
	            callback(request);
        	}
    	}
    }

    request.open(method, path, true);

    if(params)
    {
    	// the params need to be in kv pairs
    	//alert("sending with params:" + JSON.stringify(params));
    	var newData = JSON.stringify(params);
    	//alert(newData);
    	newData = newData.replace(/\{/g, "");
    	newData = newData.replace(/\}/g, "");
    	newData = newData.replace(/\,/g, "&");
    	newData = newData.replace(/\:/g, "=");
    	newData = newData.replace(/\"/g, "");
    	//alert(newData);
    	request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    	request.send(newData);
    }
    else
    {
    	request.send();
    }
}

var numAccount = 0;
var gid = 0;

function RefreshCaptcha() {

	request('https://store.steampowered.com/join/refreshcaptcha?count=1', null, 'GET', function(request)
    {
        //callback(request.responseText); // Another callback here
        if (request.status) console.log(request.status);
		var d = JSON.parse(request.responseText);
		console.log(d);
		gid = d.gid;

		$('#captcha-img').attr('src', 'https://store.steampowered.com/public/captcha.php?gid=' + gid);
    });
}

function Update() {
	var login = $('#login').val();
	var email = $('#email').val();
	var password = $('#password').val();
	var username = $('#username').val();
	try {
		if ($('#login-r').prop('checked'))
			login = new RandExp($('#login-re').val()).gen();
		if ($('#email-r').prop('checked'))
			email = new RandExp($('#email-re').val()).gen();
		if ($('#password-r').prop('checked'))
			password = new RandExp($('#password-re').val()).gen();
		if ($('#username-r').prop('checked'))
			username = new RandExp($('#username-re').val()).gen();
	} catch (e) {}
	login = login.replace(/#+/g, function(match) { return numAccount.pad(match.length); });
	email = email.replace(/#+/g, function(match) { return numAccount.pad(match.length); });
	password = password.replace(/#+/g, function(match) { return numAccount.pad(match.length); });
	username = username.replace(/#+/g, function(match) { return numAccount.pad(match.length); });
	$('#login-ag').text(login);
	$('#email-ag').text(email);
	if ($('#password-r').prop('checked'))
		$('#password-ag').text(password);
	else
		$('#password-ag').text('');
	$('#username-ag').text(username);
	$('#number').val(numAccount);
}

$('#login').on('input', Update);
$('#email').on('input', Update);
$('#password').on('input', Update);
$('#username').on('input', Update);
$('#login-re').on('input', Update);
$('#email-re').on('input', Update);
$('#password-re').on('input', Update);
$('#username-re').on('input', Update);
$('#login-r').on('input', Update);
$('#email-r').on('input', Update);
$('#password-r').on('input', Update);
$('#username-r').on('input', Update);

$('#number').on('input', function() {
	var nn = numAccount;
	try {
		nn = parseInt($(this).val());
	} catch(e) { console.log(e); }	
	numAccount = nn;
	Update();
});

$('#refresh').on('click', function() {
	RefreshCaptcha();
});

$('#start').on('click', function() {
	/*
	ws.send(JSON.stringify({
		act: "launch",
		login: $('#login-ag').text(),
		pwd: $('#password-r').prop('checked') ? $('#password-ag').text() : $('#password').val(),
		tf: $('#cb-start-tf2').prop('checked'),
		launch: $('#cb-launchoptions').prop('checked') ? $('#launchoptions').val() : null
	}));
	$('#status').text('starting steam!');
	*/
});

$('#next').on('click', function() {
	numAccount++;
	Update();
});

$('#create').on('click', function() {
	var data = { 
		act: 'create', 
		login: $('#login-ag').text(),
		pwd: $('#password-r').prop('checked') ? $('#password-ag').text() : $('#password').val(),
		mail: $('#email-ag').text(), 
		captcha: $('#captcha').val(), 
		gid: gid, 
		name: $('#username-ag').text(),
		group: $('#cb-group').prop('checked'),
		groupid: $('#group').val(),
		community: $('#cb-community').prop('checked')
	};
	if ($('#cb-avatar').prop('checked')) data.avatar = true;
	if ($('#cb-summary').prop('checked')) data.summary = $('#ta-summary').val();
	//console.log(data);

	var newData = {
		accountname: data.login,
		password: data.pwd,
		email: data.mail,
		captchagid: data.gid,
		captcha_text: data.captcha,
		i_agree: 1,
		ticket: "",
		count: 1
	};

	console.log(newData);

	// this is the page dont change it
	request('https://store.steampowered.com/join/createaccount/', newData, 'post', function(request) 
	{
		if (request.responseText.indexOf('true') > 0) {
			//socket.send(JSON.stringify({ status: "success", data: data }));
			$('#status').text('success');
			$('#createdaccounts').append(data.login + ' ' + data.pwd + ' ' + data.mail + '\n');
		} else {
			console.log(request.responseText);
			$('#status').text('failure');
		}
		console.log(request.responseText);
	});
	//ws.send(JSON.stringify(data));
	$('#status').text('waiting for response...');
});

Update();

RefreshCaptcha();
});
