<template>
  <q-layout view="lHh Lpr lFf">
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

    <q-page-container>
      <q-page class="flex column">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// App.vue now includes navigation and router outlet
</script>

<style lang="sass">
.q-page
  min-height: 100vh
</style>
