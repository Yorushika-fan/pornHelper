<template>
  <div class="fixed top-16 right-4 flex flex-row space-x-2 z-10" v-if="getFlashVars() && !isDownloadingVideo">
    <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow" 
    @click="getVideoInfo"
    >
      下载视频
    </button>
    <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow"
     @click="downloadCover"
     >
      {{ isDownloadingCover ? '下载中...' : '下载封面' }}
    </button>
  </div>
  <el-dialog v-model="isDownloadingVideo" title="下载视频" width="400px">
    <!-- 加载效果 -->
    <el-skeleton :loading="videoList.length === 0" animated:true>
      <template #template>
        <div v-for="i in 4" :key="i" class="mb-4">
          <el-skeleton-item variant="button" style="width: 100%; height: 48px;" />
        </div>
      </template>
      
      <!-- 视频列表 -->
      <template #default>
        <div v-for="(video, index) in videoList" :key="index" class="mb-4 flex space-x-2" v-if="!isDownloading">
          <el-button 
            :class="[
              'flex-grow !py-3 !text-base !font-bold !rounded-lg !transition-colors',
              '!bg-[#ff9900] hover:!bg-[#ff6600] !text-black'
            ]"
            @click="downloadVideo(video)"
          >
           {{ video.quality + "p" }} 
          </el-button>
          <el-button
            :class="[
              '!py-3 !text-base !font-bold !rounded-lg !transition-colors',
              '!bg-gray-200 hover:!bg-gray-300 !text-gray-700'
            ]"
            @click="copyVideoLink(video.videoUrl)"
          >
            复制链接
          </el-button>
        </div>
      </template>
    </el-skeleton>

    <!-- 进度条 (保持不变) -->
    <el-progress
      v-if="isDownloading"
      :percentage="downloadProgress"
      status="success"
      :stroke-width="20"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { GM_download, GM_xmlhttpRequest, unsafeWindow } from '$';
import { useThrottleFn ,useClipboard} from '@vueuse/core'
import { ElButton, ElProgress, ElSkeleton, ElSkeletonItem, ElDialog, ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue';

const isDownloadingVideo = ref(false)
const isDownloadingCover = ref(false)
const downloadProgress = ref(0);
const isDownloading = ref(false);

interface video{
  videoUrl: string
  quality: string
}

onMounted(() => {
  console.log("脚本已加载")
  console.log(`
    ____                  _   _       _     
   |  _ \\ ___  _ __ _ __ | | | |_   _| |__  
   | |_) / _ \\| '__| '_ \\| |_| | | | | '_ \\ 
   |  __/ (_) | |  | | | |  _  | |_| | |_) |
   |_|   \\___/|_|  |_| |_|_| |_|\\__,_|_.__/ 
  `);
})
const videoList = ref<video[]>([])

const { copy } = useClipboard()

const getFlashVars = () => {
  const flashvarsRegex = /flashvars_\d+/;
  const flashvarsKey = Object.keys(unsafeWindow).find(key => flashvarsRegex.test(key));
  if (flashvarsKey) {
    return (unsafeWindow as unknown as Record<string, unknown>)[flashvarsKey];
  }
  return null;
};

const getVideoInfo = () => {
  videoList.value = []
  console.log(videoList.value);
  const flashvars = getFlashVars();
  if (flashvars) {
    const mediaDefinitions = (flashvars as any).mediaDefinitions;
    Object.values(mediaDefinitions).forEach((media:any) => {
      if (media.format === 'mp4') {
        GM_xmlhttpRequest({
          url: media.videoUrl,
          method: 'GET',
          responseType: 'json',
          onload: (response) => {
            response.response.forEach((res: any) => {
              videoList.value.push({
                videoUrl: res.videoUrl,
                quality: res.quality,
              })
            })
          },
          ontimeout: () => ElMessage.error('请求视频超时,请稍后再试'),
          onerror: () => ElMessage.error('请求视频失败,请稍后再试'),
  
        })
      }
    })
    isDownloadingVideo.value = true

  } else {
    ElMessage.error('没有找到flashvars');
  }
};

const downloadVideo = (video: video) => {  
  isDownloading.value = true;
  downloadProgress.value = 0;
  
  const xhr = new XMLHttpRequest();
  xhr.open('GET', video.videoUrl, true);
  xhr.responseType = 'blob';

  xhr.onprogress = (event) => {
    if (event.lengthComputable) {
      downloadProgress.value = (event.loaded / event.total) * 100;
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${video.quality}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      ElMessage.success(`${video.quality} 质量的视频下载成功`);
    } else {
      ElMessage.error(`${video.quality} 质量的视频下载失败`);
    }
    isDownloading.value = false;
  };

  xhr.onerror = () => {
    console.error('下载错误');
    ElMessage.error(`${video.quality} 质量的视频下载失败`);
    isDownloading.value = false;
  };

  xhr.send();
};

const downloadCover = useThrottleFn(() => {
  if (isDownloadingCover.value) return
  isDownloadingCover.value = true
  const flashvars = getFlashVars()
  if (flashvars) {
    const coverUrl = (flashvars as Record<string, unknown>).image_url as string
    GM_download({
      url: coverUrl,
      name: 'cover.jpg',
      onerror: () => ElMessage.error('封面下载失败'),
      ontimeout: () => ElMessage.error('封面下载超时'),
      onload: () => ElMessage.success('封面下载成功')
    })
  }
  setTimeout(() => {
    isDownloadingCover.value = false
  }, 2000)
}, 2000)

const copyVideoLink = (url: string) => {
  copy(url)
  ElMessage.success('下载链接已复制到剪贴板')
}

</script>