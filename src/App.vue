<template>
  <main class="app-shell">
    <HeroSection />
    <TextCostCalculator />
    <ImageCostCalculator />
    <PricingSourceTable />
    <FooterNote />
  </main>
</template>

<script setup>
import HeroSection from './components/HeroSection.vue'
import TextCostCalculator from './components/TextCostCalculator.vue'
import ImageCostCalculator from './components/ImageCostCalculator.vue'
import PricingSourceTable from './components/PricingSourceTable.vue'
import FooterNote from './components/FooterNote.vue'
</script>
