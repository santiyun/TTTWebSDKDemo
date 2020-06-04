
'use strict';

// 
let client = null;

let gStream = null;

let videoEle = document.getElementById('video');

let tttStatus = 0;

let remote_stream = new Map();

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

let userRole = 1; // 要确保本用户以 主播 角色登录

let xAppId = 'a967ac491e3acf92eed5e1b5ba641ab7'; // test900572e02867fab8131651339518

const sdkVersionEle = document.getElementById('sdkVersion');
const sdkVersion = window.getVersion();
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${sdkVersion}`;
}

const roomIdEle = document.getElementById('chanid');
if (!!roomIdEle)
{
	rSeed = (Math.random() * 100000000);
	roomIdEle.value = Math.floor(rSeed) + 1;
}

const rtmpUrlEle = document.getElementById('rtmpUrl');
if (!!rtmpUrlEle)
{
	rtmpUrlEle.value = `rtmp://push.3ttest.cn/sdk2/${roomIdEle.value}`;
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

	const rtmpUrl = (!!rtmpUrlEle) ? rtmpUrlEle.value : '';
	client = window.RTCObj.createClient({
		role: userRole,
		rtmpUrl,
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

		// 
		setLiveMixerLayout();
	});

	client.on('stream-unpublished', (evt) =>
	{
		console.log(`<demo> - event [stream-unpublished] uid: ${evt.streamId}`);
		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;

		// TODO : re-layout
	});

	//
	client.on('rtmp-success', (evt) =>
	{
		console.log(`<demo> - event [rtmp-success] url: ${evt.url} - channelId: ${evt.channelId}`);

		document.getElementById('rtmpStatus').innerHTML = `rtmpUrl: ${evt.url}`;
	});

	//
	client.on('rtmp-failure', (evt) =>
	{
		console.log(`<demo> - event [rtmp-failure] url: ${evt.url} - channelId: ${evt.channelId}`);

		document.getElementById('rtmpStatus').innerHTML = ' - ';
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

// 设置 RTMP 推流 URL
let setRtmpUrlEle = document.getElementById('setRtmpUrl');
if (!!setRtmpUrlEle)
{
	setRtmpUrlEle.addEventListener('click', () =>
	{
		if (!!rtmpUrlEle)
		{
			const cdnUrl = rtmpUrlEle.value;
			setRtmpUrl(cdnUrl);
		}
	})
}

function setRtmpUrl(url)
{
	if (!client)
	{
		return;
	}

	// 
	const pureAudioEle = document.getElementById('pureAudio');

	client.setRtmpUrl({ url, avMode: pureAudioEle.checked ? 'audio' : 'av' });
}

/******************* for Audio/Video Stream */
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

	const videoId = '3t_local';
	let obj = document.getElementById(videoId);
	if (obj)
	{
		console.log('<demo> closeStream - obj.remove -- 3t_local');
		obj.remove();
	}

	gStream = null;
}

// 
let publishStreamEle = document.getElementById('publishStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () =>
	{
		publishStream();
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
function publishStream()
{
	// 
	if (tttStatus !== 1)
	{
		console.log('<demo> publishStream - 请先[加入房间]');
		return;
	}

	// 
	gStream = window.RTCObj.createStream({
		userId: +userId,
		audio: true,
		video: true,
		attributes: { videoProfile: '480p' }
	});

	if (!gStream)
		return;

	gStream.init(() =>
	{
		gStream.on('stream-close', (e) =>
		{
			console.log(`<demo> event [stream-close] - ${e.streamId}`);
			unpublishStream({ trackClosed: true });
		});

		const videoId = '3t_local';
		let videoE = document.createElement('video');
		videoE.id = videoId;
		videoE.muted = true;
		videoE.autoplay = true;
		videoE.controls = true;
		videoE.setAttribute('playsinline', '');
		videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

		if (!!videoEle)
		{
			videoEle.append(videoE);
		}

		gStream.play(videoId, {}, () => {}, () => {});
		
		client.publish(gStream, () => {}, () => {
			// 
			gStream.close();
			gStream = null;
		});
		// 
	}, (evt) =>
	{
		console.log('<demo> publishStream - Stream.init failed. - error: ' + evt);
		
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
		if (!!gStream)
		{
			gStream.close();
		}

		const videoId = '3t_local';
		let obj = document.getElementById(videoId);
		if (obj)
		{
			console.log('<demo> unpublishStream - obj.remove -- 3t_local');
			obj.remove();
		}

		gStream = null;
	}
}

// 

const splitWnd1 = [{ x: 0, y: 0 }];
const splitWnd4 = [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }];
const splitWnd9 = [{ x: 0, y: 0 }, { x: 0.33, y: 0 }, { x: 0.66, y: 0 }, { x: 0, y: 0.33 }, { x: 0.33, y: 0.33 }, { x: 0.66, y: 0.33 }, { x: 0, y: 0.66 }, { x: 0.33, y: 0.66 }, { x: 0.66, y: 0.66 }];

function setLiveMixerLayout()
{
	if (!client)
	{
		return;
	}

	// 
	let liveMixerLayout = {
		backgroundColor: 0x000000,
		width: 640,
		height: 360,
		users: []
	}

	let nCnt = remote_stream.size;

	if (!!gStream)
	{
		nCnt++;
	}

	let wh = 1;
	let splitWnd = [];
	if (nCnt <= 1)
	{
		wh = 1;
		splitWnd = splitWnd1;
	}
	else if (nCnt <= 4)
	{
		wh = 0.5
		splitWnd = splitWnd4;
	}
	else if (nCnt <= 9)
	{
		wh = 0.33
		splitWnd = splitWnd9;
	}
	else
		; // TODO : 

	let nIndex = 0;
	if (!!gStream)
	{
		let user = {};

		user.userId = gStream.userId;
		user.streamId = gStream.getId();
		user.x = splitWnd[nIndex].x;
		user.y = splitWnd[nIndex].y;
		user.w = wh;
		user.h = wh;
		user.z = 0;
		user.renderMode = 'scale';

		liveMixerLayout.users.push(user);

		nIndex++;
	}

	// 
	if (!!remote_stream)
	{
		remote_stream.forEach((item) =>
		{
			if (Boolean(item))
			{
				let user = {};
				// 
				user.userId = item.userId;
				user.streamId = item.getId();
				user.x = splitWnd[nIndex].x;
				user.y = splitWnd[nIndex].y;
				user.w = wh;
				user.h = wh;
				user.z = 0;
				user.renderMode = 'scale';

				liveMixerLayout.users.push(user);

				nIndex++;
			}
		});
	}

	console.log(`<demo> setLiveMixerLayout - liveMixerLayout: ${JSON.stringify(liveMixerLayout)}`);

	client.setLiveMixerLayout(liveMixerLayout, () => { }, () => { });
}
