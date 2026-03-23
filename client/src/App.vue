<template>
  <q-layout view="lHh Lpr lFf" class="layout-root">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Enterprise Data Grid - API-Based System
        </q-toolbar-title>
        
        <q-space />
        
        <!-- Dynamic Navigation buttons -->
        <q-btn
          v-for="grid in gridConfigs"
          :key="grid.id"
          flat
          :icon="grid.icon || 'grid_on'"
          :label="grid.name"
          @click="$router.push(`/grid/${grid.id}`)"
          :class="$route.path.includes(`/${grid.id}`) ? 'tw:bg-white tw:text-primary' : ''"
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
import { getAllGridConfigs } from '@shared/grid-config'

const gridConfigs = getAllGridConfigs()
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
