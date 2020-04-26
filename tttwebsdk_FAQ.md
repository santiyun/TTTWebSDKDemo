## 浏览器支持情况
---
TTT Web SDK 支持如下浏览器及平台：

|<center>**平台**</center>|<center>**Chrome 58+**</center>|<center>**Safari 11+**</center>|
|:--|:--|:--|
|macOS 10+|Y|Y|
|Windows 7+|Y| - |

注：Firefox 浏览器上的支持情况尚未充分验证

## 私有化部署
---
TTT Web SDK 后端需要相应的服务支持，除 3T 的通用大网服务外，还有如下两个web专用服务：  
注：通过 superctl status 查得
* node
* node_msgw

## websdk 参数要求
---
websdk 登录系统、加入房间/通道，涉及到如下几个参数：

|<center>**参数**</center>|<center>**类型**</center>|<center>**说明**</center>|
|:--|:--|:--|
|appId|string|开发者从 3T 官网申请得到的 appId|
|roomId|number : 最长16位数|房间/通道号，加入统一房间/通道 的用户，之间可以进行连麦|
|userId|number : 最长16位数|用户ID，在同一 appId 下，同一 userId 重复登录会发生 'kickout' 事件|

## websdk前端登录连接失败
---
涉及到 调度服务器、媒体服务器，可做如下检查：
* 确认服务器是否连通
* 确认调度服务器上服务的运行状态
* 确认网络端口（默认为443）是否开放
* 确认https证书是否正确有效
* 检查 iplocattion 返回结果中， mProtocolMsg.mIpAddrMsg.sDomain\mProtocolMsg.mIpAddrMsg.nPort 字段值是否正确
* 检查 媒体服务器 上 node\node_msgw 服务的运行状态
* 检查 媒体服务器 上 node 所用证书是否正确有效

## websdk 前端登录超时失败 -- 'join room timeout'
---
检查媒体服务器上 node_msgw 服务相关情况：
* node_msgw 服务的运行状态
* node_msgw 的配置 ./msgw/src/config.js 中 TTTClient.ip
* 检查从媒体服务器上访问 TTTClient.ip 的连通性
* node_msgw 的配置 ./msgw/src/config.js 中 mediasoup.domain
* 检查从媒体服务器上访问 mediasoup.domain 的连通性

## Stream.init 时打开设备报错
---
设备相关常见错误如下：
* NotReadableError: Could not start video source -- 摄像头设备不可用（被其他应用占用？）
* NotAllowedError: Permission denied -- 摄像头设备访问权限被禁止
* Stream.init 长时间无返回 -- 用户未点击确认“是否允许设备访问”弹窗

## 音视频卡顿
---
多数情况下为网络状况、设备等环境因素引起。
* 检查本地网络情况 -- 也可通过 tttwebsdk Client.getStats() 获取当前音视频的实时传输情况
* 可以尝试切换到 其他网络，再做验证

## 远端视频黑屏
---
* 首先确认远端是否已暂停/关闭视频
* 确认远端摄像头设备是否正常；如果为外部视频源，则请确认外部视频源是否正常
* 确认当前网络情况 -- 也可通过 tttwebsdk Client.getStats() 获取当前音视频的实时传输情况
* 可以尝试切换到 其他网络，再做验证

## 视频模糊
---
* 确认当前设置的 videoProfile -- 可通过 Stream.getVideoProfile() 获取
* 确认当前网络音视频传输状态 -- 可通过 Client.getStats() 或者 Client.remoteVideoStats() 获取
