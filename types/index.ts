export interface UrlNode {
  id: string
  label: string
  url: string
  children?: UrlNode[]
  isSelected?: boolean
  isExpanded?: boolean
  parent?: string | null
  depth?: number
  isLoading?: boolean
  parentUrl?: string
  level?: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  count?: number
}

export interface ExtractUrlsResponse {
  urls: Array<{
    url: string
    text: string
    type?: 'internal' | 'external'
  }>
  count: number
}

export interface SelectedUrl {
  id: string
  url: string
  title: string
  addedAt: Date
  parentUrl?: string
  level: number
}

export interface SelectedTreeNode {
  id: string
  url: string
  title: string
  addedAt: Date
  parentUrl?: string
  level: number
  children: SelectedTreeNode[]
  isExpanded: boolean
}


// Thêm vào data() hoặc reactive state
interface ComponentData {
  showConfirmModal: boolean;
  downloadLoading: boolean;
  selectedUrls: string[];
  selectedUrlsTree: any[];
  allSelectedExpanded: boolean;
}
