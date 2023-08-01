## 遇到的问题
### 执行 npm run dev 的时候是如何做到 vite 和 electron 一起启动的；执行 npm run build 的时候是如何做到 vite 和 electron 一起打包的。这两个问题应该可以在 vite-plugin-electron vite-plugin-electron-renderer 这两个插件中找到答案

### electron-builder.json5 是配置 electron 的文件？哪里用到的？

### 使用electron-builder打包时下载electron失败解决方案
electron-builder 在打包时会检测cache中是否有electron 包，如果没有的话会从github上拉去，在国内网络环境中拉取的过程大概率会失败，所以你可以自己去下载一个包放到cache目录里

各个平台的目录地址

Linux: $XDG_CACHE_HOME or ~/.cache/electron/
MacOS: ~/Library/Caches/electron/
Windows: %LOCALAPPDATA%/electron/Cache or ~/AppData/Local/electron/Cache/ or C:/Users/xxx/AppData/Local/electron/Cache

参考：https://github.com/electron/get#how-it-works

例如在macos平台打包electron应用，执行 electron-builder --mac --x64

➜  clipboard git:(master) ✗ npm run dist

> clipboard@1.0.0 dist /Users/xx/workspace/electron/clipboard
> electron-builder --mac --x64

  • electron-builder  version=22.3.2 os=18.7.0
  • loaded configuration  file=package.json ("build" field)
  • writing effective config  file=dist/builder-effective-config.yaml
  • packaging       platform=darwin arch=x64 electron=8.0.0 appOutDir=dist/mac
  • downloading     url=https://github.com/electron/electron/releases/download/v8.0.0/electron-v8.0.0-darwin-x64.zip size=66 MB parts=8
可以单独下载这个包 https://github.com/electron/electron/releases/download/v8.0.0/electron-v8.0.0-darwin-x64.zip， 放到~/Library/Caches/electron/ 目录下

然后可以打包完成

### 不规则窗口

#### 注意点！！！截止 electron 24.6.4 版本时必须设置 alwaysOnTop: true，否则后面设置鼠标事件时移入移除有问题。

1. 窗口相关设置

   ```js
   irregularWindow = new BrowserWindow({
     width: 380,
     height: 380,
     transparent: true, // 设置窗口为透明
     frame: false, // 无边框
     maximizable: false, // 阻止窗口最大化
     resizable: false, // 不能改变窗口尺寸
     alwaysOnTop: true, // 永远在置顶    
     webPreferences: {
       nodeIntegration: true,
       contextIsolation: false,
       preload: path.join(__dirname, 'preload.js')
     }
   })
   ```
   
2. 设置窗口默认鼠标事件穿透和转发

   > [官网对 setIgnoreMouseEvents 的定义.](https://www.electronjs.org/zh/docs/latest/tutorial/window-customization#%E5%88%9B%E5%BB%BA%E7%82%B9%E5%87%BB%E7%A9%BF%E9%80%8F%E7%AA%97%E5%8F%A3)。大体意思是传 true 时会穿透，反之则不会穿透。

   ```js
   irregularWindow.setIgnoreMouseEvents(true, { forward: true })
   ```

3. 建立进程间通信的监听

   ```js
   ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
     console.log('set-ignore-mouse-events: ', ignore, options)
   
     irregularWindow?.setIgnoreMouseEvents(ignore, options)
   })
   ```

4. 将窗口主页面定义为想要的形状

   > 拿圆形举例子，当鼠标移动到四个角的时候是不会触发鼠标事件的，只有移入到圆内才会触发鼠标事件

   ```html
   <head>
     <style scoped>
       body,
       html {
         margin: 0px;
         padding: 0px;
       }
   
       #app {
         box-sizing: border-box;
         width: 380px;
         height: 380px;
         border-radius: 190px;
         background-color: #fff;
         overflow: hidden;
       }
     </style>
   </head>
   
   <body>
     <div id='app'></div>
   </body>
   ```

5. 注册鼠标事件并在 **DOM 加载完成后**调用

   ```js
   export const setIgnoreMouseEvents = (flag: boolean) => {
     console.log('setIgnoreMouseEvents', flag);
     if (flag) {
       ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
     } else {
       ipcRenderer.send('set-ignore-mouse-events', false)
     }
   }
   
   // 不规则窗口透明部分鼠标事件可穿透
   export const eventPenetration = () => {
     const el = document.getElementById('app')
     console.log('注册事件监听', el);
     
     el?.addEventListener('mouseenter', () => {
       console.log('mouseenter');
       setIgnoreMouseEvents(false)
     })
     el?.addEventListener('mouseleave', () => {
       console.log('mouseleave');
       setIgnoreMouseEvents(true)
     })
   }
   ```


### 阻止窗口关闭

1. 窗口监听 close 事件，并阻止默认事件，这个时候向渲染进程发通知

   ```js
   win.on('close', event => {
     event.preventDefault()
     win?.webContents.send('closeBefore')
   })
   ```

2. 渲染进程注册主进程发过来的通知监听，在监听中进程业务处理，处理完成后向主进程发送通知，通知主进程可以关闭窗口

   ```js
   ipcRenderer.on('closeBefore', event => {
     console.log('关闭窗口前的提示并通知主进程');
     console.log('等待确认');
     
     
     setTimeout(() => {
       console.log('同意关闭');
       
       ipcRenderer.send('destoryWin')
     }, 5000)
   })
   ```

3. 主进程注册关闭窗口的监听并销毁窗口

   > 这里不能调用 `win.close()` 关闭窗口，如果调用会触发前边窗口 `close` 的监听，而此监听又会阻止窗口关闭，从而进入死循环。
   >
   > 因为当用户确认关闭窗口时应该已经完成收尾工作，所以直接销毁窗口 `win.destory()` 就可以了。

   ```js
   ipcMain.on('destoryWin', () => {
     console.log('退出 app');
     win?.destroy()
   })
   ```


### 多窗口竞争

假设我们开发了一个可以同时打开多个窗口的文档编辑 GUI 应用程序，用户在编辑文档后，文档内容会自动保存到磁盘。现在假设有两个窗口同时打开了同一个文档，那么此时应用就面临着多窗口竞争读写资源的问题。

#### 解决方案1

两个窗口通过渲染进程间的消息通信来保证读写操作有序执行。用户操作窗口 A 修改内容后，窗口 A 发消息给窗口 B，通知窗口 B 更新内容。当窗口 A 保存数据时，先发消息给窗口 B，通知窗口 B 此时不要保存数据。当窗口 A 保存完数据后，再发消息给窗口 B，通知窗口 B 文件已被释放，窗口 B 有权利保存读写该文件了。当窗口 B 需要保存数据时，也发出同样的通知。

也就是说，当某一个渲染进程准备写某文件时，先广播消息给其他渲染进程，禁止其他渲染进程访问该文件；当此渲染进程完成文件写操作后，再广播消息给其他渲染进程，说明自己已经释放了该文件，其他窗口就有写此文件的权利了。

#### 解决方案2

使用 node 提供的 fs.watch 来监视文件的变化，一旦文件发生改变，则加载最新的文件，这样无论哪个窗口都能保证当前的内容是最新的，而文件的写操作则交由主进程执行。当窗口需要保存文件时，渲染进程发送消息给主进程（消息体内包含文件的内容），再由主进程完成写文件操作。无论多少个窗口给主进程发送写文件的消息，都由主进程来保证文件写操作排队依次执行。此方案优于第一种方案，之所以如此有以下三个原因：

- 它利用了 js 单线程执行的特性，主进程收到的消息一定是有顺序的，所以写文件的操作也可以由主进程安排成顺序执行。
- 即使外部程序修改了文件，本程序也能获得文件变化的通知。
- 程序结构上更简单，维护更方便。

> fs.watch 比使用 fs.watchFile 更高效。

#### 解决方案3

在主进程中设置一个令牌

```js
global.fileLock = flase
```

然后在渲染进程中读取这个令牌

```js
let remote = require('electron').remote
let fileLock = remote.getGlobal('fileLock')
```

通过令牌的方式来控制文件读写的权力，当某一个渲染进程需要写文件时，会先判断令牌是否已经被其他渲染进程“拿走”了（此例中判断令牌变量是否为 true）。如果没有，那么此渲染进程“占有”令牌（把令牌变量设置为 true），然后完成写文件操作，再“释放”令牌（把令牌变量设置为 false）。

此操作的复杂点在于我们无法在渲染进程中直接修改主进程的全局变量，只能发送消息给主进程让主进程来修改 global.fileLock 的值。所以，发消息给主进程的工作还是难以避免。因此更推荐使用第二种方案。

### 模态窗口与父子窗口

用户在窗口 A 操作至某一业务环节时，需要打开窗口 B，在窗口 B 内完成一项重要的操作，在关闭窗口 B 后，才能回到窗口 A 继续操作。此时，窗口 B 就是窗口 A 的模态窗口。

一旦模态窗口打开，用户就只能操作该窗口，而不能再操作其父窗口。此时父窗口处于禁用状态，只有等待子窗口关闭后，才能再操作其父窗口。

```js
new BrowserWindow({
	parent: currentWindow, // 新窗口的父窗口
  modal: true // 设置为模态窗口
})
```

窗口的 parent 属性指向当前窗口，modal 属性设置为 true，新窗口即为当前窗口的模态窗口。

如果创建窗口时只设置了窗口的 parent 属性，没有设置 modal 属性，或者 modal 为false，则创建的窗口为 parent 属性指向窗口的子窗口。

子窗口将总是显示在父窗口顶部。与模态窗口不同，子窗口不会禁用父窗口。子窗口创建成功后，虽然始终在父窗口上面，但窗口仍然可以接收点击事件、完成用户输入等。

### MAC 下的关注点

1. 应用程序关闭所有窗口后不会退出，而是继续保留在 Dock 栏，以便用户再想使用应用时，可以直接通过 Dock 栏快速打开应用窗口。

   ```js
   app.on('window-all-closed', () => {
     /**
      * process.platform 值为 darwin 时代表 mac 系统；
      *                  值为 win32 时代表 windows 系统；
      *                  值为 linux 时代表 linux 系统；
      * 也可以通过 require('os').platform() 获取。
      */
     if (process.platform !== 'darwin') {
       app.quit()
     }
   })
   ```

   对应的也要增加如下代码

   ```js
   /**
    * app 的 activate 事件是 mac 专有事件，当应用程序被激活时会被触发。
    * 因为主进程中每关闭一个窗口，都会把窗口对应的 win 对象设置为 null，所以当用户激活应用程序时，再创建一个全新的窗口即可。
    * activate 事件回调的第二个参数 hasVisibleWindows 表示当前是否存在可见的窗口，开发者也可利用此参数优化用户体验。
    */
   app.on('activate', () => {
     if (win === null) {
       createWindow()
     }
   })
   ```

2. 通过 nativeTheme.shouldUseDarkColors 获取是否是深色模式

### webContents 实例

webContents 是 Electron 的核心模块，负责渲染和控制应用内的 web 界面；webFrame 提供访问和控制子页面。

#### 1. 获取当前窗口的 webContents

```js
xxxWin.webContents
```

#### 2. 获取处于激活状态下窗口的 webContents

```js
const { webContents } = require("electron")
// 1. 未激活状态调用此方法返回 null。
// 2. 需要在窗口 focus 事件触发之后获取
webContents.getFocusedWebContents()
```

#### 3. 每创建一个窗口就会有一个对应的 webContents 的 id

#### 4. 获取所有 webContents，且在万不得已时可以遍历。

```js
webContents.getAllWebContents()
```

#### 5. webContents 可以监听 web 页面加载事件

```js
1. did-start-loading
2. page-title-updated
3. dom-ready
4. did-farme-finish-load
5. page-favicon-updated
6. did-stop-loading
```

#### 6. webContents 可以监听 web 页面跳转事件

> 1. 凡是以 navigate 命名的时间一般都是由客户端控制的跳转
> 1. 凡是以 redirect 命名的事件一般都是由服务端控制的跳转，比如服务端响应 302 跳转命令

```js
1. will-redirect
2. did-redirect-navigation
3. did-start-navigation
4. will-navigate
5. did-navigate-in-page
6. did-frame-navigate
7. did-navigate
```

单页应用中的页面跳转会触发这些监听

```js
1. did-start-navigation
2. did-navigate-in-page
```

### 页面缩放

通过 webContents 的 setZoomFactor 方法设置页面的缩放比例，此方法接收一个缩放比例的参数，如果参数值大于1，则放大网页，反之则缩小网页，参数值为1时，网页呈原始状态。可以通过 getZoomFactor 方法获取当前网页的缩放比例。

```js
someWin.webContents.setZoomFactor(2)
const zoomFactor = someWin.webContents.getZoomFactor()
console.log('zoomFactor: ', zoomFactor);
```

也可以通过 setZoomLevel 方法来设置网页缩放等级。接收一个参数 level，最终的缩放比例等于 level 乘以 1.2，如果 level 为 0 则不缩放。可以通过 getZoomLevel 方法获取当前网页的缩放等级。

```js
win.webContents.setZoomLevel(2)
const zoomLevel = win.webContents.getZoomLevel()
console.log('zoomLevel: ', zoomLevel);
```

默认情况下用户可以通过 `Ctrl + Shift + =` 快捷键来放大网页， `Ctrl + -` 快捷键来缩小网页。如果需要控制用户缩放网页的等级范围，可以通过 setVisualZoomLevelLimits 方法来设置网页的最小和最大缩放等级。该方法接收两个参数，第一个参数为最小缩放等级，第二个参数为最大缩放等级，此处等级数字与 setZoomLevel 方法参数的含义相同。

### 页面容器

在页面中嵌入其他页面的需求经常可以看到，Electron 提供了三种页面容器，分别是 webFrame、webView 和 BrowserView。前两者都有一定缺陷，所以推荐使用 VrowserView。

场景就比如开发一个简单的浏览器，标签栏、地址栏、搜索框肯定在主页面中，用户请求浏览的页面肯定是一个子页面，这个时候子页面就可以通过 BrowserView 实现。

#### BrowserView

它被设计成一个子窗口的形式，它依托于 BrowserWindow 存在，可以绑定到 BrowserWindow 的一个具体的区域。BrowserView 看起来就像是 BrowserWindow 里的一个元素一样。

```js
const view = new BrowserView({})
	// 将 view 设置为 someWin 的一个容器
  someWin.setBrowserView(view)
	// 将 view 绑定到 someWin 的具体区域
  const size = someWin.getSize()
  view.setBounds({
    x: 0,
    y: 80,
    width: size[0],
    height: size[1] - 80
  })
	// 设置 view 的宽高自适应 someWin 的宽高变化
  view.setAutoResize({
    width: true,
    height: true
  })
	// view 的 webContents 加载的 URL
  view.webContents.loadURL('https://www.baidu.com/')
```

通过设置 view 的 y 和 height，对应到上面的例子中就是只给 someWin 留出了顶部 80 个像素高的一块区域，只有这块区域是属于 someWin 的，其余区域都交给了 view 容器对象。

场景可以想象到浏览器的 tab 页，tab 页可以有多个，那么就需要动态的创建多个 BrowserView 来缓存和展现用户打开的多个标签页，用户切换标签页时，通过控制相应 BrowserView 容器对象的显示隐藏来满足需求。

为了满足多个 tab 的需求，第一个 tab 可以通过 win.setBrowserView 方法来创建，而后面的 tab 应该采用 win.addBrowserView 方法。因为 setBrowserView 会判断当前 win 是否已经设置过了 BrowserView 对象，如果设置过，那么此操作就替换掉原有的 BrowserView 对象。而 addBrowserView 则可以设置多个 BrowserView 对象同时存在。

BrowserView 并没有 hide 和 show 方法，如果需要隐藏一个 BrowserView 可以利用 `win.removeBrowserView(view)` 显式地把它从窗口中移除掉，需要显式的时候再利用 `win.addBrowserView(view)` 把它加回来。此操作并不会造成 BrowserView 重新渲染，可以放心使用。

也可以使用 CSS 显式和隐藏 BrowserView: 

```js
view.webContents.insertCSS('html{display: block}') // 显示
view.webContents.insertCSS('html{display: none}') // 隐藏
```

### 脚本注入

> 所有的注入方式不论是 BrowserWindow 还是 BrowserView 都可以。

#### 1. 通过 preload 注入脚本

preload 除了可以访问此网页的任意内容，比如 DOM、Cookie（包括标记了 HttpOnly 属性的 cookie）、服务端资源（包括 HTTP API）之外，还可以通过 Node 访问系统资源。

> 无论是否开启 webPreferences.nodeIntegration 注入的脚本都有能力访问 Node 的 API，但是如果开启的话，脚本中的第三方网页也具有访问 Node API 的能力，也就可以任意操纵用户的电脑了。

注入的脚本中也可以 require 其他脚本。

#### 2. 通过 executeJavascript 注入脚本

如果只需要注入一两句 js 脚本，则可以使用 webContents.executeJavascript 方法。

该方法返回的是一个 Promise 对象。

```js
win.webContents.on('did-finish-load', async () => {
  win?.webContents.send('main-process-message', (new Date).toLocaleString())

  // executeJavascript() 注入脚本
  const res = await win?.webContents.executeJavaScript('document.querySelector("img").src')
  console.log('res: ', res);
})
```

脚本中代码量偏多的时候可以采用立即执行函数，如果非常多还是建议采用 preload 注入。

```js
win.webContents.on('did-finish-load', async () => {
  win?.webContents.send('main-process-message', (new Date).toLocaleString())

  // executeJavascript() 注入脚本
  const res = await win?.webContents.executeJavaScript(`(() => {
      return document.querySelector("img").src
    })()`)
  console.log('res: ', res);
})
```

#### 3. 通过 insertCSS 注入 CSS 样式

```js
const key = await win.webContents.insertCSS('html, body { background-color: #f00 !important; }')
```

该方法返回一个 Promise 对象，返回的 key 可以用来删除注入的样式

```js
await win.webContents.removeInsertedCSS(key)
```

#### 禁用窗口的 beforeunload 事件

通过 beforeunload 事件来增加用户确认窗口是否关闭，当用户关闭窗口时浏览器会给出警告提示。如果用 Electron 加载了一个注册了 beforeunload 事件的第三方网页，这个时候就会发现这个窗口无法关闭，而且不会收到任何提示。

第一种解决方案可以通过注入一段脚本将 window.onbeforeunload 设置为 null

```js
await win.webContents.executeJavaScript('window.onbeforeunload = null')
```

这种方案在大多数情况下是可行的，但并不是完美的解决方案，由于无法获悉第三方网页在何时注册 onbeforeunload 事件，因此有可能取消其 onbeforeunload 事件时它还未被注册。

**最优雅的解决方案**是监听 webContents 的 will-prevent-unload 事件，通过 event.preventDefault() 来取消该事件，这样就可以自由地关闭窗口了。

```js
win.webContents.on('will-prevent-unload', event => {
  event.preventDefault()
})
```

### 使用动画时尽量从 CSS Animations 转换为 Web Animations

### 数据相关

#### 用户数据目录

操作系统为应用程序提供了一个专有目录来存放应用程序的用户个性化数据: 

```js
windows: C:\Users\[your user name]\AppData\Roaming
mac: /Users/[your user name]/Library/Application Support/
linux: /home/[your user name]/.config/xiangxuema
```

开发者应该把用户的个性化数据存放在上述这些目录中。

可以通过 `app.getPath('userData')` 获取上述上述目录，该方法会先判断当前应用运行在什么操作系统上，然后根据操作系统返回具体的路径地址。

> 给 app.getPath 方法传入不同的参数，可以获取不同用途的路径。用户根目录对应的参数为 home。desktop、documents、downloads、pictures、music、video 都可以作为参数传入，获取用户根目录下相应的文件夹。还有一些特殊的路径: 
>
> - temp 对应系统临时文件夹路径。
>
> - exe 对应当前执行程序的路径。
>
> - appData 对应应用程序用户个性化数据的目录。
>
> - userData 是 appData 路径后再加上应用名的路径，是 appData 的子路径。
>
>   这里的应用名指的是 package.json 中的 name 字段值。
>
> 所以，如果开发的是一个音乐应用，那么保存音乐文件的时候，可能并不会首选 userData 对应的路径，而是选择 music 对应的路径。
>
> 除此之外，还可以使用 node 的能力获取系统默认路径，比如: 
>
> - `require('os').homedir()` 返回当前用户的主目录，如: 'C:\Users\allen'
> - `require(os).tmpdir()` 返回默认临时文件目录，如: 'C\Users\allen\AppData\Local\Temp'

当需要用户设置自己的数据保存在什么目录时，可以通过 `app.setPath('appData')` 来重置用户数据目录。

> app.setPath 方法接收两个参数，第一个是要重置的路径的名称，第二个是具体的路径。

然后通过 `app.getPath('appData')` 就可以获取到新的路径。

#### !!! 因为 js 是单线程执行，读写大文件时应考虑使用异步方法实现，获将读写工作交由 node 的 worker_threads 完成。

### 读写受限访问的 cookie

通过 document.cookie 是无法读写 HttpObly 标记的 cookie 和其他域下的 cookie。

Electron 提供了专门用来读取 cookie 的 api，可以读取受限访问的 cookie: 

```js
await session.defaultSession.cookies.get({name})
await session.defaultSession.cookies.set({name})
```

session 是 Electron 用来管理浏览器会话、Cookie、缓存和代理的工具对象，defaultSession 是当前浏览器会话对象的实例。还可以通过 `win.webContents.session` 获取当前页面的 session 实例。

`session.defaultSession.cookies` 的 `set` 方法接收一个 Cookie 对象，其中包含了 HttpOnly 和 secure 等其他常见属性。也就是说可以在 Electron 中用 js 代码为浏览器设置 HttpOnly 的 cookie。通常情况下这类 Cookie 是在服务器端设置的，虽然它被保存在浏览器客户端，但是 js 不具有读写这类 cookie 的能力。

#### 清空浏览器缓存

比如希望重置所有与自己相关的数据时，这些数据可能保存在 cookie 中，也可能保存在 IndexedDB 中。开发者可以手动一个一个清楚，但是 Electron 提供了更简单的方式: 

```js
await session.defaultSession.clearStorageData({
  storages: 'cookies,localstorage'
})
```

它接收一个 options 对象，该对象的 storages 属性可以设置一下值的任意一个或多个（多个值用英文逗号分隔）：appcache、cookies、filesystem、indexdb、localstorage、shadercache、websql、serviceworkers、cachestorage。它能控制几乎所有浏览器相关的缓存。另外还可以为 options 对象设置配额和 origin 属性来更精细地控制清理的条件。

#### 使用 SQLite 持久化数据

> 之前 node 版本需要本地编译再安装 sqlite，最新版的 node 不需要了，直接[按照 sqlite 官网](https://www.npmjs.com/package/sqlite3)安装就可以

一般情况下，为 Election 安装一个第三方库，与为 node 工程安装第三方库并没有太大区别，但这仅限于只有 js 语言开发的库。如果第三方库是使用 C/C++ 开发的，那么在安装这个库的时候就需要**本地编译安装**。

SQLite3 是基于 C 语言开发的，node-sqlite3（SQLite3 提供给 node 的绑定）也大量使用了 C 语言，因此并不能简单的使用 yarn add 来安装，需要使用如下命令安装: 

```js
npm install sqlite3 --build-from-source --runtime=electron --target=24.6.4 --dist-url=https://atom.io/download/electron
```

> 需要注意!!!: --target=24.6.4 是指 Electron 版本号，可以通过 process.versions.electron 来查看当前正在使用的 electron 版本号。

node-sqlite3 只是对 SQLite3 做了简单封装，为了完成数据的 CRUD 操作还需要编写传统的 SQL 语句，推荐使用 knexjs 库作为对 node-sqlite3 的再次包装，完成业务数据访问读写工作。knexjs 是一个 SQL 指令构建器，开发者可以使用它编写串行化的数据访问代码，他会把开发者编写的代码转换为 SQL 语句，再交由数据库执行处理。数据库返回的数据，它也会格式化成 JSON 对象。knexjs 也是业内执行的数据库访问工具。

```js
// 创建数据访问对象
let knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: yourSqliteDbFilePath }
})

// CRUD 操作
// 查找
let result = await knex('admins').where({id: 0})
// 排序
let result = await knex('users').orderBy('name', 'desc')
// 更新
await knex('admins').where('id', 0).update({ password: 'test' })
// 删除
await knex('addresses').whereIn('id', [0, 1, 2]).del()
```

客户端 GUI 工具可以使用:  SQLiteStudio。

### 解析 jsx 或 tsx

[vite 官方提供了解决方案](https://cn.vitejs.dev/guide/features.html#jsx) :  [@vitejs/plugin-vue-jsx](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue-jsx) 插件。

```js
// vite.config.ts
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vueJsx()
  ]
})
```

