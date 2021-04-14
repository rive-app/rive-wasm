<template>
  <div>
    <canvas ref="canvas" width="400" height="400"></canvas>
  </div>
</template>

<script>
import { Rive, Layout } from 'rive-js'

export default {
  name: 'Rive',
  props: {
    src: String,
    fit: String,
    alignment: String
  },
  mounted() {
    new Rive({
        canvas: this.$refs.canvas,
        src: this.$props.src,
        layout: new Layout({
            fit: this.$props.fit,
            alignment: this.$props.alignment,
        }),
        autoplay: true
    })
  }
}
</script>