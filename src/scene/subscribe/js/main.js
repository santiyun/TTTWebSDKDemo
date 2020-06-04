
'use strict';

// 
let client = null;
let tttStatus = 0;

let remote_stream = new Map();

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

// 
let videoEle = document.getElementById('video');

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

	// 设置serverurl
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
			console.log(`<demo> subscribe audio ${evt.stream.getId()} succ`);
		}, (err) =>
		{
			console.log(`<demo> subscribe audio ${evt.stream.getId()} fail - ${err}`);
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
			console.log(`<demo> subscribe video ${evt.stream.getId()} succ`);
			// successful doing someting, like play remote video or audio.
		}, (err) =>
		{
			console.log(`<demo> subscribe video ${evt.stream.getId()} fail - ${err}`);
		});
	})

	client.on('video-removed', (evt) =>
	{
		const { streamId, stream } = evt;

		console.log(`<demo> - event [video-removed] streamId: ${streamId} videoType: ${stream.videoType}`);

		// remove stream from map
		remote_stream.delete(streamId);

		// 
		let obj = document.getElementById('3t_remote' + streamId);
		if (obj)
		{
			obj.remove();
		}
	})

	client.on('stream-subscribed', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.hasAudio: ${stream.hasAudio()} stream.hasVideo: ${stream.hasVideo()} stream.videoType: ${stream.videoType}`);

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

			stream.play('3t_remote' + stream.getId(), { isControls: true }, () => {
				console.log('<demo> - stream.play succ');
			}, () => {
				console.log(`<demo> - stream.play fail - ${JSON.stringify(e)}`);
			});
		}

		if (stream.hasAudio())
		{
			stream.play();
			/*
			stream.play('', {}, () => {
				console.log('<demo> - stream.play succ');
			}, (e) => {
				console.log(`<demo> - stream.play fail - ${JSON.stringify(e)}`)
			});
			*/
		}
	});

	client.on('stream-unsubscribed', (evt) =>
	{
		var stream = evt.stream;
		if (!stream)
			return;

		console.log(`<demo> - event [stream-unsubscribed] streamId: ${stream.getId()} stream.videoType: ${stream.videoType}`);
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
