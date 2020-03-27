import TTTRtcWeb from '../lib/tttwebsdk'; // import from local tttwebsdk.js
// import TTTRtcWeb from 'tttwebsdk'; // npm install tttwebsdk@latest

// 
// TTTRtcWeb.setPrivate(true);
// TTTRtcWeb.setIpLocationAddress('v1.jkim.ccb.com');
// TTTRtcWeb.setServerUrl('114_115_172_21.3ttech.cn'); 
// TTTRtcWeb.setServerUrl('v7.jkim.ccb.com');
// TTTRtcWeb.setServerUrl('gzeduservice.3ttech.cn');
// TTTRtcWeb.setLogSubmit(false);
// TTTRtcWeb.setServerUrl('xiaoyao1.3ttech.cn');
// TTTRtcWeb.setServerUrl('webmedia7.3ttech.cn');

const isSupp = TTTRtcWeb.isSystemSupported();
console.log(`isSupp: ${isSupp}`);

let RTCObj = null;

const pkg = require('../package.json');
let demoVersion = pkg.version;

let sdkVersion = TTTRtcWeb.getVersion();

document.getElementById('sysVersion').innerHTML = `ver: ${demoVersion} - ${sdkVersion}`;

// 
let client = null;
let streams = new Map();

let hasPublishStream = false;
let hasPublishScreen = false;
let hasPublishMediaSource = false;

let gStream = null;
let gScreenStream = null;
let gMediaSourceStream = null;

let intv = null;

let remote_stream = new Map();

// const stream_net_info = document.getElementById('stream_net_info');
const text_info = document.getElementById('text_info');

let sourceMediaStream;

const videoSelect = document.getElementById("cameraDev");
const audioInputSelect = document.getElementById('micDev');
const audioOutputSelect = document.getElementById('speakerDev');
const userRoleSelect = document.getElementById('userRole');

let cameraDevId = 'default';
let micDevId = 'default';
let speakerDevId = 'default';
let audioProfile = 'default';
let audioCodec = 'isac';

const appIdEle = document.getElementById('appID');

// 
let userId = 0;
if (!!window.localStorage)
{
	userId = window.localStorage.getItem('tttUserId');
}

if (!userId || !(parseInt(userId, 10)))
{
	const rSeed = (Math.random() * 100000000);
	userId = Math.floor(rSeed) + 1;

	window.localStorage.setItem('tttUserId', userId);
}

const userIdEle = document.getElementById('userid');
if (!!userIdEle)
{
	userIdEle.value = userId;
}

const roomIdEle = document.getElementById('chanid');

const rtmpUrlEle = document.getElementById('rtmpUrl');
// 
let screenEle = document.getElementById('screen');
let videoEle = document.getElementById('video');

let audioVolumeProgressEle = document.getElementById('audioVolumeProgress');
let audioVolumeValueEle = document.getElementById('audioVolumeValue');
// 
let userRole = 2;

// 
let sei = {
    // ts: '',
    // ver: '20161227',
    canvas: {
        bgrad: [
            232,
            230,
            232
        ],
        h: 480,
        w: 640
    },
    mid: '',
    pos: []
}
// 
let tttStatus = 0;

// 
// url: https://...../?auto=1&r=666777&u=111111&h=webmedia4.3ttech.cn
let isAutoPub = getQueryVariable('auto');
let xRoomId = getQueryVariable('r');
if (!!xRoomId)
{
	roomIdEle.value = xRoomId;
}

let xUserId = getQueryVariable('u');
if (!!xUserId)
{
	userIdEle.value = xUserId;
}
let xAppId = 'a967ac491e3acf92eed5e1b5ba641ab7'; // test900572e02867fab8131651339518
let xSpecMic = getQueryVariable('m');
let xSpecServer = getQueryVariable('h');
let xSpecIploc = getQueryVariable('l');
let xSpecIplocPort = getQueryVariable('p');
// 
if (!!xSpecIploc)
{
	if (xSpecIploc !== '')
	{
		TTTRtcWeb.setPrivate(true);
		TTTRtcWeb.setIpLocationAddress(xSpecIploc);
	}
}
// 
if (!!xSpecIplocPort)
{
	const port = parseInt(xSpecIplocPort, 10);
	if (!!port)
	{
		TTTRtcWeb.setIpLocationPort(port);
	}
}

getDevices();

autoPublish();

function autoPublish()
{
	console.log(`<demo> Load. isAutoPub: ${isAutoPub} roomId: ${roomIdEle.value} userId: ${userIdEle.value}`);

	if (!!roomIdEle.value && !!userIdEle.value && isAutoPub)
	{
		joinChan(xAppId, roomIdEle.value, userIdEle.value);
	}
}

function getQueryVariable(variable)
{
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++)
	{
		var pair = vars[i].split('=');
		if (pair[0] == variable)
		{
			return pair[1];
		}
	}
	return(false);
}

function joinChan(appid, chanid, userid)
{
	// 
	if (tttStatus === 1)
	{
		text_info.value = text_info.value + '已在房间内，无需重复登录' + '\n';

		return;
    }

	// 
	if (!!xSpecServer)
	{
		if (xSpecServer !== '')
		{
			TTTRtcWeb.setServerUrl(xSpecServer);
		}
	}

	// 
	const submitLogEle = document.getElementById('submitLog');
	TTTRtcWeb.setLogSubmit(submitLogEle.checked);

	// 
	RTCObj = new TTTRtcWeb();

	const cdnUrl = (!!rtmpUrlEle) ? rtmpUrlEle.value : '';
    client = RTCObj.createClient({
		role: userRole,
		rtmpUrl: cdnUrl,
		videoMixerBGIUrl: 'http://3ttech.cn/res/tpl/default/images/black.jpg',
		audioCodec
	});
 
    client.init(appid, userid, () => {
        client.join('', chanid, () => {
			text_info.value = `<demo> 成功加入房间!! userid: ${userid}` + '\n';

			console.log(`<demo> 成功加入房间!! userid: ${userid}`);

			tttStatus = 1; // 状态标注为: 登录成功

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- role: ${userRole}<br>`;

			// 
			intv = setInterval(() => {
				// stream_net_info.value = `${JSON.stringify(client.getNetState())}`;
				// 
				const rAudioStats = client.remoteAudioStats();
				rAudioStats.forEach((value, key) => {
					; // console.log(`<demo> <STAT> audioDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
				});

				// 
				const rVideoStats = client.remoteVideoStats();
				rVideoStats.forEach((value, key) => {
					; // console.log(`<demo> <STAT> videoDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
				});

				// 
				const lAudioStats = client.localAudioStats();
				lAudioStats.forEach((value, key) => {
					; // console.log(`<demo> <STAT> audioUpStat -- streamId: ${key} ${JSON.stringify(value)}`);
				});

				// 
				const lVideoStats = client.localVideoStats();
				lVideoStats.forEach((value, key) => {
					; // console.log(`<demo> <STAT> videoUpStat -- streamId: ${key} ${JSON.stringify(value)}`);
				});

				// 
				const rtcStats = client.getStats();
				; // console.log(`<demo> <STAT> rtcStats -- ${JSON.stringify(rtcStats)}`);

				// for volume
				if (!!gStream)
				{
					const vol = gStream.getAudioLevel();
					;// console.log(`<demo> <AUDIO-VOLUME> - local audio: ${vol}`);

					// 
					remote_stream.forEach((item) =>
					{
						if (!!item)
						{
							// 
							const rVol = item.getAudioLevel();
							;// console.log(`<demo> <AUDIO-VOLUME> - remote audio: ${rVol}`);
						}
					});
				}

				// 
				// for 
			}, 2000);

			// 
			if (isAutoPub)
			{
				publishStream({
					userid : userIdEle.value,
					audio  : true,
					video  : true,
					screen : false,
					mediasource : false
				});
			}
			// 
        }, (err) => {
			tttStatus = 0;

			text_info.value = text_info.value + `<demo> login failed. - error: ${JSON.stringify(err)}` + '\n';

			console.log(`<demo> login failed. - error: ${JSON.stringify(err)}`);

			document.getElementById('loginStatus').innerHTML = '<font color="red">登录失败</font>';
			document.getElementById('loginInfo').innerHTML = '';
        });
    }, (err) => {
		text_info.value = text_info.value + `<demo> init failed. - error: ${JSON.stringify(err)}` + '\n';
		console.log(`<demo> init failed. - error: ${JSON.stringify(err)}`);

		return;
	});

	client.on('device-hot-plug', (e) => {
		console.log(`<demo> - event [device-hot-plug] - ${JSON.stringify(e)}`);
	})
	
	client.on('reinit', () => {
		text_info.value = text_info.value + '<demo> - event [reinit]' + '\n';
		console.log('<demo> - event [reinit]');
		
		// 
		remote_stream.forEach((item) =>
		{
			if (!item)
			{
				// 
				item.close();
			}
		});
		remote_stream.clear();

		// 
		_innerUnpublishStream({
			video       : true,
			screen      : false,
			mediasource : false
		});
		_innerUnpublishStream({
			video       : false,
			screen      : true,
			mediasource : false
		});
		_innerUnpublishStream({
			video       : false,
			screen      : false,
			mediasource : true
		});
	});

	client.on('connection-state-change', (evt) =>{
		text_info.value = text_info.value + `<demo> - event [connection-state-change] - ${JSON.stringify(evt)}` + '\n';
		console.log(`<demo> - event [connection-state-change] - ${JSON.stringify(evt)}`);
	});

	client.on('disconnected', () => {
		tttStatus = 0;

		text_info.value = text_info.value + '<demo> - event [disconnected]' + '\n';
		console.log('<demo> - event [disconnected]');
		
		_onClose();
	});

	client.on('kickout', (evt) => {
		tttStatus = 0;

		text_info.value = text_info.value + `<demo> - event [kickout] ${JSON.stringify(evt)}` + '\n';
		console.log(`<demo> - event [kickout] ${JSON.stringify(evt)}`);
		
		_onClose();
	});

    client.on('peer-join', (evt) => {
		text_info.value = text_info.value + `<demo> - event [peer-join] uid: ${evt.userID}` + '\n';

        console.log(`<demo> - event [peer-join] uid: ${evt.userID}`);
    });

    client.on('peer-leave', (evt) => {
		text_info.value = text_info.value + `<demo> - event [peer-leave] uid: ${evt.userID}` + '\n';
        console.log(`<demo> - event [peer-leave] uid: ${evt.userID}`);

        evt.streams.forEach(stream => {
			if (!stream)
				return;

			let obj = document.getElementById('3t_remote' + stream.getId());
			if (obj)
			{
				obj.remove();
			}

            // remove stream from map
            remote_stream.delete(stream.getId());

			stream.close();
        });
	});

	client.on('rtmp-success', (evt) => {
		console.log(`<demo> - event [rtmp-success] - ${JSON.stringify(evt)}`);
	});
	
	client.on('audio-added', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [audio-added] streamId: ${evt.stream.getId()}` + '\n';

		console.log(`<demo> - event [audio-added] streamId: ${evt.stream.getId()}`);

		remote_stream.set(stream.getId(), stream);
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.getId()} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.getId()} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
	})

	client.on('video-added', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [video-added] streamId: ${stream.getId()}` + '\n';

		console.log(`<demo> - event [video-added] streamId: ${stream.getId()} videoType: ${stream.videoType}`);

		remote_stream.set(stream.getId(), stream);
		// 
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
	})

    client.on('stream-subscribed', (evt) => {
        var stream = evt.stream;
		if (!stream)
			return;
		text_info.value = text_info.value + `<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.type: ${stream.type}` + '\n';
		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.type: ${stream.type} stream.videoType: ${stream.videoType}`);

		if (stream.hasAudio())
		{
			stream.on('volume-change', e => {
				; // console.log(`<AUDIO-VOLUME> - volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
		}

		if(stream.type === 'audio')
		{
            stream.play();
		}
		else
		{
            var videoId = '3t_remote' + stream.getId();
			if(!!videoEle && !document.getElementById(videoId))
			{
                let video = document.createElement('video');
				video.id = videoId;
				video.muted = false;
				video.autoplay = true;
				video.controls = true;
				video.setAttribute('playsinline', '');
                video.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;';
				videoEle.append(video);
            }

            stream.play('3t_remote' + stream.getId(), true);
		}
    });

    client.on('video-mute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [video-mute] streamId: ${stream.getId()}` + '\n';
		console.log(`<demo> - event [video-mute] streamId: ${stream.getId()}`);

		stream._video.style.backgroundColor = 'transparent';
		// stream._video.srcObject = null;
		stream._video.poster = 'http://www.3ttech.cn/favicon.ico';

		// visibility: hidden
		
	});
	
	client.on('video-unmute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [video-unmute] streamId: ${stream.getId()}` + '\n';
		console.log(`<demo> - event [video-unmute] streamId: ${stream.getId()}`);
		
		stream._video.style.backgroundColor = '#000';
		stream._video.srcObject = stream._streamObj;
		stream._video.poster = '';
	});
}

function leaveChan()
{
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'leaveChan while tttStatus is not 1?' + '\n';
		return;
	}
	
	_onClose();

	if (client)
	{
        client.leave(() => { }, () => { });
        client.close();
	}

	text_info.value = text_info.value + 'leaveChan OK' + '\n';
}

function _onClose()
{
	// 
	remote_stream.forEach((item) =>
	{
		if (!!item)
		{
			// 
			let obj = document.getElementById('3t_remote' + item.getId());
			if (obj)
			{
				obj.remove();
			}
			// 
			item.close();
		}
	});
	remote_stream.clear();

	// 
	unpublishStream({
		video       : true,
		screen      : false,
		mediasource : false
		});
	unpublishStream({
		video       : false,
		screen      : true,
		mediasource : false
		});
	unpublishStream({
		video       : false,
		screen      : false,
		mediasource : true
		});

	// 
	if (intv !== null)
	{
		clearInterval(intv);
		intv = null;
	}

	// 
	{
		let obj = document.getElementById('3t_local_screen');
		if (obj)
		{
			obj.remove();
		}

		// 
		if (!!gScreenStream)
		{
			streams.delete(gScreenStream.getId());
			
			gScreenStream.close();
			gScreenStream = null;
		}
	}

	// 
	{
		let obj = document.getElementById('3t_local');
		if (obj)
		{
			obj.remove();
		}

		// 
		if (!!gStream)
		{
			streams.delete(gStream.getId());
			
			gStream.close();
			gStream = null;
		}
	}
	// 
	
	tttStatus = 0;

	// 
	document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
	document.getElementById('loginInfo').innerHTML = '';
}

function setRtmpUrl(url)
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + '<demo> setRtmpUrl - 请先[加入房间]' + '\n';

		return;
	}

	if (!client)
	{
		return;
	}

	// 
	const pureAudioEle = document.getElementById('pureAudio');

	client.setRtmpUrl({ url, avMode: pureAudioEle.checked ? 'audio' : 'av' } );
}

const splitWnd1 = [{x: 0, y: 0}];
const splitWnd4 = [{x: 0, y: 0}, {x: 0.5, y: 0}, {x: 0, y: 0.5}, {x: 0.5, y: 0.5}];
const splitWnd9 = [{x: 0, y: 0}, {x: 0.33, y: 0}, {x: 0.66, y: 0}, {x: 0, y: 0.33}, {x: 0.33, y: 0.33}, {x: 0.66, y: 0.33}, {x: 0, y: 0.66}, {x: 0.33, y: 0.66}, {x: 0.66, y: 0.66}];

function setLiveMixerLayout()
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + '<demo> setLiveMixerLayout - 请先[加入房间]' + '\n';

		return;
	}

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
	
	if (!!gScreenStream)
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
	if (nCnt <= 4)
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

		liveMixerLayout.users.push(user);

		nIndex++;
	}
	
	if (!!gScreenStream)
	{
		let user = {};

		user.userId = gScreenStream.userId;
		user.streamId = gScreenStream.getId();
		user.x = splitWnd[nIndex].x;
		user.y = splitWnd[nIndex].y;
		user.w = wh;
		user.h = wh;
		user.z = 0;

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

				liveMixerLayout.users.push(user);
		
				nIndex++;
			}
		});
	}

	text_info.value = text_info.value + `<demo> setLiveMixerLayout ...liveMixerLayout: ${JSON.stringify(liveMixerLayout)}` + '\n';

	client.setLiveMixerLayout(liveMixerLayout, () => {}, () => {});
}

// 
let joinChanEle = document.getElementById('joinChan');
if (!!joinChanEle)
{
	joinChanEle.addEventListener('click', () => {
		let appId = appIdEle.value;
		let rid = roomIdEle.value;
		let uid = userIdEle.value;
		joinChan(appId, rid, uid);
	})
}

let leaveChanEle = document.getElementById('leaveChan');
if (!!leaveChanEle)
{
	leaveChanEle.addEventListener('click', () => {
		leaveChan();
	})
}

let setLiveMixerLayoutEle = document.getElementById('setLiveMixerLayout');
if (!!setLiveMixerLayoutEle)
{
	setLiveMixerLayoutEle.addEventListener('click', () => {
		setLiveMixerLayout();
	})
}

let setRtmpUrlEle = document.getElementById('setRtmpUrl');
if (!!setRtmpUrlEle)
{
	setRtmpUrlEle.addEventListener('click', () => {
		if (!!rtmpUrlEle)
		{
			const cdnUrl = rtmpUrlEle.value;
			setRtmpUrl(cdnUrl);
		}
	})
}

// 
function setStreamSEI(userid, streamId, type, isScreen)
{
	if(+userRole !== 1)
		return;

	let sei = {
		ts: '',
		ver: '20161227',
		canvas: {
			bgrad: [
				232,
				230,
				232
			],
			h: 640,
			w: 368
		},
		mid: '',
		pos: []
	}

    sei.mid = userIdEle.value; // userIdEle.value 为 主播ID
	// sei.ts = + new Date();

	let nCnt = remote_stream.size;

	if (!!gStream)
	{
		nCnt++;
	}
	
	if (!!gScreenStream)
	{
		nCnt++;
	}

	let isSplit = nCnt > 1;
	
	let nIndex = 0;
	if (!!gStream)
	{
		let position = {};

		position.id = gStream.getId();
		position.x = 0;
		position.y = 0;
		position.w = isSplit ? 0.5 : 1;
		position.h = isSplit ? 0.5 : 1;
		position.z = 0;

		sei.pos.push(position);

		nIndex++;
	}
	
	if (!!gScreenStream)
	{
		let position = {};

		position.id = gScreenStream.getId();
		position.x = (isSplit && nIndex === 1) ? 0.5 : 0;
		position.y = 0;
		position.w = isSplit ? 0.5 : 1;
		position.h = isSplit ? 0.5 : 1;
		position.z = 0;

		sei.pos.push(position);

		nIndex++;
	}

	// 
	remote_stream.forEach((item) =>
	{
		if (Boolean(item))
		{
			let position = {};
			// 
			position.id = item.getId();
			position.x = (isSplit && (nIndex === 3)) ? 0 : 0.5;
			position.y = (isSplit && nIndex > 0) ? 0.5 : 0;
			position.w = isSplit ? 0.5 : 1;
			position.h = isSplit ? 0.5 : 1;
			position.z = 0;

			sei.pos.push(position);
	
			nIndex++;
		}
	});

	// 
    client.setSEI(userid, type, isScreen, sei, streamId);
};

/*
function setStreamSEI(userid, streamId, type, isScreen)
 {
	if(client._role !== '1')
		return;

	let position = {
		id: 0,
		h: 0,
		w: 0,
		x: 0,
		y: 0,
		z: 1
	};

    sei.mid = userIdEle.value; // userIdEle.value 为 主播ID
    // sei.ts = + new Date(); // ts 字段可以忽略
    position.id = streamId;
    position.x = 0;
    position.y = 0;
    position.w = 1;
    position.h = 1;
	position.z = 0;
	
	sei.pos = [];
	sei.pos.push(position);

    client.setSEI(userid, type, isScreen, sei, streamId);
};
*/

function setVideoProfile(prof)
{
	if (gStream === null)
	{
		return;
	}

	// set video profile
	gStream.setVideoProfile(prof, (msg) => {
		text_info.value = text_info.value + `<demo> setVideoProfile - gStream.setVideoProfile succ. ${prof}` + '\n';
		console.log(`<demo> setVideoProfile - gStream.setVideoProfile succ: ${prof}`);
	}, (e) => {
		text_info.value = text_info.value + `<demo> setVideoProfile - gStream.setVideoProfile failed. - error: ${JSON.stringify(e)}` + '\n';
		console.log('<demo> setVideoProfile - gStream.setVideoProfile - error: ' + e);
	});
}

function createMediaSourceStream()
{
	if (!!sourceMediaStream)
	{
		return;
	}

	//
	const mediaSource = document.getElementById('mediaSource');
	if (!mediaSource)
	{
		return;
	}

	if (mediaSource.captureStream)
	{
		sourceMediaStream = mediaSource.captureStream();
		console.log('Captured sourceMediaStream from mediaSource with captureStream', sourceMediaStream);
	}
	else if (mediaSource.mozCaptureStream)
	{
		sourceMediaStream = mediaSource.mozCaptureStream();
		console.log('Captured sourceMediaStream from mediaSource with mozCaptureStream()', sourceMediaStream);
	}
	else
	{
		console.log('captureStream() not supported');
	}
}

function previewLocalStream(opts)
{
	if (RTCObj === null)
	{
		RTCObj = new TTTRtcWeb();
	}

	const {
		userid,
		audio,
		video,
		screen,
		mediasource
	} = opts;

	let v = (+video) + (+screen) + (+mediasource);
	if (v > 1)
	{
		text_info.value = text_info.value + '<demo> previewLocalStream() - video/screen/mediasouce 三个参数，仅允许一个取 true' + '\n';
		return;
	}

	let mediaStream = null;
	
	if (Boolean(screen))
	{
		mediaStream = gScreenStream;
	}
	else if (Boolean(mediasource))
	{
		mediaStream = gMediaSourceStream;
	}
	else if (Boolean(video) || Boolean(audio))
	{
		mediaStream = gStream;
	}

	if (mediaStream === null)
	{
		let resolutionEle = document.getElementById('resolution');
		let specRes = (!!resolutionEle) ? resolutionEle.value : '480p';
		let resolution = Boolean(screen) ? '1080p' : specRes;

		const streamId = Boolean(screen) ? `${userid}-screen` : `${userid}`;

		console.log(`<demo> previewLocalStream() userid: ${userid} cameraDevId: ${cameraDevId} micDevId: ${micDevId} resolution: ${resolution}`);

		// 
		// 
		let audioSource = null;
		let videoSource = null;
		if (mediasource)
		{
			createMediaSourceStream();

			if (!!sourceMediaStream)
			{
				const audioTracks = sourceMediaStream.getVideoTracks();
				if (audioTracks.length > 0)
					audioSource = audioTracks[0];
				const videoTracks = sourceMediaStream.getAudioTracks();
				if (videoTracks.length > 0)
					videoSource = videoTracks[0];
			}
		}

		mediaStream = RTCObj.createStream({
			streamId,
			userId: +userid,
			audio: Boolean(audio),
			video: Boolean(video),
			screen: Boolean(screen),
			mediasource: Boolean(mediasource),
			audioSource,
			videoSource,
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile : resolution },
			openAudioCtx: true
		});

		if (!mediaStream)
			return;

		window.ls = mediaStream;

		// 
		if (audioProfile !== 'default')
		{
			mediaStream.setAudioProfile(audioProfile);
		}

		mediaStream.init(() => {
			if (!Boolean(mediasource) && (Boolean(video) || Boolean(screen)))
			{
				const videoId = Boolean(screen) ? '3t_local_screen' : '3t_local';
				let videoE = document.createElement('video');
				videoE.id = videoId;
				videoE.muted = true;
				videoE.autoplay = true;
				videoE.controls = true;
				videoE.setAttribute('playsinline', '');
				videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

				if (Boolean(screen))
				{
					if (!!screenEle)
					{
						screenEle.append(videoE);
					}
				}
				else
				{
					if (!!videoEle)
					{
						videoEle.append(videoE);
					}
				}

				mediaStream.play(videoId, true);
			}
			// 
			
			streams.set(mediaStream.getId(), mediaStream);

			if (Boolean(screen))
			{
				gScreenStream = mediaStream;
			}
			else if (Boolean(mediasource))
			{
				gMediaSourceStream = mediaStream;
			}
			else if (Boolean(video) || Boolean(audio))
			{
				gStream = mediaStream;
			}
			// 
		}, (evt) => {
			text_info.value = text_info.value + `<demo> publishStream - Stream.init failed. - error: ${JSON.stringify(evt)}` + '\n';
			console.log('<demo> publishStream - Stream.init failed. - error: ' + evt);
		});
	}
	else
	{
		const videoId = Boolean(screen) ? '3t_local_screen' : '3t_local';
		mediaStream.play(videoId, true);
	}
}
  
// 
function publishStream(opts)
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + '<demo> publishStream - 请先[加入房间]' + '\n';
		return;
	}

	const {
		userid,
		audio,
		video,
		screen,
		mediasource
	} = opts;

	let v = (+video) + (+screen) + (+mediasource);
	if (v > 1)
	{
		text_info.value = text_info.value + '<demo> publishStream - video/screen/mediasouce 三个参数，仅允许一个取 true' + '\n';
		return;
	}

	let mediaStream = null;
	
	if (Boolean(screen))
	{
		mediaStream = gScreenStream;
	}
	else if (Boolean(mediasource))
	{
		mediaStream = gMediaSourceStream;
	}
	else if (Boolean(video) || Boolean(audio))
	{
		mediaStream = gStream;
	}

	if (mediaStream === null)
	{
		let resolutionEle = document.getElementById('resolution');
		let specRes = (!!resolutionEle) ? resolutionEle.value : '480p';
		let resolution = Boolean(screen) ? '1080p' : specRes;

		const streamId = Boolean(screen) ? `${userid}-screen` : `${userid}`;

		console.log(`<demo> publishStream() userid: ${userid} video: ${video} cameraDevId: ${cameraDevId} audio: ${audio} micDevId: ${micDevId} resolution: ${resolution}`);

		// 
		// 
		let audioSource = null;
		let videoSource = null;
		if (mediasource)
		{
			createMediaSourceStream();

			if (!!sourceMediaStream)
			{
				const audioTracks = sourceMediaStream.getVideoTracks();
				if (audioTracks.length > 0)
					audioSource = audioTracks[0];
				const videoTracks = sourceMediaStream.getAudioTracks();
				if (videoTracks.length > 0)
					videoSource = videoTracks[0];
			}
		}

		mediaStream = RTCObj.createStream({
			streamId,
			userId: +userid,
			audio: Boolean(audio),
			video: Boolean(video),
			screen: Boolean(screen),
			mediasource: Boolean(mediasource),
			audioSource,
			videoSource,
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile : resolution },
			openAudioCtx: true
		});

		if (!mediaStream)
			return;

		window.ls = mediaStream;

		// 
		if (audioProfile !== 'default')
		{
			mediaStream.setAudioProfile(audioProfile);
		}

		mediaStream.init(() => {
			mediaStream.on('screen-close', (e) => {
				console.log(`<demo> event [screen-close] - ${JSON.stringify(e)}`);
				unpublishStream({
					video       : false,
					screen      : true,
					mediasource : false
				});
			});
			// 
			if (!Boolean(mediasource) && (Boolean(video) || Boolean(screen)))
			{
				const videoId = Boolean(screen) ? '3t_local_screen' : '3t_local';
				let videoE = document.createElement('video');
				videoE.id = videoId;
				videoE.muted = true;
				videoE.autoplay = true;
				videoE.controls = true;
				videoE.setAttribute('playsinline', '');
				videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

				if (Boolean(screen))
				{
					if (!!screenEle)
					{
						screenEle.append(videoE);
					}
				}
				else
				{
					if (!!videoEle)
					{
						videoEle.append(videoE);
					}
				}

				mediaStream.play(videoId, true);
			}
			// 
			
			let micPlaybackEle = document.getElementById('micPlayback');
			if (!!micPlaybackEle)
			{
				let micPlayback = micPlaybackEle.checked;
				if (Boolean(micPlayback))
				{
					mediaStream.play();
				}
			}

			streams.set(mediaStream.getId(), mediaStream);

			if (Boolean(screen))
			{
				gScreenStream = mediaStream;
			}
			else if (Boolean(mediasource))
			{
				gMediaSourceStream = mediaStream;
			}
			else if (Boolean(video) || Boolean(audio))
			{
				gStream = mediaStream;
			}

			_publishStream(userid, mediaStream, () => {
				if (Boolean(screen))
				{
					document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
					hasPublishScreen = true;
				}
				else if (Boolean(mediasource))
				{
					document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="green">已推流</font>`;
					hasPublishMediaSource = true;
				}
				else if (Boolean(video) || Boolean(audio))
				{
					document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
					hasPublishStream = true;
				}
			}, () => {
				if (Boolean(screen))
				{
					document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
				}
				else if (Boolean(mediasource))
				{
					document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
				}
				else if (Boolean(video) || Boolean(audio))
				{
					document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
				}
			});
			// 
		}, (evt) => {
			text_info.value = text_info.value + `<demo> publishStream - Stream.init failed. - error: ${JSON.stringify(evt)}` + '\n';
			console.log('<demo> publishStream - Stream.init failed. - error: ' + evt);
		});
	}
	else
	{
		if (Boolean(screen) && hasPublishScreen)
		{
			text_info.value = text_info.value + `<demo> publishStream - hasPublishScreen: ${hasPublishScreen} mediaStream: ${mediaStream.getId()}` + '\n';
			console.log(`<demo> publishStream - hasPublishScreen: ${hasPublishScreen}  mediaStream: ${mediaStream.getId()}`);

			return;
		}
		else if (Boolean(mediasource) && hasPublishMediaSource)
		{
			text_info.value = text_info.value + `<demo> publishStream - hasPublishMediaSource: ${hasPublishMediaSource} mediaStream: ${mediaStream.getId()}` + '\n';
			console.log(`<demo> publishStream - hasPublishMediaSource: ${hasPublishMediaSource}  mediaStream: ${mediaStream.getId()}`);
	
			return;
		}
		else if ((Boolean(video) || Boolean(audio)) && hasPublishStream)
		{
			text_info.value = text_info.value + `<demo> publishStream - hasPublishStream: ${hasPublishStream} mediaStream: ${mediaStream.getId()}` + '\n';
			console.log(`<demo> publishStream - hasPublishStream: ${hasPublishStream}  mediaStream: ${mediaStream.getId()}`);
	
			return;
		}

		// 
		_publishStream(userid, mediaStream, () => {
			if (Boolean(screen))
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
				hasPublishScreen = true;
			}
			else if (Boolean(mediasource))
			{
				document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="green">已推流</font>`;
				hasPublishMediaSource = true;
			}
			else if (Boolean(video) || Boolean(audio))
			{
				document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
				hasPublishStream = true;
			}
		}, () => {
			if (Boolean(screen))
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
			}
			else if (Boolean(mediasource))
			{
				document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
			}
			else if (Boolean(video) || Boolean(audio))
			{
				document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
			}
		});
	}
	// 
}

function _publishStream(userid, mediaStream, onSuccess, onFailure)
{
	if (!mediaStream)
	{
		text_info.value = text_info.value + '<demo> _publishStream error - mediaStream is null' + '\n';
		console.log('<demo> _publishStream error - mediaStream is null');

		return;
	}

	// 
	client.publish(mediaStream, () => {
		// 
		text_info.value = text_info.value + `<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.getId()}` + '\n';
		console.log(`<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.getId()}`);

		// 
		onSuccess && onSuccess();

		// 
		// const streamId = mediaStream.getId();
		// setStreamSEI(userid, streamId, 'add', false);

		// 
		if (mediaStream.hasAudio())
		{
			mediaStream.on('volume-change', e => {
				if (!!audioVolumeProgressEle)
					audioVolumeProgressEle.value = e.volume;
				if (!!audioVolumeValueEle)
					audioVolumeValueEle.innerHTML = e.volume;
				; // console.log(`<AUDIO-VOLUME> - volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
		}
	}, (evt) => {
		text_info.value = text_info.value + `_publishStream - client.publish failed. - error: ${JSON.stringify(evt)}` + '\n';
		console.log(`<demo> _publishStream - client.publish failed. - error: ${JSON.stringify(evt)}`);

		onFailure && onFailure();
	});
}

function unpublishStream(opts)
{
	_innerUnpublishStream(opts);
}

function _innerUnpublishStream(opts)
{
	const { video, screen, mediasource } = opts;
	let mediaStream = null;

	if (Boolean(screen))
	{
		mediaStream = gScreenStream;
		hasPublishScreen = false;
	}
	else if (Boolean(mediasource))
	{
		mediaStream = gMediaSourceStream;
		hasPublishMediaSource = false;
	}
	else if (Boolean(video) || Boolean(audio))
	{
		mediaStream = gStream;
		hasPublishStream = false;
	}

	if (mediaStream === null)
	{
		text_info.value = text_info.value + 'unpublishStream - 当前尚未创建 mediaStream' + '\n';
		console.log('<demo> 当前尚未创建 mediaStream');
		return;
	}

    client.unpublish(mediaStream, () => {
		text_info.value = text_info.value + `<demo> unpublishStream - client.unpublish local stream ${mediaStream.getId()} success.` + '\n';
        console.log(`<demo> unpublishStream - client.unpublish local stream ${mediaStream.getId()} success.`);
    }, () => {
		text_info.value = text_info.value + '<demo> unpublishStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishStream - client.unpublish local stream failed');
	}, true);

	//
	if (Boolean(screen))
	{
		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
	}
	else if (Boolean(mediasource))
	{
		document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
	}
	else if (Boolean(video) || Boolean(audio))
	{
		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
	}
}

//
let previewLocalEle = document.getElementById('previewLocal');
if (!!previewLocalEle)
{
	previewLocalEle.addEventListener('click', () => {
		previewLocalStream({
			userid : userIdEle.value,
			audio  : true,
			video  : true,
			screen : false,
			mediasource : false
		});
	})
}

//
let publishAudioStreamEle = document.getElementById('publishAudioStream');
if (!!publishAudioStreamEle)
{
	publishAudioStreamEle.addEventListener('click', () => {
		publishStream({
			userid : userIdEle.value,
			audio  : true,
			video  : false,
			screen : false,
			mediasource : false
		});
	})
}

// 
let publishStreamEle = document.getElementById('publishStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () => {
		publishStream({
			userid : userIdEle.value,
			audio  : true,
			video  : true,
			screen : false,
			mediasource : false
		});
	})
}

let unpublishStreamEle = document.getElementById('unpublishStream');
if (!!unpublishStreamEle)
{
	unpublishStreamEle.addEventListener('click', () => {
		unpublishStream({
			video       : true,
			screen      : false,
			mediasource : false
		});
	})
}

let micPlaybackEle = document.getElementById('micPlayback');
if (!!micPlaybackEle)
{
	micPlaybackEle.addEventListener('click', () => {
		let micPlayback = document.getElementById('micPlayback').checked;
		if (Boolean(micPlayback))
		{
			gStream.play();
		}
		else
		{
			gStream.stopPlay();
		}
	});
}

// 
let cloneVideoTrack = null;
let testMediaStream = null;
let testOpenCameraEle = document.getElementById('testOpenCamera');
if (!!testOpenCameraEle)
{
	const constraints = {
		audio: true,
		video: true
	}
	testOpenCameraEle.addEventListener('click', () => {
		navigator.mediaDevices.getUserMedia(constraints)
			.then(stream => {
				testMediaStream = stream;

				let tracks = stream.getVideoTracks();
				if (tracks.length > 0)
				{
					cloneVideoTrack = tracks[0].clone();
				}
				//
				const videoId = 'test_camera';
				let videoE = document.createElement('video');
				videoE.id = videoId;
				videoE.muted = true;
				videoE.autoplay = true;
				videoE.controls = true;
				videoE.setAttribute('playsinline', '');
				videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;';

				videoE.srcObject = testMediaStream;

				if (!!videoEle)
				{
					videoEle.append(videoE);
				}
			});
	})
}

let testCtrlCameraEle = document.getElementById('testCtrlCamera');
if (!!testCtrlCameraEle)
{
	testCtrlCameraEle.addEventListener('click', () => {
		testMediaStream.getVideoTracks().forEach((track) => {
			track.stop();
			testMediaStream.removeTrack(track);
		});

		cloneVideoTrack.stop();
		cloneVideoTrack.stop();
	})
}

// 
let isCameraStoped = false;
let ctrlCameraEle = document.getElementById('ctrlCamera');
if (!!ctrlCameraEle)
{
	ctrlCameraEle.addEventListener('click', () => {
		if (!client)
		{
			return;
		}
		if (!gStream)
		{
			return;
		}

		if (isCameraStoped)
		{
			gStream.openCamera();
		}
		else
		{
			gStream.closeCamera();
		}

		isCameraStoped = !isCameraStoped;

		ctrlCameraEle.innerHTML = isCameraStoped ? 'startCamera' : 'stopCamera';
	})
}

let isVideoPaused = false;
let pauseVideoEle = document.getElementById('pauseVideo');
if (!!pauseVideoEle)
{
	pauseVideoEle.addEventListener('click', () => {
		if (!client)
		{
			return;
		}
		if (!gStream)
		{
			return;
		}

		if (isVideoPaused)
		{
			client.resumeWebcam(gStream, () => {
				console.log('<demo> client.resumeWebcam succ.');
			}, (e) => {
				console.log(`<demo> client.resumeWebcam fail - ${e.toString()}`);
			});
		}
		else
		{
			client.pauseWebcam(gStream, false, () => {
				console.log('<demo> client.pauseWebcam succ.');
			}, (e) => {
				console.log(`<demo> client.pauseWebcam fail - ${e.toString()}`);
			});
		}

		isVideoPaused = !isVideoPaused;

		pauseVideoEle.innerHTML = isVideoPaused ? 'resumeVideo' : 'pauseVideo';
	})
}

let isAudioPaused = false;
let pauseAudioEle = document.getElementById('pauseAudio');
if (!!pauseAudioEle)
{
	pauseAudioEle.addEventListener('click', () => {
		if (!client)
		{
			return;
		}
		if (!gStream)
		{
			return;
		}
	
		if (isAudioPaused)
		{
			client.resumeMic(gStream, () => {
				console.log('<demo> client.resumeMic succ.');
			}, (e) => {
				console.log(`<demo> client.resumeMic fail - ${e.toString()}`);
			});
		}
		else
		{
			client.pauseMic(gStream, () => {
				console.log('<demo> client.pauseMic succ.');
			}, (e) => {
				console.log(`<demo> client.pauseMic fail - ${e.toString()}`);
			});
		}
	
		isAudioPaused = !isAudioPaused;
	
		pauseAudioEle.innerHTML = isAudioPaused ? 'resumeAudio' : 'pauseAudio';
	})	
}

let isAudioDisabled = false;
let disableAudioEle = document.getElementById('disableAudio');
if (!!disableAudioEle)
{
	disableAudioEle.addEventListener('click', () => {
		if (!client)
		{
			return;
		}
		if (!gStream)
		{
			return;
		}

		if (isAudioDisabled)
		{
			gStream.enableAudio();
		}
		else
		{
			gStream.disableAudio();
		}

		isAudioDisabled = !isAudioDisabled;

		disableAudioEle.innerHTML = isAudioDisabled ? 'enableAudio' : 'disableAudio';
	})
}

// 
let publishScreenEle = document.getElementById('publishScreen');
if (!!publishScreenEle)
{
	publishScreenEle.addEventListener('click', () => {
		publishStream({
			userid : userIdEle.value,
			audio  : false,
			video  : false,
			screen : true,
			mediasource : false
		});
	})	
}

let unpublishScreenEle = document.getElementById('unpublishScreen');
if (!!unpublishScreenEle)
{
	unpublishScreenEle.addEventListener('click', () => {
		unpublishStream({
			video       : false,
			screen      : true,
			mediasource : false
		});
	})
}

// 
let publishMediaSourceEle = document.getElementById('publishMediaSource');
if (!!publishMediaSourceEle)
{
	publishMediaSourceEle.addEventListener('click', () => {
		publishStream({
			userid : userIdEle.value,
			audio  : false,
			video  : false,
			screen : false,
			mediasource : true
		});
	})	
}

let unpublishMediaSourceEle = document.getElementById('unpublishMediaSource');
if (!!unpublishMediaSourceEle)
{
	unpublishMediaSourceEle.addEventListener('click', () => {
		unpublishStream({
			video       : false,
			screen      : false,
			mediasource : true
		});
	})
}

let resolutionEle = document.getElementById('resolution');
if (!!resolutionEle)
{
	resolutionEle.addEventListener('change', () => {
		let prof = resolutionEle.value;
	
		setVideoProfile(prof);
	})
}

let micVolumeSliderEle = document.getElementById('micVolumeSlider');
if (!!micVolumeSliderEle)
{
	micVolumeSliderEle.addEventListener('change', () => {
		var value = (micVolumeSliderEle.value) / 10;
		let micVolumeSliderValueEle = document.getElementById('micVolumeSliderValue');
		if (!!micVolumeSliderValueEle)
		{
			micVolumeSliderValueEle.innerHTML = (value);
		}
		
		if (!!gStream)
		{
			gStream.setInputVolume(+value);
		}

		// 
		remote_stream.forEach((item) =>
		{
			if (!!item)
			{
				// 
				item.setAudioVolume(+value);
			}
		});
	})
}

function getDevices()
{
	let message = '';
	
    TTTRtcWeb.listDevices((devices) => {
		// 
        devices.forEach((deviceInfo) => {
            message = '<demo> getDevices - ' + deviceInfo.kind + ': ' + deviceInfo.label + ' id: ' + deviceInfo.deviceId + '\n';
			text_info.value = text_info.value + message;
			console.log(message);

            let option = document.createElement('option');
            option.value = deviceInfo.deviceId;
			if (deviceInfo.kind === 'audioinput')
			{
				if (!!audioInputSelect)
				{
					option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
					audioInputSelect.appendChild(option);
				}
			}
			else if (deviceInfo.kind === 'audiooutput')
			{
				if (!!audioOutputSelect)
				{
					option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
					audioOutputSelect.appendChild(option);
				}
			}
			else if (deviceInfo.kind === 'videoinput')
			{
				if (!!videoSelect)
				{
					option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
					videoSelect.appendChild(option);
				}
			}
			else
			{
                console.log('<demo> Some other kind of source/device: ', deviceInfo);
            }
		});
		
		if (!!audioInputSelect)
		{
			// 
			let option = document.createElement('option');
			option.value = 'default';
			option.text = 'Default';

			audioInputSelect.appendChild(option);
		}

		if (!!audioOutputSelect)
		{
			// 
			let option = document.createElement('option');
			option.value = 'default';
			option.text = 'Default';

			audioOutputSelect.appendChild(option);
		}
    }, (err) => {
		const errMsg = err.name + err.message + '\n';
		text_info.value = text_info.value + errMsg;
    });
}

// 
if (!!videoSelect)
{
	videoSelect.addEventListener('change', () => {
		let index = videoSelect.selectedIndex;
	
		cameraDevId = videoSelect.options[index].value;
	
		console.log(`<demo> cameraDev change - cameraDevId: ${cameraDevId}`);

		// switch device for Stream
		if (!!gStream)
		{
			gStream.switchDevice('video', cameraDevId, () => {
				console.log(`<demo> switchDevice succ - deviceId: ${cameraDevId}`);
			}, (e) =>{
				console.log(`<demo> switchDevice fail - deviceId: ${cameraDevId} - ${e.toString()}`);
			});
		}
	})
}

// 
if (!!audioInputSelect)
{
	audioInputSelect.addEventListener('change', () => {
		let index = audioInputSelect.selectedIndex;
	
		micDevId = audioInputSelect.options[index].value;
		
		console.log(`<demo> micDev change - micDevId: ${micDevId}`);

		// switch device for Stream
		if (!!gStream)
		{
			gStream.switchDevice('audio', micDevId, () => {
				console.log(`<demo> switchDevice succ - deviceId: ${micDevId}`);
			}, (e) =>{
				console.log(`<demo> switchDevice fail - deviceId: ${micDevId} - ${e.toString()}`);
			});
		}
	})
}

// 
if (!!audioOutputSelect)
{
	audioOutputSelect.addEventListener('change', () => {
		let index = audioOutputSelect.selectedIndex;
	
		speakerDevId = audioOutputSelect.options[index].value;

		// 
		remote_stream.forEach((item) =>
		{
			if (!!item)
			{
				// 
				item.setAudioOutput(speakerDevId, (e) => {
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput succc - ${JSON.stringify(e)}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput succc. - ' + e);	
				}, (e) => {
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput fail - ${JSON.stringify(e)}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput fail. - ' + e);	
				});
			}
		});

		console.log(`<demo> speakerDev change - speakerDevId: ${speakerDevId}`);
	})
}

// 
let audioCodecEle = document.getElementById('audioCodec');
if (!!audioCodecEle)
{
	audioCodecEle.addEventListener('change', () => {
		let index = audioCodecEle.selectedIndex;

		audioCodec = audioCodecEle.options[index].value;

		console.log(`<demo> audioCodec change - audioCodec: ${audioCodec}`);
	})
}
// 
let audioProfileEle = document.getElementById('audioProfile');
if (!!audioProfileEle)
{
	audioProfileEle.addEventListener('change', () => {
		let index = audioProfileEle.selectedIndex;
	
		audioProfile = audioProfileEle.options[index].value;
		
		console.log(`<demo> audioProfile change - audioProfile: ${audioProfile}`);
	})
}

let userRoleEle = document.getElementById('userRole');
if (!!userRoleEle)
{
	userRoleEle.addEventListener('change', () => {
		let index = userRoleSelect.selectedIndex;

		userRole = userRoleSelect.options[index].value;
		
		console.log(`<demo> userRole change - userRole: ${userRole}`);

		// 
		if (!!client)
		{
			client.setUserRole(userRole, () => {
				console.log(`<demo> setUserRole() succ. - role: ${userRole}`);
			}, (e) => {
				console.log(`<demo> setUserRole() fail - ${e.toString()}`);
			});
		}
	})
}

// 
let submitLogEle = document.getElementById('submitLog');
if (!!submitLogEle)
{
	submitLogEle.addEventListener('click', () => {
		const isSubmitLog = submitLogEle.checked;
		TTTRtcWeb.setLogSubmit(isSubmitLog);
		console.log(`<demo> submitLog: ${isSubmitLog}`);
	})
}
