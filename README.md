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
   
      
   
   
   
   

