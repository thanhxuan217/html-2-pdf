<template>
    <!-- Selected URLs Tree Panel -->
    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
        <div class="flex justify-between items-center mb-4">
            <div class="flex gap-2">
                <button
                    v-if="props.selectedUrlsTree.length > 0"
                    @click="showDownloadModal = true"
                    :disabled="downloadLoading"
                    class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                    {{ downloadLoading ? 'Downloading PDF...' : `Download ${urlCount} URLs as PDF` }}
                </button>
            </div>
        </div>
    </div>
    <!-- Download Confirmation Modal -->
    <div v-if="showDownloadModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white shadow-xl p-6 w-full h-full overflow-hidden flex flex-col" :class="isFullscreen ? 'rounded-none' : 'rounded-lg max-w-2xl mx-4 max-h-[80vh]'">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Confirm Download</h3>
                <div class="flex items-center gap-2">
                    <button 
                        @click="toggleFullscreen"
                        class="text-gray-400 hover:text-gray-600 p-1"
                        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
                    >
                        <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9l6 6m0-6l-6 6M21 3l-6 6m0 0V4m0 5h5M3 21l6-6m0 0v5m0-5H4"></path>
                        </svg>
                    </button>
                    <button 
                        @click="showDownloadModal = false"
                        class="text-gray-400 hover:text-gray-600"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <p class="text-gray-600 mb-4" v-if="!showResults">
                You are about to download {{ props.selectedUrlsTree.length }} URLs as PDF. Please review the selected items:
            </p>
            
            <!-- Download Results -->
            <div v-if="showResults" class="mb-4">
                <h4 class="text-lg font-medium mb-3">Download Results</h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    <div v-for="result in downloadResults" :key="result.id" class="flex items-center justify-between p-3 border rounded-lg">
                        <div class="flex-1">
                            <p class="font-medium text-sm truncate">{{ result.url }}</p>
                            <p v-if="result.error" class="text-red-600 text-xs mt-1">{{ result.error }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span v-if="result.status === 'pending'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                <svg class="animate-spin -ml-1 mr-1 h-3 w-3 text-yellow-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing
                            </span>
                            <span v-else-if="result.status === 'success'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                Success
                            </span>
                            <span v-else-if="result.status === 'failed'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                                Failed
                            </span>
                            <span v-else-if="result.status === 'warning'" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                                Warning
                            </span>
                            <button 
                                v-if="result.status === 'failed'"
                                @click="retryDownload(result.id)"
                                class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div class="flex justify-between text-sm">
                        <span>Total: {{ downloadResults.length }}</span>
                        <span class="text-green-600">Success: {{ downloadResults.filter(r => r.status === 'success').length }}</span>
                        <span class="text-red-600">Failed: {{ downloadResults.filter(r => r.status === 'failed').length }}</span>
                        <span class="text-yellow-600">Pending: {{ downloadResults.filter(r => r.status === 'pending').length }}</span>
                    </div>
                </div>
            </div>
            
            <!-- Selected URLs Tree in Modal -->
            <div v-if="!showResults" class="border rounded-lg p-4 mb-6 bg-gray-50 flex-1 overflow-y-auto" :class="isFullscreen ? 'min-h-0' : 'max-h-60'">
                <SelectedTreeNode
                    v-for="node in selectedUrlsTree"
                    :key="node.id"
                    :node="node"
                    @remove="removeFromSelected"
                    @expand="toggleSelectedExpand"
                />
            </div>
            
            <!-- Modal Actions -->
            <div class="flex justify-end gap-3">
                <button
                    @click="closeModal"
                    class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                    {{ showResults ? 'Close' : 'Cancel' }}
                </button>
                <button
                    v-if="!showResults"
                    @click="confirmDownload"
                    :disabled="downloadLoading"
                    class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                    {{ downloadLoading ? 'Processing...' : 'Confirm Download' }}
                </button>
                <button
                    v-if="showResults && downloadResults.some(r => r.status === 'failed')"
                    @click="retryAllFailed"
                    :disabled="downloadLoading"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                    {{ downloadLoading ? 'Retrying...' : 'Retry All Failed' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

import type { SelectedTreeNode } from '~/types'

interface Props {
  selectedUrlsTree: SelectedTreeNode[];
  urlCount: number;
}

const props = defineProps<Props>()
const downloadLoading = ref<boolean>(false);
const showDownloadModal = ref<boolean>(false);
const isFullscreen = ref<boolean>(true);
const downloadResults = ref<Array<{
  id: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  error?: string;
}>>([]);
const showResults = ref<boolean>(false);

// Emits
const emit = defineEmits<{
  removeFromSelected: [id: string]
  toggleSelectedExpand: [id: string]
}>()

const confirmDownload = async () => {
  try {
    downloadLoading.value = true;
    showResults.value = true;
    
    // Initialize download results
    downloadResults.value = getAllUrls(props.selectedUrlsTree).map(url => ({
      id: generateId(),
      url: url,
      status: 'pending' as const
    }));
    
    // Process each URL
    for (const result of downloadResults.value) {
      try {
        await downloadSingleUrl(result.url);
        result.status = 'success';
      } catch (error) {
        result.status = 'failed';
        result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      }
    }
    
  } catch (error) {
    console.error('Download process failed:', error);
  } finally {
    downloadLoading.value = false;
  }
}

const retryDownload = async (resultId: string) => {
  const result = downloadResults.value.find(r => r.id === resultId);
  if (!result) return;
  
  result.status = 'pending';
  result.error = undefined;
  
  try {
    await downloadSingleUrl(result.url);
    result.status = 'success';
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : 'Unknown error occurred';
  }
}

const retryAllFailed = async () => {
  downloadLoading.value = true;
  const failedResults = downloadResults.value.filter(r => r.status === 'failed');
  
  for (const result of failedResults) {
    result.status = 'pending';
    result.error = undefined;
    
    try {
      await downloadSingleUrl(result.url);
      result.status = 'success';
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error occurred';
    }
  }
  
  downloadLoading.value = false;
}

const closeModal = () => {
  showDownloadModal.value = false;
  isFullscreen.value = true;
  showResults.value = false;
  downloadResults.value = [];
}

const getAllUrls = (nodes: SelectedTreeNode[]): string[] => {
  const urls: string[] = [];
  
  const extractUrls = (node: SelectedTreeNode) => {
    if (node.url) {
      urls.push(node.url);
    }
    if (node.children) {
      node.children.forEach(extractUrls);
    }
  };
  
  nodes.forEach(extractUrls);
  return urls;
}

const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
}

const downloadSingleUrl = async (url: string): Promise<void> => {
  // Simulate API call với random success/failure
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        resolve();
      } else {
        const errors = [
          'Network timeout',
          'PDF generation failed',
          'Access denied',
          'Invalid URL format',
          'Server error 500',
          'Content not found'
        ];
        reject(new Error(errors[Math.floor(Math.random() * errors.length)]));
      }
    }, 1000 + Math.random() * 2000); // 1-3 seconds delay
  });
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
}

const removeFromSelected = (id: string) => {
    emit('removeFromSelected', id)
}

const toggleSelectedExpand = (id: string) => {
    emit('toggleSelectedExpand', id)
}
</script>
