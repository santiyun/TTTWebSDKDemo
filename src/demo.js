// const TTTRtcWeb = require('../dist/tttwebsdk');

import Swal from 'sweetalert2'

let cdnUrl = '';// 'rtmp://stech.3ttech.cn/live/test';

let RTCObj = new window.TTTRtcWeb();
let client = null;
let streams = new Map();

let hasPublishStream = false;
let hasPublishScreen = false;

let intv = null;

let remote_stream = new Map();

const stream_net_info = document.getElementById('stream_net_info');
const text_info = document.getElementById('text_info');

let tttStatus = 0;

let joinAct = false;

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
			}, 1000);
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
		_innerUnpublishStream();
		_innerUnpublishScreen();
	});

	client.on('enter', () => {
		// 
		if (hasPublishStream)
		{
			publishStream();
		}

		if (hasPublishScreen)
		{
			publishScreen();
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
		unpublishStream();
		unpublishScreen();

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

			let obj = document.getElementById('3t_remote' + stream.getId());
			if (obj)
			{
				obj.remove();
			}

            // remove stream from map
            remote_stream.delete(stream.getId());

			stream.close();
        });
        // $('#3t_remote' + stream.getId()).remove();
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
			
		text_info.value = text_info.value + `<demo> - event [video-added] streamId: ${evt.stream.getId()}` + '\n';

		console.log(`<demo> - event [video-added] streamId: ${evt.stream.getId()}`);

        remote_stream.set(stream.getId(), stream);
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe video ${evt.stream.getId()} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
	})

	/*
    client.on('stream-added', (evt) => {
		text_info.value = text_info.value + `<demo> - event [stream-added] streamId: ${evt.stream.getId()} type: ${evt.stream.type}` + '\n';

		console.log(`<demo> - event [stream-added] streamId: ${evt.stream.getId()} type: ${evt.stream.type}`);
		
        var stream = evt.stream;
        remote_stream.set(stream.getId(), stream);
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, (event) => {
			text_info.value = text_info.value + `<demo> subscribe stream ${evt.stream.getId()} type: ${evt.stream.type} succ.` + '\n';
            // successful doing someting, like play remote video or audio.
        }, (err) => {
			text_info.value = text_info.value + `<demo> subscribe stream ${evt.stream.getId()} type: ${evt.stream.type} failed. - error: ${JSON.stringify(err)}` + '\n';
            // info.val(info.val() + 'Subscribe stream failed' + err + '\n');
        });
    });

    client.on('stream-removed', (evt) => {
        var peer = evt;
		document.getElementById('3t_remote' + peer.name).remove();
		
		text_info.value = text_info.value + `<demo> - event [stream-removed] streamId: ${peer.name}` + '\n';

		console.log(`<demo> - event [stream-removed] streamId: ${peer.name}`);
        // $('#3t_remote' + peer.name).remove();

        // remove stream from map
        remote_stream.delete(peer.name);
	});
	*/

    client.on('stream-subscribed', (evt) => {
        var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.type: ${stream.type}` + '\n';

		console.log(`<demo> - event [stream-subscribed] streamId: ${stream.getId()} stream.type: ${stream.type}`);

		if(stream.type === 'audio')
		{
            // play audio
            stream.play();
		}
		else
		{
			// play video
            // info.val(info.val() + 'Subscribe remote stream successfully: ' + stream.getId() + '\n');
            var videoId = '3t_remote' + stream.getId();
            // if ($('div#video #' + videoId).length === 0) {
			if(!document.getElementById(videoId))
			{
                let video = document.createElement('video');
                video.id = videoId;
                video.style.cssText = 'height: 300px; width: 300px; background: black; position:relative; display:inline-block;'
                document.getElementById('video').append(video);
                // $('div#video').append('<video autoplay id="' + videoId + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
            }

            stream.play('3t_remote' + stream.getId());
        }
        
    });

    client.on('video-mute', (evt) => {
		var stream = evt.stream;
		if (!stream)
			return;

		text_info.value = text_info.value + `<demo> - event [video-mute] streamId: ${stream.getId()}` + '\n';
		console.log(`<demo> - event [video-mute] streamId: ${stream.getId()}`);

		stream._video.style.backgroundColor = 'transparent';
		stream._video.srcObject = null;
		stream._video.poster = 'http://www.3ttech.cn/favicon.ico';

		// visibility: hidden
		
    	// document.getElementById('3t_remote' + stream.getId())
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

    	// document.getElementById('3t_remote' + stream.getId())
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
	unpublishStream();
	unpublishScreen();

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

let videoStream = null;
// 
function publishStream()
{
	// 
	if (tttStatus !== 1)
	{
		Swal.fire('请先[加入房间]');
		text_info.value = text_info.value + 'publishStream - 请先[加入房间]' + '\n';
		return;
    }
    
    if (videoStream !== null)
	{
		Swal.fire('已推流，无需重复推流');
		text_info.value = text_info.value + 'publishStream - 已推流，无需重复推流' + '\n';
		return;
    }
    
	let userid = document.getElementById('userid').value;

	videoStream = RTCObj.createStream({
		streamID: userid,
		audio: true,
		video: true,
		screen: false
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
        let video = document.createElement('video');
        video.id = '3t_local';
        video.muted = true;
        video.style.cssText = "height: 300px; width: 300px; background: black; position: relative; display: inline-block;"

		document.getElementById('video').append(video);
		
		// $('div#video').append('<div id="div_3t_local"><video autoplay muted id="3t_local" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video><div id="local_info"></div></div>');
		videoStream.play('3t_local');
		streams.set(videoStream.getId(), videoStream);

		// set video profile
		let resolution = document.getElementById('resolution').value;
		videoStream.setVideoProfile(resolution, (msg) => {
			text_info.value = text_info.value + `<demo> publishStream - videoStream.setVideoProfile succ. ${resolution}` + '\n';
			console.log(`<demo> publishStream - videoStream.setVideoProfile succ: ${resolution}`);

			// 
			client.publish(videoStream, () => {
				const mid = videoStream.innerStreamID;
				setStreamSEI(mid, 'add', false);
		
				text_info.value = text_info.value + `<demo> publishStream - client.publish video succ. videoStream: ${videoStream.getId()}` + '\n';
				console.log(`<demo> publishStream - client.publish video succ. videoStream: ${videoStream.getId()}`);

				// 
				hasPublishStream = true;

				document.getElementById('publishStreamStatus').innerHTML = `<font color="green">已推流</font>`;
			}, (evt) => {
				text_info.value = text_info.value + `publishStream - client.publish video failed. - error: ${JSON.stringify(evt)}` + '\n';
				console.log(`<demo> publishStream - client.publish video failed. - error: ${JSON.stringify(evt)}`);

				let obj = document.getElementById('3t_local');
				if (obj)
				{
					obj.remove();
				}
				// 
				streams.delete(videoStream.getId());
				
				videoStream.close();
				videoStream = null;

				document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
			});
		}, (e) => {
			text_info.value = text_info.value + `publishStream - videoStream.setVideoProfile failed. - error: ${JSON.stringify(e)}` + '\n';
			console.log(`<demo> publishStream - videoStream.setVideoProfile - error: ${JSON.stringify(e)}`);

			let obj = document.getElementById('3t_local');
			if (obj)
			{
				obj.remove();
			}

			// 
			streams.delete(videoStream.getId());
			
			videoStream.close();
			videoStream = null;

			document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
		});
		// 
	}, (evt) => {
		text_info.value = text_info.value + '<demo> publishStream - videoStream.init failed. - error: ${JSON.stringify(evt)}' + '\n';
		console.log(`<demo> publishStream - videoStream.init failed. - error: ${JSON.stringify(evt)}`);

		let obj = document.getElementById('3t_local');
		if (obj)
		{
			obj.remove();
		}

		// 
		streams.delete(videoStream.getId());

		videoStream.close();
		videoStream = null;

		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
	});
}

function unpublishStream()
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'unpublishStream - 请先[加入房间]' + '\n';
		Swal.fire('请先[加入房间]');
		return;
	}

	if (videoStream === null)
	{
		text_info.value = text_info.value + 'unpublishStream - 当前尚未创建 videoStream' + '\n';
		console.log('当前尚未创建 videoStream');
		return;
	}
	
	hasPublishStream = false;
	
	_innerUnpublishStream();
}

function _innerUnpublishStream()
{
	if (!videoStream)
		return;

    client.unpublish(videoStream, () => {
		text_info.value = text_info.value + `<demo> unpublishStream - client.unpublish local stream ${videoStream.getId()} success.` + '\n';
        console.log(`<demo> unpublishStream - client.unpublish local stream ${videoStream.getId()} success.`);
		// optionPublishedStream(videoStream, 'del')

		let obj = document.getElementById('3t_local');
		if (obj)
		{
			obj.remove();
		}

		// 
        streams.delete(videoStream.getId());
        
        videoStream.close();
		videoStream = null;

		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
    }, () => {
		text_info.value = text_info.value + '<demo> unpublishStream - client.unpublish local stream failed' + '\n';
        console.log('<demo> unpublishStream - client.unpublish local stream failed');

		let obj = document.getElementById('3t_local');
		if (obj)
		{
			obj.remove();
		}

		// 
        streams.delete(videoStream.getId());
        
        videoStream.close();
		videoStream = null;

		document.getElementById('publishStreamStatus').innerHTML = `<font color="black">未推流</font>`;
    });
}

document.getElementById('publishStream').addEventListener('click', () => {
    publishStream();
})

document.getElementById('unpublishStream').addEventListener('click', () => {
    unpublishStream();
})

// 
let screen_stream = null;
// 
function publishScreen()
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'publishScreen - 请先[加入房间]' + '\n';
		Swal.fire('请先[加入房间]');
		return;
	}

	if (screen_stream !== null)
	{
		text_info.value = text_info.value + 'publishScreen - 屏幕流已创建' + '\n';
		console.log('屏幕流已创建');
		return;
	}

    let chanid = document.getElementById('chanid').value;
    let userid = document.getElementById('userid').value;

	// 
	screen_stream = RTCObj.createStream({
		streamID : userid + '-screen-audio',
		userID   : userid,
		video    : false,
		audio    : true,
		screen   : true
	});
	
	if (!screen_stream)
		return;

    screen_stream.init(() => {
		streams.set(screen_stream.getId(), screen_stream);
        
        let video = document.createElement('video');
        video.id = '3t_local' + screen_stream.getId();
        video.muted = true;
        video.style.cssText = "height: 300px; width: 300px; background: black; position: relative; display: inline-block;"
        // optionPublishedStream(screen_stream, 'add');
        document.getElementById('video').append(video)
        // $('div#video').append('<video autoplay muted id="3t_local' + screen_stream.getId() + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
		screen_stream.play('3t_local' + screen_stream.getId());
		
		// TODO : 
		client.publishScreen(screen_stream, (e) => {
			const mid = screen_stream.innerStreamID;
			setStreamSEI(mid, 'add', true);
			text_info.value = text_info.value + `<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} success.` + '\n';
			console.log(`<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} success.`);
	
			hasPublishScreen = true;
	
			document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
		}, (e) => {
			text_info.value = text_info.value + `<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} failed.` + '\n';
			console.log(`<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} failed.`);

			let obj = document.getElementById('3t_local' + screen_stream.getId());
			if (obj)
			{
				obj.remove();
			}
			// 
			streams.delete(screen_stream.getId());
			
			screen_stream.close();
			screen_stream = null;

			document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
		});
    }, (err) => {
		text_info.value = text_info.value + 'publishScreen - screen_stream.init local screen stream init failed.' + '\n';
        console.log('<demo> publishScreen - screen_stream.init local screen stream init failed.');

		let obj = document.getElementById('3t_local' + screen_stream.getId());
		if (obj)
		{
			obj.remove();
		}
		// 
		streams.delete(screen_stream.getId());
		
		screen_stream.close();
		screen_stream = null;
});

    // streamEvents(screen_stream);
}
// 

function setStreamSEI(mid, type, isScreen)
 {
    if(client._role !== "1") return
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
	if (type === 'add')
	{
        sei.pos.push(position);
	}
	else
	{
        sei.pos.pop();
    }

    client.setSEI(mid, type, isScreen, sei);
};

/*
function publishScreen()
{
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'publishScreen - 请先[加入房间].' + '\n';
		Swal.fire('请先[加入房间]');
		return;
	}

	if (screen_stream === null)
	{
		text_info.value = text_info.value + 'publishScreen - 请先[采集屏幕流].' + '\n';
		console.log('请先[采集屏幕流]');
		return;
	}

    client.publishScreen(screen_stream, (e) => {
		const mid = screen_stream.innerStreamID;
		setStreamSEI(mid, 'add', true);
		text_info.value = text_info.value + `<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} success.` + '\n';
        console.log(`<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} success.`);

		hasPublishScreen = true;

		document.getElementById('publishScreenStatus').innerHTML = `<font color="green">已推流</font>`;
	}, (e) => {
		text_info.value = text_info.value + `<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} failed.` + '\n';
		console.log(`<demo> publishScreen - client.publishScreen screen stream ${screen_stream.getId()} failed.`);
		
		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
    });
}
*/
function unpublishScreen() {
	// 
	if (tttStatus !== 1)
	{
		text_info.value = text_info.value + 'unpublishScreen - 请先[加入房间].' + '\n';
		Swal.fire('请先[加入房间]');
		return;
    }
    
    if (screen_stream === null)
	{
		text_info.value = text_info.value + 'unpublishScreen - error - scrren_stream is null.' + '\n';
		console.log('unpublishScreen - error - scrren_stream is null.');
		return;
	}

	hasPublishScreen = false;

	_innerUnpublishScreen();
}

function _innerUnpublishScreen()
{
	if (!screen_stream)
		return;

	client.unpublishScreen(screen_stream, (e) => {
		text_info.value = text_info.value + `<demo> unpublishScreen - client.unpublish screen stream ${screen_stream.getId()} success.` + '\n';
		console.log(`<demo> unpublishScreen - client.unpublish screen stream ${screen_stream.getId()} success.`);

		let obj = document.getElementById('3t_local' + screen_stream.getId());
		if (obj)
		{
			obj.remove();
		}
		// 
		streams.delete(screen_stream.getId());
		
		screen_stream.close();
		screen_stream = null;

		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
    }, (e) => {
		text_info.value = text_info.value + `<demo> unpublishScreen - client.unpublish screen stream ${screen_stream.getId()} failed.` + '\n';
        console.log(`<demo> unpublishScreen - client.unpublish screen stream ${screen_stream.getId()} failed.`);

		let obj = document.getElementById('3t_local' + screen_stream.getId());
		if (obj)
		{
			obj.remove();
		}
		// 
		streams.delete(screen_stream.getId());
		
		screen_stream.close();
		screen_stream = null;

		document.getElementById('publishScreenStatus').innerHTML = `<font color="black">未推流</font>`;
    });
}

/*
document.getElementById('captureScreen').addEventListener('click', () => {
    captureScreenAndAudio()
})
*/

document.getElementById('publishScreen').addEventListener('click', () => {
    publishScreen()
})

document.getElementById('unpublishScreen').addEventListener('click', () => {
    unpublishScreen()
})
