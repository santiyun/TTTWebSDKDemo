
'use strict';

let gStream = null;

let videoEle = document.getElementById('video');

// 
let rSeed = (Math.random() * 100000000);
let userId = Math.floor(rSeed) + 1;

const sdkVersionEle = document.getElementById('sdkVersion');
if (!!sdkVersionEle)
{
	sdkVersionEle.innerHTML = `sdk version : ${window.RTCObj.version}`;
}

/******************* for previewLocal */
//
let previewLocalEle = document.getElementById('previewLocal');
if (!!previewLocalEle)
{
	previewLocalEle.addEventListener('click', () =>
	{
		previewLocalStream({
			userid: userId
		});
	})
}

function previewLocalStream(opts)
{
	const {
		userid
	} = opts;

	if (gStream === null)
	{
		let resolution = '480p';

		console.log(`<demo> previewLocalStream() userid: ${userid} resolution: ${resolution}`);

		gStream = window.RTCObj.createStream({
			userId: +userid,
			audio: true,
			video: true,
			attributes: { videoProfile: resolution }
		});

		if (!gStream)
			return;

		gStream.init(() =>
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
			// 
		}, (evt) =>
		{
			console.log('<demo> previewLocalStream - Stream.init failed. - error: ' + evt);
		});
	}
	else
	{
		const videoId = '3t_local';
		gStream.play(videoId, true);
	}
}
