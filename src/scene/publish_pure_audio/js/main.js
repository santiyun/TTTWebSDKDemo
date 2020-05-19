
'use strict';

// 
let client = null;

let gStream = null;

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

			console.log(`<demo> login fail - ${err}`);

			document.getElementById('loginStatus').innerHTML = '<font color="red">登录失败</font>';
			document.getElementById('loginInfo').innerHTML = '';
		});
	}, (err) =>
	{
		console.log(`<demo> init fail - ${err}`);

		return;
	});

	// 
	client.on('stream-published', (evt) =>
	{
		console.log(`<demo> - event [stream-published] uid: ${evt.streamId}`);
		document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
	});

	client.on('stream-unpublished', (evt) =>
	{
		console.log(`<demo> - event [stream-unpublished] uid: ${evt.streamId}`);
		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
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

/******************* for Audio Stream */
//
let closeStreamEle = document.getElementById('closeStream');
if (!!closeStreamEle)
{
	closeStreamEle.addEventListener('click', () =>
	{
		closeStream();
	})
}

//
function closeStream()
{
	if (!!gStream)
	{
		gStream.close();
	}

	gStream = null;
}

// 
let publishStreamEle = document.getElementById('publishAudioStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () =>
	{
		if (!!gStream)
		{
			publishStream();
		}
		else
		{
			createPublishStream();
		}
	})
}

let unpublishStreamEle = document.getElementById('unpublishStream');
if (!!unpublishStreamEle)
{
	unpublishStreamEle.addEventListener('click', () =>
	{
		unpublishStream({});
	})
}

// 
function createPublishStream()
{
	// 
	if (tttStatus !== 1)
	{
		console.log('<demo> createPublishStream - 请先[加入房间]');
		return;
	}

	gStream = window.RTCObj.createStream({
		userId: +userId,
		audio: true,
		video: false
	});

	if (!gStream)
		return;

	gStream.init(() =>
	{
		client.publish(gStream, () => {}, () => {
			// 
			gStream.close();
			gStream = null;
		});
		// 
	}, (evt) =>
	{
		console.log('<demo> createPublishStream - Stream.init failed. - error: ' + evt);
		
		// 
		gStream.close();
		gStream = null;
	});
}

function publishStream()
{
	// 
	if (tttStatus !== 1)
	{
		console.log('<demo> publishStream - 请先[加入房间]');
		return;
	}

	if (!gStream)
	{
		console.log('<demo> publishStream - gStream is null');
		return;
	}

	client.publish(gStream, () => {}, () => {
		// 
		gStream.close();
		gStream = null;
	});
}

// 
function unpublishStream(opts)
{
	const { trackClosed } = opts;

	client.unpublish(gStream, () => {}, () => {}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		gStream.close();
		gStream = null;
	}
}
