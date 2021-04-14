<template>
  <div id="app">
    <Rive 
      src="https://cdn.rive.app/animations/mech_v7.riv"
      fit="cover"
      alignment="center"
    />
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Rive from './components/Rive.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    Rive
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
