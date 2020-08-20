import TTTRtcWeb from '../../lib/tttwebsdk'; // import from local tttwebsdk.js
// import TTTRtcWeb from 'tttwebsdk'; // npm install tttwebsdk@latest

// 
//TTTRtcWeb.setPrivate(true);
//TTTRtcWeb.setIpLocationAddress('xxx.xxx.cn');
//TTTRtcWeb.setIpLocationPort(8443);
// TTTRtcWeb.setIpLocationAddress('v1.jkim.ccb.com');
// TTTRtcWeb.setServerUrl('114_115_172_21.3ttech.cn'); 
// TTTRtcWeb.setServerUrl('v7.jkim.ccb.com');
// TTTRtcWeb.setServerUrl('gzeduservice.3ttech.cn');
// TTTRtcWeb.setLogSubmit(false);
// TTTRtcWeb.setServerUrl('xiaoyao1.3ttech.cn');
// TTTRtcWeb.setServerUrl('114_115_172_21.3ttech.cn'); 
// TTTRtcWeb.setServerUrl('webmedia3.3ttech.cn'); 

const pkg = require('../../package.json');
const demoVersion = pkg.version;

const sdkVersion = TTTRtcWeb.getVersion();
const isSupp = TTTRtcWeb.isSystemSupported();


document.getElementById('sysVersion').innerHTML = `ver: ${demoVersion} - ${sdkVersion} -- isSupp: ${isSupp}`;

// 
let RTCObj = new TTTRtcWeb();
let client = null;
let streams = new Map();

let gScreenCDNStream = null; // this.publishScreen() 所使用的 stream
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

let xAppID = 'a967ac491e3acf92eed5e1b5ba641ab7';
const appIdSelect = document.getElementById('appID');
if (!!appIdSelect)
{
	appIdSelect.addEventListener('change', () =>
	{
		let index = appIdSelect.selectedIndex;
		xAppID = appIdSelect.options[index].value;
	})
}

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
let videoEle = document.getElementById('video');
let screenEle = document.getElementById('screen');
let screenRecEle = document.getElementById('screenRec');

let audioVolumeProgressEle = document.getElementById('audioVolumeProgress');
let audioVolumeValueEle = document.getElementById('audioVolumeValue');
// 
let userRole = 2;

// 
let tttStatus = 0;

// 
// url: https://...../?auto=1&r=666777&u=111111&h=webmedia4.3ttech.cn
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
	return (false);
}

// 登录
let joinChanEle = document.getElementById('joinChan');
if (!!joinChanEle)
{
	joinChanEle.addEventListener('click', () =>
	{
		let appId = xAppID;
		let rid = roomIdEle.value;
		let uid = userIdEle.value;
		joinChan(appId, rid, uid);
	})
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
	TTTRtcWeb.setLogSubmit(true);

	// 
	
	const cdnUrl = (!!rtmpUrlEle) ? rtmpUrlEle.value : '';
	client = RTCObj.createClient({
		role: userRole,
		rtmpUrl: cdnUrl,
		videoMixerBGIUrl: 'http://3ttech.cn/res/tpl/default/images/black.jpg',
		audioCodec
	});

	client.init(appid, userid, () =>
	{
		client.join('', chanid, () =>
		{
			text_info.value = `<demo> 成功加入房间!! userid: ${userid}` + '\n';
			console.log(`<demo> 成功加入房间!! userid: ${userid}`);

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- role: ${userRole}<br>`;


			tttStatus = 1; // 状态标注为: 登录成功
			// 
			intv = setInterval(() =>
			{
				_printStats();
				// for 
			}, 2000);
		}, (err) =>
		{
			tttStatus = 0;

			text_info.value = text_info.value + `<demo> login fail - ${err}` + '\n';
			console.log(`<demo> login fail - ${err}`);

			document.getElementById('loginStatus').innerHTML = '<font color="red">登录失败</font>';
			document.getElementById('loginInfo').innerHTML = '';
		});
	}, (err) =>
	{
		text_info.value = text_info.value + `<demo> init fail - ${err}` + '\n';
		console.log(`<demo> init fail - ${err}`);

		return;
	});

	client.on('device-hot-plug', (e) =>
	{
		console.log(`<demo> - event [device-hot-plug] - ${JSON.stringify(e)}`);
	})

	client.on('connection-state-change', (evt) =>
	{
		console.log(`<demo> - event [connection-state-change] - ${JSON.stringify(evt)}`);
	});

	client.on('disconnected', (e) =>
	{
		tttStatus = 0;

		console.log('<demo> - event [disconnected]');

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

		evt.streams.forEach(stream =>
		{
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

	client.on('rtmp-success', (evt) =>
	{
		console.log(`<demo> - event [rtmp-success] - ${JSON.stringify(evt)}`);
	});

	client.on('onTokenPrivilegeWillExpire', (evt) =>
	{
		console.log(`<demo> - event [onTokenPrivilegeWillExpire] - ${JSON.stringify(evt)}`);
	});

	client.on('stream-published', (evt) =>
	{
		const { stream } = evt;
		console.log(`<demo> - event [stream-published] - streamId: ${ !stream ? 'invalide-stream' : stream.getId() }`);
	});

	client.on('stream-unpublished', (evt) =>
	{
		const { stream } = evt;
		console.log(`<demo> - event [stream-unpublished] - streamId: ${ !stream ? 'invalide-stream' : stream.getId() }`);
	});

	client.on('screen-published', (evt) =>
	{
		const { stream } = evt;
		console.log(`<demo> - event [screen-published] - streamId: ${ !stream ? 'invalide-stream' : stream.getId() }`);
	});

	client.on('screen-unpublished', (evt) =>
	{
		const { stream } = evt;
		console.log(`<demo> - event [screen-unpublished] - streamId: ${ !stream ? 'invalide-stream' : stream.getId() }`);
	});

	client.on('audio-added', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [audio-added] streamId: ${evt.stream.getId()}`);

		remote_stream.set(stream.getId(), stream);
		
		let in_stream = remote_stream.get(stream.getId());
		client.subscribe(in_stream, (event) =>
		{
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.getId()} succ` + '\n';
			// successful doing someting, like play remote video or audio.
		}, (err) =>
		{
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.getId()} fail - ${err}` + '\n';
			// info.val(info.val() + 'Subscribe stream failed' + err + '\n');
		});
	});

	client.on('audio-removed', (evt) =>
	{
		const streamId = evt.streamId;

		console.log(`<demo> - event [audio-removed] streamId: ${streamId}`);
	});

	client.on('video-added', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [video-added] streamId: ${stream.getId()} videoType: ${stream.videoType}`);

		remote_stream.set(stream.getId(), stream);
		// 
		let in_stream = remote_stream.get(stream.getId());
		client.subscribe(in_stream, (event) =>
		{
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} succ` + '\n';
			// successful doing someting, like play remote video or audio.
		}, (err) =>
		{
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} fail - ${err}` + '\n';
			// info.val(info.val() + 'Subscribe stream failed' + err + '\n');
		});

		// 
		setLiveMixerLayout();
	})

	client.on('video-removed', (evt) =>
	{
		const { streamId, stream } = evt;

		console.log(`<demo> - event [video-removed] streamId: ${streamId} videoType: ${stream.videoType}`);

		/*
		let in_stream = remote_stream.get(streamId);
		if (!!in_stream)
			in_stream.close();
		// 

		// remove stream from map
		remote_stream.delete(streamId);
		*/

		// 
		let obj = document.getElementById('3t_remote' + streamId);
		if (obj)
		{
			obj.remove();
		}
	})

	client.on('video-update', (evt) =>
	{
		const { userId, streamId, videoType } = evt;

		console.log(`<demo> - event [video-update] userId: ${userId} streamId: ${streamId} videoType: ${videoType}`);
	})

	client.on('stream-subscribed', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.videoType: ${stream.videoType}`);

		if (stream.hasAudio())
		{
			stream.on('volume-change', e =>
			{
				; // console.log(`<AUDIO-VOLUME> - volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
			
			stream.play();
		}

		if (stream.hasVideo())
		{
			var videoId = '3t_remote' + stream.getId();
			if (!!videoEle && !document.getElementById(videoId))
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

	client.on('stream-unsubscribed', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [stream-unsubscribed] streamId: ${stream.getId()} stream.videoType: ${stream.videoType}`);
	});

	client.on('video-mute', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [video-mute] streamId: ${stream.getId()}`);

		stream._video.style.backgroundColor = 'transparent';
		// stream._video.srcObject = null;
		stream._video.poster = 'https://www.3ttech.cn/res/tpl/default/img/logo-white.png';

		// visibility: hidden

	});

	client.on('video-unmute', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [video-unmute] streamId: ${stream.getId()}`);

		stream._video.style.backgroundColor = '#000';
		stream._video.srcObject = stream._streamObj;
		stream._video.poster = '';
	});

	client.on('audio-mute', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [audio-mute] streamId: ${stream.getId()}`);
	});
	
	client.on('audio-unmute', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [audio-unmute] streamId: ${stream.getId()}`);
	});
}

function _printStats()
{
	// stream_net_info.value = `${JSON.stringify(client.getNetState())}`;
	// 
	const rAudioStats = client.remoteAudioStats();
	rAudioStats.forEach((value, key) =>
	{
		; // console.log(`<demo> <STAT> audioDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
	});

	// 
	const rVideoStats = client.remoteVideoStats();
	rVideoStats.forEach((value, key) =>
	{
		; // console.log(`<demo> <STAT> videoDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
	});

	// 
	const lAudioStats = client.localAudioStats();
	lAudioStats.forEach((value, key) =>
	{
		; // console.log(`<demo> <STAT> audioUpStat -- streamId: ${key} ${JSON.stringify(value)}`);
	});

	// 
	const lVideoStats = client.localVideoStats();
	lVideoStats.forEach((value, key) =>
	{
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
}

// 退出
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

	client.setRtmpUrl({ url, avMode: pureAudioEle.checked ? 'audio' : 'av' });
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
	unpublishVideoStream({});
	unpublishScreenStream({});
	unpublishScreenCDNStream({});
	unpublishMediaSourceStream({});

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

const splitWnd1 = [{ x: 0, y: 0 }];
const splitWnd4 = [{ x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }];
const splitWnd9 = [{ x: 0, y: 0 }, { x: 0.33, y: 0 }, { x: 0.66, y: 0 }, { x: 0, y: 0.33 }, { x: 0.33, y: 0.33 }, { x: 0.66, y: 0.33 }, { x: 0, y: 0.66 }, { x: 0.33, y: 0.66 }, { x: 0.66, y: 0.66 }];

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

	if (!!gScreenCDNStream)
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
		user.renderMode = 'scale';

		liveMixerLayout.users.push(user);

		nIndex++;
	}

	if (!!gScreenCDNStream)
	{
		let user = {};

		user.userId = gScreenCDNStream.userId;
		user.streamId = `${userId}:screen`;
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

	text_info.value = text_info.value + `<demo> setLiveMixerLayout ...liveMixerLayout: ${JSON.stringify(liveMixerLayout)}` + '\n';

	client.setLiveMixerLayout(liveMixerLayout, () => { }, () => { });
}

function setVideoProfile(prof)
{
	if (gStream === null)
	{
		return;
	}

	// set video profile
	gStream.setVideoProfile(prof, (msg) =>
	{
		text_info.value = text_info.value + `<demo> setVideoProfile - gStream.setVideoProfile succ. ${prof}` + '\n';
		console.log(`<demo> setVideoProfile - gStream.setVideoProfile succ: ${prof}`);
	}, (e) =>
	{
		text_info.value = text_info.value + `<demo> setVideoProfile - gStream.setVideoProfile fail - ${e}` + '\n';
		console.log('<demo> setVideoProfile - gStream.setVideoProfile - error: ' + e);
	});
}

//
/******************* for previewLocal */
//
let previewLocalEle = document.getElementById('previewLocal');
if (!!previewLocalEle)
{
	previewLocalEle.addEventListener('click', () =>
	{
		previewLocalStream({
			userid: userIdEle.value
		});
	})
}

function previewLocalStream(opts)
{
	if (RTCObj === null)
	{
		RTCObj = new TTTRtcWeb();
	}

	const {
		userid
	} = opts;

	if (gStream === null)
	{
		let resolutionEle = document.getElementById('resolution');
		let specRes = (!!resolutionEle) ? resolutionEle.value : '480p';
		let resolution = specRes;

		let codecOptions = undefined;
		let videoBitrate = 0;
		const videoBitrateEle = document.getElementById('videoBitrate');
		if (!!videoBitrateEle)
		{
			videoBitrate = videoBitrateEle.value;
		}
		videoBitrate = +videoBitrate;
		if (videoBitrate > 0)
		{
			if (videoBitrate < 150)
				videoBitrate = 150;

			codecOptions = {
				startBitrate: videoBitrate / 2,
				maxBitrate: videoBitrate,
				minBitrate: 20
			};
		}

		console.log(`<demo> previewLocalStream() userid: ${userid} cameraDevId: ${cameraDevId} micDevId: ${micDevId} resolution: ${resolution}`);

		gStream = RTCObj.createStream({
			userId: +userid,
			audio: true,
			video: true,
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile: resolution },
			codecOptions,
			openAudioCtx: true
		});

		if (!gStream)
			return;

		// 
		if (audioProfile !== 'default')
		{
			gStream.setAudioProfile(audioProfile);
		}

		gStream.init(() =>
		{
			{
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

				gStream.play(videoId, true);
			}
			// 

			streams.set(gStream.getId(), gStream);
			// 
		}, (evt) =>
		{
			text_info.value = text_info.value + `<demo> previewLocalStream - Stream.init fail - ${evt}` + '\n';
			console.log(`<demo> previewLocalStream - Stream.init fail - ${evt}`);
		});
	}
	else
	{
		const videoId = '3t_local';
		gStream.play(videoId, true);
	}
}

//
/******************* for Audio/Video Stream */
//
let publishAudioStreamEle = document.getElementById('publishAudioStream');
if (!!publishAudioStreamEle)
{
	publishAudioStreamEle.addEventListener('click', () =>
	{
		publishStream({
			userid: userIdEle.value,
			audio: true,
			video: false
		});
	})
}

// 
let publishStreamEle = document.getElementById('publishStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () =>
	{
		publishStream({
			userid: userIdEle.value,
			audio: true,
			video: true
		});
	})
}

let unpublishStreamEle = document.getElementById('unpublishStream');
if (!!unpublishStreamEle)
{
	unpublishStreamEle.addEventListener('click', () =>
	{
		unpublishVideoStream({});
	})
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
		video
	} = opts;

	if (gStream === null)
	{
		let resolutionEle = document.getElementById('resolution');
		let specRes = (!!resolutionEle) ? resolutionEle.value : '480p';
		let resolution = specRes;

		let codecOptions = undefined;

		let videoBitrate = 0;
		const videoBitrateEle = document.getElementById('videoBitrate');
		if (!!videoBitrateEle)
		{
			videoBitrate = videoBitrateEle.value;
		}
		videoBitrate = +videoBitrate;
		if (videoBitrate > 0)
		{
			if (videoBitrate < 150)
				videoBitrate = 150;

			codecOptions = {
				startBitrate: videoBitrate / 2,
				maxBitrate: videoBitrate,
				minBitrate: 20
			};
		}

		console.log(`<demo> publishStream() userid: ${userid} video: ${video} cameraDevId: ${cameraDevId} audio: ${audio} micDevId: ${micDevId} resolution: ${resolution}`);

		gStream = RTCObj.createStream({
			userId: +userid,
			audio: Boolean(audio),
			video: Boolean(video),
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile: resolution },
			codecOptions,
			openAudioCtx: true
		});

		if (!gStream)
			return;

		// 
		if (audioProfile !== 'default')
		{
			gStream.setAudioProfile(audioProfile);
		}

		gStream.init(() =>
		{
			let micPlayback = false;
			let micPlaybackEle = document.getElementById('micPlayback');
			if (!!micPlaybackEle)
			{
				micPlayback = micPlaybackEle.checked;
			}

			// 
			if (Boolean(video))
			{
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

				gStream.play(videoId, true, micPlayback);
			}
			//

			streams.set(gStream.getId(), gStream);
			
			_publishStream(userid, gStream, () => {
				document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
			}, () => {
				document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;

				// 
				gStream.close();
				gStream = null;
			});
			// 
		}, (evt) =>
		{
			text_info.value = text_info.value + `<demo> publishStream - Stream.init fail - ${evt}` + '\n';
			console.log(`<demo> publishStream - Stream.init fail - ${evt}`);
			
			// 
			gStream.close();
			gStream = null;
		});
	}
	else
	{
		// 
		_publishStream(userid, gStream, () => {
			document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
		}, () => {
			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;

			// 
			gStream.close();
			gStream = null;
		});
	}
	// 
}

// 
function unpublishVideoStream(opts)
{
	const { trackClosed } = opts;

	client.unpublish(gStream, () =>
	{
		text_info.value = text_info.value + `<demo> unpublishVideoStream - client.unpublish local stream ${gStream.getId()} success.` + '\n';
		console.log(`<demo> unpublishVideoStream - client.unpublish local stream ${gStream.getId()} success.`);
	}, () =>
	{
		text_info.value = text_info.value + '<demo> unpublishVideoStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishVideoStream - client.unpublish local stream failed');
	}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		gStream.close();

		const videoId = '3t_local';
		let obj = document.getElementById(videoId);
		if (obj)
		{
			console.log('<demo> unpublishVideoStream - obj.remove -- 3t_local');
			obj.remove();
		}

		gStream = null;
	}

	document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
}

// 
/******************* for ScreenCDN Stream */
// 
let publishScreenCDNEle = document.getElementById('publishScreenCDN');
if (!!publishScreenCDNEle)
{
	publishScreenCDNEle.addEventListener('click', () =>
	{
		publishScreenCDNStream();
	})
}

let unpublishScreenCDNEle = document.getElementById('unpublishScreenCDN');
if (!!unpublishScreenCDNEle)
{
	unpublishScreenCDNEle.addEventListener('click', () =>
	{
		unpublishScreenCDNStream();
	})
}

function publishScreenCDNStream()
{
	// 
	if (!gScreenCDNStream)
	{
		const userId = +(userIdEle.value);
		gScreenCDNStream = RTCObj.createStream({
			userId,
			audio: true,
			screen: true
		});

		if (!gScreenCDNStream)
			return;

		gScreenCDNStream.init(() =>
		{
			gScreenCDNStream.on('screen-close', (e) =>
			{
				console.log(`<demo> event [screen-close] - ${e.streamId}`);
				unpublishScreenCDNStream();
			});
			//

			// 
			const videoId = '3t_local_screen_cdn';
			let videoE = document.createElement('screenRec');
			videoE.id = videoId;
			videoE.muted = true;
			videoE.autoplay = true;
			videoE.controls = true;
			videoE.setAttribute('playsinline', '');
			videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

			if (!!screenRecEle)
			{
				screenRecEle.append(videoE);
			}

			gScreenCDNStream.play(videoId, true, false);

			streams.set(gScreenCDNStream.getId(), gScreenCDNStream);

			// 
			client.publishScreen(gScreenCDNStream, () =>
			{
				// 
				text_info.value = text_info.value + `<demo> publishScreenCDNStream - client.publishScreen succ. gScreenCDNStream: ${gScreenCDNStream.getId()}` + '\n';
				console.log(`<demo> publishScreenCDNStream - client.publishScreen succ. gScreenCDNStream: ${gScreenCDNStream.getId()}`);

				// 
				let url = rtmpUrlEle.value.trim();
				if (url !== '')
				{
					// url = `rtmp://push.3ttest.cn/sdk2/${roomIdEle.value.trim()}-screen-cdn`;
					client.setRtmpUrl({ url, avMode: 'av' });
				}

				// 
				setLiveMixerLayout();
				
				//
				let publishScreenCDNStatusEle = document.getElementById('publishScreenCDNStatus');
				if (!!publishScreenCDNStatusEle)
				{
					document.getElementById('publishScreenCDNStatus').innerHTML = `<font color="green">已推流</font>`;
				}
			}, (evt) =>
			{
				text_info.value = text_info.value + `publishScreenCDNStream - client.publishScreen fail - ${evt}` + '\n';
				console.log(`<demo> publishScreenCDNStream - client.publishScreen fail - ${evt}`);
				
				//
				let publishScreenCDNStatusEle = document.getElementById('publishScreenCDNStatus');
				if (!!publishScreenCDNStatusEle)
				{
					publishScreenCDNStatusEle.innerHTML = `<font color="black">未推流</font>`;
				}

				// 
				gScreenCDNStream.close();
				gScreenCDNStream = null;
			});
		}, (evt) =>
		{
			text_info.value = text_info.value + `<demo> publishScreenCDNStream - Stream.init fail - ${evt}` + '\n';
			console.log(`<demo> publishScreenCDNStream - Stream.init fail - ${evt}`);

			// 
			gScreenCDNStream.close();
			gScreenCDNStream = null;
		});
	}
}

function unpublishScreenCDNStream()
{
	client.unpublishScreen(gScreenCDNStream, () =>
	{
		text_info.value = text_info.value + `<demo> unpublishScreenCDNStream - client.unpublish local stream ${gScreenCDNStream.getId()} success.` + '\n';
		console.log(`<demo> unpublishScreenCDNStream - client.unpublish local stream ${gScreenCDNStream.getId()} success.`);
	}, () =>
	{
		text_info.value = text_info.value + '<demo> unpublishScreenCDNStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishScreenCDNStream - client.unpublish local stream failed');
	}, false/*true*/);

	// 
	let publishScreenCDNStatusEle = document.getElementById('publishScreenCDNStatus');
	if (!!publishScreenCDNStatusEle)
	{
		publishScreenCDNStatusEle.innerHTML = `<font color="black">未推流</font>`;
	}

	const videoId = '3t_local_screen_cdn';
	let obj = document.getElementById(videoId);
	if (obj)
	{
		console.log('<demo> unpublishScreenStream - obj.remove -- 3t_local_screen_cdn');
		obj.remove();
	}

	if (!!gScreenCDNStream)
	{
		gScreenCDNStream.close();
		gScreenCDNStream = null;
	}
}

// 
/******************* for Screen Stream */
// 
let publishScreenEle = document.getElementById('publishScreen');
if (!!publishScreenEle)
{
	publishScreenEle.addEventListener('click', () =>
	{
		publishScreenStream({
			userid: userIdEle.value,
			audio: false
		});
	})
}

let unpublishScreenEle = document.getElementById('unpublishScreen');
if (!!unpublishScreenEle)
{
	unpublishScreenEle.addEventListener('click', () =>
	{
		unpublishScreenStream({});
	})
}

// 
function publishScreenStream(opts)
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + '<demo> publishScreenStream - 请先[加入房间]' + '\n';
		return;
	}

	const {
		userid,
		audio
	} = opts;

	if (gScreenStream === null)
	{
		let resolution = '1080p';

		console.log(`<demo> publishScreenStream() userid: ${userid} audio: ${audio} resolution: ${resolution}`);

		gScreenStream = RTCObj.createStream({
			userId: +userid,
			audio: Boolean(audio),
			screen: true,
			attributes: { videoProfile: resolution }
		});

		if (!gScreenStream)
			return;

		// 
		if (audioProfile !== 'default')
		{
			gScreenStream.setAudioProfile(audioProfile);
		}

		gScreenStream.init(() =>
		{
			gScreenStream.on('screen-close', (e) =>
			{
				console.log(`<demo> event [screen-close] - ${e.streamId}`);
				unpublishScreenStream({ trackClosed: true });
			});
			//

			// 
			{
				const videoId = '3t_local_screen';
				let videoE = document.createElement('video');
				videoE.id = videoId;
				videoE.muted = true;
				videoE.autoplay = true;
				videoE.controls = true;
				videoE.setAttribute('playsinline', '');
				videoE.style.cssText = 'height: 300px; width: 300px; background: black; position: relative; display: inline-block;'

				if (!!screenEle)
				{
					screenEle.append(videoE);
				}

				gScreenStream.play(videoId, true, false);
			}
			//
			streams.set(gScreenStream.getId(), gScreenStream);

			_publishStream(userid, gScreenStream, () =>
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
			}, () =>
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;

				// 
				gScreenStream.close();
				gScreenStream = null;
			});
			// 
		}, (evt) =>
		{
			text_info.value = text_info.value + `<demo> publishScreenStream - Stream.init fail - ${evt}` + '\n';
			console.log(`<demo> publishScreenStream - Stream.init fail - ${evt}`);

			// 
			gScreenStream.close();
			gScreenStream = null;
		});
	}
	else
	{
		// 
		_publishStream(userid, gScreenStream, () =>
		{
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
		}, () =>
		{
			document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
			
			// 
			gScreenStream.close();
			gScreenStream = null;
		});
	}
	// 
}

// 
function unpublishScreenStream(opts)
{
	const { trackClosed } = opts;

	if (gScreenStream === null)
	{
		text_info.value = text_info.value + 'unpublishScreenStream - 当前尚未创建 gScreenStream' + '\n';
		console.log('<demo> 当前尚未创建 gScreenStream');

		return;
	}

	client.unpublish(gScreenStream, () =>
	{
		text_info.value = text_info.value + `<demo> unpublishScreenStream - client.unpublish local stream ${gScreenStream.getId()} success.` + '\n';
		console.log(`<demo> unpublishScreenStream - client.unpublish local stream ${gScreenStream.getId()} success.`);
	}, () =>
	{
		text_info.value = text_info.value + '<demo> unpublishScreenStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishScreenStream - client.unpublish local stream failed');
	}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		gScreenStream.close();

		const videoId = '3t_local_screen';
		let obj = document.getElementById(videoId);
		if (obj)
		{
			console.log('<demo> unpublishScreenStream - obj.remove -- 3t_local_screen');
			obj.remove();
		}
		
		gScreenStream = null;
	}

	document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
}

/******************* for MediaSource Stream */
// 
let publishMediaSourceEle = document.getElementById('publishMediaSource');
if (!!publishMediaSourceEle)
{
	publishMediaSourceEle.addEventListener('click', () =>
	{
		publishMediaSourceStream({
			userid: userIdEle.value
		});
	})
}

let unpublishMediaSourceEle = document.getElementById('unpublishMediaSource');
if (!!unpublishMediaSourceEle)
{
	unpublishMediaSourceEle.addEventListener('click', () =>
	{
		unpublishMediaSourceStream({});
	})
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

// 
function publishMediaSourceStream(opts)
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + '<demo> publishMediaSourceStream - 请先[加入房间]' + '\n';
		return;
	}

	const {
		userid
	} = opts;

	if (gMediaSourceStream === null)
	{
		console.log(`<demo> publishMediaSourceStream() userid: ${userid}`);

		// 
		// 
		let audioSource = null;
		let videoSource = null;
		if (gMediaSourceStream)
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

		gMediaSourceStream = RTCObj.createStream({
			userId: +userid,
			mediasource: true,
			audioSource,
			videoSource
		});

		if (!gMediaSourceStream)
			return;

		gMediaSourceStream.init(() =>
		{
			streams.set(gMediaSourceStream.getId(), gMediaSourceStream);

			_publishStream(userid, gMediaSourceStream, () =>
			{
				document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="green">已推流</font>`;
			}, () =>
			{
				document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
			});
			// 
		}, (evt) =>
		{
			text_info.value = text_info.value + `<demo> publishMediaSourceStream - Stream.init fail - ${evt}` + '\n';
			console.log(`<demo> publishMediaSourceStream - Stream.init fail - ${evt}`);
		});
	}
	else
	{
		// 
		_publishStream(userid, gMediaSourceStream, () =>
		{
			document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="green">已推流</font>`;
		}, () =>
		{
			document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
		});
	}
	// 
}

// 
function unpublishMediaSourceStream(opts)
{
	const { trackClosed } = opts;

	if (gMediaSourceStream === null)
	{
		text_info.value = text_info.value + 'unpublishMediaSourceStream - 当前尚未创建 gMediaSourceStream' + '\n';
		console.log('<demo> 当前尚未创建 gMediaSourceStream');

		return;
	}

	client.unpublish(gMediaSourceStream, () =>
	{
		text_info.value = text_info.value + `<demo> unpublishMediaSourceStream - client.unpublish local stream ${gMediaSourceStream.getId()} success.` + '\n';
		console.log(`<demo> unpublishMediaSourceStream - client.unpublish local stream ${gMediaSourceStream.getId()} success.`);
	}, () =>
	{
		text_info.value = text_info.value + '<demo> unpublishMediaSourceStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishMediaSourceStream - client.unpublish local stream failed');
	}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		gMediaSourceStream.close();

		const videoId = 'mediaSource';
		let obj = document.getElementById(videoId);
		if (obj)
		{
			console.log('<demo> unpublishMediaSourceStream - obj.remove -- mediaSource');
			obj.remove();
		}

		gMediaSourceStream = null;
	}

	//
	document.getElementById('publishMediaSourceStatus').innerHTML = `<font color="black">未推流</font>`;
}

function _publishStream(userid, mediaStream, onSuccess, onFailure)
{
	// 
	client.publish(mediaStream, () =>
	{
		// 
		text_info.value = text_info.value + `<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.getId()}` + '\n';
		console.log(`<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.getId()}`);

		// 
		onSuccess && onSuccess();

		// 
		let url = rtmpUrlEle.value.trim();
		if (url !== '')
		{
			// url = `rtmp://push.3ttest.cn/sdk2/${roomIdEle.value.trim()}`;
			client.setRtmpUrl({ url, avMode: 'av' });
		}

		// 
		setLiveMixerLayout();

		// 
		if (mediaStream.hasAudio())
		{
			mediaStream.on('volume-change', e =>
			{
				if (!!audioVolumeProgressEle)
					audioVolumeProgressEle.value = e.volume;
				if (!!audioVolumeValueEle)
					audioVolumeValueEle.innerHTML = e.volume;
				; // console.log(`<AUDIO-VOLUME> - volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
		}
	}, (evt) =>
	{
		text_info.value = text_info.value + `_publishStream - client.publish fail - ${evt}` + '\n';
		console.log(`<demo> _publishStream - client.publish fail - ${evt}`);

		onFailure && onFailure();
	});
}

/******************* for audio / video control */
//
let micPlaybackEle = document.getElementById('micPlayback');
if (!!micPlaybackEle)
{
	micPlaybackEle.addEventListener('click', () =>
	{
		let micPlayback = document.getElementById('micPlayback').checked;
		if (Boolean(micPlayback))
		{
			gStream.play('3t_local', true, true);
		}
		else
		{
			gStream.stopPlay();
		}
	});
}

let isVideoPaused = false;
let pauseVideoEle = document.getElementById('pauseVideo');
if (!!pauseVideoEle)
{
	pauseVideoEle.addEventListener('click', () =>
	{
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
			client.resumeWebcam(gStream, () =>
			{
				console.log('<demo> client.resumeWebcam succ.');
			}, (e) =>
			{
				console.log(`<demo> client.resumeWebcam fail - ${e.toString()}`);
			});
		}
		else
		{
			client.pauseWebcam(gStream, false, () =>
			{
				console.log('<demo> client.pauseWebcam succ.');
			}, (e) =>
			{
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
	pauseAudioEle.addEventListener('click', () =>
	{
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
			client.resumeMic(gStream, () =>
			{
				console.log('<demo> client.resumeMic succ.');
			}, (e) =>
			{
				console.log(`<demo> client.resumeMic fail - ${e.toString()}`);
			});
		}
		else
		{
			client.pauseMic(gStream, () =>
			{
				console.log('<demo> client.pauseMic succ.');
			}, (e) =>
			{
				console.log(`<demo> client.pauseMic fail - ${e.toString()}`);
			});
		}

		isAudioPaused = !isAudioPaused;

		pauseAudioEle.innerHTML = isAudioPaused ? 'resumeAudio' : 'pauseAudio';
	})
}

// 
let isVideoDisabled = false;
let disableVideoEle = document.getElementById('disableVideo');
if (!!disableVideoEle)
{
	disableVideoEle.addEventListener('click', () =>
	{
		if (!client)
		{
			return;
		}
		if (!gStream)
		{
			return;
		}

		if (isVideoDisabled)
		{
			gStream.enableVideo();
		}
		else
		{
			gStream.disableVideo();
		}

		isVideoDisabled = !isVideoDisabled;

		disableVideoEle.innerHTML = isVideoDisabled ? 'enableVideo' : 'disableVideo';
	})
}

// 
let isAudioDisabled = false;
let disableAudioEle = document.getElementById('disableAudio');
if (!!disableAudioEle)
{
	disableAudioEle.addEventListener('click', () =>
	{
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

let resolutionEle = document.getElementById('resolution');
if (!!resolutionEle)
{
	resolutionEle.addEventListener('change', () =>
	{
		let prof = resolutionEle.value;

		setVideoProfile(prof);
	})
}

let micVolumeSliderEle = document.getElementById('micVolumeSlider');
if (!!micVolumeSliderEle)
{
	micVolumeSliderEle.addEventListener('change', () =>
	{
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

/******************* for list Devices */
// 
let refreshDevicesEle = document.getElementById('refreshDevices');
if (!!refreshDevicesEle)
{
	refreshDevicesEle.addEventListener('click', () =>
	{
		getDevices();
	})
}

function getDevices()
{
	let message = '';

	// 首先
	for (let index = 0; index < audioInputSelect.childNodes.length; index++)
	{
		audioInputSelect.removeChild(audioInputSelect.options[0]);
		audioInputSelect.remove(0);
		audioInputSelect.options[0] = null;
	}

	// 
	for (let index = 0; index < audioOutputSelect.childNodes.length; index++)
	{
		audioOutputSelect.removeChild(audioOutputSelect.options[0]);
		audioOutputSelect.remove(0);
		audioOutputSelect.options[0] = null;
	}

	// 
	for (let index = 0; index < videoSelect.childNodes.length; index++)
	{
		videoSelect.removeChild(videoSelect.options[0]);
		videoSelect.remove(0);
		videoSelect.options[0] = null;
	}

	TTTRtcWeb.listDevices((devices) =>
	{
		// 
		devices.forEach((deviceInfo) =>
		{
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
	}, (err) =>
	{
		const errMsg = err.name + err.message + '\n';
		text_info.value = text_info.value + errMsg;
	});
}

/******************* for switchDevices */
// 
if (!!videoSelect)
{
	videoSelect.addEventListener('change', () =>
	{
		let index = videoSelect.selectedIndex;

		cameraDevId = videoSelect.options[index].value;

		console.log(`<demo> cameraDev change - cameraDevId: ${cameraDevId}`);

		// switch device for Stream
		if (!!gStream)
		{
			gStream.switchDevice('video', cameraDevId, () =>
			{
				console.log(`<demo> switchDevice succ - deviceId: ${cameraDevId}`);
			}, (e) =>
			{
				console.log(`<demo> switchDevice fail - deviceId: ${cameraDevId} - ${e.toString()}`);
			});
		}
	})
}

// 
if (!!audioInputSelect)
{
	audioInputSelect.addEventListener('change', () =>
	{
		let index = audioInputSelect.selectedIndex;

		micDevId = audioInputSelect.options[index].value;

		console.log(`<demo> micDev change - micDevId: ${micDevId}`);

		// switch device for Stream
		if (!!gStream)
		{
			gStream.switchDevice('audio', micDevId, () =>
			{
				console.log(`<demo> switchDevice succ - deviceId: ${micDevId}`);
			}, (e) =>
			{
				console.log(`<demo> switchDevice fail - deviceId: ${micDevId} - ${e.toString()}`);
			});
		}
	})
}

// 
if (!!audioOutputSelect)
{
	audioOutputSelect.addEventListener('change', () =>
	{
		let index = audioOutputSelect.selectedIndex;

		speakerDevId = audioOutputSelect.options[index].value;

		// 
		remote_stream.forEach((item) =>
		{
			if (!!item)
			{
				// 
				item.setAudioOutput(speakerDevId, (e) =>
				{
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput succc - ${e}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput succc. - ' + e);
				}, (e) =>
				{
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput fail - ${e}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput fail. - ' + e);
				});
			}
		});

		console.log(`<demo> speakerDev change - speakerDevId: ${speakerDevId}`);
	})
}
/********************/

// 
let audioCodecEle = document.getElementById('audioCodec');
if (!!audioCodecEle)
{
	audioCodecEle.addEventListener('change', () =>
	{
		let index = audioCodecEle.selectedIndex;

		audioCodec = audioCodecEle.options[index].value;

		console.log(`<demo> audioCodec change - audioCodec: ${audioCodec}`);
	})
}
// 
let audioProfileEle = document.getElementById('audioProfile');
if (!!audioProfileEle)
{
	audioProfileEle.addEventListener('change', () =>
	{
		let index = audioProfileEle.selectedIndex;

		audioProfile = audioProfileEle.options[index].value;

		console.log(`<demo> audioProfile change - audioProfile: ${audioProfile}`);
	})
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
		if (!!client)
		{
			client.setUserRole(userRole, () =>
			{
				console.log(`<demo> setUserRole() succ. - role: ${userRole}`);
			}, (e) =>
			{
				console.log(`<demo> setUserRole() fail - ${e.toString()}`);
			});
		}
	})
}

// 
let submitLogEle = document.getElementById('submitLog');
if (!!submitLogEle)
{
	submitLogEle.addEventListener('click', () =>
	{
		const isSubmitLog = submitLogEle.checked;
		TTTRtcWeb.setLogSubmit(isSubmitLog);
		console.log(`<demo> submitLog: ${isSubmitLog}`);
	})
}
