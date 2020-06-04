
'use strict';

// 
let client = null;

let gStream = null;

let videoEle = document.getElementById('video');

let tttStatus = 0;

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

let userRole = 2;

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

	// window.setServerUrl("152-136-34-204.3ttech.cn");

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
		console.log(`<demo> ${err.name} ${err.message}`);
	});
}

/******************* for switchDevices */
// 
if (!!videoSelect)
{
	videoSelect.addEventListener('change', () =>
	{
		let index = videoSelect.selectedIndex;

		const cameraDevId = videoSelect.options[index].value;

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

		const micDevId = audioInputSelect.options[index].value;

		console.log(`<demo> micDev change - micDevId: ${micDevId}`);

		// switch device for Stream
		if (!!gStream)
		{
			/*
			gStream.switchDevice('audio', micDevId, () =>
			{
				console.log(`<demo> switchDevice succ - deviceId: ${micDevId}`);
			}, (e) =>
			{
				console.log(`<demo> switchDevice fail - deviceId: ${micDevId} - ${e.toString()}`);
			});
			*/
			const constraints = {
				audio: {
					deviceId: { exact: micDevId }
				}
			}
			navigator.mediaDevices.getUserMedia(constraints)
			.then(stream =>
			{
				let audioTracks = stream.getAudioTracks();
				if (audioTracks.length > 0)
				{
					const track = audioTracks[0];
					gStream.replaceTrack(track, () => {
						console.log('<demo> gStream.replaceTrack succ');
					}, (e, desc) => {
						console.log(`<demo> gStream.replaceTrack fail - ${e} ${JSON.stringify(desc)}`);
					});
				}
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

		const speakerDevId = audioOutputSelect.options[index].value;

		// 
		remote_stream.forEach((item) =>
		{
			if (!!item)
			{
				// 
				item.setAudioOutput(speakerDevId, (e) =>
				{
					console.log(`<demo> switch speaker - Stream.setAudioOutput succc - ${JSON.stringify(e)}`);
				}, (e) =>
				{
					console.log(`<demo> switch speaker - Stream.setAudioOutput fail - ${JSON.stringify(e)}`);
				});
			}
		});

		console.log(`<demo> speakerDev change - speakerDevId: ${speakerDevId}`);
	})
}
/********************/
