


<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">URL Tree Manager</h1>
      
      <!-- URL Input Section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Enter URL to Extract Links</h2>
        <div class="flex gap-4">
          <input
            v-model="inputUrl"
            type="url"
            placeholder="https://example.com"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @keyup.enter="extractUrls"
          />
          <button
            @click="extractUrls"
            :disabled="loading || !inputUrl"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Loading...' : 'Extract URLs' }}
          </button>
        </div>
        <div v-if="error" class="mt-2 text-red-600 text-sm">
          {{ error }}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- URL Tree Panel -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">URL Tree Structure</h2>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="selectAllState.checked"
                  :indeterminate="selectAllState.indeterminate"
                  @change="handleSelectAll"
                  class="rounded"
                />
                <span>{{ getSelectAllText() }}</span>
              </label>
              <span>{{ filteredUrlTree.length }} / {{ totalUrls }} URLs</span>
            </div>
          </div>
          
          <!-- Filter Section -->
          <div class="mb-6 space-y-3">
            <div class="flex gap-2">
              <input
                v-model="filterText"
                type="text"
                placeholder="Filter URLs by text or domain..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                @click="clearFilter"
                :disabled="!filterText && filterType === 'all'"
                class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Clear
              </button>
            </div>
            
            <!-- Filter Options -->
            <div class="flex flex-wrap gap-2">
              <select
                v-model="filterType"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All URLs</option>
                <option value="text">Filter by text</option>
                <option value="domain">Filter by domain</option>
                <option value="path">Filter by path</option>
              </select>
              
              <label class="flex items-center gap-1 text-sm">
                <input
                  v-model="showOnlySelected"
                  type="checkbox"
                  class="rounded"
                />
                Show only selected
              </label>
              
              <label class="flex items-center gap-1 text-sm">
                <input
                  v-model="caseSensitive"
                  type="checkbox"
                  class="rounded"
                />
                Case sensitive
              </label>
            </div>
            
            <!-- Quick Filters -->
            <div class="flex flex-wrap gap-1">
              <span class="text-xs text-gray-500">Quick filters:</span>
              <button
                v-for="domain in topDomains"
                :key="domain"
                @click="applyQuickFilter(domain)"
                class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
              >
                {{ domain }}
              </button>
            </div>
          </div>
          
          <div v-if="filteredUrlTree.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
            <TreeNode
              v-for="node in filteredUrlTree"
              :key="node.id"
              :node="node"
              :highlight="filterText"
              @click="handleNodeClick"
              @select="handleNodeSelect"
              @expand="handleNodeExpand"
            />
          </div>
          <div v-else-if="urlTree.length > 0" class="text-gray-500 text-center py-8">
            <p>No URLs match your filter criteria</p>
            <button
              @click="clearFilter"
              class="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          </div>
          <div v-else-if="!loading" class="text-gray-500 text-center py-8">
            Enter a URL above to see its link structure
          </div>
          <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Extracting URLs...</p>
          </div>
        </div>

        <!-- Review Panel -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">URL Preview</h2>
          <div v-if="selectedNode" class="space-y-4">
            <div>
              <h3 class="font-medium text-gray-900">{{ selectedNode.label }}</h3>
              <a 
                :href="selectedNode.url" 
                target="_blank"
                class="text-blue-600 hover:text-blue-800 text-sm break-all"
              >
                {{ selectedNode.url }}
              </a>
              
              <!-- Page Preview iframe -->
              <div class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                  <span class="text-xs font-medium text-gray-600">Page Preview</span>
                  <div class="flex gap-2">
                    <button
                      @click="refreshPreview"
                      class="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Refresh
                    </button>
                    <button
                      @click="togglePreview"
                      class="text-xs text-gray-600 hover:text-gray-800"
                    >
                      {{ showPreview ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                </div>
                <div v-if="showPreview" class="relative">
                  <iframe
                    :src="selectedNode.url"
                    class="w-full h-64 border-0"
                    :key="previewKey"
                    @load="onPreviewLoad"
                    @error="onPreviewError"
                  ></iframe>
                  <div 
                    v-if="previewLoading"
                    class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center"
                  >
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p class="text-xs text-gray-600">Loading preview...</p>
                    </div>
                  </div>
                  <div 
                    v-if="previewError"
                    class="absolute inset-0 bg-gray-50 flex items-center justify-center"
                  >
                    <div class="text-center text-gray-500">
                      <p class="text-sm">Preview not available</p>
                      <p class="text-xs mt-1">This page may not allow embedding</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-2 text-xs text-gray-500 space-y-1">
                <p><strong>Domain:</strong> {{ getDomain(selectedNode.url) }}</p>
                <p><strong>Path:</strong> {{ getPath(selectedNode.url) }}</p>
                <p v-if="selectedNode.parentUrl"><strong>Parent Page:</strong> {{ selectedNode.parentUrl }}</p>
              </div>
            </div>
            <button
              @click="addToSelected"
              :disabled="isAlreadySelected(selectedNode.id)"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isAlreadySelected(selectedNode.id) ? 'Already Selected' : 'Add to Download List' }}
            </button>
          </div>
          <div v-else class="text-gray-500 text-center py-8">
            Click on a URL to preview
          </div>
        </div>
      </div>

      <!-- Selected URLs Tree Panel -->
      <div class="bg-white rounded-lg shadow-md p-6 mt-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Selected URLs Tree Structure</h2>
          <div class="flex gap-2">
            <button
              v-if="selectedUrlsTree.length > 0"
              @click="expandAllSelected"
              class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              {{ allSelectedExpanded ? 'Collapse All' : 'Expand All' }}
            </button>
            <button
              v-if="selectedUrls.length > 0"
              @click="downloadAsPdf"
              :disabled="downloadLoading"
              class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {{ downloadLoading ? 'Generating PDF...' : `Download ${selectedUrls.length} URLs as PDF` }}
            </button>
          </div>
        </div>
        
        <div v-if="selectedUrlsTree.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
          <!-- <SelectedTreeNode
            v-for="node in selectedUrlsTree"
            :key="node.id"
            :node="node"
            @remove="removeFromSelected"
            @expand="toggleSelectedExpand"
          /> -->
          {{ selectedUrlsTree }}
        </div>
        <div v-else class="text-gray-500 text-center py-8">
          No URLs selected for download
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { UrlNode, SelectedUrl, SelectedTreeNode } from '~/types'

// Reactive data
const inputUrl = ref('')
const loading = ref(false)
const downloadLoading = ref(false)
const error = ref('')
const urlTree = ref<UrlNode[]>([])
const selectedNode = ref<UrlNode | null>(null)
const selectedUrls = ref<SelectedUrl[]>([])

// Filter states
const filterText = ref('')
const filterType = ref('all')
const showOnlySelected = ref(false)
const caseSensitive = ref(false)

// Preview states
const showPreview = ref(true)
const previewLoading = ref(false)
const previewError = ref(false)
const previewKey = ref(0)

// Selected tree states
const allSelectedExpanded = ref(false)

// Computed properties
const totalUrls = computed(() => {
  const countUrls = (nodes: UrlNode[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + (node.children ? countUrls(node.children) : 0)
    }, 0)
  }
  return countUrls(urlTree.value)
})

const topDomains = computed(() => {
  const domains = new Map<string, number>()
  
  const extractDomains = (nodes: UrlNode[]) => {
    nodes.forEach(node => {
      try {
        const domain = new URL(node.url).hostname
        domains.set(domain, (domains.get(domain) || 0) + 1)
        if (node.children) {
          extractDomains(node.children)
        }
      } catch (e) {
        // Invalid URL, skip
      }
    })
  }
  
  extractDomains(urlTree.value)
  
  return Array.from(domains.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain]) => domain)
})

const selectAllState = computed(() => {
  const allFilteredNodes = getAllFilteredNodes(filteredUrlTree.value)
  const selectedCount = allFilteredNodes.filter(node => node.isSelected).length
  const totalCount = allFilteredNodes.length
  
  if (totalCount === 0) {
    return { checked: false, indeterminate: false }
  }
  
  if (selectedCount === 0) {
    return { checked: false, indeterminate: false }
  } else if (selectedCount === totalCount) {
    return { checked: true, indeterminate: false }
  } else {
    return { checked: false, indeterminate: true }
  }
})

const filteredUrlTree = computed(() => {
  if (!filterText.value && filterType.value === 'all' && !showOnlySelected.value) {
    return urlTree.value
  }
  
  const filterNodes = (nodes: UrlNode[]): UrlNode[] => {
    return nodes.filter(node => {
      // Check if node matches filter criteria
      const matchesFilter = checkNodeFilter(node)
      
      // Check if any children match (recursive)
      const hasMatchingChildren = node.children && filterNodes(node.children).length > 0
      
      return matchesFilter || hasMatchingChildren
    }).map(node => ({
      ...node,
      children: node.children ? filterNodes(node.children) : []
    }))
  }
  
  return filterNodes(urlTree.value)
})

// Selected URLs Tree Structure
const selectedUrlsTree = computed(() => {
  const tree: SelectedTreeNode[] = []
  const nodeMap = new Map<string, SelectedTreeNode>()
  
  // Create nodes and build map
  selectedUrls.value.forEach(item => {
    const node: SelectedTreeNode = {
      ...item,
      children: [],
      isExpanded: false
    }
    nodeMap.set(item.id, node)
  })
  
  // Build tree structure
  selectedUrls.value.forEach(item => {
    const node = nodeMap.get(item.id)!
    
    if (item.parentUrl) {
      // Find parent node
      const parentNode = Array.from(nodeMap.values()).find(n => n.url === item.parentUrl)
      if (parentNode) {
        parentNode.children.push(node)
      } else {
        tree.push(node)
      }
    } else {
      tree.push(node)
    }
  })
  
  // Sort by level and added date
  const sortNodes = (nodes: SelectedTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level
      }
      return a.addedAt.getTime() - b.addedAt.getTime()
    })
    
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortNodes(node.children)
      }
    })
  }
  
  sortNodes(tree)
  return tree
})

// Helper functions
const getAllFilteredNodes = (nodes: UrlNode[]): UrlNode[] => {
  const result: UrlNode[] = []
  
  const traverse = (nodeList: UrlNode[]) => {
    nodeList.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  
  traverse(nodes)
  return result
}

const checkNodeFilter = (node: UrlNode): boolean => {
  // Check selected filter
  if (showOnlySelected.value && !node.isSelected) {
    return false
  }
  
  // If no text filter, return true (assuming other filters passed)
  if (!filterText.value) {
    return true
  }
  
  const searchText = caseSensitive.value ? filterText.value : filterText.value.toLowerCase()
  
  try {
    const url = new URL(node.url)
    const nodeText = caseSensitive.value ? node.label : node.label.toLowerCase()
    const nodeUrl = caseSensitive.value ? node.url : node.url.toLowerCase()
    const domain = caseSensitive.value ? url.hostname : url.hostname.toLowerCase()
    const path = caseSensitive.value ? url.pathname : url.pathname.toLowerCase()
    
    switch (filterType.value) {
      case 'text':
        return nodeText.includes(searchText)
      case 'domain':
        return domain.includes(searchText)
      case 'path':
        return path.includes(searchText)
      case 'all':
      default:
        return nodeText.includes(searchText) || nodeUrl.includes(searchText)
    }
  } catch (e) {
    // Invalid URL, fall back to text search
    const nodeText = caseSensitive.value ? node.label : node.label.toLowerCase()
    return nodeText.includes(searchText)
  }
}

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch (e) {
    return 'Invalid URL'
  }
}

const getPath = (url: string): string => {
  try {
    return new URL(url).pathname
  } catch (e) {
    return 'Invalid URL'
  }
}

const findNodeLevel = (nodeId: string, nodes: UrlNode[], level = 0): number => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return level
    }
    if (node.children) {
      const childLevel = findNodeLevel(nodeId, node.children, level + 1)
      if (childLevel !== -1) {
        return childLevel
      }
    }
  }
  return 0
}

const findParentUrl = (nodeId: string, nodes: UrlNode[], parentUrl?: string): string | undefined => {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return parentUrl
    }
    if (node.children) {
      const result = findParentUrl(nodeId, node.children, node.url)
      if (result !== undefined) {
        return result
      }
    }
  }
  return undefined
}

const clearFilter = () => {
  filterText.value = ''
  filterType.value = 'all'
  showOnlySelected.value = false
  caseSensitive.value = false
}

const applyQuickFilter = (domain: string) => {
  filterText.value = domain
  filterType.value = 'domain'
}

const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  const shouldSelect = target.checked
  
  const allFilteredNodes = getAllFilteredNodes(filteredUrlTree.value)
  
  // Update all filtered nodes
  allFilteredNodes.forEach(node => {
    const wasSelected = node.isSelected
    node.isSelected = shouldSelect
    
    // Add to or remove from selected list
    if (shouldSelect && !wasSelected) {
      // Add to selected list if not already there
      if (!isAlreadySelected(node.id)) {
        const level = findNodeLevel(node.id, urlTree.value)
        const parentUrl = findParentUrl(node.id, urlTree.value)
        
        const newItem: SelectedUrl = {
          id: node.id,
          url: node.url,
          title: node.label,
          addedAt: new Date(),
          parentUrl,
          level
        }
        selectedUrls.value.push(newItem)
      }
    } else if (!shouldSelect && wasSelected) {
      // Remove from selected list
      selectedUrls.value = selectedUrls.value.filter(item => item.id !== node.id)
    }
  })
  
  // Also update in original tree to maintain state
  const updateOriginalTree = (nodes: UrlNode[]) => {
    nodes.forEach(node => {
      const filteredNode = allFilteredNodes.find(fn => fn.id === node.id)
      if (filteredNode) {
        node.isSelected = shouldSelect
      }
      if (node.children) {
        updateOriginalTree(node.children)
      }
    })
  }
  
  updateOriginalTree(urlTree.value)
}

const getSelectAllText = () => {
  const state = selectAllState.value
  const allFilteredNodes = getAllFilteredNodes(filteredUrlTree.value)
  const selectedCount = allFilteredNodes.filter(node => node.isSelected).length
  const totalCount = allFilteredNodes.length
  
  if (totalCount === 0) {
    return 'Select All'
  }
  
  if (state.indeterminate) {
    return `${selectedCount}/${totalCount} selected`
  }
  
  return state.checked ? 'Deselect All' : 'Select All'
}

// Methods
const extractUrls = async () => {
  if (!inputUrl.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const data = await $fetch('/api/extract-urls', {
      method: 'POST',
      body: { url: inputUrl.value }
    })
    
    // Convert to tree structure
    urlTree.value = data.urls.map((item: any, index: number) => ({
      id: `url-${index}`,
      label: item.text || new URL(item.url).pathname,
      url: item.url,
      children: [],
      isSelected: false,
      isExpanded: false,
      parent: null,
      parentUrl: inputUrl.value,
      level: 0
    }))
    
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to extract URLs'
  } finally {
    loading.value = false
  }
}

const handleNodeClick = (node: UrlNode) => {
  selectedNode.value = node
  // Reset preview states when selecting new node
  previewLoading.value = true
  previewError.value = false
  previewKey.value++
}

const handleNodeSelect = (node: UrlNode) => {
  // Toggle selection
  node.isSelected = !node.isSelected
  
  // Add to or remove from selected list
  if (node.isSelected) {
    // Add to selected list if not already there
    if (!isAlreadySelected(node.id)) {
      const level = findNodeLevel(node.id, urlTree.value)
      const parentUrl = findParentUrl(node.id, urlTree.value)
      
      const newItem: SelectedUrl = {
        id: node.id,
        url: node.url,
        title: node.label,
        addedAt: new Date(),
        parentUrl,
        level
      }
      selectedUrls.value.push(newItem)
    }
  } else {
    // Remove from selected list
    selectedUrls.value = selectedUrls.value.filter(item => item.id !== node.id)
  }
}

const handleNodeExpand = async (node: UrlNode) => {
  if (node.children && node.children.length > 0) {
    node.isExpanded = !node.isExpanded
    return
  }
  
  // Load child URLs
  try {
    const data = await $fetch('/api/extract-urls', {
      method: 'POST',
      body: { url: node.url }
    })
    
    node.children = data.urls.map((item: any, index: number) => ({
      id: `${node.id}-child-${index}`,
      label: item.text || new URL(item.url).pathname,
      url: item.url,
      children: [],
      isSelected: false,
      isExpanded: false,
      parent: node.id,
      parentUrl: node.url,
      level: (node.level || 0) + 1
    }))
    
    node.isExpanded = true
  } catch (err) {
    console.error('Failed to load child URLs:', err)
  }
}

const addToSelected = () => {
  if (!selectedNode.value) return
  
  const level = findNodeLevel(selectedNode.value.id, urlTree.value)
  const parentUrl = findParentUrl(selectedNode.value.id, urlTree.value)
  
  const newItem: SelectedUrl = {
    id: selectedNode.value.id,
    url: selectedNode.value.url,
    title: selectedNode.value.label,
    addedAt: new Date(),
    parentUrl,
    level
  }
  
  selectedUrls.value.push(newItem)
  selectedNode.value.isSelected = true
}

const removeFromSelected = (id: string) => {
  selectedUrls.value = selectedUrls.value.filter(item => item.id !== id)
  
  // Also update the corresponding node in the tree
  const updateNodeSelection = (nodes: UrlNode[]) => {
    nodes.forEach(node => {
      if (node.id === id) {
        node.isSelected = false
      }
      if (node.children) {
        updateNodeSelection(node.children)
      }
    })
  }
  
  updateNodeSelection(urlTree.value)
}

const isAlreadySelected = (id: string) => {
  return selectedUrls.value.some(item => item.id === id)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const expandAllSelected = () => {
  allSelectedExpanded.value = !allSelectedExpanded.value
  
  const toggleExpansion = (nodes: SelectedTreeNode[]) => {
    nodes.forEach(node => {
      node.isExpanded = allSelectedExpanded.value
      if (node.children.length > 0) {
        toggleExpansion(node.children)
      }
    })
  }
  
  toggleExpansion(selectedUrlsTree.value)
}

const toggleSelectedExpand = (nodeId: string) => {
  const findAndToggle = (nodes: SelectedTreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        node.isExpanded = !node.isExpanded
        return true
      }
      if (node.children.length > 0 && findAndToggle(node.children)) {
        return true
      }
    }
    return false
  }
  
  findAndToggle(selectedUrlsTree.value)
}

const downloadAsPdf = async () => {
  
}
  // if (selectedUrls.value.length === 0) return
  
  // downloadLoading.value = true
  
 
  //   // Import jsPDF dynamically
  //   const { jsPDF } = await import('jspdf')
  //   const pdf = new jsPDF()
    
  //   // Add title
  //   pdf.setFontSize(20)
  //   pdf.text('Selected URLs Tree Report', 20, 30)
    
  //   // Add generated date
  //   pdf.setFontSize(12)
  //   pdf.text(`Generated: ${formatDate(new Date())}`, 20, 45)
    
  //   let yPosition = 65
    
  //   // Sort URLs by level and added date
  //   const sortedUrls = [...selectedUrls.value].sort((a, b) => {
  //     if (a.level !== b.level) {
  //       return a.level - b.level
  //     }
  //     return a.addedAt.getTime() - b.addedAt.getTime()
  //   })
    
  //   sortedUrls.forEach((item, index) => {
  //     if (yPosition > 250) {
  //       pdf.addPage()
  //       yPosition = 30
  //     }
      
  //     // Add indentation based on level
  //     const indent = 20 + (item.level * 10)
      
  //     // Add URL title with level indicator
  //     pdf.setFontSize(14)
  //     const levelPrefix = '  '.repeat(item.level) + (item.level > 0 ? '└─ ' : '')
  //     pdf.text(`${index + 1}. ${levelPrefix}${item.title}`, indent, yPosition)
  //     yPosition += 10
      
  //     // Add URL
  //     pdf.setFontSize(10)
  //     pdf.text(item.url, indent + 5, yPosition)
  //     yPosition += 8
      
  //     // Add parent URL if exists
  //   })
// Preview methods
const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const refreshPreview = () => {
  previewLoading.value = true
  previewError.value = false
  previewKey.value++
}

const onPreviewLoad = () => {
  previewLoading.value = false
  previewError.value = false
}

const onPreviewError = () => {
  previewLoading.value = false
  previewError.value = true
}
</script>