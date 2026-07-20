<template>
  <div
    class="rounded-circle d-flex align-items-center justify-content-center bg-secondary text-white fw-bold"
    :style="{ width: size + 'px', height: size + 'px', fontSize: (size * 0.4) + 'px' }"
  >
    <img
      v-if="src"
      :src="src"
      class="rounded-circle w-100 h-100 object-fit-cover"
      :style="{ objectFit: 'cover' }"
    >
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: Number, default: 40 }
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>
