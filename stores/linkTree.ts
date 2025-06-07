import { defineStore } from 'pinia'

export const useLinkTreeStore = defineStore('linkTree', () => {
  // State
  const linkTree = ref([])
  const selectedLink = ref(null)
  const selectedLinks = ref<string[]>([])

  // Getters
  const selectedLinksCount = computed(() => selectedLinks.value.length)
  const hasSelectedLinks = computed(() => selectedLinks.value.length > 0)
  const isLinkSelected = computed(() => (linkId: any) => {
    return selectedLinks.value.some((link: any) => link.id === linkId)
  })

  // Actions
  const setLinkTree = (tree: any) => {
    linkTree.value = tree
  }

  const clearData = () => {
    linkTree.value = []
    selectedLink.value = null
  }

  const selectLink = (link: any) => {
    selectedLink.value = link
  }

  const toggleLinkSelection = (link: any) => {
    const index = selectedLinks.value.findIndex((item: any) => item.id === link.id)
    if (index === -1) {
      selectedLinks.value.push(link)
    } else {
      selectedLinks.value.splice(index, 1)
    }
  }

  const removeLinkSelection = (linkId: any) => {
    const index = selectedLinks.value.findIndex((item: any) => item.id === linkId)
    if (index !== -1) {
      selectedLinks.value.splice(index, 1)
    }
  }

  const clearSelectedLinks = () => {
    selectedLinks.value = []
  }

  const addLinkToSelection = (link: any) => {
    if (!isLinkSelected.value(link.id)) {
      selectedLinks.value.push(link)
    }
  }

  const exportSelectedLinks = () => {
    return selectedLinks.value.map((link: any) => ({
      id: link.id,
      url: link.url,
      title: link.title,
      description: link.description
    }))
  }

  // Persist state (optional)
  const saveToLocalStorage = () => {
    if (process.client) {
      localStorage.setItem('linkTree', JSON.stringify(linkTree.value))
      localStorage.setItem('selectedLinks', JSON.stringify(selectedLinks.value))
    }
  }

  const loadFromLocalStorage = () => {
    if (process.client) {
      const savedTree = localStorage.getItem('linkTree')
      const savedSelected = localStorage.getItem('selectedLinks')
      
      if (savedTree) {
        linkTree.value = JSON.parse(savedTree)
      }
      
      if (savedSelected) {
        selectedLinks.value = JSON.parse(savedSelected)
      }
    }
  }

  return {
    // State
    linkTree: readonly(linkTree),
    selectedLink: readonly(selectedLink),
    selectedLinks: readonly(selectedLinks),
    
    // Getters
    selectedLinksCount,
    hasSelectedLinks,
    isLinkSelected,
    
    // Actions
    setLinkTree,
    clearData,
    selectLink,
    toggleLinkSelection,
    removeLinkSelection,
    clearSelectedLinks,
    addLinkToSelection,
    exportSelectedLinks,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})
