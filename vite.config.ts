import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';
import tailwindcss from 'tailwindcss';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';
export default defineConfig({
  plugins: [
    Vue(),
    tailwindcss(),
    // 添加 Components 插件配置
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // 添加 AutoImport 插件配置
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://pornhub.com/favicon.ico',
        namespace: 'npm/vite-plugin-monkey',
        match: ['*://*.pornhub.com/*'],
        author: 'Kin',
        description: '下载PornHub视频和封面',
        homepage: 'https://github.com/Yorushika-fan/pornHelper',
        license: 'MIT',
        version: '1.0.0',
        name: 'pornHelper',
      },

      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js')
            .concat('https://unpkg.com/vue-demi@latest/lib/index.iife.js')
            .concat(
              await util.fn2dataUrl(() => {
                (window as any).Vue = Vue;
              }),
            ),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js'),
        },
        externalResource: {
          'element-plus/dist/index.css': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.css'),
        },
        fileName: 'pornHelper.user.js',

      },
    }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          // 在这里添加 Tailwind CSS 配置
          content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
          corePlugins: {
            preflight: false, // 关闭 preflight
          },
        }),
      ],
    },
  },

});
