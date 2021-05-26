<template>
  <div>
    <canvas ref="canvas" width="400" height="400"></canvas>
  </div>
</template>

<script>
// This example demonstrates how to use the rive-js version that
// doesn't have wasm bundled code. To use the bundled version,
// replace the first two lines of code below with:
// ` import { Rive, Layout } from 'rive-js' `

import { RuntimeLoader, Rive, Layout } from 'rive-js/dist/rive.lean.dev'
RuntimeLoader.setWasmUrl('https://unpkg.com/rive-js/dist/rive.wasm')

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