<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
</script>

<template>
  <div class="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
    <AppSidebar />
    
    <div class="flex flex-col flex-1 min-w-0">
      <AppHeader />
      
      <main class="flex-1 overflow-hidden relative flex flex-col">
        
        <div class="w-full h-full">
          <RouterView v-slot="{ Component }">
            <Transition 
              name="page" 
              mode="out-in"
              enter-active-class="animate-enter"
              leave-active-class="animate-leave"
            >
              <component :is="Component" />
            </Transition>
          </RouterView>
        </div>

      </main>
    </div>
  </div>
</template>