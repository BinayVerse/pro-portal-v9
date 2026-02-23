<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
      <div>
        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
          Applications
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          Manage and configure third-party application integrations
        </p>
      </div>
      <UButton
        @click="openAddApplicationModal"
        icon="heroicons:plus"
        color="primary"
        class="w-full sm:w-auto flex-shrink-0"
      >
        Add Application
      </UButton>
    </div>

    <!-- Tabs for filtering -->
    <div class="flex gap-2 border-b border-dark-700 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectedTab = tab.value"
        :class="[
          'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
          selectedTab === tab.value
            ? 'text-primary-400 border-b-2 border-primary-400'
            : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Applications List -->
    <div v-if="filteredApplications.length > 0" class="space-y-3" @click="activeConnectionMenu = null; activeAppStatusMenu = null">
      <div
        v-for="app in filteredApplications"
        :key="app.id"
        class="bg-dark-800 border border-dark-700 rounded-lg hover:border-dark-600 transition-colors"
      >
        <!-- Application Title Bar -->
        <div class="px-4 sm:px-6 py-4 flex items-center justify-between bg-dark-800 hover:bg-dark-700/30 transition-colors overflow-visible">
          <!-- Left: Icon + Name -->
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Application Icon -->
            <div
              class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
              :class="getIconBackground(app)"
            >
              <AppTooltip :text="app.provider || app.name">
                <UIcon :name="getAppIcon(app)" class="w-6 h-6 text-white" />
              </AppTooltip>
            </div>

            <!-- Application Name + Details -->
            <div class="min-w-0 flex-1">
              <h3 class="text-base sm:text-lg font-semibold text-white break-words">
                {{ app.name }}
              </h3>
              <div class="flex flex-wrap gap-2 items-center text-xs sm:text-sm text-gray-400 mt-1">
                <span v-if="app.module">{{ app.module }}</span>
                <span v-if="app.provider" class="hidden sm:inline">•</span>
                <span v-if="app.provider" class="hidden sm:inline text-gray-500">{{ app.provider }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Status Badge + Actions -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <!-- Status Badge -->
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap',
                app.status === 'Active'
                  ? 'bg-green-500/20 text-green-400'
                  : app.status === 'Inactive'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              ]"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="
                  app.status === 'Active'
                    ? 'bg-green-400'
                    : app.status === 'Inactive'
                    ? 'bg-gray-400'
                    : 'bg-yellow-400'
                "
              />
              {{ app.status }}
            </span>

            <!-- Status Change Dropdown -->
            <div class="relative" @click.stop>
              <AppTooltip text="Change status">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="heroicons:cog-6-tooth"
                  size="sm"
                  data-menu-trigger
                  @click.stop="toggleAppStatusMenu(app.id)"
                />
              </AppTooltip>
              <div
                v-if="activeAppStatusMenu === app.id"
                class="absolute right-0 mt-1 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-50 top-full"
                data-menu-dropdown
                @click.stop
              >
                <button
                  @click="() => { updateStatus(app.id, 'Active'); activeAppStatusMenu = null }"
                  :class="[
                    'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                    app.status === 'Active' ? 'text-primary-400' : 'text-gray-300'
                  ]"
                >
                  <UIcon name="heroicons:check-circle" class="w-4 h-4" />
                  Active
                </button>
                <button
                  @click="() => { updateStatus(app.id, 'Inactive'); activeAppStatusMenu = null }"
                  :class="[
                    'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                    app.status === 'Inactive' ? 'text-primary-400' : 'text-gray-300'
                  ]"
                >
                  <UIcon name="heroicons:minus-circle" class="w-4 h-4" />
                  Inactive
                </button>
                <button
                  @click="() => { updateStatus(app.id, 'Pending'); activeAppStatusMenu = null }"
                  :class="[
                    'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                    app.status === 'Pending' ? 'text-primary-400' : 'text-gray-300'
                  ]"
                >
                  <UIcon name="heroicons:clock" class="w-4 h-4" />
                  Pending
                </button>
              </div>
            </div>

            <!-- Eye Icon Toggle -->
            <AppTooltip :text="expandedRows.includes(app.id) ? 'Collapse details' : 'Expand details'">
              <UButton
                @click="toggleExpandedRow(app.id)"
                variant="ghost"
                :color="expandedRows.includes(app.id) ? 'primary' : 'gray'"
                :icon="expandedRows.includes(app.id) ? 'heroicons:eye-slash' : 'heroicons:eye'"
                size="sm"
              />
            </AppTooltip>

            <!-- Delete Icon -->
            <AppTooltip text="Delete application">
              <UButton
                @click="deleteApplication(app.id)"
                variant="ghost"
                color="red"
                icon="heroicons:trash-20-solid"
                size="sm"
              />
            </AppTooltip>
          </div>
        </div>

        <!-- Expanded Details -->
        <div
          v-if="expandedRows.includes(app.id)"
          class="border-t border-dark-700 bg-dark-900/50 px-4 sm:px-6 py-4 space-y-4 overflow-hidden"
        >
          <!-- Credentials Section -->
          <div v-if="app.client_id || app.client_secret || app.api_key || app.redirect_uri" class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <UIcon name="heroicons:key" class="w-4 h-4" />
              Credentials
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
              <div v-if="app.client_id" class="space-y-1">
                <p class="text-xs text-gray-500 font-medium">Client ID</p>
                <p class="text-sm text-gray-300 font-mono break-all">{{ maskSensitiveData(app.client_id) }}</p>
              </div>
              <div v-if="app.client_secret" class="space-y-1">
                <p class="text-xs text-gray-500 font-medium">Client Secret</p>
                <p class="text-sm text-gray-300 font-mono">••••••••••••••••</p>
              </div>
              <div v-if="app.api_key" class="space-y-1">
                <p class="text-xs text-gray-500 font-medium">API Key</p>
                <p class="text-sm text-gray-300 font-mono">••••••••••••••••</p>
              </div>
              <div v-if="app.redirect_uri" class="space-y-1">
                <p class="text-xs text-gray-500 font-medium">Redirect URI</p>
                <p class="text-sm text-gray-300 font-mono break-all">{{ app.redirect_uri }}</p>
              </div>
            </div>
          </div>

          <!-- Connections Section -->
          <div v-if="app.connections && app.connections.length > 0 || expandedRows.includes(app.id)" class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <UIcon name="heroicons:link" class="w-4 h-4" />
                {{ app.connections?.length || 0 }} Connection{{ (app.connections?.length || 0) !== 1 ? 's' : '' }}
              </h4>
              <UButton
                variant="ghost"
                color="gray"
                icon="heroicons:plus"
                size="xs"
                @click="openAddConnectionModal(app.id)"
              >
                Add Connection
              </UButton>
            </div>

            <div v-if="app.connections && app.connections.length > 0" class="space-y-3 pl-6">
              <div
                v-for="connection in app.connections"
                :key="connection.id"
                class="border border-dark-700 rounded-lg overflow-hidden bg-dark-800"
              >
                <!-- Connection Header Row -->
                <div class="px-4 py-3 flex items-center justify-between bg-dark-800 hover:bg-dark-700/30 transition-colors" @click="activeConnectionMenu = null">
                  <!-- Connection Name -->
                  <h5 class="text-sm font-medium text-white flex-1">
                    {{ connection.name }}
                  </h5>

                  <!-- Right: Status + Actions -->
                  <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                    <!-- Status Badge -->
                    <span
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium whitespace-nowrap',
                        connection.status === 'Active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      ]"
                    >
                      {{ connection.status }}
                    </span>

                    <!-- Status Dropdown -->
                    <div class="relative" @click.stop>
                      <AppTooltip text="Change connection status">
                        <UButton
                          color="gray"
                          variant="ghost"
                          icon="heroicons:cog-6-tooth"
                          size="sm"
                          data-menu-trigger
                          @click.stop="toggleConnectionStatusMenu(connection.id)"
                        />
                      </AppTooltip>
                      <div
                        v-if="activeConnectionMenu === connection.id"
                        class="absolute right-0 mt-1 w-48 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-1 z-50 top-full"
                        data-menu-dropdown
                        @click.stop
                      >
                        <button
                          @click="() => { updateConnectionStatus(app.id, connection.id, 'Active'); activeConnectionMenu = null }"
                          :class="[
                            'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                            connection.status === 'Active' ? 'text-primary-400' : 'text-gray-300'
                          ]"
                        >
                          <UIcon name="heroicons:check-circle" class="w-4 h-4" />
                          Active
                        </button>
                        <button
                          @click="() => { updateConnectionStatus(app.id, connection.id, 'Inactive'); activeConnectionMenu = null }"
                          :class="[
                            'w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-dark-700 transition-colors',
                            connection.status === 'Inactive' ? 'text-primary-400' : 'text-gray-300'
                          ]"
                        >
                          <UIcon name="heroicons:minus-circle" class="w-4 h-4" />
                          Inactive
                        </button>
                      </div>
                    </div>

                    <!-- Edit Icon -->
                    <AppTooltip text="Edit connection">
                      <UButton
                        variant="ghost"
                        color="gray"
                        icon="heroicons:pencil"
                        size="sm"
                        @click="editConnection(app.id, connection)"
                      />
                    </AppTooltip>

                    <!-- Delete Icon -->
                    <AppTooltip text="Delete connection">
                      <UButton
                        variant="ghost"
                        color="red"
                        icon="heroicons:trash-20-solid"
                        size="sm"
                        @click="deleteConnection(app.id, connection.id)"
                      />
                    </AppTooltip>
                  </div>
                </div>

                <!-- Connection Details -->
                <div v-if="connection.details" class="border-t border-dark-700 px-4 py-3 bg-dark-900/50 space-y-2">
                  <div class="text-xs text-gray-400 space-y-2">
                    <div v-if="connection.details.client_id" class="flex justify-between">
                      <span class="text-gray-500">Client ID:</span>
                      <span class="font-mono">{{ maskSensitiveData(connection.details.client_id) }}</span>
                    </div>
                    <div v-if="connection.details.redirect_url" class="flex justify-between">
                      <span class="text-gray-500">Redirect URL:</span>
                      <span class="font-mono break-all text-right ml-2">{{ connection.details.redirect_url }}</span>
                    </div>
                    <div v-if="connection.created_at" class="flex justify-between text-gray-500">
                      <span>Added:</span>
                      <span>{{ formatDate(connection.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No connections state -->
            <div v-else class="text-sm text-gray-400 pl-6 py-2">
              No connections yet. 
              <UButton
                variant="ghost"
                color="primary"
                size="xs"
                @click="openAddConnectionModal(app.id)"
                class="ml-1"
              >
                Add one now
              </UButton>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-12 px-4 bg-dark-800 rounded-lg border border-dark-700">
      <UIcon name="heroicons:briefcase" class="w-12 h-12 text-gray-500 mb-4" />
      <h3 class="text-lg font-semibold text-gray-300 mb-2">No applications yet</h3>
      <p class="text-sm text-gray-400 mb-4 text-center">
        Create your first application integration to get started
      </p>
      <UButton @click="openAddApplicationModal" icon="heroicons:plus">
        Add Application
      </UButton>
    </div>

    <!-- Add/Edit Application Modal -->
    <UModal v-model="showApplicationModal" size="lg">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">
            {{ editingAppId ? 'Edit Application' : 'Add New Application' }}
          </h2>
          <UButton
            color="gray"
            variant="ghost"
            icon="heroicons:x-mark"
            size="sm"
            @click="closeApplicationModal"
          />
        </div>
      </template>
      <div class="p-6 space-y-4">
        <!-- Select Agent -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Select Agent *</label>
          <USelect
            v-model="applicationForm.agent"
            :options="agents"
            placeholder="Select an agent"
            class="w-full"
          />
        </div>

        <!-- Select Module -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Select Module *</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="module in filteredModules"
              :key="module"
              @click="applicationForm.module = module"
              :class="[
                'p-3 rounded-lg border transition-all text-sm font-medium',
                applicationForm.module === module
                  ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                  : 'border-dark-700 bg-dark-900 text-gray-400 hover:border-dark-600'
              ]"
            >
              {{ module }}
            </button>
          </div>
        </div>

        <!-- Select Provider -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Select Provider *</label>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              v-for="provider in filteredProviders"
              :key="provider"
              @click="applicationForm.provider = provider"
              :class="[
                'p-3 rounded-lg border transition-all flex flex-col items-center justify-center',
                applicationForm.provider === provider
                  ? 'border-primary-500 bg-primary-500/20'
                  : 'border-dark-700 bg-dark-900 hover:border-dark-600'
              ]"
            >
              <UIcon :name="getProviderIcon(provider)" class="w-6 h-6 mb-1" />
              <span class="text-xs text-gray-300 text-center">{{ provider }}</span>
            </button>
          </div>
        </div>

        <!-- Application Name -->
        <div>
          <label class="block text-sm font-medium text-white mb-2">Application Name *</label>
          <UInput
            v-model="applicationForm.name"
            placeholder="e.g., Main Payroll"
            class="w-full"
          />
        </div>

        <!-- API Credentials -->
        <div class="space-y-4 p-4 bg-dark-900 rounded-lg border border-dark-700">
          <h3 class="text-sm font-semibold text-white">API Credentials</h3>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Client ID</label>
            <UInput
              v-model="applicationForm.client_id"
              placeholder="Enter client ID"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Client Secret</label>
            <UInput
              v-model="applicationForm.client_secret"
              type="password"
              placeholder="Enter client secret"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">API Key</label>
            <UInput
              v-model="applicationForm.api_key"
              type="password"
              placeholder="Enter API key"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-xs text-gray-400 mb-1">Login URL</label>
            <UInput
              v-model="applicationForm.login_url"
              placeholder="https://example.com/login"
              class="w-full"
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-2 justify-end pt-4 border-t border-dark-700">
          <UButton variant="outline" color="gray" @click="closeApplicationModal">
            Cancel
          </UButton>
          <UButton @click="saveApplication" :loading="isSavingApplication">
            {{ editingAppId ? 'Update' : 'Create' }} Application
          </UButton>
        </div>
      </div>
    </UModal>

    <!-- Add/Edit Connection Modal -->
    <UModal v-model="showConnectionModal" :title="editingConnectionId ? 'Edit Connection' : 'Add Connection'" size="md">
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-white mb-2">Connection Name *</label>
          <UInput
            v-model="connectionForm.name"
            placeholder="e.g., Main Payroll"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-white mb-2">Client ID</label>
          <UInput
            v-model="connectionForm.client_id"
            placeholder="Enter client ID"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-white mb-2">Redirect URL</label>
          <UInput
            v-model="connectionForm.redirect_url"
            placeholder="https://example.com/callback"
            class="w-full"
          />
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-2 justify-end pt-4 border-t border-dark-700">
          <UButton variant="outline" color="gray" @click="closeConnectionModal">
            Cancel
          </UButton>
          <UButton @click="saveConnection" :loading="isSavingConnection">
            {{ editingConnectionId ? 'Update' : 'Add' }} Connection
          </UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

useHead({
  title: 'Applications - Admin'
})

const router = useRouter()

// Form state
const showApplicationModal = ref(false)
const showConnectionModal = ref(false)
const isSavingApplication = ref(false)
const isSavingConnection = ref(false)
const selectedTab = ref('all')
const editingAppId = ref<string | null>(null)
const editingConnectionId = ref<string | null>(null)
const selectedAppIdForConnection = ref<string | null>(null)
const expandedRows = ref<string[]>([])
const activeConnectionMenu = ref<string | null>(null)
const activeAppStatusMenu = ref<string | null>(null)

// Form data
const applicationForm = ref({
  agent: '',
  module: '',
  provider: '',
  name: '',
  client_id: '',
  client_secret: '',
  api_key: '',
  login_url: ''
})

const connectionForm = ref({
  name: '',
  client_id: '',
  redirect_url: ''
})

// Mock data - replace with API calls
const applications = ref([
  {
    id: '1',
    name: 'Zoho HRMS Integration',
    module: 'Payroll',
    provider: 'Zoho',
    status: 'Active',
    client_id: 'abc123xyz',
    client_secret: 'secret123',
    api_key: null,
    login_url: 'https://zoho.com/login',
    connections: [
      {
        id: '1-1',
        name: 'Main Payroll',
        status: 'Active',
        created_at: '2024-01-15',
        details: {
          client_id: 'main_payroll_123',
          redirect_url: 'https://app.example.com/callback'
        }
      }
    ]
  },
  {
    id: '2',
    name: 'QuickBooks Integration',
    module: 'Finance',
    provider: 'QuickBooks',
    status: 'Inactive',
    client_id: 'qb_client_456',
    client_secret: 'qb_secret_456',
    api_key: null,
    login_url: 'https://quickbooks.com/login',
    connections: []
  },
  {
    id: '3',
    name: 'SAP Integration',
    module: 'Finance',
    provider: 'SAP',
    status: 'Pending',
    client_id: 'sap_client_789',
    client_secret: 'sap_secret_789',
    api_key: 'sap_key_789',
    login_url: 'https://sap.com/login',
    connections: []
  }
])

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'HRMS', value: 'hrms' },
  { label: 'Finance', value: 'finance' },
  { label: 'Legal', value: 'legal' }
]

const agents = [
  'HRMS',
  'Payroll',
  'Finance',
  'Legal',
  'Operations'
]

const modules = ['Payroll', 'Recruitment', 'Benefits', 'Performance']

const providers = ['Zoho', 'Keka', 'ADP', 'QuickBooks', 'Workday', 'SAP']

// Computed
const filteredApplications = computed(() => {
  if (selectedTab.value === 'all') {
    return applications.value
  }

  const moduleMap: Record<string, string> = {
    hrms: 'Payroll',
    finance: 'Finance',
    legal: 'Legal'
  }

  const module = moduleMap[selectedTab.value]
  return applications.value.filter(app => app.module === module)
})

// Filter modules based on selected agent
const filteredModules = computed(() => {
  const agentModuleMap: Record<string, string[]> = {
    'HRMS': ['Payroll', 'Recruitment', 'Benefits', 'Performance'],
    'Payroll': ['Payroll', 'Benefits'],
    'Finance': ['Payroll'],
    'Legal': ['Performance'],
    'Operations': ['Recruitment', 'Performance']
  }

  if (!applicationForm.value.agent) {
    return modules
  }

  return agentModuleMap[applicationForm.value.agent] || modules
})

// Filter providers based on selected agent
const filteredProviders = computed(() => {
  const agentProviderMap: Record<string, string[]> = {
    'HRMS': ['Zoho', 'Keka', 'Workday'],
    'Payroll': ['Zoho', 'ADP', 'Workday'],
    'Finance': ['QuickBooks', 'SAP', 'Workday'],
    'Legal': ['SAP'],
    'Operations': ['Zoho', 'Keka']
  }

  if (!applicationForm.value.agent) {
    return providers
  }

  return agentProviderMap[applicationForm.value.agent] || providers
})

// Functions
const toggleExpandedRow = (appId: string) => {
  const idx = expandedRows.value.indexOf(appId)
  if (idx >= 0) {
    expandedRows.value.splice(idx, 1)
  } else {
    expandedRows.value.push(appId)
  }
  // Close any open menus when toggling expanded row
  activeConnectionMenu.value = null
  activeAppStatusMenu.value = null
}

const getAppIcon = (app: any) => {
  const icons: Record<string, string> = {
    'Zoho': 'i-mdi:zoho',
    'Keka': 'heroicons:briefcase',
    'ADP': 'heroicons:briefcase',
    'QuickBooks': 'heroicons:calculator',
    'Workday': 'heroicons:briefcase',
    'SAP': 'heroicons:briefcase'
  }
  return icons[app.provider] || 'heroicons:briefcase'
}

const getIconBackground = (app: any) => {
  const colors: Record<string, string> = {
    'Zoho': 'bg-blue-500',
    'Keka': 'bg-purple-500',
    'ADP': 'bg-red-500',
    'QuickBooks': 'bg-green-500',
    'Workday': 'bg-orange-500',
    'SAP': 'bg-indigo-500'
  }
  return colors[app.provider] || 'bg-gray-500'
}

const getProviderIcon = (provider: string) => {
  const icons: Record<string, string> = {
    'Zoho': 'i-mdi:zoho',
    'Keka': 'heroicons:briefcase',
    'ADP': 'heroicons:briefcase',
    'QuickBooks': 'heroicons:calculator',
    'Workday': 'heroicons:briefcase',
    'SAP': 'heroicons:briefcase'
  }
  return icons[provider] || 'heroicons:briefcase'
}

const maskSensitiveData = (data: string) => {
  if (!data) return '••••••••'
  if (data.length <= 4) return '••••••••'
  return data.substring(0, 3) + '•••••••' + data.substring(data.length - 3)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const openAddApplicationModal = () => {
  editingAppId.value = null
  applicationForm.value = {
    agent: '',
    module: '',
    provider: '',
    name: '',
    client_id: '',
    client_secret: '',
    api_key: '',
    login_url: ''
  }
  showApplicationModal.value = true
}

const closeApplicationModal = () => {
  showApplicationModal.value = false
  editingAppId.value = null
}

const saveApplication = async () => {
  isSavingApplication.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    if (editingAppId.value) {
      // Update existing
      const idx = applications.value.findIndex(a => a.id === editingAppId.value)
      if (idx >= 0) {
        applications.value[idx] = {
          ...applications.value[idx],
          ...applicationForm.value,
          status: 'Pending'
        }
      }
    } else {
      // Create new
      applications.value.push({
        id: String(Date.now()),
        ...applicationForm.value,
        status: 'Pending',
        connections: []
      } as any)
    }

    closeApplicationModal()
  } finally {
    isSavingApplication.value = false
  }
}

const editApplication = (app: any) => {
  editingAppId.value = app.id
  applicationForm.value = { ...app }
  showApplicationModal.value = true
}

const deleteApplication = async (id: string) => {
  if (confirm('Are you sure you want to delete this application?')) {
    applications.value = applications.value.filter(a => a.id !== id)
  }
}

const openAddConnectionModal = (appId: string) => {
  editingConnectionId.value = null
  selectedAppIdForConnection.value = appId
  connectionForm.value = {
    name: '',
    client_id: '',
    redirect_url: ''
  }
  showConnectionModal.value = true
}

const closeConnectionModal = () => {
  showConnectionModal.value = false
  selectedAppIdForConnection.value = null
  editingConnectionId.value = null
}

const saveConnection = async () => {
  isSavingConnection.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))

    const app = applications.value.find(a => a.id === selectedAppIdForConnection.value)
    if (app) {
      if (!app.connections) app.connections = []

      if (editingConnectionId.value) {
        // Update existing connection
        const connIdx = app.connections.findIndex(c => c.id === editingConnectionId.value)
        if (connIdx >= 0) {
          app.connections[connIdx] = {
            ...app.connections[connIdx],
            ...connectionForm.value
          }
        }
      } else {
        // Create new connection
        app.connections.push({
          id: `${app.id}-${Date.now()}`,
          ...connectionForm.value,
          status: 'Active',
          created_at: new Date().toISOString().split('T')[0],
          details: {
            client_id: connectionForm.value.client_id,
            redirect_url: connectionForm.value.redirect_url
          }
        })
      }
    }

    closeConnectionModal()
  } finally {
    isSavingConnection.value = false
  }
}

const editConnection = (appId: string, connection: any) => {
  editingConnectionId.value = connection.id
  selectedAppIdForConnection.value = appId
  connectionForm.value = {
    name: connection.name,
    client_id: connection.details?.client_id || '',
    redirect_url: connection.details?.redirect_url || ''
  }
  showConnectionModal.value = true
}

const deleteConnection = (appId: string, connectionId: string) => {
  if (confirm('Are you sure you want to delete this connection?')) {
    const app = applications.value.find(a => a.id === appId)
    if (app) {
      app.connections = app.connections.filter(c => c.id !== connectionId)
    }
  }
}

const updateConnectionStatus = (appId: string, connectionId: string, status: string) => {
  const app = applications.value.find(a => a.id === appId)
  if (app) {
    const connection = app.connections.find(c => c.id === connectionId)
    if (connection) {
      connection.status = status
    }
  }
}

const updateStatus = (appId: string, status: string) => {
  const app = applications.value.find(a => a.id === appId)
  if (app) {
    app.status = status
  }
}

const toggleConnectionStatusMenu = (connectionId: string) => {
  activeConnectionMenu.value = activeConnectionMenu.value === connectionId ? null : connectionId
}

const toggleAppStatusMenu = (appId: string) => {
  activeAppStatusMenu.value = activeAppStatusMenu.value === appId ? null : appId
}

// Global click listener to close menus
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  // Check if click is on a menu trigger button
  const isOnMenuTrigger = target.closest('[data-menu-trigger]')

  // If not on trigger, close all menus
  if (!isOnMenuTrigger) {
    activeConnectionMenu.value = null
    activeAppStatusMenu.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
