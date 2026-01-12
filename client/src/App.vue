<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Enterprise Data Grid
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="flex column">
        <Dashboard />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import Dashboard from './pages/Dashboard.vue'
</script>

<style lang="sass">
.q-page
  min-height: 100vh
</style>