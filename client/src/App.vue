<template>
  <q-layout view="lHh Lpr lFf" class="layout-root">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Enterprise Data Grid - API-Based System
        </q-toolbar-title>
        
        <q-space />
        
        <!-- Navigation buttons -->
        <q-btn
          flat
          icon="group"
          label="Users"
          @click="$router.push('/grid/users')"
          :class="$route.path.includes('/users') ? 'bg-white text-primary' : ''"
        />
        <q-btn
          flat
          icon="inventory_2"
          label="Products"
          @click="$router.push('/grid/products')"
          :class="$route.path.includes('/products') ? 'bg-white text-primary' : ''"
        />
      </q-toolbar>
    </q-header>

    <q-page-container class="page-container-fill">
      <q-page class="page-fill">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// App.vue now includes navigation and router outlet
</script>

<style lang="sass">
html, body
  height: 100%
  overflow: hidden

.layout-root
  height: 100vh
  overflow: hidden

.page-container-fill
  display: flex
  flex-direction: column
  height: 100%

.q-page
  min-height: unset !important
  flex: 1
  display: flex
  flex-direction: column
  overflow: hidden

.page-fill
  flex: 1
  overflow: hidden
</style>
