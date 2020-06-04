
'use strict';

// 
let client = null;

let gStream = null;

let gStream_noAudio = null;

let gScreen = null;

let gScreen_noAudio = null;

let videoEle = document.getElementById('video');

let tttStatus = 0;

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

let userRole = 2;

let xAppId = 'a967ac491e3acf92eed5e1b5ba641ab7'; // test900572e02867fab8131651339518

let text_info = document.getElementById("text_info");
const sdkVersionEle = document.getElementById('sdkVersion');
<<<<<<< HEAD
const sdkVersion = window.getVersion();
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${sdkVersion}`;
=======
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${window.RTCObj.version}`;
>>>>>>> 96a4f0219b6125e3c3f903ed8fba0f64bb7b05bb
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

<<<<<<< HEAD
	// window.RTCObj.setServerUrl("aaa")
=======
>>>>>>> 96a4f0219b6125e3c3f903ed8fba0f64bb7b05bb
	window.setServerUrl("152-136-34-204.3ttech.cn");

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
		if(!!gStream && evt.streamId === gStream.streamId){
			document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
		}
		if(!!gStream_noAudio && evt.streamId === gStream_noAudio.streamId){
			document.getElementById('publishStream_noAudioStatus').innerHTML = `<font color="green">已推流</font>`;
		}
		if(!!gScreen && evt.streamId === gScreen.streamId){
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
		}
		if(!!gScreen_noAudio && evt.streamId === gScreen_noAudio.streamId){
			document.getElementById('publishScreen_noAudioStatus').innerHTML = `<font color="green">已推流</font>`;
		}

	});

	client.on('stream-unpublished', (evt) =>
	{
		console.log(`<demo> - event [stream-unpublished] uid: ${evt.streamId}`);
		if(!!gStream && evt.streamId === gStream.streamId){
			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
		}
		if(!!gStream_noAudio && evt.streamId === gStream_noAudio.streamId){
			document.getElementById('publishStream_noAudioStatus').innerHTML = `<font color="black">未推流</font>`;
		}
		if(!!gScreen && evt.streamId === gScreen.streamId){
			document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
		}
		if(!!gScreen_noAudio && evt.streamId === gScreen_noAudio.streamId){
			document.getElementById('publishScreen_noAudioStatus').innerHTML = `<font color="black">未推流</font>`;
		}
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

/******************* for Audio/Video Stream */
//
let closeStreamEle = document.getElementById('closeStream');
let closeStream_noAudioEle = document.getElementById('closeStream_noAudio');
let closeScreenEle = document.getElementById('closeScreen');
let closeScreen_noAudioEle = document.getElementById('closeScreen_noAudio');
if (!!closeStreamEle)
{
	closeStreamEle.addEventListener('click', () =>
	{
		closeStream(gStream);
	})
}
if (!!closeStream_noAudioEle)
{
	closeStream_noAudioEle.addEventListener('click', () =>
	{
		closeStream(gStream_noAudio);
	})
}
if (!!closeScreenEle)
{
	closeScreenEle.addEventListener('click', () =>
	{
		closeStream(gScreen);
	})
}
if (!!closeScreen_noAudioEle)
{
	closeScreen_noAudioEle.addEventListener('click', () =>
	{
		closeStream(gScreen_noAudio);
	})
}
//
function closeStream(stream)
{
	const videoId = '3t_local'+stream.streamId;
	if (!!gStream && stream.streamId === gStream.streamId)
	{
		gStream.close();
		gStream = null;
	}
	if (!!gStream_noAudio && stream.streamId === gStream_noAudio.streamId)
	{
		gStream_noAudio.close();
		gStream_noAudio = null;
	}
	if (!!gScreen && stream.streamId === gScreen.streamId)
	{
		gScreen.close();
		gScreen = null;
	}
	if (!!gScreen_noAudio && stream.streamId === gScreen_noAudio.streamId)
	{
		gScreen_noAudio.close();
		gScreen_noAudio = null;
	}

	let obj = document.getElementById(videoId);
	if (obj)
	{
		console.log('<demo> closeStream - obj.remove -- 3t_local');
		obj.remove();
	}

}


// 
let publishStreamEle = document.getElementById('publishStream');
if (!!publishStreamEle)
{
	publishStreamEle.addEventListener('click', () =>
	{
		if (!!gStream)
		{
			publishStream(gStream);
		}
		else
		{
			createPublishStream(true,true,false);
		}
	})
}

let unpublishStreamEle = document.getElementById('unpublishStream');
if (!!unpublishStreamEle)
{
	unpublishStreamEle.addEventListener('click', () =>
	{
		unpublishStream({stream: gStream, trackClosed: false});
	})
}

// 
function createPublishStream(video,audio,screen)
{
	if (tttStatus !== 1)
	{
		console.log('<demo> publishStream - 请先[加入房间]');
		return;
	}
	// 
	let stream = window.RTCObj.createStream({
		userId: +userId,
		audio: audio,
		video: video,
		screen: screen,
		attributes: { videoProfile: '480p' }
	});
	
	if(video && audio){
		gStream = stream;
	}else if(video && !audio){
		gStream_noAudio = stream;
	}else if(screen && audio){
		gScreen = stream;
	}else if(screen && !audio){
		gScreen_noAudio = stream;
	}

	if (!stream)
		return;

	stream.init(() =>
	{
		stream.on('stream-close', (e) =>
		{
			console.log(`<demo> event [stream-close] - ${e.streamId}`);
			unpublishStream({stream, trackClosed: true });
		});

		const videoId = '3t_local'+ stream.streamId;
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

		stream.play(videoId, {}, () => {}, () => {});

		client.publish(stream, () => {}, () => {
			// 
			stream.close();
			stream = null;
		});
		// 
	}, (evt) =>
	{
		console.log('<demo> createPublishStream - Stream.init failed. - error: ' + evt);
		
		// 
		stream.close();
	});
}

function publishStream(stream)
{
	// 
	if (tttStatus !== 1)
	{
		console.log('<demo> publishStream - 请先[加入房间]');
		return;
	}

	if (!stream)
	{
		console.log('<demo> publishStream - stream is null');
		return;
	}

	client.publish(stream, () => {}, () => {
		// 
		stream.close();
	});
}

// 
function unpublishStream(opts)
{
	const {stream, trackClosed } = opts;

	client.unpublish(stream, () => {}, () => {}, false/*true*/);

	// 
	if (!!trackClosed)
	{
		closeStream(stream);
	}
}

//  纯视频流
let publishStream_noAudioEle = document.getElementById('publishStream_noAudio');
if (!!publishStream_noAudioEle)
{
	publishStream_noAudioEle.addEventListener('click', () =>
	{
		if(!!gStream_noAudio){
			publishStream(gStream_noAudio)
		}else{
			createPublishStream(true,false,false)
		}
	})
}

let unpublishStream_noAudioEle = document.getElementById('unpublishStream_noAudio');
if (!!unpublishStreamEle)
{
	unpublishStream_noAudioEle.addEventListener('click', () =>
	{
		unpublishStream({stream: gStream_noAudio, trackClosed: false});
	})
}

// 屏幕流
let publishScreenEle = document.getElementById('publishScreen');
if (!!publishScreenEle)
{
	publishScreenEle.addEventListener('click', () =>
	{
		if(!!gScreen){
			publishStream(gScreen)
		}else{
			createPublishStream(false,true,true)
		}
	})
}

let unpublishScreenEle = document.getElementById('unpublishScreen');
if (!!unpublishScreenEle)
{
	unpublishScreenEle.addEventListener('click', () =>
	{
		unpublishStream({stream: gScreen, trackClosed: false});
	})
}

// 屏幕流无声音
let publishScreen_noAudioEle = document.getElementById('publishScreen_noAudio');
if (!!publishScreen_noAudioEle)
{
	publishScreen_noAudioEle.addEventListener('click', () =>
	{
		if(!!gScreen_noAudio){
			publishStream(gScreen_noAudio)
		}else{
			createPublishStream(false,false,true)
		}
	})
}

let unpublishScreen_noAudioEle = document.getElementById('unpublishScreen_noAudio');
if (!!unpublishScreen_noAudioEle)
{
	unpublishScreen_noAudioEle.addEventListener('click', () =>
	{
		unpublishStream({stream: gScreen_noAudio, trackClosed: false});
	})
}

// 
const videoSelect = document.getElementById("cameraDev");
const audioInputSelect = document.getElementById('micDev');
const audioOutputSelect = document.getElementById('speakerDev');

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
	
	window.RTCObj.getDevices((devices) =>
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
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput succc - ${JSON.stringify(e)}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput succc. - ' + e);
				}, (e) =>
				{
					text_info.value = text_info.value + `<demo> switch speaker - Stream.setAudioOutput fail - ${JSON.stringify(e)}` + '\n';
					console.log('<demo> switch speaker - Stream.setAudioOutput fail. - ' + e);
				});
			}
		});

		console.log(`<demo> speakerDev change - speakerDevId: ${speakerDevId}`);
	})
}
/********************/
