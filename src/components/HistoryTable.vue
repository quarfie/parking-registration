<script setup>
const { items } = defineProps({
  items: { type: Array, default: () => [] },
})
const emit = defineEmits(['repeat'])

function historyDateTime(row) {
  // prefer StartDate, fallback to ApplyTime
  const s = row.StartDate || row.ApplyTime || ''
  return s.replace(' ', '\u00A0') // non-breaking space between date/time
}
</script>

<template>
  <div class="bg-white shadow rounded-lg overflow-x-auto">
    <table class="w-full text-left">
      <thead class="text-gray-700 border-b">
        <tr class="text-sm">
          <th class="py-2 px-2">Plate</th>
          <th class="py-2 px-2">Make / Model</th>
          <th class="py-2 px-2">Start</th>
          <th class="py-2 px-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="idx" class="border-b last:border-none text-sm">
          <td class="py-2 px-2 uppercase">{{ item.PlateNo }}</td>
          <td class="py-2 px-2">
            <div class="leading-tight">
              <div>{{ item.Make }}</div>
              <div v-if="item.Model" class="text-xs text-gray-600">{{ item.Model }}</div>
            </div>
          </td>
          <td class="py-2 px-2">{{ historyDateTime(item) }}</td>
          <td class="py-2 px-2">
            <button
              @click="emit('repeat', item)"
              class="text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span class="material-icons">repeat</span>
              Repeat
            </button>
          </td>
        </tr>

        <tr v-if="!items?.length">
          <td colspan="4" class="text-center text-gray-400 text-sm py-6">No registrations yet.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
