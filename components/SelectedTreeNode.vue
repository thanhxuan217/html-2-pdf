<template>
  <div class="border border-gray-200 rounded-lg">
    <!-- Node Item -->
    <div 
      class="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
    >
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Expand/Collapse Button -->
        <button
          v-if="props.node.children && props.node.children.length > 0"
          @click="handleExpand"
          class="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <ChevronDownIcon 
            v-if="props.node.isExpanded" 
            class="h-4 w-4 text-gray-600" 
          />
          <ChevronRightIcon 
            v-else 
            class="h-4 w-4 text-gray-600" 
          />
        </button>
        
        <!-- Spacer for nodes without children -->
        <div 
          v-else 
          class="w-6 flex-shrink-0"
        ></div>
        
        <!-- Node Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <!-- Level Indicator -->
            <div 
              v-if="props.node.level > 0"
              class="flex items-center gap-1"
            >
              <div 
                v-for="i in props.node.level" 
                :key="i"
                class="w-2 h-2 rounded-full bg-blue-300"
              ></div>
            </div>
            
            <!-- URL Title -->
            <h4 class="font-medium text-gray-900 truncate">
              {{ props.node.title }}
            </h4>
          </div>
          
          <!-- URL Link -->
          <a 
            :href="props.node.url" 
            target="_blank"
            class="text-sm text-blue-600 hover:text-blue-800 truncate block mt-1"
            :title="props.node.url"
          >
            {{ props.node.url }}
          </a>
          
          <!-- Metadata -->
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>
              <strong>Domain:</strong> {{ getDomain(props.node.url) }}
            </span>
            <span>
              <strong>Added:</strong> {{ formatDate(props.node.addedAt) }}
            </span>
            <span v-if="props.node.parentUrl">
              <strong>Parent:</strong> {{ getDomain(props.node.parentUrl) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-shrink-0 ml-3">
        <!-- Children Count Badge -->
        <span 
          v-if="props.node.children && props.node.children.length > 0"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ props.node.children.length }} sub-links
        </span>
        
        <!-- Remove Button -->
        <button
          @click="handleRemove"
          class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          :title="`Remove ${props.node.title}`"
        >
          <TrashIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
    
    <!-- Children Nodes -->
    <div 
      v-if="props.node.children && props.node.children.length > 0 && props.node.isExpanded" 
      class="border-t border-gray-200 bg-gray-50"
    >
      <div class="pl-4">
        <SelectedTreeNode
          v-for="child in props.node.children"
          :key="child.id"
          :node="child"
          @remove="$emit('remove', $event)"
          @expand="$emit('expand', $event)"
          class="border-b border-gray-200 last:border-b-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

// Define the SelectedTreeNode interface locally if needed
interface SelectedTreeNode {
  id: string
  url: string
  title: string
  addedAt: Date
  parentUrl?: string
  level: number
  children: SelectedTreeNode[]
  isExpanded: boolean
}

// Props
interface Props {
  node: SelectedTreeNode
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  remove: [id: string]
  expand: [id: string]
}>()

// Helper functions
const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch (e) {
    return 'Invalid URL'
  }
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const handleRemove = () => {
  // Emit remove event for this node
  emit('remove', props.node.id)
  
  // Also emit remove events for all children recursively
  const removeChildren = (node: SelectedTreeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        emit('remove', child.id)
        removeChildren(child)
      })
    }
  }
  
  removeChildren(props.node)
}

const handleExpand = () => {
  console.log('Expanding node:', props.node.id, 'Current state:', props.node.isExpanded)
  emit('expand', props.node.id)
}
</script>
