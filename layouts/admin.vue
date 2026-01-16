<template>
  <div class="h-screen bg-black flex overflow-hidden">
    <!-- Mobile menu overlay -->
    <div
      v-if="sidebarOpen && (isMobile || isTablet)"
      class="fixed inset-0 bg-black/50 z-30 md:hidden pointer-events-auto"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar (fixed on mobile, relative on desktop) -->
    <aside
      v-if="isClient"
      @click.stop
      class="fixed lg:fixed left-0 top-16 lg:top-0 h-[calc(100vh-4rem)] lg:h-screen w-64 bg-dark-900 border-r border-dark-700 flex flex-col z-40 transition-transform duration-300"
      :class="[
        'transition-transform duration-300',
        isMobile || isTablet
          ? sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          : 'translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div
        class="hidden lg:flex h-16 items-center border-b border-dark-700 flex-none shrink-0 px-4 sm:px-6"
      >
        <NuxtLink to="/" class="flex items-center space-x-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
            alt="Provento Logo"
            class="w-8 h-8"
          />
          <span class="text-white text-xl font-semibold">provento.ai</span>
        </NuxtLink>
      </div>

      <!-- Admin Navigation -->
      <nav class="flex-1 p-6 overflow-y-auto">
        <div class="space-y-2">
          <!-- Dashboard menu -->
          <!-- Show superadmin dashboard when user is superadmin AND no organization selected -->
          <template v-if="auth.user?.role_id === 0 && !showOrganizationMenusForSuperAdmin">
            <UButton
              :to="makeOrgLink('/admin/superadmin')"
              variant="ghost"
              justify="start"
              icon="heroicons:shield-check"
              :color="$route.name === 'admin-superadmin' ? 'primary' : 'gray'"
              class="w-full"
            >
              Dashboard
            </UButton>
          </template>

          <!-- Organization Admin menu -->
          <template v-if="showOrganizationMenusForSuperAdmin">
            <UButton
              :to="makeOrgLink('/admin/dashboard')"
              variant="ghost"
              justify="start"
              icon="heroicons:squares-2x2"
              :color="$route.name === 'admin-dashboard' ? 'primary' : 'gray'"
              class="w-full"
              :disabled="!isProfileComplete"
              :title="
                isClient && !isProfileComplete
                  ? 'Complete your profile to access this section'
                  : null
              "
            >
              Dashboard
            </UButton>

            <UButton
              :to="makeOrgLink('/admin/users')"
              variant="ghost"
              justify="start"
              icon="heroicons:users"
              :color="$route.name === 'admin-users' ? 'primary' : 'gray'"
              class="w-full"
              :disabled="!isProfileComplete"
              :title="
                isClient && !isProfileComplete
                  ? 'Complete your profile to access this section'
                  : null
              "
            >
              Users
            </UButton>

            <UButton
              :to="makeOrgLink('/admin/artefacts')"
              variant="ghost"
              justify="start"
              icon="heroicons:document-text"
              :color="$route.name === 'admin-artefacts' ? 'primary' : 'gray'"
              class="w-full"
              :disabled="!isProfileComplete"
              :title="
                isClient && !isProfileComplete
                  ? 'Complete your profile to access this section'
                  : null
              "
            >
              Artifacts
            </UButton>

            <UButton
              :to="makeOrgLink('/admin/analytics')"
              variant="ghost"
              justify="start"
              icon="heroicons:chart-bar"
              :color="$route.name === 'admin-analytics' ? 'primary' : 'gray'"
              class="w-full"
              :disabled="!isProfileComplete"
              :title="
                isClient && !isProfileComplete
                  ? 'Complete your profile to access this section'
                  : null
              "
            >
              Analytics
            </UButton>

            <UButton
              :to="makeOrgLink('/admin/plans')"
              variant="ghost"
              justify="start"
              icon="i-heroicons-currency-dollar"
              :color="$route.name === 'admin-plans' ? 'primary' : 'gray'"
              class="w-full"
              :disabled="!isProfileComplete"
              :title="
                isClient && !isProfileComplete
                  ? 'Complete your profile to access this section'
                  : null
              "
            >
              Plans
            </UButton>

            <!-- Integrations with submenu -->
            <div>
              <button
                @click="integrationsOpen = !integrationsOpen"
                class="w-full flex items-center justify-between space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors duration-200"
                :class="{
                  'bg-primary-500/20 text-primary-400': $route.path.includes('/admin/integrations'),
                  'opacity-50 cursor-not-allowed pointer-events-none': !isProfileComplete,
                }"
                :disabled="!isProfileComplete"
                :title="
                  isClient && !isProfileComplete
                    ? 'Complete your profile to access this section'
                    : null
                "
              >
                <div class="flex items-center space-x-3">
                  <UIcon name="heroicons:link" class="w-5 h-5" />
                  <span>Integrations</span>
                </div>
                <UIcon
                  name="heroicons:chevron-down"
                  class="w-4 h-4 transition-transform duration-200"
                  :class="{ 'rotate-180': integrationsOpen }"
                />
              </button>
              <div v-show="integrationsOpen" class="ml-8 mt-2 space-y-1">
                <UButton
                  :to="makeOrgLink('/admin/integrations')"
                  variant="ghost"
                  justify="start"
                  size="sm"
                  icon="heroicons:eye"
                  :color="$route.name === 'admin-integrations' ? 'primary' : 'gray'"
                  class="w-full"
                  :disabled="!isProfileComplete"
                  :title="
                    isClient && !isProfileComplete
                      ? 'Complete your profile to access this section'
                      : null
                  "
                >
                  Overview
                </UButton>
                <UButton
                  :to="makeOrgLink('/admin/integrations/slack')"
                  variant="ghost"
                  justify="start"
                  size="sm"
                  icon="i-mdi:slack"
                  :color="$route.name === 'admin-integrations-slack' ? 'primary' : 'gray'"
                  class="w-full"
                  :disabled="!isProfileComplete"
                  :title="
                    isClient && !isProfileComplete
                      ? 'Complete your profile to access this section'
                      : null
                  "
                >
                  Slack
                </UButton>
                <UButton
                  :to="makeOrgLink('/admin/integrations/teams')"
                  variant="ghost"
                  justify="start"
                  size="sm"
                  icon="i-mdi:microsoft-teams"
                  :color="$route.name === 'admin-integrations-teams' ? 'primary' : 'gray'"
                  class="w-full"
                  :disabled="!isProfileComplete"
                  :title="
                    isClient && !isProfileComplete
                      ? 'Complete your profile to access this section'
                      : null
                  "
                >
                  Teams
                </UButton>
                <UButton
                  :to="makeOrgLink('/admin/integrations/whatsapp')"
                  variant="ghost"
                  justify="start"
                  size="sm"
                  icon="i-mdi:whatsapp"
                  :color="$route.name === 'admin-integrations-whatsapp' ? 'primary' : 'gray'"
                  class="w-full"
                  :disabled="!isProfileComplete"
                  :title="
                    isClient && !isProfileComplete
                      ? 'Complete your profile to access this section'
                      : null
                  "
                >
                  WhatsApp
                </UButton>
                <UButton
                  :to="makeOrgLink('/admin/integrations/i-message')"
                  variant="ghost"
                  justify="start"
                  size="sm"
                  icon="i-heroicons:chat-bubble-left-ellipsis"
                  :color="$route.name === 'admin-integrations-i-message' ? 'primary' : 'gray'"
                  class="w-full"
                  :disabled="!isProfileComplete"
                  :title="
                    isClient && !isProfileComplete
                      ? 'Complete your profile to access this section'
                      : null
                  "
                >
                  iMessage
                </UButton>
              </div>
            </div>
          </template>
        </div>
      </nav>

      <!-- Admin Footer (Mobile Only) -->
      <div class="border-t border-dark-700 p-4 flex-none shrink-0 lg:hidden">
        <!-- Logo with text - Clickable -->
        <NuxtLink
          to="/"
          class="flex items-center space-x-2 mb-3 justify-center hover:opacity-80 transition-opacity"
          @click="sidebarOpen = false"
        >
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fb2a7382a9c9146babd538ccc60e9d0b5%2Fbddd43caf4614f99a3fbff498927abcc?format=webp&width=800"
            alt="Provento Logo"
            class="w-5 h-5"
          />
          <span class="text-gray-300 text-sm font-semibold">provento.ai</span>
        </NuxtLink>
        <!-- Copyright Text -->
        <div class="text-gray-500 text-xs text-center leading-tight">
          © 2026 provento.ai. All rights reserved.
        </div>
      </div>
    </aside>

    <!-- Main content area (offset for fixed sidebar) -->
    <div class="flex-1 flex flex-col min-h-0 w-full lg:ml-64 relative overflow-hidden">
      <!-- Top header (fixed height) -->
      <header
        class="sticky top-0 bg-dark-900 border-b border-dark-700 px-3 md:px-6 h-16 flex items-center z-30"
      >
        <div class="items-center w-full flex-1" style="padding-left: 0">
          <div class="flex items-center justify-between gap-2 md:gap-4 flex-1">
            <!-- Mobile menu toggle button -->
            <button
              v-if="isMobile || isTablet"
              @click="sidebarOpen = !sidebarOpen"
              class="lg:hidden text-gray-300 hover:text-white p-2 -ml-2 flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <UIcon
                :name="sidebarOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
                class="w-6 h-6"
              />
            </button>

            <div class="flex items-center flex-1 min-w-0">
              <!-- Desktop Breadcrumb Layout (superadmin) -->
              <template v-if="auth.user?.role_id === 0 && selectedOrgName">
                <nav aria-label="Breadcrumb" class="breadcrumb-container hidden md:block">
                  <ol class="flex items-center space-x-3 text-sm">
                    <li>
                      <button
                        @click="goBackToOrgs"
                        class="breadcrumb-back"
                        aria-label="Back to organizations"
                      >
                        <span class="inline-flex items-center gap-2">
                          <svg
                            class="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M15 18L9 12L15 6"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          <span>Back to Organizations</span>
                        </span>
                      </button>
                    </li>

                    <li class="flex items-center text-gray-500">
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 6L15 12L9 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </li>

                    <li>
                      <span class="engraved-org breadcrumb-title">{{ selectedOrgName }}</span>
                    </li>
                  </ol>
                </nav>

                <!-- Mobile Org Display (superadmin) -->
                <div class="md:hidden">
                  <button
                    @click="goBackToOrgs"
                    class="text-gray-400 hover:text-gray-300 transition-colors"
                    aria-label="Back to organizations"
                  >
                    <svg
                      class="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <div class="mt-0.5">
                    <div class="text-xs text-gray-500">Organization</div>
                    <div class="text-sm font-semibold text-white truncate">
                      {{ selectedOrgName }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- If superadmin and no org selected, show only the green role tag -->
              <template v-else-if="auth.user?.role_id === 0 && !selectedOrgName">
                <span class="org-role-tag inline-block">Super Admin</span>
              </template>

              <!-- For non-superadmin users show org/company name and plan (SaaS style) -->
              <template v-else>
                <!-- Desktop Layout -->
                <div class="hidden md:flex items-center space-x-3 flex-1">
                  <span class="engraved-org text-lg font-semibold truncate">{{
                    selectedOrgDisplay
                  }}</span>
                  <UBadge
                    v-if="profileStore.userProfile?.plan_name"
                    :color="isPlanExpired ? 'red' : 'green'"
                    :ui="{ rounded: 'rounded-full' }"
                    variant="subtle"
                    class="flex-shrink-0"
                    size="xs"
                    >{{ profileStore.userProfile?.plan_name }}</UBadge
                  >
                </div>

                <!-- Mobile Layout (SaaS style 2-line stack) -->
                <div class="md:hidden flex-1 min-w-0">
                  <div class="text-sm font-semibold text-white truncate">
                    {{ selectedOrgDisplay }}
                  </div>
                  <div v-if="profileStore.userProfile?.plan_name" class="text-xs mt-0.5">
                    <UBadge
                      :color="isPlanExpired ? 'red' : 'green'"
                      :ui="{ rounded: 'rounded-full' }"
                      variant="subtle"
                      size="xs"
                      >{{ profileStore.userProfile?.plan_name }}</UBadge
                    >
                  </div>
                </div>
              </template>
            </div>

            <UDropdown :items="profileItems" :popper="{ placement: 'bottom-end' }">
              <UButton variant="ghost" trailing-icon="heroicons:chevron-down">
                <UAvatar
                  src=""
                  :alt="profileStore.userProfile?.name?.toUpperCase()"
                  size="sm"
                  :ui="{ background: 'bg-primary-500' }"
                />
                <span class="hidden sm:block ml-2">{{
                  profileStore.userProfile?.name || profileStore.userProfile?.email || 'User'
                }}</span>
              </UButton>
            </UDropdown>
          </div>
        </div>
      </header>

      <!-- Mandatory profile completion banner -->
      <div v-if="!isProfileComplete && $route.path !== '/admin/profile'" class="px-6 pt-4">
        <UAlert
          icon="i-heroicons-exclamation-triangle"
          color="yellow"
          variant="subtle"
          title="Please complete your profile to access the application."
        >
          Please complete your profile to access the application.
        </UAlert>
      </div>

      <!-- Page content (scrollable) -->
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-black">
        <slot />
      </main>

      <ChatWidget v-if="auth && auth.isAuthenticated && auth.user?.role_id !== 0" />
    </div>

    <!-- Subscription Required Modal -->
    <SubscriptionRequiredModal
      :open="subscriptionCheck.shouldShowModal"
      @upgrade="handleUpgradeClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import ChatWidget from '~/components/chat/ChatWidget.vue'
import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'
import { useSuperAdminStore } from '~/stores/superadmin/index'
import { useSubscriptionCheck } from '~/composables/useSubscriptionCheck'
import SubscriptionRequiredModal from '~/components/ui/SubscriptionRequiredModal.vue'

const route = useRoute()
const integrationsOpen = ref(true)
const isClient = ref(false)
const sidebarOpen = ref(false)
const isMobile = ref(false)
const isTablet = ref(false)
const auth = useAuthStore()
const profileStore = useProfileStore()
const superAdminStore = useSuperAdminStore()
const subscriptionCheck = useSubscriptionCheck()

const isPlanExpired = computed(() => {
  const expiry = profileStore.userProfile?.plan_expiry
  if (!expiry) return false

  const expiryDate = new Date(expiry)
  if (Number.isNaN(expiryDate.getTime())) return false

  return expiryDate.getTime() < Date.now()
})

const checkAndShowSubscriptionModal = async () => {
  // Fetch org plan if user is authenticated
  if (auth.user) {
    try {
      // Get org ID from query params (for superadmin) or use default
      const orgId = (route.query?.org || route.query?.org_id) as string | undefined
      await subscriptionCheck.checkSubscription(orgId)

      // Check subscription status only for non-superadmin users on non-plans pages
      if (auth.user?.role_id !== 0 && route.name !== 'admin-plans') {
        if (!subscriptionCheck.hasPlan.value) {
          subscriptionCheck.showModal()
        } else {
          subscriptionCheck.closeModal()
        }
      } else {
        subscriptionCheck.closeModal()
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }
}

const checkScreen = () => {
  if (typeof window === 'undefined') return

  const width = window.innerWidth

  // Align with Tailwind breakpoints: lg breakpoint is at 1024px
  isMobile.value = width < 768
  isTablet.value = width >= 768 && width < 1024

  // Show sidebar from 1024px and above (matching Tailwind's lg: breakpoint)
  if (width >= 1024) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }
}

onMounted(async () => {
  isClient.value = true
  checkScreen()

  // Add resize listener for mobile detection
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreen)
  }

  await checkAndShowSubscriptionModal()
})

// Cleanup resize listener on unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreen)
  }
})

// Watch route changes to check subscription on every page navigation
watch(
  () => route.name,
  async () => {
    // Close sidebar on mobile when navigating
    if (isMobile.value || isTablet.value) {
      sidebarOpen.value = false
    }
    await checkAndShowSubscriptionModal()
  },
)

// Ensure profile/org data is loaded on client for header display
if (process.client) {
  void profileStore.fetchUserProfile().catch(() => {})
  // If superadmin and an org is selected via query, prefetch organizations list so we can show org name
  try {
    if (auth.user?.role_id === 0 && (route.query.org || route.query.org_id)) {
      void superAdminStore.fetchOrganizations().catch(() => {})
    }
  } catch (e) {}
}

const selectedOrgDisplay = computed(() => {
  // Backwards-compatible string for any places using this previously
  if (auth.user?.role_id === 0) {
    const q = route && route.query ? route.query.org || route.query.org_id : null
    if (q) {
      const id = String(q)
      const found = (superAdminStore.organizations || []).find((o: any) => String(o.org_id) === id)
      return found && found.org_name ? `${found.org_name} Super Admin` : 'Super Admin'
    }
    return 'Super Admin'
  }
  return profileStore.userProfile?.company || '...'
})

// Provide a computed just for the title (org name) to render separately
const selectedOrgName = computed(() => {
  // For superadmin, only show actual selected organization (from query/params or analytics route)
  if (auth.user?.role_id === 0) {
    const hasOrgInQuery = !!(route && route.query && (route.query.org || route.query.org_id))
    const hasOrgInParams = !!(route && route.params && (route.params.org || route.params.org_id))
    const onSuperadminAnalytics = route.path.includes('/admin/superadmin-analytics')
    if (hasOrgInQuery || hasOrgInParams || onSuperadminAnalytics) {
      const q =
        route && route.query
          ? route.query.org || route.query.org_id
          : route && route.params
            ? route.params.org || route.params.org_id
            : null
      if (q) {
        const id = String(q)
        const found = (superAdminStore.organizations || []).find(
          (o: any) => String(o.org_id) === id,
        )
        return found?.org_name || ''
      }
    }
    return ''
  }
  // For non-superadmin users, show company from profile
  return profileStore.userProfile?.company || ''
})

function goBackToOrgs() {
  try {
    // Navigate to the organizations list view for superadmins
    navigateTo('/admin/superadmin')
  } catch (e) {
    // ignore navigation errors
  }
}

// Ensure profile is loaded
if (process.client) {
  void profileStore.fetchUserProfile().catch(() => {})
}

const isProfileComplete = computed(() => {
  const up: any = profileStore.userProfile || {}
  return !!(up && up.name && up.contact_number && up.company)
})

// For superadmin users, only show organization admin menus when an organization is selected
const showOrganizationMenusForSuperAdmin = computed(() => {
  // Non-superadmin users always see organization menus
  if (auth.user?.role_id !== 0) return true
  // For superadmin, detect selected org via route query or params
  const hasOrgInQuery = !!(route && route.query && (route.query.org || route.query.org_id))
  const hasOrgInParams = !!(route && route.params && (route.params.org || route.params.org_id))
  // Also consider analytics page where org query is used
  const onSuperadminAnalytics = route.path.includes('/admin/superadmin-analytics')
  return hasOrgInQuery || hasOrgInParams || onSuperadminAnalytics
})

const getInitials = (name?: string, email?: string) => {
  if (!name && email) return (email[0] || '').toUpperCase()
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const profileItems = computed(() => {
  const first: any[] = []
  if (auth.user?.role_id !== 0) {
    first.push({
      label: 'My Account',
      icon: 'heroicons:user',
      click: () => navigateTo('/admin/profile'),
    })
  }
  first.push({
    label: 'Change Password',
    icon: 'heroicons:key',
    click: () => navigateTo('/change-password'),
  })

  const second = [
    {
      label: 'Logout',
      icon: 'heroicons:arrow-right-on-rectangle',
      click: async () => {
        try {
          await auth.signOut()
        } catch (e) {
          console.error('Logout failed from profile dropdown', e)
          // Fallback navigation
          navigateTo('/login')
        }
      },
    },
  ]

  return [first, second]
})

// Helper to construct route objects that include org query for superadmins
function makeOrgLink(path: string) {
  try {
    const q =
      route && route.query
        ? route.query.org || route.query.org_id
          ? { org: String(route.query.org || route.query.org_id) }
          : {}
        : {}
    if (auth.user?.role_id === 0 && q && Object.keys(q).length) {
      return { path, query: q }
    }
    return { path }
  } catch (e) {
    return { path }
  }
}

// Handle upgrade button click in subscription modal
async function handleUpgradeClick() {
  subscriptionCheck.closeModal()
  subscriptionCheck.redirectToPlans()
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'admin-dashboard': 'Dashboard',
    'admin-users': 'Users',
    'admin-artefacts': 'Artifacts',
    'admin-analytics': 'Analytics',
    'admin-integrations': 'Integrations Overview',
    'admin-integrations-teams': 'Teams Integration',
    'admin-integrations-slack': 'Slack Integration',
    'admin-integrations-whatsapp': 'WhatsApp Integration',
    'admin-integrations-i-message': 'iMessage Integration',
    'admin-superadmin': 'Dashboard',
    'admin-plans': 'Plans',
  }
  return titles[route.name as string] || 'Admin'
})
</script>

<style scoped>
.engraved-org {
  color: #d1d5db; /* light gray */
  font-weight: 600;
  letter-spacing: 0.2px;
  /* engraved effect: subtle highlight and deep shadow */
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.03),
    0 -1px 0 rgba(0, 0, 0, 0.6);
  opacity: 0.95;
}

.org-role-tag {
  display: inline-block;
  background: #10b981; /* green-500 */
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 1;
  margin-top: 4px;
  font-weight: 600;
}

.plan-active {
  background: #10b981; /* green-500 */
  border-color: rgba(16, 185, 129, 0.25);
}

.plan-expired {
  background: #ef4444; /* red-500 */
  border-color: rgba(239, 68, 68, 0.35);
}

/* Breadcrumb styles */
.breadcrumb-container {
  padding: 6px 8px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.breadcrumb-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  min-width: 0;
}

.breadcrumb-back:hover {
  color: white;
  background: rgba(255, 255, 255, 0.02);
}

.breadcrumb-title {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin-left: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

@media (max-width: 768px) {
  .breadcrumb-title {
    font-size: 14px;
    max-width: 120px;
  }

  .breadcrumb-back {
    padding: 4px 6px;
    font-size: 11px;
  }
}

/* Small spacing for breadcrumb items */
.breadcrumb-container ol > li {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

/* Mobile workspace info styling */
@media (max-width: 768px) {
  .engraved-org {
    font-size: 0.95rem;
  }
}
</style>
