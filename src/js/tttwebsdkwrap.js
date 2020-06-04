import TTTRtcWeb from '../../lib/tttwebsdk'; // import from local tttwebsdk.js

global.setTurnServers = function ()
{
	const conf = {
		iceServers: [
			{
				urls: [
					'stun:xxx.xxx.xxx.xxx:19302',
					'stun:[xxxx:xxxx:xxxx:xxxx::xx]:19302'
				]
			},
			{
				urls: [
					'turn:xxx.xxx.xxx.xxx:19305?transport=udp',
					'turn:[xxxx:xxxx:xxxx:xxxx::xx]:19305?transport=udp',
					'turn:yyy.yyy.yyy.yyy:19305?transport=tcp',
					'turn:[xxxx:xxxx:xxxx:xxxx::xx]:19305?transport=tcp'
				],
				username: 'xxxxxx',
				credential: 'yyyyyy'
			}
		],
		iceTransportPolicy: 'all',
		enableTurn: true
	}
	TTTRtcWeb.setTurnServers(conf);
}
global.setServerUrl = function(url){
	TTTRtcWeb.setServerUrl(url);
}
global.getVersion = function(){
	return TTTRtcWeb.getVersion();
}

global.RTCObj = new TTTRtcWeb();
