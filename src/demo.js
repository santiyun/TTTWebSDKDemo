const TTTRtcWeb = require('tttwebsdk');

import Swal from 'sweetalert2'

let cdnUrl = 'rtmp://stech.3ttech.cn/live/test';

let RTCObj = new TTTRtcWeb();
let client = null;
let streams = new Map();

let remote_stream = new Map();

let tttStatus = 0;

let sei = {
    "ts": "",
    "ver": "20161227",
    "canvas": {
        "bgrad": [
            232,
            230,
            232
        ],
        "h": 640,
        "w": 368
    },
    "mid": "",
    "pos": []
}

function joinChan() {
    const appid = document.getElementById("appID").value;

    let chanid = document.getElementById("chanid").value;
    let userid = document.getElementById('userid').value;
	const userRole = document.getElementById("userrole").value;
    cdnUrl = document.getElementById('rtmpUrl').value;

    client = RTCObj.createClient({ role: userRole, rtmpUrl: cdnUrl });

    client.init(appid, userid, function () {
        client.join(chanid, function () {
			console.log('login success.');

			Swal.fire('成功加入房间!!');
			
			tttStatus = 1; // 状态标注为: 登录成功
			document.getElementById("loginStatus").innerHTML = `<font color="green">登录成功</font><br> -- role: ${userRole}<br> -- CDN: ${cdnUrl}`;
        }, function (err) {
			console.log('login failed.');

			document.getElementById("loginStatus").innerHTML = '<font color="red">登录失败</font>';
        });
    }, function (err) {
    });

    client.on('peer-join', (evt) => {
        console.log('user joined room. uid=', evt.name);
    });

    client.on('peer-leave', (evt) => {
        console.log('user leaved room. uid=', evt.userID);

        evt.streams.forEach(stream => {
            stream.close();
            document.getElementById("3t_remote" + stream.getId()).remove()

            // remove stream from map
            remote_stream.delete(stream.getId());
        });
        // $('#3t_remote' + stream.getId()).remove();
    });

    client.on('stream-added', (evt) => {
        console.log('stream-addedd id=', evt.stream.getId());
        var stream = evt.stream;
        remote_stream.set(stream.getId(), stream);
        let in_stream = remote_stream.get(stream.getId());
        client.subscribe(in_stream, function (event) {
            //successful doing someting, like play remote video or audio.
        }, function (err) {
            // info.val(info.val() + "Subscribe stream failed" + err + '\n');
        });
    });

    client.on('stream-removed', function (evt) {
        var peer = evt;
    	document.getElementById("3t_remote" + peer.name).remove()
        // $('#3t_remote' + peer.name).remove();

        // remove stream from map
        remote_stream.delete(peer.name);
    });

    client.on('peer-leave', function (evt) {
        console.log('peer-leave, id=', evt.stream.getId());
        var stream = evt.stream;
        stream.stop();
        stream.close();
	    document.getElementById("3t_remote" + stream.getId()).remove()
        // $('#3t_remote' + stream.getId()).remove();

        // remove stream from map
        remote_stream.delete(stream.getId());
    });

    client.on('stream-subscribed', function (evt) {
        var stream = evt.stream;
        if(stream.type === 'audio') {
            // play audio
            stream.play()
            return
        } else {
            // play video
            // info.val(info.val() + "Subscribe remote stream successfully: " + stream.getId() + "\n");
            var videoId = "3t_remote" + stream.getId();
            // if ($('div#video #' + videoId).length === 0) {
            if(!document.getElementById(videoId)) {
                let video = document.createElement('video');
                video.id = videoId;
                video.style.cssText = 'height: 300px; width: 300px; background: black; position:relative; display:inline-block;'
                document.getElementById('video').append(video)
                    // $('div#video').append('<video autoplay id="' + videoId + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
            }

            stream.play('3t_remote' + stream.getId());
        }
        
    });

    client.on('video-mute', () => {
        var peer = evt;
        console.log('video-mute', peer.name);
    	document.getElementById("3t_remote" + peer.name).remove()
        // $('#3t_remote' + peer.name).remove();

        // remove stream from map
        remote_stream.delete(peer.name);
    })
}

function leaveChan() {
	tttStatus = 0;

    if (client) {
        client.leave(() => { }, () => { });
        client.close();
	}
}
document.getElementById("joinChan").addEventListener("click", () => {
    joinChan()
})
document.getElementById("leaveChan").addEventListener("click", () => {
    leaveChan()
})

let videoStream = null;
// 
function publishStream() {
	// 
	if (tttStatus !== 1)
	{
		Swal.fire('请先[加入房间]');
		return;
    }
    
    if (videoStream !== null)
	{
		Swal.fire('已推流，无需重复推流');
		return;
    }
    
	let userid = document.getElementById('userid').value;

	videoStream = RTCObj.createStream({
		streamID: userid,
		audio: true,
		video: true,
		screen: false
	});

    window.ls = videoStream
    document.getElementById('setInputVolume').addEventListener('change', (e) => {
        videoStream.setInputVolume(+e.target.value)
    })
	videoStream.init(function () {

        let video = document.createElement("video");
        video.id = '3t_local';
        video.muted = true;
        video.style.cssText = "height: 300px; width: 300px; background: black; position: relative; display: inline-block;"

        document.getElementById('video').append(video)
		// $('div#video').append('<div id="div_3t_local"><video autoplay muted id="3t_local" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video><div id="local_info"></div></div>');
		videoStream.play('3t_local');
		streams.set(videoStream.getId(), videoStream);

		// set video profile
		let resolution = document.getElementById('resolution').value;
		videoStream.setVideoProfile(resolution, (msg) => { 
			console.log(`setVideoProfile succ: ${resolution}`);
		}, (e) => {
			console.log(`setVideoProfile error: ${JSON.stringify(e)}`);
		});
		// 

		client.publish(videoStream, function success() {
			const mid = videoStream.innerStreamID;
			setStreamSEI(mid, 'add', false);
	
			console.log(`publish video succ. videoStream: ${videoStream.getId()}`);
		}, function failure() {
			console.log('publish video failed.');
		});
	}, function () {
	});
}

function unpublishStream() {
	// 
	if (tttStatus !== 1) {
		Swal.fire('请先[加入房间]');
		return;
	}

	if (videoStream === null) {
		console.log('当前尚未创建 videoStream');
		return;
    }
    
    client.unpublish(videoStream, function () {
        console.log(`unpublish local stream success. steamID: ${videoStream.getId()}`);
		// optionPublishedStream(videoStream, 'del')
		
        streams.delete(videoStream.getId());
        
        videoStream.close();
		videoStream = null;
    }, function () {
        console.log('unpublish local stream failed');
    });
}

document.getElementById("publishStream").addEventListener('click', () => {
    publishStream();
})

document.getElementById("unpublishStream").addEventListener('click', () => {
    unpublishStream();
})

// 
let screen_stream = null;
// 
function captureScreenAndAudio() {
	// 
	if (tttStatus !== 1)
	{
		Swal.fire('请先[加入房间]');
		return;
	}

	if (screen_stream !== null)
	{
		console.log('屏幕流已创建');
		return;
	}

    let chanid = document.getElementById("chanid").value;
    let userid = document.getElementById('userid').value;

	// 
    screen_stream = RTCObj.createStream({ streamID: userid + '-screen-audio', userID: userid, video: false, audio: true, screen: true });
    screen_stream.init(() => {
		streams.set(screen_stream.getId(), screen_stream);
        
        let video = document.createElement("video");
        video.id = '3t_local' + screen_stream.getId();
        video.muted = true;
        video.style.cssText = "height: 300px; width: 300px; background: black; position: relative; display: inline-block;"
        // optionPublishedStream(screen_stream, 'add');
        document.getElementById("video").append(video)
        // $('div#video').append('<video autoplay muted id="3t_local' + screen_stream.getId() + '" style="height: 300px; width: 300px; background: black; position:relative; display:inline-block;"></video>');
		screen_stream.play("3t_local" + screen_stream.getId());
		
        console.log(`screen display -- screen_stream: ${screen_stream.getId()} screen_stream_id: ${screen_stream.innerStreamID}`);
    }, (err) => {
        console.log('local screen stream init failed.');
    });

    // streamEvents(screen_stream);
}
// 

function setStreamSEI(mid, type, isScreen) {
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
    if (type === 'add') {
        sei.pos.push(position);
    } else {
        sei.pos.pop();
    }

    client.setSEI(mid, type, isScreen, sei);
};

function publishScreen() {
	// 
	if (tttStatus !== 1) {
		Swal.fire('请先[加入房间]');
		return;
	}

	if (screen_stream === null) {
		console.log('请先[采集屏幕流]');
		return;
	}

    client.publishScreen(screen_stream, (e) => {
		const mid = screen_stream.innerStreamID;
        setStreamSEI(mid, 'add', true);
        console.log(`publish screen stream success: streamID = ${screen_stream.getId()}`);
    }, (e) => {
        console.log(`publish screen stream failed: streamID = ${screen_stream.getId()}`);
    });
}

function unpublishScreen() {
	// 
	if (tttStatus !== 1)
	{
		Swal.fire('请先[加入房间]');
		return;
    }
    
    if (screen_stream === null)
	{
		console.log('unpublishScreen error - scrren_stream is null.');
		return;
	}

	client.unpublishScreen(screen_stream, (e) => {
		console.log(`unpublish screen stream success: streamID = ${screen_stream.getId()}`);
		
		streams.delete(screen_stream.getId());
    }, (e) => {
        console.log(`unpublish screen stream failed: streamID = ${screen_stream.getId()}`);
    });
}

document.getElementById("captureScreen").addEventListener("click", () => {
    captureScreenAndAudio()
})
document.getElementById("publishScreen").addEventListener("click", () => {
    publishScreen()
})
document.getElementById("unpublishScreen").addEventListener("click", () => {
    unpublishScreen()
})
