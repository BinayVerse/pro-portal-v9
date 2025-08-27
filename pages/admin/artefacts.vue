<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-2">Artefact Management</h1>
        <p class="text-gray-400">
          Upload, organize, and manage artefacts for AI processing and chat capabilities.
        </p>
      </div>
      <div>
        <button
          @click="showUploadModal = true"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <UIcon name="heroicons:cloud-arrow-up" class="w-4 h-4" />
          <span>Upload Artefact</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Documents -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Artefacts</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalArtefacts }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:document-text" class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Processed -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Processed</p>
            <p class="text-3xl font-bold text-white mt-2">{{ processedArtefacts }}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:check-circle" class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <!-- Categories -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Categories</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalCategories }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:funnel" class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <!-- Total Size -->
      <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Size</p>
            <p class="text-3xl font-bold text-white mt-2">{{ totalSize }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="heroicons:circle-stack" class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UIcon name="heroicons:magnifying-glass" class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search artefacts..."
              class="block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <!-- Category Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedCategory"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Categories</option>
            <option value="HR Policy">HR Policy</option>
            <option value="Financial">Financial</option>
            <option value="Technical">Technical</option>
            <option value="Analytics">Analytics</option>
          </select>
        </div>

        <!-- Type Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedType"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Types</option>
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
            <option value="Markdown">Markdown</option>
            <option value="TXT">TXT</option>
            <option value="CSV">CSV</option>
            <option value="Image">Image</option>
            <option value="Database">Database</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div class="lg:w-48">
          <select
            v-model="selectedStatus"
            class="block w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">All Status</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Artefacts Table -->
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      <!-- Table Header -->
      <div class="px-6 py-4 border-b border-dark-700">
        <h2 class="text-lg font-semibold text-white">All Artefacts</h2>
        <p class="text-gray-400 text-sm">
          Manage your uploaded artefacts and view their processing status and AI-generated
          summaries.
        </p>
      </div>

      <!-- UTable -->
      <UTable
        :rows="filteredArtefacts"
        :columns="columns"
        :loading="false"
        :sort="{ column: 'lastUpdated', direction: 'desc' }"
        class="divide-y divide-dark-700"
        :ui="{
          wrapper: 'relative overflow-x-auto',
          base: 'min-w-full table-fixed',
          thead: 'bg-dark-900',
          tbody: 'bg-dark-800 divide-y divide-dark-700 [&>tr:hover]:bg-dark-700/50',
          tr: {
            base: '',
            selected: 'bg-dark-700/50',
            active: ''
          },
          th: {
            base: 'text-left rtl:text-right',
            padding: 'px-6 py-3',
            color: 'text-gray-400',
            font: 'font-medium text-xs',
            size: 'text-xs'
          },
          td: {
            base: 'whitespace-nowrap',
            padding: 'px-6 py-4',
            color: 'text-gray-300',
            font: '',
            size: 'text-sm'
          }
        }"
      >
        <!-- Artefact column with icon and description -->
        <template #artefact-data="{ row }">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <UIcon name="heroicons:document-text" class="w-5 h-5 text-blue-400" />
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-white">{{ row.name }}</div>
              <div class="text-sm text-gray-400">{{ row.description }}</div>
            </div>
          </div>
        </template>

        <!-- Category column with badge -->
        <template #category-data="{ row }">
          <span
            class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
            :class="getCategoryColor(row.category)"
          >
            {{ row.category }}
          </span>
        </template>

        <!-- Status column with badge and dot -->
        <template #status-data="{ row }">
          <span
            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
            :class="getStatusColor(row.status)"
          >
            <div
              class="w-1.5 h-1.5 rounded-full mr-1"
              :class="getStatusDotColor(row.status)"
            ></div>
            {{ row.status }}
          </span>
        </template>

        <!-- Summary column with button -->
        <template #summary-data="{ row }">
          <UButton
            @click="viewSummary(row)"
            variant="ghost"
            size="sm"
            icon="heroicons:document-magnifying-glass"
            color="blue"
            class="text-blue-400 hover:text-blue-300"
          >
            View Summary
          </UButton>
        </template>

        <!-- Actions column with action buttons -->
        <template #actions-data="{ row }">
          <div class="flex items-center space-x-2">
            <button
              @click="viewArtefact(row)"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <UIcon name="heroicons:eye" class="w-4 h-4" />
            </button>
            <button
              @click="downloadArtefact(row)"
              class="text-green-400 hover:text-green-300 transition-colors"
            >
              <UIcon name="heroicons:arrow-down-tray" class="w-4 h-4" />
            </button>
            <button
              @click="deleteArtefact(row)"
              class="text-red-400 hover:text-red-300 transition-colors"
            >
              <UIcon name="heroicons:trash" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Upload Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-dark-800 rounded-lg border border-dark-700 p-6 w-full max-w-md mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">Upload Artefact</h3>
          <button @click="showUploadModal = false" class="text-gray-400 hover:text-white">
            <UIcon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="uploadArtefact" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">File</label>
            <input
              type="file"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select
              v-model="newDocument.category"
              required
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="HR Policy">HR Policy</option>
              <option value="Financial">Financial</option>
              <option value="Technical">Technical</option>
              <option value="Analytics">Analytics</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              v-model="newDocument.description"
              rows="3"
              class="w-full px-3 py-2 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the artefact..."
            ></textarea>
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Upload
            </button>
            <button
              type="button"
              @click="showUploadModal = false"
              class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Summary Modal -->
    <UModal v-model="showSummaryModal" :ui="{ width: 'sm:max-w-2xl' }">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <UIcon name="heroicons:document-text" class="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-white">{{ selectedArtefact?.name }}</h3>
              <p class="text-sm text-gray-400">{{ selectedArtefact?.description }}</p>
            </div>
          </div>
          <UButton
            @click="showSummaryModal = false"
            variant="ghost"
            icon="heroicons:x-mark"
            color="gray"
            size="sm"
          />
        </div>

        <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Category:</span>
            <span class="ml-2 text-white">{{ selectedArtefact?.category }}</span>
          </div>
          <div>
            <span class="text-gray-400">Type:</span>
            <span class="ml-2 text-white">{{ selectedArtefact?.type }}</span>
          </div>
          <div>
            <span class="text-gray-400">Size:</span>
            <span class="ml-2 text-white">{{ selectedArtefact?.size }}</span>
          </div>
          <div>
            <span class="text-gray-400">Status:</span>
            <span
              class="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusColor(selectedArtefact?.status)"
            >
              <div
                class="w-1.5 h-1.5 rounded-full mr-1"
                :class="getStatusDotColor(selectedArtefact?.status)"
              ></div>
              {{ selectedArtefact?.status }}
            </span>
          </div>
        </div>

        <div class="border-t border-dark-700 pt-4">
          <h4 class="text-sm font-medium text-white mb-3">AI-Generated Summary</h4>
          <div class="bg-dark-700 rounded-lg p-4">
            <p class="text-gray-300 text-sm leading-relaxed">
              {{ selectedArtefact?.status === 'processed'
                ? `This ${selectedArtefact?.type} document contains comprehensive information about ${selectedArtefact?.category.toLowerCase()} matters. The AI analysis reveals key insights and important data points that can be leveraged for decision-making processes. Based on the document structure and content patterns, this artefact provides valuable resource material for organizational operations and strategic planning.`
                : 'Summary is not available yet. The document is still being processed by our AI system. Please check back once the processing is complete.'
              }}
            </p>
          </div>
        </div>

        <div class="flex justify-end mt-6 space-x-3">
          <UButton @click="showSummaryModal = false" variant="ghost" color="gray">
            Close
          </UButton>
          <UButton @click="downloadArtefact(selectedArtefact)" icon="heroicons:arrow-down-tray" color="primary">
            Download
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Using admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Reactive data
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const showUploadModal = ref(false)
const showSummaryModal = ref(false)
const selectedArtefact = ref(null)

const newArtefact = ref({
  category: '',
  description: '',
})

// Table columns configuration
const columns = [
  {
    key: 'artefact',
    label: 'Artefact',
    sortable: true,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
  },
  {
    key: 'size',
    label: 'Size',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
  },
  {
    key: 'uploadedBy',
    label: 'Uploaded By',
    sortable: true,
  },
  {
    key: 'lastUpdated',
    label: 'Last Updated',
    sortable: true,
  },
  {
    key: 'summary',
    label: 'Summary',
    sortable: false,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
  },
]

// Sample artefacts data
const artefacts = ref([
  {
    id: 1,
    name: 'Employee Handbook 2024.pdf',
    description: 'Comprehensive guide to company policies',
    category: 'HR Policy',
    type: 'PDF',
    size: '2.3 MB',
    status: 'processed',
    uploadedBy: 'Sarah Johnson',
    lastUpdated: '1/15/2024',
    artefact: 'Employee Handbook 2024.pdf',
  },
  {
    id: 2,
    name: 'Q4 Financial Report.docx',
    description: 'Quarterly financial reports including revenue, expenses',
    category: 'Financial',
    type: 'Word',
    size: '1.6 MB',
    status: 'processing',
    uploadedBy: 'Mike Chen',
    lastUpdated: '1/10/2024',
    artefact: 'Q4 Financial Report.docx',
  },
  {
    id: 3,
    name: 'Product Specifications.md',
    description: 'Detailed technical specifications for the new product',
    category: 'Technical',
    type: 'Markdown',
    size: '512.0 kB',
    status: 'processed',
    uploadedBy: 'Emily Davis',
    lastUpdated: '1/8/2024',
    artefact: 'Product Specifications.md',
  },
  {
    id: 4,
    name: 'Customer Data.csv',
    description: 'Customer demographics and behavior analysis data',
    category: 'Analytics',
    type: 'CSV',
    size: '3.1 MB',
    status: 'processed',
    uploadedBy: 'Alex Rodriguez',
    lastUpdated: '1/20/2024',
    artefact: 'Customer Data.csv',
  },
])

// Computed properties
const totalArtefacts = computed(() => artefacts.value.length)
const processedArtefacts = computed(
  () => artefacts.value.filter((doc) => doc.status === 'processed').length,
)
const totalCategories = computed(() => {
  const categories = new Set(artefacts.value.map((doc) => doc.category))
  return categories.size
})
const totalSize = computed(() => '7.8 MB') // This would be calculated from actual file sizes

const filteredArtefacts = computed(() => {
  return artefacts.value.filter((artefact) => {
    const matchesSearch =
      !searchQuery.value ||
      artefact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      artefact.description.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory = !selectedCategory.value || artefact.category === selectedCategory.value
    const matchesType = !selectedType.value || artefact.type === selectedType.value
    const matchesStatus = !selectedStatus.value || artefact.status === selectedStatus.value

    return matchesSearch && matchesCategory && matchesType && matchesStatus
  })
})

// Methods
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'HR Policy': 'bg-blue-500/20 text-blue-400',
    Financial: 'bg-green-500/20 text-green-400',
    Technical: 'bg-purple-500/20 text-purple-400',
    Analytics: 'bg-orange-500/20 text-orange-400',
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400'
}

const getStatusDotColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-400',
    processing: 'bg-yellow-400',
    failed: 'bg-red-400',
  }
  return colors[status] || 'bg-gray-400'
}

const viewArtefact = (artefact: any) => {
  console.log('View artefact:', artefact)
}

const downloadArtefact = (artefact: any) => {
  console.log('Download artefact:', artefact)
}

const deleteArtefact = (artefact: any) => {
  if (confirm(`Are you sure you want to delete ${artefact.name}?`)) {
    const index = artefacts.value.findIndex((d) => d.id === artefact.id)
    if (index > -1) {
      artefacts.value.splice(index, 1)
    }
  }
}

const viewSummary = (artefact: any) => {
  selectedArtefact.value = artefact
  showSummaryModal.value = true
}

const uploadArtefact = () => {
  console.log('Upload artefact:', newArtefact.value)
  showUploadModal.value = false

  // Reset form
  newArtefact.value = {
    category: '',
    description: '',
  }
}

useHead({
  title: 'Artefact Management - Admin Dashboard',
})
</script>
