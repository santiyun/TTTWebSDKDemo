import TTTRtcWeb from '../lib/tttwebsdk';
// import TTTRtcWeb from 'tttwebsdk'

let RTCObj = new TTTRtcWeb();

const pkg = require('../package.json');

// 
let demoVersion = pkg.version;

let sdkVersion = RTCObj.getVersion();

document.getElementById('sysVersion').innerHTML = `ver: ${demoVersion} - ${sdkVersion}`;

// 
let client = null;
let streams = new Map();

let hasPublishStream = false;
let hasPublishScreen = false;

let gStream = null;
let gScreenStream = null;

let remote_stream = new Map();

const text_info = document.getElementById('text_info');

const userRoleSelect = document.getElementById('userRole');

let cameraDevId = 'default';
let micDevId = 'default';
let speakerDevId = 'default';

const appIdEle = document.getElementById('appID');

// 
const rSeed = (Math.random() * 100000000);
const userId = Math.floor(rSeed) + 1;
const userIdEle = document.getElementById('userid');
if (!!userIdEle)
{
	userIdEle.value = userId;
}

const roomIdEle = document.getElementById('chanid');

// 
let screenEle = document.getElementById('screen');
let videoEle = document.getElementById('video');
// 
let userRole = 2;

// 
let sei = {
    'ts': '',
    'ver': '20161227',
    'canvas': {
        'bgrad': [
            232,
            230,
            232
        ],
        'h': 480,
        'w': 640
    },
    'mid': '',
    'pos': []
}
// 
let tttStatus = 0;

// 
// url: https://...../?auto=1&r=666777&u=111111&h=webmedia4.3ttech.cn
let isAutoPub = getQueryVariable('auto');
let xRoomId = getQueryVariable('r');
let xUserId = getQueryVariable('u') || userId;
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
		RTCObj.setIpLocationAddress(xSpecIploc); // 'v7.jkim.ccb.com'
	}
}
// 
if (!!xSpecIplocPort)
{
	const port = parseInt(xSpecIplocPort, 10);
	if (!!port)
	{
		RTCObj.setIpLocationPort(port);
	}
}

// 
getDevices();

autoPublish();

function autoPublish()
{
	console.log(`<demo> Load. isAutoPub: ${isAutoPub} xRoomId: ${xRoomId} xUserId: ${xUserId}`);

	if (!!xRoomId && !!xUserId && isAutoPub)
	{
		if (!!roomIdEle)
		{
			roomIdEle.value = xRoomId;
		}
		if (!!userIdEle)
		{
			userIdEle.value = xUserId;
		}

		joinChan(xAppId, xRoomId, xUserId);
	}
	else
	{
		isAutoPub = false;
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
			RTCObj.setServerUrl(xSpecServer);
		}
	}

    client = RTCObj.createClient({
		role: userRole,
		rtmpUrl: ''
	});
 
    client.init(appid, userid, () => {
        client.join(chanid, () => {
			text_info.value = `<demo> 成功加入房间!! userid: ${userid}` + '\n';

			console.log(`<demo> 成功加入房间!! userid: ${userid}`);

			tttStatus = 1; // 状态标注为: 登录成功

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- role: ${userRole}<br>`;

			// 
			if (isAutoPub)
			{
				publishStream({
					userid : xUserId,
					audio  : true,
					video  : true,
					screen : false
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

    client.on('peer-join', (peer) => {
		text_info.value = text_info.value + `<demo> - event [peer-join] uid: ${peer.name}` + '\n';

        console.log(`<demo> - event [peer-join] uid: ${peer.name}`);
    });

    client.on('peer-leave', (peer) => {
		text_info.value = text_info.value + `<demo> - event [peer-leave] uid: ${peer.name}` + '\n';
        console.log(`<demo> - event [peer-leave] uid: ${peer.name}`);

        peer.streams.forEach(stream => {
			if (!stream)
				return;

			let obj = document.getElementById('3t_remote' + stream.streamID);
			if (obj)
			{
				obj.remove();
			}

            // remove stream from map
            remote_stream.delete(stream.streamID);

			stream.close();
        });
	});
	
	client.on('stream-added', (evt) => {
		let stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [stream-added] streamId: ${evt.stream.streamID}` + '\n';

		console.log('<demo> - event [stream-added] %o', evt.stream);

		remote_stream.set(stream.streamID, stream);
        client.subscribe(stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe ${evt.stream.streamID} succ.` + '\n';
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe ${evt.stream.streamID} failed. - error: ${JSON.stringify(err)}` + '\n';
        });
	})

    client.on('stream-subscribed', (evt) => {
        let stream = evt.stream;
		if (!stream)
			return;
		text_info.value = text_info.value + `<demo> - event [stream-subscribed] streamId: ${stream.streamID}` + '\n';
		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.streamID}`);

		if (stream.hasAudio())
		{
			stream.on('volume-change', e => {
				; // console.log(`<AUDIO-VOLUME> - volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
		}
		
		{
            var videoId = '3t_remote' + stream.streamID;
			if(!!videoEle && !document.getElementById(videoId))
			{
                let video = document.createElement('video');
				video.id = videoId;
				video.muted = false;
				video.autoplay = true;
				video.controls = true;
				video.setAttribute('playsinline', '');
                video.style.cssText = 'height: 300px; width: 300px; background: black; position:relative; display:inline-block;'
				videoEle.append(video);
            }

            stream.play('3t_remote' + stream.streamID, true);
        }
    });

    client.on('video-mute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [video-mute] streamId: ${stream.streamID}` + '\n';
		console.log(`<demo> - event [video-mute] streamId: ${stream.streamID}`);

		stream._video.style.backgroundColor = 'transparent';
		stream._video.poster = 'http://www.3ttech.cn/favicon.ico';
	});
	
	client.on('video-unmute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [video-unmute] streamId: ${stream.streamID}` + '\n';
		console.log(`<demo> - event [video-unmute] streamId: ${stream.streamID}`);
		
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
			let obj = document.getElementById('3t_remote' + item.streamID);
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
		screen      : false
		});
	unpublishStream({
		video       : false,
		screen      : true
		});

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
			streams.delete(gScreenStream.innerStreamID);
			
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
			streams.delete(gStream.innerStreamID);
			
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

function setStreamSEI(userid, mid, type, isScreen)
 {
	if(client._role !== "1")
		return;

    let position = {
        "id": 0,
        "h": 0,
        "w": 0,
        "x": 0,
        "y": 0,
        "z": 1
    };

    sei.mid = mid;
    sei.ts = + new Date();
    position.id = mid;
    position.x = 0;
    position.y = 0;
    position.w = 1;
    position.h = 1;
	position.z = 0;
	/*
	if (type === 'add')
	{
        sei.pos.push(position);
	}
	else
	{
        sei.pos.pop();
	}
	*/
	sei.pos = [];
	sei.pos.push(position);

    client.setSEI(userid, type, isScreen, sei);
};

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
		screen
	} = opts;

	let v = (+video) + (+screen);
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
	else if (Boolean(video) || Boolean(audio))
	{
		mediaStream = gStream;
	}

	if (mediaStream === null)
	{
		let resolutionEle = document.getElementById('resolution');
		let specRes = (!!resolutionEle) ? resolutionEle.value : '480p';
		let resolution = Boolean(screen) ? '1080p' : specRes;

		const streamID = Boolean(screen) ? `${userid}-screen` : `${userid}`;

		console.log(`<demo> publishStream() userid: ${userid} cameraDevId: ${cameraDevId} micDevId: ${micDevId} resolution: ${resolution}`);

		// 
		mediaStream = RTCObj.createStream({
			streamID,
			userID: userid,
			audio: Boolean(audio),
			video: Boolean(video),
			screen: Boolean(screen),
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile : resolution }
		});

		if (!mediaStream)
			return;

		window.ls = mediaStream;

		mediaStream.init(() => {
			if (Boolean(video) || Boolean(screen))
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

			streams.set(mediaStream.innerStreamID, mediaStream);

			if (Boolean(screen))
			{
				gScreenStream = mediaStream;
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
			text_info.value = text_info.value + `<demo> publishStream - hasPublishScreen: ${hasPublishScreen} mediaStream: ${mediaStream.innerStreamID}` + '\n';
			console.log(`<demo> publishStream - hasPublishScreen: ${hasPublishScreen}  mediaStream: ${mediaStream.innerStreamID}`);

			return;
		}
		else if ((Boolean(video) || Boolean(audio)) && hasPublishStream)
		{
			text_info.value = text_info.value + `<demo> publishStream - hasPublishStream: ${hasPublishStream} mediaStream: ${mediaStream.innerStreamID}` + '\n';
			console.log(`<demo> publishStream - hasPublishStream: ${hasPublishStream}  mediaStream: ${mediaStream.innerStreamID}`);
	
			return;
		}

		// 
		_publishStream(userid, mediaStream, () => {
			if (Boolean(screen))
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
				hasPublishScreen = true;
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
		text_info.value = text_info.value + `<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.innerStreamID}` + '\n';
		console.log(`<demo> _publishStream - client.publish succ. mediaStream: ${mediaStream.innerStreamID}`);

		// 
		onSuccess && onSuccess();

		// cdn 推流
		const mid = mediaStream.innerStreamID;
		setStreamSEI(userid, mid, 'add', false);

		// 
		if (mediaStream.hasAudio())
		{
			mediaStream.on('volume-change', e => {
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
	const { video, screen } = opts;
	let mediaStream = null;

	if (Boolean(screen))
	{
		mediaStream = gScreenStream;
		hasPublishScreen = false;
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
		text_info.value = text_info.value + `<demo> unpublishStream - client.unpublish local stream ${mediaStream.innerStreamID} success.` + '\n';
        console.log(`<demo> unpublishStream - client.unpublish local stream ${mediaStream.innerStreamID} success.`);
    }, () => {
		text_info.value = text_info.value + '<demo> unpublishStream - client.unpublish local stream failed' + '\n';
		console.log('<demo> unpublishStream - client.unpublish local stream failed');
	}, true);

	//
	if (Boolean(screen))
	{
		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
	}
	else if (Boolean(video) || Boolean(audio))
	{
		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
	}
}

//
let publishAudioStreamEle = document.getElementById('publishAudioStream');
if (!!publishAudioStreamEle)
{
	publishAudioStreamEle.addEventListener('click', () => {
		publishStream({
			userid : xUserId,
			audio  : true,
			video  : false,
			screen : false
		});
	})
}

// 
let publishStreamEle = document.getElementById('publishStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () => {
		publishStream({
			userid : xUserId,
			audio  : true,
			video  : true,
			screen : false
		});
	})
}

let unpublishStreamEle = document.getElementById('unpublishStream');
if (!!unpublishStreamEle)
{
	unpublishStreamEle.addEventListener('click', () => {
		unpublishStream({
			video       : true,
			screen      : false
		});
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
			client.resumeWebcam(gStream);
		}
		else
		{
			client.pauseWebcam(gStream, true);
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
			client.resumeMic(gStream);
		}
		else
		{
			client.pauseMic(gStream);
		}
	
		isAudioPaused = !isAudioPaused;
	
		pauseAudioEle.innerHTML = isAudioPaused ? 'resumeAudio' : 'pauseAudio';
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

function getDevices()
{
	let message = '';
	
    RTCObj.getDevices((devices) => {
		// 
        devices.forEach((deviceInfo) => {
            message = '<demo> getDevices - ' + deviceInfo.kind + ': ' + deviceInfo.label + ' id: ' + deviceInfo.deviceId + '\n';
			text_info.value = text_info.value + message;
			console.log(message);
		});
    }, (err) => {
		const errMsg = err.name + err.message + '\n';
		text_info.value = text_info.value + errMsg;
    });
}

let userRoleEle = document.getElementById('userRole');
if (!!userRoleEle)
{
	userRoleEle.addEventListener('change', () => {
		let index = userRoleSelect.selectedIndex;

		userRole = userRoleSelect.options[index].value;
		
		console.log(`<demo> userRole change - userRole: ${userRole}`);
	})
}
