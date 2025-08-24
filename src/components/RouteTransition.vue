<template>
  <div class="route-transition" ref="rootEl">
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { gsap } from '@/plugins/gsap';

const rootEl = ref(null);
let ctx;
const route = useRoute();

const runIn = () => {
  if (!rootEl.value) return;
  gsap.fromTo(rootEl.value, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' });
};

onMounted(() => {
  nextTick(runIn);
  ctx = gsap.context(() => {}, rootEl);
});

watch(() => route.fullPath, async () => {
  await nextTick();
  runIn();
});

onBeforeUnmount(() => { if (ctx) ctx.revert(); });
</script>

<style scoped>
.route-transition {
  will-change: transform, opacity;
}
</style>


