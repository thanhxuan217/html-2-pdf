<template>
  <div class="tree-node">
    <div 
      :class="[
        'flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group',
        { 
          'bg-blue-50 border-l-4 border-blue-500 shadow-sm': isHighlighted,
          'bg-gray-50': node.isSelected && !isHighlighted
        }
      ]"
      @click="$emit('click', node)"
    >
      <!-- Expand/Collapse button -->
      <button
        v-if="hasChildren || canExpand"
        @click.stop="$emit('expand', node)"
        :disabled="node.isLoading"
        class="mr-3 p-1.5 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0 disabled:opacity-50"
        :title="node.isExpanded ? 'Collapse' : 'Expand'"
      >
        <div v-if="node.isLoading" class="w-4 h-4">
          <svg class="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <ChevronRightIcon 
          v-else
          :class="[
            'h-4 w-4 transition-transform duration-200 text-gray-600 group-hover:text-gray-800',
            { 'transform rotate-90': node.isExpanded }
          ]"
        />
      </button>
      <div v-else class="w-8 flex-shrink-0"></div>
      
      <!-- Selection checkbox -->
      <div class="mr-3 flex-shrink-0">
        <input
          type="checkbox"
          :checked="node.isSelected"
          @click.stop
          @change="$emit('select', node)"
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
        />
      </div>
      
      <!-- Node content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors">
              {{ node.label }}
            </div>
            <div class="text-sm text-gray-500 truncate mt-1">
              {{ node.url }}
            </div>
            <div v-if="node.depth !== undefined" class="flex items-center gap-2 mt-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Level {{ node.depth }}
              </span>
              <span v-if="hasChildren" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                {{ (node.children?.length || 0) }} links
              </span>
            </div>
          </div>
          
          <!-- Type indicator and external link icon -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <span 
              :class="[
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                getUrlType(node.url) === 'Internal' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              ]"
            >
              {{ getUrlType(node.url) }}
            </span>
            <ArrowTopRightOnSquareIcon 
              class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Children with animation -->
    <Transition name="tree-expand">
      <div v-if="node.isExpanded && node.children && node.children.length > 0" class="ml-8 mt-2 border-l-2 border-gray-100 pl-4">
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :selected-node-id="selectedNodeId"
          @click="$emit('click', $event)"
          @select="$emit('select', $event)"
          @expand="$emit('expand', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import type { UrlNode } from '~/types'

const props = defineProps<{
  node: UrlNode
  selectedNodeId?: string
}>()

defineEmits<{
  click: [node: UrlNode]
  select: [node: UrlNode]  
  expand: [node: UrlNode]
}>()

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

const canExpand = computed(() => {
  return !hasChildren.value && !props.node.isLoading
})

const isHighlighted = computed(() => {
  return props.selectedNodeId === props.node.id
})

const getUrlType = (url: string) => {
  try {
    const urlObj = new URL(url)
    // You might want to compare with the original URL's hostname
    // For now, we'll determine based on common patterns
    if (urlObj.pathname === '/' || urlObj.hostname.includes('localhost')) {
      return 'Internal'
    }
    return 'External'
  } catch {
    return 'Unknown'
  }
}
</script>

<style scoped>
.tree-expand-enter-active,
.tree-expand-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.tree-expand-enter-from,
.tree-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.tree-expand-enter-to,
.tree-expand-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 1000px;
}
</style>
