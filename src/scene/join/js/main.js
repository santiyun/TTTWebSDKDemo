
'use strict';

// 
let client = null;
let tttStatus = 0;

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

let userRole = 2;

let xAppId = 'a967ac491e3acf92eed5e1b5ba641ab7'; // test900572e02867fab8131651339518

const sdkVersionEle = document.getElementById('sdkVersion');
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${window.RTCObj.version}`;
}

const roomIdEle = document.getElementById('chanid');
if (!!roomIdEle)
{
	rSeed = (Math.random() * 100000000);
	roomIdEle.value = Math.floor(rSeed) + 1;
}

// 登录按钮点击事件处理
let joinChanEle = document.getElementById('joinChan');
if (!!joinChanEle)
{
	joinChanEle.addEventListener('click', () =>
	{
		const rid = roomIdEle.value;
		joinChan(xAppId, rid, userId);
	})
}

function joinChan(appid, chanid, userid)
{
	// 
	if (tttStatus === 1)
	{
		console.log('已在房间内，无需重复登录');

		return;
	}

	client = window.RTCObj.createClient({
		role: userRole
	});

	client.init(appid, userid, () =>
	{
		client.join('', chanid, () =>
		{
			console.log(`<demo> 成功加入房间!! userid: ${userid}`);

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- channelId: ${chanid} - userId: ${userid} - role: ${userRole}<br>`;

			tttStatus = 1; // 状态标注为: 登录成功
		}, (err) =>
		{
			tttStatus = 0;

			console.log(`<demo> login failed. - error: ${err}`);

			document.getElementById('loginStatus').innerHTML = '<font color="red">登录失败</font>';
			document.getElementById('loginInfo').innerHTML = '';
		});
	}, (err) =>
	{
		console.log(`<demo> init failed. - error: ${err}`);

		return;
	});

	client.on('connection-state-change', (evt) =>
	{
		console.log(`<demo> - event [connection-state-change] - ${JSON.stringify(evt)}`);
	});

	client.on('disconnected', (e) =>
	{
		tttStatus = 0;

		console.log(`<demo> - event [disconnected] - ${e.code}`);

		_onClose();
	});

	client.on('kickout', (evt) =>
	{
		tttStatus = 0;

		console.log(`<demo> - event [kickout] ${JSON.stringify(evt)}`);

		_onClose();
	});

	client.on('peer-join', (evt) =>
	{
		console.log(`<demo> - event [peer-join] uid: ${evt.userID}`);
	});

	client.on('peer-leave', (evt) =>
	{
		console.log(`<demo> - event [peer-leave] uid: ${evt.userID}`);
	});
}

// 退出按钮点击事件处理
let leaveChanEle = document.getElementById('leaveChan');
if (!!leaveChanEle)
{
	leaveChanEle.addEventListener('click', () =>
	{
		leaveChan();
	})
}

function leaveChan()
{
	if (tttStatus !== 1)
	{
		console.log('<demo> leaveChan while tttStatus is not 1?');
		return;
	}

	tttStatus = 0;

	if (client)
	{
		client.leave(() => { }, () => { });
		client.close();
	}

	// 
	document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
	document.getElementById('loginInfo').innerHTML = '';

	console.log('<demo> leaveChan OK');
}

let userRoleEle = document.getElementById('userRole');
if (!!userRoleEle)
{
	userRoleEle.addEventListener('change', () =>
	{
		let index = userRoleSelect.selectedIndex;

		userRole = userRoleSelect.options[index].value;

		console.log(`<demo> userRole change - userRole: ${userRole}`);

		// 
		if (!client)
			return;

		client.setUserRole(userRole, () =>
		{
			console.log(`<demo> setUserRole() succ. - role: ${userRole}`);
		}, (e) =>
		{
			console.log(`<demo> setUserRole() fail - ${e.toString()}`);
		});
	});
}
