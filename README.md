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
