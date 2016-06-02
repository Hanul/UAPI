# UAPI
UJS/UPPERCASE 기반 프로젝트의 API 문서를 생성합니다.

## 사용법
```
node UAPI.js {{소스 폴더 경로}} {{API 문서들을 저장할 폴더 경로}}
```

## 표현식
`REQUIRED`와 `OPTIONAL`로 주로 표현됩니다.
```javascript
global.CONNECT_TO_WEB_SOCKET_SERVER = METHOD({

	run : function(params, connectionListenerOrListeners) {
		'use strict';
		//REQUIRED: params
		//OPTIONAL: params.isSecure
		//OPTIONAL: params.host
		//REQUIRED: params.port
		//OPTIONAL: params.fixRequestURI
		//REQUIRED: connectionListenerOrListeners
		//REQUIRED: connectionListenerOrListeners.success
		//OPTIONAL: connectionListenerOrListeners.error
		
		...
```

## 라이센스
[MIT](LICENSE)

## 작성자
[Young Jae Sim](https://github.com/Hanul)