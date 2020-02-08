// const TTTRtcWeb = require('tttwebsdk');

import Swal from 'sweetalert2'

const pkg = require('../package.json');

let RTCObj = new window.TTTRtcWeb();
//let RTCObj = new TTTRtcWeb();

// 
let demoVersion = pkg.version;
let sdkVersion = RTCObj.getVersion();

document.getElementById('sysVersion').innerHTML = `ver: ${demoVersion} - ${sdkVersion}`;

// 
let client = null;
let streams = new Map();

let cdnUrl = '';// 'rtmp://stech.3ttech.cn/live/test';

let hasPublishStream = false;
let hasPublishScreen = false;

let intv = null;

let remote_stream = new Map();

const stream_net_info = document.getElementById('stream_net_info');
const text_info = document.getElementById('text_info');

const videoSelect = document.getElementById("cameraDev");
const audioInputSelect = document.getElementById('micDev');
const audioOutputSelect = document.getElementById('speakerDev');

let cameraDevId = 'default';
let micDevId = 'default';

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
        'h': 640,
        'w': 368
    },
    'mid': '',
    'pos': []
}
// 
let tttStatus = 0;

let joinAct = false;

function joinChan()
{
	// 
	if (tttStatus === 1)
	{
		Swal.fire('已在房间内，无需重复登录');
		text_info.value = text_info.value + '重复执行 joinChan' + '\n';

		return;
    }

    const appid = document.getElementById('appID').value;

    let chanid = document.getElementById('chanid').value;
    let userid = document.getElementById('userid').value;
	const userRole = document.getElementById('userrole').value;
	cdnUrl = document.getElementById('rtmpUrl').value;
	
	// 
	// RTCObj.setServerUrl('112_125_27_215.3ttech.cn');
	// RTCObj.setServerUrl('gzeduservice.3ttech.cn');
	RTCObj.setServerUrl('webmedia6.3ttech.cn');

    client = RTCObj.createClient({ role: userRole, rtmpUrl: cdnUrl });
 
    client.init(appid, userid, () => {
        client.join(chanid, () => {
			text_info.value = `<demo> login success. userid: ${userid}` + '\n';

			console.log(`<demo> login success. userid: ${userid}`);

			Swal.fire('成功加入房间!!');
			
			tttStatus = 1; // 状态标注为: 登录成功

			document.getElementById('loginStatus').innerHTML = `<font color="green">登录成功</font>`;
			document.getElementById('loginInfo').innerHTML = `-- role: ${userRole}<br> -- CDN: ${cdnUrl}`;

			// 
			intv = setInterval(() => {
				stream_net_info.value = `${JSON.stringify(client.getNetState())}`;
				// 
				client.getRemoteAudioStats((audioStats) => {
					audioStats.forEach((value, key) => {
						;// console.log(`<STAT> audioDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
					});
				});
				// 
				client.getRemoteVideoStats((videoStats) => {
					videoStats.forEach((value, key) => {
						;// console.log(`<STAT> videoDownStat -- streamId: ${key} ${JSON.stringify(value)}`);
					});
				});
				// 
				client.getLocalAudioStats((audioStats) => {
					audioStats.forEach((value, key) => {
						;// console.log(`<STAT> audioUpStat -- streamId: ${key} ${JSON.stringify(value)}`);
					});
				});
				// 
				client.getLocalVideoStats((videoStats) => {
					videoStats.forEach((value, key) => {
						;// console.log(`<STAT> videoUpStat -- streamId: ${key} ${JSON.stringify(value)}`);
					});
				});
			}, 2000);
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
	
	client.on('reinit', () => {
		text_info.value = text_info.value + '<demo> - event [reinit]' + '\n';
		console.log('<demo> - event [reinit]');
		
		// 
		remote_stream.forEach((item) =>
		{
			if (Boolean(item))
			{
				// 
				item.close();
			}
		});
		remote_stream.clear();

		// 
		_innerUnpublishStream({
			screen : false
		});
		_innerUnpublishStream({
			screen : true
		});
	});

	client.on('enter', () => {
		// 
		if (hasPublishStream)
		{
			publishStream({
				audio  : true,
				video  : true,
				screen : false
			});
		}

		if (hasPublishScreen)
		{
			publishStream({
				audio  : false,
				video  : false,
				screen : true
			});
		}
	});

	client.on('disconnected', () => {
		tttStatus = 0;

		text_info.value = text_info.value + '<demo> - event [disconnected]' + '\n';
		console.log('<demo> - event [disconnected]');
		
		// 
		remote_stream.forEach((item) =>
		{
			if (Boolean(item))
			{
				// 
				item.close();
			}
		});
		remote_stream.clear();

		// 
		document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
		document.getElementById('loginInfo').innerHTML = '';

		// 
		if (intv !== null)
		{
			clearInterval(intv);
			intv = null;
		}
	});

	client.on('kickout', (evt) => {
		tttStatus = 0;

		text_info.value = text_info.value + `<demo> - event [kickout] ${JSON.stringify(evt)}` + '\n';
		console.log(`<demo> - event [kickout] ${JSON.stringify(evt)}`);
		
		// 
		remote_stream.forEach((item) =>
		{
			if (Boolean(item))
			{
				// 
				let obj = document.getElementById('3t_remote' + item.innerStreamID);
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
			screen : false
		});
		unpublishStream({
			screen : true
		});

		// 
		document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
		document.getElementById('loginInfo').innerHTML = '';

		// 
		if (intv !== null)
		{
			clearInterval(intv);
			intv = null;
		}
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

			let obj = document.getElementById('3t_remote' + stream.innerStreamID);
			if (obj)
			{
				obj.remove();
			}

            // remove stream from map
            remote_stream.delete(stream.innerStreamID);

			stream.close();
        });
	});
	
	client.on('audio-added', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [audio-added] streamId: ${evt.stream.innerStreamID}` + '\n';

		console.log(`<demo> - event [audio-added] streamId: ${evt.stream.innerStreamID}`);

		remote_stream.set(stream.innerStreamID, stream);
        let in_stream = remote_stream.get(stream.innerStreamID);
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.innerStreamID} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe audio ${evt.stream.innerStreamID} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
	})

	client.on('video-added', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [video-added] streamId: ${evt.stream.innerStreamID}` + '\n';

		console.log(`<demo> - event [video-added] streamId: ${evt.stream.innerStreamID}`);

		remote_stream.set(stream.innerStreamID, stream);
		// 
        let in_stream = remote_stream.get(stream.innerStreamID);
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.innerStreamID} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.innerStreamID} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
	})

    client.on('stream-subscribed', (evt) => {
        var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [stream-subscribed] streamId: ${stream.innerStreamID} stream.type: ${stream.type}` + '\n';

		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.innerStreamID} stream.type: ${stream.type}`);

		if(stream.type === 'audio')
		{
			stream.on('volume-change', e => {
				;// console.log(`volume-change -- userID: ${e.userID} volume: ${e.volume}`);
			});
		
            // play audio
            stream.play();
		}
		else
		{
			// play video
            var videoId = '3t_remote' + stream.innerStreamID;
            // if ($('div#video #' + videoId).length === 0) {
			if(!document.getElementById(videoId))
			{
                let video = document.createElement('video');
                video.id = videoId;
                video.style.cssText = 'height: 300px; width: 300px; background: black; position:relative; display:inline-block;'
				document.getElementById('video').append(video);

                // $('div#video').append('<video autoplay id="' + videoId + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
            }

            stream.play('3t_remote' + stream.innerStreamID);
        }
        
    });

    client.on('video-mute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [video-mute] streamId: ${stream.innerStreamID}` + '\n';
		console.log(`<demo> - event [video-mute] streamId: ${stream.innerStreamID}`);

		stream._video.style.backgroundColor = 'transparent';
		stream._video.srcObject = null;
		stream._video.poster = 'http://www.3ttech.cn/favicon.ico';

		// visibility: hidden
		
	});
	
	client.on('video-unmute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;
			
		text_info.value = text_info.value + `<demo> - event [video-unmute] streamId: ${stream.innerStreamID}` + '\n';
		console.log(`<demo> - event [video-unmute] streamId: ${stream.innerStreamID}`);
		
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

	// 
	remote_stream.forEach((item) =>
	{
		if (Boolean(item))
		{
			// 
			let obj = document.getElementById('3t_remote' + item.innerStreamID);
			if (obj)
			{
				obj.remove();
			}
			// 
			item.close();
		}
	});
	remote_stream.clear();

	if (client)
	{
        client.leave(() => { }, () => { });
        client.close();
	}

	// 
	if (intv !== null)
	{
		clearInterval(intv);
		intv = null;
	}

	// 
	unpublishStream({
		screen : false
	});
	unpublishStream({
		screen : true
	});

	text_info.value = text_info.value + 'leaveChan OK' + '\n';

	tttStatus = 0;

	// 
	document.getElementById('loginStatus').innerHTML = '<font color="red">未登录</font>';
	document.getElementById('loginInfo').innerHTML = '';
}

document.getElementById('joinChan').addEventListener('click', () => {
    joinChan()
})

document.getElementById('leaveChan').addEventListener('click', () => {
    leaveChan()
})

/*
function setStreamSEI(mid, isScreen)
{
	if(client._role !== "1")
		return;

	let sei = {
		'ts': '',
		'ver': '20161227',
		'canvas': {
			'bgrad': [
				232,
				230,
				232
			],
			'h': 640,
			'w': 368
		},
		'mid': '',
		'pos': []
	}

    sei.mid = mid;
	sei.ts = + new Date();

	let nCnt = remote_stream.size;

	if (!!gVideoStream)
	{
		nCnt++;
	}
	
	if (!!gScreenStream)
	{
		nCnt++;
	}

	let isSplit = nCnt > 1;
	
	let nIndex = 0;
	if (!!gVideoStream)
	{
		let position = {};

		position.id = gVideoStream.innerStreamID;
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

		position.id = gScreenStream.innerStreamID;
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
			position.id = item.innerStreamID;
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
    client.setSEI(mid, 'add', isScreen, sei);
};
*/

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

    client.setSEI(userid, type, isScreen, sei, mid);
};

let gVideoStream = null;

let gScreenStream = null;

function setVideoProfile(prof)
{
	if (gVideoStream === null)
	{
		return;
	}

	// set video profile
	gVideoStream.setVideoProfile(prof, (msg) => {
		text_info.value = text_info.value + `<demo> setVideoProfile - gVideoStream.setVideoProfile succ. ${prof}` + '\n';
		console.log(`<demo> setVideoProfile - gVideoStream.setVideoProfile succ: ${prof}`);
	}, (e) => {
		text_info.value = text_info.value + `setVideoProfile - gVideoStream.setVideoProfile failed. - error: ${JSON.stringify(e)}` + '\n';
		console.log('<demo> setVideoProfile - gVideoStream.setVideoProfile - error: ' + e);
	});
}

// 
function publishStream(opts)
{
	// 
	if (tttStatus !== 1)
	{
		Swal.fire('请先[加入房间]');
		text_info.value = text_info.value + 'publishStream - 请先[加入房间]' + '\n';
		return;
    }

	const {
		audio,
		video,
		screen
	} = opts;
    
	let videoStream = Boolean(screen) ? gScreenStream : gVideoStream;

    if (videoStream === null)
	{
		let userid = document.getElementById('userid').value;
		let resolution = Boolean(screen) ? '1080p' : document.getElementById('resolution').value;

		const streamID = Boolean(screen) ? `${userid}-screen` : `${userid}`;

		console.log(`publishStream() cameraDevId: ${cameraDevId} micDevId: ${micDevId} resolution: ${resolution}`);

		videoStream = RTCObj.createStream({
			streamID,
			userID: userid,
			audio: Boolean(audio),
			video: Boolean(video),
			screen: Boolean(screen),
			cameraId: cameraDevId === 'default' ? null : cameraDevId,
			microphoneId: micDevId === 'default' ? null : micDevId,
			attributes: { videoProfile : resolution }
		});

		if (!videoStream)
			return;

		window.ls = videoStream;
		// 
		/*
		document.getElementById('setInputVolume').addEventListener('change', (e) => {
			videoStream.setInputVolume(+e.target.value)
		})
		*/

		videoStream.init(() => {
			const videoId = Boolean(screen) ? '3t_local_screen' : '3t_local';
			let video = document.createElement('video');
			video.id = videoId;
			video.muted = true;
			video.style.cssText = "height: 300px; width: 300px; background: black; position: relative; display: inline-block;"

			document.getElementById('video').append(video);

			videoStream.play(videoId);
			streams.set(videoStream.innerStreamID, videoStream);

			if (Boolean(screen))
			{
				gScreenStream = videoStream;

				document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
			}
			else
			{
				gVideoStream = videoStream;

				document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
			}

			_publishStream(videoStream);
			// 
		}, (evt) => {
			text_info.value = text_info.value + `<demo> publishStream - videoStream.init failed. - error: ${JSON.stringify(evt)}` + '\n';
			console.log('<demo> publishStream - videoStream.init failed. - error: ' + evt);

			if (Boolean(screen))
			{
				document.getElementById('publishScreenStatus').innerHTML = `<font color="green">未推流</font>`;
			}
			else
			{
				document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
			}
		});
	}
	else
	{
		_publishStream(videoStream);
	}
	// 
}

function _publishStream(videoStream)
{
	if (!videoStream)
	{
		text_info.value = text_info.value + '<demo> _publishStream error - videoStream is null' + '\n';
		console.log('<demo> _publishStream error - videoStream is null');

		return;
	}

	if (hasPublishStream)
	{
		text_info.value = text_info.value + `<demo> _publishStream - hasPublishStream: ${hasPublishStream} videoStream: ${videoStream.innerStreamID}` + '\n';
		console.log(`<demo> _publishStream - hasPublishStream: ${hasPublishStream}  videoStream: ${videoStream.innerStreamID}`);

		return;
	}
	// 
	client.publish(videoStream, () => {
		// 
		text_info.value = text_info.value + `<demo> _publishStream - client.publish video succ. videoStream: ${videoStream.innerStreamID}` + '\n';
		console.log(`<demo> _publishStream - client.publish video succ. videoStream: ${videoStream.innerStreamID}`);

		// 
		hasPublishStream = true;

		// cdn 推流
		const mid = videoStream.innerStreamID;
		setStreamSEI(userid, mid, 'add', false);

		// 
		videoStream.on('volume-change', e => {
			;// console.log(`volume-change -- userID: ${e.userID} volume: ${e.volume}`);
		});	
	}, (evt) => {
		text_info.value = text_info.value + `_publishStream - client.publish video failed. - error: ${JSON.stringify(evt)}` + '\n';
		console.log(`<demo> _publishStream - client.publish video failed. - error: ${JSON.stringify(evt)}`);

		let obj = document.getElementById(videoId);
		if (obj)
		{
			obj.remove();
		}

		if (Boolean(screen))
		{
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">未推流</font>`;
		}
		else
		{
			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
		}
	});
}

function unpublishStream(opts)
{
	/*
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'unpublishStream - 请先[加入房间]' + '\n';
		Swal.fire('请先[加入房间]');
		return;
	}
	*/

	hasPublishStream = false;
	
	_innerUnpublishStream(opts);
}

function _innerUnpublishStream(opts)
{
	const { screen } = opts;
	const videoId = Boolean(screen) ? '3t_local_screen' : '3t_local';
	let videoStream = Boolean(screen) ? gScreenStream : gVideoStream;

	if (videoStream === null)
	{
		text_info.value = text_info.value + 'unpublishStream - 当前尚未创建 videoStream' + '\n';
		console.log('当前尚未创建 videoStream');
		return;
	}

    client.unpublish(videoStream, () => {
		text_info.value = text_info.value + `<demo> unpublishStream - client.unpublish local stream ${videoStream.innerStreamID} success.` + '\n';
        console.log(`<demo> unpublishStream - client.unpublish local stream ${videoStream.innerStreamID} success.`);
		// optionPublishedStream(videoStream, 'del')

		/* 不再关闭本地视频
		let obj = document.getElementById(videoId);
		if (obj)
		{
			obj.remove();
		}

		// 
        streams.delete(videoStream.innerStreamID);
        
        videoStream.close();
		videoStream = null;
			
		if (Boolean(screen))
		{
			gScreenStream = null;
		}
		else
		{
			gVideoStream = null;
		}

		*/

		if (Boolean(screen))
		{
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">未推流</font>`;
		}
		else
		{
			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
		}
    }, () => {
		text_info.value = text_info.value + '<demo> unpublishStream - client.unpublish local stream failed' + '\n';
        console.log('<demo> unpublishStream - client.unpublish local stream failed');

		/*不再关闭本地视频
		let obj = document.getElementById(videoId);
		if (obj)
		{
			obj.remove();
		}

		// 
        streams.delete(videoStream.innerStreamID);
        
        videoStream.close();
		videoStream = null;
			
		if (Boolean(screen))
		{
			gScreenStream = null;
		}
		else
		{
			gVideoStream = null;
		}

		*/

		if (Boolean(screen))
		{
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">未推流</font>`;
		}
		else
		{
			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
		}
    });
}

document.getElementById('publishStream').addEventListener('click', () => {
    publishStream({
		audio  : true,
		video  : true,
		screen : false
	});
})

document.getElementById('unpublishStream').addEventListener('click', () => {
    unpublishStream({
		screen : false
	});
})

document.getElementById('publishScreen').addEventListener('click', () => {
    publishStream({
		audio  : false,
		video  : false,
		screen : true
	});
})

document.getElementById('unpublishScreen').addEventListener('click', () => {
	unpublishStream({
		screen : true
	});
})

document.getElementById('resolution').addEventListener('change', () => {
	let prof = document.getElementById('resolution').value;

	setVideoProfile(prof);
})

/*
document.getElementById('micVolumeSlider').addEventListener('change', () => {
	var value = document.getElementById('micVolumeSlider').value;
  	document.getElementById('micVolumeSliderValue').innerHTML = (value / 10);
})
*/

function getDevices() {
    let message = '';
    RTCObj.getDevices((devices) => {
        devices.forEach(function (deviceInfo) {
            message = '<demo> getDevices - ' + deviceInfo.kind + ': ' + deviceInfo.label + ' id: ' + deviceInfo.deviceId + '\n';
			text_info.value = text_info.value + message;
			console.log(message);

            let option = document.createElement('option');
            option.value = deviceInfo.deviceId;
            if (deviceInfo.kind === 'audioinput') {
                option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
                audioInputSelect.appendChild(option);
            } else if (deviceInfo.kind === 'audiooutput') {
                option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
                audioOutputSelect.appendChild(option);
            } else if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
                videoSelect.appendChild(option);
            } else {
                console.log('Some other kind of source/device: ', deviceInfo);
            }
		});
		
		// 
		let option = document.createElement('option');
		option.value = 'default';

		option.text = 'Default';
		audioInputSelect.appendChild(option);

		option.text = 'Default';
		audioOutputSelect.appendChild(option);

		option.text = 'Default';
		videoSelect.appendChild(option);
    }, (err) => {
		const errMsg = err.name + err.message + '\n';
		text_info.value = text_info.value + errMsg;
    });
}

document.getElementById('getDevices').addEventListener('click', () => {
	getDevices();
})

document.getElementById('cameraDev').addEventListener('change', () => {
	let index = videoSelect.selectedIndex;

	cameraDevId = videoSelect.options[index].value;

	console.log(`cameraDev change - cameraDevId: ${cameraDevId}`);
})

document.getElementById('micDev').addEventListener('change', () => {
	let index = audioInputSelect.selectedIndex;

	micDevId = audioInputSelect.options[index].value;
	
	console.log(`micDev change - micDevId: ${micDevId}`);
})
