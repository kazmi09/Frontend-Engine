<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Enterprise Data Grid - Generic System Demo
        </q-toolbar-title>
        
        <q-space />
        
        <!-- Navigation buttons -->
        <q-btn
          flat
          icon="people"
          label="Employees"
          @click="$router.push('/')"
          :class="$route.path === '/' ? 'bg-white text-primary' : ''"
        />
        <q-btn
          flat
          icon="group"
          label="Users"
          @click="$router.push('/users')"
          :class="$route.path === '/users' ? 'bg-white text-primary' : ''"
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