# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## 问题
1. 执行 npm run dev 的时候是如何做到 vite 和 electron 一起启动的；执行 npm run build 的时候是如何做到 vite 和 electron 一起打包的。这两个问题应该可以在 vite-plugin-electron vite-plugin-electron-renderer 这两个插件中找到答案

2. electron-builder.json5 是配置 electron 的文件？哪里用到的？

## 使用electron-builder打包时下载electron失败解决方案
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